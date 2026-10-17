// Le moteur audio partagé (#46). C'est de la mutualisation technique, pas une boucle de jeu (§ 12,
// docs/architecture.md § 1) : chaque strate a ses propres sons ; le moteur les prépare, les joue, les
// mixe et les libère, sans connaître aucune règle de jeu.
// - Le son s'ouvre au premier geste du joueur, car aucun navigateur n'en joue avant. Il se tait
//   quand l'onglet est caché.
// - Le volume global et le son coupé se gardent d'une session à l'autre.
// - Chaque strate a sa banque, ouverte au montage de sa vue et libérée au démontage. Le noyau a la
//   sienne, pour le sol (noyau/ui/sons.ts).
import type {
  ReglageAmbiance,
  ReglageEffet,
  ReglageNote,
  ReglageVoix,
  SonCalcule,
  SonStrate,
  SourceSon,
  Timbre,
} from "../logique/types";

/** Où se gardent le volume global et le son coupé. */
export const CLE_PREFERENCES_SON = "strates.son";
/** Le volume global d'une première partie, de 0 à 1. */
export const VOLUME_DEFAUT = 0.7;
/** Les effets et les notes qui sonnent à la fois dans une banque : au-delà, le suivant est perdu. */
export const POLYPHONIE = 32;

/** Les gestes que les navigateurs comptent comme une activation : le premier ouvre le son. */
const GESTES = ["pointerdown", "pointerup", "keydown", "touchend", "click"] as const;

/** Les durées par défaut, en secondes. */
const FONDU_AMBIANCE = 1;
const GLISSEMENT = 0.05;
const ATTAQUE = 0.01;
/** En deçà, une voix qui naît ou s'éteint claque. */
const SANS_CLIC = 0.02;
/** Les dernières millisecondes d'une note descendent droit à zéro. */
const QUEUE = 0.03;
/** Le fondu d'un effet coupé avant sa fin. */
const COUPE = 0.05;
/** Le fondu d'une banque libérée, avant que tout s'arrête. */
const LIBERATION = 0.15;

/** Un formant : sa fréquence et sa largeur de bande, en hertz, et son gain, en décibels. */
type Formant = readonly [frequence: number, largeur: number, gain: number];
type Voyelle = Exclude<Timbre, "sinus" | "triangle">;

/**
 * Les voyelles : trois formants sur une onde en dents de scie (table « ténor » de Csound, largeurs
 * doublées pour adoucir les résonances), une part de l'onde brute, pour que toutes les harmoniques
 * restent et puissent battre, et un gain qui ramène chaque voyelle au même volume moyen : −12 dB
 * efficaces à volume 1, entre 80 et 460 Hz.
 */
const VOYELLES: Readonly<Record<Voyelle, { formants: readonly Formant[]; gain: number }>> = {
  a: {
    formants: [
      [650, 160, 0],
      [1080, 180, -6],
      [2650, 240, -7],
    ],
    gain: 0.95,
  },
  e: {
    formants: [
      [400, 140, 0],
      [1700, 160, -14],
      [2600, 200, -12],
    ],
    gain: 0.8,
  },
  i: {
    formants: [
      [290, 80, 0],
      [1870, 180, -15],
      [2800, 200, -18],
    ],
    gain: 0.9,
  },
  o: {
    formants: [
      [400, 80, 0],
      [800, 160, -10],
      [2600, 200, -12],
    ],
    gain: 1,
  },
  ou: {
    formants: [
      [350, 80, 0],
      [600, 120, -20],
      [2700, 200, -17],
    ],
    gain: 1,
  },
};
const BRUT = 0.25;
/** Les ondes simples, au même volume moyen que les voyelles. */
const ONDES: Readonly<Record<"sinus" | "triangle", { type: OscillatorType; gain: number }>> = {
  sinus: { type: "sine", gain: 0.35 },
  triangle: { type: "triangle", gain: 0.43 },
};

const borner = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));
/** `x` s'il est un nombre fini, sinon `defaut`. */
const fini = (x: number | undefined, defaut: number) =>
  x !== undefined && Number.isFinite(x) ? x : defaut;
/** La constante de temps qui atteint la cible à 95 % au bout de `duree` secondes. */
const constante = (duree: number) => Math.max(duree, 0.003) / 3;

/** Une voix muette, pour une vue montée sans moteur (les tests, une remontée sans son). */
export const SILENCE: SonStrate = { jouer() {}, ambiance() {}, voix() {}, note() {} };

// ——— Les préférences

export interface PreferencesSon {
  /** De 0 à 1. */
  volume: number;
  muet: boolean;
}

/** Ce que le moteur demande au stockage du navigateur. */
export interface ZonePreferences {
  getItem(cle: string): string | null;
  setItem(cle: string, valeur: string): void;
}

/** Le volume et le son coupé gardés ; illisibles ou absents, les valeurs par défaut. */
export function lirePreferencesSon(zone: ZonePreferences | null): PreferencesSon {
  try {
    const brut = zone?.getItem(CLE_PREFERENCES_SON);
    const lu: unknown = brut ? JSON.parse(brut) : null;
    if (lu && typeof lu === "object") {
      const { volume, muet } = lu as Record<string, unknown>;
      return {
        volume:
          typeof volume === "number" && Number.isFinite(volume)
            ? borner(volume, 0, 1)
            : VOLUME_DEFAUT,
        muet: muet === true,
      };
    }
  } catch {
    // Stockage refusé ou contenu illisible : les valeurs par défaut.
  }
  return { volume: VOLUME_DEFAUT, muet: false };
}

// ——— Les échantillons

/**
 * Fond la fin de chaque canal dans son début, sur `n` échantillons (un fondu enchaîné à puissance
 * constante), et rend la longueur à garder : le dernier échantillon gardé enchaîne sur le premier,
 * et la boucle n'a plus de couture.
 */
export function raccorder(canaux: Float32Array[], n: number): number {
  const longueur = canaux[0]?.length ?? 0;
  const r = Math.min(Math.floor(n), Math.floor(longueur / 2));
  if (r <= 0) return longueur;
  const garde = longueur - r;
  for (const canal of canaux) {
    for (let i = 0; i < r; i++) {
      const angle = (Math.PI / 2) * (i / r);
      canal[i] = canal[i]! * Math.sin(angle) + canal[garde + i]! * Math.cos(angle);
    }
  }
  return garde;
}

/** Ramène chaque échantillon entre −1 et 1 ; un échantillon qui n'est pas un nombre devient 0. */
function assainir(canal: Float32Array): Float32Array {
  for (let i = 0; i < canal.length; i++) {
    const x = canal[i]!;
    canal[i] = Number.isNaN(x) ? 0 : borner(x, -1, 1);
  }
  return canal;
}

// ——— Le moteur

/** Ce que le moteur demande au navigateur ; les tests en donnent un simulé. */
export interface EnvironnementAudio {
  /** Crée le contexte Web Audio ; null sans Web Audio, et le moteur reste muet. */
  creerContexte(): AudioContext | null;
  /** Où écouter les gestes du joueur. */
  gestes: EventTarget;
  /** Où écouter `visibilitychange`, et si l'onglet est caché. */
  visibilite: { cible: EventTarget; cache(): boolean };
  /** Où garder le volume. */
  zone: ZonePreferences | null;
  /** Télécharge un fichier de son. */
  telecharger(adresse: string): Promise<ArrayBuffer>;
  /** Appelle `action` dans `ms` millisecondes. */
  differer(action: () => void, ms: number): void;
}

export function environnementNavigateur(): EnvironnementAudio {
  const Contexte =
    globalThis.AudioContext ??
    (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  let zone: ZonePreferences | null = null;
  try {
    zone = window.localStorage;
  } catch {
    // Stockage refusé : le volume ne se gardera pas.
  }
  return {
    creerContexte: () => (Contexte ? new Contexte({ latencyHint: "interactive" }) : null),
    gestes: window,
    visibilite: { cible: document, cache: () => document.visibilityState === "hidden" },
    zone,
    async telecharger(adresse) {
      const reponse = await fetch(adresse);
      if (!reponse.ok) throw new Error(`${adresse} : ${reponse.status}`);
      return reponse.arrayBuffer();
    },
    differer: (action, ms) => void setTimeout(action, ms),
  };
}

export class MoteurAudio {
  readonly #env: EnvironnementAudio;
  #contexte: AudioContext | null = null;
  /** Le volume global : tout ce qui sonne y passe, puis par le limiteur. */
  #maitre: GainNode | null = null;
  /** Pas de Web Audio, ou moteur arrêté : plus rien ne s'ouvre. */
  #ferme = false;
  readonly #banques = new Set<BanqueSons>();
  #volume: number;
  #muet: boolean;
  readonly #arrets: (() => void)[] = [];

  constructor(env: EnvironnementAudio = environnementNavigateur()) {
    this.#env = env;
    ({ volume: this.#volume, muet: this.#muet } = lirePreferencesSon(env.zone));
    // Chaque geste rouvre le son s'il le faut : iOS l'interrompt pendant un appel.
    const surGeste = () => this.#ouvrir();
    const surVisibilite = () => this.#suivreVisibilite();
    for (const type of GESTES) env.gestes.addEventListener(type, surGeste, true);
    env.visibilite.cible.addEventListener("visibilitychange", surVisibilite);
    this.#arrets.push(() => {
      for (const type of GESTES) env.gestes.removeEventListener(type, surGeste, true);
      env.visibilite.cible.removeEventListener("visibilitychange", surVisibilite);
    });
  }

  /** Un geste a ouvert le son. */
  get ouvert(): boolean {
    return this.#contexte !== null;
  }

  /** Le volume global, de 0 à 1. Il se garde d'une session à l'autre. */
  get volume(): number {
    return this.#volume;
  }
  set volume(volume: number) {
    if (!Number.isFinite(volume)) return;
    this.#volume = borner(volume, 0, 1);
    this.#appliquerVolume();
  }

  /** Le son coupé, sans perdre le volume. Il se garde d'une session à l'autre. */
  get muet(): boolean {
    return this.#muet;
  }
  set muet(muet: boolean) {
    this.#muet = muet;
    this.#appliquerVolume();
  }

  /**
   * Ouvre une banque : celle d'une strate, au montage de sa vue, ou celle du noyau. Ses fichiers se
   * téléchargent tout de suite ; le reste se prépare quand le son s'ouvre. `etouffee` : elle commence
   * muette, comme la strate qui arrive pendant la descente.
   */
  banque(sons: Readonly<Record<string, SourceSon>>, etouffee = false): BanqueSons {
    const banque = new BanqueSons(sons, etouffee, {
      telecharger: (adresse) => this.#env.telecharger(adresse),
      differer: (action, ms) => this.#env.differer(action, ms),
      oublier: (b) => this.#banques.delete(b),
    });
    this.#banques.add(banque);
    if (this.#contexte && this.#maitre) banque.brancher(this.#contexte, this.#maitre);
    return banque;
  }

  /** Arrête le moteur : plus d'écoute, plus de son. */
  arreter(): void {
    for (const arret of this.#arrets.splice(0)) arret();
    for (const banque of [...this.#banques]) banque.liberer();
    this.#contexte?.close().catch(() => {});
    this.#contexte = null;
    this.#maitre = null;
    this.#ferme = true;
  }

  /** Un geste : le son s'ouvre, ou reprend s'il était suspendu. */
  #ouvrir(): void {
    if (this.#ferme) return;
    const contexte = this.#contexte ?? this.#creer();
    if (!contexte) {
      this.#ferme = true;
      return;
    }
    if (contexte.state !== "running" && !this.#env.visibilite.cache()) {
      contexte.resume().catch(() => {});
    }
  }

  /** Crée le contexte et la chaîne de sortie ; null si le navigateur n'y arrive pas. */
  #creer(): AudioContext | null {
    let contexte: AudioContext | null = null;
    let maitre: GainNode;
    try {
      contexte = this.#env.creerContexte();
      if (!contexte) return null;
      maitre = contexte.createGain();
      maitre.gain.value = this.#gain();
      // Un limiteur, en filet : huit voix tenues ensemble ne saturent pas.
      const limiteur = contexte.createDynamicsCompressor();
      limiteur.threshold.value = -2;
      limiteur.knee.value = 2;
      limiteur.ratio.value = 12;
      limiteur.attack.value = 0.003;
      limiteur.release.value = 0.25;
      maitre.connect(limiteur).connect(contexte.destination);
      // iOS n'ouvre le son qu'après un son joué pendant le geste : un échantillon de silence suffit.
      const silence = contexte.createBufferSource();
      silence.buffer = contexte.createBuffer(1, 1, contexte.sampleRate);
      silence.connect(contexte.destination);
      silence.onended = () => silence.disconnect();
      silence.start();
    } catch {
      contexte?.close().catch(() => {});
      return null;
    }

    this.#contexte = contexte;
    this.#maitre = maitre;
    for (const banque of this.#banques) banque.brancher(contexte, maitre);
    return contexte;
  }

  #suivreVisibilite(): void {
    const contexte = this.#contexte;
    if (!contexte || contexte.state === "closed") return;
    if (this.#env.visibilite.cache()) contexte.suspend().catch(() => {});
    else contexte.resume().catch(() => {});
  }

  /** Le gain du volume : son carré, pour qu'un réglage à mi-course s'entende à peu près à moitié. */
  #gain(): number {
    return this.#muet ? 0 : this.#volume ** 2;
  }

  #appliquerVolume(): void {
    if (this.#contexte && this.#maitre) {
      this.#maitre.gain.setTargetAtTime(this.#gain(), this.#contexte.currentTime, 0.03);
    }
    try {
      this.#env.zone?.setItem(
        CLE_PREFERENCES_SON,
        JSON.stringify({ volume: this.#volume, muet: this.#muet }),
      );
    } catch {
      // Stockage refusé : le réglage vaut pour cette session.
    }
  }
}

// ——— Les banques

/** Ce que la banque demande au moteur. */
interface LiensBanque {
  telecharger(adresse: string): Promise<ArrayBuffer>;
  differer(action: () => void, ms: number): void;
  /** La banque est libérée : le moteur l'oublie. */
  oublier(banque: BanqueSons): void;
}

/** Ce qui sonne : ses sources, à arrêter ensemble, et ses nœuds, à débrancher à la fin. */
interface Lecture {
  sources: AudioScheduledSourceNode[];
  noeuds: AudioNode[];
  /** Un effet ou une note : elle compte dans la polyphonie. */
  ponctuelle: boolean;
}

/** Une ambiance qui boucle, et le volume vers lequel elle va. */
interface Boucle extends Lecture {
  gain: GainNode;
  cible: number;
  eteinte: boolean;
}

/** Une voix tenue. */
interface VoixTenue extends Lecture {
  oscillateur: OscillatorNode;
  volume: GainNode;
  /** Son gain de base ; la houle s'y ajoute. */
  respiration: GainNode;
  /** L'amplitude de la houle. */
  amplitude: GainNode;
  panoramique: StereoPannerNode | null;
  eteinte: boolean;
}

/**
 * La banque d'une strate, ou du noyau : ses sons, et ce qu'elle fait entendre. C'est le `son` que
 * reçoit la vue (`SonStrate`). Le moteur l'ouvre et la branche ; le noyau l'étouffe pendant la
 * fouille et la libère au démontage.
 */
export class BanqueSons implements SonStrate {
  readonly #sources: Readonly<Record<string, SourceSon>>;
  readonly #liens: LiensBanque;
  #contexte: AudioContext | null = null;
  #sortie: GainNode | null = null;
  #etouffee: boolean;
  #liberee = false;
  readonly #tampons = new Map<string, AudioBuffer>();
  readonly #fichiers = new Map<string, Promise<ArrayBuffer>>();
  readonly #ambiances = new Map<string, Required<ReglageAmbiance>>();
  readonly #boucles = new Map<string, Boucle>();
  readonly #reglagesVoix = new Map<string, ReglageVoix>();
  readonly #voix = new Map<string, VoixTenue>();
  readonly #enCours = new Set<Lecture>();
  #ponctuelles = 0;
  readonly #inconnus = new Set<string>();
  #erreurSignalee = false;

  constructor(sources: Readonly<Record<string, SourceSon>>, etouffee: boolean, liens: LiensBanque) {
    this.#sources = sources;
    this.#etouffee = etouffee;
    this.#liens = liens;
    for (const [nom, source] of Object.entries(sources)) {
      if (!("fichier" in source)) continue;
      const octets = liens.telecharger(source.fichier);
      // Un téléchargement raté se signale au décodage ; jusque-là, il ne doit pas remonter.
      octets.catch(() => {});
      this.#fichiers.set(nom, octets);
    }
  }

  /** Le son s'ouvre : la banque prépare ses sons, et fait entendre ce qui est déjà réglé. */
  brancher(contexte: AudioContext, destination: AudioNode): void {
    this.#prudemment(() => this.#brancher(contexte, destination));
  }

  jouer(nom: string, reglage: ReglageEffet = {}): void {
    this.#prudemment(() => this.#jouer(nom, reglage));
  }

  ambiance(nom: string, reglage: ReglageAmbiance): void {
    if (this.#liberee) return;
    this.#ambiances.set(nom, {
      volume: borner(fini(reglage.volume, 0), 0, 1),
      fondu: Math.max(0, fini(reglage.fondu, FONDU_AMBIANCE)),
    });
    this.#prudemment(() => this.#reglerAmbiance(nom));
  }

  voix(id: string, reglage: ReglageVoix): void {
    if (this.#liberee) return;
    this.#reglagesVoix.set(id, { ...reglage });
    this.#prudemment(() => this.#reglerVoix(id));
  }

  note(reglage: ReglageNote): void {
    this.#prudemment(() => this.#note(reglage));
  }

  /** La strate se fige (la fouille est ouverte) : sa banque se tait en fondu, puis revient. */
  etouffer(etouffee: boolean): void {
    if (this.#liberee || etouffee === this.#etouffee) return;
    this.#etouffee = etouffee;
    const contexte = this.#contexte;
    const sortie = this.#sortie;
    if (!contexte || !sortie) return;
    this.#prudemment(() =>
      sortie.gain.setTargetAtTime(
        etouffee ? 0 : 1,
        contexte.currentTime,
        constante(etouffee ? 0.25 : 1),
      ),
    );
  }

  /** Le démontage : tout se tait en un bref fondu, puis s'arrête. La banque ne répond plus. */
  liberer(): void {
    if (this.#liberee) return;
    this.#liberee = true;
    this.#liens.oublier(this);
    this.#prudemment(() => this.#arreterTout());
    this.#tampons.clear();
    this.#fichiers.clear();
    this.#ambiances.clear();
    this.#boucles.clear();
    this.#reglagesVoix.clear();
    this.#voix.clear();
  }

  /** Un son raté ne casse jamais le jeu : l'erreur est signalée dans la console, une fois. */
  #prudemment(action: () => void): void {
    try {
      action();
    } catch (erreur) {
      if (!this.#erreurSignalee) console.warn("Son :", erreur);
      this.#erreurSignalee = true;
    }
  }

  #brancher(contexte: AudioContext, destination: AudioNode): void {
    if (this.#liberee || this.#contexte) return;
    const sortie = contexte.createGain();
    sortie.gain.value = this.#etouffee ? 0 : 1;
    sortie.connect(destination);
    this.#contexte = contexte;
    this.#sortie = sortie;
    for (const [nom, source] of Object.entries(this.#sources)) {
      if ("fichier" in source) this.#decoder(nom, contexte);
      else this.#calculer(nom, source, contexte);
    }
    for (const nom of [...this.#ambiances.keys()]) this.#reglerAmbiance(nom);
    for (const id of [...this.#reglagesVoix.keys()]) this.#reglerVoix(id);
  }

  #jouer(nom: string, reglage: ReglageEffet): void {
    const pret = this.#pret();
    const tampon = pret && this.#tampon(nom);
    if (!pret || !tampon || this.#ponctuelles >= POLYPHONIE) return;
    const { contexte } = pret;
    const source = contexte.createBufferSource();
    source.buffer = tampon;
    source.playbackRate.value = borner(fini(reglage.vitesse, 1), 1 / 16, 16);
    const gain = contexte.createGain();
    gain.gain.value = borner(fini(reglage.volume, 1), 0, 1);
    source.connect(gain);
    const noeuds: AudioNode[] = [source, gain];
    this.#brancherFin(gain, reglage.panoramique, noeuds);
    const debut = contexte.currentTime + Math.max(0, fini(reglage.dans, 0));
    source.start(debut);
    if (reglage.duree !== undefined && Number.isFinite(reglage.duree)) {
      const coupe = debut + Math.max(0, reglage.duree);
      gain.gain.setTargetAtTime(0, coupe, constante(COUPE));
      source.stop(coupe + 2 * COUPE);
    }
    this.#suivre({ sources: [source], noeuds, ponctuelle: true });
  }

  #note(reglage: ReglageNote): void {
    const pret = this.#pret();
    const duree = fini(reglage.duree, 0);
    if (!pret || duree <= 0 || this.#ponctuelles >= POLYPHONIE) return;
    const { contexte } = pret;
    const frequences = (reglage.rapports ?? [1])
      .map((rapport) => reglage.frequence * rapport)
      .filter((f) => audible(f, contexte));
    if (frequences.length === 0) return;

    const volume = borner(fini(reglage.volume, 1), 0, 1);
    const attaque = borner(fini(reglage.attaque, ATTAQUE), 0.002, duree / 2);
    const debut = contexte.currentTime + Math.max(0, fini(reglage.dans, 0));
    const fin = debut + duree;
    // L'enveloppe : elle monte en `attaque`, décline, et finit droit à zéro, sans clic.
    const enveloppe = contexte.createGain();
    const g = enveloppe.gain;
    const declin = duree - attaque;
    const queue = Math.min(QUEUE, declin / 2);
    const tau = declin / 5;
    g.setValueAtTime(0, debut);
    g.linearRampToValueAtTime(volume, debut + attaque);
    g.setTargetAtTime(0, debut + attaque, tau);
    g.setValueAtTime(volume * Math.exp(-(declin - queue) / tau), fin - queue);
    g.linearRampToValueAtTime(0, fin);

    const noeuds: AudioNode[] = [enveloppe];
    const sources: OscillatorNode[] = [];
    for (const frequence of frequences) {
      const voix = creerTimbre(contexte, reglage.timbre, frequence);
      voix.sortie.connect(enveloppe);
      noeuds.push(...voix.noeuds);
      sources.push(voix.oscillateur);
    }
    this.#brancherFin(enveloppe, reglage.panoramique, noeuds);
    for (const source of sources) {
      source.start(debut);
      source.stop(fin);
    }
    this.#suivre({ sources, noeuds, ponctuelle: true });
  }

  /** Tout se tait en un bref fondu, puis s'arrête et se débranche. */
  #arreterTout(): void {
    const contexte = this.#contexte;
    const sortie = this.#sortie;
    if (!contexte || !sortie) return;
    const fin = contexte.currentTime + LIBERATION;
    sortie.gain.setTargetAtTime(0, contexte.currentTime, constante(LIBERATION));
    for (const lecture of this.#enCours) for (const source of lecture.sources) arreter(source, fin);
    this.#liens.differer(() => sortie.disconnect(), LIBERATION * 1000 + 100);
  }

  /** Le contexte et la sortie, si la banque peut sonner. */
  #pret(): { contexte: AudioContext; sortie: GainNode } | null {
    if (this.#liberee || !this.#contexte || !this.#sortie) return null;
    return { contexte: this.#contexte, sortie: this.#sortie };
  }

  /** Le tampon d'un son : null s'il n'est pas encore prêt, ou s'il n'est pas dans la banque. */
  #tampon(nom: string): AudioBuffer | null {
    const tampon = this.#tampons.get(nom);
    if (tampon) return tampon;
    if (!Object.hasOwn(this.#sources, nom) && !this.#inconnus.has(nom)) {
      this.#inconnus.add(nom);
      console.warn(`Son inconnu : « ${nom} ».`);
    }
    return null;
  }

  #calculer(nom: string, source: SonCalcule, contexte: AudioContext): void {
    try {
      const frequence = contexte.sampleRate;
      const longueur = Math.max(1, Math.round(fini(source.duree, 0) * frequence));
      const canaux = [...Array(source.stereo ? 2 : 1)].map(() => new Float32Array(longueur));
      source.calculer(canaux, frequence);
      const garde = source.raccord
        ? raccorder(canaux, Math.round(source.raccord * frequence))
        : longueur;
      const tampon = contexte.createBuffer(canaux.length, garde, frequence);
      canaux.forEach((canal, i) =>
        tampon.getChannelData(i).set(assainir(canal.subarray(0, garde))),
      );
      this.#tampons.set(nom, tampon);
    } catch (erreur) {
      console.warn(`Son « ${nom} » : le calcul a échoué.`, erreur);
    }
  }

  #decoder(nom: string, contexte: AudioContext): void {
    this.#fichiers
      .get(nom)
      ?.then((octets) => contexte.decodeAudioData(octets))
      .then((tampon) => {
        if (this.#liberee) return;
        this.#tampons.set(nom, tampon);
        if (this.#ambiances.has(nom)) this.#reglerAmbiance(nom);
      })
      .catch((erreur: unknown) => console.warn(`Son « ${nom} » : fichier illisible.`, erreur));
  }

  /** Mène l'ambiance `nom` vers son réglage, si le son est ouvert et son tampon prêt. */
  #reglerAmbiance(nom: string): void {
    const pret = this.#pret();
    const reglage = this.#ambiances.get(nom);
    if (!pret || !reglage) return;
    const { contexte } = pret;
    const { volume, fondu } = reglage;
    const maintenant = contexte.currentTime;
    const boucle = this.#boucles.get(nom);
    const vivante = boucle && !boucle.eteinte ? boucle : null;

    if (volume === 0) {
      this.#ambiances.delete(nom);
      if (!vivante) return;
      vivante.eteinte = true;
      vivante.gain.gain.setTargetAtTime(0, maintenant, constante(fondu));
      arreter(vivante.sources[0]!, maintenant + 2 * Math.max(fondu, SANS_CLIC));
      return;
    }
    if (vivante) {
      if (vivante.cible !== volume) {
        vivante.gain.gain.setTargetAtTime(volume, maintenant, constante(fondu));
        vivante.cible = volume;
      }
      return;
    }
    // Elle part, ou repart pendant son propre fondu : la nouvelle boucle croise l'ancienne.
    const tampon = this.#tampon(nom);
    if (!tampon) return;
    const source = contexte.createBufferSource();
    source.buffer = tampon;
    source.loop = true;
    const gain = contexte.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(volume, maintenant, constante(Math.max(fondu, SANS_CLIC)));
    source.connect(gain).connect(pret.sortie);
    source.start(maintenant);
    const nouvelle: Boucle = {
      sources: [source],
      noeuds: [source, gain],
      ponctuelle: false,
      gain,
      cible: volume,
      eteinte: false,
    };
    this.#boucles.set(nom, nouvelle);
    this.#suivre(nouvelle, () => {
      if (this.#boucles.get(nom) === nouvelle) this.#boucles.delete(nom);
    });
  }

  /** Mène la voix `id` vers son réglage : elle naît, glisse ou s'éteint. */
  #reglerVoix(id: string): void {
    const pret = this.#pret();
    const reglage = this.#reglagesVoix.get(id);
    if (!pret || !reglage) return;
    const { contexte } = pret;
    const maintenant = contexte.currentTime;
    const volume = borner(fini(reglage.volume, 0), 0, 1);
    const glissement = Math.max(0, fini(reglage.glissement, GLISSEMENT));
    const souffle = borner(fini(reglage.souffle, 0), 0, 1);
    const panoramique = borner(fini(reglage.panoramique, 0), -1, 1);
    const voix = this.#voix.get(id);
    const vivante = voix && !voix.eteinte ? voix : null;

    if (volume === 0) {
      this.#reglagesVoix.delete(id);
      if (!vivante) return;
      const fondu = Math.max(glissement, SANS_CLIC);
      vivante.eteinte = true;
      vivante.volume.gain.setTargetAtTime(0, maintenant, constante(fondu));
      for (const source of vivante.sources) arreter(source, maintenant + 2 * fondu);
      return;
    }
    // Une hauteur qui n'est pas un son (nulle, ou au-delà de Nyquist) n'est pas une erreur de jeu :
    // la voix garde la sienne.
    const frequence = audible(reglage.frequence, contexte) ? reglage.frequence : null;
    const t = constante(glissement);
    if (vivante) {
      if (frequence !== null)
        vivante.oscillateur.frequency.setTargetAtTime(frequence, maintenant, t);
      vivante.volume.gain.setTargetAtTime(volume, maintenant, t);
      vivante.respiration.gain.setTargetAtTime(1 - souffle / 2, maintenant, t);
      vivante.amplitude.gain.setTargetAtTime(souffle / 2, maintenant, t);
      vivante.panoramique?.pan.setTargetAtTime(panoramique, maintenant, t);
      return;
    }
    if (frequence === null) return;

    const timbre = creerTimbre(contexte, reglage.timbre, frequence);
    const gainVolume = contexte.createGain();
    gainVolume.gain.value = 0;
    gainVolume.gain.setTargetAtTime(volume, maintenant, constante(Math.max(glissement, SANS_CLIC)));
    // La respiration : une houle lente, propre à chaque voix, qui fait varier le volume de ±souffle/2.
    const respiration = contexte.createGain();
    respiration.gain.value = 1 - souffle / 2;
    const houle = contexte.createOscillator();
    houle.frequency.value = 0.15 + 0.1 * empreinte(id);
    const amplitude = contexte.createGain();
    amplitude.gain.value = souffle / 2;
    houle.connect(amplitude).connect(respiration.gain);
    timbre.sortie.connect(gainVolume).connect(respiration);
    const noeuds = [...timbre.noeuds, gainVolume, respiration, houle, amplitude];
    const pan = creerPanoramique(contexte, panoramique);
    if (pan) {
      respiration.connect(pan).connect(pret.sortie);
      noeuds.push(pan);
    } else {
      respiration.connect(pret.sortie);
    }
    timbre.oscillateur.start(maintenant);
    houle.start(maintenant);
    const nouvelle: VoixTenue = {
      sources: [timbre.oscillateur, houle],
      noeuds,
      ponctuelle: false,
      oscillateur: timbre.oscillateur,
      volume: gainVolume,
      respiration,
      amplitude,
      panoramique: pan,
      eteinte: false,
    };
    this.#voix.set(id, nouvelle);
    this.#suivre(nouvelle, () => {
      if (this.#voix.get(id) === nouvelle) this.#voix.delete(id);
    });
  }

  /** Branche `noeud` sur la sortie de la banque, à travers un panoramique s'il en faut un. */
  #brancherFin(noeud: AudioNode, panoramique: number | undefined, noeuds: AudioNode[]): void {
    const sortie = this.#sortie!;
    const pan = creerPanoramique(this.#contexte!, borner(fini(panoramique, 0), -1, 1));
    if (pan) {
      noeud.connect(pan).connect(sortie);
      noeuds.push(pan);
    } else {
      noeud.connect(sortie);
    }
  }

  /** Suit une lecture jusqu'à sa fin : ses nœuds sont alors débranchés. */
  #suivre(lecture: Lecture, fin?: () => void): void {
    this.#enCours.add(lecture);
    if (lecture.ponctuelle) this.#ponctuelles++;
    lecture.sources[0]!.onended = () => {
      if (!this.#enCours.delete(lecture)) return;
      if (lecture.ponctuelle) this.#ponctuelles--;
      for (const noeud of lecture.noeuds) noeud.disconnect();
      fin?.();
    };
  }
}

/** Une fréquence qu'on peut jouer : positive, et sous la moitié de la fréquence d'échantillonnage. */
function audible(frequence: number, contexte: BaseAudioContext): boolean {
  return Number.isFinite(frequence) && frequence > 0 && frequence < contexte.sampleRate / 2;
}

/** Arrête une source à `quand` ; une source déjà arrêtée l'est pour de bon. */
function arreter(source: AudioScheduledSourceNode, quand: number): void {
  try {
    source.stop(quand);
  } catch {
    // Déjà arrêtée.
  }
}

/** Un panoramique, s'il en faut un et si le navigateur en a. */
function creerPanoramique(contexte: BaseAudioContext, pan: number): StereoPannerNode | null {
  if (pan === 0 || typeof contexte.createStereoPanner !== "function") return null;
  const noeud = contexte.createStereoPanner();
  noeud.pan.value = pan;
  return noeud;
}

/** Une onde au timbre voulu : l'oscillateur à démarrer, la sortie à brancher, les nœuds créés. */
function creerTimbre(
  contexte: BaseAudioContext,
  timbre: Timbre | undefined,
  frequence: number,
): { oscillateur: OscillatorNode; sortie: GainNode; noeuds: AudioNode[] } {
  const oscillateur = contexte.createOscillator();
  oscillateur.frequency.value = frequence;
  const sortie = contexte.createGain();
  const noeuds: AudioNode[] = [oscillateur, sortie];
  const voyelle = timbre && Object.hasOwn(VOYELLES, timbre) ? VOYELLES[timbre as Voyelle] : null;
  if (!voyelle) {
    const onde = timbre === "triangle" ? ONDES.triangle : ONDES.sinus;
    oscillateur.type = onde.type;
    sortie.gain.value = onde.gain;
    oscillateur.connect(sortie);
    return { oscillateur, sortie, noeuds };
  }
  oscillateur.type = "sawtooth";
  sortie.gain.value = voyelle.gain;
  const brut = contexte.createGain();
  brut.gain.value = BRUT;
  oscillateur.connect(brut).connect(sortie);
  noeuds.push(brut);
  for (const [f, largeur, decibels] of voyelle.formants) {
    const filtre = contexte.createBiquadFilter();
    filtre.type = "bandpass";
    filtre.frequency.value = f;
    filtre.Q.value = f / largeur;
    const gain = contexte.createGain();
    gain.gain.value = 10 ** (decibels / 20);
    oscillateur.connect(filtre).connect(gain).connect(sortie);
    noeuds.push(filtre, gain);
  }
  return { oscillateur, sortie, noeuds };
}

/** Un nombre de [0, 1) tiré d'un nom : la houle d'une voix a toujours le même rythme. */
function empreinte(texte: string): number {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) h = Math.imul(h ^ texte.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

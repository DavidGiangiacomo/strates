// Le moteur audio (#46), sur un contexte Web Audio simulé : il enregistre les nœuds, leurs liens et
// les automatismes de leurs paramètres. Le vrai rendu se vérifie dans un navigateur.
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SourceSon } from "../logique/types";
import {
  CLE_PREFERENCES_SON,
  lirePreferencesSon,
  MoteurAudio,
  POLYPHONIE,
  raccorder,
  VOLUME_DEFAUT,
  type EnvironnementAudio,
  type ZonePreferences,
} from "./audio";

// ——— Le contexte simulé

interface Evenement {
  type: "valeur" | "rampe" | "cible";
  valeur: number;
  temps: number;
  constante?: number;
}

class ParamSimule {
  readonly evenements: Evenement[] = [];
  readonly entrees: NoeudSimule[] = [];
  constructor(public value: number) {}
  setValueAtTime(valeur: number, temps: number) {
    this.evenements.push({ type: "valeur", valeur, temps });
    return this;
  }
  linearRampToValueAtTime(valeur: number, temps: number) {
    this.evenements.push({ type: "rampe", valeur, temps });
    return this;
  }
  setTargetAtTime(valeur: number, temps: number, constante: number) {
    this.evenements.push({ type: "cible", valeur, temps, constante });
    return this;
  }
  /** La dernière valeur visée, ou la valeur fixée s'il n'y a aucun automatisme. */
  get vise(): number {
    return this.evenements.at(-1)?.valeur ?? this.value;
  }
}

class NoeudSimule {
  sorties: (NoeudSimule | ParamSimule)[] = [];
  debranche = false;
  constructor(
    readonly contexte: ContexteSimule,
    readonly genre: string,
  ) {
    contexte.noeuds.push(this);
  }
  connect<T extends NoeudSimule | ParamSimule>(cible: T): T {
    this.sorties.push(cible);
    if (cible instanceof ParamSimule) cible.entrees.push(this);
    return cible;
  }
  disconnect() {
    this.sorties = [];
    this.debranche = true;
  }
}

class GainSimule extends NoeudSimule {
  gain = new ParamSimule(1);
}
class PanoramiqueSimule extends NoeudSimule {
  pan = new ParamSimule(0);
}
class FiltreSimule extends NoeudSimule {
  type = "lowpass";
  frequency = new ParamSimule(350);
  Q = new ParamSimule(1);
}
class LimiteurSimule extends NoeudSimule {
  threshold = new ParamSimule(-24);
  knee = new ParamSimule(30);
  ratio = new ParamSimule(12);
  attack = new ParamSimule(0.003);
  release = new ParamSimule(0.25);
}

class SourceSimulee extends NoeudSimule {
  debut: number | null = null;
  /** Où commence la lecture dans le tampon, en secondes. */
  decalage = 0;
  fin: number | null = null;
  termine = false;
  onended: (() => void) | null = null;
  start(quand = 0, decalage = 0) {
    if (this.debut !== null) throw new Error("déjà démarrée");
    this.debut = quand;
    this.decalage = decalage;
  }
  stop(quand = 0) {
    if (this.debut === null) throw new Error("pas démarrée");
    this.fin = quand;
  }
  /** Quand elle s'arrête d'elle-même : jamais, sauf un tampon joué une fois. */
  finNaturelle(): number | null {
    return null;
  }
}
class TamponSimule {
  readonly canaux: Float32Array[];
  constructor(
    readonly numberOfChannels: number,
    readonly length: number,
    readonly sampleRate: number,
  ) {
    this.canaux = [...Array(numberOfChannels)].map(() => new Float32Array(length));
  }
  get duration() {
    return this.length / this.sampleRate;
  }
  getChannelData(i: number) {
    return this.canaux[i]!;
  }
}
class LectureSimulee extends SourceSimulee {
  buffer: TamponSimule | null = null;
  loop = false;
  playbackRate = new ParamSimule(1);
  override finNaturelle() {
    if (this.loop || !this.buffer || this.debut === null) return null;
    return this.debut + this.buffer.duration / this.playbackRate.value;
  }
}
class OscillateurSimule extends SourceSimulee {
  type = "sine";
  frequency = new ParamSimule(440);
}

class ContexteSimule {
  currentTime = 0;
  sampleRate = 48000;
  state: "suspended" | "running" | "closed" = "suspended";
  readonly noeuds: NoeudSimule[] = [];
  readonly destination = new NoeudSimule(this, "destination");
  resume = vi.fn(async () => {
    this.state = "running";
  });
  suspend = vi.fn(async () => {
    this.state = "suspended";
  });
  close = vi.fn(async () => {
    this.state = "closed";
  });
  decodeAudioData = vi.fn<(octets: ArrayBuffer) => Promise<TamponSimule>>(
    async () => new TamponSimule(1, 4800, 48000),
  );
  createGain = () => new GainSimule(this, "gain");
  createStereoPanner = () => new PanoramiqueSimule(this, "panoramique");
  createBiquadFilter = () => new FiltreSimule(this, "filtre");
  createDynamicsCompressor = () => new LimiteurSimule(this, "limiteur");
  createBufferSource = () => new LectureSimulee(this, "lecture");
  createOscillator = () => new OscillateurSimule(this, "oscillateur");
  createBuffer = (canaux: number, longueur: number, frequence: number) =>
    new TamponSimule(canaux, longueur, frequence);

  /** Avance le temps : les sources arrivées à leur fin se terminent. */
  avancer(secondes: number): void {
    this.currentTime += secondes;
    for (const noeud of this.noeuds) {
      if (!(noeud instanceof SourceSimulee) || noeud.termine || noeud.debut === null) continue;
      const fins = [noeud.fin, noeud.finNaturelle()].filter((f) => f !== null);
      if (fins.length > 0 && Math.min(...fins) <= this.currentTime) {
        noeud.termine = true;
        noeud.onended?.();
      }
    }
  }

  de<T extends NoeudSimule>(genre: new (...args: never[]) => T): T[] {
    return this.noeuds.filter((n): n is T => n instanceof genre);
  }
  /** Les sources démarrées, hors l'échantillon de silence qui ouvre le son sur iOS. */
  lectures(): LectureSimulee[] {
    return this.de(LectureSimulee).filter((l) => l.buffer && l.buffer.length > 1);
  }
}

/** Les nœuds en aval de `depart`, de proche en proche. */
function aval(depart: NoeudSimule): NoeudSimule[] {
  const vus: NoeudSimule[] = [];
  const pile = [depart];
  while (pile.length) {
    const noeud = pile.pop()!;
    if (vus.includes(noeud)) continue;
    vus.push(noeud);
    for (const s of noeud.sorties) if (s instanceof NoeudSimule) pile.push(s);
  }
  return vus;
}

class ZoneSimulee implements ZonePreferences {
  readonly contenu = new Map<string, string>();
  getItem(cle: string) {
    return this.contenu.get(cle) ?? null;
  }
  setItem(cle: string, valeur: string) {
    this.contenu.set(cle, valeur);
  }
}

function environnement(options: { sansWebAudio?: boolean; zone?: ZonePreferences | null } = {}) {
  const contextes: ContexteSimule[] = [];
  const gestes = new EventTarget();
  const document = new EventTarget();
  let cache = false;
  const differes: (() => void)[] = [];
  const telecharger = vi.fn(async (adresse: string) => new TextEncoder().encode(adresse).buffer);
  const env: EnvironnementAudio = {
    creerContexte: () => {
      if (options.sansWebAudio) return null;
      const contexte = new ContexteSimule();
      contextes.push(contexte);
      return contexte as unknown as AudioContext;
    },
    gestes,
    visibilite: { cible: document, cache: () => cache },
    zone: options.zone === undefined ? new ZoneSimulee() : options.zone,
    telecharger,
    differer: (action) => void differes.push(action),
  };
  return {
    env,
    contextes,
    telecharger,
    /** Le joueur touche l'écran. */
    geste: () => gestes.dispatchEvent(new Event("pointerdown")),
    cacher(oui: boolean) {
      cache = oui;
      document.dispatchEvent(new Event("visibilitychange"));
    },
    executerDifferes: () => differes.splice(0).forEach((action) => action()),
  };
}

/** Un son calculé : une rampe, pour reconnaître ses échantillons. */
const RAMPE: SourceSon = {
  duree: 0.1,
  calculer(canaux) {
    for (const canal of canaux) for (let i = 0; i < canal.length; i++) canal[i] = i / canal.length;
  },
};

/** Un moteur ouvert par un geste, et son contexte. */
function moteurOuvert(sons: Record<string, SourceSon> = { clic: RAMPE, vent: RAMPE }) {
  const e = environnement();
  const moteur = new MoteurAudio(e.env);
  const banque = moteur.banque(sons);
  e.geste();
  const contexte = e.contextes[0]!;
  return { ...e, moteur, banque, contexte };
}

afterEach(() => {
  vi.restoreAllMocks();
});

// ——— Les tests

describe("l'ouverture du son", () => {
  it("attend le premier geste du joueur : aucun navigateur ne joue de son avant", () => {
    const e = environnement();
    const moteur = new MoteurAudio(e.env);
    expect(e.contextes).toHaveLength(0);
    expect(moteur.ouvert).toBe(false);
    e.geste();
    expect(moteur.ouvert).toBe(true);
    const contexte = e.contextes[0]!;
    expect(contexte.resume).toHaveBeenCalled();
    // Le volume global, puis le limiteur, puis les haut-parleurs.
    const [maitre] = contexte.de(GainSimule);
    expect(maitre!.sorties[0]).toBeInstanceOf(LimiteurSimule);
    expect((maitre!.sorties[0] as NoeudSimule).sorties).toEqual([contexte.destination]);
  });

  it("ne crée qu'un contexte, et rouvre le son à chaque geste s'il a été interrompu", () => {
    const e = environnement();
    new MoteurAudio(e.env);
    e.geste();
    e.geste();
    expect(e.contextes).toHaveLength(1);
    const contexte = e.contextes[0]!;
    contexte.state = "suspended";
    e.geste();
    expect(contexte.resume).toHaveBeenCalledTimes(2);
  });

  it("reste muet, sans erreur, quand le navigateur n'a pas Web Audio", () => {
    const e = environnement({ sansWebAudio: true });
    const moteur = new MoteurAudio(e.env);
    const banque = moteur.banque({ clic: RAMPE });
    e.geste();
    expect(moteur.ouvert).toBe(false);
    expect(() => {
      banque.jouer("clic");
      banque.ambiance("clic", { volume: 1 });
      banque.voix("v", { frequence: 220, volume: 1 });
      banque.note({ frequence: 220, duree: 1 });
    }).not.toThrow();
  });

  it("se tait quand l'onglet est caché, et reprend à son retour", () => {
    const { contexte, cacher } = moteurOuvert();
    cacher(true);
    expect(contexte.suspend).toHaveBeenCalledTimes(1);
    expect(contexte.state).toBe("suspended");
    cacher(false);
    expect(contexte.state).toBe("running");
  });

  it("n'ouvre pas le son d'un onglet caché", () => {
    const e = environnement();
    new MoteurAudio(e.env);
    e.cacher(true);
    e.geste();
    expect(e.contextes[0]!.resume).not.toHaveBeenCalled();
  });

  it("s'arrête : plus d'écoute, plus de son", () => {
    const { moteur, contexte, banque, geste, contextes } = moteurOuvert();
    moteur.arreter();
    expect(contexte.close).toHaveBeenCalled();
    expect(moteur.ouvert).toBe(false);
    geste();
    expect(contextes).toHaveLength(1);
    expect(() => banque.jouer("clic")).not.toThrow();
  });
});

describe("le volume global", () => {
  it("vaut le carré du réglage, et se coupe sans se perdre", () => {
    const { moteur, contexte } = moteurOuvert();
    const [maitre] = contexte.de(GainSimule);
    expect(maitre!.gain.value).toBeCloseTo(VOLUME_DEFAUT ** 2);
    moteur.volume = 0.5;
    expect(maitre!.gain.vise).toBeCloseTo(0.25);
    moteur.muet = true;
    expect(maitre!.gain.vise).toBe(0);
    moteur.muet = false;
    expect(maitre!.gain.vise).toBeCloseTo(0.25);
    moteur.volume = 3;
    expect(moteur.volume).toBe(1);
    moteur.volume = Number.NaN;
    expect(moteur.volume).toBe(1);
  });

  it("se garde d'une session à l'autre", () => {
    const zone = new ZoneSimulee();
    const premier = new MoteurAudio(environnement({ zone }).env);
    premier.volume = 0.4;
    premier.muet = true;
    expect(JSON.parse(zone.getItem(CLE_PREFERENCES_SON)!)).toEqual({ volume: 0.4, muet: true });
    const second = new MoteurAudio(environnement({ zone }).env);
    expect([second.volume, second.muet]).toEqual([0.4, true]);
  });

  it("revient aux valeurs par défaut si les préférences sont illisibles ou refusées", () => {
    const zone = new ZoneSimulee();
    zone.setItem(CLE_PREFERENCES_SON, "{volume");
    expect(lirePreferencesSon(zone)).toEqual({ volume: VOLUME_DEFAUT, muet: false });
    zone.setItem(CLE_PREFERENCES_SON, JSON.stringify({ volume: "fort", muet: 1 }));
    expect(lirePreferencesSon(zone)).toEqual({ volume: VOLUME_DEFAUT, muet: false });
    const refusee: ZonePreferences = {
      getItem: () => {
        throw new Error("refusé");
      },
      setItem: () => {
        throw new Error("refusé");
      },
    };
    const moteur = new MoteurAudio(environnement({ zone: refusee }).env);
    expect(moteur.volume).toBe(VOLUME_DEFAUT);
    expect(() => (moteur.volume = 0.2)).not.toThrow();
    expect(lirePreferencesSon(null)).toEqual({ volume: VOLUME_DEFAUT, muet: false });
  });
});

describe("la banque d'une strate", () => {
  it("calcule ses sons après l'ouverture du son, un par tâche, à la fréquence du contexte", () => {
    const calculer = vi.fn<(canaux: Float32Array[], frequence: number) => void>((canaux) =>
      canaux.forEach((c) => c.fill(2)),
    );
    const autre = vi.fn<(canaux: Float32Array[], frequence: number) => void>();
    const e = environnement();
    const moteur = new MoteurAudio(e.env);
    moteur.banque({
      large: { duree: 0.5, stereo: true, calculer },
      autre: { duree: 1, calculer: autre },
    });
    e.geste();
    expect(calculer).not.toHaveBeenCalled();
    e.executerDifferes();
    expect(calculer).toHaveBeenCalledTimes(1);
    expect(autre).not.toHaveBeenCalled();
    const [canaux, frequence] = calculer.mock.calls[0]!;
    expect(frequence).toBe(48000);
    expect(canaux.map((c) => c.length)).toEqual([24000, 24000]);
    e.executerDifferes();
    expect(autre).toHaveBeenCalledTimes(1);
    e.executerDifferes();
    expect(calculer).toHaveBeenCalledTimes(1);
  });

  it("calcule une rumeur à sa propre fréquence, si elle en donne une : le navigateur la rééchantillonne", () => {
    const calculer = vi.fn<(canaux: Float32Array[], frequence: number) => void>();
    const { banque, contexte } = moteurOuvert({
      vent: { duree: 2, frequence: 16000, raccord: 0.5, calculer },
    });
    banque.ambiance("vent", { volume: 1 });
    expect(calculer.mock.calls[0]![1]).toBe(16000);
    const tampon = contexte.lectures()[0]!.buffer!;
    expect([tampon.sampleRate, tampon.length]).toEqual([16000, 24000]);
  });

  it("fait un long calcul par étapes, quelques-unes par tâche, et le finit aussitôt s'il est demandé", () => {
    let etapes = 0;
    const long: SourceSon = {
      duree: 0.1,
      *calculer(canaux) {
        for (let k = 0; k < 20; k++) {
          canaux[0]![k] = k / 20;
          etapes++;
          yield;
        }
      },
    };
    const { banque, contexte, executerDifferes } = moteurOuvert({ long, autre: RAMPE });
    executerDifferes();
    expect(etapes).toBe(8);
    executerDifferes();
    expect(etapes).toBe(16);
    banque.jouer("long");
    expect(etapes).toBe(20);
    expect(contexte.lectures()).toHaveLength(1);
    expect(contexte.lectures()[0]!.buffer!.getChannelData(0)[19]).toBeCloseTo(0.95);
  });

  it("ne fige rien pour une rumeur qui cède la main : elle passe en tête, et part dès qu'elle est prête", () => {
    const longue: SourceSon = {
      duree: 0.1,
      *calculer(canaux) {
        for (let k = 0; k < 10; k++) {
          canaux[0]![k] = 0.5;
          yield;
        }
      },
    };
    const autre = vi.fn<(canaux: Float32Array[]) => void>();
    const { banque, contexte, executerDifferes } = moteurOuvert({
      autre: { ...RAMPE, calculer: autre },
      vent: longue,
    });
    banque.ambiance("vent", { volume: 0.5 });
    expect(contexte.lectures()).toHaveLength(0);
    executerDifferes();
    expect(autre).not.toHaveBeenCalled();
    executerDifferes();
    expect(contexte.lectures().map((l) => l.loop)).toEqual([true]);
    executerDifferes();
    expect(autre).toHaveBeenCalledTimes(1);
  });

  it("calcule aussitôt un son demandé avant son tour : effet ou ambiance", () => {
    const vent = vi.fn<(canaux: Float32Array[]) => void>();
    const { banque, contexte } = moteurOuvert({ clic: RAMPE, vent: { ...RAMPE, calculer: vent } });
    banque.jouer("clic");
    expect(contexte.lectures()).toHaveLength(1);
    expect(vent).not.toHaveBeenCalled();
    banque.ambiance("vent", { volume: 0.5 });
    expect(vent).toHaveBeenCalledTimes(1);
    expect(contexte.lectures()).toHaveLength(2);
  });

  it("étouffée, elle ne calcule rien ; rendue au jeu, elle fait partir les ambiances qui attendaient", () => {
    const vent = vi.fn<(canaux: Float32Array[]) => void>();
    const e = environnement();
    const banque = new MoteurAudio(e.env).banque(
      { clic: RAMPE, vent: { ...RAMPE, calculer: vent } },
      true,
    );
    e.geste();
    banque.ambiance("vent", { volume: 0.5 });
    banque.jouer("clic");
    e.executerDifferes();
    const contexte = e.contextes[0]!;
    expect(vent).not.toHaveBeenCalled();
    expect(contexte.lectures()).toHaveLength(0);
    banque.etouffer(false);
    expect(vent).toHaveBeenCalledTimes(1);
    expect(contexte.lectures().map((l) => l.loop)).toEqual([true]);
    e.executerDifferes();
    banque.jouer("clic");
    expect(contexte.lectures()).toHaveLength(2);
  });

  it("borne les échantillons calculés entre −1 et 1", () => {
    const { banque, contexte } = moteurOuvert({
      fort: {
        duree: 0.001,
        calculer: (canaux) => canaux[0]!.set([2, -3, Number.NaN, 0.5]),
      },
    });
    banque.jouer("fort");
    const tampon = contexte.lectures()[0]!.buffer!;
    expect([...tampon.getChannelData(0).slice(0, 4)]).toEqual([1, -1, 0, 0.5]);
  });

  it("est prête tout de suite quand elle s'ouvre après le premier geste", () => {
    const { moteur, contexte } = moteurOuvert({});
    const banque = moteur.banque({ clic: RAMPE });
    banque.jouer("clic");
    expect(contexte.lectures()).toHaveLength(1);
  });

  it("télécharge ses fichiers dès son ouverture, et les décode au premier geste", async () => {
    const e = environnement();
    const moteur = new MoteurAudio(e.env);
    const banque = moteur.banque({ vent: { fichier: "sons/vent.ogg" } });
    expect(e.telecharger).toHaveBeenCalledWith("sons/vent.ogg");
    banque.ambiance("vent", { volume: 0.5 });
    e.geste();
    const contexte = e.contextes[0]!;
    // Pendant le décodage, l'ambiance attend son tampon ; elle part dès qu'il est prêt.
    expect(contexte.lectures()).toHaveLength(0);
    await vi.waitFor(() => expect(contexte.lectures()).toHaveLength(1));
    expect(contexte.decodeAudioData).toHaveBeenCalledTimes(1);
    expect(contexte.lectures()[0]!.loop).toBe(true);
  });

  it("signale un fichier illisible, sans rien casser", async () => {
    const avertir = vi.spyOn(console, "warn").mockImplementation(() => {});
    const e = environnement();
    e.telecharger.mockRejectedValueOnce(new Error("404"));
    const moteur = new MoteurAudio(e.env);
    const banque = moteur.banque({ vent: { fichier: "sons/vent.ogg" } });
    e.geste();
    await vi.waitFor(() => expect(avertir).toHaveBeenCalled());
    expect(() => banque.jouer("vent")).not.toThrow();
  });
});

describe("les effets", () => {
  it("se jouent une fois, avec leur volume, leur vitesse, leur panoramique et leur délai", () => {
    const { banque, contexte } = moteurOuvert();
    contexte.currentTime = 10;
    banque.jouer("clic", { volume: 0.5, vitesse: 2, panoramique: -0.5, dans: 0.25 });
    const [lecture] = contexte.lectures();
    expect(lecture!.loop).toBe(false);
    expect(lecture!.debut).toBe(10.25);
    expect(lecture!.playbackRate.value).toBe(2);
    const [gain, pan] = aval(lecture!).slice(1);
    expect((gain as GainSimule).gain.value).toBe(0.5);
    expect((pan as PanoramiqueSimule).pan.value).toBe(-0.5);
  });

  it("sont perdus avant le premier geste", () => {
    const e = environnement();
    const banque = new MoteurAudio(e.env).banque({ clic: RAMPE });
    banque.jouer("clic");
    e.geste();
    expect(e.contextes[0]!.lectures()).toHaveLength(0);
  });

  it("se coupent après leur durée, par un bref fondu", () => {
    const { banque, contexte } = moteurOuvert();
    banque.jouer("clic", { duree: 0.04 });
    const [lecture] = contexte.lectures();
    const gain = lecture!.sorties[0] as GainSimule;
    expect(gain.gain.evenements).toEqual([expect.objectContaining({ valeur: 0, temps: 0.04 })]);
    expect(lecture!.fin).toBeCloseTo(0.14);
  });

  it("débranchent leurs nœuds à la fin", () => {
    const { banque, contexte } = moteurOuvert();
    banque.jouer("clic");
    const [lecture] = contexte.lectures();
    const gain = lecture!.sorties[0] as GainSimule;
    contexte.avancer(0.2);
    expect(lecture!.debranche).toBe(true);
    expect(gain.debranche).toBe(true);
  });

  it("ne dépassent pas la polyphonie de la banque", () => {
    const { banque, contexte } = moteurOuvert();
    for (let i = 0; i < POLYPHONIE + 5; i++) banque.jouer("clic");
    expect(contexte.lectures()).toHaveLength(POLYPHONIE);
    contexte.avancer(0.2);
    banque.jouer("clic");
    expect(contexte.lectures()).toHaveLength(POLYPHONIE + 1);
  });

  it("ne cassent jamais le jeu, même quand le navigateur lève une erreur", () => {
    const avertir = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { banque, contexte } = moteurOuvert();
    contexte.createBufferSource = () => {
      throw new Error("InvalidStateError");
    };
    expect(() => banque.jouer("clic")).not.toThrow();
    expect(() => banque.ambiance("vent", { volume: 1 })).not.toThrow();
    expect(avertir).toHaveBeenCalledTimes(1);
  });

  it("signalent une seule fois un son qui n'est pas dans la banque", () => {
    const avertir = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { banque } = moteurOuvert();
    banque.jouer("tonnerre");
    banque.jouer("tonnerre");
    expect(avertir).toHaveBeenCalledTimes(1);
  });
});

describe("les ambiances", () => {
  it("bouclent, partent en fondu, et changent de volume en douceur", () => {
    const { banque, contexte } = moteurOuvert();
    banque.ambiance("vent", { volume: 0.6, fondu: 3 });
    const [lecture] = contexte.lectures();
    expect(lecture!.loop).toBe(true);
    const gain = lecture!.sorties[0] as GainSimule;
    expect(gain.gain.value).toBe(0);
    expect(gain.gain.evenements).toEqual([{ type: "cible", valeur: 0.6, temps: 0, constante: 1 }]);
    contexte.currentTime = 5;
    banque.ambiance("vent", { volume: 0.3 });
    expect(gain.gain.evenements.at(-1)).toEqual({
      type: "cible",
      valeur: 0.3,
      temps: 5,
      constante: 1 / 3,
    });
    // Le même réglage ne s'empile pas.
    banque.ambiance("vent", { volume: 0.3 });
    expect(gain.gain.evenements).toHaveLength(2);
    expect(contexte.lectures()).toHaveLength(1);
  });

  it("s'arrêtent à volume 0, à la fin du fondu", () => {
    const { banque, contexte } = moteurOuvert();
    banque.ambiance("vent", { volume: 0.6 });
    const [lecture] = contexte.lectures();
    banque.ambiance("vent", { volume: 0, fondu: 2 });
    expect(lecture!.fin).toBe(4);
    contexte.avancer(4);
    expect(lecture!.debranche).toBe(true);
  });

  it("repartent si on les rappelle pendant leur fondu : la nouvelle boucle croise l'ancienne", () => {
    const { banque, contexte } = moteurOuvert();
    banque.ambiance("vent", { volume: 0.6 });
    banque.ambiance("vent", { volume: 0 });
    contexte.avancer(0.5);
    banque.ambiance("vent", { volume: 0.6 });
    const [ancienne, nouvelle] = contexte.lectures();
    expect(nouvelle!.debut).toBe(0.5);
    contexte.avancer(2);
    expect(ancienne!.debranche).toBe(true);
    expect(nouvelle!.debranche).toBe(false);
  });

  it("battent sur une même horloge : une boucle qui part plus tard la prend là où elle en serait", () => {
    const { moteur, contexte } = moteurOuvert();
    // Une banque ouverte à 1 s : son horloge part avec elle.
    contexte.currentTime = 1;
    const banque = moteur.banque({ vent: { ...RAMPE, duree: 0.4 }, pluie: RAMPE });
    banque.ambiance("vent", { volume: 0.5 });
    contexte.currentTime = 1.37;
    banque.ambiance("pluie", { volume: 0.5 });
    const [vent, pluie] = contexte.lectures();
    expect([vent!.debut, vent!.decalage]).toEqual([1, 0]);
    // Une boucle d'un dixième de seconde, partie 0,37 s après l'horloge : elle en est à 0,07 s.
    expect(pluie!.debut).toBe(1.37);
    expect(pluie!.decalage).toBeCloseTo(0.07, 9);
    // Arrêtée puis rappelée, elle reprend là où elle en serait.
    banque.ambiance("vent", { volume: 0 });
    contexte.avancer(2);
    banque.ambiance("vent", { volume: 0.5 });
    expect(contexte.lectures().at(-1)!.decalage).toBeCloseTo((3.37 - 1) % 0.4, 9);
  });

  it("réglées avant le premier geste, elles partent au geste ; arrêtées avant, jamais", () => {
    const e = environnement();
    const banque = new MoteurAudio(e.env).banque({ vent: RAMPE, pluie: RAMPE });
    banque.ambiance("vent", { volume: 0.4 });
    banque.ambiance("pluie", { volume: 0.4 });
    banque.ambiance("pluie", { volume: 0 });
    e.geste();
    expect(e.contextes[0]!.lectures()).toHaveLength(1);
  });
});

describe("les voix", () => {
  it("naissent en douceur, glissent vers chaque réglage, et s'éteignent à volume 0", () => {
    const { banque, contexte } = moteurOuvert();
    banque.voix("bourdon", { frequence: 110, volume: 0.3, glissement: 0.3 });
    const [oscillateur] = contexte.de(OscillateurSimule);
    expect(oscillateur!.frequency.value).toBe(110);
    expect(oscillateur!.debut).toBe(0);
    contexte.currentTime = 1;
    banque.voix("bourdon", { frequence: 165, volume: 0.2, glissement: 0.3 });
    expect(oscillateur!.frequency.evenements.at(-1)).toEqual({
      type: "cible",
      valeur: 165,
      temps: 1,
      constante: expect.closeTo(0.1),
    });
    expect(contexte.de(OscillateurSimule)).toHaveLength(2); // l'onde et la houle : pas de nouvelle voix
    banque.voix("bourdon", { frequence: 165, volume: 0, glissement: 0.3 });
    expect(oscillateur!.fin).toBeCloseTo(1.6);
    contexte.avancer(1);
    expect(oscillateur!.debranche).toBe(true);
  });

  it("chantent une voyelle : trois formants sur une onde riche, et l'onde brute", () => {
    const { banque, contexte } = moteurOuvert();
    banque.voix("p1", { frequence: 220, volume: 0.5, timbre: "a" });
    const [oscillateur] = contexte.de(OscillateurSimule);
    expect(oscillateur!.type).toBe("sawtooth");
    const filtres = contexte.de(FiltreSimule);
    expect(filtres.map((f) => [f.type, f.frequency.value])).toEqual([
      ["bandpass", 650],
      ["bandpass", 1080],
      ["bandpass", 2650],
    ]);
    // L'onde passe par chaque formant, et aussi tout droit.
    expect(oscillateur!.sorties).toHaveLength(4);
  });

  it("respirent : une houle lente module leur volume", () => {
    const { banque, contexte } = moteurOuvert();
    banque.voix("p1", { frequence: 220, volume: 0.5, souffle: 0.4 });
    const houle = contexte.de(OscillateurSimule)[1]!;
    expect(houle.frequency.value).toBeGreaterThanOrEqual(0.15);
    expect(houle.frequency.value).toBeLessThan(0.25);
    const amplitude = houle.sorties[0] as GainSimule;
    expect(amplitude.gain.value).toBeCloseTo(0.2);
    const respiration = amplitude.sorties[0] as ParamSimule;
    expect(respiration).toBeInstanceOf(ParamSimule);
    expect(respiration.value).toBeCloseTo(0.8);
  });

  it("battent d'elles-mêmes : deux voix presque justes sonnent ensemble, sans rien de simulé", () => {
    const { banque, contexte } = moteurOuvert();
    banque.voix("bourdon", { frequence: 110, volume: 0.3, timbre: "o" });
    banque.voix("quinte", { frequence: 166, volume: 0.3, timbre: "o" });
    const ondes = contexte.de(OscillateurSimule).filter((o) => o.type === "sawtooth");
    expect(ondes.map((o) => o.frequency.value)).toEqual([110, 166]);
  });

  it("gardent leur hauteur quand le réglage n'en est pas une", () => {
    const { banque, contexte } = moteurOuvert();
    banque.voix("v", { frequence: Number.NaN, volume: 0.3 });
    expect(contexte.de(OscillateurSimule)).toHaveLength(0);
    banque.voix("v", { frequence: 220, volume: 0.3 });
    banque.voix("v", { frequence: 30000, volume: 0.3 });
    const [oscillateur] = contexte.de(OscillateurSimule);
    expect(oscillateur!.frequency.evenements).toHaveLength(0);
  });

  it("réglées avant le premier geste, elles naissent au geste", () => {
    const e = environnement();
    const banque = new MoteurAudio(e.env).banque({});
    banque.voix("bourdon", { frequence: 110, volume: 0.3 });
    e.geste();
    expect(e.contextes[0]!.de(OscillateurSimule)).toHaveLength(2);
  });
});

describe("les notes", () => {
  it("montent en attaque, déclinent, et finissent à zéro sans clic", () => {
    const { banque, contexte } = moteurOuvert();
    contexte.currentTime = 2;
    banque.note({ frequence: 440, duree: 1, volume: 0.8, attaque: 0.05, timbre: "triangle" });
    const [oscillateur] = contexte.de(OscillateurSimule);
    expect(oscillateur!.type).toBe("triangle");
    expect([oscillateur!.debut, oscillateur!.fin]).toEqual([2, 3]);
    const enveloppe = aval(oscillateur!).find(
      (n) => n instanceof GainSimule && n.gain.evenements.length > 0,
    ) as GainSimule;
    const evenements = enveloppe.gain.evenements;
    expect(evenements[0]).toEqual({ type: "valeur", valeur: 0, temps: 2 });
    expect(evenements[1]).toEqual({ type: "rampe", valeur: 0.8, temps: 2.05 });
    expect(evenements.at(-1)).toEqual({ type: "rampe", valeur: 0, temps: 3 });
  });

  it("jouent un accord : une note sur chaque rapport de la fréquence", () => {
    const { banque, contexte } = moteurOuvert();
    banque.note({ frequence: 200, rapports: [1, 5 / 4, 3 / 2], duree: 0.5 });
    const frequences = contexte.de(OscillateurSimule).map((o) => o.frequency.value);
    expect(frequences).toEqual([200, 250, 300]);
  });

  it("ignorent ce qui ne s'entend pas", () => {
    const { banque, contexte } = moteurOuvert();
    banque.note({ frequence: 440, rapports: [1, 100], duree: 0.5 });
    banque.note({ frequence: 440, duree: 0 });
    banque.note({ frequence: -1, duree: 1 });
    expect(contexte.de(OscillateurSimule).map((o) => o.frequency.value)).toEqual([440]);
  });
});

describe("le cycle de vie d'une banque", () => {
  it("étouffée pendant la fouille, elle se tait en fondu, puis revient", () => {
    const { banque, contexte } = moteurOuvert();
    const sortie = contexte.de(GainSimule)[1]!;
    banque.etouffer(true);
    expect(sortie.gain.vise).toBe(0);
    banque.etouffer(false);
    expect(sortie.gain.vise).toBe(1);
  });

  it("ouverte étouffée, elle commence muette", () => {
    const e = environnement();
    const moteur = new MoteurAudio(e.env);
    moteur.banque({}, true);
    e.geste();
    expect(e.contextes[0]!.de(GainSimule)[1]!.gain.value).toBe(0);
  });

  it("libérée, elle arrête tout, se débranche, et ne répond plus", () => {
    const { banque, contexte, moteur, executerDifferes } = moteurOuvert();
    banque.ambiance("vent", { volume: 0.5 });
    banque.voix("v", { frequence: 220, volume: 0.5 });
    banque.jouer("clic");
    const sortie = contexte.de(GainSimule)[1]!;
    banque.liberer();
    const sources = contexte.de(SourceSimulee).filter((s) => s.debut !== null && s.fin !== null);
    expect(sources.length).toBeGreaterThanOrEqual(4);
    contexte.avancer(1);
    executerDifferes();
    expect(sortie.debranche).toBe(true);
    expect(contexte.de(SourceSimulee).every((s) => s.debut === null || s.termine)).toBe(true);
    const avant = contexte.noeuds.length;
    banque.jouer("clic");
    banque.ambiance("vent", { volume: 1 });
    banque.voix("v", { frequence: 220, volume: 1 });
    banque.note({ frequence: 220, duree: 1 });
    expect(contexte.noeuds).toHaveLength(avant);
    // Le moteur l'a oubliée : son arrêt ne la libère pas deux fois.
    expect(() => moteur.arreter()).not.toThrow();
  });
});

describe("le raccord d'une boucle", () => {
  it("fond la fin dans le début : le dernier échantillon gardé enchaîne sur le premier", () => {
    // Une rampe de 0 à 99 : sans raccord, la boucle saute de 99 à 0.
    const canal = Float32Array.from({ length: 100 }, (_, i) => i);
    const garde = raccorder([canal], 20);
    expect(garde).toBe(80);
    // Le premier échantillon est celui qui suivait le dernier gardé.
    expect(canal[0]).toBeCloseTo(80);
    expect(canal[79]).toBe(79);
    // Le fondu rejoint le début d'origine : vers la fin du raccord, on retrouve 0 à 19.
    expect(canal[19]).toBeCloseTo(
      19 * Math.sin((Math.PI / 2) * 0.95) + 99 * Math.cos((Math.PI / 2) * 0.95),
    );
    expect(canal[20]).toBe(20);
  });

  it("ne raccorde pas plus de la moitié du son", () => {
    const canaux = [new Float32Array(10), new Float32Array(10)];
    expect(raccorder(canaux, 50)).toBe(5);
    expect(raccorder(canaux, 0)).toBe(10);
  });

  it("raccourcit d'autant une ambiance calculée", () => {
    const { banque, contexte } = moteurOuvert({ vent: { ...RAMPE, duree: 1, raccord: 0.25 } });
    banque.ambiance("vent", { volume: 1 });
    expect(contexte.lectures()[0]!.buffer!.length).toBe(36000);
  });
});

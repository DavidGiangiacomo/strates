import { deriverGraine } from "./alea";
import {
  effetsActifs,
  fouiller,
  ouvrirFouille,
  verifierChoix,
  type Effets,
  type Fouille,
  type FouilleOuverte,
} from "./artefacts";
import { EFFETS_NEUTRES } from "./effets";
import { estNumeroStrate, noterInstant, type EtatNoyau, type EtatStrateRange } from "./etat";
import {
  PLAFOND_HORS_LIGNE,
  SEUIL_ABSENCE,
  SEUIL_PERTURBATION,
  TAUX_HORS_LIGNE,
  type Reprise,
} from "./horsligne";
import { migrerEtatStrate } from "./migrations";
import type { Registre, StrateQuelconque } from "./registre";
import type {
  ActionBase,
  ContexteTick,
  EntreeJournal,
  EtatSeuil,
  EvenementStrate,
  NumeroStrate,
  Releve,
} from "./types";

/** Pas fixe de la boucle, en secondes : 10 ticks par seconde (docs/architecture.md § 6). */
export const PAS = 0.1;

// Tolérance pour comparer des sommes de pas en virgule flottante.
const EPSILON = 1e-9;

/**
 * Ce que le noyau signale à qui l'observe : le journal de session des playtests (#26). L'observateur
 * ne modifie rien ; il est prévenu après coup.
 */
export interface ObservateurNoyau {
  /** Une action du joueur vient d'être appliquée à la strate courante. */
  action?(action: ActionBase): void;
  /** La strate vient de signaler un événement. */
  evenement?(evenement: EvenementStrate): void;
}

/**
 * Le noyau : l'état global, la strate courante et la boucle de tick.
 * Déterministe : le temps lui est fourni, il ne le lit jamais.
 */
export class Noyau {
  readonly etat: EtatNoyau;
  /** Qui observe le noyau, s'il y a quelqu'un : le journal de session. */
  observateur: ObservateurNoyau | null = null;
  #registre: Registre;
  #strate: StrateQuelconque | null = null;
  #actions: ActionBase[] = [];
  #evenements: EvenementStrate[] = [];
  #accumulateur = 0;
  #seuil: EtatSeuil = { atteint: false };
  #effets: Effets = { ...EFFETS_NEUTRES, plafonne: false };
  #contexte: ContexteTick;
  /** La fouille ouverte, en attendant le choix du joueur. */
  #fouille: FouilleOuverte | null = null;
  /** La strate courante est figée : pendant la fouille, puis pendant la transition vers la suivante. */
  #suspendu = false;

  constructor(registre: Registre, etat: EtatNoyau) {
    if (!estNumeroStrate(etat.profondeur)) {
      throw new RangeError(`Profondeur invalide : ${String(etat.profondeur)}.`);
    }
    this.#registre = registre;
    this.etat = etat;
    this.#contexte = {
      effets: EFFETS_NEUTRES,
      emettre: (evenement) => {
        this.#evenements.push(evenement);
        this.observateur?.evenement?.(evenement);
      },
    };
  }

  /**
   * Charge la strate de la profondeur courante et prépare son état : le crée s'il n'existe pas
   * encore, ou le migre s'il vient d'une version antérieure de la strate (D-005). Refuse un état
   * plus récent que la strate. `maintenant` est l'horodatage d'arrivée (ms), noté dans le journal.
   */
  async demarrer(maintenant: number): Promise<void> {
    const strate = await this.#registre.charger(this.etat.profondeur);
    this.#installer(strate, maintenant);
  }

  /** Installe la strate chargée pour la profondeur courante : son état, son journal, ses effets. */
  #installer(strate: StrateQuelconque, maintenant: number): void {
    const numero = this.etat.profondeur;
    const logique = strate.logique;
    // Les artefacts et la Profondeur ne changent qu'à la descente : les effets se calculent ici.
    const effets = effetsActifs(this.etat.artefacts, numero, logique.leviers);
    const range = this.etat.strates[numero];

    if (!range) {
      this.etat.strates[numero] = {
        version: logique.versionEtat,
        etat: logique.etatInitial({
          graine: deriverGraine(this.etat.graine, numero),
          journal: this.etat.meta.journal,
          effets,
        }),
      };
    } else if (range.version !== logique.versionEtat) {
      this.etat.strates[numero] = migrerEtatStrate(range, logique);
    }

    const journal = this.etat.meta.journal.strates;
    if (journal.at(-1)?.strate !== numero) {
      journal.push(nouvelleEntree(numero, maintenant));
    }

    this.#strate = strate;
    this.#accumulateur = 0;
    this.#fouille = null;
    this.#effets = effets;
    this.#contexte.effets = effets;
    this.#lireSeuil();
  }

  /** Les effets des artefacts dans la strate courante, après usure et plafond × 4. */
  get effets(): Effets {
    return this.#effets;
  }

  /** La strate courante. */
  get strate(): StrateQuelconque {
    if (!this.#strate) throw new Error("Le noyau n'est pas démarré.");
    return this.#strate;
  }

  /** L'état de la strate courante, opaque pour le noyau. */
  get etatStrate(): unknown {
    return this.#rangeCourant().etat;
  }

  /**
   * Remplace l'état de la strate courante par un objet équivalent, typiquement l'enveloppe
   * réactive de l'interface (docs/architecture.md § 5). Le noyau n'utilise plus que lui.
   */
  remplacerEtatStrate(etat: unknown): void {
    this.#rangeCourant().etat = etat;
  }

  /** Met une action en file ; elle sera appliquée au début du tick suivant. */
  agir(action: ActionBase): void {
    this.#actions.push(action);
  }

  /**
   * Fait avancer le temps de `duree` secondes, par pas fixes de `PAS`.
   * Le reste s'accumule pour l'appel suivant. Renvoie le nombre de ticks joués : aucun si la strate
   * est figée.
   */
  avancer(duree: number): number {
    if (!Number.isFinite(duree) || duree < 0) {
      throw new RangeError(`Durée invalide : ${duree}.`);
    }
    if (this.#suspendu) return 0;
    this.#accumulateur += duree;
    let ticks = 0;
    while (this.#accumulateur >= PAS - EPSILON) {
      this.tick(PAS);
      this.#accumulateur -= PAS;
      ticks++;
    }
    this.#accumulateur = Math.max(0, this.#accumulateur);
    return ticks;
  }

  /**
   * Un tick : applique les actions en file, dans l'ordre, puis avance la strate de `dt` secondes,
   * en pas égaux qui ne dépassent jamais son `pasMax`. Sans effet si la strate est figée.
   */
  tick(dt: number): void {
    if (!Number.isFinite(dt) || dt < 0) {
      throw new RangeError(`Pas invalide : ${dt}.`);
    }
    if (this.#suspendu) return;
    this.#appliquerActions();
    this.#avancerStrate(dt);
    this.#entreeCourante().tempsDeJeu += dt;
    this.#lireSeuil();
  }

  /**
   * Rattrape le temps écoulé depuis la référence d'horloge, à l'instant `maintenant` (ms) :
   * au chargement, ou quand la boucle constate une absence (D-005, « Temps et horloge »).
   * - Écart positif : une absence, traitée par la politique hors-ligne de la strate.
   * - Écart négatif : un recul d'horloge, qui compte pour zéro. La référence ne bouge pas,
   *   et au-delà de 5 minutes une perturbation est notée, une fois par épisode.
   * Une strate figée ne vit pas l'absence : la référence suit, et rien ne se rattrape.
   */
  rattraper(maintenant: number): Reprise {
    const ecart = (maintenant - this.etat.reference) / 1000;
    if (ecart < 0) return this.#constaterRecul(maintenant, -ecart);
    if (ecart === 0) return { type: "aucune" };
    if (this.#suspendu) {
      noterInstant(this.etat, maintenant);
      return { type: "aucune" };
    }

    const logique = this.strate.logique;
    const etat = this.etatStrate;
    this.#appliquerActions();

    let comptee = 0;
    let lignes: string[] = [];
    switch (logique.horsLigne.type) {
      case "standard":
        comptee = Math.min(ecart, PLAFOND_HORS_LIGNE);
        this.#avancerStrate(comptee * TAUX_HORS_LIGNE);
        break;
      case "propre": {
        if (!logique.absence) {
          throw new Error(`La strate ${logique.numero} déclare une absence propre sans absence().`);
        }
        comptee = ecart;
        lignes = logique.absence(etat, ecart, this.#contexte).lignes;
        break;
      }
      case "aucune":
        break;
    }

    this.#entreeCourante().tempsHorsLigne += comptee;
    noterInstant(this.etat, maintenant);
    this.#lireSeuil();
    return { type: "absence", politique: logique.horsLigne.type, duree: ecart, comptee, lignes };
  }

  /**
   * Une image de la boucle, à l'instant `maintenant` (ms), `dt` secondes après la précédente
   * selon l'horloge monotone. Un grand écart avec la référence est une absence (onglet caché,
   * veille), rattrapée par `rattraper`. Sinon, le jeu avance de `dt` et la référence suit.
   * Renvoie la reprise quand il y a quelque chose à signaler, null sinon.
   */
  avancerJusqua(maintenant: number, dt: number): Reprise | null {
    const ecart = (maintenant - this.etat.reference) / 1000;
    if (ecart > SEUIL_ABSENCE) return this.rattraper(maintenant);

    // L'horloge a pu reculer en cours de partie : le jeu continue sur l'horloge monotone,
    // et la référence attend que l'horloge la rattrape.
    const recul = ecart < 0 ? this.#constaterRecul(maintenant, -ecart) : null;
    this.avancer(dt);
    noterInstant(this.etat, maintenant);
    return recul?.type === "recul" && recul.perturbation ? recul : null;
  }

  /** Où en est le seuil de fouille de la strate courante, lu après le dernier tick. */
  get seuil(): EtatSeuil {
    return this.#seuil;
  }

  /**
   * Le joueur demande la descente : refusée tant que le seuil n'est pas atteint
   * (docs/architecture.md § 6, « La descente », étape 1). Acceptée, elle s'ouvre par `ouvrirFouille`.
   */
  demanderFouille(): boolean {
    return this.#seuil.atteint;
  }

  /**
   * Le joueur a ouvert l'aide de la strate courante : le journal le note (l'acte « sans aide » de la
   * Compréhension, §8). Le noyau n'en fait rien de plus pour l'instant (#56).
   */
  noterAide(): void {
    this.#entreeCourante().aideConsultee = true;
  }

  /** La profondeur sous la strate courante, si une strate l'occupe ; null au fond, ou tant qu'elle n'existe pas. */
  get strateSuivante(): NumeroStrate | null {
    const suivante = this.etat.profondeur + 1;
    return estNumeroStrate(suivante) && this.#registre.numeros().includes(suivante)
      ? suivante
      : null;
  }

  /** La fouille ouverte, en attendant le choix du joueur ; null sinon. */
  get fouille(): FouilleOuverte | null {
    return this.#fouille;
  }

  /** La strate courante est figée : ni tick ni absence, pendant la fouille et la transition. */
  get suspendu(): boolean {
    return this.#suspendu;
  }

  /**
   * Le seuil est atteint et la strate descend d'elle-même (strate 7) : l'interface lance la descente,
   * sans écran de choix, avec la présélection.
   */
  get descenteAutomatique(): boolean {
    return (
      this.#seuil.atteint &&
      this.#seuil.automatique === true &&
      !this.#suspendu &&
      this.strateSuivante !== null
    );
  }

  /**
   * Ouvre la fouille (docs/strates/descente-1-2.md, P2) : les actions en attente sont appliquées, la
   * strate se fige, et sa valeur convertible devient des points de fouille. Rien n'est encore noté.
   * Refusée avant le seuil, ou s'il n'y a pas de strate dessous.
   */
  ouvrirFouille(): FouilleOuverte {
    if (this.#fouille) return this.#fouille;
    if (!this.#seuil.atteint) throw new Error("Le seuil de fouille n'est pas atteint.");
    if (this.strateSuivante === null) {
      throw new Error(`Aucune strate n'est sous la profondeur ${this.etat.profondeur}.`);
    }
    this.#appliquerActions();
    this.#suspendu = true;
    this.#accumulateur = 0;
    const logique = this.strate.logique;
    this.#fouille = ouvrirFouille(logique.numero, logique.valeurConvertible(this.etatStrate));
    return this.#fouille;
  }

  /** Referme la fouille sans rien noter : la strate reprend là où elle s'était figée. */
  reboucher(): void {
    this.#fouille = null;
    this.reprendre();
  }

  /** La strate courante repart : après « reboucher », ou à la fin de la transition d'une descente. */
  reprendre(): void {
    if (this.#fouille) throw new Error("La fouille est ouverte : il faut descendre ou reboucher.");
    this.#suspendu = false;
    this.#accumulateur = 0;
  }

  /**
   * Descend (docs/architecture.md § 6, « La descente ») avec les objets `emportes`, à l'instant
   * `maintenant` (ms). Le choix est vérifié et la strate suivante chargée ; puis tout est engagé d'un
   * coup : la fouille est notée au journal, les objets rejoignent les artefacts, la Profondeur augmente
   * et la nouvelle strate s'installe. Si le chargement échoue, rien n'a changé et la fouille reste ouverte.
   *
   * L'état de la strate quittée reste tel quel dans `etat.strates`. La nouvelle strate est figée
   * jusqu'à `reprendre()`, le temps de la transition. Sans choix, la présélection s'applique : c'est
   * la descente automatique, qui ouvre la fouille elle-même.
   */
  async descendre(maintenant: number, emportes?: readonly string[]): Promise<Fouille> {
    const fouille = this.#fouille ?? (this.descenteAutomatique ? this.ouvrirFouille() : null);
    if (!fouille) throw new Error("La fouille n'est pas ouverte.");
    const choix = emportes ?? fouille.preselection;
    verifierChoix(fouille.points, fouille.strate, choix);
    const suivante = this.strateSuivante;
    if (suivante === null) {
      throw new Error(`Aucune strate n'est sous la profondeur ${this.etat.profondeur}.`);
    }

    const strate = await this.#registre.charger(suivante);
    if (this.#fouille !== fouille) throw new Error("La fouille a été refermée entre-temps.");

    const resultat = fouiller(this.etat, fouille.points, choix);
    const entree = this.#entreeCourante();
    entree.seuil ??= { le: maintenant };
    // Une action restée en file appartient à la strate quittée : elle ne doit pas atteindre la suivante.
    this.#actions.length = 0;
    this.etat.profondeur = suivante;
    noterInstant(this.etat, maintenant);
    this.#installer(strate, maintenant);
    return resultat;
  }

  /** Un relevé de la strate courante, pour le journal de session ; null si elle n'en donne pas. */
  releve(): Releve | null {
    return this.strate.logique.releve?.(this.etatStrate) ?? null;
  }

  /** Renvoie les événements émis par la strate depuis le dernier appel, et les oublie. */
  viderEvenements(): EvenementStrate[] {
    return this.#evenements.splice(0);
  }

  /** Lit le seuil de la strate courante, et note au journal le moment où il est atteint (ms). */
  #lireSeuil(): void {
    this.#seuil = this.strate.logique.seuil(this.etatStrate);
    const entree = this.#entreeCourante();
    if (!this.#seuil.atteint || entree.seuil) return;
    entree.seuil = { le: this.etat.reference };
    if (this.#seuil.issue !== undefined) entree.seuil.issue = this.#seuil.issue;
  }

  #appliquerActions(): void {
    const logique = this.strate.logique;
    const etat = this.etatStrate;
    for (const action of this.#actions.splice(0)) {
      logique.agir(etat, action, this.#contexte);
      this.observateur?.action?.(action);
    }
  }

  /** Avance la strate de `dt` secondes, en pas égaux qui ne dépassent jamais son `pasMax`. */
  #avancerStrate(dt: number): void {
    if (dt <= 0) return;
    const logique = this.strate.logique;
    const etat = this.etatStrate;
    const n = Math.ceil(dt / logique.pasMax - EPSILON);
    const pas = dt / n;
    for (let i = 0; i < n; i++) {
      logique.tick(etat, pas, this.#contexte);
    }
  }

  /** Un recul d'horloge : noté dans le journal au-delà du seuil, une seule fois par épisode. */
  #constaterRecul(maintenant: number, recul: number): Reprise {
    if (recul <= SEUIL_PERTURBATION) return { type: "recul", recul, perturbation: false };
    const perturbations = this.#entreeCourante().perturbations;
    // Pendant un même épisode, la référence ne bouge pas : `le + recul` la redonne toujours.
    const derniere = perturbations.at(-1);
    const memeEpisode =
      derniere !== undefined &&
      Math.abs(derniere.le + derniere.recul * 1000 - this.etat.reference) < 1;
    if (memeEpisode) return { type: "recul", recul, perturbation: false };
    perturbations.push({ le: maintenant, recul });
    return { type: "recul", recul, perturbation: true };
  }

  #rangeCourant(): EtatStrateRange {
    const range = this.etat.strates[this.strate.logique.numero];
    if (!range) throw new Error("La strate courante n'a pas d'état.");
    return range;
  }

  #entreeCourante(): EntreeJournal {
    const entree = this.etat.meta.journal.strates.at(-1);
    if (!entree || entree.strate !== this.etat.profondeur) {
      throw new Error("Le journal n'a pas d'entrée pour la strate courante.");
    }
    return entree;
  }
}

function nouvelleEntree(strate: NumeroStrate, arrivee: number): EntreeJournal {
  return {
    strate,
    arrivee,
    tempsDeJeu: 0,
    tempsHorsLigne: 0,
    aideConsultee: false,
    perturbations: [],
  };
}

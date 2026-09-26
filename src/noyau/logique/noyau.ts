import { deriverGraine } from "./alea";
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
} from "./types";

/** Pas fixe de la boucle, en secondes : 10 ticks par seconde (docs/architecture.md § 6). */
export const PAS = 0.1;

// Tolérance pour comparer des sommes de pas en virgule flottante.
const EPSILON = 1e-9;

/**
 * Le noyau : l'état global, la strate courante et la boucle de tick.
 * Déterministe : le temps lui est fourni, il ne le lit jamais.
 */
export class Noyau {
  readonly etat: EtatNoyau;
  #registre: Registre;
  #strate: StrateQuelconque | null = null;
  #actions: ActionBase[] = [];
  #evenements: EvenementStrate[] = [];
  #accumulateur = 0;
  #seuil: EtatSeuil = { atteint: false };
  #contexte: ContexteTick;

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
      },
    };
  }

  /**
   * Charge la strate de la profondeur courante et prépare son état : le crée s'il n'existe pas
   * encore, ou le migre s'il vient d'une version antérieure de la strate (D-005). Refuse un état
   * plus récent que la strate. `maintenant` est l'horodatage d'arrivée (ms), noté dans le journal.
   */
  async demarrer(maintenant: number): Promise<void> {
    const numero = this.etat.profondeur;
    const strate = await this.#registre.charger(numero);
    const logique = strate.logique;
    const range = this.etat.strates[numero];

    if (!range) {
      this.etat.strates[numero] = {
        version: logique.versionEtat,
        etat: logique.etatInitial({
          graine: deriverGraine(this.etat.graine, numero),
          journal: this.etat.meta.journal,
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
    this.#seuil = logique.seuil(this.etatStrate);
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
   * Le reste s'accumule pour l'appel suivant. Renvoie le nombre de ticks joués.
   */
  avancer(duree: number): number {
    if (!Number.isFinite(duree) || duree < 0) {
      throw new RangeError(`Durée invalide : ${duree}.`);
    }
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
   * en pas égaux qui ne dépassent jamais son `pasMax`.
   */
  tick(dt: number): void {
    if (!Number.isFinite(dt) || dt < 0) {
      throw new RangeError(`Pas invalide : ${dt}.`);
    }
    this.#appliquerActions();
    this.#avancerStrate(dt);
    this.#entreeCourante().tempsDeJeu += dt;
    this.#seuil = this.strate.logique.seuil(this.etatStrate);
  }

  /**
   * Rattrape le temps écoulé depuis la référence d'horloge, à l'instant `maintenant` (ms) :
   * au chargement, ou quand la boucle constate une absence (D-005, « Temps et horloge »).
   * - Écart positif : une absence, traitée par la politique hors-ligne de la strate.
   * - Écart négatif : un recul d'horloge, qui compte pour zéro. La référence ne bouge pas,
   *   et au-delà de 5 minutes une perturbation est notée, une fois par épisode.
   */
  rattraper(maintenant: number): Reprise {
    const ecart = (maintenant - this.etat.reference) / 1000;
    if (ecart < 0) return this.#constaterRecul(maintenant, -ecart);
    if (ecart === 0) return { type: "aucune" };

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
    this.#seuil = logique.seuil(etat);
    noterInstant(this.etat, maintenant);
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
   * (docs/architecture.md § 6, « La descente », étape 1). La suite de la descente arrive avec #30.
   */
  demanderFouille(): boolean {
    return this.#seuil.atteint;
  }

  /** Renvoie les événements émis par la strate depuis le dernier appel, et les oublie. */
  viderEvenements(): EvenementStrate[] {
    return this.#evenements.splice(0);
  }

  #appliquerActions(): void {
    const logique = this.strate.logique;
    const etat = this.etatStrate;
    for (const action of this.#actions.splice(0)) {
      logique.agir(etat, action, this.#contexte);
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

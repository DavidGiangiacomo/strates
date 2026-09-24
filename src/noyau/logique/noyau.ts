import { deriverGraine } from "./alea";
import { EFFETS_NEUTRES } from "./effets";
import { estNumeroStrate, type EtatNoyau, type EtatStrateRange } from "./etat";
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
   * Charge la strate de la profondeur courante et prépare son état s'il n'existe pas encore.
   * `maintenant` est l'horodatage d'arrivée (ms), noté dans le journal.
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
      throw new Error(
        `L'état de la strate ${numero} est en version ${range.version}, ` +
          `la strate attend la version ${logique.versionEtat}.`,
      );
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
    const logique = this.strate.logique;
    const etat = this.etatStrate;

    for (const action of this.#actions.splice(0)) {
      logique.agir(etat, action, this.#contexte);
    }

    if (dt > 0) {
      const n = Math.ceil(dt / logique.pasMax - EPSILON);
      const pas = dt / n;
      for (let i = 0; i < n; i++) {
        logique.tick(etat, pas, this.#contexte);
      }
    }

    this.#entreeCourante().tempsDeJeu += dt;
    this.#seuil = logique.seuil(etat);
  }

  /** Où en est le seuil de fouille de la strate courante, lu après le dernier tick. */
  get seuil(): EtatSeuil {
    return this.#seuil;
  }

  /** Renvoie les événements émis par la strate depuis le dernier appel, et les oublie. */
  viderEvenements(): EvenementStrate[] {
    return this.#evenements.splice(0);
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

// Le journal de session des playtests (#26 ; docs/playtest-mvp.md, § 9) : ce que fait le testeur,
// horodaté, pour lire après coup les gestes du protocole. Il reste dans le navigateur, ne contient
// aucune donnée personnelle, et s'exporte en JSON. Ce module ne touche pas au navigateur : l'horloge
// lui est fournie (plateforme.ts s'occupe du stockage et de l'export).
import type { Noyau } from "../noyau/logique/noyau";
import type { ActionBase, NumeroStrate, Releve } from "../noyau/logique/types";

/** Version du format du journal exporté. */
export const FORMAT_JOURNAL = 1;
/** Un relevé toutes les 5 secondes de jeu (docs/playtest-mvp.md, § 9). */
export const PERIODE_RELEVE = 5;
/** Au-delà, le journal cesse d'écrire et se dit tronqué. Une séance de 2 h en produit quelques milliers. */
export const MAX_EVENEMENTS = 50_000;

export interface MetaJournal {
  format: number;
  /** Le code du testeur (« T3 ») : le seul identifiant du journal. */
  testeur: string;
  version: string;
  build: string;
  /** Le début de la séance (ms, horloge système). */
  debut: number;
  navigateur: string;
  fenetre: { largeur: number; hauteur: number };
  mouvementReduit: boolean;
  /** Le journal a atteint sa taille maximale : la suite n'est pas enregistrée. */
  tronque?: boolean;
}

/** Ce qui s'est passé. Les réponses de « creuser » et les phases suivent le passage (noyau/ui). */
export type DonneesJournal =
  | { type: "debut"; rechargement: boolean }
  | { type: "action"; action: ActionBase; n: number; releve: Releve | null }
  | { type: "trace"; cle: string; valeurs?: Record<string, number>; objet?: string }
  | { type: "releve"; releve: Releve | null }
  | { type: "seuil" }
  | { type: "creuser"; reponse: "resiste" | "fouille" | "pas-de-suite" }
  | { type: "fouille"; valeur: number; points: number; preselection: string[] }
  | { type: "case"; objet: string; coche: boolean }
  | { type: "reboucher" }
  | { type: "descendre"; emportes: string[]; abandonnes: string[] }
  | { type: "phase"; phase: string }
  | { type: "absence"; duree: number; comptee: number; politique: string; releve: Releve | null }
  | { type: "aide" };

/**
 * Un événement : ce qui s'est passé, quand (`t`, en millisecondes depuis le début de la séance),
 * dans quelle strate (`s`), et à quel temps de jeu de cette strate (`j`, en secondes).
 */
export type EvenementJournal = { t: number; s: NumeroStrate; j: number } & DonneesJournal;

export interface JournalExporte {
  meta: MetaJournal;
  evenements: EvenementJournal[];
}

/** Arrondit les nombres d'un relevé au centième : le journal reste lisible et léger. */
export function arrondir(releve: Releve | null): Releve | null {
  if (!releve) return null;
  const resultat: Releve = {};
  for (const [cle, valeur] of Object.entries(releve)) {
    resultat[cle] = typeof valeur === "number" ? Math.round(valeur * 100) / 100 : valeur;
  }
  return resultat;
}

const memeAction = (a: ActionBase, b: ActionBase) => JSON.stringify(a) === JSON.stringify(b);

// Tolérance pour les multiples de 5 s atteints par une somme de pas en virgule flottante.
const EPSILON = 1e-9;

export class JournalSession {
  readonly meta: MetaJournal;
  readonly evenements: EvenementJournal[];
  /** Un journal arrêté garde ce qu'il a, et n'écrit plus rien. */
  actif = true;

  #horloge: () => number;
  #noyau: Noyau | null = null;
  #strate: NumeroStrate | null = null;
  #periode = -1;
  #seuil = false;

  constructor(meta: MetaJournal, horloge: () => number, evenements: EvenementJournal[] = []) {
    this.meta = meta;
    this.evenements = evenements;
    this.#horloge = horloge;
  }

  /** Relit un journal sérialisé, pour le reprendre après un rechargement ; null s'il est illisible. */
  static relire(texte: string, horloge: () => number): JournalSession | null {
    try {
      const { meta, evenements } = JSON.parse(texte) as JournalExporte;
      if (meta?.format !== FORMAT_JOURNAL || !Array.isArray(evenements)) return null;
      return new JournalSession(meta, horloge, evenements);
    } catch {
      return null;
    }
  }

  /**
   * Observe le noyau : ses actions, les traces de ses strates. Note le début de la séance, ou sa
   * reprise après un rechargement.
   */
  brancher(noyau: Noyau): void {
    this.#noyau = noyau;
    this.#strate = noyau.etat.profondeur;
    this.#seuil = noyau.seuil.atteint;
    // Un relevé dès la première image : une action a toujours un état d'avant où se comparer.
    this.#periode = -1;
    noyau.observateur = {
      action: (action) =>
        this.noter({ type: "action", action, n: 1, releve: arrondir(noyau.releve()) }),
      evenement: (evenement) => {
        if (evenement.type === "trace") this.noter(evenement);
      },
    };
    this.noter({ type: "debut", rechargement: this.evenements.length > 0 });
    // Un journal qui commence dans une strate déjà au seuil le note tout de suite, une fois.
    const s = noyau.etat.profondeur;
    if (this.#seuil && !this.evenements.some((e) => e.type === "seuil" && e.s === s)) {
      this.noter({ type: "seuil" });
    }
  }

  /** Note un événement, à l'instant présent. Une action répétée dans la même seconde est comptée. */
  noter(donnees: DonneesJournal): void {
    if (!this.actif) return;
    if (this.evenements.length >= MAX_EVENEMENTS) {
      this.meta.tronque = true;
      return;
    }
    const t = Math.max(0, Math.round(this.#horloge() - this.meta.debut));
    const s = this.#noyau?.etat.profondeur ?? 1;
    const j = Math.round(this.#tempsDeJeu() * 10) / 10;

    const dernier = this.evenements.at(-1);
    if (
      donnees.type === "action" &&
      dernier?.type === "action" &&
      dernier.s === s &&
      Math.floor(dernier.t / 1000) === Math.floor(t / 1000) &&
      memeAction(dernier.action, donnees.action)
    ) {
      dernier.n += donnees.n;
      dernier.releve = donnees.releve;
      return;
    }
    this.evenements.push({ t, s, j, ...donnees });
  }

  /**
   * À chaque image : un relevé toutes les 5 secondes de jeu, et le seuil au moment où il est atteint.
   * Une nouvelle strate repart de zéro.
   */
  suivre(): void {
    const noyau = this.#noyau;
    if (!noyau || !this.actif) return;
    if (noyau.etat.profondeur !== this.#strate) {
      this.#strate = noyau.etat.profondeur;
      this.#seuil = noyau.seuil.atteint;
      this.#periode = -1;
    }
    const periode = Math.floor(this.#tempsDeJeu() / PERIODE_RELEVE + EPSILON);
    if (periode > this.#periode) {
      this.#periode = periode;
      this.noter({ type: "releve", releve: arrondir(noyau.releve()) });
    }
    if (noyau.seuil.atteint && !this.#seuil) {
      this.#seuil = true;
      this.noter({ type: "seuil" });
    }
  }

  /** Le relevé de la strate courante, arrondi : pour les absences, notées par l'interface. */
  releve(): Releve | null {
    return arrondir(this.#noyau?.releve() ?? null);
  }

  exporter(): JournalExporte {
    return { meta: this.meta, evenements: this.evenements };
  }

  serialiser(): string {
    return JSON.stringify(this.exporter());
  }

  #tempsDeJeu(): number {
    const entree = this.#noyau?.etat.meta.journal.strates.at(-1);
    return entree?.strate === this.#noyau?.etat.profondeur ? (entree?.tempsDeJeu ?? 0) : 0;
  }
}

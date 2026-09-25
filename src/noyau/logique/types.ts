// Types du contrat entre le noyau et les strates : docs/architecture.md, §§ 3 à 7.

export type NumeroStrate = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Toute action du joueur : un objet sérialisable en JSON, discriminé par `type`. */
export interface ActionBase {
  type: string;
}

export interface LogiqueStrate<E, A extends ActionBase> {
  numero: NumeroStrate;

  /** Version du format de l'état ; augmente à chaque changement incompatible (D-005). */
  versionEtat: number;
  /** Migrations : `migrations[v]` transforme un état de version v en version v + 1. */
  migrations: Record<number, (etat: unknown) => unknown>;

  /** État à l'arrivée dans la strate. */
  etatInitial(ctx: ContexteArrivee): E;

  /** Avance le temps de `dt` secondes. Déterministe ; ne modifie que `etat`. */
  tick(etat: E, dt: number, ctx: ContexteTick): void;
  /** Plus grand pas de `tick` qui donne encore des résultats justes, en secondes. */
  pasMax: number;

  /** Applique une action du joueur. Déterministe ; ne modifie que `etat`. */
  agir(etat: E, action: A, ctx: ContexteTick): void;

  /** Où en est le seuil de fouille. */
  seuil(etat: E): EtatSeuil;

  /** Valeur convertible en points de fouille : toujours un cumul sur la strate (D-003). */
  valeurConvertible(etat: E): number;

  /** Leviers sur lesquels s'appliquent les multiplicateurs d'artefacts (D-002) ; null pour le fond. */
  leviers: Leviers | null;

  /** Politique hors-ligne (§9, D-005). */
  horsLigne: PolitiqueHorsLigne;
  /** Obligatoire quand `horsLigne.type` vaut « propre » : applique une absence de `duree` secondes. */
  absence?(etat: E, duree: number, ctx: ContexteTick): ResumeAbsence;

  /** Prépare l'état montré pendant la remontée finale (§11). Par défaut : `etatInitial`. */
  remontee?(etatSauvegarde: E, duree: number): E;

  /** Accroches de la Compréhension, pour les affichages débloqués par κ (phases 2 et 3). */
  graphe?(etat: E): GrapheDependances;
  formules?(): Formule[];
}

export interface EtatSeuil {
  atteint: boolean;
  /** Issue de la strate quand il y en a plusieurs (strate 6 : « soldee » ou « defaut »). */
  issue?: string;
  /** La descente se fait sans le joueur, sans écran de choix (strate 7). */
  automatique?: boolean;
}

export interface Leviers {
  principal: string;
  secondaires?: string[];
}

export type PolitiqueHorsLigne =
  | { type: "standard" } // 80 % de l'absence, plafonnée à 12 h, simulée par ticks
  | { type: "propre" } // la strate calcule elle-même l'absence (strates 6 et 7)
  | { type: "aucune" }; // le fond

export interface ResumeAbsence {
  /** Lignes déjà rédigées et formatées avec la notation propre à la strate. */
  lignes: string[];
}

export interface GrapheDependances {
  noeuds: { id: string; cle: string }[];
  liens: { de: string; vers: string }[];
}

export interface Formule {
  cle: string;
  expression: string;
}

// ——— Ce que le noyau fournit à la logique (§ 4)

export interface ContexteArrivee {
  /** Graine du générateur aléatoire de la strate. */
  graine: number;
  /** Le parcours jusqu'ici, en lecture seule. */
  journal: Readonly<Journal>;
}

export interface ContexteTick {
  /** Effets des artefacts actifs, après usure et plafond ×4 (D-002). */
  effets: EffetsActifs;
  /** Signale un événement au noyau. */
  emettre(evenement: EvenementStrate): void;
}

export interface EffetsActifs {
  /** Multiplicateur total sur un levier ; vaut 1 si aucun artefact n'agit dessus. */
  multiplicateur(levier: string): number;
  /** Un affichage, un raccourci ou un effet unique est-il actif ? */
  actif(effet: string): boolean;
}

/** Acte de compréhension : la strate le signale, le barème est appliqué par le noyau. */
export type EvenementStrate = { type: "acte"; acte: string };

// ——— La vue (§ 5)

export interface ProprietesVue<E, A extends ActionBase> {
  /** L'état de la strate, en lecture seule. */
  etat: Readonly<E>;
  /** Envoie une action ; elle est appliquée au début du tick suivant. */
  agir: (action: A) => void;
  /** Les commandes du noyau accessibles à la strate. */
  noyau: CommandesNoyau;
  /** Texte d'une clé, à travers la couche d'opacité. */
  o: (cle: string) => string;
  /** « remontee » pendant la fin « Remonter » : interface visible, rien à faire. */
  mode: "jeu" | "remontee";
}

export interface CommandesNoyau {
  /** Demande la descente. Le noyau la refuse tant que le seuil n'est pas atteint. */
  demanderFouille(): void;
  /** Ouvre l'aide de la strate ; le noyau note la consultation (acte « sans aide »). */
  ouvrirAide(): void;
  /** Termine la partie. Seulement au fond. */
  terminer(fin: "remonter" | "rester"): void;
}

/** Ce qu'exporte `src/strates/<strate>/index.ts`. */
export interface DefinitionStrate<E, A extends ActionBase> {
  logique: LogiqueStrate<E, A>;
  /** Le composant Svelte racine, typé en `unknown` pour que la logique n'importe pas Svelte. */
  vue: unknown;
  textes: Record<string, string>;
}

// ——— Le journal de partie (§ 7)

export interface Meta {
  journal: Journal;
  fin?: "remonter" | "rester";
}

export interface Journal {
  strates: EntreeJournal[];
}

export interface EntreeJournal {
  strate: NumeroStrate;
  /** Horodatage d'arrivée dans la strate (ms). */
  arrivee: number;
  /** Temps de jeu actif et temps d'absence compté, en secondes. */
  tempsDeJeu: number;
  tempsHorsLigne: number;
  aideConsultee: boolean;
  seuil?: { le: number; issue?: string };
  /** La fouille à la sortie de la strate (D-002). */
  fouille?: { points: number; emportes: string[]; abandonnes: string[] };
  /** Reculs d'horloge constatés, en secondes (D-005). */
  perturbations: { le: number; recul: number }[];
}

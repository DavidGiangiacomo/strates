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
  /**
   * Où en est la fissure du filet, pour une strate qui en tend un (`noyau/logique/filet.ts`) : 0 tant
   * qu'elle n'est pas apparue, puis de 0 à 1. Le noyau la lit quand le joueur creuse : creuser avant
   * elle, c'est creuser sans y avoir été poussé (docs/comprehension.md, § 2).
   */
  filet?(etat: E): number;

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

  /**
   * Accroches de la Compréhension, pour les affichages débloqués par κ (docs/comprehension.md, § 5) : le
   * graphe de dépendances de la strate dans cet état, et ses formules réelles, de la plus simple à la
   * plus profonde. Une strate dont le jeu est un graphe (le réseau, 4) n'y montre que ce que le joueur
   * a déjà trouvé : le graphe ne la résout pas à sa place.
   */
  graphe?(etat: E): GrapheDependances;
  formules?(): Formule[];
  /**
   * Les éléments d'interface opaques à l'arrivée, que la couche d'opacité du noyau lève par l'usage,
   * par un objet ou par le délai `L(κ)` (docs/comprehension.md, § 4). Sans elle, tout est lisible.
   */
  opacite?: readonly ElementOpaque[];

  /**
   * Un relevé de l'état, pour le journal de session des playtests (#26) : quelques grandeurs à plat,
   * celles que le protocole observe (docs/playtest-mvp.md, § 9). Le noyau ne les lit pas.
   */
  releve?(etat: E): Releve;

  /**
   * Les objets d'en haut que la strate a déjà nommés, par leur identifiant : l'inventaire du noyau
   * les montre sous leur nom d'en bas, et ils le gardent plus bas (docs/strates/descente-1-2.md, § 6 ;
   * bible, § 6). Elle peut citer des objets que le joueur n'a pas : le noyau ne garde que les siens.
   * Une strate qui ne l'implémente pas n'en nomme aucun.
   */
  nommes?(etat: E): readonly string[];

  /**
   * Le rappel de reprise (bible, § 10 ; #58) : deux lignes au plus, dans la voix et la notation de la
   * strate. La dernière ligne qu'elle a écrite, puis où en est son seuil, sans rien dire que le joueur
   * n'ait déjà lu : ni indice, ni « vous ». Le noyau les fait précéder du lieu. Une strate qui ne
   * l'implémente pas ne rappelle que le lieu.
   */
  rappel?(etat: E): readonly string[];
}

/** Un relevé : des valeurs simples, sérialisables en JSON. */
export type Releve = Record<string, number | string | boolean | null>;

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

/**
 * Un élément d'interface opaque à l'arrivée : un nom, une valeur ou un rôle (docs/comprehension.md,
 * § 4). Il se lève de trois façons, la première venue l'emportant : par l'usage, par un objet, ou par
 * le délai. Levé, il le reste.
 */
export interface ElementOpaque {
  /**
   * Son nom : la strate le donne quand elle le lève par l'usage (`{ type: "levee", element }`), et la
   * vue le demande à la couche (`lisible`) pour ce qui ne s'écrit pas, un trait ou une jauge.
   */
  id: string;
  /** Les clés de texte qu'il couvre : tant qu'il est opaque, `o(cle)` rend des glyphes à leur place. */
  cles?: readonly string[];
  /** Les objets d'en haut qui le lèvent dès l'arrivée, s'ils agissent ici, puissants ou utiles. */
  objets?: readonly string[];
  /**
   * La part du délai `L(κ)` au bout de laquelle il se lève de lui-même : 1 par défaut, moins pour ce
   * qui se comprend plus vite. null : jamais par le délai, seulement par l'usage ou par un objet.
   */
  delai?: number | null;
}

export interface GrapheDependances {
  /** Les éléments de la strate : `cle` est la clé de texte de leur nom, lue à travers l'opacité. */
  noeuds: { id: string; cle: string }[];
  /** `de` alimente `vers`. */
  liens: { de: string; vers: string }[];
}

/** Une formule réelle, attachée à un nœud du graphe (docs/comprehension.md, § 5). */
export interface Formule {
  /** Le nœud où elle s'affiche, dès qu'il est compris : levé, s'il était opaque. */
  noeud: string;
  /** La formule, écrite par la strate dans sa notation. */
  expression: string;
}

// ——— Ce que le noyau fournit à la logique (§ 4)

export interface ContexteArrivee {
  /** Graine du générateur aléatoire de la strate. */
  graine: number;
  /** Le parcours jusqu'ici, en lecture seule. */
  journal: Readonly<Journal>;
  /**
   * Les effets des artefacts à l'arrivée : de quoi écrire, dès la première page, ce qui agit déjà.
   * Le noyau les fournit toujours ; absents, aucun objet n'agit (tests, simulateur).
   */
  effets?: EffetsActifs;
}

export interface ContexteTick {
  /** Effets des artefacts actifs, après usure et plafond ×4 (D-002). */
  effets: EffetsActifs;
  /** Signale un événement au noyau. */
  emettre(evenement: EvenementStrate): void;
}

export interface EffetsActifs {
  /** Multiplicateur total sur un levier, après usure et plafond ; vaut 1 si aucun artefact n'agit dessus. */
  multiplicateur(levier: string): number;
  /**
   * Comment agit un objet, par son identifiant (« s1-serveur ») : puissant ou utile, ou null s'il
   * n'agit pas ici (non possédé, décoratif, inerte ou inconnu). C'est ainsi qu'une strate reçoit un
   * affichage, un raccourci ou un effet unique ; elle ignore les objets qu'elle ne connaît pas.
   */
  niveau(artefact: string): "puissant" | "utile" | null;
}

/**
 * Ce que la strate signale au noyau :
 * - un acte de compréhension, dont le barème est appliqué par le noyau ;
 * - une levée : le joueur a pu comprendre un élément opaque de la strate, à l'usage ;
 * - une trace, pour le journal de session des playtests (#26) : ce qu'elle écrit au joueur (un
 *   objectif atteint, une ligne de registre), ou un moment qu'il faut dater (le premier jour d'un hiver).
 */
export type EvenementStrate =
  | { type: "acte"; acte: string }
  | { type: "levee"; element: string }
  | { type: "trace"; cle: string; valeurs?: Record<string, number>; objet?: string };

// ——— La vue (§ 5)

export interface ProprietesVue<E, A extends ActionBase> {
  /** L'état de la strate, en lecture seule. */
  etat: Readonly<E>;
  /** Envoie une action ; elle est appliquée au début du tick suivant. */
  agir: (action: A) => void;
  /** Les commandes du noyau accessibles à la strate. */
  noyau: CommandesNoyau;
  /** Texte d'une clé, à travers la couche d'opacité : des glyphes, tant que son élément est opaque. */
  o: (cle: string) => string;
  /** Un élément déclaré dans `opacite` est-il levé ? Un élément que la strate ne déclare pas l'est. */
  lisible: (element: string) => boolean;
  /** « remontee » pendant la fin « Remonter » : interface visible, rien à faire. */
  mode: "jeu" | "remontee";
  /** Ce que la strate fait entendre, par le moteur audio du noyau : ses sons, ses voix, ses notes. */
  son: SonStrate;
}

export interface CommandesNoyau {
  /** Demande la descente. Le noyau la refuse tant que le seuil n'est pas atteint. */
  demanderFouille(): void;
  /**
   * La strate ouvre son aide, qu'elle affiche elle-même ; le noyau note la consultation (acte
   * « sans aide »).
   */
  ouvrirAide(): void;
  /** Termine la partie. Seulement au fond. */
  terminer(fin: "remonter" | "rester"): void;
}

// ——— Le son (§ 5, #46)

/**
 * Ce que la vue d'une strate fait entendre, par le moteur audio du noyau. Les sons viennent de la
 * banque de la strate (`DefinitionStrate.sons`) ; les voix et les notes sont synthétisées.
 * - Les ambiances et les voix se règlent : la vue dit ce qui doit sonner, à chaque changement, et le
 *   moteur s'y rend en douceur. Elles se taisent d'elles-mêmes au démontage de la vue.
 * - Les effets et les notes se jouent une fois.
 * - Avant le premier geste du joueur, aucun navigateur ne joue de son : un effet ou une note demandés
 *   alors sont perdus ; les ambiances et les voix partent au premier geste.
 * - Un appel ne lève jamais d'erreur, même son coupé ou sans Web Audio.
 */
export interface SonStrate {
  /** Joue une fois l'effet `nom` de la banque. */
  jouer(nom: string, reglage?: ReglageEffet): void;
  /** Règle l'ambiance `nom` de la banque, jouée en boucle : elle part à un volume non nul, et s'arrête à 0. */
  ambiance(nom: string, reglage: ReglageAmbiance): void;
  /**
   * Règle la voix tenue `id`, de synthèse : elle naît à un volume non nul, glisse vers chaque nouveau
   * réglage, et s'éteint à 0. Deux voix presque justes battent d'elles-mêmes : rien n'est simulé.
   */
  voix(id: string, reglage: ReglageVoix): void;
  /** Joue une note de synthèse, ou un accord : une note sur chaque rapport de la fréquence. */
  note(reglage: ReglageNote): void;
}

export interface ReglageEffet {
  /** De 0 à 1 ; 1 par défaut. */
  volume?: number;
  /** Vitesse de lecture : 2 joue l'effet une octave plus haut, deux fois plus court ; 1 par défaut. */
  vitesse?: number;
  /** De −1 (à gauche) à 1 (à droite) ; 0 par défaut. */
  panoramique?: number;
  /** Délai avant de jouer, en secondes : pour caler des effets entre eux, à l'échantillon près. */
  dans?: number;
  /** Coupe l'effet après `duree` secondes, par un bref fondu ; sans elle, il se joue en entier. */
  duree?: number;
}

export interface ReglageAmbiance {
  /** De 0 à 1. À 0, l'ambiance s'arrête, à la fin du fondu. */
  volume: number;
  /** Durée du fondu vers ce volume, en secondes ; 1 par défaut. */
  fondu?: number;
}

/** Une voyelle chantée (`a`, `e`, `i`, `o`, `ou`), ou une onde simple. */
export type Timbre = "a" | "e" | "i" | "o" | "ou" | "sinus" | "triangle";

export interface ReglageVoix {
  /** La hauteur, en hertz. */
  frequence: number;
  /** De 0 à 1. À 0, la voix s'éteint. */
  volume: number;
  /** Le timbre, fixé à la naissance de la voix ; `sinus` par défaut. */
  timbre?: Timbre;
  /** Temps pour rejoindre la nouvelle hauteur et le nouveau volume, en secondes ; 0,05 par défaut. */
  glissement?: number;
  /** La respiration : une lente houle du volume, de 0 (aucune, par défaut) à 1 (profonde). */
  souffle?: number;
  /** De −1 (à gauche) à 1 (à droite) ; 0 par défaut. */
  panoramique?: number;
}

export interface ReglageNote {
  /** La hauteur, en hertz : la fondamentale de l'accord. */
  frequence: number;
  /** Un accord : une note sur chaque rapport de la fréquence (`[1, 5 / 4, 3 / 2]`) ; `[1]` par défaut. */
  rapports?: readonly number[];
  /** Durée de la note, attaque comprise, en secondes. */
  duree: number;
  /** De 0 à 1, pour chaque note de l'accord ; 1 par défaut. */
  volume?: number;
  /** `sinus` par défaut. */
  timbre?: Timbre;
  /** Durée de l'attaque, en secondes ; 0,01 par défaut. Ensuite, la note s'éteint peu à peu. */
  attaque?: number;
  /** De −1 (à gauche) à 1 (à droite) ; 0 par défaut. */
  panoramique?: number;
  /** Délai avant de jouer, en secondes. */
  dans?: number;
}

/** Un son de la banque d'une strate : un fichier, ou des échantillons calculés. */
export type SourceSon = SonFichier | SonCalcule;

export interface SonFichier {
  /** L'adresse du fichier, donnée par Vite : `import vent from "./sons/vent.ogg"`. */
  fichier: string;
}

export interface SonCalcule {
  /** Durée, en secondes. */
  duree: number;
  /** Deux canaux, plutôt qu'un. */
  stereo?: boolean;
  /**
   * La fréquence d'échantillonnage du calcul, en hertz ; celle du contexte par défaut. Une rumeur
   * sans aigus se calcule à moindre coût plus bas : le navigateur la rééchantillonne à la lecture.
   */
  frequence?: number;
  /**
   * Écrit les échantillons, de −1 à 1, dans `canaux` (un tableau par canal), à `frequence`
   * échantillons par seconde. Appelé une fois, quand le son est demandé ou que vient son tour.
   * Un long calcul cède la main : écrit en générateur (`*calculer`), il s'arrête à chaque `yield`,
   * et le moteur le poursuit à la tâche suivante, sans figer l'image.
   */
  calculer(canaux: Float32Array[], frequence: number): void | Iterator<unknown>;
  /**
   * Pour une ambiance : fond la fin du son dans son début, sur `raccord` secondes, pour qu'il boucle
   * sans couture. Le son en est raccourci d'autant.
   */
  raccord?: number;
}

/** Ce qu'exporte `src/strates/<strate>/index.ts`. */
export interface DefinitionStrate<E, A extends ActionBase> {
  logique: LogiqueStrate<E, A>;
  /** Le composant Svelte racine, typé en `unknown` pour que la logique n'importe pas Svelte. */
  vue: unknown;
  /** Les textes de la strate. `fouille.valeur` nomme sa valeur convertible à l'écran de fouille. */
  textes: Record<string, string>;
  /**
   * Écrit une valeur convertible dans la notation de la strate, pour l'écran de fouille : seule la
   * strate la connaît (I1). Sans elle, l'écran écrit le nombre entier, sans unité.
   */
  formaterValeur?(valeur: number): string;
  /**
   * Les glyphes que la couche d'opacité met à la place des textes encore opaques, dans le style de
   * la strate. Sans eux, ceux du noyau.
   */
  glyphes?: string;
  /**
   * L'apparence de la valeur convertible à l'écran de fouille : écrite dans la police et les
   * couleurs de la strate, elle en est le dernier fragment (docs/strates/descente-1-2.md, P3). Sans
   * elle, la valeur prend la police du noyau.
   */
  apparenceValeur?: ApparenceValeur;
  /**
   * La banque de sons de la strate, que sa vue joue par `son` : le noyau la charge au montage de la
   * vue, et la libère au démontage. Aucun son n'est commun à deux strates (§ 12).
   */
  sons?: Readonly<Record<string, SourceSon>>;
}

/** Des valeurs CSS, prises dans la palette de la strate. */
export interface ApparenceValeur {
  police: string;
  couleur: string;
  fond: string;
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
  /** Les actes de compréhension accomplis dans la strate, une fois chacun (docs/comprehension.md). */
  actes: string[];
  /** Le κ que ces actes ont rapporté, crédité à la descente (à l'arrivée, pour le fond). */
  kappaGagne?: number;
  /** Les éléments opaques que le joueur a levés à l'usage, une fois chacun (docs/comprehension.md). */
  leves: string[];
  /** Les objets d'en haut que la strate a nommés, notés à la descente : ils gardent ce nom plus bas. */
  nommes: string[];
  seuil?: { le: number; issue?: string };
  /** La fouille à la sortie de la strate (D-002). */
  fouille?: { points: number; emportes: string[]; abandonnes: string[] };
  /** Reculs d'horloge constatés, en secondes (D-005). */
  perturbations: { le: number; recul: number }[];
}

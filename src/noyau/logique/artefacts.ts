// La conversion en artefacts (D-002, docs/artefacts.md) : les points de fouille, l'usure, le plafond
// × 4, la présélection et la fouille notée au journal. Elle se fait dans le noyau, jamais dans les
// strates (§15) : une strate ne connaît que ses leviers, et lit les effets par `EffetsActifs`.
import { CATALOGUE } from "./catalogue";
import type { EtatNoyau } from "./etat";
import type { EffetsActifs, Leviers, NumeroStrate } from "./types";

export type Famille = "multiplicateur" | "affichage" | "raccourci" | "unique";

/**
 * Un multiplicateur vise le levier principal de la strate d'arrivée, ou son premier levier secondaire
 * (le principal si elle n'en a pas). Les autres familles sont décrites ici, et codées par la strate
 * d'arrivée, qui les reconnaît à l'identifiant de l'objet (docs/artefacts.md, § 4).
 */
export type Effet =
  { levier: "principal" | "secondaire"; facteur: number } | { description: string };

export interface ArtefactDef {
  /** Identifiant stable, préfixé par la strate d'origine : « s1-turbine ». */
  id: string;
  /** La strate où l'objet est emporté. */
  origine: Exclude<NumeroStrate, 8>;
  /** Le nom dans la strate d'origine, affiché à l'écran de choix. */
  nomDHaut: string;
  /** Le nom donné par la strate suivante, affiché une fois descendu. */
  nomDEnBas: string;
  /** En points de fouille, entier ≥ 1. */
  cout: number;
  famille: Famille;
  effet: { puissant: Effet; utile: Effet };
}

/** L'usure d'un objet : puissant, utile, décoratif, puis inerte (docs/artefacts.md, § 3). */
export type Niveau = "puissant" | "utile" | "decoratif" | "inerte";

/** Au-delà, le noyau réduit tous les multiplicateurs dans la même proportion (I2). */
export const PLAFOND_MULTIPLICATEURS = 4;

// Tolérance pour les arrondis vers le bas : log₁₀(10¹⁵) × 1,4 ne doit pas donner 20,999…
const EPSILON = 1e-9;

/** Les points de fouille d'une valeur convertible : ⌊log₁₀(valeur) × 1,4⌋, et 0 sous 1 (D-002). */
export function pointsDeFouille(valeur: number): number {
  if (!Number.isFinite(valeur) || valeur < 1) return 0;
  return Math.floor(Math.log10(valeur) * 1.4 + EPSILON);
}

/**
 * La plus petite valeur convertible qui donne `points` points de fouille. L'écran de fouille montre
 * celle du point suivant : c'est ainsi que le taux s'affiche franchement (docs/strates/descente-1-2.md, P3).
 */
export function valeurPourPoints(points: number): number {
  return points <= 0 ? 0 : 10 ** (points / 1.4);
}

/** Le niveau d'usure d'un objet à une profondeur, ou null tant qu'il n'est pas descendu. */
export function niveauUsure(origine: number, profondeur: number): Niveau | null {
  const niveau = profondeur - origine;
  if (niveau <= 0) return null;
  return niveau === 1 ? "puissant" : niveau === 2 ? "utile" : niveau === 3 ? "decoratif" : "inerte";
}

/** Un multiplicateur utile : réduit de moitié, × m devient × (1 + (m − 1) / 2). */
export function facteurUtile(facteur: number): number {
  return 1 + (facteur - 1) / 2;
}

export function artefact(id: string, catalogue = CATALOGUE): ArtefactDef | undefined {
  return catalogue.find((a) => a.id === id);
}

/** Le catalogue d'une strate d'origine, dans l'ordre de la table. */
export function catalogueDe(origine: number, catalogue = CATALOGUE): ArtefactDef[] {
  return catalogue.filter((a) => a.origine === origine);
}

/** Les effets actifs, avec ce que l'interface doit en savoir. */
export interface Effets extends EffetsActifs {
  /** Le plafond × 4 a-t-il réduit les multiplicateurs ? L'interface l'indique (docs/artefacts.md, § 5). */
  plafonne: boolean;
}

/**
 * Les effets des objets possédés, à une profondeur, pour une strate qui déclare `leviers` : usure,
 * puis plafond × 4. Les identifiants inconnus du catalogue sont ignorés. Au fond, sans leviers, aucun
 * multiplicateur n'agit.
 */
export function effetsActifs(
  possedes: readonly string[],
  profondeur: number,
  leviers: Leviers | null,
  catalogue = CATALOGUE,
): Effets {
  const niveaux = new Map<string, "puissant" | "utile">();
  const multiplicateurs: { levier: string; facteur: number }[] = [];

  for (const id of new Set(possedes)) {
    const def = artefact(id, catalogue);
    const niveau = def && niveauUsure(def.origine, profondeur);
    if (!def || (niveau !== "puissant" && niveau !== "utile")) continue;
    niveaux.set(id, niveau);
    const effet = def.effet[niveau];
    if ("levier" in effet && leviers) {
      const levier =
        effet.levier === "secondaire"
          ? (leviers.secondaires?.[0] ?? leviers.principal)
          : leviers.principal;
      multiplicateurs.push({ levier, facteur: effet.facteur });
    }
  }

  // Le plafond × 4 : chaque × m devient × m^α, avec α = ln 4 / ln P (I2).
  const produit = multiplicateurs.reduce((p, m) => p * m.facteur, 1);
  const plafonne = produit > PLAFOND_MULTIPLICATEURS;
  const alpha = plafonne ? Math.log(PLAFOND_MULTIPLICATEURS) / Math.log(produit) : 1;
  const parLevier = new Map<string, number>();
  for (const { levier, facteur } of multiplicateurs) {
    parLevier.set(levier, (parLevier.get(levier) ?? 1) * facteur ** alpha);
  }

  return {
    multiplicateur: (levier) => parLevier.get(levier) ?? 1,
    niveau: (id) => niveaux.get(id) ?? null,
    plafonne,
  };
}

/** Le catalogue d'une strate d'origine par coût croissant, comme l'écran de choix. À coût égal, l'ordre de la table. */
export function catalogueParCout(origine: number, catalogue = CATALOGUE): ArtefactDef[] {
  return catalogueDe(origine, catalogue).sort((a, b) => a.cout - b.cout);
}

/**
 * La présélection de l'écran de choix : les objets les moins chers d'abord, tant que les points
 * suffisent (docs/artefacts.md, § 6). À coût égal, l'ordre de la table.
 */
export function preselection(points: number, origine: number, catalogue = CATALOGUE): string[] {
  const choix: string[] = [];
  let reste = points;
  for (const def of catalogueParCout(origine, catalogue)) {
    if (def.cout > reste) break;
    choix.push(def.id);
    reste -= def.cout;
  }
  return choix;
}

/** Ce que la fouille laisse au journal de la strate quittée (D-002). */
export interface Fouille {
  points: number;
  emportes: string[];
  abandonnes: string[];
}

/**
 * Vérifie un choix d'objets : tous du catalogue de la strate quittée, sans doublon, et dans les
 * points. Renvoie la fouille à noter, ou lève une erreur qui dit ce qui ne va pas.
 */
export function verifierChoix(
  points: number,
  origine: number,
  emportes: readonly string[],
  catalogue = CATALOGUE,
): Fouille {
  const offerts = catalogueDe(origine, catalogue);
  let cout = 0;
  for (const id of emportes) {
    const def = offerts.find((a) => a.id === id);
    if (!def) throw new Error(`« ${id} » n'est pas au catalogue de la strate ${origine}.`);
    cout += def.cout;
  }
  if (new Set(emportes).size !== emportes.length) {
    throw new Error("Un objet ne s'emporte qu'une fois.");
  }
  if (cout > points) {
    throw new Error(`Le choix coûte ${cout} points de fouille, pour ${points} disponibles.`);
  }
  return {
    points,
    emportes: [...emportes],
    abandonnes: offerts.filter((a) => !emportes.includes(a.id)).map((a) => a.id),
  };
}

/**
 * Une fouille ouverte : ce que montre l'écran de fouille, avant que le joueur ne choisisse
 * (docs/strates/descente-1-2.md, § 4). Rien n'en est noté tant qu'il n'a pas choisi.
 */
export interface FouilleOuverte {
  /** La strate quittée. */
  strate: NumeroStrate;
  /** Sa valeur convertible, lue à l'ouverture. */
  valeur: number;
  points: number;
  /** La valeur qu'il faudrait pour un point de plus : le taux, affiché franchement. */
  pointSuivant: number;
  /** Le catalogue de la strate quittée, par coût croissant. */
  catalogue: ArtefactDef[];
  /** La présélection : les moins chers d'abord, tant que les points suffisent. */
  preselection: string[];
}

/** Ouvre la fouille d'une strate de valeur convertible `valeur`. */
export function ouvrirFouille(
  strate: NumeroStrate,
  valeur: number,
  catalogue = CATALOGUE,
): FouilleOuverte {
  const points = pointsDeFouille(valeur);
  return {
    strate,
    valeur,
    points,
    pointSuivant: valeurPourPoints(points + 1),
    catalogue: catalogueParCout(strate, catalogue),
    preselection: preselection(points, strate, catalogue),
  };
}

/**
 * La fouille de la strate courante : le choix est vérifié, noté au journal de la strate (points,
 * objets emportés, objets abandonnés), et les objets emportés rejoignent les artefacts. La descente
 * elle-même (la Profondeur, la strate suivante) appartient au noyau (`Noyau.descendre`).
 */
export function fouiller(etat: EtatNoyau, points: number, emportes: readonly string[]): Fouille {
  const entree = etat.meta.journal.strates.at(-1);
  if (entree?.strate !== etat.profondeur) {
    throw new Error(`Le journal n'a pas d'entrée pour la strate ${etat.profondeur}.`);
  }
  if (entree.fouille) throw new Error(`La strate ${etat.profondeur} a déjà été fouillée.`);
  const fouille = verifierChoix(points, etat.profondeur, emportes);
  entree.fouille = fouille;
  for (const id of fouille.emportes) if (!etat.artefacts.includes(id)) etat.artefacts.push(id);
  return fouille;
}

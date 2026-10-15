// La Compréhension (κ) : le barème des actes, appliqué par le noyau et jamais par les strates, qui ne
// font que signaler leurs actes (docs/comprehension.md, § 2 ; décision D-007).
import type { NumeroStrate } from "./types";

/** κ va de 0 à 100. */
export const KAPPA_MAX = 100;

/** Atteindre le seuil sans avoir ouvert l'aide de la strate : le noyau le constate au seuil. */
export const SANS_AIDE = "sans-aide";
/** Atteindre le seuil sans aucun artefact actif, puissant ou utile : le noyau le constate à la descente. */
export const SANS_ARTEFACT = "sans-artefact";
/** Arriver au fond : le fond n'a pas de descente, cet acte est crédité dès l'arrivée. */
export const ARRIVEE = "arrivee";
/**
 * Creuser avant que la fissure du filet n'apparaisse, sans y avoir été poussé : le noyau le constate
 * quand le joueur ouvre la fouille, sur le filet que la strate lui montre (`LogiqueStrate.filet`).
 */
export const CREUSER_AVANT_FISSURE = "creuser-avant-fissure";

/** Pour chaque strate, ses actes et leur poids, en points de κ. */
export type Bareme = Readonly<Record<NumeroStrate, Readonly<Record<string, number>>>>;

/**
 * Le barème de docs/comprehension.md, § 2. Les actes génériques sont constatés par le noyau ; les
 * autres, la strate les signale par un événement `{ type: "acte" }`. Les actes propres des strates 3
 * à 7 viendront avec leurs fiches.
 */
export const BAREME: Bareme = {
  1: { [SANS_AIDE]: 3, [CREUSER_AVANT_FISSURE]: 5 },
  2: {
    [SANS_AIDE]: 3,
    [SANS_ARTEFACT]: 3,
    "premier-hiver": 3,
    "annee-sans-achat-d-automne": 2,
    "seuil-au-plus-tot": 3,
  },
  3: { [SANS_AIDE]: 4, [SANS_ARTEFACT]: 3 },
  4: { [SANS_AIDE]: 4, [SANS_ARTEFACT]: 3 },
  5: { [SANS_AIDE]: 4, [SANS_ARTEFACT]: 3 },
  6: { [SANS_AIDE]: 3, [SANS_ARTEFACT]: 3 },
  7: { [SANS_AIDE]: 2, [SANS_ARTEFACT]: 3 },
  8: { [ARRIVEE]: 4 },
};

/**
 * Ce que chaque strate peut donner au plus, si tous ses actes sont accomplis : la progression du §9
 * (0 → 8 → 22 → 38 → 55 → 70 → 85 → 96 → 100).
 */
export const PROGRESSION: Readonly<Record<NumeroStrate, number>> = {
  1: 8,
  2: 14,
  3: 16,
  4: 17,
  5: 15,
  6: 15,
  7: 11,
  8: 4,
};

/** Le poids d'un acte dans une strate, ou null si le barème ne le connaît pas. */
export function poidsActe(bareme: Bareme, strate: NumeroStrate, acte: string): number | null {
  const actes = bareme[strate];
  return Object.hasOwn(actes, acte) ? actes[acte]! : null;
}

/** Le gain des actes accomplis dans une strate : chacun compte une fois, et un acte inconnu ne vaut rien. */
export function gainDesActes(
  bareme: Bareme,
  strate: NumeroStrate,
  actes: readonly string[],
): number {
  let gain = 0;
  for (const acte of new Set(actes)) gain += poidsActe(bareme, strate, acte) ?? 0;
  return gain;
}

// ——— Les paliers (docs/comprehension.md, § 3)

/** Le graphe de dépendances s'ouvre depuis le bandeau à partir de κ = 50. */
export const SEUIL_GRAPHE = 50;

/** Les formules réelles viennent avec le graphe : à κ = 50, aucune encore, puis une à une. */
export const SEUIL_FORMULES = 50;

/**
 * Combien des `nombre` formules d'une strate sont accessibles à κ : les ⌈n × (κ − 50) / 50⌉ premières,
 * de la plus simple à la plus profonde. Aucune à κ = 50, 40 % à κ = 70, 70 % à κ = 85, toutes à
 * κ = 100 (docs/comprehension.md, § 3 et § 5).
 */
export function formulesAccessibles(kappa: number, nombre: number): number {
  const k = Math.min(KAPPA_MAX, Math.max(SEUIL_FORMULES, kappa));
  // Le produit d'abord : à κ entier, le quotient est exact quand il tombe juste.
  return Math.ceil((nombre * (k - SEUIL_FORMULES)) / (KAPPA_MAX - SEUIL_FORMULES));
}

/** Le délai de levée à κ = 0, en secondes de strate : environ 20 minutes pour comprendre une strate. */
export const DELAI_LEVEE_MAX = 20 * 60;
/** Ce qu'il en reste à κ = 100 : 3 minutes sur 20. */
const RAPPORT_LEVEE = 0.15;

/**
 * Le délai au bout duquel un élément encore opaque se lève de lui-même, en secondes de strate :
 * `L(κ) = 20 × 0,15^(κ/100)` minutes, soit 20 minutes à κ = 0, 8 à κ = 50 et 3 à κ = 100 (§8).
 */
export function delaiLevee(kappa: number): number {
  const k = Math.min(KAPPA_MAX, Math.max(0, kappa));
  return DELAI_LEVEE_MAX * RAPPORT_LEVEE ** (k / KAPPA_MAX);
}

/** κ après un gain : il ne descend jamais, et ne dépasse jamais 100. */
export function crediter(kappa: number, gain: number): number {
  return Math.max(kappa, Math.min(KAPPA_MAX, kappa + gain));
}

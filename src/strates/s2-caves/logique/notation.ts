// La notation des caves (I1 ; docs/strates/strate-2.md, § 1) : des nombres entiers, jamais abrégés,
// les milliers séparés par une espace fine. Pas de suffixe, pas de décimale, pas de secondes.
// Elle sert à la vue, et au résumé d'absence que la logique rédige elle-même.

/** Espace insécable, entre le nombre et son unité. */
const INSECABLE = "\u00a0";
/** Espace fine insécable, séparateur des milliers. */
const FINE = "\u202f";

// Tolérance pour les arrondis vers le bas : 1,2 × 100 ne doit pas donner 119.
const EPSILON = 1e-9;

/** Un entier, arrondi vers le bas : on n'affiche jamais du grain qu'on n'a pas. « 24 038 ». */
export function formaterEntier(x: number): string {
  if (!Number.isFinite(x) || x < 0) return "—";
  return String(Math.floor(x + EPSILON)).replace(/\B(?=(\d{3})+(?!\d))/g, FINE);
}

/** Le pluriel français : singulier pour 0 et 1 ; « boisseau » devient « boisseaux ». */
export function pluriel(n: number, mot: string): string {
  if (Math.floor(n + EPSILON) < 2) return mot;
  return mot.endsWith("eau") ? `${mot}x` : `${mot}s`;
}

/** Un nombre et son unité : « 24 038 boisseaux », « 1 boisseau », « 81 jours ». */
export function formaterQuantite(x: number, mot: string): string {
  return `${formaterEntier(x)}${INSECABLE}${pluriel(x, mot)}`;
}

export function formaterBoisseaux(x: number): string {
  return formaterQuantite(x, "boisseau");
}

/**
 * Remplit un texte : `{nom}` devient le nombre, `{nom:mot}` le nombre suivi du mot accordé.
 * « Départs : {departs:famille}. » donne « Départs : 18 familles. »
 */
export function remplir(texte: string, valeurs: Readonly<Record<string, number>>): string {
  return texte.replace(/\{(\w+)(?::([\p{L}]+))?\}/gu, (tout, cle: string, mot?: string) => {
    const valeur = valeurs[cle];
    if (valeur === undefined) return tout;
    return mot ? formaterQuantite(valeur, mot) : formaterEntier(valeur);
  });
}

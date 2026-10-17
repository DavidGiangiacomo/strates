// La notation de l'atelier (I1 ; docs/strates/strate-3.md, § 1) : la base douze, en chiffres. Après 9
// viennent ↊ (dix) et ↋ (onze), puis 10, une douzaine ; 100 est une grosse, 1 000 une grande grosse.
// Les chiffres se groupent par trois, séparés par une espace fine. Des nombres entiers, sans suffixe
// ni décimale. Aucune autre strate ne compte ainsi.

/** Les douze chiffres : ↊ et ↋ sont un 2 et un 3 retournés. */
export const CHIFFRES = "0123456789↊↋";
/** Espace insécable, entre le nombre et son unité. */
const INSECABLE = " ";
/** Espace fine insécable, entre deux groupes de trois chiffres. */
const FINE = " ";

// Tolérance pour les arrondis vers le bas : une somme de pas ne doit pas perdre une pièce.
const EPSILON = 1e-9;

/** Les chiffres en base douze d'un entier positif, sans groupes : 58 donne « 4↊ ». */
export function chiffres(n: number): string {
  if (n === 0) return "0";
  let reste = n;
  let ecrit = "";
  while (reste > 0) {
    ecrit = CHIFFRES[reste % 12] + ecrit;
    reste = Math.floor(reste / 12);
  }
  return ecrit;
}

/** Un entier, arrondi vers le bas, en base douze : « 4↊ 643 232 628 ». */
export function formaterEntier(x: number): string {
  if (!Number.isFinite(x) || x < 0) return "—";
  const ecrit = chiffres(Math.floor(x + EPSILON));
  const groupes: string[] = [];
  for (let fin = ecrit.length; fin > 0; fin -= 3) {
    groupes.unshift(ecrit.slice(Math.max(0, fin - 3), fin));
  }
  return groupes.join(FINE);
}

/** Le pluriel français, décidé sur la valeur : singulier pour 0 et 1. */
export function pluriel(n: number, mot: string): string {
  return Math.floor(n + EPSILON) < 2 ? mot : `${mot}s`;
}

/** Un nombre et son unité : « 53 cases », « 1 pièce ». */
export function formaterQuantite(x: number, mot: string): string {
  return `${formaterEntier(x)}${INSECABLE}${pluriel(x, mot)}`;
}

/** La valeur convertible à l'écran de fouille : les pièces produites. */
export function formaterPieces(x: number): string {
  return formaterQuantite(x, "pièce");
}

/**
 * Remplit un texte : `{nom}` devient le nombre, `{nom:mot}` le nombre suivi du mot accordé, tous deux
 * en base douze. « Il reste {cases:case}. » donne « Il reste 53 cases. » pour 63 cases.
 */
export function remplir(texte: string, valeurs: Readonly<Record<string, number>>): string {
  return texte.replace(/\{(\w+)(?::([\p{L}]+))?\}/gu, (tout, cle: string, mot?: string) => {
    const valeur = valeurs[cle];
    if (valeur === undefined) return tout;
    return mot ? formaterQuantite(valeur, mot) : formaterEntier(valeur);
  });
}

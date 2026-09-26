// La notation de tableau de bord, propre à la surface (I1 ; docs/strates/strate-1.md, § 1).
// Aucune autre strate n'emploie les suffixes k, M et Md.

/** Espace insécable, entre le nombre et son unité ou son suffixe. */
const INSECABLE = " ";
/** Espace fine insécable, séparateur des milliers. */
const FINE = " ";

const SUFFIXES = [
  { valeur: 1e9, suffixe: "Md" },
  { valeur: 1e6, suffixe: "M" },
  { valeur: 1e3, suffixe: "k" },
] as const;

// Tolérance pour les arrondis vers le bas : 1,2 × 100 ne doit pas donner 119,99…
const EPSILON = 1e-9;

/** Tronque à `decimales` chiffres après la virgule, sans jamais arrondir vers le haut. */
function tronquer(x: number, decimales: number): string {
  const facteur = 10 ** decimales;
  return (Math.floor(x * facteur + EPSILON) / facteur).toFixed(decimales).replace(".", ",");
}

/** Trois chiffres significatifs : « 3,05 », « 12,4 », « 847 ». */
function troisChiffres(x: number): string {
  return tronquer(x, x >= 100 ? 0 : x >= 10 ? 1 : 2);
}

function grouper(entier: number): string {
  return String(Math.floor(entier)).replace(/\B(?=(\d{3})+(?!\d))/g, FINE);
}

/** Le nombre seul, avec suffixe au-delà de 1 000 ; `petit` formate ce qui reste en dessous. */
function formater(x: number, petit: (x: number) => string): string {
  if (!Number.isFinite(x) || x < 0) return "—";
  // Au-delà de 999 Md, le tableau de bord n'a pas prévu plus grand : « 1 240 Md ».
  if (x >= 1e12) return `${grouper(x / 1e9)}${INSECABLE}Md`;
  for (const { valeur, suffixe } of SUFFIXES) {
    // Tronqué, le nombre ne doit jamais dépasser 999 dans une unité : 999 999 s'écrit « 999 k ».
    if (x >= valeur) return `${troisChiffres(x / valeur)}${INSECABLE}${suffixe}`;
  }
  return petit(x);
}

/** Un montant : « 847 cr », « 12,4 k cr », « 1,20 Md cr ». En dessous de 1 000, un entier. */
export function formaterMontant(x: number): string {
  return `${formater(x, (n) => String(Math.floor(n + EPSILON)))}${INSECABLE}cr`;
}

/** Un débit : « 0,25 cr/s », « 12,4 cr/s », « 3,05 M cr/s ». */
export function formaterDebit(x: number): string {
  return `${formater(x, troisChiffres)}${INSECABLE}cr/s`;
}

/** Un facteur ou une part : « 1,5 », « 2 ». */
export function formaterNombre(x: number): string {
  return String(x).replace(".", ",");
}

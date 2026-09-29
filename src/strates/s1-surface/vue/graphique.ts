// L'échelle du graphique de production (fiche, § 5 et § 6) : linéaire, et son haut suit le maximum
// de la fenêtre. La courbe finit donc toujours en haut à droite, et ce sont les repères qui glissent.

/** L'air laissé au-dessus du maximum, pour que la courbe ne touche pas le bord de la carte. */
const AIR = 1.1;

/** Le haut du graphique ; 1 tant que la production est nulle. */
export function hautGraphique(points: readonly number[]): number {
  const max = Math.max(0, ...points);
  return max > 0 ? max * AIR : 1;
}

/** Les pas ronds possibles, dans chaque puissance de 10. */
const PAS = [1, 2, 2.5, 5, 10];

/**
 * Les repères horizontaux : des valeurs rondes (1, 2, 2,5 ou 5 × 10ⁿ), de deux à quatre sous le
 * haut. Aucun tant que la production est nulle.
 */
export function reperes(points: readonly number[]): number[] {
  if (!points.some((p) => p > 0)) return [];
  const haut = hautGraphique(points);
  const brut = haut / 5;
  const puissance = 10 ** Math.floor(Math.log10(brut));
  const pas = PAS.map((m) => m * puissance).find((p) => p >= brut)!;
  const valeurs: number[] = [];
  // Un repère trop près du haut se lirait mal contre le bord.
  for (let k = 1; k * pas < haut * 0.95; k++) valeurs.push(k * pas);
  return valeurs;
}

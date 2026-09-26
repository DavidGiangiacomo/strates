// Le tracé de la fissure : une ligne brisée, toujours la même, d'un point du graphique jusqu'au
// bouton « creuser » du bandeau (fiche, § 4). Irrégulière et ramifiée, pour ne pas passer pour
// une seconde courbe du tableau de bord.

export interface Point {
  x: number;
  y: number;
}

/**
 * Les sommets du tracé principal : position le long du trajet (0 au départ, 1 à l'arrivée) et écart
 * perpendiculaire, en proportion de l'amplitude. Fixes, pour un tracé stable d'une partie à l'autre.
 */
const TRACE: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.04, 0.5],
  [0.07, -0.3],
  [0.13, 0.9],
  [0.16, 0.2],
  [0.22, -0.8],
  [0.27, -0.2],
  [0.31, 0.6],
  [0.38, -0.5],
  [0.42, 0.3],
  [0.47, 1],
  [0.53, -0.1],
  [0.58, -0.9],
  [0.61, -0.3],
  [0.67, 0.7],
  [0.72, 0.1],
  [0.78, -0.7],
  [0.83, 0.4],
  [0.87, -0.2],
  [0.93, 0.5],
  [0.97, -0.2],
  [1, 0],
];

/** Les ramifications : le sommet d'où elles partent, leur longueur (px) et leur angle avec le trajet (degrés). */
const RAMIFICATIONS: readonly { sommet: number; longueur: number; angle: number }[] = [
  { sommet: 5, longueur: 26, angle: -55 },
  { sommet: 12, longueur: 18, angle: 60 },
  { sommet: 17, longueur: 12, angle: -40 },
];

/** Amplitude maximale des écarts, en pixels. */
export const AMPLITUDE_FISSURE = 9;

function repere(depart: Point, arrivee: Point) {
  const dx = arrivee.x - depart.x;
  const dy = arrivee.y - depart.y;
  const longueur = Math.hypot(dx, dy) || 1;
  return { dx, dy, ux: dx / longueur, uy: dy / longueur };
}

/** Les sommets du tracé principal, du départ à l'arrivée. */
export function sommetsFissure(depart: Point, arrivee: Point): Point[] {
  const { dx, dy, ux, uy } = repere(depart, arrivee);
  // Vecteur unitaire perpendiculaire au trajet : (-uy, ux).
  return TRACE.map(([t, ecart]) => ({
    x: depart.x + dx * t - uy * ecart * AMPLITUDE_FISSURE,
    y: depart.y + dy * t + ux * ecart * AMPLITUDE_FISSURE,
  }));
}

function chemin(points: readonly Point[]): string {
  return points
    .map(({ x, y }, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
}

/** Le chemin SVG du tracé principal. */
export function cheminFissure(depart: Point, arrivee: Point): string {
  return chemin(sommetsFissure(depart, arrivee));
}

/** Les ramifications, avec la position (0 à 1) à laquelle le tracé principal les atteint. */
export function ramificationsFissure(depart: Point, arrivee: Point): { a: number; d: string }[] {
  const sommets = sommetsFissure(depart, arrivee);
  const { ux, uy } = repere(depart, arrivee);
  return RAMIFICATIONS.map(({ sommet, longueur, angle }) => {
    const origine = sommets[sommet]!;
    const r = (angle * Math.PI) / 180;
    const [cx, cy] = [ux * Math.cos(r) - uy * Math.sin(r), ux * Math.sin(r) + uy * Math.cos(r)];
    const coude = {
      x: origine.x + cx * longueur * 0.6 + uy * 2,
      y: origine.y + cy * longueur * 0.6 - ux * 2,
    };
    const bout = { x: origine.x + cx * longueur, y: origine.y + cy * longueur };
    return { a: TRACE[sommet]![0], d: chemin([origine, coude, bout]) };
  });
}

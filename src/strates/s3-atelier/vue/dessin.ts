// Le dessin d'une pièce vue de dessus, ou du ressort (fiche, § 6), en unités : dix par case. Le corps
// laisse une unité et quart au bord, pour les dents. Chaque côté se dessine en haut, puis tourne vers sa
// place.
import { TOUR, type Cote } from "../logique/regles";

/** Dix unités par case. */
export const UNITE = 10;
/** Le bord des dents : le corps commence à une unité et quart de la limite de la case. */
export const BORD = 1.25;

/** Une dent : son milieu, le long du côté dessiné en haut, et la case du côté qui la porte (plan). */
export interface Dent {
  x: number;
  demi: number;
}

/**
 * Les dents d'un côté, dessinées en haut : trois par case, au pas de deux unités. Sur le plan, celles
 * d'en haut et de gauche sont décalées d'une unité sur celles d'en bas et de droite : deux côtés dentés
 * face à face s'intercalent, comme un engrenage. `demi` compte les cases le long du côté, de haut en
 * bas ou de gauche à droite, comme les demi-côtés de l'analyse.
 */
export function dents(d: Cote, s: number): Dent[] {
  const S = s * UNITE;
  const decalage = d === 0 || d === 3 ? 1 : 0;
  const liste: Dent[] = [];
  for (let demi = 0; demi < s; demi++) {
    for (const b of [2.5, 4.5, 6.5]) {
      // Le long du côté, sur le plan ; dessiné en haut, un côté du bas ou de gauche se lit à l'envers.
      const long = demi * UNITE + b + decalage;
      liste.push({ x: d <= 1 ? long : S - long, demi });
    }
  }
  return liste;
}

/** La tête d'une dent : près de la limite de la case, ou au-delà quand elle engrène. */
export const TETE = { libre: 0.3, engrenee: -0.6 };

/**
 * Une dent, dessinée en haut : un trapèze qui part du corps. Engrenée, elle s'allonge et passe la
 * limite des cases, entre les dents de sa voisine.
 */
export function dent(x: number, engrenee: boolean): string {
  const pied = BORD + 0.15;
  const tete = engrenee ? TETE.engrenee : TETE.libre;
  return `${x - 0.42},${pied} ${x - 0.24},${tete} ${x + 0.24},${tete} ${x + 0.42},${pied}`;
}

/** Le trait en zigzag d'un demi-côté qui frotte, dessiné en haut : `demi` compte sur le plan. */
export function zigzag(d: Cote, s: number, demi: number): string {
  const k = d >= 2 ? s - 1 - demi : demi;
  return Array.from(
    { length: 6 },
    (_, i) => `${k * UNITE + 1 + i * 1.6},${i % 2 ? 0.2 : BORD + 0.1}`,
  ).join(" ");
}

/** La hachure d'une pièce qui tourne : des diagonales coupées au bord du corps. */
export function hachures(S: number): { x1: number; y1: number; x2: number; y2: number }[] {
  const a = BORD;
  const b = S - BORD;
  const traits: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let k = a + 3; k < 2 * b; k += 3) {
    const x1 = Math.max(a, k - b);
    const x2 = Math.min(b, k - a);
    if (x2 > x1) traits.push({ x1, y1: k - x1, x2, y2: k - x2 });
  }
  return traits;
}

/** Le moyeu d'une pièce, autour de son repère : une jante et trois rayons, à l'échelle `s`. */
export const MOYEU = { jante: 2.9, repere: 1.95 };

/** Les trois rayons du moyeu, du repère à la jante, pour une pièce de `s` cases centrée en `c`. */
export function rayons(c: number, s: number): { x1: number; y1: number; x2: number; y2: number }[] {
  return [-90, 30, 150].map((degres) => {
    const a = (degres * Math.PI) / 180;
    const [dx, dy] = [Math.cos(a), Math.sin(a)];
    return {
      x1: c + dx * MOYEU.repere * s,
      y1: c + dy * MOYEU.repere * s,
      x2: c + dx * MOYEU.jante * s,
      y2: c + dy * MOYEU.jante * s,
    };
  });
}

/** Le spiral du ressort, enroulé dans son barillet : trois tours et demi, du centre vers le bord. */
export function spirale(c: number, rayon: number): string {
  const tours = 3.5;
  const points: string[] = [];
  for (let k = 0; k <= tours * 36; k++) {
    const a = (k / 36) * 2 * Math.PI;
    const r = 1.2 + ((rayon - 1.2) * k) / (tours * 36);
    points.push(`${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`);
  }
  return points.join(" ");
}

/**
 * Le mouvement (fiche, § 6) : le ressort tourne dans le sens horaire, et chaque pièce dans le sens
 * contraire de celle qui l'entraîne. Le rang le dit : 0 pour le ressort, 1 pour une pièce qui engrène
 * avec lui.
 */
export function sens(rang: number): "horaire" | "antihoraire" {
  return rang % 2 === 0 ? "horaire" : "antihoraire";
}

/**
 * La durée d'un tour, en secondes : le ressort en fait un par tour de l'atelier, et une pièce deux fois
 * plus petite tourne deux fois plus vite. Une pièce qui frotte va par saccades, et perd du temps.
 */
export function periode(s: number, frotte: boolean): number {
  return ((TOUR * s) / 2) * (frotte ? 1.5 : 1);
}

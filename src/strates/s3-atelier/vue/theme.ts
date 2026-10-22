// La palette et la police de l'atelier (fiche, § 6) : le papier d'un plan, gris clair et un peu vert ;
// le trait au graphite ; le laiton des pièces qui tournent, l'acier de celles qui ne bougent pas ; un
// vermillon pour les frottements. Ni le blanc et le bleu-vert de la surface, ni les bruns et l'ocre des
// caves, ni le bleu nuit du chœur.
import { FAMILLE_CHIFFRES } from "./chiffres";

export const PALETTE = {
  /** Le papier du plan, gris clair et un peu vert, et son quadrillage. */
  papier: "#e3e8e1",
  quadrillage: "#c5cec4",
  /** Le trait au graphite : 11:1 sur le papier, et 5,5:1 pour le trait secondaire. */
  graphite: "#2b3133",
  "graphite-doux": "#59625f",
  /** Les pièces : en laiton quand elles tournent, en gris d'acier quand elles sont immobiles. */
  laiton: "#b8913d",
  "laiton-sombre": "#7d6024",
  acier: "#a2aaad",
  "acier-sombre": "#6b7477",
  /** Le frottement. */
  vermillon: "#d23c22",
} as const;

/**
 * Un lettrage technique, monolinéaire, comme au normographe. ↊ et ↋ viennent d'abord de la police que
 * la vue dessine elle-même (chiffres.ts) : ils sont les mêmes partout.
 */
export const POLICE = `"${FAMILLE_CHIFFRES}", Bahnschrift, "DIN Alternate", "DIN 2014", "Barlow Semi Condensed", "Arial Narrow", sans-serif`;

/** Les variables CSS de la vue : `--papier`, `--graphite`…, et `--police`. */
export const VARIABLES = [
  ...Object.entries(PALETTE).map(([nom, couleur]) => `--${nom}: ${couleur}`),
  `--police: ${POLICE}`,
].join("; ");

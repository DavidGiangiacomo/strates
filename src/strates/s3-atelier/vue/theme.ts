// La palette et la police de l'atelier (fiche, § 6), le temps de l'interface minimale : le papier d'un
// plan, le trait au graphite, le laiton des pièces qui tournent, l'acier de celles qui ne bougent pas,
// et un vermillon pour les frottements. La direction artistique est l'objet de #80.

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

/** Un lettrage technique, monolinéaire, comme au normographe. */
export const POLICE =
  'Bahnschrift, "DIN Alternate", "DIN 2014", "Barlow Semi Condensed", "Arial Narrow", sans-serif';

/** Les variables CSS de la vue : `--papier`, `--graphite`… */
export const VARIABLES = Object.entries(PALETTE)
  .map(([nom, couleur]) => `--${nom}: ${couleur}`)
  .join("; ");

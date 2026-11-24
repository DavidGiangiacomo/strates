// La palette et la police du lit (fiche, § 6) : un jour gris et voilé, plus brumeux vers l'horizon ;
// les ocres et les gris du limon, plus sombres où l'eau s'est reposée ; le gris-vert de l'eau, et l'eau
// trouble de la crue, couleur de limon ; la terre sombre de la rive, la roche du fond. Ni le blanc net
// de la surface, ni les bois et les blés des caves, ni le papier vert pâle de l'atelier, ni le bleu
// nuit du chœur, ni le noir et le rouge de la dette.
export const PALETTE = {
  /** Le ciel couvert : plus sombre en haut, plus brumeux vers l'horizon. */
  "ciel-haut": "#b3b7b3",
  "ciel-bas": "#d6d2c6",
  /** Le limon, une couche sur deux un peu plus sombre ; plus sombre encore où l'eau s'est reposée. */
  limon: "#bdb194",
  "limon-2": "#b1a588",
  retenue: "#8a7f66",
  "retenue-2": "#80755d",
  /** L'eau claire, gris-vert, l'eau trouble de la crue, chargée de limon, et le fil de l'eau. */
  eau: "#8b9d94",
  trouble: "#928c71",
  fil: "#d3dbd5",
  /** Le fleuve, plus profond que l'eau du bassin. */
  fleuve: "#7b8b84",
  /** La rive : de vieilles couches de terre sombre, une épaisse parmi elles, et la terre des fosses. */
  rive: "#4d483f",
  "rive-2": "#57524a",
  epaisse: "#3f3b35",
  remblai: "#625b50",
  /** La roche du fond, et ses encoches. */
  roche: "#37353a",
  encoche: "#7a767d",
  /** La pierre de l'échelle. */
  pierre: "#a7a398",
  /** La levée : un bourrelet de terre et de pierres. */
  levee: "#6c6458",
  /** L'argile des tablettes de la dette, et l'empreinte de ses sceaux. */
  argile: "#a58b6b",
  sceau: "#6f5a44",
  /** Les objets d'en haut, posés sur la berge : du bois, des galets, un roseau, une coquille. */
  bois: "#7d6549",
  galet: "#99948b",
  "galet-sombre": "#605c57",
  roseau: "#b7aa80",
  coquille: "#d2c8b2",
  /** Le texte : les phrases du jeu, l'aide. 9:1 sur le ciel. */
  encre: "#2c2a26",
  /** Ce qui s'écrit sur la roche : la lecture de l'échelle, le lien de l'aide. 9:1 sur la roche. */
  grave: "#cdc8bc",
} as const;

/**
 * Une linéale humaniste, aux lettres claires et un peu évasées : Optima, sinon Candara, sinon une
 * linéale de système. Elle ne sert qu'à la lecture de l'échelle, aux phrases du jeu et à l'aide.
 */
export const POLICE = `Optima, "Optima nova", Candara, "URW Classico", "Linux Biolinum O", "Gill Sans", "Gill Sans MT", sans-serif`;

/** Les variables CSS de la vue : `--limon`, `--eau`…, et `--police`. */
export const VARIABLES = [
  ...Object.entries(PALETTE).map(([nom, couleur]) => `--${nom}: ${couleur}`),
  `--police: ${POLICE}`,
].join("; ");

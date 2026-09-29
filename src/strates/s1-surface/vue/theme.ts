// La palette et la police de la surface (fiche, § 6) : un tableau de bord moderne, propre, tiède.
// Un blanc cassé, des gris à peine chauds, un seul accent désaturé (un bleu-vert pâle) et un vert
// discret pour les objectifs atteints. Aucune couleur franche, ni bois ni brun : ils iront aux caves.
// La vue les pose en variables CSS ; l'écran de fouille en reprend trois pour la valeur convertible.

export const PALETTE = {
  fond: "#f4f3f0",
  carte: "#fdfcfa",
  trait: "#e4e1db",
  texte: "#2c2a27",
  /** Libellés et textes secondaires : 5,2:1 sur les cartes. */
  doux: "#6f6a63",
  /** Ce qu'on ne peut pas encore acheter. */
  eteint: "#a19b93",
  /** La courbe et la barre d'objectif. */
  accent: "#4f8687",
  /** Le fond des boutons. */
  "accent-pale": "#e0ebe9",
  /** Le texte des boutons : 6,1:1 sur leur fond. */
  "accent-fonce": "#2a5d5e",
  /** Les objectifs atteints. */
  vert: "#557f50",
} as const;

/** Une sans-serif de système ; les chiffres sont tabulaires, pour que les compteurs ne tremblent pas. */
export const POLICE = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';

/** Les variables CSS de la vue : `--fond`, `--carte`… */
export const VARIABLES = Object.entries(PALETTE)
  .map(([nom, valeur]) => `--${nom}: ${valeur}`)
  .join("; ");

// La palette et la police de la dette (fiche, § 6) : l'argile des tablettes, chamois, sur une terre
// presque noire, celle d'une fosse à archives ; deux encres, le noir et un rouge de terre cuite, plus
// sourd que le vermillon des frottements de l'atelier. C'est la strate la plus sombre. Le compte des
// crues garde les ocres grisés du limon : le joueur les reconnaîtra dans le lit, juste en dessous.
export const PALETTE = {
  /** La terre de la fosse, brun-noir, un peu moins sombre vers le haut. */
  terre: "#1c1511",
  "terre-2": "#2a2019",
  /** L'argile des tablettes ; plus sombre sous les boutons, plus claire là où la lumière accroche. */
  argile: "#dccaa3",
  "argile-2": "#d2bf98",
  "argile-claire": "#ece0c4",
  /** Le bord des tablettes, et le creux des encoches. */
  "argile-bord": "#a48e68",
  /** L'encre noire : 10,8:1 sur l'argile. */
  encre: "#1e1915",
  /** L'encre rouge, de terre cuite : 5,2:1 sur l'argile, 4,6:1 sur un bouton. */
  rouge: "#86331f",
  /** Ce qui ne se fait plus : un bouton éteint. */
  eteint: "#7d6a4c",
  /** Ce qui s'écrit sur la terre : le nom du compte des crues. 9,3:1 sur la terre. */
  grave: "#c9b994",
  /** Le limon du compte des crues, une couche sur deux un peu plus sombre, comme dans le lit. */
  limon: "#bdb194",
  "limon-2": "#b1a588",
  /** Les couches à venir, encore vides : un trait sur la terre. */
  "a-venir": "#5e5242",
  /** L'empreinte d'un sceau dans l'argile : le creux, et le bord que la lumière accroche. */
  sceau: "#8a7553",
} as const;

/**
 * Un romain gravé : Baskerville, sinon Constantia ou Book Antiqua. Une ombre fine le creuse dans
 * l'argile ; les titres sont en capitales espacées, et les chiffres tabulaires, alignés à droite comme
 * dans un livre de comptes. Ni le Palatino des caves, ni la linéale du lit.
 */
export const POLICE = `Baskerville, "Baskerville Old Face", "Libre Baskerville", Constantia, "Book Antiqua", "Liberation Serif", serif`;

/** Les variables CSS de la vue : `--argile`, `--encre`…, et `--police`. */
export const VARIABLES = [
  ...Object.entries(PALETTE).map(([nom, couleur]) => `--${nom}: ${couleur}`),
  `--police: ${POLICE}`,
].join("; ");

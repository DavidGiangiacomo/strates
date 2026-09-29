// La palette et la police des caves (fiche, § 6) : des bruns de bois, l'ocre du blé, l'encre brun-noir
// sur un papier de registre. Aucune couleur de la surface : ni blanc cassé, ni bleu-vert. L'hiver
// refroidit tout l'écran vers un gris bleuté, et le printemps le réchauffe : chaque couleur a sa
// teinte de saison chaude et sa teinte d'hiver, que la vue mélange selon le froid (`froidEcran`).

/** Chaque couleur : en saison chaude, puis au cœur de l'hiver. */
export const PALETTE = {
  /** Le fond de l'écran : le bois de la table. */
  bois: ["#4a3727", "#383f47"],
  "bois-clair": ["#6e5239", "#58626d"],
  "bois-sombre": ["#33261b", "#282e35"],
  /** Le texte posé sur le bois : 8,8:1, et 5,6:1 pour le texte secondaire. */
  "sur-bois": ["#efe2c6", "#e0e6ea"],
  "sur-bois-doux": ["#c9b492", "#adb9c3"],
  /** Le papier du registre et de la courbe, et son encre : 12:1, et 5,4:1 pour l'encre pâle. */
  papier: ["#efe2c6", "#dfe3e6"],
  "papier-sombre": ["#e0cfa9", "#c9d0d6"],
  encre: ["#2b2118", "#1f2830"],
  "encre-douce": ["#6b5640", "#56626c"],
  /** Ce qu'on ne peut pas encore payer. */
  eteint: ["#a08b6d", "#98a2aa"],
  /** L'ocre du blé : le grain dans la coupe. */
  ble: ["#c9a13f", "#b1a47c"],
  /** La coupe : le ciel de la vallée, la terre du champ, puis le sol, de plus en plus sombre. */
  ciel: ["#d8c7a1", "#c2cbd2"],
  champ: ["#8c7a3e", "#6f7568"],
  sol: ["#3b2d21", "#30363c"],
  "sol-profond": ["#2a2019", "#24292e"],
  /** La marque d'hiver, et le trait d'un hiver manqué. */
  marque: ["#9a3a28", "#7c3a33"],
} as const;

/** Une serif humaniste de système. */
export const POLICE =
  '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", "URW Palladio L", P052, Charter, "Bitstream Charter", Georgia, serif';

/**
 * Les variables CSS de la vue : `--bois`, `--papier`… Chacune mélange ses deux teintes selon
 * `--froid`, de 0 (saison chaude) à 1 (hiver), que la vue pose à côté.
 */
export const VARIABLES = Object.entries(PALETTE)
  .map(
    ([nom, [chaud, hiver]]) =>
      `--${nom}: color-mix(in oklab, ${chaud}, ${hiver} calc(var(--froid, 0) * 100%))`,
  )
  .join("; ");

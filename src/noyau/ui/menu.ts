// Le menu système (#48), ouvert depuis le bandeau : ses textes, ceux du noyau. Sa voix est celle d'un
// inventaire : des libellés courts, des verbes à l'infinitif en minuscules, et jamais « vous » (bible,
// § 10). Les textes sont provisoires jusqu'à la bible narrative (#43).

export const TEXTES_MENU = {
  /** Le bouton du bandeau, en minuscules comme « creuser ». */
  ouvrir: "menu",
  titre: "Menu",
  fermer: "fermer",
  son: "Son",
  volume: "Volume",
  muet: "Son coupé",
  texte: "Taille du texte",
  sauvegarde: "Sauvegarde",
  exporter: "exporter",
  copier: "copier",
  copiee: "Sauvegarde copiée.",
  copieRefusee: "Le navigateur refuse la copie.",
  importer: "importer",
  importIllisible: "Ce fichier n'est pas une sauvegarde lisible.",
  importPlusRecente: "Cette sauvegarde vient d'une version plus récente du jeu.",
  importImpossible: "Le navigateur ne garde rien : aucune sauvegarde ne peut être importée.",
  recommencer: "recommencer",
  avertissement: "Toute la partie sera effacée.",
  exporterDAbord: "exporter d'abord",
  garder: "garder la partie",
  credits: "Un jeu de David Giangiacomo.",
} as const;

/** « Strates 0.1.0 · 07eede8 » : la version et le commit du build, que notent les retours de playtest. */
export function texteVersion(version: string, build: string): string {
  return `Strates ${version} · ${build}`;
}

/** Un pourcentage entier, avec une espace fine insécable : « 115 % ». */
export function pourcentage(part: number): string {
  return `${Math.round(part * 100)}\u202f%`;
}

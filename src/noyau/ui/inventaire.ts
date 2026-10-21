// L'inventaire des objets d'en haut (#45 ; docs/artefacts.md, § 3), ouvert depuis le compteur du
// bandeau : ses textes, ceux du noyau, et la marque de l'usure. Les textes sont provisoires jusqu'à la
// bible narrative (#43).
import type { Niveau, ObjetInventaire } from "../logique/artefacts";

export const TEXTES_INVENTAIRE = {
  /** Le mot du bandeau (bible, § 10). */
  titre: "Artefacts",
  fermer: "fermer",
  vide: "Aucun artefact.",
} as const;

/** L'usure en toutes lettres, à côté de sa marque : lisible sans la couleur, et dite au lecteur d'écran. */
export const NIVEAUX: Record<Niveau, string> = {
  puissant: "puissant",
  utile: "utile",
  decoratif: "décoratif",
  inerte: "inerte",
};

/** La marque de l'usure : trois crans qui se vident, puissant, utile, décoratif ; inerte, un caillou. */
export const CRANS: Record<Niveau, number> = { puissant: 3, utile: 2, decoratif: 1, inerte: 0 };

/**
 * Un nom d'en bas s'écrit dans une phrase, sans majuscule : « Les familles ont compris la roue
 * chaude. » L'inventaire le montre comme une étiquette, avec sa majuscule.
 */
export function etiquette(nom: string): string {
  return nom.charAt(0).toLocaleUpperCase("fr") + nom.slice(1);
}

/** Une couche de l'inventaire : les objets venus d'une même strate. */
export interface Couche {
  origine: ObjetInventaire["origine"];
  objets: ObjetInventaire[];
}

/** Les objets de l'inventaire regroupés par couche d'origine, dans leur ordre. */
export function parCouche(objets: readonly ObjetInventaire[]): Couche[] {
  const couches: Couche[] = [];
  for (const objet of objets) {
    const derniere = couches.at(-1);
    if (derniere?.origine === objet.origine) derniere.objets.push(objet);
    else couches.push({ origine: objet.origine, objets: [objet] });
  }
  return couches;
}

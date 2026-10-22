// La coupe (#47 ; bible, § 10), ouverte depuis « Profondeur » dans le bandeau : ses textes, ceux du
// noyau, et ses teintes, celles du sol de la descente. Une ligne par couche, sans commentaire.
import { artefact } from "../logique/artefacts";
import type { CoucheCoupe } from "../logique/coupe";
import type { NumeroStrate } from "../logique/types";
import { formaterDuree } from "./reprise";

export const TEXTES_COUPE = {
  /** Le mot du bandeau, comme l'inventaire reprend « Artefacts ». */
  profondeur: "Profondeur",
  fermer: "fermer",
  abandonne: "abandonné",
  abandonnes: "abandonnés",
  soldee: "soldée",
  defaut: "en défaut",
  perturbee: "stratigraphie perturbée",
} as const;

/** L'issue d'un seuil dans les mots du noyau : « soldée » ou « en défaut », comme le reste. */
const ISSUES: Readonly<Record<string, string>> = {
  soldee: TEXTES_COUPE.soldee,
  defaut: TEXTES_COUPE.defaut,
};

/**
 * La ligne d'une couche atteinte : le temps de jeu, l'issue de son seuil, les objets abandonnés sous
 * leurs noms d'en haut, et « stratigraphie perturbée ». « 1 h 15 min · abandonné : La filiale ».
 */
export function ligneCouche(couche: Extract<CoucheCoupe, { atteinte: true }>): string {
  const morceaux: string[] = [];
  if (couche.tempsDeJeu !== null) morceaux.push(formaterDuree(couche.tempsDeJeu));
  if (couche.issue) morceaux.push(ISSUES[couche.issue] ?? couche.issue);
  if (couche.abandonnes.length > 0) {
    const noms = couche.abandonnes.map((id) => artefact(id)?.nomDHaut ?? id);
    const mot = noms.length > 1 ? TEXTES_COUPE.abandonnes : TEXTES_COUPE.abandonne;
    morceaux.push(`${mot} : ${noms.join(", ")}`);
  }
  if (couche.perturbee) morceaux.push(TEXTES_COUPE.perturbee);
  return morceaux.join(" · ");
}

/**
 * Les teintes du sol, de la surface au fond : les bruns de la descente (Descente.svelte), plus
 * sombres en bas, et alternés pour que deux couches voisines se distinguent.
 */
export const TEINTES: Readonly<Record<NumeroStrate, string>> = {
  1: "#403a34",
  2: "#36312c",
  3: "#3b3530",
  4: "#2f2b27",
  5: "#34302b",
  6: "#2b2825",
  7: "#302c28",
  8: "#262320",
};

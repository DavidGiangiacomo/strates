// L'écran de fouille, commun à toutes les descentes (docs/strates/descente-1-2.md, § 4) : ses textes,
// ceux du noyau, et le choix des objets. Les textes sont provisoires jusqu'à la bible narrative (#43).
import {
  TAUX_FOUILLE,
  type ArtefactDef,
  type Famille,
  type FouilleOuverte,
} from "../logique/artefacts";
import { formulesAccessibles } from "../logique/comprehension";
import type { NumeroStrate } from "../logique/types";

/** Les noms des strates, tels que les montre le noyau : à l'écran de fouille, puis dans la coupe. */
export const NOMS_STRATES: Record<NumeroStrate, string> = {
  1: "La surface",
  2: "Les caves",
  3: "L'atelier",
  4: "Le réseau",
  5: "Le chœur",
  6: "La dette",
  7: "Le lit",
  8: "Le fond",
};

/** Les verbes du sol s'écrivent en minuscules, comme « creuser ». */
export const TEXTES_FOUILLE = {
  points: "Points de fouille",
  pointSuivant: "Un point de plus",
  /** La formule de la conversion, quand la Compréhension la montre : `formuleConversion`. */
  formule: "Formule",
  conversion: "points = ⌊log₁₀({valeur}) × {taux}⌋",
  aEmporter: "À emporter",
  laisse: "laissé en haut",
  abandon: "Ce qui n'est pas emporté est abandonné.",
  perdus: "Les points qui restent sont perdus.",
  descendre: "descendre",
  reboucher: "reboucher",
  /** Quand la strate ne dit pas comment elle nomme sa valeur convertible. */
  valeur: "Valeur",
} as const;

/** La famille d'effet, en toutes lettres tant que la direction artistique n'a pas dessiné d'icônes. */
export const FAMILLES: Record<Famille, string> = {
  multiplicateur: "multiplicateur",
  affichage: "affichage",
  raccourci: "raccourci",
  unique: "unique",
};

/** « Reste 0 point », « Reste 2 points ». */
export function texteReste(points: number): string {
  return `Reste ${points} ${points > 1 ? "points" : "point"}`;
}

/**
 * La formule de la conversion (D-002), écrite avec le nom de la valeur de la strate quittée :
 * « points = ⌊log₁₀(crédits gagnés) × 1,4⌋ ». C'est une des formules réelles de la Compréhension, la
 * seule du noyau (docs/comprehension.md, § 5). Comme la première formule de chaque strate, elle est
 * accessible dès κ = 51 ; avant, elle reste cachée, et l'écran ne montre que le taux (P3).
 */
export function formuleConversion(kappa: number, libelle: string): string | null {
  if (formulesAccessibles(kappa, 1) === 0) return null;
  const valeur = libelle.charAt(0).toLocaleLowerCase("fr") + libelle.slice(1);
  const taux = String(TAUX_FOUILLE).replace(".", ",");
  return TEXTES_FOUILLE.conversion.replace("{valeur}", () => valeur).replace("{taux}", taux);
}

/** Sans formateur fourni par la strate : le nombre entier, sans unité ni notation. */
export function formaterBrut(valeur: number): string {
  return String(Math.floor(valeur));
}

/** Ce que coûte un choix d'objets. */
export function coutChoix(fouille: FouilleOuverte, choix: ReadonlySet<string>): number {
  return fouille.catalogue.reduce((total, a) => total + (choix.has(a.id) ? a.cout : 0), 0);
}

/** Les points qui restent après ce choix : ils seront perdus. */
export function resteChoix(fouille: FouilleOuverte, choix: ReadonlySet<string>): number {
  return fouille.points - coutChoix(fouille, choix);
}

/** Un objet se coche s'il l'est déjà, ou si les points qui restent le paient. */
export function prenable(
  fouille: FouilleOuverte,
  choix: ReadonlySet<string>,
  a: ArtefactDef,
): boolean {
  return choix.has(a.id) || a.cout <= resteChoix(fouille, choix);
}

/** Coche ou décoche un objet ; un objet trop cher reste décoché. Renvoie le nouveau choix. */
export function basculer(
  fouille: FouilleOuverte,
  choix: ReadonlySet<string>,
  id: string,
): Set<string> {
  const suivant = new Set(choix);
  const a = fouille.catalogue.find((x) => x.id === id);
  if (!a) return suivant;
  if (suivant.has(id)) suivant.delete(id);
  else if (prenable(fouille, choix, a)) suivant.add(id);
  return suivant;
}

/** Les objets choisis, dans l'ordre de l'écran. */
export function emportes(fouille: FouilleOuverte, choix: ReadonlySet<string>): string[] {
  return fouille.catalogue.filter((a) => choix.has(a.id)).map((a) => a.id);
}

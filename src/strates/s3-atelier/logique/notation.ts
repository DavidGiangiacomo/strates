// La notation de l'atelier (I1 ; docs/strates/strate-3.md, § 1) : la base douze, en chiffres. Après 9
// viennent ↊ (dix) et ↋ (onze), puis 10, une douzaine ; 100 est une grosse, 1 000 une grande grosse.
// Les chiffres se groupent par trois, séparés par une espace fine. Des nombres entiers, sans suffixe
// ni décimale. Aucune autre strate ne compte ainsi. Pour les lecteurs d'écran, les mêmes nombres se
// disent en mots, en grosses et en douzaines (§ 6).
import { artefact } from "../../../noyau/logique/artefacts";
import type { LigneLegende } from "./etat";

/** Les douze chiffres : ↊ et ↋ sont un 2 et un 3 retournés. */
export const CHIFFRES = "0123456789↊↋";
/** Espace insécable, entre le nombre et son unité. */
const INSECABLE = " ";
/** Espace fine insécable, entre deux groupes de trois chiffres. */
const FINE = " ";

// Tolérance pour les arrondis vers le bas : une somme de pas ne doit pas perdre une pièce.
const EPSILON = 1e-9;

/** Les chiffres en base douze d'un entier positif, sans groupes : 58 donne « 4↊ ». */
export function chiffres(n: number): string {
  if (n === 0) return "0";
  let reste = n;
  let ecrit = "";
  while (reste > 0) {
    ecrit = CHIFFRES[reste % 12] + ecrit;
    reste = Math.floor(reste / 12);
  }
  return ecrit;
}

/** Un entier, arrondi vers le bas, en base douze : « 4↊ 643 232 628 ». */
export function formaterEntier(x: number): string {
  if (!Number.isFinite(x) || x < 0) return "—";
  const ecrit = chiffres(Math.floor(x + EPSILON));
  const groupes: string[] = [];
  for (let fin = ecrit.length; fin > 0; fin -= 3) {
    groupes.unshift(ecrit.slice(Math.max(0, fin - 3), fin));
  }
  return groupes.join(FINE);
}

/** Le pluriel français, décidé sur la valeur : singulier pour 0 et 1. */
export function pluriel(n: number, mot: string): string {
  return Math.floor(n + EPSILON) < 2 ? mot : `${mot}s`;
}

/** Un nombre et son unité : « 53 cases », « 1 pièce ». */
export function formaterQuantite(x: number, mot: string): string {
  return `${formaterEntier(x)}${INSECABLE}${pluriel(x, mot)}`;
}

// ——— En mots, pour les lecteurs d'écran (fiche, § 6) : en grosses et en douzaines.

/** Les douze chiffres, en mots. */
const UNITES = [
  "zéro",
  "un",
  "deux",
  "trois",
  "quatre",
  "cinq",
  "six",
  "sept",
  "huit",
  "neuf",
  "dix",
  "onze",
];

/** Une grande grosse : 1 000 en base douze. Les chiffres se groupent par trois, ses rangs aussi. */
const GRANDE_GROSSE = 12 ** 3;

/** « a », « a et b », « a, b et c ». */
function enumerer(mots: readonly string[]): string {
  if (mots.length < 2) return mots[0] ?? "";
  return `${mots.slice(0, -1).join(", ")} et ${mots[mots.length - 1]}`;
}

/** Un groupe de trois chiffres : ses grosses, ses douzaines et ses unités, « une » devant un nom féminin. */
function groupe(n: number, feminin: boolean): string[] {
  const grosses = Math.floor(n / 144);
  const douzaines = Math.floor(n / 12) % 12;
  const unites = n % 12;
  const mots: string[] = [];
  if (grosses > 0) mots.push(grosses === 1 ? "une grosse" : `${UNITES[grosses]} grosses`);
  if (douzaines > 0) mots.push(douzaines === 1 ? "une douzaine" : `${UNITES[douzaines]} douzaines`);
  if (unites > 0) mots.push(unites === 1 && feminin ? "une" : UNITES[unites]!);
  return mots;
}

/**
 * `n` fois un nom féminin, en mots : « une pièce », « une douzaine et une pièces », et « de » quand le
 * nombre finit par un nom, « une douzaine de pièces ». Les noms de l'atelier commencent tous par une
 * consonne : rien à élider.
 */
function fois(n: number, singulier: string, plurielDuNom: string): string {
  if (n < 2) return `${enMots(n, true)} ${singulier}`;
  return `${enMots(n, true)}${n % 12 === 0 ? " de " : " "}${plurielDuNom}`;
}

/** Le rang `k` d'un groupe de trois chiffres : la grande grosse, puis la grande grosse de grandes grosses… */
function rang(k: number, pluriel: boolean): string {
  return `${pluriel ? "grandes grosses" : "grande grosse"}${" de grandes grosses".repeat(k - 1)}`;
}

/**
 * Un entier, arrondi vers le bas, en mots : comme il s'écrit en base douze, en grosses et en douzaines.
 * 14 (« 12 ») se dit « une douzaine et deux », 157 (« 111 ») « une grosse, une douzaine et un ».
 * Au-delà, chaque groupe de trois chiffres se dit avec son rang : « deux grandes grosses et trois ».
 * `feminin` accorde l'unité au nom qui suit : « une ».
 */
export function enMots(x: number, feminin = false): string {
  if (!Number.isFinite(x) || x < 0) return "—";
  let n = Math.floor(x + EPSILON);
  if (n === 0) return UNITES[0]!;
  const groupes: number[] = [];
  for (; n > 0; n = Math.floor(n / GRANDE_GROSSE)) groupes.push(n % GRANDE_GROSSE);
  const mots: string[] = [];
  for (let k = groupes.length - 1; k > 0; k--) {
    if (groupes[k]! > 0) mots.push(fois(groupes[k]!, rang(k, false), rang(k, true)));
  }
  mots.push(...groupe(groupes[0]!, feminin));
  return enumerer(mots);
}

/** Un nombre et son unité, en mots : « une douzaine de cases », « une douzaine et cinq cases ». */
export function quantiteEnMots(x: number, mot: string): string {
  if (!Number.isFinite(x) || x < 0) return "—";
  const n = Math.floor(x + EPSILON);
  return fois(n, mot, `${mot}s`);
}

/** Comment s'écrivent les nombres d'un texte : en chiffres à l'écran, en mots pour un lecteur d'écran. */
export interface Ecriture {
  nombre: (x: number) => string;
  quantite: (x: number, mot: string) => string;
}

export const EN_CHIFFRES: Ecriture = { nombre: formaterEntier, quantite: formaterQuantite };
export const EN_MOTS: Ecriture = { nombre: (x) => enMots(x), quantite: quantiteEnMots };

/** La valeur convertible à l'écran de fouille : les pièces produites. */
export function formaterPieces(x: number): string {
  return formaterQuantite(x, "pièce");
}

/**
 * Remplit un texte : `{nom}` devient le nombre, `{nom:mot}` le nombre suivi du mot accordé, tous deux
 * en base douze. « Il reste {cases:case}. » donne « Il reste 53 cases. » pour 63 cases, et en mots
 * « Il reste cinq douzaines et trois cases. ».
 */
export function remplir(
  texte: string,
  valeurs: Readonly<Record<string, number>>,
  ecriture: Ecriture = EN_CHIFFRES,
): string {
  return texte.replace(/\{(\w+)(?::([\p{L}]+))?\}/gu, (tout, cle: string, mot?: string) => {
    const valeur = valeurs[cle];
    if (valeur === undefined) return tout;
    return mot ? ecriture.quantite(valeur, mot) : ecriture.nombre(valeur);
  });
}

/**
 * Une ligne de la légende, écrite d'après `texte` : ses nombres en base douze, et l'objet d'en haut
 * qu'elle cite sous son nom d'en bas.
 */
export function ecrireLigne(
  ligne: LigneLegende,
  texte: string,
  ecriture: Ecriture = EN_CHIFFRES,
): string {
  const ecrite = remplir(texte, ligne.valeurs, ecriture);
  if (ligne.objet === undefined) return ecrite;
  return ecrite.replace("{objet}", artefact(ligne.objet)?.nomDEnBas ?? ligne.objet);
}

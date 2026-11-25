// La notation de la dette (docs/strates/strate-6.md, § 1) : les sceaux. Un montant s'arrondit à trois
// chiffres significatifs, ses chiffres se groupent par trois, et chaque groupe de trois zéros, à la
// fin, devient un sceau : 125 000 s'écrit « 125 ● », 125 milliards « 125 ●●● ». Les dates se
// comptent en crues : « à la 42ᵉ crue ». Aucune autre strate n'écrit en sceaux ni ne date en crues
// (I1). Pour les lecteurs d'écran, un montant se dit en entier, « cent vingt-cinq milliards » (§ 6).

import { artefact } from "../../../noyau/logique/artefacts";
import type { LigneLivre } from "./etat";

/** Le sceau : un groupe de trois zéros, à la fin d'un montant. */
export const SCEAU = "●";
/** L'espace fine insécable, entre les groupes de chiffres et avant les sceaux. */
const FINE = "\u202f";
/** La tolérance des arrondis vers le bas ou vers le haut : 1 249,999 999 se lit 1 250. */
const TOLERANCE = 1e-9;

/**
 * Le sens d'un arrondi. Ce qu'on a s'écrit arrondi vers le bas, ce qu'on doit vers le haut : une
 * caisse qui s'écrit au-dessus d'une échéance la couvre toujours (§ 13, question 6).
 */
export type Sens = "pres" | "bas" | "haut";

function arrondirSelon(x: number, sens: Sens): number {
  if (sens === "bas") return Math.floor(x + TOLERANCE);
  if (sens === "haut") return Math.ceil(x - TOLERANCE);
  return Math.round(x);
}

/** Les chiffres d'un montant, arrondi à trois chiffres significatifs, sans séparateur. */
function chiffres(x: number, sens: Sens): string {
  if (!(x > 0)) return "0";
  if (x < 1000) {
    const n = arrondirSelon(x, sens);
    if (n < 1000) return String(n);
  }
  let exposant = Math.floor(Math.log10(x));
  let mantisse = arrondirSelon(x / 10 ** (exposant - 2), sens);
  // Une mantisse arrondie à 1 000 passe au rang suivant ; une mantisse sous 100 vient d'un log₁₀
  // arrondi par excès.
  if (mantisse >= 1000) {
    mantisse = Math.round(mantisse / 10);
    exposant += 1;
  } else if (mantisse < 100 && exposant > 2) {
    exposant -= 1;
    mantisse = arrondirSelon(x / 10 ** (exposant - 2), sens);
  }
  return String(mantisse) + "0".repeat(Math.max(0, exposant - 2));
}

/** Un montant en sceaux : « 1 250 », « 125 ● », « 1 250 ● », « 384 ●●●●●● ». */
export function formaterSceaux(x: number, sens: Sens = "pres"): string {
  const texte = chiffres(x, sens);
  const groupes: string[] = [];
  for (let fin = texte.length; fin > 0; fin -= 3)
    groupes.unshift(texte.slice(Math.max(0, fin - 3), fin));
  let sceaux = 0;
  while (groupes.length > 1 && groupes.at(-1) === "000") {
    groupes.pop();
    sceaux++;
  }
  return groupes.join(FINE) + (sceaux > 0 ? FINE + SCEAU.repeat(sceaux) : "");
}

/** Le numéro d'une crue, en ordinal : « 1ʳᵉ », « 42ᵉ », « 12 345ᵉ ». */
export function crueOrdinale(n: number): string {
  if (n === 1) return "1ʳᵉ";
  const texte = String(n);
  const groupe = n >= 10_000 ? texte.replace(/\B(?=(\d{3})+$)/g, FINE) : texte;
  return `${groupe}ᵉ`;
}

/** Remplit les `{cle}` d'un texte avec des valeurs déjà écrites. */
export function remplir(texte: string, valeurs: Readonly<Record<string, string>>): string {
  return texte.replace(/\{(\w+)\}/g, (tout, cle: string) => valeurs[cle] ?? tout);
}

/**
 * Une ligne du livre, écrite d'après son modèle : ses crues en ordinaux, ses montants par `montant`
 * (en sceaux, ou en lettres pour les lecteurs d'écran), et l'objet qu'elle cite sous son nom d'en bas.
 */
export function ecrireLigne(
  ligne: LigneLivre,
  modele: string,
  montant: (x: number) => string,
): string {
  const v = ligne.valeurs;
  const valeurs: Record<string, string> = {};
  if (v.crue !== undefined) valeurs.crue = crueOrdinale(v.crue);
  if (v.montant !== undefined) valeurs.montant = montant(v.montant);
  if (v.majoration !== undefined) valeurs.majoration = String(v.majoration).replace(".", ",");
  if (ligne.objet !== undefined) valeurs.objet = artefact(ligne.objet)?.nomDEnBas ?? ligne.objet;
  return remplir(modele, valeurs);
}

// ——— En lettres, pour les lecteurs d'écran. L'orthographe est la traditionnelle : des traits d'union
// sous cent, sauf autour de « et ».

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
  "douze",
  "treize",
  "quatorze",
  "quinze",
  "seize",
];
const DIZAINES = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante"];
/** L'échelle longue : un billion vaut mille milliards. */
const RANGS = ["", "mille", "million", "milliard", "billion", "billiard", "trillion", "trilliard"];

/** De 1 à 99 ; `final` met « quatre-vingts » au pluriel quand rien ne le suit. */
function sousCent(n: number, final: boolean): string {
  if (n <= 16) return UNITES[n]!;
  if (n < 20) return `dix-${UNITES[n - 10]!}`;
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (d === 7) return u === 1 ? "soixante et onze" : `soixante-${sousCent(10 + u, false)}`;
  if (d === 8)
    return u === 0 ? `quatre-vingt${final ? "s" : ""}` : `quatre-vingt-${sousCent(u, false)}`;
  if (d === 9) return `quatre-vingt-${sousCent(10 + u, false)}`;
  if (u === 0) return DIZAINES[d]!;
  if (u === 1) return `${DIZAINES[d]!} et un`;
  return `${DIZAINES[d]!}-${UNITES[u]!}`;
}

/** De 1 à 999 : « cent », « deux cents », « deux cent un ». */
function sousMille(n: number, final: boolean): string {
  const c = Math.floor(n / 100);
  const r = n % 100;
  const mots: string[] = [];
  if (c === 1) mots.push("cent");
  else if (c > 1) mots.push(`${UNITES[c]!} cent${r === 0 && final ? "s" : ""}`);
  if (r > 0) mots.push(sousCent(r, final));
  return mots.join(" ");
}

/**
 * Un montant en toutes lettres, arrondi comme il s'écrit : « cent vingt-cinq milliards », « un
 * million deux cent cinquante mille ». Les rangs sont ceux de l'échelle longue, jusqu'aux trilliards.
 */
export function enLettres(x: number, sens: Sens = "pres"): string {
  const texte = chiffres(x, sens);
  if (texte === "0") return UNITES[0]!;
  const groupes: number[] = [];
  for (let fin = texte.length; fin > 0; fin -= 3) {
    groupes.unshift(Number(texte.slice(Math.max(0, fin - 3), fin)));
  }
  const mots: string[] = [];
  groupes.forEach((g, i) => {
    const rang = groupes.length - 1 - i;
    if (g === 0) return;
    if (rang === 0) mots.push(sousMille(g, true));
    // « Mille » est invariable, et « cent » ne prend pas d'« s » devant lui : « deux cent mille ».
    else if (rang === 1) mots.push(g === 1 ? "mille" : `${sousMille(g, false)} mille`);
    else mots.push(g === 1 ? `un ${RANGS[rang]!}` : `${sousMille(g, true)} ${RANGS[rang]!}s`);
  });
  return mots.join(" ");
}

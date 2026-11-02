// La notation du lit (fiche, § 1) : la hauteur du limon sur l'échelle de crue, en coudées et en doigts,
// écrite en toutes lettres, « neuf coudées et quatorze doigts ». Aucune autre strate ne mesure en
// coudées, ni n'écrit ses nombres en lettres (I1). L'orthographe est la traditionnelle : des traits
// d'union sous cent, sauf autour de « et » (« vingt et un », « vingt-deux »).
import { DOIGTS, EPSILON } from "./regles";

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

/**
 * Un nombre de 1 à 99. `feminin` accorde le « un » final (« vingt et une coudées ») ; `final` met
 * « quatre-vingts » au pluriel quand rien ne le suit.
 */
function sousCent(n: number, feminin: boolean, final: boolean): string {
  const un = feminin ? "une" : "un";
  if (n === 1) return un;
  if (n <= 16) return UNITES[n]!;
  if (n < 20) return `dix-${UNITES[n - 10]!}`;
  const d = Math.floor(n / 10);
  const u = n % 10;
  if (d === 7) return u === 1 ? "soixante et onze" : `soixante-${sousCent(10 + u, false, false)}`;
  if (d === 8)
    return u === 0
      ? `quatre-vingt${final ? "s" : ""}`
      : `quatre-vingt-${sousCent(u, feminin, false)}`;
  if (d === 9) return `quatre-vingt-${sousCent(10 + u, false, false)}`;
  if (u === 0) return DIZAINES[d]!;
  if (u === 1) return `${DIZAINES[d]!} et ${un}`;
  return `${DIZAINES[d]!}-${UNITES[u]!}`;
}

/** Un nombre de 1 à 999 : « cent », « deux cents », « deux cent un ». */
function sousMille(n: number, feminin: boolean, final: boolean): string {
  const c = Math.floor(n / 100);
  const r = n % 100;
  const mots: string[] = [];
  if (c === 1) mots.push("cent");
  else if (c > 1) mots.push(`${UNITES[c]!} cent${r === 0 && final ? "s" : ""}`);
  if (r > 0) mots.push(sousCent(r, feminin, final));
  return mots.join(" ");
}

/**
 * Un entier positif en toutes lettres, jusqu'à 999 999 : « mille neuf cent quarante et un ». Un nombre
 * qui n'est pas entier est arrondi en dessous.
 */
export function enLettres(x: number, feminin = false): string {
  const n = Math.floor(Math.max(0, x) + EPSILON);
  if (n === 0) return UNITES[0]!;
  const milliers = Math.floor(n / 1000) % 1000;
  const reste = n % 1000;
  const mots: string[] = [];
  if (milliers === 1) mots.push("mille");
  else if (milliers > 1) mots.push(`${sousMille(milliers, false, false)} mille`);
  if (reste > 0) mots.push(sousMille(reste, feminin, true));
  return mots.join(" ");
}

/** « une coudée », « vingt et une coudées », « sept doigts ». */
function compter(n: number, feminin: boolean, singulier: string, pluriel: string): string {
  return `${enLettres(n, feminin)} ${n === 1 ? singulier : pluriel}`;
}

/** Des doigts en coudées et en doigts entiers, arrondis en dessous. */
export function coudeesEtDoigts(doigts: number): { coudees: number; doigts: number } {
  const total = Math.floor(Math.max(0, doigts) + EPSILON);
  return { coudees: Math.floor(total / DOIGTS), doigts: total % DOIGTS };
}

/**
 * La lecture de l'échelle : « aucune coudée » sur le bassin vide, « sept doigts », « une coudée »,
 * « neuf coudées et quatorze doigts », puis « trente-six coudées » à la rive.
 */
export function lireEchelle(niveau: number): string {
  const { coudees, doigts } = coudeesEtDoigts(niveau);
  const mots: string[] = [];
  if (coudees > 0) mots.push(compter(coudees, true, "coudée", "coudées"));
  if (doigts > 0) mots.push(compter(doigts, false, "doigt", "doigts"));
  return mots.length > 0 ? mots.join(" et ") : "aucune coudée";
}

/** La lecture à la coudée près, que les lecteurs d'écran annoncent : « neuf coudées » (fiche, § 6). */
export function lireCoudees(niveau: number): string {
  return lireEchelle(coudeesEtDoigts(niveau).coudees * DOIGTS);
}

/** Le limon déposé, à l'écran de fouille ou dans un rapport : « mille neuf cent quarante et un doigts ». */
export function formaterDoigts(doigts: number): string {
  const n = Math.floor(Math.max(0, doigts) + EPSILON);
  return n === 0 ? "aucun doigt" : compter(n, false, "doigt", "doigts");
}

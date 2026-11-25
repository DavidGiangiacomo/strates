// Les règles de la dette (docs/strates/strate-6.md, § 3) : la nomenclature des cinq tablettes, le prix
// d'un exemplaire, les termes et leurs majorations, la confiance, le report et la grande crue. Les
// montants sont entiers, arrondis à trois chiffres significatifs (§ 1) : ce que le livre écrit est
// ce qui se paie. Seule la caisse, qui croît au fil des secondes, n'est pas arrondie.
import { PLAFOND_HORS_LIGNE, TAUX_HORS_LIGNE } from "../../../noyau/logique/horsligne";
import type { EtatDette } from "./etat";

/** Une crue toutes les trente secondes : le calendrier de la dette (§ 1). */
export const CRUE = 30;

/** Les quinze sortes de promesses, de la plus petite à la plus grande, trois par tablette (§ 3). */
export const PROMESSES = [
  "orge",
  "huile",
  "etoffe",
  "ane",
  "barque",
  "attelage",
  "champ",
  "verger",
  "troupeau",
  "maison",
  "canal",
  "digue",
  "crueQuiVient",
  "dixCrues",
  "toutesLesCrues",
] as const;
export type IdPromesse = (typeof PROMESSES)[number];

/** Les termes, en crues : on paie à 2, 6 ou 18 crues. */
export const TERMES = [2, 6, 18] as const;
export type Terme = (typeof TERMES)[number];

/** Plus le terme est loin, plus la promesse coûte. */
export const MAJORATION: Readonly<Record<Terme, number>> = { 2: 1, 6: 1.2, 18: 1.6 };
/** La dernière tablette n'a pas de terme : tout y est dû à la grande crue, majoré de 60 %. */
export const MAJORATION_GRANDE_CRUE = 1.6;

export const TABLETTES = 5;
export const SORTES_PAR_TABLETTE = 3;
export const EXEMPLAIRES = 8;
/** Le n-ième exemplaire d'une sorte coûte son prix de base × 1,3ⁿ. */
export const CROISSANCE = 1.3;

/** La confiance vaut 60, plus cinq fois ce qui a été honoré en entier. */
export const CONFIANCE_DE_BASE = 60;
export const CONFIANCE_PAR_HONORE = 5;

/** Une échéance que la caisse ne couvre pas : le reste, deux crues plus tard, majoré d'un quart. */
export const REPORT_CRUES = 2;
export const MAJORATION_REPORT = 0.25;

/** La dernière promesse du livre fixe la grande crue, douze crues plus tard. */
export const GRANDE_CRUE_DANS = 12;

/** L'arrivée : la caisse tient 30, et deux mesures d'orge sont déjà promises (§ 3, « L'arrivée »). */
export const CAISSE_INITIALE = 30;
export const ORGES_INITIALES = 2;

/** Les dernières lignes du livre que l'état garde. */
export const LIVRE_MAX = 40;

/**
 * L'absence suit la règle commune pour le rapport : 80 %, douze heures au plus. Les échéances, elles,
 * tombent à leur crue, à 100 % et sans plafond (§ 10).
 */
export const TAUX_ABSENCE = TAUX_HORS_LIGNE;
export const PLAFOND_ABSENCE = PLAFOND_HORS_LIGNE;

/** La tolérance des comparaisons de montants : une caisse de 1 250 couvre 1 250, à un flottant près. */
export const EPSILON = 1e-9;
/** La tolérance sur le temps : une suite de pas de 1/60 s tombe juste sur la crue. */
export const EPSILON_TEMPS = 1e-6;

/** Un montant entier, arrondi à trois chiffres significatifs : 1 234 567 donne 1 230 000. */
export function arrondir(x: number): number {
  if (!(x > 0)) return 0;
  if (x < 1000) return Math.round(x);
  const pas = 10 ** (Math.floor(Math.log10(x)) - 2);
  return Math.round(x / pas) * pas;
}

/** Une sorte de promesse : sa tablette, son prix de base et ce que rapporte chaque exemplaire. */
export interface Sorte {
  id: IdPromesse;
  /** De 1 à 5. */
  tablette: number;
  /** Le prix de base exact : le prix de chaque exemplaire s'en déduit, puis s'arrondit. */
  base: number;
  /** Ce que rapporte un exemplaire à chaque crue. */
  rapport: number;
}

/**
 * La nomenclature (§ 3) : les prix de base partent de 12, puis × 28 d'une sorte à la suivante, un
 * facteur qui baisse de 1,2 à chaque sorte. Le retour d'une sorte, les crues qu'il faut à son premier
 * exemplaire pour rapporter son prix, va de 4,2 crues à 10,8, 0,6 de plus à chaque sorte ; la dernière
 * tablette revient à 8 crues.
 */
function nomenclature(): Readonly<Record<IdPromesse, Sorte>> {
  const sortes = {} as Record<IdPromesse, Sorte>;
  let base = 12;
  PROMESSES.forEach((id, i) => {
    if (i > 0) base *= 28 - 1.2 * (i - 1);
    const tablette = Math.floor(i / SORTES_PAR_TABLETTE) + 1;
    const retour = tablette === TABLETTES ? 8 : 4.2 + 0.6 * i;
    sortes[id] = { id, tablette, base, rapport: arrondir(base / retour) };
  });
  return sortes;
}

export const SORTES = nomenclature();

/** Les trois sortes d'une tablette. */
export function sortesDe(tablette: number): readonly IdPromesse[] {
  return PROMESSES.slice((tablette - 1) * SORTES_PAR_TABLETTE, tablette * SORTES_PAR_TABLETTE);
}

/** Le prix du n-ième exemplaire d'une sorte, n à partir de 0 : prix de base × 1,3ⁿ, arrondi. */
export function prixExemplaire(id: IdPromesse, n: number): number {
  return arrondir(SORTES[id].base * CROISSANCE ** n);
}

/** Ce qui sera dû pour une promesse : son prix, majoré selon le terme, ou selon la grande crue. */
export function montantDu(prix: number, terme: Terme | null): number {
  return arrondir(prix * (terme === null ? MAJORATION_GRANDE_CRUE : MAJORATION[terme]));
}

/** Le livre entier, en prix de promesses : la valeur convertible d'une strate soldée (§ 9). */
export const LIVRE_ENTIER = PROMESSES.reduce((total, id) => {
  for (let n = 0; n < EXEMPLAIRES; n++) total += prixExemplaire(id, n);
  return total;
}, 0);

/** Ce que rapporte une crue : la somme des rapports des exemplaires promis. */
export function rapport(etat: Readonly<EtatDette>): number {
  return PROMESSES.reduce((r, id) => r + etat.promises[id] * SORTES[id].rapport, 0);
}

/** La confiance : 60 + 5 × ce qui a été honoré en entier, multipliée par les gages. */
export function confiance(etat: Readonly<EtatDette>): number {
  return (CONFIANCE_DE_BASE + CONFIANCE_PAR_HONORE * etat.honore) * etat.multiplicateurs.confiance;
}

/** La tablette d'une échéance, par sa promesse. */
export function tabletteDe(id: IdPromesse): number {
  return SORTES[id].tablette;
}

/**
 * Ce qu'on doit, sous la confiance : tout ce qui reste dû, sauf la dernière tablette, gagée sur la
 * grande crue.
 */
export function doit(etat: Readonly<EtatDette>): number {
  return etat.echeances.reduce((s, e) => (tabletteDe(e.promesse) === TABLETTES ? s : s + e.du), 0);
}

/** Tout ce qui reste dû, la dernière tablette comprise : ce que la grande crue fera tomber. */
export function toutDu(etat: Readonly<EtatDette>): number {
  return etat.echeances.reduce((s, e) => s + e.du, 0);
}

/** Toutes les promesses d'une tablette sont-elles faites ? */
export function toutePromise(etat: Readonly<EtatDette>, tablette: number): boolean {
  return sortesDe(tablette).every((id) => etat.promises[id] >= EXEMPLAIRES);
}

/** Les promesses faites, les deux mesures d'orge de l'arrivée comprises. */
export function promisesFaites(etat: Readonly<EtatDette>): number {
  return PROMESSES.reduce((n, id) => n + etat.promises[id], 0);
}

/** La majoration d'un report : un quart, divisé par √m quand les gages l'adoucissent (§ 8). */
export function majorationReport(etat: Readonly<EtatDette>): number {
  return MAJORATION_REPORT / Math.sqrt(etat.multiplicateurs.report);
}

/** Le gage qui revient : la caisse prévue à chacune des prochaines échéances (§ 8). */
export const GAGE_QUI_REVIENT = "s5-echo";
/** Ce qui monte : la caisse prévue à la prochaine échéance seulement (§ 8). */
export const CE_QUI_MONTE = "s4-jauge";

/**
 * Où s'écrit la caisse prévue (§ 8) : à chacune des prochaines échéances avec le gage qui revient, à
 * la prochaine seulement avec ce qui monte, et nulle part avant l'éveil des gages.
 */
export function caissePrevueAffichee(etat: Readonly<EtatDette>): "toutes" | "prochaine" | null {
  if (etat.brisees < 1) return null;
  if (etat.objets.includes(GAGE_QUI_REVIENT)) return "toutes";
  if (etat.objets.includes(CE_QUI_MONTE)) return "prochaine";
  return null;
}

/** La caisse couvre-t-elle ce montant ? */
export function couvre(caisse: number, montant: number): boolean {
  return caisse >= montant * (1 - EPSILON);
}

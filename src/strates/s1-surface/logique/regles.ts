// Règles de la surface : générateurs, améliorations, objectifs et formules.
// Fiche de design : docs/strates/strate-1.md, § 3 et § 4.
import type { EtatSurface } from "./etat";

/** Chaque exemplaire d'un générateur coûte 15 % de plus que le précédent. */
export const CROISSANCE_COUT = 1.15;

/** Le seuil de fouille : une production de 1 M cr/s (fiche, § 4). */
export const SEUIL_PRODUCTION = 1_000_000;

export const GENERATEURS = [
  { id: "poste", cout: 15, production: 0.25 },
  { id: "equipe", cout: 150, production: 1.8 },
  { id: "serveur", cout: 1_800, production: 13 },
  { id: "chaine", cout: 22_000, production: 100 },
  { id: "turbine", cout: 280_000, production: 750 },
  { id: "usine", cout: 3_600_000, production: 6_000 },
  { id: "filiale", cout: 50_000_000, production: 50_000 },
] as const;

export type DefGenerateur = (typeof GENERATEURS)[number];
export type IdGenerateur = DefGenerateur["id"];

export type EffetAmelioration =
  | { type: "generateur"; generateur: IdGenerateur; facteur: number }
  | { type: "global"; facteur: number }
  | { type: "clic"; facteur: number }
  | { type: "partClic"; part: number };

export interface DefAmelioration {
  id: string;
  cout: number;
  effet: EffetAmelioration;
  /**
   * Nombre d'exemplaires du générateur à posséder pour qu'elle apparaisse.
   * Sans palier, elle apparaît quand le cumul atteint la moitié de son coût.
   */
  palier?: number;
}

/** Améliorations par générateur : production ×2 à 10, 25 et 50 exemplaires ; coût en multiple du coût de base. */
const PALIERS = [
  { palier: 10, multipleDuCout: 20 },
  { palier: 25, multipleDuCout: 150 },
  { palier: 50, multipleDuCout: 2_000 },
] as const;

export const AMELIORATIONS: readonly DefAmelioration[] = [
  ...GENERATEURS.flatMap((g) =>
    PALIERS.map(({ palier, multipleDuCout }) => ({
      id: `${g.id}-${palier}`,
      cout: g.cout * multipleDuCout,
      palier,
      effet: { type: "generateur", generateur: g.id, facteur: 2 } as const,
    })),
  ),
  { id: "globale-1", cout: 20_000, effet: { type: "global", facteur: 1.5 } },
  { id: "globale-2", cout: 2_000_000, effet: { type: "global", facteur: 1.5 } },
  { id: "globale-3", cout: 200_000_000, effet: { type: "global", facteur: 1.5 } },
  { id: "clic-1", cout: 100, effet: { type: "clic", facteur: 2 } },
  { id: "clic-2", cout: 1_000, effet: { type: "clic", facteur: 2 } },
  { id: "clic-3", cout: 10_000, effet: { type: "clic", facteur: 2 } },
  { id: "clic-4", cout: 100_000, effet: { type: "partClic", part: 0.02 } },
  { id: "clic-5", cout: 10_000_000, effet: { type: "partClic", part: 0.02 } },
];

const AMELIORATIONS_PAR_ID = new Map(AMELIORATIONS.map((a) => [a.id, a]));

export function amelioration(id: string): DefAmelioration | undefined {
  return AMELIORATIONS_PAR_ID.get(id);
}

export function generateur(id: string): DefGenerateur | undefined {
  return GENERATEURS.find((g) => g.id === id);
}

/** Les objectifs du tableau de bord, dans l'ordre ; le dernier est le seuil de fouille. */
export const OBJECTIFS: readonly ((etat: EtatSurface) => boolean)[] = [
  (etat) => etat.cumul >= 15,
  (etat) => etat.generateurs.poste >= 1,
  (etat) => production(etat) >= 1,
  (etat) => etat.ameliorations.length >= 1,
  (etat) => production(etat) >= 10,
  (etat) => production(etat) >= 100,
  (etat) => production(etat) >= 1_000,
  (etat) => production(etat) >= 10_000,
  (etat) => production(etat) >= 100_000,
  (etat) => production(etat) >= SEUIL_PRODUCTION,
];

// ——— Formules

/** Coût de `quantite` exemplaires, quand on en possède déjà `possedes` : base × 1,15ⁿ × (1,15ᵏ − 1) / 0,15. */
export function coutAchat(g: DefGenerateur, possedes: number, quantite = 1): number {
  const r = CROISSANCE_COUT;
  return (g.cout * r ** possedes * (r ** quantite - 1)) / (r - 1);
}

/** Le plus grand nombre d'exemplaires qu'on peut acheter d'un coup avec `credits`. */
export function quantiteAbordable(g: DefGenerateur, possedes: number, credits: number): number {
  const r = CROISSANCE_COUT;
  const premier = g.cout * r ** possedes;
  if (credits < premier) return 0;
  let k = Math.floor(Math.log(1 + (credits * (r - 1)) / premier) / Math.log(r));
  // Le logarithme peut se tromper d'une unité aux frontières : on corrige sur la formule du coût.
  while (k > 0 && coutAchat(g, possedes, k) > credits) k--;
  while (coutAchat(g, possedes, k + 1) <= credits) k++;
  return k;
}

function achetee(etat: EtatSurface, id: string): boolean {
  return etat.ameliorations.includes(id);
}

/** Multiplicateur des améliorations globales. */
export function multiplicateurGlobal(etat: EtatSurface): number {
  let m = 1;
  for (const id of etat.ameliorations) {
    const effet = amelioration(id)?.effet;
    if (effet?.type === "global") m *= effet.facteur;
  }
  return m;
}

/** Production d'un type de générateur, en cr/s : n × production de base × 2ᵃ × G × artefacts. */
export function productionGenerateur(etat: EtatSurface, g: DefGenerateur): number {
  let m = 1;
  for (const id of etat.ameliorations) {
    const effet = amelioration(id)?.effet;
    if (effet?.type === "generateur" && effet.generateur === g.id) m *= effet.facteur;
  }
  return (
    etat.generateurs[g.id] * g.production * m * multiplicateurGlobal(etat) * etat.multiplicateur
  );
}

/** Production totale P, en cr/s. Elle ne change que sur une action. */
export function production(etat: EtatSurface): number {
  let p = 0;
  for (const g of GENERATEURS) p += productionGenerateur(etat, g);
  return p;
}

/** Ce que rapporte un clic sur « Produire » : 2ᶜ + p × P. */
export function valeurClic(etat: EtatSurface): number {
  let base = 1;
  let part = 0;
  for (const id of etat.ameliorations) {
    const effet = amelioration(id)?.effet;
    if (effet?.type === "clic") base *= effet.facteur;
    else if (effet?.type === "partClic") part += effet.part;
  }
  return base + part * production(etat);
}

/** Un générateur apparaît quand le cumul atteint la moitié de son coût de base. */
export function generateurVisible(etat: EtatSurface, g: DefGenerateur): boolean {
  return etat.generateurs[g.id] > 0 || etat.cumul >= g.cout / 2;
}

/** L'amélioration peut-elle être achetée, crédits mis à part ? */
export function ameliorationDisponible(etat: EtatSurface, def: DefAmelioration): boolean {
  if (achetee(etat, def.id)) return false;
  if (def.palier !== undefined && def.effet.type === "generateur") {
    return etat.generateurs[def.effet.generateur] >= def.palier;
  }
  return etat.cumul >= def.cout / 2;
}

// ——— Le filet : la fissure (fiche, § 4)

/** Temps de strate après le seuil, en secondes, avant qu'une fissure n'apparaisse si le joueur n'a pas creusé. */
export const DELAI_FISSURE = 5 * 60;
/** Durée, en secondes, pendant laquelle la fissure s'allonge du graphique jusqu'au bouton « creuser ». */
export const DUREE_FISSURE = 2 * 60;

/** Où en est la fissure : 0 tant qu'elle n'est pas apparue, puis de 0 à 1 à mesure qu'elle s'allonge. */
export function avanceeFissure(etat: EtatSurface): number {
  if (etat.seuilAtteintA === null) return 0;
  const ecoule = etat.temps - etat.seuilAtteintA - DELAI_FISSURE;
  return Math.min(1, Math.max(0, ecoule / DUREE_FISSURE));
}

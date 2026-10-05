// Règles des caves : calendrier, récolte, familles, stockages, outils et formules.
// Fiche de design : docs/strates/strate-2.md, § 1 et § 3.
import type { EtatCaves } from "./etat";

// ——— Le calendrier (fiche, § 1)

/** Jours dans une année. Un jour dure une seconde de jeu : une année, 7 minutes. */
export const JOURS_PAR_AN = 420;
/** Durée de l'hiver des premières années, en jours. */
export const HIVER_COURT = 70;
/** Durée d'un grand hiver, en jours : c'est aussi l'hiver le plus long. */
export const GRAND_HIVER = 170;
/** Dernière année aux hivers courts ; ensuite, l'hiver gagne 10 jours par an : le grand cycle. */
const DERNIERE_ANNEE_COURTE = 4;
const ALLONGEMENT = 10;

/** Durée de l'hiver de l'année `annee`, en jours. */
export function dureeHiver(annee: number): number {
  const allongement = ALLONGEMENT * Math.max(0, annee - DERNIERE_ANNEE_COURTE);
  return Math.min(GRAND_HIVER, HIVER_COURT + allongement);
}

/** Un grand hiver : 170 jours, à partir de l'an 14. */
export function estGrandHiver(annee: number): boolean {
  return dureeHiver(annee) >= GRAND_HIVER;
}

/** Le seuil de fouille : trois grands hivers de suite sans rupture, soudure comprise (fiche, § 4). */
export const SERIE_SEUIL = 3;

/**
 * Les objets de la surface que les caves savent recevoir (fiche, § 8 ; docs/artefacts.md, § 8). Les
 * multiplicateurs passent par les leviers ; les caves les nomment seulement à leur éveil.
 */
export const OBJETS = {
  multiplicateurs: ["s1-equipe", "s1-turbine", "s1-filiale"],
  fenetres: "s1-double-ecran",
  armoire: "s1-serveur",
  feuille: "s1-plan",
} as const;

/** Durée de la saison chaude de l'année `annee`, en jours : l'hiver occupe la fin de l'année. */
export function saisonChaude(annee: number): number {
  return JOURS_PAR_AN - dureeHiver(annee);
}

export type Saison = "printemps" | "ete" | "automne" | "hiver";
const SAISONS_CHAUDES = ["printemps", "ete", "automne"] as const;

export function enHiver(etat: EtatCaves): boolean {
  return etat.jour >= saisonChaude(etat.annee);
}

/** La saison chaude est partagée en trois tiers égaux. */
export function saison(etat: EtatCaves): Saison {
  const s = saisonChaude(etat.annee);
  if (etat.jour >= s) return "hiver";
  return SAISONS_CHAUDES[Math.min(2, Math.floor((3 * etat.jour) / s))]!;
}

/** sin(π d / S) : 0 au premier jour de la saison chaude, 1 au plus fort de l'été, 0 à l'hiver. */
export function facteurSaison(etat: EtatCaves): number {
  const s = saisonChaude(etat.annee);
  return etat.jour < s ? Math.sin((Math.PI * etat.jour) / s) : 0;
}

/** L'arrivée : an 1, jour 70, à la fin du printemps (fiche, § 3). */
export const ARRIVEE = { annee: 1, jour: 70, familles: 8, reserve: 250, greniers: 1 } as const;

// ——— Récolte et consommation

/** Récolte d'une famille au plus fort de l'été, sans outils, en boisseaux par jour. */
export const RECOLTE_PAR_FAMILLE = 2.8;
/** Consommation d'une famille, en boisseaux par jour, toute l'année. */
export const CONSOMMATION_PAR_FAMILLE = 1;
/** Glaner rapporte au plus un boisseau par clic, au plus fort de l'été. */
export const GLANAGE = 1;

export const OUTILS = [
  { id: "faucille", facteur: 1.2, cout: 150 },
  { id: "fleau", facteur: 1.2, cout: 1_200 },
  { id: "charrue", facteur: 1.25, cout: 6_000 },
  { id: "assolement", facteur: 1.25, cout: 40_000 },
] as const;

export type DefOutil = (typeof OUTILS)[number];

/** O : le produit des outils possédés. */
export function multiplicateurOutils(etat: EtatCaves): number {
  let o = 1;
  for (const outil of OUTILS.slice(0, etat.outils)) o *= outil.facteur;
  return o;
}

/** Récolte d'une famille au plus fort de l'été, outils et artefacts compris : 2,8 × O × m. */
export function recolteParFamille(etat: EtatCaves): number {
  return RECOLTE_PAR_FAMILLE * multiplicateurOutils(etat) * etat.multiplicateurs.recolte;
}

/** La récolte du moment, en boisseaux par jour : F × 2,8 × O × m × sin(π d / S). */
export function recolte(etat: EtatCaves): number {
  return etat.familles * recolteParFamille(etat) * facteurSaison(etat);
}

/** La récolte entre les jours `d0` et `d1` de l'année en cours, intégrée exactement. */
export function recolteEntre(etat: EtatCaves, d0: number, d1: number): number {
  const s = saisonChaude(etat.annee);
  const a = Math.min(d0, s);
  const b = Math.min(d1, s);
  if (b <= a) return 0;
  const integrale = (s / Math.PI) * (Math.cos((Math.PI * a) / s) - Math.cos((Math.PI * b) / s));
  return etat.familles * recolteParFamille(etat) * integrale;
}

/**
 * La consommation, en boisseaux par jour : F, ou F × les rations pendant l'hiver et sa soudure, dès que
 * les rations se comptent (fiche, § 3, « Les rations »).
 */
export function consommation(etat: EtatCaves): number {
  const rationne = enHiver(etat) || etat.soudure;
  return etat.familles * CONSOMMATION_PAR_FAMILLE * (rationne ? partRations(etat) : 1);
}

/** Ce que rapporte un clic sur « Glaner » : sin(π d / S) boisseau, et rien en hiver. */
export function valeurGlanage(etat: EtatCaves): number {
  return GLANAGE * facteurSaison(etat) * etat.multiplicateurs.recolte;
}

/**
 * Le jour de l'année `annee` où la récolte recommence à couvrir la consommation : la fin de la
 * soudure, qui appartient à l'hiver précédent. Elle tombe au jour (S/π) × asin(r / (2,8 × O × m)), r
 * étant les rations : des rations larges l'allongent, des rations maigres l'abrègent.
 */
export function finSoudure(etat: EtatCaves, annee = etat.annee): number {
  const s = saisonChaude(annee);
  const rapport = recolteParFamille(etat) / (CONSOMMATION_PAR_FAMILLE * partRations(etat));
  // Une récolte qui ne couvrirait jamais la consommation : la soudure finit au plus fort de l'été.
  if (rapport <= 1) return s / 2;
  return (s / Math.PI) * Math.asin(1 / rapport);
}

// ——— Les familles

export const FAMILLES_FONDATRICES = 8;
/**
 * La vallée accueille 1000 familles au plus : assez pour que les naissances comptent jusqu'aux grands
 * hivers, même à rations larges (#163).
 */
export const VALLEE = 1000;
/** Après un hiver sans rupture, à rations pleines, les familles augmentent de 10 %. */
export const NAISSANCES = 0.1;
/** Chaque jour de rupture, 0,5 % des familles quittent la vallée. */
export const DEPARTS = 0.005;

const COUT_FAMILLE = 25;
const CROISSANCE_COUT_FAMILLE = 1.09;

/**
 * Installer une famille : 25 × 1,09ⁿ, n étant le nombre de familles déjà installées par le joueur. Plus
 * cher, le joueur réflexe ne grandirait plus assez pour manquer le premier hiver (#36).
 */
export function coutFamille(etat: EtatCaves): number {
  return Math.round(COUT_FAMILLE * CROISSANCE_COUT_FAMILLE ** etat.installees);
}

/** Pleine, la vallée refuse les installations. */
export function valleePleine(etat: EtatCaves): boolean {
  return etat.familles + 1 > VALLEE + 1e-9;
}

// ——— Les rations (fiche, § 3)

/**
 * Ce que mange une famille l'hiver, en part de sa consommation ordinaire, et les naissances que ces
 * rations donnent après un hiver sans rupture, en part des familles.
 */
export const RATIONS = [
  { id: "maigres", part: 0.5, naissances: 0 },
  { id: "reduites", part: 0.75, naissances: NAISSANCES / 2 },
  { id: "pleines", part: 1, naissances: NAISSANCES },
  { id: "larges", part: 2, naissances: 2 * NAISSANCES },
] as const;

export type IdRations = (typeof RATIONS)[number]["id"];

/** Les rations se comptent à partir du premier hiver qui s'allonge : avant, l'école des hivers. */
export const ANNEE_RATIONS = DERNIERE_ANNEE_COURTE + 1;

/** Les rations se comptent : depuis le premier jour du premier hiver long. */
export function rationsOuvertes(etat: EtatCaves): boolean {
  return etat.annee > ANNEE_RATIONS || (etat.annee === ANNEE_RATIONS && enHiver(etat));
}

export function partRations(etat: EtatCaves): number {
  return RATIONS.find((r) => r.id === etat.rations)?.part ?? 1;
}

/**
 * Les naissances après un hiver sans rupture, en part des familles, selon les rations moyennes de cet
 * hiver, soudure comprise : entre deux rations, elles se partagent au prorata.
 */
export function tauxNaissances(rationsMoyennes: number): number {
  const r = Math.min(Math.max(rationsMoyennes, RATIONS[0].part), RATIONS.at(-1)!.part);
  for (let i = 1; i < RATIONS.length; i++) {
    const a = RATIONS[i - 1]!;
    const b = RATIONS[i]!;
    if (r <= b.part)
      return a.naissances + ((r - a.part) / (b.part - a.part)) * (b.naissances - a.naissances);
  }
  return RATIONS.at(-1)!.naissances;
}

// ——— Les stockages

/** Du moins profond au plus profond ; les pertes sont une part du grain contenu, par jour. */
export const STOCKAGES = [
  { id: "grenier", capacite: 400, pertes: 0.002, cout: 80 },
  { id: "silo", capacite: 3_000, pertes: 0.001, cout: 900 },
  { id: "cave", capacite: 20_000, pertes: 0.0003, cout: 8_000 },
  { id: "caveProfonde", capacite: 120_000, pertes: 0.0001, cout: 40_000 },
] as const;

export type DefStockage = (typeof STOCKAGES)[number];
export type IdStockage = DefStockage["id"];

/** Chaque exemplaire d'un stockage coûte 15 % de plus que le précédent. */
export const CROISSANCE_COUT_STOCKAGE = 1.15;

export function stockage(id: string): DefStockage | undefined {
  return STOCKAGES.find((s) => s.id === id);
}

export function coutStockage(def: DefStockage, construits: number): number {
  return Math.round(def.cout * CROISSANCE_COUT_STOCKAGE ** construits);
}

/** Capacité des stockages d'un type, artefacts de conservation compris. */
export function capaciteStockage(etat: EtatCaves, def: DefStockage): number {
  return etat.stockages[def.id] * def.capacite * etat.multiplicateurs.conservation;
}

export function capacite(etat: EtatCaves): number {
  let c = 0;
  for (const def of STOCKAGES) c += capaciteStockage(etat, def);
  return c;
}

/** Les stockages dans l'ordre où le grain les remplit : du plus profond au moins profond. */
const DU_FOND: readonly DefStockage[] = [...STOCKAGES].reverse();

/** Le grain de chaque stockage, pour une réserve donnée : les plus profonds se remplissent d'abord. */
export function repartition(etat: EtatCaves, reserve = etat.reserve): Record<IdStockage, number> {
  const grain = { grenier: 0, silo: 0, cave: 0, caveProfonde: 0 };
  let reste = reserve;
  for (const def of DU_FOND) {
    const q = Math.min(reste, capaciteStockage(etat, def));
    grain[def.id] = q;
    reste -= q;
  }
  return grain;
}

/** Les pertes, en boisseaux par jour, pour une réserve donnée. */
export function pertes(etat: EtatCaves, reserve = etat.reserve): number {
  const grain = repartition(etat, reserve);
  let p = 0;
  for (const def of STOCKAGES) p += grain[def.id] * def.pertes;
  return p;
}

/** Un stockage apparaît quand le cumul atteint la moitié de son coût de base. */
export function stockageVisible(etat: EtatCaves, def: DefStockage): boolean {
  return etat.stockages[def.id] > 0 || etat.cumul >= def.cout / 2;
}

// ——— Les outils

/** Le prochain outil à acheter, s'il en reste. */
export function prochainOutil(etat: EtatCaves): DefOutil | undefined {
  return OUTILS[etat.outils];
}

/** Le prochain outil apparaît quand le cumul atteint la moitié de son coût. */
export function outilVisible(etat: EtatCaves): boolean {
  const outil = prochainOutil(etat);
  return outil !== undefined && etat.cumul >= outil.cout / 2;
}

// ——— La marque d'hiver (fiche, § 3)

/**
 * La réserve qu'il faut au premier jour de l'hiver de l'année en cours pour tenir jusqu'à la fin de
 * la soudure suivante : avec les familles, les outils, les stockages et les rations d'aujourd'hui, et la
 * durée réelle de cet hiver. Calculée à rebours, jour par jour, depuis une réserve vide à la fin de la soudure.
 * Les pertes de chaque jour sont comptées sur la réserve du début de ce jour : la marque ne sous-estime
 * jamais le besoin.
 */
export function marqueHiver(etat: EtatCaves): number {
  const f = etat.familles;
  const mange = f * CONSOMMATION_PAR_FAMILLE * partRations(etat);
  const suivante = etat.annee + 1;
  const s = saisonChaude(suivante);
  const parJour = f * recolteParFamille(etat);
  let besoin = 0;
  /** La réserve au début d'un jour qui coûte `deficit` boisseaux et finit avec `besoin`. */
  const veille = (deficit: number) => {
    let r = besoin + deficit + pertes(etat, besoin);
    r = besoin + deficit + pertes(etat, r);
    return besoin + deficit + pertes(etat, r);
  };
  // La soudure, à rebours : chaque jour, la récolte ne couvre pas tout à fait la consommation.
  for (let fin = finSoudure(etat, suivante); fin > 0; fin -= 1) {
    const debut = Math.max(0, fin - 1);
    const recolte =
      parJour * (s / Math.PI) * (Math.cos((Math.PI * debut) / s) - Math.cos((Math.PI * fin) / s));
    besoin = veille((fin - debut) * mange - recolte);
  }
  // L'hiver : rien ne se récolte.
  for (let jour = 0; jour < dureeHiver(etat.annee); jour++) {
    besoin = veille(mange);
  }
  return besoin;
}

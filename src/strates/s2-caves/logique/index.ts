// Les caves : la production suit les saisons, elle oscille au lieu de monter, et il faut lisser
// (docs/strates/strate-2.md). Le seuil de fouille arrive avec #32.
import { TAUX_HORS_LIGNE } from "../../../noyau/logique/horsligne";
import type { ContexteTick, LogiqueStrate, ResumeAbsence } from "../../../noyau/logique/types";
import { textes } from "../textes.fr";
import {
  etatInitial,
  PERIODE_HISTORIQUE,
  TAILLE_HISTORIQUE,
  TAILLE_REGISTRE,
  type EtatCaves,
} from "./etat";
import { remplir } from "./notation";
import {
  capacite,
  consommation,
  coutFamille,
  coutStockage,
  DEPARTS,
  enHiver,
  FAMILLES_FONDATRICES,
  finSoudure,
  JOURS_PAR_AN,
  NAISSANCES,
  pertes,
  prochainOutil,
  recolteEntre,
  saisonChaude,
  stockage,
  VALLEE,
  valeurGlanage,
  valleePleine,
  type IdStockage,
} from "./regles";

export type { EtatCaves } from "./etat";

export type ActionCaves =
  | { type: "glaner" }
  | { type: "installer" }
  | { type: "construire"; stockage: IdStockage }
  | { type: "outil" };

// Tolérance pour les sommes de pas en virgule flottante, en jours ou en boisseaux.
const EPSILON = 1e-9;

function lireEffets(etat: EtatCaves, ctx: ContexteTick): void {
  etat.multiplicateurs.recolte = ctx.effets.multiplicateur("recolte");
  etat.multiplicateurs.conservation = ctx.effets.multiplicateur("conservation");
}

function ecrire(etat: EtatCaves, cle: string, valeurs: Record<string, number>): void {
  etat.registre.push({ cle, valeurs });
  if (etat.registre.length > TAILLE_REGISTRE) {
    etat.registre.splice(0, etat.registre.length - TAILLE_REGISTRE);
  }
}

/** Au-delà de la capacité des stockages, le grain déborde : il est perdu. */
function deborder(etat: EtatCaves): void {
  const c = capacite(etat);
  if (etat.reserve > c) {
    etat.pertes.debord += etat.reserve - c;
    etat.reserve = c;
  }
}

/** Du grain qui entre dans la réserve : il compte dans le cumul, même s'il déborde. */
function engranger(etat: EtatCaves, quantite: number): void {
  etat.cumul += quantite;
  etat.reserve += quantite;
  deborder(etat);
}

/** `jours` de rupture : des familles partent, jamais les fondatrices. */
function rompre(etat: EtatCaves, jours: number): void {
  etat.bilan.rupture = true;
  etat.bilan.joursDeRupture += jours;
  if (etat.familles <= FAMILLES_FONDATRICES) return;
  const restent = Math.max(FAMILLES_FONDATRICES, etat.familles * (1 - DEPARTS) ** jours);
  etat.bilan.departs += etat.familles - restent;
  etat.familles = restent;
}

interface Flux {
  recolte: number;
  consommation: number;
  pourri: number;
}

/** Ce qui entre et sort de la réserve pendant `duree` jours, sans changer de saison. */
function flux(etat: EtatCaves, duree: number): Flux {
  return {
    recolte: recolteEntre(etat, etat.jour, etat.jour + duree),
    consommation: consommation(etat) * duree,
    // Les pertes sont comptées sur la réserve du début du pas : les pas sont courts.
    pourri: pertes(etat) * duree,
  };
}

/** Le solde de la réserve après `duree` jours, avant débordement ; négatif s'il y aurait rupture. */
function solde(etat: EtatCaves, f: Flux): number {
  return etat.reserve + f.recolte - f.consommation - f.pourri;
}

/** Fait couler `duree` jours de récolte, de consommation et de pertes. */
function couler(etat: EtatCaves, duree: number): void {
  const f = flux(etat, duree);
  etat.cumul += f.recolte;
  etat.pertes.pourri += f.pourri;
  const apres = solde(etat, f);
  if (apres >= -EPSILON) {
    etat.reserve = Math.max(0, apres);
    deborder(etat);
    return;
  }
  // La réserve se vide pendant le pas : la rupture commence quand elle touche le fond.
  const net = apres - etat.reserve;
  const avantVide = (etat.reserve / -net) * duree;
  etat.reserve = 0;
  rompre(etat, duree - avantVide);
}

/** Le bilan de l'hiver, à la fin de sa soudure : naissances s'il est passé sans rupture. */
function faireBilan(etat: EtatCaves): void {
  const hiver = etat.annee - 1;
  const { rupture, joursDeRupture, departs } = etat.bilan;
  if (rupture) {
    ecrire(etat, "registre.rupture", {
      annee: hiver,
      jours: Math.max(1, Math.round(joursDeRupture)),
      departs: Math.round(departs),
    });
  } else {
    const avant = etat.familles;
    etat.familles = Math.max(avant, Math.min(VALLEE, avant * (1 + NAISSANCES)));
    const naissances = Math.round(etat.familles - avant);
    ecrire(etat, naissances > 0 ? "registre.sans-rupture" : "registre.sans-rupture-vallee-pleine", {
      annee: hiver,
      naissances,
    });
  }
  etat.soudure = false;
  etat.bilan = { rupture: false, joursDeRupture: 0, departs: 0 };
}

/** Le changement d'année, puis la fin de la soudure, quand le calendrier les atteint. */
function passerBornes(etat: EtatCaves): void {
  if (etat.jour >= JOURS_PAR_AN) {
    etat.annee += 1;
    etat.jour = 0;
    etat.soudure = true;
  }
  if (etat.soudure && etat.jour >= finSoudure(etat)) faireBilan(etat);
}

/** La prochaine date où les règles changent : l'hiver, la nouvelle année, ou la fin de la soudure. */
function prochaineBorne(etat: EtatCaves): number {
  const s = saisonChaude(etat.annee);
  const borne = etat.jour < s ? s : JOURS_PAR_AN;
  return etat.soudure ? Math.min(borne, finSoudure(etat)) : borne;
}

/** Ajoute un point d'historique à chaque multiple de 5 jours franchi. */
function echantillonner(etat: EtatCaves, tempsAvant: number): void {
  const avant = Math.floor(tempsAvant / PERIODE_HISTORIQUE + EPSILON);
  const apres = Math.floor(etat.temps / PERIODE_HISTORIQUE + EPSILON);
  const points = etat.historique.reserve;
  for (let i = 0; i < Math.min(apres - avant, TAILLE_HISTORIQUE); i++) points.push(etat.reserve);
  if (points.length > TAILLE_HISTORIQUE) points.splice(0, points.length - TAILLE_HISTORIQUE);
}

/** Fait avancer le calendrier de `duree` jours, en coupant aux bornes des saisons. */
function avancer(etat: EtatCaves, duree: number): void {
  let reste = duree;
  for (;;) {
    passerBornes(etat);
    const jour = etat.jour;
    const borne = prochaineBorne(etat);
    // Une borne à un cheveu est atteinte : sans cela, un pas plus court que la tolérance n'avancerait plus.
    if (borne - jour <= EPSILON) {
      etat.jour = borne;
      continue;
    }
    if (reste <= EPSILON) return;
    const pas = Math.min(reste, borne - jour);
    const tempsAvant = etat.temps;
    couler(etat, pas);
    // Une borne atteinte l'est exactement, pour que le changement de saison ne dépende pas des arrondis.
    etat.jour = pas === borne - jour ? borne : jour + pas;
    etat.temps += pas;
    reste -= pas;
    echantillonner(etat, tempsAvant);
  }
}

/** Un achat : il est noté sur la courbe de la réserve (fiche, § 5). */
function payer(etat: EtatCaves, cout: number): boolean {
  if (cout > etat.reserve) return false;
  etat.reserve -= cout;
  const achats = etat.historique.achats;
  achats.push(etat.temps);
  const oubli = etat.temps - TAILLE_HISTORIQUE * PERIODE_HISTORIQUE;
  while (achats.length > 0 && achats[0]! < oubli) achats.shift();
  return true;
}

function t(cle: string, valeurs: Record<string, number> = {}): string {
  return remplir(textes[cle] ?? cle, valeurs);
}

/**
 * « L'hiver vous attend » (fiche, § 10) : l'absence compte à 80 % pendant la saison chaude, jusqu'au
 * premier jour de l'hiver ou jusqu'à la veille d'une rupture ; en hiver, elle ne compte pas.
 * Aucune rupture ne peut donc arriver pendant l'absence.
 */
function absence(etat: EtatCaves, duree: number, ctx: ContexteTick): ResumeAbsence {
  lireEffets(etat, ctx);
  if (enHiver(etat)) return { lignes: [t("absence.hiver")] };

  const cumulAvant = etat.cumul;
  let compte = duree * TAUX_HORS_LIGNE;
  let jours = 0;
  let rupture = false;
  while (compte > EPSILON && !enHiver(etat)) {
    const pas = Math.min(1, compte, saisonChaude(etat.annee) - etat.jour);
    if (solde(etat, flux(etat, pas)) < -EPSILON) {
      rupture = true;
      break;
    }
    avancer(etat, pas);
    compte -= pas;
    jours += pas;
  }

  const lignes: string[] = [];
  if (jours >= 1) {
    lignes.push(t("absence.recolte", { jours, recolte: etat.cumul - cumulAvant }));
  }
  if (enHiver(etat)) lignes.push(t("absence.premiers-froids"));
  else if (rupture) lignes.push(t("absence.rupture"));
  return { lignes };
}

export const logique: LogiqueStrate<EtatCaves, ActionCaves> = {
  numero: 2,
  versionEtat: 1,
  migrations: {},
  // Un jour. Chaque pas est coupé aux bornes des saisons, et la récolte y est intégrée exactement.
  pasMax: 1,
  leviers: { principal: "recolte", secondaires: ["conservation"] },
  horsLigne: { type: "propre" },

  etatInitial: () => etatInitial(),

  tick(etat, dt, ctx) {
    lireEffets(etat, ctx);
    avancer(etat, dt);
  },

  agir(etat, action, ctx) {
    lireEffets(etat, ctx);
    switch (action.type) {
      case "glaner": {
        const quantite = valeurGlanage(etat);
        if (quantite > 0) engranger(etat, quantite);
        break;
      }
      case "installer":
        if (valleePleine(etat) || !payer(etat, coutFamille(etat))) return;
        etat.familles += 1;
        etat.installees += 1;
        break;
      case "construire": {
        const def = stockage(action.stockage);
        if (!def || !payer(etat, coutStockage(def, etat.stockages[def.id]))) return;
        etat.stockages[def.id] += 1;
        break;
      }
      case "outil": {
        const outil = prochainOutil(etat);
        if (!outil || !payer(etat, outil.cout)) return;
        etat.outils += 1;
        break;
      }
    }
  },

  // Le seuil, trois grands hivers de suite sans rupture, arrive avec #32.
  seuil: () => ({ atteint: false }),
  valeurConvertible: (etat) => etat.cumul,
  absence,
};

// Les caves : la production suit les saisons, elle oscille au lieu de monter, et il faut lisser.
// Le seuil : trois grands hivers de suite sans rupture (docs/strates/strate-2.md).
import { TAUX_HORS_LIGNE } from "../../../noyau/logique/horsligne";
import { EFFETS_NEUTRES } from "../../../noyau/logique/effets";
import { avanceeFissure } from "../../../noyau/logique/filet";
import type {
  ContexteTick,
  EffetsActifs,
  LogiqueStrate,
  ResumeAbsence,
} from "../../../noyau/logique/types";
import { textes } from "../textes.fr";
import {
  etatInitial,
  PERIODE_HISTORIQUE,
  TAILLE_HISTORIQUE,
  TAILLE_HIVERS,
  TAILLE_REGISTRE,
  type EtatCaves,
} from "./etat";
import { remplir } from "./notation";
import {
  ANNEE_RATIONS,
  capacite,
  consommation,
  coutFamille,
  coutStockage,
  DEPARTS,
  dureeHiver,
  enHiver,
  estGrandHiver,
  FAMILLES_FONDATRICES,
  HIVER_COURT,
  finSoudure,
  JOURS_PAR_AN,
  marqueHiver,
  OBJETS,
  partRations,
  pertes,
  prochainOutil,
  RATIONS,
  rationsOuvertes,
  recolteEntre,
  saison,
  saisonChaude,
  SERIE_SEUIL,
  stockage,
  tauxNaissances,
  VALLEE,
  valeurGlanage,
  valleePleine,
  type IdRations,
  type IdStockage,
} from "./regles";

export type { EtatCaves } from "./etat";

export type ActionCaves =
  | { type: "glaner" }
  | { type: "installer" }
  | { type: "construire"; stockage: IdStockage }
  | { type: "outil" }
  | { type: "rations"; rations: IdRations };

// Tolérance pour les sommes de pas en virgule flottante, en jours ou en boisseaux.
const EPSILON = 1e-9;

/**
 * Les effets des objets d'en haut (fiche, § 8). Les multiplicateurs ne s'éveillent qu'au bilan du
 * premier hiver : avant, personne ne sait s'en servir, et le choc d'arrivée reste entier. Les autres
 * objets agissent dès l'arrivée.
 */
function lireEffets(etat: EtatCaves, effets: EffetsActifs): void {
  const eveilles = etat.hivers.length > 0;
  etat.multiplicateurs.recolte = eveilles ? effets.multiplicateur("recolte") : 1;
  etat.multiplicateurs.conservation = eveilles ? effets.multiplicateur("conservation") : 1;
  const agit = (id: string) => effets.niveau(id) !== null;
  etat.objets.fenetres = agit(OBJETS.fenetres);
  etat.objets.armoire = agit(OBJETS.armoire);
  etat.objets.feuille = agit(OBJETS.feuille);
}

/**
 * L'arrivée (docs/strates/descente-1-2.md, § 6) : un objet d'en haut prend son nom d'en bas la
 * première fois qu'il agit. Les deux fenêtres et l'armoire agissent dès l'arrivée : la première page
 * du registre les nomme. Une ligne compte les autres, qui attendent le premier hiver ou le seuil.
 */
function accueillir(etat: EtatCaves, effets: EffetsActifs): EtatCaves {
  lireEffets(etat, effets);
  const agit = (id: string) => effets.niveau(id) !== null;
  for (const id of [OBJETS.fenetres, OBJETS.armoire]) {
    if (agit(id)) ecrire(etat, null, "registre.eveil", {}, id);
  }
  const attendent = [...OBJETS.multiplicateurs, OBJETS.feuille].filter(agit).length;
  if (attendent > 0) {
    ecrire(etat, null, attendent === 1 ? "registre.attente.un" : "registre.attente", {
      objets: attendent,
    });
  }
  return etat;
}

/**
 * Écrit une ligne au registre. Avec un contexte, elle laisse aussi une trace pour le journal de
 * session (#26) ; sans, à l'arrivée, elle se déduit des objets emportés.
 */
function ecrire(
  etat: EtatCaves,
  ctx: ContexteTick | null,
  cle: string,
  valeurs: Record<string, number>,
  objet?: string,
): void {
  etat.registre.push(objet === undefined ? { cle, valeurs } : { cle, valeurs, objet });
  if (etat.registre.length > TAILLE_REGISTRE) {
    etat.registre.splice(0, etat.registre.length - TAILLE_REGISTRE);
  }
  ctx?.emettre(
    objet === undefined ? { type: "trace", cle, valeurs } : { type: "trace", cle, valeurs, objet },
  );
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
  if (enHiver(etat) || etat.soudure) {
    etat.bilan.rations += partRations(etat) * duree;
    etat.bilan.jours += duree;
  }
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

/**
 * Le bilan de l'hiver, à la fin de sa soudure : naissances s'il est passé sans rupture, selon ses
 * rations moyennes, série des grands hivers, seuil. Après le seuil, le registre n'a plus rien à noter
 * qu'une rupture : c'est la saturation (fiche, § 4). Le premier bilan révèle aussi les pertes (§ 7) et
 * éveille les objets d'en haut (§ 8). Les rations se fixent pour un hiver : elles redeviennent
 * pleines, et l'automne pose à nouveau la question (#163).
 */
function faireBilan(etat: EtatCaves, ctx: ContexteTick): void {
  const hiver = etat.annee - 1;
  const premier = etat.hivers.length === 0;
  const grand = estGrandHiver(hiver);
  const avantSeuil = etat.seuilAtteintA === null;
  const { rupture, joursDeRupture, departs, rations, jours } = etat.bilan;

  etat.hivers.push({ annee: hiver, rupture });
  if (etat.hivers.length > TAILLE_HIVERS) etat.hivers.splice(0, etat.hivers.length - TAILLE_HIVERS);

  if (rupture) {
    const serieRompue = etat.serie > 0;
    etat.serie = 0;
    ecrire(etat, ctx, grand ? "registre.grand-hiver-rupture" : "registre.rupture", {
      annee: hiver,
      jours: Math.max(1, Math.round(joursDeRupture)),
      departs: Math.round(departs),
    });
    if (serieRompue && avantSeuil) ecrire(etat, ctx, "registre.serie-rompue", {});
  } else {
    const avant = etat.familles;
    const taux = tauxNaissances(jours > 0 ? rations / jours : 1);
    etat.familles = Math.max(avant, Math.min(VALLEE, avant * (1 + taux)));
    const naissances = Math.round(etat.familles - avant);
    if (grand) etat.serie += 1;
    if (avantSeuil) {
      if (grand) ecrire(etat, ctx, "registre.grand-hiver", { annee: hiver, serie: etat.serie });
      else {
        const cle =
          naissances > 0
            ? "registre.sans-rupture"
            : valleePleine(etat)
              ? "registre.sans-rupture-vallee-pleine"
              : "registre.sans-rupture-sans-naissance";
        ecrire(etat, ctx, cle, { annee: hiver, naissances });
      }
      if (etat.serie >= SERIE_SEUIL) {
        etat.seuilAtteintA = etat.temps;
        ecrire(etat, ctx, "registre.seuil", {});
        // La feuille qui annonce : nommée quand elle agit, puis une ligne de l'atelier, d'une autre main.
        if (ctx.effets.niveau(OBJETS.feuille)) {
          ecrire(etat, ctx, "registre.eveil", {}, OBJETS.feuille);
          ecrire(etat, ctx, "registre.feuille", {});
        }
      }
    }
  }
  if (premier) {
    ecrire(etat, ctx, "registre.pertes", { pourri: etat.pertes.pourri });
    for (const id of OBJETS.multiplicateurs) {
      if (ctx.effets.niveau(id)) ecrire(etat, ctx, "registre.eveil", {}, id);
    }
  }
  etat.soudure = false;
  etat.rations = "pleines";
  etat.bilan = { rupture: false, joursDeRupture: 0, departs: 0, rations: 0, jours: 0 };
}

/**
 * Le premier jour de l'hiver : le registre note le premier hiver plus long, et que les rations se
 * comptent désormais, puis le premier grand hiver. Le journal de session reçoit la réserve et la marque du jour (docs/playtest-mvp.md, § 5.1).
 */
function debutHiver(etat: EtatCaves, ctx: ContexteTick): void {
  const { annee } = etat;
  ctx.emettre({
    type: "trace",
    cle: "hiver",
    valeurs: { annee, reserve: etat.reserve, marque: marqueHiver(etat) },
  });
  if (dureeHiver(annee) > HIVER_COURT && dureeHiver(annee - 1) === HIVER_COURT) {
    ecrire(etat, ctx, "registre.hivers-allongent", { annee, duree: dureeHiver(annee) });
  }
  if (annee === ANNEE_RATIONS) ecrire(etat, ctx, "registre.rations", { annee });
  if (estGrandHiver(annee) && !estGrandHiver(annee - 1)) {
    ecrire(etat, ctx, "registre.grand-hiver-arrive", { annee });
  }
}

/** Le calendrier atteint une borne ; le premier jour de l'hiver a ses lignes au registre. */
function atteindre(etat: EtatCaves, borne: number, ctx: ContexteTick): void {
  etat.jour = borne;
  if (borne === saisonChaude(etat.annee)) debutHiver(etat, ctx);
}

/** Le changement d'année, puis la fin de la soudure, quand le calendrier les atteint. */
function passerBornes(etat: EtatCaves, ctx: ContexteTick): void {
  if (etat.jour >= JOURS_PAR_AN) {
    etat.annee += 1;
    etat.jour = 0;
    etat.soudure = true;
  }
  if (etat.soudure && etat.jour >= finSoudure(etat)) faireBilan(etat, ctx);
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
function avancer(etat: EtatCaves, duree: number, ctx: ContexteTick): void {
  let reste = duree;
  for (;;) {
    passerBornes(etat, ctx);
    const jour = etat.jour;
    const borne = prochaineBorne(etat);
    // Une borne à un cheveu est atteinte : sans cela, un pas plus court que la tolérance n'avancerait plus.
    if (borne - jour <= EPSILON) {
      atteindre(etat, borne, ctx);
      continue;
    }
    if (reste <= EPSILON) return;
    const pas = Math.min(reste, borne - jour);
    const tempsAvant = etat.temps;
    couler(etat, pas);
    etat.temps += pas;
    reste -= pas;
    // Une borne atteinte l'est exactement, pour que le changement de saison ne dépende pas des arrondis.
    if (pas === borne - jour) atteindre(etat, borne, ctx);
    else etat.jour = jour + pas;
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
  lireEffets(etat, ctx.effets);
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
    avancer(etat, pas, ctx);
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
  versionEtat: 4,
  migrations: {
    // Version 2 (#32) : la série des grands hivers, le seuil et l'historique des hivers.
    1: (etat) => ({ ...(etat as object), hivers: [], serie: 0, seuilAtteintA: null }),
    // Version 3 (#34) : les objets d'en haut qui agissent hors multiplicateurs.
    2: (etat) => ({
      ...(etat as object),
      objets: { fenetres: false, armoire: false, feuille: false },
    }),
    // Version 4 (#163) : les rations de l'hiver. L'hiver en cours est jugé comme à rations pleines.
    3: (etat) => {
      const e = etat as EtatCaves;
      return { ...e, rations: "pleines", bilan: { ...e.bilan, rations: 0, jours: 0 } };
    },
  },
  // Un jour. Chaque pas est coupé aux bornes des saisons, et la récolte y est intégrée exactement.
  pasMax: 1,
  leviers: { principal: "recolte", secondaires: ["conservation"] },
  horsLigne: { type: "propre" },

  etatInitial: (ctx) => accueillir(etatInitial(), ctx.effets ?? EFFETS_NEUTRES),

  tick(etat, dt, ctx) {
    lireEffets(etat, ctx.effets);
    avancer(etat, dt, ctx);
  },

  agir(etat, action, ctx) {
    lireEffets(etat, ctx.effets);
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
      // Les rations ne coûtent rien sur le moment : elles se paient en naissances, au bilan.
      case "rations":
        if (!rationsOuvertes(etat) || !RATIONS.some((r) => r.id === action.rations)) return;
        etat.rations = action.rations;
        break;
    }
  },

  seuil: (etat) => ({ atteint: etat.seuilAtteintA !== null }),
  valeurConvertible: (etat) => etat.cumul,
  absence,

  /**
   * Pour le journal de session : le calendrier, la réserve et sa marque, ce que la vallée possède, et
   * la fissure du filet. Les gestes du protocole s'y lisent (docs/playtest-mvp.md, § 5.1).
   */
  releve: (etat) => ({
    annee: etat.annee,
    jour: etat.jour,
    saison: saison(etat),
    reserve: etat.reserve,
    marque: marqueHiver(etat),
    rations: etat.rations,
    // La disette de l'hiver en cours de jugement : la réserve a été vide sans que la récolte suffise.
    rupture: etat.bilan.rupture,
    capacite: capacite(etat),
    familles: etat.familles,
    installees: etat.installees,
    outils: etat.outils,
    greniers: etat.stockages.grenier,
    silos: etat.stockages.silo,
    caves: etat.stockages.cave,
    cavesProfondes: etat.stockages.caveProfonde,
    hivers: etat.hivers.length,
    fissure: avanceeFissure(etat.temps, etat.seuilAtteintA),
  }),
};

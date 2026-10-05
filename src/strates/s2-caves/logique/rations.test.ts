// Les rations de l'hiver (#163 ; fiche, § 3) : ce que mangent les familles l'hiver et pendant sa
// soudure, et les naissances qu'elles donnent au bilan.
import { describe, expect, it } from "vitest";
import type { ContexteTick } from "../../../noyau/logique/types";
import { logique, type ActionCaves } from ".";
import { etatInitial, type EtatCaves } from "./etat";
import {
  ANNEE_RATIONS,
  consommation,
  finSoudure,
  marqueHiver,
  rationsOuvertes,
  saisonChaude,
  tauxNaissances,
  type IdRations,
} from "./regles";

const CTX: ContexteTick = {
  effets: { multiplicateur: () => 1, niveau: () => null },
  emettre: () => {},
};

const agir = (etat: EtatCaves, action: ActionCaves) => logique.agir(etat, action, CTX);
const rationner = (etat: EtatCaves, rations: IdRations) => agir(etat, { type: "rations", rations });

/** Joue, jour par jour, jusqu'à ce que `fin` soit vrai (au plus 40 ans). */
function jouerJusqua(etat: EtatCaves, fin: (etat: EtatCaves) => boolean): void {
  for (let i = 0; i < 40 * 420 && !fin(etat); i++) logique.tick(etat, 1, CTX);
}

/** Joue jusqu'au bilan de l'hiver de l'an `annee`, à la fin de sa soudure. */
const jusquauBilan = (etat: EtatCaves, annee: number) =>
  jouerJusqua(etat, (e) => e.annee > annee && !e.soudure);

/** Le premier jour d'un hiver long : 100 familles, tous les outils, des caves profondes. */
function premierJourDHiver(annee = 8): EtatCaves {
  const etat = etatInitial();
  Object.assign(etat, { annee, familles: 100, outils: 4 });
  etat.stockages = { grenier: 0, silo: 0, cave: 0, caveProfonde: 2 };
  etat.jour = saisonChaude(annee);
  return etat;
}

/** Une ligne du registre sans les lignes du premier bilan (pertes, éveil des objets). */
const derniereLigne = (etat: EtatCaves) =>
  etat.registre.filter((l) => l.cle !== "registre.pertes" && l.cle !== "registre.eveil").at(-1)!;

describe("les rations de l'hiver", () => {
  it("ne se comptent qu'à partir du premier jour de l'hiver de l'an 5", () => {
    const etat = etatInitial();
    Object.assign(etat, { annee: ANNEE_RATIONS, jour: saisonChaude(ANNEE_RATIONS) - 1 });
    expect(rationsOuvertes(etat)).toBe(false);
    rationner(etat, "larges");
    expect(etat.rations).toBe("pleines");

    etat.jour = saisonChaude(ANNEE_RATIONS);
    expect(rationsOuvertes(etat)).toBe(true);
    rationner(etat, "larges");
    expect(etat.rations).toBe("larges");
    // Ensuite, elles se règlent en toute saison, pour l'hiver qui vient.
    Object.assign(etat, { annee: ANNEE_RATIONS + 1, jour: 100 });
    rationner(etat, "maigres");
    expect(etat.rations).toBe("maigres");
  });

  it("ignorent des rations inconnues, sans rien coûter", () => {
    const etat = premierJourDHiver();
    const reserve = etat.reserve;
    agir(etat, { type: "rations", rations: "festin" as IdRations });
    expect(etat.rations).toBe("pleines");
    rationner(etat, "reduites");
    expect(etat.reserve).toBe(reserve);
  });

  it("changent la consommation l'hiver et pendant la soudure, et seulement alors", () => {
    const etat = premierJourDHiver();
    rationner(etat, "maigres");
    expect(consommation(etat)).toBe(50);
    rationner(etat, "larges");
    expect(consommation(etat)).toBe(200);
    Object.assign(etat, { annee: 9, jour: 1, soudure: true });
    expect(consommation(etat)).toBe(200);
    etat.soudure = false;
    expect(consommation(etat)).toBe(100);
  });

  it("allongent la soudure quand elles sont larges, l'abrègent quand elles sont maigres", () => {
    const etat = premierJourDHiver();
    const pleines = finSoudure(etat);
    rationner(etat, "larges");
    expect(finSoudure(etat)).toBeGreaterThan(pleines);
    rationner(etat, "maigres");
    expect(finSoudure(etat)).toBeLessThan(pleines);
  });

  it("font naître de 0 à 20 % de familles, au prorata entre deux rations", () => {
    expect(tauxNaissances(0.5)).toBe(0);
    expect(tauxNaissances(0.75)).toBeCloseTo(0.05, 12);
    expect(tauxNaissances(1)).toBeCloseTo(0.1, 12);
    expect(tauxNaissances(1.5)).toBeCloseTo(0.15, 12);
    expect(tauxNaissances(2)).toBeCloseTo(0.2, 12);
    expect(tauxNaissances(0.875)).toBeCloseTo(0.075, 12);
    // Hors des rations possibles : les plus maigres, ou les plus larges.
    expect(tauxNaissances(0.2)).toBe(0);
    expect(tauxNaissances(3)).toBeCloseTo(0.2, 12);
  });
});

describe("la marque d'hiver, selon les rations", () => {
  it("dit toujours la vérité : tout juste assez, à chaque ration", () => {
    for (const rations of ["maigres", "reduites", "pleines", "larges"] as const) {
      const juste = premierJourDHiver();
      rationner(juste, rations);
      juste.reserve = marqueHiver(juste);
      jusquauBilan(juste, 8);
      expect(juste.hivers.at(-1)).toEqual({ annee: 8, rupture: false });

      const court = premierJourDHiver();
      rationner(court, rations);
      court.reserve = marqueHiver(court) * 0.99;
      jusquauBilan(court, 8);
      expect(court.hivers.at(-1)).toEqual({ annee: 8, rupture: true });
    }
  });

  it("double, ou presque, à rations larges ; diminue de moitié, ou presque, à rations maigres", () => {
    const etat = premierJourDHiver();
    const pleines = marqueHiver(etat);
    rationner(etat, "larges");
    expect(marqueHiver(etat) / pleines).toBeGreaterThan(2);
    rationner(etat, "maigres");
    expect(marqueHiver(etat) / pleines).toBeLessThan(0.5);
  });
});

describe("le bilan d'un hiver rationné", () => {
  /** Un hiver passé aux rations `avant`, puis aux rations `apres` dès le jour `bascule` de l'hiver. */
  function passer(avant: IdRations, apres = avant, bascule = Infinity): EtatCaves {
    const etat = premierJourDHiver();
    etat.reserve = 200_000;
    rationner(etat, avant);
    if (Number.isFinite(bascule)) {
      jouerJusqua(etat, (e) => e.jour >= saisonChaude(8) + bascule);
      rationner(etat, apres);
    }
    jusquauBilan(etat, 8);
    return etat;
  }

  it("fait naître 20 % de familles à rations larges, 10 % à rations pleines", () => {
    const larges = passer("larges");
    expect(larges.familles).toBeCloseTo(120, 9);
    expect(derniereLigne(larges)).toEqual({
      cle: "registre.sans-rupture",
      valeurs: { annee: 8, naissances: 20 },
    });
    expect(passer("pleines").familles).toBeCloseTo(110, 9);
  });

  it("ne fait naître personne à rations maigres, et le registre le note", () => {
    const maigres = passer("maigres");
    expect(maigres.familles).toBe(100);
    expect(derniereLigne(maigres)).toEqual({
      cle: "registre.sans-rupture-sans-naissance",
      valeurs: { annee: 8, naissances: 0 },
    });
  });

  it("compte les rations de chaque jour : un hiver large puis plein fait naître entre les deux", () => {
    const melange = passer("larges", "pleines", 50);
    expect(melange.familles).toBeGreaterThan(110);
    expect(melange.familles).toBeLessThan(120);
    expect(melange.bilan).toMatchObject({ rations: 0, jours: 0 });
  });

  it("remet les rations à pleines : elles se fixent pour un hiver", () => {
    const larges = passer("larges");
    expect(larges.rations).toBe("pleines");
    expect(larges.registre.filter((l) => l.cle === "registre.sans-rupture")).toHaveLength(1);
  });

  it("ne fait naître personne après une rupture, quelles que soient les rations", () => {
    const etat = premierJourDHiver();
    rationner(etat, "larges");
    etat.reserve = 1_000;
    jusquauBilan(etat, 8);
    expect(etat.hivers.at(-1)).toEqual({ annee: 8, rupture: true });
    expect(etat.familles).toBeLessThan(100);
  });
});

describe("le relevé des caves", () => {
  it("note les rations, pour le journal de session", () => {
    const etat = premierJourDHiver();
    rationner(etat, "reduites");
    expect(logique.releve!(etat)).toMatchObject({ rations: "reduites" });
  });
});

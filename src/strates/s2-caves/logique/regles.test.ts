import { describe, expect, it } from "vitest";
import { etatInitial, type EtatCaves } from "./etat";
import { formaterBoisseaux, formaterEntier, pluriel, remplir } from "./notation";
import {
  capacite,
  coutFamille,
  coutStockage,
  dureeHiver,
  finSoudure,
  marqueHiver,
  multiplicateurOutils,
  pertes,
  recolte,
  recolteEntre,
  repartition,
  saison,
  saisonChaude,
  STOCKAGES,
  valeurGlanage,
  valleePleine,
  VALLEE,
} from "./regles";

function etat(modifs: Partial<EtatCaves> = {}): EtatCaves {
  return { ...etatInitial(), ...modifs };
}

describe("le calendrier des caves", () => {
  it("allonge l'hiver de 10 jours par an à partir de l'an 5, jusqu'aux grands hivers de 170 jours", () => {
    expect([1, 2, 3, 4].map(dureeHiver)).toEqual([70, 70, 70, 70]);
    expect([5, 6, 13, 14, 15, 40].map(dureeHiver)).toEqual([80, 90, 160, 170, 170, 170]);
    expect(saisonChaude(1)).toBe(350);
    expect(saisonChaude(14)).toBe(250);
  });

  it("partage la saison chaude en trois tiers, puis l'hiver", () => {
    expect(saison(etat({ jour: 0 }))).toBe("printemps");
    expect(saison(etat({ jour: 116 }))).toBe("printemps");
    expect(saison(etat({ jour: 117 }))).toBe("ete");
    expect(saison(etat({ jour: 241 }))).toBe("automne");
    expect(saison(etat({ jour: 349.9 }))).toBe("automne");
    expect(saison(etat({ jour: 350 }))).toBe("hiver");
    expect(saison(etat({ annee: 14, jour: 250 }))).toBe("hiver");
  });
});

describe("la récolte", () => {
  it("suit la saison : F × 2,8 × O × sin(π d / S), et rien en hiver", () => {
    expect(recolte(etat({ jour: 175 }))).toBeCloseTo(8 * 2.8, 9);
    expect(recolte(etat({ jour: 70 }))).toBeCloseTo(8 * 2.8 * Math.sin(Math.PI / 5), 9);
    expect(recolte(etat({ jour: 0 }))).toBe(0);
    expect(recolte(etat({ jour: 360 }))).toBe(0);
  });

  it("multiplie la récolte par les outils, dans l'ordre", () => {
    expect([0, 1, 2, 3, 4].map((outils) => multiplicateurOutils(etat({ outils })))).toEqual([
      1,
      1.2,
      1.2 * 1.2,
      1.2 * 1.2 * 1.25,
      1.2 * 1.2 * 1.25 * 1.25,
    ]);
  });

  it("s'intègre exactement entre deux jours", () => {
    const e = etat({ familles: 37, outils: 2 });
    let somme = 0;
    const pas = 0.001;
    for (let d = 100; d < 130; d += pas) somme += recolte({ ...e, jour: d + pas / 2 }) * pas;
    expect(recolteEntre(e, 100, 130)).toBeCloseTo(somme, 3);
    // Au-delà de la saison chaude, plus rien : l'intégrale s'arrête au premier jour de l'hiver.
    expect(recolteEntre(e, 340, 400)).toBeCloseTo(recolteEntre(e, 340, 350), 9);
    expect(recolteEntre(e, 355, 400)).toBe(0);
  });

  it("fait glaner sin(π d / S) boisseau par clic, et rien en hiver", () => {
    expect(valeurGlanage(etat({ jour: 175 }))).toBeCloseTo(1, 9);
    expect(valeurGlanage(etat({ jour: 360 }))).toBe(0);
    const artefacts = etat({ jour: 175 });
    artefacts.multiplicateurs = { recolte: 2, conservation: 1 };
    expect(valeurGlanage(artefacts)).toBeCloseTo(2, 9);
  });

  it("finit la soudure quand la récolte couvre la consommation", () => {
    const e = etat({ annee: 2, outils: 1 });
    const fin = finSoudure(e);
    expect(fin).toBeCloseTo((350 / Math.PI) * Math.asin(1 / (2.8 * 1.2)), 9);
    expect(recolte({ ...e, jour: fin })).toBeCloseTo(e.familles, 9);
    expect(recolte({ ...e, jour: fin - 1 })).toBeLessThan(e.familles);
  });
});

describe("les familles", () => {
  it("coûtent 25 × 1,09ⁿ boisseaux, arrondis", () => {
    expect([0, 1, 2, 10].map((installees) => coutFamille(etat({ installees })))).toEqual([
      25, 27, 30, 59,
    ]);
  });

  it("ne dépassent pas la vallée", () => {
    expect(valleePleine(etat({ familles: VALLEE - 1 }))).toBe(false);
    expect(valleePleine(etat({ familles: VALLEE - 0.5 }))).toBe(true);
  });
});

describe("les stockages", () => {
  const plein = () =>
    etat({ stockages: { grenier: 2, silo: 1, cave: 1, caveProfonde: 0 }, reserve: 20_000 });

  it("coûtent 15 % de plus à chaque exemplaire, arrondis", () => {
    const [grenier, silo] = STOCKAGES;
    expect([0, 1, 2].map((n) => coutStockage(grenier, n))).toEqual([80, 92, 106]);
    expect(coutStockage(silo, 1)).toBe(1035);
  });

  it("additionnent leurs capacités, multipliées par la conservation", () => {
    const e = plein();
    expect(capacite(e)).toBe(2 * 400 + 3_000 + 20_000);
    e.multiplicateurs = { recolte: 1, conservation: 1.5 };
    expect(capacite(e)).toBe(1.5 * (2 * 400 + 3_000 + 20_000));
  });

  it("se remplissent par le bas : les caves d'abord, les greniers en dernier", () => {
    expect(repartition(plein())).toEqual({ grenier: 0, silo: 0, cave: 20_000, caveProfonde: 0 });
    expect(repartition(plein(), 23_500)).toEqual({
      grenier: 500,
      silo: 3_000,
      cave: 20_000,
      caveProfonde: 0,
    });
  });

  it("perdent chaque jour une part du grain qu'ils contiennent", () => {
    expect(pertes(plein())).toBeCloseTo(20_000 * 0.0003, 9);
    expect(pertes(plein(), 23_500)).toBeCloseTo(500 * 0.002 + 3_000 * 0.001 + 20_000 * 0.0003, 9);
    expect(pertes(plein(), 0)).toBe(0);
  });
});

describe("la marque d'hiver", () => {
  it("compte l'hiver qui vient, sa soudure et les pertes", () => {
    const e = etat({
      familles: 50,
      outils: 1,
      stockages: { grenier: 0, silo: 0, cave: 1, caveProfonde: 0 },
    });
    const hiver = 50 * 70;
    const marque = marqueHiver(e);
    expect(marque).toBeGreaterThan(hiver);
    // La soudure de l'an 2 dure 34 jours, dont la moitié environ est nourrie par la récolte.
    expect(marque).toBeLessThan(hiver + 50 * 34 + 0.05 * hiver);
  });

  it("monte avec les familles et avec la longueur de l'hiver", () => {
    const e = etat({ familles: 50 });
    expect(marqueHiver(etat({ familles: 60 }))).toBeGreaterThan(marqueHiver(e));
    expect(marqueHiver(etat({ familles: 50, annee: 10 }))).toBeGreaterThan(marqueHiver(e));
  });
});

describe("la notation des caves", () => {
  it("écrit des entiers, arrondis vers le bas, les milliers séparés par une espace fine", () => {
    expect(formaterEntier(24_038.9)).toBe("24\u202f038");
    expect(formaterEntier(1_234_567)).toBe("1\u202f234\u202f567");
    expect(formaterEntier(999)).toBe("999");
    expect(formaterEntier(-1)).toBe("—");
  });

  it("accorde les mots, sans jamais abréger les boisseaux", () => {
    expect(formaterBoisseaux(24_038)).toBe("24\u202f038\u00a0boisseaux");
    expect(formaterBoisseaux(1)).toBe("1\u00a0boisseau");
    expect(formaterBoisseaux(0.7)).toBe("0\u00a0boisseau");
    expect(pluriel(2, "famille")).toBe("familles");
    expect(pluriel(1, "jour")).toBe("jour");
  });

  it("remplit les textes avec des nombres et des mots accordés", () => {
    expect(
      remplir("Départs : {departs:famille}, en {jours:jour}.", { departs: 18, jours: 1 }),
    ).toBe("Départs : 18\u00a0familles, en 1\u00a0jour.");
    expect(remplir("An {annee}.", { annee: 3 })).toBe("An 3.");
    expect(remplir("{inconnu}", {})).toBe("{inconnu}");
  });
});

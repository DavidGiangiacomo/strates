// La géométrie de la coupe du lit (fiche, § 6) : les couches, l'eau de la crue, les phrases.
import { describe, expect, it } from "vitest";
import { logique, type EtatLit } from "../logique";
import { CREUX, CRUE, DUREE_PHRASE, RIVE } from "../logique/regles";
import {
  couchesDuBassin,
  couchesDuCreux,
  eau,
  FOND,
  HAUT,
  phraseCourante,
  POCHE,
  PX,
  TRAITS,
  y,
} from "./coupe";

const CTX = {
  effets: { multiplicateur: () => 1, niveau: () => null },
  emettre: () => {},
};

function lit(secondes: number, levee: number | null = 0): EtatLit {
  const etat = logique.etatInitial({ graine: 1, journal: { strates: [] } });
  if (levee !== null) logique.agir(etat, { type: "fermer", creux: levee }, CTX);
  logique.tick(etat, secondes, CTX);
  return etat;
}

describe("la coupe", () => {
  it("met le fond du bassin en bas, et la rive, trente-six coudées plus haut", () => {
    expect(y(0)).toBe(FOND);
    expect(y(RIVE)).toBeCloseTo(HAUT, 9);
  });

  it("gradue l'échelle d'un trait court tous les sept doigts, et d'un long par coudée", () => {
    expect(TRAITS[0]).toEqual({ y: FOND, long: true });
    expect(TRAITS[1]!.long).toBe(false);
    expect(TRAITS[4]).toEqual({ y: y(28), long: true });
    expect(TRAITS.filter((t) => t.long)).toHaveLength(38);
  });

  it("empile les couches du bassin jusqu'au limon, et remplit la poche d'un creux plein", () => {
    const etat = lit(80 * CRUE);
    const bandes = couchesDuBassin(etat.couches);
    expect(bandes).toHaveLength(etat.couches.filter((c) => c.ou === "bassin").length);
    expect(bandes.at(-1)!.y).toBeCloseTo(y(etat.niveau), 9);
    expect(bandes.reduce((h, b) => h + b.hauteur, 0)).toBeCloseTo(etat.niveau * PX, 9);

    const poche = couchesDuCreux(etat.couches, 0);
    expect(poche).toHaveLength(25);
    expect(poche[0]!.teinte).toBeGreaterThanOrEqual(2);
    expect(poche.at(-1)!.y).toBeCloseTo(y(CREUX[0]! + POCHE.hauteur), 9);
    expect(couchesDuCreux(etat.couches, 3)).toEqual([]);
  });
});

describe("l'eau de la crue", () => {
  it("monte en dix secondes, se repose dix, se retire en dix : la première quinze secondes après l'arrivée", () => {
    expect(eau(0, null)).toBe(0);
    expect(eau(14.9, null)).toBe(0);
    expect(eau(20, null)).toBeCloseTo(0.5, 9);
    // Le limon se dépose à la 30ᵉ seconde, au milieu du repos.
    expect(eau(25, null)).toBe(1);
    expect(eau(CRUE, null)).toBe(1);
    expect(eau(40, null)).toBeCloseTo(0.5, 9);
    expect(eau(45, null)).toBe(0);
    expect(eau(50, null)).toBeCloseTo(0.5, 9);
  });

  it("ne vient plus au bassin plein : le fleuve passe ailleurs, après la dernière crue", () => {
    expect(eau(1000 * CRUE, 900 * CRUE)).toBe(0);
    expect(eau(900 * CRUE + 5, 900 * CRUE)).toBeCloseTo(1, 9);
  });

  it("monte et se retire en trois images, avec moins de mouvement", () => {
    for (let t = 15; t < 120; t += 0.7) expect([0, 0.5, 1]).toContain(eau(t, null, true));
  });
});

describe("les phrases du jeu", () => {
  it("viennent, restent, puis s'effacent, une à une", () => {
    const dites = [
      { cle: "phrase.arrivee", a: 0 },
      { cle: "phrase.retour", a: 100 },
      { cle: "phrase.decider", a: 100 + DUREE_PHRASE },
    ];
    expect(phraseCourante({ dites, temps: 0 })).toEqual({ cle: "phrase.arrivee", opacite: 0 });
    expect(phraseCourante({ dites, temps: 5 })).toEqual({ cle: "phrase.arrivee", opacite: 1 });
    expect(phraseCourante({ dites, temps: 9.25 })!.opacite).toBeCloseTo(0.5, 9);
    expect(phraseCourante({ dites, temps: 12 })).toBeNull();
    expect(phraseCourante({ dites, temps: 105 })!.cle).toBe("phrase.retour");
    expect(phraseCourante({ dites, temps: 115 })!.cle).toBe("phrase.decider");
    expect(phraseCourante({ dites, temps: 0.5 }, true)).toEqual({
      cle: "phrase.arrivee",
      opacite: 1,
    });
  });
});

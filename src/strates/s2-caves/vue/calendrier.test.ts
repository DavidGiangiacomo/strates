import { describe, expect, it } from "vitest";
import {
  angleJour,
  CASES,
  casesCycle,
  froidEcran,
  point,
  saisonsAnnee,
  secteur,
  TAILLE,
  TRANSITION_FROID,
} from "./calendrier";

describe("le calendrier circulaire", () => {
  it("fait un tour par année, en partant du haut, dans le sens des aiguilles d'une montre", () => {
    expect(angleJour(0)).toBe(0);
    expect(angleJour(105)).toBeCloseTo(Math.PI / 2, 12);
    expect(angleJour(420)).toBeCloseTo(2 * Math.PI, 12);
    const haut = point(50, 0);
    const droite = point(50, Math.PI / 2);
    expect(haut.x).toBeCloseTo(TAILLE / 2, 12);
    expect(haut.y).toBeCloseTo(TAILLE / 2 - 50, 12);
    expect(droite.x).toBeCloseTo(TAILLE / 2 + 50, 12);
    expect(droite.y).toBeCloseTo(TAILLE / 2, 12);
  });

  it("partage l'année en trois tiers de saison chaude, puis l'hiver à sa vraie longueur", () => {
    expect(saisonsAnnee(1)).toEqual([
      { saison: "printemps", debut: 0, fin: 350 / 3 },
      { saison: "ete", debut: 350 / 3, fin: 700 / 3 },
      { saison: "automne", debut: 700 / 3, fin: 350 },
      { saison: "hiver", debut: 350, fin: 420 },
    ]);
    expect(saisonsAnnee(14).at(-1)).toEqual({ saison: "hiver", debut: 250, fin: 420 });
  });

  it("dessine des secteurs d'anneau et des parts, avec le grand arc au-delà d'un demi-tour", () => {
    expect(secteur(0, 50, 0, Math.PI / 2)).toBe(
      "M100.00,50.00 A50,50 0 0 1 150.00,100.00 L100,100 Z",
    );
    const anneau = secteur(40, 50, 0, 1.5 * Math.PI);
    expect(anneau).toContain("A50,50 0 1 1");
    expect(anneau).toContain("A40,40 0 1 0");
  });
});

describe("l'anneau du grand cycle", () => {
  it("n'a une case que pour les années vécues, l'année en cours comprise", () => {
    const cases = casesCycle({ annee: 3, hivers: [] });
    expect(cases.map((c) => c.annee)).toEqual([1, 2, 3]);
    expect(cases.every((c) => c.debut < c.hiver && c.hiver < c.fin)).toBe(true);
  });

  it("allonge la part de l'hiver avec le grand cycle, et reconnaît les grands hivers", () => {
    const cases = casesCycle({ annee: 14, hivers: [] });
    const part = (i: number) =>
      (cases[i]!.fin - cases[i]!.hiver) / (cases[i]!.fin - cases[i]!.debut);
    expect(part(0)).toBeCloseTo(70 / 420, 12);
    expect(part(13)).toBeCloseTo(170 / 420, 12);
    expect(cases.filter((c) => c.grand).map((c) => c.annee)).toEqual([14]);
  });

  it("marque les hivers manqués, et laisse sans jugement ceux qui ne sont pas encore jugés", () => {
    const hivers = [
      { annee: 1, rupture: true },
      { annee: 2, rupture: false },
    ];
    expect(casesCycle({ annee: 4, hivers }).map((c) => c.rupture)).toEqual([
      true,
      false,
      null,
      null,
    ]);
  });

  it("dessine d'avance les années à venir, pour l'armoire qui compte les hivers", () => {
    const cases = casesCycle({ annee: 3, hivers: [] }, true);
    expect(cases.map((c) => c.annee)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(cases.filter((c) => c.future).map((c) => c.annee)[0]).toBe(4);
    expect(cases.every((c) => !c.future || c.rupture === null)).toBe(true);
    // Passé l'an 20, l'anneau est plein des années vécues : il n'y a plus de place pour l'avenir.
    expect(casesCycle({ annee: 25, hivers: [] }, true).some((c) => c.future)).toBe(false);
  });

  it("garde les 20 dernières années, chacune toujours à la même place", () => {
    const cases = casesCycle({ annee: 25, hivers: [] });
    expect(cases).toHaveLength(CASES);
    expect(cases[0]!.annee).toBe(6);
    const an5 = casesCycle({ annee: 5, hivers: [] }).at(-1)!;
    const an25 = cases.at(-1)!;
    expect(an25.debut).toBeCloseTo(an5.debut, 12);
  });
});

describe("le froid de l'écran", () => {
  it("monte en quelques jours au début de l'hiver", () => {
    expect(froidEcran({ annee: 1, jour: 70 })).toBe(0);
    expect(froidEcran({ annee: 1, jour: 350 })).toBe(0);
    expect(froidEcran({ annee: 1, jour: 350 + TRANSITION_FROID / 2 })).toBe(0.5);
    expect(froidEcran({ annee: 1, jour: 400 })).toBe(1);
  });

  it("retombe au printemps, et suit l'hiver qui s'allonge", () => {
    expect(froidEcran({ annee: 2, jour: 0 })).toBe(1);
    expect(froidEcran({ annee: 2, jour: TRANSITION_FROID / 2 })).toBe(0.5);
    expect(froidEcran({ annee: 2, jour: 200 })).toBe(0);
    // En l'an 14, le grand hiver commence au jour 250.
    expect(froidEcran({ annee: 14, jour: 260 })).toBe(1);
  });
});

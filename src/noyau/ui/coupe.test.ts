// La ligne d'une couche de la coupe (#47 ; bible, § 10) : le temps, l'issue, les objets abandonnés
// sous leurs noms d'en haut, « stratigraphie perturbée ». Sans commentaire.
import { describe, expect, it } from "vitest";
import type { CoucheCoupe } from "../logique/coupe";
import { ligneCouche, TEXTES_COUPE } from "./coupe";

const couche = (
  autres: Partial<Extract<CoucheCoupe, { atteinte: true }>> = {},
): Extract<CoucheCoupe, { atteinte: true }> => ({
  strate: 1,
  atteinte: true,
  courante: false,
  tempsDeJeu: 4500,
  issue: null,
  abandonnes: [],
  perturbee: false,
  ...autres,
});

describe("la ligne d'une couche", () => {
  it("donne le temps de jeu", () => {
    expect(ligneCouche(couche())).toBe("1 h 15 min");
    expect(ligneCouche(couche({ tempsDeJeu: 30, courante: true }))).toBe("moins d'une minute");
  });

  it("nomme les objets abandonnés de leurs noms d'en haut", () => {
    expect(ligneCouche(couche({ abandonnes: ["s1-filiale"] }))).toBe(
      "1 h 15 min · abandonné : La filiale",
    );
    expect(ligneCouche(couche({ abandonnes: ["s1-double-ecran", "s1-plan"] }))).toBe(
      "1 h 15 min · abandonnés : Double écran, Plan stratégique",
    );
  });

  it("écrit l'issue de la dette, et la stratigraphie perturbée, comme le reste", () => {
    expect(ligneCouche(couche({ strate: 6, issue: "soldee", tempsDeJeu: 7200 }))).toBe(
      "2 h · soldée",
    );
    expect(
      ligneCouche(couche({ strate: 6, issue: "defaut", tempsDeJeu: null, perturbee: true })),
    ).toBe("en défaut · stratigraphie perturbée");
  });

  it("ne dit jamais « vous », et ne qualifie rien", () => {
    for (const texte of Object.values(TEXTES_COUPE)) {
      expect(texte).not.toMatch(/\b(vous|votre|bon|rare)\b|précieu/i);
    }
  });
});

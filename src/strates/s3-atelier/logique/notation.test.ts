// La notation de l'atelier : la base douze, en chiffres (fiche, § 1), et en mots pour les lecteurs
// d'écran (§ 6).
import { describe, expect, it } from "vitest";
import {
  chiffres,
  EN_MOTS,
  enMots,
  formaterEntier,
  formaterPieces,
  quantiteEnMots,
  remplir,
} from "./notation";

const FINE = " ";

describe("la base douze", () => {
  it("écrit ↊ et ↋ après 9, puis 10 pour une douzaine, 100 pour une grosse", () => {
    expect([0, 9, 10, 11, 12, 13, 23, 144, 1728].map(chiffres)).toEqual([
      "0",
      "9",
      "↊",
      "↋",
      "10",
      "11",
      "1↋",
      "100",
      "1000",
    ]);
  });

  it("redonne les nombres de la fiche : 88 pièces, 63 cases, 126 pièces avec le ressort", () => {
    expect(formaterEntier(88)).toBe("74");
    expect(formaterEntier(63)).toBe("53");
    expect(formaterEntier(126)).toBe("↊6");
    expect(formaterEntier(58)).toBe("4↊");
  });

  it("groupe les chiffres par trois, depuis la droite, d'une espace fine", () => {
    expect(formaterEntier(1728)).toBe(`1${FINE}000`);
    expect(formaterEntier(12 ** 4 * 10 + 12 ** 3 * 11)).toBe(`↊↋${FINE}000`);
    expect(formaterEntier(12 ** 10 * 4 + 12 ** 9 * 10)).toBe(`4↊${FINE}000${FINE}000${FINE}000`);
  });

  it("arrondit vers le bas, sans perdre une pièce aux arrondis, et refuse ce qui n'est pas un nombre", () => {
    expect(formaterEntier(11.99)).toBe("↋");
    expect(formaterEntier(12 - 1e-12)).toBe("10");
    expect(formaterEntier(-1)).toBe("—");
    expect(formaterEntier(Number.NaN)).toBe("—");
  });

  it("accorde les mots sur la valeur, et remplit les textes", () => {
    expect(formaterPieces(1)).toBe("1 pièce");
    expect(formaterPieces(24)).toBe("20 pièces");
    expect(remplir("Il reste {cases:case}.", { cases: 63 })).toBe("Il reste 53 cases.");
    expect(remplir("Pièce {piece} : ajustée.", { piece: 14 })).toBe("Pièce 12 : ajustée.");
    expect(remplir("{absent}", {})).toBe("{absent}");
  });
});

describe("les nombres en mots, pour les lecteurs d'écran (fiche, § 6)", () => {
  it("se disent en grosses et en douzaines, comme ils s'écrivent en base douze", () => {
    expect([0, 1, 9, 10, 11].map((n) => enMots(n))).toEqual(["zéro", "un", "neuf", "dix", "onze"]);
    expect(enMots(12)).toBe("une douzaine");
    expect(enMots(14)).toBe("une douzaine et deux");
    expect(enMots(125)).toBe("dix douzaines et cinq");
    expect(enMots(144)).toBe("une grosse");
    expect(enMots(157)).toBe("une grosse, une douzaine et un");
    expect(enMots(1727)).toBe("onze grosses, onze douzaines et onze");
  });

  it("disent chaque groupe de trois chiffres avec son rang, à partir d'une grande grosse", () => {
    expect(enMots(1728)).toBe("une grande grosse");
    expect(enMots(1728 + 3)).toBe("une grande grosse et trois");
    expect(enMots(12 * 1728)).toBe("une douzaine de grandes grosses");
    expect(enMots(13 * 1728 + 144)).toBe("une douzaine et une grandes grosses et une grosse");
    expect(enMots(1728 ** 2 * 2 + 5)).toBe("deux grandes grosses de grandes grosses et cinq");
    // « 4↊ 000 000 000 » : le rang de chaque groupe se dit, même quand il est seul.
    expect(enMots(12 ** 10 * 4 + 12 ** 9 * 10)).toBe(
      "quatre douzaines et dix grandes grosses de grandes grosses de grandes grosses",
    );
  });

  it("accordent l'unité au nom qui suit, et le relient par « de » après une douzaine ou une grosse", () => {
    expect(quantiteEnMots(0, "pièce")).toBe("zéro pièce");
    expect(quantiteEnMots(1, "case")).toBe("une case");
    expect(quantiteEnMots(13, "case")).toBe("une douzaine et une cases");
    expect(quantiteEnMots(24, "pièce")).toBe("deux douzaines de pièces");
    expect(quantiteEnMots(63, "case")).toBe("cinq douzaines et trois cases");
    expect(quantiteEnMots(1728, "pièce")).toBe("une grande grosse de pièces");
  });

  it("arrondissent vers le bas, comme les chiffres, et refusent ce qui n'est pas un nombre", () => {
    expect(enMots(11.99)).toBe("onze");
    expect(enMots(12 - 1e-12)).toBe("une douzaine");
    expect(enMots(-1)).toBe("—");
    expect(quantiteEnMots(Number.NaN, "pièce")).toBe("—");
  });

  it("remplissent les textes, pour les mêmes clés", () => {
    expect(remplir("Il reste {cases:case}.", { cases: 63 }, EN_MOTS)).toBe(
      "Il reste cinq douzaines et trois cases.",
    );
    expect(remplir("Pièce {piece} : ajustée.", { piece: 14 }, EN_MOTS)).toBe(
      "Pièce une douzaine et deux : ajustée.",
    );
    expect(remplir("{production} par tour", { production: 56.5 }, EN_MOTS)).toBe(
      "quatre douzaines et huit par tour",
    );
  });
});

// La notation de l'atelier : la base douze, en chiffres (fiche, § 1).
import { describe, expect, it } from "vitest";
import { chiffres, formaterEntier, formaterPieces, remplir } from "./notation";

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

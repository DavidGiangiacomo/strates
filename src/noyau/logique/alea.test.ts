import { describe, expect, it } from "vitest";
import { creerAlea, deriverGraine, tirer, tirerEntier } from "./alea";

function suite(graine: number, n: number): number[] {
  const alea = creerAlea(graine);
  return Array.from({ length: n }, () => tirer(alea));
}

describe("le générateur à graine", () => {
  it("redonne la même suite pour la même graine", () => {
    expect(suite(42, 20)).toEqual(suite(42, 20));
  });

  it("donne des suites différentes pour des graines différentes", () => {
    expect(suite(42, 20)).not.toEqual(suite(43, 20));
  });

  it("tire dans [0, 1), avec une moyenne proche de 0,5", () => {
    const tirages = suite(7, 10_000);
    expect(tirages.every((x) => x >= 0 && x < 1)).toBe(true);
    const moyenne = tirages.reduce((a, b) => a + b, 0) / tirages.length;
    expect(moyenne).toBeGreaterThan(0.48);
    expect(moyenne).toBeLessThan(0.52);
  });

  it("reprend la suite après un aller-retour en JSON", () => {
    const alea = creerAlea(1234);
    tirer(alea);
    tirer(alea);
    const relu = JSON.parse(JSON.stringify(alea)) as typeof alea;
    expect(tirer(relu)).toBe(tirer(alea));
  });

  it("tire des entiers dans les bornes, bornes comprises", () => {
    const alea = creerAlea(99);
    const vus = new Set(Array.from({ length: 1000 }, () => tirerEntier(alea, 1, 6)));
    expect([...vus].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("la dérivation de graines", () => {
  it("est déterministe et dépend du sel", () => {
    expect(deriverGraine(5, 1)).toBe(deriverGraine(5, 1));
    const graines = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((n) => deriverGraine(5, n)));
    expect(graines.size).toBe(8);
  });

  it("donne un entier non signé sur 32 bits", () => {
    for (const sel of [0, 1, 8, 1e6]) {
      const g = deriverGraine(0xffffffff, sel);
      expect(Number.isInteger(g) && g >= 0 && g <= 0xffffffff).toBe(true);
    }
  });
});

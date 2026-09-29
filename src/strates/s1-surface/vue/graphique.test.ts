import { describe, expect, it } from "vitest";
import { hautGraphique, reperes } from "./graphique";

describe("l'échelle du graphique de production", () => {
  it("met le haut juste au-dessus du maximum : la courbe finit toujours en haut", () => {
    expect(hautGraphique([10, 50, 100])).toBeCloseTo(110, 10);
    expect(hautGraphique([])).toBe(1);
    expect(hautGraphique([0, 0])).toBe(1);
  });

  it("pose des repères ronds sous le haut", () => {
    expect(reperes([12_000, 76_600])).toEqual([20_000, 40_000, 60_000, 80_000]);
    expect(reperes([1_130_000])).toEqual([250_000, 500_000, 750_000, 1_000_000]);
    expect(reperes([0.25])).toEqual([0.1, 0.2]);
  });

  it("n'en pose aucun tant que la production est nulle", () => {
    expect(reperes([])).toEqual([]);
    expect(reperes([0, 0, 0])).toEqual([]);
  });

  it("en pose toujours de deux à quatre, d'un pas de 1, 2, 2,5 ou 5 × 10ⁿ", () => {
    for (let max = 0.25; max < 1e10; max *= 1.37) {
      const valeurs = reperes([max]);
      expect(valeurs.length).toBeGreaterThanOrEqual(2);
      expect(valeurs.length).toBeLessThanOrEqual(4);
      expect(valeurs.at(-1)!).toBeLessThan(hautGraphique([max]));
      const pas = valeurs[0]!;
      const mantisse = pas / 10 ** Math.floor(Math.log10(pas) + 1e-9);
      expect([1, 2, 2.5, 5].some((m) => Math.abs(m - mantisse) < 1e-9)).toBe(true);
    }
  });
});

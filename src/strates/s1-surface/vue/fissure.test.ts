import { describe, expect, it } from "vitest";
import { AMPLITUDE_FISSURE, cheminFissure, ramificationsFissure, sommetsFissure } from "./fissure";

describe("le tracé de la fissure", () => {
  const depart = { x: 300, y: 400 };
  const arrivee = { x: 860, y: 24 };

  it("part du graphique et arrive exactement sous le bouton « creuser »", () => {
    const sommets = sommetsFissure(depart, arrivee);
    expect(sommets[0]).toEqual(depart);
    expect(sommets.at(-1)!.x).toBeCloseTo(arrivee.x, 10);
    expect(sommets.at(-1)!.y).toBeCloseTo(arrivee.y, 10);
  });

  it("est une ligne brisée irrégulière, toujours la même", () => {
    const chemin = cheminFissure(depart, arrivee);
    expect(chemin).toBe(cheminFissure(depart, arrivee));
    expect(chemin.startsWith("M300.0,400.0 L")).toBe(true);

    const sommets = sommetsFissure(depart, arrivee);
    // Des pas irréguliers : ce n'est pas une courbe de graphique.
    const pas = sommets
      .slice(1)
      .map((s, i) => Math.hypot(s.x - sommets[i]!.x, s.y - sommets[i]!.y));
    expect(Math.max(...pas) / Math.min(...pas)).toBeGreaterThan(1.5);

    // Distance signée de chaque sommet à la droite départ-arrivée.
    const [dx, dy] = [arrivee.x - depart.x, arrivee.y - depart.y];
    const ecarts = sommets.map(
      ({ x, y }) => ((x - depart.x) * dy - (y - depart.y) * dx) / Math.hypot(dx, dy),
    );
    expect(Math.max(...ecarts.map(Math.abs))).toBeCloseTo(AMPLITUDE_FISSURE, 10);
  });

  it("se ramifie à partir de sommets du tracé principal", () => {
    const sommets = sommetsFissure(depart, arrivee);
    const ramifications = ramificationsFissure(depart, arrivee);
    expect(ramifications).toHaveLength(3);
    for (const { a, d } of ramifications) {
      expect(a).toBeGreaterThan(0);
      expect(a).toBeLessThan(1);
      const [x, y] = d.slice(1).split(" ")[0]!.split(",").map(Number);
      expect(sommets.some((s) => Math.abs(s.x - x!) < 0.06 && Math.abs(s.y - y!) < 0.06)).toBe(
        true,
      );
    }
  });
});

// Le dessin des pièces (fiche, § 6) : des dents qui s'intercalent, et le sens du mouvement.
import { describe, expect, it } from "vitest";
import { TOUR, type Cote } from "../logique/regles";
import { dents, periode, sens, UNITE } from "./dessin";

/** Les dents d'un côté, le long de la limite des cases, sur le plan : de haut en bas, ou de gauche à droite. */
const surLePlan = (d: Cote, s: number) =>
  dents(d, s)
    .map(({ x }) => (d <= 1 ? x : s * UNITE - x))
    .sort((a, b) => a - b);

describe("le dessin des pièces", () => {
  it("donne trois dents par case à chaque côté, dans les cases du côté", () => {
    expect(dents(0, 1)).toHaveLength(3);
    expect(dents(2, 2).map((x) => x.demi)).toEqual([0, 0, 0, 1, 1, 1]);
  });

  it("intercale les dents de deux côtés face à face, à droite et à gauche comme en bas et en haut", () => {
    for (const [a, b] of [
      [1, 3],
      [2, 0],
    ] as const) {
      const unes = surLePlan(a, 1);
      const autres = surLePlan(b, 1);
      expect(unes).toEqual([2.5, 4.5, 6.5]);
      expect(autres).toEqual([3.5, 5.5, 7.5]);
    }
    // Une grande pièce face à deux petites : les dents de la seconde case continuent.
    expect(surLePlan(1, 2)).toEqual([2.5, 4.5, 6.5, 12.5, 14.5, 16.5]);
  });

  it("fait tourner le ressort dans le sens horaire, et chaque rang à contresens du précédent", () => {
    expect([0, 1, 2, 3].map(sens)).toEqual(["horaire", "antihoraire", "horaire", "antihoraire"]);
  });

  it("fait faire au ressort un tour par tour de l'atelier, deux aux petites pièces, moins à celles qui frottent", () => {
    expect(periode(2, false)).toBe(TOUR);
    expect(periode(1, false)).toBe(TOUR / 2);
    expect(periode(1, true)).toBeGreaterThan(TOUR / 2);
  });
});

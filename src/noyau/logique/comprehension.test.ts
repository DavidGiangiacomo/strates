// Le barème de la Compréhension (docs/comprehension.md, § 2 ; D-007).
import { describe, expect, it } from "vitest";
import {
  ARRIVEE,
  BAREME,
  crediter,
  delaiLevee,
  formulesAccessibles,
  gainDesActes,
  KAPPA_MAX,
  poidsActe,
  PROGRESSION,
  SANS_AIDE,
  SANS_ARTEFACT,
} from "./comprehension";
import type { NumeroStrate } from "./types";

const STRATES = [1, 2, 3, 4, 5, 6, 7, 8] as const satisfies readonly NumeroStrate[];
const somme = (actes: Readonly<Record<string, number>>) =>
  Object.values(actes).reduce((a, n) => a + n, 0);

describe("le barème de la Compréhension", () => {
  it("suit la progression du §9 : de 0 à 100, en 8, 14, 16, 17, 15, 15, 11 et 4 points", () => {
    let kappa = 0;
    const paliers = STRATES.map((n) => (kappa += PROGRESSION[n]));
    expect(paliers).toEqual([8, 22, 38, 55, 70, 85, 96, 100]);
  });

  it("donne aux strates 1, 2, 3 et 8 toute leur progression, et jamais plus aux autres", () => {
    for (const n of [1, 2, 3, 8] as const) expect(somme(BAREME[n])).toBe(PROGRESSION[n]);
    // Les actes propres des strates 4 à 7 viendront avec leurs fiches.
    for (const n of [4, 5, 6, 7] as const) {
      expect(somme(BAREME[n])).toBeLessThan(PROGRESSION[n]);
    }
  });

  it("propose « sans aide » de la strate 1 à la 7, « sans artefact » de la 2 à la 7, l'arrivée au fond", () => {
    for (const n of STRATES) {
      expect(poidsActe(BAREME, n, SANS_AIDE) !== null).toBe(n <= 7);
      expect(poidsActe(BAREME, n, SANS_ARTEFACT) !== null).toBe(n >= 2 && n <= 7);
      expect(poidsActe(BAREME, n, ARRIVEE) !== null).toBe(n === 8);
    }
  });

  it("ne compte que des poids entiers et positifs", () => {
    for (const n of STRATES) {
      for (const poids of Object.values(BAREME[n])) {
        expect(Number.isInteger(poids) && poids > 0).toBe(true);
      }
    }
  });
});

describe("le gain des actes", () => {
  it("compte chaque acte une fois, et rien pour un acte que le barème ne connaît pas", () => {
    expect(gainDesActes(BAREME, 2, ["premier-hiver", SANS_AIDE, "premier-hiver"])).toBe(6);
    expect(gainDesActes(BAREME, 2, ["inconnu", "creuser-avant-fissure"])).toBe(0);
    expect(gainDesActes(BAREME, 1, [])).toBe(0);
  });

  it("ne prend pas pour un acte une propriété de tout objet", () => {
    expect(poidsActe(BAREME, 1, "constructor")).toBeNull();
    expect(poidsActe(BAREME, 1, "toString")).toBeNull();
    expect(gainDesActes(BAREME, 1, ["constructor", "__proto__"])).toBe(0);
  });
});

describe("le crédit de κ", () => {
  it("ajoute le gain, sans jamais dépasser 100", () => {
    expect(crediter(8, 14)).toBe(22);
    expect(crediter(96, 4)).toBe(KAPPA_MAX);
    expect(crediter(98, 14)).toBe(KAPPA_MAX);
  });

  it("ne fait jamais baisser κ", () => {
    expect(crediter(40, 0)).toBe(40);
    expect(crediter(40, -5)).toBe(40);
  });
});

describe("le délai de levée de l'opacité", () => {
  const minutes = (kappa: number) => delaiLevee(kappa) / 60;

  it("suit les paliers du §8 : 20 minutes à κ = 0, 8 à κ = 50, 3 à κ = 100", () => {
    expect(minutes(0)).toBeCloseTo(20, 9);
    expect(minutes(50)).toBeCloseTo(7.75, 2);
    expect(minutes(100)).toBeCloseTo(3, 9);
  });

  it("passe par les paliers intermédiaires de comprehension.md, § 3", () => {
    expect(Math.round(minutes(25))).toBe(12);
    expect(Math.round(minutes(70))).toBe(5);
    expect(Math.round(minutes(85))).toBe(4);
  });

  it("raccourcit à mesure que κ monte, et reste borné hors de 0 à 100", () => {
    for (let k = 1; k <= 100; k++) expect(delaiLevee(k)).toBeLessThan(delaiLevee(k - 1));
    expect(delaiLevee(-10)).toBe(delaiLevee(0));
    expect(delaiLevee(140)).toBe(delaiLevee(100));
  });
});

describe("les formules accessibles", () => {
  it("suivent les paliers de comprehension.md, § 3 : aucune à κ = 50, 40 % à 70, 70 % à 85, toutes à 100", () => {
    expect(formulesAccessibles(50, 10)).toBe(0);
    expect(formulesAccessibles(70, 10)).toBe(4);
    expect(formulesAccessibles(85, 10)).toBe(7);
    expect(formulesAccessibles(100, 10)).toBe(10);
  });

  it("viennent une à une dès κ = 51, en arrondissant au-dessus", () => {
    expect(formulesAccessibles(51, 5)).toBe(1);
    expect(formulesAccessibles(60, 5)).toBe(1);
    expect(formulesAccessibles(61, 5)).toBe(2);
    expect(formulesAccessibles(99, 5)).toBe(5);
    // La seule formule du noyau, la conversion, est accessible dès κ = 51.
    expect(formulesAccessibles(51, 1)).toBe(1);
  });

  it("tombent juste aux paliers, sans erreur d'arrondi, et restent bornées hors de 50 à 100", () => {
    for (let n = 0; n <= 40; n++) {
      for (let k = 50; k <= 100; k++) {
        // ⌈a / 50⌉ en nombres entiers : ⌊(a + 49) / 50⌋.
        const exact = Math.floor((n * (k - 50) + 49) / 50);
        expect(formulesAccessibles(k, n), `n = ${n}, κ = ${k}`).toBe(exact);
        if (k > 50)
          expect(formulesAccessibles(k, n)).toBeGreaterThanOrEqual(formulesAccessibles(k - 1, n));
      }
      expect(formulesAccessibles(0, n)).toBe(0);
      expect(formulesAccessibles(KAPPA_MAX + 20, n)).toBe(n);
    }
  });
});

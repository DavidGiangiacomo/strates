import { describe, expect, it } from "vitest";
import type { Reprise } from "../logique/horsligne";
import { formaterDuree, resumerReprise } from "./reprise";

const absence = (reprise: Partial<Extract<Reprise, { type: "absence" }>>): Reprise => ({
  type: "absence",
  politique: "standard",
  duree: 3600,
  comptee: 3600,
  lignes: [],
  ...reprise,
});

describe("formaterDuree", () => {
  it("écrit une durée en jours, heures et minutes, sans les secondes", () => {
    expect(formaterDuree(0)).toBe("moins d'une minute");
    expect(formaterDuree(59)).toBe("moins d'une minute");
    expect(formaterDuree(60)).toBe("1 min");
    expect(formaterDuree(45 * 60 + 30)).toBe("45 min");
    expect(formaterDuree(3600)).toBe("1 h");
    expect(formaterDuree(5 * 3600 + 12 * 60)).toBe("5 h 12 min");
    expect(formaterDuree(86400)).toBe("1 j");
    expect(formaterDuree(3 * 86400 + 4 * 3600 + 59 * 60)).toBe("3 j 4 h");
  });
});

describe("resumerReprise", () => {
  it("ne dit rien sans absence, ni pour une absence de moins d'une minute", () => {
    expect(resumerReprise({ type: "aucune" })).toBeNull();
    expect(resumerReprise({ type: "recul", recul: 7200, perturbation: true })).toBeNull();
    expect(resumerReprise(absence({ duree: 59, comptee: 59 }))).toBeNull();
  });

  it("résume le hors-ligne standard", () => {
    expect(resumerReprise(absence({ duree: 5400, comptee: 5400 }))).toEqual([
      "Pendant votre absence (1 h 30 min), la production a continué, à 80 %.",
    ]);
  });

  it("signale le plafond quand il est atteint", () => {
    expect(resumerReprise(absence({ duree: 3 * 86400, comptee: 12 * 3600 }))).toEqual([
      "Pendant votre absence (3 j), la production a continué, à 80 %, pendant les 12 premières heures.",
    ]);
  });

  it("reprend les lignes de la strate en politique propre", () => {
    const lignes = ["Deux échéances sont tombées.", "Une promesse a été honorée."];
    expect(resumerReprise(absence({ politique: "propre", lignes }))).toEqual([
      "Pendant votre absence (1 h) :",
      ...lignes,
    ]);
    expect(resumerReprise(absence({ politique: "propre" }))).toBeNull();
  });

  it("ne dit rien au fond", () => {
    expect(resumerReprise(absence({ politique: "aucune", comptee: 0 }))).toBeNull();
  });
});

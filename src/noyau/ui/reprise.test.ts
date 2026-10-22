import { describe, expect, it } from "vitest";
import type { Reprise } from "../logique/horsligne";
import {
  ABSENCE_A_RAPPELER,
  composerReprise,
  formaterDuree,
  lieu,
  resumerAbsence,
} from "./reprise";

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

describe("resumerAbsence", () => {
  it("ne dit rien sans absence, ni pour une absence de moins d'une minute", () => {
    expect(resumerAbsence({ type: "aucune" })).toBeNull();
    expect(resumerAbsence({ type: "recul", recul: 7200, perturbation: true })).toBeNull();
    expect(resumerAbsence(absence({ duree: 59, comptee: 59 }))).toBeNull();
  });

  it("constate le hors-ligne standard, sans « votre » (bible, § 10)", () => {
    expect(resumerAbsence(absence({ duree: 5400, comptee: 5400 }))).toEqual([
      "Absence : 1 h 30 min, comptée à 80 %.",
    ]);
  });

  it("signale le plafond quand il est atteint", () => {
    expect(resumerAbsence(absence({ duree: 3 * 86400, comptee: 12 * 3600 }))).toEqual([
      "Absence : 3 j, comptée à 80 % sur 12 h.",
    ]);
  });

  it("fait suivre la durée des lignes de la strate, en politique propre", () => {
    const lignes = ["Deux échéances sont tombées.", "Une promesse a été honorée."];
    expect(resumerAbsence(absence({ politique: "propre", lignes }))).toEqual([
      "Absence : 1 h.",
      ...lignes,
    ]);
    expect(resumerAbsence(absence({ politique: "propre" }))).toBeNull();
  });

  it("ne dit rien au fond", () => {
    expect(resumerAbsence(absence({ politique: "aucune", comptee: 0 }))).toBeNull();
  });
});

describe("composerReprise", () => {
  const lignes = ["Hiver de l'an 7 : passé sans rupture.", "Grands hivers de suite : 2."];

  it("écrit le lieu comme le bandeau et l'écran de fouille", () => {
    expect(lieu(1)).toBe("Profondeur 1 · La surface");
    expect(lieu(2)).toBe("Profondeur 2 · Les caves");
  });

  it("rappelle, après une demi-heure d'absence, le lieu puis les lignes de la strate, avant le résumé", () => {
    expect(composerReprise(absence({ duree: 8 * 3600, comptee: 8 * 3600 }), 2, lignes)).toEqual({
      rappel: ["Profondeur 2 · Les caves", ...lignes],
      absence: ["Absence : 8 h, comptée à 80 %."],
    });
    const juste = absence({ duree: ABSENCE_A_RAPPELER, comptee: ABSENCE_A_RAPPELER });
    expect(composerReprise(juste, 2, lignes)?.rappel).toHaveLength(3);
  });

  it("tient en trois lignes, lieu compris", () => {
    const trop = [...lignes, "Une ligne de trop."];
    expect(composerReprise(absence({ duree: 7200 }), 2, trop)?.rappel).toEqual([
      "Profondeur 2 · Les caves",
      ...lignes,
    ]);
  });

  it("ne rappelle rien après une pause : le résumé paraît seul", () => {
    const pause = absence({ duree: ABSENCE_A_RAPPELER - 1, comptee: ABSENCE_A_RAPPELER - 1 });
    expect(composerReprise(pause, 2, lignes)).toEqual({
      rappel: [],
      absence: ["Absence : 29 min, comptée à 80 %."],
    });
  });

  it("rappelle le lieu seul quand la strate n'a rien à dire, et sans résumé quand l'absence n'en a pas", () => {
    expect(
      composerReprise(absence({ politique: "aucune", duree: 7200, comptee: 0 }), 8, []),
    ).toEqual({ rappel: ["Profondeur 8 · Le fond"], absence: [] });
  });

  it("ne dit rien sans absence, ni après un recul d'horloge ou une absence de quelques secondes", () => {
    expect(composerReprise({ type: "aucune" }, 1, lignes)).toBeNull();
    expect(
      composerReprise({ type: "recul", recul: 7200, perturbation: true }, 1, lignes),
    ).toBeNull();
    expect(composerReprise(absence({ duree: 30, comptee: 30 }), 1, lignes)).toBeNull();
  });
});

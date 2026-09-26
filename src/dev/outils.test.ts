import { describe, expect, it } from "vitest";
import { creerEtatNoyau, type EtatNoyau } from "../noyau/logique/etat";
import type { EntreeJournal, NumeroStrate } from "../noyau/logique/types";
import {
  copierEtat,
  entreeCourante,
  lireArtefacts,
  modifierEtat,
  recaler,
  sauterA,
  simulerAbsence,
  simulerRecul,
} from "./outils";

const entree = (strate: NumeroStrate, arrivee: number): EntreeJournal => ({
  strate,
  arrivee,
  tempsDeJeu: 0,
  tempsHorsLigne: 0,
  aideConsultee: false,
  perturbations: [],
});

/** Une partie à la strate 2, avec l'état de la strate 1 gardé. */
function partie(): EtatNoyau {
  const etat = creerEtatNoyau(7, 1_000);
  etat.profondeur = 2;
  etat.reference = 50_000;
  etat.strates[1] = { version: 1, etat: { credits: 5 } };
  etat.strates[2] = { version: 3, etat: { grain: 9 } };
  etat.meta.journal.strates.push(
    { ...entree(1, 1_000), seuil: { le: 20_000 }, perturbations: [{ le: 10_000, recul: 400 }] },
    entree(2, 30_000),
  );
  return etat;
}

describe("les outils de développement", () => {
  it("copient l'état à travers le format de sauvegarde, sans lien avec l'original", () => {
    const etat = partie();
    const copie = copierEtat(etat, "0.0.0");
    expect(copie).toEqual(etat);
    copie.artefacts.push("s1-turbine");
    (copie.strates[1]!.etat as { credits: number }).credits = 99;
    expect(etat.artefacts).toEqual([]);
    expect(etat.strates[1]!.etat).toEqual({ credits: 5 });
  });

  it("sautent à une strate plus profonde, qui repart de zéro", () => {
    const etat = sauterA(partie(), 3);
    expect(etat.profondeur).toBe(3);
    expect(Object.keys(etat.strates)).toEqual(["1", "2"]);
    expect(etat.meta.journal.strates.map((e) => e.strate)).toEqual([1, 2]);
  });

  it("recommencent une strate, ou reviennent à une strate moins profonde en oubliant les autres", () => {
    expect(Object.keys(sauterA(partie(), 2).strates)).toEqual(["1"]);
    const etat = sauterA(partie(), 1);
    expect(etat).toMatchObject({ profondeur: 1, strates: {} });
    expect(etat.meta.journal.strates).toEqual([]);
  });

  it("recalent une sauvegarde sur l'heure courante, en décalant tous les horodatages", () => {
    const etat = recaler(partie(), 1_050_000);
    expect(etat.reference).toBe(1_050_000);
    expect(etat.partieCreeeLe).toBe(1_001_000);
    const [s1, s2] = etat.meta.journal.strates;
    expect(s1).toMatchObject({ arrivee: 1_001_000, seuil: { le: 1_020_000 } });
    expect(s1!.perturbations).toEqual([{ le: 1_010_000, recul: 400 }]);
    expect(s2!.arrivee).toBe(1_030_000);
  });

  it("remplacent l'état de la strate courante, les artefacts et κ, ramené entre 0 et 100", () => {
    const etat = modifierEtat(partie(), {
      strate: { grain: 1e6 },
      artefacts: ["a", "b"],
      kappa: 140,
    });
    expect(etat.strates[2]!.etat).toEqual({ grain: 1e6 });
    expect(etat.strates[1]!.etat).toEqual({ credits: 5 });
    expect(etat).toMatchObject({ artefacts: ["a", "b"], kappa: 100 });
    expect(modifierEtat(partie(), { kappa: -3 }).kappa).toBe(0);
    expect(() => modifierEtat(partie(), { kappa: NaN })).toThrow(/κ/);
  });

  it("lisent une liste d'artefacts saisie à la main", () => {
    expect(lireArtefacts(" s1-turbine, s1-contrat  s1-turbine;s2-silo ")).toEqual([
      "s1-turbine",
      "s1-contrat",
      "s2-silo",
    ]);
    expect(lireArtefacts("  ")).toEqual([]);
  });

  it("simulent une absence et un recul d'horloge en déplaçant la référence", () => {
    const etat = partie();
    simulerAbsence(etat, 3_600);
    expect(etat.reference).toBe(50_000 - 3_600_000);
    simulerRecul(etat, 7_200);
    expect(etat.reference).toBe(50_000 + 3_600_000);
  });

  it("trouvent l'entrée de journal de la strate courante", () => {
    expect(entreeCourante(partie())?.arrivee).toBe(30_000);
    expect(entreeCourante(creerEtatNoyau(1, 0))).toBeUndefined();
  });
});

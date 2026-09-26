import { describe, expect, it } from "vitest";
import { creerEtatNoyau, noterInstant, type EtatNoyau } from "./etat";
import {
  comparerVersions,
  ecrireSauvegarde,
  FORMAT_SAUVEGARDE,
  lireSauvegarde,
  type Sauvegarde,
} from "./sauvegarde";

function etatExemple(): EtatNoyau {
  const etat = creerEtatNoyau(123, 1_700_000_000_000);
  etat.profondeur = 2;
  etat.artefacts = ["s1-turbine", "s1-contrat"];
  etat.kappa = 9;
  etat.strates[1] = { version: 1, etat: { unites: 5, cumul: 2e9, generateurs: 3, alea: { s: 9 } } };
  etat.strates[2] = { version: 1, etat: { grain: 10 } };
  etat.meta.journal.strates.push(
    {
      strate: 1,
      arrivee: 1_700_000_000_000,
      tempsDeJeu: 4500,
      tempsHorsLigne: 120,
      aideConsultee: false,
      seuil: { le: 1_700_000_004_500 },
      fouille: { points: 13, emportes: ["s1-turbine", "s1-contrat"], abandonnes: ["s1-brevet"] },
      perturbations: [],
    },
    {
      strate: 2,
      arrivee: 1_700_000_004_600,
      tempsDeJeu: 60,
      tempsHorsLigne: 0,
      aideConsultee: true,
      perturbations: [{ le: 1_700_000_004_700, recul: 3600 }],
    },
  );
  return etat;
}

/** Relit un texte de sauvegarde, le modifie, et le réécrit. */
function modifier(texte: string, changement: (s: Sauvegarde) => void): string {
  const s = JSON.parse(texte) as Sauvegarde;
  changement(s);
  return JSON.stringify(s);
}

describe("l'écriture et la relecture d'une sauvegarde", () => {
  it("rendent exactement l'état du noyau", () => {
    const etat = etatExemple();
    const lecture = lireSauvegarde(ecrireSauvegarde(etat, "0.1.0"), "0.1.0");
    expect(lecture).toEqual({ type: "ok", etat, versionJeu: "0.1.0" });
  });

  it("écrivent le format courant et la version du jeu", () => {
    const s = JSON.parse(ecrireSauvegarde(etatExemple(), "0.4.2")) as Sauvegarde;
    expect(s.format).toBe(FORMAT_SAUVEGARDE);
    expect(s.versionJeu).toBe("0.4.2");
    expect(Object.keys(s.strates)).toEqual(["1", "2"]);
  });

  it("acceptent une sauvegarde d'une version antérieure du jeu", () => {
    const texte = ecrireSauvegarde(etatExemple(), "0.1.0");
    expect(lireSauvegarde(texte, "0.2.0").type).toBe("ok");
  });
});

describe("une sauvegarde plus récente que le jeu", () => {
  it("est reconnue par la version du jeu", () => {
    const texte = ecrireSauvegarde(etatExemple(), "0.3.0");
    expect(lireSauvegarde(texte, "0.2.9")).toEqual({ type: "plus-recente", versionJeu: "0.3.0" });
  });

  it("est reconnue par son format", () => {
    const texte = modifier(ecrireSauvegarde(etatExemple(), "0.1.0"), (s) => {
      s.format = FORMAT_SAUVEGARDE + 1;
    });
    expect(lireSauvegarde(texte, "0.1.0").type).toBe("plus-recente");
  });
});

describe("les migrations du format global", () => {
  it("s'appliquent dans l'ordre, du format de la sauvegarde au format courant", () => {
    // Un format 1 qui n'avait ni graine ni référence, migré jusqu'à un format 3 hypothétique.
    const ancienne = modifier(ecrireSauvegarde(etatExemple(), "0.1.0"), (s) => {
      const brut = s as unknown as Record<string, unknown>;
      delete (s.noyau as Partial<Sauvegarde["noyau"]>).graine;
      delete brut.reference;
    });
    const migrations = {
      1: (s: unknown) => {
        const x = s as Sauvegarde;
        return { ...x, format: 2, noyau: { ...x.noyau, graine: 1 } };
      },
      2: (s: unknown) => {
        const x = s as Sauvegarde;
        return { ...x, format: 3, reference: x.partieCreeeLe };
      },
    };
    const lecture = lireSauvegarde(ancienne, "0.1.0", migrations, 3);
    expect(lecture.type).toBe("ok");
    if (lecture.type === "ok") {
      expect(lecture.etat.graine).toBe(1);
      expect(lecture.etat.reference).toBe(lecture.etat.partieCreeeLe);
    }
  });

  it("rendent la sauvegarde illisible s'il en manque une", () => {
    const texte = ecrireSauvegarde(etatExemple(), "0.1.0");
    const lecture = lireSauvegarde(texte, "0.1.0", {}, 2);
    expect(lecture).toMatchObject({ type: "illisible", raison: /migration manquante/ });
  });
});

describe("une sauvegarde illisible", () => {
  const valide = () => ecrireSauvegarde(etatExemple(), "0.1.0");

  it.each([
    ["du texte qui n'est pas du JSON", "{pas du json"],
    ["un tableau", "[]"],
    ["un format absent", '{"versionJeu":"0.1.0"}'],
    ["un format négatif", '{"format":-1}'],
  ])("est reconnue : %s", (_, texte) => {
    expect(lireSauvegarde(texte, "0.1.0").type).toBe("illisible");
  });

  it.each<[string, (s: Sauvegarde) => void]>([
    ["profondeur non entière", (s) => void (s.noyau.profondeur = 1.5 as never)],
    ["profondeur hors de 1 à 8", (s) => void (s.noyau.profondeur = 9 as never)],
    ["artefact non textuel", (s) => void (s.noyau.artefacts = [3 as never])],
    ["graine négative", (s) => void (s.noyau.graine = -1)],
    ["strate inconnue", (s) => void (s.strates["9"] = { version: 1, etat: {} })],
    ["strate sans version", (s) => void (s.strates["1"] = { etat: {} } as never)],
    ["journal abîmé", (s) => void (s.noyau.meta.journal.strates = [{ strate: 1 } as never])],
    ["référence absente", (s) => void delete (s as Partial<Sauvegarde>).reference],
  ])("est reconnue : %s", (_, changement) => {
    expect(lireSauvegarde(modifier(valide(), changement), "0.1.0").type).toBe("illisible");
  });
});

describe("la comparaison de versions", () => {
  it.each([
    ["0.1.0", "0.1.0", 0],
    ["0.2.0", "0.1.9", 1],
    ["0.10.0", "0.9.0", 1],
    ["1.0.0", "0.99.99", 1],
    ["0.1.0", "0.1.1", -1],
    ["0.1.0-beta", "0.1.0", 0],
  ])("%s comparée à %s", (a, b, signe) => {
    expect(Math.sign(comparerVersions(a, b))).toBe(signe);
  });
});

describe("la référence d'horloge", () => {
  it("avance avec le temps, mais ne recule jamais", () => {
    const etat = creerEtatNoyau(1, 1_000);
    noterInstant(etat, 5_000);
    expect(etat.reference).toBe(5_000);
    noterInstant(etat, 2_000);
    expect(etat.reference).toBe(5_000);
  });
});

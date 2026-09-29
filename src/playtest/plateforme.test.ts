// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import { FORMAT_JOURNAL } from "./journal";
import {
  arreterJournal,
  demandeJournal,
  demarrerGardeJournal,
  garderJournal,
  nomExport,
  ouvrirJournal,
  type ContexteJournal,
} from "./plateforme";

const JEU = "https://davidgiangiacomo.github.io/strates/";

function contexte(adresse: string, horloge = 1_790_000_000_000): ContexteJournal {
  return {
    url: new URL(adresse),
    zone: localStorage,
    horloge: () => horloge,
    meta: () => ({
      version: "0.0.0",
      build: "abc1234",
      navigateur: "essai",
      fenetre: { largeur: 1280, hauteur: 720 },
      mouvementReduit: false,
    }),
  };
}

beforeEach(() => localStorage.clear());

describe("l'activation du journal", () => {
  it("se lit dans l'adresse : un code de testeur, « non » pour arrêter, rien sinon", () => {
    expect(demandeJournal(new URL(`${JEU}?journal=T3`))).toEqual({ code: "T3" });
    expect(demandeJournal(new URL(`${JEU}?journal=non`))).toBe("arret");
    expect(demandeJournal(new URL(JEU))).toBeNull();
    // Un code n'est que quelques lettres et chiffres : rien qui puisse identifier quelqu'un.
    expect(demandeJournal(new URL(`${JEU}?journal=jean.dupont@exemple.fr`))).toBeNull();
  });

  it("n'ouvre rien sans qu'on le demande", () => {
    expect(ouvrirJournal(contexte(JEU))).toBeNull();
  });

  it("ouvre un journal neuf pour un code, et le reprend au rechargement, même sans le code", () => {
    const neuf = ouvrirJournal(contexte(`${JEU}?journal=T3`))!;
    expect(neuf.meta).toMatchObject({ format: FORMAT_JOURNAL, testeur: "T3", build: "abc1234" });
    neuf.noter({ type: "phase", phase: "jeu" });
    garderJournal(neuf, localStorage);

    const repris = ouvrirJournal(contexte(JEU))!;
    expect(repris.meta.testeur).toBe("T3");
    expect(repris.evenements).toHaveLength(1);
  });

  it("garde un journal par testeur : un nouveau code n'efface pas le précédent", () => {
    const t3 = ouvrirJournal(contexte(`${JEU}?journal=T3`))!;
    t3.noter({ type: "phase", phase: "jeu" });
    garderJournal(t3, localStorage);
    const t4 = ouvrirJournal(contexte(`${JEU}?journal=T4`))!;
    expect(t4.evenements).toHaveLength(0);
    expect(ouvrirJournal(contexte(`${JEU}?journal=T3`))!.evenements).toHaveLength(1);
  });

  it("s'arrête : le journal garde ce qu'il a, et ne reprend plus au rechargement", () => {
    const journal = ouvrirJournal(contexte(`${JEU}?journal=T3`))!;
    arreterJournal(journal, localStorage);
    expect(journal.actif).toBe(false);
    expect(ouvrirJournal(contexte(JEU))).toBeNull();
    expect(ouvrirJournal(contexte(`${JEU}?journal=non`))).toBeNull();
  });

  it("nomme le fichier exporté du code et du jour", () => {
    const journal = ouvrirJournal(contexte(`${JEU}?journal=T3`, Date.UTC(2026, 8, 29, 14)))!;
    expect(nomExport(journal)).toBe("strates-journal-T3-2026-09-29.json");
  });

  it("survit à un stockage plein : seule la copie locale manque", () => {
    const journal = ouvrirJournal(contexte(`${JEU}?journal=T3`))!;
    const plein = {
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    } as unknown as Storage;
    expect(garderJournal(journal, plein)).toBe(false);
  });
});

describe("la conservation du journal", () => {
  it("écrit le journal une dernière fois quand on arrête de le garder", () => {
    const journal = ouvrirJournal(contexte(`${JEU}?journal=T3`))!;
    journal.noter({ type: "phase", phase: "jeu" });
    const arreter = demarrerGardeJournal(journal, localStorage);
    arreter();
    expect(ouvrirJournal(contexte(JEU))!.evenements).toHaveLength(1);
  });
});

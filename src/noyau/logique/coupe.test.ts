// La coupe (#47) : les huit couches, tirées du journal de partie. Les couches atteintes donnent leur
// temps de jeu ; les couches quittées, leurs objets abandonnés et l'issue de leur seuil ; les autres
// restent inconnues.
import { describe, expect, it } from "vitest";
import { COUCHES, coupe } from "./coupe";
import type { EntreeJournal, Journal, NumeroStrate } from "./types";

const entree = (strate: NumeroStrate, autres: Partial<EntreeJournal> = {}): EntreeJournal => ({
  strate,
  arrivee: 0,
  tempsDeJeu: 0,
  tempsHorsLigne: 0,
  aideConsultee: false,
  actes: [],
  leves: [],
  nommes: [],
  perturbations: [],
  ...autres,
});
const journal = (...strates: EntreeJournal[]): Journal => ({ strates });

describe("la coupe", () => {
  it("montre les huit couches, de la surface au fond, et laisse inconnues celles qu'on n'a pas atteintes", () => {
    const couches = coupe(journal(entree(1, { tempsDeJeu: 600 })), 1);
    expect(couches.map((c) => c.strate)).toEqual([...COUCHES]);
    expect(couches[0]).toEqual({
      strate: 1,
      atteinte: true,
      courante: true,
      tempsDeJeu: 600,
      issue: null,
      abandonnes: [],
      perturbee: false,
    });
    expect(couches.slice(1).every((c) => !c.atteinte)).toBe(true);
    expect(couches[1]).toEqual({ strate: 2, atteinte: false });
  });

  it("donne d'une couche quittée le temps de jeu seul, et les objets abandonnés à sa fouille", () => {
    const couches = coupe(
      journal(
        entree(1, {
          tempsDeJeu: 4500,
          tempsHorsLigne: 43_200,
          seuil: { le: 1 },
          fouille: { points: 12, emportes: ["s1-equipe"], abandonnes: ["s1-filiale", "s1-plan"] },
        }),
        entree(2, { tempsDeJeu: 120 }),
      ),
      2,
    );
    expect(couches[0]).toMatchObject({
      courante: false,
      tempsDeJeu: 4500,
      abandonnes: ["s1-filiale", "s1-plan"],
    });
    expect(couches[1]).toMatchObject({ courante: true, tempsDeJeu: 120, abandonnes: [] });
    expect(couches.slice(2).every((c) => !c.atteinte)).toBe(true);
  });

  it("note l'issue d'un seuil quitté, mais rien de celui de la couche en cours", () => {
    const quittee = entree(6, { seuil: { le: 1, issue: "defaut" } });
    expect(coupe(journal(quittee, entree(7)), 7)[5]).toMatchObject({ issue: "defaut" });
    expect(coupe(journal(quittee), 6)[5]).toMatchObject({ courante: true, issue: null });
  });

  it("marque la couche où l'horloge a reculé", () => {
    const perturbee = entree(1, { perturbations: [{ le: 5, recul: 3600 }] });
    expect(coupe(journal(perturbee, entree(2)), 2).map((c) => c.atteinte && c.perturbee)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it("garde une couche atteinte que le journal n'a pas, sans temps", () => {
    expect(coupe(journal(entree(3)), 3)[1]).toMatchObject({ atteinte: true, tempsDeJeu: null });
  });
});

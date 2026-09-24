import { describe, expect, it } from "vitest";
import { EFFETS_NEUTRES } from "../../../noyau/logique/effets";
import type { ContexteTick, EvenementStrate } from "../../../noyau/logique/types";
import { coutGenerateur, creerLogiqueFactice, SEUIL_FACTICE } from ".";

const logique = creerLogiqueFactice(1);

function contexte(multiplicateur = 1): ContexteTick & { evenements: EvenementStrate[] } {
  const evenements: EvenementStrate[] = [];
  return {
    evenements,
    effets: { ...EFFETS_NEUTRES, multiplicateur: () => multiplicateur },
    emettre: (e) => evenements.push(e),
  };
}

const etatNeuf = () => logique.etatInitial({ graine: 1, journal: { strates: [] } });

describe("la strate factice", () => {
  it("produit à la main", () => {
    const etat = etatNeuf();
    logique.agir(etat, { type: "produire" }, contexte());
    expect(etat).toMatchObject({ unites: 1, cumul: 1 });
  });

  it("achète un générateur si elle en a les moyens, et signale le premier achat", () => {
    const etat = etatNeuf();
    const ctx = contexte();
    logique.agir(etat, { type: "acheter" }, ctx);
    expect(etat.generateurs).toBe(0);
    etat.unites = coutGenerateur(0);
    logique.agir(etat, { type: "acheter" }, ctx);
    expect(etat).toMatchObject({ unites: 0, generateurs: 1 });
    expect(ctx.evenements).toEqual([{ type: "acte", acte: "premier-achat" }]);
  });

  it("produit avec le temps, multiplié par les artefacts", () => {
    const etat = { ...etatNeuf(), generateurs: 2 };
    logique.tick(etat, 1, contexte(1.5));
    expect(etat.cumul).toBe(3);
  });

  it("tente sa chance de façon reproductible", () => {
    const a = etatNeuf();
    const b = etatNeuf();
    for (let i = 0; i < 20; i++) {
      logique.agir(a, { type: "hasard" }, contexte());
      logique.agir(b, { type: "hasard" }, contexte());
    }
    expect(a).toEqual(b);
    expect(a.cumul).toBeGreaterThanOrEqual(20);
    expect(a.cumul).toBeLessThanOrEqual(120);
  });

  it("atteint son seuil au cumul, pas au stock, et convertit son cumul", () => {
    const etat = { ...etatNeuf(), unites: 0, cumul: SEUIL_FACTICE };
    expect(logique.seuil(etat).atteint).toBe(true);
    expect(logique.valeurConvertible(etat)).toBe(SEUIL_FACTICE);
  });
});

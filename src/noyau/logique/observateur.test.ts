// Ce que le noyau signale à son observateur, le journal de session des playtests (#26).
import { describe, expect, it } from "vitest";
import { creerLogiqueFactice, type EtatFactice } from "../../strates/factice/logique";
import { creerEtatNoyau } from "./etat";
import { Noyau } from "./noyau";
import { Registre, type StrateQuelconque } from "./registre";
import type { ActionBase, EvenementStrate } from "./types";

async function noyauDemarre(releve = true): Promise<Noyau> {
  const logique = {
    ...creerLogiqueFactice(1),
    ...(releve ? { releve: (e: EtatFactice) => ({ unites: e.unites, cumul: e.cumul }) } : {}),
  };
  const registre = new Registre();
  registre.enregistrer(1, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
  const noyau = new Noyau(registre, creerEtatNoyau(1, 0));
  await noyau.demarrer(0);
  return noyau;
}

describe("l'observateur du noyau", () => {
  it("apprend chaque action une fois appliquée, avec l'état qui en résulte", async () => {
    const noyau = await noyauDemarre();
    const vues: { action: ActionBase; unites: unknown }[] = [];
    noyau.observateur = {
      action: (action) => vues.push({ action, unites: noyau.releve()?.unites }),
    };
    noyau.agir({ type: "produire" });
    noyau.agir({ type: "produire" });
    expect(vues).toEqual([]);
    noyau.tick(0);
    expect(vues).toEqual([
      { action: { type: "produire" }, unites: 1 },
      { action: { type: "produire" }, unites: 2 },
    ]);
  });

  it("apprend les événements de la strate, qui restent aussi au noyau", async () => {
    const noyau = await noyauDemarre();
    const vus: EvenementStrate[] = [];
    noyau.observateur = { evenement: (e) => vus.push(e) };
    (noyau.etatStrate as EtatFactice).unites = 10;
    noyau.agir({ type: "acheter" });
    noyau.tick(0);
    expect(vus).toEqual([{ type: "acte", acte: "premier-achat" }]);
    expect(noyau.viderEvenements()).toEqual(vus);
  });

  it("donne le relevé de la strate, ou null si elle n'en a pas", async () => {
    expect((await noyauDemarre()).releve()).toEqual({ unites: 0, cumul: 0 });
    expect((await noyauDemarre(false)).releve()).toBeNull();
  });
});

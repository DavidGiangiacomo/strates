// @vitest-environment happy-dom
import { flushSync } from "svelte";
import { describe, expect, it } from "vitest";
import { creerLogiqueFactice, type EtatFactice } from "../../strates/factice/logique";
import { creerEtatNoyau } from "../logique/etat";
import { Noyau } from "../logique/noyau";
import { Registre } from "../logique/registre";
import { rendreStrateReactive } from "./reactivite.svelte";

async function noyauDemarre(): Promise<Noyau> {
  const registre = new Registre();
  registre.enregistrer(1, async () => ({ logique: creerLogiqueFactice(1), vue: null, textes: {} }));
  const noyau = new Noyau(registre, creerEtatNoyau(1, 0));
  await noyau.demarrer(0);
  return noyau;
}

describe("l'état réactif d'une strate", () => {
  it("se met à jour quand la logique le modifie à travers le noyau", async () => {
    const noyau = await noyauDemarre();
    rendreStrateReactive(noyau);
    const etat = noyau.etatStrate as EtatFactice;

    const vus: number[] = [];
    const detruire = $effect.root(() => {
      $effect(() => {
        vus.push(etat.unites);
      });
      flushSync();

      noyau.agir({ type: "produire" });
      noyau.avancer(0.1);
      flushSync();
      noyau.agir({ type: "produire" });
      noyau.agir({ type: "produire" });
      noyau.avancer(0.1);
      flushSync();
    });
    detruire();

    expect(vus).toEqual([0, 1, 3]);
  });

  it("n'écrit pas dans l'objet d'origine : le noyau doit garder l'enveloppe", async () => {
    const noyau = await noyauDemarre();
    const origine = noyau.etatStrate as EtatFactice;
    rendreStrateReactive(noyau);

    noyau.agir({ type: "produire" });
    noyau.avancer(0.1);

    expect((noyau.etatStrate as EtatFactice).unites).toBe(1);
    expect(noyau.etatStrate).not.toBe(origine);
    expect(origine.unites).toBe(0);
    expect(JSON.parse(JSON.stringify(noyau.etatStrate))).toMatchObject({ unites: 1, cumul: 1 });
  });
});

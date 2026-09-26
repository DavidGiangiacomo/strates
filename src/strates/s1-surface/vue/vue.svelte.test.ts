// @vitest-environment happy-dom
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { strate } from "..";
import type { CommandesNoyau } from "../../../noyau/logique/types";
import type { ActionSurface, EtatSurface } from "../logique";
import { etatInitial } from "../logique/etat";
import Vue from "./Vue.svelte";

const commandes: CommandesNoyau = { demanderFouille() {}, ouvrirAide() {}, terminer() {} };

let composant: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (composant) unmount(composant);
  composant = null;
  document.body.innerHTML = "";
});

function monter(modifs: (etat: EtatSurface) => void = () => {}) {
  const etat = $state(etatInitial());
  modifs(etat);
  const actions: ActionSurface[] = [];
  composant = mount(Vue, {
    target: document.body,
    props: {
      etat,
      agir: (action: ActionSurface) => actions.push(action),
      noyau: commandes,
      o: (cle: string) => strate.textes[cle] ?? `?${cle}`,
      mode: "jeu",
    },
  });
  flushSync();
  return { etat, actions };
}

const texte = (selecteur: string) => document.querySelector(selecteur)?.textContent?.trim() ?? "";
const boutons = () => [...document.querySelectorAll("button")];
const bouton = (debut: string) => boutons().find((b) => b.textContent?.trim().startsWith(debut));

describe("la vue de la surface", () => {
  it("affiche les indicateurs, le premier objectif et le bouton Produire", () => {
    const { actions } = monter();
    expect(texte("[data-test=credits]")).toBe("0 cr");
    expect(texte("[data-test=production]")).toBe("0,00 cr/s");
    expect(texte("[data-test=objectif]")).toContain("Produire 15 cr");
    bouton("Produire")!.click();
    expect(actions).toEqual([{ type: "produire" }]);
  });

  it("n'utilise que des clés de texte qui existent", () => {
    monter((etat) => {
      etat.cumul = 1e12;
      etat.credits = 1e12;
      Object.assign(etat.generateurs, { poste: 50, equipe: 50, serveur: 50, chaine: 50 });
      Object.assign(etat.generateurs, { turbine: 50, usine: 50, filiale: 50 });
    });
    expect(document.body.textContent).not.toContain("?");
  });

  it("montre un générateur à la moitié de son coût, et désactive ce qu'on ne peut pas payer", () => {
    const { etat, actions } = monter();
    expect(document.querySelector("[data-test=generateur-poste]")).toBeNull();

    etat.cumul = 10;
    etat.credits = 10;
    flushSync();
    const poste = document.querySelector("[data-test=generateur-poste]")!;
    expect(poste.textContent).toContain("Poste");
    const [un, dix, max] = [...poste.querySelectorAll("button")];
    expect([un!.disabled, dix!.disabled, max!.disabled]).toEqual([true, true, true]);

    etat.credits = 20;
    flushSync();
    expect([un!.disabled, dix!.disabled, max!.disabled]).toEqual([false, true, false]);
    un!.click();
    max!.click();
    expect(actions).toEqual([
      { type: "acheter", generateur: "poste", quantite: 1 },
      { type: "acheter", generateur: "poste", quantite: "max" },
    ]);
  });

  it("propose les améliorations disponibles, avec leur effet et leur coût", () => {
    const { actions } = monter((etat) => {
      etat.generateurs.poste = 10;
      etat.cumul = 400;
      etat.credits = 400;
    });
    const doubleEcran = bouton("Double écran")!;
    expect(doubleEcran.textContent).toContain("Poste : production ×2");
    expect(doubleEcran.textContent).toContain("300 cr");
    doubleEcran.click();
    expect(actions).toEqual([{ type: "ameliorer", amelioration: "poste-10" }]);
    expect(bouton("Souris ergonomique")!.textContent).toContain("Produire ×2");
  });

  it("annonce la fin des objectifs", () => {
    monter((etat) => {
      etat.objectif = 10;
    });
    expect(texte("[data-test=objectif]")).toBe("Tous les objectifs sont atteints.");
  });

  it("trace la courbe de production dès deux points d'historique", () => {
    const { etat } = monter();
    expect(document.querySelector("polyline")).toBeNull();
    etat.historique.push(1, 2, 4);
    flushSync();
    expect(document.querySelector("polyline")?.getAttribute("points")?.split(" ")).toHaveLength(3);
  });
});

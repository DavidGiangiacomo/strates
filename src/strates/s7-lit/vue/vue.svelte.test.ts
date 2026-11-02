// @vitest-environment happy-dom
// La vue du lit (fiche, § 6), en coupe sobre : les creux qu'on ferme d'un clic ou au clavier, la
// lecture de l'échelle, les phrases du jeu.
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { strate } from "..";
import type { CommandesNoyau, ContexteTick, SonStrate } from "../../../noyau/logique/types";
import { logique, type ActionLit, type EtatLit } from "../logique";
import { etatInitial } from "../logique/etat";
import { CRUE } from "../logique/regles";
import Vue from "./Vue.svelte";

const commandes: CommandesNoyau = { demanderFouille() {}, ouvrirAide() {}, terminer() {} };
const silence: SonStrate = { jouer() {}, ambiance() {}, voix() {}, note() {} };
const CTX: ContexteTick = {
  effets: { multiplicateur: () => 1, niveau: () => null },
  emettre: () => {},
};

let composant: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (composant) unmount(composant);
  composant = null;
  document.body.innerHTML = "";
});

function monter(modifs: (etat: EtatLit) => void = () => {}, mode: "jeu" | "remontee" = "jeu") {
  const etat = $state(etatInitial());
  modifs(etat);
  const actions: ActionLit[] = [];
  composant = mount(Vue, {
    target: document.body,
    props: {
      etat,
      agir: (action: ActionLit) => actions.push(action),
      noyau: commandes,
      o: (cle: string) => strate.textes[cle] ?? `?${cle}`,
      lisible: () => true,
      mode,
      son: silence,
    },
  });
  flushSync();
  /** Fait passer `secondes` d'un coup, puis redessine. */
  const avancer = (secondes: number) => {
    logique.tick(etat, secondes, CTX);
    flushSync();
  };
  return { etat, actions, avancer };
}

const creux = (k: number) => document.querySelector<SVGElement>(`[data-creux="${k}"]`)!;
/** Un clic sur un creux : un élément SVG n'a pas de `click()`. */
const cliquer = (k: number) => creux(k).dispatchEvent(new MouseEvent("click", { bubbles: true }));
const etiquettes = () =>
  [...document.querySelectorAll("[data-creux]")].map((e) => e.getAttribute("aria-label"));
const texte = (selecteur: string) => document.querySelector(selecteur)?.textContent?.trim() ?? "";

describe("la coupe du lit", () => {
  it("montre les quatre creux, chacun avec sa hauteur et son état", () => {
    monter();
    expect(etiquettes()).toEqual([
      "Creux au fond du bassin, sous l'eau",
      "Creux à neuf coudées, à sec",
      "Creux à dix-huit coudées, à sec",
      "Creux à vingt-sept coudées, à sec",
    ]);
    for (let k = 0; k < 4; k++) {
      expect(creux(k).getAttribute("role")).toBe("button");
      expect(creux(k).getAttribute("tabindex")).toBe("0");
    }
  });

  it("bâtit la levée sur un creux d'un clic, ou au clavier, et la dessine", () => {
    const { etat, actions } = monter();
    cliquer(1);
    creux(2).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    creux(3).dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    expect(actions).toEqual([
      { type: "fermer", creux: 1 },
      { type: "fermer", creux: 2 },
    ]);
    logique.agir(etat, actions[0]!, CTX);
    flushSync();
    expect(creux(1).querySelector(".levee")).not.toBeNull();
    expect(creux(1).getAttribute("aria-label")).toBe("Creux à neuf coudées, fermé");
    expect(creux(1).getAttribute("aria-disabled")).toBe("true");
  });

  it("n'envoie rien pour un creux plein, ni pendant la remontée", () => {
    const plein = monter((e) => logique.tick(e, 34 * CRUE, CTX));
    expect(creux(0).getAttribute("aria-label")).toBe("Creux au fond du bassin, plein");
    cliquer(0);
    expect(plein.actions).toEqual([]);
    unmount(composant!);

    const remontee = monter(() => {}, "remontee");
    cliquer(1);
    expect(remontee.actions).toEqual([]);
    expect(creux(1).getAttribute("aria-disabled")).toBe("true");
  });

  it("dessine les couches du bassin à mesure que les crues passent", () => {
    const { etat, avancer } = monter();
    expect(document.querySelectorAll("svg > g[aria-hidden] .couche")).toHaveLength(0);
    avancer(40 * CRUE);
    const bassin = etat.couches.filter((c) => c.ou === "bassin").length;
    expect(bassin).toBeGreaterThan(0);
    expect(document.querySelectorAll("svg > g[aria-hidden] .couche")).toHaveLength(bassin);
    expect(creux(0).querySelectorAll(".couche")).toHaveLength(34);
  });
});

describe("l'échelle", () => {
  it("se lit en lettres sous la coupe, et s'annonce aux lecteurs d'écran à la coudée près", () => {
    const { avancer } = monter();
    expect(texte(".lecture")).toBe("aucune coudée");
    // Sans levée, le creux du fond prend 34 crues ; la 35ᵉ va au bassin.
    avancer(35 * CRUE);
    expect(texte(".lecture")).toBe("sept doigts");
    expect(texte(".lecteur")).toBe("Échelle de crue : aucune coudée");
    avancer(4 * CRUE);
    expect(texte(".lecture")).toBe("une coudée et sept doigts");
    expect(texte(".lecteur")).toBe("Échelle de crue : une coudée");
  });
});

describe("les phrases du jeu", () => {
  it("paraissent au centre, puis s'effacent : « Rien ne presse. » à l'arrivée", () => {
    const { avancer } = monter();
    avancer(5);
    expect(texte(".phrase")).toBe("Rien ne presse.");
    expect(document.querySelector<HTMLElement>(".phrase")!.style.opacity).toBe("1");
    avancer(10);
    expect(texte(".phrase")).toBe("");
  });
});

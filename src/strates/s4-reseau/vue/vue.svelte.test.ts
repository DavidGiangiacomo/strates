// @vitest-environment happy-dom
// La vue du réseau (fiche, § 6), en schéma sobre : le plan, ses tracés et ses conduites, le regard,
// le carnet de relevés, la provision et ce que reçoit la ville.
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { strate } from "..";
import type { CommandesNoyau, ContexteTick, SonStrate } from "../../../noyau/logique/types";
import { logique, type ActionReseau, type EtatReseau } from "../logique";
import { etatInitial } from "../logique/etat";
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

function monter(modifs: (etat: EtatReseau) => void = () => {}, mode: "jeu" | "remontee" = "jeu") {
  const etat = $state(etatInitial());
  modifs(etat);
  const actions: ActionReseau[] = [];
  composant = mount(Vue, {
    target: document.body,
    props: {
      etat,
      agir: (action: ActionReseau) => actions.push(action),
      noyau: commandes,
      o: (cle: string) => strate.textes[cle] ?? `?${cle}`,
      lisible: () => true,
      mode,
      son: silence,
    },
  });
  flushSync();
  /** Fait passer `secondes`, seconde par seconde, puis redessine. */
  const avancer = (secondes: number) => {
    for (let s = 0; s < secondes; s++) logique.tick(etat, 1, CTX);
    flushSync();
  };
  const appliquer = () => {
    for (const action of actions.splice(0)) logique.agir(etat, action, CTX);
    flushSync();
  };
  return { etat, actions, avancer, appliquer };
}

const lire = (texte: string | null | undefined) => (texte ?? "").replace(/\s+/g, " ").trim();
const texte = (selecteur: string) => lire(document.querySelector(selecteur)?.textContent);
const tous = (selecteur: string) =>
  [...document.querySelectorAll(selecteur)].map((e) => lire(e.textContent));
const trace = (n: number) => document.querySelector<SVGGElement>(`[data-trace="${n}"]`);
const cliquer = (e: Element | null) => {
  e!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  flushSync();
};

describe("le haut du plan", () => {
  it("montre la provision, ce que reçoit la ville et le compteur, en entier", () => {
    const { avancer } = monter();
    avancer(60);
    expect(texte(".haut")).toContain("Provision 10 muids");
    expect(texte('[data-test="recoit"]')).toBe("La ville reçoit 10 pouces.");
    expect(texte(".haut")).toContain("Compteur 10 muids");
  });

  it("écrit les grands nombres avec le point des milliers, et les dit sans séparateur", () => {
    monter((e) => {
      e.caisse = 1_234_567;
      e.recoit = 4_010;
    });
    expect(texte(".haut")).toContain("Provision 1.234.567 muids");
    const provision = document.querySelector(".haut strong")!;
    expect(provision.getAttribute("aria-label")).toBe("1234567 muids");
    expect(document.querySelector('[data-test="recoit"]')!.getAttribute("aria-label")).toBe(
      "La ville reçoit 4010 pouces.",
    );
  });
});

describe("le plan", () => {
  it("ne montre que ce qui a paru : la source 2 et son tracé, pas encore le bassin du milieu", () => {
    monter();
    expect(trace(1)).not.toBeNull();
    expect(trace(2)).not.toBeNull();
    expect(trace(3)).not.toBeNull();
    expect(trace(4)).toBeNull();
    expect(document.querySelector('[data-bassin="milieu"]')).toBeNull();
    expect(trace(3)!.classList.contains("libre")).toBe(true);
    expect(trace(3)!.getAttribute("aria-label")).toBe(
      "Tracé 3, de Source 2 à Bassin bas : relier, 2 muids.",
    );
  });

  it("pose une conduite d'un clic sur un tracé libre, puis ouvre son regard", () => {
    const { actions, appliquer } = monter((e) => (e.caisse = 2));
    cliquer(trace(3));
    expect(actions).toEqual([{ type: "relier", trace: 3 }]);
    appliquer();
    expect(trace(3)!.classList.contains("pose")).toBe(true);
    expect(texte('[data-test="regard"]')).toMatch(/^Conduite 3 : /);
    // Le bassin du milieu et la source 3 ont paru avec elle.
    expect(trace(4)).not.toBeNull();
    expect(document.querySelector('[data-bassin="milieu"]')).not.toBeNull();
  });

  it("pose aussi au clavier, par Entrée", () => {
    const { actions } = monter((e) => (e.caisse = 2));
    trace(3)!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    flushSync();
    expect(actions).toEqual([{ type: "relier", trace: 3 }]);
  });

  it("dit un bassin qui monte, et le marque autrement que par la couleur", () => {
    const { appliquer, avancer } = monter((e) => (e.caisse = 2));
    cliquer(trace(3));
    appliquer();
    avancer(1);
    const bas = document.querySelector('[data-bassin="bas"]')!;
    expect(bas.getAttribute("aria-label")).toBe("Bassin bas, monte");
    expect(bas.querySelector(".fleche")).not.toBeNull();
    // Sa conduite d'aval porte tout ce qu'elle peut : elle est dessinée en double trait.
    expect(trace(2)!.classList.contains("pleine")).toBe(true);
  });

  it("ne fait rien pendant la remontée", () => {
    const { actions } = monter((e) => (e.caisse = 2), "remontee");
    cliquer(trace(3));
    expect(actions).toEqual([]);
  });
});

describe("le regard", () => {
  it("donne le débit et le calibre d'une conduite, son prix pour l'élargir, et sa vanne", () => {
    const { actions, avancer } = monter();
    avancer(1);
    cliquer(trace(2));
    expect(texte('[data-test="regard"]')).toBe("Conduite 2 : 10 pouces sur 10 pouces.");
    const elargir = document.querySelector<HTMLButtonElement>('[data-test="elargir"]')!;
    expect(lire(elargir.textContent)).toBe("élargir, 24 muids");
    expect(elargir.disabled).toBe(true);
    const quart = [...document.querySelectorAll<HTMLInputElement>(".vanne input")][1]!;
    quart.dispatchEvent(new Event("change", { bubbles: true }));
    flushSync();
    expect(actions).toEqual([{ type: "vanne", trace: 2, ouverture: 0.25 }]);
  });

  it("élargit, quand la provision le permet", () => {
    const { actions } = monter((e) => (e.caisse = 30));
    cliquer(trace(2));
    const elargir = document.querySelector<HTMLButtonElement>('[data-test="elargir"]')!;
    expect(elargir.disabled).toBe(false);
    cliquer(elargir);
    expect(actions).toEqual([{ type: "elargir", trace: 2 }]);
  });

  it("dit « au plus large » au calibre le plus fort", () => {
    monter((e) => (e.conduites[1]!.calibre = 5));
    cliquer(trace(2));
    expect(document.querySelector('[data-test="elargir"]')).toBeNull();
    expect(texte(".regard .gestes")).toBe("au plus large");
  });
});

describe("le carnet", () => {
  it("écrit ses lignes dans la notation du réseau, la plus récente en haut", () => {
    const { appliquer, avancer } = monter((e) => (e.caisse = 2));
    cliquer(trace(3));
    appliquer();
    avancer(1);
    expect(tous('[data-test="carnet"] li')).toEqual(["Bassin bas : monte.", "Source 2 : reliée."]);
  });

  it("nomme le goulot quand le bassin déborde", () => {
    const { appliquer, avancer } = monter((e) => (e.caisse = 2));
    cliquer(trace(3));
    appliquer();
    avancer(240);
    const lignes = tous('[data-test="carnet"] li');
    expect(lignes).toContain("Bassin bas : déborde.");
    expect(lignes).toContain("Conduite 2 : goulot.");
  });
});

describe("la notice du réseau (fiche, § 11)", () => {
  it("s'ouvre d'un lien, se note pour l'acte « sans aide », prend le focus, et se referme par Échap", () => {
    let consultations = 0;
    const etat = $state(etatInitial());
    composant = mount(Vue, {
      target: document.body,
      props: {
        etat,
        agir: () => {},
        noyau: { ...commandes, ouvrirAide: () => consultations++ },
        o: (cle: string) => strate.textes[cle] ?? `?${cle}`,
        lisible: () => true,
        mode: "jeu",
        son: silence,
      },
    });
    flushSync();
    const lien = document.querySelector<HTMLButtonElement>("[data-test=lien-aide]")!;
    expect(lire(lien.textContent)).toBe("Aide");
    expect(lien.getAttribute("aria-expanded")).toBe("false");
    lien.click();
    flushSync();
    expect(consultations).toBe(1);
    const aide = document.querySelector<HTMLElement>("[data-test=aide]")!;
    expect(document.activeElement).toBe(aide);
    expect(texte("[data-test=aide] h2")).toBe("Notice du réseau");
    expect(tous("[data-test=aide] dt")).toEqual([
      "L'eau",
      "Le calibre",
      "Le partage",
      "Le bassin",
      "Les mesures",
    ]);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    flushSync();
    expect(document.querySelector("[data-test=aide]")).toBeNull();
    expect(document.activeElement).toBe(lien);
  });

  it("s'ouvre aussi à la remontée, et se referme par son bouton", () => {
    monter(() => {}, "remontee");
    cliquer(document.querySelector("[data-test=lien-aide]"));
    expect(tous("[data-test=aide] dd")[3]).toMatch(/monte, puis déborde/);
    cliquer(document.querySelector("[data-test=aide] .refermer"));
    expect(document.querySelector("[data-test=aide]")).toBeNull();
  });
});

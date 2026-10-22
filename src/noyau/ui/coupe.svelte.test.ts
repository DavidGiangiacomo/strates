// @vitest-environment happy-dom
// La coupe (#47), ouverte depuis la Profondeur : un volet, les huit couches, les inconnues sans nom.
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoucheCoupe } from "../logique/coupe";
import Coupe from "./Coupe.svelte";

let composant: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (composant) unmount(composant);
  composant = null;
  document.body.innerHTML = "";
});

const COUCHES: CoucheCoupe[] = [
  {
    strate: 1,
    atteinte: true,
    courante: false,
    tempsDeJeu: 4500,
    issue: null,
    abandonnes: ["s1-filiale"],
    perturbee: false,
  },
  {
    strate: 2,
    atteinte: true,
    courante: true,
    tempsDeJeu: 2520,
    issue: null,
    abandonnes: [],
    perturbee: false,
  },
  ...([3, 4, 5, 6, 7, 8] as const).map((strate) => ({ strate, atteinte: false as const })),
];

function monter() {
  const onfermer = vi.fn();
  composant = mount(Coupe, {
    target: document.body,
    props: { couches: COUCHES, profondeur: 2, onfermer },
  });
  flushSync();
  return onfermer;
}

const texte = (element: Element | null) => element?.textContent?.replace(/\s+/g, " ").trim();

describe("la coupe", () => {
  it("prend le focus, porte la Profondeur pour titre, et se referme par son bouton ou par Échap", () => {
    const onfermer = monter();
    const coupe = document.querySelector<HTMLElement>("[data-test=coupe]")!;
    expect(document.activeElement).toBe(coupe);
    expect(coupe.getAttribute("role")).toBe("dialog");
    expect(texte(coupe.querySelector("h2"))).toBe("Profondeur 2");
    coupe.querySelector<HTMLButtonElement>(".fermer")!.click();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onfermer).toHaveBeenCalledTimes(2);
  });

  it("montre les huit couches, de la surface au fond : les atteintes avec leur nom et leur ligne", () => {
    monter();
    const couches = [...document.querySelectorAll("[data-test^=couche-]")];
    expect(couches).toHaveLength(8);
    expect(texte(couches[0]!)).toBe("La surface 1 h 15 min · abandonné : La filiale");
    expect(texte(couches[1]!)).toBe("Les caves 42 min");
    expect(couches[1]!.getAttribute("aria-current")).toBe("location");
    expect(couches[0]!.getAttribute("aria-current")).toBeNull();
  });

  it("laisse les couches pas encore atteintes sans nom, et hors de portée du lecteur d'écran", () => {
    monter();
    const inconnues = [...document.querySelectorAll(".inconnue")];
    expect(inconnues).toHaveLength(6);
    for (const couche of inconnues) {
      expect(couche.textContent).toBe("");
      expect(couche.getAttribute("aria-hidden")).toBe("true");
    }
    expect(document.body.textContent).not.toContain("L'atelier");
  });
});

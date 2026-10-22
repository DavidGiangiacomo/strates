// @vitest-environment happy-dom
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import Bandeau from "./Bandeau.svelte";

let composant: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (composant) unmount(composant);
  composant = null;
  document.body.innerHTML = "";
});

function monter(artefacts: string[] = [], kappa = 22, autres: Record<string, unknown> = {}) {
  const oncreuser = vi.fn();
  composant = mount(Bandeau, {
    target: document.body,
    props: { profondeur: 3, artefacts, kappa, oncreuser, ...autres },
  });
  flushSync();
  return {
    oncreuser,
    bandeau: composant as unknown as {
      resister: () => void;
      focaliserInventaire: () => void;
      focaliserMenu: () => void;
    },
  };
}

const texte = (test: string) =>
  document.querySelector(`[data-test=${test}]`)?.textContent?.replace(/\s+/g, " ").trim();

describe("le bandeau commun", () => {
  it("affiche la Profondeur, les artefacts, la Compréhension et le bouton « creuser »", () => {
    monter(["s1-turbine", "s1-contrat"]);
    expect(texte("profondeur")).toBe("Profondeur 3");
    expect(texte("artefacts")).toBe("Artefacts 2");
    expect(texte("comprehension")).toBe("Compréhension 22 %");
    expect(document.querySelector(".creuser")?.textContent).toBe("creuser");
  });

  it("ouvre l'inventaire par le compteur des artefacts, et dit s'il est ouvert", () => {
    const oninventaire = vi.fn();
    const { bandeau } = monter(["s1-turbine"], 22, { oninventaire, inventaireOuvert: true });
    const compteur = document.querySelector<HTMLButtonElement>("[data-test=artefacts]")!;
    expect(compteur.tagName).toBe("BUTTON");
    expect(compteur.getAttribute("aria-expanded")).toBe("true");
    compteur.click();
    expect(oninventaire).toHaveBeenCalledOnce();
    bandeau.focaliserInventaire();
    expect(document.activeElement).toBe(compteur);
  });

  it("ouvre le menu par le bouton du bout, après « creuser », et dit s'il est ouvert", () => {
    const onmenu = vi.fn();
    const { bandeau } = monter([], 22, { onmenu, menuOuvert: true });
    const boutons = [...document.querySelectorAll("[data-test=bandeau] button")];
    expect(boutons.slice(-2).map((b) => b.textContent)).toEqual(["creuser", "menu"]);
    const menu = document.querySelector<HTMLButtonElement>("[data-test=ouvrir-menu]")!;
    expect(menu.getAttribute("aria-expanded")).toBe("true");
    menu.click();
    expect(onmenu).toHaveBeenCalledOnce();
    bandeau.focaliserMenu();
    expect(document.activeElement).toBe(menu);
    // La fissure et le coup de pioche visent « creuser » là où il est.
    expect(document.querySelector("[data-test=creuser]")?.textContent).toBe("creuser");
  });

  it("garde le menu à sa place pendant la descente, sans qu'il s'ouvre", () => {
    monter();
    expect(document.querySelector<HTMLButtonElement>("[data-test=ouvrir-menu]")!.disabled).toBe(
      true,
    );
  });

  it("garde le compteur à sa place pendant la descente, sans qu'il s'ouvre", () => {
    monter(["s1-turbine"]);
    const compteur = document.querySelector<HTMLButtonElement>("[data-test=artefacts]")!;
    expect(compteur.disabled).toBe(true);
    expect(compteur.getAttribute("aria-expanded")).toBe("false");
  });

  it("offre le bouton « graphe » quand on le lui donne, et dit s'il est ouvert", () => {
    monter([], 55);
    expect(document.querySelector("[data-test=ouvrir-graphe]")).toBeNull();
    unmount(composant!);
    const ongraphe = vi.fn();
    composant = mount(Bandeau, {
      target: document.body,
      props: {
        profondeur: 4,
        artefacts: [],
        kappa: 55,
        oncreuser: () => {},
        ongraphe,
        grapheOuvert: true,
      },
    });
    flushSync();
    const bouton = document.querySelector<HTMLButtonElement>("[data-test=ouvrir-graphe]")!;
    expect(bouton.textContent).toBe("graphe");
    expect(bouton.getAttribute("aria-expanded")).toBe("true");
    bouton.click();
    expect(ongraphe).toHaveBeenCalledOnce();
  });

  it("écrit la Compréhension en pourcentage entier, avec une espace fine insécable", () => {
    monter([], 7.6);
    expect(document.querySelector("[data-test=comprehension] strong")?.textContent).toBe(
      "8\u202f%",
    );
  });

  it("transmet le clic sur « creuser »", () => {
    const { oncreuser } = monter();
    document.querySelector<HTMLButtonElement>(".creuser")!.click();
    expect(oncreuser).toHaveBeenCalledOnce();
  });

  it("tressaille quand le sol résiste, sans texte", () => {
    const { bandeau } = monter();
    const barre = document.querySelector<HTMLElement>("[data-test=bandeau]")!;
    const animate = vi.fn();
    barre.animate = animate as unknown as HTMLElement["animate"];
    const avant = document.body.textContent;
    bandeau.resister();
    expect(animate).toHaveBeenCalledOnce();
    expect(document.body.textContent).toBe(avant);
  });
});

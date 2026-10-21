// @vitest-environment happy-dom
// L'inventaire des objets (#45) : le volet ouvert depuis le bandeau, par couche d'origine, avec le
// nom et l'usure de chaque objet ; puis les mêmes objets pendant le travelling de la descente.
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { inventaire } from "../logique/artefacts";
import Descente from "./Descente.svelte";
import Inventaire from "./Inventaire.svelte";
import { etiquette, parCouche } from "./inventaire";

let composant: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (composant) unmount(composant);
  composant = null;
  document.body.innerHTML = "";
});

/** Une partie au réseau : la surface décorative, la faucille nommée par l'atelier, la loupe intacte. */
const OBJETS = inventaire(["s1-turbine", "s2-faucille", "s3-loupe"], 4, ["s1-turbine"]);

function monterInventaire(objets = OBJETS) {
  const onfermer = vi.fn();
  composant = mount(Inventaire, { target: document.body, props: { objets, onfermer } });
  flushSync();
  return { onfermer };
}

const texte = (el: Element | null | undefined) => el?.textContent?.replace(/\s+/g, " ").trim();
/** Les crans pleins de la marque d'un objet ; aucun pour un caillou. */
const crans = (id: string) =>
  document.querySelectorAll(`[data-test=inventaire-${id}] [data-test=usure] .plein`).length;

describe("le volet de l'inventaire", () => {
  it("range les objets par couche d'origine, avec leur nom et leur usure en toutes lettres", () => {
    monterInventaire();
    const couches = [...document.querySelectorAll("[data-test=inventaire] h3")].map(texte);
    expect(couches).toEqual(["La surface", "Les caves", "L'atelier"]);
    expect(texte(document.querySelector("[data-test=inventaire-s1-turbine]"))).toBe(
      "La roue chaude, décoratif",
    );
    expect(texte(document.querySelector("[data-test=inventaire-s2-faucille]"))).toBe(
      "La faucille, utile",
    );
    expect(texte(document.querySelector("[data-test=inventaire-s3-loupe]"))).toBe(
      "La loupe, puissant",
    );
  });

  it("marque l'usure de trois crans qui se vident, puis d'un caillou au nom gris", () => {
    monterInventaire(inventaire(["s1-turbine", "s2-faucille", "s3-loupe", "s4-carnet"], 5, []));
    expect(["s2-faucille", "s3-loupe", "s4-carnet"].map(crans)).toEqual([1, 2, 3]);
    const caillou = document.querySelector("[data-test=inventaire-s1-turbine]")!;
    expect(crans("s1-turbine")).toBe(0);
    expect(caillou.classList.contains("inerte")).toBe(true);
    expect(caillou.querySelector("[data-test=usure]")?.classList.contains("caillou")).toBe(true);
    expect(texte(caillou)).toBe("La turbine, inerte");
    // La marque n'est que dessinée : le mot la dit au lecteur d'écran.
    expect(caillou.querySelector("[data-test=usure]")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("dit qu'il est vide à la surface", () => {
    monterInventaire([]);
    expect(texte(document.querySelector("[data-test=inventaire] .vide"))).toBe("Aucun artefact.");
  });

  it("prend le focus, et se referme par son bouton ou par Échap", () => {
    const { onfermer } = monterInventaire();
    const panneau = document.querySelector<HTMLElement>("[data-test=inventaire]")!;
    expect(document.activeElement).toBe(panneau);
    expect(panneau.getAttribute("role")).toBe("dialog");
    document.querySelector<HTMLButtonElement>("[data-test=inventaire] .fermer")!.click();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onfermer).toHaveBeenCalledTimes(2);
  });
});

describe("le travelling", () => {
  function monterDescente(phase: "descente" | "arrivee", poche?: () => DOMRect | null) {
    composant = mount(Descente, {
      target: document.body,
      props: { phase, transportes: OBJETS, poche },
    });
    flushSync();
  }

  it("fait descendre les objets en rangées, une par couche d'origine, avec leur usure", () => {
    monterDescente("descente");
    const rangees = [...document.querySelectorAll("[data-test=transportes] ul")];
    expect(rangees.map((ul) => ul.querySelectorAll("li").length)).toEqual([1, 1, 1]);
    expect(texte(document.querySelector("[data-test=transporte-s1-turbine]"))).toBe(
      "La roue chaude, décoratif",
    );
    expect(
      document.querySelectorAll("[data-test=transporte-s3-loupe] [data-test=usure] .plein"),
    ).toHaveLength(3);
  });

  it("mène chaque objet, à l'arrivée, vers le compteur du bandeau", () => {
    const poche = vi.fn(() => new DOMRect(120, 3, 80, 18));
    monterDescente("arrivee", poche);
    expect(poche).toHaveBeenCalled();
    const objet = document.querySelector<HTMLElement>("[data-test=transporte-s2-faucille]")!;
    expect(objet.style.getPropertyValue("--dx")).toMatch(/px$/);
    expect(objet.style.getPropertyValue("--dy")).toMatch(/px$/);
  });
});

describe("les étiquettes", () => {
  it("donnent sa majuscule au nom d'en bas, écrit pour une phrase", () => {
    expect(etiquette("l'armoire qui compte les hivers")).toBe("L'armoire qui compte les hivers");
    expect(etiquette("|||")).toBe("|||");
  });

  it("regroupent les objets par couche, dans l'ordre de l'inventaire", () => {
    const objets = inventaire(["s2-meule", "s1-turbine", "s2-faucille"], 3, []);
    expect(parCouche(objets).map((c) => [c.origine, c.objets.map((o) => o.id)])).toEqual([
      [1, ["s1-turbine"]],
      [2, ["s2-meule", "s2-faucille"]],
    ]);
  });
});

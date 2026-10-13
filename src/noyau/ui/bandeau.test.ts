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

function monter(artefacts: string[] = [], kappa = 22) {
  const oncreuser = vi.fn();
  composant = mount(Bandeau, {
    target: document.body,
    props: { profondeur: 3, artefacts, kappa, oncreuser },
  });
  flushSync();
  return { oncreuser, bandeau: composant as unknown as { resister: () => void } };
}

const texte = (test: string) =>
  document.querySelector(`[data-test=${test}]`)?.textContent?.replace(/\s+/g, " ").trim();

describe("le bandeau commun", () => {
  it("affiche la Profondeur, les artefacts, la Compréhension et le bouton « creuser »", () => {
    monter(["s1-turbine", "s1-contrat"]);
    expect(texte("profondeur")).toBe("Profondeur 3");
    expect(texte("artefacts")).toBe("Artefacts 2");
    expect(texte("comprehension")).toBe("Compréhension 22 %");
    expect(document.querySelector("button")?.textContent).toBe("creuser");
  });

  it("écrit la Compréhension en pourcentage entier, avec une espace fine insécable", () => {
    monter([], 7.6);
    expect(document.querySelector("[data-test=comprehension] strong")?.textContent).toBe(
      "8\u202f%",
    );
  });

  it("transmet le clic sur « creuser »", () => {
    const { oncreuser } = monter();
    document.querySelector("button")!.click();
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

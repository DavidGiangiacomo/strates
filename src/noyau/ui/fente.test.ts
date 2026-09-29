// @vitest-environment happy-dom
// La strate qui se fend (docs/strates/descente-1-2.md, P2) : deux copies de la strate, de part et
// d'autre de la fissure.
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import Fente from "./Fente.svelte";

let composant: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (composant) unmount(composant);
  composant = null;
  document.body.innerHTML = "";
});

/** Une strate cachée pendant la fente, comme dans App.svelte. */
function strate(): HTMLElement {
  const main = document.createElement("main");
  main.className = "strate pioche";
  main.style.visibility = "hidden";
  main.innerHTML = "<p>Crédits <strong>12 cr</strong></p>";
  document.body.append(main);
  return main;
}

function monter(source: HTMLElement | undefined, sens: "ouvrir" | "refermer" = "ouvrir") {
  const cible = document.createElement("div");
  document.body.append(cible);
  composant = mount(Fente, { target: cible, props: { source, sens } });
  flushSync();
  return cible;
}

describe("la fente", () => {
  it("montre deux copies de la strate, découpées de part et d'autre de la fissure", () => {
    const source = strate();
    monter(source);
    const fente = document.querySelector<HTMLElement>("[data-test=fente]")!;
    expect(fente.classList.contains("ouvrir")).toBe(true);
    // Un décor : rien n'y est lu ni atteint au clavier.
    expect(fente.hasAttribute("inert")).toBe(true);
    expect(fente.getAttribute("aria-hidden")).toBe("true");

    const moities = [...fente.querySelectorAll<HTMLElement>(".moitie")];
    expect(moities).toHaveLength(2);
    for (const moitie of moities) {
      expect(moitie.style.clipPath).toMatch(/^polygon\(/);
      const copie = moitie.querySelector<HTMLElement>("main")!;
      expect(copie).not.toBe(source);
      expect(copie.textContent).toBe("Crédits 12 cr");
      // La strate est cachée pendant la fente ; ses copies, non.
      expect(copie.style.visibility).toBe("visible");
      expect(copie.style.position).toBe("absolute");
    }
    expect(moities[0]!.style.clipPath).not.toBe(moities[1]!.style.clipPath);
    // La strate elle-même n'a pas bougé.
    expect(source.parentElement).toBe(document.body);
    expect(source.style.visibility).toBe("hidden");
  });

  it("referme : les mêmes moitiés, qui remontent", () => {
    monter(strate(), "refermer");
    expect(document.querySelector("[data-test=fente]")!.classList.contains("refermer")).toBe(true);
  });

  it("retire ses copies en partant", () => {
    monter(strate());
    expect(document.querySelectorAll("main")).toHaveLength(3);
    unmount(composant!);
    composant = null;
    expect(document.querySelectorAll("main")).toHaveLength(1);
  });

  it("ne montre rien sans strate à copier", () => {
    monter(undefined);
    expect(document.querySelector("[data-test=fente]")).toBeNull();
  });
});

// @vitest-environment happy-dom
// L'écran de fouille (docs/strates/descente-1-2.md, § 4) : la ligne de l'issue, pour la strate qui en
// a deux, au-dessus de la valeur (docs/strates/strate-6.md, § 9).
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { ouvrirFouille } from "../logique/artefacts";
import Fouille from "./Fouille.svelte";

let composant: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (composant) unmount(composant);
  composant = null;
  document.body.innerHTML = "";
});

function monter(issue?: string) {
  composant = mount(Fouille, {
    target: document.body,
    props: {
      ecran: {
        fouille: ouvrirFouille(6, 3.84e20),
        nom: "La dette",
        libelle: "Honoré",
        formater: (v: number) => `${v.toExponential(2)}`,
        issue,
      },
      ondescendre: () => {},
      onreboucher: () => {},
    },
  });
  flushSync();
}

describe("l'écran de fouille", () => {
  it("écrit l'issue de la strate quittée au-dessus de sa valeur, au premier temps", () => {
    monter("soldée");
    const issue = document.querySelector("[data-test=issue]")!;
    const valeur = document.querySelector("[data-test=valeur]")!;
    expect(issue.textContent).toBe("soldée");
    expect(valeur.textContent?.trim()).toBe("3.84e+20");
    // Au-dessus : avant la valeur dans la page, et sans attendre les points.
    expect(issue.compareDocumentPosition(valeur) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(issue.closest(".points, .suivant")).toBeNull();
  });

  it("n'écrit rien de plus pour une strate qui n'a qu'une issue", () => {
    monter();
    expect(document.querySelector("[data-test=issue]")).toBeNull();
    expect(document.querySelector("[data-test=points]")?.textContent).toBe("28");
  });
});

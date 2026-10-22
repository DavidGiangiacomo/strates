// @vitest-environment happy-dom
// Le retour du joueur (#58) : le rappel, puis le résumé de l'absence, jusqu'à « reprendre ».
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import Retour from "./Retour.svelte";
import type { MessageReprise } from "./reprise";

let composant: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (composant) unmount(composant);
  composant = null;
  document.body.innerHTML = "";
});

function monter(message: MessageReprise) {
  const onreprendre = vi.fn();
  composant = mount(Retour, { target: document.body, props: { message, onreprendre } });
  flushSync();
  return onreprendre;
}

const lignes = (test: string) =>
  [...document.querySelectorAll(`[data-test=${test}] p`)].map((p) => p.textContent);

describe("le retour du joueur", () => {
  it("donne le rappel, puis l'absence, et se referme par « reprendre »", () => {
    const onreprendre = monter({
      rappel: ["Profondeur 2 · Les caves", "An 1. 30 familles, un grenier."],
      absence: ["Absence : 8 h.", "L'hiver attendait : rien n'a bougé."],
    });
    const bloc = document.querySelector("[data-test=reprise]")!;
    expect(bloc.getAttribute("role")).toBe("status");
    expect(bloc.getAttribute("aria-label")).toBe("Reprise");
    expect(lignes("rappel")).toEqual([
      "Profondeur 2 · Les caves",
      "An 1. 30 familles, un grenier.",
    ]);
    expect(lignes("absence")).toEqual(["Absence : 8 h.", "L'hiver attendait : rien n'a bougé."]);
    // Le rappel se lit d'abord.
    const [rappel, absence] = [...bloc.children];
    expect(rappel?.getAttribute("data-test")).toBe("rappel");
    expect(absence?.getAttribute("data-test")).toBe("absence");

    const reprendre = document.querySelector<HTMLButtonElement>("[data-test=reprendre]")!;
    expect(reprendre.textContent).toBe("reprendre");
    reprendre.click();
    expect(onreprendre).toHaveBeenCalledOnce();
  });

  it("après une pause, ne montre que le résumé", () => {
    monter({ rappel: [], absence: ["Absence : 5 min, comptée à 80 %."] });
    expect(document.querySelector("[data-test=rappel]")).toBeNull();
    expect(lignes("absence")).toEqual(["Absence : 5 min, comptée à 80 %."]);
  });
});

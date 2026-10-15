// @vitest-environment happy-dom
// Le panneau du graphe de dépendances (#76) : les nœuds nommés à travers l'opacité, les liens, le
// survol, la fermeture, et le graphe en phrases pour les lecteurs d'écran.
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { logique } from "../../strates/s2-caves/logique";
import { etatInitial } from "../../strates/s2-caves/logique/etat";
import { textes } from "../../strates/s2-caves/textes.fr";
import { glyphes } from "../logique/opacite";
import Graphe from "./Graphe.svelte";

let composant: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (composant) unmount(composant);
  composant = null;
  document.body.innerHTML = "";
});

/** Le graphe des caves à l'arrivée ; la marque d'hiver y est encore opaque. */
function monter() {
  const onfermer = vi.fn();
  const o = (cle: string) =>
    cle === "marque-hiver" ? glyphes(cle, textes[cle]!) : (textes[cle] ?? cle);
  composant = mount(Graphe, {
    target: document.body,
    props: { graphe: logique.graphe!(etatInitial()), nom: "Les caves", o, onfermer },
  });
  flushSync();
  return { onfermer };
}

const nomDe = (id: string) =>
  document.querySelector(`[data-test=noeud-${id}] text`)?.textContent ?? null;

describe("le panneau du graphe", () => {
  it("montre la strate, ses nœuds nommés à travers l'opacité, et ses liens", () => {
    monter();
    expect(document.querySelector("[data-test=graphe] .strate")?.textContent).toBe("Les caves");
    expect(nomDe("recolte")).toBe("Récolte");
    expect(nomDe("marque")).not.toContain("Marque");
    expect(nomDe("marque")).toBe(glyphes("marque-hiver", "Marque d'hiver"));
    const g = logique.graphe!(etatInitial());
    expect(document.querySelectorAll("[data-test^=noeud-]")).toHaveLength(g.noeuds.length);
    expect(document.querySelectorAll("path.lien")).toHaveLength(g.liens.length);
    expect(document.querySelectorAll("path.lien.retour")).toHaveLength(2);
  });

  it("se lit en phrases pour les lecteurs d'écran", () => {
    monter();
    const phrases = [...document.querySelectorAll(".phrases li")].map((li) => li.textContent);
    expect(phrases).toContain("Récolte ← Familles, Outils, Saisons");
  });

  it("éclaire au survol les liens d'un nœud, et efface le reste", () => {
    monter();
    const reserve = document.querySelector("[data-test=noeud-reserve]")!;
    reserve.dispatchEvent(new MouseEvent("mouseenter"));
    flushSync();
    expect(document.querySelector("[data-test=lien-recolte-reserve]")?.classList).toContain(
      "actif",
    );
    expect(document.querySelector("[data-test=noeud-recolte]")?.classList).not.toContain("eteint");
    expect(document.querySelector("[data-test=noeud-cycle]")?.classList).toContain("eteint");
    reserve.dispatchEvent(new MouseEvent("mouseleave"));
    flushSync();
    expect(document.querySelectorAll(".eteint")).toHaveLength(0);
  });

  it("se referme par son bouton, ou par Échap", () => {
    const { onfermer } = monter();
    document.querySelector<HTMLButtonElement>(".fermer")!.click();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onfermer).toHaveBeenCalledTimes(2);
  });
});

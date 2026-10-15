// @vitest-environment happy-dom
// Le panneau du graphe de dépendances (#76) : les nœuds nommés à travers l'opacité, les liens, le
// survol, la fermeture, et le graphe en phrases pour les lecteurs d'écran. Puis les formules réelles,
// au palier de κ, sur les nœuds compris (#77).
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { logique } from "../../strates/s2-caves/logique";
import { etatInitial, type EtatCaves } from "../../strates/s2-caves/logique/etat";
import { ANNEE_RATIONS } from "../../strates/s2-caves/logique/regles";
import { textes } from "../../strates/s2-caves/textes.fr";
import { glyphes } from "../logique/opacite";
import Graphe from "./Graphe.svelte";

let composant: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (composant) unmount(composant);
  composant = null;
  document.body.innerHTML = "";
});

/** Le graphe des caves, à l'arrivée par défaut ; la marque d'hiver y est encore opaque. */
function monter({ kappa = 0, etat = etatInitial() as EtatCaves, marqueLevee = false } = {}) {
  const onfermer = vi.fn();
  const opaque = (cle: string) => cle === "marque-hiver" && !marqueLevee;
  const o = (cle: string) => (opaque(cle) ? glyphes(cle, textes[cle]!) : (textes[cle] ?? cle));
  composant = mount(Graphe, {
    target: document.body,
    props: {
      graphe: logique.graphe!(etat),
      formules: logique.formules!(),
      kappa,
      nom: "Les caves",
      o,
      cleLisible: (cle: string) => !opaque(cle),
      onfermer,
    },
  });
  flushSync();
  return { onfermer };
}

/** Une vallée où les rations se comptent : tous les nœuds des formules sont là. */
const avecRations = (): EtatCaves => ({ ...etatInitial(), annee: ANNEE_RATIONS + 1, jour: 0 });

const nomDe = (id: string) =>
  document.querySelector(`[data-test=noeud-${id}] text.nom`)?.textContent ?? null;
/** Les formules écrites sur un nœud, chacune ses lignes remises bout à bout. */
const formulesDe = (id: string) =>
  [...document.querySelectorAll(`[data-test=formule-${id}]`)].map((g) =>
    [...g.querySelectorAll("text")].map((t) => t.textContent).join(" "),
  );
const phrasesLues = () => [...document.querySelectorAll(".phrases li")].map((li) => li.textContent);

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
    expect(phrasesLues()).toContain("Récolte ← Familles, Outils, Saisons");
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

describe("les formules réelles sur le graphe", () => {
  const ecrites = () => document.querySelectorAll("[data-test^=formule-]").length;
  const expression = (noeud: string) => textes[`formule.${noeud}`]!;

  it("n'apparaissent pas encore à κ = 50", () => {
    monter({ kappa: 50, etat: avecRations(), marqueLevee: true });
    expect(ecrites()).toBe(0);
    expect(document.querySelectorAll("line.filet")).toHaveLength(0);
  });

  it("viennent une à une : à κ = 70, les deux premières des caves, la consommation et la récolte", () => {
    monter({ kappa: 70, etat: avecRations(), marqueLevee: true });
    expect(formulesDe("consommation")).toEqual([expression("consommation")]);
    expect(formulesDe("recolte")).toEqual([expression("recolte")]);
    expect(ecrites()).toBe(2);
  });

  it("s'écrivent toutes à κ = 100, chacune sur son nœud, devenu une carte", () => {
    monter({ kappa: 100, etat: avecRations(), marqueLevee: true });
    for (const noeud of ["consommation", "recolte", "pertes", "rations", "marque"]) {
      expect(formulesDe(noeud), noeud).toEqual([expression(noeud)]);
      expect(document.querySelector(`[data-test=noeud-${noeud}] line.filet`), noeud).not.toBeNull();
    }
    expect(ecrites()).toBe(5);
  });

  it("attendent qu'un nœud soit compris : la marque encore opaque ne montre pas la sienne", () => {
    monter({ kappa: 100, etat: avecRations() });
    expect(formulesDe("marque")).toEqual([]);
    expect(formulesDe("pertes")).toEqual([expression("pertes")]);
    expect(phrasesLues().some((p) => p!.includes(expression("marque")))).toBe(false);
  });

  it("attendent que leur nœud paraisse : sans rations, pas de formule des rations", () => {
    monter({ kappa: 100, marqueLevee: true });
    expect(formulesDe("rations")).toEqual([]);
    expect(ecrites()).toBe(4);
  });

  it("se lisent aussi en phrases, après ce qui alimente leur nœud", () => {
    monter({ kappa: 100, etat: avecRations(), marqueLevee: true });
    const phrases = phrasesLues();
    const alimente = phrases.indexOf("Récolte ← Familles, Outils, Saisons");
    expect(phrases[alimente + 1]).toBe(`Récolte — ${expression("recolte")}`);
  });
});

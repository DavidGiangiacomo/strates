// @vitest-environment happy-dom
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { strate } from "..";
import type { CommandesNoyau, ContexteTick } from "../../../noyau/logique/types";
import { SILENCE } from "../../../noyau/plateforme/audio";
import { logique, type ActionAtelier, type EtatAtelier } from "../logique";
import { etatInitial } from "../logique/etat";
import { TOUR } from "../logique/regles";
import Vue from "./Vue.svelte";

const commandes: CommandesNoyau = { demanderFouille() {}, ouvrirAide() {}, terminer() {} };
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

function monter(modifs: (etat: EtatAtelier) => void = () => {}, mode: "jeu" | "remontee" = "jeu") {
  const etat = $state(etatInitial());
  modifs(etat);
  const actions: ActionAtelier[] = [];
  composant = mount(Vue, {
    target: document.body,
    props: {
      etat,
      agir: (action: ActionAtelier) => actions.push(action),
      noyau: commandes,
      o: (cle: string) => strate.textes[cle] ?? `?${cle}`,
      lisible: () => true,
      mode,
      son: SILENCE,
    },
  });
  flushSync();
  /** Applique les actions envoyées, comme le noyau au tick suivant. */
  const appliquer = () => {
    for (const action of actions.splice(0)) logique.agir(etat, action, CTX);
    flushSync();
  };
  return { etat, actions, appliquer };
}

const texte = (selecteur: string) =>
  (document.querySelector(selecteur)?.textContent ?? "").replace(/[ \t\n\r]+/g, " ").trim();
const cliquer = (selecteur: string) => {
  (document.querySelector(selecteur) as HTMLElement).click();
  flushSync();
};
const etiquette = (repere: number) =>
  document.querySelector(`.plan [data-piece="${repere}"]`)?.getAttribute("aria-label");

describe("la vue de l'atelier", () => {
  it("affiche en base douze le stock, la production par tour et les cases libres", () => {
    monter((etat) => (etat.stock = 1728));
    expect(texte("[data-test=stock]")).toBe("1 000 pièces");
    expect(texte("[data-test=production]")).toBe("48 par tour");
    expect(texte("[data-test=cases]")).toBe("Il reste 26 cases.");
    expect(texte("[data-test=legende]")).toBe("Plan de 6 × 6. Il reste 26 cases.");
  });

  it("dessine le plan : le ressort, les cases libres et les deux roues qui tournent", () => {
    monter();
    expect(document.querySelectorAll(".plan .case")).toHaveLength(30);
    expect(document.querySelectorAll(".plan .piece")).toHaveLength(2);
    expect(etiquette(1)).toBe(
      "Pièce 1, roue dentée, dents en haut, à droite, en bas, à gauche, tourne",
    );
  });

  it("dit à un lecteur d'écran la place d'une case libre, en base douze, et les dents d'une pièce", () => {
    monter((e) => {
      e.taille = 12;
      e.pieces.push({ id: "cliquet", repere: 3, case: null, rot: 1, limees: [] });
      e.pieces.push({ id: "cliquet", repere: 4, case: null, rot: 0, limees: [0] });
    });
    const libre = (l: number, c: number) =>
      document.querySelector(`[data-case="${l},${c}"]`)?.getAttribute("aria-label");
    expect(libre(0, 0)).toBe("Case libre, ligne 1, colonne 1");
    expect(libre(11, 10)).toBe("Case libre, ligne 10, colonne ↋");
    const etabli = (repere: number) =>
      document.querySelector(`.etabli [data-piece="${repere}"]`)?.getAttribute("aria-label");
    expect(etabli(3)).toBe("Pièce 3, cliquet, dent à droite");
    expect(etabli(4)).toBe("Pièce 4, cliquet, sans dent");
  });

  it("montre la nomenclature au fil du cumul, avec ses prix en base douze", () => {
    monter((etat) => (etat.cumul = 900));
    expect(texte("[data-test=nomenclature-roue]")).toContain("74");
    expect(document.querySelector("[data-test=nomenclature-cliquet]")).not.toBeNull();
    expect(document.querySelector("[data-test=nomenclature-renvoi]")).toBeNull();
    expect(document.querySelector("[data-test=agrandir]")).toBeNull();
  });

  it("achète une pièce, qui vient en main, et la pose d'un clic sur une case libre", () => {
    const { etat, actions, appliquer } = monter((e) => (e.stock = 100));
    cliquer("[data-test=nomenclature-roue] .acheter");
    expect(actions).toEqual([{ type: "acheter", piece: "roue" }]);
    appliquer();
    expect(texte("[data-test=main]")).toContain("Pièce 3, roue dentée");
    cliquer('[data-case="2,1"]');
    expect(actions).toEqual([{ type: "poser", repere: 3, case: [2, 1], rot: 0 }]);
    appliquer();
    expect(etat.pieces[2]!.case).toEqual([2, 1]);
    expect(texte("[data-test=production]")).toBe("5↊ par tour");
    expect(document.querySelector("[data-test=main]")).toBeNull();
  });

  it("prend une pièce du plan, la déplace, l'échange ou la met de côté", () => {
    const { actions } = monter((e) =>
      e.pieces.push({ id: "cliquet", repere: 3, case: [5, 5], rot: 0, limees: [] }),
    );
    cliquer('.plan [data-piece="1"]');
    cliquer('[data-case="0,0"]');
    cliquer('.plan [data-piece="1"]');
    cliquer('.plan [data-piece="3"]');
    cliquer('.plan [data-piece="2"]');
    cliquer("[data-test=main] button:nth-of-type(2)");
    expect(actions).toEqual([
      { type: "deplacer", repere: 1, case: [0, 0] },
      { type: "echanger", a: 1, b: 3 },
      { type: "mettreDeCote", repere: 2 },
    ]);
  });

  it("tourne une pièce d'un clic droit, ou de la touche R quand elle est en main", () => {
    const { actions } = monter();
    document
      .querySelector('.plan [data-piece="2"]')!
      .dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
    cliquer('.plan [data-piece="1"]');
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
    expect(actions).toEqual([
      { type: "tourner", repere: 2 },
      { type: "tourner", repere: 1 },
    ]);
  });

  it("laisse la touche R aux champs de saisie, et Ctrl+R au navigateur", () => {
    const { actions } = monter();
    cliquer('.plan [data-piece="1"]');
    const champ = document.createElement("input");
    document.body.append(champ);
    champ.dispatchEvent(new KeyboardEvent("keydown", { key: "r", bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r", ctrlKey: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "R", metaKey: true }));
    expect(actions).toEqual([]);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "R", shiftKey: true }));
    expect(actions).toEqual([{ type: "tourner", repere: 1 }]);
  });

  it("propose de limer les côtés dentés de la pièce en main", () => {
    const { actions } = monter((e) =>
      e.pieces.push({ id: "cliquet", repere: 3, case: null, rot: 1, limees: [] }),
    );
    cliquer('.etabli [data-piece="3"]');
    expect(document.querySelectorAll("[data-test^=limer-]")).toHaveLength(1);
    cliquer("[data-test=limer-1]");
    expect(actions).toEqual([{ type: "limer", repere: 3, cote: 1 }]);
  });

  it("ne dit un frottement qu'au bout d'un tour, en mots comme en trait", () => {
    const { etat, appliquer, actions } = monter((e) => {
      e.pieces.push({ id: "cliquet", repere: 3, case: null, rot: 0, limees: [] });
    });
    actions.push({ type: "poser", repere: 3, case: [0, 2], rot: 0 });
    appliquer();
    const roue = "Pièce 1, roue dentée, dents en haut, à droite, en bas, à gauche, tourne";
    expect(etiquette(1)).toBe(roue);
    expect(document.querySelectorAll(".frotte")).toHaveLength(0);
    etat.temps += TOUR;
    flushSync();
    expect(etiquette(1)).toBe(`${roue}, frotte en haut`);
    expect(etiquette(3)).toBe(
      "Pièce 3, cliquet, dent en haut, ne tourne pas, frotte en haut, en bas",
    );
    expect(document.querySelectorAll(".frotte").length).toBeGreaterThan(0);
  });

  it("pendant la remontée, se montre sans rien laisser faire", () => {
    const { actions } = monter((e) => (e.stock = 1000), "remontee");
    cliquer("[data-test=nomenclature-roue] .acheter");
    cliquer('.plan [data-piece="1"]');
    expect(actions).toEqual([]);
  });
});

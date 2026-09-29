// @vitest-environment happy-dom
import { flushSync, mount, unmount } from "svelte";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { strate } from "..";
import type { Window as FenetreSimulee } from "happy-dom";
import type { CommandesNoyau } from "../../../noyau/logique/types";
import type { ActionSurface, EtatSurface } from "../logique";
import { etatInitial } from "../logique/etat";
import Vue from "./Vue.svelte";

let aides = 0;
const commandes: CommandesNoyau = {
  demanderFouille() {},
  ouvrirAide: () => aides++,
  terminer() {},
};

let composant: ReturnType<typeof mount> | null = null;
// Sans mouvement : les compteurs sautent à leur valeur, et les transitions durent 0 ms. happy-dom
// rejette la promesse d'une animation interrompue : on laisse les transitions finir avant de démonter.
beforeAll(() => {
  (window as unknown as FenetreSimulee).happyDOM.settings.device.prefersReducedMotion = "reduce";
});
afterEach(async () => {
  await new Promise((fin) => setTimeout(fin, 20));
  if (composant) unmount(composant);
  composant = null;
  document.body.innerHTML = "";
});

function monter(modifs: (etat: EtatSurface) => void = () => {}) {
  const etat = $state(etatInitial());
  modifs(etat);
  const actions: ActionSurface[] = [];
  composant = mount(Vue, {
    target: document.body,
    props: {
      etat,
      agir: (action: ActionSurface) => actions.push(action),
      noyau: commandes,
      o: (cle: string) => strate.textes[cle] ?? `?${cle}`,
      mode: "jeu",
    },
  });
  flushSync();
  return { etat, actions };
}

/** Espaces insécables de la notation : entre le nombre et son unité. */
const e = (t: string) => t.replaceAll(" ", "\u00a0");
const texte = (selecteur: string) => document.querySelector(selecteur)?.textContent?.trim() ?? "";
const boutons = () => [...document.querySelectorAll("button")];
const bouton = (debut: string) => boutons().find((b) => b.textContent?.trim().startsWith(debut));

describe("la vue de la surface", () => {
  it("affiche les indicateurs, le premier objectif et le bouton Produire", () => {
    const { actions } = monter();
    expect(texte("[data-test=credits]")).toBe("0 cr");
    expect(texte("[data-test=production]")).toBe("0,00 cr/s");
    expect(texte("[data-test=objectif]")).toContain("Produire 15 cr");
    bouton("Produire")!.click();
    expect(actions).toEqual([{ type: "produire" }]);
  });

  it("n'utilise que des clés de texte qui existent", () => {
    monter((etat) => {
      etat.cumul = 1e12;
      etat.credits = 1e12;
      Object.assign(etat.generateurs, { poste: 50, equipe: 50, serveur: 50, chaine: 50 });
      Object.assign(etat.generateurs, { turbine: 50, usine: 50, filiale: 50 });
    });
    expect(document.body.textContent).not.toContain("?");
  });

  it("montre un générateur à la moitié de son coût, et désactive ce qu'on ne peut pas payer", () => {
    const { etat, actions } = monter();
    expect(document.querySelector("[data-test=generateur-poste]")).toBeNull();

    etat.cumul = 10;
    etat.credits = 10;
    flushSync();
    const poste = document.querySelector("[data-test=generateur-poste]")!;
    expect(poste.textContent).toContain("Poste");
    const [un, dix, max] = [...poste.querySelectorAll("button")];
    expect([un!.disabled, dix!.disabled, max!.disabled]).toEqual([true, true, true]);

    etat.credits = 20;
    flushSync();
    expect([un!.disabled, dix!.disabled, max!.disabled]).toEqual([false, true, false]);
    un!.click();
    max!.click();
    expect(actions).toEqual([
      { type: "acheter", generateur: "poste", quantite: 1 },
      { type: "acheter", generateur: "poste", quantite: "max" },
    ]);
  });

  it("propose les améliorations disponibles, avec leur effet et leur coût", () => {
    const { actions } = monter((etat) => {
      etat.generateurs.poste = 10;
      etat.cumul = 400;
      etat.credits = 400;
    });
    const doubleEcran = bouton("Double écran")!;
    expect(doubleEcran.textContent).toContain("Poste : production ×2");
    expect(doubleEcran.textContent).toContain("300 cr");
    doubleEcran.click();
    expect(actions).toEqual([{ type: "ameliorer", amelioration: "poste-10" }]);
    expect(bouton("Souris ergonomique")!.textContent).toContain("Produire ×2");
  });

  it("liste les objectifs atteints, et montre l'avancée de l'objectif courant", () => {
    const { etat } = monter();
    expect(texte("[data-test=objectifs-atteints]")).toBe("");
    expect(document.body.textContent).toContain("Aucun objectif atteint pour l'instant.");
    etat.cumul = 6;
    flushSync();
    expect(document.querySelector<HTMLElement>(".rempli")!.style.width).toBe("40%");

    etat.objectif = 3;
    flushSync();
    const atteints = [...document.querySelectorAll("[data-test=objectifs-atteints] li")];
    expect(atteints.map((li) => li.textContent?.trim())).toEqual([
      "Produire 15 cr",
      "Acheter un poste",
      "Atteindre 1 cr/s",
    ]);
    // Acheter une amélioration : rien à mesurer, pas de barre.
    expect(texte("[data-test=objectif]")).toBe("Acheter une amélioration");
    expect(document.querySelector(".jauge")).toBeNull();

    etat.objectif = 5;
    etat.generateurs.equipe = 25;
    flushSync();
    expect(texte("[data-test=objectif]")).toBe("Atteindre 100 cr/s");
    expect(document.querySelector<HTMLElement>(".rempli")!.style.width).toBe("45%");
  });

  it("dit ce que rapporte un clic sur « Produire »", () => {
    const { etat } = monter();
    expect(document.body.textContent).toContain(`${e("+1 cr")} par clic`);
    etat.ameliorations.push("clic-1");
    flushSync();
    expect(document.body.textContent).toContain(`${e("+2 cr")} par clic`);
  });

  it("suit les crédits et la production (sans mouvement, les compteurs sautent)", () => {
    const { etat } = monter();
    etat.credits = 2_040_000;
    etat.generateurs.poste = 4;
    flushSync();
    expect(texte("[data-test=credits]")).toBe(e("2,04 M cr"));
    expect(texte("[data-test=production]")).toBe(e("1,00 cr/s"));
  });

  it("dit « Objectif atteint. » quand un objectif est atteint, pas à l'ouverture", () => {
    const { etat } = monter((e) => (e.objectif = 2));
    expect(texte("[data-test=objectif-atteint]")).toBe("");
    etat.objectif = 3;
    flushSync();
    expect(texte("[data-test=objectif-atteint]")).toBe("Objectif atteint.");
    expect(document.querySelector("[data-test=objectif-atteint]")?.getAttribute("role")).toBe(
      "status",
    );
  });

  it("décrit chaque moyen de production et chaque amélioration dans une infobulle", () => {
    monter((etat) => {
      etat.cumul = 400;
      etat.credits = 400;
      etat.generateurs.poste = 10;
    });
    const acheter = document.querySelector("[data-test=generateur-poste] .acheter")!;
    const bulle = document.getElementById(acheter.getAttribute("aria-describedby")!);
    expect(bulle?.getAttribute("role")).toBe("tooltip");
    expect(bulle?.textContent?.trim()).toBe("Un poste de travail, occupé à plein temps.");

    const doubleEcran = bouton("Double écran")!;
    expect(
      document.getElementById(doubleEcran.getAttribute("aria-describedby")!)?.textContent?.trim(),
    ).toBe("Deux fois plus de fenêtres ouvertes.");
    expect(texte("[data-test=generateur-poste] .identite p")).toBe(
      `10 en service · ${e("2,50 cr/s")}`,
    );
  });

  it("ouvre l'aide, que le noyau note, puis la referme au bouton ou par Échap", () => {
    aides = 0;
    monter();
    const lien = bouton("Aide")!;
    expect(lien.getAttribute("aria-expanded")).toBe("false");
    lien.click();
    flushSync();
    const aide = document.querySelector("[data-test=aide]")!;
    expect(aide.getAttribute("role")).toBe("dialog");
    expect([...aide.querySelectorAll("dt")].map((dt) => dt.textContent)).toEqual([
      "Crédits",
      "Produire",
      "Moyens de production",
      "Améliorations",
      "Production",
      "Objectifs",
      "Absence",
      "Notation",
    ]);
    expect(aides).toBe(1);
    expect(document.activeElement).toBe(aide);

    bouton("Fermer")!.click();
    flushSync();
    expect(document.querySelector("[data-test=aide]")).toBeNull();
    expect(document.activeElement).toBe(lien);

    lien.click();
    flushSync();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    flushSync();
    expect(document.querySelector("[data-test=aide]")).toBeNull();
    expect(aides).toBe(2);
  });

  it("annonce la fin des objectifs", () => {
    monter((etat) => {
      etat.objectif = 10;
    });
    expect(texte("[data-test=objectif]")).toBe("Tous les objectifs sont atteints.");
  });

  it("fait apparaître la fissure 5 minutes après le seuil, sans texte", () => {
    const { etat } = monter((e) => {
      e.seuilAtteintA = 1_000;
      e.temps = 1_000 + 299;
    });
    expect(document.querySelector("[data-test=fissure]")).toBeNull();
    const texteAvant = document.body.textContent;

    etat.temps = 1_000 + 360;
    flushSync();
    const trace = document.querySelector("[data-test=fissure] path");
    expect(trace?.getAttribute("stroke-dashoffset")).toBe("0.5");
    expect(document.body.textContent).toBe(texteAvant);

    etat.temps = 1_000 + 1_000;
    flushSync();
    expect(trace?.getAttribute("stroke-dashoffset")).toBe("0");
  });

  it("trace la courbe de production dès deux points d'historique", () => {
    const { etat } = monter();
    expect(document.querySelector("polyline")).toBeNull();
    etat.historique.push(1, 2, 4);
    flushSync();
    expect(document.querySelector("polyline")?.getAttribute("points")?.split(" ")).toHaveLength(3);
  });

  it("pose sous la courbe des repères ronds, dans la notation de la surface", () => {
    const { etat } = monter();
    expect(document.querySelectorAll(".repere")).toHaveLength(0);
    etat.historique.push(12_000, 76_600);
    flushSync();
    const reperes = [...document.querySelectorAll(".repere")].map((r) => r.textContent);
    expect(reperes).toEqual(["20 k", "40 k", "60 k", "80 k"].map(e));
    // La courbe finit en haut à droite, un peu sous le bord.
    expect(document.querySelector("polyline")?.getAttribute("points")).toMatch(/ 100\.00,9\.09$/);
  });
});

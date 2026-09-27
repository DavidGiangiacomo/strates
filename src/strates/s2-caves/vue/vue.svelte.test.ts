// @vitest-environment happy-dom
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { strate } from "..";
import type { CommandesNoyau } from "../../../noyau/logique/types";
import type { ActionCaves, EtatCaves } from "../logique";
import { etatInitial, type LigneRegistre } from "../logique/etat";
import Vue from "./Vue.svelte";

const commandes: CommandesNoyau = { demanderFouille() {}, ouvrirAide() {}, terminer() {} };

let composant: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (composant) unmount(composant);
  composant = null;
  document.body.innerHTML = "";
});

function monter(modifs: (etat: EtatCaves) => void = () => {}) {
  const etat = $state(etatInitial());
  modifs(etat);
  const actions: ActionCaves[] = [];
  composant = mount(Vue, {
    target: document.body,
    props: {
      etat,
      agir: (action: ActionCaves) => actions.push(action),
      noyau: commandes,
      o: (cle: string) => strate.textes[cle] ?? `?${cle}`,
      mode: "jeu",
    },
  });
  flushSync();
  return { etat, actions };
}

const texte = (selecteur: string) =>
  (document.querySelector(selecteur)?.textContent ?? "").replace(/[ \t\n\r]+/g, " ").trim();
const bouton = (debut: string) =>
  [...document.querySelectorAll("button")].find((b) => b.textContent?.trim().startsWith(debut));

describe("la vue des caves", () => {
  it("affiche la date, la saison, la réserve et la marque d'hiver, en boisseaux entiers", () => {
    monter();
    expect(texte("[data-test=date]")).toBe("Jour 71 de l'an 1");
    expect(texte("[data-test=saison]")).toBe("Printemps");
    expect(texte("[data-test=calendrier]")).toBe(
      "L'hiver commence dans 280\u00a0jours ; il durera 70\u00a0jours.",
    );
    expect(texte("[data-test=reserve]")).toBe("250 sur 400\u00a0boisseaux");
    expect(texte("[data-test=marque]")).toMatch(/^\d+\u00a0boisseaux$/);
    expect(texte("[data-test=familles]")).toBe("8\u00a0familles");
    expect(texte("[data-test=registre]")).toBe("An 1. 8\u00a0familles, un grenier.");
  });

  it("envoie les actions : glaner, installer une famille, construire un grenier", () => {
    const { actions } = monter();
    bouton("Glaner")!.click();
    bouton("Installer une famille")!.click();
    bouton("Construire")!.click();
    expect(actions).toEqual([
      { type: "glaner" },
      { type: "installer" },
      { type: "construire", stockage: "grenier" },
    ]);
  });

  it("dit qu'il n'y a rien à glaner en hiver, et compte les jours d'hiver", () => {
    monter((etat) => (etat.jour = 360.5));
    expect(texte("[data-test=glaner-rien]")).toBe("Il n'y a rien à glaner.");
    expect(texte("[data-test=saison]")).toBe("Hiver");
    expect(texte("[data-test=calendrier]")).toBe("Encore 60\u00a0jours d'hiver.");
  });

  it("désactive ce qui est trop cher, et signale une marque au-delà des stockages", () => {
    monter((etat) => {
      etat.reserve = 10;
      etat.familles = 40;
    });
    expect(bouton("Installer une famille")!.disabled).toBe(true);
    expect(bouton("Construire")!.disabled).toBe(true);
    expect(document.querySelector("[data-test=marque-au-dessus]")).not.toBeNull();
  });

  it("n'utilise que des clés de texte qui existent", () => {
    const lignes: LigneRegistre[] = [
      { cle: "registre.sans-rupture", valeurs: { annee: 1, naissances: 3 } },
      { cle: "registre.rupture", valeurs: { annee: 2, jours: 12, departs: 4 } },
      { cle: "registre.sans-rupture-vallee-pleine", valeurs: { annee: 3 } },
      { cle: "registre.hivers-allongent", valeurs: { annee: 5, duree: 80 } },
      { cle: "registre.grand-hiver-arrive", valeurs: { annee: 14 } },
      { cle: "registre.grand-hiver", valeurs: { annee: 14, serie: 1 } },
      { cle: "registre.grand-hiver-rupture", valeurs: { annee: 15, jours: 5, departs: 2 } },
      { cle: "registre.serie-rompue", valeurs: {} },
      { cle: "registre.seuil", valeurs: {} },
    ];
    // Le registre n'affiche que ses 8 dernières lignes : deux passages.
    for (const partie of [lignes.slice(0, 4), lignes.slice(4)]) {
      monter((etat) => {
        etat.cumul = 1e7;
        etat.reserve = 1e5;
        etat.outils = 2;
        etat.stockages = { grenier: 3, silo: 2, cave: 1, caveProfonde: 1 };
        etat.registre.push(...partie);
        etat.historique.reserve = [100, 200, 300, 250];
        etat.historique.achats = [0];
      });
      expect(document.body.textContent).not.toContain("?");
      expect(document.body.textContent).not.toContain("{");
      expect(bouton("Acheter : Charrue")).toBeDefined();
      if (composant) unmount(composant);
      composant = null;
    }
  });

  it("dessine le calendrier : l'année en cours et les années vécues, les hivers manqués barrés", () => {
    monter((etat) => {
      etat.annee = 4;
      etat.hivers = [
        { annee: 1, rupture: true },
        { annee: 2, rupture: false },
        { annee: 3, rupture: false },
      ];
    });
    const cases = [...document.querySelectorAll("[data-test^=case-]")];
    expect(cases.map((c) => c.getAttribute("data-test"))).toEqual([
      "case-1",
      "case-2",
      "case-3",
      "case-4",
    ]);
    expect(cases[0]!.classList.contains("manque")).toBe(true);
    expect(cases[0]!.querySelector("line")).not.toBeNull();
    expect(cases[1]!.querySelector("line")).toBeNull();
    expect(cases[3]!.classList.contains("courante")).toBe(true);
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
  });

  it("dit que la vallée est pleine, et qu'elle a tous ses outils", () => {
    monter((etat) => {
      etat.familles = 250;
      etat.outils = 4;
    });
    expect(bouton("Installer une famille")).toBeUndefined();
    expect(document.body.textContent).toContain("La vallée est pleine.");
    expect(document.body.textContent).toContain("La vallée a tous ses outils.");
  });
});

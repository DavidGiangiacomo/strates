// @vitest-environment happy-dom
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { strate } from "..";
import type { CommandesNoyau } from "../../../noyau/logique/types";
import type { ActionCaves, EtatCaves } from "../logique";
import { etatInitial, type LigneRegistre } from "../logique/etat";
import { VALLEE } from "../logique/regles";
import Vue from "./Vue.svelte";

let aides = 0;
const commandes: CommandesNoyau = {
  demanderFouille() {},
  ouvrirAide: () => aides++,
  terminer() {},
};

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
  it("affiche la date, la saison et la réserve, en boisseaux entiers", () => {
    monter();
    expect(texte("[data-test=date]")).toBe("Jour 71 de l'an 1");
    expect(texte("[data-test=saison]")).toBe("Printemps");
    expect(texte("[data-test=calendrier]")).toBe(
      "L'hiver commence dans 280\u00a0jours ; il durera 70\u00a0jours.",
    );
    expect(texte("[data-test=reserve]")).toBe("250 sur 400\u00a0boisseaux");
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
      etat.hivers = [{ annee: 1, rupture: false }];
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
      { cle: "registre.pertes", valeurs: { pourri: 212 } },
      { cle: "registre.eveil", valeurs: {}, objet: "s1-filiale" },
      { cle: "registre.feuille", valeurs: {} },
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
      expect(bouton("Acheter une charrue")).toBeDefined();
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

  it("ne légende ni la marque d'hiver ni les pertes avant le premier bilan", () => {
    monter();
    expect(document.querySelector(".jauge .marque")).not.toBeNull();
    expect(document.querySelector("[data-test=marque]")).toBeNull();
    expect(document.querySelector("[data-test=pertes]")).toBeNull();
    expect(document.querySelector("[data-test=pertes-grenier]")).toBeNull();
  });

  it("les dévoile au premier bilan, avec les pertes de chaque stockage", () => {
    monter((etat) => (etat.hivers = [{ annee: 1, rupture: true }]));
    expect(texte("[data-test=marque]")).toMatch(/^\d+\u00a0boisseaux$/);
    expect(texte("[data-test=pertes]")).toMatch(/par jour$/);
    expect(texte("[data-test=pertes-grenier]")).toMatch(/^pertes : \d+\u00a0boisseau/);
  });

  it("les dévoile dès l'arrivée avec les deux fenêtres", () => {
    monter((etat) => (etat.objets.fenetres = true));
    expect(document.querySelector("[data-test=marque]")).not.toBeNull();
    expect(document.querySelector("[data-test=pertes]")).not.toBeNull();
  });

  it("dessine d'avance les années à venir avec l'armoire qui compte les hivers", () => {
    monter((etat) => (etat.objets.armoire = true));
    const cases = [...document.querySelectorAll("[data-test^=case-]")];
    expect(cases).toHaveLength(20);
    expect(cases[0]!.classList.contains("future")).toBe(false);
    expect(cases[1]!.classList.contains("future")).toBe(true);
    expect(document.querySelector("[data-test=case-14]")?.classList.contains("grand")).toBe(true);
  });

  it("nomme les objets d'en haut à leur éveil, et écrit la ligne de la feuille d'une autre main", () => {
    monter((etat) => {
      etat.registre.push(
        { cle: "registre.eveil", valeurs: {}, objet: "s1-turbine" },
        { cle: "registre.feuille", valeurs: {} },
      );
    });
    const lignes = [...document.querySelectorAll("[data-test=registre] li")];
    expect(lignes[0]!.textContent).toBe("Il reste soixante-trois cases.");
    expect(lignes[0]!.classList.contains("autre-main")).toBe(true);
    expect(lignes[1]!.textContent).toBe("Les familles ont compris la roue chaude.");
  });

  it("écrit la première page : les objets qui agissent déjà, puis ceux qui attendent", () => {
    monter((etat) => {
      etat.registre.push(
        { cle: "registre.eveil", valeurs: {}, objet: "s1-double-ecran" },
        { cle: "registre.eveil", valeurs: {}, objet: "s1-serveur" },
        { cle: "registre.attente", valeurs: { objets: 3 } },
      );
    });
    const lignes = [...document.querySelectorAll("[data-test=registre] li")].map(
      (l) => l.textContent,
    );
    expect(lignes).toEqual([
      "3 objets venus d'en haut, que personne ne sait employer.",
      "Les familles ont compris l'armoire qui compte les hivers.",
      "Les familles ont compris les deux fenêtres.",
      "An 1. 8 familles, un grenier.",
    ]);
  });

  it("dessine la coupe : le grenier seul à l'arrivée, puis chaque couche construite, plus profond", () => {
    const { etat } = monter();
    const couches = () =>
      [...document.querySelectorAll("[data-test^=couche-]")].map((c) =>
        c.getAttribute("data-test"),
      );
    expect(couches()).toEqual(["couche-grenier"]);
    // Le grenier est rempli aux 250 / 400 de la réserve.
    const grain = document.querySelector<SVGElement>("[data-test=couche-grenier] .grain")!;
    expect(grain.style.transform).toBe("scaleY(0.625)");

    etat.stockages.silo = 1;
    etat.stockages.caveProfonde = 1;
    flushSync();
    expect(couches()).toEqual(["couche-caveProfonde", "couche-silo", "couche-grenier"]);
    // Le grain descend au fond : la cave profonde d'abord.
    expect(grain.isConnected).toBe(true);
    expect(grain.style.transform).toBe("scaleY(0)");
  });

  it("fait flotter la marque d'hiver au-dessus du grenier, sans légende avant le premier bilan", () => {
    const { etat } = monter();
    const trait = document.querySelector<SVGElement>("[data-test=trait-marque]")!;
    // 775 boisseaux pour un grenier de 400 : au-dessus du grenier, sous le haut de la coupe.
    const y = Number(/translateY\(([\d.]+)px\)/.exec(trait.style.transform)![1]);
    expect(y).toBeGreaterThan(14);
    expect(y).toBeLessThan(70);
    expect(trait.querySelector(".legende")).toBeNull();

    etat.hivers = [{ annee: 1, rupture: true }];
    flushSync();
    expect(trait.querySelector(".legende")?.textContent).toBe("Marque d'hiver");
  });

  it("refroidit l'écran en hiver, et le réchauffe au printemps", () => {
    const { etat } = monter();
    const froid = () =>
      document.querySelector<HTMLElement>("[data-test=vallee]")!.style.getPropertyValue("--froid");
    expect(froid()).toBe("0");
    etat.jour = 353;
    flushSync();
    expect(froid()).toBe("0.5");
    etat.jour = 380;
    flushSync();
    expect(froid()).toBe("1");
  });

  it("montre les hivers et les années sous la courbe de la réserve", () => {
    monter((etat) => {
      etat.annee = 2;
      etat.jour = 100;
      etat.temps = 450;
      etat.historique.reserve = Array.from({ length: 91 }, (_, i) => 100 + i);
    });
    expect(document.querySelectorAll(".courbe rect.hiver")).toHaveLength(1);
    expect(texte(".libelle-annee")).toBe("an 2");
  });

  it("tient les achats comme des écritures : ce qu'on achète, puis le prix", () => {
    monter();
    const ecritures = [...document.querySelectorAll(".ecriture")].map((e) =>
      [...e.querySelectorAll(".quoi, .prix")].map((s) => s.textContent?.trim()),
    );
    expect(ecritures).toEqual([
      ["Installer une famille", "25\u00a0boisseaux"],
      ["Construire un grenier", "92\u00a0boisseaux"],
    ]);
    expect(texte("[data-test=stockage-grenier] .detail")).toBe(
      "1\u00a0construit · 400\u00a0boisseaux chacun",
    );
  });

  it("écrit une note en marge de chaque écriture : la famille, le stockage, l'outil", () => {
    monter((etat) => (etat.cumul = 200));
    const note = (bouton: HTMLElement) =>
      document.getElementById(bouton.getAttribute("aria-describedby")!)?.textContent?.trim();
    expect(note(bouton("Installer une famille")!)).toBe(
      "Une famille de plus aux champs. Elle récolte l'été, et mange toute l'année.",
    );
    expect(note(bouton("Construire un grenier")!)).toMatch(/^Un bâtiment de bois sur le champ/);
    expect(note(bouton("Acheter une faucille")!)).toBe("On coupe plus vite, et plus près du sol.");
  });

  it("ouvre l'aide, une page du registre que le noyau note, et la referme", () => {
    aides = 0;
    monter();
    const lien = bouton("Aide")!;
    lien.click();
    flushSync();
    const aide = document.querySelector<HTMLElement>("[data-test=aide]")!;
    expect(aide.getAttribute("role")).toBe("dialog");
    expect([...aide.querySelectorAll("h4")].map((h) => h.textContent)).toEqual([
      "Le calendrier",
      "La réserve",
      "Les stockages",
      "Les familles",
      "Les écritures",
    ]);
    expect(document.activeElement).toBe(aide);
    expect(aides).toBe(1);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    flushSync();
    expect(document.querySelector("[data-test=aide]")).toBeNull();
    expect(document.activeElement).toBe(lien);
  });

  it("dit que la vallée est pleine, et qu'elle a tous ses outils", () => {
    monter((etat) => {
      etat.familles = VALLEE;
      etat.outils = 4;
    });
    expect(bouton("Installer une famille")).toBeUndefined();
    expect(document.body.textContent).toContain("La vallée est pleine.");
    expect(document.body.textContent).toContain("La vallée a tous ses outils.");
  });
});

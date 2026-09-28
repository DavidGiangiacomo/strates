// @vitest-environment happy-dom
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ouvrirFouille } from "../logique/artefacts";
import {
  basculer,
  coutChoix,
  emportes,
  formaterBrut,
  prenable,
  resteChoix,
  texteReste,
} from "./fouille";
import Fouille from "./Fouille.svelte";
import type { EcranFouille } from "./passage.svelte";

/** La fouille de la surface d'un joueur correct : 12 points pour un catalogue de 17. */
const fouille = ouvrirFouille(1, 6.12e8);
const preselection = new Set(fouille.preselection);
const def = (id: string) => fouille.catalogue.find((a) => a.id === id)!;

describe("le choix des objets", () => {
  it("part de la présélection, qui dépense les 12 points", () => {
    expect(coutChoix(fouille, preselection)).toBe(12);
    expect(resteChoix(fouille, preselection)).toBe(0);
  });

  it("ne coche pas un objet trop cher pour ce qui reste", () => {
    expect(prenable(fouille, preselection, def("s1-plan"))).toBe(false);
    expect(basculer(fouille, preselection, "s1-plan")).toEqual(preselection);
  });

  it("prend le plus cher à la place d'un autre, une fois celui-ci décoché", () => {
    const sansFiliale = basculer(fouille, preselection, "s1-filiale");
    expect(resteChoix(fouille, sansFiliale)).toBe(3);
    expect(prenable(fouille, sansFiliale, def("s1-plan"))).toBe(false);
    const sansTurbine = basculer(fouille, sansFiliale, "s1-turbine");
    const avecPlan = basculer(fouille, sansTurbine, "s1-plan");
    expect(emportes(fouille, avecPlan)).toEqual([
      "s1-equipe",
      "s1-double-ecran",
      "s1-serveur",
      "s1-plan",
    ]);
    expect(resteChoix(fouille, avecPlan)).toBe(2);
  });

  it("donne les objets dans l'ordre de l'écran, et ignore un objet inconnu", () => {
    expect(emportes(fouille, new Set(["s1-turbine", "s1-equipe"]))).toEqual([
      "s1-equipe",
      "s1-turbine",
    ]);
    expect(basculer(fouille, preselection, "s9-rien")).toEqual(preselection);
  });
});

describe("les textes de l'écran", () => {
  it("accordent les points qui restent", () => {
    expect([0, 1, 2].map(texteReste)).toEqual(["Reste 0 point", "Reste 1 point", "Reste 2 points"]);
  });

  it("écrivent un nombre entier quand la strate ne donne pas sa notation", () => {
    expect(formaterBrut(612_345_678.9)).toBe("612345678");
  });
});

describe("l'écran de fouille", () => {
  let composant: ReturnType<typeof mount> | null = null;
  afterEach(() => {
    if (composant) unmount(composant);
    composant = null;
    document.body.innerHTML = "";
  });

  function monter(props: { occupe?: boolean } = {}) {
    const ecran: EcranFouille = {
      fouille,
      nom: "La surface",
      libelle: "Crédits gagnés",
      formater: (v) => `${(v / 1e6).toFixed(0)} M cr`,
    };
    const ondescendre = vi.fn();
    const onreboucher = vi.fn();
    composant = mount(Fouille, {
      target: document.body,
      props: { ecran, ondescendre, onreboucher, ...props },
    });
    flushSync();
    return { ondescendre, onreboucher };
  }

  const texte = (test: string) =>
    document.querySelector(`[data-test=${test}]`)?.textContent?.replace(/\s+/g, " ").trim();
  const caseDe = (id: string) =>
    document.querySelector<HTMLInputElement>(`[data-test=objet-${id}] input`)!;
  const bouton = (nom: string) =>
    [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === nom)!;

  it("montre la conversion : la valeur dans la notation de la strate, les points, le prix du suivant", () => {
    monter();
    expect(document.querySelector("h2")?.textContent).toBe("La surface");
    expect(texte("valeur")).toBe("612 M cr");
    expect(texte("points")).toBe("12");
    expect(texte("point-suivant")).toBe("1931 M cr");
  });

  it("montre le catalogue sous les noms d'en haut, présélection cochée, sans les effets", () => {
    monter();
    const lignes = [...document.querySelectorAll("li")].map((l) =>
      l.textContent?.replace(/\s+/g, " ").trim(),
    );
    expect(lignes).toEqual([
      "L'équipe 1 multiplicateur",
      "Double écran 2 raccourci",
      "Le serveur 2 affichage",
      "La filiale 3 multiplicateur",
      "La turbine 4 multiplicateur",
      "Plan stratégique 5 unique laissé en haut",
    ]);
    expect(document.body.textContent).not.toContain("roue chaude");
    expect(texte("reste")).toBe("Reste 0 point");
    expect(caseDe("s1-plan").disabled).toBe(true);
    expect(document.activeElement).toBe(caseDe("s1-equipe"));
  });

  it("met à jour ce qui reste, et descend avec le choix du joueur", () => {
    const { ondescendre } = monter();
    caseDe("s1-turbine").click();
    flushSync();
    expect(texte("reste")).toBe("Reste 4 points");
    expect(document.querySelector("[data-test=objet-s1-turbine]")?.textContent).toContain(
      "laissé en haut",
    );
    caseDe("s1-filiale").click();
    flushSync();
    caseDe("s1-plan").click();
    flushSync();
    expect(texte("reste")).toBe("Reste 2 points");

    bouton("descendre").click();
    expect(ondescendre).toHaveBeenCalledWith([
      "s1-equipe",
      "s1-double-ecran",
      "s1-serveur",
      "s1-plan",
    ]);
  });

  it("rebouche par le lien, ou par Échap", () => {
    const { onreboucher } = monter();
    bouton("reboucher").click();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onreboucher).toHaveBeenCalledTimes(2);
  });

  it("ne répond plus pendant que la descente s'engage", () => {
    const { ondescendre, onreboucher } = monter({ occupe: true });
    expect(bouton("descendre").disabled).toBe(true);
    expect(caseDe("s1-equipe").disabled).toBe(true);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onreboucher).not.toHaveBeenCalled();
    expect(ondescendre).not.toHaveBeenCalled();
  });
});

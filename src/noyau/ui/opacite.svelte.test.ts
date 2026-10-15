// @vitest-environment happy-dom
// La couche d'opacité de l'interface (#66 ; docs/comprehension.md, § 4) : la vue de la strate factice
// passe d'opaque à lisible, plus vite quand κ est haut.
import { flushSync, mount, unmount, type Component } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { creerStrateFactice } from "../../strates/factice";
import { coutGenerateur, type EtatFactice } from "../../strates/factice/logique";
import { creerEtatNoyau } from "../logique/etat";
import { Noyau, PAS } from "../logique/noyau";
import { GLYPHES, glyphes } from "../logique/opacite";
import { Registre, type StrateQuelconque } from "../logique/registre";
import type { ActionBase, NumeroStrate, ProprietesVue } from "../logique/types";
import { CoucheOpacite } from "./opacite.svelte";
import { rendreStrateReactive } from "./reactivite.svelte";

const DEBUT = 1_000 * 3600 * 1000;

/** Une partie de strates factices, avec leur vue et leurs textes, commencée à `profondeur`. */
async function partie({
  profondeur = 2 as NumeroStrate,
  kappa = 0,
  alphabet = undefined as string | undefined,
} = {}): Promise<Noyau> {
  const registre = new Registre();
  for (const n of [1, 2, 3] as const) {
    const strate = { ...creerStrateFactice(n), glyphes: alphabet };
    registre.enregistrer(n, async () => strate as unknown as StrateQuelconque);
  }
  const etat = creerEtatNoyau(1, DEBUT);
  Object.assign(etat, { profondeur, kappa });
  const noyau = new Noyau(registre, etat);
  await noyau.demarrer(DEBUT);
  return noyau;
}

let composant: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (composant) unmount(composant);
  composant = null;
  document.body.innerHTML = "";
});

/** Monte la vue de la strate courante à travers sa couche d'opacité, comme App. */
function monter(noyau: Noyau): CoucheOpacite {
  const opacite = new CoucheOpacite(noyau);
  const Vue = noyau.strate.vue as Component<ProprietesVue<object, ActionBase>>;
  composant = mount(Vue, {
    target: document.body,
    props: {
      etat: rendreStrateReactive(noyau),
      agir: (action: ActionBase) => noyau.agir(action),
      noyau: { demanderFouille() {}, ouvrirAide() {}, terminer() {} },
      o: opacite.o,
      lisible: opacite.lisible,
      mode: "jeu",
    },
  });
  flushSync();
  return opacite;
}

/** Joue jusqu'à avoir passé `minutes` dans la strate, puis rend l'image, comme la boucle. */
function jouerJusqua(noyau: Noyau, opacite: CoucheOpacite, minutes: number): void {
  while (noyau.tempsStrate < minutes * 60) noyau.tick(PAS);
  opacite.actualiser();
  flushSync();
}

function premierAchat(noyau: Noyau, opacite: CoucheOpacite): void {
  (noyau.etatStrate as EtatFactice).unites = coutGenerateur(0);
  noyau.agir({ type: "acheter" });
  noyau.tick(0);
  opacite.actualiser();
  flushSync();
}

const texte = (selecteur: string) =>
  (document.querySelector(selecteur)?.textContent ?? "").replace(/\s+/g, " ").trim();
const vue = () => texte("section");

describe("la vue de la strate factice, à travers la couche d'opacité", () => {
  it("arrive opaque : des glyphes à la place des noms, une jauge sans chiffre", async () => {
    monter(await partie());
    // Le titre n'appartient à aucun élément : il se lit dès l'arrivée.
    expect(vue()).toContain("Strate factice");
    for (const nom of ["unités", "générateurs", "Produit en tout", "Tenter sa chance"]) {
      expect(vue()).not.toContain(nom);
    }
    const cumul = texte("[data-test=cumul]");
    expect(cumul).not.toMatch(/\d/);
    expect([...cumul].some((signe) => GLYPHES.includes(signe))).toBe(true);
    expect(document.querySelector("[data-test=cumul] progress")).not.toBeNull();
  });

  it("se lève à l'usage, puis au fil du délai", async () => {
    const noyau = await partie();
    const opacite = monter(noyau);
    premierAchat(noyau, opacite);
    expect(vue()).toContain("unités");
    expect(vue()).toContain("générateurs");
    expect(vue()).not.toContain("Tenter sa chance");
    jouerJusqua(noyau, opacite, 10);
    expect(vue()).toContain("Tenter sa chance");
    expect(vue()).not.toContain("Produit en tout");
    jouerJusqua(noyau, opacite, 20);
    expect(texte("[data-test=cumul]")).toMatch(/^Produit en tout : \d+ \/ 1000$/);
    expect(document.querySelector("[data-test=cumul] progress")).toBeNull();
    // Le seuil, atteint en chemin par le générateur, s'est annoncé en clair.
    expect(vue()).toContain("Seuil de fouille atteint.");
  });

  it("se lève plus vite quand κ est haut : à 3 minutes, κ = 100 lit son compteur, κ = 0 non", async () => {
    for (const [kappa, lisible] of [
      [0, false],
      [100, true],
    ] as const) {
      const noyau = await partie({ kappa });
      jouerJusqua(noyau, monter(noyau), 3);
      expect(vue().includes("Produit en tout")).toBe(lisible);
      unmount(composant!);
      composant = null;
    }
  });
});

describe("la couche d'opacité", () => {
  it("rend le texte d'une clé qu'aucun élément ne couvre, ou la clé elle-même", async () => {
    const noyau = await partie();
    const opacite = new CoucheOpacite(noyau);
    expect(opacite.o("titre")).toBe("Strate factice");
    expect(opacite.o("absente")).toBe("absente");
    expect(opacite.lisible("inconnu")).toBe(true);
  });

  it("dit si une clé est lisible : avec l'élément qui la couvre, toujours si aucun ne la couvre", async () => {
    const noyau = await partie();
    const opacite = new CoucheOpacite(noyau);
    expect(opacite.cleLisible("titre")).toBe(true);
    expect(opacite.cleLisible("absente")).toBe(true);
    expect(opacite.cleLisible("generateurs")).toBe(false);
    premierAchat(noyau, opacite);
    expect(opacite.cleLisible("generateurs")).toBe(true);
    expect(opacite.cleLisible("unites")).toBe(true);
    expect(opacite.cleLisible("cumul")).toBe(false);
  });

  it("met à la place d'un texte opaque les glyphes de sa clé, dans l'alphabet de la strate", async () => {
    const noyau = await partie();
    expect(new CoucheOpacite(noyau).o("cumul")).toBe(glyphes("cumul", "Produit en tout"));
    const chantee = await partie({ alphabet: "♩♪" });
    expect(new CoucheOpacite(chantee).o("cumul")).toMatch(/^[♩♪] [♩♪] [♩♪]$/);
  });

  it("ne réveille la vue que lorsqu'un élément se lève", async () => {
    const noyau = await partie();
    const opacite = new CoucheOpacite(noyau);
    const vus: boolean[] = [];
    const detruire = $effect.root(() => {
      $effect(() => {
        vus.push(opacite.lisible("hasard"));
      });
      flushSync();
      jouerJusqua(noyau, opacite, 5);
      jouerJusqua(noyau, opacite, 9.9);
      jouerJusqua(noyau, opacite, 10);
      jouerJusqua(noyau, opacite, 15);
    });
    detruire();
    expect(vus).toEqual([false, true]);
  });

  it("laisse telle quelle la vue de la strate quittée pendant la descente", async () => {
    const noyau = await partie();
    const opacite = new CoucheOpacite(noyau);
    premierAchat(noyau, opacite);
    expect(opacite.lisible("unites")).toBe(true);
    (noyau.etatStrate as EtatFactice).cumul = 6.12e8;
    noyau.tick(0);
    noyau.ouvrirFouille();
    await noyau.descendre(DEBUT + 1000, []);
    // Le noyau est dans la strate 3, où tout est opaque ; la vue de la 2 ne bouge pas.
    expect(noyau.elementsOpaques().has("unites")).toBe(true);
    opacite.actualiser();
    expect(opacite.lisible("unites")).toBe(true);
  });
});

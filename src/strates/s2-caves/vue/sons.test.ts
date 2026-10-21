// Les sons des caves (#59 ; fiche, § 6) : une rumeur par saison, le grain, le bois et la plume.
// Calculés, toujours les mêmes, et sans rien de commun avec ceux de la surface ou du sol (§ 12).
import { describe, expect, it } from "vitest";
import type { SonCalcule } from "../../../noyau/logique/types";
import { SONS_NOYAU } from "../../../noyau/ui/sons";
import { SONS_SURFACE } from "../../s1-surface/vue/sons";
import { DUREES_SONS, SONS_CAVES, TRAIT, type SonCaves } from "./sons";

const FE = 48000;
const RUMEURS: SonCaves[] = ["printemps", "ete", "automne", "hiver"];
const GESTES: SonCaves[] = ["grain", "bois", "plume"];
const CRETES: Record<SonCaves, number> = {
  printemps: 0.8,
  ete: 0.7,
  automne: 0.75,
  hiver: 0.8,
  grain: 0.6,
  bois: 0.7,
  plume: 0.45,
};

const source = (nom: SonCaves) => SONS_CAVES[nom] as SonCalcule;
/** La fréquence de calcul d'un son : la sienne, ou celle du contexte. */
const frequence = (nom: SonCaves) => source(nom).frequence ?? FE;

/** Calcule un son, en menant ses étapes jusqu'au bout ; rend ses canaux et son nombre d'étapes. */
function rendre(nom: SonCaves, fe = frequence(nom)): { canaux: Float32Array[]; etapes: number } {
  const son = source(nom);
  const canaux = [...Array(son.stereo ? 2 : 1)].map(
    () => new Float32Array(Math.round(son.duree * fe)),
  );
  const retour = son.calculer(canaux, fe);
  let etapes = 0;
  if (retour) while (!retour.next().done) etapes++;
  return { canaux, etapes };
}

const efficace = (x: Float32Array) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length);
const tranche = (x: Float32Array, de: number, a: number, fe: number) =>
  x.subarray(Math.round(de * fe), Math.round(a * fe));
/** L'énergie de chaque tranche d'une seconde. */
const parSeconde = (x: Float32Array, fe: number) =>
  Array.from({ length: Math.floor(x.length / fe) }, (_, k) => efficace(tranche(x, k, k + 1, fe)));
/** La part de l'énergie sous `coupure` hertz, par un passe-bas à un pôle. */
function partGrave(x: Float32Array, coupure: number, fe: number): number {
  const a = 1 - Math.exp((-2 * Math.PI * coupure) / fe);
  let y = 0;
  let grave = 0;
  let tout = 0;
  for (const v of x) {
    y += a * (v - y);
    grave += y * y;
    tout += v * v;
  }
  return grave / tout;
}
/** Deux rendus identiques, échantillon par échantillon (plus vite que `toEqual` sur de longues rumeurs). */
const memes = (a: Float32Array[], b: Float32Array[]) =>
  a.length === b.length && a.every((canal, k) => canal.every((x, i) => Object.is(x, b[k]![i])));
const crete = (canaux: Float32Array[]) =>
  canaux.reduce((m, c) => c.reduce((n, x) => Math.max(n, Math.abs(x)), m), 0);

describe("les sons des caves", () => {
  it.each(Object.keys(SONS_CAVES) as SonCaves[])(
    "%s : sa durée, sa crête, toujours le même",
    (nom) => {
      const { canaux } = rendre(nom);
      for (const canal of canaux) {
        expect(canal.length).toBe(Math.round(DUREES_SONS[nom] * frequence(nom)));
        expect(canal.every((x) => Number.isFinite(x) && Math.abs(x) <= 1)).toBe(true);
      }
      expect(crete(canaux)).toBeCloseTo(CRETES[nom], 5);
      expect(memes(rendre(nom).canaux, canaux)).toBe(true);
    },
  );

  it("n'ont aucun son en commun avec la surface ni avec le sol", () => {
    const ailleurs = [...Object.keys(SONS_SURFACE), ...Object.keys(SONS_NOYAU)];
    expect(Object.keys(SONS_CAVES).filter((nom) => ailleurs.includes(nom))).toEqual([]);
  });
});

describe("les rumeurs des saisons", () => {
  it.each(RUMEURS)("%s : stéréo, en boucle, calculée par étapes, sans jamais se taire", (nom) => {
    const son = source(nom);
    expect(son.stereo).toBe(true);
    expect(son.raccord).toBeGreaterThan(0);
    const { canaux, etapes } = rendre(nom);
    expect(etapes).toBeGreaterThan(20);
    const fe = frequence(nom);
    for (const canal of canaux) {
      const tranches = parSeconde(canal, fe);
      expect(Math.min(...tranches)).toBeGreaterThan(0.02 * Math.max(...tranches));
    }
    // Les deux canaux ne sont pas le même son : la rumeur vient de partout.
    expect(memes([canaux[0]!], [canaux[1]!])).toBe(false);
  });

  it("le printemps et l'été chantent dans l'aigu ; le vent d'hiver reste dans le grave", () => {
    const grave = (nom: SonCaves) => partGrave(rendre(nom).canaux[0]!, 1000, frequence(nom));
    expect(grave("printemps")).toBeLessThan(0.3);
    expect(grave("ete")).toBeLessThan(0.3);
    expect(grave("hiver")).toBeGreaterThan(0.6);
  });

  it("le vent et les feuilles vont par rafales : la rumeur enfle et retombe", () => {
    for (const nom of ["automne", "hiver"] as const) {
      const tranches = parSeconde(rendre(nom).canaux[0]!, frequence(nom));
      expect(Math.max(...tranches) / Math.min(...tranches), nom).toBeGreaterThan(1.5);
    }
  });
});

describe("les sons des gestes", () => {
  it.each(GESTES)("%s : commence et finit sur le silence", (nom) => {
    for (const fe of [44100, 48000]) {
      for (const canal of rendre(nom, fe).canaux) {
        expect(Math.abs(canal[0]!)).toBe(0);
        expect(Math.abs(canal.at(-1)!)).toBe(0);
      }
    }
  });

  it("la poignée de grain tombe serrée, puis se raréfie", () => {
    const [canal] = rendre("grain").canaux;
    expect(efficace(tranche(canal!, 0.02, 0.2, FE))).toBeGreaterThan(
      3 * efficace(tranche(canal!, 0.55, 0.75, FE)),
    );
  });

  it("le bois sonne grave et bref", () => {
    const [canal] = rendre("bois").canaux;
    expect(partGrave(canal!, 2000, FE)).toBeGreaterThan(0.5);
    expect(efficace(tranche(canal!, 0.2, 0.3, FE))).toBeLessThan(
      0.1 * efficace(tranche(canal!, 0, 0.05, FE)),
    );
  });

  it("la plume trace trois traits ; le premier, seul, dit que les rations changent", () => {
    const [canal] = rendre("plume").canaux;
    const trait = efficace(tranche(canal!, 0.03, 0.12, FE));
    expect(efficace(tranche(canal!, TRAIT, 0.205, FE))).toBeLessThan(0.02 * trait);
    expect(efficace(tranche(canal!, 0.335, 0.365, FE))).toBeLessThan(0.02 * trait);
    expect(efficace(tranche(canal!, 0.4, 0.5, FE))).toBeGreaterThan(0.3 * trait);
  });
});

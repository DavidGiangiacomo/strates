// Les sons de l'atelier (#94 ; fiche, § 6) : le tic qui s'enrichit, le crissement, le grand coup du
// seuil, et les gestes. Calculés, toujours les mêmes, et sans rien de commun avec ceux des autres
// couches (§ 12).
import { describe, expect, it } from "vitest";
import type { SonCalcule } from "../../../noyau/logique/types";
import { SONS_NOYAU } from "../../../noyau/ui/sons";
import { SONS_SURFACE } from "../../s1-surface/vue/sons";
import { SONS_CAVES } from "../../s2-caves/vue/sons";
import { TOUR } from "../logique/regles";
import {
  BATTEMENTS,
  COUCHES,
  DUREES_SONS,
  SONS_ATELIER,
  volumeCrissement,
  volumesTic,
  type SonAtelier,
} from "./sons";

const FE = 48000;
const GESTES: SonAtelier[] = ["ensemble", "pose", "cran", "lime", "deplier"];
const CRETES: Record<SonAtelier, number> = {
  ressort: 0.7,
  rouages: 0.6,
  engrenages: 0.5,
  mecanisme: 0.5,
  unisson: 0.75,
  crissement: 0.6,
  ensemble: 0.75,
  pose: 0.7,
  cran: 0.5,
  lime: 0.55,
  deplier: 0.55,
};

const source = (nom: SonAtelier) => SONS_ATELIER[nom] as SonCalcule;
/** La fréquence de calcul d'un son : la sienne, ou celle du contexte. */
const frequence = (nom: SonAtelier) => source(nom).frequence ?? FE;

/** Calcule un son, en menant ses étapes jusqu'au bout ; rend ses canaux et son nombre d'étapes. */
function calculer(nom: SonAtelier, fe = frequence(nom)) {
  const son = source(nom);
  const canaux = [...Array(son.stereo ? 2 : 1)].map(
    () => new Float32Array(Math.round(son.duree * fe)),
  );
  const retour = son.calculer(canaux, fe);
  let etapes = 0;
  if (retour) while (!retour.next().done) etapes++;
  return { canaux, etapes };
}
const rendre = (nom: SonAtelier, fe = frequence(nom)) => calculer(nom, fe).canaux;
/** Les deux canaux mêlés, ou le seul. */
const mono = (canaux: Float32Array[]) => canaux[0]!.map((x, i) => x + (canaux[1]?.[i] ?? 0));

const efficace = (x: Float32Array) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length);
const tranche = (x: Float32Array, de: number, a: number, fe: number) =>
  x.subarray(Math.round(de * fe), Math.round(a * fe));
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
/**
 * Les attaques, en secondes : chaque milliseconde qui dépasse le dixième de la crête après `calme`
 * secondes en dessous.
 */
function attaques(x: Float32Array, fe: number, calme = 0.03): number[] {
  const pas = Math.round(0.001 * fe);
  const enveloppe: number[] = [];
  for (let i = 0; i + pas <= x.length; i += pas) {
    enveloppe.push(x.subarray(i, i + pas).reduce((m, v) => Math.max(m, Math.abs(v)), 0));
  }
  const seuil = 0.1 * Math.max(...enveloppe);
  const debuts: number[] = [];
  let dernier = -Infinity;
  enveloppe.forEach((v, k) => {
    if (v <= seuil) return;
    if (k - dernier > calme * 1000) debuts.push(k / 1000);
    dernier = k;
  });
  return debuts;
}
/** Deux rendus identiques, échantillon par échantillon. */
const memes = (a: Float32Array[], b: Float32Array[]) =>
  a.length === b.length && a.every((canal, k) => canal.every((x, i) => Object.is(x, b[k]![i])));
const crete = (canaux: Float32Array[]) =>
  canaux.reduce((m, c) => c.reduce((n, x) => Math.max(n, Math.abs(x)), m), 0);

describe("les sons de l'atelier", () => {
  it.each(Object.keys(SONS_ATELIER) as SonAtelier[])(
    "%s : sa durée, sa crête, toujours le même",
    (nom) => {
      const canaux = rendre(nom);
      for (const canal of canaux) {
        expect(canal.length).toBe(Math.round(DUREES_SONS[nom] * frequence(nom)));
        expect(canal.every((x) => Number.isFinite(x) && Math.abs(x) <= 1)).toBe(true);
      }
      expect(crete(canaux)).toBeCloseTo(CRETES[nom], 5);
      expect(memes(rendre(nom), canaux)).toBe(true);
    },
  );

  it("n'ont aucun son en commun avec la surface, les caves ni le sol", () => {
    const ailleurs = [SONS_SURFACE, SONS_CAVES, SONS_NOYAU].flatMap((b) => Object.keys(b));
    expect(Object.keys(SONS_ATELIER).filter((nom) => ailleurs.includes(nom))).toEqual([]);
  });

  it("cèdent la main pendant leurs longs calculs, les boucles et le grand coup ; les gestes, brefs, non", () => {
    for (const nom of [...COUCHES, "unisson", "crissement", "ensemble"] as const) {
      expect(calculer(nom).etapes, nom).toBeGreaterThan(5);
    }
    for (const nom of ["pose", "cran", "lime", "deplier"] as const) {
      expect(calculer(nom).etapes, nom).toBe(0);
    }
  });
});

describe("le tic", () => {
  it("boucle sur un tour du ressort, sans fondu : ses coups tombent sur la même grille d'un tour à l'autre", () => {
    for (const nom of [...COUCHES, "unisson"] as const) {
      expect(DUREES_SONS[nom]).toBe(TOUR);
      expect(source(nom).raccord, nom).toBeUndefined();
    }
  });

  it("chaque couche bat à son rythme : le ressort la seconde, les rouages entre ses coups, les engrenages entre les leurs", () => {
    const debuts = (nom: SonAtelier) => attaques(mono(rendre(nom)), frequence(nom));
    const ressort = debuts("ressort");
    expect(ressort).toHaveLength(TOUR * BATTEMENTS.ressort);
    ressort.forEach((t, k) => expect(t).toBeCloseTo(k, 2));
    const rouages = debuts("rouages");
    expect(rouages).toHaveLength(TOUR * BATTEMENTS.rouages);
    rouages.forEach((t, k) => expect(t).toBeCloseTo(0.25 + k / 2, 2));
    // Les engrenages boitent : un coup sur deux un peu en retard, mais jamais sur le coup d'un autre.
    const engrenages = debuts("engrenages");
    expect(engrenages).toHaveLength(TOUR * BATTEMENTS.engrenages);
    engrenages.forEach((t, k) => {
      const regulier = 0.125 + k / 4;
      if (k % 2 === 0) expect(t).toBeCloseTo(regulier, 2);
      else expect(t - regulier).toBeGreaterThan(0.02);
      const voisin = Math.min(...[...ressort, ...rouages].map((u) => Math.abs(t - u)));
      expect(voisin).toBeGreaterThan(0.06);
    });
    // Le mécanisme est le plus serré : trois rythmes qui se croisent.
    expect(debuts("mecanisme").length).toBeGreaterThan(engrenages.length);
  });

  it("va du plus grave au plus fin : le ressort dans le grave, les engrenages tout en haut", () => {
    const grave = (nom: SonAtelier) => partGrave(mono(rendre(nom)), 1000, frequence(nom));
    expect(grave("ressort")).toBeGreaterThan(0.5);
    expect(grave("rouages")).toBeLessThan(0.5 * grave("ressort"));
    expect(grave("engrenages")).toBeLessThan(0.5 * grave("rouages"));
  });

  it("après le seuil, ne bat plus qu'un coup par seconde, de tous les timbres ensemble", () => {
    const unisson = mono(rendre("unisson"));
    const fe = frequence("unisson");
    const debuts = attaques(unisson, fe);
    expect(debuts).toHaveLength(TOUR);
    debuts.forEach((t, k) => expect(t).toBeCloseTo(k, 2));
    // Le grave du ressort et l'aigu des engrenages, dans le même coup.
    expect(partGrave(unisson, 1000, fe)).toBeGreaterThan(0.4);
    expect(1 - partGrave(unisson, 4000, fe)).toBeGreaterThan(0.03);
  });

  it("s'enrichit à chaque pièce entraînée : le ressort dès l'arrivée, puis les couches, l'une après l'autre", () => {
    const debut = volumesTic(0, false);
    expect(debut.ressort).toBeGreaterThan(0.3);
    expect(debut.unisson).toBe(0);
    for (const nom of ["rouages", "engrenages", "mecanisme"] as const) expect(debut[nom]).toBe(0);
    let avant = debut;
    for (let n = 1; n <= 150; n++) {
      const v = volumesTic(n, false);
      for (const nom of COUCHES) expect(v[nom]).toBeGreaterThanOrEqual(avant[nom]);
      avant = v;
    }
    // Les rouages montent les premiers, les engrenages au-delà d'une quinzaine, le mécanisme ensuite.
    expect(volumesTic(16, false).rouages).toBeGreaterThan(0.3);
    expect(volumesTic(16, false).engrenages).toBe(0);
    expect(volumesTic(56, false).engrenages).toBeGreaterThan(0.25);
    expect(volumesTic(56, false).mecanisme).toBeLessThan(0.01);
    expect(volumesTic(55, false).mecanisme).toBe(0);
    expect(volumesTic(140, false).mecanisme).toBeGreaterThan(0.2);
  });

  it("au seuil, les couches se taisent et l'unisson bat seul", () => {
    const v = volumesTic(140, true);
    for (const nom of COUCHES) expect(v[nom]).toBe(0);
    expect(v.unisson).toBeGreaterThan(0.3);
  });
});

describe("le crissement", () => {
  it("crisse par à-coups, et se referme sur un silence : il boucle sans fondu", () => {
    const fe = frequence("crissement");
    const canaux = rendre("crissement");
    expect(source("crissement").raccord).toBeUndefined();
    const crissement = mono(canaux);
    expect(attaques(crissement, fe, 0.5).length).toBeGreaterThanOrEqual(4);
    const dixiemes = Array.from({ length: 110 }, (_, k) =>
      efficace(tranche(crissement, k / 10, (k + 1) / 10, fe)),
    );
    expect(dixiemes.filter((x) => x < 0.01 * Math.max(...dixiemes)).length).toBeGreaterThan(55);
    expect(efficace(tranche(crissement, 0, 0.25, fe))).toBe(0);
    expect(efficace(tranche(crissement, DUREES_SONS.crissement - 0.7, 11, fe))).toBe(0);
    // Il vient de quelque part dans le plan, pas du milieu.
    expect(memes([canaux[0]!], [canaux[1]!])).toBe(false);
  });

  it("monte avec le nombre de pièces qui frottent, jusqu'à trois", () => {
    expect(volumeCrissement(0)).toBe(0);
    expect(volumeCrissement(1)).toBeGreaterThan(0);
    expect(volumeCrissement(2)).toBeGreaterThan(volumeCrissement(1));
    expect(volumeCrissement(3)).toBeGreaterThan(volumeCrissement(2));
    expect(volumeCrissement(9)).toBe(volumeCrissement(3));
  });
});

describe("les gestes et le seuil", () => {
  it.each(GESTES)("%s : commence et finit sur le silence", (nom) => {
    for (const fe of [44100, 48000]) {
      for (const canal of rendre(nom, fe)) {
        expect(Math.abs(canal[0]!)).toBe(0);
        expect(Math.abs(canal.at(-1)!)).toBe(0);
      }
    }
  });

  it("au seuil, un seul grand coup, qui sonne longtemps", () => {
    const fe = frequence("ensemble");
    const coup = mono(rendre("ensemble"));
    expect(attaques(coup, fe, 0.5)).toHaveLength(1);
    const attaque = efficace(tranche(coup, 0, 0.25, fe));
    expect(efficace(tranche(coup, 1, 1.25, fe))).toBeGreaterThan(0.02 * attaque);
  });

  it("la pose est un clic de métal, bref", () => {
    const [pose] = rendre("pose", FE);
    expect(attaques(pose!, FE)).toHaveLength(1);
    expect(efficace(tranche(pose!, 0.15, 0.3, FE))).toBeLessThan(
      0.05 * efficace(tranche(pose!, 0, 0.05, FE)),
    );
  });

  it("le cran tombe en deux temps, plus aigu que la pose", () => {
    const [cran] = rendre("cran", FE);
    const debuts = attaques(cran!, FE, 0.01);
    expect(debuts).toHaveLength(2);
    expect(debuts[1]! - debuts[0]!).toBeCloseTo(0.03, 2);
    expect(partGrave(cran!, 2000, FE)).toBeLessThan(
      0.5 * partGrave(rendre("pose", FE)[0]!, 2000, FE),
    );
  });

  it("la lime râpe en trois coups, dans l'aigu", () => {
    const [lime] = rendre("lime", FE);
    expect(attaques(lime!, FE, 0.04)).toHaveLength(3);
    expect(partGrave(lime!, 2000, FE)).toBeLessThan(0.3);
  });

  it("le plan se déplie en froissant, puis retombe à plat", () => {
    const [deplier] = rendre("deplier", FE);
    const froisse = efficace(tranche(deplier!, 0.1, 0.6, FE));
    expect(froisse).toBeGreaterThan(0);
    // Le plan qui retombe, sourd, après le papier.
    const chute = tranche(deplier!, 0.72, 0.8, FE);
    expect(efficace(chute)).toBeGreaterThan(0.6 * froisse);
    expect(partGrave(chute, 1000, FE)).toBeGreaterThan(
      partGrave(tranche(deplier!, 0.1, 0.6, FE), 1000, FE),
    );
  });
});

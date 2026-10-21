// Les sons de la surface (#59 ; fiche, § 6) : un clic feutré et une note discrète, calculés,
// toujours les mêmes, et qui commencent et finissent sur le silence.
import { describe, expect, it } from "vitest";
import type { SonCalcule } from "../../../noyau/logique/types";
import {
  DEGRES_OBJECTIFS,
  NOTE_DE_BASE,
  SONS_SURFACE,
  vitesseObjectif,
  type SonSurface,
} from "./sons";

const FE = 48000;

function rendre(nom: SonSurface, fe = FE): Float32Array[] {
  const son = SONS_SURFACE[nom] as SonCalcule;
  const canaux = [...Array(son.stereo ? 2 : 1)].map(
    () => new Float32Array(Math.round(son.duree * fe)),
  );
  const etapes = son.calculer(canaux, fe);
  if (etapes) while (!etapes.next().done);
  return canaux;
}

const efficace = (x: Float32Array) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length);
/** La part de l'énergie sous `coupure` hertz, par un passe-bas à un pôle. */
function partGrave(x: Float32Array, coupure: number, fe = FE): number {
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
/** La hauteur apparente, par les passages à zéro. */
function hauteur(x: Float32Array, fe = FE): number {
  let passages = 0;
  for (let i = 1; i < x.length; i++) if (x[i - 1]! < 0 !== x[i]! < 0) passages++;
  return (passages / 2) * (fe / x.length);
}

const NOMS = Object.keys(SONS_SURFACE) as SonSurface[];
const CRETES: Record<SonSurface, number> = { clic: 0.6, note: 0.5 };

describe("les sons de la surface", () => {
  it.each(NOMS)("%s : sa durée, sa crête, et le silence au début et à la fin", (nom) => {
    for (const fe of [44100, 48000]) {
      const [canal] = rendre(nom, fe);
      expect(canal!.length).toBe(Math.round((SONS_SURFACE[nom] as SonCalcule).duree * fe));
      expect(canal!.every((x) => Number.isFinite(x) && Math.abs(x) <= 1)).toBe(true);
      expect(Math.abs(canal![0]!)).toBe(0);
      expect(Math.abs(canal!.at(-1)!)).toBe(0);
      expect(canal!.reduce((m, x) => Math.max(m, Math.abs(x)), 0)).toBeCloseTo(CRETES[nom], 5);
    }
  });

  it.each(NOMS)("%s : toujours le même", (nom) => {
    expect(rendre(nom)).toEqual(rendre(nom));
  });

  it("le clic est feutré : bref, sans aigus, éteint en quelques centièmes de seconde", () => {
    const [clic] = rendre("clic");
    expect(partGrave(clic!, 3000)).toBeGreaterThan(0.6);
    const debut = clic!.subarray(0, Math.round(0.02 * FE));
    const fin = clic!.subarray(Math.round(0.05 * FE));
    expect(efficace(fin)).toBeLessThan(0.05 * efficace(debut));
  });

  it("la note sonne à sa hauteur, et s'éteint peu à peu", () => {
    const [note] = rendre("note");
    const tenue = note!.subarray(Math.round(0.3 * FE), Math.round(0.8 * FE));
    expect(hauteur(tenue) / NOTE_DE_BASE).toBeCloseTo(1, 1);
    const fin = note!.subarray(Math.round(1.8 * FE), Math.round(2.3 * FE));
    expect(efficace(fin)).toBeLessThan(0.2 * efficace(tenue));
  });

  it("chaque objectif monte d'un cran sur une gamme pentatonique, du premier au dixième", () => {
    const vitesses = DEGRES_OBJECTIFS.map((_, i) => vitesseObjectif(i + 1));
    expect(vitesses[0]).toBe(1);
    for (let i = 1; i < vitesses.length; i++) expect(vitesses[i]).toBeGreaterThan(vitesses[i - 1]!);
    // La dixième note est une neuvième majeure au-dessus de l'octave : 21 demi-tons.
    expect(vitesses.at(-1)).toBeCloseTo(2 ** (21 / 12), 12);
    expect(vitesseObjectif(0)).toBe(1);
    expect(vitesseObjectif(12)).toBe(vitesses.at(-1));
  });
});

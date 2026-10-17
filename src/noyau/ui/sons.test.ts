// Les sons du sol (#46) : calculés, toujours les mêmes, et qui commencent et finissent sur le silence.
import { describe, expect, it } from "vitest";
import type { SonCalcule } from "../logique/types";
import { DUREES_SONS, SONS_NOYAU, type SonNoyau } from "./sons";

function rendre(nom: SonNoyau, fe = 48000): Float32Array[] {
  const son = SONS_NOYAU[nom] as SonCalcule;
  const canaux = [...Array(son.stereo ? 2 : 1)].map(
    () => new Float32Array(Math.round(son.duree * fe)),
  );
  son.calculer(canaux, fe);
  return canaux;
}

const efficace = (x: Float32Array) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length);
const tranche = (x: Float32Array, de: number, a: number, fe = 48000) =>
  x.subarray(Math.round(de * fe), Math.round(a * fe));
/** La hauteur apparente, par les passages à zéro : plus le son est clair, plus elle monte. */
function clarte(x: Float32Array, fe = 48000): number {
  let passages = 0;
  for (let i = 1; i < x.length; i++) if (x[i - 1]! < 0 !== x[i]! < 0) passages++;
  return (passages / 2) * (fe / x.length);
}
/** La part de l'énergie qui passe un passe-bas à un pôle de `coupure` hertz. */
function partGrave(x: Float32Array, coupure: number, fe = 48000): number {
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

const NOMS = Object.keys(SONS_NOYAU) as SonNoyau[];
const CRETES: Record<SonNoyau, number> = { resiste: 0.7, pioche: 0.8, descente: 0.7 };

describe("les sons du sol", () => {
  it.each(NOMS)("%s : sa durée, sa crête, et le silence au début et à la fin", (nom) => {
    for (const fe of [44100, 48000]) {
      const canaux = rendre(nom, fe);
      for (const canal of canaux) {
        expect(canal.length).toBe(Math.round(DUREES_SONS[nom] * fe));
        expect(canal.every((x) => Number.isFinite(x) && Math.abs(x) <= 1)).toBe(true);
        expect(Math.abs(canal[0]!)).toBe(0);
        expect(Math.abs(canal.at(-1)!)).toBe(0);
      }
      const crete = canaux.reduce((m, c) => c.reduce((n, x) => Math.max(n, Math.abs(x)), m), 0);
      expect(crete).toBeCloseTo(CRETES[nom], 5);
    }
  });

  it.each(NOMS)("%s : toujours le même", (nom) => {
    expect(rendre(nom)).toEqual(rendre(nom));
  });

  it("le sol qui résiste sonne sourd : un coup grave, éteint en un tiers de seconde", () => {
    const [son] = rendre("resiste");
    expect(clarte(tranche(son!, 0, 0.1))).toBeLessThan(400);
    expect(efficace(tranche(son!, 0.3, 0.4))).toBeLessThan(efficace(tranche(son!, 0, 0.1)) / 10);
  });

  it("le coup de pioche : le coup sourd, puis un éboulement plus clair, qui s'éteint", () => {
    const [gauche, droite] = rendre("pioche");
    const coup = tranche(gauche!, 0, 0.1);
    const eboulement = tranche(gauche!, 0.4, 0.9);
    expect(clarte(eboulement)).toBeGreaterThan(2 * clarte(coup));
    expect(efficace(tranche(gauche!, 1.4, 1.6))).toBeLessThan(efficace(eboulement) / 10);
    // Les pierres tombent de part et d'autre : les deux canaux diffèrent.
    expect(gauche).not.toEqual(droite);
  });

  it("la descente gronde : elle monte, tient pendant le travelling, et s'éteint à l'arrivée", () => {
    const [son] = rendre("descente");
    const tenue = efficace(tranche(son!, 1, 2.5));
    expect(efficace(tranche(son!, 0, 0.1))).toBeLessThan(tenue / 10);
    expect(efficace(tranche(son!, 3.9, 4))).toBeLessThan(tenue / 10);
    expect(partGrave(tranche(son!, 1, 2.5), 300)).toBeGreaterThan(0.6);
  });
});

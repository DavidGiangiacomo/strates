// La boîte à outils de la synthèse (#46, #59) : des filtres qui font ce qu'ils disent, un
// panoramique à puissance constante, et des sons qui commencent et finissent sur le silence.
import { describe, expect, it } from "vitest";
import { creerAlea } from "../logique/alea";
import {
  bandeVariable,
  blanc,
  finir,
  normaliser,
  normaliserParEtapes,
  panoramique,
  passeBas,
  passeHaut,
  resonateur,
} from "./synthese";

const FE = 48000;

/** L'amplitude d'un sinus de `frequence` hertz à la sortie d'un filtre, une fois installé. */
function gain(filtre: (x: number) => number, frequence: number): number {
  let max = 0;
  for (let i = 0; i < FE; i++) {
    const y = filtre(Math.sin((2 * Math.PI * frequence * i) / FE));
    if (i > FE / 2) max = Math.max(max, Math.abs(y));
  }
  return max;
}

describe("les filtres", () => {
  it("passe-bas et passe-haut se partagent le spectre autour de leur coupure", () => {
    expect(gain(passeBas(1000, FE), 100)).toBeGreaterThan(0.99);
    expect(gain(passeBas(1000, FE), 10000)).toBeLessThan(0.15);
    expect(gain(passeHaut(1000, FE), 100)).toBeLessThan(0.15);
    expect(gain(passeHaut(1000, FE), 10000)).toBeGreaterThan(0.9);
  });

  it("le résonateur laisse passer sa fréquence telle quelle, et peu le reste", () => {
    expect(gain(resonateur(2000, 4, FE), 2000)).toBeCloseTo(1, 2);
    expect(gain(resonateur(2000, 4, FE), 500)).toBeLessThan(0.1);
  });

  it("la bande variable suit la fréquence qu'on lui donne à chaque échantillon", () => {
    const bande = (centre: number, signal: number) => {
      const filtre = bandeVariable(4, FE);
      return gain((x) => filtre(x, centre), signal);
    };
    expect(bande(800, 800)).toBeGreaterThan(0.9 * bande(3000, 3000));
    expect(bande(800, 3000)).toBeLessThan(0.3 * bande(800, 800));
    expect(bande(3000, 800)).toBeLessThan(0.3 * bande(3000, 3000));
  });
});

describe("le panoramique", () => {
  it("garde la puissance constante, au centre comme sur les côtés", () => {
    for (const position of [-1, -0.4, 0, 0.7, 1]) {
      const [g, d] = panoramique(position);
      expect(g * g + d * d).toBeCloseTo(1, 12);
    }
    const [g, d] = panoramique(0);
    expect(g).toBeCloseTo(d, 12);
    expect(panoramique(-2)).toEqual(panoramique(-1));
    expect(panoramique(1)[0]).toBeCloseTo(0, 12);
  });
});

describe("la mise en forme d'un son", () => {
  it("le bruit blanc reste entre −1 et 1, et la même graine le redonne", () => {
    const tirage = (graine: number) => {
      const alea = creerAlea(graine);
      return Array.from({ length: 1000 }, () => blanc(alea));
    };
    expect(tirage(3).every((x) => x >= -1 && x < 1)).toBe(true);
    expect(tirage(3)).toEqual(tirage(3));
  });

  it("normalise à la crête voulue, d'un coup ou par étapes, et laisse muet un son muet", () => {
    const son = () => [Float32Array.from([0, 0.5, -2, 1]), Float32Array.from([0.25, 0, 0, 0])];
    const dUnCoup = son();
    normaliser(dUnCoup, 0.8);
    expect(Math.max(...dUnCoup.flatMap((c) => [...c].map(Math.abs)))).toBeCloseTo(0.8, 6);
    const parEtapes = son();
    const etapes = normaliserParEtapes(parEtapes, 0.8, 2);
    let n = 0;
    while (!etapes.next().done) n++;
    expect(n).toBeGreaterThan(1);
    expect(parEtapes).toEqual(dUnCoup);
    const muet = [new Float32Array(4)];
    normaliser(muet, 0.8);
    expect([...muet[0]!]).toEqual([0, 0, 0, 0]);
  });

  it("finit un son joué une fois sur le silence, au début comme à la fin", () => {
    const canal = new Float32Array(FE / 10).fill(0.3);
    finir([canal], FE, 0.5);
    expect(canal[0]).toBe(0);
    expect(canal.at(-1)).toBe(0);
    expect(canal[canal.length / 2]).toBeCloseTo(0.5, 6);
  });
});

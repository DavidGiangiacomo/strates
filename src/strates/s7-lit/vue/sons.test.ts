// Les sons du lit (#114 ; fiche, § 6) : le fleuve au loin, l'eau de chaque crue qui monte et se
// retire, l'eau qui s'engouffre dans un creux, la levée. Calculés, toujours les mêmes, et sans rien
// de commun avec ceux des autres couches (§ 12).
import { describe, expect, it } from "vitest";
import type { SonCalcule } from "../../../noyau/logique/types";
import { SONS_NOYAU } from "../../../noyau/ui/sons";
import { SONS_SURFACE } from "../../s1-surface/vue/sons";
import { SONS_CAVES } from "../../s2-caves/vue/sons";
import { SONS_ATELIER } from "../../s3-atelier/vue/sons";
import { GRANDE_CRUE } from "../logique/regles";
import {
  DUREES_SONS,
  eauDeLaCrue,
  PLACES,
  SONS_LIT,
  VARIANTES,
  volumeFleuve,
  type SonLit,
} from "./sons";

const FE = 48000;
const source = (nom: SonLit) => SONS_LIT[nom] as SonCalcule;
const frequence = (nom: SonLit) => source(nom).frequence ?? FE;

/** Calcule un son, en menant ses étapes jusqu'au bout. */
function rendre(nom: SonLit): Float32Array[] {
  const son = source(nom);
  const fe = frequence(nom);
  const canaux = [...Array(son.stereo ? 2 : 1)].map(
    () => new Float32Array(Math.round(son.duree * fe)),
  );
  const retour = son.calculer(canaux, fe);
  if (retour) while (!retour.next().done);
  return canaux;
}
/** Les deux canaux mêlés, ou le seul. */
const mono = (canaux: Float32Array[]) => canaux[0]!.map((x, i) => x + (canaux[1]?.[i] ?? 0));
const efficace = (x: Float32Array) => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length);
const tranche = (x: Float32Array, de: number, a: number, fe: number) =>
  x.subarray(Math.round(de * fe), Math.round(a * fe));
const crete = (canaux: Float32Array[]) =>
  Math.max(...canaux.map((c) => c.reduce((m, v) => Math.max(m, Math.abs(v)), 0)));
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

/** L'énergie au-dessus de 1 500 hertz, par trois passe-haut à un pôle : le grave n'y passe plus. */
function energieAigue(x: Float32Array, fe: number): number {
  const a = 1 - Math.exp((-2 * Math.PI * 1500) / fe);
  const bas = [0, 0, 0];
  let aigu = 0;
  for (let v of x) {
    for (let k = 0; k < 3; k++) {
      bas[k]! += a * (v - bas[k]!);
      v -= bas[k]!;
    }
    aigu += v * v;
  }
  return aigu;
}

const RENDUS = new Map<SonLit, Float32Array[]>();
const rendu = (nom: SonLit) => {
  if (!RENDUS.has(nom)) RENDUS.set(nom, rendre(nom));
  return RENDUS.get(nom)!;
};
const NOMS = Object.keys(SONS_LIT) as SonLit[];

describe("la banque du lit", () => {
  it("n'a rien de commun avec les autres couches, ni avec le sol", () => {
    for (const autre of [SONS_NOYAU, SONS_SURFACE, SONS_CAVES, SONS_ATELIER]) {
      for (const nom of NOMS) expect(Object.keys(autre)).not.toContain(nom);
    }
  });

  it("calcule chaque son à sa durée, sans silence ni dépassement, toujours le même", () => {
    for (const nom of NOMS) {
      const canaux = rendu(nom);
      expect(canaux[0]!.length, nom).toBe(Math.round(DUREES_SONS[nom] * frequence(nom)));
      expect(
        canaux.every((c) => c.every(Number.isFinite)),
        nom,
      ).toBe(true);
      expect(crete(canaux), nom).toBeGreaterThan(0.5);
      expect(crete(canaux), nom).toBeLessThanOrEqual(0.75 + 1e-6);
    }
    expect(rendre("levee")).toEqual(rendu("levee"));
  });

  it("calcule les longs sons par étapes, sans figer l'image", () => {
    for (const nom of ["fleuve", "montee-1", "retrait-1", "engouffre"] as const) {
      const son = source(nom);
      const canaux = [...Array(son.stereo ? 2 : 1)].map(
        () => new Float32Array(Math.round(son.duree * frequence(nom))),
      );
      const etapes = son.calculer(canaux, frequence(nom));
      expect(etapes, nom).toBeDefined();
      let n = 0;
      while (!etapes!.next().done) n++;
      expect(n, nom).toBeGreaterThan(5);
    }
  });
});

describe("le fleuve", () => {
  it("boucle sans couture, à gauche, grave et sans aigus", () => {
    expect(source("fleuve").raccord).toBeGreaterThan(0);
    const [g, d] = rendu("fleuve");
    expect(efficace(g!)).toBeGreaterThan(1.5 * efficace(d!));
    expect(partGrave(mono(rendu("fleuve")), 800, frequence("fleuve"))).toBeGreaterThan(0.6);
    expect(PLACES.fleuve).toBeLessThan(0);
  });

  it("murmure entre deux crues, enfle un peu pendant la crue, et s'éloigne au bassin plein", () => {
    const calme = volumeFleuve(false, false);
    const crue = volumeFleuve(true, false);
    const plein = volumeFleuve(true, true);
    expect(calme.volume).toBeGreaterThan(0);
    expect(calme.volume).toBeLessThan(0.3);
    expect(crue.volume).toBeGreaterThan(calme.volume);
    // Plus de crue : le fleuve passe ailleurs, lentement, avant la descente, une crue plus tard.
    expect(plein.volume).toBe(0);
    expect(plein.fondu).toBeGreaterThan(20);
    expect(plein.fondu).toBeLessThan(30);
  });
});

describe("l'eau de la crue", () => {
  const fe = frequence("montee-1");
  const montee = mono(rendu("montee-1"));
  const retrait = mono(rendu("retrait-1"));

  it("monte en dix secondes : de plus en plus proche, puis elle se tait", () => {
    const debut = efficace(tranche(montee, 0.5, 2.5, fe));
    const milieu = efficace(tranche(montee, 4, 6, fe));
    const haut = efficace(tranche(montee, 7, 9, fe));
    expect(milieu).toBeGreaterThan(debut);
    expect(haut).toBeGreaterThan(milieu);
    // Au repos, l'eau se tait.
    expect(efficace(tranche(montee, 10.3, 10.5, fe))).toBeLessThan(0.1 * haut);
  });

  it("vient du fleuve, à gauche, et s'étend sur le bassin", () => {
    const [g, d] = rendu("montee-1");
    const ecart = (de: number, a: number) =>
      efficace(tranche(g!, de, a, fe)) / efficace(tranche(d!, de, a, fe));
    expect(ecart(0.5, 2.5)).toBeGreaterThan(ecart(7, 9));
  });

  it("se retire en dix secondes, de plus en plus loin, et finit en silence", () => {
    const debut = efficace(tranche(retrait, 1, 3, fe));
    const fin = efficace(tranche(retrait, 7, 9, fe));
    expect(fin).toBeLessThan(0.7 * debut);
    expect(efficace(tranche(retrait, 10.3, 10.5, fe))).toBeLessThan(0.1 * debut);
  });

  it("n'est jamais tout à fait la même : trois variantes, à tour de rôle, et une vitesse qui change", () => {
    expect(rendu("montee-1")).not.toEqual(rendu("montee-2"));
    expect(rendu("retrait-2")).not.toEqual(rendu("retrait-3"));
    expect([1, 2, 3, 4].map((n) => eauDeLaCrue(n).variante)).toEqual([1, 2, 3, 1]);
    const vitesses = new Set([1, 2, 3, 4, 5].map((n) => eauDeLaCrue(n).vitesse.toFixed(3)));
    expect(vitesses.size).toBe(5);
    for (let n = 1; n < GRANDE_CRUE; n++) {
      expect(eauDeLaCrue(n).variante).toBeLessThanOrEqual(VARIANTES);
      expect(Math.abs(eauDeLaCrue(n).vitesse - 1)).toBeLessThanOrEqual(0.05);
    }
  });

  it("est plus grave, plus longue et plus forte à la grande crue", () => {
    const grande = eauDeLaCrue(GRANDE_CRUE);
    const voisine = eauDeLaCrue(GRANDE_CRUE - 1);
    expect(grande.vitesse).toBeLessThan(0.75);
    expect(grande.volume).toBeGreaterThan(voisine.volume);
  });
});

describe("le creux qui se remplit", () => {
  it("fait entendre une eau plus sourde que la crue", () => {
    const fe = frequence("engouffre");
    const sourde = partGrave(mono(rendu("engouffre")), 400, fe);
    const crue = partGrave(mono(rendu("montee-1")), 400, frequence("montee-1"));
    expect(sourde).toBeGreaterThan(crue);
    expect(PLACES.creux).toBeGreaterThan(0);
  });
});

describe("la levée", () => {
  it("tombe d'un coup de terre, sourd, puis des pierres s'entrechoquent", () => {
    const fe = frequence("levee");
    const [x] = rendu("levee");
    const coup = efficace(tranche(x!, 0.005, 0.1, fe));
    expect(coup).toBeGreaterThan(efficace(tranche(x!, 0.6, 0.85, fe)));
    expect(partGrave(tranche(x!, 0.005, 0.1, fe), 300, fe)).toBeGreaterThan(0.5);
    // Les pierres : des clics aigus, après le coup, qui n'en a presque pas.
    expect(energieAigue(tranche(x!, 0.1, 0.75, fe), fe)).toBeGreaterThan(
      3 * energieAigue(tranche(x!, 0.005, 0.1, fe), fe),
    );
  });
});

// Les sons de la dette (#103 ; fiche, § 6) : le stylet et le sceau, le stylet qui bute, l'eau de
// chaque crue, l'eau de la grande crue qui monte puis se retire, et la tablette qui se brise.
// Calculés, toujours les mêmes, et sans rien de commun avec ceux des autres couches (§ 12).
import { describe, expect, it } from "vitest";
import type { SonCalcule } from "../../../noyau/logique/types";
import { SONS_NOYAU } from "../../../noyau/ui/sons";
import { SONS_SURFACE } from "../../s1-surface/vue/sons";
import { SONS_CAVES } from "../../s2-caves/vue/sons";
import { SONS_ATELIER } from "../../s3-atelier/vue/sons";
import { SONS_LIT } from "../../s7-lit/vue/sons";
import { GRANDE_CRUE_DANS } from "../logique/regles";
import {
  DUREES_SONS,
  flotDeLaCrue,
  grandeEau,
  PLACES,
  RETRAIT,
  SCEAU_APRES,
  SONS_DETTE,
  type SonDette,
} from "./sons";

const FE = 48000;
const source = (nom: SonDette) => SONS_DETTE[nom] as SonCalcule;
const frequence = (nom: SonDette) => source(nom).frequence ?? FE;

/** Calcule un son, en menant ses étapes jusqu'au bout. */
function rendre(nom: SonDette): Float32Array[] {
  const son = source(nom);
  const canaux = [...Array(son.stereo ? 2 : 1)].map(
    () => new Float32Array(Math.round(son.duree * frequence(nom))),
  );
  const retour = son.calculer(canaux, frequence(nom));
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

const RENDUS = new Map<SonDette, Float32Array[]>();
const rendu = (nom: SonDette) => {
  if (!RENDUS.has(nom)) RENDUS.set(nom, rendre(nom));
  return RENDUS.get(nom)!;
};
const NOMS = Object.keys(SONS_DETTE) as SonDette[];

describe("la banque de la dette", () => {
  it("n'a rien de commun avec les autres couches, ni avec le sol", () => {
    for (const autre of [SONS_NOYAU, SONS_SURFACE, SONS_CAVES, SONS_ATELIER, SONS_LIT]) {
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
    expect(rendre("sceau")).toEqual(rendu("sceau"));
  });

  it("calcule l'eau par étapes, sans figer l'image", () => {
    for (const nom of ["flot", "grande-eau", "reflux"] as const) {
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

describe("les gestes", () => {
  it("promettre : le stylet presse trois coins, de plus en plus légers, puis le sceau suit", () => {
    const fe = frequence("stylet");
    const [x] = rendu("stylet");
    const coin = (debut: number) => efficace(tranche(x!, debut, debut + 0.04, fe));
    expect(coin(0)).toBeGreaterThan(coin(0.125));
    expect(coin(0.125)).toBeGreaterThan(coin(0.255));
    // Entre deux coins, le stylet se relève : presque rien.
    expect(efficace(tranche(x!, 0.09, 0.12, fe))).toBeLessThan(0.3 * coin(0.125));
    expect(SCEAU_APRES).toBeGreaterThan(0.25);
    expect(SCEAU_APRES).toBeLessThan(DUREES_SONS.stylet);
  });

  it("le sceau est pressé, pas frappé : plus sourd que le stylet", () => {
    const sceau = partGrave(mono(rendu("sceau")), 400, frequence("sceau"));
    const stylet = partGrave(mono(rendu("stylet")), 400, frequence("stylet"));
    expect(sceau).toBeGreaterThan(2 * stylet);
  });

  it("le stylet qui bute : un toc sec, tout entier dans ses premiers centièmes", () => {
    const fe = frequence("bute");
    const [x] = rendu("bute");
    expect(DUREES_SONS.bute).toBeLessThan(0.2);
    expect(efficace(tranche(x!, 0, 0.02, fe))).toBeGreaterThan(
      10 * efficace(tranche(x!, 0.06, 0.15, fe)),
    );
  });
});

describe("l'eau de la crue", () => {
  const fe = frequence("flot");
  const [x] = rendu("flot");

  it("vient toucher le bord et repart, doucement, puis se tait", () => {
    const venue = efficace(tranche(x!, 0.05, 0.4, fe));
    const crete = efficace(tranche(x!, 0.8, 1.4, fe));
    const fin = efficace(tranche(x!, 3.45, 3.6, fe));
    expect(crete).toBeGreaterThan(2 * venue);
    expect(fin).toBeLessThan(0.1 * crete);
  });

  it("sonne au bord droit, où se tient le compte des crues, doucement, jamais tout à fait au même pas", () => {
    const flots = [1, 2, 3, 4, 5].map(flotDeLaCrue);
    for (const f of flots) {
      expect(f.panoramique).toBe(PLACES.compte);
      expect(f.volume).toBeLessThan(0.5);
      expect(Math.abs(f.vitesse - 1)).toBeLessThanOrEqual(0.05);
    }
    expect(new Set(flots.map((f) => f.vitesse.toFixed(3))).size).toBe(5);
    expect(PLACES.compte).toBeGreaterThan(0);
    expect(PLACES.tablette).toBeLessThan(0);
  });
});

describe("la grande crue", () => {
  it("fait monter l'eau crue après crue, au bord droit, en une boucle sans couture", () => {
    expect(source("grande-eau").raccord).toBeGreaterThan(0);
    const [g, d] = rendu("grande-eau");
    expect(efficace(d!)).toBeGreaterThan(1.3 * efficace(g!));
    const fixee = 300;
    const grande = fixee + GRANDE_CRUE_DANS;
    expect(grandeEau(fixee - 1, null, null).volume).toBe(0);
    const volumes = Array.from(
      { length: GRANDE_CRUE_DANS + 1 },
      (_, k) => grandeEau(fixee + k, grande, null).volume,
    );
    for (let k = 1; k < volumes.length; k++) expect(volumes[k]!).toBeGreaterThan(volumes[k - 1]!);
    expect(volumes[0]!).toBeGreaterThan(0);
    expect(volumes.at(-1)!).toBeLessThanOrEqual(0.6);
  });

  it("se retire en quelques secondes, soldée ; en défaut, se tait d'un coup", () => {
    expect(grandeEau(320, 314, "soldee")).toEqual({ volume: 0, fondu: RETRAIT });
    const defaut = grandeEau(320, 314, "defaut");
    expect(defaut.volume).toBe(0);
    expect(defaut.fondu).toBeLessThanOrEqual(0.1);
    // Le reflux s'éloigne et finit en silence, avant la dernière tablette.
    const fe = frequence("reflux");
    const reflux = mono(rendu("reflux"));
    const debut = efficace(tranche(reflux, 0.3, 1, fe));
    expect(efficace(tranche(reflux, 3, RETRAIT, fe))).toBeLessThan(0.5 * debut);
    expect(efficace(tranche(reflux, RETRAIT + 0.2, DUREES_SONS.reflux, fe))).toBeLessThan(
      0.1 * debut,
    );
  });
});

describe("la tablette brisée", () => {
  it("craque sec : la fêlure d'un coup, puis des éclats, sans résonner", () => {
    const fe = frequence("brisure");
    const [x] = rendu("brisure");
    const felure = efficace(tranche(x!, 0, 0.02, fe));
    expect(felure).toBeGreaterThan(3 * efficace(tranche(x!, 0.15, 0.7, fe)));
    expect(efficace(tranche(x!, 0.15, 0.7, fe))).toBeGreaterThan(0);
    expect(efficace(tranche(x!, 0.74, 0.8, fe))).toBeLessThan(0.05 * felure);
  });
});

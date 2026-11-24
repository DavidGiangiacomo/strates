// La Compréhension dans le lit (#115 ; fiche, § 7) : les mots du lit et ses mesures, qui se lèvent à
// l'usage, par un objet ou au délai, et ses deux actes propres, la levée avant l'eau et la patience.
import { describe, expect, it } from "vitest";
import {
  BAREME,
  delaiLevee,
  PROGRESSION,
  SANS_AIDE,
  SANS_ARTEFACT,
} from "../../../noyau/logique/comprehension";
import { elementsOpaques, type ContexteOpacite } from "../../../noyau/logique/opacite";
import type { ContexteTick, EvenementStrate } from "../../../noyau/logique/types";
import { textes } from "../textes.fr";
import { logique, type EtatLit } from ".";
import { ACTES, BATON, CREUX, creuxPlein, CRUE, DOIGTS, OPAQUES, SOUFFLE } from "./regles";

const JOUR = 24 * 3600;

/** Une partie du lit, et ce qu'elle signale au noyau. */
function partie() {
  const evenements: EvenementStrate[] = [];
  const ctx: ContexteTick = {
    effets: { multiplicateur: () => 1, niveau: () => null },
    emettre: (e) => evenements.push(e),
  };
  const etat: EtatLit = logique.etatInitial({ graine: 1, journal: { strates: [] } });
  return {
    etat,
    ctx,
    /** Fait passer `n` crues, une à une. */
    crues(n: number) {
      for (let i = 0; i < n; i++) logique.tick(etat, CRUE, ctx);
    },
    /** Fait passer les crues jusqu'à ce que `fini` soit vrai. */
    jusqua(fini: () => boolean) {
      for (let i = 0; i < 1000 && !fini(); i++) logique.tick(etat, CRUE, ctx);
    },
    fermer: (k: number) => logique.agir(etat, { type: "fermer", creux: k }, ctx),
    actes: () => evenements.flatMap((e) => (e.type === "acte" ? [e.acte] : [])),
    levees: () => [...new Set(evenements.flatMap((e) => (e.type === "levee" ? [e.element] : [])))],
  };
}

/** Le joueur prévoyant : il ferme chaque creux dès qu'il est le prochain, jusqu'au bassin plein. */
function enPrevoyant(p: ReturnType<typeof partie>): void {
  while (p.etat.pleinA === null) {
    const k = CREUX.findIndex((_, i) => !creuxPlein(p.etat, i));
    if (k >= 0 && p.etat.levee !== k) p.fermer(k);
    p.crues(1);
  }
}

describe("le barème du lit", () => {
  it("compte ses deux actes propres, trois points chacun, et donne au plus ses onze points", () => {
    expect(BAREME[7]).toEqual({
      [SANS_AIDE]: 2,
      [SANS_ARTEFACT]: 3,
      [ACTES.leveeAvantLEau]: 3,
      [ACTES.patience]: 3,
    });
    const total = Object.values(BAREME[7]).reduce((a, b) => a + b, 0);
    expect(total).toBe(PROGRESSION[7]);
    expect(85 + total).toBe(96);
  });
});

describe("les levées par l'usage", () => {
  it("lèvent la crue et le limon à la première crue, la couche et la rive au premier creux plein, les mesures à la première coudée", () => {
    const p = partie();
    p.crues(0);
    expect(p.levees()).toEqual([]);
    p.crues(1);
    expect(p.levees()).toEqual([OPAQUES.crue]);
    // Sans levée, le creux du fond prend trente-quatre crues.
    p.crues(32);
    expect(p.levees()).toEqual([OPAQUES.crue]);
    p.crues(1);
    expect(creuxPlein(p.etat, 0)).toBe(true);
    expect(p.levees()).toEqual([OPAQUES.crue, OPAQUES.couche]);
    // Puis le bassin monte de sept doigts par crue : la première coudée à la quatrième.
    p.crues(3);
    expect(p.levees()).not.toContain(OPAQUES.mesures);
    p.crues(1);
    expect(p.etat.niveau).toBeCloseTo(DOIGTS, 9);
    expect(p.levees()).toEqual([OPAQUES.crue, OPAQUES.couche, OPAQUES.mesures]);
  });

  it("se font aussi pendant l'absence", () => {
    const p = partie();
    logique.absence!(p.etat, 14 * JOUR, p.ctx);
    expect(p.levees()).toEqual([OPAQUES.crue, OPAQUES.couche, OPAQUES.mesures]);
  });
});

describe("l'opacité du lit", () => {
  const opacite = logique.opacite!;
  const contexte = (objets: string[] = [], tempsStrate = 0, kappa = 85): ContexteOpacite => ({
    leves: [],
    kappa,
    tempsStrate,
    effets: { niveau: (id) => (objets.includes(id) ? "puissant" : null) },
  });
  const opaques = (ctx: ContexteOpacite) => [...elementsOpaques(opacite, ctx)].sort();

  it("cache à l'arrivée trois choses : la crue et le limon, la couche et la rive, les mesures", () => {
    expect(opaques(contexte())).toEqual(["couche", "crue", "mesures"]);
  });

  it("couvre les mots qui les disent, et jamais la crue, l'eau, les creux ni la levée elles-mêmes", () => {
    const cles = (id: string) => opacite.find((e) => e.id === id)?.cles ?? [];
    for (const cle of cles(OPAQUES.crue)) expect(textes[cle], cle).toMatch(/crue|limon/i);
    for (const cle of cles(OPAQUES.couche)) expect(textes[cle], cle).toMatch(/couche|rive/i);
    expect(cles(OPAQUES.mesures)).toEqual([]);
    const couvertes = new Set(opacite.flatMap((e) => e.cles ?? []));
    for (const cle of Object.keys(textes)) {
      if (/^(phrase|creux|coupe$|aide$|aide\.fermer|aide\.levee)/.test(cle)) {
        expect(couvertes.has(cle), cle).toBe(false);
      }
    }
    for (const noeud of ["passe", "retenue", "levee", "creux", "bassin", "echelle"]) {
      expect(couvertes.has(`noeud.${noeud}`), noeud).toBe(false);
    }
  });

  it("se lève tout entière avec le bâton qui creuse, la crue et le limon avec le gage qui souffle", () => {
    expect(opaques(contexte([BATON]))).toEqual([]);
    expect(opaques(contexte([SOUFFLE]))).toEqual(["couche", "mesures"]);
  });

  it("se lève au délai : à κ = 85, en quatre minutes à peine", () => {
    expect(delaiLevee(85)).toBeLessThan(4 * 60);
    expect(opaques(contexte([], delaiLevee(85) - 1))).toHaveLength(3);
    expect(opaques(contexte([], delaiLevee(85)))).toEqual([]);
  });
});

describe("la levée avant l'eau", () => {
  it("s'accomplit quand une levée bâtie sur un creux encore sec y retient la première eau", () => {
    const p = partie();
    p.fermer(0);
    p.jusqua(() => creuxPlein(p.etat, 0));
    expect(p.actes()).toEqual([]);
    // Le limon est loin du deuxième creux : on le ferme d'avance.
    expect(p.etat.levee).toBeNull();
    p.fermer(1);
    p.jusqua(() => p.etat.creux[1]! > 0);
    expect(p.etat.couches.at(-1)).toMatchObject({ ou: 1, retenue: true });
    expect(p.actes()).toEqual([ACTES.leveeAvantLEau]);
    // Une fois par levée : les crues suivantes ne la redisent pas.
    p.crues(5);
    expect(p.actes()).toEqual([ACTES.leveeAvantLEau]);
  });

  it("ne compte pas pour le creux du fond, que l'eau atteint dès la première crue", () => {
    const p = partie();
    p.fermer(0);
    p.jusqua(() => creuxPlein(p.etat, 0));
    expect(p.actes()).not.toContain(ACTES.leveeAvantLEau);
  });

  it("ne compte pas quand l'eau était déjà là : le creux sous l'eau, la levée vient trop tard", () => {
    const p = partie();
    // Sans un geste, le limon atteint le deuxième creux à la soixante-dixième crue.
    p.jusqua(() => p.etat.niveau >= CREUX[1]!);
    expect(p.etat.creux[1]).toBe(0);
    p.fermer(1);
    p.crues(1);
    expect(p.etat.couches.at(-1)).toMatchObject({ ou: 1, retenue: true });
    expect(p.actes()).not.toContain(ACTES.leveeAvantLEau);
  });

  it("ne compte pas quand la levée s'en va avant l'eau", () => {
    const p = partie();
    p.fermer(1);
    p.fermer(0);
    p.jusqua(() => p.etat.creux[1]! > 0);
    expect(p.etat.couches.at(-1)).toMatchObject({ ou: 1, retenue: false });
    expect(p.actes()).not.toContain(ACTES.leveeAvantLEau);
  });
});

describe("la patience", () => {
  it("s'accomplit au bassin plein sans levée déplacée, même sans un geste", () => {
    const p = partie();
    p.jusqua(() => p.etat.pleinA !== null);
    expect(p.actes()).toEqual([ACTES.patience]);
  });

  it("se perd à la première levée déplacée d'un creux qui n'était pas plein", () => {
    const p = partie();
    p.fermer(1);
    p.fermer(2);
    expect(p.etat.deplacements).toBe(1);
    p.jusqua(() => p.etat.pleinA !== null);
    expect(p.actes()).not.toContain(ACTES.patience);
  });

  it("s'accomplit aussi quand le bassin se remplit pendant l'absence", () => {
    const p = partie();
    logique.absence!(p.etat, 14 * JOUR, p.ctx);
    expect(p.etat.pleinA).not.toBeNull();
    expect(p.actes()).toEqual([ACTES.patience]);
  });
});

describe("le joueur prévoyant", () => {
  it("accomplit les deux actes : chaque levée bâtie d'avance, aucune déplacée", () => {
    const p = partie();
    enPrevoyant(p);
    // Trois creux fermés d'avance, au-dessus du limon, puis la patience au bassin plein.
    expect(p.actes()).toEqual([
      ACTES.leveeAvantLEau,
      ACTES.leveeAvantLEau,
      ACTES.leveeAvantLEau,
      ACTES.patience,
    ]);
  });
});

describe("un état de la version 2", () => {
  it("prend la levée avant l'eau, fausse : une levée déjà bâtie ne la vaudra pas", () => {
    const v2: Record<string, unknown> = { ...partie().etat };
    delete v2.avantLEau;
    expect((logique.migrations[2]!(v2) as EtatLit).avantLEau).toBe(false);
    expect(logique.versionEtat).toBe(3);
  });
});

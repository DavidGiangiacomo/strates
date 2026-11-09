// Les objets d'en haut dans le lit (fiche, § 8) : ceux qui agissent ici, les couches qu'ils dessinent
// d'avance, la rive qu'ils marquent, et les noms que le lit donne aux objets de la dette. Leurs
// multiplicateurs sont ceux de la boucle (lit.test.ts, absence.test.ts et partie.test.ts).
import { describe, expect, it } from "vitest";
import { CATALOGUE } from "../../../noyau/logique/catalogue";
import type { ContexteTick } from "../../../noyau/logique/types";
import { couchesAVenir, logique, type EtatLit } from ".";
import {
  couchesDAvance,
  CRUE,
  FORCE_GRANDE_CRUE,
  GRANDE_CRUE,
  PASSE,
  REPOS,
  riveMarquee,
} from "./regles";

/** Un contexte où ces objets agissent, puissants ou utiles ; les autres n'agissent pas. */
function contexte(niveaux: Record<string, "puissant" | "utile"> = {}): ContexteTick {
  return {
    effets: { multiplicateur: () => 1, niveau: (id) => niveaux[id] ?? null },
    emettre: () => {},
  };
}

const CTX = contexte();

function nouveau(ctx = CTX): EtatLit {
  return logique.etatInitial({ graine: 1, journal: { strates: [] }, effets: ctx.effets });
}

function jouer(etat: EtatLit, secondes: number, ctx = CTX): void {
  const n = Math.round(secondes / 0.1);
  for (let i = 0; i < n; i++) logique.tick(etat, 0.1, ctx);
}

describe("les objets qui agissent dans le lit", () => {
  it("sont ceux de la dette et du chœur, puissants ou utiles, relus dès l'arrivée et à chaque tick", () => {
    const ctx = contexte({ "s6-sceau": "puissant", "s5-echo": "utile" });
    const etat = nouveau(ctx);
    expect(etat.objets).toEqual(["s5-echo", "s6-sceau"]);
    const sans = nouveau();
    expect(sans.objets).toEqual([]);
    logique.tick(sans, 0.1, ctx);
    expect(sans.objets).toEqual(["s5-echo", "s6-sceau"]);
  });

  it("ne gardent pas la même liste neuve à chaque tick : rien ne change si rien ne change", () => {
    const ctx = contexte({ "s6-bulle": "puissant" });
    const etat = nouveau(ctx);
    const objets = etat.objets;
    logique.tick(etat, 0.1, ctx);
    expect(etat.objets).toBe(objets);
  });
});

describe("les couches dessinées d'avance", () => {
  it("sont trois avec le rouleau qui marque, une avec le gage qui revient, quatre avec les deux", () => {
    expect(couchesDAvance(nouveau())).toBe(0);
    expect(couchesDAvance(nouveau(contexte({ "s6-sceau": "puissant" })))).toBe(3);
    expect(couchesDAvance(nouveau(contexte({ "s5-echo": "utile" })))).toBe(1);
    const deux = nouveau(contexte({ "s6-sceau": "puissant", "s5-echo": "utile" }));
    expect(couchesDAvance(deux)).toBe(4);
  });

  it("sont exactement celles que les crues déposeront, au bassin comme dans un creux", () => {
    const etat = nouveau();
    logique.agir(etat, { type: "fermer", creux: 0 }, CTX);
    jouer(etat, 23 * CRUE);
    const prevues = couchesAVenir(etat, 4);
    expect(prevues.map((c) => c.ou)).toEqual([0, 0, "bassin", "bassin"]);
    const avant = etat.couches.length;
    jouer(etat, 4 * CRUE);
    expect(etat.couches.slice(avant)).toEqual(prevues);
  });

  it("suivent la levée : la bâtir avant la crue change la couche à venir", () => {
    const etat = nouveau();
    expect(couchesAVenir(etat, 1)).toEqual([{ crue: 1, ou: 0, epaisseur: PASSE, retenue: false }]);
    logique.agir(etat, { type: "fermer", creux: 0 }, CTX);
    const [retenue] = couchesAVenir(etat, 1);
    expect(retenue).toMatchObject({ crue: 1, ou: 0, retenue: true });
    expect(retenue!.epaisseur).toBeCloseTo(REPOS, 9);
  });

  it("montrent d'avance la grande crue, et son épaisseur", () => {
    const etat = nouveau();
    jouer(etat, (GRANDE_CRUE - 2) * CRUE);
    const prevues = couchesAVenir(etat, 3);
    expect(prevues.map((c) => c.crue)).toEqual([GRANDE_CRUE - 1, GRANDE_CRUE, GRANDE_CRUE + 1]);
    expect(prevues[1]!.epaisseur).toBe(FORCE_GRANDE_CRUE * PASSE);
  });

  it("s'arrêtent au bassin plein, et ne touchent pas l'état", () => {
    const etat = nouveau();
    jouer(etat, 274 * CRUE);
    const avant = structuredClone(etat);
    expect(couchesAVenir(etat, 4)).toHaveLength(1);
    expect(etat).toEqual(avant);
    jouer(etat, CRUE);
    expect(etat.pleinA).not.toBeNull();
    expect(couchesAVenir(etat, 4)).toEqual([]);
    expect(couchesAVenir(etat, 0)).toEqual([]);
  });
});

describe("la rive marquée", () => {
  it("se marque sur l'échelle avec l'œuf qui garde, et sans lui, jamais", () => {
    expect(riveMarquee(nouveau())).toBe(false);
    expect(riveMarquee(nouveau(contexte({ "s6-bulle": "puissant" })))).toBe(true);
    expect(riveMarquee(nouveau(contexte({ "s6-sceau": "puissant" })))).toBe(false);
  });
});

describe("les noms d'en bas", () => {
  it("sont ceux que le lit donne aux objets de la dette : des choses simples, et ce qu'elles font", () => {
    const nommes = logique.nommes!(nouveau());
    const dette = CATALOGUE.filter((a) => a.origine === 6);
    expect([...nommes].sort()).toEqual(dette.map((a) => a.id).sort());
    expect(dette.map((a) => a.nomDEnBas)).toContain("la pierre qui pèse");
  });
});

describe("un état de la version 1", () => {
  it("prend la liste des objets, vide : le premier tick la relit", () => {
    const v1: Record<string, unknown> = { ...nouveau() };
    delete v1.objets;
    const migre = logique.migrations[1]!(v1) as EtatLit;
    expect(migre.objets).toEqual([]);
    logique.tick(migre, 0.1, contexte({ "s6-bulle": "puissant" }));
    expect(migre.objets).toEqual(["s6-bulle"]);
    expect(logique.versionEtat).toBe(2);
  });
});

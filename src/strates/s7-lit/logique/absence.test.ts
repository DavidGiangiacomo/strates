// L'absence dans le lit (fiche, § 10) : politique propre, à 100 %, sans plafond. Les crues passent une
// à une, × patience ; la levée bâtie avant de partir tient ; le bassin plein attend le joueur, et la
// descente part une crue après son retour. Le jeu parle au retour d'une heure au moins.
import { describe, expect, it } from "vitest";
import type { ContexteTick, EvenementStrate } from "../../../noyau/logique/types";
import { textes } from "../textes.fr";
import { logique, type EtatLit } from ".";
import { CRUE, DUREE_PHRASE, RIVE, VOLUME } from "./regles";

const HEURE = 3600;
const JOUR = 24 * HEURE;

function contexte(
  evenements: EvenementStrate[] = [],
  multiplicateurs: Record<string, number> = {},
): ContexteTick {
  return {
    effets: { multiplicateur: (levier) => multiplicateurs[levier] ?? 1, niveau: () => null },
    emettre: (e) => evenements.push(e),
  };
}

const CTX = contexte();

function nouveau(): EtatLit {
  return logique.etatInitial({ graine: 1, journal: { strates: [] } });
}

/** Fait passer `secondes`, par pas de 0,1 s comme le noyau. */
function jouer(etat: EtatLit, secondes: number, ctx = CTX): void {
  const n = Math.round(secondes / 0.1);
  for (let i = 0; i < n; i++) logique.tick(etat, 0.1, ctx);
}

function fermer(etat: EtatLit, creux: number, ctx = CTX): void {
  logique.agir(etat, { type: "fermer", creux }, ctx);
}

const seuil = (etat: EtatLit) => logique.seuil(etat).atteint;

describe("l'absence", () => {
  it("se calcule crue par crue, comme si le joueur était là : sans objets, le même lit", () => {
    const present = nouveau();
    const absent = nouveau();
    fermer(present, 0);
    fermer(absent, 0);
    jouer(present, 50 * 60);
    logique.absence!(absent, 50 * 60, CTX);
    expect(absent.crues).toBe(present.crues);
    expect(absent.niveau).toBe(present.niveau);
    expect(absent.creux).toEqual(present.creux);
    expect(absent.couches).toEqual(present.couches);
    expect(absent.temps).toBeCloseTo(present.temps, 6);
  });

  it("n'écrit aucune ligne : le noyau ne montre pas de résumé", () => {
    expect(logique.horsLigne).toEqual({ type: "propre" });
    expect(logique.absence!(nouveau(), 3 * HEURE, CTX)).toEqual({ lignes: [] });
  });

  it("de deux semaines remplit le bassin, qui attend le joueur : la descente part une crue après son retour", () => {
    const etat = nouveau();
    fermer(etat, 0);
    logique.absence!(etat, 14 * JOUR, CTX);
    expect(etat.temps).toBe(14 * JOUR);
    expect(etat.niveau).toBe(RIVE);
    expect(etat.depose).toBeCloseTo(RIVE + 4 * VOLUME, 6);
    // 40 320 crues en deux semaines, mais le bassin est plein en moins de 300 : au-delà, rien ne bouge.
    expect(etat.crues).toBeLessThan(300);
    // Sa levée posée, le joueur qui part trouve le bassin plein à 2 h 13 de crues (fiche, § 4).
    expect(Math.round(etat.pleinA! / 60)).toBe(133);
    expect(etat.descenteA).toBeNull();
    expect(seuil(etat)).toBe(false);

    jouer(etat, 0.1);
    expect(etat.descenteA).toBeCloseTo(14 * JOUR + CRUE, 6);
    jouer(etat, CRUE - 0.2);
    expect(seuil(etat)).toBe(false);
    jouer(etat, 0.1);
    expect(seuil(etat)).toBe(true);
  });

  it("tient compte du temps de la crue : une absence de quelques secondes ne fait passer que celle qui vient", () => {
    const etat = nouveau();
    jouer(etat, 25);
    logique.absence!(etat, 4, CTX);
    expect(etat.crues).toBe(0);
    logique.absence!(etat, 1, CTX);
    expect(etat.crues).toBe(1);
  });

  it("garde la levée bâtie avant de partir, jusqu'à ce que son creux soit plein : il n'y en a pas d'autre", () => {
    const etat = nouveau();
    fermer(etat, 0);
    logique.absence!(etat, 2 * HEURE, CTX);
    expect(etat.levee).toBeNull();
    // Le premier creux seul a reçu l'eau retenue.
    const retenues = new Set(etat.couches.filter((c) => c.retenue).map((c) => c.ou));
    expect([...retenues]).toEqual([0]);
  });

  it("garde une levée bâtie d'avance sur un creux à sec, que la crue atteint pendant l'absence", () => {
    const etat = nouveau();
    fermer(etat, 0);
    jouer(etat, 25 * CRUE);
    fermer(etat, 1);
    logique.absence!(etat, HEURE, CTX);
    expect(etat.couches.filter((c) => c.ou === 1).every((c) => c.retenue)).toBe(true);
    expect(etat.deplacements).toBe(0);
  });

  it("compte le limon × patience, et l'eau retenue × dépôt aussi : le lit se dépose plus vite laissé seul", () => {
    const ctx = contexte([], { depot: 1.41, patience: 1.25 });
    const etat = nouveau();
    fermer(etat, 0, ctx);
    logique.absence!(etat, CRUE, ctx);
    expect(etat.creux[0]).toBeCloseTo((28 / 3) * 1.41 * 1.25, 9);

    // Le joueur qui ferme le premier creux, voit la première crue, puis part : 1 h 44 avec les objets
    // d'un jeu correct, 1 h 46 et demie avec le gage patient seul (fiche, § 8).
    const partir = (c: ContexteTick) => {
      const e = nouveau();
      fermer(e, 0, c);
      jouer(e, CRUE, c);
      logique.absence!(e, 14 * JOUR, c);
      return e.pleinA! / 60;
    };
    expect(Math.round(partir(ctx))).toBe(104);
    expect(partir(contexte([], { patience: 1.25 }))).toBe(106.5);
  });

  it("fait attendre une descente qui n'était pas partie : elle repart une crue après le retour", () => {
    const etat = nouveau();
    jouer(etat, 3 * HEURE);
    const plein = etat.pleinA!;
    expect(etat.descenteA).toBe(plein + CRUE);
    expect(seuil(etat)).toBe(true);

    const juste = nouveau();
    while (juste.pleinA === null) jouer(juste, 10);
    expect(seuil(juste)).toBe(false);
    logique.absence!(juste, 10 * 60, CTX);
    expect(juste.descenteA).toBeNull();
    expect(seuil(juste)).toBe(false);
    jouer(juste, CRUE + 0.1);
    expect(seuil(juste)).toBe(true);
  });

  it("laisse partie une descente déjà venue", () => {
    const etat = nouveau();
    jouer(etat, 3 * HEURE);
    const descente = etat.descenteA;
    logique.absence!(etat, HEURE, CTX);
    expect(etat.descenteA).toBe(descente);
    expect(seuil(etat)).toBe(true);
  });
});

describe("le retour", () => {
  it("après une heure au moins, fait dire au jeu « Ce que vous avez laissé en haut est toujours là. », une fois", () => {
    const evenements: EvenementStrate[] = [];
    const ctx = contexte(evenements);
    const etat = nouveau();
    jouer(etat, 60, ctx);
    logique.absence!(etat, HEURE - 1, ctx);
    expect(etat.dites.map((p) => p.cle)).toEqual(["phrase.arrivee"]);
    logique.absence!(etat, HEURE, ctx);
    expect(etat.dites.find((p) => p.cle === "phrase.retour")).toEqual({
      cle: "phrase.retour",
      a: etat.temps,
    });
    expect(textes["phrase.retour"]).toBe("Ce que vous avez laissé en haut est toujours là.");
    expect(evenements).toContainEqual({ type: "trace", cle: "phrase.retour" });
    logique.absence!(etat, 2 * HEURE, ctx);
    expect(etat.dites.filter((p) => p.cle === "phrase.retour")).toHaveLength(1);
  });

  it("dit ensuite ce que le jeu aurait dit pendant l'absence : chaque phrase paraît seule", () => {
    const etat = nouveau();
    fermer(etat, 0);
    logique.absence!(etat, 3 * HEURE, CTX);
    const retour = etat.temps;
    expect(etat.dites.slice(1)).toEqual([
      { cle: "phrase.retour", a: retour },
      { cle: "phrase.decider", a: retour + DUREE_PHRASE },
    ]);
  });

  it("dit la phrase différée même après une courte absence, sans celle du retour", () => {
    const etat = nouveau();
    jouer(etat, 110 * 60);
    expect(etat.dites.map((p) => p.cle)).toEqual(["phrase.arrivee"]);
    logique.absence!(etat, 10 * 60, CTX);
    expect(etat.dites.slice(1)).toEqual([{ cle: "phrase.decider", a: etat.temps }]);
  });
});

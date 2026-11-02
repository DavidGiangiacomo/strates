// La boucle du lit (fiche, § 3) : les crues, les creux et la levée, la grande crue, le bassin plein et
// la descente qui vient seule, les phrases du jeu.
import { describe, expect, it } from "vitest";
import { pointsDeFouille } from "../../../noyau/logique/artefacts";
import type {
  ContexteTick,
  EntreeJournal,
  EvenementStrate,
  Journal,
} from "../../../noyau/logique/types";
import { textes } from "../textes.fr";
import { logique, type EtatLit } from ".";
import {
  creuxPlein,
  CREUX,
  CRUE,
  DOIGTS,
  etatCreux,
  FORCE_GRANDE_CRUE,
  GRANDE_CRUE,
  PASSE,
  REPOS,
  RIVE,
  VOLUME,
} from "./regles";

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

function nouveau(journal: Journal = { strates: [] }): EtatLit {
  return logique.etatInitial({ graine: 1, journal });
}

/** Fait passer `secondes`, par pas de 0,1 s comme le noyau. */
function jouer(etat: EtatLit, secondes: number, ctx = CTX): void {
  const n = Math.round(secondes / 0.1);
  for (let i = 0; i < n; i++) logique.tick(etat, 0.1, ctx);
}

function fermer(etat: EtatLit, creux: number, ctx = CTX): void {
  logique.agir(etat, { type: "fermer", creux }, ctx);
}

/** Joue jusqu'au bassin plein, en fermant chaque creux dès qu'il est le prochain : le joueur prévoyant. */
function jouerEnPrevoyant(etat: EtatLit, ctx = CTX): void {
  while (etat.pleinA === null) {
    const k = CREUX.findIndex((_, i) => !creuxPlein(etat, i));
    if (k >= 0 && etat.levee !== k) fermer(etat, k, ctx);
    jouer(etat, CRUE, ctx);
  }
}

function entree(strate: EntreeJournal["strate"], issue?: string): EntreeJournal {
  return {
    strate,
    arrivee: 0,
    tempsDeJeu: 0,
    tempsHorsLigne: 0,
    aideConsultee: false,
    actes: [],
    leves: [],
    nommes: [],
    perturbations: [],
    ...(issue === undefined ? {} : { seuil: { le: 0, issue } }),
  };
}

describe("l'arrivée", () => {
  it("trouve le bassin vide, et le jeu parle : « Rien ne presse. »", () => {
    const etat = nouveau();
    expect(etat.niveau).toBe(0);
    expect(etat.crues).toBe(0);
    expect(etat.creux).toEqual([0, 0, 0, 0]);
    expect(etat.levee).toBeNull();
    expect(etat.dites).toEqual([{ cle: "phrase.arrivee", a: 0 }]);
    expect(textes["phrase.arrivee"]).toBe("Rien ne presse.");
    expect(logique.seuil(etat)).toEqual({ atteint: false, automatique: true });
  });

  it("lit au journal l'issue de la dette, dont les fosses sont dans la rive", () => {
    expect(nouveau().dette).toBeNull();
    expect(nouveau({ strates: [entree(6)] }).dette).toBeNull();
    expect(nouveau({ strates: [entree(5, "x"), entree(6, "soldee")] }).dette).toBe("soldee");
    expect(nouveau({ strates: [entree(6, "defaut")] }).dette).toBe("defaut");
  });

  it("relit les objets d'en haut : leurs multiplicateurs sur l'eau retenue et sur l'absence", () => {
    const effets = contexte([], { depot: 1.41, patience: 1.25 }).effets;
    const etat = logique.etatInitial({ graine: 1, journal: { strates: [] }, effets });
    expect(etat.multiplicateurs).toEqual({ depot: 1.41, patience: 1.25 });
    expect(logique.leviers).toEqual({ principal: "depot", secondaires: ["patience"] });
  });
});

describe("les crues", () => {
  it("viennent toutes les trente secondes, la première trente secondes après l'arrivée", () => {
    const etat = nouveau();
    jouer(etat, 29.9);
    expect(etat.crues).toBe(0);
    jouer(etat, 0.1);
    expect(etat.crues).toBe(1);
    jouer(etat, 10 * CRUE);
    expect(etat.crues).toBe(11);
    expect(etat.temps).toBeCloseTo(11 * CRUE, 6);
  });

  it("passent une à une dans un long pas, comme dans des pas courts", () => {
    const court = nouveau();
    const long = nouveau();
    fermer(court, 0);
    fermer(long, 0);
    jouer(court, 4000);
    logique.tick(long, 4000, CTX);
    expect(long.crues).toBe(court.crues);
    expect(long.niveau).toBeCloseTo(court.niveau, 9);
    expect(long.creux).toEqual(court.creux);
    expect(long.couches).toEqual(court.couches);
  });

  it("vont d'abord au creux du fond, que l'eau atteint dès la première : le bassin ne monte pas", () => {
    const etat = nouveau();
    expect(etatCreux(etat, 0)).toBe("eau");
    jouer(etat, CRUE);
    expect(etat.creux[0]).toBe(PASSE);
    expect(etat.niveau).toBe(0);
    expect(etat.couches).toEqual([{ crue: 1, ou: 0, epaisseur: PASSE, retenue: false }]);
  });

  it("remplissent un creux en 34 crues d'eau qui passe, en 25 derrière la levée, qui disparaît alors", () => {
    const sans = nouveau();
    jouer(sans, 33 * CRUE);
    expect(creuxPlein(sans, 0)).toBe(false);
    jouer(sans, CRUE);
    expect(creuxPlein(sans, 0)).toBe(true);
    // Une crue, une couche : le creux prend tout le limon de celle qui le remplit.
    expect(sans.niveau).toBe(0);

    const avec = nouveau();
    fermer(avec, 0);
    expect(etatCreux(avec, 0)).toBe("ferme");
    jouer(avec, 24 * CRUE);
    expect(creuxPlein(avec, 0)).toBe(false);
    expect(avec.levee).toBe(0);
    jouer(avec, CRUE);
    expect(creuxPlein(avec, 0)).toBe(true);
    expect(avec.creux[0]).toBe(VOLUME);
    expect(avec.levee).toBeNull();
    expect(etatCreux(avec, 0)).toBe("plein");
    expect(avec.couches.every((c) => c.ou === 0 && c.retenue)).toBe(true);
    expect(avec.couches[0]!.epaisseur).toBeCloseTo(REPOS, 9);
  });

  it("font ensuite monter le bassin de sept doigts, jusqu'au creux suivant, où l'échelle s'arrête", () => {
    const etat = nouveau();
    fermer(etat, 0);
    jouer(etat, 26 * CRUE);
    expect(etat.niveau).toBe(PASSE);
    expect(etat.couches.at(-1)).toEqual({
      crue: 26,
      ou: "bassin",
      epaisseur: PASSE,
      retenue: false,
    });
    expect(etatCreux(etat, 1)).toBe("sec");
    jouer(etat, 35 * CRUE);
    expect(etat.niveau).toBe(9 * DOIGTS);
    expect(etatCreux(etat, 1)).toBe("eau");
    jouer(etat, 5 * CRUE);
    expect(etat.niveau).toBe(9 * DOIGTS);
    expect(etat.creux[1]).toBe(5 * PASSE);
  });
});

describe("la levée", () => {
  it("se bâtit avant l'eau, sur un creux à sec, et attend la crue qui l'atteindra", () => {
    const etat = nouveau();
    fermer(etat, 0);
    jouer(etat, 25 * CRUE);
    fermer(etat, 1);
    expect(etatCreux(etat, 1)).toBe("ferme");
    jouer(etat, 36 * CRUE);
    expect(etat.niveau).toBe(9 * DOIGTS);
    expect(etat.creux[1]).toBe(0);
    jouer(etat, CRUE);
    expect(etat.creux[1]).toBeCloseTo(REPOS, 9);
    expect(etat.couches.at(-1)).toMatchObject({ ou: 1, retenue: true });
    expect(etat.deplacements).toBe(0);
  });

  it("se déplace quand on ferme un autre creux : la patience le compte", () => {
    const etat = nouveau();
    fermer(etat, 0);
    fermer(etat, 2);
    expect(etat.levee).toBe(2);
    expect(etat.deplacements).toBe(1);
    jouer(etat, CRUE);
    expect(etat.couches.at(-1)).toMatchObject({ ou: 0, retenue: false });
  });

  it("ne compte pas comme déplacée quand elle a disparu sous le limon", () => {
    const etat = nouveau();
    fermer(etat, 0);
    jouer(etat, 25 * CRUE);
    fermer(etat, 1);
    expect(etat.deplacements).toBe(0);
  });

  it("ne se bâtit ni sur un creux plein, ni deux fois sur le même, ni hors des quatre creux", () => {
    const etat = nouveau();
    jouer(etat, 34 * CRUE);
    for (const creux of [0, -1, 4, 1.5, Number.NaN]) fermer(etat, creux);
    logique.agir(etat, { type: "creuser" } as never, CTX);
    expect(etat.levee).toBeNull();
    fermer(etat, 3);
    fermer(etat, 3);
    expect(etat.levee).toBe(3);
    expect(etat.deplacements).toBe(0);
  });
});

describe("la grande crue", () => {
  it("vient à la 150ᵉ crue, vers 1 h 15, et apporte le limon de six", () => {
    const etat = nouveau();
    jouer(etat, (GRANDE_CRUE - 1) * CRUE);
    const avant = etat.depose;
    jouer(etat, CRUE);
    const couche = etat.couches.at(-1)!;
    expect(couche.crue).toBe(GRANDE_CRUE);
    expect(GRANDE_CRUE * CRUE).toBe(75 * 60);
    // Sans un geste, elle tombe dans le troisième creux, qui n'est pas encore plein.
    expect(couche).toEqual({
      crue: GRANDE_CRUE,
      ou: 2,
      epaisseur: FORCE_GRANDE_CRUE * PASSE,
      retenue: false,
    });
    expect(etat.depose - avant).toBeCloseTo(FORCE_GRANDE_CRUE * PASSE, 9);
  });
});

describe("le bassin plein", () => {
  it("arrête les crues à la rive : le fleuve passe ailleurs", () => {
    const etat = nouveau();
    jouer(etat, 3 * 3600);
    expect(etat.niveau).toBe(RIVE);
    expect(etat.creux).toEqual([VOLUME, VOLUME, VOLUME, VOLUME]);
    expect(etat.pleinA).toBe(etat.crues * CRUE);
    const crues = etat.crues;
    jouer(etat, 600);
    expect(etat.crues).toBe(crues);
    // Sans un geste : 2 h 17 et demie de crues (fiche, § 4).
    expect(etat.pleinA! / 60).toBeCloseTo(137.5, 6);
  });

  it("fait venir la descente une crue plus tard, d'elle-même, sans écran de choix", () => {
    const etat = nouveau();
    jouerEnPrevoyant(etat);
    const plein = etat.pleinA!;
    expect(etat.descenteA).toBe(plein + CRUE);
    expect(logique.seuil(etat)).toEqual({ atteint: false, automatique: true });
    jouer(etat, CRUE - 0.2);
    expect(logique.seuil(etat).atteint).toBe(false);
    jouer(etat, 0.2);
    expect(logique.seuil(etat)).toEqual({ atteint: true, automatique: true });
    // Le joueur prévoyant : 2 h 00 (fiche, § 4).
    expect(Math.round(plein / 60)).toBe(120);
  });

  it("tient toujours le même limon, quels que soient les gestes : 4 points", () => {
    const sans = nouveau();
    jouer(sans, 3 * 3600);
    const prevoyant = nouveau();
    jouerEnPrevoyant(prevoyant);
    const avecObjets = nouveau();
    jouerEnPrevoyant(avecObjets, contexte([], { depot: 1.41 }));
    for (const etat of [sans, prevoyant, avecObjets]) {
      expect(logique.valeurConvertible(etat)).toBeCloseTo(RIVE + 4 * VOLUME, 6);
      expect(pointsDeFouille(logique.valeurConvertible(etat))).toBe(4);
    }
    expect(Math.round(RIVE + 4 * VOLUME)).toBe(1941);
  });
});

describe("les objets d'en haut", () => {
  it("multiplient l'eau retenue derrière une levée (depot), et rien d'autre", () => {
    const ctx = contexte([], { depot: 1.5, patience: 2 });
    const etat = nouveau();
    fermer(etat, 1, ctx);
    jouer(etat, CRUE, ctx);
    // Le creux du fond n'est pas fermé : l'eau y passe, et la patience ne compte qu'en absence.
    expect(etat.creux[0]).toBe(PASSE);
    fermer(etat, 0, ctx);
    jouer(etat, CRUE, ctx);
    expect(etat.creux[0]).toBeCloseTo(PASSE + 1.5 * REPOS, 9);
  });

  it("raccourcissent la strate de celui qui ferme les creux : 1 h 46 pour le prévoyant, avec ceux d'un jeu correct", () => {
    const etat = nouveau();
    jouerEnPrevoyant(etat, contexte([], { depot: 1.41, patience: 1.25 }));
    expect(Math.round(etat.pleinA! / 60)).toBe(106);
  });
});

describe("les phrases du jeu", () => {
  it("disent « Vous n'avez rien à décider ici. » quand le dernier creux est plein, une seule fois", () => {
    const evenements: EvenementStrate[] = [];
    const ctx = contexte(evenements);
    const etat = nouveau();
    jouerEnPrevoyant(etat, ctx);
    const decider = etat.dites.filter((p) => p.cle === "phrase.decider");
    expect(decider).toHaveLength(1);
    expect(textes["phrase.decider"]).toBe("Vous n'avez rien à décider ici.");
    // Le dernier creux, celui de vingt-sept coudées, s'est rempli à cette crue-là.
    const derniere = etat.couches.filter((c) => c.ou === 3).at(-1)!;
    expect(decider[0]!.a).toBe(derniere.crue * CRUE);
    expect(evenements).toContainEqual({ type: "trace", cle: "phrase.decider" });
    expect(evenements).toContainEqual({ type: "trace", cle: "bassin.plein" });
  });
});

describe("le graphe et les formules", () => {
  it("disent la crue, l'eau, la levée, le limon, les creux, le bassin, l'échelle et la rive", () => {
    const graphe = logique.graphe!(nouveau());
    expect(graphe.noeuds.map((n) => n.id).sort()).toEqual(
      ["bassin", "creux", "crue", "echelle", "levee", "limon", "passe", "retenue", "rive"].sort(),
    );
    for (const { cle } of graphe.noeuds) expect(textes[cle]).toBeTruthy();
  });

  it("s'écrivent en lettres, comme l'échelle : six formules, sans un chiffre", () => {
    const formules = logique.formules!();
    expect(formules).toHaveLength(6);
    for (const { expression } of formules) {
      expect(expression).toBeTruthy();
      expect(expression).not.toMatch(/\d/);
    }
  });
});

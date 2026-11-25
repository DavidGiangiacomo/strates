// Les objets d'en haut dans la dette (fiche, § 8) : ceux qui agissent ici, leur éveil à la première
// tablette brisée, les gages que la dette nomme, et la caisse prévue. Leurs raccourcis passent par
// l'opacité (comprehension.test.ts), leurs effets uniques viendront avec #118.
import { describe, expect, it } from "vitest";
import { CATALOGUE } from "../../../noyau/logique/catalogue";
import { effetsActifs, preselection } from "../../../noyau/logique/artefacts";
import type { ContexteTick, EvenementStrate } from "../../../noyau/logique/types";
import { caissesPrevues, logique, type Echeance, type EtatDette, type IdPromesse } from ".";
import {
  caissePrevueAffichee,
  CE_QUI_MONTE,
  CRUE,
  EXEMPLAIRES,
  GAGE_QUI_REVIENT,
  rapport,
  sortesDe,
} from "./regles";

/** Ce qu'emporte un jeu correct du réseau (21 points) et du chœur (14 points) : docs/artefacts.md, § 8. */
const JEU_CORRECT = [...preselection(21, 4), ...preselection(14, 5)];

/** Une trace d'éveil : un gage reconnu par le livre. */
const estEveil = (e: EvenementStrate): e is Extract<EvenementStrate, { type: "trace" }> =>
  e.type === "trace" && e.cle === "gage.eveil";

/** Un contexte où ces objets agissent, puissants ou utiles ; les autres n'agissent pas. */
function contexte(niveaux: Record<string, "puissant" | "utile"> = {}) {
  const evenements: EvenementStrate[] = [];
  const ctx: ContexteTick = {
    effets: { multiplicateur: () => 1, niveau: (id) => niveaux[id] ?? null },
    emettre: (e) => evenements.push(e),
  };
  return { ctx, evenements };
}

/** Le contexte d'un jeu correct, tel que le noyau le calcule : usure, familles et leviers. */
function jeuCorrect() {
  const evenements: EvenementStrate[] = [];
  const ctx: ContexteTick = {
    effets: effetsActifs(JEU_CORRECT, 6, logique.leviers),
    emettre: (e) => evenements.push(e),
  };
  return { ctx, evenements };
}

function nouveau(ctx: ContexteTick = contexte().ctx): EtatDette {
  return logique.etatInitial({ graine: 1, journal: { strates: [] }, effets: ctx.effets });
}

function echeance(numero: number, promesse: IdPromesse, crue: number | null, du: number): Echeance {
  return { numero, promesse, crue, du, origine: du, prix: du, reports: 0 };
}

/** La première tablette toute promise, sa dernière échéance due à la première crue. */
function avantLaPremiereBrisee(ctx: ContexteTick): EtatDette {
  const etat = nouveau(ctx);
  for (const id of sortesDe(1)) etat.promises[id] = EXEMPLAIRES;
  etat.tablette = 2;
  etat.echeances = [echeance(1, "etoffe", 1, 20)];
  return etat;
}

describe("les objets qui agissent dans la dette", () => {
  it("sont ceux du chœur et du réseau, puissants ou utiles, relus dès l'arrivée et à chaque tick", () => {
    const { ctx } = contexte({ "s5-echo": "puissant", "s4-jauge": "utile" });
    expect(nouveau(ctx).objets).toEqual(["s4-jauge", "s5-echo"]);
    const sans = nouveau();
    expect(sans.objets).toEqual([]);
    logique.tick(sans, 0.1, ctx);
    expect(sans.objets).toEqual(["s4-jauge", "s5-echo"]);
    // Rien ne change si rien ne change : la même liste.
    const objets = sans.objets;
    logique.tick(sans, 0.1, ctx);
    expect(sans.objets).toBe(objets);
  });

  it("sont les huit d'un jeu correct ; ceux de l'atelier et d'au-dessus n'agissent plus ici", () => {
    expect(JEU_CORRECT).toHaveLength(8);
    const etat = nouveau(jeuCorrect().ctx);
    expect(etat.objets).toEqual(JEU_CORRECT);
    const caillou = CATALOGUE.find((a) => a.origine === 3)!.id;
    const avecUnCaillou = effetsActifs([...JEU_CORRECT, caillou], 6, logique.leviers);
    expect(nouveau({ effets: avecUnCaillou, emettre: () => {} }).objets).toEqual(JEU_CORRECT);
  });
});

describe("l'éveil des gages, à la première tablette brisée (§ 8)", () => {
  it("écrit au livre chaque objet reconnu, un par ligne, et la dette nomme alors les gages", () => {
    const { ctx, evenements } = jeuCorrect();
    const etat = avantLaPremiereBrisee(ctx);
    expect(logique.nommes!(etat)).toEqual([]);
    logique.tick(etat, CRUE, ctx);
    expect(etat.brisees).toBe(1);
    const lignes = etat.livre.slice(-9);
    expect(lignes[0]).toEqual({ cle: "livre.brisee", valeurs: { tablette: 1 } });
    expect(lignes.slice(1)).toEqual(
      JEU_CORRECT.map((objet) => ({ cle: "livre.eveil", valeurs: {}, objet })),
    );
    expect(evenements.filter(estEveil).map((e) => e.objet)).toEqual(JEU_CORRECT);
    // Les gages, ce sont les objets du chœur : la dette les nomme ; le noyau ne garde que les siens.
    expect(logique.nommes!(etat)).toEqual(
      CATALOGUE.filter((a) => a.origine === 5).map((a) => a.id),
    );
  });

  it("fait agir les multiplicateurs d'un jeu correct : la confiance × 1,5, le report × 1,875", () => {
    const { ctx } = jeuCorrect();
    const etat = avantLaPremiereBrisee(ctx);
    logique.tick(etat, 1, ctx);
    expect(etat.multiplicateurs).toEqual({ confiance: 1, report: 1 });
    logique.tick(etat, CRUE, ctx);
    logique.tick(etat, 1, ctx);
    expect(etat.multiplicateurs.confiance).toBeCloseTo(1.5, 9);
    expect(etat.multiplicateurs.report).toBeCloseTo(1.875, 9);
  });

  it("n'écrit rien sans objet d'en haut", () => {
    const { ctx, evenements } = contexte();
    const etat = avantLaPremiereBrisee(ctx);
    logique.tick(etat, CRUE, ctx);
    expect(etat.livre.at(-1)!.cle).toBe("livre.brisee");
    expect(evenements.some((e) => e.type === "trace" && e.cle === "gage.eveil")).toBe(false);
  });
});

describe("la caisse prévue (§ 8)", () => {
  it("donne la caisse à chaque échéance, juste avant qu'elle ne tombe, au rapport présent", () => {
    const etat = nouveau();
    const prevues = caissesPrevues(etat);
    // 30 en caisse, 6 par crue : 36 à la première crue, puis 36 − 12 + 6 à la deuxième.
    expect(prevues.get(1)).toBeCloseTo(36, 9);
    expect(prevues.get(2)).toBeCloseTo(30, 9);
    expect(prevues.has(null)).toBe(false);
  });

  it("rejoue le livre : une échéance que la caisse ne couvre pas, reportée, pèse sur les suivantes", () => {
    const etat = nouveau();
    etat.caisse = 0;
    etat.honore = 1_000;
    etat.echeances = [echeance(1, "orge", 1, 100), echeance(2, "orge", 3, 10)];
    const avant = structuredClone(etat);
    const prevues = caissesPrevues(etat);
    expect(prevues.get(1)).toBeCloseTo(6, 9);
    // À la troisième crue, la première, reportée, passe avant la seconde, et vide la caisse.
    expect(prevues.get(2)).toBe(0);
    // L'état n'est pas touché.
    expect(etat).toEqual(avant);
  });

  it("prévoit la grande crue, une fois fixée, et rien après l'issue", () => {
    const etat = nouveau();
    etat.echeances = [echeance(1, "crueQuiVient", 12, 1e18)];
    etat.grandeCrue = 12;
    etat.caisse = 1_000;
    expect(caissesPrevues(etat).get(null)).toBeCloseTo(1_000 + 12 * rapport(etat), 9);
    etat.issue = "defaut";
    expect(caissesPrevues(etat).size).toBe(0);
  });

  it("s'écrit à chaque échéance avec le gage qui revient, à la prochaine avec ce qui monte, après l'éveil", () => {
    const etat = nouveau();
    etat.objets = [CE_QUI_MONTE, GAGE_QUI_REVIENT];
    expect(caissePrevueAffichee(etat)).toBeNull();
    etat.brisees = 1;
    expect(caissePrevueAffichee(etat)).toBe("toutes");
    etat.objets = [CE_QUI_MONTE];
    expect(caissePrevueAffichee(etat)).toBe("prochaine");
    etat.objets = [];
    expect(caissePrevueAffichee(etat)).toBeNull();
  });
});

describe("l'état", () => {
  it("passe en version 2 : la liste des objets, vide, que le premier tick relit", () => {
    expect(logique.versionEtat).toBeGreaterThanOrEqual(2);
    const v1: Partial<EtatDette> = nouveau();
    delete v1.objets;
    expect(logique.migrations[1]!(v1)).toEqual({ ...v1, objets: [] });
  });
});

// La boucle de l'atelier (fiche, § 3) : les gestes, la production et les gênes qui se montrent au bout
// d'un tour.
import { describe, expect, it } from "vitest";
import type { ContexteTick, EvenementStrate } from "../../../noyau/logique/types";
import { logique, type ActionAtelier } from ".";
import { textes } from "../textes.fr";
import { etatInitial, type EtatAtelier, type PieceAtelier } from "./etat";
import { remplir } from "./notation";
import { analyser, TOUR, type IdPiece } from "./regles";

function contexte(
  evenements: EvenementStrate[] = [],
  multiplicateurs: Record<string, number> = {},
) {
  const ctx: ContexteTick = {
    effets: { multiplicateur: (levier) => multiplicateurs[levier] ?? 1, niveau: () => null },
    emettre: (e) => evenements.push(e),
  };
  return ctx;
}

const CTX = contexte();

function agir(etat: EtatAtelier, action: ActionAtelier, ctx = CTX): void {
  logique.agir(etat, action, ctx);
}

/** Fait passer `secondes`, par pas de `pas` comme le noyau (0,1 s par tick). */
function jouer(etat: EtatAtelier, secondes: number, pas = 0.1, ctx = CTX): void {
  const n = Math.round(secondes / pas);
  for (let i = 0; i < n; i++) logique.tick(etat, pas, ctx);
}

/** Une pièce, sans passer par l'achat : sur l'établi, puis posée par le geste, s'il y a une case. */
function ajouter(
  etat: EtatAtelier,
  id: IdPiece,
  c: [number, number] | null,
  rot: PieceAtelier["rot"] = 0,
): number {
  const repere = etat.pieces.length + 1;
  etat.pieces.push({ id, repere, case: null, rot: 0, limees: [] });
  if (c) agir(etat, { type: "poser", repere, case: c, rot });
  return repere;
}

const piece = (etat: EtatAtelier, repere: number) => etat.pieces.find((p) => p.repere === repere)!;
const production = (etat: EtatAtelier) => analyser(etat).production;
const lignes = (etat: EtatAtelier) =>
  etat.legende.map((l) => `${l.cle} ${JSON.stringify(l.valeurs)}`);
const derniere = (etat: EtatAtelier) => etat.legende.at(-1)!;

describe("l'arrivée dans l'atelier", () => {
  it("se fait sur un plan de 6 × 6, avec deux roues qui tournent et un stock vide", () => {
    const etat = logique.etatInitial({ graine: 1, journal: { strates: [] } });
    expect(etat.taille).toBe(6);
    expect(etat.pieces.map((p) => [p.repere, p.id, p.case])).toEqual([
      [1, "roue", [1, 2]],
      [2, "roue", [1, 3]],
    ]);
    expect(etat).toMatchObject({ stock: 0, cumul: 0, temps: 0, genes: {}, sansPlan: false });
    expect(etat.legende).toEqual([{ cle: "legende.arrivee", valeurs: { taille: 6, cases: 30 } }]);
    expect(logique.valeurConvertible(etat)).toBe(0);
    expect(logique.seuil(etat).atteint).toBe(false);
  });

  it("déclare ses leviers, un tour pour pas, et la politique hors-ligne standard", () => {
    expect(logique.leviers).toEqual({ principal: "ressort", secondaires: ["plan"] });
    expect(logique.pasMax).toBe(TOUR);
    expect(logique.horsLigne.type).toBe("standard");
  });

  it("lit les multiplicateurs des objets d'en haut dès l'arrivée", () => {
    const etat = logique.etatInitial({
      graine: 1,
      journal: { strates: [] },
      effets: contexte([], { ressort: 1.375, plan: 1.25 }).effets,
    });
    expect(etat.multiplicateurs).toEqual({ ressort: 1.375, plan: 1.25 });
    expect(production(etat)).toBe(56 * 1.375);
  });
});

describe("la production", () => {
  it("ajoute au stock et au cumul la production du rouage : 56 pièces par tour à l'arrivée", () => {
    const etat = etatInitial();
    jouer(etat, TOUR);
    expect(etat.stock).toBeCloseTo(56, 9);
    expect(etat.cumul).toBeCloseTo(56, 9);
    expect(etat.temps).toBeCloseTo(TOUR, 9);
  });

  it("ne diminue pas le cumul quand on dépense : c'est la valeur convertible", () => {
    const etat = etatInitial();
    jouer(etat, 2 * TOUR);
    agir(etat, { type: "acheter", piece: "roue" });
    expect(etat.stock).toBeCloseTo(112 - 88, 9);
    expect(logique.valeurConvertible(etat)).toBeCloseTo(112, 9);
  });

  it("ne dépend pas du pas : un tour d'un coup, ou en cent vingt ticks", () => {
    const a = etatInitial();
    const b = etatInitial();
    jouer(a, 5 * TOUR);
    for (let i = 0; i < 5; i++) logique.tick(b, TOUR, CTX);
    expect(b.stock).toBeCloseTo(a.stock, 6);
  });

  it("relit le levier du ressort à chaque tick", () => {
    const etat = etatInitial();
    jouer(etat, TOUR, 0.1, contexte([], { ressort: 2 }));
    expect(etat.stock).toBeCloseTo(112, 9);
  });
});

describe("acheter", () => {
  it("met la pièce sur l'établi, au prix de la nomenclature, et le suivant coûte 25 % de plus", () => {
    const etat = etatInitial();
    etat.stock = 200;
    agir(etat, { type: "acheter", piece: "roue" });
    expect(etat.stock).toBe(112);
    expect(etat.achetees.roue).toBe(1);
    expect(piece(etat, 3)).toEqual({ id: "roue", repere: 3, case: null, rot: 0, limees: [] });
    agir(etat, { type: "acheter", piece: "roue" });
    expect(etat.stock).toBe(2);
    expect(etat.pieces).toHaveLength(4);
  });

  it("est ignoré sans assez de pièces, pour une pièce inconnue, ou quand les exemplaires manquent", () => {
    const etat = etatInitial();
    etat.stock = 87;
    agir(etat, { type: "acheter", piece: "roue" });
    agir(etat, { type: "acheter", piece: "inconnue" as IdPiece });
    expect(etat.pieces).toHaveLength(2);
    etat.stock = 1e12;
    for (let i = 0; i < 12; i++) agir(etat, { type: "acheter", piece: "roue" });
    expect(etat.pieces.filter((p) => p.id === "roue")).toHaveLength(12);
    expect(etat.achetees.roue).toBe(10);
  });

  it("ne change rien au plan, et n'écrit rien à la légende", () => {
    const etat = etatInitial();
    etat.stock = 100;
    agir(etat, { type: "acheter", piece: "roue" });
    expect(production(etat)).toBe(56);
    expect(etat.legende).toHaveLength(1);
  });
});

describe("poser, tourner, déplacer, échanger, mettre de côté", () => {
  it("pose une pièce de l'établi sur une case libre, dans l'orientation choisie", () => {
    const etat = etatInitial();
    const r = ajouter(etat, "cliquet", null);
    agir(etat, { type: "poser", repere: r, case: [4, 2], rot: 0 });
    expect(piece(etat, r)).toMatchObject({ case: [4, 2], rot: 0 });
    expect(production(etat)).toBe(56 + 74);
    expect(derniere(etat)).toEqual({ cle: "legende.ajustee", valeurs: { piece: r } });
  });

  it("note une pièce posée qui ne tourne pas", () => {
    const etat = etatInitial();
    const r = ajouter(etat, "roue", null);
    agir(etat, { type: "poser", repere: r, case: [5, 0], rot: 0 });
    expect(derniere(etat)).toEqual({ cle: "legende.immobile", valeurs: { piece: r } });
  });

  it("ignore une pose impossible : sur le ressort, sur une pièce, hors du plan, ou mal tournée", () => {
    const etat = etatInitial();
    const r = ajouter(etat, "roue", null);
    const g = ajouter(etat, "grandeRoue", null);
    for (const action of [
      { type: "poser", repere: r, case: [2, 2], rot: 0 },
      { type: "poser", repere: r, case: [1, 2], rot: 0 },
      { type: "poser", repere: r, case: [6, 0], rot: 0 },
      { type: "poser", repere: r, case: [0, 0], rot: 4 },
      { type: "poser", repere: r, case: [0.5, 0], rot: 0 },
      { type: "poser", repere: g, case: [5, 4], rot: 0 },
      { type: "poser", repere: 1, case: [0, 0], rot: 0 },
      { type: "poser", repere: 99, case: [0, 0], rot: 0 },
    ] as ActionAtelier[]) {
      agir(etat, action);
    }
    expect(piece(etat, r).case).toBeNull();
    expect(piece(etat, g).case).toBeNull();
    expect(piece(etat, 1).case).toEqual([1, 2]);
    expect(etat.legende).toHaveLength(1);
    // Une grande pièce sur un carré de quatre cases libres.
    agir(etat, { type: "poser", repere: g, case: [4, 0], rot: 0 });
    expect(piece(etat, g).case).toEqual([4, 0]);
  });

  it("tourne une pièce d'un quart de tour, posée ou sur l'établi", () => {
    const etat = etatInitial();
    const r = ajouter(etat, "cliquet", [4, 2]);
    const e = ajouter(etat, "cliquet", null);
    agir(etat, { type: "tourner", repere: e });
    expect(piece(etat, e).rot).toBe(1);
    expect(production(etat)).toBe(56 + 74);
    agir(etat, { type: "tourner", repere: r });
    expect(piece(etat, r).rot).toBe(1);
    expect(production(etat)).toBe(56);
    expect(derniere(etat)).toEqual({ cle: "legende.immobile", valeurs: { piece: r } });
    for (let i = 0; i < 3; i++) agir(etat, { type: "tourner", repere: r });
    expect(piece(etat, r).rot).toBe(0);
    expect(derniere(etat)).toEqual({ cle: "legende.ajustee", valeurs: { piece: r } });
  });

  it("déplace une pièce vers une case libre, et une grande pièce d'une case, sur elle-même", () => {
    const etat = etatInitial();
    const r = ajouter(etat, "roue", [5, 0]);
    agir(etat, { type: "deplacer", repere: r, case: [2, 1] });
    expect(piece(etat, r).case).toEqual([2, 1]);
    expect(production(etat)).toBe(56 + 14);
    agir(etat, { type: "deplacer", repere: r, case: [1, 2] });
    expect(piece(etat, r).case).toEqual([2, 1]);
    const g = ajouter(etat, "grandeRoue", [4, 0]);
    agir(etat, { type: "deplacer", repere: g, case: [4, 1] });
    expect(piece(etat, g).case).toEqual([4, 1]);
    // Une pièce de l'établi se pose, elle ne se déplace pas.
    const e = ajouter(etat, "roue", null);
    agir(etat, { type: "deplacer", repere: e, case: [0, 0] });
    expect(piece(etat, e).case).toBeNull();
  });

  it("échange deux pièces de même taille, et une pièce posée avec une de l'établi", () => {
    const etat = etatInitial();
    const c = ajouter(etat, "cliquet", [5, 5]);
    agir(etat, { type: "echanger", a: 1, b: c });
    expect(piece(etat, 1).case).toEqual([5, 5]);
    expect(piece(etat, c).case).toEqual([1, 2]);
    const e = ajouter(etat, "pignon", null);
    agir(etat, { type: "echanger", a: e, b: c });
    expect(piece(etat, e).case).toEqual([1, 2]);
    expect(piece(etat, c).case).toBeNull();
    // Pas avec une grande pièce, ni deux pièces de l'établi.
    const g = ajouter(etat, "grandeRoue", null);
    agir(etat, { type: "echanger", a: g, b: e });
    agir(etat, { type: "echanger", a: g, b: c });
    expect(piece(etat, g).case).toBeNull();
    expect(piece(etat, e).case).toEqual([1, 2]);
  });

  it("met une pièce de côté : elle reste à soi, et ce qu'elle entraînait s'arrête", () => {
    const etat = etatInitial();
    const r = ajouter(etat, "roue", [0, 2]);
    const avant = etat.legende.length;
    agir(etat, { type: "mettreDeCote", repere: 1 });
    expect(piece(etat, 1).case).toBeNull();
    expect(etat.pieces).toHaveLength(3);
    // La roue du dessus ne tenait au ressort que par la première ; la seconde y engrène encore.
    expect(lignes(etat).slice(avant)).toEqual([`legende.immobile {"piece":${r}}`]);
    expect(production(etat)).toBe(14);
  });
});

describe("limer", () => {
  it("rend lisse, pour toujours, le côté denté désigné tel qu'il se montre", () => {
    const etat = etatInitial();
    const r = ajouter(etat, "renvoi", [4, 2], 1);
    // Tourné d'un quart de tour, le renvoi montre ses dents à droite et en bas.
    agir(etat, { type: "limer", repere: r, cote: 2 });
    expect(piece(etat, r).limees).toEqual([1]);
    expect(lignes(etat).at(-1)).toBe(`legende.limee {"piece":${r}}`);
    // Un côté lisse, ou déjà limé, ne se lime pas.
    agir(etat, { type: "limer", repere: r, cote: 0 });
    agir(etat, { type: "limer", repere: r, cote: 2 });
    agir(etat, { type: "limer", repere: r, cote: 5 });
    expect(piece(etat, r).limees).toEqual([1]);
  });

  it("défait un frottement, mais coupe le mouvement si la dent engrenait", () => {
    const etat = etatInitial();
    const r = ajouter(etat, "roue", [2, 1]);
    const v = ajouter(etat, "roue", [2, 0]);
    expect(Object.keys(etat.genes)).toEqual([`${v}:3.0:C`]);
    agir(etat, { type: "limer", repere: v, cote: 3 });
    expect(etat.genes).toEqual({});
    agir(etat, { type: "limer", repere: r, cote: 1 });
    expect(analyser(etat).pieces.get(r)!.entrainee).toBe(false);
    expect(analyser(etat).pieces.get(v)!.entrainee).toBe(false);
  });
});

describe("agrandir", () => {
  it("ajoute une couronne de cases libres autour : les pièces ne touchent plus le cadre", () => {
    const etat = etatInitial();
    const r = ajouter(etat, "roue", [0, 2]);
    expect(Object.keys(etat.genes)).toEqual([`${r}:0.0:C`]);
    expect(production(etat)).toBe(56 + 28 + 7);
    etat.stock = 70_000;
    agir(etat, { type: "agrandir" });
    expect(etat).toMatchObject({ taille: 8, stock: 0 });
    expect(etat.pieces.map((p) => p.case)).toEqual([
      [2, 3],
      [2, 4],
      [1, 3],
    ]);
    expect(etat.genes).toEqual({});
    expect(production(etat)).toBe(56 + 28 + 14);
    expect(derniere(etat)).toEqual({ cle: "legende.agrandi", valeurs: { taille: 8, cases: 57 } });
  });

  it("coûte ce que dit la nomenclature, divisé par le levier du plan", () => {
    const etat = etatInitial();
    etat.stock = 60_000;
    agir(etat, { type: "agrandir" });
    expect(etat.taille).toBe(6);
    agir(etat, { type: "agrandir" }, contexte([], { plan: 1.25 }));
    expect(etat).toMatchObject({ taille: 8, stock: 4_000 });
  });

  it("trouve au dernier agrandissement une pièce sans plan, sur l'établi, puis s'arrête à 12 × 12", () => {
    const etat = etatInitial();
    etat.stock = 1e12;
    agir(etat, { type: "agrandir" });
    agir(etat, { type: "agrandir" });
    expect(etat.sansPlan).toBe(false);
    agir(etat, { type: "agrandir" });
    expect(etat.taille).toBe(12);
    expect(etat.sansPlan).toBe(true);
    expect(derniere(etat)).toEqual({ cle: "legende.sans-plan", valeurs: {} });
    expect(etat.pieces.map((p) => p.case)).toEqual([
      [4, 5],
      [4, 6],
    ]);
    const stock = etat.stock;
    agir(etat, { type: "agrandir" });
    expect(etat.stock).toBe(stock);
  });
});

describe("les gênes", () => {
  /** Un cliquet au-dessus de la première roue : il gêne sa voisine, et frotte contre le cadre. */
  function avecGene(evenements: EvenementStrate[] = []) {
    const etat = etatInitial();
    const r = ajouter(etat, "cliquet", null);
    agir(etat, { type: "poser", repere: r, case: [0, 2], rot: 0 }, contexte(evenements));
    return { etat, r };
  }

  it("datent un frottement au geste qui le crée", () => {
    const etat = etatInitial();
    jouer(etat, 5);
    const r = ajouter(etat, "cliquet", null);
    agir(etat, { type: "poser", repere: r, case: [0, 2], rot: 0 });
    expect(Object.keys(etat.genes).sort()).toEqual(["1:0.0:3", "3:0.0:C"]);
    expect(Object.values(etat.genes).every((t) => Math.abs(t - 5) < 1e-9)).toBe(true);
  });

  it("se montrent au bout d'un tour, une fois chacune, et la légende les écrit", () => {
    const evenements: EvenementStrate[] = [];
    const { etat, r } = avecGene(evenements);
    const ctx = contexte(evenements);
    jouer(etat, TOUR - 0.5, 0.1, ctx);
    expect(etat.legende.map((l) => l.cle)).not.toContain("legende.gene.piece");
    jouer(etat, 0.5, 0.1, ctx);
    expect(lignes(etat).slice(-2).sort()).toEqual([
      `legende.gene.cadre {"piece":${r}}`,
      `legende.gene.piece {"piece":1}`,
    ]);
    jouer(etat, 3 * TOUR, 0.1, ctx);
    expect(etat.legende.filter((l) => l.cle.startsWith("legende.gene"))).toHaveLength(2);
    expect(evenements).toContainEqual({
      type: "trace",
      cle: "legende.gene.piece",
      valeurs: { piece: 1 },
    });
  });

  it("coupent le pas au moment où elles se montrent", () => {
    const { etat } = avecGene();
    logique.tick(etat, 5, CTX);
    const temps: number[] = [];
    const ctx: ContexteTick = { ...CTX, emettre: () => temps.push(etat.temps) };
    logique.tick(etat, TOUR, ctx);
    expect(temps).toEqual([TOUR, TOUR]);
    expect(etat.temps).toBe(5 + TOUR);
  });

  it("se montrent au retour d'une absence, si elles ne l'étaient pas encore", () => {
    const { etat } = avecGene();
    for (let i = 0; i < 100; i++) logique.tick(etat, TOUR, CTX);
    expect(etat.legende.filter((l) => l.cle.startsWith("legende.gene"))).toHaveLength(2);
  });

  it("s'oublient quand on les défait avant qu'elles se montrent, et ne s'écrivent jamais", () => {
    const { etat, r } = avecGene();
    jouer(etat, 6);
    agir(etat, { type: "mettreDeCote", repere: r });
    expect(etat.genes).toEqual({});
    jouer(etat, 2 * TOUR);
    expect(etat.legende.map((l) => l.cle)).not.toContain("legende.gene.piece");
  });

  it("gardent leur heure tant que les deux mêmes côtés se touchent, et en reprennent une ensuite", () => {
    const { etat, r } = avecGene();
    jouer(etat, 6);
    const heures = () => Object.values(etat.genes).map((t) => Math.round(t));
    // Un geste ailleurs : les frottements durent.
    agir(etat, { type: "tourner", repere: 2 });
    expect(heures()).toEqual([0, 0]);
    // Le cliquet tourne d'un demi-tour : sa dent engrène avec la roue, son dos est contre le cadre.
    agir(etat, { type: "tourner", repere: r });
    agir(etat, { type: "tourner", repere: r });
    expect(etat.genes).toEqual({});
    // Il revient : les frottements reprennent, à l'heure du geste.
    agir(etat, { type: "tourner", repere: r });
    agir(etat, { type: "tourner", repere: r });
    expect(heures()).toEqual([6, 6]);
  });

  it("repartent pour un tour quand on déplace la pièce, même si elle frotte comme avant", () => {
    // Une roue au-dessus de la première : sa dent du haut frotte contre le cadre. Au bout de 10 s, elle
    // glisse au-dessus de la seconde, et sa dent du haut frotte toujours contre le cadre.
    const etat = etatInitial();
    const r = ajouter(etat, "roue", [0, 2]);
    jouer(etat, 10);
    agir(etat, { type: "deplacer", repere: r, case: [0, 3] });
    expect(Object.keys(etat.genes)).toEqual([`${r}:0.0:C`]);
    expect(etat.genes[`${r}:0.0:C`]).toBeCloseTo(10);
    jouer(etat, TOUR - 0.5);
    expect(etat.legende.map((l) => l.cle)).not.toContain("legende.gene.cadre");
    jouer(etat, 0.5);
    expect(derniere(etat)).toEqual({ cle: "legende.gene.cadre", valeurs: { piece: r } });
  });

  it("repartent aussi quand on déplace la pièce frottée, et durent ailleurs", () => {
    // Un cliquet, la dent en bas, frotte le dos lisse d'un balancier retourné, et son côté droit lisse
    // frotte le ressort. Le balancier glisse d'une case vers la droite : le cliquet frotte toujours son
    // dos, et lui frotte toujours le cadre, de sa dent.
    const etat = etatInitial();
    const c = ajouter(etat, "cliquet", [3, 1], 2);
    const b = ajouter(etat, "balancier", [4, 0], 2);
    jouer(etat, 6);
    agir(etat, { type: "deplacer", repere: b, case: [4, 1] });
    const heures = Object.fromEntries(
      Object.entries(etat.genes).map(([cle, t]) => [cle, Math.round(t)]),
    );
    expect(heures).toEqual({
      [`${c}:1.0:R`]: 0,
      [`${c}:2.0:${b}`]: 6,
      [`${b}:2.0:C`]: 6,
      [`${b}:2.1:C`]: 6,
      [`${b}:0.1:R`]: 6,
    });
  });
});

describe("le déterminisme", () => {
  it("redonne la même partie pour les mêmes gestes", () => {
    const partie = () => {
      const etat = etatInitial();
      jouer(etat, 30);
      agir(etat, { type: "acheter", piece: "roue" });
      agir(etat, { type: "poser", repere: 3, case: [0, 2], rot: 0 });
      jouer(etat, 30);
      agir(etat, { type: "acheter", piece: "roue" });
      agir(etat, { type: "poser", repere: 4, case: [2, 1], rot: 0 });
      jouer(etat, 60);
      return etat;
    };
    expect(partie()).toEqual(partie());
  });
});

describe("le rappel de reprise", () => {
  const rappel = (etat: EtatAtelier) => logique.rappel!(etat);
  const ecrit = (cle: string, valeurs: Record<string, number> = {}) =>
    remplir(textes[cle]!, valeurs);

  it("donne la dernière ligne de la légende, qui dit déjà les cases à l'arrivée", () => {
    const etat = logique.etatInitial({ graine: 1, journal: { strates: [] } });
    expect(rappel(etat)).toEqual([ecrit("legende.arrivee", { taille: 6, cases: 30 })]);
    expect(rappel(etat)[0]).toContain(ecrit("cases.valeur", { cases: 30 }));
  });

  it("puis les cases qui restent, comme l'en-tête les écrit", () => {
    const etat = etatInitial();
    const r = ajouter(etat, "roue", [1, 4]);
    expect(rappel(etat)).toEqual([
      ecrit("legende.ajustee", { piece: r }),
      ecrit("cases.valeur", { cases: analyser(etat).casesLibres }),
    ]);
  });
});

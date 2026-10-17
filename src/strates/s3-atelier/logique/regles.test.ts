// Les règles de l'atelier (fiche, § 3) : la nomenclature, les prix, les contacts, l'entraînement et la
// production.
import { describe, expect, it } from "vitest";
import { etatInitial, type EtatAtelier, type PieceAtelier } from "./etat";
import {
  AGRANDISSEMENTS,
  analyser,
  casesLibres,
  CROISSANCE_PRIX,
  defPiece,
  PIECES,
  pieceVisible,
  placeLibre,
  prixPiece,
  prochainAgrandissement,
  productionPiece,
  restantes,
  type IdPiece,
  type TaillePlan,
} from "./regles";

type Pose = [IdPiece, [number, number] | null, PieceAtelier["rot"]?];

/** Un plan de `taille` cases de côté, avec ces pièces seulement, numérotées dans l'ordre. */
function plan(taille: TaillePlan, ...poses: Pose[]): EtatAtelier {
  const etat = etatInitial();
  etat.taille = taille;
  etat.pieces = poses.map(([id, c, rot = 0], i) => ({
    id,
    repere: i + 1,
    case: c,
    rot,
    limees: [],
  }));
  return etat;
}

const info = (etat: EtatAtelier, repere: number) => analyser(etat).pieces.get(repere)!;
const cles = (etat: EtatAtelier) =>
  analyser(etat)
    .frottements.map((f) => f.cle)
    .sort();
const def = (id: IdPiece) => defPiece(id)!;

describe("la nomenclature", () => {
  it("compte douze pièces et 125 exemplaires, qui remplissent exactement le plan de 12 × 12", () => {
    expect(PIECES).toHaveLength(12);
    expect(PIECES.reduce((n, p) => n + p.exemplaires, 0)).toBe(125);
    const cases = PIECES.reduce((n, p) => n + p.exemplaires * p.largeur ** 2, 0);
    expect(cases).toBe(140);
    expect(casesLibres(plan(12))).toBe(140);
  });

  it("donne aux deux séries les mêmes cinq profils, dans le même ordre, la seconde valant bien plus", () => {
    const profil = (i: number) => [...PIECES[i]!.dents].sort().join("");
    for (let i = 0; i < 5; i++) {
      expect(profil(i + 5), PIECES[i + 5]!.id).toBe(profil(i));
      expect(PIECES[i + 5]!.base).toBeGreaterThan(100 * PIECES[i]!.base);
    }
    // Les dents du renvoi sont en équerre, celles du pignon opposées.
    expect(profil(2)).toBe("01");
    expect(profil(3)).toBe("02");
  });

  it("coûte environ 2,5 × 10¹¹ pièces en tout, agrandissements compris", () => {
    const etat = etatInitial();
    let total = AGRANDISSEMENTS.reduce((n, a) => n + a.prix, 0);
    for (const d of PIECES) {
      for (let n = restantes(etat, d); n > 0; n--) {
        total += prixPiece(etat, d);
        etat.achetees[d.id] += 1;
      }
    }
    expect(total).toBeGreaterThan(2.4e11);
    expect(total).toBeLessThan(2.6e11);
  });
});

describe("les prix", () => {
  it("valent premier prix × 1,25ⁿ, n étant les exemplaires déjà achetés", () => {
    const etat = etatInitial();
    const roue = def("roue");
    expect(prixPiece(etat, roue)).toBe(88);
    etat.achetees.roue = 1;
    expect(prixPiece(etat, roue)).toBe(110);
    etat.achetees.roue = 5;
    expect(prixPiece(etat, roue)).toBe(Math.round(88 * CROISSANCE_PRIX ** 5));
  });

  it("comptent les roues de l'arrivée dans les exemplaires, pas dans le prix", () => {
    const etat = etatInitial();
    expect(restantes(etat, def("roue"))).toBe(10);
    expect(restantes(etat, def("balancier"))).toBe(2);
  });

  it("font paraître une pièce quand le cumul atteint la moitié de son premier prix", () => {
    const etat = etatInitial();
    expect(pieceVisible(etat, def("roue"))).toBe(true);
    expect(pieceVisible(etat, def("cliquet"))).toBe(false);
    etat.cumul = 875;
    expect(pieceVisible(etat, def("cliquet"))).toBe(true);
  });

  it("divisent les agrandissements par le levier du plan", () => {
    const etat = etatInitial();
    expect(prochainAgrandissement(etat)).toEqual({ taille: 8, prix: 70_000 });
    etat.multiplicateurs.plan = 1.25;
    expect(prochainAgrandissement(etat)).toEqual({ taille: 8, prix: 56_000 });
    etat.taille = 12;
    expect(prochainAgrandissement(etat)).toBeUndefined();
  });
});

describe("le plan", () => {
  it("laisse au ressort les quatre cases du centre, à toutes les tailles", () => {
    expect([6, 8, 10, 12].map((n) => casesLibres(plan(n as TaillePlan)))).toEqual([
      32, 60, 96, 140,
    ]);
    const etat = plan(6);
    expect(placeLibre(etat, 1, [2, 2])).toBe(false);
    expect(placeLibre(etat, 1, [1, 2])).toBe(true);
    expect(placeLibre(etat, 2, [0, 0])).toBe(true);
    expect(placeLibre(etat, 2, [1, 1])).toBe(false);
    expect(placeLibre(etat, 2, [5, 0])).toBe(false);
    expect(placeLibre(etat, 1, [-1, 0])).toBe(false);
  });

  it("arrive avec deux roues qui tournent et produisent 56 pièces par tour", () => {
    const a = analyser(etatInitial());
    expect(a.production).toBe(56);
    expect(a.frottements).toEqual([]);
    expect(a.casesLibres).toBe(30);
    expect(info(etatInitial(), 1)).toMatchObject({ entrainee: true, engrenes: 2, frottements: 0 });
  });
});

describe("les contacts", () => {
  it("dent contre dent : elles engrènent, et la production de chacune double", () => {
    // Une roue à gauche du ressort : sa dent de droite engrène avec lui.
    const etat = plan(6, ["roue", [2, 1]]);
    expect(info(etat, 1)).toMatchObject({ entrainee: true, engrenes: 1, auRessort: true });
    expect(analyser(etat).production).toBe(14);
  });

  it("dent contre lisse : elles frottent, et la production de chacune est divisée par deux", () => {
    // Un cliquet au-dessus de la première roue : son côté lisse contre la dent du haut de la roue, sa
    // dent contre le cadre.
    const etat = plan(6, ["roue", [1, 2]], ["roue", [1, 3]], ["cliquet", [0, 2]]);
    expect(info(etat, 1)).toMatchObject({ entrainee: true, engrenes: 2, frottements: 1 });
    expect(info(etat, 3)).toMatchObject({ entrainee: false, frottements: 2, production: 0 });
    expect(analyser(etat).production).toBe(14 + 28);
    expect(cles(etat)).toEqual(["1:0.0:3", "3:0.0:C"]);
    expect(analyser(etat).frottements).toContainEqual({
      cle: "1:0.0:3",
      piece: 1,
      contre: "piece",
    });
  });

  it("dent contre le cadre : elle frotte ; un côté lisse contre une dent du ressort aussi", () => {
    // Un cliquet sous le ressort, tourné d'un demi-tour : son dos lisse contre le ressort. Un autre
    // dans le coin, la dent vers le cadre.
    const etat = plan(6, ["cliquet", [4, 2], 2], ["cliquet", [5, 0], 2]);
    expect(info(etat, 1)).toMatchObject({ entrainee: false, frottements: 1 });
    expect(analyser(etat).frottements).toEqual([
      { cle: "1:0.0:R", piece: 1, contre: "ressort" },
      { cle: "2:2.0:C", piece: 2, contre: "cadre" },
    ]);
    // Retourné, sa dent engrène avec le ressort.
    etat.pieces[0]!.rot = 0;
    expect(info(etat, 1)).toMatchObject({ entrainee: true, engrenes: 1, frottements: 0 });
    expect(analyser(etat).production).toBe(74);
  });

  it("lisse contre lisse, ou contre une case libre : rien", () => {
    // Deux cliquets côte à côte : leurs côtés lisses se touchent, leurs dents regardent des cases libres.
    const etat = plan(6, ["cliquet", [4, 0]], ["cliquet", [4, 1]]);
    expect(analyser(etat).frottements).toEqual([]);
    expect(info(etat, 1).cotes[1]).toEqual([{ contact: "rien" }]);
  });

  it("une pièce qui frotte tourne encore : le frottement ne coupe pas le mouvement", () => {
    // Une roue contre le cadre, entraînée par sa voisine, qui engrène avec le ressort.
    const etat = plan(6, ["roue", [2, 1]], ["roue", [2, 0]]);
    expect(info(etat, 2)).toMatchObject({ entrainee: true, engrenes: 1, frottements: 1 });
    expect(info(etat, 2).production).toBe(7);
    expect(info(etat, 1).production).toBe(28);
  });

  it("une pièce qui n'est pas reliée au ressort ne produit rien, quelle que soit sa place", () => {
    // Deux roues engrenées entre elles, loin du ressort.
    const etat = plan(8, ["roue", [0, 3]], ["roue", [0, 4]]);
    expect(info(etat, 1)).toMatchObject({ entrainee: false, engrenes: 1, production: 0 });
    expect(analyser(etat).production).toBe(0);
  });

  it("entraîne de dent en dent, le long d'une chaîne, et s'arrête où la chaîne se rompt", () => {
    const etat = plan(
      8,
      ["roue", [3, 2]],
      ["roue", [3, 1]],
      ["pignon", [3, 0], 1],
      ["roue", [2, 0]],
    );
    // Le pignon tourné d'un quart de tour a ses dents à droite et à gauche : il tourne, mais ne passe
    // pas le mouvement à la roue posée au-dessus de lui, contre son côté lisse.
    expect([1, 2, 3, 4].map((r) => info(etat, r).entrainee)).toEqual([true, true, true, false]);
    expect(info(etat, 4).frottements).toBe(2);
  });

  it("compte les demi-côtés d'une grande pièce, et divise l'exposant par deux", () => {
    // Une grande roue au-dessus du ressort : ses deux demi-côtés du bas engrènent avec lui.
    const etat = plan(8, ["grandeRoue", [1, 3]]);
    expect(info(etat, 1)).toMatchObject({ entrainee: true, engrenes: 2, frottements: 0 });
    expect(info(etat, 1).production).toBe(2 * 290_000_000);
    // Un cliquet contre son demi-côté gauche du haut, tourné de trois quarts : sa dent à gauche, contre
    // une case libre ; son côté droit, lisse, contre une dent de la grande roue. Le frottement porte le
    // nom de la grande roue, et de son demi-côté.
    etat.pieces.push({ id: "cliquet", repere: 2, case: [1, 2], rot: 3, limees: [] });
    expect(info(etat, 1)).toMatchObject({ engrenes: 2, frottements: 1 });
    expect(info(etat, 2)).toMatchObject({ entrainee: false, frottements: 1 });
    expect(cles(etat)).toEqual(["1:3.0:2"]);
    expect(info(etat, 1).production).toBeCloseTo(290_000_000 * 2 ** 0.5, 3);
  });

  it("donne seize fois sa base à une pièce engrenée partout, petite ou grande", () => {
    expect(productionPiece(def("roue"), 4, 0)).toBe(16 * 7);
    expect(productionPiece(def("grandeRoue"), 8, 0)).toBe(16 * 290_000_000);
    expect(productionPiece(def("roue"), 0, 4)).toBe(7 / 16);
    expect(productionPiece(def("cliquet"), 1, 0, 1.25)).toBe(2 * 37 * 1.25);
  });

  it("ne renforce, par le levier du ressort, que les pièces qui engrènent directement avec lui", () => {
    const etat = plan(6, ["roue", [1, 2]], ["roue", [1, 3]], ["roue", [0, 2]]);
    const sans = analyser(etat);
    etat.multiplicateurs.ressort = 2;
    const avec = analyser(etat);
    expect(avec.pieces.get(1)!.production).toBe(2 * sans.pieces.get(1)!.production);
    expect(avec.pieces.get(2)!.production).toBe(2 * sans.pieces.get(2)!.production);
    expect(avec.pieces.get(3)!.production).toBe(sans.pieces.get(3)!.production);
    expect(sans.pieces.get(3)).toMatchObject({ auRessort: false, engrenes: 1, frottements: 1 });
  });

  it("tient compte des dents limées : un côté limé est lisse, pour toujours", () => {
    const etat = plan(6, ["roue", [2, 1]], ["roue", [2, 0]]);
    // La dent de gauche de la seconde roue, contre le cadre, est limée.
    etat.pieces[1]!.limees.push(3);
    expect(info(etat, 2)).toMatchObject({ entrainee: true, engrenes: 1, frottements: 0 });
    expect(info(etat, 2).production).toBe(14);
    // Tournée, la roue montre ailleurs son côté limé : la dent limée était celle de base.
    etat.pieces[1]!.rot = 1;
    expect(info(etat, 2)).toMatchObject({ engrenes: 1, frottements: 1 });
  });

  it("compte les dents du rouage qui regardent une case libre : un rouage fermé ne grandit plus", () => {
    expect(analyser(etatInitial()).dentsLibres).toBe(4 + 6);
    // Deux cliquets sous le ressort ferment ce côté, et n'offrent aucune dent.
    const etat = plan(6, ["cliquet", [4, 2]], ["cliquet", [4, 3]]);
    expect(analyser(etat).dentsLibres).toBe(6);
  });
});

// La disposition du graphe de dépendances (#76 ; docs/comprehension.md, § 5).
import { describe, expect, it } from "vitest";
import { logique as caves } from "../../strates/s2-caves/logique";
import { etatInitial as vallee } from "../../strates/s2-caves/logique/etat";
import { textes as textesCaves } from "../../strates/s2-caves/textes.fr";
import { logique as surface } from "../../strates/s1-surface/logique";
import { etatInitial as tableauDeBord } from "../../strates/s1-surface/logique/etat";
import { AMELIORATIONS, GENERATEURS } from "../../strates/s1-surface/logique/regles";
import type { GrapheDependances } from "../logique/types";
import {
  couperLignes,
  DIMENSIONS,
  disposer,
  formulesAffichees,
  grapheOuvrable,
  nomCourt,
  phrasesGraphe,
  voisinsDe,
  type Disposition,
} from "./graphe";

/** Un graphe de nœuds nommés par leur identifiant, et de liens « a>b ». */
function graphe(ids: string[], liens: string[]): GrapheDependances {
  return {
    noeuds: ids.map((id) => ({ id, cle: id })),
    liens: liens.map((l) => {
      const [de, vers] = l.split(">");
      return { de: de!, vers: vers! };
    }),
  };
}

const couches = (d: Disposition) => Object.fromEntries(d.noeuds.map((n) => [n.id, n.couche]));
const noeud = (d: Disposition, id: string) => d.noeuds.find((n) => n.id === id)!;
const retours = (d: Disposition) => d.liens.filter((l) => l.retour).map((l) => `${l.de}>${l.vers}`);

/** Deux nœuds d'une même colonne qui se chevauchent, ou un nœud qui sort du cadre. */
function debordements(d: Disposition): string[] {
  const defauts: string[] = [];
  for (const n of d.noeuds) {
    if (n.x + n.largeur > d.largeur || n.y + n.hauteur > d.hauteur) defauts.push(`${n.id} sort`);
    for (const m of d.noeuds) {
      const ensemble = n.id < m.id && n.x === m.x;
      if (ensemble && n.y < m.y + m.hauteur && m.y < n.y + n.hauteur)
        defauts.push(`${n.id}/${m.id}`);
    }
  }
  return defauts;
}

/** Deux décimales, comme les tracés. */
const f = (x: number) => String(Math.round(x * 100) / 100);

/** Les croisements entre liens de deux couches voisines. */
function croisements(d: Disposition): number {
  const directs = d.liens
    .filter((l) => !l.retour)
    .map((l) => [noeud(d, l.de), noeud(d, l.vers)] as const)
    .filter(([a, b]) => b.couche === a.couche + 1);
  let n = 0;
  for (const [a, b] of directs) {
    for (const [c, e] of directs) {
      if (a.couche === c.couche && (a.y - c.y) * (b.y - e.y) < 0) n++;
    }
  }
  return n / 2;
}

describe("la disposition d'un graphe", () => {
  it("va de gauche à droite, de ce qui alimente à ce qui est alimenté", () => {
    const d = disposer(graphe(["a", "b", "c"], ["a>b", "b>c"]));
    expect(couches(d)).toEqual({ a: 0, b: 1, c: 2 });
    const pas = DIMENSIONS.largeur + DIMENSIONS.ecartX;
    expect(d.noeuds.map((n) => n.x)).toEqual([0, 1, 2].map((c) => DIMENSIONS.marge + c * pas));
    expect(d.largeur).toBe(2 * DIMENSIONS.marge + 3 * DIMENSIONS.largeur + 2 * DIMENSIONS.ecartX);
  });

  it("avance chaque nœud au plus près de ce qu'il alimente", () => {
    // « b » n'alimente que « d », deux couches plus loin : il se place juste avant.
    const d = disposer(graphe(["a", "b", "c", "d"], ["a>c", "c>d", "b>d"]));
    expect(couches(d)).toEqual({ a: 0, b: 1, c: 1, d: 2 });
  });

  it("repère les liens qui ferment un cycle, et les trace à contre-sens, par la droite de leur cible", () => {
    const d = disposer(graphe(["a", "b", "c"], ["a>b", "b>c", "c>a"]));
    expect(couches(d)).toEqual({ a: 0, b: 1, c: 2 });
    expect(retours(d)).toEqual(["c>a"]);
    const [a, b, c] = ["a", "b", "c"].map((id) => noeud(d, id));
    const { chemin } = d.liens.find((l) => l.retour)!;
    const milieu = DIMENSIONS.hauteur / 2;
    expect(chemin.startsWith(`M${c!.x},${c!.y + milieu} `)).toBe(true);
    expect(chemin.endsWith(` ${a!.x + DIMENSIONS.largeur},${a!.y + milieu}`)).toBe(true);
    // Il traverse la couche de « b » par un point de passage, au-dessus ou au-dessous de lui.
    const [, y] = /L[\d.]+,([\d.]+)/.exec(chemin)!;
    expect(Number(y) < b!.y || Number(y) > b!.y + DIMENSIONS.hauteur).toBe(true);
  });

  it("fait contourner les nœuds par les liens qui sautent des couches", () => {
    const d = disposer(graphe(["a", "b", "c", "d"], ["a>b", "b>c", "c>d", "a>d"]));
    expect(couches(d)).toEqual({ a: 0, b: 1, c: 2, d: 3 });
    const { chemin } = d.liens.find((l) => l.de === "a" && l.vers === "d")!;
    // Deux couches franchies, deux traits droits, qui ne passent ni sur « b » ni sur « c ».
    const traits = [...chemin.matchAll(/L[\d.]+,([\d.]+)/g)].map((m) => Number(m[1]));
    expect(traits).toHaveLength(2);
    for (const [y, id] of [
      [traits[0]!, "b"],
      [traits[1]!, "c"],
    ] as const) {
      const n = noeud(d, id);
      expect(y < n.y || y > n.y + DIMENSIONS.hauteur).toBe(true);
    }
  });

  it("range chaque couche pour ne pas croiser les liens qui peuvent ne pas l'être", () => {
    const d = disposer(graphe(["a1", "a2", "b1", "b2"], ["a1>b2", "a2>b1"]));
    expect(croisements(d)).toBe(0);
  });

  it("ignore un lien vers un nœud inconnu, ou d'un nœud vers lui-même", () => {
    const d = disposer(graphe(["a", "b"], ["a>b", "a>z", "b>b"]));
    expect(d.liens.map((l) => `${l.de}>${l.vers}`)).toEqual(["a>b"]);
  });

  it("ne dispose rien d'un graphe vide", () => {
    expect(disposer({ noeuds: [], liens: [] })).toEqual({
      noeuds: [],
      liens: [],
      largeur: 0,
      hauteur: 0,
    });
  });
});

describe("la disposition des graphes des strates", () => {
  it("met à la surface les améliorations, puis les moyens et le clic, puis la production et l'objectif", () => {
    const etat = tableauDeBord();
    etat.cumul = 1e12;
    etat.ameliorations = AMELIORATIONS.map((a) => a.id);
    const d = disposer(surface.graphe!(etat));
    const c = couches(d);
    expect(new Set(AMELIORATIONS.map((a) => c[a.id]))).toEqual(new Set([0, 1]));
    for (const g of GENERATEURS) expect(c[g.id]).toBe(1);
    expect([c.clic, c.production, c.objectif]).toEqual([1, 2, 3]);
    expect(retours(d)).toEqual([]);
    expect(croisements(d)).toBe(0);
  });

  it("fait revenir dans les caves le bilan aux familles, par les naissances et les départs", () => {
    const d = disposer(caves.graphe!({ ...vallee(), annee: 6, jour: 0 }));
    expect(retours(d)).toEqual(["naissances>familles", "departs>familles"]);
    const c = couches(d);
    expect(c.cycle).toBe(0);
    expect(c.saisons).toBeLessThan(c.recolte!);
    expect(c.recolte).toBeLessThan(c.reserve!);
    expect(c.reserve).toBeLessThan(c.bilan!);
    expect(c.bilan).toBeLessThan(c.naissances!);
    // Tous les nœuds tiennent dans le cadre, sans se chevaucher.
    for (const n of d.noeuds) {
      expect(n.x + DIMENSIONS.largeur).toBeLessThanOrEqual(d.largeur);
      expect(n.y + DIMENSIONS.hauteur).toBeLessThanOrEqual(d.hauteur);
    }
    const places = new Set(d.noeuds.map((n) => `${n.x},${n.y}`));
    expect(places.size).toBe(d.noeuds.length);
  });

  it("se lit aussi en phrases, pour les lecteurs d'écran", () => {
    const phrases = phrasesGraphe(caves.graphe!(vallee()), (cle) => textesCaves[cle] ?? cle);
    expect(phrases).toContain("Récolte ← Familles, Outils, Saisons");
    expect(phrases).toContain("Familles ← Naissances, Départs");
  });
});

describe("le graphe, à portée du bandeau", () => {
  it("s'ouvre à partir de κ = 50, pour une strate qui en expose un", () => {
    expect(grapheOuvrable(49.9, surface)).toBe(false);
    expect(grapheOuvrable(50, surface)).toBe(true);
    expect(grapheOuvrable(100, caves)).toBe(true);
    expect(grapheOuvrable(100, { graphe: undefined })).toBe(false);
  });

  it("raccourcit un nom trop long pour sa boîte", () => {
    expect(nomCourt("Récolte")).toBe("Récolte");
    expect(nomCourt("Un nom vraiment beaucoup trop long")).toBe("Un nom vraiment beaucou…");
    expect(nomCourt("Un nom vraiment beaucoup trop long")).toHaveLength(24);
  });

  it("éclaire au survol un nœud et ses voisins, de part et d'autre", () => {
    const g = graphe(["a", "b", "c", "d"], ["a>b", "b>c", "c>d"]);
    expect([...voisinsDe(g, "b")].sort()).toEqual(["a", "b", "c"]);
  });
});

describe("les formules sur le graphe", () => {
  const D = DIMENSIONS;
  const g = graphe(["a", "b", "c"], ["a>b", "b>c"]);
  const formules = [
    { noeud: "a", expression: "fa" },
    { noeud: "z", expression: "fz" },
    { noeud: "b", expression: "fb1" },
    { noeud: "b", expression: "fb2" },
  ];
  const toutLisible = () => true;
  const affichees = (kappa: number, cleLisible: (cle: string) => boolean = toutLisible) =>
    Object.fromEntries(formulesAffichees(formules, kappa, g, cleLisible));

  it("ne montrent rien à κ = 50, puis les premières de la strate, et toutes à κ = 100", () => {
    expect(affichees(50)).toEqual({});
    expect(affichees(51)).toEqual({ a: ["fa"] });
    expect(affichees(76)).toEqual({ a: ["fa"], b: ["fb1"] });
    expect(affichees(100)).toEqual({ a: ["fa"], b: ["fb1", "fb2"] });
  });

  it("comptent aussi la formule d'un nœud absent du graphe : elle l'y attend", () => {
    // ⌈4 × 25 / 50⌉ = 2 : « fa » et « fz », dont le nœud n'est pas encore là.
    expect(affichees(75)).toEqual({ a: ["fa"] });
  });

  it("attendent que leur nœud soit compris : levé, s'il était opaque", () => {
    expect(affichees(100, (cle) => cle !== "b")).toEqual({ a: ["fa"] });
  });

  it("se coupent entre les mots, en lignes d'au plus N signes", () => {
    expect(couperLignes("a bb ccc dddd", 6)).toEqual(["a bb", "ccc", "dddd"]);
    expect(couperLignes("  a   bb  ", 6)).toEqual(["a bb"]);
    expect(couperLignes("", 6)).toEqual([]);
  });

  it("se coupent comme un texte français : ni « ; » ni « % » en tête de ligne, ni « « » en fin", () => {
    expect(couperLignes("par jour ; chaque outil", 8)).toEqual([
      "par",
      "jour ;",
      "chaque",
      "outil",
    ]);
    expect(couperLignes("0,2 % du grain", 6)).toEqual(["0,2 %", "du", "grain"]);
    expect(couperLignes("les améliorations de « Produire »", 14)).toEqual([
      "les",
      "améliorations",
      "de",
      "« Produire »",
    ]);
  });

  it("coupent net un mot plus long qu'une ligne", () => {
    expect(couperLignes("abcdefghij", 4)).toEqual(["abcd", "efgh", "ij"]);
    expect(couperLignes("x abcdefghij y", 4)).toEqual(["x", "abcd", "efgh", "ij y"]);
  });

  it("tiennent dans leurs cartes, pour les strates du jeu, sans perdre un mot", () => {
    for (const { expression } of [...surface.formules!(), ...caves.formules!()]) {
      const lignes = couperLignes(expression, D.signes);
      for (const ligne of lignes) {
        expect([...ligne].length, ligne).toBeLessThanOrEqual(D.signes);
        expect(ligne).not.toMatch(/^[:;!?%»)]|«$/);
      }
      expect(lignes.join(" ")).toBe(expression.split(/\s+/).join(" "));
    }
  });

  it("font d'un nœud une carte : plus large, sa colonne avec lui, et plus haute de ses lignes", () => {
    const longue = "une formule assez longue pour tenir sur deux lignes au moins";
    const d = disposer(
      graphe(["a", "b", "c", "d"], ["a>c", "b>c", "c>d"]),
      new Map([["a", [longue]]]),
    );
    const [a, b, c] = ["a", "b", "c"].map((id) => noeud(d, id));
    expect([a!.largeur, b!.largeur, c!.largeur]).toEqual([
      D.largeurFormule,
      D.largeurFormule,
      D.largeur,
    ]);
    expect(c!.x).toBe(D.marge + D.largeurFormule + D.ecartX);
    expect(d.largeur).toBe(2 * D.marge + D.largeurFormule + 2 * D.largeur + 2 * D.ecartX);
    const lignes = a!.formules[0]!;
    expect(lignes.map((l) => l.texte)).toEqual(couperLignes(longue, D.signes));
    expect(lignes.length).toBeGreaterThan(1);
    expect(a!.hauteur).toBe(D.hauteur + D.interieur + lignes.length * D.ligne);
    // Sous le nom, dans la carte.
    for (const { y } of lignes) {
      expect(y).toBeGreaterThan(D.hauteur);
      expect(y).toBeLessThan(a!.hauteur);
    }
    expect([b!.hauteur, b!.formules]).toEqual([D.hauteur, []]);
    // Ses liens partent de son bord droit, à mi-hauteur.
    const { chemin } = d.liens.find((l) => l.de === "a")!;
    expect(chemin.startsWith(`M${f(a!.x + D.largeurFormule)},${f(a!.y + a!.hauteur / 2)} `)).toBe(
      true,
    );
    expect(debordements(d)).toEqual([]);
  });

  it("séparent deux formules d'un même nœud", () => {
    const d = disposer(graphe(["a"], []), new Map([["a", ["f1", "f2"]]]));
    const a = noeud(d, "a");
    expect(a.formules.map((lignes) => lignes.map((l) => l.texte))).toEqual([["f1"], ["f2"]]);
    expect(a.formules[1]![0]!.y - a.formules[0]![0]!.y).toBe(D.ligne + D.entreFormules);
    expect(a.hauteur).toBe(D.hauteur + D.interieur + 2 * D.ligne + D.entreFormules);
  });

  it("tiennent toutes, à κ = 100, dans les graphes des strates du jeu, sans chevauchement", () => {
    const etat = tableauDeBord();
    etat.cumul = 1e12;
    etat.ameliorations = AMELIORATIONS.map((a) => a.id);
    const vallee6 = { ...vallee(), annee: 6, jour: 0 };
    for (const [logique, e] of [
      [surface, etat],
      [caves, vallee6],
    ] as const) {
      const gr = (logique.graphe as (etat: unknown) => GrapheDependances)(e);
      const toutes = formulesAffichees(logique.formules!(), 100, gr, () => true);
      expect([...toutes.values()].flat()).toHaveLength(logique.formules!().length);
      const d = disposer(gr, toutes);
      expect(debordements(d)).toEqual([]);
      for (const n of d.noeuds) expect(n.formules.length).toBe(toutes.get(n.id)?.length ?? 0);
    }
  });
});

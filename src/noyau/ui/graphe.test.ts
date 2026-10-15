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
  DIMENSIONS,
  disposer,
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

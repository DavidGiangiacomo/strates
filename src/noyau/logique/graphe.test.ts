// Ce que le noyau vérifie d'un graphe de dépendances et de ses formules (docs/comprehension.md, § 5).
import { describe, expect, it } from "vitest";
import { problemesGraphe } from "./graphe";

const noeuds = ["a", "b", "c"].map((id) => ({ id, cle: id }));

describe("les problèmes d'un graphe", () => {
  it("ne trouvent rien à un graphe bien formé", () => {
    const liens = [
      { de: "a", vers: "b" },
      { de: "b", vers: "c" },
    ];
    expect(problemesGraphe({ noeuds, liens }, [{ noeud: "c", expression: "a + b" }])).toEqual([]);
  });

  it("relèvent un nœud en double, un lien vers un nœud absent, un nœud lié à lui-même", () => {
    const graphe = {
      noeuds: [...noeuds, { id: "a", cle: "a2" }],
      liens: [
        { de: "a", vers: "z" },
        { de: "b", vers: "b" },
      ],
    };
    expect(problemesGraphe(graphe)).toEqual([
      "nœud en double : a",
      "lien vers un nœud absent : z",
      "nœud lié à lui-même : b",
    ]);
  });

  it("relèvent une formule attachée à un nœud absent", () => {
    const formules = [{ noeud: "y", expression: "2 × x" }];
    expect(problemesGraphe({ noeuds, liens: [] }, formules)).toEqual([
      "formule attachée à un nœud absent : y",
    ]);
  });
});

// Le graphe de dépendances et les formules réelles de l'atelier (fiche, § 7).
import { describe, expect, it } from "vitest";
import { problemesGraphe } from "../../../noyau/logique/graphe";
import { textes } from "../textes.fr";
import { logique } from ".";
import { etatInitial } from "./etat";
import { formaterEntier } from "./notation";
import { AGRANDISSEMENTS, CROISSANCE_PRIX, TOUR } from "./regles";

const liens = () => logique.graphe!(etatInitial()).liens.map(({ de, vers }) => `${de} → ${vers}`);

describe("le graphe de l'atelier", () => {
  it("suit la fiche : du ressort au rouage, des dents à la production, du stock au plan", () => {
    expect(liens()).toEqual(
      expect.arrayContaining([
        "ressort → rouage",
        "engrenages → rouage",
        "engrenages → piece",
        "frottements → piece",
        "cadre → frottements",
        "lime → cotes",
        "rouage → production",
        "piece → production",
        "production → stock",
        "stock → nomenclature",
        "stock → agrandir",
        "nomenclature → plan",
        "agrandir → plan",
      ]),
    );
  });

  it("est bien formé, et chaque nœud a un nom", () => {
    const graphe = logique.graphe!(etatInitial());
    expect(problemesGraphe(graphe, logique.formules!())).toEqual([]);
    for (const { cle } of graphe.noeuds) expect(textes[cle]).toBeTruthy();
  });
});

describe("les formules de l'atelier", () => {
  const formules = logique.formules!();
  const formule = (noeud: string) => formules.find((f) => f.noeud === noeud)!.expression;

  it("vont du prix d'un exemplaire au prix des agrandissements", () => {
    expect(formules.map((f) => f.noeud)).toEqual([
      "nomenclature",
      "piece",
      "production",
      "rouage",
      "agrandir",
    ]);
  });

  it("s'écrivent en base douze, et disent les nombres des règles", () => {
    // 1,25 en base douze : 1 et 3 douzièmes.
    expect(1 + 3 / 12).toBe(CROISSANCE_PRIX);
    expect(formule("nomenclature")).toContain("× 1,3ⁿ");
    expect(formule("production")).toContain(`${formaterEntier(TOUR)} secondes`);
    for (const a of AGRANDISSEMENTS) {
      expect(formule("agrandir")).toContain(
        `${formaterEntier(a.taille)} × ${formaterEntier(a.taille)}`,
      );
      expect(formule("agrandir")).toContain(formaterEntier(a.prix));
    }
    expect(formule("agrandir")).toContain("↊ × ↊");
  });
});

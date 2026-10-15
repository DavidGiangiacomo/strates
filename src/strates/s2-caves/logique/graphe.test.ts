// Le graphe de dépendances et les formules réelles des caves (#78 ; fiche, § 7).
import { describe, expect, it } from "vitest";
import { problemesGraphe } from "../../../noyau/logique/graphe";
import { elementsParCle } from "../../../noyau/logique/opacite";
import { textes } from "../textes.fr";
import { logique } from ".";
import { etatInitial, type EtatCaves } from "./etat";
import { ANNEE_RATIONS, RATIONS, RECOLTE_PAR_FAMILLE, STOCKAGES } from "./regles";

const graphe = (etat: EtatCaves) => logique.graphe!(etat);
const liens = (etat: EtatCaves) => graphe(etat).liens.map(({ de, vers }) => `${de} → ${vers}`);
/** Une vallée où les rations se comptent : après l'an 5. */
const avecRations = () => ({ ...etatInitial(), annee: ANNEE_RATIONS + 1, jour: 0 });
const decimal = (x: number) => String(Number(x.toFixed(4))).replace(".", ",");

describe("le graphe des caves", () => {
  it("suit la fiche : de la récolte à la réserve, de la réserve au bilan, du bilan aux familles", () => {
    expect(liens(etatInitial())).toEqual(
      expect.arrayContaining([
        "familles → recolte",
        "outils → recolte",
        "saisons → recolte",
        "cycle → saisons",
        "recolte → reserve",
        "consommation → reserve",
        "pertes → reserve",
        "stockages → reserve",
        "reserve → marque",
        "reserve → bilan",
        "bilan → naissances",
        "bilan → departs",
        "naissances → familles",
        "departs → familles",
      ]),
    );
  });

  it("ajoute les rations quand elles se comptent : elles règlent la consommation, les naissances et la marque", () => {
    expect(graphe(etatInitial()).noeuds.map((n) => n.id)).not.toContain("rations");
    expect(liens(avecRations())).toEqual(
      expect.arrayContaining([
        "rations → consommation",
        "rations → naissances",
        "rations → marque",
      ]),
    );
  });

  it("est bien formé, et chaque nœud a un nom", () => {
    for (const etat of [etatInitial(), avecRations()]) {
      expect(problemesGraphe(graphe(etat))).toEqual([]);
      for (const { cle } of graphe(etat).noeuds) expect(textes[cle]).toBeTruthy();
    }
    expect(problemesGraphe(graphe(avecRations()), logique.formules!())).toEqual([]);
  });

  it("nomme de glyphes ce qui est encore opaque : la marque, les pertes, le grand cycle, les naissances", () => {
    const parCle = elementsParCle(logique.opacite ?? []);
    const couverts = graphe(avecRations()).noeuds.flatMap((n) => parCle.get(n.cle) ?? []);
    expect(couverts.sort()).toEqual(["cycle", "marque", "naissances", "pertes"]);
  });
});

describe("les formules des caves", () => {
  const formules = logique.formules!();
  const formule = (noeud: string) => formules.find((f) => f.noeud === noeud)!.expression;

  it("vont de la consommation à la marque d'hiver, qui les suppose toutes", () => {
    expect(formules.map((f) => f.noeud)).toEqual([
      "consommation",
      "recolte",
      "pertes",
      "rations",
      "marque",
    ]);
  });

  it("disent les nombres des règles", () => {
    expect(formule("recolte")).toContain(`${decimal(RECOLTE_PAR_FAMILLE)} boisseaux`);
    for (const s of STOCKAGES) expect(formule("pertes")).toContain(`${decimal(s.pertes * 100)} %`);
    const naissances = RATIONS.map((r) => decimal(r.naissances * 100));
    expect(formule("rations")).toContain(
      `${naissances.slice(0, -1).join(", ")} ou ${naissances.at(-1)} %`,
    );
  });
});

// Le graphe de dépendances et les formules réelles de la surface (#78 ; fiche, § 7).
import { describe, expect, it } from "vitest";
import { problemesGraphe } from "../../../noyau/logique/graphe";
import { textes } from "../textes.fr";
import { logique } from ".";
import { etatInitial, type EtatSurface } from "./etat";
import { AMELIORATIONS, CROISSANCE_COUT, GENERATEURS } from "./regles";

const graphe = (etat: EtatSurface) => logique.graphe!(etat);
const ids = (etat: EtatSurface) => graphe(etat).noeuds.map((n) => n.id);
const liens = (etat: EtatSurface) => graphe(etat).liens.map(({ de, vers }) => `${de} → ${vers}`);

/** Une surface où tout est apparu, et tout acheté. */
function toutAchete(): EtatSurface {
  const etat = etatInitial();
  etat.cumul = 1e12;
  for (const g of GENERATEURS) etat.generateurs[g.id] = 50;
  etat.ameliorations = AMELIORATIONS.map((a) => a.id);
  return etat;
}

describe("le graphe de la surface", () => {
  it("suit la fiche : le clic alimente la production, qui mène à l'objectif", () => {
    const etat = etatInitial();
    expect(ids(etat)).toEqual(["clic", "production", "objectif"]);
    expect(liens(etat)).toEqual(["clic → production", "production → objectif"]);
  });

  it("ne montre que les moyens apparus et les améliorations achetées, chacune vers ce qu'elle améliore", () => {
    const etat = etatInitial();
    // Un moyen apparaît quand le cumul atteint la moitié de son prix : à 1 000 cr, les trois premiers.
    etat.cumul = 1_000;
    etat.ameliorations = ["poste-10", "globale-1", "clic-1", "clic-4"];
    expect(ids(etat)).toEqual([
      "clic",
      "poste",
      "equipe",
      "serveur",
      "poste-10",
      "globale-1",
      "clic-1",
      "clic-4",
      "production",
      "objectif",
    ]);
    expect(liens(etat)).toEqual([
      "clic → production",
      "poste → production",
      "equipe → production",
      "serveur → production",
      "poste-10 → poste",
      "globale-1 → production",
      "clic-1 → clic",
      "clic-4 → clic",
      "production → objectif",
    ]);
  });

  it("est bien formé, et chaque nœud a un nom", () => {
    const etat = toutAchete();
    expect(problemesGraphe(graphe(etat), logique.formules!())).toEqual([]);
    for (const { cle } of graphe(etat).noeuds) expect(textes[cle]).toBeTruthy();
    expect(graphe(etat).noeuds).toHaveLength(1 + GENERATEURS.length + AMELIORATIONS.length + 2);
  });
});

describe("les formules de la surface", () => {
  const formules = logique.formules!();

  it("vont du prix de chaque moyen à ce qu'il produit, puis à la valeur du clic", () => {
    expect(formules.map((f) => f.noeud)).toEqual([
      ...GENERATEURS.map((g) => g.id),
      ...GENERATEURS.map((g) => g.id),
      "clic",
    ]);
  });

  it("s'écrivent dans la notation de la surface, avec les nombres de ses règles", () => {
    const croissance = String(CROISSANCE_COUT).replace(".", ",");
    expect(formules[0]!.expression).toBe(
      `Prix : 15\u00a0cr × ${croissance}ⁿ, n étant le nombre déjà en service`,
    );
    expect(formules[GENERATEURS.length]!.expression).toMatch(
      /^Production : n × 0,25\u00a0cr\/s × 2ᵃ/,
    );
    expect(formules.at(-1)!.expression).toMatch(/^Par clic : 2ᶜ cr \+ p × P/);
    for (const { expression } of formules) expect(expression).not.toMatch(/[{}]/);
  });
});

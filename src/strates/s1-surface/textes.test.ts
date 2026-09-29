// Les textes de la surface (#16 ; fiche, § 11).
import { describe, expect, it } from "vitest";
import { AMELIORATIONS, GENERATEURS, OBJECTIFS } from "./logique/regles";
import { textes } from "./textes.fr";

const mots = (texte: string) => texte.split(/\s+/).filter((m) => /\p{L}/u.test(m)).length;

describe("les textes de la surface", () => {
  it("nomment et décrivent chaque moyen de production et chaque amélioration", () => {
    for (const g of GENERATEURS) {
      expect(textes[`generateur.${g.id}`]).toBeTruthy();
      expect(textes[`generateur.${g.id}.description`]).toMatch(/\.$/);
    }
    for (const a of AMELIORATIONS) {
      expect(textes[`amelioration.${a.id}`]).toBeTruthy();
      expect(textes[`amelioration.${a.id}.description`]).toMatch(/\.$/);
    }
    for (let n = 1; n <= OBJECTIFS.length; n++) expect(textes[`objectif.${n}`]).toBeTruthy();
  });

  it("ne mentionnent jamais « creuser », et l'aide ne dit rien du bandeau", () => {
    for (const texte of Object.values(textes)) expect(texte).not.toMatch(/creus|fouill/i);
    const aide = Object.entries(textes)
      .filter(([cle]) => cle.startsWith("aide"))
      .map(([, texte]) => texte)
      .join(" ");
    expect(aide).not.toMatch(/bandeau|profondeur|artefact/i);
  });

  it("parlent comme un logiciel bien fait : sans point d'exclamation", () => {
    for (const texte of Object.values(textes)) expect(texte).not.toContain("!");
  });

  it("tiennent dans leur budget, environ 600 mots", () => {
    const total = Object.values(textes).reduce((n, t) => n + mots(t), 0);
    expect(total).toBeGreaterThan(450);
    expect(total).toBeLessThan(750);
  });
});

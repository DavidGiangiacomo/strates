// Les textes des caves (#17 ; fiche, § 11).
import { describe, expect, it } from "vitest";
import { OUTILS, STOCKAGES } from "./logique/regles";
import { textes } from "./textes.fr";

const mots = (texte: string) => texte.split(/\s+/).filter((m) => /\p{L}/u.test(m)).length;
// Les mots que la bible interdit partout, et « artefact », réservé au bandeau (docs/bible.md, § 2).
const interdits =
  /ancien|ancêtre|civilisation|prophétie|mystère|secret|(?<!\p{L})destins?(?!\p{L})|magie|bravo|félicitation|artefact/iu;

describe("les textes des caves", () => {
  it("nomment chaque stockage et chaque outil, avec une écriture et une note en marge", () => {
    for (const s of STOCKAGES) {
      expect(textes[`stockage.${s.id}`]).toBeTruthy();
      expect(textes[`construire.${s.id}`]).toBeTruthy();
      expect(textes[`stockage.${s.id}.note`]).toMatch(/\.$/);
    }
    for (const o of OUTILS) {
      expect(textes[`outil.${o.id}`]).toBeTruthy();
      expect(textes[`outil.${o.id}.acheter`]).toBeTruthy();
      expect(textes[`outil.${o.id}.note`]).toMatch(/\.$/);
    }
    for (const s of STOCKAGES) expect(textes[`trace.profondeur.${s.id}`]).toBeTruthy();
  });

  it("ne mentionnent jamais « creuser », et l'aide ne dit rien du bandeau", () => {
    for (const texte of Object.values(textes)) expect(texte).not.toMatch(/creus|fouill/i);
    const aide = Object.entries(textes)
      .filter(([cle]) => cle.startsWith("aide"))
      .map(([, texte]) => texte)
      .join(" ");
    expect(aide).not.toMatch(/bandeau|profondeur|artefact|objet/i);
  });

  it("ne s'adressent jamais au joueur, ne s'exclament pas, et n'écrivent aucun mot que la bible interdit", () => {
    for (const texte of Object.values(textes)) {
      expect(texte).not.toContain("!");
      expect(texte).not.toMatch(/\bvous\b|\bvotre\b|\bvos\b/i);
      expect(texte).not.toMatch(interdits);
    }
  });

  it("plantent leur reste (bible, § 3) : les roues sans moulin, dans la cave profonde", () => {
    expect(textes["stockage.caveProfonde.note"]).toContain("les roues sans moulin");
  });

  it("tiennent dans leur budget, 750 mots depuis les rations, hors formules lues au-delà de κ = 50", () => {
    const total = Object.entries(textes)
      .filter(([cle]) => !cle.startsWith("formule."))
      .reduce((n, [, t]) => n + mots(t), 0);
    expect(total).toBeGreaterThan(450);
    expect(total).toBeLessThan(750);
  });
});

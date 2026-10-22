// Les textes de l'atelier (#68 ; fiche, § 11).
import { describe, expect, it } from "vitest";
import { CATALOGUE } from "../../noyau/logique/catalogue";
import { PIECES } from "./logique/regles";
import { textes } from "./textes.fr";

const mots = (texte: string) => texte.split(/\s+/).filter((m) => /\p{L}/u.test(m)).length;
// Les mots que la bible interdit partout, et « artefact », réservé au bandeau (docs/bible.md, § 2).
const interdits =
  /ancien|ancêtre|civilisation|prophétie|mystère|secret|(?<!\p{L})destins?(?!\p{L})|magie|bravo|félicitation|artefact/iu;
const notice = Object.entries(textes)
  .filter(([cle]) => cle.startsWith("aide"))
  .map(([, texte]) => texte)
  .join(" ");

describe("les textes de l'atelier", () => {
  it("désignent chaque pièce de la nomenclature, avec une note comme une ligne de nomenclature", () => {
    for (const d of PIECES) {
      expect(textes[`piece.${d.id}`]).toBeTruthy();
      expect(textes[`piece.${d.id}.note`]).toMatch(/\.$/);
      expect(mots(textes[`piece.${d.id}.note`]!)).toBeLessThanOrEqual(12);
    }
  });

  it("ne disent ni « creuser », ni l'horloge, ni le nom de la couche, que le noyau donne", () => {
    for (const texte of Object.values(textes)) {
      expect(texte).not.toMatch(/creus|fouill|horloge|atelier/i);
    }
  });

  it("ne s'adressent jamais au joueur, ne s'exclament pas, et n'écrivent aucun mot que la bible interdit", () => {
    for (const texte of Object.values(textes)) {
      expect(texte).not.toContain("!");
      expect(texte).not.toMatch(/\bvous\b|\bvotre\b|\bvos\b/i);
      expect(texte).not.toMatch(interdits);
    }
  });

  it("donnent une notice qui dit les dents, le mouvement et la base douze, et rien de la fin, de la lime ni du bandeau", () => {
    expect(notice).toMatch(/engrènent/);
    expect(notice).toMatch(/ressort/);
    expect(notice).toMatch(/douze/);
    expect(notice).not.toMatch(/bandeau|profondeur|objet|\blime\b|seuil|aucune case|plein/i);
  });

  it("plantent leur reste (bible, § 3), et laissent au fond trois traces (§ 5)", () => {
    expect(textes["legende.sans-plan"]).toBe("Pièce sans plan : mise de côté.");
    expect(Object.keys(textes).filter((cle) => cle.startsWith("trace."))).toEqual([
      "trace.cases",
      "trace.pieces",
      "trace.sans-plan",
    ]);
    expect(textes["trace.cases"]).toBe(textes["cases.aucune"]);
  });

  it("notent ce qui s'arrête comme une mention de plan : « à reprendre »", () => {
    expect(textes["legende.ajustee"]).toBe("Pièce {piece} : ajustée.");
    expect(textes["legende.immobile"]).toBe("Pièce {piece} : à reprendre.");
    expect(textes["legende.eveil"]).toBe("Hors plan : {objet}.");
  });

  it("nomment les objets des caves comme des pièces et des outils (bible, § 6), en cinq mots au plus", () => {
    for (const a of CATALOGUE.filter((x) => x.origine === 2)) {
      expect(a.nomDEnBas).toMatch(/^(le |la |les |l')\p{Ll}/u);
      expect(a.nomDEnBas.split(/\s+/).length).toBeLessThanOrEqual(5);
    }
  });

  it("tiennent dans leur budget, 700 mots, hors formules lues au-delà de κ = 50", () => {
    const total = Object.entries(textes)
      .filter(([cle]) => !cle.startsWith("formule."))
      .reduce((n, [, t]) => n + mots(t), 0);
    expect(total).toBeGreaterThan(300);
    expect(total).toBeLessThanOrEqual(700);
  });
});

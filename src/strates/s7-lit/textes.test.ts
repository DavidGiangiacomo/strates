// Les textes du lit (fiche, § 11 ; bible, §§ 8 et 9).
import { describe, expect, it } from "vitest";
import { textes } from "./textes.fr";

const mots = (texte: string) => texte.split(/\s+/).filter((m) => /\p{L}/u.test(m)).length;
// Les mots que la bible interdit partout, et « artefact », réservé au bandeau (docs/bible.md, § 2).
const interdits =
  /ancien|ancêtre|civilisation|prophétie|mystère|secret|(?<!\p{L})destins?(?!\p{L})|magie|bravo|félicitation|artefact/iu;

describe("les textes du lit", () => {
  it("font parler le jeu en quelques phrases, celles de la bible, et elles seules disent « vous »", () => {
    expect(textes["phrase.arrivee"]).toBe("Rien ne presse.");
    expect(textes["phrase.retour"]).toBe("Ce que vous avez laissé en haut est toujours là.");
    expect(textes["phrase.decider"]).toBe("Vous n'avez rien à décider ici.");
    for (const [cle, texte] of Object.entries(textes)) {
      if (cle.startsWith("phrase.")) continue;
      expect(texte, cle).not.toMatch(/\bvous\b|\bvotre\b|\bvos\b/i);
    }
  });

  it("ne disent ni « creuser », ni l'horloge, ni le nom de la couche, que le noyau donne", () => {
    for (const texte of Object.values(textes)) {
      expect(texte).not.toMatch(/creus|fouill|horloge|(?<!\p{L})lit(?!\p{L})/iu);
    }
  });

  it("ne s'exclament pas, et n'écrivent aucun mot que la bible interdit", () => {
    for (const texte of Object.values(textes)) {
      expect(texte).not.toContain("!");
      expect(texte).not.toMatch(interdits);
    }
  });

  it("tiennent dans leur budget, 100 mots, le plus petit de toutes les strates, hors formules", () => {
    const total = Object.entries(textes)
      .filter(([cle]) => !cle.startsWith("formule."))
      .reduce((n, [, t]) => n + mots(t), 0);
    expect(total).toBeLessThanOrEqual(100);
  });
});

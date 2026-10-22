// Les rappels de reprise (bible, §§ 9 et 10) : les mots propres au rappel, ceux des clés `rappel.*`,
// tiennent dans les 300 que la bible leur donne pour les huit couches, hors du budget de chacune. La
// dernière ligne d'une couche est l'une des siennes : elle compte chez elle.
import { describe, expect, it } from "vitest";
import { textes as surface } from "./s1-surface/textes.fr";
import { textes as caves } from "./s2-caves/textes.fr";
import { textes as atelier } from "./s3-atelier/textes.fr";

const mots = (texte: string) => texte.split(/\s+/).filter((m) => /\p{L}/u.test(m)).length;
const rappels = [surface, caves, atelier].flatMap((textes) =>
  Object.entries(textes).filter(([cle]) => cle.startsWith("rappel.")),
);

describe("les rappels de reprise", () => {
  it("tiennent dans les 300 mots de la bible", () => {
    expect(rappels.length).toBeGreaterThan(0);
    expect(rappels.reduce((n, [, texte]) => n + mots(texte), 0)).toBeLessThanOrEqual(300);
  });

  it("ne s'adressent jamais au joueur, et ne nomment ni le seuil ni « creuser »", () => {
    for (const [, texte] of rappels) {
      expect(texte).not.toMatch(/\bvous\b|\bvotre\b|\bvos\b/i);
      expect(texte).not.toMatch(/seuil|creus|fouill/i);
    }
  });
});

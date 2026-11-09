// Les textes du lit (#92 ; fiche, § 11 ; bible, §§ 7 à 9).
import { describe, expect, it } from "vitest";
import { CATALOGUE } from "../../noyau/logique/catalogue";
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
    expect(textes["phrase.descente"]).toBe("C'était la seule fois.");
    for (const [cle, texte] of Object.entries(textes)) {
      if (cle.startsWith("phrase.")) continue;
      expect(texte, cle).not.toMatch(/\bvous\b|\bvotre\b|\bvos\b/i);
    }
  });

  it("ne changent pas avec l'issue de la dette : quand le jeu parle, il ne juge pas (bible, § 7)", () => {
    for (const [cle, texte] of Object.entries(textes)) {
      expect(cle).not.toMatch(/soldee|defaut|dette/);
      expect(texte).not.toMatch(/sold|défaut|dette|dû/i);
    }
  });

  it("donnent une aide qui dit une crue en quatre légendes, avec les quatre mots du lit, et rien de la fin", () => {
    const aide = ["crue", "levee", "couche", "rive"].map((cle) => textes[`aide.${cle}`]!);
    expect(textes["aide.titre"]).toBe("Une crue");
    expect(aide).toEqual([
      "La crue monte.",
      "Derrière la levée, l'eau se repose.",
      "Elle se retire, et laisse son limon : une couche.",
      "À droite, la rive.",
    ]);
    const tout = aide.join(" ");
    for (const mot of ["crue", "limon", "couche", "rive"])
      expect(tout).toMatch(new RegExp(mot, "i"));
    expect(tout).not.toMatch(/plein|descen|fin|fond|échelle|coudée|\bvous\b/i);
  });

  it("nomment les objets de la dette par ce qu'ils font à qui les tient (bible, § 6)", () => {
    for (const a of CATALOGUE.filter((x) => x.origine === 6)) {
      expect(a.nomDEnBas).toMatch(/^(le |la |l')\p{Ll}+ qui \p{Ll}+$/u);
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

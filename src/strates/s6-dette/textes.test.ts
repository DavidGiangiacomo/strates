// Les textes de la dette (fiche, § 11 ; bible, §§ 2 et 7), en proposition pour #74.
import { describe, expect, it } from "vitest";
import { strate as surface } from "../s1-surface";
import { strate as caves } from "../s2-caves";
import { strate as atelier } from "../s3-atelier";
import { strate as lit } from "../s7-lit";
import { logique } from "./logique";
import { PROMESSES } from "./logique/regles";
import { textes } from "./textes.fr";

const mots = (texte: string) => texte.split(/\s+/).filter((m) => /\p{L}/u.test(m)).length;
// Les mots que la bible interdit partout, et « artefact », réservé au bandeau (docs/bible.md, § 2).
const interdits =
  /ancien|ancêtre|civilisation|prophétie|mystère|secret|(?<!\p{L})destins?(?!\p{L})|magie|bravo|félicitation|artefact/iu;

/** Les clés que la logique écrit au livre, ou dans le résumé d'une absence. */
const LIVRE = [
  "livre.entree",
  "livre.honore",
  "livre.solde",
  "livre.reporte",
  "livre.reporteAdouci",
  "livre.echu",
  "livre.refus",
  "livre.brisee",
  "livre.derniere",
  "livre.grandeCrue",
  "livre.soldee",
  "livre.defaut",
];

describe("les textes de la dette", () => {
  it("écrivent les deux fins mot pour mot comme la bible : même voix, même longueur", () => {
    expect(textes["livre.soldee"]).toBe("Honoré. Plus rien n'est dû.");
    expect(textes["livre.defaut"]).toBe("Échu. Le reste demeure dû.");
    expect(mots(textes["livre.soldee"]!)).toBe(mots(textes["livre.defaut"]!));
    expect(textes["livre.entree"]).toBe("Les échéances tombent à leur crue, qu'on soit là ou non.");
  });

  it("ont une ligne pour chaque chose que le livre écrit, et un nom pour chaque promesse", () => {
    for (const cle of LIVRE) expect(textes[cle], cle).toBeTruthy();
    for (const id of PROMESSES) expect(textes[`promesse.${id}`], id).toBeTruthy();
    for (const { cle } of logique.graphe!(
      logique.etatInitial({ graine: 1, journal: { strates: [] } }),
    ).noeuds) {
      expect(textes[cle], cle).toBeTruthy();
    }
  });

  it("ne laissent dans leurs modèles que les nombres que la vue sait écrire", () => {
    const connus = new Set(["crue", "montant", "n", "secondes", "du", "confiance", "majoration"]);
    for (const [cle, texte] of Object.entries(textes)) {
      for (const [, nom] of texte.matchAll(/\{(\w+)\}/g))
        expect(connus, `${cle} : ${nom}`).toContain(nom);
    }
  });

  it("parlent à la troisième personne, sans s'exclamer, sans les mots que la bible interdit", () => {
    for (const [cle, texte] of Object.entries(textes)) {
      expect(texte, cle).not.toMatch(/\bvous\b|\bvotre\b|\bvos\b/i);
      expect(texte, cle).not.toContain("!");
      expect(texte, cle).not.toMatch(interdits);
      // « Creuser » et la fouille sont au noyau.
      expect(texte, cle).not.toMatch(/creus|fouill/i);
    }
  });

  it("tiennent dans leur budget, 850 mots, le plus grand de toutes les strates, hors formules", () => {
    const total = Object.entries(textes)
      .filter(([cle]) => !cle.startsWith("formule."))
      .reduce((n, [, t]) => n + mots(t), 0);
    expect(total).toBeLessThanOrEqual(850);
  });
});

describe("I1 : la dette est seule à écrire en sceaux et à dater en crues", () => {
  it("et les autres strates n'en font rien, ni dans leurs textes, ni à l'écran de fouille", () => {
    for (const [nom, autre] of Object.entries({ surface, caves, atelier, lit })) {
      for (const texte of Object.values(autre.textes)) {
        expect(texte, nom).not.toContain("●");
        expect(texte, nom).not.toMatch(/\d\s*(ʳᵉ|ᵉ|e|er)\s+crue/u);
      }
      expect(autre.formaterValeur!(125e9), nom).not.toContain("●");
    }
  });
});

// Les invariants d'équilibrage dans le lit (design doc, §9), pour sa recette R5 (#120 ;
// docs/strates/strate-7-recette.md, § 6). I1 et I3 se vérifient ici. I2 et I5 sont tenus par
// l'équilibrage (tests/equilibrage-lit.test.ts). I4 ne s'applique pas au lit : il n'a pas de seuil
// à franchir, et la descente vient en attendant (fiche, § 4).
import { describe, expect, it } from "vitest";
import { strate as surface } from "../src/strates/s1-surface";
import { strate as caves } from "../src/strates/s2-caves";
import { strate as atelier } from "../src/strates/s3-atelier";
import { strate as dette } from "../src/strates/s6-dette";
import { strate as lit } from "../src/strates/s7-lit";
import { RIVE, VOLUME } from "../src/strates/s7-lit/logique/regles";

/** Le limon du bassin plein : la valeur convertible du lit, toujours la même (fiche, § 9). */
const BASSIN_PLEIN = RIVE + 4 * VOLUME;
const AUTRES = { surface, caves, atelier, dette };

describe("I1 : le lit ne partage ni sa ressource, ni son unité, ni sa notation", () => {
  it("écrit son seul nombre en toutes lettres, en doigts, et aucun chiffre", () => {
    const valeur = lit.formaterValeur!(BASSIN_PLEIN);
    expect(valeur).toMatch(/doigts$/);
    expect(valeur).not.toMatch(/\d/);
    for (const [cle, texte] of Object.entries(lit.textes)) expect(texte, cle).not.toMatch(/\d/);
  });

  it("est seul à compter en coudées et en doigts, et les autres écrivent leurs nombres en chiffres", () => {
    for (const [nom, autre] of Object.entries(AUTRES)) {
      for (const texte of Object.values(autre.textes)) {
        expect(texte, nom).not.toMatch(/coudée|(?<!\p{L})doigts?(?!\p{L})|limon/iu);
      }
      expect(autre.formaterValeur!(BASSIN_PLEIN), nom).toMatch(/\d|[↊↋]/);
    }
  });
});

describe("I3 : l'ordre de grandeur ne croît pas d'une strate à l'autre", () => {
  it("donne au lit la plus petite échelle du jeu : environ mille doigts", () => {
    expect(Math.floor(Math.log10(BASSIN_PLEIN))).toBe(3);
  });
});

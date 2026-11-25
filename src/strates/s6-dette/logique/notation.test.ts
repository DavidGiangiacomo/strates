// La notation de la dette (docs/strates/strate-6.md, § 1) : les sceaux, les crues en ordinaux, et les
// montants en lettres pour les lecteurs d'écran (§ 6).
import { describe, expect, it } from "vitest";
import { crueOrdinale, enLettres, formaterSceaux, remplir } from "./notation";
import { LIVRE_ENTIER } from "./regles";

/** Sans les espaces fines, pour lire les exemples comme la fiche les écrit. */
const lire = (texte: string) => texte.replace(/\u202f/g, " ");

describe("les sceaux", () => {
  it("écrivent les exemples de la fiche : un sceau par groupe de trois zéros, à la fin", () => {
    const exemples: [number, string][] = [
      [0, "0"],
      [12, "12"],
      [1_250, "1 250"],
      [9_000, "9 ●"],
      [125_000, "125 ●"],
      [1_250_000, "1 250 ●"],
      [1_000_000, "1 ●●"],
      [125e9, "125 ●●●"],
      [2_870e6, "2 870 ●●"],
      [3.84e20, "384 ●●●●●●"],
    ];
    for (const [montant, ecrit] of exemples) expect(lire(formaterSceaux(montant))).toBe(ecrit);
    expect(lire(formaterSceaux(LIVRE_ENTIER))).toBe("384 ●●●●●●");
  });

  it("arrondissent à trois chiffres significatifs, au plus près, vers le bas ou vers le haut", () => {
    expect(lire(formaterSceaux(1_234_567))).toBe("1 230 ●");
    expect(lire(formaterSceaux(1_235_000))).toBe("1 240 ●");
    expect(lire(formaterSceaux(15.6))).toBe("16");
    expect(lire(formaterSceaux(999.6))).toBe("1 ●");
    expect(lire(formaterSceaux(999_999))).toBe("1 ●●");
    // Ce qu'on a, vers le bas ; ce qu'on doit, vers le haut : la caisse qui s'écrit au-dessus d'une
    // échéance la couvre.
    expect(lire(formaterSceaux(1_259.7, "bas"))).toBe("1 250");
    expect(lire(formaterSceaux(1_249.9, "bas"))).toBe("1 240");
    expect(lire(formaterSceaux(1_241, "haut"))).toBe("1 250");
    expect(lire(formaterSceaux(1_250, "haut"))).toBe("1 250");
    expect(lire(formaterSceaux(1_249.999_999_999_9, "bas"))).toBe("1 250");
    expect(lire(formaterSceaux(999_999, "bas"))).toBe("999 ●");
  });

  it("ne se coupent jamais en fin de ligne : les espaces sont insécables", () => {
    expect(formaterSceaux(1_250_000)).toBe("1\u202f250\u202f●");
  });
});

describe("les crues", () => {
  it("se datent en ordinaux : la 1ʳᵉ, la 42ᵉ, et les grands nombres se groupent", () => {
    expect(crueOrdinale(1)).toBe("1ʳᵉ");
    expect(crueOrdinale(2)).toBe("2ᵉ");
    expect(crueOrdinale(348)).toBe("348ᵉ");
    expect(crueOrdinale(5_760)).toBe("5760ᵉ");
    expect(lire(crueOrdinale(12_345))).toBe("12 345ᵉ");
  });
});

describe("les montants en lettres", () => {
  it("se disent en entier, comme ils s'écrivent", () => {
    const exemples: [number, string][] = [
      [0, "zéro"],
      [16, "seize"],
      [21, "vingt et un"],
      [80, "quatre-vingts"],
      [280, "deux cent quatre-vingts"],
      [1_250, "mille deux cent cinquante"],
      [56_500, "cinquante-six mille cinq cents"],
      [200_000, "deux cent mille"],
      [1_250_000, "un million deux cent cinquante mille"],
      [125e9, "cent vingt-cinq milliards"],
      [200e6, "deux cents millions"],
      [71e12, "soixante et onze billions"],
      [3.84e20, "trois cent quatre-vingt-quatre trillions"],
      [1_234_567, "un million deux cent trente mille"],
    ];
    for (const [montant, dit] of exemples) expect(enLettres(montant)).toBe(dit);
  });
});

describe("les modèles", () => {
  it("se remplissent de valeurs déjà écrites, et gardent ce qu'on ne leur donne pas", () => {
    expect(remplir("Dû à la {crue} crue : {montant}.", { crue: "42ᵉ", montant: "1 250" })).toBe(
      "Dû à la 42ᵉ crue : 1 250.",
    );
    expect(remplir("à {n} crues", {})).toBe("à {n} crues");
  });
});

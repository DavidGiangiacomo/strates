// La notation du lit (fiche, § 1) : l'échelle de crue, en coudées et en doigts, écrite en lettres.
import { describe, expect, it } from "vitest";
import { coudeesEtDoigts, enLettres, formaterDoigts, lireCoudees, lireEchelle } from "./notation";
import { RIVE, VOLUME } from "./regles";

describe("les nombres en lettres", () => {
  it("s'écrivent à l'orthographe traditionnelle, avec « et » devant un", () => {
    const attendus: [number, string][] = [
      [0, "zéro"],
      [1, "un"],
      [7, "sept"],
      [14, "quatorze"],
      [16, "seize"],
      [17, "dix-sept"],
      [20, "vingt"],
      [21, "vingt et un"],
      [22, "vingt-deux"],
      [27, "vingt-sept"],
      [31, "trente et un"],
      [36, "trente-six"],
      [70, "soixante-dix"],
      [71, "soixante et onze"],
      [77, "soixante-dix-sept"],
      [80, "quatre-vingts"],
      [81, "quatre-vingt-un"],
      [90, "quatre-vingt-dix"],
      [91, "quatre-vingt-onze"],
      [99, "quatre-vingt-dix-neuf"],
      [100, "cent"],
      [101, "cent un"],
      [200, "deux cents"],
      [201, "deux cent un"],
      [280, "deux cent quatre-vingts"],
      [1000, "mille"],
      [1008, "mille huit"],
      [1941, "mille neuf cent quarante et un"],
      [2000, "deux mille"],
      [21000, "vingt et un mille"],
      [80000, "quatre-vingt mille"],
      [200000, "deux cent mille"],
    ];
    for (const [n, mots] of attendus) expect(enLettres(n), String(n)).toBe(mots);
  });

  it("accordent « un » au féminin, et arrondissent en dessous", () => {
    expect(enLettres(1, true)).toBe("une");
    expect(enLettres(21, true)).toBe("vingt et une");
    expect(enLettres(81, true)).toBe("quatre-vingt-une");
    expect(enLettres(7.9)).toBe("sept");
  });
});

describe("la lecture de l'échelle", () => {
  it("dit les coudées et les doigts, en lettres", () => {
    expect(lireEchelle(0)).toBe("aucune coudée");
    expect(lireEchelle(1)).toBe("un doigt");
    expect(lireEchelle(7)).toBe("sept doigts");
    expect(lireEchelle(28)).toBe("une coudée");
    expect(lireEchelle(29)).toBe("une coudée et un doigt");
    expect(lireEchelle(9 * 28 + 14)).toBe("neuf coudées et quatorze doigts");
    expect(lireEchelle(21 * 28)).toBe("vingt et une coudées");
    expect(lireEchelle(27 * 28 + 21)).toBe("vingt-sept coudées et vingt et un doigts");
    expect(lireEchelle(RIVE)).toBe("trente-six coudées");
  });

  it("arrondit au doigt en dessous, sans perdre un doigt aux erreurs de calcul", () => {
    expect(lireEchelle(8.75)).toBe("huit doigts");
    expect(lireEchelle(28 - 1e-9)).toBe("une coudée");
    expect(coudeesEtDoigts(266)).toEqual({ coudees: 9, doigts: 14 });
  });

  it("s'annonce aux lecteurs d'écran à la coudée près", () => {
    expect(lireCoudees(9 * 28 + 14)).toBe("neuf coudées");
    expect(lireCoudees(20)).toBe("aucune coudée");
  });
});

describe("le limon déposé", () => {
  it("s'écrit en doigts, en toutes lettres", () => {
    expect(formaterDoigts(RIVE + 4 * VOLUME)).toBe("mille neuf cent quarante et un doigts");
    expect(formaterDoigts(1)).toBe("un doigt");
    expect(formaterDoigts(0)).toBe("aucun doigt");
  });
});

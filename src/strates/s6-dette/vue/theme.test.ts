// La palette de la dette (fiche, § 6) : deux encres sur l'argile, lisibles toutes deux, et la terre
// presque noire autour. Les contrastes suivent les WCAG : 4,5:1 au moins pour un texte.
import { describe, expect, it } from "vitest";
import { strate } from "..";
import { PALETTE, POLICE } from "./theme";

/** La luminance relative d'une couleur « #rrggbb ». */
function luminance(hex: string): number {
  const n = Number.parseInt(hex.slice(1), 16);
  const canal = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(n >> 16) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255);
}

/** Le contraste entre deux couleurs, de 1 à 21. */
function contraste(a: string, b: string): number {
  const [clair, sombre] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (clair! + 0.05) / (sombre! + 0.05);
}

describe("la palette de la dette", () => {
  it("écrit ses deux encres lisiblement sur l'argile, et sur un bouton", () => {
    expect(contraste(PALETTE.encre, PALETTE.argile)).toBeGreaterThan(10);
    expect(contraste(PALETTE.rouge, PALETTE.argile)).toBeGreaterThan(5);
    expect(contraste(PALETTE.encre, PALETTE["argile-2"])).toBeGreaterThan(9);
    expect(contraste(PALETTE.rouge, PALETTE["argile-2"])).toBeGreaterThan(4.5);
  });

  it("grave le nom du compte des crues lisiblement dans la terre, la plus sombre de toutes", () => {
    expect(contraste(PALETTE.grave, PALETTE.terre)).toBeGreaterThan(9);
    expect(luminance(PALETTE.terre)).toBeLessThan(0.01);
  });

  it("a un romain gravé, ni le Palatino des caves, ni la linéale du lit", () => {
    expect(POLICE.startsWith("Baskerville,")).toBe(true);
    expect(POLICE).toMatch(/Constantia/);
    expect(POLICE).toMatch(/"Book Antiqua"/);
    expect(POLICE).not.toMatch(/Palatino|Optima|Georgia/);
  });

  it("donne à l'écran de fouille la valeur en sceaux, à l'encre noire sur l'argile", () => {
    expect(strate.apparenceValeur).toEqual({
      police: POLICE,
      couleur: PALETTE.encre,
      fond: PALETTE.argile,
    });
  });
});

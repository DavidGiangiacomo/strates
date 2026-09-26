import { describe, expect, it } from "vitest";
import { formaterDebit, formaterMontant, formaterNombre } from "./notation";

// Espaces insécables : entre le nombre et l'unité, et entre les milliers.
const e = (texte: string) => texte.replaceAll(" ", " ").replaceAll("_", " ");

describe("la notation de tableau de bord", () => {
  it("écrit les montants en entiers sous 1 000", () => {
    expect(formaterMontant(0)).toBe(e("0 cr"));
    expect(formaterMontant(0.9)).toBe(e("0 cr"));
    expect(formaterMontant(847.6)).toBe(e("847 cr"));
  });

  it("écrit trois chiffres significatifs avec les suffixes k, M et Md", () => {
    expect(formaterMontant(1_000)).toBe(e("1,00 k cr"));
    expect(formaterMontant(12_400)).toBe(e("12,4 k cr"));
    expect(formaterMontant(3_050_000)).toBe(e("3,05 M cr"));
    expect(formaterMontant(1_200_000_000)).toBe(e("1,20 Md cr"));
    expect(formaterMontant(999_000_000_000)).toBe(e("999 Md cr"));
  });

  it("tronque sans jamais arrondir vers le haut : on ne montre pas ce qu'on n'a pas", () => {
    expect(formaterMontant(999_999)).toBe(e("999 k cr"));
    expect(formaterMontant(1_239_999)).toBe(e("1,23 M cr"));
    expect(formaterMontant(1_200)).toBe(e("1,20 k cr"));
  });

  it("n'a pas d'unité au-delà de 999 Md : la notation sature", () => {
    expect(formaterMontant(1_240_000_000_000)).toBe(e("1_240 Md cr"));
    expect(formaterMontant(12_345_678_000_000_000)).toBe(e("12_345_678 Md cr"));
  });

  it("écrit les débits avec trois chiffres significatifs, même sous 1 000", () => {
    expect(formaterDebit(0)).toBe(e("0,00 cr/s"));
    expect(formaterDebit(0.25)).toBe(e("0,25 cr/s"));
    expect(formaterDebit(12.4)).toBe(e("12,4 cr/s"));
    expect(formaterDebit(847)).toBe(e("847 cr/s"));
    expect(formaterDebit(1_000_000)).toBe(e("1,00 M cr/s"));
  });

  it("ne montre rien d'absurde pour une valeur invalide", () => {
    expect(formaterMontant(NaN)).toBe(e("— cr"));
    expect(formaterDebit(-1)).toBe(e("— cr/s"));
  });

  it("écrit les facteurs avec une virgule", () => {
    expect(formaterNombre(1.5)).toBe("1,5");
    expect(formaterNombre(2)).toBe("2");
  });
});

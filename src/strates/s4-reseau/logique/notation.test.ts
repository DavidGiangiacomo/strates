// La notation du réseau (fiche, § 1) : des pouces et des lignes, des muids, écrits en entier, les
// milliers séparés d'un point.
import { describe, expect, it } from "vitest";
import { enEntier, formaterMuids, formaterPouces, pourLecteur, remplir } from "./notation";

describe("la notation du réseau", () => {
  it("écrit les nombres en entier, les milliers séparés d'un point", () => {
    expect(enEntier(0)).toBe("0");
    expect(enEntier(999)).toBe("999");
    expect(enEntier(4_000)).toBe("4.000");
    expect(enEntier(1_600_000)).toBe("1.600.000");
    expect(enEntier(150_000_000_000_000)).toBe("150.000.000.000.000");
    expect(enEntier(2.05e15)).toBe("2.050.000.000.000.000");
    // Les nombres sont entiers : ce qui dépasse s'oublie.
    expect(enEntier(4_000.9)).toBe("4.000");
  });

  it("écrit un débit en pouces, et en lignes sous dix pouces : cent quarante-quatre par pouce", () => {
    expect(formaterPouces(4_000)).toBe("4.000 pouces");
    expect(formaterPouces(1)).toBe("1 pouce");
    expect(formaterPouces(10)).toBe("10 pouces");
    expect(formaterPouces(4_000 / 1_024)).toBe("3 pouces 130 lignes");
    expect(formaterPouces(2.5)).toBe("2 pouces 72 lignes");
    expect(formaterPouces(0.25)).toBe("36 lignes");
    expect(formaterPouces(1 / 144)).toBe("1 ligne");
    expect(formaterPouces(0)).toBe("0 pouces");
    // Au-delà de dix pouces, les lignes ne s'écrivent plus.
    expect(formaterPouces(12.5)).toBe("12 pouces");
  });

  it("écrit un volume en muids", () => {
    expect(formaterMuids(1)).toBe("1 muid");
    expect(formaterMuids(24)).toBe("24 muids");
    expect(formaterMuids(7_200)).toBe("7.200 muids");
    expect(formaterMuids(1.5)).toBe("1 muid");
  });

  it("donne aux lecteurs d'écran les nombres sans séparateur, qu'ils lisent comme des nombres", () => {
    expect(pourLecteur("La ville reçoit 1.600.000 pouces.")).toBe(
      "La ville reçoit 1600000 pouces.",
    );
    expect(pourLecteur("Conduite 2 : goulot.")).toBe("Conduite 2 : goulot.");
  });

  it("remplit ses modèles, et laisse ce qu'il ne connaît pas", () => {
    expect(remplir("Conduite {conduite} : posée.", { conduite: "5" })).toBe("Conduite 5 : posée.");
    expect(remplir("{noeud} : monte.", {})).toBe("{noeud} : monte.");
  });
});

import { describe, expect, it } from "vitest";
import { etatInitial } from "../logique/etat";
import { couches, DEBORD, niveau } from "./coupe";

describe("la coupe des stockages", () => {
  it("n'a à l'arrivée que le grenier, et rien dessous", () => {
    expect(couches(etatInitial())).toEqual([
      { id: "grenier", nombre: 1, capacite: 400, grain: 250 },
    ]);
  });

  it("empile les couches construites du fond jusqu'aux greniers, et les remplit par le fond", () => {
    const etat = etatInitial();
    etat.stockages = { grenier: 2, silo: 1, cave: 1, caveProfonde: 0 };
    etat.reserve = 21_500;
    expect(couches(etat)).toEqual([
      { id: "cave", nombre: 1, capacite: 20_000, grain: 20_000 },
      { id: "silo", nombre: 1, capacite: 3_000, grain: 1_500 },
      { id: "grenier", nombre: 2, capacite: 800, grain: 0 },
    ]);
  });

  it("compte la conservation des objets d'en haut dans la capacité", () => {
    const etat = etatInitial();
    etat.multiplicateurs.conservation = 1.5;
    expect(couches(etat)[0]!.capacite).toBe(600);
  });
});

describe("la hauteur du grain dans la coupe", () => {
  it("monte d'une couche par couche remplie, quelle que soit sa capacité", () => {
    const etat = etatInitial();
    etat.stockages = { grenier: 2, silo: 1, cave: 1, caveProfonde: 0 };
    const liste = couches(etat);
    expect(niveau(liste, 0)).toBe(0);
    expect(niveau(liste, 10_000)).toBe(0.5);
    expect(niveau(liste, 21_500)).toBe(1.5);
    expect(niveau(liste, 23_400)).toBe(2.5);
  });

  it("fait flotter au-dessus du grenier ce qui dépasse la capacité, d'une couche au plus", () => {
    const liste = couches(etatInitial());
    expect(niveau(liste, 250)).toBe(0.625);
    // La marque d'hiver à l'arrivée : 775 boisseaux pour un grenier de 400.
    expect(niveau(liste, 775)).toBeCloseTo(1.9375, 10);
    expect(niveau(liste, 5_000)).toBe(1 + DEBORD);
  });

  it("reste au fond sans couche", () => {
    expect(niveau([], 100)).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import { etatInitial } from "../logique/etat";
import { achatsCourbe, saisonsCourbe } from "./courbe";

/** L'an 2, jour 100 : 450 jours après l'arrivée (an 1, jour 70), soit 91 points d'historique. */
function anDeux() {
  const etat = etatInitial();
  etat.annee = 2;
  etat.jour = 100;
  etat.temps = 450;
  etat.historique.reserve = Array.from({ length: 91 }, () => 100);
  return etat;
}

describe("la courbe de la réserve", () => {
  it("n'a rien à montrer avant deux points", () => {
    expect(saisonsCourbe(etatInitial())).toEqual({ hivers: [], annees: [] });
  });

  it("place l'hiver et le début de l'année sous les points qui leur correspondent", () => {
    // L'hiver de l'an 1 va du jour 350 au jour 420 : 280 à 350 jours après l'arrivée.
    expect(saisonsCourbe(anDeux())).toEqual({
      hivers: [{ debut: 56, fin: 70 }],
      annees: [{ annee: 2, index: 70 }],
    });
  });

  it("suit le temps entre deux points, et coupe l'hiver en cours au bord de la fenêtre", () => {
    // L'an 2, jour 382,5 : l'hiver a commencé au jour 350, et le dernier point est au jour 380.
    const etat = anDeux();
    etat.jour = 382.5;
    etat.temps = 732.5;
    etat.historique.reserve = Array.from({ length: 147 }, () => 100);
    const { hivers } = saisonsCourbe(etat);
    expect(hivers).toEqual([
      { debut: 56, fin: 70 },
      { debut: 140, fin: 146 },
    ]);
  });

  it("place les achats de la fenêtre, et oublie les autres", () => {
    const etat = anDeux();
    etat.historique.achats = [-10, 100, 450];
    expect(achatsCourbe(etat)).toEqual([20, 90]);
  });
});

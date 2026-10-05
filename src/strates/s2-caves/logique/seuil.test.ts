// Le seuil des caves : trois grands hivers de suite sans rupture, soudure comprise (fiche, § 4).
import { describe, expect, it } from "vitest";
import type { ContexteTick } from "../../../noyau/logique/types";
import { logique } from ".";
import { etatInitial, type EtatCaves } from "./etat";
import { dureeHiver, finSoudure, saisonChaude } from "./regles";

const CTX: ContexteTick = {
  effets: { multiplicateur: () => 1, niveau: () => null },
  emettre: () => {},
};

/** Une vallée qui ne manque jamais : 50 familles, tous les outils, des caves profondes pleines. */
function valleeSure(annee: number): EtatCaves {
  const etat = etatInitial();
  Object.assign(etat, { annee, jour: 0, familles: 50, outils: 4, reserve: 200_000 });
  etat.stockages = { grenier: 0, silo: 0, cave: 0, caveProfonde: 2 };
  return etat;
}

/** Joue, jour par jour, jusqu'à ce que `fin` soit vrai (au plus 40 ans). */
function jouerJusqua(etat: EtatCaves, fin: (etat: EtatCaves) => boolean): void {
  for (let i = 0; i < 40 * 420 && !fin(etat); i++) logique.tick(etat, 1, CTX);
}

/** Joue jusqu'au bilan de l'hiver de l'an `annee`, à la fin de sa soudure. */
function jusquauBilan(etat: EtatCaves, annee: number): void {
  jouerJusqua(etat, (e) => e.annee > annee && !e.soudure);
}

/** Vide la réserve pendant `jours` jours : une rupture forcée, puis la réserve revient. */
function rompre(etat: EtatCaves, jours: number): void {
  const reserve = etat.reserve;
  for (let i = 0; i < jours; i++) {
    etat.reserve = 0;
    logique.tick(etat, 1, CTX);
  }
  etat.reserve = reserve;
}

const cles = (etat: EtatCaves) => etat.registre.map((l) => l.cle);

describe("le seuil des caves", () => {
  it("tombe au bilan du troisième grand hiver de suite, à la fin de la soudure de l'an 17", () => {
    const etat = valleeSure(14);
    jusquauBilan(etat, 15);
    expect(logique.seuil(etat).atteint).toBe(false);
    expect(etat.serie).toBe(2);

    jouerJusqua(etat, (e) => logique.seuil(e).atteint);
    expect(etat.annee).toBe(17);
    // Le seuil tombe au jour exact de la fin de la soudure, au milieu du dernier pas d'un jour.
    expect(etat.jour - finSoudure(etat)).toBeLessThan(1);
    expect(etat.temps - etat.seuilAtteintA!).toBeCloseTo(etat.jour - finSoudure(etat), 6);
    expect(etat.serie).toBe(3);
    expect(etat.registre.slice(-2)).toEqual([
      { cle: "registre.grand-hiver", valeurs: { annee: 16, serie: 3 } },
      { cle: "registre.seuil", valeurs: {} },
    ]);
  });

  it("ne compte pas les hivers qui ne sont pas grands", () => {
    const etat = valleeSure(10);
    jusquauBilan(etat, 13);
    expect(etat.hivers.map((h) => h.annee)).toEqual([10, 11, 12, 13]);
    expect(etat.hivers.every((h) => !h.rupture)).toBe(true);
    expect(etat.serie).toBe(0);
    jusquauBilan(etat, 14);
    expect(etat.serie).toBe(1);
  });

  it("repart de zéro après une rupture en plein grand hiver", () => {
    const etat = valleeSure(14);
    jusquauBilan(etat, 14);
    expect(etat.serie).toBe(1);
    // Au milieu de l'hiver de l'an 15, la réserve se vide cinq jours.
    jouerJusqua(etat, (e) => e.annee === 15 && e.jour >= saisonChaude(15) + dureeHiver(15) / 2);
    rompre(etat, 5);
    jusquauBilan(etat, 15);
    expect(etat.serie).toBe(0);
    expect(cles(etat).slice(-2)).toEqual(["registre.grand-hiver-rupture", "registre.serie-rompue"]);
    expect(etat.registre.at(-2)!.valeurs).toMatchObject({ annee: 15, jours: 5 });
    expect(etat.hivers.at(-1)).toEqual({ annee: 15, rupture: true });

    // Il faut trois nouveaux grands hivers : 16, 17 et 18.
    jouerJusqua(etat, (e) => logique.seuil(e).atteint);
    expect(etat.annee).toBe(19);
    expect(etat.registre.at(-2)!.valeurs).toEqual({ annee: 18, serie: 3 });
  });

  it("compte une rupture pendant la soudure contre l'hiver qui la précède", () => {
    const etat = valleeSure(14);
    jusquauBilan(etat, 15);
    // Premier jour de l'an 17 : l'hiver de l'an 16 n'est pas encore jugé.
    jouerJusqua(etat, (e) => e.annee === 17);
    expect(etat.soudure).toBe(true);
    rompre(etat, 2);
    jusquauBilan(etat, 16);
    expect(logique.seuil(etat).atteint).toBe(false);
    expect(etat.hivers.at(-1)).toEqual({ annee: 16, rupture: true });
    expect(etat.serie).toBe(0);
  });

  it("reste atteint, et le registre n'a plus rien à noter qu'une rupture", () => {
    const etat = valleeSure(14);
    jouerJusqua(etat, (e) => logique.seuil(e).atteint);
    const lignes = etat.registre.length;
    jusquauBilan(etat, 17);
    expect(etat.registre.length).toBe(lignes);
    expect(etat.hivers.at(-1)).toEqual({ annee: 17, rupture: false });

    jouerJusqua(etat, (e) => e.annee === 18 && e.jour >= saisonChaude(18) + 10);
    rompre(etat, 3);
    jusquauBilan(etat, 18);
    expect(logique.seuil(etat).atteint).toBe(true);
    expect(cles(etat).slice(lignes)).toEqual(["registre.grand-hiver-rupture"]);
  });
});

describe("le grand cycle au registre", () => {
  it("note le premier hiver plus long, puis les rations, au premier jour de l'hiver de l'an 5, une seule fois", () => {
    const etat = valleeSure(4);
    jouerJusqua(etat, (e) => e.annee === 5 && e.jour >= saisonChaude(5));
    expect(etat.registre.slice(-2)).toEqual([
      { cle: "registre.hivers-allongent", valeurs: { annee: 5, duree: 80 } },
      { cle: "registre.rations", valeurs: { annee: 5 } },
    ]);
    jouerJusqua(etat, (e) => e.annee === 7);
    expect(cles(etat).filter((c) => c === "registre.hivers-allongent")).toHaveLength(1);
    expect(cles(etat).filter((c) => c === "registre.rations")).toHaveLength(1);
  });

  it("annonce le premier grand hiver, au premier jour de l'hiver de l'an 14", () => {
    const etat = valleeSure(13);
    jouerJusqua(etat, (e) => e.annee === 14 && e.jour >= saisonChaude(14));
    expect(etat.registre.at(-1)).toEqual({
      cle: "registre.grand-hiver-arrive",
      valeurs: { annee: 14 },
    });
  });

  it("garde les 20 derniers hivers jugés", () => {
    const etat = valleeSure(1);
    jusquauBilan(etat, 25);
    expect(etat.hivers).toHaveLength(20);
    expect(etat.hivers[0]!.annee).toBe(6);
  });
});

describe("la migration de l'état", () => {
  it("mène un état de la version 1 à la version 4 : série, seuil et hivers, objets d'en haut, rations", () => {
    const { hivers, serie, seuilAtteintA, objets, rations, ...reste } = etatInitial();
    void [hivers, serie, seuilAtteintA, objets, rations];
    const v1 = { ...reste, bilan: { rupture: false, joursDeRupture: 0, departs: 0 } };
    expect(logique.versionEtat).toBe(4);
    const v2 = logique.migrations[1]!(v1);
    expect(v2).toMatchObject({ hivers: [], serie: 0, seuilAtteintA: null });
    const v3 = logique.migrations[2]!(v2);
    expect(v3).toMatchObject({ objets: { fenetres: false, armoire: false, feuille: false } });
    expect(logique.migrations[3]!(v3)).toEqual(etatInitial());
  });
});

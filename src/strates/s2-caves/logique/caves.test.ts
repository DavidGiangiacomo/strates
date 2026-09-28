import { describe, expect, it } from "vitest";
import type { ContexteTick } from "../../../noyau/logique/types";
import { logique, type ActionCaves } from ".";
import { etatInitial, TAILLE_HISTORIQUE, type EtatCaves } from "./etat";
import {
  capacite,
  FAMILLES_FONDATRICES,
  finSoudure,
  marqueHiver,
  saisonChaude,
  VALLEE,
} from "./regles";

function contexte(multiplicateurs: Record<string, number> = {}): ContexteTick {
  return {
    effets: { multiplicateur: (levier) => multiplicateurs[levier] ?? 1, niveau: () => null },
    emettre: () => {},
  };
}

const CTX = contexte();

function agir(etat: EtatCaves, action: ActionCaves, ctx = CTX): void {
  logique.agir(etat, action, ctx);
}

/** Fait passer `jours` jours, par pas de `pas` comme le noyau (0,1 s par tick). */
function jouer(etat: EtatCaves, jours: number, pas = 0.1): void {
  const n = Math.round(jours / pas);
  for (let i = 0; i < n; i++) logique.tick(etat, pas, CTX);
}

/** Joue jusqu'au bilan de l'hiver de l'an `annee`, à la fin de sa soudure. */
function jusquauBilan(etat: EtatCaves, annee: number): void {
  while (etat.annee <= annee || etat.soudure) logique.tick(etat, 0.1, CTX);
}

/** Une vallée assez grande pour ne jamais déborder. */
function avecCaves(etat: EtatCaves, caves = 10): EtatCaves {
  etat.stockages.cave = caves;
  return etat;
}

/** La dernière ligne du registre, hors celles que le premier bilan ajoute (les pertes, l'éveil des objets). */
const derniereLigne = (etat: EtatCaves) =>
  etat.registre.filter((l) => l.cle !== "registre.pertes" && l.cle !== "registre.eveil").at(-1)!;

describe("l'arrivée dans les caves", () => {
  it("se fait à la fin du printemps de l'an 1, avec 8 familles, 250 boisseaux et un grenier", () => {
    const etat = logique.etatInitial({ graine: 1, journal: { strates: [] } });
    expect(etat).toMatchObject({ annee: 1, jour: 70, familles: 8, reserve: 250, soudure: false });
    expect(etat.stockages).toEqual({ grenier: 1, silo: 0, cave: 0, caveProfonde: 0 });
    expect(capacite(etat)).toBe(400);
    expect(derniereLigne(etat).cle).toBe("registre.arrivee");
    expect(logique.valeurConvertible(etat)).toBe(0);
    expect(logique.seuil(etat).atteint).toBe(false);
  });

  it("déclare ses leviers et sa politique hors-ligne propre", () => {
    expect(logique.leviers).toEqual({ principal: "recolte", secondaires: ["conservation"] });
    expect(logique.horsLigne.type).toBe("propre");
    expect(logique.absence).toBeTypeOf("function");
  });
});

describe("les actions", () => {
  it("glaner rapporte du grain en saison chaude, et rien en hiver", () => {
    const etat = etatInitial();
    agir(etat, { type: "glaner" });
    expect(etat.reserve).toBeCloseTo(250 + Math.sin(Math.PI / 5), 9);
    expect(etat.cumul).toBeCloseTo(Math.sin(Math.PI / 5), 9);

    const hiver = { ...etatInitial(), jour: 360 };
    agir(hiver, { type: "glaner" });
    expect(hiver.reserve).toBe(250);
    expect(hiver.cumul).toBe(0);
  });

  it("installer une famille coûte 25, puis 27 boisseaux", () => {
    const etat = etatInitial();
    agir(etat, { type: "installer" });
    agir(etat, { type: "installer" });
    expect(etat.familles).toBe(10);
    expect(etat.installees).toBe(2);
    expect(etat.reserve).toBe(250 - 25 - 27);
  });

  it("refuse un achat trop cher, sans erreur", () => {
    const etat = { ...etatInitial(), reserve: 100 };
    agir(etat, { type: "construire", stockage: "silo" });
    agir(etat, { type: "outil" });
    expect(etat.outils).toBe(0);
    expect(etat.stockages.silo).toBe(0);
    expect(etat.reserve).toBe(100);
  });

  it("refuse d'installer une famille dans une vallée pleine", () => {
    const etat = { ...etatInitial(), familles: VALLEE, reserve: 1_000 };
    agir(etat, { type: "installer" });
    expect(etat.familles).toBe(VALLEE);
    expect(etat.reserve).toBe(1_000);
  });

  it("construire un grenier ajoute 400 boisseaux de capacité", () => {
    const etat = etatInitial();
    agir(etat, { type: "construire", stockage: "grenier" });
    expect(etat.stockages.grenier).toBe(2);
    expect(capacite(etat)).toBe(800);
    expect(etat.reserve).toBe(250 - 92);
  });

  it("achète les outils dans l'ordre, puis plus rien", () => {
    const etat = { ...etatInitial(), reserve: 100_000 };
    for (let i = 0; i < 6; i++) agir(etat, { type: "outil" });
    expect(etat.outils).toBe(4);
    expect(etat.reserve).toBe(100_000 - 150 - 1_200 - 6_000 - 40_000);
  });

  it("note chaque achat sur la courbe de la réserve", () => {
    const etat = etatInitial();
    jouer(etat, 12);
    agir(etat, { type: "installer" });
    agir(etat, { type: "glaner" });
    expect(etat.historique.achats).toHaveLength(1);
    expect(etat.historique.achats[0]).toBeCloseTo(12, 6);
  });
});

describe("le temps qui passe", () => {
  it("fait déborder le grain au-delà de la capacité, sans l'ôter du cumul", () => {
    const etat = etatInitial();
    jouer(etat, 150);
    expect(etat.reserve).toBe(400);
    expect(etat.pertes.debord).toBeGreaterThan(0);
    expect(etat.cumul).toBeGreaterThan(etat.reserve - 250 + etat.pertes.debord);
  });

  it("arrive à l'hiver au jour 350, puis à l'an 2 et à sa soudure", () => {
    const etat = avecCaves(etatInitial());
    jouer(etat, 280);
    expect(etat.jour).toBeCloseTo(350, 6);
    expect(etat.annee).toBe(1);
    jouer(etat, 70.2);
    expect(etat.annee).toBe(2);
    expect(etat.soudure).toBe(true);
    expect(etat.temps).toBeCloseTo(350.2, 6);
  });

  it("garde un point d'historique tous les 5 jours, sur 3 ans au plus", () => {
    const etat = avecCaves(etatInitial());
    jouer(etat, 12);
    expect(etat.historique.reserve).toHaveLength(2);
    jouer(etat, 1_400, 1);
    expect(etat.historique.reserve).toHaveLength(TAILLE_HISTORIQUE);
  });

  it("donne presque le même résultat avec des pas d'un jour", () => {
    const court = avecCaves(etatInitial());
    const long = avecCaves(etatInitial());
    for (const e of [court, long]) {
      agir(e, { type: "installer" });
      e.familles = 20;
    }
    jouer(court, 700, 0.1);
    jouer(long, 700, 1);
    expect(long.annee).toBe(court.annee);
    expect(long.cumul).toBeCloseTo(court.cumul, 6);
    expect(Math.abs(long.reserve - court.reserve)).toBeLessThan(1e-3 * court.reserve);
  });

  it("est déterministe", () => {
    const partie = () => {
      const etat = avecCaves(etatInitial(), 1);
      for (let jour = 0; jour < 900; jour++) {
        if (jour % 7 === 0) agir(etat, { type: "installer" });
        if (jour % 50 === 0) agir(etat, { type: "outil" });
        jouer(etat, 1);
      }
      return JSON.stringify(etat);
    };
    expect(partie()).toBe(partie());
  });
});

describe("la rupture et le bilan de l'hiver", () => {
  it("fait partir 0,5 % des familles par jour de rupture, puis les note au bilan", () => {
    const etat = { ...avecCaves(etatInitial()), familles: 40, reserve: 0, jour: 350 };
    jouer(etat, 10);
    expect(etat.bilan.rupture).toBe(true);
    expect(etat.bilan.joursDeRupture).toBeCloseTo(10, 6);
    expect(etat.familles).toBeCloseTo(40 * 0.995 ** 10, 6);

    jusquauBilan(etat, 1);
    const ligne = derniereLigne(etat);
    expect(ligne.cle).toBe("registre.rupture");
    expect(ligne.valeurs.annee).toBe(1);
    expect(ligne.valeurs.jours).toBeGreaterThan(70);
    expect(etat.bilan).toEqual({ rupture: false, joursDeRupture: 0, departs: 0 });
  });

  it("ne fait jamais partir les familles fondatrices", () => {
    const etat = { ...etatInitial(), familles: 9, reserve: 0, jour: 350 };
    jouer(etat, 70);
    expect(etat.familles).toBe(FAMILLES_FONDATRICES);
    const fondatrices = { ...etatInitial(), reserve: 0, jour: 350 };
    jouer(fondatrices, 70);
    expect(fondatrices.familles).toBe(FAMILLES_FONDATRICES);
  });

  it("commence la rupture au moment où la réserve touche le fond", () => {
    const etat = { ...avecCaves(etatInitial()), familles: 40, reserve: 100, jour: 350 };
    jouer(etat, 10);
    // 100 boisseaux nourrissent 40 familles pendant 2,5 jours, moins les pertes des caves.
    expect(etat.bilan.joursDeRupture).toBeCloseTo(7.5, 1);
  });

  it("compte la soudure dans l'hiver qui la précède", () => {
    const etat = avecCaves({ ...etatInitial(), familles: 40, jour: 350 });
    etat.reserve = 40 * 70 + 1;
    jusquauBilan(etat, 1);
    expect(derniereLigne(etat).cle).toBe("registre.rupture");
    expect(etat.annee).toBe(2);
    expect(etat.jour).toBeCloseTo(finSoudure(etat), 1);
  });

  it("fait naître 10 % de familles après un hiver sans rupture, dans la limite de la vallée", () => {
    const etat = avecCaves({ ...etatInitial(), familles: 40, jour: 350 });
    etat.reserve = marqueHiver(etat);
    jusquauBilan(etat, 1);
    expect(derniereLigne(etat)).toEqual({
      cle: "registre.sans-rupture",
      valeurs: { annee: 1, naissances: 4 },
    });
    expect(etat.familles).toBeCloseTo(44, 9);

    const pleine = avecCaves({ ...etatInitial(), familles: 240, jour: 350 }, 3);
    pleine.reserve = marqueHiver(pleine);
    jusquauBilan(pleine, 1);
    expect(pleine.familles).toBe(VALLEE);
  });
});

describe("la marque d'hiver", () => {
  function premierJourDHiver(outils: number) {
    const etat = avecCaves({ ...etatInitial(), familles: 50, outils });
    etat.jour = saisonChaude(etat.annee);
    return etat;
  }

  it("suffit tout juste à passer l'hiver et sa soudure", () => {
    for (const outils of [0, 2, 4]) {
      const etat = premierJourDHiver(outils);
      const marque = marqueHiver(etat);
      etat.reserve = marque;
      jusquauBilan(etat, 1);
      expect(derniereLigne(etat).cle).toBe("registre.sans-rupture");
    }
  });

  it("ne laisse pas de marge : 1 % de moins, et le grain manque", () => {
    const etat = premierJourDHiver(1);
    etat.reserve = marqueHiver(etat) * 0.99;
    jusquauBilan(etat, 1);
    expect(derniereLigne(etat).cle).toBe("registre.rupture");
  });
});

describe("les artefacts", () => {
  it("multiplient la récolte et la capacité des stockages, après le premier hiver", () => {
    const ctx = contexte({ recolte: 2, conservation: 1.5 });
    const avec = avecCaves(etatInitial());
    const sans = avecCaves(etatInitial());
    for (const e of [avec, sans]) e.hivers = [{ annee: 1, rupture: false }];
    logique.tick(avec, 1, ctx);
    logique.tick(sans, 1, CTX);
    expect(avec.multiplicateurs).toEqual({ recolte: 2, conservation: 1.5 });
    expect(avec.cumul).toBeCloseTo(2 * sans.cumul, 9);
    expect(capacite(avec)).toBeCloseTo(1.5 * capacite(sans), 9);
  });
});

describe("l'absence : l'hiver vous attend", () => {
  const absence = (etat: EtatCaves, secondes: number) => logique.absence!(etat, secondes, CTX);

  it("ne compte pas en hiver : le calendrier s'arrête", () => {
    const etat = { ...etatInitial(), jour: 360 };
    const avant = JSON.stringify(etat);
    expect(absence(etat, 8 * 3600).lignes).toEqual(["L'hiver vous attendait : rien n'a bougé."]);
    expect(JSON.stringify(etat)).toBe(avant);
  });

  it("compte à 80 % pendant la saison chaude", () => {
    const etat = avecCaves(etatInitial());
    const { lignes } = absence(etat, 60);
    expect(etat.temps).toBeCloseTo(48, 9);
    expect(etat.jour).toBeCloseTo(118, 9);
    expect(lignes).toHaveLength(1);
    expect(lignes[0]).toMatch(/^La récolte a continué 48\u00a0jours : \d+\u00a0boisseaux\.$/);
  });

  it("s'arrête au premier jour de l'hiver", () => {
    const etat = avecCaves(etatInitial());
    const { lignes } = absence(etat, 8 * 3600);
    expect(etat.jour).toBe(350);
    expect(etat.temps).toBeCloseTo(280, 6);
    expect(etat.bilan.rupture).toBe(false);
    expect(lignes.at(-1)).toBe("Les premiers froids sont là. L'hiver vous attend.");
  });

  it("s'arrête à la veille d'une rupture, et n'en provoque jamais", () => {
    // Fin d'automne : 50 familles, et la récolte ne couvre plus ce qu'elles mangent.
    const etat = { ...avecCaves(etatInitial()), familles: 50, jour: 330, reserve: 100 };
    const { lignes } = absence(etat, 3600);
    expect(etat.bilan.rupture).toBe(false);
    expect(etat.jour).toBeLessThan(335);
    expect(etat.reserve).toBeGreaterThan(0);
    expect(lignes.at(-1)).toBe("Le grain allait manquer : le calendrier s'est arrêté.");

    const vide = { ...etatInitial(), familles: 50, jour: 330, reserve: 0 };
    expect(absence(vide, 3600).lignes).toEqual([
      "Le grain allait manquer : le calendrier s'est arrêté.",
    ]);
    expect(vide.temps).toBe(0);
  });
});

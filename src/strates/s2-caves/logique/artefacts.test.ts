// Les objets de la surface dans les caves (fiche, § 8 ; docs/artefacts.md, § 8).
import { describe, expect, it } from "vitest";
import { creerEtatNoyau } from "../../../noyau/logique/etat";
import { Noyau } from "../../../noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../../../noyau/logique/registre";
import type { ContexteTick } from "../../../noyau/logique/types";
import { logique } from ".";
import { etatInitial, type EtatCaves } from "./etat";
import {
  capacite,
  CONSOMMATION_PAR_FAMILLE,
  coutFamille,
  coutStockage,
  JOURS_PAR_AN,
  OBJETS,
  prochainOutil,
  recolteParFamille,
  saisonChaude,
  STOCKAGES,
} from "./regles";
import type { ActionCaves } from ".";

/** Un contexte où agissent, puissants, les objets `possedes`, avec ces multiplicateurs. */
function contexte(possedes: string[], multiplicateurs: Record<string, number> = {}): ContexteTick {
  return {
    effets: {
      multiplicateur: (levier) => multiplicateurs[levier] ?? 1,
      niveau: (id) => (possedes.includes(id) ? "puissant" : null),
    },
    emettre: () => {},
  };
}

const NEUTRE = contexte([]);
const TOUT = contexte(
  ["s1-equipe", "s1-double-ecran", "s1-serveur", "s1-filiale", "s1-turbine", "s1-plan"],
  { recolte: 1.8, conservation: 1.5 },
);

/** Une vallée qui ne déborde pas. */
function vallee(): EtatCaves {
  const etat = etatInitial();
  etat.stockages.cave = 10;
  return etat;
}

/** Joue jusqu'au bilan de l'hiver de l'an `annee`, jour par jour. */
function jusquauBilan(etat: EtatCaves, annee: number, ctx: ContexteTick): void {
  for (let i = 0; i < 40 * 420 && (etat.annee <= annee || etat.soudure); i++) {
    logique.tick(etat, 1, ctx);
  }
}

const cles = (etat: EtatCaves) => etat.registre.map((l) => l.cle);

describe("les multiplicateurs de la surface", () => {
  it("dorment jusqu'au bilan du premier hiver : la première année se joue comme sans objets", () => {
    const avec = vallee();
    const sans = vallee();
    for (let jour = 0; jour < 200; jour++) {
      logique.tick(avec, 1, TOUT);
      logique.tick(sans, 1, NEUTRE);
    }
    expect(avec.multiplicateurs).toEqual({ recolte: 1, conservation: 1 });
    expect(avec.cumul).toBe(sans.cumul);
    expect(capacite(avec)).toBe(capacite(sans));
  });

  it("s'éveillent au premier bilan, et le registre nomme chaque objet éveillé", () => {
    const etat = vallee();
    jusquauBilan(etat, 1, TOUT);
    const eveils = etat.registre.filter((l) => l.cle === "registre.eveil");
    expect(eveils.map((l) => l.objet)).toEqual([...OBJETS.multiplicateurs]);

    logique.tick(etat, 1, TOUT);
    expect(etat.multiplicateurs).toEqual({ recolte: 1.8, conservation: 1.5 });
    expect(capacite(etat)).toBe(1.5 * (400 + 10 * 20_000));
  });

  it("n'éveillent que les objets emportés", () => {
    const etat = vallee();
    jusquauBilan(etat, 1, contexte(["s1-turbine", "s1-serveur"], { recolte: 1.5 }));
    const eveils = etat.registre.filter((l) => l.cle === "registre.eveil");
    expect(eveils).toEqual([{ cle: "registre.eveil", valeurs: {}, objet: "s1-turbine" }]);
  });

  it("ne réveillent rien aux bilans suivants", () => {
    const etat = vallee();
    jusquauBilan(etat, 2, TOUT);
    expect(cles(etat).filter((c) => c === "registre.eveil")).toHaveLength(3);
    expect(cles(etat).filter((c) => c === "registre.pertes")).toHaveLength(1);
  });
});

describe("le premier bilan", () => {
  it("révèle le grain pourri depuis l'arrivée, avec ou sans objets", () => {
    const etat = vallee();
    jusquauBilan(etat, 1, NEUTRE);
    const pertes = etat.registre.find((l) => l.cle === "registre.pertes");
    expect(pertes?.valeurs.pourri).toBeGreaterThan(0);
    expect(pertes?.valeurs.pourri).toBeLessThanOrEqual(etat.pertes.pourri);
    expect(cles(etat)).not.toContain("registre.eveil");
  });
});

describe("les autres objets", () => {
  it("agissent dès l'arrivée : les deux fenêtres, l'armoire, la feuille", () => {
    const etat = vallee();
    logique.agir(etat, { type: "glaner" }, TOUT);
    expect(etat.objets).toEqual({ fenetres: true, armoire: true, feuille: true });
    logique.tick(etat, 1, NEUTRE);
    expect(etat.objets).toEqual({ fenetres: false, armoire: false, feuille: false });
  });

  it("la feuille qui annonce écrit une ligne de l'atelier au seuil, et seulement si elle est là", () => {
    const seuil = (ctx: ContexteTick) => {
      const etat = vallee();
      Object.assign(etat, { annee: 14, jour: 0, familles: 50, outils: 4, reserve: 200_000 });
      etat.hivers = [{ annee: 13, rupture: false }];
      etat.stockages.caveProfonde = 2;
      for (let i = 0; i < 5 * 420 && !logique.seuil(etat).atteint; i++) logique.tick(etat, 1, ctx);
      return etat;
    };
    const avec = seuil(contexte(["s1-plan"]));
    // Elle est nommée quand elle agit, juste avant sa ligne (docs/strates/descente-1-2.md, § 6).
    expect(avec.registre.slice(-3)).toEqual([
      { cle: "registre.seuil", valeurs: {} },
      { cle: "registre.eveil", valeurs: {}, objet: "s1-plan" },
      { cle: "registre.feuille", valeurs: {} },
    ]);
    expect(cles(seuil(NEUTRE))).not.toContain("registre.feuille");
  });
});

describe("l'arrivée", () => {
  const arrivee = (ctx: ContexteTick) =>
    logique.etatInitial({ graine: 1, journal: { strates: [] }, effets: ctx.effets });

  it("nomme sur la première page les objets qui agissent déjà, et compte ceux qui attendent", () => {
    const etat = arrivee(TOUT);
    expect(etat.registre).toEqual([
      { cle: "registre.arrivee", valeurs: { annee: 1, familles: 8 } },
      { cle: "registre.eveil", valeurs: {}, objet: "s1-double-ecran" },
      { cle: "registre.eveil", valeurs: {}, objet: "s1-serveur" },
      // Les trois multiplicateurs et la feuille.
      { cle: "registre.attente", valeurs: { objets: 4 } },
    ]);
    // Leurs effets sont là dès la première image, avant le premier tick.
    expect(etat.objets).toEqual({ fenetres: true, armoire: true, feuille: true });
    expect(etat.multiplicateurs).toEqual({ recolte: 1, conservation: 1 });
  });

  it("accorde la ligne des objets qui attendent", () => {
    const etat = arrivee(contexte(["s1-serveur", "s1-turbine"]));
    expect(etat.registre.slice(1)).toEqual([
      { cle: "registre.eveil", valeurs: {}, objet: "s1-serveur" },
      { cle: "registre.attente.un", valeurs: { objets: 1 } },
    ]);
  });

  it("n'écrit que la ligne d'arrivée sans objets de la surface", () => {
    expect(arrivee(NEUTRE).registre).toEqual(etatInitial().registre);
    expect(logique.etatInitial({ graine: 1, journal: { strates: [] } })).toEqual(etatInitial());
  });
});

describe("le choc d'arrivée", () => {
  /**
   * Le joueur réflexe qui achète au meilleur rendement : de la place quand c'est plein, sinon la
   * famille ou l'outil qui se rembourse le plus vite. C'est lui que les objets, agissant dès
   * l'arrivée, faisaient passer les premiers hivers sans rien apprendre (docs/artefacts.md, § 8).
   */
  function rendement(e: EtatCaves): ActionCaves | null {
    const grenier = coutStockage(STOCKAGES[0], e.stockages.grenier);
    if (e.reserve >= 0.95 * capacite(e) && e.reserve >= grenier) {
      return { type: "construire", stockage: "grenier" };
    }
    const an = (saisonChaude(e.annee) * 2) / Math.PI;
    const gainFamille = recolteParFamille(e) * an - CONSOMMATION_PAR_FAMILLE * JOURS_PAR_AN;
    const options: [number, number, ActionCaves][] = [
      [coutFamille(e) / Math.max(gainFamille, 1e-9), coutFamille(e), { type: "installer" }],
    ];
    const outil = prochainOutil(e);
    if (outil) {
      const gain = e.familles * recolteParFamille(e) * (outil.facteur - 1) * an;
      options.push([outil.cout / gain, outil.cout, { type: "outil" }]);
    }
    options.sort((a, b) => a[0] - b[0]);
    const [, cout, action] = options[0]!;
    return e.reserve >= cout ? action : null;
  }

  it("survit aux objets d'un jeu correct : le joueur réflexe manque encore le premier hiver", () => {
    const etat = etatInitial();
    let premiereRupture: number | null = null;
    for (let t = 0; t < 7 * 60 && premiereRupture === null; t++) {
      for (let i = 0; i < 50; i++) {
        const action = rendement(etat);
        const avant = etat.reserve;
        if (!action) break;
        logique.agir(etat, action, TOUT);
        if (etat.reserve === avant) break;
      }
      for (let k = 0; k < 10; k++) logique.tick(etat, 0.1, TOUT);
      if (etat.bilan.rupture) premiereRupture = t + 1;
    }
    expect(premiereRupture).not.toBeNull();
    expect(premiereRupture!).toBeLessThan(5 * 60);
  });
});

describe("à travers le noyau, avec les six objets de la surface", () => {
  it("reçoivent récolte × 1,8 et conservation × 1,5 après le premier hiver, et tous les autres effets", async () => {
    const registre = new Registre();
    registre.enregistrer(2, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
    const etatNoyau = creerEtatNoyau(1, 0);
    etatNoyau.profondeur = 2;
    etatNoyau.artefacts = [
      "s1-equipe",
      "s1-double-ecran",
      "s1-serveur",
      "s1-filiale",
      "s1-turbine",
      "s1-plan",
    ];
    const noyau = new Noyau(registre, etatNoyau);
    await noyau.demarrer(0);
    const etat = noyau.etatStrate as EtatCaves;
    // Le plafond × 4 n'est pas atteint : 1,2 × 1,5 × 1,5 = 2,7 (I2).
    expect(noyau.effets.plafonne).toBe(false);

    noyau.avancer(1);
    expect(etat.multiplicateurs).toEqual({ recolte: 1, conservation: 1 });
    expect(etat.objets).toEqual({ fenetres: true, armoire: true, feuille: true });

    while (etat.hivers.length === 0) noyau.avancer(1);
    noyau.avancer(1);
    expect(etat.multiplicateurs.recolte).toBeCloseTo(1.8, 12);
    expect(etat.multiplicateurs.conservation).toBe(1.5);
    // Deux objets nommés à l'arrivée, trois au premier bilan.
    expect(etat.registre.filter((l) => l.cle === "registre.eveil").map((l) => l.objet)).toEqual([
      "s1-double-ecran",
      "s1-serveur",
      ...OBJETS.multiplicateurs,
    ]);
  });
});

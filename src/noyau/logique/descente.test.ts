// La descente, vue du noyau (#30 ; docs/architecture.md § 6, docs/strates/descente-1-2.md) : la
// fouille s'ouvre, la strate se fige, le joueur rebouche ou descend, et tout s'engage d'un coup.
import { describe, expect, it } from "vitest";
import {
  creerLogiqueFactice,
  type ActionFactice,
  type EtatFactice,
} from "../../strates/factice/logique";
import {
  catalogueParCout,
  ouvrirFouille,
  pointsDeFouille,
  preselection,
  valeurPourPoints,
} from "./artefacts";
import { creerEtatNoyau } from "./etat";
import { Noyau } from "./noyau";
import { Registre, type ChargeurStrate, type StrateQuelconque } from "./registre";
import { ecrireSauvegarde, lireSauvegarde } from "./sauvegarde";
import type { ContexteArrivee, LogiqueStrate, NumeroStrate } from "./types";

type LogiqueFactice = LogiqueStrate<EtatFactice, ActionFactice>;

const S = 1000;
const H = 3600 * S;
/** L'heure de départ de chaque partie (ms). */
const DEBUT = 1_000 * H;
/** Le cumul d'un joueur correct au seuil de la surface : 12 points (docs/strates/strate-1.md, § 9). */
const CUMUL_SURFACE = 6.12e8;

const definition = (logique: LogiqueFactice) =>
  ({ logique, vue: null, textes: {} }) as StrateQuelconque;

/** Un registre des strates factices, aux profondeurs données. */
function registreDe(
  logiques: LogiqueFactice[],
  chargeurs: Partial<Record<NumeroStrate, ChargeurStrate>> = {},
): Registre {
  const registre = new Registre();
  for (const logique of logiques) {
    registre.enregistrer(
      logique.numero,
      chargeurs[logique.numero] ?? (async () => definition(logique)),
    );
  }
  return registre;
}

async function partie(
  logiques = [creerLogiqueFactice(1), creerLogiqueFactice(2)],
  chargeurs: Partial<Record<NumeroStrate, ChargeurStrate>> = {},
): Promise<Noyau> {
  const noyau = new Noyau(registreDe(logiques, chargeurs), creerEtatNoyau(1, DEBUT));
  await noyau.demarrer(DEBUT);
  return noyau;
}

const etatDe = (noyau: Noyau) => noyau.etatStrate as EtatFactice;
const journal = (noyau: Noyau) => noyau.etat.meta.journal.strates;

/** Amène la strate courante à son seuil, avec le cumul d'un joueur correct à la surface. */
function auSeuil(noyau: Noyau, cumul = CUMUL_SURFACE): void {
  etatDe(noyau).cumul = cumul;
  noyau.tick(0);
}

describe("la conversion affichée", () => {
  it("donne la valeur qu'il faut pour chaque nombre de points", () => {
    for (let n = 1; n <= 30; n++) {
      expect(pointsDeFouille(valeurPourPoints(n))).toBe(n);
      expect(pointsDeFouille(valeurPourPoints(n) * 0.999)).toBe(n - 1);
    }
    expect(valeurPourPoints(0)).toBe(0);
    // 12 points dès 373 M cr, 13 dès 1,93 Md cr : chaque point coûte environ cinq fois le précédent.
    expect(valeurPourPoints(12)).toBeCloseTo(3.728e8, -6);
    expect(valeurPourPoints(13)).toBeCloseTo(1.931e9, -7);
  });

  it("présente le catalogue par coût croissant, à coût égal dans l'ordre de la table", () => {
    expect(catalogueParCout(1).map((a) => [a.id, a.cout])).toEqual([
      ["s1-equipe", 1],
      ["s1-double-ecran", 2],
      ["s1-serveur", 2],
      ["s1-filiale", 3],
      ["s1-turbine", 4],
      ["s1-plan", 5],
    ]);
  });

  it("ouvre la fouille de la surface : 12 points, le prix du 13ᵉ, et cinq objets présélectionnés", () => {
    const fouille = ouvrirFouille(1, CUMUL_SURFACE);
    expect(fouille).toMatchObject({ strate: 1, valeur: CUMUL_SURFACE, points: 12 });
    expect(fouille.pointSuivant).toBeCloseTo(valeurPourPoints(13), 0);
    expect(fouille.catalogue).toHaveLength(6);
    expect(fouille.preselection).toEqual(preselection(12, 1));
    expect(fouille.preselection).not.toContain("s1-plan");
  });
});

describe("la fouille", () => {
  it("ne s'ouvre qu'au seuil", async () => {
    const noyau = await partie();
    expect(() => noyau.ouvrirFouille()).toThrow(/seuil/);
    expect(noyau.suspendu).toBe(false);
    auSeuil(noyau);
    expect(noyau.ouvrirFouille()).toMatchObject({ strate: 1, points: 12 });
    expect(noyau.fouille?.points).toBe(12);
  });

  it("ne s'ouvre pas s'il n'y a pas de strate dessous", async () => {
    const noyau = await partie([creerLogiqueFactice(1)]);
    auSeuil(noyau);
    expect(noyau.demanderFouille()).toBe(true);
    expect(noyau.strateSuivante).toBeNull();
    expect(() => noyau.ouvrirFouille()).toThrow(/Aucune strate/);
    expect(noyau.suspendu).toBe(false);
  });

  it("applique les actions en attente avant de lire la valeur", async () => {
    const noyau = await partie();
    auSeuil(noyau);
    noyau.agir({ type: "produire" });
    expect(noyau.ouvrirFouille().valeur).toBe(CUMUL_SURFACE + 1);
  });

  it("fige la strate : ni tick, ni absence, et la référence d'horloge suit", async () => {
    const noyau = await partie();
    auSeuil(noyau);
    etatDe(noyau).generateurs = 1;
    noyau.ouvrirFouille();
    const avant = JSON.stringify(noyau.etat);

    expect(noyau.avancer(10)).toBe(0);
    noyau.tick(5);
    expect(noyau.rattraper(DEBUT + H)).toEqual({ type: "aucune" });
    expect(noyau.avancerJusqua(DEBUT + 2 * H, 0.1)).toEqual({ type: "aucune" });

    const apres = JSON.parse(JSON.stringify(noyau.etat)) as typeof noyau.etat;
    expect(apres.reference).toBe(DEBUT + 2 * H);
    apres.reference = JSON.parse(avant).reference;
    expect(JSON.stringify(apres)).toBe(avant);
  });

  it("se rebouche sans rien noter : la strate reprend, et les points sont relus à la réouverture", async () => {
    const noyau = await partie();
    auSeuil(noyau);
    noyau.ouvrirFouille();
    noyau.reboucher();
    expect(noyau.fouille).toBeNull();
    expect(noyau.suspendu).toBe(false);
    expect(journal(noyau)[0]?.fouille).toBeUndefined();
    expect(noyau.etat.artefacts).toEqual([]);

    etatDe(noyau).cumul = valeurPourPoints(13);
    noyau.tick(0);
    expect(noyau.ouvrirFouille().points).toBe(13);
  });

  it("ne reprend pas tant qu'elle est ouverte", async () => {
    const noyau = await partie();
    auSeuil(noyau);
    noyau.ouvrirFouille();
    expect(() => noyau.reprendre()).toThrow(/descendre ou reboucher/);
  });
});

describe("le seuil au journal", () => {
  it("est noté une fois, à l'heure où il est atteint", async () => {
    const noyau = await partie();
    noyau.avancerJusqua(DEBUT + 10 * S, 0.1);
    expect(journal(noyau)[0]?.seuil).toBeUndefined();
    auSeuil(noyau);
    expect(journal(noyau)[0]?.seuil).toEqual({ le: DEBUT + 10 * S });
    noyau.avancerJusqua(DEBUT + 20 * S, 0.1);
    expect(journal(noyau)[0]?.seuil).toEqual({ le: DEBUT + 10 * S });
  });

  it("garde l'issue de la strate, quand elle en a plusieurs", async () => {
    const logique: LogiqueFactice = {
      ...creerLogiqueFactice(1),
      seuil: (e) => ({ atteint: e.cumul >= 1000, issue: "defaut" }),
    };
    const noyau = await partie([logique, creerLogiqueFactice(2)]);
    auSeuil(noyau);
    expect(journal(noyau)[0]?.seuil).toEqual({ le: DEBUT, issue: "defaut" });
  });
});

describe("la descente", () => {
  const EMPORTES = ["s1-equipe", "s1-serveur", "s1-turbine"];

  it("engage tout d'un coup : journal, artefacts, Profondeur, nouvelle strate", async () => {
    const noyau = await partie();
    auSeuil(noyau);
    noyau.ouvrirFouille();
    const surface = JSON.stringify(noyau.etat.strates[1]);

    const fouille = await noyau.descendre(DEBUT + H, EMPORTES);

    expect(fouille).toEqual({
      points: 12,
      emportes: EMPORTES,
      abandonnes: ["s1-double-ecran", "s1-filiale", "s1-plan"],
    });
    expect(noyau.etat.profondeur).toBe(2);
    expect(noyau.etat.artefacts).toEqual(EMPORTES);
    expect(noyau.strate.logique.numero).toBe(2);
    expect(noyau.fouille).toBeNull();
    // L'état de la surface est gardé tel quel, pour la remontée finale et la coupe (§15).
    expect(JSON.stringify(noyau.etat.strates[1])).toBe(surface);
    expect(etatDe(noyau)).toMatchObject({ unites: 0, cumul: 0, generateurs: 0 });

    expect(journal(noyau)).toMatchObject([
      { strate: 1, seuil: { le: DEBUT }, fouille },
      { strate: 2, arrivee: DEBUT + H, tempsDeJeu: 0, tempsHorsLigne: 0 },
    ]);
    expect(noyau.etat.reference).toBe(DEBUT + H);
  });

  it("applique les effets des objets emportés dans la nouvelle strate", async () => {
    const noyau = await partie();
    auSeuil(noyau);
    noyau.ouvrirFouille();
    await noyau.descendre(DEBUT, EMPORTES);
    // Les bras en plus et la roue chaude, puissants en profondeur 2 : production × 1,2 × 1,5.
    expect(noyau.effets.multiplicateur("production")).toBeCloseTo(1.8, 12);
    expect(noyau.effets.niveau("s1-serveur")).toBe("puissant");
  });

  it("donne les effets à l'arrivée, pour que la strate écrive ce qui agit déjà", async () => {
    const vus: (string | null)[] = [];
    const caves: LogiqueFactice = {
      ...creerLogiqueFactice(2),
      etatInitial(ctx: ContexteArrivee) {
        vus.push(ctx.effets?.niveau("s1-serveur") ?? null);
        return creerLogiqueFactice(2).etatInitial(ctx);
      },
    };
    const noyau = await partie([creerLogiqueFactice(1), caves]);
    auSeuil(noyau);
    noyau.ouvrirFouille();
    await noyau.descendre(DEBUT, EMPORTES);
    expect(vus).toEqual(["puissant"]);
  });

  it("laisse la nouvelle strate figée jusqu'à la fin de la transition", async () => {
    const noyau = await partie();
    auSeuil(noyau);
    noyau.ouvrirFouille();
    await noyau.descendre(DEBUT, []);
    etatDe(noyau).generateurs = 1;
    expect(noyau.suspendu).toBe(true);
    expect(noyau.avancer(5)).toBe(0);
    expect(etatDe(noyau).cumul).toBe(0);

    noyau.reprendre();
    expect(noyau.avancer(5)).toBe(50);
    expect(etatDe(noyau).cumul).toBeCloseTo(5, 9);
  });

  it("permet de n'emporter aucun objet, et perd les points qui restent", async () => {
    const noyau = await partie();
    auSeuil(noyau);
    noyau.ouvrirFouille();
    const fouille = await noyau.descendre(DEBUT, []);
    expect(fouille).toMatchObject({ points: 12, emportes: [] });
    expect(fouille.abandonnes).toHaveLength(6);
    expect(noyau.etat.artefacts).toEqual([]);
  });

  it("refuse un choix trop cher sans rien changer", async () => {
    const noyau = await partie();
    auSeuil(noyau);
    noyau.ouvrirFouille();
    const avant = JSON.stringify(noyau.etat);
    await expect(
      noyau.descendre(DEBUT, ["s1-plan", "s1-turbine", "s1-filiale", "s1-serveur"]),
    ).rejects.toThrow(/14 points de fouille, pour 12/);
    expect(JSON.stringify(noyau.etat)).toBe(avant);
    expect(noyau.fouille).not.toBeNull();
  });

  it("refuse de descendre sans fouille ouverte", async () => {
    const noyau = await partie();
    auSeuil(noyau);
    await expect(noyau.descendre(DEBUT, [])).rejects.toThrow(/pas ouverte/);
    expect(noyau.etat.profondeur).toBe(1);
  });

  it("ne change rien si la strate suivante ne se charge pas, et peut réessayer", async () => {
    let echecs = 1;
    const caves = creerLogiqueFactice(2);
    const noyau = await partie([creerLogiqueFactice(1), caves], {
      2: async () => {
        if (echecs-- > 0) throw new Error("réseau indisponible");
        return definition(caves);
      },
    });
    auSeuil(noyau);
    noyau.ouvrirFouille();
    const avant = JSON.stringify(noyau.etat);

    await expect(noyau.descendre(DEBUT, EMPORTES)).rejects.toThrow(/réseau/);
    expect(JSON.stringify(noyau.etat)).toBe(avant);
    expect(noyau.fouille).not.toBeNull();

    await noyau.descendre(DEBUT, EMPORTES);
    expect(noyau.etat.profondeur).toBe(2);
  });

  it("ne descend qu'une fois, même demandée deux fois", async () => {
    const noyau = await partie();
    auSeuil(noyau);
    noyau.ouvrirFouille();
    const [premiere, seconde] = await Promise.allSettled([
      noyau.descendre(DEBUT, EMPORTES),
      noyau.descendre(DEBUT, EMPORTES),
    ]);
    expect(premiere.status).toBe("fulfilled");
    expect(seconde.status).toBe("rejected");
    expect(noyau.etat.profondeur).toBe(2);
    expect(journal(noyau).filter((e) => e.fouille)).toHaveLength(1);
  });

  it("n'emmène pas dans la strate suivante une action de la strate quittée", async () => {
    const noyau = await partie();
    auSeuil(noyau);
    noyau.ouvrirFouille();
    noyau.agir({ type: "produire" });
    await noyau.descendre(DEBUT, []);
    noyau.reprendre();
    noyau.tick(0);
    expect(etatDe(noyau).cumul).toBe(0);
  });

  it("se sauvegarde et se recharge dans la nouvelle strate, qui n'est plus figée", async () => {
    const noyau = await partie();
    auSeuil(noyau);
    noyau.ouvrirFouille();
    await noyau.descendre(DEBUT, EMPORTES);

    const lecture = lireSauvegarde(ecrireSauvegarde(noyau.etat, "1.0.0"), "1.0.0");
    if (lecture.type !== "ok") throw new Error(lecture.type);
    const repris = new Noyau(
      registreDe([creerLogiqueFactice(1), creerLogiqueFactice(2)]),
      lecture.etat,
    );
    await repris.demarrer(DEBUT + H);
    expect(repris.etat.profondeur).toBe(2);
    expect(repris.suspendu).toBe(false);
    expect(repris.etat.strates[1]?.etat).toMatchObject({ cumul: CUMUL_SURFACE });
    expect(journal(repris)).toHaveLength(2);
  });
});

describe("la descente automatique", () => {
  const automatique: LogiqueFactice = {
    ...creerLogiqueFactice(1),
    seuil: (e) => ({ atteint: e.cumul >= 1000, automatique: true }),
  };

  it("se signale au seuil, et applique la présélection sans écran", async () => {
    const noyau = await partie([automatique, creerLogiqueFactice(2)]);
    expect(noyau.descenteAutomatique).toBe(false);
    auSeuil(noyau);
    expect(noyau.descenteAutomatique).toBe(true);

    const fouille = await noyau.descendre(DEBUT);
    expect(fouille.emportes).toEqual(preselection(12, 1));
    expect(noyau.etat.profondeur).toBe(2);
    expect(noyau.descenteAutomatique).toBe(false);
  });

  it("n'est pas signalée s'il n'y a pas de strate dessous", async () => {
    const noyau = await partie([automatique]);
    auSeuil(noyau);
    expect(noyau.descenteAutomatique).toBe(false);
  });
});

// La boucle du réseau (docs/strates/strate-4.md, § 3, § 4 et § 10) : l'eau d'amont en aval, les
// gestes, la montée et le signal, les vannes, la citerne, le seuil et l'absence.
import { describe, expect, it } from "vitest";
import type { ContexteTick, EffetsActifs, EvenementStrate } from "../../../noyau/logique/types";
import {
  conduite,
  contenance,
  debitSource,
  goulots,
  logique,
  nomDe,
  porte,
  prixDe,
  reliable,
  type ActionReseau,
  type EtatReseau,
} from ".";
import { etatInitial } from "./etat";
import { capacite, MONTEE, partager, prix, SOURCES, TENUE, trace, type IdSource } from "./regles";

const NEUTRES: EffetsActifs = { multiplicateur: () => 1, niveau: () => null };

function contexte(effets: EffetsActifs = NEUTRES) {
  const evenements: EvenementStrate[] = [];
  const ctx: ContexteTick = { effets, emettre: (e) => evenements.push(e) };
  return { ctx, evenements };
}

const { ctx } = contexte();

/** Fait passer `secondes`, en ticks d'une seconde, en présence du joueur. */
function avancer(etat: EtatReseau, secondes: number, c: ContexteTick = ctx): void {
  for (let s = 0; s < secondes; s++) logique.tick(etat, 1, c);
}

const agir = (etat: EtatReseau, action: ActionReseau, c: ContexteTick = ctx) =>
  logique.agir(etat, action, c);

const cles = (etat: EtatReseau) => etat.carnet.map((l) => l.cle);

/**
 * Le réseau du joueur naturel à la fin : les six sources à plein, et des conduites qui portent tout,
 * les raccourcis à trois quarts (fiche, § 4).
 */
function reseauComplet(): EtatReseau {
  const etat = etatInitial();
  etat.temps = 9000;
  const calibres: [number, number, number][] = [
    [1, 1, 1],
    [2, 5, 1],
    [3, 4, 1],
    [4, 7, 1],
    [5, 5, 0.75],
    [6, 9, 1],
    [7, 9, 1],
    [8, 9, 0.75],
    [9, 13, 1],
    [10, 12, 1],
    [11, 15, 1],
    [12, 13, 0.75],
    [13, 15, 1],
  ];
  etat.conduites = calibres.map(([t, calibre, vanne]) => ({
    trace: t,
    calibre,
    vanne: vanne as 1 | 0.75,
  }));
  etat.reliees = { 1: -MONTEE, 2: 15, 3: 1515, 4: 3310, 5: 5050, 6: 6805 };
  etat.aPlein = [1, 2, 3, 4, 5, 6];
  etat.citerne = true;
  etat.chante = true;
  return etat;
}

describe("le réseau à l'arrivée", () => {
  it("porte les dix pouces de la source 1, ni plus ni moins, et la ville les reçoit", () => {
    const etat = logique.etatInitial({ graine: 1, journal: { strates: [] } });
    expect(etat.conduites.map((c) => [c.trace, c.calibre])).toEqual([
      [1, 1],
      [2, 1],
    ]);
    avancer(etat, 60);
    expect(etat.recoit).toBeCloseTo(10, 9);
    expect(goulots(etat)).toEqual([]);
    // Un pouce verse un muid par minute.
    expect(etat.recu).toBeCloseTo(10, 6);
    expect(etat.caisse).toBeCloseTo(10, 6);
    expect(etat.carnet).toEqual([]);
  });

  it("ne laisse relier que ce qui a paru : la source 2, puis la 3 et le bassin du milieu", () => {
    const etat = etatInitial();
    expect(reliable(etat, 3)).toBe(true);
    for (const t of [4, 5, 6, 7, 11, 13]) expect(reliable(etat, t), `tracé ${t}`).toBe(false);
    etat.caisse = 100;
    agir(etat, { type: "relier", trace: 3 });
    expect(etat.reliees[2]).toBe(0);
    for (const t of [4, 5, 6]) expect(reliable(etat, t), `tracé ${t}`).toBe(true);
    expect(reliable(etat, 7)).toBe(false);
    expect(reliable(etat, 3)).toBe(false);
  });
});

describe("les prix", () => {
  it("valent 2,4 muids au calibre 1, dix fois plus à chaque calibre, trois fois sur les routes lointaines", () => {
    expect(prix(trace(3)!, 1)).toBe(2);
    expect(prix(trace(2)!, 2)).toBe(24);
    expect(prix(trace(2)!, 3)).toBe(240);
    expect(prix(trace(6)!, 4)).toBe(7_200);
    expect(prix(trace(13)!, 15)).toBe(720_000_000_000_000);
    // Le collier qui serre : les conduites coûtent 1,5 fois moins cher.
    expect(prix(trace(2)!, 2, 1.5)).toBe(16);
  });

  it("se paient sur la provision : sans elle, le geste est ignoré", () => {
    const etat = etatInitial();
    agir(etat, { type: "relier", trace: 3 });
    expect(conduite(etat, 3)).toBeUndefined();
    avancer(etat, 12);
    expect(etat.caisse).toBeCloseTo(2, 6);
    agir(etat, { type: "relier", trace: 3 });
    expect(conduite(etat, 3)).toEqual({ trace: 3, calibre: 1, vanne: 1 });
    expect(etat.caisse).toBeCloseTo(0, 6);
    expect(cles(etat)).toEqual(["carnet.reliee"]);
  });
});

describe("une source reliée", () => {
  it("donne d'abord un mille vingt-quatrième de son débit, et double toutes les deux minutes et demie", () => {
    const etat = etatInitial();
    etat.caisse = 1e9;
    agir(etat, { type: "relier", trace: 3 });
    expect(debitSource(etat, 2)).toBeCloseTo(4_000 / 1_024, 9);
    etat.temps += 150;
    expect(debitSource(etat, 2)).toBeCloseTo(4_000 / 512, 9);
    etat.temps = MONTEE - 1;
    expect(debitSource(etat, 2)).toBeLessThan(4_000);
    etat.temps = MONTEE + 600;
    expect(debitSource(etat, 2)).toBe(4_000);
  });

  it("est notée à plein au carnet au bout de vingt-cinq minutes, avec son débit", () => {
    const etat = etatInitial();
    etat.caisse = 1e9;
    agir(etat, { type: "relier", trace: 3 });
    // Assez large pour tout porter : rien ne monte.
    for (const t of [2, 3, 3, 3]) agir(etat, { type: "elargir", trace: t === 2 ? 2 : 3 });
    agir(etat, { type: "elargir", trace: 2 });
    agir(etat, { type: "elargir", trace: 2 });
    avancer(etat, MONTEE);
    const derniere = etat.carnet.at(-1)!;
    expect(derniere).toEqual({ cle: "carnet.aPlein", valeurs: { source: 2, debit: 4_000 } });
    expect(etat.recoit).toBeCloseTo(4_010, 6);
  });
});

describe("le partage à parts égales", () => {
  it("donne à chaque conduite sa part, et ce qu'une conduite pleine ne prend pas aux autres", () => {
    expect(partager([10, 1_000], 100)).toEqual([10, 90]);
    expect(partager([50, 50], 60)).toEqual([30, 30]);
    expect(partager([10, 20], 100)).toEqual([10, 20]);
    expect(partager([0, 10], 5)).toEqual([0, 5]);
    expect(partager([], 5)).toEqual([]);
  });

  it("remplit d'abord un raccourci étroit, sous un bassin qui a deux sorties", () => {
    const etat = etatInitial();
    etat.reliees = { 1: -MONTEE, 2: -MONTEE, 3: -MONTEE };
    etat.conduites = [
      { trace: 1, calibre: 1, vanne: 1 },
      { trace: 2, calibre: 5, vanne: 1 },
      { trace: 3, calibre: 4, vanne: 1 },
      { trace: 4, calibre: 7, vanne: 1 },
      { trace: 5, calibre: 4, vanne: 1 },
      { trace: 6, calibre: 7, vanne: 1 },
    ];
    avancer(etat, 1);
    // 1.600.000 pouces au milieu : le raccourci 5 en prend ses 10.000, la route 6 le reste.
    expect(etat.debits[5]).toBeCloseTo(10_000, 6);
    expect(etat.debits[6]).toBeCloseTo(1_590_000, 3);
    expect(etat.recoit).toBeCloseTo(1_604_010, 3);
  });
});

describe("un bassin qui monte", () => {
  /** L'arrivée, la source 2 reliée : le bassin bas reçoit plus que la conduite 2 n'emporte. */
  function source2Reliee(): EtatReseau {
    const etat = etatInitial();
    etat.caisse = 2;
    agir(etat, { type: "relier", trace: 3 });
    return etat;
  }

  it("monte dès que la source 2 arrive, et le carnet le note", () => {
    const etat = source2Reliee();
    avancer(etat, 1);
    expect(goulots(etat)).toEqual(["bas"]);
    expect(cles(etat)).toEqual(["carnet.reliee", "carnet.monte"]);
    expect(nomDe(etat, "bas")).toBe("Bassin bas");
    // Il tient deux minutes de ce que sa conduite emporte : 20 muids.
    expect(contenance(etat, "bas")).toBe(20);
  });

  it("déborde quand il est plein : le signal, qui nomme la conduite d'aval, et l'eau perdue", () => {
    const etat = source2Reliee();
    const { ctx: c, evenements } = contexte();
    avancer(etat, 180, c);
    expect(etat.signales).toEqual([]);
    avancer(etat, 60, c);
    expect(etat.signales).toEqual(["bas"]);
    const i = cles(etat).indexOf("carnet.deborde");
    expect(etat.carnet[i]!.valeurs).toEqual({ noeud: 9 });
    expect(etat.carnet[i + 1]).toEqual({ cle: "carnet.goulot", valeurs: { conduite: 2 } });
    expect(etat.perdu).toBeGreaterThan(0);
    expect(evenements).toContainEqual({
      type: "trace",
      cle: "goulot.signale",
      valeurs: { noeud: 9 },
    });
  });

  it("cesse de monter quand on élargit la conduite d'aval avant le signal : un goulot défait à temps", () => {
    const etat = source2Reliee();
    avancer(etat, 150);
    expect(etat.caisse).toBeGreaterThanOrEqual(24);
    agir(etat, { type: "elargir", trace: 2 });
    avancer(etat, 1);
    expect(etat.montees.bas).toBeUndefined();
    expect(etat.avantSignal).toBe(1);
    expect(cles(etat)).toContain("carnet.aucun");
    // L'eau qui attendait s'écoule : le bassin redescend à son niveau de service.
    avancer(etat, 10);
    expect(etat.attente.bas).toBeUndefined();
    expect(cles(etat)).toContain("carnet.stable");
  });

  it("monte encore si l'on élargit ce qui y entre : le goulot est en aval", () => {
    const etat = source2Reliee();
    avancer(etat, 120);
    agir(etat, { type: "elargir", trace: 3 });
    avancer(etat, 1);
    expect(goulots(etat)).toEqual(["bas"]);
  });

  it("déborde aussitôt sans conduite d'aval : un bassin sans sortie n'a pas de goulot à nommer", () => {
    const etat = etatInitial();
    etat.reliees = { 1: -MONTEE, 2: -MONTEE };
    etat.conduites.push({ trace: 3, calibre: 4, vanne: 1 }, { trace: 2, calibre: 4, vanne: 1 });
    etat.conduites = etat.conduites.filter((c) => c.trace !== 2 || c.calibre === 4);
    etat.caisse = 1e6;
    agir(etat, { type: "relier", trace: 4 });
    avancer(etat, 1);
    expect(goulots(etat)).toContain("milieu");
    expect(etat.signales).toContain("milieu");
    const lignes = etat.carnet.filter((l) => l.valeurs.noeud === 6);
    expect(lignes.map((l) => l.cle)).toEqual(["carnet.monte", "carnet.deborde"]);
  });
});

describe("une conduite au plus large", () => {
  it("ne s'élargit plus, et le signal le dit", () => {
    const etat = etatInitial();
    etat.conduites = [
      { trace: 1, calibre: 1, vanne: 1 },
      { trace: 2, calibre: 5, vanne: 1 },
      { trace: 3, calibre: 5, vanne: 1 },
    ];
    etat.reliees = { 1: -MONTEE, 2: -MONTEE };
    etat.caisse = 1e12;
    expect(prixDe(etat, 2)).toBeNull();
    agir(etat, { type: "elargir", trace: 2 });
    expect(conduite(etat, 2)!.calibre).toBe(5);
    // Plus d'eau que la route n'en porte, et le bassin bas déjà plein : il déborde aussitôt.
    const fort: EffetsActifs = { multiplicateur: () => 100, niveau: () => null };
    etat.attente.bas = 2 * capacite(5);
    logique.tick(etat, 1, { ...ctx, effets: fort });
    expect(cles(etat)).toContain("carnet.goulotAuPlusLarge");
  });

  it("se note au carnet quand elle y arrive", () => {
    const etat = etatInitial();
    etat.conduites = [
      { trace: 1, calibre: 1, vanne: 1 },
      { trace: 2, calibre: 4, vanne: 1 },
    ];
    etat.caisse = 1e6;
    agir(etat, { type: "elargir", trace: 2 });
    expect(etat.carnet.at(-1)).toEqual({
      cle: "carnet.auPlusLarge",
      valeurs: { conduite: 2, debit: 100_000 },
    });
  });
});

describe("les vannes", () => {
  it("se règlent au quart, sans rien coûter, et la conduite ne prend plus que sa part du calibre", () => {
    const etat = etatInitial();
    agir(etat, { type: "vanne", trace: 2, ouverture: 0.25 });
    expect(conduite(etat, 2)!.vanne).toBe(0.25);
    expect(porte(conduite(etat, 2)!)).toBe(2.5);
    expect(etat.carnet.at(-1)).toEqual({
      cle: "carnet.vanne",
      valeurs: { conduite: 2, quarts: 1 },
    });
    expect(etat.caisse).toBe(0);
    // La source 1 donne 10 pouces : le bassin bas monte.
    avancer(etat, 1);
    expect(goulots(etat)).toEqual(["bas"]);
    expect(etat.recoit).toBeCloseTo(2.5, 9);
  });

  it("fermée, ne laisse rien passer : l'eau prend l'autre sortie", () => {
    const etat = etatInitial();
    etat.reliees = { 1: -MONTEE, 2: -MONTEE, 3: -MONTEE };
    etat.conduites = [
      { trace: 1, calibre: 1, vanne: 1 },
      { trace: 2, calibre: 5, vanne: 1 },
      { trace: 3, calibre: 4, vanne: 1 },
      { trace: 4, calibre: 7, vanne: 1 },
      { trace: 5, calibre: 4, vanne: 0 },
      { trace: 6, calibre: 7, vanne: 1 },
    ];
    avancer(etat, 1);
    expect(etat.debits[5]).toBe(0);
    expect(etat.debits[6]).toBeCloseTo(1_600_000, 3);
  });

  it("ignorent une ouverture qui n'est pas au quart, ou une conduite qui n'est pas posée", () => {
    const etat = etatInitial();
    agir(etat, { type: "vanne", trace: 2, ouverture: 0.3 as 0.25 });
    agir(etat, { type: "vanne", trace: 6, ouverture: 0 });
    expect(conduite(etat, 2)!.vanne).toBe(1);
    expect(etat.carnet).toEqual([]);
  });
});

describe("la citerne", () => {
  it("se révèle à la première conduite posée au quatrième bassin, puis chante quand son eau passe", () => {
    const etat = etatInitial();
    etat.reliees = { 1: -MONTEE, 2: 0, 3: 0, 4: 0, 5: 0 };
    etat.caisse = 1e12;
    expect(nomDe(etat, "citerne")).toBe("Quatrième bassin");
    agir(etat, { type: "relier", trace: 13 });
    expect(etat.citerne).toBe(true);
    expect(nomDe(etat, "citerne")).toBe("Citerne");
    expect(cles(etat)).toEqual(["carnet.grandeConduite", "carnet.voutee"]);
    agir(etat, { type: "relier", trace: 11 });
    avancer(etat, 1);
    expect(etat.chante).toBe(true);
    expect(cles(etat)).toContain("carnet.citerne");
  });
});

describe("le seuil", () => {
  it("vient après cinq minutes sans goulot, les six sources à plein, et le carnet compte les minutes", () => {
    const etat = reseauComplet();
    const { ctx: c, evenements } = contexte();
    avancer(etat, 1, c);
    expect(goulots(etat)).toEqual([]);
    avancer(etat, TENUE - 2, c);
    expect(logique.seuil(etat).atteint).toBe(false);
    avancer(etat, 1, c);
    expect(logique.seuil(etat).atteint).toBe(true);
    expect(etat.seuilA).toBe(etat.temps);
    expect(
      etat.carnet.filter((l) => l.cle.startsWith("carnet.depuis")).map((l) => l.valeurs),
    ).toEqual([{ minutes: 1 }, { minutes: 2 }, { minutes: 3 }, { minutes: 4 }, { minutes: 5 }]);
    expect(evenements).toContainEqual({ type: "trace", cle: "seuil.atteint" });
    // Les six sources donnent tout à la ville.
    const total = Object.values(SOURCES).reduce((s, d) => s + d, 0);
    expect(etat.recoit).toBeCloseTo(total, -3);
  });

  it("repart de zéro si un goulot paraît à 4 min 59 s", () => {
    const etat = reseauComplet();
    avancer(etat, 299);
    expect(etat.tenue).toBe(299);
    agir(etat, { type: "vanne", trace: 2, ouverture: 0 });
    avancer(etat, 1);
    expect(logique.seuil(etat).atteint).toBe(false);
    expect(etat.tenue).toBe(0);
    agir(etat, { type: "vanne", trace: 2, ouverture: 1 });
    // L'eau qui attendait s'écoule d'abord ; puis les cinq minutes reprennent, entières.
    avancer(etat, 60);
    expect(goulots(etat)).toEqual([]);
    const reprise = etat.temps - etat.tenue;
    avancer(etat, TENUE);
    expect(logique.seuil(etat).atteint).toBe(true);
    expect(etat.seuilA! - reprise).toBeCloseTo(TENUE, 0);
  });

  it("ne se compte pas tant qu'une source n'est pas à plein", () => {
    const etat = reseauComplet();
    etat.reliees[6] = etat.temps - MONTEE + 600;
    etat.aPlein = [1, 2, 3, 4, 5];
    avancer(etat, 590);
    expect(etat.tenue).toBe(0);
    expect(logique.seuil(etat).atteint).toBe(false);
    avancer(etat, TENUE + 20);
    expect(logique.seuil(etat).atteint).toBe(true);
  });

  it("reste atteint, une fois atteint, même si un goulot paraît ensuite", () => {
    const etat = reseauComplet();
    avancer(etat, TENUE + 1);
    agir(etat, { type: "vanne", trace: 13, ouverture: 0 });
    avancer(etat, 5);
    expect(goulots(etat).length).toBeGreaterThan(0);
    expect(logique.seuil(etat).atteint).toBe(true);
  });
});

describe("l'absence", () => {
  it("fait couler 80 % de l'absence, douze heures au plus", () => {
    const etat = etatInitial();
    logique.absence!(etat, 3_600, ctx);
    expect(etat.temps).toBeCloseTo(2_880, 6);
    expect(etat.recu).toBeCloseTo(480, 3);
    const long = etatInitial();
    logique.absence!(long, 2 * 24 * 3_600, ctx);
    expect(long.temps).toBeCloseTo(12 * 3_600 * 0.8, 6);
  });

  it("laisse attendre les cinq minutes : elles ne courent pas, ne repartent pas de zéro", () => {
    const etat = reseauComplet();
    avancer(etat, 200);
    expect(etat.tenue).toBe(200);
    logique.absence!(etat, 3_600, ctx);
    expect(etat.tenue).toBe(200);
    expect(logique.seuil(etat).atteint).toBe(false);
    avancer(etat, 100);
    expect(logique.seuil(etat).atteint).toBe(true);
  });

  it("dit au retour ce que la ville a reçu, et les bassins qui ont débordé", () => {
    const etat = etatInitial();
    etat.caisse = 2;
    agir(etat, { type: "relier", trace: 3 });
    const { lignes } = logique.absence!(etat, 3_600, ctx);
    expect(lignes[0]).toMatch(/^La ville a reçu [\d.]+ muids\.$/);
    expect(lignes).toContain("Bassin bas : a débordé.");
  });
});

describe("les objets d'en haut", () => {
  const effets: EffetsActifs = {
    multiplicateur: (levier) => (levier === "debit" ? 2 : levier === "pose" ? 1.5 : 1),
    niveau: () => null,
  };
  const { ctx: c } = contexte(effets);

  it("s'éveillent à la première source reliée : l'arrivée est la même avec ou sans eux", () => {
    const etat = logique.etatInitial({ graine: 1, journal: { strates: [] }, effets });
    avancer(etat, 12, c);
    expect(etat.multiplicateurs).toEqual({ debit: 1, pose: 1 });
    expect(goulots(etat)).toEqual([]);
    agir(etat, { type: "relier", trace: 3 }, c);
    avancer(etat, 1, c);
    expect(etat.multiplicateurs).toEqual({ debit: 2, pose: 1.5 });
    // Le débit de toutes les sources × 2, et le prix des conduites ÷ 1,5.
    expect(debitSource(etat, 1)).toBe(20);
    expect(prixDe(etat, 2)).toBe(16);
  });
});

describe("ce que le réseau expose au noyau", () => {
  it("convertit toute l'eau reçue par la ville, et se déclare au contrat", () => {
    const etat = reseauComplet();
    avancer(etat, 60);
    expect(logique.valeurConvertible(etat)).toBe(etat.recu);
    expect(logique.leviers).toEqual({ principal: "debit", secondaires: ["pose"] });
    expect(logique.horsLigne).toEqual({ type: "propre" });
    expect(logique.pasMax).toBe(1);
    expect(logique.numero).toBe(4);
  });

  it("montre dans son graphe ce qui est relié, et rien d'autre", () => {
    const etat = etatInitial();
    expect(logique.graphe!(etat).noeuds.map((n) => n.id)).toEqual(["source1", "bas", "ville"]);
    etat.caisse = 2;
    agir(etat, { type: "relier", trace: 3 });
    const g = logique.graphe!(etat);
    expect(g.noeuds.map((n) => n.id)).toEqual(["source1", "source2", "bas", "ville"]);
    expect(g.liens).toContainEqual({ de: "source2", vers: "bas" });
    expect(g.noeuds.every((n) => n.cle === `noeud.${n.id}`)).toBe(true);
  });

  it("écrit huit formules, chacune sur un nœud du réseau complet", () => {
    const formules = logique.formules!();
    expect(formules).toHaveLength(8);
    const noeuds = new Set(logique.graphe!(reseauComplet()).noeuds.map((n) => n.id));
    for (const f of formules) expect(noeuds.has(f.noeud), f.noeud).toBe(true);
  });

  it("ne change rien en un tick de durée nulle", () => {
    const etat = reseauComplet();
    avancer(etat, 10);
    const avant = structuredClone(etat);
    logique.tick(etat, 0, ctx);
    expect(etat).toEqual(avant);
  });

  it("relève la provision, ce que reçoit la ville, les sources et les goulots", () => {
    const etat = reseauComplet();
    avancer(etat, 10);
    const r = logique.releve!(etat);
    expect(r).toMatchObject({ sources: 6, conduites: 13, goulots: 0, tenue: 10 });
    const sources: IdSource[] = [1, 2, 3, 4, 5, 6];
    expect(sources.every((k) => etat.reliees[k] !== undefined)).toBe(true);
    expect(capacite(15)).toBe(1e15);
  });
});

// Les règles de la dette (docs/strates/strate-6.md, § 3) : la nomenclature, l'arrivée, la confiance,
// les termes, les reports et le défaut, le solde, les tablettes et la grande crue.
import { describe, expect, it } from "vitest";
import { pointsDeFouille } from "../../../noyau/logique/artefacts";
import { problemesGraphe } from "../../../noyau/logique/graphe";
import type { ContexteTick, EvenementStrate } from "../../../noyau/logique/types";
import { textes } from "../textes.fr";
import { logique, type ActionDette, type Echeance, type EtatDette, type IdPromesse } from ".";
import {
  confiance,
  CRUE,
  doit,
  EXEMPLAIRES,
  LIVRE_ENTIER,
  montantDu,
  prixExemplaire,
  PROMESSES,
  rapport,
  SORTES,
  sortesDe,
  toutDu,
} from "./regles";

function contexte(multiplicateurs: Record<string, number> = {}) {
  const evenements: EvenementStrate[] = [];
  const ctx: ContexteTick = {
    effets: { multiplicateur: (levier) => multiplicateurs[levier] ?? 1, niveau: () => null },
    emettre: (e) => evenements.push(e),
  };
  return { ctx, evenements };
}

const neuf = () => logique.etatInitial({ graine: 1, journal: { strates: [] } });
const cles = (etat: EtatDette) => etat.livre.map((l) => l.cle);
const derniere = (etat: EtatDette) => etat.livre.at(-1)!;

function agir(etat: EtatDette, action: ActionDette, ctx = contexte().ctx) {
  logique.agir(etat, action, ctx);
}

function avancer(etat: EtatDette, secondes: number, ctx = contexte().ctx) {
  logique.tick(etat, secondes, ctx);
}

/** Une échéance, pour composer un livre. */
function echeance(numero: number, promesse: IdPromesse, crue: number | null, du: number): Echeance {
  return { numero, promesse, crue, du, origine: du, prix: du, reports: 0 };
}

/** Toutes les promesses des tablettes 1 à `n` faites. */
function promettreJusqua(etat: EtatDette, n: number): void {
  for (let k = 1; k <= n; k++) for (const id of sortesDe(k)) etat.promises[id] = EXEMPLAIRES;
}

/**
 * La dernière tablette ouverte : les quatre autres promises et honorées, et toutes ses promesses
 * faites sauf la dernière toutes les crues.
 */
function avantLaDernierePromesse(): EtatDette {
  const etat = neuf();
  promettreJusqua(etat, 4);
  etat.echeances = [];
  etat.tablette = 5;
  etat.brisees = 4;
  etat.honore = 1e20;
  for (const id of sortesDe(5)) {
    const n = id === "toutesLesCrues" ? EXEMPLAIRES - 1 : EXEMPLAIRES;
    for (let i = 0; i < n; i++) {
      const prix = prixExemplaire(id, i);
      etat.echeances.push({
        numero: etat.echeances.length + 97,
        promesse: id,
        crue: null,
        du: montantDu(prix, null),
        origine: montantDu(prix, null),
        prix,
        reports: 0,
      });
    }
    etat.promises[id] = n;
  }
  return etat;
}

describe("la nomenclature (§ 3)", () => {
  it("donne les prix de base, les rapports et le prix du huitième exemplaire de la fiche", () => {
    const fiche: [IdPromesse, number, number, number][] = [
      ["orge", 12, 3, 75],
      ["huile", 336, 70, 2_110],
      ["etoffe", 9_000, 1_670, 56_500],
      ["ane", 231e3, 38_400, 1_450e3],
      ["barque", 5_620e3, 852e3, 35_300e3],
      ["attelage", 130e6, 18_100e3, 819e6],
      ["champ", 2_870e6, 368e6, 18e9],
      ["verger", 59_700e6, 7_110e6, 375e9],
      ["troupeau", 1_170e9, 130e9, 7_340e9],
      ["maison", 21_500e9, 2_240e9, 135e12],
      ["canal", 370e12, 36_300e9, 2_320e12],
      ["digue", 5_930e12, 549e12, 37_200e12],
      ["crueQuiVient", 87_700e12, 11e15, 550e15],
      ["dixCrues", 1_190e15, 149e15, 7_490e15],
      ["toutesLesCrues", 14_800e15, 1_850e15, 92_800e15],
    ];
    expect(fiche.map(([id]) => id)).toEqual([...PROMESSES]);
    for (const [id, base, rapporte, huitieme] of fiche) {
      expect(prixExemplaire(id, 0), id).toBe(base);
      expect(SORTES[id].rapport, id).toBe(rapporte);
      expect(prixExemplaire(id, 7), id).toBe(huitieme);
    }
  });

  it("range trois sortes par tablette, et le livre entier vaut 384 ●●●●●● : 28 points", () => {
    expect(sortesDe(1)).toEqual(["orge", "huile", "etoffe"]);
    expect(sortesDe(5)).toEqual(["crueQuiVient", "dixCrues", "toutesLesCrues"]);
    expect(LIVRE_ENTIER / 1e20).toBeCloseTo(3.84, 2);
    expect(pointsDeFouille(LIVRE_ENTIER)).toBe(28);
  });

  it("majore les termes : rien à 2 crues, 20 % à 6, 60 % à 18 et à la grande crue", () => {
    const prix = prixExemplaire("orge", 2);
    expect([prix, montantDu(prix, 2), montantDu(prix, 6), montantDu(prix, 18)]).toEqual([
      20, 20, 24, 32,
    ]);
    expect(montantDu(prix, null)).toBe(32);
  });
});

describe("l'arrivée (§ 3)", () => {
  it("ouvre le livre sur deux mesures d'orge déjà promises, dues aux deux premières crues", () => {
    const etat = neuf();
    expect(etat.caisse).toBe(30);
    expect(rapport(etat)).toBe(6);
    expect(etat.tablette).toBe(1);
    expect(etat.echeances.map((e) => [e.numero, e.crue, e.du])).toEqual([
      [1, 1, 12],
      [2, 2, 16],
    ]);
    expect(confiance(etat)).toBe(60);
    expect(doit(etat)).toBe(28);
    expect(cles(etat)).toEqual([]);
    expect(logique.seuil(etat)).toEqual({ atteint: false });
  });

  it("ajoute le rapport à la caisse au fil des secondes, et honore la première échéance à trente secondes", () => {
    const etat = neuf();
    avancer(etat, 15);
    expect(etat.caisse).toBeCloseTo(33, 9);
    avancer(etat, 15);
    expect(etat.crues).toBe(1);
    expect(etat.caisse).toBeCloseTo(24, 9);
    expect(etat.echeances.map((e) => e.numero)).toEqual([2]);
    expect(derniere(etat)).toEqual({
      cle: "livre.honore",
      valeurs: { numero: 1, crue: 1, montant: 12 },
    });
    // La confiance grandit de ce qui est honoré : 60 + 5 × 12.
    expect(etat.honore).toBe(12);
    expect(confiance(etat)).toBe(120);
    expect(etat.valeur).toBe(12);
  });

  it("donne le même livre en un pas d'une crue, en pas d'une seconde ou en images de 1/60 s", () => {
    const parCrue = neuf();
    const parSeconde = neuf();
    const parImage = neuf();
    avancer(parCrue, CRUE);
    avancer(parCrue, CRUE);
    for (let i = 0; i < 2 * CRUE; i++) avancer(parSeconde, 1);
    for (let i = 0; i < 2 * CRUE * 60; i++) avancer(parImage, 1 / 60);
    for (const etat of [parSeconde, parImage]) {
      expect(etat.crues).toBe(parCrue.crues);
      expect(etat.caisse).toBeCloseTo(parCrue.caisse, 6);
      expect(etat.livre).toEqual(parCrue.livre);
      expect(etat.echeances).toEqual(parCrue.echeances);
    }
  });
});

describe("promettre (§ 3)", () => {
  it("écrit l'échéance à son terme, au prix majoré, et le rapport vient tout de suite", () => {
    const etat = neuf();
    avancer(etat, 3 * CRUE + 5);
    agir(etat, { type: "promettre", promesse: "orge", terme: 6 });
    expect(etat.promises.orge).toBe(3);
    expect(etat.echeances.at(-1)).toEqual({
      numero: 3,
      promesse: "orge",
      crue: 9,
      du: 24,
      origine: 24,
      prix: 20,
      reports: 0,
    });
    expect(rapport(etat)).toBe(9);
  });

  it("est refusée quand la confiance ne suffit pas, dès la deuxième promesse, et le refus s'écrit une fois", () => {
    const { ctx, evenements } = contexte();
    const etat = neuf();
    agir(etat, { type: "promettre", promesse: "orge", terme: 2 }, ctx);
    expect(doit(etat)).toBe(48);
    agir(etat, { type: "promettre", promesse: "orge", terme: 2 }, ctx);
    agir(etat, { type: "promettre", promesse: "orge", terme: 2 }, ctx);
    expect(etat.promises.orge).toBe(3);
    expect(cles(etat)).toEqual(["livre.refus"]);
    expect(textes["livre.refus"]).toBe("La confiance ne suffit pas.");
    expect(
      evenements.filter((e) => e.type === "trace" && e.cle === "promesse.refusee"),
    ).toHaveLength(2);
  });

  it("ignore un geste impossible : une autre tablette, un terme inconnu, une sorte épuisée", () => {
    const etat = neuf();
    const avant = structuredClone(etat);
    agir(etat, { type: "promettre", promesse: "ane", terme: 2 });
    agir(etat, { type: "promettre", promesse: "orge", terme: 5 as 6 });
    agir(etat, { type: "promettre", promesse: "inconnue" as IdPromesse, terme: 2 });
    agir(etat, { type: "solder", echeance: 42 });
    agir(etat, { type: "creuser" } as unknown as ActionDette);
    expect(etat).toEqual(avant);
    etat.promises.orge = EXEMPLAIRES;
    agir(etat, { type: "promettre", promesse: "orge", terme: 2 });
    expect(etat.promises.orge).toBe(EXEMPLAIRES);
  });
});

describe("les reports et le défaut (§ 3)", () => {
  /** Une échéance de 100, à la première crue, sur une caisse vide qui reçoit 6 par crue. */
  function aDecouvert(honore: number): EtatDette {
    const etat = neuf();
    etat.caisse = 0;
    etat.honore = honore;
    etat.echeances = [echeance(1, "orge", 1, 100)];
    return etat;
  }

  it("reporte ce que la caisse ne couvre pas : le reste, deux crues plus tard, majoré d'un quart", () => {
    const { ctx, evenements } = contexte();
    const etat = aDecouvert(100);
    avancer(etat, CRUE, ctx);
    // La caisse paie ce qu'elle peut, 6 ; le reste, 94, est majoré d'un quart.
    expect(etat.caisse).toBe(0);
    expect(etat.echeances).toEqual([
      { numero: 1, promesse: "orge", crue: 3, du: 118, origine: 100, prix: 100, reports: 1 },
    ]);
    expect(etat.reportees).toBe(1);
    expect(derniere(etat)).toEqual({
      cle: "livre.reporte",
      valeurs: { numero: 1, crue: 3, montant: 118, majoration: 25 },
    });
    expect(evenements).toContainEqual({
      type: "trace",
      cle: "echeance.reportee",
      valeurs: { numero: 1, crue: 3, reports: 1 },
    });
    expect(etat.issue).toBeNull();
  });

  it("ne fait grandir la confiance que du montant d'avant le report, une fois honoré en entier", () => {
    const etat = aDecouvert(100);
    avancer(etat, CRUE);
    etat.caisse = 1_000;
    avancer(etat, 2 * CRUE);
    expect(etat.echeances).toEqual([]);
    expect(etat.caisse).toBeCloseTo(1_000 + 12 - 118, 9);
    // 100 de plus, et non 118 : ni la majoration, ni ce que la caisse a payé avant.
    expect(etat.honore).toBe(200);
    expect(etat.valeur).toBe(100);
  });

  it("tombe en défaut quand le report ferait passer ce qu'on doit au-dessus de la confiance", () => {
    const { ctx, evenements } = contexte();
    const etat = aDecouvert(0);
    avancer(etat, CRUE, ctx);
    expect(etat.issue).toBe("defaut");
    expect(etat.issueA).toBe(CRUE);
    expect(cles(etat).slice(-2)).toEqual(["livre.echu", "livre.defaut"]);
    expect(etat.livre.at(-2)!.valeurs).toEqual({ numero: 1, crue: 1, montant: 100 });
    // Le reste demeure dû, à sa crue.
    expect(etat.echeances).toEqual([
      { numero: 1, promesse: "orge", crue: 1, du: 94, origine: 100, prix: 100, reports: 0 },
    ]);
    expect(evenements).toContainEqual({ type: "trace", cle: "dette.defaut", valeurs: { crue: 1 } });
    expect(logique.seuil(etat)).toEqual({ atteint: true, issue: "defaut" });
    expect(textes["livre.defaut"]).toBe("Échu. Le reste demeure dû.");
  });

  it("arrête tout en défaut : plus de rapport, plus de geste, le livre ne bouge plus", () => {
    const etat = aDecouvert(0);
    avancer(etat, CRUE);
    const livre = structuredClone(etat.livre);
    avancer(etat, 10 * CRUE);
    agir(etat, { type: "promettre", promesse: "orge", terme: 2 });
    expect(etat.caisse).toBe(0);
    expect(etat.crues).toBe(11);
    expect(etat.livre).toEqual(livre);
    expect(etat.promises.orge).toBe(2);
  });
});

describe("la confiance après un report (§ 13, question 12)", () => {
  it("s'écrit sous l'échéance honorée : ce qu'elle y gagne, sur le dû d'avant le report", () => {
    const etat = neuf();
    etat.caisse = 0;
    etat.honore = 100;
    etat.echeances = [echeance(1, "orge", 1, 100)];
    avancer(etat, CRUE);
    expect(etat.echeances[0]!.du).toBe(118);
    etat.caisse = 1_000;
    avancer(etat, 2 * CRUE);
    expect(etat.livre.slice(-2)).toEqual([
      { cle: "livre.honore", valeurs: { numero: 1, crue: 3, montant: 118 } },
      // 5 × 100, et non 5 × 118 : le report n'a rien rendu à la confiance.
      { cle: "livre.confiance", valeurs: { montant: 500 } },
    ]);
    expect(textes["livre.confiance"]).toBe(
      "La confiance y gagne {montant}, sur le dû d'avant le report.",
    );
  });

  it("ne s'écrit pas sous une échéance honorée à son terme, sans report", () => {
    const etat = neuf();
    avancer(etat, 2 * CRUE);
    expect(cles(etat)).toEqual(["livre.honore", "livre.honore"]);
  });
});

describe("le rappel de reprise (bible, § 10)", () => {
  const rappel = (etat: EtatDette) => logique.rappel!(etat).map((l) => l.replace(/\u202f/g, " "));

  it("dit la dernière ligne du livre, puis la tablette ouverte", () => {
    const etat = neuf();
    expect(rappel(etat)).toEqual(["Tablette 1 sur 5."]);
    avancer(etat, CRUE);
    expect(rappel(etat)).toEqual(["Dû à la 1ʳᵉ crue : 12. Honoré.", "Tablette 1 sur 5."]);
  });

  it("dit la grande crue, dès que la dernière tablette s'ouvre, puis quand elle est fixée", () => {
    const etat = avantLaDernierePromesse();
    expect(rappel(etat)).toEqual(["Tout ce qui reste dû tombe à la grande crue."]);
    agir(etat, { type: "promettre", promesse: "toutesLesCrues", terme: 2 });
    expect(rappel(etat)).toEqual(["La grande crue : à la 12ᵉ crue."]);
  });

  it("dit la fin, une fois, quand le livre vient de l'écrire", () => {
    const etat = neuf();
    etat.caisse = 0;
    etat.echeances = [echeance(1, "orge", 1, 100)];
    avancer(etat, CRUE);
    expect(rappel(etat)).toEqual(["Échu. Le reste demeure dû."]);
  });
});

describe("solder (§ 3)", () => {
  it("honore une échéance avant son terme, à son plein montant, si la caisse la couvre", () => {
    const etat = neuf();
    agir(etat, { type: "solder", echeance: 2 });
    expect(etat.caisse).toBe(14);
    expect(etat.echeances.map((e) => e.numero)).toEqual([1]);
    expect(etat.honore).toBe(16);
    expect(derniere(etat)).toEqual({
      cle: "livre.solde",
      valeurs: { numero: 2, crue: 2, montant: 16 },
    });
    // La caisse ne couvre plus la première : le geste est ignoré.
    etat.caisse = 10;
    agir(etat, { type: "solder", echeance: 1 });
    expect(etat.echeances.map((e) => e.numero)).toEqual([1]);
  });

  it("ne solde rien de la dernière tablette, gagée sur la grande crue", () => {
    const etat = avantLaDernierePromesse();
    etat.caisse = 1e22;
    const numero = etat.echeances[0]!.numero;
    agir(etat, { type: "solder", echeance: numero });
    expect(etat.echeances[0]!.numero).toBe(numero);
    expect(etat.caisse).toBe(1e22);
  });
});

describe("les tablettes (§ 3)", () => {
  it("ouvrent la suivante dès que la courante est toute promise, sans attendre qu'elle soit honorée", () => {
    const etat = neuf();
    etat.honore = 1e6;
    for (const id of sortesDe(1)) etat.promises[id] = EXEMPLAIRES;
    etat.promises.etoffe = EXEMPLAIRES - 1;
    agir(etat, { type: "promettre", promesse: "etoffe", terme: 18 });
    expect(etat.tablette).toBe(2);
    agir(etat, { type: "promettre", promesse: "huile", terme: 2 });
    expect(etat.promises.huile).toBe(EXEMPLAIRES);
    agir(etat, { type: "promettre", promesse: "ane", terme: 2 });
    expect(etat.promises.ane).toBe(1);
  });

  it("se brisent dans l'ordre, toutes leurs promesses faites et honorées", () => {
    const { ctx, evenements } = contexte();
    const etat = neuf();
    promettreJusqua(etat, 2);
    etat.tablette = 3;
    etat.caisse = 1e12;
    etat.echeances = [
      echeance(1, "orge", 1, 12),
      echeance(2, "ane", 1, 1_000),
      echeance(3, "barque", 2, 1),
    ];
    avancer(etat, CRUE, ctx);
    expect(etat.brisees).toBe(1);
    expect(cles(etat).at(-1)).toBe("livre.brisee");
    avancer(etat, CRUE, ctx);
    expect(etat.brisees).toBe(2);
    expect(evenements.filter((e) => e.type === "trace" && e.cle === "tablette.brisee")).toEqual([
      { type: "trace", cle: "tablette.brisee", valeurs: { tablette: 1 } },
      { type: "trace", cle: "tablette.brisee", valeurs: { tablette: 2 } },
    ]);
  });

  it("se brisent aussi quand on solde leur dernière échéance", () => {
    const etat = neuf();
    promettreJusqua(etat, 1);
    etat.tablette = 2;
    etat.echeances = [echeance(1, "etoffe", 5, 20)];
    agir(etat, { type: "solder", echeance: 1 });
    expect(etat.brisees).toBe(1);
  });
});

describe("la dernière tablette et la grande crue (§ 3, § 4)", () => {
  it("promet sans confiance et sans terme : tout est dû à la grande crue, majoré de 60 %", () => {
    const etat = avantLaDernierePromesse();
    etat.honore = 0;
    etat.promises.dixCrues = EXEMPLAIRES - 1;
    agir(etat, { type: "promettre", promesse: "dixCrues", terme: 7 as 6 });
    const e = etat.echeances.at(-1)!;
    expect(e.crue).toBeNull();
    expect(e.du).toBe(montantDu(prixExemplaire("dixCrues", 7), null));
    expect(etat.grandeCrue).toBeNull();
  });

  it("fixe la grande crue à la dernière promesse du livre, douze crues plus tard : tout y tombe", () => {
    const { ctx, evenements } = contexte();
    const etat = avantLaDernierePromesse();
    etat.crues = 300;
    etat.temps = 300 * CRUE + 4;
    // Une échéance de la quatrième tablette, due après la grande crue, y tombe aussi.
    etat.echeances.unshift(echeance(96, "digue", 330, 1e15));
    agir(etat, { type: "promettre", promesse: "toutesLesCrues", terme: 2 }, ctx);
    expect(etat.grandeCrue).toBe(312);
    expect(etat.echeances.every((x) => x.crue === 312)).toBe(true);
    expect(derniere(etat)).toEqual({ cle: "livre.grandeCrue", valeurs: { crue: 312 } });
    expect(evenements).toContainEqual({
      type: "trace",
      cle: "grandeCrue.fixee",
      valeurs: { crue: 312 },
    });
  });

  it("honore tout d'un coup si la caisse le couvre : la dette est soldée, la valeur est le prix du livre", () => {
    const etat = avantLaDernierePromesse();
    agir(etat, { type: "promettre", promesse: "toutesLesCrues", terme: 2 });
    const total = toutDu(etat);
    const prix = etat.echeances.reduce((s, e) => s + e.prix, 0);
    etat.caisse = total;
    avancer(etat, 12 * CRUE);
    expect(etat.issue).toBe("soldee");
    expect(etat.issueA).toBe(12 * CRUE);
    expect(etat.echeances).toEqual([]);
    expect(etat.brisees).toBe(5);
    expect(etat.valeur).toBe(prix);
    expect(derniere(etat).cle).toBe("livre.soldee");
    expect(textes["livre.soldee"]).toBe("Honoré. Plus rien n'est dû.");
    expect(logique.seuil(etat)).toEqual({ atteint: true, issue: "soldee" });
    expect(logique.valeurConvertible(etat)).toBe(prix);
    // Soldée, le rapport continue, mais plus rien ne s'honore.
    const caisse = etat.caisse;
    avancer(etat, CRUE);
    expect(etat.caisse).toBeCloseTo(caisse + rapport(etat), -10);
    expect(etat.livre.at(-1)!.cle).toBe("livre.soldee");
  });

  it("n'honore rien si la caisse ne couvre pas tout : le reste demeure dû", () => {
    const etat = avantLaDernierePromesse();
    agir(etat, { type: "promettre", promesse: "toutesLesCrues", terme: 2 });
    const echeances = structuredClone(etat.echeances).map((e) => ({ ...e }));
    etat.caisse = 0;
    avancer(etat, 12 * CRUE);
    expect(etat.issue).toBe("defaut");
    expect(etat.echeances).toEqual(echeances);
    expect(etat.valeur).toBe(0);
    expect(etat.brisees).toBe(4);
    expect(derniere(etat).cle).toBe("livre.defaut");
  });
});

describe("les gages (§ 8)", () => {
  it("s'éveillent quand la première tablette est brisée : avant, ils n'agissent pas", () => {
    const { ctx } = contexte({ confiance: 1.5, report: 1.5 });
    const etat = neuf();
    avancer(etat, 1, ctx);
    expect(etat.multiplicateurs).toEqual({ confiance: 1, report: 1 });
    etat.brisees = 1;
    avancer(etat, 1, ctx);
    expect(etat.multiplicateurs).toEqual({ confiance: 1.5, report: 1.5 });
    expect(confiance(etat)).toBe(90);
  });

  it("adoucissent les reports : la majoration divisée par √m, écrite telle quelle", () => {
    const { ctx } = contexte({ report: 1.5 });
    const etat = neuf();
    etat.brisees = 1;
    etat.caisse = 0;
    etat.honore = 1_000;
    etat.echeances = [echeance(1, "orge", 1, 100)];
    avancer(etat, CRUE, ctx);
    expect(etat.echeances[0]!.du).toBe(Math.round(94 * (1 + 0.25 / Math.sqrt(1.5))));
    expect(derniere(etat)).toMatchObject({
      cle: "livre.reporteAdouci",
      valeurs: { majoration: 20.4 },
    });
  });
});

describe("le graphe et les formules (§ 7)", () => {
  it("sont bien formés, nommés par les textes, et les formules s'écrivent en entier", () => {
    const graphe = logique.graphe!(neuf());
    const formules = logique.formules!();
    expect(problemesGraphe(graphe, formules)).toEqual([]);
    for (const { cle } of graphe.noeuds) expect(textes[cle], cle).toBeTruthy();
    expect(formules).toHaveLength(7);
    for (const { expression } of formules) expect(expression).not.toBe("");
    // Le cycle de la strate : ce qui est honoré nourrit la confiance, qui ouvre les promesses.
    expect(graphe.liens).toContainEqual({ de: "honore", vers: "confiance" });
    expect(graphe.liens).toContainEqual({ de: "confiance", vers: "promesse" });
  });
});

describe("le filet (§ 4)", () => {
  it("tend sa fissure cinq minutes après l'issue, et l'allonge en deux minutes, comme partout", () => {
    const etat = neuf();
    etat.caisse = 0;
    etat.echeances = [echeance(1, "orge", 1, 100)];
    expect(logique.filet!(etat)).toBe(0);
    avancer(etat, CRUE);
    expect(etat.issue).toBe("defaut");
    // En défaut, le livre ne bouge plus, mais le temps passe.
    avancer(etat, 5 * 60);
    expect(logique.filet!(etat)).toBe(0);
    avancer(etat, 60);
    expect(logique.filet!(etat)).toBeCloseTo(0.5, 9);
    avancer(etat, 60);
    expect(logique.filet!(etat)).toBe(1);
  });
});

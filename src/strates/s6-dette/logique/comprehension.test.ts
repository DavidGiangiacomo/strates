// La Compréhension dans la dette (#104 ; fiche, § 7) : les noms des promesses, la valeur de la
// confiance, le report et les majorations des termes, qui se lèvent à l'usage, par un objet dès
// l'arrivée ou au délai ; et les trois actes propres de la strate : soldée, sans un report, et la
// grande crue au plus juste.
import { describe, expect, it } from "vitest";
import { detteDernierePromesse } from "../../../dev/dette";
import {
  BAREME,
  DELAI_LEVEE_MAX,
  delaiLevee,
  PROGRESSION,
  SANS_AIDE,
  SANS_ARTEFACT,
} from "../../../noyau/logique/comprehension";
import { elementsOpaques, type ContexteOpacite } from "../../../noyau/logique/opacite";
import type { ContexteTick, EvenementStrate } from "../../../noyau/logique/types";
import { textes } from "../textes.fr";
import { logique, type ActionDette, type Echeance, type EtatDette, type IdPromesse } from ".";
import {
  ACTES,
  CRUE,
  DOIGT_QUI_MONTRE,
  EXEMPLAIRES,
  GAGE_QUI_SOUFFLE,
  OPAQUES,
  PROMESSES,
  sortesDe,
} from "./regles";

const HEURE = 3600;
const DERNIERE: ActionDette = { type: "promettre", promesse: "toutesLesCrues", terme: 2 };

/** Une partie de la dette, et ce qu'elle signale au noyau. */
function partie(etat: EtatDette = logique.etatInitial({ graine: 1, journal: { strates: [] } })) {
  const evenements: EvenementStrate[] = [];
  const ctx: ContexteTick = {
    effets: { multiplicateur: () => 1, niveau: () => null },
    emettre: (e) => evenements.push(e),
  };
  return {
    etat,
    ctx,
    /** Fait passer `n` crues, une à une. */
    crues(n: number) {
      for (let i = 0; i < n; i++) logique.tick(etat, CRUE, ctx);
    },
    /** Fait passer les crues jusqu'à l'issue. */
    jusquALIssue() {
      for (let i = 0; i < 100 && etat.issue === null; i++) logique.tick(etat, CRUE, ctx);
    },
    promettre: (promesse: IdPromesse, terme: 2 | 6 | 18) =>
      logique.agir(etat, { type: "promettre", promesse, terme }, ctx),
    actes: () => evenements.flatMap((e) => (e.type === "acte" ? [e.acte] : [])),
    levees: () => [...new Set(evenements.flatMap((e) => (e.type === "levee" ? [e.element] : [])))],
  };
}

function echeance(numero: number, promesse: IdPromesse, crue: number | null, du: number): Echeance {
  return { numero, promesse, crue, du, origine: du, prix: du, reports: 0 };
}

describe("le barème de la dette", () => {
  it("compte ses trois actes propres, neuf points, et donne au plus ses quinze points : de 70 à 85", () => {
    expect(BAREME[6]).toEqual({
      [SANS_AIDE]: 3,
      [SANS_ARTEFACT]: 3,
      [ACTES.soldee]: 4,
      [ACTES.sansUnReport]: 3,
      [ACTES.auPlusJuste]: 2,
    });
    const total = Object.values(BAREME[6]).reduce((a, b) => a + b, 0);
    expect(total).toBe(PROGRESSION[6]);
    expect(70 + total).toBe(85);
  });
});

describe("l'opacité de la dette", () => {
  const opacite = logique.opacite!;
  const contexte = (objets: string[] = [], tempsStrate = 0, kappa = 60): ContexteOpacite => ({
    leves: [],
    kappa,
    tempsStrate,
    effets: { niveau: (id) => (objets.includes(id) ? "utile" : null) },
  });
  const opaques = (ctx: ContexteOpacite) => [...elementsOpaques(opacite, ctx)].sort();
  const TOUS = [
    ...PROMESSES.map(OPAQUES.nom),
    OPAQUES.confiance,
    OPAQUES.report,
    OPAQUES.majorations,
  ].sort();

  it("cache à l'arrivée les quinze noms des promesses, la confiance, le report et les majorations", () => {
    expect(opaques(contexte())).toEqual(TOUS);
  });

  it("couvre les mots qui les disent, et jamais ce dont dépend le seuil", () => {
    const cles = (id: string) => opacite.find((e) => e.id === id)?.cles ?? [];
    for (const id of PROMESSES) expect(cles(OPAQUES.nom(id))).toEqual([`promesse.${id}`]);
    for (const cle of cles(OPAQUES.confiance)) expect(textes[cle], cle).toMatch(/confiance/i);
    for (const cle of cles(OPAQUES.report)) expect(textes[cle], cle).toMatch(/report/i);
    for (const cle of cles(OPAQUES.majorations)) expect(textes[cle], cle).toMatch(/major|terme/i);
    // Les échéances, leurs crues et leurs montants, la caisse, le rapport, le refus d'une promesse et
    // la grande crue : on tombe en défaut par imprudence, jamais par ignorance.
    const couvertes = new Set(opacite.flatMap((e) => e.cles ?? []));
    for (const cle of [
      "caisse",
      "rapport",
      "confiance",
      "crue.prochaine",
      "tablette",
      "terme",
      "terme.grandeCrue",
      "echeancier",
      "echeance",
      "echeance.grandeCrue",
      "echeance.prevue",
      "solder",
      "grandeCrue.attendue",
      "grandeCrue.fixee",
      "livre.entree",
      "livre.honore",
      "livre.solde",
      "livre.echu",
      "livre.refus",
      "livre.derniere",
      "livre.grandeCrue",
      "livre.soldee",
      "livre.defaut",
    ]) {
      expect(textes[cle], cle).toBeDefined();
      expect(couvertes.has(cle), cle).toBe(false);
    }
  });

  it("se lève en partie dès l'arrivée : les noms avec le doigt qui montre, les noms et la confiance avec le gage qui souffle", () => {
    expect(opaques(contexte([DOIGT_QUI_MONTRE]))).toEqual([
      OPAQUES.confiance,
      OPAQUES.majorations,
      OPAQUES.report,
    ]);
    expect(opaques(contexte([GAGE_QUI_SOUFFLE]))).toEqual([OPAQUES.majorations, OPAQUES.report]);
  });

  it("se lève toute au délai : en six minutes et demie à κ = 60, en vingt au plus", () => {
    expect(delaiLevee(60) / 60).toBeCloseTo(6.4, 1);
    expect(opaques(contexte([], delaiLevee(60) - 1))).toEqual(TOUS);
    expect(opaques(contexte([], delaiLevee(60)))).toEqual([]);
    // Rien ne reste caché plus longtemps : le rappel de reprise, qui ne vient qu'après une demi-heure
    // d'absence, comptée en entier, peut écrire la dernière ligne du livre telle quelle.
    expect(opaques(contexte([], DELAI_LEVEE_MAX, 0))).toEqual([]);
  });
});

describe("les levées par l'usage", () => {
  it("lèvent le nom d'une sorte à sa première promesse, et les majorations à la première à 6 ou 18 crues", () => {
    const p = partie();
    p.etat.honore = 1_000;
    p.promettre("orge", 2);
    expect(p.levees()).toEqual([OPAQUES.nom("orge")]);
    p.promettre("huile", 18);
    expect(p.levees()).toEqual([OPAQUES.nom("orge"), OPAQUES.nom("huile"), OPAQUES.majorations]);
  });

  it("ne lèvent pas les majorations dans la dernière tablette, où le terme ne compte pas", () => {
    const p = partie(detteDernierePromesse());
    p.promettre("toutesLesCrues", 6);
    expect(p.etat.grandeCrue).not.toBeNull();
    expect(p.levees()).toEqual([OPAQUES.nom("toutesLesCrues")]);
  });

  it("lèvent la confiance au premier refus, sans le nom de la promesse refusée", () => {
    const p = partie();
    p.etat.echeances.push(echeance(3, "orge", 6, 100));
    p.promettre("huile", 2);
    expect(p.etat.livre.at(-1)!.cle).toBe("livre.refus");
    expect(p.levees()).toEqual([OPAQUES.confiance]);
  });

  it("lèvent la confiance à la première tablette brisée", () => {
    const p = partie();
    for (const id of sortesDe(1)) p.etat.promises[id] = EXEMPLAIRES;
    p.etat.tablette = 2;
    p.etat.echeances = [echeance(1, "etoffe", 1, 20)];
    p.crues(1);
    expect(p.etat.brisees).toBe(1);
    expect(p.levees()).toEqual([OPAQUES.confiance]);
  });

  it("lèvent le report quand une échéance reportée retombe : le livre l'a montré jusqu'au bout", () => {
    const p = partie();
    p.etat.caisse = 0;
    p.etat.honore = 1_000;
    p.etat.echeances = [echeance(1, "orge", 1, 100)];
    p.crues(1);
    expect(p.etat.reportees).toBe(1);
    expect(p.levees()).toEqual([]);
    p.crues(1);
    expect(p.levees()).toEqual([]);
    // Deux crues plus tard, elle retombe, majorée : le report se comprend.
    p.crues(1);
    expect(p.levees()).toEqual([OPAQUES.report]);
  });

  it("se font aussi pendant l'absence", () => {
    const p = partie();
    p.etat.caisse = 0;
    p.etat.honore = 1_000;
    p.etat.echeances = [echeance(1, "orge", 1, 100)];
    logique.absence!(p.etat, 4 * CRUE, p.ctx);
    expect(p.levees()).toEqual([OPAQUES.report]);
  });
});

describe("les actes propres", () => {
  /**
   * La dette avant sa dernière promesse (src/dev/dette.ts), faite après `attente` crues, puis jouée
   * jusqu'à l'issue. La caisse suit à la troisième crue : avant, la grande crue n'est pas couverte.
   */
  function derniere(attente: number, avant: (etat: EtatDette) => void = () => {}) {
    const p = partie(detteDernierePromesse());
    avant(p.etat);
    p.crues(attente);
    logique.agir(p.etat, DERNIERE, p.ctx);
    p.jusquALIssue();
    return p;
  }

  it("s'accomplissent tous trois quand la dernière promesse est faite dès que la caisse prévue couvre la grande crue", () => {
    const p = derniere(3);
    expect(p.etat.auPlusJuste).toBe(true);
    expect(p.etat.issue).toBe("soldee");
    expect(p.actes()).toEqual([ACTES.soldee, ACTES.sansUnReport, ACTES.auPlusJuste]);
  });

  it("manquent tous quand la grande crue est fixée trop tôt : elle n'est pas couverte, c'est le défaut", () => {
    const p = derniere(0);
    expect(p.etat.auPlusJuste).toBe(false);
    expect(p.etat.issue).toBe("defaut");
    expect(p.actes()).toEqual([]);
  });

  it("manquent « au plus juste » quand la dernière promesse a attendu deux crues de trop : soldée sans savoir de combien", () => {
    // Une crue de plus, la caisse prévue a une crue et demie d'avance : encore au plus juste.
    expect(derniere(4).actes()).toContain(ACTES.auPlusJuste);
    const p = derniere(5);
    expect(p.etat.auPlusJuste).toBe(false);
    expect(p.etat.issue).toBe("soldee");
    expect(p.actes()).toEqual([ACTES.soldee, ACTES.sansUnReport]);
  });

  it("manquent « sans un report » après un seul report dans toute la strate, même soldée", () => {
    const p = derniere(3, (etat) => {
      etat.reportees = 1;
    });
    expect(p.etat.issue).toBe("soldee");
    expect(p.actes()).toEqual([ACTES.soldee, ACTES.auPlusJuste]);
  });

  it("s'accomplissent aussi quand la grande crue tombe pendant l'absence", () => {
    const p = partie(detteDernierePromesse());
    p.crues(3);
    logique.agir(p.etat, DERNIERE, p.ctx);
    logique.absence!(p.etat, HEURE, p.ctx);
    expect(p.etat.issue).toBe("soldee");
    expect(p.actes()).toEqual([ACTES.soldee, ACTES.sansUnReport, ACTES.auPlusJuste]);
  });
});

describe("un état de la version 2", () => {
  it("prend la grande crue au plus juste, fausse : une grande crue déjà fixée ne la vaudra pas", () => {
    const v2: Record<string, unknown> = { ...partie().etat };
    delete v2.auPlusJuste;
    expect((logique.migrations[2]!(v2) as EtatDette).auPlusJuste).toBe(false);
    expect(logique.versionEtat).toBe(3);
  });
});

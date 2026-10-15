// La Compréhension vue du noyau (#56 ; docs/comprehension.md, § 2 et § 6) : les actes signalés par les
// strates, l'aide, « sans artefact », le crédit de κ à la descente, et sa persistance.
import { describe, expect, it } from "vitest";
import {
  creerLogiqueFactice,
  type ActionFactice,
  type EtatFactice,
} from "../../strates/factice/logique";
import {
  BAREME,
  CREUSER_AVANT_FISSURE,
  SANS_AIDE,
  SANS_ARTEFACT,
  type Bareme,
} from "./comprehension";
import { creerEtatNoyau, type EtatNoyau } from "./etat";
import { Noyau, type OptionsNoyau } from "./noyau";
import { Registre, type StrateQuelconque } from "./registre";
import { ecrireSauvegarde, lireSauvegarde } from "./sauvegarde";
import type { NumeroStrate } from "./types";

const DEBUT = 1_000 * 3600 * 1000;
/** Assez de cumul pour le seuil de la strate factice, et 12 points de fouille. */
const CUMUL = 6.12e8;

/**
 * Le barème réel, où la strate factice a un acte à elle : son premier générateur acheté, qu'elle
 * signale toujours par `{ type: "acte", acte: "premier-achat" }`.
 */
const BAREME_FACTICE: Bareme = {
  ...BAREME,
  1: { ...BAREME[1], "premier-achat": 5 },
  2: { ...BAREME[2], "premier-achat": 4 },
  8: { ...BAREME[8], "premier-achat": 1 },
};

/** Une partie de strates factices, aux profondeurs données, commencée à `profondeur`. */
async function partie(
  numeros: NumeroStrate[],
  { profondeur = numeros[0]!, artefacts = [] as string[], kappa = 0 } = {},
  options: OptionsNoyau = { bareme: BAREME_FACTICE },
  etat: EtatNoyau = creerEtatNoyau(1, DEBUT),
): Promise<Noyau> {
  const registre = new Registre();
  for (const n of numeros) {
    const logique = creerLogiqueFactice(n);
    registre.enregistrer(n, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
  }
  if (etat.meta.journal.strates.length === 0) {
    Object.assign(etat, { profondeur, artefacts: [...artefacts], kappa });
  }
  const noyau = new Noyau(registre, etat, options);
  await noyau.demarrer(DEBUT);
  return noyau;
}

const etatDe = (noyau: Noyau) => noyau.etatStrate as EtatFactice;
const entree = (noyau: Noyau, i = -1) => noyau.etat.meta.journal.strates.at(i)!;

function agir(noyau: Noyau, ...actions: ActionFactice[]): void {
  for (const action of actions) noyau.agir(action);
  noyau.tick(0);
}

/** Achète le premier générateur : la strate factice signale alors son acte. */
function premierAchat(noyau: Noyau): void {
  etatDe(noyau).unites = 10;
  agir(noyau, { type: "acheter" });
}

function auSeuil(noyau: Noyau): void {
  etatDe(noyau).cumul = CUMUL;
  noyau.tick(0);
}

/** Atteint le seuil et descend, sans rien emporter. */
async function descendre(noyau: Noyau): Promise<void> {
  auSeuil(noyau);
  noyau.ouvrirFouille();
  await noyau.descendre(DEBUT + 1000, []);
}

describe("les actes de compréhension", () => {
  it("notent une fois l'acte que la strate signale, sans rien créditer avant la descente", async () => {
    const noyau = await partie([1, 2]);
    premierAchat(noyau);
    etatDe(noyau).unites = 100;
    agir(noyau, { type: "acheter" }, { type: "acheter" });
    expect(entree(noyau).actes).toEqual(["premier-achat"]);
    expect(noyau.etat.kappa).toBe(0);
    expect(entree(noyau).kappaGagne).toBeUndefined();
  });

  it("créditent leur barème à la descente : κ monte, et le journal le note", async () => {
    const noyau = await partie([1, 2]);
    premierAchat(noyau);
    await descendre(noyau);
    // « premier-achat » vaut 5 dans ce barème, et « sans aide » 3 à la surface.
    expect(entree(noyau, 0).actes).toEqual(["premier-achat", SANS_AIDE]);
    expect(entree(noyau, 0).kappaGagne).toBe(8);
    expect(noyau.etat.kappa).toBe(8);
    expect(entree(noyau).actes).toEqual([]);
  });

  it("ignorent un acte que le barème ne connaît pas : c'est le noyau qui l'applique", async () => {
    const noyau = await partie([1, 2], {}, {});
    premierAchat(noyau);
    expect(entree(noyau).actes).toEqual([]);
    await descendre(noyau);
    expect(noyau.etat.kappa).toBe(BAREME[1][SANS_AIDE]);
  });

  it("ne créditent rien quand on rebouche, puis une seule fois à la descente", async () => {
    const noyau = await partie([1, 2]);
    premierAchat(noyau);
    auSeuil(noyau);
    noyau.ouvrirFouille();
    noyau.reboucher();
    expect(noyau.etat.kappa).toBe(0);
    expect(entree(noyau).kappaGagne).toBeUndefined();
    noyau.ouvrirFouille();
    await noyau.descendre(DEBUT + 1000, []);
    expect(noyau.etat.kappa).toBe(8);
  });

  it("ne dépassent jamais 100", async () => {
    const noyau = await partie([1, 2], { kappa: 97 });
    premierAchat(noyau);
    await descendre(noyau);
    expect(noyau.etat.kappa).toBe(100);
    expect(entree(noyau, 0).kappaGagne).toBe(8);
  });
});

describe("l'acte « sans aide »", () => {
  it("se gagne en atteignant le seuil sans avoir ouvert l'aide", async () => {
    const noyau = await partie([1, 2]);
    auSeuil(noyau);
    expect(entree(noyau).actes).toEqual([SANS_AIDE]);
  });

  it("se perd si l'aide a été ouverte avant le seuil", async () => {
    const noyau = await partie([1, 2]);
    noyau.noterAide();
    auSeuil(noyau);
    expect(entree(noyau).actes).toEqual([]);
    await descendre(noyau);
    expect(noyau.etat.kappa).toBe(0);
  });

  it("reste gagné si l'aide n'est ouverte qu'après le seuil", async () => {
    const noyau = await partie([1, 2]);
    auSeuil(noyau);
    noyau.noterAide();
    expect(entree(noyau).aideConsultee).toBe(true);
    await descendre(noyau);
    expect(noyau.etat.kappa).toBe(3);
  });
});

describe("l'acte « creuser avant la fissure »", () => {
  /** Une surface factice qui tend un filet : sa fissure en est à `avancee.valeur`. */
  async function surfaceAvecFilet(avancee: { valeur: number }): Promise<Noyau> {
    const registre = new Registre();
    for (const n of [1, 2] as const) {
      const logique = { ...creerLogiqueFactice(n), filet: () => avancee.valeur };
      registre.enregistrer(n, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
    }
    const noyau = new Noyau(registre, creerEtatNoyau(1, DEBUT));
    await noyau.demarrer(DEBUT);
    return noyau;
  }

  it("se gagne en creusant avant que la fissure n'apparaisse", async () => {
    const noyau = await surfaceAvecFilet({ valeur: 0 });
    auSeuil(noyau);
    noyau.ouvrirFouille();
    expect(entree(noyau).actes).toEqual([SANS_AIDE, CREUSER_AVANT_FISSURE]);
    await noyau.descendre(DEBUT + 1000, []);
    // La surface donne alors ses 8 points : 3 sans aide, 5 pour avoir creusé de soi-même.
    expect(noyau.etat.kappa).toBe(8);
  });

  it("se perd si le joueur ne creuse qu'une fois la fissure partie", async () => {
    const noyau = await surfaceAvecFilet({ valeur: 0.1 });
    auSeuil(noyau);
    noyau.ouvrirFouille();
    expect(entree(noyau).actes).toEqual([SANS_AIDE]);
  });

  it("reste gagné quand on rebouche et qu'on ne descend qu'après la fissure", async () => {
    const avancee = { valeur: 0 };
    const noyau = await surfaceAvecFilet(avancee);
    auSeuil(noyau);
    noyau.ouvrirFouille();
    noyau.reboucher();
    avancee.valeur = 1;
    noyau.ouvrirFouille();
    expect(entree(noyau).actes).toEqual([SANS_AIDE, CREUSER_AVANT_FISSURE]);
  });

  it("ne se juge pas dans une strate sans filet", async () => {
    const noyau = await partie([1, 2]);
    auSeuil(noyau);
    noyau.ouvrirFouille();
    expect(entree(noyau).actes).toEqual([SANS_AIDE]);
  });
});

describe("l'acte « sans artefact »", () => {
  it("se gagne à la descente quand aucun objet n'agissait dans la strate", async () => {
    const noyau = await partie([2, 3]);
    await descendre(noyau);
    expect(entree(noyau, 0).actes).toEqual([SANS_AIDE, SANS_ARTEFACT]);
    expect(noyau.etat.kappa).toBe(BAREME[2][SANS_AIDE]! + BAREME[2][SANS_ARTEFACT]!);
  });

  it("se perd avec un objet qui agit, puissant ou utile", async () => {
    // Un objet de la surface est puissant dans les caves, utile dans l'atelier (D-002).
    for (const profondeur of [2, 3] as const) {
      const noyau = await partie([profondeur, (profondeur + 1) as NumeroStrate], {
        artefacts: ["s1-turbine"],
      });
      await descendre(noyau);
      expect(entree(noyau, 0).actes).not.toContain(SANS_ARTEFACT);
    }
  });

  it("se gagne avec des objets trop usés pour agir encore", async () => {
    // Décoratif dans le réseau : visible, sans effet.
    const noyau = await partie([4, 5], { artefacts: ["s1-turbine"] });
    await descendre(noyau);
    expect(entree(noyau, 0).actes).toContain(SANS_ARTEFACT);
  });

  it("ne se note jamais à la surface, qui ne reçoit aucun objet", async () => {
    const noyau = await partie([1, 2]);
    await descendre(noyau);
    expect(entree(noyau, 0).actes).toEqual([SANS_AIDE]);
  });

  it("regarde les objets de la strate quittée, pas ceux qu'on emporte", async () => {
    // Un barème où la surface connaîtrait l'acte : on y descend avec la présélection.
    const bareme: Bareme = { ...BAREME_FACTICE, 1: { ...BAREME_FACTICE[1], [SANS_ARTEFACT]: 2 } };
    const noyau = await partie([1, 2], {}, { bareme });
    auSeuil(noyau);
    const fouille = noyau.ouvrirFouille();
    await noyau.descendre(DEBUT + 1000, fouille.preselection);
    expect(noyau.etat.artefacts).toEqual(fouille.preselection);
    expect(noyau.etat.artefacts.length).toBeGreaterThan(0);
    expect(entree(noyau, 0).actes).toEqual([SANS_AIDE, SANS_ARTEFACT]);
  });
});

describe("le fond", () => {
  it("crédite son arrivée dès qu'on y arrive, puis plus aucun acte", async () => {
    const noyau = await partie([7, 8]);
    await descendre(noyau);
    expect(noyau.etat.profondeur).toBe(8);
    expect(entree(noyau).actes).toEqual(["arrivee"]);
    expect(entree(noyau).kappaGagne).toBe(4);
    // Sans aide et sans artefact dans le lit (2 + 3), puis l'arrivée au fond (4).
    expect(noyau.etat.kappa).toBe(9);
    premierAchat(noyau);
    expect(entree(noyau).actes).toEqual(["arrivee"]);
    expect(noyau.etat.kappa).toBe(9);
  });
});

describe("la persistance de κ", () => {
  it("ne perd jamais κ : il traverse les descentes, la sauvegarde et la relecture", async () => {
    const noyau = await partie([1, 2, 3]);
    premierAchat(noyau);
    await descendre(noyau);
    noyau.reprendre();
    await descendre(noyau);
    expect(noyau.etat.kappa).toBe(8 + 3 + 3);

    const lu = lireSauvegarde(ecrireSauvegarde(noyau.etat, "0.0.0"), "0.0.0");
    if (lu.type !== "ok") throw new Error(lu.type);
    expect(lu.etat.kappa).toBe(14);
    expect(lu.etat.meta.journal.strates.map((e) => [e.actes, e.kappaGagne])).toEqual([
      [["premier-achat", SANS_AIDE], 8],
      [[SANS_AIDE, SANS_ARTEFACT], 6],
      [[], undefined],
    ]);

    // Relue, la partie reprend avec son κ, et ne recrédite rien.
    const reprise = await partie([1, 2, 3], {}, { bareme: BAREME_FACTICE }, lu.etat);
    expect(reprise.etat.kappa).toBe(14);
    auSeuil(reprise);
    expect(entree(reprise).actes).toEqual([SANS_AIDE]);
  });

  it("garde le seuil déjà jugé d'une partie relue : « sans aide » n'est pas noté deux fois", async () => {
    const noyau = await partie([1, 2]);
    auSeuil(noyau);
    const lu = lireSauvegarde(ecrireSauvegarde(noyau.etat, "0.0.0"), "0.0.0");
    if (lu.type !== "ok") throw new Error(lu.type);
    const reprise = await partie([1, 2], {}, { bareme: BAREME_FACTICE }, lu.etat);
    reprise.tick(0);
    expect(entree(reprise).actes).toEqual([SANS_AIDE]);
  });
});

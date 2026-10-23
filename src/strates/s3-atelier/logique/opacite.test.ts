// L'opacité de l'atelier et ses actes de compréhension (fiche, § 7 ; #95) : ce qui se cache, comment
// cela se lève, et ce que la logique signale au noyau.
import { describe, expect, it } from "vitest";
import { delaiLevee } from "../../../noyau/logique/comprehension";
import { creerEtatNoyau } from "../../../noyau/logique/etat";
import { Noyau } from "../../../noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../../../noyau/logique/registre";
import type { ContexteTick, EvenementStrate } from "../../../noyau/logique/types";
import { logique, type ActionAtelier, type EtatAtelier, type PieceAtelier } from ".";
import { atelierDernierePiece, CASE_DERNIERE } from "../../../dev/atelier";
import { textes } from "../textes.fr";
import { etatInitial } from "./etat";
import { ACTES, assemblageAcheve, coinRessort, sansLimer, TOUR, type IdPiece } from "./regles";

/** Un contexte qui garde ce que la logique signale. */
function contexte() {
  const evenements: EvenementStrate[] = [];
  const ctx: ContexteTick = {
    effets: { multiplicateur: () => 1, niveau: () => null },
    emettre: (e) => evenements.push(e),
  };
  const actes = () => evenements.flatMap((e) => (e.type === "acte" ? [e.acte] : []));
  const levees = () => evenements.flatMap((e) => (e.type === "levee" ? [e.element] : []));
  return { ctx, evenements, actes, levees };
}

/** Une pièce sur l'établi, numérotée à la suite. */
function ajouter(etat: EtatAtelier, id: IdPiece, rot: PieceAtelier["rot"] = 0): number {
  const repere = etat.pieces.length + 1;
  etat.pieces.push({ id, repere, case: null, rot, limees: [] });
  return repere;
}

const element = (id: string) => logique.opacite!.find((e) => e.id === id)!;

describe("l'opacité de l'atelier", () => {
  it("cache les noms des pièces, sauf la roue, leurs valeurs et le rôle de la lime", () => {
    const ids = logique.opacite!.map((e) => e.id);
    expect(ids).toEqual([
      "nom.cliquet",
      "nom.renvoi",
      "nom.pignon",
      "nom.secteur",
      "nom.echappement",
      "nom.ancre",
      "nom.champ",
      "nom.arbre",
      "nom.rochet",
      "nom.grandeRoue",
      "nom.balancier",
      "valeurs",
      "lime",
    ]);
    // Chaque clé qu'elle couvre est un texte de l'atelier, et une seule fois.
    const cles = logique.opacite!.flatMap((e) => e.cles ?? []);
    for (const cle of cles) expect(textes[cle], cle).toBeDefined();
    expect(new Set(cles).size).toBe(cles.length);
  });

  it("lève chaque note avec le nom qu'elle dit : la seconde série cite la première", () => {
    expect(element("nom.cliquet").cles).toEqual([
      "piece.cliquet",
      "piece.cliquet.note",
      "piece.ancre.note",
    ]);
    expect(element("nom.ancre").cles).toEqual(["piece.ancre"]);
    expect(element("nom.balancier").cles).toEqual(["piece.balancier", "piece.balancier.note"]);
    // « Profil de la roue dentée. » : la roue a toujours son nom.
    expect(logique.opacite!.some((e) => e.cles?.includes("piece.echappement.note"))).toBe(false);
  });

  it("se lève dès l'arrivée par les objets : les deux fenêtres pour les noms, le cahier pour tout", () => {
    expect(element("nom.secteur").objets).toEqual(["s1-double-ecran", "s2-registre"]);
    expect(element("valeurs").objets).toEqual(["s2-registre"]);
    expect(element("lime")).toMatchObject({
      cles: ["lime", "main.limer", "noeud.lime"],
      objets: ["s2-registre"],
    });
  });

  it("lève à l'usage le nom d'une pièce qui tourne, les valeurs à l'agrandissement, la lime au coup", () => {
    const { ctx, levees } = contexte();
    const etat = etatInitial();
    etat.stock = 1e6;
    // Un cliquet sous la première roue, sa dent vers elle : il tourne.
    const c = ajouter(etat, "cliquet", 2);
    logique.agir(etat, { type: "poser", repere: c, case: [0, 2] }, ctx);
    expect(levees()).toContain("nom.cliquet");
    expect(levees()).not.toContain("valeurs");
    expect(levees()).not.toContain("lime");
    logique.agir(etat, { type: "agrandir" }, ctx);
    expect(levees()).toContain("valeurs");
    // Une roue sur l'établi, et un coup de lime.
    const r = ajouter(etat, "roue");
    logique.agir(etat, { type: "limer", repere: r, cote: 0 }, ctx);
    expect(levees()).toContain("lime");
  });
});

describe("les actes de l'atelier", () => {
  /** L'arrivée, et un cliquet au-dessus de la première roue : son dos lisse contre la roue, sa dent contre le cadre. */
  function gene() {
    const c = contexte();
    const etat = etatInitial();
    const cliquet = ajouter(etat, "cliquet");
    logique.agir(etat, { type: "poser", repere: cliquet, case: [0, 2] }, c.ctx);
    expect(Object.keys(etat.genes)).toHaveLength(2);
    return { ...c, etat, cliquet };
  }

  it("la gêne défaite avant que l'atelier ne la montre : tournée avant un tour", () => {
    const { ctx, etat, cliquet, actes } = gene();
    for (let i = 0; i < 10; i++) logique.tick(etat, 0.5, ctx);
    logique.agir(etat, { type: "tourner", repere: cliquet }, ctx);
    expect(actes()).toEqual([ACTES.geneDefaite]);
  });

  it("ne compte pas une gêne déjà montrée, ni celle que la lime ou l'agrandissement défont", () => {
    const tard = gene();
    logique.tick(tard.etat, TOUR, tard.ctx);
    logique.agir(tard.etat, { type: "tourner", repere: tard.cliquet }, tard.ctx);
    expect(tard.actes()).toEqual([]);
    // La dent du cliquet, contre le cadre, limée tout de suite.
    const lime = gene();
    logique.agir(lime.etat, { type: "limer", repere: lime.cliquet, cote: 0 }, lime.ctx);
    expect(Object.keys(lime.etat.genes)).toHaveLength(1);
    expect(lime.actes()).toEqual([]);
    // Le plan agrandi éloigne le cadre : la gêne contre lui disparaît, sans acte.
    const plan = gene();
    plan.etat.stock = 1e6;
    logique.agir(plan.etat, { type: "agrandir" }, plan.ctx);
    expect(Object.keys(plan.etat.genes)).toHaveLength(1);
    expect(plan.actes()).toEqual([]);
  });

  /**
   * Le plan de 6 × 6 rempli de roues, leurs dents contre le cadre limées : tout engrène, rien ne
   * frotte. La dernière case attend une roue de l'établi.
   */
  function planPlein(limer = true) {
    const c = contexte();
    const etat = etatInitial();
    const r = coinRessort(6);
    for (let l = 0; l < 6; l++) {
      for (let k = 0; k < 6; k++) {
        const pris = etat.pieces.some((p) => p.case?.[0] === l && p.case[1] === k);
        if (pris || (l >= r && l < r + 2 && k >= r && k < r + 2)) continue;
        const limees = [l === 0 && 0, k === 5 && 1, l === 5 && 2, k === 0 && 3].filter(
          (d): d is number => d !== false,
        );
        const repere = etat.pieces.length + 1;
        etat.pieces.push({ id: "roue", repere, case: [l, k], rot: 0, limees: limer ? limees : [] });
      }
    }
    const derniere = etat.pieces.at(-1)!;
    const place = derniere.case!;
    derniere.case = null;
    return { ...c, etat, derniere, place };
  }

  it("le premier plan plein qui tourne : le plan de 6 × 6 rempli, tout entraîné, rien qui frotte", () => {
    const { ctx, etat, derniere, place, actes } = planPlein();
    logique.agir(etat, { type: "poser", repere: derniere.repere, case: place }, ctx);
    expect(actes()).toEqual([ACTES.premierPlanPlein]);
    // Sans les dents limées, les roues du bord frottent contre le cadre : pas d'acte.
    const brut = planPlein(false);
    logique.agir(
      brut.etat,
      { type: "poser", repere: brut.derniere.repere, case: brut.place },
      brut.ctx,
    );
    expect(brut.actes()).toEqual([]);
  });

  /**
   * Un assemblage achevé sans un seul coup de lime : des renvois aux coins, des secteurs sur les
   * bords, leur côté lisse contre le cadre, et des roues partout ailleurs. Le seuil ne compte pas la
   * nomenclature, seulement le plan plein, tout entraîné, sans frottement. La dernière roue attend.
   */
  function planSansLime() {
    const c = contexte();
    const etat = etatInitial();
    etat.taille = 12;
    etat.pieces = [];
    const r = coinRessort(12);
    const coins: Record<string, PieceAtelier["rot"]> = {
      "0,0": 1,
      "0,11": 2,
      "11,0": 0,
      "11,11": 3,
    };
    for (let l = 0; l < 12; l++) {
      for (let k = 0; k < 12; k++) {
        if (l >= r && l < r + 2 && k >= r && k < r + 2) continue;
        let id: IdPiece = "roue";
        let rot: PieceAtelier["rot"] = 0;
        if (`${l},${k}` in coins) [id, rot] = ["renvoi", coins[`${l},${k}`]!];
        else if (l === 0) [id, rot] = ["secteur", 2];
        else if (k === 11) [id, rot] = ["secteur", 3];
        else if (l === 11) [id, rot] = ["secteur", 0];
        else if (k === 0) [id, rot] = ["secteur", 1];
        etat.pieces.push({ id, repere: etat.pieces.length + 1, case: [l, k], rot, limees: [] });
      }
    }
    const derniere = etat.pieces.find((p) => p.case?.[0] === 3 && p.case[1] === 3)!;
    derniere.case = null;
    return { ...c, etat, derniere };
  }

  it("le seuil sans limer : l'assemblage achevé sans un seul coup de lime", () => {
    const { ctx, etat, derniere, actes } = planSansLime();
    expect(sansLimer(etat)).toBe(true);
    logique.agir(etat, { type: "poser", repere: derniere.repere, case: [3, 3] }, ctx);
    expect(assemblageAcheve(etat)).toBe(true);
    expect(etat.seuilAtteintA).not.toBeNull();
    expect(actes()).toContain(ACTES.sansLimer);
  });

  it("ne compte pas le seuil atteint avec des dents limées", () => {
    const { ctx, actes } = contexte();
    const etat = atelierDernierePiece();
    expect(sansLimer(etat)).toBe(false);
    const derniere = etat.pieces.find((p) => !p.case)!;
    logique.agir(
      etat,
      { type: "poser", repere: derniere.repere, case: CASE_DERNIERE, rot: derniere.rot },
      ctx,
    );
    expect(etat.seuilAtteintA).not.toBeNull();
    expect(actes()).not.toContain(ACTES.sansLimer);
  });
});

describe("l'opacité et les actes, à travers le noyau", () => {
  async function atelier(kappa: number, artefacts: string[] = []) {
    const registre = new Registre();
    registre.enregistrer(3, async () => ({ logique, vue: null, textes }) as StrateQuelconque);
    const etat = creerEtatNoyau(1, 0);
    Object.assign(etat, { profondeur: 3, kappa, artefacts });
    const noyau = new Noyau(registre, etat);
    await noyau.demarrer(0);
    return noyau;
  }
  const opaques = (noyau: Noyau) => [...noyau.elementsOpaques()].sort();
  const agir = (noyau: Noyau, action: ActionAtelier) => {
    noyau.agir(action);
    noyau.avancer(0.1);
  };

  it("arrive avec κ = 22 tout opaque, et lève tout au délai L(κ), treize minutes", async () => {
    const noyau = await atelier(22);
    expect(opaques(noyau)).toHaveLength(13);
    expect(delaiLevee(22) / 60).toBeCloseTo(13, 0);
    noyau.avancer(delaiLevee(22) - 1);
    expect(opaques(noyau)).toHaveLength(13);
    noyau.avancer(2);
    expect(opaques(noyau)).toEqual([]);
  });

  it("nomme le cliquet quand il tourne, et note l'acte d'une gêne défaite au journal", async () => {
    const noyau = await atelier(22);
    const etat = () => noyau.etatStrate as EtatAtelier;
    noyau.avancer(60);
    agir(noyau, { type: "acheter", piece: "roue" });
    // Achetée, la roue vient sur l'établi : posée contre le cadre, au-dessus de la première roue.
    const roue = etat().pieces.at(-1)!.repere;
    agir(noyau, { type: "poser", repere: roue, case: [0, 2] });
    agir(noyau, { type: "limer", repere: roue, cote: 1 });
    expect(opaques(noyau)).not.toContain("lime");
    // Un cliquet, que le stock ne paie pas encore : le cumul l'atteint en quelques tours.
    noyau.avancer(40 * 60);
    agir(noyau, { type: "acheter", piece: "cliquet" });
    const cliquet = etat().pieces.at(-1)!.repere;
    // Posé à côté de la roue limée, sa dent vers le cadre : il frotte, et ne tourne pas.
    agir(noyau, { type: "poser", repere: cliquet, case: [0, 3] });
    const entree = noyau.etat.meta.journal.strates.at(-1)!;
    expect(entree.leves).not.toContain("nom.cliquet");
    // Tourné d'un quart, il ne frotte plus le cadre : la gêne est défaite avant d'avoir duré un tour.
    agir(noyau, { type: "tourner", repere: cliquet });
    expect(entree.actes).toContain(ACTES.geneDefaite);
    // D'un quart encore, sa dent engrène avec la seconde roue : il tourne, et prend son nom.
    agir(noyau, { type: "tourner", repere: cliquet });
    expect(entree.leves).toEqual(expect.arrayContaining(["lime", "nom.cliquet"]));
  });

  it("lève les noms dès l'arrivée avec les deux fenêtres, et tout avec le cahier à lignes", async () => {
    const fenetres = await atelier(22, ["s1-double-ecran"]);
    expect(opaques(fenetres)).toEqual(["lime", "valeurs"]);
    const cahier = await atelier(22, ["s2-registre"]);
    expect(opaques(cahier)).toEqual([]);
  });
});

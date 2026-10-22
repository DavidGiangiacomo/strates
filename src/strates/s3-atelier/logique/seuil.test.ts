// Le seuil de l'atelier (#79 ; fiche, § 4) : le plan à 12 × 12, toute la nomenclature posée, plus une
// case libre ni rien sur l'établi, rien ne frotte, et toutes les pièces entraînées. Il tombe au geste
// qui achève l'assemblage, et le reste. L'accumulation seule ne le franchit pas (I4).
import { describe, expect, it } from "vitest";
import { atelierAcheve, atelierDernierePiece, CASE_DERNIERE } from "../../../dev/atelier";
import { EFFETS_NEUTRES } from "../../../noyau/logique/effets";
import type { ContexteTick, EvenementStrate } from "../../../noyau/logique/types";
import { logique } from ".";
import { etatInitial, type EtatAtelier } from "./etat";
import { analyser, assemblageAcheve, PIECES, placeLibre, TAILLE_MAX } from "./regles";

function contexte(evenements: EvenementStrate[] = []): ContexteTick {
  return { effets: EFFETS_NEUTRES, emettre: (e) => evenements.push(e) };
}

/** Les exemplaires posés de chaque pièce. */
function comptes(etat: EtatAtelier): Record<string, number> {
  const n: Record<string, number> = {};
  for (const p of etat.pieces) if (p.case) n[p.id] = (n[p.id] ?? 0) + 1;
  return n;
}

const pieceEn = (etat: EtatAtelier, [l, c]: [number, number]) =>
  etat.pieces.find((p) => p.case?.[0] === l && p.case[1] === c)!;

describe("l'assemblage achevé", () => {
  it("existe avec la nomenclature entière : les comptes tombent juste, rien ne frotte, tout tourne", () => {
    const etat = atelierAcheve();
    expect(comptes(etat)).toEqual(Object.fromEntries(PIECES.map((d) => [d.id, d.exemplaires])));
    const analyse = analyser(etat);
    expect(analyse.casesLibres).toBe(0);
    expect(analyse.frottements).toEqual([]);
    expect([...analyse.pieces.values()].every((p) => p.entrainee)).toBe(true);
    expect(assemblageAcheve(etat)).toBe(true);
  });

  it("franchit le seuil au geste qui le termine, et la légende l'écrit", () => {
    const etat = atelierDernierePiece();
    const ctx = contexte();
    expect(assemblageAcheve(etat)).toBe(false);
    expect(logique.seuil(etat).atteint).toBe(false);

    const derniere = etat.pieces.find((p) => !p.case)!;
    const evenements: EvenementStrate[] = [];
    logique.agir(
      etat,
      { type: "poser", repere: derniere.repere, case: CASE_DERNIERE, rot: derniere.rot },
      contexte(evenements),
    );
    expect(logique.seuil(etat).atteint).toBe(true);
    expect(etat.seuilAtteintA).toBe(etat.temps);
    expect(etat.legende.at(-1)).toEqual({ cle: "cases.aucune", valeurs: {} });
    expect(evenements).toContainEqual({ type: "trace", cle: "cases.aucune", valeurs: {} });
    expect(logique.rappel!(etat)).toEqual(["Il ne reste aucune case."]);

    // Une fois atteint, il le reste : défaire l'assemblage ne le reprend pas, ni ne le réécrit.
    logique.agir(etat, { type: "mettreDeCote", repere: derniere.repere }, ctx);
    logique.agir(
      etat,
      { type: "poser", repere: derniere.repere, case: CASE_DERNIERE, rot: derniere.rot },
      ctx,
    );
    expect(logique.seuil(etat).atteint).toBe(true);
    expect(etat.legende.filter((l) => l.cle === "cases.aucune")).toHaveLength(1);
  });

  it("ouvre alors le filet : la fissure part cinq minutes après", () => {
    const etat = atelierDernierePiece();
    const derniere = etat.pieces.find((p) => !p.case)!;
    logique.agir(
      etat,
      { type: "poser", repere: derniere.repere, case: CASE_DERNIERE, rot: derniere.rot },
      contexte(),
    );
    expect(logique.filet!(etat)).toBe(0);
    logique.tick(etat, 6 * 60, contexte());
    expect(logique.filet!(etat)).toBeGreaterThan(0);
  });
});

describe("une grille pleine qui ne fonctionne pas", () => {
  it("ne franchit pas le seuil quand une dent frotte", () => {
    const etat = atelierAcheve();
    // La dernière pièce, tournée : sa dent regarde son voisin de droite, lisse de ce côté.
    const derniere = pieceEn(etat, CASE_DERNIERE);
    derniere.rot = ((derniere.rot + 1) % 4) as typeof derniere.rot;
    expect(analyser(etat).frottements.length).toBeGreaterThan(0);
    expect(assemblageAcheve(etat)).toBe(false);
  });

  it("ne le franchit pas quand une pièce n'est pas entraînée, même sans frottement", () => {
    const etat = atelierAcheve();
    // La dernière pièce et sa voisine du dessus limées l'une contre l'autre : plus rien ne la relie.
    const derniere = pieceEn(etat, CASE_DERNIERE);
    derniere.limees = PIECES.find((d) => d.id === derniere.id)!.dents.slice();
    const dessus = pieceEn(etat, [CASE_DERNIERE[0] - 1, CASE_DERNIERE[1]]);
    dessus.limees.push((2 - dessus.rot + 4) % 4);
    const analyse = analyser(etat);
    expect(analyse.frottements).toEqual([]);
    expect(analyse.pieces.get(derniere.repere)!.entrainee).toBe(false);
    expect(assemblageAcheve(etat)).toBe(false);
  });

  it("ne le franchit pas tant qu'une pièce attend sur l'établi, ni sur un plan plus petit", () => {
    expect(assemblageAcheve(atelierDernierePiece())).toBe(false);
    // Le plan de l'arrivée, plein de roues qui tournent toutes : il n'a pas sa taille.
    const petit = etatInitial();
    let repere = petit.pieces.length;
    for (let l = 0; l < petit.taille; l++) {
      for (let c = 0; c < petit.taille; c++) {
        if (placeLibre(petit, 1, [l, c])) {
          petit.pieces.push({ id: "roue", repere: ++repere, case: [l, c], rot: 0, limees: [] });
        }
      }
    }
    expect(analyser(petit).casesLibres).toBe(0);
    expect(assemblageAcheve(petit)).toBe(false);
  });
});

describe("l'accumulation seule (I4)", () => {
  it("achète toute la nomenclature et remplit le plan, mais ne franchit pas le seuil", () => {
    // Un stock sans fond : chaque pièce sur la première place libre, telle quelle, les grandes d'abord
    // pour qu'elles trouvent leur carré.
    const etat = etatInitial();
    const ctx = contexte();
    etat.stock = etat.cumul = Infinity;
    while (etat.taille < TAILLE_MAX) logique.agir(etat, { type: "agrandir" }, ctx);
    const ordre = [...PIECES].sort((a, b) => b.largeur - a.largeur);
    for (const d of ordre) {
      while (etat.pieces.filter((p) => p.id === d.id).length < d.exemplaires) {
        logique.agir(etat, { type: "acheter", piece: d.id }, ctx);
        const piece = etat.pieces.at(-1)!;
        const place = premierePlace(etat, d.largeur);
        if (place) {
          logique.agir(etat, { type: "poser", repere: piece.repere, case: place, rot: 0 }, ctx);
        }
      }
    }
    const analyse = analyser(etat);
    expect(etat.pieces.length).toBe(125);
    expect(etat.pieces.every((p) => p.case)).toBe(true);
    expect(analyse.casesLibres).toBe(0);
    expect(analyse.frottements.length).toBeGreaterThan(0);
    expect(logique.seuil(etat).atteint).toBe(false);
  });
});

/** La première place libre pour une pièce de `s` cases de côté, ligne après ligne. */
function premierePlace(etat: EtatAtelier, s: number): [number, number] | null {
  for (let l = 0; l < etat.taille; l++) {
    for (let c = 0; c < etat.taille; c++) if (placeLibre(etat, s, [l, c])) return [l, c];
  }
  return null;
}

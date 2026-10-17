// Les débuts de l'atelier, joués à travers le noyau par deux joueurs automatiques (fiche, § 4 et § 5) :
// le joueur réflexe, qui pose chaque pièce sur la première case libre sans la tourner, et un joueur
// naturel, qui pose chaque pièce là où la production monte le plus, en gardant des dents libres. Ce
// sont des joueurs de test ; ceux de l'équilibrage viendront avec #96.
import { describe, expect, it } from "vitest";
import { creerEtatNoyau } from "../../../noyau/logique/etat";
import { Noyau } from "../../../noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../../../noyau/logique/registre";
import { logique, type ActionAtelier, type EtatAtelier, type PieceAtelier } from ".";
import {
  agrandissementVisible,
  analyser,
  casesLibres,
  grille,
  largeur,
  PIECES,
  pieceVisible,
  placeLibre,
  prixPiece,
  prochainAgrandissement,
  restantes,
  type DefPiece,
} from "./regles";

async function demarrer(): Promise<Noyau> {
  const registre = new Registre();
  registre.enregistrer(3, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
  const etat = creerEtatNoyau(1, 0);
  etat.profondeur = 3;
  const noyau = new Noyau(registre, etat);
  await noyau.demarrer(0);
  return noyau;
}

/** Ce que le joueur fait maintenant, ou null s'il attend. */
type Politique = (etat: EtatAtelier) => ActionAtelier | null;

/** Les coins où une pièce de `s` cases de côté tiendrait, ligne après ligne. */
function places(etat: EtatAtelier, s: number): [number, number][] {
  const libres: [number, number][] = [];
  for (let l = 0; l < etat.taille; l++) {
    for (let c = 0; c < etat.taille; c++) if (placeLibre(etat, s, [l, c])) libres.push([l, c]);
  }
  return libres;
}

const achetables = (e: EtatAtelier) =>
  PIECES.filter((d) => pieceVisible(e, d) && restantes(e, d) > 0 && prixPiece(e, d) <= e.stock);

function agrandir(e: EtatAtelier): ActionAtelier | null {
  const a = prochainAgrandissement(e);
  return a && agrandissementVisible(e) && a.prix <= e.stock ? { type: "agrandir" } : null;
}

/** La pièce la moins chère, sur la première case libre, telle quelle (fiche, § 5). */
const reflexe: Politique = (e) => {
  const enMain = e.pieces.find((p) => !p.case);
  const place = enMain && places(e, largeur(enMain))[0];
  if (enMain && place) return { type: "poser", repere: enMain.repere, case: place, rot: 0 };
  const moinsChere = (a: DefPiece, b: DefPiece) => prixPiece(e, a) - prixPiece(e, b);
  const achat = achetables(e).sort(moinsChere)[0];
  if (!enMain && achat) return { type: "acheter", piece: achat.id };
  return casesLibres(e) === 0 ? agrandir(e) : null;
};

/**
 * Les coins où poser une pièce pour qu'elle tourne : contre le ressort ou contre une pièce qui tourne.
 * Une grande pièce les essaie tous.
 */
function placesUtiles(e: EtatAtelier, s: number): [number, number][] {
  if (s > 1) return places(e, s);
  const a = analyser(e);
  const n = e.taille;
  const g = grille(e);
  const tourne = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= n || y >= n) return false;
    const o = g[x * n + y]!;
    return o === -1 || (o > 0 && a.pieces.get(e.pieces[o - 1]!.repere)!.entrainee);
  };
  return places(e, 1).filter(
    ([l, c]) => tourne(l - 1, c) || tourne(l + 1, c) || tourne(l, c - 1) || tourne(l, c + 1),
  );
}

/**
 * La pose qui fait monter la production le plus, sans fermer le rouage, sauf quand elle remplit le
 * plan : un rouage fermé ne grandit plus (fiche, § 4). Avec ce qu'elle rapporte, par tour ; null si
 * aucune pose ne rapporte.
 */
function meilleurePose(
  e: EtatAtelier,
  piece: PieceAtelier,
): { action: ActionAtelier; gain: number } | null {
  const copie = structuredClone(e);
  let p = copie.pieces.find((x) => x.repere === piece.repere);
  if (!p) {
    p = structuredClone(piece);
    copie.pieces.push(p);
  }
  const avant = analyser(e).production;
  let meilleure: { action: ActionAtelier; gain: number } | null = null;
  for (const place of placesUtiles(copie, largeur(p))) {
    for (const rot of [0, 1, 2, 3] as const) {
      p.case = place;
      p.rot = rot;
      const a = analyser(copie);
      const ferme = a.dentsLibres === 0 && a.casesLibres > 0;
      const gain = a.production - avant;
      if (gain > 0 && !ferme && gain > (meilleure?.gain ?? 0)) {
        meilleure = { action: { type: "poser", repere: p.repere, case: place, rot }, gain };
      }
    }
    p.case = null;
  }
  return meilleure;
}

/** Un rouage fermé se rouvre d'un geste : tourner une pièce du bord (fiche, § 4). */
function rouvrir(e: EtatAtelier): ActionAtelier | null {
  const copie = structuredClone(e);
  let meilleure: ActionAtelier | null = null;
  let score = -Infinity;
  for (const piece of copie.pieces) {
    if (!piece.case) continue;
    const rot = piece.rot;
    piece.rot = ((rot + 1) % 4) as typeof rot;
    const a = analyser(copie);
    if (a.dentsLibres > 0 && a.production > score) {
      score = a.production;
      meilleure = { type: "tourner", repere: piece.repere };
    }
    piece.rot = rot;
  }
  return meilleure;
}

/**
 * Le joueur naturel : il rouvre son rouage s'il est fermé, pose ce qu'il tient là où la production
 * monte le plus, puis achète la pièce qui rapporte le plus pour son prix, à la place qu'il lui trouve.
 * Quand plus rien ne rapporte, il garde ses pièces pour agrandir le plan.
 */
const naturel: Politique = (e) => {
  const a = analyser(e);
  if (a.dentsLibres === 0 && a.casesLibres > 0) {
    const geste = rouvrir(e);
    if (geste) return geste;
  }
  const enMain = e.pieces.find((p) => !p.case);
  const pose = enMain && meilleurePose(e, enMain);
  if (pose) return pose.action;
  let achat: { piece: DefPiece; rendement: number } | null = null;
  if (!enMain) {
    for (const d of achetables(e)) {
      const essai: PieceAtelier = {
        id: d.id,
        repere: e.pieces.length + 1,
        case: null,
        rot: 0,
        limees: [],
      };
      const gain = meilleurePose(e, essai)?.gain ?? 0;
      const rendement = gain / prixPiece(e, d);
      if (gain > 0 && rendement > (achat?.rendement ?? 0)) achat = { piece: d, rendement };
    }
  }
  if (achat) return { type: "acheter", piece: achat.piece.id };
  return agrandir(e);
};

interface Releve {
  production: number;
  taille: number;
  posees: number;
  tournent: number;
}

/** Joue `minutes` à travers le noyau, un geste toutes les 5 secondes au plus, relevé chaque minute. */
async function jouer(politique: Politique, minutes: number): Promise<Releve[]> {
  const noyau = await demarrer();
  const etat = () => noyau.etatStrate as EtatAtelier;
  const releves: Releve[] = [];
  for (let t = 0; t <= minutes * 60; t += 5) {
    if (t % 60 === 0) {
      const a = analyser(etat());
      const pieces = [...a.pieces.values()];
      releves.push({
        production: a.production,
        taille: etat().taille,
        posees: pieces.length,
        tournent: pieces.filter((p) => p.entrainee).length,
      });
    }
    const action = politique(etat());
    if (action) noyau.agir(action);
    noyau.avancer(5);
  }
  return releves;
}

describe("les débuts de l'atelier", () => {
  it("donnent l'avantage à qui pose contre ce qui tourne, et pas sur la première case libre", async () => {
    const r = await jouer(reflexe, 30);
    const n = await jouer(naturel, 30);
    // Au bout de dix minutes, le réflexe produit 1,6 fois moins (fiche, § 5).
    expect(n[10]!.production).toBeGreaterThan(1.5 * r[10]!.production);
    // Le naturel agrandit le plan vers 20 minutes (fiche, § 4) ; le réflexe, jamais en une demi-heure.
    const agrandi = n.findIndex((x) => x.taille === 8);
    expect(agrandi).toBeGreaterThanOrEqual(15);
    expect(agrandi).toBeLessThanOrEqual(25);
    expect(r[30]!.taille).toBe(6);
    // Une demi-heure : le naturel produit plusieurs fois plus, et toutes ses pièces tournent.
    expect(n[30]!.production).toBeGreaterThan(4 * r[30]!.production);
    expect(n[30]!.tournent).toBe(n[30]!.posees);
    expect(r[30]!.tournent).toBeLessThan(r[30]!.posees);
  });
});

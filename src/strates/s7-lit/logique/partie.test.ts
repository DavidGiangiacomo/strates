// Le lit joué à travers le noyau par les joueurs automatiques de la fiche (docs/strates/strate-7.md,
// § 4 et § 8) : la durée tient au rythme des crues plus qu'aux gestes. Puis l'absence de deux semaines
// rattrapée par le noyau, et la descente qui attend le retour, puis emporte tout le catalogue.
import { describe, expect, it } from "vitest";
import {
  ATTENTIF,
  creerJoueur,
  DISTRAIT,
  PREVOYANT,
  SANS_UN_GESTE,
  type ProfilLit,
} from "../../../../sim/joueurs/lit";
import { catalogueDe, preselection } from "../../../noyau/logique/artefacts";
import { creerEtatNoyau } from "../../../noyau/logique/etat";
import { Noyau } from "../../../noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../../../noyau/logique/registre";
import { creerLogiqueFactice } from "../../factice/logique";
import { logique, type ActionLit, type EtatLit } from ".";
import { CRUE } from "./regles";

const HEURE = 3600;
const JOUR = 24 * HEURE;

/** Ce qu'emporte un jeu correct du chœur (14 points) et de la dette (28 points) : docs/artefacts.md, § 8. */
const JEU_CORRECT = [...preselection(14, 5), ...preselection(28, 6)];

async function demarrer(artefacts: readonly string[] = [], avecLeFond = false): Promise<Noyau> {
  const registre = new Registre();
  registre.enregistrer(7, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
  if (avecLeFond) {
    registre.enregistrer(
      8,
      async () => ({ logique: creerLogiqueFactice(8), vue: null, textes: {} }) as StrateQuelconque,
    );
  }
  const etat = creerEtatNoyau(1, 0);
  etat.profondeur = 7;
  etat.artefacts = [...artefacts];
  const noyau = new Noyau(registre, etat);
  await noyau.demarrer(0);
  return noyau;
}

/** Une partie jusqu'à la descente : le bassin plein, en minutes, et les levées bâties. */
async function jouer(profil: ProfilLit, artefacts: readonly string[] = []) {
  const noyau = await demarrer(artefacts);
  const etat = () => noyau.etatStrate as EtatLit;
  const joueur = creerJoueur(noyau, profil);
  for (let t = 0; !noyau.seuil.atteint && t < 4 * HEURE; t++) joueur.seconde(t);
  return { noyau, etat: etat(), plein: etat().pleinA! / 60, gestes: joueur.gestes };
}

describe("une partie du lit", () => {
  it("dure de 2 h 00 à 2 h 18 selon les gestes, sans aucun objet (fiche, § 4)", async () => {
    const attendus: [ProfilLit, number, number][] = [
      [PREVOYANT, 120, 4],
      [ATTENTIF, 124, 4],
      [DISTRAIT, 133, 1],
      [SANS_UN_GESTE, 137.5, 0],
    ];
    for (const [profil, minutes, gestes] of attendus) {
      const partie = await jouer(profil);
      expect(Math.abs(partie.plein - minutes), profil.description).toBeLessThanOrEqual(1);
      expect(partie.gestes, profil.description).toBe(gestes);
      // La descente vient une crue après le bassin plein.
      expect(partie.etat.temps).toBeCloseTo(partie.etat.pleinA! + CRUE, 0);
    }
  });

  it("finit plus tôt avec les objets d'un jeu correct, sauf sans un geste (fiche, § 8)", async () => {
    expect(JEU_CORRECT).toEqual(expect.arrayContaining(["s5-stalle", "s5-silence", "s6-poids"]));
    const attendus: [ProfilLit, number][] = [
      [PREVOYANT, 106],
      [ATTENTIF, 110],
      [DISTRAIT, 113],
      [SANS_UN_GESTE, 137.5],
    ];
    for (const [profil, minutes] of attendus) {
      const partie = await jouer(profil, JEU_CORRECT);
      expect(Math.abs(partie.plein - minutes), profil.description).toBeLessThanOrEqual(1);
      // La pierre qui pèse et la caution de bois sur l'eau retenue, le gage patient sur l'absence.
      expect(partie.etat.multiplicateurs.depot).toBeCloseTo(1.25 * 1.125, 9);
      expect(partie.etat.multiplicateurs.patience).toBeCloseTo(1.25, 9);
    }
  });

  it("vaut toujours 4 points : le bassin plein tient le même limon", async () => {
    for (const profil of [PREVOYANT, SANS_UN_GESTE]) {
      const { noyau } = await jouer(profil);
      const valeur = logique.valeurConvertible(noyau.etatStrate as EtatLit);
      expect(Math.floor(Math.log10(valeur) * 1.4)).toBe(4);
    }
  });
});

describe("l'absence rattrapée par le noyau", () => {
  it("remplit le bassin pendant deux semaines, sans plafond, et la descente attend le retour", async () => {
    const noyau = await demarrer();
    const fermer: ActionLit = { type: "fermer", creux: 0 };
    noyau.agir(fermer);
    noyau.avancer(1);
    const reprise = noyau.rattraper(1000 + 14 * JOUR * 1000);
    expect(reprise).toMatchObject({ type: "absence", politique: "propre", lignes: [] });
    const etat = noyau.etatStrate as EtatLit;
    expect(etat.pleinA).not.toBeNull();
    expect(noyau.seuil.atteint).toBe(false);
    // Une crue plus tard, sous les yeux du joueur.
    noyau.avancer(CRUE - 1);
    expect(noyau.seuil.atteint).toBe(false);
    noyau.avancer(1.1);
    expect(noyau.seuil).toEqual({ atteint: true, automatique: true });
  });

  it("descend alors d'elle-même vers le fond, et emporte les trois objets du lit", async () => {
    const noyau = await demarrer([], true);
    noyau.rattraper(14 * JOUR * 1000);
    expect(noyau.descenteAutomatique).toBe(false);
    noyau.avancer(CRUE + 0.1);
    expect(noyau.descenteAutomatique).toBe(true);
    const fouille = await noyau.descendre(14 * JOUR * 1000 + 31_000);
    expect(fouille.points).toBe(4);
    expect([...fouille.emportes].sort()).toEqual(
      catalogueDe(7)
        .map((a) => a.id)
        .sort(),
    );
    expect(noyau.etat.profondeur).toBe(8);
  });

  it("ne se signale pas tant que le fond n'existe pas : le lit reste plein", async () => {
    const noyau = await demarrer();
    noyau.rattraper(14 * JOUR * 1000);
    noyau.avancer(CRUE + 0.1);
    expect(noyau.seuil.atteint).toBe(true);
    expect(noyau.descenteAutomatique).toBe(false);
  });
});

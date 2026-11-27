// Des parties entières du réseau, jouées par les joueurs automatiques à travers le noyau
// (sim/joueurs/reseau.ts) : elles retrouvent la simulation de la fiche (docs/strates/strate-4.md, § 4).
import { describe, expect, it } from "vitest";
import {
  APPREND,
  creerJoueur,
  MOINS_CHER,
  NATUREL,
  PREVOYANT,
  PRUDENT,
  REFLEXE,
  SANS_VANNES,
  type ProfilReseau,
} from "../../../../sim/joueurs/reseau";
import { pointsDeFouille } from "../../../noyau/logique/artefacts";
import { creerEtatNoyau } from "../../../noyau/logique/etat";
import { Noyau } from "../../../noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../../../noyau/logique/registre";
import { textes } from "../textes.fr";
import { logique, type EtatReseau } from ".";

/** Ce qu'emporte un jeu correct jusqu'au réseau : l'atelier et les caves qui y agissent encore. */
const JEU_CORRECT = [
  "s2-faucille",
  "s2-calendrier",
  "s2-registre",
  "s2-meule",
  "s3-loupe",
  "s3-compte-tours",
  "s3-etau",
  "s3-volant",
];

const I5 = 3 * 3600 + 15 * 60;

/** Une partie, jusqu'au seuil ou à la limite ; une absence de `absence.duree` à `absence.a`. */
async function jouer(
  profil: ProfilReseau,
  {
    objets = [] as string[],
    limite = 5 * 3600,
    absence = null as { a: number; duree: number } | null,
  } = {},
) {
  const registre = new Registre();
  registre.enregistrer(4, async () => ({ logique, vue: null, textes }) as StrateQuelconque);
  const etatNoyau = creerEtatNoyau(1, 0);
  etatNoyau.profondeur = 4;
  etatNoyau.artefacts = [...objets];
  const noyau = new Noyau(registre, etatNoyau);
  await noyau.demarrer(0);
  const joueur = creerJoueur(noyau, profil);
  let horloge = 0;
  for (let t = 0; t < limite && !noyau.seuil.atteint; t++) {
    if (absence && t === absence.a) {
      horloge += absence.duree;
      noyau.rattraper((t + horloge) * 1000);
    }
    joueur.seconde(t);
  }
  const etat = noyau.etatStrate as EtatReseau;
  return {
    etat,
    seuil: noyau.seuil.atteint ? etat.seuilA : null,
    points: pointsDeFouille(etat.recu),
    gestes: joueur.gestes,
  };
}

describe("les joueurs automatiques du réseau", () => {
  it("mènent le naturel au seuil à 2 h 29, avec 21 points, et le prudent sous les 3 h 15", async () => {
    const naturel = await jouer(NATUREL);
    expect(naturel.seuil! / 60).toBeCloseTo(149, -1);
    expect(naturel.points).toBe(21);
    expect(Object.keys(naturel.etat.reliees)).toHaveLength(6);
    const prudent = await jouer(PRUDENT);
    expect(prudent.seuil).not.toBeNull();
    expect(prudent.seuil!).toBeLessThan(I5);
    expect(prudent.points).toBe(21);
  });

  it("font finir plus tôt avec les objets d'un jeu correct, avec les mêmes points", async () => {
    const sans = await jouer(NATUREL);
    const avec = await jouer(NATUREL, { objets: JEU_CORRECT });
    expect(avec.seuil!).toBeLessThan(sans.seuil! - 10 * 60);
    expect(avec.points).toBe(21);
  });

  it("ne mènent au seuil ni le réflexe, ni le joueur « moins cher », ni celui qui ne règle aucune vanne (I4)", async () => {
    for (const profil of [REFLEXE, MOINS_CHER, SANS_VANNES]) {
      const partie = await jouer(profil);
      expect(partie.seuil, profil.description).toBeNull();
    }
    // Le réflexe élargit ce qui entre dans le bassin qui monte : la ville reste à 10 pouces.
    const reflexe = await jouer(REFLEXE, { limite: 3600 });
    expect(reflexe.etat.recoit).toBeCloseTo(10, 6);
  });

  it("font finir celui qui apprend à l'heure du naturel : ses dix premières minutes ne lui coûtent rien", async () => {
    const naturel = await jouer(NATUREL);
    const apprend = await jouer(APPREND);
    expect(Math.abs(apprend.seuil! - naturel.seuil!)).toBeLessThan(3 * 60);
  });

  it("font relier au prévoyant les routes avant leurs sources, sans toucher une vanne", async () => {
    const prevoyant = await jouer(PREVOYANT);
    expect(prevoyant.seuil!).toBeLessThan(2.6 * 3600);
    expect(prevoyant.etat.conduites.every((c) => c.vanne === 1)).toBe(true);
    // Ni raccourci du milieu, ni du haut : les routes 6, 9 et 13 ont suffi.
    expect(prevoyant.etat.conduites.map((c) => c.trace)).not.toContain(5);
  });

  it("laissent le naturel s'absenter deux heures en pleine montée, et finir quand même", async () => {
    const partie = await jouer(NATUREL, { absence: { a: 40 * 60, duree: 2 * 3600 } });
    expect(partie.seuil).not.toBeNull();
    expect(partie.points).toBe(21);
  });
});

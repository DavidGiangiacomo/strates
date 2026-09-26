// Une partie complète de la surface, jouée par un joueur automatique à travers le noyau :
// le code doit tenir le rythme calculé dans la fiche (docs/strates/strate-1.md, § 1, § 4 et § 9).
import { describe, expect, it } from "vitest";
import { CORRECT, creerJoueur, DISTRAIT, type Profil } from "../../../../sim/joueurs/surface";
import { creerEtatNoyau } from "../../../noyau/logique/etat";
import { Noyau } from "../../../noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../../../noyau/logique/registre";
import { logique, type EtatSurface } from ".";
import { production, SEUIL_PRODUCTION } from "./regles";

const points = (valeur: number) => Math.floor(Math.log10(valeur) * 1.4);

async function jouer(profil: Profil) {
  const registre = new Registre();
  registre.enregistrer(1, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
  const noyau = new Noyau(registre, creerEtatNoyau(1, 0));
  await noyau.demarrer(0);
  const etat = () => noyau.etatStrate as EtatSurface;

  const joueur = creerJoueur(noyau, profil);
  // La fouille doit être refusée à chaque instant où la production est sous le palier.
  let fouilleAvantPalier = false;
  for (let t = 0; t < 3 * 3600; t++) {
    if (production(etat()) < SEUIL_PRODUCTION && noyau.demanderFouille()) fouilleAvantPalier = true;
    joueur.seconde(t);
    if (noyau.seuil.atteint) break;
  }
  return {
    minutes: etat().temps / 60,
    cumul: etat().cumul,
    seuil: noyau.seuil.atteint,
    fouilleAvantPalier,
    fouilleAuPalier: noyau.demanderFouille(),
  };
}

describe("une partie complète de la surface", () => {
  it("atteint le seuil en 1 h 15 environ pour un joueur correct, avec 12 points de fouille", async () => {
    const partie = await jouer(CORRECT);
    expect(partie.seuil).toBe(true);
    expect(partie.minutes).toBeGreaterThan(65);
    expect(partie.minutes).toBeLessThan(80);
    expect(points(partie.cumul)).toBe(12);
  });

  it("rend la descente possible au palier, et seulement au palier", async () => {
    const partie = await jouer(CORRECT);
    expect(partie.fouilleAvantPalier).toBe(false);
    expect(partie.fouilleAuPalier).toBe(true);
  });

  it("reste dans la cible pour un joueur distrait", async () => {
    const partie = await jouer(DISTRAIT);
    expect(partie.seuil).toBe(true);
    expect(partie.minutes).toBeLessThan(90);
    expect(points(partie.cumul)).toBe(12);
  });
});

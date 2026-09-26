// Une partie complète de la surface, jouée par un joueur automatique à travers le noyau :
// le code doit tenir le rythme calculé dans la fiche (docs/strates/strate-1.md, § 1, § 4 et § 9).
import { describe, expect, it } from "vitest";
import { creerEtatNoyau } from "../../../noyau/logique/etat";
import { Noyau } from "../../../noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../../../noyau/logique/registre";
import { logique, type ActionSurface, type EtatSurface } from ".";
import {
  AMELIORATIONS,
  ameliorationDisponible,
  coutAchat,
  GENERATEURS,
  generateurVisible,
  production,
  SEUIL_PRODUCTION,
  valeurClic,
} from "./regles";

interface Profil {
  /** Clics par seconde, selon le temps de jeu. */
  clics: (t: number) => number;
  /** Secondes entre deux passages du joueur sur le tableau de bord. */
  attention: (t: number) => number;
}

const CORRECT: Profil = {
  clics: (t) => (t < 300 ? 4 : t < 900 ? 1 : 0),
  attention: (t) => (t < 600 ? 5 : 20),
};
const DISTRAIT: Profil = {
  clics: (t) => (t < 300 ? 3 : 0),
  attention: (t) => (t < 600 ? 10 : 60),
};

const points = (valeur: number) => Math.floor(Math.log10(valeur) * 1.4);

/** Le meilleur achat : celui qui se rembourse le plus vite, compte tenu de l'attente pour le payer. */
function meilleurAchat(
  etat: EtatSurface,
  clics: number,
): { action: ActionSurface; cout: number } | null {
  const avant = production(etat) + valeurClic(etat) * clics;
  const options: { action: ActionSurface; cout: number }[] = [
    ...GENERATEURS.filter((g) => generateurVisible(etat, g)).map((g) => ({
      action: { type: "acheter", generateur: g.id, quantite: 1 } as const,
      cout: coutAchat(g, etat.generateurs[g.id]),
    })),
    ...AMELIORATIONS.filter((a) => ameliorationDisponible(etat, a)).map((a) => ({
      action: { type: "ameliorer", amelioration: a.id } as const,
      cout: a.cout,
    })),
  ];
  let meilleur: { action: ActionSurface; cout: number; score: number } | null = null;
  for (const option of options) {
    const essai = JSON.parse(JSON.stringify(etat)) as EtatSurface;
    essai.credits = Infinity;
    logique.agir(essai, option.action, {
      effets: { multiplicateur: () => 1, actif: () => false },
      emettre: () => {},
    });
    const gain = production(essai) + valeurClic(essai) * clics - avant;
    if (gain <= 0) continue;
    const score = option.cout / gain + option.cout / Math.max(avant, 1e-9);
    if (!meilleur || score < meilleur.score) meilleur = { ...option, score };
  }
  return meilleur;
}

async function jouer(profil: Profil) {
  const registre = new Registre();
  registre.enregistrer(1, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
  const noyau = new Noyau(registre, creerEtatNoyau(1, 0));
  await noyau.demarrer(0);
  const etat = () => noyau.etatStrate as EtatSurface;

  let prochainPassage = 0;
  // La fouille doit être refusée à chaque instant où la production est sous le palier.
  let fouilleAvantPalier = false;
  for (let t = 0; t < 3 * 3600; t++) {
    if (production(etat()) < SEUIL_PRODUCTION && noyau.demanderFouille()) fouilleAvantPalier = true;
    const clics = profil.clics(t);
    for (let i = 0; i < clics; i++) noyau.agir({ type: "produire" });
    if (t >= prochainPassage) {
      // Le joueur achète tant que le meilleur achat est à sa portée.
      for (;;) {
        const achat = meilleurAchat(etat(), clics);
        if (!achat || achat.cout > etat().credits) break;
        noyau.agir(achat.action);
        noyau.tick(0);
      }
      prochainPassage = t + profil.attention(t);
    }
    noyau.avancer(1);
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

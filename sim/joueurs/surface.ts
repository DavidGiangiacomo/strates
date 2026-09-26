// Un joueur automatique pour la surface : il clique, puis achète toujours ce qui se rembourse le plus
// vite. Il sert au test de partie complète, aux sauvegardes nommées (#28), et au simulateur (#23).
import type { Noyau } from "../../src/noyau/logique/noyau";
import {
  logique,
  type ActionSurface,
  type EtatSurface,
} from "../../src/strates/s1-surface/logique";
import {
  AMELIORATIONS,
  ameliorationDisponible,
  coutAchat,
  GENERATEURS,
  generateurVisible,
  production,
  valeurClic,
} from "../../src/strates/s1-surface/logique/regles";

export interface Profil {
  /** Clics par seconde, selon le temps de jeu. */
  clics: (t: number) => number;
  /** Secondes entre deux passages du joueur sur le tableau de bord. */
  attention: (t: number) => number;
}

/** Un joueur correct : il clique au début, puis passe voir le tableau de bord toutes les 20 s. */
export const CORRECT: Profil = {
  clics: (t) => (t < 300 ? 4 : t < 900 ? 1 : 0),
  attention: (t) => (t < 600 ? 5 : 20),
};

/** Un joueur distrait : il clique moins, puis ne passe qu'une fois par minute. */
export const DISTRAIT: Profil = {
  clics: (t) => (t < 300 ? 3 : 0),
  attention: (t) => (t < 600 ? 10 : 60),
};

const SANS_EFFETS = {
  effets: { multiplicateur: () => 1, actif: () => false },
  emettre: () => {},
};

/** Le meilleur achat : celui qui se rembourse le plus vite, compte tenu de l'attente pour le payer. */
export function meilleurAchat(
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
    logique.agir(essai, option.action, SANS_EFFETS);
    const gain = production(essai) + valeurClic(essai) * clics - avant;
    if (gain <= 0) continue;
    const score = option.cout / gain + option.cout / Math.max(avant, 1e-9);
    if (!meilleur || score < meilleur.score) meilleur = { ...option, score };
  }
  return meilleur;
}

/**
 * Un joueur branché sur un noyau démarré à la surface. `seconde(t)` joue la seconde t : les clics,
 * un passage sur le tableau de bord si c'est le moment, puis une seconde de temps. Avec `maintenant`
 * (ms), la référence d'horloge suit, comme dans le jeu.
 */
export function creerJoueur(noyau: Noyau, profil: Profil) {
  const etat = () => noyau.etatStrate as EtatSurface;
  let prochainPassage = 0;
  return {
    seconde(t: number, maintenant?: number): void {
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
      if (maintenant === undefined) noyau.avancer(1);
      else noyau.avancerJusqua(maintenant, 1);
    },
  };
}

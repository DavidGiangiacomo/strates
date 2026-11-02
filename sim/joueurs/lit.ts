// Des joueurs automatiques pour le lit, branchés sur le noyau. Ils jouent les profils de la fiche
// (docs/strates/strate-7.md, § 4) : à chaque passage, ils ferment le premier creux qui n'est pas plein,
// quand ils le voient sous l'eau, ou d'avance s'ils prévoient. Ce sont des joueurs de test ;
// l'équilibrage les reprendra (#116).
import type { Noyau } from "../../src/noyau/logique/noyau";
import type { ActionLit, EtatLit } from "../../src/strates/s7-lit/logique";
import { CREUX, creuxAtteint, creuxPlein } from "../../src/strates/s7-lit/logique/regles";

export interface ProfilLit {
  /** Ce qui le caractérise, pour les rapports. */
  description: string;
  /** Secondes entre deux passages ; null : il ne passe jamais. */
  attention: number | null;
  /** Dès qu'un creux est plein, il bâtit la levée sur le suivant, avant l'eau. */
  prevoit: boolean;
}

export const PREVOYANT: ProfilLit = {
  description: "passe chaque minute ; dès qu'un creux est plein, bâtit la levée sur le suivant",
  attention: 60,
  prevoit: true,
};

export const ATTENTIF: ProfilLit = {
  description: "passe toutes les cinq minutes ; ferme un creux quand l'eau l'atteint",
  attention: 300,
  prevoit: false,
};

export const DISTRAIT: ProfilLit = {
  description: "passe toutes les demi-heures",
  attention: 1800,
  prevoit: false,
};

export const SANS_UN_GESTE: ProfilLit = {
  description: "ne fait rien",
  attention: null,
  prevoit: false,
};

/** Le geste d'un passage, ou null : le premier creux qui n'est pas plein, s'il est sous l'eau ou prévu. */
export function geste(etat: EtatLit, profil: ProfilLit): ActionLit | null {
  const k = CREUX.findIndex((_, i) => !creuxPlein(etat, i));
  if (k < 0 || etat.levee === k) return null;
  return profil.prevoit || creuxAtteint(etat, k) ? { type: "fermer", creux: k } : null;
}

/**
 * Un joueur branché sur un noyau démarré dans le lit. `seconde(t)` joue la seconde t : un passage si
 * c'est le moment, puis une seconde de temps. `gestes` compte les levées bâties.
 */
export function creerJoueur(noyau: Noyau, profil: ProfilLit) {
  let prochainPassage = 0;
  const joueur = {
    gestes: 0,
    seconde(t: number): void {
      if (profil.attention !== null && t >= prochainPassage) {
        const action = geste(noyau.etatStrate as EtatLit, profil);
        if (action) {
          noyau.agir(action);
          noyau.tick(0);
          joueur.gestes++;
        }
        prochainPassage = t + profil.attention;
      }
      noyau.avancer(1);
    },
  };
  return joueur;
}

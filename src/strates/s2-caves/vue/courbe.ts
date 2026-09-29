// Ce que la courbe de la réserve montre avec elle (fiche, § 5 et § 6) : les achats en encoches, les
// hivers en bandes et le début de chaque année. La courbe tombe à chaque hiver et remonte à chaque
// été : les bandes rendent l'oscillation lisible. Tout est en index (fractionnaires) dans les points
// de l'historique, un tous les 5 jours ; le dernier est au dernier multiple de 5 jours.
import type { EtatCaves } from "../logique";
import { PERIODE_HISTORIQUE } from "../logique/etat";
import { JOURS_PAR_AN, saisonChaude } from "../logique/regles";

type EtatCourbe = Pick<EtatCaves, "annee" | "jour" | "temps" | "historique">;

/** L'instant (`temps`) du dernier point de l'historique. */
const dernierPoint = (etat: EtatCourbe) =>
  Math.floor(etat.temps / PERIODE_HISTORIQUE) * PERIODE_HISTORIQUE;

/** L'index, dans l'historique, d'un instant des caves. */
function indexTemps(etat: EtatCourbe, temps: number): number {
  const n = etat.historique.reserve.length;
  return n - 1 - (dernierPoint(etat) - temps) / PERIODE_HISTORIQUE;
}

/** Les achats, en index dans l'historique : ceux de la fenêtre seulement. */
export function achatsCourbe(etat: EtatCourbe): number[] {
  const n = etat.historique.reserve.length;
  return etat.historique.achats.map((a) => indexTemps(etat, a)).filter((i) => i >= 0 && i <= n - 1);
}

export interface SaisonsCourbe {
  /** Les hivers, de leur premier jour à la fin de l'année, coupés aux bords de la fenêtre. */
  hivers: { debut: number; fin: number }[];
  /** Le premier jour de chaque année, dans la fenêtre. */
  annees: { annee: number; index: number }[];
}

/**
 * Les hivers et les années dans la fenêtre de la courbe. Le temps des caves et leur calendrier
 * avancent ensemble, un jour par seconde : un jour du calendrier est un instant de `temps`.
 */
export function saisonsCourbe(etat: EtatCourbe): SaisonsCourbe {
  const n = etat.historique.reserve.length;
  if (n < 2) return { hivers: [], annees: [] };
  // Les jours du calendrier sont comptés depuis le premier jour de l'an 1.
  const aujourdhui = (etat.annee - 1) * JOURS_PAR_AN + etat.jour;
  const dernierJour = aujourdhui - (etat.temps - dernierPoint(etat));
  const premierJour = dernierJour - (n - 1) * PERIODE_HISTORIQUE;
  const indexDe = (jour: number) => n - 1 - (dernierJour - jour) / PERIODE_HISTORIQUE;

  const hivers: SaisonsCourbe["hivers"] = [];
  const annees: SaisonsCourbe["annees"] = [];
  const premiere = Math.floor(premierJour / JOURS_PAR_AN) + 1;
  const derniere = Math.floor(dernierJour / JOURS_PAR_AN) + 1;
  for (let annee = premiere; annee <= derniere; annee++) {
    const debutAnnee = (annee - 1) * JOURS_PAR_AN;
    const debut = indexDe(debutAnnee + saisonChaude(annee));
    const fin = indexDe(debutAnnee + JOURS_PAR_AN);
    if (fin > 0 && debut < n - 1) {
      hivers.push({ debut: Math.max(0, debut), fin: Math.min(n - 1, fin) });
    }
    const index = indexDe(debutAnnee);
    if (index > 0 && index <= n - 1) annees.push({ annee, index });
  }
  return { hivers, annees };
}

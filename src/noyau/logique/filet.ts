// Le filet (docs/strates/strate-1.md et strate-2.md, § 4) : si le joueur n'a pas creusé quelque temps
// après le seuil, une fissure le mène au bouton « creuser » du bandeau. Commun à toutes les strates
// qui en tendent un ; le tracé est dans noyau/ui/fissure.ts.

/** Temps de strate après le seuil, en secondes, avant qu'une fissure n'apparaisse si le joueur n'a pas creusé. */
export const DELAI_FISSURE = 5 * 60;
/** Durée, en secondes, pendant laquelle la fissure s'allonge jusqu'au bouton « creuser ». */
export const DUREE_FISSURE = 2 * 60;

/**
 * Où en est la fissure, au temps de strate `temps` : 0 tant qu'elle n'est pas apparue, puis de 0 à 1
 * à mesure qu'elle s'allonge. `seuilAtteintA` est le temps de strate au seuil, null avant.
 */
export function avanceeFissure(temps: number, seuilAtteintA: number | null): number {
  if (seuilAtteintA === null) return 0;
  const ecoule = temps - seuilAtteintA - DELAI_FISSURE;
  return Math.min(1, Math.max(0, ecoule / DUREE_FISSURE));
}

/** Intervalle de la sauvegarde automatique, en millisecondes (D-005). */
export const INTERVALLE_AUTOSAUVEGARDE = 30_000;

/**
 * Sauvegarde toutes les 30 s, et chaque fois que la page passe en arrière-plan ou se ferme.
 * Les sauvegardes après une descente ou un choix d'artefacts sont demandées par le noyau (#30).
 * Renvoie de quoi tout arrêter.
 */
export function demarrerAutosauvegarde(sauvegarder: () => unknown): () => void {
  const lancer = () => void sauvegarder();
  const surVisibilite = () => {
    if (document.visibilityState === "hidden") lancer();
  };

  const minuteur = setInterval(lancer, INTERVALLE_AUTOSAUVEGARDE);
  document.addEventListener("visibilitychange", surVisibilite);
  window.addEventListener("pagehide", lancer);

  return () => {
    clearInterval(minuteur);
    document.removeEventListener("visibilitychange", surVisibilite);
    window.removeEventListener("pagehide", lancer);
  };
}

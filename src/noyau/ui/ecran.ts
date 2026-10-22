// Ce que les calques du noyau mesurent à l'écran : le zoom de la taille du texte (#48), et le bouton
// « creuser », que visent la fissure et le coup de pioche.

/**
 * Le zoom de tout le jeu, que règle la taille du texte : 1 par défaut. Une position lue sur la
 * fenêtre (un rectangle, sa largeur) se divise par lui pour devenir une position dans le jeu.
 */
export function zoomEcran(): number {
  if (typeof document === "undefined") return 1;
  const zoom = parseFloat(getComputedStyle(document.documentElement).zoom);
  return Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
}

/** Le milieu du bouton « creuser », en pixels du jeu ; null s'il n'est pas à l'écran. */
export function milieuCreuser(): number | null {
  const bouton =
    typeof document === "undefined" ? null : document.querySelector("[data-test=creuser]");
  if (!bouton) return null;
  const r = bouton.getBoundingClientRect();
  return r.width > 0 ? (r.left + r.width / 2) / zoomEcran() : null;
}

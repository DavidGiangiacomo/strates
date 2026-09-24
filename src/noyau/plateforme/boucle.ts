import type { Noyau } from "../logique/noyau";

// Plus grand écart pris en compte entre deux images, en secondes. Un onglet caché ne reçoit
// pas d'images : au retour, l'écart est tronqué ici. Le temps passé caché est une absence,
// que le hors-ligne (#27) prendra en charge.
const ECART_MAX = 0.25;

/** Fait avancer le noyau au rythme des images du navigateur. Renvoie de quoi arrêter la boucle. */
export function demarrerBoucle(noyau: Noyau): () => void {
  let precedent = performance.now();
  let id = requestAnimationFrame(image);

  function image(instant: number): void {
    const ecart = Math.min(Math.max(0, instant - precedent) / 1000, ECART_MAX);
    precedent = instant;
    noyau.avancer(ecart);
    id = requestAnimationFrame(image);
  }

  return () => cancelAnimationFrame(id);
}

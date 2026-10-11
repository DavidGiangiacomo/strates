import { SEUIL_ABSENCE, type Reprise } from "../logique/horsligne";
import type { Noyau } from "../logique/noyau";
import { maintenant as horloge } from "./horloge";

/** L'onglet est en arrière-plan. Hors d'un navigateur, il n'y a pas d'onglet à cacher. */
const ongletCache = () => typeof document !== "undefined" && document.visibilityState === "hidden";

/**
 * Fait avancer le noyau à chaque image du navigateur, sur l'horloge monotone. À chaque image,
 * le noyau compare aussi l'horloge système à sa référence : un grand écart est une absence
 * (onglet caché, veille), qu'il rattrape et signale à `surReprise`. `vitesse` multiplie le temps
 * de jeu, pour les outils de développement ; elle ne touche pas au rattrapage. `apresImage` est
 * appelée à la fin de chaque image (la descente automatique s'y déclenche). Renvoie de quoi arrêter.
 *
 * Tant que `cache()` est vrai, les images sont passées : certains navigateurs en donnent encore
 * quelques-unes à un onglet caché, et l'absence serait rattrapée par morceaux, avec un plafond et
 * un résumé pour chacun. Elle est rattrapée en une fois, à la première image du retour.
 */
export function demarrerBoucle(
  noyau: Noyau,
  surReprise: (reprise: Reprise) => void = () => {},
  maintenant: () => number = horloge,
  vitesse: () => number = () => 1,
  apresImage: () => void = () => {},
  cache: () => boolean = ongletCache,
): () => void {
  let precedent = performance.now();
  let id = requestAnimationFrame(image);

  function image(instant: number): void {
    if (cache()) {
      id = requestAnimationFrame(image);
      return;
    }
    // Une image lente est jouée normalement ; au-delà du seuil, le noyau rattrape l'absence.
    const dt = Math.min(Math.max(0, instant - precedent) / 1000, SEUIL_ABSENCE);
    precedent = instant;
    const reprise = noyau.avancerJusqua(maintenant(), dt * vitesse());
    if (reprise) surReprise(reprise);
    apresImage();
    id = requestAnimationFrame(image);
  }

  return () => cancelAnimationFrame(id);
}

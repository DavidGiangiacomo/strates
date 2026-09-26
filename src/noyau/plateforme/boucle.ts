import { SEUIL_ABSENCE, type Reprise } from "../logique/horsligne";
import type { Noyau } from "../logique/noyau";
import { maintenant as horloge } from "./horloge";

/**
 * Fait avancer le noyau à chaque image du navigateur, sur l'horloge monotone. À chaque image,
 * le noyau compare aussi l'horloge système à sa référence : un grand écart est une absence
 * (onglet caché, veille), qu'il rattrape et signale à `surReprise`. `vitesse` multiplie le temps
 * de jeu, pour les outils de développement ; elle ne touche pas au rattrapage. Renvoie de quoi arrêter.
 */
export function demarrerBoucle(
  noyau: Noyau,
  surReprise: (reprise: Reprise) => void = () => {},
  maintenant: () => number = horloge,
  vitesse: () => number = () => 1,
): () => void {
  let precedent = performance.now();
  let id = requestAnimationFrame(image);

  function image(instant: number): void {
    // Une image lente est jouée normalement ; au-delà du seuil, le noyau rattrape l'absence.
    const dt = Math.min(Math.max(0, instant - precedent) / 1000, SEUIL_ABSENCE);
    precedent = instant;
    const reprise = noyau.avancerJusqua(maintenant(), dt * vitesse());
    if (reprise) surReprise(reprise);
    id = requestAnimationFrame(image);
  }

  return () => cancelAnimationFrame(id);
}

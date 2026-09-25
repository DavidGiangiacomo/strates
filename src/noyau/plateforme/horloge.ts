/** Horodatage courant, en millisecondes. Seule la plateforme lit l'horloge système. */
export function maintenant(): number {
  return Date.now();
}

/** Une graine de partie tirée au hasard. */
export function graineAleatoire(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
}

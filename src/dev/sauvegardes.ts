// Les sauvegardes nommées du dépôt (sauvegardes-nommees/), pour le panneau de développement.
// import.meta.glob n'existe qu'avec Vite : ce module n'est chargé que par OutilsDev.svelte.
const fichiers = import.meta.glob<string>("../../sauvegardes-nommees/*.json", {
  query: "?raw",
  import: "default",
  eager: true,
});

export interface SauvegardeNommee {
  nom: string;
  texte: string;
  /** Temps passé dans la partie (jeu et absences comptées), en minutes. */
  minutes: number;
}

function duree(texte: string): number {
  try {
    const { noyau } = JSON.parse(texte) as {
      noyau: { meta: { journal: { strates: { tempsDeJeu: number; tempsHorsLigne: number }[] } } };
    };
    const secondes = noyau.meta.journal.strates.reduce(
      (total, e) => total + e.tempsDeJeu + e.tempsHorsLigne,
      0,
    );
    return Math.round(secondes / 60);
  } catch {
    return 0;
  }
}

/** Les sauvegardes nommées, de la plus courte à la plus longue partie. */
export const SAUVEGARDES_NOMMEES: SauvegardeNommee[] = Object.entries(fichiers)
  .map(([chemin, texte]) => ({
    nom: chemin.slice(chemin.lastIndexOf("/") + 1, -".json".length),
    texte,
    minutes: duree(texte),
  }))
  .sort((a, b) => a.minutes - b.minutes);

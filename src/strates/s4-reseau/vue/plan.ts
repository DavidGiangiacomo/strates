// Le dessin du plan (fiche, § 6), en attendant sa direction artistique (#83) : les sources en haut,
// les bassins sur une ligne au milieu, la ville en bas. Les raccourcis courent entre deux bassins
// voisins, les routes descendent de chaque bassin jusqu'à la ville.
import type { IdNoeud } from "../logique/regles";

// Assez large pour que le prix d'un tracé, écrit à sa droite, tienne près du bord : celui de la source 6.
export const LARGEUR = 1080;
export const HAUTEUR = 640;

/** Le centre de chaque nœud sur le plan. */
export const POSITIONS: Readonly<Record<IdNoeud, { x: number; y: number }>> = {
  source1: { x: 90, y: 70 },
  source2: { x: 240, y: 70 },
  source3: { x: 420, y: 70 },
  source4: { x: 600, y: 70 },
  source5: { x: 750, y: 70 },
  source6: { x: 905, y: 70 },
  bas: { x: 165, y: 300 },
  milieu: { x: 420, y: 300 },
  haut: { x: 675, y: 300 },
  citerne: { x: 905, y: 300 },
  ville: { x: 500, y: 575 },
};

/** Un bassin : un rectangle de 124 sur 72, centré sur sa position. */
export const BASSIN = { largeur: 124, hauteur: 72 };
/** Une source : un cercle. */
export const RAYON_SOURCE = 18;
/** La ville : une bande en bas du plan. */
export const VILLE = { x: 50, y: 545, largeur: 900, hauteur: 60 };

/** Les deux bouts d'un tracé, au bord de ses nœuds. */
export function bouts(
  de: IdNoeud,
  vers: IdNoeud,
): { x1: number; y1: number; x2: number; y2: number } {
  const a = POSITIONS[de];
  const b = POSITIONS[vers];
  // Vers la ville : une route qui descend tout droit du bassin.
  if (vers === "ville") return { x1: a.x, y1: a.y + BASSIN.hauteur / 2, x2: a.x, y2: VILLE.y };
  // D'un bassin à son voisin : un raccourci, un peu sous le milieu des bassins.
  if (!de.startsWith("source")) {
    const vers_la_gauche = b.x < a.x;
    const dx = BASSIN.largeur / 2;
    return {
      x1: a.x + (vers_la_gauche ? -dx : dx),
      y1: a.y + 14,
      x2: b.x + (vers_la_gauche ? dx : -dx),
      y2: b.y + 14,
    };
  }
  // D'une source à son bassin.
  return {
    x1: a.x,
    y1: a.y + RAYON_SOURCE,
    x2: b.x + (a.x - b.x) * 0.3,
    y2: b.y - BASSIN.hauteur / 2,
  };
}

/** L'épaisseur d'une conduite posée, selon son calibre. */
export function epaisseur(calibre: number): number {
  return 2 + calibre * 0.9;
}

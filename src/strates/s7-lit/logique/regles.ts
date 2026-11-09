// Les règles du lit (docs/strates/strate-7.md, § 3). Une crue toutes les trente secondes. L'eau qui
// passe laisse sept doigts de limon ; l'eau qui se repose derrière une levée en laisse neuf et un
// tiers. Quatre creux bordent le bassin : celui que le limon atteint prend tout le limon de la crue,
// jusqu'à être plein, et le bassin ne monte plus pendant ce temps. Le bassin est plein à la rive.
import type { EtatLit } from "./etat";

/** Tolérance pour les sommes de limon, en doigts, et de temps, en secondes. */
export const EPSILON = 1e-6;

/** Une crue toutes les trente secondes : le fleuve monte en dix, l'eau se repose dix, se retire en dix. */
export const CRUE = 30;
/** Une coudée vaut vingt-huit doigts. Un trait court tous les sept doigts sur l'échelle. */
export const DOIGTS = 28;
/** La rive : trente-six coudées sur l'échelle. Le bassin y est plein. */
export const RIVE = 36 * DOIGTS;
/** L'eau qui passe laisse les trois quarts de son limon : le bassin monte de sept doigts par crue. */
export const PASSE = 7;
/** L'eau qui se repose derrière une levée laisse tout son limon : neuf doigts et un tiers par crue. */
export const REPOS = 28 / 3;
/** Un creux tient vingt-cinq crues d'eau retenue, en doigts ramenés à la largeur du bassin. */
export const VOLUME = 25 * REPOS;
/** Les quatre creux, le long de la rive, à 0, 9, 18 et 27 coudées sur l'échelle, en doigts. */
export const CREUX: readonly number[] = [0, 9, 18, 27].map((coudees) => coudees * DOIGTS);
/** La grande crue : la 150ᵉ, vers 1 h 15, apporte le limon de six crues. */
export const GRANDE_CRUE = 150;
export const FORCE_GRANDE_CRUE = 6;
/** Une phrase du jeu reste dix secondes, puis s'efface (fiche, § 11). */
export const DUREE_PHRASE = 10;
/** La phrase du retour ne se dit qu'après une absence d'une heure au moins (fiche, § 10). */
export const LONGUE_ABSENCE = 3600;

// ——— Les objets d'en haut (fiche, § 8)

/**
 * Les couches à venir, dessinées d'avance : trois pour le rouleau qui marque, puissant ; une pour le
 * gage qui revient, utile. Avec les deux, quatre.
 */
export const AVANCE: Readonly<Record<string, number>> = { "s6-sceau": 3, "s5-echo": 1 };
/** L'œuf qui garde marque la rive d'avance sur l'échelle : jusqu'où le bassin se remplira. */
export const OEUF = "s6-bulle";

/** Le nombre de couches à venir que les objets dessinent d'avance. */
export function couchesDAvance(etat: EtatLit): number {
  return etat.objets.reduce((n, id) => n + (AVANCE[id] ?? 0), 0);
}

/** La rive est marquée sur l'échelle. */
export function riveMarquee(etat: EtatLit): boolean {
  return etat.objets.includes(OEUF);
}

/** Le creux `k` est plein. */
export function creuxPlein(etat: EtatLit, k: number): boolean {
  return (etat.creux[k] ?? 0) >= VOLUME - EPSILON;
}

/** Le limon a atteint le creux `k` : l'eau peut s'y engouffrer. */
export function creuxAtteint(etat: EtatLit, k: number): boolean {
  return etat.niveau >= (CREUX[k] ?? Infinity) - EPSILON;
}

/**
 * Le creux où ira la prochaine crue : le premier que le limon a atteint et qui n'est pas plein. null :
 * elle ira au bassin.
 */
export function creuxActif(etat: EtatLit): number | null {
  for (let k = 0; k < CREUX.length; k++) {
    if (creuxAtteint(etat, k) && !creuxPlein(etat, k)) return k;
  }
  return null;
}

/** Les quatre creux sont pleins : il n'y a plus rien à fermer. */
export function tousPleins(etat: EtatLit): boolean {
  return CREUX.every((_, k) => creuxPlein(etat, k));
}

/** Le bassin est plein jusqu'à la rive. */
export function bassinPlein(etat: EtatLit): boolean {
  return etat.niveau >= RIVE - EPSILON;
}

/** Ce qu'on voit d'un creux, et ce qu'en dit un lecteur d'écran (fiche, § 6). */
export type EtatCreux = "sec" | "eau" | "ferme" | "plein";

export function etatCreux(etat: EtatLit, k: number): EtatCreux {
  if (creuxPlein(etat, k)) return "plein";
  if (etat.levee === k) return "ferme";
  return creuxAtteint(etat, k) ? "eau" : "sec";
}

/** On peut y bâtir la levée : un creux qui n'est pas plein, et qu'elle ne ferme pas déjà. */
export function fermable(etat: EtatLit, k: unknown): k is number {
  return (
    typeof k === "number" &&
    Number.isInteger(k) &&
    k >= 0 &&
    k < CREUX.length &&
    !creuxPlein(etat, k) &&
    etat.levee !== k
  );
}

/** Le nombre de crues venues à `temps` secondes de l'arrivée : la n-ième vient à n × 30 s. */
export function cruesA(temps: number): number {
  return Math.floor((temps + EPSILON) / CRUE);
}

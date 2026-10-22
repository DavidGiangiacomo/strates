// La taille du texte (#48) : un zoom de tout le jeu, gardé dans le navigateur comme le volume.
// Chaque strate garde sa disposition, en plus grand. Ce qui se mesure sur la fenêtre (les calques du
// noyau, les unités vh et vw) se corrige par la variable CSS `--zoom` (docs/architecture.md, § 5).
import type { ZonePreferences } from "./audio";

/** Où se garde la taille du texte. */
export const CLE_TAILLE_TEXTE = "strates.texte";

/** Les tailles du texte : le zoom de tout le jeu. */
export const TAILLES_TEXTE = [1, 1.15, 1.3] as const;
export type TailleTexte = (typeof TAILLES_TEXTE)[number];

/** Le stockage du navigateur, s'il l'accorde. */
export function zoneNavigateur(): ZonePreferences | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** La taille gardée ; illisible ou absente, la taille normale. */
export function lireTailleTexte(zone: ZonePreferences | null): TailleTexte {
  try {
    const lue = Number(zone?.getItem(CLE_TAILLE_TEXTE));
    return TAILLES_TEXTE.find((t) => t === lue) ?? 1;
  } catch {
    return 1;
  }
}

/** Garde la taille, si le navigateur le permet. */
export function ecrireTailleTexte(zone: ZonePreferences | null, taille: TailleTexte): void {
  try {
    zone?.setItem(CLE_TAILLE_TEXTE, String(taille));
  } catch {
    // Stockage refusé : la taille vaut pour cette session.
  }
}

/** Applique la taille à tout le document : son zoom, et `--zoom` pour ce qui se mesure sur la fenêtre. */
export function appliquerTailleTexte(racine: HTMLElement, taille: TailleTexte): void {
  racine.style.zoom = taille === 1 ? "" : String(taille);
  racine.style.setProperty("--zoom", String(taille));
}

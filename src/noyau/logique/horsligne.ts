// Le temps qui passe sans le joueur (§9 « Hors-ligne », D-005 « Temps et horloge »).
import type { PolitiqueHorsLigne } from "./types";

/** Part de l'absence que la politique standard fait produire. */
export const TAUX_HORS_LIGNE = 0.8;
/** Plafond de l'absence prise en compte par la politique standard, en secondes : 12 h. */
export const PLAFOND_HORS_LIGNE = 12 * 3600;
/** Un recul d'horloge au-delà de ce seuil, en secondes, est noté dans le journal (D-005). */
export const SEUIL_PERTURBATION = 5 * 60;
/**
 * En session, un écart entre deux images au-delà de ce seuil, en secondes, est une absence :
 * onglet caché, ordinateur en veille. En deçà, c'est une image lente, jouée normalement.
 */
export const SEUIL_ABSENCE = 2;

/** Ce qu'une reprise a constaté, pour le résumé au joueur. */
export type Reprise =
  | {
      type: "absence";
      /** La politique hors-ligne appliquée par la strate. */
      politique: PolitiqueHorsLigne["type"];
      /** Durée de l'absence, en secondes. */
      duree: number;
      /** Part prise en compte, en secondes : plafonnée par la politique standard, 0 pour le fond. */
      comptee: number;
      /** Résumé rédigé par la strate, quand elle calcule elle-même l'absence. */
      lignes: string[];
    }
  | {
      type: "recul";
      /** Ampleur du recul d'horloge, en secondes. */
      recul: number;
      /** Une perturbation vient d'être notée dans le journal. */
      perturbation: boolean;
    }
  | { type: "aucune" };

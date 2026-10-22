// Le retour du joueur (#58 ; bible, § 10) : le rappel de reprise, puis le résumé de l'absence. Le
// noyau y parle comme un inventaire : des libellés, des nombres, des constats, et jamais « vous ».
import { PLAFOND_HORS_LIGNE, TAUX_HORS_LIGNE, type Reprise } from "../logique/horsligne";
import type { NumeroStrate } from "../logique/types";
import { NOMS_STRATES } from "./fouille";
import { pourcentage } from "./menu";

/** En deçà, une absence ne mérite pas de résumé, en secondes. */
const ABSENCE_A_RESUMER = 60;
/**
 * En deçà, une absence n'est pas une reprise de session, en secondes : son résumé paraît seul. Une
 * pause ne rappelle rien ; un onglet resté ouvert toute la nuit en est une, comme une page rouverte.
 */
export const ABSENCE_A_RAPPELER = 30 * 60;

export const TEXTES_REPRISE = {
  /** Le nom du bloc, pour les lecteurs d'écran. */
  titre: "Reprise",
  profondeur: "Profondeur",
  absence: "Absence",
  comptee: "comptée à",
  reprendre: "reprendre",
} as const;

/** Ce que le noyau montre au retour du joueur. */
export interface MessageReprise {
  /** Le rappel, trois lignes au plus : le lieu, puis celles de la strate. Vide après une pause. */
  rappel: string[];
  /** Le résumé de l'absence ; vide quand il n'y a rien à en dire. */
  absence: string[];
}

/** Une durée lisible : « 3 j 4 h », « 5 h 12 min », « 45 min ». Les secondes sont ignorées. */
export function formaterDuree(secondes: number): string {
  const minutes = Math.floor(secondes / 60);
  const [j, h, min] = [Math.floor(minutes / 1440), Math.floor(minutes / 60) % 24, minutes % 60];
  if (j > 0) return h > 0 ? `${j} j ${h} h` : `${j} j`;
  if (h > 0) return min > 0 ? `${h} h ${min} min` : `${h} h`;
  return min > 0 ? `${min} min` : "moins d'une minute";
}

/** La première ligne du rappel, écrite par le noyau : « Profondeur 2 · Les caves ». */
export function lieu(profondeur: NumeroStrate): string {
  return `${TEXTES_REPRISE.profondeur} ${profondeur} · ${NOMS_STRATES[profondeur]}`;
}

/**
 * Le résumé d'une absence, ou null s'il n'y a rien à dire : « Absence : 8 h 12 min, comptée à 80 %. »
 * En politique propre, les lignes de la strate suivent la durée.
 */
export function resumerAbsence(reprise: Reprise): string[] | null {
  if (reprise.type !== "absence" || reprise.duree < ABSENCE_A_RESUMER) return null;
  const debut = `${TEXTES_REPRISE.absence} : ${formaterDuree(reprise.duree)}`;

  switch (reprise.politique) {
    case "standard": {
      const plafond =
        reprise.comptee < reprise.duree ? ` sur ${formaterDuree(PLAFOND_HORS_LIGNE)}` : "";
      return [`${debut}, ${TEXTES_REPRISE.comptee} ${pourcentage(TAUX_HORS_LIGNE)}${plafond}.`];
    }
    case "propre":
      return reprise.lignes.length > 0 ? [`${debut}.`, ...reprise.lignes] : null;
    case "aucune":
      return null;
  }
}

/**
 * Ce que le noyau montre au retour du joueur dans la strate `profondeur`, ou null s'il n'y a rien à
 * dire. Après une absence d'au moins `ABSENCE_A_RAPPELER`, le rappel précède le résumé : le lieu, puis
 * deux des `lignes` de la strate, au plus.
 */
export function composerReprise(
  reprise: Reprise,
  profondeur: NumeroStrate,
  lignes: readonly string[],
): MessageReprise | null {
  if (reprise.type !== "absence") return null;
  const rappel =
    reprise.duree >= ABSENCE_A_RAPPELER ? [lieu(profondeur), ...lignes.slice(0, 2)] : [];
  const absence = resumerAbsence(reprise) ?? [];
  return rappel.length > 0 || absence.length > 0 ? { rappel, absence } : null;
}

import { PLAFOND_HORS_LIGNE, TAUX_HORS_LIGNE, type Reprise } from "../logique/horsligne";

/** En deçà, une absence ne mérite pas de résumé, en secondes. */
const ABSENCE_A_RESUMER = 60;

/** Une durée lisible : « 3 j 4 h », « 5 h 12 min », « 45 min ». Les secondes sont ignorées. */
export function formaterDuree(secondes: number): string {
  const minutes = Math.floor(secondes / 60);
  const [j, h, min] = [Math.floor(minutes / 1440), Math.floor(minutes / 60) % 24, minutes % 60];
  if (j > 0) return h > 0 ? `${j} j ${h} h` : `${j} j`;
  if (h > 0) return min > 0 ? `${h} h ${min} min` : `${h} h`;
  return min > 0 ? `${min} min` : "moins d'une minute";
}

/** Le résumé montré au retour du joueur, ou null s'il n'y a rien à dire. */
export function resumerReprise(reprise: Reprise): string[] | null {
  if (reprise.type !== "absence" || reprise.duree < ABSENCE_A_RESUMER) return null;
  const debut = `Pendant votre absence (${formaterDuree(reprise.duree)})`;

  switch (reprise.politique) {
    case "standard": {
      const taux = `${Math.round(TAUX_HORS_LIGNE * 100)} %`;
      const plafond =
        reprise.comptee < reprise.duree
          ? `, pendant les ${PLAFOND_HORS_LIGNE / 3600} premières heures`
          : "";
      return [`${debut}, la production a continué, à ${taux}${plafond}.`];
    }
    case "propre":
      return reprise.lignes.length > 0 ? [`${debut} :`, ...reprise.lignes] : null;
    case "aucune":
      return null;
  }
}

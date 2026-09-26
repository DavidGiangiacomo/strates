import { GENERATEURS, type IdGenerateur } from "./regles";

/** Un point d'historique toutes les 10 s de temps simulé. */
export const PERIODE_HISTORIQUE = 10;
/** 90 points : les 15 dernières minutes. */
export const TAILLE_HISTORIQUE = 90;

export interface EtatSurface {
  /** Le stock, que les achats dépensent. */
  credits: number;
  /** Tout ce qui a été gagné : la valeur convertible (D-003). */
  cumul: number;
  generateurs: Record<IdGenerateur, number>;
  /** Identifiants des améliorations achetées. */
  ameliorations: string[];
  /** Index de l'objectif courant ; vaut le nombre d'objectifs quand tout est atteint. */
  objectif: number;
  /** Secondes simulées depuis l'arrivée, absences comprises. */
  temps: number;
  /** Valeur de `temps` au moment du seuil ; il reste atteint. */
  seuilAtteintA: number | null;
  /** La production P, un point toutes les 10 s, sur les 15 dernières minutes. */
  historique: number[];
  /** Multiplicateur des artefacts sur la production, relu à chaque tick (aucun artefact n'arrive à la surface). */
  multiplicateur: number;
}

export function etatInitial(): EtatSurface {
  return {
    credits: 0,
    cumul: 0,
    generateurs: Object.fromEntries(GENERATEURS.map((g) => [g.id, 0])) as Record<
      IdGenerateur,
      number
    >,
    ameliorations: [],
    objectif: 0,
    temps: 0,
    seuilAtteintA: null,
    historique: [],
    multiplicateur: 1,
  };
}

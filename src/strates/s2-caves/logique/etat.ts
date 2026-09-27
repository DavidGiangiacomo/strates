import { ARRIVEE, type IdStockage } from "./regles";

/** Un point d'historique tous les 5 jours. */
export const PERIODE_HISTORIQUE = 5;
/** 252 points : les 3 dernières années. */
export const TAILLE_HISTORIQUE = 252;
/** Le registre garde ses 30 dernières lignes. */
export const TAILLE_REGISTRE = 30;
/** Les 20 derniers hivers jugés, pour l'anneau du grand cycle. */
export const TAILLE_HIVERS = 20;

/** Une ligne du registre : une clé de texte et ses valeurs, formatées par la vue. */
export interface LigneRegistre {
  cle: string;
  valeurs: Record<string, number>;
}

export interface EtatCaves {
  /** Boisseaux en réserve : un réel, affiché entier. */
  reserve: number;
  /** Tout le grain récolté, glanage compris, même perdu ensuite : la valeur convertible (D-003). */
  cumul: number;
  /** Un réel : les départs sont fractionnaires. */
  familles: number;
  /** Familles installées par le joueur : le prix de la suivante en dépend. */
  installees: number;
  stockages: Record<IdStockage, number>;
  /** Outils possédés, de 0 à 4, dans l'ordre. */
  outils: number;
  /** 1, 2, … */
  annee: number;
  /** Jour de l'année, de 0 à 420 ; l'hiver en occupe la fin. */
  jour: number;
  /** Entre le premier jour du printemps et la fin de la soudure : l'hiver précédent n'est pas jugé. */
  soudure: boolean;
  /** L'hiver en cours de jugement : ce qui s'est passé depuis le bilan précédent. */
  bilan: { rupture: boolean; joursDeRupture: number; departs: number };
  /** Les derniers hivers jugés, du plus ancien au plus récent. */
  hivers: { annee: number; rupture: boolean }[];
  /** Grands hivers de suite passés sans rupture. */
  serie: number;
  /** Valeur de `temps` au seuil ; il reste atteint. */
  seuilAtteintA: number | null;
  /** Secondes simulées depuis l'arrivée, absences comprises. */
  temps: number;
  /** Le grain perdu : débordé faute de place, pourri dans les stockages. */
  pertes: { debord: number; pourri: number };
  /** Les dernières lignes du registre, de la plus ancienne à la plus récente. */
  registre: LigneRegistre[];
  historique: {
    /** La réserve, un point tous les 5 jours, sur les 3 dernières années. */
    reserve: number[];
    /** Les instants (`temps`) des achats des 3 dernières années. */
    achats: number[];
  };
  /** Multiplicateurs des artefacts, relus à chaque tick. */
  multiplicateurs: { recolte: number; conservation: number };
}

export function etatInitial(): EtatCaves {
  return {
    reserve: ARRIVEE.reserve,
    cumul: 0,
    familles: ARRIVEE.familles,
    installees: 0,
    stockages: { grenier: ARRIVEE.greniers, silo: 0, cave: 0, caveProfonde: 0 },
    outils: 0,
    annee: ARRIVEE.annee,
    jour: ARRIVEE.jour,
    soudure: false,
    bilan: { rupture: false, joursDeRupture: 0, departs: 0 },
    hivers: [],
    serie: 0,
    seuilAtteintA: null,
    temps: 0,
    pertes: { debord: 0, pourri: 0 },
    registre: [
      { cle: "registre.arrivee", valeurs: { annee: ARRIVEE.annee, familles: ARRIVEE.familles } },
    ],
    historique: { reserve: [], achats: [] },
    multiplicateurs: { recolte: 1, conservation: 1 },
  };
}

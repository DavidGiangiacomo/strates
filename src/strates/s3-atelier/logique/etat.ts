import {
  casesLibres,
  PIECES,
  ROUES_ARRIVEE,
  TAILLE_ARRIVEE,
  type IdPiece,
  type TaillePlan,
} from "./regles";

/** La légende garde ses 30 dernières lignes. */
export const TAILLE_LEGENDE = 30;

/** Une ligne de la légende : une clé de texte et ses valeurs, formatées par la vue. */
export interface LigneLegende {
  cle: string;
  valeurs: Record<string, number>;
  /** Un objet d'en haut (« s2-faucille »), que la légende nomme de son nom d'en bas. */
  objet?: string;
}

export interface PieceAtelier {
  id: IdPiece;
  /** Son numéro d'achat, pour la légende (« Pièce 14 ») : les deux roues de l'arrivée sont 1 et 2. */
  repere: number;
  /** Ligne et colonne ; le coin haut gauche d'une grande pièce ; null sur l'établi. */
  case: [number, number] | null;
  /** Quarts de tour, dans le sens horaire. */
  rot: 0 | 1 | 2 | 3;
  /** Côtés limés, dans l'orientation de base. */
  limees: number[];
}

export interface EtatAtelier {
  taille: TaillePlan;
  /** Dans l'ordre d'achat ; le ressort n'y est pas. */
  pieces: PieceAtelier[];
  /** Exemplaires achetés de chaque pièce, ceux de l'arrivée non compris : leur prix en dépend. */
  achetees: Record<IdPiece, number>;
  /** Les pièces qu'on peut dépenser. */
  stock: number;
  /** Toutes les pièces produites : la valeur convertible (D-003). */
  cumul: number;
  /** Les frottements en cours, et depuis quand (`temps`) : ils se montrent au bout d'un tour. */
  genes: Record<string, number>;
  /** Secondes depuis l'arrivée, absences comprises. */
  temps: number;
  /** Valeur de `temps` au seuil ; il reste atteint. */
  seuilAtteintA: number | null;
  /** Les dernières lignes de la légende, de la plus ancienne à la plus récente. */
  legende: LigneLegende[];
  /** La pièce sans plan, trouvée au dernier agrandissement, sur l'établi. */
  sansPlan: boolean;
  /** Multiplicateurs des artefacts, relus à chaque tick. */
  multiplicateurs: { ressort: number; plan: number };
}

export function etatInitial(): EtatAtelier {
  const etat: EtatAtelier = {
    taille: TAILLE_ARRIVEE,
    pieces: ROUES_ARRIVEE.map(([l, c], i) => ({
      id: "roue",
      repere: i + 1,
      case: [l, c],
      rot: 0,
      limees: [],
    })),
    achetees: Object.fromEntries(PIECES.map((p) => [p.id, 0])) as Record<IdPiece, number>,
    stock: 0,
    cumul: 0,
    genes: {},
    temps: 0,
    seuilAtteintA: null,
    legende: [],
    sansPlan: false,
    multiplicateurs: { ressort: 1, plan: 1 },
  };
  etat.legende.push({
    cle: "legende.arrivee",
    valeurs: { taille: etat.taille, cases: casesLibres(etat) },
  });
  return etat;
}

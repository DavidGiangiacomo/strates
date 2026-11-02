import { CREUX } from "./regles";

/** Le limon d'une crue : une couche, au bassin ou dans un creux. */
export interface Couche {
  /** Le numéro de la crue. */
  crue: number;
  /** Où est allé son limon : le bassin, ou le creux de ce numéro. */
  ou: "bassin" | number;
  /** En doigts, ramenés à la largeur du bassin. */
  epaisseur: number;
  /** L'eau s'est reposée derrière une levée. */
  retenue: boolean;
}

/** Une phrase du jeu (fiche, § 11) : sa clé de texte, et le moment où elle paraît. */
export interface Phrase {
  cle: string;
  /** En secondes depuis l'arrivée, comme `temps`. */
  a: number;
}

/** Comment la dette s'est achevée, lu au journal à l'arrivée : ses fosses sont dans la rive (fiche, § 6). */
export type IssueDette = "soldee" | "defaut";

export interface EtatLit {
  /** Secondes depuis l'arrivée, absences comprises. */
  temps: number;
  /** Les crues passées. Elles s'arrêtent au bassin plein : le fleuve passe ailleurs. */
  crues: number;
  /** La hauteur du limon sur l'échelle, en doigts. */
  niveau: number;
  /** Le limon de chaque creux, en doigts ramenés à la largeur du bassin. */
  creux: number[];
  /** Le creux que ferme la levée ; null s'il n'y en a pas. */
  levee: number | null;
  /** Tout le limon déposé, en doigts : la valeur convertible (D-003). */
  depose: number;
  /** Les couches, de la plus ancienne à la plus récente : pour le dessin, et pour la trace laissée au fond. */
  couches: Couche[];
  /** Le moment où le bassin a atteint la rive. */
  pleinA: number | null;
  /** Le moment de la descente : une crue après le bassin plein, en présence du joueur (fiche, § 10). */
  descenteA: number | null;
  /** Les levées déplacées d'un creux qui n'était pas plein : la patience (fiche, § 7). */
  deplacements: number;
  /** Les phrases du jeu, dans l'ordre où elles paraissent : chacune une fois. */
  dites: Phrase[];
  /** L'issue de la dette, ou null si le journal n'en a pas. */
  dette: IssueDette | null;
  /** Multiplicateurs des artefacts, relus à chaque tick. */
  multiplicateurs: { depot: number; patience: number };
}

export function etatInitial(dette: IssueDette | null = null): EtatLit {
  return {
    temps: 0,
    crues: 0,
    niveau: 0,
    creux: CREUX.map(() => 0),
    levee: null,
    depose: 0,
    couches: [],
    pleinA: null,
    descenteA: null,
    deplacements: 0,
    // « Rien ne presse. » : la première phrase, à l'arrivée ; la première crue vient trente secondes
    // plus tard (fiche, § 3).
    dites: [{ cle: "phrase.arrivee", a: 0 }],
    dette,
    multiplicateurs: { depot: 1, patience: 1 },
  };
}

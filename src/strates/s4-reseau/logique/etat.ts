import {
  ARRIVEE,
  capacite,
  MONTEE,
  trace,
  type IdNoeud,
  type IdSource,
  type Ouverture,
} from "./regles";

/** Une conduite posée sur un tracé du plan (§ 3). */
export interface Conduite {
  /** De 1 à 13 : le tracé, et le numéro de sa vanne. */
  trace: number;
  /** Elle porte 10^calibre pouces. */
  calibre: number;
  /** La part de son calibre qu'elle laisse passer. */
  vanne: Ouverture;
}

/**
 * Une ligne du carnet de relevés : sa clé de texte, et les nombres qu'elle cite. La vue les écrit dans
 * la notation du réseau : les débits en pouces, les nœuds par leur nom.
 */
export interface LigneCarnet {
  cle: string;
  valeurs: Record<string, number>;
}

export interface EtatReseau {
  /** Secondes depuis l'arrivée, absences comprises. */
  temps: number;
  /** Les conduites posées, dans l'ordre des tracés. */
  conduites: Conduite[];
  /** L'instant où chaque source a été reliée : sa montée part de là. La source 1 coule déjà. */
  reliees: Partial<Record<IdSource, number>>;
  /** Les sources déjà notées à plein au carnet. */
  aPlein: IdSource[];
  /** L'eau qui attend au-dessus du niveau de service de chaque source ou bassin, en muids. */
  attente: Partial<Record<IdNoeud, number>>;
  /** Depuis quand chaque source ou bassin monte : il reçoit plus que ses conduites n'emportent. */
  montees: Partial<Record<IdNoeud, number>>;
  /** Ceux dont le déversoir a coulé pendant leur montée : le carnet a nommé leur goulot. */
  signales: IdNoeud[];
  /** Ceux qui redescendent vers leur niveau de service, après une montée. */
  redescendent: IdNoeud[];
  /** Le débit de chaque conduite au dernier instant, en pouces, par tracé. */
  debits: Record<number, number>;
  /** Ce que la ville reçoit, en pouces. */
  recoit: number;
  /** Les muids à dépenser. */
  caisse: number;
  /** Tout ce que la ville a reçu, en muids : la valeur convertible (§ 9). */
  recu: number;
  /** L'eau des déversoirs, en muids. */
  perdu: number;
  /** Secondes sans goulot, les six sources à plein, en présence du joueur : cinq minutes font le seuil. */
  tenue: number;
  /** L'instant du seuil ; il le reste une fois atteint. */
  seuilA: number | null;
  /** L'instant où le dernier goulot a cessé ; null tant qu'il y en a un, ou s'il n'y en a jamais eu. */
  sansGoulotDepuis: number | null;
  /** Les goulots défaits avant le signal : un bassin qui cesse de monter avant que son déversoir ne coule. */
  avantSignal: number;
  /** Le quatrième bassin s'est révélé : c'est une salle voûtée, la citerne. */
  citerne: boolean;
  /** La citerne en service a été notée : « Citerne qui chante : pleine. » */
  chante: boolean;
  /** Les dernières lignes du carnet. */
  carnet: LigneCarnet[];
  /** Les lignes écrites depuis l'arrivée : la dernière du carnet porte ce numéro. */
  ecrites: number;
  /** Les multiplicateurs des objets d'en haut, relus à chaque tick, une fois éveillés (§ 8). */
  multiplicateurs: { debit: number; pose: number };
}

/**
 * L'arrivée (§ 3) : la source 1 coule à plein, 10 pouces, dans le bassin bas, qui se vide en ville.
 * Les deux conduites sont au calibre 1 : elles portent les 10 pouces, ni plus ni moins. La caisse est
 * vide, et le carnet vierge.
 */
export function etatInitial(): EtatReseau {
  const conduites: Conduite[] = ARRIVEE.map((numero) => ({
    trace: numero,
    calibre: trace(numero)!.pose,
    vanne: 1,
  }));
  return {
    temps: 0,
    conduites,
    reliees: { 1: -MONTEE },
    aPlein: [1],
    attente: {},
    montees: {},
    signales: [],
    redescendent: [],
    debits: Object.fromEntries(conduites.map((c) => [c.trace, capacite(c.calibre)])),
    recoit: capacite(1),
    caisse: 0,
    recu: 0,
    perdu: 0,
    tenue: 0,
    seuilA: null,
    sansGoulotDepuis: null,
    avantSignal: 0,
    citerne: false,
    chante: false,
    carnet: [],
    ecrites: 0,
    multiplicateurs: { debit: 1, pose: 1 },
  };
}

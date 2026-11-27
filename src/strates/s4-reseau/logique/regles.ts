// Les règles du réseau (docs/strates/strate-4.md, § 3) : le plan, ses six sources et ses treize
// tracés, les calibres, la montée d'une source reliée, le partage de l'eau, la contenance des bassins
// et les prix. Tout débit est en pouces ; un pouce verse un muid par minute (§ 1).
import { PLAFOND_HORS_LIGNE, TAUX_HORS_LIGNE } from "../../../noyau/logique/horsligne";

export type IdSource = 1 | 2 | 3 | 4 | 5 | 6;
export type IdBassin = "bas" | "milieu" | "haut" | "citerne";
export type IdNoeud = `source${IdSource}` | IdBassin | "ville";

/** L'ouverture d'une vanne, au quart : fermée, d'un quart, de moitié, aux trois quarts, ouverte. */
export type Ouverture = 0 | 0.25 | 0.5 | 0.75 | 1;
export const OUVERTURES: readonly Ouverture[] = [0, 0.25, 0.5, 0.75, 1];

/** Un tracé du plan : la conduite qu'on peut y poser (§ 3, « Le plan »). */
export interface Trace {
  /** De 1 à 13 : le numéro de la conduite, et celui de sa vanne. */
  numero: number;
  de: IdNoeud;
  vers: IdNoeud;
  /** Le calibre auquel la conduite se pose. */
  pose: number;
  /** Le calibre le plus fort du tracé : au-delà, la conduite ne s'élargit plus. */
  max: number;
  /** Les trois routes lointaines jusqu'à la ville coûtent trois fois plus. */
  facteur: 1 | 3;
}

export const TRACES: readonly Trace[] = [
  { numero: 1, de: "source1", vers: "bas", pose: 1, max: 4, facteur: 1 },
  { numero: 2, de: "bas", vers: "ville", pose: 1, max: 5, facteur: 1 },
  { numero: 3, de: "source2", vers: "bas", pose: 1, max: 5, facteur: 1 },
  { numero: 4, de: "source3", vers: "milieu", pose: 4, max: 8, facteur: 1 },
  { numero: 5, de: "milieu", vers: "bas", pose: 4, max: 7, facteur: 1 },
  { numero: 6, de: "milieu", vers: "ville", pose: 4, max: 9, facteur: 3 },
  { numero: 7, de: "source4", vers: "haut", pose: 6, max: 10, facteur: 1 },
  { numero: 8, de: "haut", vers: "milieu", pose: 6, max: 10, facteur: 1 },
  { numero: 9, de: "haut", vers: "ville", pose: 6, max: 13, facteur: 3 },
  { numero: 10, de: "source5", vers: "haut", pose: 9, max: 13, facteur: 1 },
  { numero: 11, de: "source6", vers: "citerne", pose: 12, max: 15, facteur: 1 },
  { numero: 12, de: "citerne", vers: "haut", pose: 11, max: 13, facteur: 1 },
  { numero: 13, de: "citerne", vers: "ville", pose: 11, max: 15, facteur: 3 },
];

/** Les deux conduites posées à l'arrivée : la source 1 au bassin bas, et le bassin bas à la ville. */
export const ARRIVEE: readonly number[] = [1, 2];
/** La route de la citerne : la grande conduite. */
export const GRANDE_CONDUITE = 13;

/** Le débit plein de chaque source, en pouces (§ 3, « Les sources »). */
export const SOURCES: Readonly<Record<IdSource, number>> = {
  1: 10,
  2: 4_000,
  3: 1_600_000,
  4: 640_000_000,
  5: 256_000_000_000,
  6: 150_000_000_000_000,
};
export const IDS_SOURCES: readonly IdSource[] = [1, 2, 3, 4, 5, 6];
export const BASSINS: readonly IdBassin[] = ["bas", "milieu", "haut", "citerne"];

/**
 * Un bassin paraît sur le plan avec la première source qui s'y jette : le bas est là dès l'arrivée,
 * le milieu paraît avec la source 3, le haut avec la 4, le quatrième avec la 6.
 */
export const SOURCE_DU_BASSIN: Readonly<Record<IdBassin, IdSource>> = {
  bas: 1,
  milieu: 3,
  haut: 4,
  citerne: 6,
};

/** L'ordre de l'eau, d'amont en aval : chaque nœud reçoit tout ce qui lui vient avant de partager. */
export const ORDRE: readonly IdNoeud[] = [
  "source6",
  "citerne",
  "source4",
  "source5",
  "haut",
  "source3",
  "milieu",
  "source1",
  "source2",
  "bas",
  "ville",
];

/** Une source reliée double toutes les deux minutes et demie, dix fois : vingt-cinq minutes. */
export const DOUBLEMENT = 150;
export const DOUBLEMENTS = 10;
export const MONTEE = DOUBLEMENT * DOUBLEMENTS;
/** Un bassin, ou la vasque d'une source, tient deux minutes de ce que ses conduites emportent. */
export const CONTENANCE = 2;
/** Le seuil : cinq minutes sans goulot, les six sources à plein, en présence du joueur. */
export const TENUE = 300;
/** Le prix du calibre 1, en muids : chaque calibre coûte dix fois le précédent. */
export const PRIX_CALIBRE_1 = 2.4;
/** Un pouce vaut cent quarante-quatre lignes. */
export const LIGNES = 144;
/** L'absence compte comme ailleurs : à 80 %, douze heures au plus (§ 10). */
export const TAUX_ABSENCE = TAUX_HORS_LIGNE;
export const PLAFOND_ABSENCE = PLAFOND_HORS_LIGNE;
/** Les écarts de calcul tolérés : un bassin qui reçoit exactement ce qu'il emporte ne monte pas. */
export const EPSILON = 1e-9;

/** Ce que porte une conduite de calibre n, en pouces : 10ⁿ. */
export function capacite(calibre: number): number {
  return 10 ** calibre;
}

export function trace(numero: number): Trace | undefined {
  return TRACES[numero - 1];
}

/** Le prix du calibre `calibre` sur ce tracé, en muids, arrondi au muid, pose divisant (§ 8). */
export function prix(t: Trace, calibre: number, pose = 1): number {
  return Math.max(1, Math.round((t.facteur * PRIX_CALIBRE_1 * 10 ** (calibre - 1)) / pose));
}

/** La source d'un nœud, ou null si c'est un bassin ou la ville. */
export function sourceDe(noeud: IdNoeud): IdSource | null {
  const m = /^source([1-6])$/.exec(noeud);
  return m ? (Number(m[1]) as IdSource) : null;
}

/** Le tracé qui relie une source : sa conduite. */
export function traceDeSource(k: IdSource): Trace {
  return TRACES.find((t) => t.de === `source${k}`)!;
}

/**
 * L'eau qui sort d'un nœud se partage à parts égales entre ses conduites ; ce qu'une conduite pleine
 * ne prend pas va aux autres (§ 3). `capacites` : ce que chacune peut porter, vanne comprise.
 */
export function partager(capacites: readonly number[], debit: number): number[] {
  const parts = capacites.map(() => 0);
  let reste = debit;
  let libres = capacites.flatMap((c, i) => (c > 0 ? [i] : []));
  while (reste > EPSILON * Math.max(1, debit) && libres.length > 0) {
    const part = reste / libres.length;
    const pleines = libres.filter((i) => capacites[i]! - parts[i]! <= part);
    if (pleines.length === 0) {
      for (const i of libres) parts[i]! += part;
      break;
    }
    for (const i of pleines) {
      reste -= capacites[i]! - parts[i]!;
      parts[i] = capacites[i]!;
    }
    libres = libres.filter((i) => !pleines.includes(i));
  }
  return parts;
}

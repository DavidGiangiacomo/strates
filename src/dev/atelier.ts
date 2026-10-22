// L'atelier achevé (#79), pour les tests et les outils de développement : toute la nomenclature posée
// sur le plan de 12 × 12, sans frottement, et tout entraîné par le ressort (fiche, § 4). Le joueur le
// cherche pendant des heures ; celui-ci se construit d'un coup, et prouve que les comptes tombent juste.
//
// Quatre colonnes de pièces (1, 4, 7 et 10) descendent du haut du plan jusqu'en bas. Une ligne sur
// deux, chacune tient ses deux voisines, qui tiennent à leur tour la case du dessous. Les deux colonnes
// du centre touchent le ressort ; celles du bord les rejoignent par la première ligne. Les cinq grandes
// pièces prennent des carrés de voisines, et tiennent au rouage par un seul côté. Chaque case dit les
// côtés où il lui faut une dent : la pièce la plus simple qui les a s'y pose, tournée, et ses autres
// dents sont limées.
import {
  etatInitial,
  type EtatAtelier,
  type PieceAtelier,
} from "../strates/s3-atelier/logique/etat";
import {
  coinRessort,
  PIECES,
  TAILLE_MAX,
  type Cote,
  type DefPiece,
  type IdPiece,
} from "../strates/s3-atelier/logique/regles";

const N = TAILLE_MAX;
const R = coinRessort(N);
/** Les colonnes qui descendent du haut du plan, et tiennent chacune ses deux voisines. */
const COLONNES = [1, 4, 7, 10];
/** Les grandes pièces : leur coin, et le côté par lequel elles tiennent au rouage. */
const GRANDES: readonly { id: IdPiece; coin: [number, number]; cote: Cote }[] = [
  { id: "grandeRoue", coin: [2, 2], cote: 3 },
  { id: "balancier", coin: [6, 2], cote: 3 },
  { id: "grandeRoue", coin: [2, 8], cote: 1 },
  { id: "balancier", coin: [6, 8], cote: 1 },
  { id: "grandeRoue", coin: [10, 8], cote: 1 },
];
/** La dernière pièce, gardée sur l'établi par `atelierDernierePiece` : une feuille, en bas à gauche. */
export const CASE_DERNIERE: [number, number] = [11, 0];

/** Pour chaque besoin, les pièces qui y suffisent, de la plus simple à la plus riche. */
const PREFERENCES: Record<string, readonly IdPiece[]> = {
  quatre: ["roue", "echappement"],
  trois: ["secteur", "rochet", "roue", "echappement"],
  opposees: ["pignon", "arbre", "secteur", "rochet", "roue", "echappement"],
  equerre: ["renvoi", "champ", "secteur", "rochet", "roue", "echappement"],
  une: [
    "cliquet",
    "ancre",
    "pignon",
    "arbre",
    "renvoi",
    "champ",
    "secteur",
    "rochet",
    "roue",
    "echappement",
  ],
};

const PAS: Record<Cote, [number, number]> = { 0: [-1, 0], 1: [0, 1], 2: [1, 0], 3: [0, -1] };
const cle = (l: number, c: number) => `${l},${c}`;
const auRessort = (l: number, c: number) => l >= R && l < R + 2 && c >= R && c < R + 2;
const dansUneGrande = (l: number, c: number) =>
  GRANDES.some(({ coin: [gl, gc] }) => l >= gl && l < gl + 2 && c >= gc && c < gc + 2);

/** Les côtés où chaque case du plan demande une dent, hors ressort et grandes pièces. */
function besoins(): Map<string, Set<Cote>> {
  const besoin = new Map<string, Set<Cote>>();
  for (let l = 0; l < N; l++) {
    for (let c = 0; c < N; c++) {
      if (!auRessort(l, c) && !dansUneGrande(l, c)) besoin.set(cle(l, c), new Set());
    }
  }
  const dent = (l: number, c: number, d: Cote) => besoin.get(cle(l, c))?.add(d);
  /** Un contact denté : une dent de chaque côté. Vers le ressort, la dent seule. */
  const relier = (l: number, c: number, d: Cote) => {
    const [x, y] = [l + PAS[d][0], c + PAS[d][1]];
    if (!besoin.has(cle(l, c))) return;
    if (auRessort(x, y)) dent(l, c, d);
    else if (besoin.has(cle(x, y))) {
      dent(l, c, d);
      dent(x, y, ((d + 2) % 4) as Cote);
    }
  };

  for (const s of COLONNES) {
    for (let l = 0; l < N - 1; l++) relier(l, s, 2);
    for (let l = 0; l < N; l += 2) {
      relier(l, s, 3);
      relier(l, s, 1);
      relier(l, s - 1, 2);
      relier(l, s + 1, 2);
    }
  }
  // Les colonnes du bord rejoignent celles du centre par la première ligne.
  relier(0, 2, 1);
  relier(0, 8, 1);
  // Toute case contre le ressort lui présente une dent : un côté lisse y frotterait.
  for (const k of [R, R + 1]) {
    dent(R - 1, k, 2);
    dent(R + 2, k, 0);
    dent(k, R - 1, 1);
    dent(k, R + 2, 3);
  }
  // Les grandes pièces tiennent par un côté : les deux cases qui le touchent y présentent une dent.
  for (const { coin, cote } of GRANDES) {
    for (const h of [0, 1]) {
      const [l, c] =
        cote === 3 ? [coin[0] + h, coin[1] - 1] : ([coin[0] + h, coin[1] + 2] as [number, number]);
      dent(l, c, ((cote + 2) % 4) as Cote);
    }
  }
  return besoin;
}

/** Le genre d'un besoin : quatre dents, trois, deux opposées, deux en équerre, ou une. */
function genre(besoin: Set<Cote>): string {
  if (besoin.size === 4) return "quatre";
  if (besoin.size === 3) return "trois";
  if (besoin.size === 2) return besoin.has(0) === besoin.has(2) ? "opposees" : "equerre";
  return "une";
}

/** La pièce tournée pour présenter une dent de chaque côté demandé, les autres dents limées. */
function tourner(
  d: DefPiece,
  besoin: ReadonlySet<Cote>,
): Pick<PieceAtelier, "rot" | "limees"> | null {
  for (const rot of [0, 1, 2, 3] as const) {
    const montrees = new Set(d.dents.map((b) => (b + rot) % 4));
    if ([...besoin].every((x) => montrees.has(x))) {
      return { rot, limees: d.dents.filter((b) => !besoin.has(((b + rot) % 4) as Cote)) };
    }
  }
  return null;
}

/**
 * L'atelier achevé : la nomenclature entière posée, 120 petites pièces et 5 grandes, sans frottement,
 * tout entraîné. Le seuil n'y est pas encore noté : seul un geste le franchit.
 */
export function atelierAcheve(): EtatAtelier {
  const etat = etatInitial();
  const restantes = new Map(PIECES.map((d) => [d.id, d.exemplaires]));
  const prendre = (id: IdPiece) => restantes.set(id, restantes.get(id)! - 1);
  const pieces: Omit<PieceAtelier, "repere">[] = [];

  for (const { id, coin, cote } of GRANDES) {
    const d = PIECES.find((p) => p.id === id)!;
    const posee = tourner(d, new Set([cote]))!;
    pieces.push({ id, case: coin, ...posee });
    prendre(id);
  }
  // Les besoins les plus exigeants d'abord, chacun avec la pièce la plus simple qui reste.
  const ordre = ["quatre", "trois", "opposees", "equerre", "une"];
  const cases = [...besoins()].sort(
    ([, a], [, b]) => ordre.indexOf(genre(a)) - ordre.indexOf(genre(b)),
  );
  for (const [position, besoin] of cases) {
    const id = PREFERENCES[genre(besoin)]!.find((p) => restantes.get(p)! > 0);
    if (!id) throw new Error(`Plus aucune pièce pour la case ${position}.`);
    const [l, c] = position.split(",").map(Number) as [number, number];
    pieces.push({
      id,
      case: [l, c],
      ...tourner(
        PIECES.find((p) => p.id === id)!,
        besoin,
      )!,
    });
    prendre(id);
  }

  etat.taille = N;
  etat.pieces = pieces.map((p, i) => ({ ...p, repere: i + 1 }));
  // Les deux roues de l'arrivée ne s'achètent pas.
  for (const d of PIECES) etat.achetees[d.id] = d.id === "roue" ? d.exemplaires - 2 : d.exemplaires;
  // La dernière ligne de la légende avant la fin : la pièce sans plan, trouvée au dernier agrandissement.
  etat.sansPlan = true;
  etat.legende = [{ cle: "legende.sans-plan", valeurs: {} }];
  // Ce qu'un joueur naturel a produit quand il en est là (fiche, § 4 et § 9).
  etat.cumul = 3.1e11;
  etat.temps = 2 * 3600 + 41 * 60;
  return etat;
}

/** L'atelier achevé, moins sa dernière pièce, restée sur l'établi : un geste avant le seuil. */
export function atelierDernierePiece(): EtatAtelier {
  const etat = atelierAcheve();
  const [l, c] = CASE_DERNIERE;
  const derniere = etat.pieces.find((p) => p.case?.[0] === l && p.case[1] === c)!;
  derniere.case = null;
  return etat;
}

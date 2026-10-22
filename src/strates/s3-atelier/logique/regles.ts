// Règles de l'atelier : le plan et son ressort, la nomenclature, les contacts entre les pièces,
// l'entraînement, la production et les prix. Fiche de design : docs/strates/strate-3.md, § 1 et § 3.
import type { EtatAtelier, PieceAtelier } from "./etat";

/** Un tour du ressort, en secondes : le temps de l'atelier se compte en tours (fiche, § 1). */
export const TOUR = 12;

// ——— Les côtés et les directions

/**
 * Un côté d'une pièce, ou une direction sur le plan : 0 en haut, 1 à droite, 2 en bas, 3 à gauche.
 * Une pièce tournée de `rot` quarts de tour, dans le sens horaire, montre en `d` son côté de base
 * `d − rot`.
 */
export type Cote = 0 | 1 | 2 | 3;
export const COTES: readonly Cote[] = [0, 1, 2, 3];

export function oppose(d: Cote): Cote {
  return ((d + 2) % 4) as Cote;
}

// ——— La nomenclature (fiche, § 3)

export type IdPiece =
  | "roue"
  | "cliquet"
  | "renvoi"
  | "pignon"
  | "secteur"
  | "echappement"
  | "ancre"
  | "champ"
  | "arbre"
  | "rochet"
  | "grandeRoue"
  | "balancier";

export interface DefPiece {
  id: IdPiece;
  /** Ses côtés dentés, dans l'orientation de base. */
  dents: readonly Cote[];
  exemplaires: number;
  /** Sa production de base, par tour. */
  base: number;
  /** Le prix du premier exemplaire. */
  prix: number;
  /** Les cases de son côté : 1 pour une pièce, 2 pour une grande pièce, qui en tient quatre. */
  largeur: 1 | 2;
}

/**
 * Les douze pièces, dans l'ordre de la nomenclature. Les deux séries ont les mêmes cinq profils, dans le
 * même ordre : quatre dents, une, deux en équerre, deux opposées, trois. 120 petites pièces et 5 grandes
 * occupent exactement les 140 cases du plan de 12 × 12. Les prix sont à régler à l'équilibrage (#96).
 */
export const PIECES: readonly DefPiece[] = [
  { id: "roue", dents: [0, 1, 2, 3], exemplaires: 12, base: 7, prix: 88, largeur: 1 },
  { id: "cliquet", dents: [0], exemplaires: 12, base: 37, prix: 1_750, largeur: 1 },
  { id: "renvoi", dents: [0, 1], exemplaires: 12, base: 180, prix: 8_800, largeur: 1 },
  { id: "pignon", dents: [0, 2], exemplaires: 12, base: 920, prix: 44_000, largeur: 1 },
  { id: "secteur", dents: [3, 0, 1], exemplaires: 12, base: 4_600, prix: 220_000, largeur: 1 },
  {
    id: "echappement",
    dents: [0, 1, 2, 3],
    exemplaires: 12,
    base: 23_000,
    prix: 1_300_000,
    largeur: 1,
  },
  { id: "ancre", dents: [0], exemplaires: 12, base: 110_000, prix: 7_700_000, largeur: 1 },
  { id: "champ", dents: [0, 1], exemplaires: 12, base: 570_000, prix: 47_000_000, largeur: 1 },
  { id: "arbre", dents: [0, 2], exemplaires: 12, base: 2_900_000, prix: 290_000_000, largeur: 1 },
  {
    id: "rochet",
    dents: [3, 0, 1],
    exemplaires: 12,
    base: 14_000_000,
    prix: 1_800_000_000,
    largeur: 1,
  },
  {
    id: "grandeRoue",
    dents: [0, 1, 2, 3],
    exemplaires: 3,
    base: 290_000_000,
    prix: 13_000_000_000,
    largeur: 2,
  },
  {
    id: "balancier",
    dents: [0],
    exemplaires: 2,
    base: 1_400_000_000,
    prix: 38_000_000_000,
    largeur: 2,
  },
];

const PAR_ID = new Map(PIECES.map((p) => [p.id, p]));

export function defPiece(id: string): DefPiece | undefined {
  return PAR_ID.get(id as IdPiece);
}

function def(piece: PieceAtelier): DefPiece {
  const d = PAR_ID.get(piece.id);
  if (!d) throw new Error(`Pièce inconnue : ${piece.id}.`);
  return d;
}

export function largeur(piece: PieceAtelier): 1 | 2 {
  return def(piece).largeur;
}

/** Chaque exemplaire d'une pièce coûte 25 % de plus que le précédent. */
export const CROISSANCE_PRIX = 1.25;

/** Le prix du prochain exemplaire : premier prix × 1,25ⁿ, n étant les exemplaires déjà achetés. */
export function prixPiece(etat: EtatAtelier, d: DefPiece): number {
  return Math.round(d.prix * CROISSANCE_PRIX ** etat.achetees[d.id]);
}

/** Les exemplaires qui restent à acheter, ceux de l'arrivée compris dans le compte. */
export function restantes(etat: EtatAtelier, d: DefPiece): number {
  let possedees = 0;
  for (const p of etat.pieces) if (p.id === d.id) possedees++;
  return d.exemplaires - possedees;
}

/** Une pièce paraît dans la nomenclature quand le cumul atteint la moitié de son premier prix. */
export function pieceVisible(etat: EtatAtelier, d: DefPiece): boolean {
  return restantes(etat, d) < d.exemplaires || etat.cumul >= d.prix / 2;
}

// ——— Le plan et ses agrandissements

export type TaillePlan = 6 | 8 | 10 | 12;

/** Le plan grandit d'une couronne à la fois : 8, 10, puis 12 cases de côté, une grosse de cases. */
export const AGRANDISSEMENTS: readonly { taille: TaillePlan; prix: number }[] = [
  { taille: 8, prix: 70_000 },
  { taille: 10, prix: 4_700_000 },
  { taille: 12, prix: 960_000_000 },
];

export const TAILLE_ARRIVEE: TaillePlan = 6;
export const TAILLE_MAX: TaillePlan = 12;

/**
 * Le prochain agrandissement, s'il en reste, et son prix : divisé par le levier `plan`, celui des objets
 * d'en haut (fiche, § 8).
 */
export function prochainAgrandissement(
  etat: EtatAtelier,
): { taille: TaillePlan; prix: number } | undefined {
  const a = AGRANDISSEMENTS.find((x) => x.taille > etat.taille);
  return a && { taille: a.taille, prix: Math.round(a.prix / etat.multiplicateurs.plan) };
}

/** L'agrandissement paraît, lui aussi, quand le cumul atteint la moitié de son prix. */
export function agrandissementVisible(etat: EtatAtelier): boolean {
  const a = prochainAgrandissement(etat);
  return a !== undefined && etat.cumul >= a.prix / 2;
}

/** La première ligne et la première colonne du ressort : il tient les quatre cases du centre. */
export function coinRessort(taille: number): number {
  return taille / 2 - 1;
}

/**
 * L'arrivée (fiche, § 3) : deux roues dentées au-dessus du ressort, engrenées avec lui et entre elles.
 * Leurs dents du haut et des côtés regardent des cases libres.
 */
export const ROUES_ARRIVEE: readonly [number, number][] = [
  [coinRessort(TAILLE_ARRIVEE) - 1, coinRessort(TAILLE_ARRIVEE)],
  [coinRessort(TAILLE_ARRIVEE) - 1, coinRessort(TAILLE_ARRIVEE) + 1],
];

/** Dans la grille d'occupation : une case libre, le ressort, ou la pièce d'indice `i` (`i + 1`). */
const LIBRE = 0;
const RESSORT = -1;

/** L'occupation du plan, case par case, ligne après ligne. */
export function grille(etat: EtatAtelier): Int32Array {
  const n = etat.taille;
  const g = new Int32Array(n * n);
  const r = coinRessort(n);
  for (let l = r; l < r + 2; l++) for (let c = r; c < r + 2; c++) g[l * n + c] = RESSORT;
  etat.pieces.forEach((p, i) => {
    if (!p.case) return;
    const s = largeur(p);
    const [l0, c0] = p.case;
    for (let l = l0; l < l0 + s; l++) for (let c = c0; c < c0 + s; c++) g[l * n + c] = i + 1;
  });
  return g;
}

/** Une case : deux entiers, la ligne et la colonne. */
export function estCase(x: unknown): x is [number, number] {
  return Array.isArray(x) && x.length === 2 && x.every((v) => Number.isInteger(v));
}

/**
 * Une pièce de `s` cases de côté tiendrait-elle là, coin haut gauche en `[l, c]` ? Les cases doivent être
 * dans le plan et libres ; celles de la pièce d'indice `sauf`, qu'on déplace, comptent comme libres.
 */
export function placeLibre(
  etat: EtatAtelier,
  s: number,
  [l, c]: readonly [number, number],
  sauf = -1,
): boolean {
  const n = etat.taille;
  if (l < 0 || c < 0 || l + s > n || c + s > n) return false;
  const g = grille(etat);
  for (let i = l; i < l + s; i++) {
    for (let j = c; j < c + s; j++) {
      const o = g[i * n + j]!;
      if (o !== LIBRE && o !== sauf + 1) return false;
    }
  }
  return true;
}

// ——— Les contacts (fiche, § 3)

/** Le côté de base qu'une pièce montre en `d`. */
export function coteDeBase(piece: PieceAtelier, d: Cote): Cote {
  return ((d - piece.rot + 4) % 4) as Cote;
}

/** Le côté qu'une pièce montre en `d` est-il denté ? Une dent limée ne l'est plus. */
export function dente(piece: PieceAtelier, d: Cote): boolean {
  const b = coteDeBase(piece, d);
  return def(piece).dents.includes(b) && !piece.limees.includes(b);
}

/** Ce que touche un demi-côté : une dent face à une dent, un frottement, ou rien. */
export interface DemiCote {
  contact: "engrene" | "frotte" | "rien";
  /** Le frottement, nommé comme dans `etat.genes`. */
  cle?: string;
}

export interface EtatPiece {
  /** Reliée au ressort par une chaîne de dents engrenées : elle tourne. */
  entrainee: boolean;
  /** Ses demi-côtés engrenés et ses frottements : un demi-côté par côté, deux pour une grande pièce. */
  engrenes: number;
  frottements: number;
  /** Ses dents qui regardent une case libre. */
  dentsLibres: number;
  /** Elle engrène directement avec le ressort : les objets d'en haut la renforcent (fiche, § 8). */
  auRessort: boolean;
  /** Sa production, par tour : 0 si elle n'est pas entraînée. */
  production: number;
  /** Ce que touchent ses demi-côtés, par direction du plan : `cotes[d][h]`, h le long du côté. */
  cotes: DemiCote[][];
}

/** Un frottement : une dent contre un côté lisse, contre le ressort lisse d'une pièce, ou contre le cadre. */
export interface Frottement {
  /** Son nom, stable tant que les deux mêmes côtés se touchent, même quand le plan grandit. */
  cle: string;
  /** La pièce que nomme la légende : celle dont la dent frotte, ou celle dont le côté lisse frotte le ressort. */
  piece: number;
  contre: "piece" | "cadre" | "ressort";
  /** La pièce frottée, quand c'en est une. */
  autre?: number;
}

export interface Analyse {
  /** Chaque pièce posée, par son repère. */
  pieces: Map<number, EtatPiece>;
  /** La production de l'atelier, par tour : la somme de celle des pièces entraînées. */
  production: number;
  frottements: Frottement[];
  casesLibres: number;
  /** Les dents du rouage, ressort compris, qui regardent une case libre : il peut encore grandir. */
  dentsLibres: number;
}

/**
 * Le nom d'un frottement : la pièce, la direction et le demi-côté par lesquels elle frotte, et ce
 * qu'elle frotte (« C » le cadre, « R » le ressort, ou le repère d'une pièce). « 3:1.0:7 » : la pièce 3
 * frotte à droite contre la pièce 7.
 */
function cleFrottement(piece: number, d: Cote, h: number, contre: string | number): string {
  return `${piece}:${d}.${h}:${contre}`;
}

/** La case que touche le demi-côté `h` du côté `d` d'une pièce de `s` cases, coin en `[l, c]`. */
function caseTouchee(l: number, c: number, s: number, d: Cote, h: number): [number, number] {
  if (d === 0) return [l - 1, c + h];
  if (d === 1) return [l + h, c + s];
  if (d === 2) return [l + s, c + h];
  return [l + h, c - 1];
}

/** La case de la pièce elle-même qui porte ce demi-côté. */
function caseDuBord(l: number, c: number, s: number, d: Cote, h: number): [number, number] {
  if (d === 0) return [l, c + h];
  if (d === 1) return [l + h, c + s - 1];
  if (d === 2) return [l + s - 1, c + h];
  return [l + h, c];
}

/** Le demi-côté par lequel le côté `d` d'une pièce, coin en `[l, c]`, touche la case `[x, y]`. */
function demiTouche(l: number, c: number, d: Cote, [x, y]: [number, number]): number {
  return d === 0 || d === 2 ? y - c : x - l;
}

/**
 * La production d'une pièce entraînée, par tour : base × 2^(engrenés − frottements). Une grande pièce
 * compte par demi-côté, et l'exposant est divisé par deux : engrenée partout, elle produit seize fois sa
 * base, comme une petite. Celles qui engrènent avec le ressort produisent × m, le levier des objets.
 */
export function productionPiece(
  d: DefPiece,
  engrenes: number,
  frottements: number,
  multiplicateur = 1,
): number {
  return d.base * 2 ** ((engrenes - frottements) / d.largeur) * multiplicateur;
}

/**
 * Refait les contacts, l'entraînement et la production (fiche, § 3) : ce que la logique recalcule après
 * chaque geste. L'entraînement est un parcours depuis le ressort, de dent en dent. Un frottement ne
 * coupe pas le mouvement ; une pièce qui n'est pas entraînée ne produit rien, où qu'elle soit.
 */
export function analyser(etat: EtatAtelier): Analyse {
  const n = etat.taille;
  const g = grille(etat);
  const pieces = new Map<number, EtatPiece>();
  const frottements: Frottement[] = [];
  /** Pour chaque pièce, par indice, celles avec qui elle engrène. */
  const engrenees: number[][] = etat.pieces.map(() => []);
  const auRessort: number[] = [];

  etat.pieces.forEach((piece, i) => {
    if (!piece.case) return;
    const [l, c] = piece.case;
    const s = largeur(piece);
    const info: EtatPiece = {
      entrainee: false,
      engrenes: 0,
      frottements: 0,
      dentsLibres: 0,
      auRessort: false,
      production: 0,
      cotes: [[], [], [], []],
    };
    for (const d of COTES) {
      const mienne = dente(piece, d);
      for (let h = 0; h < s; h++) {
        const [x, y] = caseTouchee(l, c, s, d, h);
        let demi: DemiCote = { contact: "rien" };
        if (x < 0 || y < 0 || x >= n || y >= n) {
          // Le cadre est lisse : une dent y frotte.
          if (mienne) {
            const cle = cleFrottement(piece.repere, d, h, "C");
            demi = { contact: "frotte", cle };
            frottements.push({ cle, piece: piece.repere, contre: "cadre" });
          }
        } else {
          const o = g[x * n + y]!;
          if (o === LIBRE) {
            if (mienne) info.dentsLibres++;
          } else if (o === RESSORT) {
            // Le ressort est denté sur ses quatre côtés.
            if (mienne) {
              demi = { contact: "engrene" };
              if (!info.auRessort) auRessort.push(i);
              info.auRessort = true;
            } else {
              const cle = cleFrottement(piece.repere, d, h, "R");
              demi = { contact: "frotte", cle };
              frottements.push({ cle, piece: piece.repere, contre: "ressort" });
            }
          } else {
            const autre = etat.pieces[o - 1]!;
            const sienne = dente(autre, oppose(d));
            if (mienne && sienne) {
              demi = { contact: "engrene" };
              engrenees[i]!.push(o - 1);
            } else if (mienne || sienne) {
              // Le frottement porte le nom de la pièce dont la dent frotte : le même, vu des deux côtés.
              let cle: string;
              if (mienne) {
                cle = cleFrottement(piece.repere, d, h, autre.repere);
                frottements.push({
                  cle,
                  piece: piece.repere,
                  contre: "piece",
                  autre: autre.repere,
                });
              } else {
                const [la, ca] = autre.case!;
                const da = oppose(d);
                const h2 = demiTouche(la, ca, da, caseDuBord(l, c, s, d, h));
                cle = cleFrottement(autre.repere, da, h2, piece.repere);
              }
              demi = { contact: "frotte", cle };
            }
          }
        }
        if (demi.contact === "engrene") info.engrenes++;
        if (demi.contact === "frotte") info.frottements++;
        info.cotes[d]!.push(demi);
      }
    }
    pieces.set(piece.repere, info);
  });

  // L'entraînement : de dent en dent, depuis les pièces qui engrènent avec le ressort.
  const entrainees = new Set(auRessort);
  const file = [...auRessort];
  while (file.length > 0) {
    for (const j of engrenees[file.pop()!]!) {
      if (!entrainees.has(j)) {
        entrainees.add(j);
        file.push(j);
      }
    }
  }

  let production = 0;
  let dentsLibres = 0;
  for (const i of entrainees) {
    const piece = etat.pieces[i]!;
    const info = pieces.get(piece.repere)!;
    info.entrainee = true;
    info.production = productionPiece(
      def(piece),
      info.engrenes,
      info.frottements,
      info.auRessort ? etat.multiplicateurs.ressort : 1,
    );
    production += info.production;
    dentsLibres += info.dentsLibres;
  }

  // Les dents du ressort qui regardent une case libre : deux par côté.
  const r = coinRessort(n);
  for (let k = 0; k < 2; k++) {
    for (const [x, y] of [
      [r - 1, r + k],
      [r + 2, r + k],
      [r + k, r - 1],
      [r + k, r + 2],
    ] as const) {
      if (g[x * n + y] === LIBRE) dentsLibres++;
    }
  }

  let casesLibres = 0;
  for (const o of g) if (o === LIBRE) casesLibres++;

  return { pieces, production, frottements, casesLibres, dentsLibres };
}

/**
 * Le seuil (fiche, § 4) : le plan à 12 × 12, toute la nomenclature posée (plus une case libre, plus
 * rien sur l'établi), rien ne frotte, et toutes les pièces entraînées. La pièce sans plan n'est pas de
 * la nomenclature : elle ne compte pas. L'accumulation achète tout, mais ne monte rien (I4).
 */
export function assemblageAcheve(etat: EtatAtelier, analyse?: Analyse): boolean {
  // Le plus simple d'abord : la plupart des gestes n'ont pas besoin de l'analyse.
  if (etat.taille !== TAILLE_MAX || etat.pieces.some((p) => !p.case)) return false;
  const a = analyse ?? analyser(etat);
  if (a.casesLibres > 0 || a.frottements.length > 0) return false;
  for (const info of a.pieces.values()) if (!info.entrainee) return false;
  return true;
}

/** Les cases libres du plan. */
export function casesLibres(etat: EtatAtelier): number {
  let libres = 0;
  for (const o of grille(etat)) if (o === LIBRE) libres++;
  return libres;
}

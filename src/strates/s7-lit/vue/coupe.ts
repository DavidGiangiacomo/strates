// La coupe du lit (fiche, § 6) : sa géométrie, sans Svelte. Le fleuve à gauche, le bassin au centre
// et ses couches, la rive à droite et ses quatre creux, l'échelle au bord du bassin, côté fleuve. Au
// fond, le rocher aux encoches ; dans la rive, les fosses de la dette ; sur la berge, les objets d'en
// haut. Le fleuve, la rive et la roche continuent hors du cadre, jusqu'aux bords de l'écran (`DEBORD`).
import type { Couche, EtatLit, IssueDette } from "../logique";
import { CREUX, CRUE, DOIGTS, DUREE_PHRASE, RIVE, VOLUME } from "../logique/regles";

export const LARGEUR = 1000;
export const HAUTEUR = 620;
/** Le fond du bassin, en y ; la rive est en haut, à `HAUT`. */
export const FOND = 580;
export const HAUT = 100;
/** Pixels par doigt, sur l'échelle. */
export const PX = (FOND - HAUT) / RIVE;
/** La hauteur de `doigts` sur l'échelle, en y. */
export const y = (doigts: number): number => FOND - doigts * PX;
/** Jusqu'où le fleuve, la rive et la roche continuent, à gauche et à droite du cadre. */
export const DEBORD = 2000;

export const FLEUVE = { x: 0, largeur: 150 };
export const BASSIN = { x: 150, largeur: 610 };
/** Là où commence la rive, et où s'ouvrent les creux. */
export const BORD_RIVE = BASSIN.x + BASSIN.largeur;
/** Une poche de creux, creusée dans la rive : sa largeur en pixels, sa hauteur en doigts. */
export const POCHE = { largeur: 110, hauteur: 2 * DOIGTS };
/** La pierre de l'échelle, dressée au bord du bassin, côté fleuve. */
export const ECHELLE = { x: 164, largeur: 16, haut: RIVE + DOIGTS };
/** L'eau d'une crue monte de deux coudées et demie au-dessus du limon. */
export const CRETE = 70;
/** Une phrase du jeu vient en une seconde et demie, et s'efface de même. */
export const FONDU = 1.5;
/**
 * Le limon d'une crue se dépose au milieu de son repos, puis la couche monte au fond, lentement,
 * en cinq secondes, pendant que l'eau s'éclaircit.
 */
export const TASSEMENT = 5;

/** Une bande de la coupe : une couche, ou une vieille couche de la rive. */
export interface Bande {
  y: number;
  hauteur: number;
  /** 0 ou 1 en alternance, d'une couche à l'autre ; 2 ou 3 pour l'eau retenue, plus sombre. */
  teinte: number;
}

const teinte = (c: Couche): number => (c.crue % 2) + (c.retenue ? 2 : 0);

/**
 * La part déposée de la couche `c` à l'instant `temps`, de 0 à 1 : la n-ième crue laisse son limon à
 * n × 30 s, et sa couche monte en `TASSEMENT` secondes. Sans instant, elle est toute déposée.
 */
export function tassement(c: Couche, temps = Infinity): number {
  return Math.min(1, Math.max(0, (temps - c.crue * CRUE) / TASSEMENT));
}

/**
 * Les couches du bassin, empilées depuis le fond, chacune à son épaisseur. À l'instant `temps`, la
 * dernière monte encore, si sa crue vient de passer.
 */
export function couchesDuBassin(couches: readonly Couche[], temps = Infinity): Bande[] {
  const bandes: Bande[] = [];
  let base = 0;
  for (const c of couches) {
    if (c.ou !== "bassin") continue;
    const epaisseur = c.epaisseur * tassement(c, temps);
    bandes.push({ y: y(base + epaisseur), hauteur: epaisseur * PX, teinte: teinte(c) });
    base += epaisseur;
  }
  return bandes;
}

/** Les couches du creux `k`, dans sa poche : un creux plein emplit sa poche. */
export function couchesDuCreux(couches: readonly Couche[], k: number, temps = Infinity): Bande[] {
  const bas = y(CREUX[k]!);
  const echelle = (POCHE.hauteur * PX) / VOLUME;
  const bandes: Bande[] = [];
  let base = 0;
  for (const c of couches) {
    if (c.ou !== k) continue;
    const epaisseur = c.epaisseur * tassement(c, temps);
    bandes.push({
      y: bas - (base + epaisseur) * echelle,
      hauteur: epaisseur * echelle,
      teinte: teinte(c),
    });
    base += epaisseur;
  }
  return bandes;
}

/** Les couches à venir du bassin, à leur place : au-dessus de celles qui sont déjà déposées. */
export function couchesAVenirDuBassin(
  couches: readonly Couche[],
  avenir: readonly Couche[],
): Bande[] {
  const n = avenir.filter((c) => c.ou === "bassin").length;
  return n === 0 ? [] : couchesDuBassin([...couches, ...avenir]).slice(-n);
}

/** Les couches à venir du creux `k`, dans sa poche, au-dessus de son limon. */
export function couchesAVenirDuCreux(
  couches: readonly Couche[],
  avenir: readonly Couche[],
  k: number,
): Bande[] {
  const n = avenir.filter((c) => c.ou === k).length;
  return n === 0 ? [] : couchesDuCreux([...couches, ...avenir], k).slice(-n);
}

/** Les vieilles couches de la rive : fines et régulières, avec une couche épaisse parmi elles. */
export const VIEILLES: readonly (Bande & { epaisse: boolean })[] = (() => {
  const bandes: (Bande & { epaisse: boolean })[] = [];
  let haut = FOND;
  for (let i = 0; haut > y(RIVE); i++) {
    const epaisse = i === 37;
    const hauteur = Math.min(epaisse ? 21 : 7, haut - y(RIVE));
    bandes.push({ y: haut - hauteur, hauteur, teinte: i % 2, epaisse });
    haut -= hauteur;
  }
  return bandes;
})();

/** Les traits de l'échelle : un long par coudée, un court tous les sept doigts. */
export const TRAITS: readonly { y: number; long: boolean }[] = Array.from(
  { length: ECHELLE.haut / 7 + 1 },
  (_, i) => ({ y: y(i * 7), long: i % 4 === 0 }),
);

/** La pierre de l'échelle, dressée : un bloc au sommet arrondi, que le limon enterre. */
export const PIERRE = (() => {
  const { x, largeur } = ECHELLE;
  const haut = y(ECHELLE.haut);
  return `M${x},${FOND} V${haut + 5} Q${x + largeur / 2},${haut - 5} ${x + largeur},${haut + 5} V${FOND} Z`;
})();

// ——— Le rocher aux encoches (fiche, § 2) : le fleuve l'a mis à nu au fond du bassin, et les
// premières couches du bassin le recouvrent.

/** Une bosse basse au fond du bassin, de `de` à `a`, haute de `haut` pixels. */
export const ROCHER = { de: 300, a: 640, haut: 24 };

/** La hauteur du rocher au-dessus du fond, en pixels, à l'abscisse `x` : une bosse un peu inégale. */
export function hauteurRocher(x: number): number {
  if (x <= ROCHER.de || x >= ROCHER.a) return 0;
  const t = (x - ROCHER.de) / (ROCHER.a - ROCHER.de);
  return ROCHER.haut * Math.sin(Math.PI * t) ** 0.6 * (1 + 0.06 * Math.sin(x * 0.23));
}

/** Le contour du rocher, en chemin SVG. */
export const CONTOUR_ROCHER = (() => {
  const points: string[] = [];
  for (let x = ROCHER.de; x <= ROCHER.a; x += 8) {
    points.push(`${x},${(FOND - hauteurRocher(x)).toFixed(1)}`);
  }
  return `M${points.join(" L")} Z`;
})();

/**
 * Les encoches, par groupes (bible, § 4) : de courts traits gravés sur la face du rocher, là où il
 * est assez haut pour les porter.
 */
export const ENCOCHES: readonly { x: number; y1: number; y2: number }[] = (() => {
  const traits: { x: number; y1: number; y2: number }[] = [];
  let x = ROCHER.de + 44;
  for (const n of [5, 3, 6, 4, 7, 2, 5, 4]) {
    for (let i = 0; i < n; i++, x += 4) {
      const haut = FOND - hauteurRocher(x) + 5;
      if (FOND - 3 - haut >= 5) traits.push({ x, y1: haut, y2: Math.min(haut + 9, FOND - 3) });
    }
    x += 12;
  }
  return traits;
})();

// ——— Les fosses de la dette (fiche, § 6 ; bible, § 7), creusées d'en haut dans la berge.

/** Deux fosses, à droite des creux : leur bord gauche, leur largeur, et leur fond, en y. */
export const FOSSES: readonly { x: number; largeur: number; fond: number }[] = [
  { x: 892, largeur: 34, fond: 238 },
  { x: 946, largeur: 38, fond: 300 },
];

/** Le contour d'une fosse : un peu plus large en haut, à la surface de la berge. */
export function contourFosse(f: (typeof FOSSES)[number]): string {
  return `M${f.x - 3},${HAUT} L${f.x + f.largeur + 3},${HAUT} L${f.x + f.largeur},${f.fond} L${f.x},${f.fond} Z`;
}

/** Une tablette d'argile au fond d'une fosse, entière ou brisée en éclats. */
export interface Tablette {
  /** Le polygone, en points SVG. */
  points: string;
  /** L'empreinte du sceau, au milieu d'une tablette entière ; null pour un éclat. */
  sceau: { x: number; y: number } | null;
}

type Point = readonly [number, number];
const polygone = (sommets: readonly Point[]): string =>
  sommets.map(([px, py]) => `${px},${py}`).join(" ");

/** Les éclats d'une tablette brisée, depuis le coin bas et gauche du fond d'une fosse. */
const ECLATS: readonly (readonly Point[])[] = [
  [
    [0, 0],
    [9, -1],
    [7, -6],
    [1, -5],
  ],
  [
    [11, 0],
    [18, 0],
    [16, -7],
  ],
  [
    [3, -7],
    [10, -9],
    [8, -14],
    [2, -12],
  ],
  [
    [14, -8],
    [21, -10],
    [19, -15],
  ],
  [
    [6, -16],
    [13, -16],
    [11, -21],
  ],
];

/**
 * Les tablettes au fond des fosses : entières et scellées si la dette est tombée en défaut, brisées
 * si elle a été soldée (une dette payée, on brisait sa tablette). Sans issue connue, pas de fosse.
 */
export function tablettes(issue: IssueDette | null): Tablette[] {
  if (issue === null) return [];
  const resultat: Tablette[] = [];
  FOSSES.forEach((f, i) => {
    const gauche = f.x + 5;
    if (issue === "defaut") {
      // Deux ou trois tablettes couchées l'une sur l'autre, un peu de travers.
      const droite = f.x + f.largeur - 5;
      for (let n = 0; n < 2 + i; n++) {
        const bas = f.fond - 2 - n * 10;
        const penche = n % 2 === 0 ? 1.5 : -1.5;
        resultat.push({
          points: polygone([
            [gauche, bas],
            [droite, bas - penche],
            [droite, bas - 8 - penche],
            [gauche, bas - 8],
          ]),
          sceau: { x: (gauche + droite) / 2, y: bas - 4 - penche / 2 },
        });
      }
      return;
    }
    // Des éclats, tombés pêle-mêle au fond : trois dans la première fosse, cinq dans la seconde.
    for (const eclat of ECLATS.slice(0, 3 + 2 * i)) {
      resultat.push({
        points: polygone(eclat.map(([dx, dy]): Point => [gauche + dx, f.fond - 2 + dy])),
        sceau: null,
      });
    }
  });
  return resultat;
}

// ——— Les objets d'en haut, posés sur la berge, en haut de la rive (fiche, § 8).

/** Le premier objet se pose au-dessus des creux, les suivants à sa droite. */
export const BERGE = { de: 790, ecart: 20 };

/** L'abscisse de chacun des `n` objets posés sur la berge. */
export function placesSurLaBerge(n: number): number[] {
  return Array.from({ length: n }, (_, i) => BERGE.de + i * BERGE.ecart);
}

// ——— L'eau de la crue

/**
 * L'eau de la crue à l'instant `temps`, de 0, à sec, à 1, au plus haut. Elle monte en dix secondes,
 * se repose dix, se retire en dix : la n-ième crue laisse son limon au milieu de son repos, à n × 30 s.
 * La première monte quinze secondes après l'arrivée ; le bassin plein, le fleuve passe ailleurs.
 * `reduit` : moins de mouvement, la crue monte et se retire en trois images, sans glisser.
 */
export function eau(temps: number, pleinA: number | null, reduit = false): number {
  if (temps < CRUE / 2) return 0;
  if (pleinA !== null && temps >= pleinA + CRUE / 2) return 0;
  const u = (temps + CRUE / 2) % CRUE;
  const f = u < 10 ? u / 10 : u < 20 ? 1 : 1 - (u - 20) / 10;
  return reduit ? Math.round(f * 2) / 2 : f;
}

/**
 * Où en est la crue à l'instant `temps` : son numéro, et sa montée, son repos ou son retrait. La
 * n-ième crue monte de n × 30 − 15 à n × 30 − 5 secondes, se repose dix secondes, puis se retire.
 * null avant la première, et quand le bassin est plein, une fois retirée la dernière : le fleuve
 * passe ailleurs.
 */
export function momentCrue(
  temps: number,
  pleinA: number | null,
): { crue: number; phase: "montee" | "repos" | "retrait" } | null {
  if (temps < CRUE / 2) return null;
  if (pleinA !== null && temps >= pleinA + CRUE / 2) return null;
  const crue = Math.floor((temps + CRUE / 2) / CRUE);
  const u = temps + CRUE / 2 - crue * CRUE;
  return { crue, phase: u < 10 ? "montee" : u < 20 ? "repos" : "retrait" };
}

/**
 * La part claire de l'eau de la crue à l'instant `temps`, de 0, toute trouble, à 1, toute claire.
 * Elle monte chargée de limon, s'éclaircit de haut en bas pendant ses dix secondes de repos, et se
 * retire claire. `reduit` : en trois images, comme la crue.
 */
export function clarte(temps: number, reduit = false): number {
  const u = (temps + CRUE / 2) % CRUE;
  const c = u < 10 ? 0 : u < 20 ? (u - 10) / 10 : 1;
  return reduit ? Math.round(c * 2) / 2 : c;
}

/**
 * Où passe l'eau claire à l'eau trouble, de haut en bas, en fraction de la hauteur de l'eau : claire
 * au-dessus de `haut`, trouble au-dessous de `bas`, et un passage doux entre les deux. Toute trouble à
 * 0, toute claire à 1.
 */
export function passageTrouble(c: number): { haut: number; bas: number } {
  const doux = 0.15;
  const milieu = c * (1 + 2 * doux) - doux;
  const borne = (v: number) => Math.min(1, Math.max(0, v));
  return { haut: borne(milieu - doux), bas: borne(milieu + doux) };
}

/** La phrase du jeu à l'instant `temps`, et son opacité : elle vient, reste, puis s'efface. */
export function phraseCourante(
  etat: Pick<EtatLit, "dites" | "temps">,
  reduit = false,
): { cle: string; opacite: number } | null {
  const p = etat.dites.find((d) => etat.temps >= d.a && etat.temps < d.a + DUREE_PHRASE);
  if (!p) return null;
  const ecoule = etat.temps - p.a;
  const opacite = reduit ? 1 : Math.min(1, ecoule / FONDU, (DUREE_PHRASE - ecoule) / FONDU);
  return { cle: p.cle, opacite };
}

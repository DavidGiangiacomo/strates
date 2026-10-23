// Les sons de l'atelier (#94 ; fiche, § 6) : du métal et du papier, pas de musique.
// - Le tic, en boucle, d'un tour du ressort : le ressort bat dès l'arrivée, grave, une fois par
//   seconde ; à mesure que des pièces tournent, les rouages, les engrenages puis le mécanisme s'y
//   mêlent, plus clairs et plus rapides. Au seuil, tous les tics tombent ensemble, et l'atelier ne
//   bat plus que d'un seul coup, tous les timbres à la fois.
// - Une pièce qui frotte en tournant crisse, par à-coups, comme ses saccades.
// - Poser : un clic de métal. Tourner : un cran. Limer : la lime qui râpe. Agrandir : le papier du
//   plan qui se déplie.
// Ils sont calculés, sans fichier, et n'ont rien de commun avec ceux des autres couches (§ 12). Les
// boucles cèdent la main : elles se calculent par étapes, sans figer l'image, et le moteur les cale
// sur l'horloge de la banque, quel que soit le moment où chacune part.
import { creerAlea, tirer, type EtatAlea } from "../../../noyau/logique/alea";
import type { SourceSon } from "../../../noyau/logique/types";
import {
  ajouter,
  blanc,
  finir,
  normaliserParEtapes,
  panoramique,
  passeBas,
  resonateur,
} from "../../../noyau/plateforme/synthese";
import { TOUR } from "../logique/regles";

/** Les couches du tic, de la plus grave à la plus fine. */
export const COUCHES = ["ressort", "rouages", "engrenages", "mecanisme"] as const;
export type Couche = (typeof COUCHES)[number];

/** Les boucles (les couches du tic, l'unisson d'après le seuil, le crissement), puis les coups. */
export type SonAtelier =
  Couche | "unisson" | "crissement" | "ensemble" | "pose" | "cran" | "lime" | "deplier";

/** Les durées des sons, en secondes. Le tic boucle sur un tour du ressort. */
export const DUREES_SONS: Readonly<Record<SonAtelier, number>> = {
  ressort: TOUR,
  rouages: TOUR,
  engrenages: TOUR,
  mecanisme: TOUR,
  unisson: TOUR,
  crissement: 11,
  ensemble: 3,
  pose: 0.3,
  cran: 0.12,
  lime: 0.95,
  deplier: 1.1,
};

/** Les coups par seconde de chaque couche : le ressort bat la seconde, les autres la divisent. */
export const BATTEMENTS: Readonly<Record<Couche, number>> = {
  ressort: 1,
  rouages: 2,
  engrenages: 4,
  mecanisme: 14,
};

/**
 * Le tic qui s'enrichit à chaque pièce entraînée (fiche, § 6). Le ressort bat dès l'arrivée ; les
 * rouages montent avec les premières pièces, les engrenages au-delà d'une quinzaine, le mécanisme
 * au-delà de cinquante-cinq, jusqu'au plan plein. Au seuil, les couches se taisent, et l'unisson bat
 * seul.
 */
export function volumesTic(entrainees: number, seuil: boolean): Record<Couche | "unisson", number> {
  if (seuil) return { ressort: 0, rouages: 0, engrenages: 0, mecanisme: 0, unisson: 0.55 };
  const monte = (de: number, a: number, plein: number) =>
    plein * Math.max(0, Math.min(1, (entrainees - de) / (a - de)));
  return {
    ressort: 0.45,
    rouages: monte(1, 16, 0.4),
    engrenages: monte(16, 56, 0.32),
    mecanisme: monte(55, 125, 0.28),
    unisson: 0,
  };
}

/** Le crissement : plus présent quand plusieurs pièces frottent en tournant ; trois le portent au plus fort. */
export function volumeCrissement(frottent: number): number {
  return 0.3 * Math.min(1, Math.max(0, frottent) / 3);
}

/** Un mode d'une pièce de métal frappée : sa fréquence, son poids, la durée de sa décroissance. */
type Mode = readonly [frequence: number, gain: number, decroissance: number];

/** Les timbres : chaque couche a les siens, du ressort grave aux engrenages fins. */
const TIMBRES = {
  tic: [
    [880, 1, 0.05],
    [2310, 0.5, 0.03],
    [3790, 0.25, 0.015],
    [190, 0.6, 0.06],
  ],
  tac: [
    [640, 1, 0.055],
    [1710, 0.45, 0.03],
    [2950, 0.2, 0.015],
    [150, 0.6, 0.07],
  ],
  rouage: [
    [2700, 1, 0.02],
    [4100, 0.5, 0.012],
    [6300, 0.25, 0.008],
  ],
  engrenage: [
    [5200, 1, 0.01],
    [7400, 0.5, 0.007],
    [9100, 0.3, 0.005],
  ],
  mecanisme: [
    [3300, 1, 0.008],
    [4800, 0.6, 0.006],
    [1500, 0.5, 0.01],
  ],
  pose: [
    [1850, 1, 0.04],
    [3920, 0.6, 0.025],
    [6100, 0.3, 0.012],
    [140, 0.8, 0.02],
  ],
  cran: [
    [4300, 1, 0.006],
    [6800, 0.5, 0.004],
  ],
} as const satisfies Record<string, readonly Mode[]>;

/**
 * Un coup de métal, seul : un éclat de bruit pour l'attaque, puis des modes qui sonnent et
 * s'éteignent. `hauteur` multiplie les fréquences (une pièce un peu plus grande sonne un peu plus
 * bas), `resonance` les décroissances (un coup qui sonne plus longtemps).
 */
function coup(
  fe: number,
  modes: readonly Mode[],
  alea: EtatAlea,
  hauteur = 1,
  resonance = 1,
): Float32Array {
  const longueur = Math.ceil(6 * resonance * Math.max(...modes.map(([, , d]) => d)) * fe);
  const x = new Float32Array(longueur);
  // Chaque mode est un oscillateur amorti : un vecteur qui tourne et raccourcit à chaque échantillon.
  for (const [frequence, gain, decroissance] of modes) {
    const w = (2 * Math.PI * frequence * hauteur) / fe;
    if (w >= 0.9 * Math.PI) continue;
    const r = Math.exp(-1 / (decroissance * resonance * fe));
    const c = r * Math.cos(w);
    const s = r * Math.sin(w);
    const phase = 2 * Math.PI * tirer(alea);
    let re = Math.cos(phase);
    let im = Math.sin(phase);
    for (let i = 0; i < longueur; i++) {
      x[i] = x[i]! + gain * im;
      const suivant = re * c - im * s;
      im = re * s + im * c;
      re = suivant;
    }
  }
  // L'attaque monte en 0,4 ms, sur un éclat de bruit plus aigu que le coup ; la queue s'efface.
  const eclat = resonateur(Math.min(modes[0]![0] * 2.3 * hauteur, 0.4 * fe), 1.5, fe);
  const montee = 0.0004 * fe;
  const bref = 0.0008 * fe;
  const queue = Math.max(1, Math.round(0.15 * longueur));
  for (let i = 0; i < longueur; i++) {
    const bruit = i < 10 * bref ? 0.6 * eclat(blanc(alea) * Math.exp(-i / bref)) : 0;
    const efface = Math.min(1, (longueur - i) / queue);
    x[i] = efface * (Math.min(1, i / montee) * x[i]! + bruit);
  }
  return x;
}

/**
 * Ajoute un coup aux canaux, à `debut` secondes. Dans une boucle, ce qui passe la fin reprend au
 * début : rien ne se coupe quand elle recommence.
 */
function placer(
  canaux: Float32Array[],
  fe: number,
  x: Float32Array,
  o: { debut: number; gain: number; position?: number; boucle?: boolean },
): void {
  const [g, d] = panoramique(o.position ?? 0);
  const longueur = canaux[0]!.length;
  const n0 = Math.round(o.debut * fe);
  for (let i = 0; i < x.length; i++) {
    ajouter(canaux, o.boucle ? (n0 + i) % longueur : n0 + i, o.gain * x[i]!, g, d);
  }
}

/** Le nombre de coups différents d'une couche : chacun de ses coups en prend un au hasard. */
const VARIANTES = 6;

/**
 * Une couche du tic : des coups réguliers, `battements` par seconde sur un tour du ressort, d'un
 * même timbre, un peu plus haut ou plus bas d'un coup à l'autre (`ecart`), et çà et là dans l'image
 * stéréo (`largeur`). `boite` retarde un coup sur deux, d'une part de l'intervalle. Elle cède la
 * main après chaque coup.
 */
function* couche(
  canaux: Float32Array[],
  fe: number,
  o: {
    alea: EtatAlea;
    battements: number;
    decalage: number;
    modes: readonly Mode[];
    ecart: number;
    largeur: number;
    boite?: number;
  },
): Generator<void> {
  const coups: Float32Array[] = [];
  for (let k = 0; k < VARIANTES; k++) {
    coups.push(coup(fe, o.modes, o.alea, 1 + o.ecart * blanc(o.alea)));
    yield;
  }
  for (let k = 0; k < Math.round(TOUR * o.battements); k++) {
    placer(canaux, fe, coups[Math.floor(tirer(o.alea) * VARIANTES)]!, {
      debut: o.decalage + (k + (k % 2) * (o.boite ?? 0)) / o.battements,
      gain: 0.8 + 0.2 * tirer(o.alea),
      position: o.largeur * blanc(o.alea),
      boucle: true,
    });
    yield;
  }
}

/** La somme de plusieurs coups, frappés ensemble. */
function ensemble(coups: readonly Float32Array[]): Float32Array {
  const x = new Float32Array(Math.max(...coups.map((c) => c.length)));
  for (const c of coups) for (let i = 0; i < c.length; i++) x[i] = x[i]! + c[i]!;
  return x;
}

/**
 * La fréquence de calcul des boucles, et du grand coup du seuil. Leurs aigus montent jusqu'à 9 kHz :
 * à 32 kHz, les images que le navigateur ajoute en les rééchantillonnant tombent au-delà de 20 kHz,
 * où l'on n'entend rien. À 24 kHz, elles sifflaient vers 15 kHz.
 */
const FE_BOUCLE = 32000;

export const SONS_ATELIER: Readonly<Record<SonAtelier, SourceSon>> = {
  // Le ressort : un tic, un tac, une fois par seconde, graves, au milieu.
  ressort: {
    duree: DUREES_SONS.ressort,
    frequence: FE_BOUCLE,
    *calculer(canaux, fe) {
      const alea = creerAlea(301);
      const tic = coup(fe, TIMBRES.tic, alea);
      const tac = coup(fe, TIMBRES.tac, alea);
      yield;
      for (let k = 0; k < TOUR; k++) {
        placer(canaux, fe, k % 2 === 0 ? tic : tac, { debut: k, gain: 1, boucle: true });
        yield;
      }
      yield* normaliserParEtapes(canaux, 0.7);
    },
  },
  // Les rouages : deux coups par seconde, plus clairs, entre ceux du ressort.
  rouages: {
    duree: DUREES_SONS.rouages,
    stereo: true,
    frequence: FE_BOUCLE,
    *calculer(canaux, fe) {
      yield* couche(canaux, fe, {
        alea: creerAlea(302),
        battements: BATTEMENTS.rouages,
        decalage: 0.25,
        modes: TIMBRES.rouage,
        ecart: 0.04,
        largeur: 0.35,
      });
      yield* normaliserParEtapes(canaux, 0.6);
    },
  },
  // Les engrenages : quatre coups par seconde, fins, un peu boiteux, de part et d'autre.
  engrenages: {
    duree: DUREES_SONS.engrenages,
    stereo: true,
    frequence: FE_BOUCLE,
    *calculer(canaux, fe) {
      yield* couche(canaux, fe, {
        alea: creerAlea(303),
        battements: BATTEMENTS.engrenages,
        decalage: 0.125,
        modes: TIMBRES.engrenage,
        ecart: 0.06,
        largeur: 0.6,
        boite: 0.16,
      });
      yield* normaliserParEtapes(canaux, 0.5);
    },
  },
  // Le mécanisme : trois rythmes qui se croisent, à trois, cinq et six coups par seconde, partout.
  mecanisme: {
    duree: DUREES_SONS.mecanisme,
    stereo: true,
    frequence: FE_BOUCLE,
    *calculer(canaux, fe) {
      const alea = creerAlea(304);
      for (const [battements, decalage, hauteur] of [
        [3, 0.2, 0.8],
        [5, 0.05, 1],
        [6, 0.03, 1.25],
      ] as const) {
        yield* couche(canaux, fe, {
          alea,
          battements,
          decalage,
          modes: TIMBRES.mecanisme.map(([f, g, d]): Mode => [f * hauteur, g, d]),
          ecart: 0.08,
          largeur: 0.8,
        });
      }
      yield* normaliserParEtapes(canaux, 0.5);
    },
  },
  // Après le seuil : un seul coup par seconde, tous les timbres ensemble, qui sonne plus longtemps.
  unisson: {
    duree: DUREES_SONS.unisson,
    frequence: FE_BOUCLE,
    *calculer(canaux, fe) {
      const alea = creerAlea(305);
      const autres = [
        [TIMBRES.rouage, 0.5],
        [TIMBRES.engrenage, 0.35],
        [TIMBRES.mecanisme, 0.3],
      ] as const;
      const [tic, tac] = [TIMBRES.tic, TIMBRES.tac].map((ressort) =>
        ensemble([
          coup(fe, ressort, alea, 1, 1.6),
          ...autres.map(([modes, gain]) => coup(fe, modes, alea, 1, 1.6).map((x) => gain * x)),
        ]),
      );
      yield;
      for (let k = 0; k < TOUR; k++) {
        placer(canaux, fe, k % 2 === 0 ? tic! : tac!, { debut: k, gain: 1, boucle: true });
        yield;
      }
      yield* normaliserParEtapes(canaux, 0.75);
    },
  },
  // Le crissement : une dent qui accroche puis glisse, par à-coups, quelque part dans le plan. Il
  // commence et finit sur un silence : la boucle se referme sans fondu.
  crissement: {
    duree: DUREES_SONS.crissement,
    stereo: true,
    frequence: FE_BOUCLE,
    *calculer(canaux, fe) {
      const alea = creerAlea(306);
      for (let t = 0.3; t < DUREES_SONS.crissement - 1.2; t += 1.3 + 1.3 * tirer(alea)) {
        crisser(canaux, fe, alea, t, 0.18 + 0.22 * tirer(alea));
        yield;
      }
      yield* normaliserParEtapes(canaux, 0.6);
    },
  },
  // Au seuil : tous les tics tombent ensemble, une fois, et le coup sonne longtemps.
  ensemble: {
    duree: DUREES_SONS.ensemble,
    stereo: true,
    frequence: FE_BOUCLE,
    *calculer(canaux, fe) {
      const alea = creerAlea(307);
      for (const [modes, gain, position] of [
        [TIMBRES.tic, 1, -0.1],
        [TIMBRES.tac, 1, 0.1],
        [TIMBRES.rouage, 0.6, -0.4],
        [TIMBRES.engrenage, 0.45, 0.5],
        [TIMBRES.mecanisme, 0.4, -0.6],
        [TIMBRES.mecanisme, 0.4, 0.7],
      ] as const) {
        placer(canaux, fe, coup(fe, modes, alea, 1, 6), { debut: 0.01, gain, position });
        yield;
      }
      finir(canaux, fe, 0.75);
    },
  },
  // Poser : un clic de métal, la pièce qui prend sa case.
  pose: {
    duree: DUREES_SONS.pose,
    calculer(canaux, fe) {
      placer(canaux, fe, coup(fe, TIMBRES.pose, creerAlea(308)), { debut: 0.003, gain: 1 });
      finir(canaux, fe, 0.7);
    },
  },
  // Tourner : un cran, le cliquet qui tombe d'une dent, en deux temps.
  cran: {
    duree: DUREES_SONS.cran,
    calculer(canaux, fe) {
      const alea = creerAlea(309);
      placer(canaux, fe, coup(fe, TIMBRES.cran, alea), { debut: 0.003, gain: 0.6 });
      placer(canaux, fe, coup(fe, TIMBRES.cran, alea, 0.93), { debut: 0.033, gain: 1 });
      finir(canaux, fe, 0.5);
    },
  },
  // Limer : trois coups de lime, qui poussent et râpent.
  lime: {
    duree: DUREES_SONS.lime,
    calculer(canaux, fe) {
      const alea = creerAlea(310);
      for (const debut of [0.01, 0.33, 0.65]) rapper(canaux[0]!, fe, alea, debut, 0.24);
      finir(canaux, fe, 0.55);
    },
  },
  // Agrandir : le papier du plan qu'on déplie d'une couronne, puis qui retombe à plat.
  deplier: {
    duree: DUREES_SONS.deplier,
    calculer(canaux, fe) {
      const alea = creerAlea(311);
      const canal = canaux[0]!;
      const souffle = passeBas(700, fe);
      const chute = passeBas(320, fe);
      for (let i = 0; i < canal.length; i++) {
        const t = i / fe;
        // Le papier qui glisse, en houle, puis le plan qui retombe, sourd.
        const houle = Math.sin(Math.PI * Math.min(1, t / 0.7)) ** 2;
        const plat = t > 0.72 ? Math.exp(-(t - 0.72) / 0.04) : 0;
        canal[i] = 0.5 * houle * souffle(blanc(alea)) + 1.4 * plat * chute(blanc(alea));
      }
      // Les froissements : des éclats brefs, serrés pendant qu'il se déplie.
      for (let t = 0.02; t < 0.68; t += 0.004 + 0.02 * tirer(alea)) froisser(canal, fe, alea, t);
      finir(canaux, fe, 0.55);
    },
  },
};

/** Un crissement : un son tendu qui monte ou descend un peu, haché par la dent qui accroche et glisse. */
function crisser(
  canaux: Float32Array[],
  fe: number,
  alea: EtatAlea,
  debut: number,
  duree: number,
): void {
  const [g, d] = panoramique(0.5 * blanc(alea));
  const base = 1700 + 600 * tirer(alea);
  const pente = 0.15 * blanc(alea);
  const accroche = 35 + 25 * tirer(alea);
  const timbre = resonateur(base * 1.5, 6, fe);
  let phase = 0;
  for (let i = 0; i < duree * fe; i++) {
    const t = i / fe;
    const u = t / duree;
    phase += (2 * Math.PI * base * (1 + pente * u + 0.02 * Math.sin(2 * Math.PI * 7 * t))) / fe;
    const enveloppe = Math.min(1, t / 0.02) * (1 - u) ** 0.6;
    const hache = 0.45 + 0.55 * Math.max(0, Math.sin(2 * Math.PI * accroche * t)) ** 3;
    const x = Math.sin(phase) + 0.35 * Math.sin(2 * phase) + 0.15 * Math.sin(3 * phase);
    const bruit = timbre(0.3 * blanc(alea));
    ajouter(canaux, Math.round(debut * fe) + i, enveloppe * hache * (0.6 * x + bruit), g, d);
  }
}

/** Un coup de lime : un bruit qui râpe dans les aigus, scandé par les tailles, poussé puis relâché. */
function rapper(canal: Float32Array, fe: number, alea: EtatAlea, debut: number, duree: number) {
  const aigu = resonateur(4200, 1.2, fe);
  const sifflant = resonateur(7000, 2, fe);
  const tailles = 160 + 50 * tirer(alea);
  let phase = 0;
  for (let i = 0; i < duree * fe; i++) {
    const u = i / fe / duree;
    // La lime accélère puis ralentit : les tailles défilent plus vite au milieu du coup.
    phase += (2 * Math.PI * tailles * (0.6 + 0.8 * Math.sin(Math.PI * u))) / fe;
    const taille = 0.35 + 0.65 * Math.max(0, Math.sin(phase)) ** 6;
    const b = blanc(alea);
    const x = Math.sin(Math.PI * u) ** 0.7 * taille * (aigu(b) + 0.4 * sifflant(b));
    ajouter([canal], Math.round(debut * fe) + i, x);
  }
}

/** Un froissement du papier : un éclat bref, dans une résonance tirée au hasard. */
function froisser(canal: Float32Array, fe: number, alea: EtatAlea, debut: number): void {
  const eclat = resonateur(2000 + 4000 * tirer(alea), 3, fe);
  const gain = 0.4 + 0.6 * tirer(alea);
  const duree = 0.002 + 0.004 * tirer(alea);
  for (let i = 0; i < 3 * duree * fe; i++) {
    const x = gain * eclat(blanc(alea) * Math.exp(-i / fe / duree));
    ajouter([canal], Math.round(debut * fe) + i, x);
  }
}

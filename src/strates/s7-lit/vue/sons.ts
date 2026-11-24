// Les sons du lit (#114 ; fiche, § 6) : presque rien, de l'eau et de la terre, pas de musique.
// - Le fleuve, au loin, à gauche : un murmure d'eau très bas, en boucle, qui enfle un peu à chaque
//   crue. Quand le bassin est plein, le fleuve passe ailleurs, et son murmure s'efface jusqu'au
//   silence.
// - L'eau de chaque crue : elle monte en dix secondes, venue du fleuve, et s'étend sur le bassin ;
//   elle se tait pendant qu'elle se repose ; elle se retire en dix secondes. Trois montées et trois
//   retraits, joués à tour de rôle, un peu plus vite ou plus lentement : jamais tout à fait la même.
// - Un creux qui se remplit : l'eau s'y engouffre, plus sourde, à droite.
// - La grande crue : la même eau, plus grave et plus longue.
// - La levée qu'on bâtit : de la terre tassée, et des pierres.
// Ils sont calculés, sans fichier, et n'ont rien de commun avec ceux des autres couches (§ 12).
import { creerAlea, tirer, type EtatAlea } from "../../../noyau/logique/alea";
import type { SourceSon } from "../../../noyau/logique/types";
import {
  ajouter,
  blanc,
  brun,
  finir,
  normaliserParEtapes,
  panoramique,
  passeBas,
  passeHaut,
  resonateur,
} from "../../../noyau/plateforme/synthese";
import { GRANDE_CRUE } from "../logique/regles";

/** Combien de montées et de retraits différents : chaque crue prend les siens, à tour de rôle. */
export const VARIANTES = 3;

/** Les sons du lit : le fleuve, en boucle, puis ce qui se joue une fois. */
export type SonLit =
  "fleuve" | `montee-${1 | 2 | 3}` | `retrait-${1 | 2 | 3}` | "engouffre" | "levee";

/** Les durées des sons, en secondes : l'eau monte et se retire en dix secondes, et s'éteint après. */
export const DUREES_SONS: Readonly<Record<SonLit, number>> = {
  fleuve: 24,
  "montee-1": 10.5,
  "montee-2": 10.5,
  "montee-3": 10.5,
  "retrait-1": 10.5,
  "retrait-2": 10.5,
  "retrait-3": 10.5,
  engouffre: 5,
  levee: 0.85,
};

/** D'où viennent les sons, de −1 (à gauche) à 1 (à droite) : le fleuve, le bassin, la rive et ses creux. */
export const PLACES = { fleuve: -0.8, bassin: -0.1, creux: 0.6 } as const;

/**
 * Le murmure du fleuve (fiche, § 6) : presque rien entre deux crues, un peu plus pendant la crue, et
 * plus rien quand le bassin est plein : le fleuve passe ailleurs. Il s'en va lentement, jusqu'au
 * silence, pendant la crue qui précède la descente.
 */
export function volumeFleuve(enCrue: boolean, plein: boolean): { volume: number; fondu: number } {
  if (plein) return { volume: 0, fondu: 25 };
  return { volume: enCrue ? 0.32 : 0.2, fondu: 8 };
}

/**
 * Comment sonne l'eau de la crue `crue` : sa variante, à tour de rôle ; sa vitesse, un peu différente
 * à chaque crue ; la grande crue, plus grave et plus longue, et plus forte.
 */
export function eauDeLaCrue(crue: number): { variante: number; vitesse: number; volume: number } {
  const variante = (((crue - 1) % VARIANTES) + VARIANTES) % VARIANTES;
  const ecart = 0.05 * Math.sin(2.4 * crue);
  if (crue === GRANDE_CRUE)
    return { variante: variante + 1, vitesse: 0.7 + ecart / 2, volume: 0.85 };
  return { variante: variante + 1, vitesse: 1 + ecart, volume: 0.55 };
}

// ——— La boîte à outils de l'eau

/**
 * Une bulle qui crève, ou une goutte : un son presque pur qui monte un peu en s'éteignant, comme
 * l'eau qu'on entend clapoter.
 */
function bulle(
  canaux: Float32Array[],
  fe: number,
  o: {
    debut: number;
    frequence: number;
    decroissance: number;
    gain: number;
    position: number;
    montee?: number;
  },
): void {
  const [g, d] = panoramique(o.position);
  const duree = 5 * o.decroissance;
  const n = Math.round(duree * fe);
  const depart = Math.round(o.debut * fe);
  const montee = o.montee ?? 0.35;
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / fe;
    phase += (2 * Math.PI * o.frequence * (1 + (montee * t) / duree)) / fe;
    const x = o.gain * Math.sin(phase) * Math.exp(-t / o.decroissance) * Math.min(1, t / 0.002);
    ajouter(canaux, depart + i, x, g, d);
  }
}

/** Une houle lente du volume, autour de 1 : trois vagues de périodes différentes, de phases tirées. */
function houleLente(alea: EtatAlea): (t: number) => number {
  const phases = [0, 1, 2].map(() => 2 * Math.PI * tirer(alea));
  return (t) =>
    1 +
    0.16 * Math.sin(2 * Math.PI * 0.13 * t + phases[0]!) +
    0.1 * Math.sin(2 * Math.PI * 0.31 * t + phases[1]!) +
    0.06 * Math.sin(2 * Math.PI * 0.57 * t + phases[2]!);
}

/**
 * Finit un long son joué une fois, en cédant la main : sa crête ramenée à `crete`, puis un fondu de
 * 2 ms au début et de 30 ms à la fin, pour qu'il commence et finisse sur le silence.
 */
function* finirParEtapes(canaux: Float32Array[], fe: number, crete: number): Generator<void> {
  yield* normaliserParEtapes(canaux, crete);
  const debut = Math.round(0.002 * fe);
  const fin = Math.round(0.03 * fe);
  for (const canal of canaux) {
    const n = canal.length;
    for (let i = 0; i < debut; i++) canal[i] = canal[i]! * (i / debut);
    for (let i = 0; i < fin; i++) canal[n - 1 - i] = canal[n - 1 - i]! * (i / fin);
  }
}

interface Ecoulement {
  /** Le volume de l'eau, de 0 à 1, à l'instant t. */
  volume: (t: number) => number;
  /** Où s'arrêtent ses aigus, en hertz, à l'instant t : plus haut, l'eau est plus proche et plus vive. */
  coupure: (t: number) => number;
  /** D'où elle vient, de −1 à 1, à l'instant t. */
  position: (t: number) => number;
  /** La part du grondement grave, sous le ruissellement. */
  grave: number;
}

/**
 * De l'eau qui coule : un bruit dont les aigus s'ouvrent ou se ferment, et dont le volume houle
 * lentement, comme une nappe d'eau qui avance ou se retire. Ce qui glisse lentement (la coupure, la
 * place, le volume) se refait tous les 64 échantillons. Il cède la main tous les quarts de seconde.
 */
function* ecoulement(
  canaux: Float32Array[],
  fe: number,
  alea: EtatAlea,
  o: Ecoulement,
): Generator<void> {
  const n = canaux[0]!.length;
  const grondement = brun(alea);
  const sansGrave = passeHaut(70, fe);
  const houle = houleLente(alea);
  const pas = Math.round(fe / 4);
  let y1 = 0;
  let y2 = 0;
  let a = 0;
  let volume = 0;
  let g = 0;
  let d = 0;
  for (let i = 0; i < n; i++) {
    if (i % 64 === 0) {
      const t = i / fe;
      a = 1 - Math.exp((-2 * Math.PI * o.coupure(t)) / fe);
      volume = o.volume(t) * houle(t);
      [g, d] = panoramique(o.position(t));
    }
    const x = blanc(alea);
    y1 += a * (x - y1);
    y2 += a * (y1 - y2);
    ajouter(canaux, i, volume * (sansGrave(y2) * 2.2 + o.grave * grondement()), g, d);
    if (i % pas === pas - 1) yield;
  }
}

/** Monte de 0 à 1 entre `de` et `a`, en douceur. */
const lisse = (t: number, de: number, a: number): number => {
  const u = Math.min(1, Math.max(0, (t - de) / (a - de)));
  return u * u * (3 - 2 * u);
};

/**
 * L'eau qui monte (fiche, § 6) : venue du fleuve, à gauche, elle s'étend sur le bassin en dix
 * secondes, de plus en plus proche, et clapote de plus en plus. Elle se tait au repos.
 */
function montee(graine: number): SourceSon {
  return {
    duree: DUREES_SONS["montee-1"],
    stereo: true,
    frequence: 22050,
    *calculer(canaux, fe) {
      const alea = creerAlea(graine);
      yield* ecoulement(canaux, fe, alea, {
        volume: (t) => lisse(t, 0, 3) * (0.55 + 0.45 * lisse(t, 2, 8)) * (1 - lisse(t, 9, 10.5)),
        coupure: (t) => 260 + 1300 * lisse(t, 0, 8.5),
        position: (t) => PLACES.fleuve + 0.75 * lisse(t, 0, 9),
        grave: 0.35,
      });
      // Le clapotis : des bulles, de plus en plus serrées à mesure que l'eau s'étend.
      for (let t = 0.6, k = 0; t < 9.6; k++) {
        if (k % 16 === 15) yield;
        const densite = 2 + 10 * lisse(t, 1, 8);
        t += -Math.log(1 - tirer(alea)) / densite;
        bulle(canaux, fe, {
          debut: t,
          frequence: 380 + 1100 * tirer(alea) ** 1.5,
          decroissance: 0.006 + 0.014 * tirer(alea),
          gain: (0.04 + 0.1 * tirer(alea)) * (0.4 + 0.6 * lisse(t, 0, 6)) * (1 - lisse(t, 9, 10)),
          position: PLACES.fleuve + 0.75 * lisse(t, 0, 9) + 0.3 * blanc(alea),
        });
      }
      yield* finirParEtapes(canaux, fe, 0.7);
    },
  };
}

/**
 * L'eau qui se retire : elle s'écoule vers le fleuve, ses aigus se ferment, et il reste des gouttes
 * qui tombent, de plus en plus rares.
 */
function retrait(graine: number): SourceSon {
  return {
    duree: DUREES_SONS["retrait-1"],
    stereo: true,
    frequence: 22050,
    *calculer(canaux, fe) {
      const alea = creerAlea(graine);
      yield* ecoulement(canaux, fe, alea, {
        volume: (t) => lisse(t, 0, 1.2) * (1 - 0.6 * lisse(t, 1, 7)) * (1 - lisse(t, 7.5, 10.5)),
        coupure: (t) => 1300 - 1050 * lisse(t, 0, 9),
        position: (t) => PLACES.fleuve + 0.75 * (1 - lisse(t, 0, 9)),
        grave: 0.25,
      });
      // Les gouttes, aiguës et de plus en plus rares, et quelques glouglous dans les creux du limon.
      for (let t = 0.3, k = 0; t < 10; k++) {
        if (k % 16 === 15) yield;
        t += -Math.log(1 - tirer(alea)) / (7 * (1 - lisse(t, 0, 10)) + 0.6);
        const goutte = tirer(alea) < 0.7;
        bulle(canaux, fe, {
          debut: t,
          frequence: goutte ? 1500 + 2200 * tirer(alea) : 240 + 260 * tirer(alea),
          decroissance: goutte ? 0.004 + 0.006 * tirer(alea) : 0.02 + 0.02 * tirer(alea),
          gain: (goutte ? 0.05 : 0.09) * (0.3 + 0.7 * tirer(alea)) * (1 - 0.5 * lisse(t, 0, 10)),
          position: 0.7 * blanc(alea),
          montee: goutte ? 0.2 : 0.6,
        });
      }
      yield* finirParEtapes(canaux, fe, 0.6);
    },
  };
}

/**
 * Les sons du lit, que la vue joue par `son` (fiche, § 6). Ils se calculent quand on les demande,
 * par étapes, sans figer l'image ; les montées et les retraits à 22 kHz, le fleuve et l'eau qui
 * s'engouffre à 16 kHz : ils n'ont pas d'aigus.
 */
export const SONS_LIT: Readonly<Record<SonLit, SourceSon>> = {
  // Le fleuve au loin : un grondement d'eau, et des bulles éparses, à gauche.
  fleuve: {
    duree: DUREES_SONS.fleuve,
    stereo: true,
    frequence: 16000,
    raccord: 3,
    *calculer(canaux, fe) {
      const alea = creerAlea(107);
      yield* ecoulement(canaux, fe, alea, {
        volume: () => 1,
        coupure: (t) => 520 + 90 * Math.sin((2 * Math.PI * t) / 8),
        position: (t) => PLACES.fleuve + 0.12 * Math.sin((2 * Math.PI * t) / 12),
        grave: 0.6,
      });
      for (let t = 0.2, k = 0; t < DUREES_SONS.fleuve - 0.5; k++) {
        if (k % 16 === 15) yield;
        t += -Math.log(1 - tirer(alea)) / 3.5;
        bulle(canaux, fe, {
          debut: t,
          frequence: 220 + 420 * tirer(alea),
          decroissance: 0.012 + 0.025 * tirer(alea),
          gain: 0.03 + 0.05 * tirer(alea),
          position: PLACES.fleuve + 0.3 * blanc(alea),
          montee: 0.5,
        });
      }
      yield* normaliserParEtapes(canaux, 0.7);
    },
  },
  "montee-1": montee(111),
  "montee-2": montee(113),
  "montee-3": montee(127),
  "retrait-1": retrait(131),
  "retrait-2": retrait(137),
  "retrait-3": retrait(139),
  // L'eau qui s'engouffre dans un creux : plus sourde, un grondement qui roule et des glouglous graves.
  engouffre: {
    duree: DUREES_SONS.engouffre,
    // Sourde, elle n'a pas d'aigus : elle se calcule à 16 kHz.
    frequence: 16000,
    *calculer(canaux, fe) {
      const alea = creerAlea(149);
      const canal = canaux[0]!;
      const sourd = passeBas(320, fe);
      const sourd2 = passeBas(320, fe);
      const grondement = brun(alea);
      for (let i = 0; i < canal.length; i++) {
        const t = i / fe;
        const enveloppe = lisse(t, 0, 0.9) * (1 - lisse(t, 1.5, DUREES_SONS.engouffre));
        canal[i] = enveloppe * (1.6 * sourd2(sourd(blanc(alea))) + 0.5 * grondement());
        if (i % fe === fe - 1) yield;
      }
      for (let t = 0.3; t < 3.8;) {
        t += 0.12 + 0.35 * tirer(alea);
        bulle(canaux, fe, {
          debut: t,
          frequence: 110 + 170 * tirer(alea),
          decroissance: 0.03 + 0.04 * tirer(alea),
          gain: (0.12 + 0.12 * tirer(alea)) * (1 - lisse(t, 1.5, 4)),
          position: 0,
          montee: 0.8,
        });
      }
      yield* finirParEtapes(canaux, fe, 0.65);
    },
  },
  // La levée : une pelletée de terre tassée, un second coup plus léger, et des pierres qui roulent.
  levee: {
    duree: DUREES_SONS.levee,
    calculer(canaux, fe) {
      const alea = creerAlea(151);
      const canal = canaux[0]!;
      for (const [debut, force] of [
        [0.004, 1],
        [0.36, 0.55],
      ] as const) {
        // La terre étouffe tout : un double passe-bas, et le corps du coup, grave.
        const terre = passeBas(260, fe);
        const terre2 = passeBas(260, fe);
        const corps = resonateur(85, 3, fe);
        for (let i = 0; i < Math.round(0.4 * fe); i++) {
          const t = i / fe;
          const x = blanc(alea) * Math.min(1, t / 0.004) * Math.exp(-t / 0.09);
          const n = Math.round(debut * fe) + i;
          if (n < canal.length) {
            canal[n] = canal[n]! + force * (4 * terre2(terre(x)) + 1.6 * corps(x));
          }
        }
      }
      // Des pierres qui s'entrechoquent après le coup : des tocs brefs, de plus en plus faibles.
      for (let k = 0; k < 7; k++) {
        const debut = 0.1 + 0.6 * tirer(alea) ** 1.4;
        bulle(canaux, fe, {
          debut,
          frequence: 1600 + 1700 * tirer(alea),
          decroissance: 0.003 + 0.004 * tirer(alea),
          gain: (0.25 + 0.25 * tirer(alea)) * (1 - debut),
          position: 0,
          montee: 0.05,
        });
      }
      finir(canaux, fe, 0.7);
    },
  },
};

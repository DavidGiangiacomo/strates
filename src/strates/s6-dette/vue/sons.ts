// Les sons de la dette (#103 ; fiche, § 6) : presque rien. La fosse à archives se tait ; seuls
// sonnent les gestes, les crues et les tablettes. Pas de musique.
// - Promettre : le stylet dans l'argile, trois coins pressés, puis le sceau, quand le terme se fixe.
// - Une promesse refusée : le stylet bute, un toc sec, sans sceau.
// - Solder : le stylet seul, qui écrit l'échéance honorée avant son terme.
// - À chaque crue, l'eau, doucement, au bord droit, où se tient le compte des crues : la même eau,
//   qu'il y ait des échéances ou non. Honoré ou reporté, c'est le livre qui le dit.
// - Une tablette brisée : un craquement sec, à gauche, où s'empilent les morceaux.
// - Pendant les douze crues de la grande crue, l'eau monte. Soldée, elle se retire, puis la dernière
//   tablette se brise. En défaut, tout se tait d'un coup : « Échu. », le silence.
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
import type { IssueDette } from "../logique";
import { GRANDE_CRUE_DANS } from "../logique/regles";

/** Les sons de la dette : l'eau de la grande crue, en boucle, puis ce qui se joue une fois. */
export type SonDette = "stylet" | "sceau" | "bute" | "flot" | "grande-eau" | "reflux" | "brisure";

/** Les durées des sons, en secondes. */
export const DUREES_SONS: Readonly<Record<SonDette, number>> = {
  stylet: 0.42,
  sceau: 0.45,
  bute: 0.16,
  flot: 3.6,
  "grande-eau": 16,
  reflux: 4.5,
  brisure: 0.8,
};

/**
 * D'où viennent les sons, de −1 (à gauche) à 1 (à droite) : la tablette et ses morceaux à gauche,
 * l'échéancier au milieu, le compte des crues et son eau au bord droit.
 */
export const PLACES = { tablette: -0.35, echeancier: 0, compte: 0.6 } as const;

/** Le sceau suit le stylet, en secondes : le terme se fixe quand la promesse est écrite. */
export const SCEAU_APRES = 0.3;

/** Soldée, l'eau de la grande crue se retire en quatre secondes, puis la dernière tablette se brise. */
export const RETRAIT = 4;

/** L'eau de la crue `crue` : douce, toujours la même, mais jamais tout à fait au même pas. */
export function flotDeLaCrue(crue: number): {
  volume: number;
  vitesse: number;
  panoramique: number;
} {
  return { volume: 0.3, vitesse: 1 + 0.05 * Math.sin(2.3 * crue), panoramique: PLACES.compte };
}

/**
 * L'eau qui monte pendant les douze crues de la grande crue : de presque rien à un peu plus de la
 * moitié, crue après crue, chaque pas fondu sur huit secondes. Soldée, elle se retire en quatre
 * secondes ; en défaut, elle se tait d'un coup. Sans grande crue fixée, rien.
 */
export function grandeEau(
  crues: number,
  grandeCrue: number | null,
  issue: IssueDette | null,
): { volume: number; fondu: number } {
  if (issue === "defaut") return { volume: 0, fondu: 0.05 };
  if (issue === "soldee") return { volume: 0, fondu: RETRAIT };
  if (grandeCrue === null) return { volume: 0, fondu: 1 };
  const passees = crues - (grandeCrue - GRANDE_CRUE_DANS);
  const avance = Math.min(1, Math.max(0, passees / GRANDE_CRUE_DANS));
  return { volume: 0.12 + 0.43 * avance, fondu: 8 };
}

// ——— La boîte à outils de l'argile et de l'eau

/** Monte de 0 à 1 entre `de` et `a`, en douceur. */
const lisse = (t: number, de: number, a: number): number => {
  const u = Math.min(1, Math.max(0, (t - de) / (a - de)));
  return u * u * (3 - 2 * u);
};

/**
 * Une goutte qui tombe dans l'eau : un son presque pur, bref, qui monte en s'éteignant ; ou un éclat
 * d'argile qui tombe sur la terre, s'il ne monte pas.
 */
function goutte(
  canaux: Float32Array[],
  fe: number,
  o: {
    debut: number;
    frequence: number;
    duree: number;
    gain: number;
    position: number;
    pente: number;
  },
): void {
  const [g, d] = panoramique(o.position);
  const n = Math.round(5 * o.duree * fe);
  const depart = Math.round(o.debut * fe);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / fe;
    phase += (2 * Math.PI * o.frequence * (1 + o.pente * (t / (5 * o.duree)))) / fe;
    const x = o.gain * Math.sin(phase) * Math.exp(-t / o.duree) * Math.min(1, t / 0.001);
    ajouter(canaux, depart + i, x, g, d);
  }
}

/**
 * Une nappe d'eau : un bruit dont les aigus s'ouvrent ou se ferment avec `coupure`, sous un
 * grondement grave, à un volume et une place qui changent lentement. Ce qui glisse se refait tous les
 * 64 échantillons ; elle cède la main tous les quarts de seconde.
 */
function* nappe(
  canaux: Float32Array[],
  fe: number,
  alea: EtatAlea,
  o: {
    volume: (t: number) => number;
    coupure: (t: number) => number;
    position: (t: number) => number;
    grave: number;
  },
): Generator<void> {
  const n = canaux[0]!.length;
  const grondement = brun(alea);
  const sansSouffle = passeHaut(55, fe);
  const pas = Math.round(fe / 4);
  let y1 = 0;
  let y2 = 0;
  let y3 = 0;
  let a = 0;
  let volume = 0;
  let g = 1;
  let d = 1;
  for (let i = 0; i < n; i++) {
    if (i % 64 === 0) {
      const t = i / fe;
      a = 1 - Math.exp((-2 * Math.PI * o.coupure(t)) / fe);
      volume = o.volume(t);
      if (canaux.length > 1) [g, d] = panoramique(o.position(t));
    }
    // Trois passe-bas : une eau ronde, sans le grésillement d'un bruit.
    y1 += a * (blanc(alea) - y1);
    y2 += a * (y1 - y2);
    y3 += a * (y2 - y3);
    ajouter(canaux, i, volume * (3 * sansSouffle(y3) + o.grave * grondement()), g, d);
    if (i % pas === pas - 1) yield;
  }
}

/**
 * Finit un long son joué une fois, en cédant la main : sa crête ramenée à `crete`, puis un fondu de
 * 2 ms au début et de 40 ms à la fin.
 */
function* finirParEtapes(canaux: Float32Array[], fe: number, crete: number): Generator<void> {
  yield* normaliserParEtapes(canaux, crete);
  const debut = Math.round(0.002 * fe);
  const fin = Math.round(0.04 * fe);
  for (const canal of canaux) {
    const n = canal.length;
    for (let i = 0; i < debut; i++) canal[i] = canal[i]! * (i / debut);
    for (let i = 0; i < fin; i++) canal[n - 1 - i] = canal[n - 1 - i]! * (i / fin);
  }
}

/**
 * Les sons de la dette, que la vue joue par `son` (fiche, § 6). Les gestes et les tablettes se
 * calculent à 22 kHz ; l'eau, qui n'a pas d'aigus, à 16 kHz, par étapes, sans figer l'image.
 */
export const SONS_DETTE: Readonly<Record<SonDette, SourceSon>> = {
  // Le stylet : trois coins pressés dans l'argile humide, de plus en plus légers. Un frottement mat,
  // et le corps sourd de l'argile qui cède.
  stylet: {
    duree: DUREES_SONS.stylet,
    frequence: 22050,
    calculer(canaux, fe) {
      const alea = creerAlea(601);
      const canal = canaux[0]!;
      for (const [debut, force] of [
        [0.004, 1],
        [0.125, 0.8],
        [0.255, 0.62],
      ] as const) {
        const frottement = resonateur(2300 + 900 * tirer(alea), 1.3, fe);
        const mat = passeBas(3600, fe);
        const corps = resonateur(185, 2.2, fe);
        for (let i = 0; i < Math.round(0.12 * fe); i++) {
          const t = i / fe;
          const x = blanc(alea) * Math.min(1, t / 0.005) * Math.exp(-t / 0.028);
          const k = Math.round(debut * fe) + i;
          if (k < canal.length) {
            canal[k] =
              canal[k]! + force * (1.3 * mat(frottement(x)) + corps(x * Math.exp(-t / 0.01)));
          }
        }
      }
      finir(canaux, fe, 0.7);
    },
  },
  // Le sceau : pressé, pas frappé. Une poussée ronde et sourde dans l'argile, qui cède et se tait ;
  // puis l'argile qui colle un peu au sceau quand il se relève.
  sceau: {
    duree: DUREES_SONS.sceau,
    frequence: 22050,
    calculer(canaux, fe) {
      const alea = creerAlea(607);
      const canal = canaux[0]!;
      const sourd = passeBas(650, fe);
      const sourd2 = passeBas(650, fe);
      const corps = resonateur(112, 3.2, fe);
      const corps2 = resonateur(231, 4.5, fe);
      for (let i = 0; i < canal.length; i++) {
        const t = i / fe;
        const x = blanc(alea) * Math.min(1, t / 0.012) * Math.exp(-t / 0.055);
        canal[i] = 2.4 * sourd2(sourd(x)) + 1.5 * corps(x) + 0.5 * corps2(x);
      }
      const colle = passeBas(900, fe);
      for (let i = 0; i < Math.round(0.05 * fe); i++) {
        const t = i / fe;
        const k = Math.round(0.27 * fe) + i;
        const x = blanc(alea) * Math.sin((Math.PI * t) / 0.05) ** 2;
        if (k < canal.length) canal[k] = canal[k]! + 0.25 * colle(x);
      }
      finir(canaux, fe, 0.7);
    },
  },
  // Le stylet qui bute : un toc sec et bref, sans sceau. L'argile est dure, la promesse ne s'écrit pas.
  bute: {
    duree: DUREES_SONS.bute,
    frequence: 22050,
    calculer(canaux, fe) {
      const alea = creerAlea(613);
      const canal = canaux[0]!;
      const sec = resonateur(1450, 9, fe);
      const corps = resonateur(410, 6, fe);
      for (let i = 0; i < canal.length; i++) {
        const t = i / fe;
        const x = blanc(alea) * Math.min(1, t / 0.0008) * Math.exp(-t / 0.005);
        canal[i] = 2 * sec(x) + 1.2 * corps(x);
      }
      finir(canaux, fe, 0.65);
    },
  },
  // L'eau de la crue, doucement : une vague qui vient toucher le bord, s'ouvre à sa crête et repart,
  // et quelques gouttes quand elle se retire.
  flot: {
    duree: DUREES_SONS.flot,
    frequence: 16000,
    *calculer(canaux, fe) {
      const alea = creerAlea(617);
      yield* nappe(canaux, fe, alea, {
        volume: (t) => lisse(t, 0, 0.9) * (1 - lisse(t, 1.1, 3.4)),
        coupure: (t) => 260 + 880 * lisse(t, 0, 0.9) * (1 - lisse(t, 1, 2.8)),
        position: () => 0,
        grave: 0.3,
      });
      for (let t = 1.3; t < 3.1;) {
        t += 0.16 + 0.42 * tirer(alea);
        goutte(canaux, fe, {
          debut: t,
          frequence: 520 + 900 * tirer(alea),
          duree: 0.005 + 0.008 * tirer(alea),
          gain: (0.05 + 0.06 * tirer(alea)) * (1 - lisse(t, 1.3, 3.3)),
          position: 0,
          pente: 0.4,
        });
      }
      yield* finirParEtapes(canaux, fe, 0.6);
    },
  },
  // L'eau de la grande crue, qui monte : une nappe profonde, gonflée de houles lentes, au bord droit.
  // Elle boucle ; c'est son volume qui monte, crue après crue.
  "grande-eau": {
    duree: DUREES_SONS["grande-eau"],
    stereo: true,
    frequence: 16000,
    raccord: 3,
    *calculer(canaux, fe) {
      const alea = creerAlea(619);
      const phases = [0, 1, 2].map(() => 2 * Math.PI * tirer(alea));
      // Quatre, deux et seize secondes : les houles retombent juste à la fin de la boucle.
      const houle = (t: number) =>
        0.72 +
        0.18 * Math.sin((2 * Math.PI * t) / 4 + phases[0]!) +
        0.07 * Math.sin((2 * Math.PI * t) / 2 + phases[1]!) +
        0.03 * Math.sin((2 * Math.PI * t) / 16 + phases[2]!);
      yield* nappe(canaux, fe, alea, {
        volume: houle,
        coupure: (t) => 340 + 260 * (houle(t) - 0.72) * 3,
        position: (t) => PLACES.compte - 0.1 + 0.15 * Math.sin((2 * Math.PI * t) / 8),
        grave: 0.8,
      });
      yield* normaliserParEtapes(canaux, 0.7);
    },
  },
  // L'eau qui se retire, soldée : la nappe s'éloigne, ses aigus se ferment, il reste des glouglous.
  reflux: {
    duree: DUREES_SONS.reflux,
    stereo: true,
    frequence: 16000,
    *calculer(canaux, fe) {
      const alea = creerAlea(631);
      yield* nappe(canaux, fe, alea, {
        volume: (t) => lisse(t, 0, 0.3) * (1 - lisse(t, 0.4, RETRAIT)),
        coupure: (t) => 600 - 420 * lisse(t, 0, RETRAIT),
        position: (t) => PLACES.compte - 0.1 + 0.3 * lisse(t, 0, RETRAIT),
        grave: 0.6,
      });
      for (let t = 0.5; t < RETRAIT - 0.4;) {
        t += 0.2 + 0.5 * tirer(alea);
        goutte(canaux, fe, {
          debut: t,
          frequence: 170 + 230 * tirer(alea),
          duree: 0.02 + 0.03 * tirer(alea),
          gain: (0.08 + 0.08 * tirer(alea)) * (1 - lisse(t, 0, RETRAIT)),
          position: PLACES.compte,
          pente: 0.7,
        });
      }
      yield* finirParEtapes(canaux, fe, 0.6);
    },
  },
  // Une tablette brisée : un craquement sec, d'abord la fêlure, puis deux autres plus petites ; puis
  // des éclats qui tombent sur la terre. Rien ne résonne : l'argile est sèche.
  brisure: {
    duree: DUREES_SONS.brisure,
    frequence: 22050,
    calculer(canaux, fe) {
      const alea = creerAlea(641);
      const canal = canaux[0]!;
      for (const [debut, force, frequence] of [
        [0.003, 1, 950],
        [0.042, 0.6, 1350],
        [0.088, 0.45, 720],
      ] as const) {
        const corps = resonateur(frequence, 2.6, fe);
        const sec = passeHaut(450, fe);
        for (let i = 0; i < Math.round(0.07 * fe); i++) {
          const t = i / fe;
          const x = blanc(alea) * Math.min(1, t / 0.0005) * Math.exp(-t / 0.007);
          const k = Math.round(debut * fe) + i;
          if (k < canal.length) canal[k] = canal[k]! + force * (1.6 * sec(x) + 1.3 * corps(x));
        }
      }
      for (let k = 0; k < 7; k++) {
        const debut = 0.16 + 0.5 * tirer(alea) ** 1.3;
        goutte(canaux, fe, {
          debut,
          frequence: 1700 + 1900 * tirer(alea),
          duree: 0.0025 + 0.003 * tirer(alea),
          gain: (0.22 + 0.2 * tirer(alea)) * (1 - debut),
          position: 0,
          pente: 0,
        });
      }
      finir(canaux, fe, 0.7);
    },
  },
};

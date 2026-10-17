// Les sons du noyau (#46) : ceux du sol, communs à toutes les strates comme le bandeau. Ils sont
// calculés, sans fichier, et toujours les mêmes :
// - le sol résiste : un coup sourd (docs/strates/strate-1.md, § 4) ;
// - le coup de pioche : le coup sourd, la fissure qui craque, puis un éboulement bref
//   (docs/strates/descente-1-2.md, P2) ;
// - la descente : le grondement du sol qui défile (P5).
import { creerAlea, tirer, type EtatAlea } from "../logique/alea";
import type { SourceSon } from "../logique/types";

export type SonNoyau = "resiste" | "pioche" | "descente";

/** Les durées des sons, en secondes : le coup de pioche dure P2, la descente dure P5. */
export const DUREES_SONS: Readonly<Record<SonNoyau, number>> = {
  resiste: 0.45,
  pioche: 1.6,
  descente: 4,
};

export const SONS_NOYAU: Readonly<Record<SonNoyau, SourceSon>> = {
  resiste: {
    duree: DUREES_SONS.resiste,
    calculer(canaux, fe) {
      coupSourd(canaux, fe, { debut: 0, gain: 1, haut: 180, bas: 75, alea: creerAlea(11) });
      finir(canaux, fe, 0.7);
    },
  },
  pioche: {
    duree: DUREES_SONS.pioche,
    stereo: true,
    calculer(canaux, fe) {
      const alea = creerAlea(23);
      coupSourd(canaux, fe, { debut: 0, gain: 0.9, haut: 160, bas: 65, alea });
      // La fissure court du bouton au bas de l'écran en 0,4 s : quelques craquements secs.
      for (let k = 0; k < 5; k++) {
        grain(canaux, fe, alea, {
          debut: 0.02 + 0.08 * k + 0.03 * tirer(alea),
          frequence: 2200 + 2000 * tirer(alea),
          q: 3,
          decroissance: 0.0025,
          gain: 0.5 * (1 - k / 7),
        });
      }
      // Puis le tableau de bord se fend, et la terre s'éboule : des pierres, de plus en plus rares.
      for (let k = 0; k < 60; k++) {
        const u = tirer(alea);
        const t = 0.32 + 1.05 * u ** 1.7;
        grain(canaux, fe, alea, {
          debut: t,
          frequence: 220 * 10 ** (1.1 * tirer(alea)),
          q: 1.5 + 2.5 * tirer(alea),
          decroissance: 0.004 + 0.012 * tirer(alea),
          gain: (0.25 + 0.75 * tirer(alea)) * (1 - (t - 0.32) / 1.15) ** 1.5 * 1.5,
        });
      }
      grondement(canaux, fe, alea, {
        debut: 0.3,
        montee: 0.08,
        fin: DUREES_SONS.pioche,
        decroissance: 0.4,
        gain: 0.35,
      });
      finir(canaux, fe, 0.8);
    },
  },
  descente: {
    duree: DUREES_SONS.descente,
    stereo: true,
    calculer(canaux, fe) {
      const alea = creerAlea(37);
      grondement(canaux, fe, alea, {
        debut: 0,
        montee: 0.7,
        fin: DUREES_SONS.descente,
        tenue: 2.8,
        gain: 1,
      });
      // Quelques pierres se détachent sur le passage.
      for (let k = 0; k < 14; k++) {
        grain(canaux, fe, alea, {
          debut: 0.4 + 2.6 * tirer(alea),
          frequence: 180 * 10 ** (0.9 * tirer(alea)),
          q: 1.5 + 2 * tirer(alea),
          decroissance: 0.005 + 0.012 * tirer(alea),
          gain: 0.15 + 0.2 * tirer(alea),
        });
      }
      finir(canaux, fe, 0.7);
    },
  },
};

// ——— Les gestes du son

/** Un filtre passe-bas à un pôle. */
function passeBas(coupure: number, fe: number): (x: number) => number {
  const a = 1 - Math.exp((-2 * Math.PI * coupure) / fe);
  let y = 0;
  return (x) => (y += a * (x - y));
}

/** Un résonateur : un passe-bande à deux pôles, de gain 1 à sa fréquence. */
function resonateur(frequence: number, q: number, fe: number): (x: number) => number {
  const w = (2 * Math.PI * Math.min(frequence, fe * 0.45)) / fe;
  const alpha = Math.sin(w) / (2 * q);
  const a0 = 1 + alpha;
  const b0 = alpha / a0;
  const a1 = (-2 * Math.cos(w)) / a0;
  const a2 = (1 - alpha) / a0;
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  return (x) => {
    const y = b0 * x - b0 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
}

/** Un bruit blanc, de −1 à 1. */
const blanc = (alea: EtatAlea) => 2 * tirer(alea) - 1;

/** Un bruit brun : un bruit blanc intégré, qui fuit pour ne pas dériver. */
function brun(alea: EtatAlea): () => number {
  let b = 0;
  return () => {
    b = (b + 0.02 * blanc(alea)) / 1.02;
    return 3.5 * b;
  };
}

/** Ajoute `x` à l'échantillon `n` de chaque canal, s'il existe, dans la part `gauche` ou `droite`. */
function ajouter(canaux: Float32Array[], n: number, x: number, gauche = 1, droite = 1): void {
  const [g, d] = canaux;
  if (n < 0 || !g || n >= g.length) return;
  g[n] = g[n]! + x * gauche;
  if (d) d[n] = d[n]! + x * droite;
}

/**
 * Un coup sourd, comme un poing sur de la terre battue : une note grave qui tombe de `haut` à `bas`
 * hertz et s'éteint vite, un harmonique plus dur pour qu'on l'entende sur de petits haut-parleurs,
 * et un souffle de terre au contact.
 */
function coupSourd(
  canaux: Float32Array[],
  fe: number,
  o: { debut: number; gain: number; haut: number; bas: number; alea: EtatAlea },
): void {
  const n0 = Math.round(o.debut * fe);
  const terre = passeBas(1800, fe);
  let phase = 0;
  for (let i = 0; i < Math.round(0.45 * fe); i++) {
    const t = i / fe;
    phase += (2 * Math.PI * (o.bas + (o.haut - o.bas) * Math.exp(-t / 0.05))) / fe;
    const attaque = Math.min(1, t / 0.002);
    const corps = Math.sin(phase) * Math.exp(-t / 0.1);
    const dur =
      0.8 * Math.sin(2.3 * phase) * Math.exp(-t / 0.06) +
      0.35 * Math.sin(4.1 * phase) * Math.exp(-t / 0.025);
    const contact = 2 * terre(blanc(o.alea)) * Math.exp(-t / 0.015);
    ajouter(canaux, n0 + i, o.gain * attaque * Math.tanh(1.6 * (corps + dur + contact)));
  }
}

/** Une pierre, ou un craquement : un bruit bref passé dans un résonateur, placé dans l'espace. */
function grain(
  canaux: Float32Array[],
  fe: number,
  alea: EtatAlea,
  o: { debut: number; frequence: number; q: number; decroissance: number; gain: number },
): void {
  const n0 = Math.round(o.debut * fe);
  const filtre = resonateur(o.frequence, o.q, fe);
  // Le panoramique à puissance constante : de −0,7 à 0,7.
  const angle = (Math.PI / 4) * (1 + 0.7 * blanc(alea));
  const [gauche, droite] = [Math.cos(angle), Math.sin(angle)];
  const longueur = Math.round(6 * o.decroissance * fe);
  for (let i = 0; i < longueur; i++) {
    const t = i / fe;
    const enveloppe = Math.min(1, t / 0.0008) * Math.exp(-t / o.decroissance);
    ajouter(canaux, n0 + i, 3 * o.gain * enveloppe * filtre(blanc(alea)), gauche, droite);
  }
}

/**
 * Un grondement : un bruit brun très grave, un peu de médium pour les petits haut-parleurs, et une
 * houle lente. Il monte en `montee` secondes, puis tient jusqu'à `tenue` et s'éteint à `fin`, ou
 * décroît avec la constante `decroissance`. Les deux canaux grondent chacun de leur côté.
 */
function grondement(
  canaux: Float32Array[],
  fe: number,
  alea: EtatAlea,
  o: {
    debut: number;
    montee: number;
    fin: number;
    tenue?: number;
    decroissance?: number;
    gain: number;
  },
): void {
  const n0 = Math.round(o.debut * fe);
  const n1 = Math.round(o.fin * fe);
  const phases = [tirer(alea), tirer(alea)].map((p) => 2 * Math.PI * p);
  for (const [c, canal] of canaux.entries()) {
    const graves = brun(alea);
    const grave = passeBas(140, fe);
    const medium = resonateur(220, 0.6, fe);
    for (let n = n0; n < Math.min(n1, canal.length); n++) {
      const t = (n - n0) / fe;
      const duree = o.fin - o.debut;
      const montee = t < o.montee ? (1 - Math.cos((Math.PI * t) / o.montee)) / 2 : 1;
      let tenue = 1;
      if (o.tenue !== undefined && t > o.tenue - o.debut) {
        const u = (t - (o.tenue - o.debut)) / (duree - (o.tenue - o.debut));
        tenue = (1 + Math.cos(Math.PI * Math.min(1, u))) / 2;
      } else if (o.decroissance !== undefined && t > o.montee) {
        tenue = Math.exp(-(t - o.montee) / o.decroissance);
      }
      const houle =
        1 +
        0.3 * Math.sin(2 * Math.PI * 0.7 * t + phases[0]!) +
        0.2 * Math.sin(2 * Math.PI * 1.9 * t + phases[1]!);
      const x = 1.6 * grave(graves()) + 1.5 * medium(blanc(alea));
      canal[n] = canal[n]! + o.gain * montee * tenue * houle * x * (c === 0 ? 1 : 0.95);
    }
  }
}

/**
 * Finit un son : sa crête ramenée à `crete`, un fondu de 2 ms au début et de 30 ms à la fin, pour
 * qu'il commence et finisse sur le silence.
 */
function finir(canaux: Float32Array[], fe: number, crete: number): void {
  let max = 0;
  for (const canal of canaux) for (const x of canal) max = Math.max(max, Math.abs(x));
  const gain = max > 0 ? crete / max : 0;
  const debut = Math.round(0.002 * fe);
  const fin = Math.round(0.03 * fe);
  for (const canal of canaux) {
    const n = canal.length;
    for (let i = 0; i < n; i++) {
      const fondu = Math.min(1, i / debut, (n - 1 - i) / fin);
      canal[i] = canal[i]! * gain * fondu;
    }
  }
}

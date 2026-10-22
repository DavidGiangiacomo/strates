// La boîte à outils de la synthèse (#46, #59) : des bruits, des filtres et des enveloppes, pour
// calculer les sons des banques. C'est un outil technique, comme le moteur audio
// (docs/architecture.md, § 1) : chaque banque y compose ses propres sons, et aucun son n'est commun
// à deux strates (§ 12). Tout est déterministe : le même aléa redonne le même son.
import { tirer, type EtatAlea } from "../logique/alea";

/** Un filtre passe-bas à un pôle. */
export function passeBas(coupure: number, fe: number): (x: number) => number {
  const a = 1 - Math.exp((-2 * Math.PI * coupure) / fe);
  let y = 0;
  return (x) => (y += a * (x - y));
}

/** Un filtre passe-haut à un pôle : ce que le passe-bas laisse passer en moins. */
export function passeHaut(coupure: number, fe: number): (x: number) => number {
  const bas = passeBas(coupure, fe);
  return (x) => x - bas(x);
}

/** Un résonateur : un passe-bande à deux pôles, de gain 1 à sa fréquence. */
export function resonateur(frequence: number, q: number, fe: number): (x: number) => number {
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

/**
 * Un passe-bande dont la fréquence change à chaque échantillon (un filtre à variables d'état) :
 * pour le vent, dont la hauteur suit les rafales. `q` règle sa finesse ; il reste stable jusqu'au
 * sixième de la fréquence d'échantillonnage.
 */
export function bandeVariable(q: number, fe: number): (x: number, frequence: number) => number {
  const amortissement = 1 / q;
  let bas = 0;
  let bande = 0;
  // Le coefficient ne se recalcule que si la fréquence change.
  let derniere = Number.NaN;
  let f = 0;
  return (x, frequence) => {
    if (frequence !== derniere) {
      derniere = frequence;
      f = 2 * Math.sin((Math.PI * Math.min(frequence, fe / 6)) / fe);
    }
    bas += f * bande;
    const haut = x - bas - amortissement * bande;
    bande += f * haut;
    return bande;
  };
}

/** Un bruit blanc, de −1 à 1. */
export const blanc = (alea: EtatAlea): number => 2 * tirer(alea) - 1;

/** Un bruit brun : un bruit blanc intégré, qui fuit pour ne pas dériver. */
export function brun(alea: EtatAlea): () => number {
  let b = 0;
  return () => {
    b = (b + 0.02 * blanc(alea)) / 1.02;
    return 3.5 * b;
  };
}

/** Le panoramique à puissance constante, de −1 (à gauche) à 1 (à droite) : le gain de chaque canal. */
export function panoramique(position: number): [gauche: number, droite: number] {
  const angle = (Math.PI / 4) * (1 + Math.max(-1, Math.min(1, position)));
  return [Math.cos(angle), Math.sin(angle)];
}

/** Ajoute `x` à l'échantillon `n` de chaque canal, s'il existe, dans la part `gauche` ou `droite`. */
export function ajouter(
  canaux: Float32Array[],
  n: number,
  x: number,
  gauche = 1,
  droite = 1,
): void {
  const [g, d] = canaux;
  if (n < 0 || !g || n >= g.length) return;
  g[n] = g[n]! + x * gauche;
  if (d) d[n] = d[n]! + x * droite;
}

/** Ramène la crête d'un son à `crete`. Un son muet le reste. */
export function normaliser(canaux: Float32Array[], crete: number): void {
  const etapes = normaliserParEtapes(canaux, crete);
  while (!etapes.next().done);
}

/** Ramène la crête d'un son à `crete`, en cédant la main : pour une longue rumeur calculée par étapes. */
export function* normaliserParEtapes(
  canaux: Float32Array[],
  crete: number,
  etape = 65536,
): Generator<void> {
  let max = 0;
  for (const canal of canaux) {
    for (let i = 0; i < canal.length; i++) {
      max = Math.max(max, Math.abs(canal[i]!));
      if (i % etape === etape - 1) yield;
    }
  }
  const gain = max > 0 ? crete / max : 0;
  for (const canal of canaux) {
    for (let i = 0; i < canal.length; i++) {
      canal[i] = canal[i]! * gain;
      if (i % etape === etape - 1) yield;
    }
  }
}

/**
 * Finit un son joué une fois : sa crête ramenée à `crete`, un fondu de 2 ms au début et de 30 ms à
 * la fin, pour qu'il commence et finisse sur le silence. Une ambiance, qui boucle, se normalise
 * seulement : le moteur fond sa fin dans son début (`raccord`).
 */
export function finir(canaux: Float32Array[], fe: number, crete: number): void {
  normaliser(canaux, crete);
  const debut = Math.round(0.002 * fe);
  const fin = Math.round(0.03 * fe);
  for (const canal of canaux) {
    const n = canal.length;
    for (let i = 0; i < n; i++) {
      const fondu = Math.min(1, i / debut, (n - 1 - i) / fin);
      canal[i] = canal[i]! * fondu;
    }
  }
}

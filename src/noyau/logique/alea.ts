// Générateur pseudo-aléatoire à graine (docs/architecture.md § 4).
// Son état est un simple nombre, rangé dans l'état de la strate : il se sauvegarde
// en JSON, et la même graine redonne toujours la même suite.

/** État d'un générateur, rangé dans l'état de la strate. */
export interface EtatAlea {
  s: number;
}

export function creerAlea(graine: number): EtatAlea {
  return { s: graine >>> 0 };
}

/** Tire un nombre dans [0, 1) et fait avancer le générateur (mulberry32). */
export function tirer(alea: EtatAlea): number {
  alea.s = (alea.s + 0x6d2b79f5) >>> 0;
  let t = alea.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Tire un entier dans [min, max]. */
export function tirerEntier(alea: EtatAlea, min: number, max: number): number {
  return min + Math.floor(tirer(alea) * (max - min + 1));
}

/** Dérive une graine indépendante d'une graine et d'un sel (par exemple, le numéro de strate). */
export function deriverGraine(graine: number, sel: number): number {
  let h = (graine ^ Math.imul(sel + 1, 0x9e3779b9)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

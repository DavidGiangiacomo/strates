import type { Meta, NumeroStrate } from "./types";

/** L'état d'une strate tel que le noyau le range : opaque, avec sa version (D-005). */
export interface EtatStrateRange {
  version: number;
  etat: unknown;
}

/** L'état global du noyau : `{ profondeur, artefacts[], κ, meta }` (§15), plus la graine et les strates. */
export interface EtatNoyau {
  /** L'étage courant : un entier de 1 à 8, toujours (§4). */
  profondeur: NumeroStrate;
  /** Identifiants des artefacts emportés (D-002). */
  artefacts: string[];
  /** La Compréhension, de 0 à 100. */
  kappa: number;
  meta: Meta;
  /** Graine de la partie ; celle de chaque strate en est dérivée. */
  graine: number;
  /** Un état par strate visitée, gardé après la descente (§15). */
  strates: Partial<Record<NumeroStrate, EtatStrateRange>>;
}

export function estNumeroStrate(n: unknown): n is NumeroStrate {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 8;
}

/** Une partie neuve, à la surface. */
export function creerEtatNoyau(graine: number): EtatNoyau {
  return {
    profondeur: 1,
    artefacts: [],
    kappa: 0,
    meta: { journal: { strates: [] } },
    graine: graine >>> 0,
    strates: {},
  };
}

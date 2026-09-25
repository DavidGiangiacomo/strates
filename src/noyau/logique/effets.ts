import type { EffetsActifs } from "./types";

/** Aucun artefact n'agit : ce sont les effets tant que la conversion (#21) n'existe pas. */
export const EFFETS_NEUTRES: EffetsActifs = Object.freeze({
  multiplicateur: () => 1,
  actif: () => false,
});

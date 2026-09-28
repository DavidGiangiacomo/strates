import type { EffetsActifs } from "./types";

/** Aucun artefact n'agit : à la surface, et dans les tests qui n'en ont pas besoin. */
export const EFFETS_NEUTRES: EffetsActifs = Object.freeze({
  multiplicateur: () => 1,
  niveau: () => null,
});

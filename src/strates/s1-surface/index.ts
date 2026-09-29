import type { DefinitionStrate } from "../../noyau/logique/types";
import { logique, type ActionSurface, type EtatSurface } from "./logique";
import { textes } from "./textes.fr";
import { formaterMontant } from "./vue/notation";
import { PALETTE, POLICE } from "./vue/theme";
import Vue from "./vue/Vue.svelte";

/** La surface, profondeur 1 (docs/strates/strate-1.md). */
export const strate: DefinitionStrate<EtatSurface, ActionSurface> = {
  logique,
  vue: Vue,
  textes,
  formaterValeur: formaterMontant,
  // Le dernier fragment du tableau de bord, à l'écran de fouille (fiche, § 6).
  apparenceValeur: { police: POLICE, couleur: PALETTE.texte, fond: PALETTE.carte },
};

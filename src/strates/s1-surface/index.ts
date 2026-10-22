import type { DefinitionStrate } from "../../noyau/logique/types";
import { logique, type ActionSurface, type EtatSurface } from "./logique";
import { textes } from "./textes.fr";
import { formaterMontant } from "./logique/notation";
import { PALETTE, POLICE } from "./vue/theme";
import { SONS_SURFACE } from "./vue/sons";
import Vue from "./vue/Vue.svelte";

/** La surface, profondeur 1 (docs/strates/strate-1.md). */
export const strate: DefinitionStrate<EtatSurface, ActionSurface> = {
  logique,
  vue: Vue,
  textes,
  formaterValeur: formaterMontant,
  // Le dernier fragment du tableau de bord, à l'écran de fouille (fiche, § 6).
  apparenceValeur: { police: POLICE, couleur: PALETTE.texte, fond: PALETTE.carte },
  // Un clic feutré et une note par objectif ; aucun fond sonore (fiche, § 6).
  sons: SONS_SURFACE,
};

import type { DefinitionStrate } from "../../noyau/logique/types";
import { logique, type ActionLit, type EtatLit } from "./logique";
import { formaterDoigts } from "./logique/notation";
import { textes } from "./textes.fr";
import { POLICE } from "./vue/theme";
import Vue from "./vue/Vue.svelte";

/** Le lit, profondeur 7 (docs/strates/strate-7.md). */
export const strate: DefinitionStrate<EtatLit, ActionLit> = {
  logique,
  vue: Vue,
  textes,
  // Le limon déposé, en toutes lettres (fiche, § 9). Le lit n'a pas d'écran de fouille : la descente
  // emporte tout, sans choix.
  formaterValeur: formaterDoigts,
  // « C'était la seule fois. », que le noyau écrit pendant la descente, dans la police du lit.
  policePhrase: POLICE,
};

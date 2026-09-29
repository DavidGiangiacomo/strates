import type { DefinitionStrate } from "../../noyau/logique/types";
import { logique, type ActionCaves, type EtatCaves } from "./logique";
import { formaterBoisseaux } from "./logique/notation";
import { textes } from "./textes.fr";
import { PALETTE, POLICE } from "./vue/theme";
import Vue from "./vue/Vue.svelte";

/** Les caves, profondeur 2 (docs/strates/strate-2.md). */
export const strate: DefinitionStrate<EtatCaves, ActionCaves> = {
  logique,
  vue: Vue,
  textes,
  formaterValeur: formaterBoisseaux,
  // Le dernier fragment de la vallée, à l'écran de fouille : l'encre sur le papier du registre.
  apparenceValeur: { police: POLICE, couleur: PALETTE.encre[0], fond: PALETTE.papier[0] },
};

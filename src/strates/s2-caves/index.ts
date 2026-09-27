import type { DefinitionStrate } from "../../noyau/logique/types";
import { logique, type ActionCaves, type EtatCaves } from "./logique";
import { textes } from "./textes.fr";
import Vue from "./vue/Vue.svelte";

/** Les caves, profondeur 2 (docs/strates/strate-2.md). */
export const strate: DefinitionStrate<EtatCaves, ActionCaves> = { logique, vue: Vue, textes };

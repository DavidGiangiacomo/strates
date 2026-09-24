import type { DefinitionStrate, NumeroStrate } from "../../noyau/logique/types";
import { creerLogiqueFactice, type ActionFactice, type EtatFactice } from "./logique";
import { textes } from "./textes.fr";
import Vue from "./vue/Vue.svelte";

export function creerStrateFactice(
  numero: NumeroStrate,
): DefinitionStrate<EtatFactice, ActionFactice> {
  return { logique: creerLogiqueFactice(numero), vue: Vue, textes };
}

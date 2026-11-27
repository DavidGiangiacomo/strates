import type { DefinitionStrate } from "../../noyau/logique/types";
import { logique, type ActionReseau, type EtatReseau } from "./logique";
import { formaterMuids } from "./logique/notation";
import { textes } from "./textes.fr";
import Vue from "./vue/Vue.svelte";

/** Le réseau, profondeur 4 (docs/strates/strate-4.md). */
export const strate: DefinitionStrate<EtatReseau, ActionReseau> = {
  logique,
  vue: Vue,
  textes,
  // Toute l'eau reçue par la ville, en muids, écrits en entier (fiche, § 9).
  formaterValeur: (valeur) => formaterMuids(valeur),
};

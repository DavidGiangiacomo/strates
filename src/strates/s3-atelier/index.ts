import type { DefinitionStrate } from "../../noyau/logique/types";
import { logique, type ActionAtelier, type EtatAtelier } from "./logique";
import { formaterPieces } from "./logique/notation";
import { textes } from "./textes.fr";
import { SONS_ATELIER } from "./vue/sons";
import { PALETTE, POLICE } from "./vue/theme";
import Vue from "./vue/Vue.svelte";

/** L'atelier, profondeur 3 (docs/strates/strate-3.md). */
export const strate: DefinitionStrate<EtatAtelier, ActionAtelier> = {
  logique,
  vue: Vue,
  textes,
  // À l'écran de fouille, les pièces produites, en base douze (fiche, § 9).
  formaterValeur: formaterPieces,
  // Le dernier fragment de l'atelier : au graphite, sur le papier du plan (fiche, § 6).
  apparenceValeur: { police: POLICE, couleur: PALETTE.graphite, fond: PALETTE.papier },
  // Le tic du ressort, qui s'enrichit ; le métal, la lime et le papier des gestes (fiche, § 6).
  sons: SONS_ATELIER,
};

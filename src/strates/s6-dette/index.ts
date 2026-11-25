import type { DefinitionStrate } from "../../noyau/logique/types";
import { logique, type ActionDette, type EtatDette } from "./logique";
import { formaterSceaux } from "./logique/notation";
import { textes } from "./textes.fr";
import Vue from "./vue/Vue.svelte";

/** La dette, profondeur 6 (docs/strates/strate-6.md). */
export const strate: DefinitionStrate<EtatDette, ActionDette> = {
  logique,
  vue: Vue,
  textes,
  // Ce qui a été honoré, en sceaux : « 384 ●●●●●● » (fiche, § 9).
  formaterValeur: (valeur) => formaterSceaux(valeur),
  // Les glyphes des textes opaques : ceux du noyau, sans le disque plein, qui est le sceau de la dette.
  glyphes: "◇◆○△▽□■◁▷",
};

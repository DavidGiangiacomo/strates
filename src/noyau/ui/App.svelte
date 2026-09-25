<script lang="ts">
  import { onDestroy, type Component } from "svelte";
  import { creerEtatNoyau } from "../logique/etat";
  import { Noyau } from "../logique/noyau";
  import type { ActionBase, CommandesNoyau, ProprietesVue } from "../logique/types";
  import { demarrerBoucle } from "../plateforme/boucle";
  import { graineAleatoire, maintenant } from "../plateforme/horloge";
  import { creerRegistre } from "../../strates/registre";
  import { rendreStrateReactive } from "./reactivite.svelte";

  type VueStrate = Component<ProprietesVue<object, ActionBase>>;

  // Partie neuve à chaque chargement, tant que la sauvegarde (#20) n'existe pas.
  const noyau = new Noyau(creerRegistre(), creerEtatNoyau(graineAleatoire()));

  // Pas encore branchées : la descente arrive avec #30, l'aide et les fins plus tard.
  const commandes: CommandesNoyau = {
    demanderFouille() {},
    ouvrirAide() {},
    terminer() {},
  };

  let arreter: (() => void) | undefined;

  const demarrage = noyau.demarrer(maintenant()).then(() => {
    const etat = rendreStrateReactive(noyau);
    arreter = demarrerBoucle(noyau);
    return { strate: noyau.strate, etat };
  });

  onDestroy(() => arreter?.());
</script>

<main>
  {#await demarrage}
    <p>Chargement…</p>
  {:then { strate, etat }}
    {@const Vue = strate.vue as VueStrate}
    <Vue
      {etat}
      agir={(action) => noyau.agir(action)}
      noyau={commandes}
      o={(cle) => strate.textes[cle] ?? cle}
      mode="jeu"
    />
  {:catch erreur}
    <p>La strate n'a pas pu être chargée : {String(erreur)}</p>
  {/await}
</main>

<script lang="ts">
  import type { ProprietesVue } from "../../../noyau/logique/types";
  import {
    coutGenerateur,
    seuilAtteint,
    SEUIL_FACTICE,
    type ActionFactice,
    type EtatFactice,
  } from "../logique";

  let { etat, agir, o, lisible }: ProprietesVue<EtatFactice, ActionFactice> = $props();

  const cout = $derived(coutGenerateur(etat.generateurs));
</script>

<section>
  <h2>{o("titre")}</h2>
  <p>
    <strong data-test="unites">{Math.floor(etat.unites)}</strong>
    {o("unites")} · {etat.generateurs}
    {o("generateurs")}
  </p>
  <p data-test="cumul">
    {o("cumul")} :
    {#if lisible("cumul")}
      {Math.floor(etat.cumul)} / {SEUIL_FACTICE}
    {:else}
      <!-- Opaque, le compteur est une jauge sans échelle : il avance, sans un chiffre. -->
      <progress max={SEUIL_FACTICE} value={Math.min(etat.cumul, SEUIL_FACTICE)}></progress>
    {/if}
  </p>
  <button onclick={() => agir({ type: "produire" })}>{o("produire")}</button>
  <button onclick={() => agir({ type: "acheter" })} disabled={etat.unites < cout}>
    {o("acheter")} ({cout})
  </button>
  <button onclick={() => agir({ type: "hasard" })}>{o("hasard")}</button>
  {#if seuilAtteint(etat)}
    <p>{o("seuil")}</p>
  {/if}
</section>

<style>
  section {
    padding: 1rem;
  }
</style>

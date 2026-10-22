<script lang="ts">
  // La coupe (#47 ; design doc, § 11 ; bible, § 10), ouverte depuis « Profondeur » dans le bandeau : un
  // volet sous lui, dans sa palette. Les huit couches, de la surface au fond, d'égale épaisseur, dans
  // les bruns du sol de la descente. Une couche atteinte porte son nom et une ligne, sans commentaire ;
  // le contact sous une couche quittée est son seuil franchi. Les couches pas encore atteintes restent
  // inconnues : des bandes sombres, sans nom. La strate continue de vivre dessous.
  import { onMount } from "svelte";
  import type { CoucheCoupe } from "../logique/coupe";
  import type { NumeroStrate } from "../logique/types";
  import { ligneCouche, TEINTES, TEXTES_COUPE as T } from "./coupe";
  import { NOMS_STRATES } from "./fouille";

  let {
    couches,
    profondeur,
    onfermer,
  }: { couches: readonly CoucheCoupe[]; profondeur: NumeroStrate; onfermer: () => void } = $props();

  let panneau: HTMLElement | undefined = $state();
  onMount(() => panneau?.focus());
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape") onfermer();
  }}
/>

<div
  class="coupe"
  role="dialog"
  aria-labelledby="coupe-titre"
  tabindex="-1"
  bind:this={panneau}
  data-test="coupe"
>
  <header>
    <h2 id="coupe-titre">{T.profondeur} <strong>{profondeur}</strong></h2>
    <button class="fermer" onclick={onfermer}>{T.fermer}</button>
  </header>
  <ol>
    {#each couches as couche (couche.strate)}
      {#if couche.atteinte}
        {@const ligne = ligneCouche(couche)}
        <li
          class="couche"
          class:quittee={!couche.courante}
          style:--teinte={TEINTES[couche.strate]}
          aria-current={couche.courante ? "location" : undefined}
          data-test="couche-{couche.strate}"
        >
          <h3>{NOMS_STRATES[couche.strate]}</h3>
          {#if ligne}
            <p>{ligne}</p>
          {/if}
        </li>
      {:else}
        <li
          class="couche inconnue"
          style:--teinte={TEINTES[couche.strate]}
          aria-hidden="true"
          data-test="couche-{couche.strate}"
        ></li>
      {/if}
    {/each}
  </ol>
</div>

<style>
  /* La palette du bandeau, dépliée sous « Profondeur » ; dedans, le sol de la descente. */
  .coupe {
    position: fixed;
    top: 24px;
    left: 0;
    z-index: 7;
    box-sizing: border-box;
    width: min(calc(100vw / var(--zoom, 1)), 24rem);
    max-height: calc(100vh / var(--zoom, 1) - 24px);
    overflow-y: auto;
    font:
      12px/1.4 system-ui,
      sans-serif;
    color: #d6d6d6;
    background: #1e1e1e;
    border: 1px solid #3c3c3c;
    border-left: none;
    outline: none;
  }
  header {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    padding: 10px 12px;
    border-bottom: 1px solid #3c3c3c;
  }
  h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 400;
    color: #d6d6d6;
  }
  strong {
    font-weight: 600;
    color: #f2f2f2;
  }
  .fermer {
    margin-inline-start: auto;
    height: 18px;
    padding: 0 10px;
    font: inherit;
    line-height: 1;
    color: inherit;
    cursor: pointer;
    background: transparent;
    border: 1px solid #5c5c5c;
    border-radius: 2px;
  }
  .fermer:hover {
    border-color: #8c8c8c;
  }
  .fermer:focus-visible {
    outline: 1px solid #f2f2f2;
    outline-offset: 1px;
  }
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* Une bande par couche, d'égale épaisseur : une ligne de plus l'élargit, sans plus. */
  .couche {
    box-sizing: border-box;
    min-height: 52px;
    padding: 8px 12px;
    background: var(--teinte);
    border-top: 1px solid #1e1e1e;
  }
  .couche:first-child {
    border-top: none;
  }
  /* Le contact sous une couche quittée : son seuil franchi. */
  .quittee + .couche {
    border-top-color: #8c8c8c;
  }
  /* Pas encore atteinte : le sol, dans le noir. */
  .inconnue {
    filter: brightness(0.55);
  }
  h3 {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: #f2f2f2;
  }
  p {
    margin: 2px 0 0;
    color: #bdbdbd;
  }
</style>

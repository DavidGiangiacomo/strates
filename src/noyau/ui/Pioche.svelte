<script lang="ts">
  // Le coup de pioche (docs/strates/descente-1-2.md, P2) : une fissure part du bouton « creuser » et
  // traverse la strate jusqu'au bas de l'écran, en 0,4 s. Même tracé que le filet (fissure.ts), qu'elle
  // prolonge quand il avait paru : il s'arrêtait au bouton. Un calque qui ne capte aucun clic.
  // Après « reboucher », elle reste dessinée, sans animation : le sol a été ouvert une fois.
  import { cheminFissure, ramificationsFissure, traitPioche } from "./fissure";

  let { cicatrice = false }: { cicatrice?: boolean } = $props();

  let largeur = $state(0);
  let hauteur = $state(0);

  const trait = $derived(traitPioche(largeur, hauteur));
  const chemin = $derived(largeur > 0 ? cheminFissure(trait.depart, trait.arrivee) : "");
  const ramifications = $derived(
    largeur > 0 ? ramificationsFissure(trait.depart, trait.arrivee) : [],
  );
</script>

<svelte:window bind:innerWidth={largeur} bind:innerHeight={hauteur} />

{#if chemin}
  <svg
    class="pioche"
    class:cicatrice
    width={largeur}
    height={hauteur}
    aria-hidden="true"
    data-test={cicatrice ? "cicatrice" : "pioche"}
  >
    <path class="trait" d={chemin} pathLength="1" />
    {#each ramifications as r (r.a)}
      <path class="trait branche" d={r.d} pathLength="1" style:animation-delay="{r.a * 400}ms" />
    {/each}
  </svg>
{/if}

<style>
  .pioche {
    position: fixed;
    inset: 0;
    z-index: 7;
    pointer-events: none;
    color: #5a5a5a;
  }
  /* Quand les deux moitiés se séparent (Fente.svelte), le trait s'efface avec elles. */
  .pioche:not(.cicatrice) {
    animation: effacer 300ms ease-in 450ms both;
  }
  @keyframes effacer {
    to {
      opacity: 0;
    }
  }
  .trait {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linejoin: bevel;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: fendre 400ms ease-out forwards;
  }
  .branche {
    stroke-width: 1;
    animation-duration: 150ms;
  }
  @keyframes fendre {
    to {
      stroke-dashoffset: 0;
    }
  }
  .cicatrice {
    z-index: 5;
    opacity: 0.75;
  }
  .cicatrice .trait {
    stroke-width: 1;
  }
  .cicatrice .trait,
  .cicatrice .branche {
    animation: none;
    stroke-dashoffset: 0;
  }
  @media (prefers-reduced-motion: reduce) {
    .trait {
      animation: none;
      stroke-dashoffset: 0;
    }
    .pioche:not(.cicatrice) {
      animation: effacer 300ms both;
    }
  }
</style>

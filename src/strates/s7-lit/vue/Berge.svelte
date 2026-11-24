<svelte:options namespace="svg" />

<script lang="ts">
  // Les objets d'en haut, posés sur la berge, en haut de la rive (fiche, § 8) : des choses simples,
  // dessinées sans un mot. Leur nom ne se lit que dans l'inventaire du noyau. Chacun est posé sur le
  // sol, son pied à la hauteur de la berge ; un objet que le lit ne connaît pas est un galet.
  import { HAUT, placesSurLaBerge } from "./coupe";

  let { objets }: { objets: readonly string[] } = $props();

  const places = $derived(placesSurLaBerge(objets.length));
</script>

{#each objets as id, i (id)}
  <g class="objet" transform="translate({places[i]} {HAUT})" data-objet={id}>
    {#if id === "s6-stylet"}
      <!-- Le bâton qui creuse : un bâton couché. -->
      <line class="bois" x1="-10" y1="-1.5" x2="10" y2="-4.5" stroke-width="2.4" />
    {:else if id === "s6-sceau"}
      <!-- Le rouleau qui marque : un petit cylindre de pierre, gravé. -->
      <rect class="galet" x="-8" y="-7" width="16" height="7" rx="3.5" />
      <path class="grave" d="M-3,-6.5 V-0.5 M1,-6.5 V-0.5 M5,-6.5 V-0.5" />
    {:else if id === "s6-poids"}
      <!-- La pierre qui pèse : une pierre ronde et lourde. -->
      <path class="galet-sombre" d="M-9,0 C-10,-6 -4,-10 1,-10 C7,-10 10,-5 9,0 Z" />
    {:else if id === "s6-bulle"}
      <!-- L'œuf qui garde : un œuf d'argile, debout. -->
      <ellipse class="coquille" cx="0" cy="-7" rx="5" ry="7" />
    {:else if id === "s6-tablette"}
      <!-- La pierre qui oblige : une tablette dressée, un peu penchée. -->
      <rect class="argile" x="-5" y="-13" width="10" height="13" rx="1.5" transform="rotate(-6)" />
      <path class="grave" d="M-3,-10 H2 M-3,-7 H3 M-3,-4 H1" transform="rotate(-6)" />
    {:else if id === "s5-stalle"}
      <!-- La caution de bois : un morceau de planche. -->
      <rect class="bois-plein" x="-9" y="-5" width="18" height="5" rx="1" />
      <path class="grave" d="M-7,-2.5 C-3,-3.5 2,-1.5 7,-2.5" />
    {:else if id === "s5-souffle"}
      <!-- Le gage qui souffle : un roseau percé. -->
      <rect class="roseau" x="-10" y="-3.5" width="20" height="3.5" rx="1.75" />
      <path class="grave" d="M-4,-1.75 h0.01 M0,-1.75 h0.01 M4,-1.75 h0.01" stroke-width="1.6" />
    {:else if id === "s5-echo"}
      <!-- Le gage qui revient : un anneau, debout. -->
      <circle class="anneau" cx="0" cy="-6" r="5" stroke-width="2.2" />
    {:else if id === "s5-silence"}
      <!-- Le gage patient : un galet plat. -->
      <ellipse class="galet" cx="0" cy="-2.5" rx="7" ry="2.5" />
    {:else if id === "s5-voix"}
      <!-- Le gage qui chante : un coquillage. -->
      <ellipse class="coquille" cx="0" cy="-4" rx="6" ry="4" />
      <path class="grave" d="M-3.5,-4 H3.5" />
    {:else}
      <ellipse class="galet" cx="0" cy="-3" rx="5" ry="3" />
    {/if}
  </g>
{/each}

<style>
  .bois {
    stroke: var(--bois);
    stroke-linecap: round;
  }
  .bois-plein {
    fill: var(--bois);
  }
  .galet {
    fill: var(--galet);
  }
  .galet-sombre {
    fill: var(--galet-sombre);
  }
  .coquille {
    fill: var(--coquille);
  }
  .argile {
    fill: var(--argile);
  }
  .roseau {
    fill: var(--roseau);
  }
  .anneau {
    fill: none;
    stroke: var(--galet-sombre);
  }
  .grave {
    fill: none;
    stroke: var(--rive);
    stroke-width: 0.8;
    stroke-linecap: round;
  }
</style>

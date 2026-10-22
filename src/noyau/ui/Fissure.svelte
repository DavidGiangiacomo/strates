<script lang="ts">
  // La fissure, le filet commun aux strates : un calque sur toute la fenêtre, qui ne capte aucun clic.
  // Elle part d'un élément de la strate (le graphique de la surface, le fond de la coupe des caves) et
  // s'allonge jusqu'au bouton « creuser », à droite du bandeau commun de 24 px (§12). Aucun texte.
  import { milieuCreuser, zoomEcran } from "./ecran";
  import {
    BANDEAU,
    BOUTON_DEPUIS_LA_DROITE,
    cheminFissure,
    ramificationsFissure,
    type Point,
  } from "./fissure";

  let { depart, avancee }: { depart: Element | undefined; avancee: number } = $props();

  // La fenêtre se mesure en pixels de l'écran ; le calque, en pixels du jeu, que la taille du texte
  // peut avoir zoomé (#48).
  let largeurFenetre = $state(0);
  let hauteurFenetre = $state(0);
  let zoom = $state(1);
  const largeur = $derived(largeurFenetre / zoom);
  const hauteur = $derived(hauteurFenetre / zoom);
  let origine = $state<Point | null>(null);
  let bouton = $state<number | null>(null);

  function mesurer(): void {
    zoom = zoomEcran();
    bouton = milieuCreuser();
    const r = depart?.getBoundingClientRect();
    origine = r
      ? { x: (r.left + r.width * 0.72) / zoom, y: (r.top + r.height * 0.5) / zoom }
      : null;
  }

  // Le départ peut bouger (défilement, message au-dessus) : on remesure à chaque progression.
  $effect(() => {
    void avancee;
    mesurer();
  });

  const arrivee = $derived({ x: bouton ?? largeur - BOUTON_DEPUIS_LA_DROITE, y: BANDEAU });
  const chemin = $derived(origine ? cheminFissure(origine, arrivee) : "");
  const ramifications = $derived(origine ? ramificationsFissure(origine, arrivee) : []);

  /** Une ramification pousse juste après que le tracé principal l'a atteinte. */
  const pousse = (a: number) => Math.min(1, Math.max(0, (avancee - a) / 0.06));
</script>

<svelte:window
  bind:innerWidth={largeurFenetre}
  bind:innerHeight={hauteurFenetre}
  onscroll={mesurer}
  onresize={mesurer}
/>

{#if chemin}
  <svg class="fissure" width={largeur} height={hauteur} aria-hidden="true" data-test="fissure">
    <path
      d={chemin}
      pathLength="1"
      stroke-dasharray="1"
      stroke-dashoffset={1 - avancee}
      fill="none"
      stroke="currentColor"
      stroke-width="1"
      stroke-linejoin="bevel"
    />
    {#each ramifications as r (r.a)}
      <path
        d={r.d}
        pathLength="1"
        stroke-dasharray="1"
        stroke-dashoffset={1 - pousse(r.a)}
        fill="none"
        stroke="currentColor"
        stroke-width="0.7"
      />
    {/each}
  </svg>
{/if}

<style>
  .fissure {
    position: fixed;
    inset: 0;
    z-index: 5;
    pointer-events: none;
    color: #5a5a5a;
    opacity: 0.75;
  }
</style>

<script lang="ts">
  // La fissure : un calque sur toute la fenêtre, qui ne capte aucun clic. Elle part du graphique et
  // s'allonge jusqu'au bouton « creuser », à droite du bandeau commun de 24 px (§12). Aucun texte.
  import { cheminFissure, ramificationsFissure, type Point } from "./fissure";

  let { depart, avancee }: { depart: HTMLElement | undefined; avancee: number } = $props();

  /** Hauteur du bandeau commun (§12) : la fissure s'arrête juste en dessous. */
  const BANDEAU = 24;
  /** Distance du bouton « creuser » au bord droit de la fenêtre, à peu près en son milieu. */
  const BOUTON_DEPUIS_LA_DROITE = 40;

  let largeur = $state(0);
  let hauteur = $state(0);
  let origine = $state<Point | null>(null);

  function mesurer(): void {
    const r = depart?.getBoundingClientRect();
    origine = r ? { x: r.left + r.width * 0.72, y: r.top + r.height * 0.5 } : null;
  }

  // Le graphique peut bouger (défilement, message au-dessus) : on remesure à chaque progression.
  $effect(() => {
    void avancee;
    mesurer();
  });

  const arrivee = $derived({ x: largeur - BOUTON_DEPUIS_LA_DROITE, y: BANDEAU });
  const chemin = $derived(origine ? cheminFissure(origine, arrivee) : "");
  const ramifications = $derived(origine ? ramificationsFissure(origine, arrivee) : []);

  /** Une ramification pousse juste après que le tracé principal l'a atteinte. */
  const pousse = (a: number) => Math.min(1, Math.max(0, (avancee - a) / 0.06));
</script>

<svelte:window bind:innerWidth={largeur} bind:innerHeight={hauteur} onscroll={mesurer} />

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

<script lang="ts">
  // La descente (docs/strates/descente-1-2.md, P5 et P6) : un travelling vertical vers le bas. Les
  // couches du sol défilent et montent ; les objets emportés restent au milieu de l'écran, puisqu'ils
  // descendent avec le joueur. À l'arrivée, ils glissent vers le compteur du bandeau, sa poche.
  // Les durées suivent celles du passage (passage.svelte.ts, DUREES).
  let { phase, transportes }: { phase: "descente" | "arrivee"; transportes: readonly string[] } =
    $props();
</script>

<div class="sol" class:arrivee={phase === "arrivee"} aria-hidden="true" data-test="sol"></div>
<ul class="transportes" class:arrivee={phase === "arrivee"} data-test="transportes">
  {#each transportes as nom, i (nom)}
    <li style:--i={i}>{nom}</li>
  {/each}
</ul>

<style>
  /* Les couches de la coupe, dans la palette du noyau : le même sol pour les sept descentes. */
  .sol {
    position: fixed;
    inset: 24px 0 0;
    z-index: 2;
    background: repeating-linear-gradient(
      180deg,
      #2b2825 0 90px,
      #34302b 90px 170px,
      #3d3833 170px 230px,
      #2f2b27 230px 320px
    );
    animation: defiler 2800ms cubic-bezier(0.45, 0, 0.55, 1) 400ms both;
  }
  @keyframes defiler {
    from {
      background-position: 0 0;
    }
    to {
      background-position: 0 -1600px;
    }
  }
  .sol.arrivee {
    transition: opacity 400ms;
    opacity: 0;
  }

  .transportes {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 6;
    margin: 0;
    padding: 0;
    list-style: none;
    transform: translate(-50%, -50%);
    font:
      14px/1.5 system-ui,
      sans-serif;
    pointer-events: none;
    animation: paraitre 1ms 400ms both;
  }
  /* Des étiquettes aux couleurs du bandeau : lisibles sur le sol comme sur la strate qui arrive. */
  li {
    width: fit-content;
    margin: 0.35rem auto;
    padding: 0.1rem 0.7rem;
    color: #f2f2f2;
    background: #1e1e1e;
    border: 1px solid #5c5c5c;
    border-radius: 2px;
  }
  @keyframes paraitre {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  /* P6 : chaque objet rejoint « Artefacts », en haut à gauche du bandeau, un par dixième de seconde. */
  .arrivee li {
    animation: ranger 400ms ease-in calc(var(--i) * 100ms) forwards;
  }
  @keyframes ranger {
    to {
      transform: translate(calc(-50vw + 150px), calc(-50vh + 12px)) scale(0.3);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sol,
    .transportes {
      animation: none;
    }
    .arrivee li {
      animation: none;
      transition: opacity 300ms;
      opacity: 0;
    }
  }
</style>

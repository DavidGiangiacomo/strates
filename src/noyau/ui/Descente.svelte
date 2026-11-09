<script lang="ts">
  // La descente (docs/strates/descente-1-2.md, P5 et P6) : un travelling vertical vers le bas. Les
  // couches du sol défilent et montent ; les objets restent au milieu de l'écran, puisqu'ils
  // descendent avec le joueur : tous ceux qui n'étaient pas encore des cailloux, rangés par couche
  // d'origine. À mi-course, quand la Profondeur change, les anciens perdent un cran, et les plus vieux
  // deviennent des cailloux (#45). À l'arrivée, ils glissent vers le compteur du bandeau, leur poche.
  // Les durées suivent celles du passage (passage.svelte.ts, DUREES). La descente du lit, la seule que
  // le joueur ne choisit pas, est deux fois plus lente, et sa phrase y paraît au centre, puis
  // s'efface (docs/strates/strate-7.md, § 11).
  import type { ObjetInventaire } from "../logique/artefacts";
  import { zoomEcran } from "./ecran";
  import { etiquette, NIVEAUX, parCouche } from "./inventaire";
  import Usure from "./Usure.svelte";

  let {
    phase,
    transportes,
    phrase = null,
    travelling = 4000,
    poche,
  }: {
    phase: "descente" | "arrivee";
    transportes: readonly ObjetInventaire[];
    /** La phrase de la strate quittée, s'il y en a une : celle du lit. */
    phrase?: string | null;
    /** La durée du travelling, en millisecondes. */
    travelling?: number;
    /** Où est le compteur des artefacts : les objets le visent à l'arrivée. */
    poche?: () => DOMRect | null;
  } = $props();

  const couches = $derived(parCouche(transportes));
  const rangs = $derived(new Map(transportes.map((objet, i) => [objet.id, i])));

  let liste: HTMLElement | undefined = $state();

  // À l'arrivée, chaque objet vise le compteur depuis sa place.
  $effect(() => {
    if (phase !== "arrivee" || !liste) return;
    const cible = poche?.();
    if (!cible) return;
    // Les rectangles sont en pixels de l'écran ; le déplacement, en pixels du jeu (#48).
    const zoom = zoomEcran();
    for (const objet of liste.querySelectorAll<HTMLElement>("li")) {
      const ici = objet.getBoundingClientRect();
      const dx = (cible.x + cible.width / 2 - (ici.x + ici.width / 2)) / zoom;
      const dy = (cible.y + cible.height / 2 - (ici.y + ici.height / 2)) / zoom;
      objet.style.setProperty("--dx", `${dx}px`);
      objet.style.setProperty("--dy", `${dy}px`);
    }
  });
</script>

<div
  class="sol"
  class:arrivee={phase === "arrivee"}
  style:--defilement="{travelling - 1200}ms"
  aria-hidden="true"
  data-test="sol"
></div>
{#if phrase && phase === "descente"}
  <p class="phrase" style:--travelling="{travelling}ms" role="status" data-test="phrase">
    {phrase}
  </p>
{/if}
<div
  class="transportes"
  class:arrivee={phase === "arrivee"}
  style:--n={transportes.length}
  bind:this={liste}
  data-test="transportes"
>
  {#each couches as couche (couche.origine)}
    <ul>
      {#each couche.objets as objet (objet.id)}
        <li
          class:inerte={objet.niveau === "inerte"}
          style:--i={rangs.get(objet.id)}
          data-test="transporte-{objet.id}"
        >
          <Usure niveau={objet.niveau} />
          <span>{etiquette(objet.nom)}<span class="lecteur">,</span></span>
          <span class="mot">{NIVEAUX[objet.niveau]}</span>
        </li>
      {/each}
    </ul>
  {/each}
</div>

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
    animation: defiler var(--defilement, 2800ms) cubic-bezier(0.45, 0, 0.55, 1) 400ms both;
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

  /* La phrase de la descente, au-dessus des objets : elle vient, reste, puis s'efface. */
  .phrase {
    position: fixed;
    top: 28%;
    right: 0;
    left: 0;
    z-index: 6;
    margin: 0;
    padding: 0 16px;
    font:
      italic 26px/1.3 Georgia,
      "Times New Roman",
      serif;
    color: #ecebe6;
    text-align: center;
    pointer-events: none;
    animation: dire var(--travelling) linear both;
  }
  @keyframes dire {
    0%,
    8% {
      opacity: 0;
    }
    20%,
    78% {
      opacity: 1;
    }
    92%,
    100% {
      opacity: 0;
    }
  }

  /* Une rangée par couche d'origine, la surface en haut : une coupe en petit. */
  .transportes {
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 6;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: min(calc(92vw / var(--zoom, 1)), 44rem);
    transform: translate(-50%, -50%);
    font:
      13px/1.5 system-ui,
      sans-serif;
    pointer-events: none;
    animation: paraitre 1ms 400ms both;
  }
  ul {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.35rem 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* Des étiquettes aux couleurs du bandeau : lisibles sur le sol comme sur la strate qui arrive. */
  li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0.1rem 0.6rem;
    color: #f2f2f2;
    background: #1e1e1e;
    border: 1px solid #5c5c5c;
    border-radius: 2px;
    transition:
      color 400ms,
      border-color 400ms;
  }
  .mot {
    color: #a6a6a6;
    transition: color 400ms;
  }
  /* Devenu caillou, l'objet passe au gris. */
  .inerte,
  .inerte .mot {
    color: #8c8c8c;
  }
  .inerte {
    border-color: #3c3c3c;
  }
  .lecteur {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  @keyframes paraitre {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  /*
   * P6 : chaque objet rejoint « Artefacts », dans le bandeau, un par dixième de seconde ; plus vite
   * quand ils sont nombreux, pour que tous y soient à la fin de l'arrivée.
   */
  .arrivee li {
    animation: ranger 400ms ease-in calc(var(--i) * min(100ms, 600ms / var(--n))) forwards;
  }
  @keyframes ranger {
    to {
      transform: translate(
          var(--dx, calc(-50vw / var(--zoom, 1) + 150px)),
          var(--dy, calc(-50vh / var(--zoom, 1) + 12px))
        )
        scale(0.3);
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .sol,
    .transportes,
    .phrase {
      animation: none;
    }
    li,
    .mot {
      transition: none;
    }
    .arrivee li {
      animation: none;
      transition: opacity 300ms;
      opacity: 0;
    }
  }
</style>

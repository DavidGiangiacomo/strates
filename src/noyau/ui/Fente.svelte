<script lang="ts">
  // La strate se fend le long de la fissure du coup de pioche (docs/strates/descente-1-2.md, P2) :
  // deux copies de la strate, découpées de part et d'autre du tracé, glissent vers le bas en
  // s'écartant et s'effacent. Au rebouchage, elles remontent et se rejoignent (P4). Le noyau fige la
  // strate pendant tout ce temps : une copie de son DOM, prise à l'instant, suffit à la montrer.
  // Sans mouvement, les deux moitiés s'effacent ou reparaissent sur place.
  import { moitiesFente } from "./fissure";

  let {
    source,
    sens,
  }: {
    /** L'élément de la strate, tel qu'il est à l'écran. */
    source: HTMLElement | undefined;
    sens: "ouvrir" | "refermer";
  } = $props();

  let largeur = $state(0);
  let hauteur = $state(0);
  const moities = $derived(largeur > 0 ? moitiesFente(largeur, hauteur) : null);

  /** Pose dans une moitié une copie de la strate, exactement là où elle est à l'écran. */
  function copier(moitie: HTMLElement) {
    if (!source) return;
    const r = source.getBoundingClientRect();
    const copie = source.cloneNode(true) as HTMLElement;
    // La strate est cachée pendant la fente : la copie ne garde rien de ce qui la cache ou l'anime.
    Object.assign(copie.style, {
      position: "absolute",
      top: `${r.top}px`,
      left: `${r.left}px`,
      width: `${r.width}px`,
      margin: "0",
      visibility: "visible",
      opacity: "1",
      transform: "none",
      animation: "none",
    });
    moitie.append(copie);
    return () => copie.remove();
  }
</script>

<svelte:window bind:innerWidth={largeur} bind:innerHeight={hauteur} />

{#if moities && source}
  <div class="fente {sens}" inert aria-hidden="true" data-test="fente">
    <div class="moitie gauche" style:clip-path={moities.gauche} {@attach copier}></div>
    <div class="moitie droite" style:clip-path={moities.droite} {@attach copier}></div>
  </div>
{/if}

<style>
  .fente {
    position: fixed;
    inset: 0;
    z-index: 3;
    pointer-events: none;
  }
  /* Au rebouchage, les moitiés recouvrent l'écran de fouille qui s'efface. */
  .refermer {
    z-index: 5;
  }
  .moitie {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }
  .gauche {
    transform-origin: 0 100%;
  }
  .droite {
    transform-origin: 100% 100%;
  }
  /* P2 : de 0,4 à 1 s, après la fissure. */
  .ouvrir .gauche {
    animation: tomber-gauche 600ms ease-in 400ms both;
  }
  .ouvrir .droite {
    animation: tomber-droite 600ms ease-in 400ms both;
  }
  /* P4, « reboucher » : en 0,5 s, les moitiés remontent, opaques, et se rejoignent. */
  .refermer .gauche {
    animation: remonter-gauche 500ms ease-out both;
  }
  .refermer .droite {
    animation: remonter-droite 500ms ease-out both;
  }
  @keyframes tomber-gauche {
    to {
      opacity: 0;
      transform: translate(-3vw, 30vh) rotate(-3deg);
    }
  }
  @keyframes tomber-droite {
    to {
      opacity: 0;
      transform: translate(3vw, 30vh) rotate(2deg);
    }
  }
  @keyframes remonter-gauche {
    from {
      transform: translate(-3vw, 30vh) rotate(-3deg);
    }
  }
  @keyframes remonter-droite {
    from {
      transform: translate(3vw, 30vh) rotate(2deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ouvrir .moitie {
      animation: effacer 300ms both;
    }
    .refermer .moitie {
      animation: effacer 300ms reverse both;
    }
    @keyframes effacer {
      to {
        opacity: 0;
      }
    }
  }
</style>

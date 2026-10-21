<script lang="ts">
  // La marque de l'usure (#45) : trois crans qui se vident, puissant, utile, décoratif ; inerte, un
  // caillou. Elle n'est que dessinée : le mot qui l'accompagne la dit, au lecteur d'écran aussi. Un
  // changement s'anime, sauf sans mouvement : à mi-course de la descente, un cran se vide.
  import type { Niveau } from "../logique/artefacts";
  import { CRANS } from "./inventaire";

  let { niveau }: { niveau: Niveau } = $props();
</script>

<span class="usure" class:caillou={niveau === "inerte"} aria-hidden="true" data-test="usure">
  {#each [0, 1, 2] as i (i)}
    <span class="cran" class:plein={i < CRANS[niveau]}></span>
  {/each}
</span>

<style>
  .usure {
    position: relative;
    display: inline-flex;
    flex: none;
    gap: 2px;
  }
  .cran {
    box-sizing: border-box;
    width: 4px;
    height: 9px;
    border: 1px solid #8c8c8c;
    transition:
      background-color 400ms,
      border-color 400ms,
      opacity 400ms;
  }
  .cran.plein {
    background: #d6d6d6;
    border-color: #d6d6d6;
  }
  /* Le caillou : les crans s'effacent, une pierre ronde prend leur place. */
  .usure::after {
    content: "";
    position: absolute;
    inset: 1px 1px 0;
    background: #6c6c6c;
    border-radius: 50% 45% 40% 55% / 60% 55% 45% 40%;
    opacity: 0;
    transition: opacity 400ms;
  }
  .caillou .cran {
    opacity: 0;
  }
  .caillou::after {
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .cran,
    .usure::after {
      transition: none;
    }
  }
</style>

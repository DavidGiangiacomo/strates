<script lang="ts">
  // Le retour du joueur (#58 ; bible, § 10), sous le bandeau et dans sa palette. Le rappel d'abord,
  // trois lignes au plus : le lieu, la dernière ligne que la couche a écrite, puis où en est son seuil.
  // Ensuite, le résumé de l'absence. La strate vit dessous, jusqu'à « reprendre ».
  import { TEXTES_REPRISE as T, type MessageReprise } from "./reprise";

  let { message, onreprendre }: { message: MessageReprise; onreprendre: () => void } = $props();
</script>

<section class="reprise" role="status" aria-label={T.titre} data-test="reprise">
  {#if message.rappel.length > 0}
    <div class="rappel" data-test="rappel">
      {#each message.rappel as ligne, i (i)}
        <p class:lieu={i === 0}>{ligne}</p>
      {/each}
    </div>
  {/if}
  {#if message.absence.length > 0}
    <div class="absence" data-test="absence">
      {#each message.absence as ligne, i (i)}
        <p>{ligne}</p>
      {/each}
    </div>
  {/if}
  <button onclick={onreprendre} data-test="reprendre">{T.reprendre}</button>
</section>

<style>
  p {
    margin: 0 0 4px;
  }
  /* Le lieu, comme le bandeau l'écrit. */
  .lieu {
    font-weight: 600;
    color: #f2f2f2;
  }
  /* Après le rappel, l'absence se lit en second. */
  .rappel + .absence {
    margin-top: 8px;
    color: #a6a6a6;
  }
  button {
    margin-top: 4px;
    padding: 1px 10px;
    font: inherit;
    color: inherit;
    cursor: pointer;
    background: transparent;
    border: 1px solid #5c5c5c;
    border-radius: 2px;
  }
  button:hover {
    border-color: #8c8c8c;
  }
  button:focus-visible {
    outline: 1px solid #f2f2f2;
    outline-offset: 1px;
  }
</style>

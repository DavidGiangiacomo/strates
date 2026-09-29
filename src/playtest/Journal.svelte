<script lang="ts">
  // Le panneau du journal de session, pour l'observateur (#26 ; docs/playtest-mvp.md, § 3 et § 9).
  // Il n'existe que si le journal est actif : un petit bouton en bas à gauche, que le testeur peut
  // ignorer. Il exporte le journal, en donne l'analyse pour la fiche d'observation, et l'arrête.
  import { analyser, resumer } from "./analyse";
  import type { JournalSession } from "./journal";
  import { arreterJournal, telechargerJournal } from "./plateforme";

  let { journal, zone }: { journal: JournalSession; zone: Storage } = $props();

  let ouvert = $state(false);
  let evenements = $state(0);
  let actif = $state(true);
  let analyse = $state<string[] | null>(null);

  // Le journal n'est pas réactif : on relit son compte chaque seconde, tant que le panneau est ouvert.
  $effect(() => {
    if (!ouvert) return;
    const relire = () => {
      evenements = journal.evenements.length;
      actif = journal.actif;
    };
    relire();
    const id = setInterval(relire, 1000);
    return () => clearInterval(id);
  });

  function arreter(): void {
    arreterJournal(journal, zone);
    actif = false;
  }
</script>

<button class="bascule" onclick={() => (ouvert = !ouvert)} data-test="journal-session">
  journal {journal.meta.testeur}
</button>

{#if ouvert}
  <aside class="panneau" aria-label="Journal de session">
    <p>
      Testeur <strong>{journal.meta.testeur}</strong> · {evenements} événements{journal.meta.tronque
        ? " · tronqué"
        : ""} · {actif ? "actif" : "arrêté"}
    </p>
    <p>
      <button onclick={() => telechargerJournal(journal)}>Exporter</button>
      <button onclick={() => (analyse = resumer(analyser(journal.exporter())))}>Analyser</button>
      {#if actif}
        <button onclick={arreter}>Arrêter le journal</button>
      {/if}
    </p>
    {#if analyse}
      <pre data-test="analyse">{analyse.join("\n")}</pre>
    {/if}
  </aside>
{/if}

<style>
  .bascule {
    position: fixed;
    left: 8px;
    bottom: 8px;
    z-index: 30;
    padding: 2px 8px;
    font:
      11px/1.2 ui-monospace,
      monospace;
    opacity: 0.5;
  }
  .panneau {
    position: fixed;
    left: 8px;
    bottom: 36px;
    z-index: 30;
    max-width: min(560px, calc(100vw - 16px));
    padding: 8px 12px;
    font:
      12px/1.4 ui-monospace,
      monospace;
    color: #222;
    background: #f7f7f2;
    border: 1px solid #bbb;
    box-shadow: 0 2px 6px rgb(0 0 0 / 0.08);
  }
  p {
    margin: 4px 0;
  }
  button {
    font: inherit;
    padding: 1px 6px;
  }
  pre {
    margin: 6px 0 0;
    white-space: pre-wrap;
  }
</style>

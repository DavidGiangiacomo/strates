<script lang="ts">
  // Le menu système (#48), ouvert depuis le bout du bandeau : un volet sous lui, dans sa palette, à
  // droite. Le son et la taille du texte ; la sauvegarde, à exporter, copier ou importer (D-005) ;
  // recommencer, en deux temps, avec l'export proposé ; la version et les crédits. La strate continue
  // de vivre dessous.
  import { onMount, tick } from "svelte";
  import { TAILLES_TEXTE, type TailleTexte } from "../plateforme/affichage";
  import { pourcentage, TEXTES_MENU as T, texteVersion } from "./menu";

  let {
    volume,
    muet,
    taille,
    version,
    build,
    onvolume,
    onmuet,
    ontaille,
    onexporter,
    oncopier,
    onimporter,
    onrecommencer,
    onfermer,
  }: {
    /** Le volume global, de 0 à 1. */
    volume: number;
    muet: boolean;
    taille: TailleTexte;
    version: string;
    build: string;
    onvolume: (volume: number) => void;
    onmuet: (muet: boolean) => void;
    ontaille: (taille: TailleTexte) => void;
    /** Enregistre la sauvegarde dans un fichier. */
    onexporter: () => void;
    /** Copie la sauvegarde dans le presse-papiers ; échoue si le navigateur refuse. */
    oncopier: () => Promise<void>;
    /** Importe le texte d'un fichier : rend ce qui ne va pas, ou rien, et la partie importée se charge. */
    onimporter: (texte: string) => Promise<string | null>;
    /** Remplace la partie par une nouvelle. */
    onrecommencer: () => void;
    onfermer: () => void;
  } = $props();

  let panneau: HTMLElement | undefined = $state();
  let fichier: HTMLInputElement | undefined = $state();
  let garder: HTMLButtonElement | undefined = $state();
  let message = $state<string | null>(null);
  let confirmation = $state(false);
  onMount(() => panneau?.focus());

  async function copier(): Promise<void> {
    try {
      await oncopier();
      message = T.copiee;
    } catch {
      message = T.copieRefusee;
    }
  }

  async function importer(): Promise<void> {
    const champ = fichier;
    const choisi = champ?.files?.[0];
    if (!champ || !choisi) return;
    message = await onimporter(await choisi.text());
    // Le même fichier peut être choisi de nouveau.
    champ.value = "";
  }

  // Recommencer se confirme. Le focus va à ce qui ne détruit rien : garder la partie.
  async function demanderConfirmation(): Promise<void> {
    confirmation = true;
    message = null;
    await tick();
    garder?.focus();
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape") onfermer();
  }}
/>

<div
  class="menu"
  role="dialog"
  aria-labelledby="menu-titre"
  tabindex="-1"
  bind:this={panneau}
  data-test="menu"
>
  <header>
    <h2 id="menu-titre">{T.titre}</h2>
    <button class="fermer" onclick={onfermer}>{T.fermer}</button>
  </header>

  <section aria-labelledby="menu-son">
    <h3 id="menu-son">{T.son}</h3>
    <label class="ligne">
      <span>{T.volume} <strong>{pourcentage(volume)}</strong></span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        oninput={(e) => onvolume(Number(e.currentTarget.value))}
        data-test="volume"
      />
    </label>
    <label class="ligne case">
      <input
        type="checkbox"
        checked={muet}
        onchange={(e) => onmuet(e.currentTarget.checked)}
        data-test="muet"
      />
      {T.muet}
    </label>
  </section>

  <section>
    <fieldset class="tailles">
      <legend>{T.texte}</legend>
      {#each TAILLES_TEXTE as t (t)}
        <label class:choisie={t === taille}>
          <input
            type="radio"
            name="taille-texte"
            value={t}
            checked={t === taille}
            onchange={() => ontaille(t)}
          />{pourcentage(t)}
        </label>
      {/each}
    </fieldset>
  </section>

  <section aria-labelledby="menu-sauvegarde">
    <h3 id="menu-sauvegarde">{T.sauvegarde}</h3>
    <p class="actions">
      <button onclick={onexporter} data-test="exporter">{T.exporter}</button>
      <button onclick={copier} data-test="copier">{T.copier}</button>
      <button onclick={() => fichier?.click()} data-test="importer">{T.importer}</button>
      <input
        class="fichier"
        type="file"
        accept=".json,application/json"
        tabindex="-1"
        aria-hidden="true"
        bind:this={fichier}
        onchange={importer}
      />
    </p>
    {#if message}
      <p class="message" role="status" data-test="message">{message}</p>
    {/if}
    {#if confirmation}
      <div class="confirmation" role="group" aria-labelledby="menu-avertissement">
        <p id="menu-avertissement">{T.avertissement}</p>
        <p class="actions">
          <button onclick={onexporter}>{T.exporterDAbord}</button>
          <button class="grave" onclick={onrecommencer} data-test="confirmer">
            {T.recommencer}
          </button>
          <button bind:this={garder} onclick={() => (confirmation = false)} data-test="garder">
            {T.garder}
          </button>
        </p>
      </div>
    {:else}
      <p class="actions">
        <button onclick={demanderConfirmation} data-test="recommencer">{T.recommencer}</button>
      </p>
    {/if}
  </section>

  <footer>
    <p data-test="version">{texteVersion(version, build)}</p>
    <p>{T.credits}</p>
  </footer>
</div>

<style>
  /* La palette du bandeau, dépliée sous son dernier bouton : ni la surface, ni les caves. */
  .menu {
    position: fixed;
    top: 24px;
    right: 0;
    z-index: 7;
    box-sizing: border-box;
    width: min(calc(100vw / var(--zoom, 1)), 22rem);
    max-height: calc(100vh / var(--zoom, 1) - 24px);
    overflow-y: auto;
    font:
      12px/1.4 system-ui,
      sans-serif;
    color: #d6d6d6;
    background: #1e1e1e;
    border: 1px solid #3c3c3c;
    border-right: none;
    outline: none;
  }
  header {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    padding: 10px 12px;
    border-bottom: 1px solid #3c3c3c;
  }
  h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: #f2f2f2;
  }
  section {
    padding: 4px 12px 10px;
    border-bottom: 1px solid #3c3c3c;
  }
  h3,
  legend {
    margin: 6px 0 6px;
    padding: 0;
    font-size: 12px;
    font-weight: 400;
    color: #8c8c8c;
  }
  strong {
    font-weight: 600;
    color: #f2f2f2;
    font-variant-numeric: tabular-nums;
  }
  .ligne {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 4px 0;
  }
  .ligne span {
    flex: 1;
  }
  input[type="range"] {
    width: 9rem;
    accent-color: #d6d6d6;
  }
  .case input {
    margin: 0;
    accent-color: #d6d6d6;
  }
  fieldset {
    margin: 0;
    padding: 0;
    border: none;
  }
  .tailles label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-inline-end: 12px;
    cursor: pointer;
  }
  .tailles input {
    margin: 0;
    accent-color: #d6d6d6;
  }
  .choisie {
    color: #f2f2f2;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 6px 0;
  }
  button {
    height: 20px;
    padding: 0 10px;
    font: inherit;
    line-height: 1;
    color: inherit;
    cursor: pointer;
    background: transparent;
    border: 1px solid #5c5c5c;
    border-radius: 2px;
  }
  button:hover {
    border-color: #8c8c8c;
  }
  button:focus-visible,
  input:focus-visible {
    outline: 1px solid #f2f2f2;
    outline-offset: 1px;
  }
  .fermer {
    margin-inline-start: auto;
  }
  /* Le geste qui efface : le seul cadre clair du menu. */
  .grave {
    color: #f2f2f2;
    border-color: #b0b0b0;
  }
  .fichier {
    display: none;
  }
  .message {
    margin: 4px 0;
    color: #a6a6a6;
  }
  .confirmation p:first-child {
    margin: 8px 0 2px;
    color: #f2f2f2;
  }
  footer {
    padding: 8px 12px 10px;
    color: #8c8c8c;
  }
  footer p {
    margin: 2px 0;
  }
</style>

<script lang="ts">
  // L'inventaire des objets d'en haut (#45 ; docs/artefacts.md, § 3), ouvert depuis le compteur du
  // bandeau : un volet sous lui, dans sa palette. Les objets y sont rangés par couche d'origine, de la
  // surface vers le bas, chacun avec son nom et son usure. Le nom est celui d'en haut tant que la
  // strate d'en dessous ne l'a pas nommé. L'inventaire ne dit pas ce que fait un objet : la découverte
  // reste dans la strate. La strate continue de vivre dessous.
  import { onMount } from "svelte";
  import type { ObjetInventaire } from "../logique/artefacts";
  import { NOMS_STRATES } from "./fouille";
  import { etiquette, NIVEAUX, parCouche, TEXTES_INVENTAIRE } from "./inventaire";
  import Usure from "./Usure.svelte";

  let { objets, onfermer }: { objets: readonly ObjetInventaire[]; onfermer: () => void } = $props();

  const couches = $derived(parCouche(objets));

  let panneau: HTMLElement | undefined = $state();
  onMount(() => panneau?.focus());
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape") onfermer();
  }}
/>

<div
  class="inventaire"
  role="dialog"
  aria-labelledby="inventaire-titre"
  tabindex="-1"
  bind:this={panneau}
  data-test="inventaire"
>
  <header>
    <h2 id="inventaire-titre">{TEXTES_INVENTAIRE.titre}</h2>
    <button class="fermer" onclick={onfermer}>{TEXTES_INVENTAIRE.fermer}</button>
  </header>
  {#each couches as couche (couche.origine)}
    <section aria-labelledby="inventaire-{couche.origine}">
      <h3 id="inventaire-{couche.origine}">{NOMS_STRATES[couche.origine]}</h3>
      <ul>
        {#each couche.objets as objet (objet.id)}
          <li class:inerte={objet.niveau === "inerte"} data-test="inventaire-{objet.id}">
            <Usure niveau={objet.niveau} />
            <span class="nom">{etiquette(objet.nom)}<span class="lecteur">,</span></span>
            <span class="mot">{NIVEAUX[objet.niveau]}</span>
          </li>
        {/each}
      </ul>
    </section>
  {:else}
    <p class="vide">{TEXTES_INVENTAIRE.vide}</p>
  {/each}
</div>

<style>
  /* La palette du bandeau, dépliée sous son compteur : ni la surface, ni les caves. */
  .inventaire {
    position: fixed;
    top: 24px;
    left: 0;
    z-index: 7;
    box-sizing: border-box;
    width: min(calc(100vw / var(--zoom, 1)), 26rem);
    max-height: calc(100vh / var(--zoom, 1) - 24px);
    overflow-y: auto;
    padding-bottom: 6px;
    font:
      12px/1.4 system-ui,
      sans-serif;
    color: #d6d6d6;
    background: #1e1e1e;
    border: 1px solid #3c3c3c;
    border-left: none;
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
  .fermer {
    margin-inline-start: auto;
    height: 18px;
    padding: 0 10px;
    font: inherit;
    line-height: 1;
    color: inherit;
    cursor: pointer;
    background: transparent;
    border: 1px solid #5c5c5c;
    border-radius: 2px;
  }
  .fermer:hover {
    border-color: #8c8c8c;
  }
  .fermer:focus-visible {
    outline: 1px solid #f2f2f2;
    outline-offset: 1px;
  }
  h3 {
    margin: 10px 12px 4px;
    font-size: 12px;
    font-weight: 400;
    color: #8c8c8c;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 2px 12px;
  }
  .nom {
    flex: 1;
    min-width: 0;
    color: #f2f2f2;
  }
  .mot {
    color: #a6a6a6;
  }
  /* Inerte, l'objet n'est plus qu'un caillou : son nom passe au gris. */
  .inerte .nom,
  .inerte .mot {
    color: #8c8c8c;
  }
  .vide {
    margin: 10px 12px 4px;
    color: #a6a6a6;
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
</style>

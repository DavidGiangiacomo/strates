<script lang="ts">
  // Le graphe de dépendances de la strate courante (#76 ; docs/comprehension.md, § 5), ouvert depuis
  // le bandeau à partir de κ = 50. Il montre la forme de la strate, pas ses mots : un élément encore
  // opaque y garde ses glyphes. Au-delà de κ = 50, les formules réelles s'y écrivent une à une, sur
  // les nœuds déjà compris (#77). Dans la palette du bandeau : il appartient au noyau, pas à la
  // strate. La strate continue de vivre dessous.
  import { onMount } from "svelte";
  import type { Formule, GrapheDependances } from "../logique/types";
  import {
    DIMENSIONS,
    disposer,
    formulesAffichees,
    nomCourt,
    phrasesGraphe,
    TEXTES_GRAPHE,
    voisinsDe,
  } from "./graphe";

  let {
    graphe,
    formules = [],
    kappa = 0,
    nom,
    o,
    cleLisible = () => true,
    onfermer,
  }: {
    /** Le graphe de la strate, dans son état du moment. */
    graphe: GrapheDependances;
    /** Ses formules réelles, de la plus simple à la plus profonde. */
    formules?: readonly Formule[];
    /** La Compréhension : elle règle combien de formules sont accessibles. */
    kappa?: number;
    /** Le nom de la strate, tel que le noyau le montre. */
    nom: string;
    /** Le texte d'une clé, à travers la couche d'opacité. */
    o: (cle: string) => string;
    /** Une clé est-elle lisible ? Un nœud ne montre sa formule qu'une fois compris. */
    cleLisible?: (cle: string) => boolean;
    onfermer: () => void;
  } = $props();

  const D = DIMENSIONS;

  // La disposition ne se refait que si le graphe ou ses formules changent : la strate, elle, avance à
  // chaque tick.
  const signature = $derived(JSON.stringify(graphe));
  const stable = $derived(JSON.parse(signature) as GrapheDependances);
  const affichees = $derived(formulesAffichees(formules, kappa, stable, cleLisible));
  const disposition = $derived(disposer(stable, affichees));
  const phrases = $derived(phrasesGraphe(stable, o, affichees));

  // Au survol d'un nœud, ses liens s'éclairent, et ce qui ne le touche pas s'efface.
  let survole: string | null = $state(null);
  const proches = $derived(survole === null ? null : voisinsDe(stable, survole));

  let panneau: HTMLElement | undefined = $state();
  onMount(() => panneau?.focus());
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape") onfermer();
  }}
/>

<div
  class="graphe"
  role="dialog"
  aria-labelledby="graphe-titre"
  tabindex="-1"
  bind:this={panneau}
  data-test="graphe"
>
  <header>
    <h2 id="graphe-titre">{TEXTES_GRAPHE.titre}</h2>
    <p class="strate">{nom}</p>
    <button class="fermer" onclick={onfermer}>{TEXTES_GRAPHE.fermer}</button>
  </header>
  <div class="cadre">
    <svg
      width={disposition.largeur}
      height={disposition.hauteur}
      viewBox="0 0 {disposition.largeur} {disposition.hauteur}"
      aria-hidden="true"
    >
      <defs>
        <marker
          id="graphe-fleche"
          viewBox="0 0 8 8"
          refX="8"
          refY="4"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L8,4 L0,8 z" />
        </marker>
      </defs>
      {#each disposition.liens as l (`${l.de}>${l.vers}`)}
        <path
          class="lien"
          class:retour={l.retour}
          class:actif={survole !== null && (l.de === survole || l.vers === survole)}
          class:eteint={survole !== null && l.de !== survole && l.vers !== survole}
          d={l.chemin}
          marker-end="url(#graphe-fleche)"
          data-test="lien-{l.de}-{l.vers}"
        />
      {/each}
      {#each disposition.noeuds as n (n.id)}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <g
          class="noeud"
          class:eteint={proches !== null && !proches.has(n.id)}
          transform="translate({n.x} {n.y})"
          onmouseenter={() => (survole = n.id)}
          onmouseleave={() => (survole = null)}
          data-test="noeud-{n.id}"
        >
          <rect width={n.largeur} height={n.hauteur} rx="2" />
          <text class="nom" x={n.largeur / 2} y={D.hauteur / 2}>{nomCourt(o(n.cle))}</text>
          <!-- Ses formules, sous son nom : une carte. -->
          {#if n.formules.length > 0}
            <line class="filet" x1="0" y1={D.hauteur} x2={n.largeur} y2={D.hauteur} />
          {/if}
          {#each n.formules as lignes, i (i)}
            <g class="formule" data-test="formule-{n.id}">
              {#each lignes as ligne, j (j)}
                <text x={D.interieur} y={ligne.y}>{ligne.texte}</text>
              {/each}
            </g>
          {/each}
        </g>
      {/each}
    </svg>
  </div>
  <!-- Pour les lecteurs d'écran : le graphe en phrases. -->
  <ul class="phrases">
    {#each phrases as phrase (phrase)}
      <li>{phrase}</li>
    {/each}
  </ul>
</div>

<style>
  /* La palette du bandeau, ouverte sous lui : ni la surface, ni les caves. */
  .graphe {
    position: fixed;
    inset: 24px 0 0;
    z-index: 7;
    display: flex;
    flex-direction: column;
    font:
      12px/1.4 system-ui,
      sans-serif;
    color: #d6d6d6;
    background: #1e1e1e;
    outline: none;
  }
  header {
    display: flex;
    align-items: baseline;
    gap: 1rem;
    padding: 10px 12px;
    border-top: 1px solid #3c3c3c;
    border-bottom: 1px solid #3c3c3c;
  }
  h2 {
    margin: 0;
    font-size: 13px;
    font-weight: 600;
    color: #f2f2f2;
  }
  .strate {
    margin: 0;
    color: #8c8c8c;
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
  /* Un grand graphe défile ; sur un téléphone, de côté. */
  .cadre {
    flex: 1;
    overflow: auto;
    padding: 12px;
  }
  svg {
    display: block;
    margin: 0 auto;
  }
  .lien {
    fill: none;
    stroke: #6c6c6c;
    stroke-width: 1.2;
    transition: opacity 120ms;
  }
  .lien.retour {
    stroke-dasharray: 4 3;
  }
  .lien.actif {
    stroke: #f2f2f2;
  }
  marker path {
    fill: #8c8c8c;
  }
  .noeud rect {
    fill: #262626;
    stroke: #5c5c5c;
  }
  .noeud:hover rect {
    stroke: #f2f2f2;
  }
  .nom {
    font:
      12px system-ui,
      sans-serif;
    fill: #d6d6d6;
    text-anchor: middle;
    dominant-baseline: central;
  }
  .filet {
    stroke: #3c3c3c;
  }
  /* Les formules réelles, en chasse fixe : la disposition compte ses lignes en signes. */
  .formule text {
    font:
      11px ui-monospace,
      "SFMono-Regular",
      Menlo,
      Consolas,
      "Liberation Mono",
      monospace;
    fill: #a6a6a6;
    dominant-baseline: central;
  }
  .eteint {
    opacity: 0.3;
  }
  .phrases {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  @media (prefers-reduced-motion: reduce) {
    .lien {
      transition: none;
    }
  }
</style>

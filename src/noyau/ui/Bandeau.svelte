<script lang="ts">
  // Le bandeau commun (§12) : 24 px, identique dans les huit strates, le seul élément stable du jeu.
  // Le bouton « creuser » a le même aspect avant et après le seuil : seule sa réponse change
  // (docs/strates/strate-1.md, § 4). À partir de κ = 50, le bouton « graphe » ouvre le graphe de
  // dépendances de la strate (docs/comprehension.md, § 5).
  import type { NumeroStrate } from "../logique/types";
  import { TEXTES_GRAPHE } from "./graphe";

  let {
    profondeur,
    artefacts,
    kappa,
    oncreuser,
    ongraphe,
    grapheOuvert = false,
  }: {
    profondeur: NumeroStrate;
    artefacts: readonly string[];
    /** La Compréhension, de 0 à 100 : un pourcentage entier (docs/comprehension.md, § 7). */
    kappa: number;
    oncreuser: () => void;
    /** Ouvre ou referme le graphe ; sans elle, pas de bouton : κ < 50, ou la strate n'en a pas. */
    ongraphe?: () => void;
    grapheOuvert?: boolean;
  } = $props();

  let barre: HTMLElement | undefined = $state();
  let boutonGraphe: HTMLButtonElement | undefined = $state();

  /** Le graphe refermé, le focus revient à son bouton. */
  export function focaliserGraphe(): void {
    boutonGraphe?.focus();
  }

  const SECOUSSE = [
    { transform: "translateX(0)" },
    { transform: "translateX(-2px)" },
    { transform: "translateX(2px)" },
    { transform: "translateX(-1px)" },
    { transform: "translateX(0)" },
  ];
  // Sans mouvement : un bref assombrissement.
  const ATTENUATION = [{ opacity: 1 }, { opacity: 0.6 }, { opacity: 1 }];

  /** Le sol résiste : un bref tressaillement, sans texte. Le coup sourd est joué par le passage. */
  export function resister(): void {
    const sansMouvement =
      typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    barre?.animate?.(sansMouvement ? ATTENUATION : SECOUSSE, { duration: 250, easing: "ease-out" });
  }
</script>

<header class="bandeau" bind:this={barre} data-test="bandeau">
  <span data-test="profondeur">Profondeur <strong>{profondeur}</strong></span>
  <span data-test="artefacts">Artefacts <strong>{artefacts.length}</strong></span>
  <span data-test="comprehension"
    >Compréhension <strong>{`${Math.round(kappa)}\u202f%`}</strong></span
  >
  {#if ongraphe}
    <button
      class="graphe"
      bind:this={boutonGraphe}
      aria-expanded={grapheOuvert}
      onclick={ongraphe}
      data-test="ouvrir-graphe">{TEXTES_GRAPHE.ouvrir}</button
    >
  {/if}
  <button class="creuser" onclick={oncreuser}>creuser</button>
</header>

<style>
  .bandeau {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    box-sizing: border-box;
    height: 24px;
    padding: 0 12px;
    font:
      12px/1 system-ui,
      sans-serif;
    font-variant-numeric: tabular-nums;
    color: #d6d6d6;
    background: #1e1e1e;
  }
  strong {
    font-weight: 600;
    color: #f2f2f2;
  }
  .creuser {
    margin-inline-start: auto;
  }
  .creuser,
  .graphe {
    height: 18px;
    padding: 0 10px;
    font: inherit;
    color: inherit;
    background: transparent;
    border: 1px solid #5c5c5c;
    border-radius: 2px;
    cursor: pointer;
  }
  .creuser:hover,
  .graphe:hover,
  .graphe[aria-expanded="true"] {
    border-color: #8c8c8c;
  }
  .creuser:focus-visible,
  .graphe:focus-visible {
    outline: 1px solid #f2f2f2;
    outline-offset: 1px;
  }
</style>

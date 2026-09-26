<script lang="ts">
  // Le bandeau commun (§12) : 24 px, identique dans les huit strates, le seul élément stable du jeu.
  // Le bouton « creuser » a le même aspect avant et après le seuil : seule sa réponse change
  // (docs/strates/strate-1.md, § 4).
  import type { NumeroStrate } from "../logique/types";

  let {
    profondeur,
    artefacts,
    oncreuser,
  }: {
    profondeur: NumeroStrate;
    artefacts: readonly string[];
    oncreuser: () => void;
  } = $props();

  let barre: HTMLElement | undefined = $state();

  const SECOUSSE = [
    { transform: "translateX(0)" },
    { transform: "translateX(-2px)" },
    { transform: "translateX(2px)" },
    { transform: "translateX(-1px)" },
    { transform: "translateX(0)" },
  ];
  // Sans mouvement : un bref assombrissement.
  const ATTENUATION = [{ opacity: 1 }, { opacity: 0.6 }, { opacity: 1 }];

  /** Le sol résiste : un bref tressaillement, sans texte. Le son sourd viendra avec le moteur audio (#46). */
  export function resister(): void {
    const sansMouvement =
      typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    barre?.animate?.(sansMouvement ? ATTENUATION : SECOUSSE, { duration: 250, easing: "ease-out" });
  }
</script>

<header class="bandeau" bind:this={barre} data-test="bandeau">
  <span data-test="profondeur">Profondeur <strong>{profondeur}</strong></span>
  <span data-test="artefacts">Artefacts <strong>{artefacts.length}</strong></span>
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
    height: 18px;
    padding: 0 10px;
    font: inherit;
    color: inherit;
    background: transparent;
    border: 1px solid #5c5c5c;
    border-radius: 2px;
    cursor: pointer;
  }
  .creuser:hover {
    border-color: #8c8c8c;
  }
  .creuser:focus-visible {
    outline: 1px solid #f2f2f2;
    outline-offset: 1px;
  }
</style>

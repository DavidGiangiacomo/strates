<script lang="ts">
  // Le bandeau commun (§12) : 24 px, identique dans les huit strates, le seul élément stable du jeu.
  // Le bouton « creuser » a le même aspect avant et après le seuil : seule sa réponse change
  // (docs/strates/strate-1.md, § 4). Le compteur des artefacts ouvre l'inventaire des objets (#45). À
  // partir de κ = 50, le bouton « graphe » ouvre le graphe de dépendances de la strate
  // (docs/comprehension.md, § 5). Au bout, le bouton « menu » ouvre le menu système (#48).
  import type { NumeroStrate } from "../logique/types";
  import { TEXTES_GRAPHE } from "./graphe";
  import { TEXTES_MENU } from "./menu";

  let {
    profondeur,
    artefacts,
    kappa,
    oncreuser,
    oninventaire,
    inventaireOuvert = false,
    ongraphe,
    grapheOuvert = false,
    onmenu,
    menuOuvert = false,
  }: {
    profondeur: NumeroStrate;
    artefacts: readonly string[];
    /** La Compréhension, de 0 à 100 : un pourcentage entier (docs/comprehension.md, § 7). */
    kappa: number;
    oncreuser: () => void;
    /** Ouvre ou referme l'inventaire ; sans elle, pendant la descente, le compteur ne s'ouvre pas. */
    oninventaire?: () => void;
    inventaireOuvert?: boolean;
    /** Ouvre ou referme le graphe ; sans elle, pas de bouton : κ < 50, ou la strate n'en a pas. */
    ongraphe?: () => void;
    grapheOuvert?: boolean;
    /** Ouvre ou referme le menu ; sans elle, pendant la descente, le bouton ne s'ouvre pas. */
    onmenu?: () => void;
    menuOuvert?: boolean;
  } = $props();

  let barre: HTMLElement | undefined = $state();
  let boutonInventaire: HTMLButtonElement | undefined = $state();
  let boutonGraphe: HTMLButtonElement | undefined = $state();
  let boutonMenu: HTMLButtonElement | undefined = $state();

  /** L'inventaire refermé, le focus revient au compteur. */
  export function focaliserInventaire(): void {
    boutonInventaire?.focus();
  }

  /** Le graphe refermé, le focus revient à son bouton. */
  export function focaliserGraphe(): void {
    boutonGraphe?.focus();
  }

  /** Le menu refermé, le focus revient à son bouton. */
  export function focaliserMenu(): void {
    boutonMenu?.focus();
  }

  /** Où est le compteur des artefacts : les objets qui arrivent y rejoignent leur poche. */
  export function poche(): DOMRect | null {
    return boutonInventaire?.getBoundingClientRect() ?? null;
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
  <button
    class="artefacts"
    bind:this={boutonInventaire}
    aria-expanded={inventaireOuvert}
    disabled={!oninventaire}
    onclick={oninventaire}
    data-test="artefacts">Artefacts <strong>{artefacts.length}</strong></button
  >
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
  <button class="creuser" onclick={oncreuser} data-test="creuser">creuser</button>
  <button
    class="menu"
    bind:this={boutonMenu}
    aria-expanded={menuOuvert}
    disabled={!onmenu}
    onclick={onmenu}
    data-test="ouvrir-menu">{TEXTES_MENU.ouvrir}</button
  >
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
  /*
   * Le compteur se lit comme les autres, à sa place : son cadre, plus discret que celui des boutons
   * d'action, dit seulement qu'il s'ouvre. Il garde son aspect pendant la descente, où il ne s'ouvre pas.
   */
  .artefacts {
    height: 18px;
    margin: 0 -5px;
    padding: 0 4px;
    font: inherit;
    color: inherit;
    background: transparent;
    white-space: nowrap;
    border: 1px solid #3c3c3c;
    border-radius: 2px;
    cursor: pointer;
  }
  .artefacts:disabled {
    cursor: default;
  }
  .artefacts:enabled:hover,
  .artefacts[aria-expanded="true"] {
    border-color: #8c8c8c;
  }
  .creuser,
  .graphe,
  .menu {
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
  .graphe[aria-expanded="true"],
  .menu:enabled:hover,
  .menu[aria-expanded="true"] {
    border-color: #8c8c8c;
  }
  /* Le menu garde son aspect pendant la descente, où il ne s'ouvre pas. */
  .menu:disabled {
    cursor: default;
  }
  .creuser:focus-visible,
  .artefacts:focus-visible,
  .graphe:focus-visible,
  .menu:focus-visible {
    outline: 1px solid #f2f2f2;
    outline-offset: 1px;
  }
  /*
   * Sur un téléphone, le bandeau se resserre. S'il déborde encore, quand « graphe » s'y ajoute, il
   * défile lui-même au lieu d'élargir la page : « menu » reste toujours atteignable.
   */
  @media (max-width: 600px) {
    .bandeau {
      gap: 0.6rem;
      padding: 0 6px;
      overflow-x: auto;
      overflow-y: hidden;
      font-size: 11px;
      scrollbar-width: none;
    }
    .artefacts {
      margin: 0 -3px;
    }
    .creuser,
    .graphe,
    .menu {
      flex: none;
      padding: 0 6px;
    }
  }
</style>

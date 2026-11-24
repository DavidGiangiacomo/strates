<script lang="ts">
  // Une crue en petite coupe, pour l'aide (fiche, § 11) : le fleuve à gauche, le bassin et son
  // limon, la rive à droite et un creux fermé d'une levée. Trois moments : l'eau monte, trouble ;
  // elle se repose derrière la levée et s'éclaircit ; elle se retire, et la couche reste.
  let { moment }: { moment: "monte" | "repose" | "laisse" } = $props();

  /** Le fleuve monte avec la crue, et redescend après elle. */
  const fleuve = $derived(moment === "monte" ? 52 : moment === "repose" ? 42 : 70);
</script>

<svg viewBox="0 22 160 74" aria-hidden="true" data-test="crue-dessinee">
  {#if moment === "repose"}
    <defs>
      <linearGradient id="lit-aide-repos" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0.35" class="claire" />
        <stop offset="0.75" class="trouble" />
      </linearGradient>
    </defs>
  {/if}
  <rect class="fleuve" x="0" y={fleuve} width="16" height={96 - fleuve} />
  <rect class="limon" x="16" y="74" width="96" height="22" />
  <rect class="limon-2" x="16" y="79" width="96" height="4" />
  <rect class="limon-2" x="16" y="87" width="96" height="4" />
  <rect class="rive" x="112" y="30" width="48" height="66" />
  {#each [36, 48, 82, 88] as b (b)}
    <rect class="rive-2" x="112" y={b} width="48" height="3" />
  {/each}
  <rect class="roche" x="0" y="92" width="160" height="4" />
  <rect class="poche" x="112" y="62" width="26" height="12" />
  {#if moment === "monte"}
    <rect class="eau-trouble" x="16" y="63" width="96" height="11" />
    <line class="fil" x1="16" x2="112" y1="63" y2="63" />
  {:else if moment === "repose"}
    <rect class="eau" x="16" y="50" width="96" height="24" fill="url(#lit-aide-repos)" />
    <rect class="eau" x="116" y="62" width="22" height="12" fill="url(#lit-aide-repos)" />
    <line class="fil" x1="16" x2="112" y1="50" y2="50" />
  {:else}
    <rect class="nouvelle" x="116" y="69" width="22" height="5" />
  {/if}
  <rect class="levee" x="108" y="58" width="8" height="16" rx="3" />
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .fleuve {
    fill: var(--fleuve);
  }
  .limon {
    fill: var(--limon);
  }
  .limon-2 {
    fill: var(--limon-2);
  }
  .rive {
    fill: var(--rive);
  }
  .rive-2 {
    fill: var(--rive-2);
  }
  .roche,
  .poche {
    fill: var(--roche);
  }
  .eau-trouble {
    fill: var(--trouble);
    opacity: 0.85;
  }
  .eau {
    opacity: 0.8;
  }
  .fil {
    stroke: var(--fil);
    stroke-width: 0.8;
  }
  .claire {
    stop-color: var(--eau);
  }
  .trouble {
    stop-color: var(--trouble);
  }
  .nouvelle {
    fill: var(--retenue);
    stroke: var(--encre);
    stroke-width: 0.8;
  }
  .levee {
    fill: var(--levee);
  }
</style>

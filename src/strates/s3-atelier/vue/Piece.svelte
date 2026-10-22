<script lang="ts">
  // Une pièce vue de dessus, ou le ressort (fiche, § 6). Le corps, en laiton quand elle tourne et en
  // acier quand elle ne bouge pas ; une hachure quand elle tourne ; sur chaque côté, ses dents ou un
  // bord lisse ; un trait en zigzag là où une gêne s'est montrée. Deux côtés dentés face à face
  // s'emboîtent : leurs dents passent la limite des cases. Au centre, un moyeu à trois rayons tourne
  // autour du repère, dans le sens contraire de la pièce qui l'entraîne, et par saccades quand elle
  // frotte ; au ressort, un spiral dans son barillet. Le moyeu est un calque à part : sa rotation ne
  // redessine rien. Sans mouvement, rien ne tourne, et la hachure suffit.
  import type { PieceAtelier } from "../logique/etat";
  import { COTES, dente, largeur, type EtatPiece } from "../logique/regles";
  import {
    BORD,
    dent,
    dents,
    hachures,
    MOYEU,
    periode,
    rayons,
    sens,
    spirale,
    UNITE,
    zigzag,
  } from "./dessin";

  let {
    piece,
    info,
    numero,
    montree = () => false,
    ressort = false,
  }: {
    piece: PieceAtelier;
    /** Ses contacts, quand elle est posée ; ceux du ressort, quand c'est lui. */
    info?: EtatPiece;
    /** Le repère écrit dans son cercle ; aucun pour un profil de la nomenclature. */
    numero?: string;
    /** Une gêne s'est-elle montrée ? */
    montree?: (cle: string | undefined) => boolean;
    /** Le ressort : un spiral au lieu du moyeu, et pas de repère. */
    ressort?: boolean;
  } = $props();

  const s = $derived(largeur(piece));
  const S = $derived(s * UNITE);
  const tourne = $derived(info?.entrainee ?? false);
  const frotte = $derived(tourne && (info?.frottements ?? 0) > 0);
  const traits = $derived(hachures(S));

  /** Le côté `d` engrène-t-il, sur la case `demi` ? */
  const engrene = (d: number, demi: number) => info?.cotes[d]?.[demi]?.contact === "engrene";

  /** Les cases du côté `d` où une gêne s'est montrée. */
  function frottes(d: number): number[] {
    const demis = info?.cotes[d] ?? [];
    return demis.flatMap((x, demi) => (x.contact === "frotte" && montree(x.cle) ? [demi] : []));
  }
</script>

<span class="dessin">
  <svg viewBox="0 0 {S} {S}" class:tourne aria-hidden="true">
    <rect class="corps" x={BORD} y={BORD} width={S - 2 * BORD} height={S - 2 * BORD} rx="0.8" />
    {#if tourne}
      {#each traits as h, i (i)}
        <line class="hachure" x1={h.x1} y1={h.y1} x2={h.x2} y2={h.y2} />
      {/each}
    {/if}
    {#each COTES as d (d)}
      <g transform="rotate({d * 90} {S / 2} {S / 2})">
        {#if dente(piece, d)}
          {#each dents(d, s) as x, i (i)}
            <polygon class="dent" points={dent(x.x, engrene(d, x.demi))} />
          {/each}
        {:else}
          <line class="lisse" x1={BORD} y1={BORD} x2={S - BORD} y2={BORD} />
        {/if}
        {#each frottes(d) as demi (demi)}
          <polyline class="frotte" points={zigzag(d, s, demi)} />
        {/each}
      </g>
    {/each}
    {#if numero !== undefined}
      <circle class="repere" cx={S / 2} cy={S / 2} r={MOYEU.repere * s} />
      <text x={S / 2} y={S / 2} dy={0.88 * s} style:font-size="{2.5 * s}px">{numero}</text>
    {/if}
  </svg>
  {#if ressort}
    <svg
      viewBox="0 0 {S} {S}"
      class="moyeu tourne horaire"
      style:--periode="{periode(s, false)}s"
      aria-hidden="true"
    >
      <circle class="barillet" cx={S / 2} cy={S / 2} r={S / 2 - BORD - 1.6} />
      <polyline class="spiral" points={spirale(S / 2, S / 2 - BORD - 2.4)} />
      <circle class="arbre" cx={S / 2} cy={S / 2} r="0.9" />
    </svg>
  {:else if numero !== undefined}
    <svg
      viewBox="0 0 {S} {S}"
      class="moyeu {sens(info?.rang ?? 0)}"
      class:tourne
      class:saccades={frotte}
      style:--periode="{periode(s, frotte)}s"
      aria-hidden="true"
    >
      <circle class="jante" cx={S / 2} cy={S / 2} r={MOYEU.jante * s} />
      {#each rayons(S / 2, s) as r, i (i)}
        <line class="rayon" x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
      {/each}
    </svg>
  {/if}
</span>

<style>
  .dessin {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
  }
  svg {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .corps {
    fill: var(--acier);
    stroke: var(--acier-sombre);
    stroke-width: 0.3;
  }
  .dent {
    fill: var(--acier-sombre);
  }
  .tourne .corps {
    fill: var(--laiton);
    stroke: var(--laiton-sombre);
  }
  .tourne .dent {
    fill: var(--laiton-sombre);
  }
  .hachure {
    stroke: var(--laiton-sombre);
    stroke-width: 0.25;
    opacity: 0.5;
  }
  /* Un côté lisse : un bord épais et net. */
  .lisse {
    stroke: var(--graphite);
    stroke-width: 0.6;
  }
  /* Un frottement montré : un trait en zigzag, qui ne tient pas à la seule couleur. */
  .frotte {
    fill: none;
    stroke: var(--vermillon);
    stroke-width: 0.5;
    stroke-linejoin: round;
  }
  .repere {
    fill: var(--papier);
    stroke: var(--graphite);
    stroke-width: 0.25;
  }
  text {
    font-variant-numeric: tabular-nums;
    text-anchor: middle;
    fill: var(--graphite);
  }

  /* Le moyeu, ou le spiral du ressort : un calque qui tourne seul. */
  .moyeu {
    pointer-events: none;
  }
  .jante,
  .barillet {
    fill: none;
    stroke: var(--acier-sombre);
    stroke-width: 0.35;
  }
  .rayon {
    stroke: var(--acier-sombre);
    stroke-width: 0.45;
    stroke-linecap: round;
  }
  .moyeu.tourne .jante,
  .moyeu.tourne .rayon,
  .barillet,
  .spiral {
    stroke: var(--laiton-sombre);
  }
  .barillet {
    fill: color-mix(in oklab, var(--laiton), var(--papier) 55%);
  }
  .spiral {
    fill: none;
    stroke-width: 0.4;
  }
  .arbre {
    fill: var(--graphite);
  }
  .moyeu.tourne {
    animation: tourner var(--periode) linear infinite;
    will-change: transform;
  }
  .moyeu.antihoraire {
    animation-direction: reverse;
  }
  /* Une pièce qui frotte tourne par saccades : elle accroche, puis repart. */
  .moyeu.tourne.saccades {
    animation-name: saccades;
  }
  @keyframes tourner {
    to {
      transform: rotate(1turn);
    }
  }
  @keyframes saccades {
    0% {
      transform: rotate(0);
    }
    14% {
      transform: rotate(52deg);
    }
    33% {
      transform: rotate(64deg);
    }
    47% {
      transform: rotate(170deg);
    }
    66% {
      transform: rotate(182deg);
    }
    80% {
      transform: rotate(290deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .moyeu.tourne {
      animation: none;
    }
  }
</style>

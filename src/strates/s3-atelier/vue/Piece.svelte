<script lang="ts">
  // Une pièce vue de dessus, pour l'interface minimale : son corps, ses dents ou son bord lisse sur
  // chaque côté, une hachure quand elle tourne, un trait en zigzag là où une gêne s'est montrée, et son
  // repère dans un petit cercle. Le dessin définitif est l'objet de #80.
  import type { PieceAtelier } from "../logique/etat";
  import { COTES, dente, largeur, type EtatPiece } from "../logique/regles";

  let {
    piece,
    info,
    numero,
    montree = () => false,
  }: {
    piece: PieceAtelier;
    /** Ses contacts, quand elle est posée. */
    info?: EtatPiece;
    /** Le repère écrit dans son cercle ; aucun pour un profil de la nomenclature. */
    numero?: string;
    /** Une gêne s'est-elle montrée ? */
    montree?: (cle: string | undefined) => boolean;
  } = $props();

  /** Dix unités par case ; le corps laisse deux unités au bord, pour les dents. */
  const s = $derived(largeur(piece));
  const S = $derived(s * 10);
  const tourne = $derived(info?.entrainee ?? false);

  /** Les dents d'un côté, dessinées en haut puis tournées vers leur côté : trois par case. */
  const dents = $derived(
    Array.from({ length: 3 * s }, (_, k) => ({ x: Math.floor(k / 3) * 10 + 2.4 + (k % 3) * 2 })),
  );

  /** La hachure d'une pièce qui tourne : des diagonales coupées au bord du corps. */
  const hachures = $derived.by(() => {
    const a = 2;
    const b = S - 2;
    const traits: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let k = a + 3; k < 2 * b; k += 3) {
      const x1 = Math.max(a, k - b);
      const x2 = Math.min(b, k - a);
      if (x2 > x1) traits.push({ x1, y1: k - x1, x2, y2: k - x2 });
    }
    return traits;
  });

  /**
   * Les demi-côtés où une gêne s'est montrée, dans le repère du côté dessiné en haut : tourner le
   * dessin d'un demi-tour ou de trois quarts retourne l'ordre des demi-côtés.
   */
  function frottes(d: number): number[] {
    const demis = info?.cotes[d] ?? [];
    return demis
      .map((demi, h) => (demi.contact === "frotte" && montree(demi.cle) ? h : -1))
      .filter((h) => h >= 0)
      .map((h) => (d >= 2 ? s - 1 - h : h));
  }

  const zigzag = (h: number) =>
    Array.from({ length: 6 }, (_, k) => `${h * 10 + 1 + k * 1.6},${k % 2 ? 0.4 : 2.2}`).join(" ");
</script>

<svg viewBox="0 0 {S} {S}" class:tourne aria-hidden="true">
  <rect class="corps" x="2" y="2" width={S - 4} height={S - 4} rx="0.8" />
  {#if tourne}
    {#each hachures as h, i (i)}
      <line class="hachure" x1={h.x1} y1={h.y1} x2={h.x2} y2={h.y2} />
    {/each}
  {/if}
  {#each COTES as d (d)}
    <g transform="rotate({d * 90} {S / 2} {S / 2})">
      {#if dente(piece, d)}
        {#each dents as dent, i (i)}
          <rect class="dent" x={dent.x} y="0.3" width="1.3" height="1.9" />
        {/each}
      {:else}
        <line class="lisse" x1="2" y1="2" x2={S - 2} y2="2" />
      {/if}
      {#each frottes(d) as h (h)}
        <polyline class="frotte" points={zigzag(h)} />
      {/each}
    </g>
  {/each}
  {#if numero !== undefined}
    <circle class="repere" cx={S / 2} cy={S / 2} r="2.7" />
    <text x={S / 2} y={S / 2} dy="1.05">{numero}</text>
  {/if}
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .corps {
    fill: var(--acier);
    stroke: var(--acier-sombre);
    stroke-width: 0.5;
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
    stroke-width: 0.35;
    opacity: 0.55;
  }
  /* Un côté lisse : un bord épais et net. */
  .lisse {
    stroke: var(--graphite);
    stroke-width: 1.1;
  }
  /* Un frottement montré : un trait en zigzag, qui ne tient pas à la seule couleur. */
  .frotte {
    fill: none;
    stroke: var(--vermillon);
    stroke-width: 0.7;
    stroke-linejoin: round;
  }
  .repere {
    fill: var(--papier);
    stroke: var(--graphite);
    stroke-width: 0.35;
  }
  text {
    font-size: 3px;
    font-variant-numeric: tabular-nums;
    text-anchor: middle;
    fill: var(--graphite);
  }
</style>

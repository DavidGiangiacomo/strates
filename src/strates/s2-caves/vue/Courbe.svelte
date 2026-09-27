<script lang="ts">
  // La courbe de la réserve : échelle linéaire, fenêtre glissante de 3 ans, une encoche par achat.
  // C'est une sinusoïde, là où la surface avait une exponentielle (fiche, § 5 et § 6).
  let {
    points,
    achats,
    taille,
    titre,
  }: {
    points: readonly number[];
    /** Les achats, en index (fractionnaires) dans `points`. */
    achats: readonly number[];
    taille: number;
    titre: string;
  } = $props();

  const LARGEUR = 100;
  const HAUTEUR = 30;

  // La fenêtre se remplit par la droite, comme un défilement.
  const debut = $derived(taille - points.length);
  const x = (i: number) => ((debut + i) / (taille - 1)) * LARGEUR;

  const trace = $derived.by(() => {
    if (points.length < 2) return "";
    const max = Math.max(...points) || 1;
    return points
      .map((p, i) => `${x(i).toFixed(2)},${(HAUTEUR - (p / max) * (HAUTEUR - 2)).toFixed(2)}`)
      .join(" ");
  });
</script>

<figure>
  <svg viewBox="0 0 {LARGEUR} {HAUTEUR}" preserveAspectRatio="none" role="img" aria-label={titre}>
    {#each achats as a, i (i)}
      <line
        class="achat"
        x1={x(a)}
        x2={x(a)}
        y1={HAUTEUR - 3}
        y2={HAUTEUR}
        vector-effect="non-scaling-stroke"
      />
    {/each}
    {#if trace}
      <polyline
        points={trace}
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        vector-effect="non-scaling-stroke"
      />
    {/if}
  </svg>
  <figcaption>{titre}</figcaption>
</figure>

<style>
  figure {
    margin: 0;
  }
  svg {
    display: block;
    width: 100%;
    height: 8rem;
  }
  .achat {
    stroke: currentColor;
    stroke-width: 1;
    opacity: 0.5;
  }
  figcaption {
    font-size: 0.8rem;
    opacity: 0.7;
  }
</style>

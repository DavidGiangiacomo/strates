<script lang="ts">
  // La courbe de production : échelle linéaire, fenêtre glissante. Elle monte toujours (fiche, § 5).
  let { points, taille, titre }: { points: readonly number[]; taille: number; titre: string } =
    $props();

  const LARGEUR = 100;
  const HAUTEUR = 30;

  const trace = $derived.by(() => {
    if (points.length < 2) return "";
    const max = Math.max(...points) || 1;
    // La fenêtre se remplit par la droite, comme un défilement.
    const debut = taille - points.length;
    return points
      .map((p, i) => {
        const x = ((debut + i) / (taille - 1)) * LARGEUR;
        const y = HAUTEUR - (p / max) * (HAUTEUR - 2);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  });
</script>

<figure>
  <svg viewBox="0 0 {LARGEUR} {HAUTEUR}" preserveAspectRatio="none" role="img" aria-label={titre}>
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
  figcaption {
    font-size: 0.8rem;
    opacity: 0.7;
  }
</style>

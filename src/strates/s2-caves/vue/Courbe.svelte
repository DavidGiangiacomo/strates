<script lang="ts">
  // La courbe de la réserve (fiche, § 5 et § 6) : les trois dernières années, en échelle linéaire, sur
  // une bande de papier. Elle monte tout l'été et tombe chaque hiver : c'est une sinusoïde, là où la
  // surface avait une exponentielle. Les hivers sont des bandes grises, et chaque achat une encoche.
  import type { SaisonsCourbe } from "./courbe";

  let {
    points,
    achats,
    saisons,
    taille,
    titre,
    annee,
  }: {
    points: readonly number[];
    /** Les achats, en index (fractionnaires) dans `points`. */
    achats: readonly number[];
    saisons: SaisonsCourbe;
    taille: number;
    titre: string;
    /** Le libellé du début d'une année : « an 2 ». */
    annee: (annee: number) => string;
  } = $props();

  const LARGEUR = 100;
  const HAUTEUR = 40;

  // La fenêtre se remplit par la droite, comme un défilement.
  const decalage = $derived(taille - points.length);
  const x = (i: number) => ((decalage + i) / (taille - 1)) * LARGEUR;
  const max = $derived(Math.max(0, ...points) || 1);
  const y = (p: number) => HAUTEUR - (p / max) * (HAUTEUR - 3);

  const sommets = $derived(points.map((p, i) => `${x(i).toFixed(2)},${y(p).toFixed(2)}`));
  const trace = $derived(points.length >= 2 ? sommets.join(" ") : "");
  const aire = $derived(
    trace
      ? `${x(0).toFixed(2)},${HAUTEUR} ${trace} ${x(points.length - 1).toFixed(2)},${HAUTEUR}`
      : "",
  );
</script>

<figure class="courbe">
  <figcaption>{titre}</figcaption>
  <div class="bande">
    <svg viewBox="0 0 {LARGEUR} {HAUTEUR}" preserveAspectRatio="none" role="img" aria-label={titre}>
      {#each saisons.hivers as h (h.debut)}
        <rect class="hiver" x={x(h.debut)} y="0" width={x(h.fin) - x(h.debut)} height={HAUTEUR} />
      {/each}
      {#each saisons.annees as a (a.annee)}
        <line class="annee" x1={x(a.index)} x2={x(a.index)} y1="0" y2={HAUTEUR} />
      {/each}
      {#if trace}
        <polygon class="aire" points={aire} />
        <polyline class="trace" points={trace} />
      {/if}
      {#each achats as a, i (i)}
        <line class="achat" x1={x(a)} x2={x(a)} y1={HAUTEUR - 4} y2={HAUTEUR} />
      {/each}
    </svg>
    {#each saisons.annees as a (a.annee)}
      <span class="libelle-annee" style:left="{x(a.index)}%">{annee(a.annee)}</span>
    {/each}
  </div>
</figure>

<style>
  .courbe {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
  }
  figcaption {
    font-style: italic;
    color: var(--sur-bois-doux);
  }
  /* Une bande de papier, tracée à l'encre. */
  .bande {
    position: relative;
    height: 8rem;
    padding: 10px 0 0;
    background: var(--papier);
    border-radius: 2px;
    box-shadow: 0 1px 0 var(--bois-sombre);
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  line,
  polyline {
    vector-effect: non-scaling-stroke;
  }
  .hiver {
    fill: #93a6ba;
    opacity: 0.35;
  }
  .annee {
    stroke: var(--encre-douce);
    stroke-width: 1;
    stroke-dasharray: 2 3;
  }
  .aire {
    fill: var(--ble);
    opacity: 0.3;
  }
  .trace {
    fill: none;
    stroke: var(--encre);
    stroke-width: 1.6;
    stroke-linejoin: round;
  }
  .achat {
    stroke: var(--marque);
    stroke-width: 1.5;
  }
  .libelle-annee {
    position: absolute;
    top: 2px;
    padding-left: 4px;
    font-size: 12px;
    font-style: italic;
    font-variant-numeric: oldstyle-nums;
    color: var(--encre-douce);
  }
</style>

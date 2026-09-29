<script lang="ts">
  // La courbe de production : échelle linéaire, fenêtre glissante. Elle monte toujours (fiche, § 5) :
  // le haut suit le maximum, et les repères glissent dessous à mesure que la production grandit.
  // Les libellés sont en HTML, pour ne pas être déformés par l'étirement du dessin.
  import { hautGraphique, reperes } from "./graphique";

  let {
    points,
    taille,
    titre,
    debut,
    fin,
    formater,
  }: {
    points: readonly number[];
    taille: number;
    titre: string;
    /** Le libellé du bord gauche (« il y a 15 min ») et celui du bord droit (« maintenant »). */
    debut: string;
    fin: string;
    /** Écrit un repère, dans la notation de la surface. */
    formater: (valeur: number) => string;
  } = $props();

  const haut = $derived(hautGraphique(points));
  const lignes = $derived(reperes(points));
  /** La hauteur d'une valeur, en pourcentage depuis le haut. */
  const y = (valeur: number) => 100 - (valeur / haut) * 100;

  const sommets = $derived.by(() => {
    // La fenêtre se remplit par la droite, comme un défilement.
    const decalage = taille - points.length;
    return points.map(
      (p, i) => `${(((decalage + i) / (taille - 1)) * 100).toFixed(2)},${y(p).toFixed(2)}`,
    );
  });
  const courbe = $derived(sommets.length >= 2 ? sommets.join(" ") : "");
  const aire = $derived(courbe ? `${sommets[0]!.split(",")[0]},100 ${courbe} 100,100` : "");
  const dernier = $derived(points.length >= 2 ? y(points.at(-1)!) : null);
</script>

<figure class="graphique">
  <figcaption>{titre}</figcaption>
  <div class="zone">
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={titre}>
      {#if courbe}
        <polygon class="aire" points={aire} />
        <polyline class="courbe" points={courbe} />
      {/if}
    </svg>
    <!-- Par-dessus l'aire, pour que leurs valeurs restent lisibles. -->
    {#each lignes as valeur (valeur)}
      <span class="repere" style:top="{y(valeur)}%">{formater(valeur)}</span>
    {/each}
    {#if dernier !== null}
      <span class="point" style:top="{dernier}%"></span>
    {/if}
  </div>
  <div class="axe" aria-hidden="true">
    <span>{debut}</span>
    <span>{fin}</span>
  </div>
</figure>

<style>
  .graphique {
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 100%;
    margin: 0;
  }
  figcaption {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--doux);
  }
  .zone {
    position: relative;
    flex: 1;
    min-height: 180px;
  }
  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  /* Les repères : un pointillé, et leur valeur juste au-dessus, à gauche. */
  .repere {
    position: absolute;
    right: 0;
    left: 0;
    padding-bottom: 3px;
    font-size: 11px;
    line-height: 1;
    color: var(--doux);
    border-bottom: 1px dashed var(--trait);
    transform: translateY(-100%);
  }
  .aire {
    fill: var(--accent-pale);
    opacity: 0.7;
  }
  .courbe {
    vector-effect: non-scaling-stroke;
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
    stroke-linejoin: round;
  }
  /* La valeur courante, au bout de la courbe. */
  .point {
    position: absolute;
    right: 0;
    box-sizing: border-box;
    width: 10px;
    height: 10px;
    margin: -5px -5px 0 0;
    border: 2px solid var(--carte);
    border-radius: 50%;
    background: var(--accent);
  }
  .axe {
    display: flex;
    justify-content: space-between;
    padding-top: 6px;
    font-size: 11px;
    color: var(--doux);
    border-top: 1px solid var(--trait);
  }
</style>

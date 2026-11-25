<script lang="ts">
  // Le compte des crues (fiche, § 6), au bord droit : une bande de couches, dessinée sans autre mot que
  // son nom, gravé dans la terre. Les crues passées en bas, déposées, une couche sur deux un peu plus
  // sombre ; les crues à venir au-dessus, encore vides, un trait chacune, piquées de rouge à leurs
  // échéances ; la grande crue, une couche épaisse, cerclée de rouge. À chaque crue, la bande descend
  // d'un cran ; avec moins de mouvement, d'un coup. La couche de l'issue est le départ de la fissure.
  import type { EtatDette } from "../logique";
  import { compteDesCrues, LARGEUR, PIQURES_MAX } from "./compte";

  let {
    etat,
    nom,
    depart = $bindable(),
  }: { etat: EtatDette; nom: string; depart?: Element | undefined } = $props();

  const bande = $derived(compteDesCrues(etat));
  /** Les piqûres d'une couche à venir : une par échéance, côte à côte, cinq au plus. */
  const piqures = (n: number) =>
    Array.from({ length: Math.min(n, PIQURES_MAX) }, (_, i) => 8 + i * 8);
</script>

<div class="compte">
  <p class="nom" aria-hidden="true">{nom}</p>
  <svg
    viewBox="0 0 {LARGEUR} {bande.hauteur}"
    width={LARGEUR}
    height={bande.hauteur}
    role="img"
    aria-label={nom}
    data-test="compte"
  >
    <defs>
      <clipPath id="compte-des-crues-bord">
        <rect width={LARGEUR} height={bande.hauteur} />
      </clipPath>
    </defs>
    <g clip-path="url(#compte-des-crues-bord)">
      {#each bande.couches as c (c.crue)}
        <g
          class="couche"
          class:deposee={c.deposee}
          class:sombre={c.crue % 2 !== 0}
          class:grande={c.grandeCrue}
          style:transform="translate(0px, {c.y}px)"
          data-test={c.deposee ? "deposee" : "a-venir"}
          data-crue={c.crue}
        >
          <rect width={LARGEUR} height={c.hauteur} />
          {#if !c.deposee && !c.grandeCrue}
            {#each piqures(c.echeances) as x (x)}
              <circle cx={x} cy={c.hauteur / 2} r="3" data-test="piqure" />
            {/each}
          {/if}
        </g>
      {/each}
      {#if bande.issue}
        <rect
          bind:this={depart}
          class="issue"
          class:defaut={etat.issue === "defaut"}
          y={bande.issue.y}
          width={LARGEUR}
          height={bande.issue.hauteur}
          data-test="couche-issue"
        />
      {/if}
      <line class="present" x1="0" x2={LARGEUR} y1={bande.present} y2={bande.present} />
    </g>
  </svg>
</div>

<style>
  .compte {
    display: flex;
    gap: 6px;
    align-items: flex-start;
    justify-content: center;
  }
  /* Le nom, gravé le long de la bande, de bas en haut. */
  .nom {
    margin: 0;
    color: var(--grave);
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    white-space: nowrap;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
  }
  svg {
    flex: none;
    overflow: hidden;
    border-radius: 2px;
  }
  .couche {
    transition: transform 1.2s ease-in-out;
  }
  .couche rect {
    fill: none;
    stroke: var(--a-venir);
    stroke-width: 0.8;
    stroke-dasharray: 2 2;
    transition: fill 1.2s ease-in-out;
  }
  .couche.deposee rect {
    fill: var(--limon);
    stroke: none;
  }
  .couche.deposee.sombre rect {
    fill: var(--limon-2);
  }
  .couche.grande rect {
    fill: rgb(134 51 31 / 0.22);
    stroke: var(--rouge);
    stroke-width: 1.4;
    stroke-dasharray: none;
  }
  .couche.grande.deposee rect {
    fill: var(--limon-2);
  }
  circle {
    fill: var(--rouge);
    stroke: var(--terre);
    stroke-width: 0.6;
  }
  .issue {
    fill: none;
  }
  .issue.defaut {
    fill: rgb(134 51 31 / 0.4);
  }
  .present {
    stroke: var(--grave);
    stroke-width: 1.4;
  }
  @media (prefers-reduced-motion: reduce) {
    .couche,
    .couche rect {
      transition: none;
    }
  }
</style>

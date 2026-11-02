<script lang="ts">
  // Le lit (fiche, § 6), en coupe sobre, en attendant sa direction artistique (#107) : le fleuve à
  // gauche, le bassin et ses couches au centre, la rive à droite et ses quatre creux, l'échelle au
  // bord du bassin, côté fleuve, que le limon enterre. L'eau de chaque crue monte, se repose et se
  // retire. Un clic sur un creux y bâtit la levée ; au clavier, la tabulation va d'un creux à l'autre,
  // et Entrée la bâtit. Sous la coupe, la lecture de l'échelle, en lettres ; les lecteurs d'écran
  // l'entendent à chaque coudée. Les phrases du jeu paraissent au centre, puis s'effacent.
  import type { ProprietesVue } from "../../../noyau/logique/types";
  import type { ActionLit, EtatLit } from "../logique";
  import { lireCoudees, lireEchelle } from "../logique/notation";
  import { CREUX, creuxActif, etatCreux, fermable } from "../logique/regles";
  import {
    BASSIN,
    BORD_RIVE,
    couchesDuBassin,
    couchesDuCreux,
    CRETE,
    eau,
    ECHELLE,
    FLEUVE,
    FOND,
    HAUTEUR,
    LARGEUR,
    phraseCourante,
    POCHE,
    PX,
    TRAITS,
    VIEILLES,
    y,
  } from "./coupe";

  let { etat, agir, o, mode }: ProprietesVue<EtatLit, ActionLit> = $props();

  const reduit =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const bandes = $derived(couchesDuBassin(etat.couches));
  const poches = $derived(CREUX.map((_, k) => couchesDuCreux(etat.couches, k)));
  const crue = $derived(eau(etat.temps, etat.pleinA, reduit));
  const actif = $derived(creuxActif(etat));
  const phrase = $derived(phraseCourante(etat, reduit));
  // Le fleuve, bas entre deux crues, monte jusqu'à l'eau de la crue.
  const fleuve = $derived.by(() => {
    const bas = Math.min(FOND - 8, y(etat.niveau) + 24);
    return bas - (bas - (y(etat.niveau) - CRETE * PX)) * crue;
  });

  /** Pendant la remontée, le lit se montre, et rien ne s'y fait. */
  function fermer(k: number): void {
    if (mode === "jeu" && fermable(etat, k)) agir({ type: "fermer", creux: k });
  }

  function clavier(e: KeyboardEvent, k: number): void {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    fermer(k);
  }

  /** Un creux se dit avec sa hauteur et son état : « Creux à neuf coudées, sous l'eau ». */
  function etiquette(k: number): string {
    const lieu =
      k === 0 ? o("creux.fond") : o("creux.hauteur").replace("{hauteur}", lireEchelle(CREUX[k]!));
    return `${lieu}, ${o(`creux.${etatCreux(etat, k)}`)}`;
  }
</script>

<section class="lit" aria-label={o("coupe")}>
  <div class="coupe">
    <svg viewBox="0 0 {LARGEUR} {HAUTEUR}" preserveAspectRatio="xMidYMid meet">
      <g aria-hidden="true">
        <rect class="roche" x="0" y={FOND} width={LARGEUR} height={HAUTEUR - FOND} />
        {#each VIEILLES as v, i (i)}
          <rect
            class="vieille t{v.teinte}"
            class:epaisse={v.epaisse}
            x={BORD_RIVE}
            y={v.y}
            width={LARGEUR - BORD_RIVE}
            height={v.hauteur}
          />
        {/each}
        <rect class="eau" x={FLEUVE.x} y={fleuve} width={FLEUVE.largeur} height={FOND - fleuve} />
        <rect
          class="pierre"
          x={ECHELLE.x}
          y={y(ECHELLE.haut)}
          width={ECHELLE.largeur}
          height={FOND - y(ECHELLE.haut)}
        />
        {#each TRAITS as t, i (i)}
          <line
            class="trait"
            x1={ECHELLE.x}
            x2={ECHELLE.x + (t.long ? ECHELLE.largeur : 7)}
            y1={t.y}
            y2={t.y}
          />
        {/each}
        <!-- Le limon d'un seul tenant sous ses couches : entre deux bandes, rien de l'échelle ne
             transparaît. -->
        <rect
          class="limon"
          x={BASSIN.x}
          y={y(etat.niveau)}
          width={BASSIN.largeur}
          height={FOND - y(etat.niveau)}
        />
        {#each bandes as b, i (i)}
          <rect
            class="couche t{b.teinte}"
            x={BASSIN.x}
            y={b.y}
            width={BASSIN.largeur}
            height={b.hauteur}
          />
        {/each}
        {#if crue > 0}
          <rect
            class="eau"
            x={BASSIN.x}
            y={y(etat.niveau) - CRETE * PX * crue}
            width={BASSIN.largeur}
            height={CRETE * PX * crue}
          />
        {/if}
      </g>
      {#each CREUX as h, k (k)}
        {@const haut = y(h + POCHE.hauteur)}
        <g
          class="creux"
          role="button"
          tabindex="0"
          aria-label={etiquette(k)}
          aria-disabled={mode !== "jeu" || !fermable(etat, k)}
          data-creux={k}
          onclick={() => fermer(k)}
          onkeydown={(e) => clavier(e, k)}
        >
          <rect class="poche" x={BORD_RIVE} y={haut} width={POCHE.largeur} height={y(h) - haut} />
          {#if poches[k]?.length}
            {@const dessus = poches[k]!.at(-1)!.y}
            <rect
              class="limon"
              x={BORD_RIVE}
              y={dessus}
              width={POCHE.largeur}
              height={y(h) - dessus}
            />
          {/if}
          {#each poches[k] as b, i (i)}
            <rect
              class="couche t{b.teinte}"
              x={BORD_RIVE}
              y={b.y}
              width={POCHE.largeur}
              height={b.hauteur}
            />
          {/each}
          {#if crue > 0 && actif === k}
            <!-- L'eau s'engouffre dans le creux que le limon atteint. -->
            {@const fond = poches[k]?.at(-1)?.y ?? y(h)}
            <rect
              class="eau"
              x={BORD_RIVE}
              y={fond - (fond - haut) * crue}
              width={POCHE.largeur}
              height={(fond - haut) * crue}
            />
          {/if}
          {#if etat.levee === k}
            <rect
              class="levee"
              x={BORD_RIVE - 9}
              y={haut - 4}
              width="18"
              height={y(h) - haut + 4}
              rx="7"
            />
          {/if}
        </g>
      {/each}
    </svg>
    <p class="phrase" aria-live="polite" style:opacity={phrase?.opacite ?? 0}>
      {phrase ? o(phrase.cle) : ""}
    </p>
  </div>
  <p class="lecture" aria-hidden="true">{lireEchelle(etat.niveau)}</p>
  <p class="lecteur" aria-live="polite">{o("echelle")} : {lireCoudees(etat.niveau)}</p>
</section>

<style>
  .lit {
    /* Les gris du limon, le gris-vert de l'eau, la terre sombre de la rive (fiche, § 6). */
    --ciel: #ecebe6;
    --limon: #c9bfa8;
    --limon-2: #bcb199;
    --retenue: #8f8571;
    --retenue-2: #857b67;
    --rive: #4f493f;
    --rive-2: #5a5348;
    --roche: #3c3934;
    --eau: #7d8f86;
    --pierre: #a19d93;
    --encre: #2f2c27;
    display: flex;
    flex: 1 0 auto;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    box-sizing: border-box;
    padding: 24px 16px 40px;
    color: var(--encre);
    background-color: var(--ciel);
  }
  .coupe {
    position: relative;
    width: min(100%, 1100px);
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    max-height: 76vh;
  }
  .roche {
    fill: var(--roche);
  }
  .vieille {
    fill: var(--rive);
  }
  .vieille.t1 {
    fill: var(--rive-2);
  }
  .vieille.epaisse {
    fill: var(--roche);
  }
  .eau {
    fill: var(--eau);
    opacity: 0.6;
  }
  .pierre {
    fill: var(--pierre);
  }
  .trait {
    stroke: var(--encre);
    stroke-width: 1;
  }
  .limon,
  .couche {
    fill: var(--limon);
  }
  .couche.t1 {
    fill: var(--limon-2);
  }
  .couche.t2 {
    fill: var(--retenue);
  }
  .couche.t3 {
    fill: var(--retenue-2);
  }
  .poche {
    fill: var(--roche);
  }
  .levee {
    fill: var(--encre);
  }
  .creux {
    cursor: pointer;
    outline: none;
  }
  .creux[aria-disabled="true"] {
    cursor: default;
  }
  .creux:hover .poche,
  .creux:focus-visible .poche {
    stroke: var(--ciel);
    stroke-width: 3;
  }
  .phrase {
    position: absolute;
    top: 30%;
    right: 0;
    left: 0;
    margin: 0;
    font:
      italic 26px/1.3 Georgia,
      "Times New Roman",
      serif;
    text-align: center;
    pointer-events: none;
  }
  .lecture {
    margin: 0;
    font:
      15px/1.4 Georgia,
      "Times New Roman",
      serif;
    letter-spacing: 0.02em;
  }
  /* Pour les lecteurs d'écran seulement : l'échelle à chaque coudée. */
  .lecteur {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>

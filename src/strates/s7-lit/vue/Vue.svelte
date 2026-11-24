<script lang="ts">
  // Le lit (fiche, § 6) : presque vide, grain, lenteur. La coupe du bassin, vue de côté, sous un
  // jour gris et voilé : le fleuve à gauche, le bassin et ses couches au centre, la rive à droite et
  // ses quatre creux, l'échelle au bord du bassin, côté fleuve, que le limon enterre. Le fleuve, la
  // rive et la roche continuent jusqu'aux bords de l'écran. Au fond, le rocher aux encoches, que les
  // premières couches recouvrent ; dans la rive, les fosses de la dette ; sur la berge, les objets
  // d'en haut. La crue arrive trouble, s'éclaircit pendant son repos, et sa couche monte au fond,
  // lentement. Un grain, comme d'une pellicule, est la seule chose qui bouge entre deux crues.
  //
  // Un clic sur un creux y bâtit la levée ; au clavier, la tabulation va d'un creux à l'autre, et
  // Entrée la bâtit. Sur la roche, sous la pierre, la lecture de l'échelle, en lettres ; les lecteurs
  // d'écran l'entendent à chaque coudée. Les phrases du jeu paraissent au milieu du vide, au-dessus
  // du bassin, puis s'effacent. Les objets d'en haut dessinent aussi d'avance, en pointillés, les
  // couches à venir, et marquent la rive sur l'échelle (fiche, § 8).
  //
  // Tant qu'ils sont opaques (fiche, § 7), les mots du lit sont des glyphes, à travers `o`, et ses
  // mesures aussi : on voit monter le limon, pas sa mesure.
  //
  // Le son (#114) : le fleuve au loin, qui enfle un peu à chaque crue et s'éloigne quand le bassin est
  // plein ; l'eau de chaque crue, qui monte, se tait au repos, puis se retire ; l'eau qui s'engouffre
  // dans le creux atteint ; la levée qu'on bâtit.
  import { untrack } from "svelte";
  import { glyphes } from "../../../noyau/logique/opacite";
  import type { ProprietesVue } from "../../../noyau/logique/types";
  import { couchesAVenir, type ActionLit, type EtatLit } from "../logique";
  import { lireCoudees, lireEchelle } from "../logique/notation";
  import {
    couchesDAvance,
    CREUX,
    CRUE,
    creuxActif,
    etatCreux,
    fermable,
    OPAQUES,
    RIVE,
    riveMarquee,
  } from "../logique/regles";
  import Berge from "./Berge.svelte";
  import {
    BASSIN,
    BORD_RIVE,
    clarte,
    CONTOUR_ROCHER,
    contourFosse,
    couchesAVenirDuBassin,
    couchesAVenirDuCreux,
    couchesDuBassin,
    couchesDuCreux,
    CRETE,
    DEBORD,
    eau,
    ECHELLE,
    ENCOCHES,
    FLEUVE,
    FOND,
    FOSSES,
    HAUTEUR,
    LARGEUR,
    momentCrue,
    passageTrouble,
    phraseCourante,
    PIERRE,
    POCHE,
    PX,
    tablettes,
    TASSEMENT,
    TRAITS,
    VIEILLES,
    y,
  } from "./coupe";
  import Crue from "./Crue.svelte";
  import { eauDeLaCrue, PLACES, volumeFleuve } from "./sons";
  import { VARIABLES } from "./theme";

  let { etat, agir, noyau, o, lisible, mode, son }: ProprietesVue<EtatLit, ActionLit> = $props();

  const reduit =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // La dernière couche monte au fond pendant cinq secondes après sa crue ; le reste du temps, tout
  // est déposé, et la coupe ne se redessine qu'aux crues. En mouvement réduit, elle paraît d'un coup.
  const instant = $derived.by(() => {
    const derniere = etat.couches.at(-1);
    if (reduit || !derniere || etat.temps >= derniere.crue * CRUE + TASSEMENT) return Infinity;
    return etat.temps;
  });
  const bandes = $derived(couchesDuBassin(etat.couches, instant));
  const poches = $derived(CREUX.map((_, k) => couchesDuCreux(etat.couches, k, instant)));
  /** Le dessus du limon du bassin, tel qu'il est dessiné. */
  const dessus = $derived(bandes.at(-1)?.y ?? FOND);
  // Les couches à venir, que le rouleau qui marque et le gage qui revient dessinent d'avance : elles
  // se refont aux crues, et quand la levée bouge.
  const avenir = $derived(couchesAVenir(etat, couchesDAvance(etat)));
  const bandesAVenir = $derived(couchesAVenirDuBassin(etat.couches, avenir));
  const pochesAVenir = $derived(CREUX.map((_, k) => couchesAVenirDuCreux(etat.couches, avenir, k)));
  const crue = $derived(eau(etat.temps, etat.pleinA, reduit));
  /** L'eau trouble s'éclaircit de haut en bas pendant le repos de la crue. */
  const trouble = $derived(passageTrouble(clarte(etat.temps, reduit)));
  const actif = $derived(creuxActif(etat));
  const phrase = $derived(phraseCourante(etat, reduit));
  const tablettesDeLaDette = $derived(tablettes(etat.dette));
  // Le fleuve, bas entre deux crues, monte jusqu'à l'eau de la crue.
  const fleuve = $derived.by(() => {
    const bas = Math.min(FOND - 8, dessus + 24);
    return bas - (bas - (dessus - CRETE * PX)) * crue;
  });

  // Les phrases du jeu paraissent au milieu du vide, entre le haut de l'écran et la plus haute eau
  // des crues : elles montent avec le limon, pas avec chaque crue.
  let hauteurLit = $state(0);
  let hauteurCoupe = $state(0);
  let hauteurSocle = $state(0);
  const milieuDuVide = $derived.by(() => {
    const hautCoupe = hauteurLit - hauteurSocle - hauteurCoupe;
    const eauHaute = ((dessus - CRETE * PX) / HAUTEUR) * hauteurCoupe;
    return Math.max(0, (hautCoupe + eauHaute) / 2);
  });

  // ——— Le son (fiche, § 6)

  // Le fleuve au loin : il enfle un peu pendant la crue, et s'éloigne jusqu'au silence quand le
  // bassin est plein. Il ne change de réglage que deux fois par crue.
  const enCrue = $derived(crue > 0);
  const plein = $derived(etat.pleinA !== null);
  $effect(() => {
    son.ambiance("fleuve", volumeFleuve(enCrue, plein));
  });

  // L'eau de chaque crue sonne au début de sa montée et de son retrait, et se tait au repos. La
  // montée vers un creux atteint fait aussi entendre l'eau qui s'y engouffre. Un moment déjà commencé
  // quand la vue est montée ne sonne pas : on attend le suivant.
  const moment = $derived(momentCrue(etat.temps, etat.pleinA));
  const cleMoment = $derived(moment ? `${moment.crue}.${moment.phase}` : "");
  let momentEntendu = untrack(() => cleMoment);
  $effect(() => {
    const cle = cleMoment;
    if (cle === momentEntendu) return;
    momentEntendu = cle;
    untrack(() => {
      if (!moment || moment.phase === "repos") return;
      const { variante, vitesse, volume } = eauDeLaCrue(moment.crue);
      if (moment.phase === "retrait") {
        son.jouer(`retrait-${variante}`, { volume, vitesse, panoramique: PLACES.bassin });
        return;
      }
      son.jouer(`montee-${variante}`, { volume, vitesse, panoramique: PLACES.bassin });
      // L'eau atteint le creux au milieu de sa montée.
      if (actif !== null) {
        son.jouer("engouffre", {
          volume: 0.8 * volume,
          vitesse,
          panoramique: PLACES.creux,
          dans: 3,
        });
      }
    });
  });

  // La levée bâtie, ou déplacée : de la terre et des pierres, au bord du creux. Celle qui disparaît
  // sous le limon, quand son creux est plein, ne fait pas de bruit.
  let leveeEntendue = untrack(() => etat.levee);
  $effect(() => {
    const levee = etat.levee;
    if (levee === leveeEntendue) return;
    leveeEntendue = levee;
    if (levee !== null) {
      untrack(() => son.jouer("levee", { volume: 0.6, panoramique: PLACES.creux }));
    }
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

  // L'aide (fiche, § 11) : une page dessinée, la coupe d'une crue en trois moments, et ses légendes.
  // L'ouvrir est noté, pour l'acte « sans aide » (§ 7).
  const MOMENTS = [
    ["monte", "crue"],
    ["repose", "levee"],
    ["laisse", "couche"],
  ] as const;
  let aideOuverte = $state(false);
  let lienAide: HTMLButtonElement | undefined = $state();
  let pageAide: HTMLElement | undefined = $state();
  function ouvrirAide(): void {
    aideOuverte = true;
    noyau.ouvrirAide();
  }
  function refermerAide(): void {
    aideOuverte = false;
    lienAide?.focus();
  }
  // À l'ouverture, le focus va à la page : la lecture commence par son titre.
  $effect(() => {
    if (aideOuverte) pageAide?.focus();
  });
  function touche(e: KeyboardEvent): void {
    if (e.key === "Escape" && aideOuverte) refermerAide();
  }

  /**
   * Une mesure de l'échelle, en lettres. Tant que les mesures sont opaques, des glyphes, un par mot,
   * toujours les mêmes à la même place.
   */
  const mesuresLisibles = $derived(lisible(OPAQUES.mesures));
  function mesure(doigts: number, place: string, lire = lireEchelle): string {
    const texte = lire(doigts);
    return mesuresLisibles ? texte : glyphes(place, texte);
  }

  /** Un creux se dit avec sa hauteur et son état : « Creux à neuf coudées, sous l'eau ». */
  function etiquette(k: number): string {
    const lieu =
      k === 0
        ? o("creux.fond")
        : o("creux.hauteur").replace("{hauteur}", mesure(CREUX[k]!, `creux.${k}`));
    return `${lieu}, ${o(`creux.${etatCreux(etat, k)}`)}`;
  }
</script>

<svelte:window onkeydown={touche} />

<section class="lit" style={VARIABLES} aria-label={o("coupe")} bind:clientHeight={hauteurLit}>
  <div class="coupe" bind:clientHeight={hauteurCoupe}>
    <svg viewBox="0 0 {LARGEUR} {HAUTEUR}" preserveAspectRatio="xMidYMax meet">
      <defs>
        <!-- L'eau de la crue : claire au-dessus, trouble au-dessous, et le passage descend. -->
        <linearGradient id="lit-eau" x1="0" y1="0" x2="0" y2="1">
          <stop class="claire" offset={trouble.haut} />
          <stop class="trouble" offset={trouble.bas} />
        </linearGradient>
      </defs>
      <g aria-hidden="true">
        <!-- La roche, d'un bord de l'écran à l'autre, et le rocher aux encoches. -->
        <rect
          class="roche"
          x={-DEBORD}
          y={FOND}
          width={LARGEUR + 2 * DEBORD}
          height={HAUTEUR - FOND}
        />
        <path class="roche" d={CONTOUR_ROCHER} />
        {#each ENCOCHES as e, i (i)}
          <line class="encoche" x1={e.x} x2={e.x} y1={e.y1} y2={e.y2} data-test="encoche" />
        {/each}
        <!-- La rive et ses vieilles couches, jusqu'au bord droit de l'écran. -->
        {#each VIEILLES as v, i (i)}
          <rect
            class="vieille t{v.teinte}"
            class:epaisse={v.epaisse}
            x={BORD_RIVE}
            y={v.y}
            width={LARGEUR - BORD_RIVE + DEBORD}
            height={v.hauteur}
          />
        {/each}
        <!-- Les fosses de la dette, creusées d'en haut : tablettes brisées, ou entières et scellées. -->
        {#if etat.dette !== null}
          {#each FOSSES as f, i (i)}
            <path class="fosse" d={contourFosse(f)} data-test="fosse" />
          {/each}
          {#each tablettesDeLaDette as t, i (i)}
            <polygon
              class="tablette"
              points={t.points}
              data-test={t.sceau ? "tablette" : "eclat"}
            />
            {#if t.sceau}
              <circle class="sceau" cx={t.sceau.x} cy={t.sceau.y} r="2.2" data-test="sceau" />
            {/if}
          {/each}
        {/if}
        <!-- Le fleuve, jusqu'au bord gauche de l'écran. -->
        <rect
          class="fleuve"
          x={-DEBORD}
          y={fleuve}
          width={DEBORD + FLEUVE.largeur}
          height={FOND - fleuve}
        />
        <path class="pierre" d={PIERRE} />
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
        <rect class="limon" x={BASSIN.x} y={dessus} width={BASSIN.largeur} height={FOND - dessus} />
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
            y={dessus - CRETE * PX * crue}
            width={BASSIN.largeur}
            height={CRETE * PX * crue}
            fill="url(#lit-eau)"
            data-test="eau"
          />
          <!-- Le fil de l'eau. -->
          <line
            class="fil"
            x1={BASSIN.x}
            x2={BORD_RIVE}
            y1={dessus - CRETE * PX * crue}
            y2={dessus - CRETE * PX * crue}
          />
        {/if}
        {#each bandesAVenir as b, i (i)}
          <rect
            class="avenir"
            x={BASSIN.x}
            y={b.y}
            width={BASSIN.largeur}
            height={b.hauteur}
            data-test="avenir"
          />
        {/each}
        {#if riveMarquee(etat)}
          <!-- L'œuf qui garde : jusqu'où le bassin se remplira. -->
          <line
            class="rive-marquee"
            x1={ECHELLE.x - 8}
            x2={ECHELLE.x + ECHELLE.largeur + 8}
            y1={y(RIVE)}
            y2={y(RIVE)}
            data-test="rive-marquee"
          />
        {/if}
        <Berge objets={etat.objets} />
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
            {@const fond = poches[k]!.at(-1)!.y}
            <rect class="limon" x={BORD_RIVE} y={fond} width={POCHE.largeur} height={y(h) - fond} />
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
          {#each pochesAVenir[k] as b, i (i)}
            <rect
              class="avenir"
              x={BORD_RIVE}
              y={b.y}
              width={POCHE.largeur}
              height={b.hauteur}
              data-test="avenir"
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
              fill="url(#lit-eau)"
            />
          {/if}
          {#if etat.levee === k}
            <!-- La levée : un bourrelet de terre et de pierres, au bord du creux. -->
            <rect
              class="levee"
              x={BORD_RIVE - 9}
              y={haut - 4}
              width="18"
              height={y(h) - haut + 4}
              rx="7"
            />
            {#each [0.3, 0.55, 0.8] as f, i (i)}
              <circle
                class="caillou"
                cx={BORD_RIVE - 3 + 6 * (i % 2)}
                cy={haut - 4 + (y(h) - haut + 4) * f}
                r="2.2"
              />
            {/each}
          {/if}
        </g>
      {/each}
    </svg>
  </div>
  <p
    class="phrase"
    aria-live="polite"
    style:opacity={phrase?.opacite ?? 0}
    style:top="{milieuDuVide}px"
  >
    {phrase ? o(phrase.cle) : ""}
  </p>
  <div class="socle" bind:clientHeight={hauteurSocle}>
    <div class="cadre">
      <p class="lecture" aria-hidden="true">{mesure(etat.niveau, "echelle.lecture")}</p>
      <button
        class="lien-aide"
        bind:this={lienAide}
        aria-expanded={aideOuverte}
        aria-controls="aide-lit"
        onclick={() => (aideOuverte ? refermerAide() : ouvrirAide())}
        data-test="lien-aide">{o("aide")}</button
      >
    </div>
  </div>
  <p class="lecteur" aria-live="polite">
    {o("echelle")} : {mesure(etat.niveau, "echelle.lecture", lireCoudees)}{riveMarquee(etat)
      ? `, ${o("echelle.rive").replace("{hauteur}", mesure(RIVE, "echelle.rive"))}`
      : ""}
  </p>
  <!-- Le grain, comme d'une pellicule, sur tout l'écran. -->
  <div class="grain" aria-hidden="true" data-test="grain"></div>
  {#if aideOuverte}
    <div
      class="aide"
      id="aide-lit"
      bind:this={pageAide}
      tabindex="-1"
      role="dialog"
      aria-labelledby="aide-titre"
      data-test="aide"
    >
      <h3 id="aide-titre">{o("aide.titre")}</h3>
      <ol class="moments">
        {#each MOMENTS as [moment, legende] (moment)}
          <li><Crue {moment} /><span>{o(`aide.${legende}`)}</span></li>
        {/each}
        <li class="rive">{o("aide.rive")}</li>
      </ol>
      <button class="refermer" onclick={refermerAide}>{o("aide.fermer")}</button>
    </div>
  {/if}
</section>

<style>
  .lit {
    /* La coupe garde ses proportions, au plus grand : toute la largeur, ou toute la hauteur que
       laissent le bandeau, le socle et un peu de ciel. */
    --socle: 2.75rem;
    --largeur: min(
      100%,
      calc((100vh / var(--zoom, 1) - 24px - var(--socle) - 1.5rem) * 1000 / 620)
    );
    position: relative;
    isolation: isolate;
    display: flex;
    flex: 1 0 auto;
    flex-direction: column;
    box-sizing: border-box;
    height: calc(100vh / var(--zoom, 1) - 24px);
    /* Le fleuve, la rive et le grain débordent : on les coupe aux bords, sans que rien ne défile. */
    overflow: clip;
    font: 15px/1.4 var(--police);
    letter-spacing: 0.03em;
    color: var(--encre);
    background: linear-gradient(var(--ciel-haut), var(--ciel-bas));
  }
  .coupe {
    position: relative;
    z-index: 0;
    flex: none;
    width: var(--largeur);
    aspect-ratio: 1000 / 620;
    margin: auto auto 0;
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .roche,
  .poche {
    fill: var(--roche);
  }
  .encoche {
    stroke: var(--encoche);
    stroke-width: 1.4;
    stroke-linecap: round;
  }
  .vieille {
    fill: var(--rive);
  }
  .vieille.t1 {
    fill: var(--rive-2);
  }
  .vieille.epaisse {
    fill: var(--epaisse);
  }
  .fosse {
    fill: var(--remblai);
  }
  .tablette {
    fill: var(--argile);
    stroke: var(--argile);
    stroke-width: 1.2;
    stroke-linejoin: round;
  }
  .sceau {
    fill: var(--sceau);
  }
  .fleuve {
    fill: var(--fleuve);
  }
  .claire {
    stop-color: var(--eau);
    stop-opacity: 0.55;
  }
  .trouble {
    stop-color: var(--trouble);
    stop-opacity: 0.85;
  }
  .fil {
    stroke: var(--fil);
    stroke-width: 1.5;
    opacity: 0.9;
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
  /* Les couches à venir, en pointillés, à leur place (fiche, § 8). */
  .avenir {
    fill: none;
    stroke: var(--encre);
    stroke-width: 1;
    stroke-dasharray: 5 4;
    opacity: 0.7;
  }
  /* La rive, marquée d'avance sur l'échelle. */
  .rive-marquee {
    stroke: var(--encre);
    stroke-width: 3;
  }
  .levee {
    fill: var(--levee);
  }
  .caillou {
    fill: var(--galet);
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
    stroke: var(--ciel-bas);
    stroke-width: 3;
  }

  /* Les phrases du jeu, au milieu du vide : plus grandes, puis elles s'effacent (fiche, § 11). */
  .phrase {
    position: absolute;
    right: 0;
    left: 0;
    z-index: 1;
    box-sizing: border-box;
    max-width: 40rem;
    margin: 0 auto;
    padding: 0 16px;
    font-size: 30px;
    line-height: 1.3;
    letter-spacing: 0.04em;
    text-align: center;
    transform: translateY(-50%);
    pointer-events: none;
  }

  /* Le socle : la roche sous la coupe. La lecture de l'échelle s'y écrit, sous la pierre, en
     minuscules ; le lien de l'aide, discret, sous la rive. */
  .socle {
    position: relative;
    z-index: 1;
    flex: none;
    height: var(--socle);
    color: var(--grave);
    background: var(--roche);
  }
  .cadre {
    display: flex;
    gap: 12px;
    align-items: center;
    box-sizing: border-box;
    width: var(--largeur);
    height: 100%;
    margin: 0 auto;
    /* La pierre de l'échelle est à 16 % de la largeur de la coupe. */
    padding: 0 16px 0 max(16px, 15%);
  }
  .lecture {
    min-width: 0;
    margin: 0;
    line-height: 1.2;
    letter-spacing: 0.05em;
  }
  .lien-aide {
    margin-left: auto;
    padding: 2px 6px;
    font: inherit;
    font-size: 14px;
    color: var(--grave);
    text-decoration: underline;
    text-underline-offset: 3px;
    background: none;
    border: 0;
    opacity: 0.8;
    cursor: pointer;
  }
  .lien-aide:focus-visible {
    outline: 2px solid var(--grave);
    outline-offset: 2px;
  }

  /* Le grain : un bruit gris, dessiné par le navigateur à partir d'un filtre SVG, sans fichier. Il
     saute d'une place à l'autre huit fois par seconde, comme une pellicule ; immobile, sans
     mouvement. */
  .grain {
    position: absolute;
    inset: -50%;
    z-index: 2;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0.33 0.33 0.33 0 0 0 0 0 0 1'/%3E%3CfeComponentTransfer%3E%3CfeFuncR type='linear' slope='2.4' intercept='-0.7'/%3E%3CfeFuncG type='linear' slope='2.4' intercept='-0.7'/%3E%3CfeFuncB type='linear' slope='2.4' intercept='-0.7'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
    opacity: 0.3;
    mix-blend-mode: overlay;
    animation: grain 1s steps(1, end) infinite;
  }
  @keyframes grain {
    0% {
      transform: translate(0, 0);
    }
    12.5% {
      transform: translate(-7%, 4%);
    }
    25% {
      transform: translate(5%, -9%);
    }
    37.5% {
      transform: translate(-11%, -3%);
    }
    50% {
      transform: translate(8%, 7%);
    }
    62.5% {
      transform: translate(-3%, 11%);
    }
    75% {
      transform: translate(10%, -5%);
    }
    87.5% {
      transform: translate(-6%, -10%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .grain {
      animation: none;
    }
  }

  /* L'aide se pose dans le ciel, au-dessus du bassin : la coupe d'une crue, en trois moments. */
  .aide {
    position: absolute;
    top: 1.5rem;
    left: 50%;
    z-index: 3;
    box-sizing: border-box;
    width: min(44rem, calc(100% - 32px));
    max-height: calc(100% - 3rem);
    padding: 18px 22px;
    overflow-y: auto;
    color: var(--encre);
    background: var(--ciel-bas);
    border: 1px solid rgb(44 42 38 / 35%);
    outline: none;
    transform: translateX(-50%);
  }
  .aide h3 {
    margin: 0 0 12px;
    font-size: 20px;
    font-weight: 400;
    letter-spacing: 0.05em;
  }
  /* Sans puces ni numéros : le lit n'écrit pas ses nombres en chiffres. */
  .moments {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px 16px;
    margin: 0 0 14px;
    padding: 0;
    list-style: none;
  }
  .moments li {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .moments .rive {
    grid-column: 1 / -1;
  }
  .refermer {
    padding: 3px 10px;
    font: inherit;
    font-size: 14px;
    color: var(--encre);
    background: none;
    border: 1px solid rgb(44 42 38 / 45%);
    cursor: pointer;
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

  @media (max-width: 36rem) {
    .phrase {
      font-size: 24px;
    }
    .lecture {
      font-size: 13px;
    }
    /* Sur un écran étroit, chaque moment de la crue a sa ligne : le dessin, puis sa légende. */
    .moments {
      grid-template-columns: 1fr;
    }
    .moments li {
      flex-direction: row;
      gap: 12px;
      align-items: center;
    }
    .moments li :global(svg) {
      flex: none;
      width: 45%;
    }
  }
</style>

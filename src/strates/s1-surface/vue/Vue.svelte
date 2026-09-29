<script lang="ts">
  // Le tableau de bord de la surface (fiche, § 6) : des cartes à coins arrondis sur une grille. En
  // haut, les indicateurs ; au centre, le graphique de production ; à côté, « Produire », les moyens
  // de production et les améliorations. C'est la seule strate qui ressemble à un logiciel.
  import { fly } from "svelte/transition";
  import type { ProprietesVue } from "../../../noyau/logique/types";
  import type { ActionSurface, EtatSurface } from "../logique";
  import { TAILLE_HISTORIQUE } from "../logique/etat";
  import {
    AMELIORATIONS,
    ameliorationDisponible,
    avanceeFissure,
    avanceeObjectif,
    coutAchat,
    GENERATEURS,
    generateurVisible,
    OBJECTIFS,
    production,
    productionGenerateur,
    quantiteAbordable,
    valeurClic,
    type DefAmelioration,
  } from "../logique/regles";
  import Fissure from "../../../noyau/ui/Fissure.svelte";
  import Compteur from "./Compteur.svelte";
  import Graphique from "./Graphique.svelte";
  import { formaterDebit, formaterMontant, formaterNombre, formaterRepere } from "./notation";
  import { VARIABLES } from "./theme";

  let { etat, agir, o }: ProprietesVue<EtatSurface, ActionSurface> = $props();

  const p = $derived(production(etat));
  const fissure = $derived(avanceeFissure(etat));
  let zoneGraphique: HTMLElement | undefined = $state();
  const generateurs = $derived(GENERATEURS.filter((g) => generateurVisible(etat, g)));
  const ameliorations = $derived(
    AMELIORATIONS.filter((a) => ameliorationDisponible(etat, a)).sort((a, b) => a.cout - b.cout),
  );
  const objectif = $derived(
    etat.objectif < OBJECTIFS.length ? o(`objectif.${etat.objectif + 1}`) : null,
  );
  const avancee = $derived(avanceeObjectif(etat));
  /** Les numéros des objectifs atteints, dans l'ordre. */
  const atteints = $derived(Array.from({ length: etat.objectif }, (_, i) => i + 1));

  // Des transitions courtes et douces (fiche, § 6) : ce qui apparaît glisse de quelques pixels.
  const mouvement =
    typeof matchMedia !== "function" || !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const apparaitre = (noeud: Element) => fly(noeud, { y: 6, duration: mouvement ? 220 : 0 });

  function remplir(texte: string, valeurs: Record<string, string>): string {
    return texte.replace(/\{(\w+)\}/g, (tout, cle: string) => valeurs[cle] ?? tout);
  }

  function effet(def: DefAmelioration): string {
    const e = def.effet;
    switch (e.type) {
      case "generateur":
        return remplir(o("effet.generateur"), {
          nom: o(`generateur.${e.generateur}`),
          facteur: formaterNombre(e.facteur),
        });
      case "global":
        return remplir(o("effet.global"), { facteur: formaterNombre(e.facteur) });
      case "clic":
        return remplir(o("effet.clic"), { facteur: formaterNombre(e.facteur) });
      case "partClic":
        return remplir(o("effet.partClic"), {
          part: formaterNombre(Math.round(e.part * 1000) / 10),
        });
    }
  }
</script>

<section class="surface" style={VARIABLES}>
  <div class="page">
    <h2>{o("titre")}</h2>

    <div class="indicateurs">
      <article class="carte indicateur">
        <h3>{o("credits")}</h3>
        <p class="chiffre" data-test="credits">
          <Compteur valeur={etat.credits} formater={formaterMontant} />
        </p>
      </article>
      <article class="carte indicateur">
        <h3>{o("production")}</h3>
        <p class="chiffre" data-test="production">
          <Compteur valeur={p} formater={formaterDebit} />
        </p>
      </article>
      <article class="carte indicateur">
        <h3>{o("objectif")}</h3>
        {#key etat.objectif}
          <p class="objectif" class:fini={!objectif} data-test="objectif" in:apparaitre>
            {objectif ?? o("objectifs.fini")}
          </p>
        {/key}
        {#if avancee !== null}
          <div class="jauge" aria-hidden="true">
            <div class="rempli" style:width="{avancee * 100}%"></div>
          </div>
        {/if}
      </article>
    </div>

    <div class="colonne">
      <article class="carte courbe" bind:this={zoneGraphique}>
        <Graphique
          points={etat.historique}
          taille={TAILLE_HISTORIQUE}
          titre={o("graphique")}
          debut={o("graphique.debut")}
          fin={o("graphique.fin")}
          formater={formaterRepere}
        />
      </article>

      <article class="carte">
        <h3>{o("objectifs.atteints")}</h3>
        {#if atteints.length === 0}
          <p class="vide">{o("objectifs.aucun")}</p>
        {:else}
          <ol class="atteints" data-test="objectifs-atteints">
            {#each atteints as n (n)}
              <li in:apparaitre>
                <svg class="coche" viewBox="0 0 16 16" aria-hidden="true">
                  <circle cx="8" cy="8" r="7" />
                  <path d="M4.8 8.3 7.1 10.5 11.3 6" />
                </svg>
                {o(`objectif.${n}`)}
              </li>
            {/each}
          </ol>
        {/if}
      </article>
    </div>

    <div class="colonne">
      <article class="carte produire">
        <button class="bouton-produire" onclick={() => agir({ type: "produire" })}>
          {o("produire")}
        </button>
        <p class="clic">{remplir(o("clic"), { valeur: formaterMontant(valeurClic(etat)) })}</p>
      </article>

      <article class="carte">
        <h3>{o("generateurs")}</h3>
        <ul class="generateurs">
          {#each generateurs as g (g.id)}
            {@const n = etat.generateurs[g.id]}
            <li data-test="generateur-{g.id}" in:apparaitre>
              <div class="identite">
                <h4>{o(`generateur.${g.id}`)}</h4>
                <p>
                  {o("possedes")} : {n} · {formaterDebit(productionGenerateur(etat, g))}
                </p>
              </div>
              <div class="achats">
                <button
                  class="acheter"
                  disabled={etat.credits < coutAchat(g, n)}
                  onclick={() => agir({ type: "acheter", generateur: g.id, quantite: 1 })}
                >
                  {o("acheter.1")} <span class="prix">{formaterMontant(coutAchat(g, n))}</span>
                </button>
                <button
                  disabled={etat.credits < coutAchat(g, n, 10)}
                  onclick={() => agir({ type: "acheter", generateur: g.id, quantite: 10 })}
                >
                  {o("acheter.10")}
                </button>
                <button
                  disabled={quantiteAbordable(g, n, etat.credits) < 1}
                  onclick={() => agir({ type: "acheter", generateur: g.id, quantite: "max" })}
                >
                  {o("acheter.max")}
                </button>
              </div>
            </li>
          {/each}
        </ul>
      </article>

      <article class="carte">
        <h3>{o("ameliorations")}</h3>
        {#if ameliorations.length === 0}
          <p class="vide">{o("ameliorations.aucune")}</p>
        {:else}
          <ul class="ameliorations">
            {#each ameliorations as a (a.id)}
              <li in:apparaitre>
                <button
                  disabled={etat.credits < a.cout}
                  onclick={() => agir({ type: "ameliorer", amelioration: a.id })}
                >
                  <strong>{o(`amelioration.${a.id}`)}</strong>
                  <span class="effet">{effet(a)}</span>
                  <span class="prix">{formaterMontant(a.cout)}</span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      </article>
    </div>
  </div>

  <!-- Le filet : si le joueur n'a pas creusé après le seuil, une fissure le mène au bandeau. -->
  {#if fissure > 0}
    <Fissure depart={zoneGraphique} avancee={fissure} />
  {/if}
</section>

<style>
  .surface {
    flex: 1 0 auto;
    box-sizing: border-box;
    padding: 20px clamp(12px, 3vw, 32px) 40px;
    font:
      14px/1.45 system-ui,
      -apple-system,
      "Segoe UI",
      Roboto,
      "Helvetica Neue",
      sans-serif;
    font-variant-numeric: tabular-nums;
    color: var(--texte);
    background: var(--fond);
  }

  /* La grille : les indicateurs sur toute la largeur, puis le graphique et, à côté, ce qui s'achète. */
  .page {
    display: grid;
    /* La colonne des achats garde la place d'une ligne de générateur sur une seule ligne. */
    grid-template-columns: minmax(0, 7fr) minmax(480px, 5fr);
    gap: 16px;
    align-items: start;
    max-width: 1180px;
    margin: 0 auto;
  }
  h2 {
    grid-column: 1 / -1;
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
  .indicateurs {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
  .colonne {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .carte {
    box-sizing: border-box;
    padding: 16px 18px;
    background: var(--carte);
    border: 1px solid var(--trait);
    border-radius: 10px;
    box-shadow: 0 1px 2px rgb(60 50 40 / 5%);
  }
  h3 {
    margin: 0 0 12px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--doux);
  }
  p {
    margin: 0;
  }
  .vide {
    color: var(--doux);
  }
  ul,
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* Les indicateurs. */
  .indicateur {
    display: flex;
    flex-direction: column;
  }
  .indicateur h3 {
    margin-bottom: 6px;
  }
  .chiffre {
    font-size: 28px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.01em;
  }
  .objectif {
    font-size: 17px;
    font-weight: 600;
    line-height: 1.3;
  }
  .objectif.fini {
    font-weight: 400;
    color: var(--doux);
  }
  .jauge {
    height: 6px;
    margin-top: auto;
    overflow: hidden;
    background: var(--trait);
    border-radius: 3px;
  }
  .rempli {
    height: 100%;
    background: var(--accent);
    border-radius: inherit;
    transition: width 300ms ease-out;
  }

  /* Le graphique, au centre. */
  .courbe {
    height: clamp(240px, 40vh, 360px);
  }

  /* Les objectifs atteints : une coche d'un vert discret. */
  .atteints {
    display: grid;
    gap: 6px;
    color: var(--doux);
  }
  .atteints li {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .coche {
    flex: none;
    width: 16px;
    height: 16px;
    fill: none;
    stroke: var(--vert);
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .coche circle {
    stroke-width: 1.2;
  }
  .coche path {
    stroke-width: 1.6;
  }

  /* Les boutons : l'accent pâle, et du gris pour ce qu'on ne peut pas encore payer. */
  button {
    padding: 6px 10px;
    font: inherit;
    color: var(--accent-fonce);
    cursor: pointer;
    background: var(--accent-pale);
    border: 1px solid transparent;
    border-radius: 6px;
    transition:
      background-color 150ms,
      color 150ms,
      border-color 150ms;
  }
  button:hover:not(:disabled) {
    background: color-mix(in srgb, var(--accent-pale), var(--accent) 18%);
  }
  button:active:not(:disabled) {
    transform: translateY(1px);
  }
  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  button:disabled {
    color: var(--eteint);
    cursor: default;
    background: transparent;
    border-color: var(--trait);
  }

  .produire {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .bouton-produire {
    height: 48px;
    font-size: 16px;
    font-weight: 600;
  }
  .clic {
    font-size: 12px;
    color: var(--doux);
    text-align: center;
  }

  /* Les moyens de production : une ligne par générateur, séparées d'un filet. */
  .generateurs li {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding-block: 10px;
    border-top: 1px solid var(--trait);
  }
  .generateurs li:first-child {
    padding-top: 0;
    border-top: none;
  }
  .generateurs li:last-child {
    padding-bottom: 0;
  }
  .identite {
    min-width: 0;
  }
  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
  }
  .identite p {
    font-size: 12px;
    color: var(--doux);
  }
  .achats {
    display: flex;
    flex: none;
    gap: 4px;
  }
  .achats button {
    font-size: 13px;
  }
  .prix {
    font-weight: 600;
  }

  /* Les améliorations disponibles, par coût croissant. */
  .ameliorations {
    display: grid;
    gap: 8px;
  }
  .ameliorations button {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2px 12px;
    width: 100%;
    padding: 8px 12px;
    text-align: start;
  }
  .ameliorations .effet {
    grid-row: 2;
    font-size: 12px;
    opacity: 0.85;
  }
  .ameliorations .prix {
    grid-row: 1 / 3;
    grid-column: 2;
    align-self: center;
  }

  @media (max-width: 900px) {
    .page {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  @media (max-width: 560px) {
    .indicateurs {
      grid-template-columns: minmax(0, 1fr);
    }
    .generateurs li {
      flex-wrap: wrap;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    button,
    .rempli {
      transition: none;
    }
  }
</style>

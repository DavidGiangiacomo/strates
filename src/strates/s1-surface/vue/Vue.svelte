<script lang="ts">
  // Interface minimale de la surface : tout est jouable, la direction artistique viendra avec #31.
  import type { ProprietesVue } from "../../../noyau/logique/types";
  import type { ActionSurface, EtatSurface } from "../logique";
  import { TAILLE_HISTORIQUE } from "../logique/etat";
  import {
    AMELIORATIONS,
    ameliorationDisponible,
    avanceeFissure,
    coutAchat,
    GENERATEURS,
    generateurVisible,
    OBJECTIFS,
    production,
    productionGenerateur,
    quantiteAbordable,
    type DefAmelioration,
  } from "../logique/regles";
  import Fissure from "./Fissure.svelte";
  import Graphique from "./Graphique.svelte";
  import { formaterDebit, formaterMontant, formaterNombre } from "./notation";

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

<section class="surface">
  <h2>{o("titre")}</h2>

  <div class="indicateurs">
    <p>{o("credits")} <strong data-test="credits">{formaterMontant(etat.credits)}</strong></p>
    <p>{o("production")} <strong data-test="production">{formaterDebit(p)}</strong></p>
    <p data-test="objectif">
      {#if objectif}
        {o("objectif")} <strong>{objectif}</strong>
      {:else}
        {o("objectifs.fini")}
      {/if}
    </p>
  </div>

  <div bind:this={zoneGraphique}>
    <Graphique points={etat.historique} taille={TAILLE_HISTORIQUE} titre={o("graphique")} />
  </div>

  <!-- Le filet : si le joueur n'a pas creusé après le seuil, une fissure le mène au bandeau. -->
  {#if fissure > 0}
    <Fissure depart={zoneGraphique} avancee={fissure} />
  {/if}

  <button class="produire" onclick={() => agir({ type: "produire" })}>{o("produire")}</button>

  <h3>{o("generateurs")}</h3>
  <ul class="generateurs">
    {#each generateurs as g (g.id)}
      {@const n = etat.generateurs[g.id]}
      {@const nom = o(`generateur.${g.id}`)}
      <li data-test="generateur-{g.id}">
        <h4>{nom}</h4>
        <p>
          {o("possedes")} : {n} · {formaterDebit(productionGenerateur(etat, g))}
        </p>
        <button
          disabled={etat.credits < coutAchat(g, n)}
          onclick={() => agir({ type: "acheter", generateur: g.id, quantite: 1 })}
        >
          {o("acheter.1")} ({formaterMontant(coutAchat(g, n))})
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
      </li>
    {/each}
  </ul>

  <h3>{o("ameliorations")}</h3>
  {#if ameliorations.length === 0}
    <p>{o("ameliorations.aucune")}</p>
  {:else}
    <ul class="ameliorations">
      {#each ameliorations as a (a.id)}
        <li>
          <button
            disabled={etat.credits < a.cout}
            onclick={() => agir({ type: "ameliorer", amelioration: a.id })}
          >
            <strong>{o(`amelioration.${a.id}`)}</strong>
            <span>{effet(a)}</span>
            <span>{formaterMontant(a.cout)}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .surface {
    max-width: 48rem;
    font-variant-numeric: tabular-nums;
  }
  .indicateurs {
    display: flex;
    flex-wrap: wrap;
    gap: 0 2rem;
  }
  .produire {
    font-size: 1.1rem;
    padding: 0.5rem 1.5rem;
  }
  ul {
    list-style: none;
    padding: 0;
  }
  .generateurs li {
    margin-block: 0.5rem;
  }
  .generateurs h4 {
    display: inline;
    margin-inline-end: 0.5rem;
  }
  .generateurs p {
    display: inline;
    margin-inline-end: 0.5rem;
  }
  .ameliorations {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .ameliorations button {
    display: flex;
    flex-direction: column;
    text-align: start;
  }
</style>

<script lang="ts">
  // L'écran de fouille (docs/strates/descente-1-2.md, P3, P4 et § 4) : le bandeau qui s'ouvre. La
  // conversion se montre en trois temps, sans compteur qui défile ; puis le catalogue de la strate
  // quittée, sous les noms d'en haut, présélection cochée. Seul « descendre » engage.
  import { onMount } from "svelte";
  import {
    basculer,
    emportes,
    FAMILLES,
    prenable,
    resteChoix,
    TEXTES_FOUILLE as T,
    texteReste,
  } from "./fouille";
  import type { EcranFouille } from "./passage.svelte";

  let {
    ecran,
    sortie = false,
    referme = false,
    occupe = false,
    ondescendre,
    onreboucher,
    onbasculer,
  }: {
    ecran: EcranFouille;
    /** La descente a commencé : l'écran monte et sort (P5). */
    sortie?: boolean;
    /** La fouille se referme sur la strate. */
    referme?: boolean;
    /** La descente s'engage : plus rien ne répond. */
    occupe?: boolean;
    ondescendre: (emportes: string[]) => void;
    onreboucher: () => void;
    /** Une case vient d'être cochée ou décochée : pour le journal de session. */
    onbasculer?: (objet: string, coche: boolean) => void;
  } = $props();

  const fouille = $derived(ecran.fouille);
  // Le choix part de la présélection : l'écran ne s'ouvre qu'une fois par fouille.
  // svelte-ignore state_referenced_locally
  let choix = $state(new Set(ecran.fouille.preselection));
  const reste = $derived(resteChoix(fouille, choix));
  const inerte = $derived(occupe || sortie || referme);

  // À l'ouverture, le focus va sur la première case (§ 3, « Accessibilité »).
  const cases: HTMLInputElement[] = [];
  onMount(() => cases[0]?.focus());

  function changer(id: string): void {
    const avant = choix.has(id);
    choix = basculer(fouille, choix, id);
    if (choix.has(id) !== avant) onbasculer?.(id, !avant);
  }

  function touche(evenement: KeyboardEvent): void {
    if (evenement.key === "Escape" && !inerte) onreboucher();
  }
</script>

<svelte:window onkeydown={touche} />

<section
  class="fouille"
  class:sortie
  class:referme
  aria-labelledby="fouille-strate"
  data-test="fouille"
>
  <div class="page">
    <h2 id="fouille-strate" class="texte">{ecran.nom}</h2>

    <dl class="conversion" role="status">
      <div class="texte">
        <dt>{ecran.libelle}</dt>
        <dd data-test="valeur">{ecran.formater(fouille.valeur)}</dd>
      </div>
      <div class="texte points">
        <dt>{T.points}</dt>
        <dd data-test="points">{fouille.points}</dd>
      </div>
      <div class="texte suivant">
        <dt>{T.pointSuivant}</dt>
        <dd data-test="point-suivant">{ecran.formater(fouille.pointSuivant)}</dd>
      </div>
    </dl>

    <div class="choix">
      <p class="entete texte">
        <span>{T.aEmporter}</span>
        <span data-test="reste">{texteReste(reste)}</span>
      </p>
      <ul>
        {#each fouille.catalogue as a, i (a.id)}
          {@const pris = choix.has(a.id)}
          <li class:laisse={!pris} data-test="objet-{a.id}">
            <label>
              <input
                type="checkbox"
                bind:this={cases[i]}
                checked={pris}
                disabled={inerte || !prenable(fouille, choix, a)}
                onchange={() => changer(a.id)}
              />
              <span class="nom">{a.nomDHaut}</span>
              <span class="cout">{a.cout}</span>
              <span class="famille">{FAMILLES[a.famille]}</span>
              <span class="etat">{pris ? "" : T.laisse}</span>
            </label>
          </li>
        {/each}
      </ul>
      <p class="regles texte">{T.abandon}<br />{T.perdus}</p>
    </div>

    <p class="actions texte">
      <button class="reboucher" disabled={inerte} onclick={onreboucher}>{T.reboucher}</button>
      <button
        class="descendre"
        disabled={inerte}
        onclick={() => ondescendre(emportes(fouille, choix))}>{T.descendre}</button
      >
    </p>
  </div>
</section>

<style>
  /* La palette du bandeau, ouverte sur tout l'écran : ni la surface, ni les caves. */
  .fouille {
    position: fixed;
    inset: 24px 0 0;
    z-index: 4;
    overflow: auto;
    font:
      14px/1.5 system-ui,
      sans-serif;
    font-variant-numeric: tabular-nums;
    color: #d6d6d6;
    background: #1e1e1e;
  }
  .page {
    box-sizing: border-box;
    max-width: 36rem;
    margin: 0 auto;
    padding: 2.5rem 1.5rem 3rem;
  }
  h2 {
    margin: 0 0 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    color: #f2f2f2;
  }
  .conversion {
    margin: 0 0 2rem;
  }
  .conversion div {
    display: flex;
    justify-content: space-between;
    padding: 0.2rem 0;
  }
  dd {
    margin: 0;
    color: #f2f2f2;
  }
  /* Trois temps : la valeur, puis les points d'un coup, puis le prix d'un point de plus (P3). */
  .points {
    animation: paraitre 1ms 800ms both;
  }
  /* Le catalogue et les boutons avec le dernier temps : on ne descend pas sans avoir vu le choix. */
  .suivant,
  .choix,
  .actions {
    animation: paraitre 1ms 1400ms both;
  }
  @keyframes paraitre {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  .choix {
    padding-top: 1rem;
    border-top: 1px solid #3c3c3c;
  }
  .entete {
    display: flex;
    justify-content: space-between;
    margin: 0 0 0.5rem;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  label {
    display: grid;
    grid-template-columns: 1.5rem 1fr 2rem 8rem 7rem;
    align-items: center;
    gap: 0.5rem;
    padding: 0.15rem 0;
  }
  .cout {
    text-align: right;
  }
  .famille,
  .etat {
    color: #8c8c8c;
  }
  .laisse .nom,
  .laisse .cout {
    color: #8c8c8c;
  }
  .regles {
    margin: 1rem 0 2rem;
    color: #8c8c8c;
  }
  .actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  button {
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
  button:disabled {
    cursor: default;
  }
  .reboucher {
    padding: 0;
    color: #8c8c8c;
    background: none;
    border: none;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .descendre {
    padding: 0.2rem 1rem;
    background: transparent;
    border: 1px solid #5c5c5c;
    border-radius: 2px;
  }
  .descendre:hover:enabled {
    border-color: #8c8c8c;
  }
  input {
    accent-color: #8c8c8c;
  }
  button:focus-visible,
  input:focus-visible {
    outline: 1px solid #f2f2f2;
    outline-offset: 2px;
  }

  /* P5 : les textes s'effacent, et les objets emportés se détachent (ils descendent avec le joueur,
     au milieu de l'écran : Descente.svelte). Seul l'objet laissé en haut reste, et monte avec le sol. */
  .sortie .texte,
  .sortie li:not(.laisse),
  .sortie .choix :is(.cout, .famille, .etat, input) {
    transition: opacity 400ms;
    opacity: 0;
  }
  /* L'apparition en trois temps retiendrait l'opacité : elle cède la place à l'effacement. */
  .sortie :is(.points, .suivant, .choix, .actions) {
    animation: none;
  }
  .sortie {
    animation: sortir 1200ms ease-in 400ms both;
    pointer-events: none;
  }
  @keyframes sortir {
    to {
      transform: translateY(-100%);
    }
  }
  .referme {
    transition: opacity 500ms;
    opacity: 0;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .points,
    .suivant,
    .choix,
    .actions {
      animation: none;
    }
    .sortie {
      animation: none;
      transition: opacity 300ms;
      opacity: 0;
    }
    .referme {
      transition-duration: 300ms;
    }
  }
</style>

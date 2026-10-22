<script lang="ts">
  // L'atelier, interface minimale (fiche, § 6) : le plan au centre, la nomenclature à droite, la
  // légende dessous, l'établi sous le plan ; en tête, le stock, la production par tour et les cases
  // libres. Tout se fait à la souris : on prend une pièce d'un clic, on la pose d'un autre, on la tourne
  // d'un clic droit ou de la touche R. La direction artistique est l'objet de #80.
  import { avanceeFissure } from "../../../noyau/logique/filet";
  import type { ProprietesVue } from "../../../noyau/logique/types";
  import Fissure from "../../../noyau/ui/Fissure.svelte";
  import type { ActionAtelier, EtatAtelier, PieceAtelier } from "../logique";
  import { ecrireLigne, formaterEntier, remplir } from "../logique/notation";
  import {
    agrandissementVisible,
    analyser,
    coinRessort,
    COTES,
    dente,
    grille,
    largeur,
    PIECES,
    pieceVisible,
    prixPiece,
    prochainAgrandissement,
    restantes,
    TOUR,
    type EtatPiece,
    type IdPiece,
  } from "../logique/regles";
  import Piece from "./Piece.svelte";
  import { VARIABLES } from "./theme";

  let { etat, agir, noyau, o, mode }: ProprietesVue<EtatAtelier, ActionAtelier> = $props();

  const t = (cle: string, valeurs: Record<string, number> = {}) => remplir(o(cle), valeurs);
  /** Pendant la remontée, l'atelier se montre, et rien ne s'y fait. */
  const envoyer = (action: ActionAtelier) => {
    if (mode === "jeu") agir(action);
  };

  const analyse = $derived(analyser(etat));
  // Le filet (fiche, § 4) : si le joueur n'a pas creusé cinq minutes après le seuil, une fissure part
  // du ressort, traverse le plan et monte vers le bouton du bandeau.
  const fissure = $derived(avanceeFissure(etat.temps, etat.seuilAtteintA));
  let ressort: HTMLElement | undefined = $state();
  const n = $derived(etat.taille);
  const r = $derived(coinRessort(etat.taille));
  const libres = $derived.by(() => {
    const g = grille(etat);
    const cases: [number, number][] = [];
    for (let l = 0; l < n; l++)
      for (let c = 0; c < n; c++) if (g[l * n + c] === 0) cases.push([l, c]);
    return cases;
  });
  const posees = $derived(etat.pieces.filter((p) => p.case));
  const surEtabli = $derived(etat.pieces.filter((p) => !p.case));
  const legende = $derived(etat.legende.slice(-8).reverse());
  const agrandissement = $derived(prochainAgrandissement(etat));

  /** La pièce en main, par son repère : achetée, prise sur l'établi ou sur le plan. */
  let main: number | null = $state(null);
  const enMain = $derived(main === null ? undefined : etat.pieces.find((p) => p.repere === main));

  /** Une gêne se montre au bout d'un tour (fiche, § 3). */
  function montree(cle: string | undefined): boolean {
    if (cle === undefined) return false;
    const debut = etat.genes[cle];
    return debut !== undefined && etat.temps - debut >= TOUR - 1e-9;
  }

  /**
   * Ce que dit une pièce à un lecteur d'écran : « Pièce 14, cliquet, dent à gauche, tourne, frotte à
   * gauche ».
   */
  function description(p: PieceAtelier, info: EtatPiece | undefined): string {
    const mots = [t("piece.etiquette", { piece: p.repere }), o(`piece.${p.id}`).toLowerCase()];
    const dents = COTES.filter((d) => dente(p, d));
    if (dents.length === 0) mots.push(o("piece.sans-dent"));
    else {
      const cotes = dents.map((d) => o(`cote.${d}`)).join(", ");
      mots.push(`${o(dents.length === 1 ? "piece.dent" : "piece.dents")} ${cotes}`);
    }
    if (info) {
      mots.push(info.entrainee ? o("piece.tourne") : o("piece.immobile"));
      const frotte = COTES.filter((d) => info.cotes[d]!.some((x) => montree(x.cle)));
      if (frotte.length > 0) {
        mots.push(`${o("piece.frotte")} ${frotte.map((d) => o(`cote.${d}`)).join(", ")}`);
      }
    }
    return mots.join(", ");
  }

  function acheter(id: IdPiece): void {
    envoyer({ type: "acheter", piece: id });
    // Elle vient en main : son repère sera le prochain.
    main = etat.pieces.length + 1;
  }

  /** Une case libre : on y pose la pièce en main, ou on l'y déplace. */
  function cliquerCase(l: number, c: number): void {
    if (!enMain) return;
    if (enMain.case) envoyer({ type: "deplacer", repere: enMain.repere, case: [l, c] });
    else envoyer({ type: "poser", repere: enMain.repere, case: [l, c], rot: enMain.rot });
    main = null;
  }

  /** Une pièce : on la prend, on la repose, ou on l'échange avec celle qu'on tient. */
  function cliquerPiece(p: PieceAtelier): void {
    if (main === null) main = p.repere;
    else if (main === p.repere) main = null;
    else {
      envoyer({ type: "echanger", a: main, b: p.repere });
      main = null;
    }
  }

  function tourner(e: MouseEvent, p: PieceAtelier): void {
    e.preventDefault();
    envoyer({ type: "tourner", repere: p.repere });
  }

  /** Une touche tapée dans un champ, comme ceux des outils de développement, ne vise pas le plan. */
  function dansUnChamp(e: KeyboardEvent): boolean {
    const cible = e.target;
    return (
      cible instanceof HTMLElement &&
      (cible.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(cible.tagName))
    );
  }

  // La notice (fiche, § 11) : une page courte, comme la notice d'un plan. L'ouvrir est noté, pour
  // l'acte « sans aide » (§ 7).
  const SECTIONS_AIDE = ["plan", "dents", "mouvement", "nomenclature", "nombres"];
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
    if (dansUnChamp(e)) return;
    if (e.key === "Escape" && aideOuverte) {
      refermerAide();
      return;
    }
    if (e.key === "Escape") main = null;
    // Ctrl+R et ses semblables appartiennent au navigateur.
    const modifiee = e.ctrlKey || e.metaKey || e.altKey;
    if ((e.key === "r" || e.key === "R") && !modifiee && enMain)
      envoyer({ type: "tourner", repere: enMain.repere });
  }
</script>

<svelte:window onkeydown={touche} />

<section class="atelier" style="{VARIABLES}; --n: {n}" data-test="atelier">
  <header class="entete">
    <h2>{o("titre")}</h2>
    <p>
      <span class="libelle">{o("stock")}</span>
      <strong data-test="stock">{t("stock.valeur", { stock: etat.stock })}</strong>
    </p>
    <p>
      <span class="libelle">{o("production")}</span>
      <strong data-test="production"
        >{t("production.valeur", { production: analyse.production })}</strong
      >
    </p>
    <p data-test="cases">
      {analyse.casesLibres > 0
        ? t("cases.valeur", { cases: analyse.casesLibres })
        : o("cases.aucune")}
    </p>
    <button
      class="lien-aide"
      bind:this={lienAide}
      aria-expanded={aideOuverte}
      aria-controls="aide-atelier"
      onclick={() => (aideOuverte ? refermerAide() : ouvrirAide())}
      data-test="lien-aide">{o("aide")}</button
    >
  </header>

  <div class="centre">
    <div class="plan" aria-label={o("plan")} data-test="plan">
      <div
        class="ressort"
        bind:this={ressort}
        style="grid-area: {r + 1} / {r + 1} / span 2 / span 2"
        role="img"
        aria-label={o("ressort")}
      >
        <Piece
          piece={{ id: "grandeRoue", repere: 0, case: null, rot: 0, limees: [] }}
          info={{
            entrainee: true,
            engrenes: 0,
            frottements: 0,
            dentsLibres: 0,
            auRessort: false,
            production: 0,
            cotes: [[], [], [], []],
          }}
        />
      </div>
      {#each libres as [l, c] (`${l},${c}`)}
        <button
          class="case"
          style="grid-area: {l + 1} / {c + 1}"
          aria-label={t("case.libre", { ligne: l + 1, colonne: c + 1 })}
          data-case="{l},{c}"
          disabled={mode !== "jeu"}
          onclick={() => cliquerCase(l, c)}
        ></button>
      {/each}
      {#each posees as p (p.repere)}
        {@const info = analyse.pieces.get(p.repere)}
        {@const s = largeur(p)}
        <button
          class="piece"
          class:en-main={main === p.repere}
          style="grid-area: {p.case![0] + 1} / {p.case![1] + 1} / span {s} / span {s}"
          aria-label={description(p, info)}
          aria-pressed={main === p.repere}
          data-piece={p.repere}
          disabled={mode !== "jeu"}
          onclick={() => cliquerPiece(p)}
          oncontextmenu={(e) => tourner(e, p)}
        >
          <Piece piece={p} {info} numero={formaterEntier(p.repere)} {montree} />
        </button>
      {/each}
    </div>

    <!-- L'établi : les pièces achetées qui ne sont pas sur le plan, et la lime. -->
    <section class="etabli" data-test="etabli">
      <h3>{o("etabli")}</h3>
      <ul>
        {#each surEtabli as p (p.repere)}
          {@const s = largeur(p)}
          <li style="--s: {s}">
            <button
              class="piece"
              class:en-main={main === p.repere}
              aria-label={description(p, undefined)}
              aria-pressed={main === p.repere}
              data-piece={p.repere}
              disabled={mode !== "jeu"}
              onclick={() => (main = main === p.repere ? null : p.repere)}
              oncontextmenu={(e) => tourner(e, p)}
            >
              <Piece piece={p} numero={formaterEntier(p.repere)} />
            </button>
          </li>
        {/each}
        {#if etat.sansPlan}
          <li class="sans-plan" data-test="sans-plan">{o("sans-plan")}</li>
        {/if}
      </ul>
      {#if surEtabli.length === 0 && !etat.sansPlan}
        <p class="vide">{o("etabli.vide")}</p>
      {/if}
      <p class="lime">{o("lime")}</p>

      {#if enMain}
        <div class="main" data-test="main">
          <p>
            {o("main")} : {t("piece.etiquette", { piece: enMain.repere })},
            {o(`piece.${enMain.id}`).toLowerCase()}
          </p>
          <button onclick={() => envoyer({ type: "tourner", repere: enMain.repere })}
            >{o("main.tourner")}</button
          >
          {#if enMain.case}
            <button
              onclick={() => {
                envoyer({ type: "mettreDeCote", repere: enMain.repere });
                main = null;
              }}>{o("main.de-cote")}</button
            >
          {/if}
          {#each COTES as d (d)}
            {#if dente(enMain, d)}
              <button
                data-test="limer-{d}"
                onclick={() => envoyer({ type: "limer", repere: enMain.repere, cote: d })}
                >{o("main.limer")} {o(`cote.${d}`)}</button
              >
            {/if}
          {/each}
          <button onclick={() => (main = null)}>{o("main.lacher")}</button>
        </div>
      {/if}
    </section>
  </div>

  <div class="droite">
    <!-- La nomenclature : un tableau à colonnes, comme un cartouche ; sa dernière ligne agrandit le plan. -->
    <table class="nomenclature" data-test="nomenclature">
      <caption>{o("nomenclature")}</caption>
      <thead>
        <tr>
          <th scope="col">{o("nomenclature.repere")}</th>
          <th scope="col">{o("nomenclature.designation")}</th>
          <th scope="col">{o("nomenclature.profil")}</th>
          <th scope="col">{o("nomenclature.exemplaires")}</th>
          <th scope="col">{o("nomenclature.base")}</th>
          <th scope="col">{o("nomenclature.prix")}</th>
        </tr>
      </thead>
      <tbody>
        {#each PIECES as d, i (d.id)}
          {#if pieceVisible(etat, d)}
            {@const reste = restantes(etat, d)}
            {@const prix = prixPiece(etat, d)}
            <tr data-test="nomenclature-{d.id}">
              <td>{formaterEntier(i + 1)}</td>
              <td class="designation">
                {o(`piece.${d.id}`)}
                <!-- La note de la pièce, au survol de sa ligne ou quand son prix a le focus. -->
                <span class="note" id="note-{d.id}" role="tooltip" data-test="note-{d.id}"
                  >{o(`piece.${d.id}.note`)}</span
                >
              </td>
              <td class="profil" style="--s: {d.largeur}">
                <Piece piece={{ id: d.id, repere: 0, case: null, rot: 0, limees: [] }} />
              </td>
              <td>{formaterEntier(reste)}</td>
              <td>{formaterEntier(d.base)}</td>
              <td>
                {#if reste > 0}
                  <button
                    class="acheter"
                    aria-describedby="note-{d.id}"
                    disabled={mode !== "jeu" || etat.stock < prix}
                    onclick={() => acheter(d.id)}>{formaterEntier(prix)}</button
                  >
                {:else}
                  {o("nomenclature.epuisee")}
                {/if}
              </td>
            </tr>
          {/if}
        {/each}
        <tr class="agrandir">
          {#if agrandissement && agrandissementVisible(etat)}
            <td colspan="5">{t("agrandir", { taille: agrandissement.taille })}</td>
            <td>
              <button
                class="acheter"
                data-test="agrandir"
                disabled={mode !== "jeu" || etat.stock < agrandissement.prix}
                onclick={() => envoyer({ type: "agrandir" })}
                >{formaterEntier(agrandissement.prix)}</button
              >
            </td>
          {:else if !agrandissement}
            <td colspan="6">{o("plan.complet")}</td>
          {/if}
        </tr>
      </tbody>
    </table>

    <section class="legende">
      <h3>{o("legende")}</h3>
      <ol data-test="legende">
        {#each legende as ligne, i (etat.legende.length - i)}
          <li>{ecrireLigne(ligne, o(ligne.cle))}</li>
        {/each}
      </ol>
    </section>
  </div>

  {#if aideOuverte}
    <div
      class="aide"
      id="aide-atelier"
      bind:this={pageAide}
      tabindex="-1"
      role="dialog"
      aria-labelledby="aide-titre"
      data-test="aide"
    >
      <h3 id="aide-titre">{o("aide.titre")}</h3>
      {#each SECTIONS_AIDE as section (section)}
        <h4>{o(`aide.${section}.titre`)}</h4>
        <p>{o(`aide.${section}`)}</p>
      {/each}
      <button class="refermer" onclick={refermerAide}>{o("aide.fermer")}</button>
    </div>
  {/if}

  {#if fissure > 0}
    <Fissure depart={ressort} avancee={fissure} />
  {/if}
</section>

<style>
  .atelier {
    --case: min(44px, calc((100vw / var(--zoom, 1) - 32px) / var(--n, 12)));
    display: grid;
    flex: 1 0 auto;
    grid-template-areas: "entete entete" "centre droite";
    grid-template-columns: auto minmax(18rem, 30rem);
    gap: 16px 32px;
    align-content: start;
    justify-content: center;
    box-sizing: border-box;
    padding: 20px 16px 40px;
    font:
      15px/1.4 Bahnschrift,
      "DIN Alternate",
      "DIN 2014",
      "Barlow Semi Condensed",
      "Arial Narrow",
      sans-serif;
    font-variant-numeric: tabular-nums;
    color: var(--graphite);
    background-color: var(--papier);
  }
  h2,
  h3,
  p {
    margin: 0;
  }
  h2,
  h3,
  caption {
    font-weight: 400;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  h2 {
    font-size: 18px;
  }
  h3,
  caption {
    margin-bottom: 6px;
    font-size: 13px;
    text-align: start;
    color: var(--graphite-doux);
  }
  ul,
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  button {
    font: inherit;
    color: inherit;
  }

  .entete {
    display: flex;
    flex-wrap: wrap;
    grid-area: entete;
    gap: 8px 32px;
    align-items: baseline;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--graphite);
  }
  .libelle {
    margin-right: 6px;
    font-size: 13px;
    color: var(--graphite-doux);
    text-transform: uppercase;
  }
  .entete strong {
    font-size: 20px;
    font-weight: 600;
  }

  /* La largeur du plan et de son cadre : l'établi s'y range, sans pousser la nomenclature. */
  .centre {
    display: flex;
    flex-direction: column;
    grid-area: centre;
    gap: 16px;
    width: calc(var(--n) * var(--case) + 4px);
  }
  /* Le plan : le quadrillage dans son cadre. */
  .plan {
    display: grid;
    grid-template-columns: repeat(var(--n), var(--case));
    grid-template-rows: repeat(var(--n), var(--case));
    width: max-content;
    border: 2px solid var(--graphite);
    background-image:
      linear-gradient(var(--quadrillage) 1px, transparent 1px),
      linear-gradient(90deg, var(--quadrillage) 1px, transparent 1px);
    background-size: var(--case) var(--case);
  }
  .case,
  .piece {
    padding: 0;
    cursor: pointer;
    background: none;
    border: none;
  }
  .case:hover:enabled {
    background: color-mix(in oklab, var(--quadrillage), transparent 50%);
  }
  .case:focus-visible,
  .piece:focus-visible {
    outline: 2px solid var(--graphite);
    outline-offset: -2px;
  }
  .piece.en-main {
    outline: 2px dashed var(--graphite);
    outline-offset: -1px;
  }
  .case:disabled,
  .piece:disabled {
    cursor: default;
  }

  .etabli ul {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    min-height: var(--case);
  }
  .etabli li {
    width: calc(var(--s) * var(--case));
    height: calc(var(--s) * var(--case));
  }
  .etabli .piece {
    width: 100%;
    height: 100%;
  }
  .etabli li.sans-plan {
    display: grid;
    width: auto;
    height: var(--case);
    padding: 0 8px;
    place-items: center;
    font-size: 13px;
    border: 1px dashed var(--graphite-doux);
  }
  .vide,
  .lime {
    font-size: 13px;
    color: var(--graphite-doux);
  }
  .lime {
    margin-top: 6px;
  }
  .main {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: baseline;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--quadrillage);
  }
  .main p {
    flex-basis: 100%;
  }
  .main button,
  .acheter {
    padding: 2px 8px;
    cursor: pointer;
    background: transparent;
    border: 1px solid var(--graphite);
    border-radius: 2px;
  }
  .main button:hover,
  .acheter:hover:enabled {
    background: var(--quadrillage);
  }
  .acheter:disabled {
    color: var(--graphite-doux);
    cursor: default;
    border-color: var(--quadrillage);
  }

  .droite {
    display: flex;
    flex-direction: column;
    grid-area: droite;
    gap: 20px;
  }
  .nomenclature {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .nomenclature th {
    font-size: 12px;
    font-weight: 400;
    color: var(--graphite-doux);
    text-align: start;
  }
  .nomenclature th,
  .nomenclature td {
    padding: 3px 6px;
    border-bottom: 1px solid var(--quadrillage);
  }
  .nomenclature td:nth-child(4),
  .nomenclature td:nth-child(5),
  .nomenclature td:last-child {
    text-align: end;
  }
  /* La note d'une pièce : une ligne de nomenclature de plus, au survol ou au clavier. */
  .note {
    display: none;
    font-size: 12px;
    color: var(--graphite-doux);
  }
  .nomenclature tr:hover .note,
  .nomenclature tr:focus-within .note {
    display: block;
  }
  .profil > :global(svg) {
    width: calc(var(--s) * 14px);
    height: calc(var(--s) * 14px);
  }
  .legende li {
    padding: 2px 0;
    border-bottom: 1px solid var(--quadrillage);
  }
  .legende li + li {
    color: var(--graphite-doux);
  }

  /* Le lien de la notice : un mot au graphite, au bout de l'en-tête. */
  .lien-aide {
    margin-inline-start: auto;
    padding: 2px 4px;
    font-size: 13px;
    letter-spacing: 0.06em;
    color: var(--graphite-doux);
    text-transform: uppercase;
    cursor: pointer;
    background: none;
    border: none;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .lien-aide:hover {
    color: var(--graphite);
  }
  .lien-aide:focus-visible,
  .refermer:focus-visible {
    outline: 1px solid var(--graphite);
    outline-offset: 2px;
  }
  /* La notice : une feuille posée sur le plan, au trait. L'atelier continue de tourner dessous. */
  .aide {
    position: fixed;
    top: 40px;
    right: 16px;
    z-index: 4;
    box-sizing: border-box;
    width: min(26rem, calc(100vw / var(--zoom, 1) - 32px));
    max-height: calc(100vh / var(--zoom, 1) - 56px);
    padding: 16px 20px 18px;
    overflow: auto;
    background: var(--papier);
    border: 1px solid var(--graphite);
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.18);
  }
  .aide:focus {
    outline: none;
  }
  .aide h4 {
    margin: 12px 0 2px;
    font-size: 14px;
    font-weight: 600;
  }
  .aide p {
    color: var(--graphite-doux);
  }
  .refermer {
    margin-top: 14px;
    padding: 0;
    cursor: pointer;
    background: none;
    border: none;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  @media (max-width: 900px) {
    .atelier {
      grid-template-areas: "entete" "centre" "droite";
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>

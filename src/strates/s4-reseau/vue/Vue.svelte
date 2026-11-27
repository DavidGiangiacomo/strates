<script lang="ts">
  // Le réseau (fiche, § 6), en schéma sobre, en attendant sa direction artistique (#83). Le plan
  // occupe le haut : les sources, les bassins et leurs jauges, la ville en bas. Les conduites posées
  // sont des traits d'autant plus épais que leur calibre est fort ; les tracés libres sont en
  // pointillés, avec leur prix. Un clic sur un tracé libre, ou Entrée au clavier, pose la conduite ;
  // un clic sur une conduite posée ouvre son regard : son débit, son calibre, « élargir », et sa
  // vanne. À droite, le carnet de relevés, la ligne la plus récente en haut. Les nombres s'écrivent
  // en entier, les milliers séparés d'un point, et se disent sans séparateur aux lecteurs d'écran.
  import type { ProprietesVue } from "../../../noyau/logique/types";
  import {
    aPlein,
    conduite,
    contenance,
    debitSource,
    enService,
    nomDe,
    NOEUDS,
    paru,
    porte,
    prixDe,
    reliable,
    type ActionReseau,
    type Conduite,
    type EtatReseau,
    type IdNoeud,
    type LigneCarnet,
    type Ouverture,
  } from "../logique";
  import { formaterMuids, formaterPouces, pourLecteur, remplir } from "../logique/notation";
  import {
    BASSINS,
    capacite,
    EPSILON,
    IDS_SOURCES,
    OUVERTURES,
    trace,
    TRACES,
    type IdSource,
  } from "../logique/regles";
  import {
    BASSIN,
    bouts,
    epaisseur,
    HAUTEUR,
    LARGEUR,
    POSITIONS,
    RAYON_SOURCE,
    VILLE,
  } from "./plan";

  let { etat, agir, o, mode }: ProprietesVue<EtatReseau, ActionReseau> = $props();

  /** Les lignes du carnet que la vue montre. */
  const LIGNES = 10;

  // Pendant la remontée, le plan se montre, et rien ne s'y fait.
  const actif = $derived(mode === "jeu");
  /** La conduite dont le regard est ouvert. */
  let choisie = $state<number | null>(null);
  const regard = $derived(choisie === null ? undefined : conduite(etat, choisie));

  const t = (cle: string, valeurs: Record<string, string> = {}) => remplir(o(cle), valeurs);
  const nom = (n: IdNoeud) => nomDe(etat, n);

  /** Les tracés qu'on voit : ceux dont les deux bouts ont paru. */
  const traces = $derived(TRACES.filter((tr) => paru(etat, tr.de) && paru(etat, tr.vers)));
  const sources = $derived(IDS_SOURCES.filter((k) => paru(etat, `source${k}`)));
  const bassins = $derived(BASSINS.filter((b) => paru(etat, b)));
  const lignes = $derived(etat.carnet.slice(-LIGNES).reverse());

  /** Le débit d'une conduite au dernier instant. */
  const debit = (c: Conduite) => etat.debits[c.trace] ?? 0;
  /** Une conduite est pleine quand elle porte tout ce qu'elle peut. */
  const pleine = (c: Conduite) => porte(c) > 0 && debit(c) >= porte(c) * (1 - 1e-6);
  /** La part de sa contenance que l'eau occupe, au-dessus du niveau de service. */
  function remplissage(n: IdNoeud): number {
    const c = contenance(etat, n);
    const a = etat.attente[n] ?? 0;
    return c > 0 ? Math.min(1, a / c) : a > 0 ? 1 : 0;
  }
  const monte = (n: IdNoeud) => etat.montees[n] !== undefined;

  function geste(numero: number): void {
    if (!actif) return;
    if (conduite(etat, numero)) {
      choisie = choisie === numero ? null : numero;
      return;
    }
    if (reliable(etat, numero)) {
      agir({ type: "relier", trace: numero });
      choisie = numero;
    }
  }

  function clavier(e: KeyboardEvent, numero: number): void {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    geste(numero);
  }

  function elargir(numero: number): void {
    if (actif) agir({ type: "elargir", trace: numero });
  }

  function vanne(numero: number, ouverture: Ouverture): void {
    if (actif) agir({ type: "vanne", trace: numero, ouverture });
  }

  /** Le prix écrit, ou « au plus large ». */
  function prixEcrit(numero: number): string | null {
    const p = prixDe(etat, numero);
    return p === null ? null : formaterMuids(p);
  }

  /** Un tracé, tel que le lecteur d'écran le dit. */
  function etiquette(numero: number): string {
    const tr = trace(numero)!;
    const c = conduite(etat, numero);
    const de = nom(tr.de);
    const vers = nom(tr.vers);
    if (!c) {
      return pourLecteur(
        t("trace.libre", {
          conduite: String(numero),
          de,
          vers,
          prix: prixEcrit(numero) ?? "",
        }),
      );
    }
    return pourLecteur(
      t("trace.pose", {
        conduite: String(numero),
        de,
        vers,
        debit: formaterPouces(debit(c)),
        capacite: formaterPouces(porte(c)),
      }),
    );
  }

  /** Une ligne du carnet, ses nombres écrits. */
  function ligne(l: LigneCarnet): string {
    const v = l.valeurs;
    const valeurs: Record<string, string> = {};
    if (v.noeud !== undefined) valeurs.noeud = nom(NOEUDS[v.noeud]!);
    if (v.source !== undefined) valeurs.source = String(v.source);
    if (v.conduite !== undefined) valeurs.conduite = String(v.conduite);
    if (v.debit !== undefined) valeurs.debit = formaterPouces(v.debit);
    if (v.minutes !== undefined) valeurs.minutes = String(v.minutes);
    const cle = l.cle === "carnet.vanne" ? `carnet.vanne.${v.quarts}` : l.cle;
    return t(cle, valeurs);
  }

  const libelleOuverture = (x: Ouverture) => o(`ouverture.${x * 4}`);
  const recoit = $derived(formaterPouces(etat.recoit));
  const sourceDebit = (k: IdSource) => formaterPouces(debitSource(etat, k));
  const surTrace = (numero: number) => {
    const { x1, y1, x2, y2 } = bouts(trace(numero)!.de, trace(numero)!.vers);
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
  };
</script>

<section class="reseau" aria-label={o("plan")}>
  <header class="haut">
    <p>
      <span class="libelle">{o("provision")}</span>
      <strong aria-label={pourLecteur(formaterMuids(etat.caisse))}
        >{formaterMuids(etat.caisse)}</strong
      >
    </p>
    <p data-test="recoit" aria-label={pourLecteur(t("ville.recoit", { debit: recoit }))}>
      {t("ville.recoit", { debit: recoit })}
    </p>
    <p>
      <span class="libelle">{o("compteur")}</span>
      <strong aria-label={pourLecteur(formaterMuids(etat.recu))}>{formaterMuids(etat.recu)}</strong>
    </p>
  </header>

  <div class="pages">
    <div class="plan">
      <svg viewBox="0 0 {LARGEUR} {HAUTEUR}" preserveAspectRatio="xMidYMid meet">
        <rect
          class="ville"
          x={VILLE.x}
          y={VILLE.y}
          width={VILLE.largeur}
          height={VILLE.hauteur}
          aria-hidden="true"
        />
        <text class="nom" x={POSITIONS.ville.x} y={VILLE.y + 36} aria-hidden="true"
          >{o("noeud.ville")}</text
        >

        {#each traces as tr (tr.numero)}
          {@const c = conduite(etat, tr.numero)}
          {@const b = bouts(tr.de, tr.vers)}
          {@const m = surTrace(tr.numero)}
          {@const couche = Math.abs(b.y2 - b.y1) < 1}
          <g
            class="trace"
            class:pose={!!c}
            class:libre={!c}
            class:pleine={c ? pleine(c) : false}
            class:choisie={choisie === tr.numero}
            role="button"
            tabindex="0"
            data-trace={tr.numero}
            aria-label={etiquette(tr.numero)}
            aria-disabled={!actif || (!c && !reliable(etat, tr.numero))}
            onclick={() => geste(tr.numero)}
            onkeydown={(e) => clavier(e, tr.numero)}
          >
            <line class="prise" x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />
            <line
              class="conduite"
              x1={b.x1}
              y1={b.y1}
              x2={b.x2}
              y2={b.y2}
              stroke-width={c ? epaisseur(c.calibre) : 2}
            />
            {#if c && pleine(c)}
              <line class="double" x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} stroke-width={1.5} />
            {/if}
            <!-- Un raccourci couché porte son numéro au-dessus, son prix dessous ; les autres, à droite. -->
            <text
              class="numero"
              class:centre={couche}
              x={couche ? m.x : m.x + 10}
              y={couche ? m.y - 10 : m.y - 6}
              aria-hidden="true">{tr.numero}</text
            >
            {#if !c}
              <text
                class="prix"
                class:centre={couche}
                x={couche ? m.x : m.x + 10}
                y={couche ? m.y + 20 : m.y + 14}
                aria-hidden="true">{prixEcrit(tr.numero)}</text
              >
            {/if}
          </g>
        {/each}

        {#each bassins as b (b)}
          {@const p = POSITIONS[b]}
          {@const r = remplissage(b)}
          <g
            class="bassin"
            class:service={enService(etat, b)}
            class:monte={monte(b)}
            data-bassin={b}
            role="img"
            aria-label={monte(b) ? t("noeud.monte", { noeud: nom(b) }) : nom(b)}
          >
            <rect
              x={p.x - BASSIN.largeur / 2}
              y={p.y - BASSIN.hauteur / 2}
              width={BASSIN.largeur}
              height={BASSIN.hauteur}
            />
            <rect
              class="jauge"
              x={p.x + BASSIN.largeur / 2 - 12}
              y={p.y + BASSIN.hauteur / 2 - 4 - (BASSIN.hauteur - 8) * r}
              width={8}
              height={(BASSIN.hauteur - 8) * r}
            />
            <text class="nom" x={p.x - 6} y={p.y + 4} aria-hidden="true">{nom(b)}</text>
            {#if monte(b)}
              <text class="fleche" x={p.x + BASSIN.largeur / 2 - 8} y={p.y - BASSIN.hauteur / 2 - 6}
                >▲</text
              >
            {/if}
          </g>
        {/each}

        {#each sources as k (k)}
          {@const n = `source${k}` as IdNoeud}
          {@const p = POSITIONS[n]}
          <g
            class="source"
            class:reliee={etat.reliees[k] !== undefined}
            class:monte={monte(n)}
            role="img"
            aria-label={etat.reliees[k] === undefined
              ? t("source.sansDebit", { noeud: nom(n) })
              : pourLecteur(`${nom(n)}, ${sourceDebit(k)}`)}
          >
            <circle cx={p.x} cy={p.y} r={RAYON_SOURCE} />
            <text class="nom" x={p.x} y={p.y - RAYON_SOURCE - 8} aria-hidden="true">{nom(n)}</text>
            {#if etat.reliees[k] !== undefined}
              <text class="debit" x={p.x} y={p.y + 5} aria-hidden="true"
                >{aPlein(etat, k) ? "●" : "◐"}</text
              >
            {/if}
          </g>
        {/each}
      </svg>
    </div>

    <aside class="cote">
      <section class="regard" aria-labelledby="reseau-regard" aria-live="polite">
        <h2 id="reseau-regard">{o("regard")}</h2>
        {#if regard}
          {@const numero = regard.trace}
          <p
            data-test="regard"
            aria-label={pourLecteur(
              t("regard.conduite", {
                conduite: String(numero),
                debit: formaterPouces(debit(regard)),
                capacite: formaterPouces(capacite(regard.calibre)),
              }),
            )}
          >
            {t("regard.conduite", {
              conduite: String(numero),
              debit: formaterPouces(debit(regard)),
              capacite: formaterPouces(capacite(regard.calibre)),
            })}
          </p>
          <p>{t("regard.vanne", { ouverture: libelleOuverture(regard.vanne) })}</p>
          <p class="gestes">
            {#if prixDe(etat, numero) === null}
              <span>{o("geste.auPlusLarge")}</span>
            {:else}
              <button
                type="button"
                data-test="elargir"
                disabled={!actif || etat.caisse + EPSILON < prixDe(etat, numero)!}
                onclick={() => elargir(numero)}
                aria-label={pourLecteur(t("geste.elargir", { prix: prixEcrit(numero)! }))}
                >{t("geste.elargir", { prix: prixEcrit(numero)! })}</button
              >
            {/if}
          </p>
          <fieldset class="vanne" disabled={!actif}>
            <legend>{o("vanne")}</legend>
            {#each OUVERTURES as x (x)}
              <label>
                <input
                  type="radio"
                  name="vanne-{numero}"
                  checked={regard.vanne === x}
                  onchange={() => vanne(numero, x)}
                />
                {libelleOuverture(x)}
              </label>
            {/each}
          </fieldset>
        {:else}
          <p class="vide">{o("regard.choisir")}</p>
        {/if}
      </section>

      <section class="carnet" aria-labelledby="reseau-carnet">
        <h2 id="reseau-carnet">{o("carnet")}</h2>
        <ol data-test="carnet">
          {#each lignes as l, i (etat.ecrites - i)}
            <li aria-live={i === 0 ? "polite" : undefined}>{ligne(l)}</li>
          {/each}
        </ol>
      </section>
    </aside>
  </div>
</section>

<style>
  .reseau {
    --pierre: #f1ece2;
    --encre: #1f2328;
    --plomb: #6b7076;
    --eau: #3a7fb0;
    --pointille: #9a958c;
    background: var(--pierre);
    color: var(--encre);
    min-height: calc(100vh / var(--zoom, 1) - 24px);
    padding: 0.75rem 1rem 1.5rem;
    box-sizing: border-box;
    font-family: Palatino, "Palatino Linotype", "Book Antiqua", Georgia, serif;
  }
  .haut {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 2rem;
    font-variant-numeric: tabular-nums;
  }
  .haut p {
    margin: 0;
  }
  .libelle {
    margin-right: 0.4rem;
  }
  .pages {
    display: grid;
    grid-template-columns: minmax(0, 3fr) minmax(16rem, 1fr);
    gap: 1rem;
    margin-top: 0.75rem;
  }
  @media (max-width: 760px) {
    .pages {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  /* Sur un téléphone, le plan garde une taille lisible et défile en largeur, seul. */
  .plan {
    overflow-x: auto;
  }
  @media (max-width: 760px) {
    svg {
      min-width: 720px;
    }
  }
  .centre {
    text-anchor: middle;
  }
  .ville {
    fill: #e2dccf;
    stroke: var(--plomb);
  }
  .nom {
    font-size: 15px;
    text-anchor: middle;
    fill: var(--encre);
  }
  .trace {
    cursor: pointer;
    outline: none;
  }
  .trace .prise {
    stroke: transparent;
    stroke-width: 22;
  }
  .trace .conduite {
    stroke: var(--plomb);
  }
  .trace.libre .conduite {
    stroke: var(--pointille);
    stroke-dasharray: 6 6;
  }
  .trace.pose .conduite {
    stroke: var(--eau);
  }
  .trace .double {
    stroke: var(--pierre);
  }
  .trace.choisie .conduite,
  .trace:focus-visible .conduite {
    stroke: var(--encre);
  }
  .trace[aria-disabled="true"] {
    cursor: default;
  }
  .numero,
  .prix {
    font-size: 13px;
    fill: var(--encre);
    font-variant-numeric: tabular-nums;
  }
  .prix {
    fill: var(--plomb);
  }
  .bassin rect:first-child {
    fill: #faf7f1;
    stroke: var(--plomb);
    stroke-dasharray: 4 4;
  }
  .bassin.service rect:first-child {
    stroke-dasharray: none;
  }
  .bassin.monte rect:first-child {
    stroke: var(--encre);
    stroke-width: 3;
  }
  .jauge {
    fill: var(--eau);
  }
  .fleche {
    font-size: 14px;
    fill: var(--encre);
  }
  .source circle {
    fill: #faf7f1;
    stroke: var(--plomb);
    stroke-dasharray: 4 3;
  }
  .source.reliee circle {
    fill: #cfe0ec;
    stroke-dasharray: none;
  }
  .source.monte circle {
    stroke: var(--encre);
    stroke-width: 3;
  }
  .debit {
    font-size: 14px;
    text-anchor: middle;
    fill: var(--eau);
  }
  .cote h2 {
    font-size: 1.05rem;
    margin: 0 0 0.4rem;
    font-style: italic;
    font-weight: normal;
  }
  .regard p,
  .carnet ol {
    font-variant-numeric: tabular-nums;
  }
  .regard p {
    margin: 0.2rem 0;
  }
  .vide {
    color: var(--plomb);
  }
  .gestes button {
    font: inherit;
    padding: 0.2rem 0.6rem;
  }
  .vanne {
    border: none;
    padding: 0;
    margin: 0.4rem 0 1rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.8rem;
  }
  .vanne legend {
    padding: 0;
    margin-bottom: 0.2rem;
  }
  .carnet ol {
    list-style: none;
    margin: 0;
    padding: 0;
    font-style: italic;
  }
  .carnet li {
    margin: 0.15rem 0;
  }
  .carnet li:first-child {
    font-weight: bold;
  }
</style>

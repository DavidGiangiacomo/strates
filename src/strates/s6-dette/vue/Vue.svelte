<script lang="ts">
  // La dette (fiche, § 6), en livre de comptes sobre, en attendant sa direction artistique (#89).
  // - En haut : la caisse et le rapport, la confiance et ce qu'on doit, la crue qui vient.
  // - À gauche : la tablette ouverte, ses trois sortes et un bouton par terme, avec le montant dû et
  //   sa crue.
  // - Au centre : l'échéancier, dans l'ordre des crues, que la grande crue ferme.
  // - À droite : les dernières lignes du livre.
  // Les montants s'écrivent en sceaux, et se disent en lettres aux lecteurs d'écran. Le rouge et le
  // noir ne disent rien seuls : « Dû », « Honoré », « Reporté » sont écrits. Tout se fait au clavier.
  import { avanceeFissure } from "../../../noyau/logique/filet";
  import type { ProprietesVue } from "../../../noyau/logique/types";
  import Fissure from "../../../noyau/ui/Fissure.svelte";
  import type { ActionDette, Echeance, EtatDette, IdPromesse, LigneLivre, Terme } from "../logique";
  import { crueOrdinale, enLettres, formaterSceaux, remplir, type Sens } from "../logique/notation";
  import {
    confiance,
    couvre,
    CRUE,
    doit,
    EXEMPLAIRES,
    montantDu,
    prixExemplaire,
    rapport,
    SORTES,
    sortesDe,
    TABLETTES,
    tabletteDe,
    TERMES,
    toutDu,
  } from "../logique/regles";

  let { etat, agir, o, mode }: ProprietesVue<EtatDette, ActionDette> = $props();

  /**
   * Les lignes du livre que la vue montre, les plus récentes en bas. Chacune garde sa clé, son numéro
   * depuis l'arrivée : les lecteurs d'écran n'entendent que la nouvelle.
   */
  const LIGNES = 10;

  // Pendant la remontée, ou la dette finie, le livre se montre, et rien ne s'y fait.
  const actif = $derived(mode === "jeu" && etat.issue === null);
  // Le filet (fiche, § 4) : si le joueur n'a pas creusé cinq minutes après l'issue, une fissure part de
  // sa ligne, traverse le livre et monte vers « creuser ». La direction artistique la fera partir de
  // la grande crue, dans le compte des crues (#89).
  const fissure = $derived(avanceeFissure(etat.temps, etat.issueA));
  let ligneIssue: HTMLElement | undefined = $state();
  const derniere = $derived(etat.tablette === TABLETTES);
  const du = $derived(doit(etat));
  const plafond = $derived(confiance(etat));
  const parCrue = $derived(rapport(etat));
  const secondes = $derived(Math.max(0, Math.ceil((etat.crues + 1) * CRUE - etat.temps)));
  const sortes = $derived(
    sortesDe(etat.tablette).map((id) => {
      const n = etat.promises[id];
      return { id, n, prix: n < EXEMPLAIRES ? prixExemplaire(id, n) : null };
    }),
  );
  // Les échéances des quatre premières tablettes, une ligne chacune ; la dernière tablette tombe
  // d'un coup, à la grande crue, qui ferme la liste.
  const lignesDues = $derived(
    etat.echeances
      .filter((e) => tabletteDe(e.promesse) < TABLETTES)
      .sort((a, b) => (a.crue ?? Infinity) - (b.crue ?? Infinity) || a.numero - b.numero),
  );
  const toutCeQuiTombe = $derived(toutDu(etat));
  const lignesLivre = $derived(etat.livre.slice(-LIGNES));

  const t = (cle: string, valeurs: Record<string, string> = {}) => remplir(o(cle), valeurs);
  const ecrit = (x: number, sens: Sens = "pres") => formaterSceaux(x, sens);
  const dit = (x: number, sens: Sens = "pres") => enLettres(x, sens);

  function promettre(promesse: IdPromesse, terme: Terme): void {
    if (actif) agir({ type: "promettre", promesse, terme });
  }

  function solder(e: Echeance): void {
    if (actif) agir({ type: "solder", echeance: e.numero });
  }

  /** Une échéance dans la notation de la dette, montant écrit ou dit. */
  function ligneDue(e: Echeance, montant: (x: number) => string): string {
    return e.crue === null
      ? t("echeance.grandeCrue", { montant: montant(e.du) })
      : t("echeance", { crue: crueOrdinale(e.crue), montant: montant(e.du) });
  }

  /** Un terme sur son bouton : « à 6 crues : 1 500, à la 48ᵉ ». */
  function bouton(prix: number, terme: Terme | null, montant: (x: number) => string): string {
    const du = montantDu(prix, terme);
    return terme === null
      ? t("terme.grandeCrue", { montant: montant(du) })
      : t("terme", {
          n: String(terme),
          montant: montant(du),
          crue: crueOrdinale(etat.crues + terme),
        });
  }

  /** Une ligne du livre, ses nombres écrits ou dits. */
  function ligneLivre(l: LigneLivre, montant: (x: number) => string): string {
    const v = l.valeurs;
    const valeurs: Record<string, string> = {};
    if (v.crue !== undefined) valeurs.crue = crueOrdinale(v.crue);
    if (v.montant !== undefined) valeurs.montant = montant(v.montant);
    if (v.majoration !== undefined) valeurs.majoration = String(v.majoration).replace(".", ",");
    return t(l.cle, valeurs);
  }

  /** Ce qui s'écrit à l'encre rouge : ce qui est dû, reporté ou échu. */
  const rouge = (l: LigneLivre) => /reporte|echu|defaut|refus/.test(l.cle);
</script>

<section class="dette" aria-label={o("livre")}>
  <header class="haut">
    <p class="caisse">
      <span class="libelle">{o("caisse")}</span>
      <strong class="montant" aria-label={dit(etat.caisse, "bas")}
        >{ecrit(etat.caisse, "bas")}</strong
      >
      <span class="rapport">{t("rapport", { montant: ecrit(parCrue) })}</span>
    </p>
    <div class="confiance">
      <span class="libelle">{o("confiance")}</span>
      <span class="barre" aria-hidden="true">
        <span class="part" style:width="{Math.min(100, (du / plafond) * 100)}%"></span>
      </span>
      <span
        class="etat-confiance"
        aria-label={t("confiance.etat", { du: dit(du, "haut"), confiance: dit(plafond, "bas") })}
      >
        {t("confiance.etat", { du: ecrit(du, "haut"), confiance: ecrit(plafond, "bas") })}
      </span>
    </div>
    <p class="crue" data-test="crue">
      {t("crue.prochaine", { crue: crueOrdinale(etat.crues + 1), secondes: String(secondes) })}
    </p>
  </header>

  <div class="pages">
    <section class="tablette" aria-labelledby="dette-tablette">
      <h2 id="dette-tablette">{t("tablette", { n: String(etat.tablette) })}</h2>
      {#each sortes as s (s.id)}
        <div class="sorte" data-sorte={s.id}>
          <h3>{o(`promesse.${s.id}`)}</h3>
          <p class="encoches">
            <span aria-hidden="true">{"▮".repeat(EXEMPLAIRES - s.n)}{"▯".repeat(s.n)}</span>
            <span class="texte-encoches"
              >{t("sorte.restent", { n: String(EXEMPLAIRES - s.n) })}</span
            >
          </p>
          <p class="rapporte">{t("sorte.rapporte", { montant: ecrit(SORTES[s.id].rapport) })}</p>
          {#if s.prix !== null}
            {@const prix = s.prix}
            <div class="termes">
              {#each derniere ? [null] : TERMES as terme (terme ?? 0)}
                <button
                  type="button"
                  disabled={!actif}
                  aria-label={`${o(`promesse.${s.id}`)}, ${bouton(prix, terme, dit)}`}
                  onclick={() => promettre(s.id, terme ?? 2)}
                >
                  {bouton(prix, terme, ecrit)}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
      {#if etat.brisees > 0}
        <p class="brisees">{t("tablette.brisees", { n: String(etat.brisees) })}</p>
      {/if}
    </section>

    <section class="echeancier" aria-labelledby="dette-echeances">
      <h2 id="dette-echeances">{o("echeancier")}</h2>
      {#if etat.echeances.length === 0}
        <p class="vide">{o("echeancier.vide")}</p>
      {/if}
      <ol>
        {#each lignesDues as e (e.numero)}
          <li class="echeance" data-echeance={e.numero}>
            <span class="du" aria-label={ligneDue(e, dit)}>{ligneDue(e, ecrit)}</span>
            <span class="promesse">{o(`promesse.${e.promesse}`)}</span>
            {#if e.reports > 0}
              <span class="reports">{t("echeance.reports", { n: String(e.reports) })}</span>
            {/if}
            <button
              type="button"
              disabled={!actif || !couvre(etat.caisse, e.du)}
              aria-label={`${o("solder")} : ${ligneDue(e, dit)}`}
              onclick={() => solder(e)}
            >
              {o("solder")}
            </button>
          </li>
        {/each}
      </ol>
      {#if derniere && etat.issue === null}
        <p class="grande-crue" data-test="grande-crue">
          {etat.grandeCrue === null
            ? t("grandeCrue.attendue", { montant: ecrit(toutCeQuiTombe, "haut") })
            : t("grandeCrue.fixee", {
                crue: crueOrdinale(etat.grandeCrue),
                montant: ecrit(toutCeQuiTombe, "haut"),
              })}
        </p>
      {/if}
    </section>

    <section class="livre" aria-labelledby="dette-livre">
      <h2 id="dette-livre">{o("livre")}</h2>
      <ol aria-live="polite">
        {#each lignesLivre as l, i (etat.ecrites - lignesLivre.length + i)}
          <li class:rouge={rouge(l)} aria-label={ligneLivre(l, dit)}>{ligneLivre(l, ecrit)}</li>
        {/each}
      </ol>
    </section>
  </div>

  {#if etat.issue !== null}
    <p class="fin" role="status" bind:this={ligneIssue}>{o(`livre.${etat.issue}`)}</p>
  {/if}
  {#if fissure > 0}
    <Fissure depart={ligneIssue} avancee={fissure} />
  {/if}
</section>

<style>
  .dette {
    --argile: #e4d9c3;
    --argile-2: #d6c8ab;
    --encre: #26211c;
    --rouge: #8e3b2a;
    --trait: #a8987a;
    display: flex;
    flex: 1 0 auto;
    flex-direction: column;
    gap: 16px;
    box-sizing: border-box;
    width: 100%;
    padding: 20px 16px 40px;
    color: var(--encre);
    background-color: var(--argile);
    font:
      15px/1.45 Georgia,
      "Times New Roman",
      serif;
    font-variant-numeric: tabular-nums;
  }
  h2 {
    margin: 0 0 8px;
    font-size: 17px;
    font-weight: normal;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  h3 {
    margin: 0;
    font-size: 16px;
  }
  p {
    margin: 0;
  }
  .haut {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 32px;
    align-items: baseline;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--trait);
  }
  .libelle {
    margin-right: 8px;
  }
  .montant {
    font-size: 22px;
  }
  .rapport {
    margin-left: 8px;
  }
  .confiance {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  .barre {
    position: relative;
    display: inline-block;
    width: 160px;
    height: 10px;
    overflow: hidden;
    border: 1px solid var(--encre);
  }
  .part {
    position: absolute;
    inset: 0 auto 0 0;
    background-color: var(--rouge);
  }
  .pages {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
  }
  @media (min-width: 900px) {
    .pages {
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr) minmax(0, 0.9fr);
    }
  }
  .sorte {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 0;
    border-top: 1px solid var(--trait);
  }
  .encoches {
    letter-spacing: 0.15em;
  }
  .texte-encoches {
    margin-left: 8px;
    letter-spacing: normal;
  }
  .termes {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  button {
    padding: 6px 10px;
    border: 1px solid var(--encre);
    color: var(--encre);
    background-color: var(--argile-2);
    font: inherit;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }
  button:disabled {
    border-color: var(--trait);
    color: var(--trait);
    cursor: default;
  }
  button:not(:disabled):hover,
  button:focus-visible {
    outline: 2px solid var(--encre);
    outline-offset: 1px;
  }
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .echeance {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    align-items: baseline;
    padding: 6px 0;
    border-top: 1px solid var(--trait);
  }
  .du,
  .reports {
    color: var(--rouge);
  }
  .promesse {
    font-style: italic;
  }
  .echeance button {
    margin-left: auto;
  }
  .grande-crue {
    padding-top: 8px;
    border-top: 3px double var(--rouge);
    color: var(--rouge);
  }
  .livre li {
    padding: 3px 0;
  }
  .livre li.rouge {
    color: var(--rouge);
  }
  .fin {
    font-size: 22px;
    text-align: center;
  }
</style>

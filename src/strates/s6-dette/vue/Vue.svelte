<script lang="ts">
  // La dette (fiche, § 6) : un livre de comptes en tablettes d'argile, posées sur la terre sombre
  // d'une fosse à archives. Deux encres, le noir et un rouge de terre cuite ; un romain gravé ; des
  // chiffres tabulaires, les montants alignés à droite.
  // - En haut, une bande d'argile : la caisse et le rapport, la confiance et ce qu'on doit, la crue qui
  //   vient.
  // - À gauche, la tablette ouverte : ses trois sortes, leurs encoches, un bouton par terme. Dessous,
  //   les tablettes brisées, en morceaux.
  // - Au centre, l'échéancier : une ligne par échéance, dans l'ordre des crues, à l'encre rouge.
  //   Honorée, elle passe au noir et porte « Honoré. », puis s'efface à la crue suivante. La grande
  //   crue le ferme.
  // - Puis le livre, ses dernières lignes ; au bord droit, le compte des crues.
  // Les montants s'écrivent en sceaux, petites empreintes rondes dans l'argile, et se disent en mots
  // aux lecteurs d'écran. Le rouge et le noir ne disent rien seuls : « Dû », « Honoré », « Reporté »
  // sont écrits. Tout se fait au clavier.
  import { avanceeFissure } from "../../../noyau/logique/filet";
  import type { ProprietesVue } from "../../../noyau/logique/types";
  import Fissure from "../../../noyau/ui/Fissure.svelte";
  import {
    caissesPrevues,
    type ActionDette,
    type Echeance,
    type EtatDette,
    type IdPromesse,
    type LigneLivre,
    type Terme,
  } from "../logique";
  import {
    crueOrdinale,
    ecrireLigne,
    enLettres,
    formaterSceaux,
    remplir,
    SCEAU,
    type Sens,
  } from "../logique/notation";
  import {
    caissePrevueAffichee,
    confiance,
    couvre,
    CRUE,
    doit,
    EXEMPLAIRES,
    montantDu,
    prixExemplaire,
    PROMESSES,
    rapport,
    SORTES,
    sortesDe,
    TABLETTES,
    tabletteDe,
    TERMES,
    toutDu,
  } from "../logique/regles";
  import Brisees from "./Brisees.svelte";
  import Compte from "./Compte.svelte";
  import { couper, morceaux, type Morceau } from "./morceaux";
  import { VARIABLES } from "./theme";

  let { etat, agir, noyau, o, lisible, mode }: ProprietesVue<EtatDette, ActionDette> = $props();

  /**
   * Les lignes du livre que la vue montre, les plus récentes en bas. Chacune garde sa clé, son numéro
   * depuis l'arrivée : les lecteurs d'écran n'entendent que la nouvelle.
   */
  const LIGNES = 10;

  // Pendant la remontée, ou la dette finie, le livre se montre, et rien ne s'y fait.
  const actif = $derived(mode === "jeu" && etat.issue === null);
  // Le filet (fiche, § 4) : si le joueur n'a pas creusé cinq minutes après l'issue, une fissure part de
  // la couche de l'issue, dans le compte des crues, et monte vers « creuser ».
  const fissure = $derived(avanceeFissure(etat.temps, etat.issueA));
  let coucheIssue: Element | undefined = $state();
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

  /** Une ligne de l'échéancier : une échéance due, ou honorée à cette crue (`echeance` nulle). */
  interface Ligne {
    numero: number;
    crue: number | null;
    du: number;
    promesse: IdPromesse;
    reports: number;
    echeance: Echeance | null;
  }
  // Les échéances honorées à cette crue, à son terme ou avant, que le livre a écrites : elles restent,
  // noires, jusqu'à la crue suivante. La dette finie, le livre est clos.
  const honorees = $derived(
    etat.issue !== null
      ? []
      : etat.livre.flatMap((l): Ligne[] => {
          const { numero, crue, montant, promesse, quand } = l.valeurs;
          if (l.cle !== "livre.honore" && l.cle !== "livre.solde") return [];
          const id = promesse === undefined ? undefined : PROMESSES[promesse];
          if (quand !== etat.crues || id === undefined) return [];
          if (numero === undefined || crue === undefined || montant === undefined) return [];
          return [{ numero, crue, du: montant, promesse: id, reports: 0, echeance: null }];
        }),
  );
  const lignes = $derived(
    [
      ...lignesDues.map((e): Ligne => ({
        numero: e.numero,
        crue: e.crue,
        du: e.du,
        promesse: e.promesse,
        reports: e.reports,
        echeance: e,
      })),
      ...honorees,
    ].sort((a, b) => (a.crue ?? Infinity) - (b.crue ?? Infinity) || a.numero - b.numero),
  );
  const toutCeQuiTombe = $derived(toutDu(etat));
  // La caisse prévue (fiche, § 8), une fois les gages éveillés : à chaque échéance avec le gage qui
  // revient, à la prochaine seulement avec ce qui monte. La grande crue, fixée, ferme la liste.
  const affichage = $derived(caissePrevueAffichee(etat));
  const prevues = $derived(affichage === null ? null : caissesPrevues(etat));
  const prochaine = $derived(lignesDues[0]?.numero ?? null);
  /** La caisse prévue à une échéance (`null` : la grande crue), si elle s'y écrit. */
  function prevue(numero: number | null): number | null {
    if (prevues === null || (affichage === "prochaine" && numero !== prochaine)) return null;
    return prevues.get(numero) ?? null;
  }
  const lignesLivre = $derived(etat.livre.slice(-LIGNES));

  const t = (cle: string, valeurs: Record<string, string> = {}) => remplir(o(cle), valeurs);
  const ecrit = (x: number, sens: Sens = "pres") => formaterSceaux(x, sens);
  const dit = (x: number, sens: Sens = "pres") => enLettres(x, sens);
  const joindre = (ms: readonly Morceau[]) => ms.map((m) => m.texte).join("");

  function promettre(promesse: IdPromesse, terme: Terme): void {
    if (actif) agir({ type: "promettre", promesse, terme });
  }

  function solder(e: Echeance): void {
    if (actif) agir({ type: "solder", echeance: e.numero });
  }

  /** Le modèle d'une ligne de l'échéancier, et ses valeurs, montant écrit ou dit. */
  function modeleDu(
    l: Pick<Ligne, "crue" | "du">,
    montant: (x: number) => string,
  ): { cle: string; valeurs: Record<string, string> } {
    return l.crue === null
      ? { cle: "echeance.grandeCrue", valeurs: { montant: montant(l.du) } }
      : { cle: "echeance", valeurs: { crue: crueOrdinale(l.crue), montant: montant(l.du) } };
  }

  /** Une ligne de l'échéancier dans la notation de la dette, montant écrit ou dit. */
  function ligneDue(l: Pick<Ligne, "crue" | "du">, montant: (x: number) => string): string {
    const { cle, valeurs } = modeleDu(l, montant);
    return t(cle, valeurs);
  }

  /** La même, coupée avant le montant, que l'échéancier aligne à droite. */
  function ligneCoupee(l: Pick<Ligne, "crue" | "du">): [string, string] {
    const { cle, valeurs } = modeleDu(l, ecrit);
    return couper(o(cle), valeurs, "montant");
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

  /** Une ligne du livre, ses nombres écrits ou dits, et l'objet qu'elle cite sous son nom d'en bas. */
  // Tant que le report est opaque, sa ligne dit « Reporté. », sans sa crue ni sa majoration (§ 7).
  const ligneLivre = (l: LigneLivre, montant: (x: number) => string) =>
    l.cle.startsWith("livre.reporte") && !lisible("report")
      ? o("livre.reporte.opaque")
      : ecrireLigne(l, o(l.cle), montant);

  /** Ce qui s'écrit à l'encre rouge : ce qui est dû, reporté ou échu. */
  const rouge = (l: LigneLivre) => /reporte|echu|defaut|refus/.test(l.cle);

  /** Ce qu'on doit sur la confiance : « Dû : 28 » à l'encre rouge, « sur 60 » à l'encre noire. */
  const etatConfiance = $derived.by(() => {
    const parts = morceaux(o("confiance.etat"), {
      du: ecrit(du, "haut"),
      confiance: ecrit(plafond, "bas"),
    });
    const i = parts.findIndex((m) => m.nom === "du") + 1;
    return { rouge: joindre(parts.slice(0, i)), noir: joindre(parts.slice(i)) };
  });

  // L'aide (fiche, § 11) : les usages du livre, une page courte. L'ouvrir est noté, pour l'acte
  // « sans aide » ; à l'ouverture, le focus va à la page, et Échap la referme.
  const USAGES = ["promesse", "echeance", "report", "confiance", "tablettes", "sceaux"] as const;
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
  $effect(() => {
    if (aideOuverte) pageAide?.focus();
  });
  function touche(e: KeyboardEvent): void {
    if (e.key === "Escape" && aideOuverte) refermerAide();
  }
</script>

<svelte:window onkeydown={touche} />

<!-- Un montant en sceaux : chaque sceau, une petite empreinte ronde dans l'argile. -->
{#snippet sceaux(texte: string)}
  {#each texte.split(SCEAU) as morceau, i (i)}{#if i > 0}<span class="sceau">{SCEAU}</span
      >{/if}{morceau}{/each}
{/snippet}

<!-- Un texte et ses montants : en sceaux à l'écran, en mots pour un lecteur d'écran. -->
{#snippet lu(ecrit: string, dit: string)}
  {#if ecrit === dit}{@render sceaux(ecrit)}{:else}<span aria-hidden="true"
      >{@render sceaux(ecrit)}</span
    ><span class="lecteur">{dit}</span>{/if}
{/snippet}

<section class="dette" style={VARIABLES} aria-label={o("livre")}>
  <header class="haut planche">
    <p class="caisse">
      <span class="libelle" title={o("infobulle.caisse")}>{o("caisse")}</span>
      <strong class="montant"
        >{@render lu(ecrit(etat.caisse, "bas"), dit(etat.caisse, "bas"))}</strong
      >
      <span class="rapport" title={o("infobulle.rapport")}
        >{@render lu(
          t("rapport", { montant: ecrit(parCrue) }),
          t("rapport", { montant: dit(parCrue) }),
        )}</span
      >
    </p>
    <div class="confiance" title={o("infobulle.confiance")}>
      <span class="libelle">{o("confiance")}</span>
      <!-- Ce qu'on doit, à l'encre rouge ; ce qui reste, à l'encre noire. -->
      <span class="barre" aria-hidden="true">
        <span class="part" style:width="{Math.min(100, (du / plafond) * 100)}%"></span>
      </span>
      <!-- Tant qu'elle est opaque, la confiance est une barre sans échelle : sa valeur se tait (§ 7). -->
      {#if lisible("confiance")}
        <span class="etat-confiance"
          ><span aria-hidden="true"
            ><span class="doit">{@render sceaux(etatConfiance.rouge)}</span>{@render sceaux(
              etatConfiance.noir,
            )}</span
          ><span class="lecteur"
            >{t("confiance.etat", { du: dit(du, "haut"), confiance: dit(plafond, "bas") })}</span
          ></span
        >
      {/if}
    </div>
    <!-- La crue qui vient. La dette finie, le compte des crues s'arrête, et la crue ne se compte plus. -->
    {#if etat.issue === null}
      <p class="crue" data-test="crue">
        {t("crue.prochaine", { crue: crueOrdinale(etat.crues + 1), secondes: String(secondes) })}
      </p>
    {/if}
    <button
      type="button"
      class="lien-aide"
      bind:this={lienAide}
      disabled={mode !== "jeu"}
      aria-expanded={aideOuverte}
      aria-controls="aide-dette"
      onclick={() => (aideOuverte ? refermerAide() : ouvrirAide())}
      data-test="lien-aide">{o("aide")}</button
    >
  </header>

  <div class="pages">
    <div class="colonne-tablette">
      <section class="tablette planche" aria-labelledby="dette-tablette">
        <h2 id="dette-tablette">{t("tablette", { n: String(etat.tablette) })}</h2>
        {#each sortes as s (s.id)}
          <div class="sorte" data-sorte={s.id}>
            <h3>{o(`promesse.${s.id}`)}</h3>
            <p class="encoches">
              <!-- Les exemplaires qui restent, en encoches creusées ; ceux promis, une trace. -->
              <span class="entailles" aria-hidden="true"
                >{#each Array.from({ length: EXEMPLAIRES }, (_, i) => i) as i (i)}<span
                    class="entaille"
                    class:promise={i >= EXEMPLAIRES - s.n}
                  ></span>{/each}</span
              >
              <span class="texte-encoches"
                >{t("sorte.restent", { n: String(EXEMPLAIRES - s.n) })}</span
              >
            </p>
            <p class="rapporte">
              {@render lu(
                t("sorte.rapporte", { montant: ecrit(SORTES[s.id].rapport) }),
                t("sorte.rapporte", { montant: dit(SORTES[s.id].rapport) }),
              )}
            </p>
            {#if s.prix !== null}
              {@const prix = s.prix}
              <div class="termes">
                {#each derniere ? [null] : TERMES as terme (terme ?? 0)}
                  <button
                    type="button"
                    disabled={!actif}
                    title={o("infobulle.terme")}
                    aria-label={`${o(`promesse.${s.id}`)}, ${bouton(prix, terme, dit)}`}
                    onclick={() => promettre(s.id, terme ?? 2)}
                  >
                    {@render sceaux(bouton(prix, terme, ecrit))}
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      </section>
      {#if etat.brisees > 0}
        <div class="tas-brisees">
          <Brisees n={etat.brisees} />
          <p class="brisees">{t("tablette.brisees", { n: String(etat.brisees) })}</p>
        </div>
      {/if}
    </div>

    <section class="echeancier planche" aria-labelledby="dette-echeances">
      <h2 id="dette-echeances">{o("echeancier")}</h2>
      {#if etat.echeances.length === 0}
        <p class="vide">{o("echeancier.vide")}</p>
      {/if}
      <ol>
        {#each lignes as l (l.numero)}
          {@const caisse = l.echeance === null ? null : prevue(l.numero)}
          {@const [quand, somme] = ligneCoupee(l)}
          <li class="echeance" class:honoree={l.echeance === null} data-echeance={l.numero}>
            <span class="du"
              ><span aria-hidden="true"
                ><span class="quand">{quand}</span>
                <span class="somme">{@render sceaux(somme)}</span></span
              ><span class="lecteur">{ligneDue(l, dit)}</span></span
            >
            <span class="promesse">{o(`promesse.${l.promesse}`)}</span>
            {#if l.reports > 0}
              <span class="reports">{t("echeance.reports", { n: String(l.reports) })}</span>
            {/if}
            {#if caisse !== null}
              <span class="prevue" data-test="prevue"
                >{@render lu(
                  t("echeance.prevue", { montant: ecrit(caisse, "bas") }),
                  t("echeance.prevue", { montant: dit(caisse, "bas") }),
                )}</span
              >
            {/if}
            {#if l.echeance === null}
              <span class="honore">{o("echeance.honoree")}</span>
            {:else}
              {@const e = l.echeance}
              <button
                type="button"
                disabled={!actif || !couvre(etat.caisse, e.du)}
                title={o("infobulle.solder")}
                aria-label={`${o("solder")} : ${ligneDue(l, dit)}`}
                onclick={() => solder(e)}
              >
                {o("solder")}
              </button>
            {/if}
          </li>
        {/each}
      </ol>
      {#if derniere && etat.issue === null}
        <p class="grande-crue" data-test="grande-crue">
          {#if etat.grandeCrue === null}
            {@render lu(
              t("grandeCrue.attendue", { montant: ecrit(toutCeQuiTombe, "haut") }),
              t("grandeCrue.attendue", { montant: dit(toutCeQuiTombe, "haut") }),
            )}
          {:else}
            {@render lu(
              t("grandeCrue.fixee", {
                crue: crueOrdinale(etat.grandeCrue),
                montant: ecrit(toutCeQuiTombe, "haut"),
              }),
              t("grandeCrue.fixee", {
                crue: crueOrdinale(etat.grandeCrue),
                montant: dit(toutCeQuiTombe, "haut"),
              }),
            )}
          {/if}
          {#if etat.grandeCrue !== null && prevue(null) !== null}
            {@const caisse = prevue(null)!}
            <span class="prevue" data-test="prevue-grande-crue"
              >{@render lu(
                t("echeance.prevue", { montant: ecrit(caisse, "bas") }),
                t("echeance.prevue", { montant: dit(caisse, "bas") }),
              )}</span
            >
          {/if}
        </p>
      {/if}
    </section>

    <section class="livre planche" aria-labelledby="dette-livre">
      <h2 id="dette-livre">{o("livre")}</h2>
      <!-- L'en-tête du livre, écrit dès l'arrivée et toujours lisible : la règle de l'absence. -->
      <p class="entete" data-test="entree">{o("livre.entree")}</p>
      <ol aria-live="polite">
        {#each lignesLivre as l, i (etat.ecrites - lignesLivre.length + i)}
          <li class:rouge={rouge(l)}>{@render lu(ligneLivre(l, ecrit), ligneLivre(l, dit))}</li>
        {/each}
      </ol>
    </section>

    <div class="colonne-compte">
      <Compte {etat} nom={o("compte")} bind:depart={coucheIssue} />
    </div>
  </div>

  {#if etat.issue !== null}
    <p class="fin planche" role="status">{o(`livre.${etat.issue}`)}</p>
  {/if}
  {#if fissure > 0}
    <Fissure depart={coucheIssue} avancee={fissure} />
  {/if}
  {#if aideOuverte}
    <div
      class="aide planche"
      id="aide-dette"
      bind:this={pageAide}
      tabindex="-1"
      role="dialog"
      aria-labelledby="aide-titre"
      data-test="aide"
    >
      <h2 id="aide-titre">{o("aide.titre")}</h2>
      <dl>
        {#each USAGES as usage (usage)}
          <dt>{o(`aide.${usage}.titre`)}</dt>
          <dd>
            {@render sceaux(o(`aide.${usage}`))}
            {#if usage === "promesse"}{o("aide.majorations")}{/if}
          </dd>
        {/each}
      </dl>
      <button type="button" class="refermer" onclick={refermerAide}>{o("aide.fermer")}</button>
    </div>
  {/if}
</section>

<style>
  /* La terre de la fosse, presque noire, un peu moins sombre vers le haut. */
  .dette {
    display: flex;
    flex: 1 0 auto;
    flex-direction: column;
    gap: 18px;
    box-sizing: border-box;
    width: 100%;
    padding: 20px clamp(12px, 3vw, 32px) 40px;
    color: var(--encre);
    background: linear-gradient(var(--terre-2), var(--terre) 320px);
    font: 15px/1.45 var(--police);
    font-variant-numeric: tabular-nums lining-nums;
    /* La teinte des sceaux : celle de l'encre qui les entoure. */
    --teinte: var(--encre);
  }
  /*
   * Une tablette d'argile : des bords un peu irréguliers, la lumière qui accroche en haut, une ombre
   * sur la terre. Les lettres y sont creusées : une lèvre claire sous chacune.
   */
  .planche {
    box-sizing: border-box;
    padding: 14px 16px;
    border-radius: 9px 13px 11px 8px / 11px 8px 12px 10px;
    background:
      radial-gradient(ellipse at 30% 0%, var(--argile-claire), transparent 70%), var(--argile);
    box-shadow:
      inset 0 1px 0 rgb(255 250 235 / 0.5),
      inset 0 -3px 6px rgb(60 40 20 / 0.2),
      0 3px 12px rgb(0 0 0 / 0.6);
    text-shadow: 0 1px 0 rgb(255 248 228 / 0.6);
  }
  h2 {
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: normal;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: normal;
  }
  p {
    margin: 0;
  }
  /* Pour les lecteurs d'écran seulement : les montants en mots. */
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
  /*
   * Un sceau : une petite empreinte ronde, pressée dans l'argile, de la teinte de l'encre qui
   * l'entoure. Le caractère reste dans le texte, sans se voir.
   */
  .sceau {
    display: inline-block;
    width: 0.56em;
    height: 0.56em;
    margin: 0 0.05em;
    overflow: hidden;
    border-radius: 50%;
    color: transparent;
    vertical-align: 0.02em;
    background: var(--teinte);
    box-shadow:
      inset 0 0 0 1.5px rgb(255 248 228 / 0.22),
      inset 0 1.5px 1.5px rgb(0 0 0 / 0.55),
      0 1px 0 rgb(255 248 228 / 0.75);
    text-shadow: none;
  }

  /* En haut : une bande d'argile. */
  .haut {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 32px;
    align-items: baseline;
  }
  .libelle {
    margin-right: 8px;
  }
  .montant {
    font-size: 24px;
    font-weight: normal;
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
  /* La confiance : ce qu'on doit à l'encre rouge, ce qui reste à l'encre noire, dans un sillon. */
  .barre {
    position: relative;
    display: inline-block;
    width: 160px;
    height: 10px;
    overflow: hidden;
    border-radius: 2px;
    background: var(--encre);
    box-shadow:
      inset 0 1px 2px rgb(0 0 0 / 0.6),
      0 1px 0 rgb(255 248 228 / 0.7);
  }
  .part {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--rouge);
  }
  .doit {
    --teinte: var(--rouge);
    color: var(--rouge);
  }

  /*
   * Quatre colonnes : la tablette, l'échéancier, le livre, et le compte des crues au bord droit. Sur
   * un écran étroit, tout s'empile, et la bande longe l'échéancier.
   */
  .pages {
    display: grid;
    grid-template-areas:
      "tablette tablette"
      "echeancier compte"
      "livre livre";
    grid-template-columns: minmax(0, 1fr) 72px;
    gap: 20px;
    align-items: start;
  }
  @media (min-width: 980px) {
    .pages {
      grid-template-areas: "tablette echeancier livre compte";
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr) minmax(0, 0.9fr) 72px;
    }
  }
  .colonne-tablette {
    display: flex;
    grid-area: tablette;
    flex-direction: column;
    gap: 12px;
  }
  .echeancier {
    grid-area: echeancier;
  }
  .livre {
    grid-area: livre;
  }
  .colonne-compte {
    grid-area: compte;
    padding-top: 4px;
  }

  .sorte {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 0;
    border-top: 1px solid var(--argile-bord);
  }
  /* Les encoches : creusées pour les exemplaires qui restent, à peine tracées pour ceux promis. */
  .encoches {
    display: flex;
    gap: 10px;
    align-items: center;
  }
  .entailles {
    display: inline-flex;
    gap: 4px;
  }
  .entaille {
    display: inline-block;
    width: 4px;
    height: 14px;
    border-radius: 1px;
    background: var(--encre);
    box-shadow:
      inset 0 1px 1px rgb(0 0 0 / 0.6),
      0 1px 0 rgb(255 248 228 / 0.7);
  }
  .entaille.promise {
    background: transparent;
    box-shadow: inset 0 0 0 1px var(--argile-bord);
  }
  .termes {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  button {
    padding: 6px 10px;
    border: 1px solid var(--argile-bord);
    border-radius: 4px;
    color: var(--encre);
    background: var(--argile-2);
    box-shadow:
      inset 0 1px 0 rgb(255 250 235 / 0.55),
      0 1px 2px rgb(60 40 20 / 0.35);
    font: inherit;
    font-variant-numeric: tabular-nums lining-nums;
    text-shadow: inherit;
    cursor: pointer;
  }
  button:disabled {
    color: var(--eteint);
    box-shadow: none;
    cursor: default;
    --teinte: var(--eteint);
  }
  button:not(:disabled):hover,
  button:focus-visible {
    outline: 2px solid var(--encre);
    outline-offset: 1px;
  }
  .tas-brisees {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0 8px;
  }
  /* Le nombre des tablettes brisées, gravé dans la terre, sous le tas. */
  .brisees {
    color: var(--grave);
    font-size: 13px;
    letter-spacing: 0.06em;
  }

  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /*
   * Une ligne de l'échéancier : le dû à gauche, son montant aligné à droite, puis « Solder », ou
   * « Honoré. », dans une colonne de même largeur à chaque ligne : les montants s'alignent tous.
   */
  .echeance {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 5.2em;
    gap: 2px 12px;
    align-items: baseline;
    padding: 7px 0;
    border-top: 1px solid var(--argile-bord);
  }
  .du,
  .promesse,
  .reports,
  .prevue {
    grid-column: 1;
  }
  .du {
    color: var(--rouge);
    transition: color 1.2s ease-in-out;
    --teinte: var(--rouge);
  }
  .du > span[aria-hidden] {
    display: flex;
    gap: 8px;
    justify-content: space-between;
  }
  .somme {
    text-align: right;
    white-space: nowrap;
  }
  .promesse {
    font-size: 14px;
    font-style: italic;
  }
  /* Un report s'écrit sous sa ligne, à l'encre rouge. */
  .reports {
    color: var(--rouge);
    font-size: 14px;
  }
  /* La caisse prévue, ce qu'on aura : à l'encre noire, même sous la grande crue. */
  .prevue {
    color: var(--encre);
    font-size: 14px;
    --teinte: var(--encre);
  }
  .echeance button,
  .honore {
    grid-row: 1 / span 2;
    grid-column: 2;
    align-self: center;
    justify-self: end;
  }
  /*
   * Honorée à cette crue : la ligne passe au noir et porte « Honoré. », puis s'efface lentement
   * jusqu'à la crue suivante, où elle quitte l'échéancier.
   */
  .honoree .du {
    color: var(--encre);
    --teinte: var(--encre);
  }
  .honoree {
    animation: s-efface 30s linear forwards;
  }
  @keyframes s-efface {
    to {
      opacity: 0.5;
    }
  }
  .grande-crue {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 8px;
    border-top: 3px double var(--rouge);
    color: var(--rouge);
    --teinte: var(--rouge);
  }
  .vide {
    font-style: italic;
  }
  .livre li {
    padding: 3px 0;
  }
  .livre li.rouge {
    color: var(--rouge);
    --teinte: var(--rouge);
  }
  .fin {
    align-self: center;
    padding: 10px 28px;
    font-size: 22px;
    text-align: center;
  }
  /* L'en-tête du livre : une formule de première page, à l'encre noire, au-dessus des lignes. */
  .entete {
    padding-bottom: 6px;
    margin-bottom: 6px;
    border-bottom: 1px solid var(--argile-bord);
    font-style: italic;
  }
  /* L'aide : un lien discret au bout du haut du livre, puis une tablette posée sur le livre. */
  .lien-aide {
    margin-left: auto;
    padding: 2px 4px;
    border: none;
    background: none;
    box-shadow: none;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .aide {
    position: fixed;
    inset: 48px 16px auto;
    z-index: 6;
    max-width: 40rem;
    max-height: calc(100vh - 72px);
    margin: 0 auto;
    padding: 20px 24px;
    overflow: auto;
  }
  .aide:focus {
    outline: none;
  }
  .aide dl {
    margin: 0 0 16px;
  }
  .aide dt {
    margin-top: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 13px;
  }
  .aide dd {
    margin: 2px 0 0;
  }
  @media (prefers-reduced-motion: reduce) {
    .du {
      transition: none;
    }
    .honoree {
      animation: none;
    }
  }
</style>

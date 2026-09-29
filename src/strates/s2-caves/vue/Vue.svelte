<script lang="ts">
  // La vallée (fiche, § 6) : du bois, un registre, un calendrier circulaire. Tout ce que la surface
  // n'était pas : ni cartes, ni tableau de bord, ni logiciel. En tête, la réserve, les flux du jour et
  // la date, là où étaient les crédits, la production et l'objectif (raccords du storyboard, § 5).
  // Dessous, le calendrier à gauche, la coupe des stockages au centre, qui sert de jauge, et à droite
  // « Glaner » et le registre, dont les achats sont les écritures. En bas, la courbe de la réserve.
  import { artefact } from "../../../noyau/logique/artefacts";
  import { avanceeFissure } from "../../../noyau/logique/filet";
  import type { ProprietesVue } from "../../../noyau/logique/types";
  import Fissure from "../../../noyau/ui/Fissure.svelte";
  import type { ActionCaves, EtatCaves } from "../logique";
  import { TAILLE_HISTORIQUE, type LigneRegistre } from "../logique/etat";
  import { remplir } from "../logique/notation";
  import {
    capacite,
    consommation,
    coutFamille,
    coutStockage,
    dureeHiver,
    enHiver,
    JOURS_PAR_AN,
    marqueHiver,
    OUTILS,
    outilVisible,
    pertes,
    prochainOutil,
    recolte,
    repartition,
    saison,
    saisonChaude,
    STOCKAGES,
    stockageVisible,
    valeurGlanage,
    valleePleine,
  } from "../logique/regles";
  import Calendrier from "./Calendrier.svelte";
  import { froidEcran } from "./calendrier";
  import Coupe from "./Coupe.svelte";
  import Courbe from "./Courbe.svelte";
  import { achatsCourbe, saisonsCourbe } from "./courbe";
  import { VARIABLES } from "./theme";

  let { etat, agir, o }: ProprietesVue<EtatCaves, ActionCaves> = $props();

  const t = (cle: string, valeurs: Record<string, number> = {}) => remplir(o(cle), valeurs);

  const cap = $derived(capacite(etat));
  const marque = $derived(marqueHiver(etat));

  // L'opacité (fiche, § 7) : la marque d'hiver n'a pas de légende, et les pertes ne s'affichent pas,
  // jusqu'au premier bilan. Les deux fenêtres, un objet de la surface, les dévoilent dès l'arrivée (§ 8).
  const devoile = $derived(etat.hivers.length > 0 || etat.objets.fenetres);
  const grain = $derived(repartition(etat));

  /** Une ligne du registre ; un objet d'en haut y porte son nom d'en bas. */
  function ligneRegistre(ligne: LigneRegistre): string {
    const texte = t(ligne.cle, ligne.valeurs);
    if (ligne.objet === undefined) return texte;
    return texte.replace("{objet}", artefact(ligne.objet)?.nomDEnBas ?? ligne.objet);
  }

  // Le filet : si le joueur n'a pas creusé après le seuil, une fissure part du fond de la coupe et
  // monte vers le bandeau (fiche, § 4).
  const fissure = $derived(avanceeFissure(etat.temps, etat.seuilAtteintA));
  let fondCoupe: SVGElement | undefined = $state();

  const calendrier = $derived.by(() => {
    if (enHiver(etat)) return t("calendrier.hiver", { jours: Math.ceil(JOURS_PAR_AN - etat.jour) });
    if (etat.soudure) return t("calendrier.soudure");
    return t("calendrier.avant-hiver", {
      jours: Math.ceil(saisonChaude(etat.annee) - etat.jour),
      duree: dureeHiver(etat.annee),
    });
  });

  /** L'hiver refroidit l'écran, et le printemps le réchauffe (fiche, § 6). */
  const froid = $derived(froidEcran(etat));

  const stockages = $derived(STOCKAGES.filter((s) => stockageVisible(etat, s)));
  const outil = $derived(prochainOutil(etat));
  const registre = $derived(etat.registre.slice(-8).reverse());
</script>

<section class="caves" style="{VARIABLES}; --froid: {froid}" data-test="vallee">
  <div class="page">
    <h2>{o("titre")}</h2>

    <!-- En tête : là où étaient les crédits, la production et l'objectif. -->
    <header class="entete">
      <div class="reserve">
        <p class="libelle">{o("reserve")}</p>
        <p class="chiffre">
          <strong data-test="reserve"
            >{t("reserve.capacite", { reserve: etat.reserve, capacite: cap })}</strong
          >
        </p>
        {#if devoile}
          <p class="marque-texte">
            {o("marque-hiver")} :
            <strong data-test="marque">{t("marque-hiver.valeur", { marque })}</strong>
            {#if marque > cap}
              <span data-test="marque-au-dessus">({o("marque-hiver.au-dessus")})</span>
            {/if}
          </p>
        {/if}
      </div>
      <ul class="flux">
        <li>
          {o("recolte")} :
          <span data-test="recolte">{t("par-jour", { quantite: recolte(etat) })}</span>
        </li>
        <li>
          {o("consommation")} :
          <span data-test="consommation">{t("par-jour", { quantite: consommation(etat) })}</span>
        </li>
        {#if devoile}
          <li>
            {o("pertes")} :
            <span data-test="pertes">{t("par-jour", { quantite: pertes(etat) })}</span>
          </li>
        {/if}
      </ul>
      <p class="date">
        <strong data-test="date"
          >{t("date", { jour: Math.floor(etat.jour) + 1, annee: etat.annee })}</strong
        >
        <span data-test="saison">{o(`saison.${saison(etat)}`)}</span>
      </p>
    </header>

    <!-- Le calendrier, à la place du graphique de la surface. -->
    <div class="temps">
      <Calendrier {etat} titre={o("calendrier")} avenir={etat.objets.armoire} />
      <p class="annonce" data-test="calendrier">{calendrier}</p>
    </div>

    <!-- La coupe des stockages : la jauge de la réserve. -->
    <div class="coupe">
      <Coupe
        bind:fond={fondCoupe}
        {etat}
        {marque}
        nommee={devoile}
        libelle={o("marque-hiver")}
        nom={(id) => o(`stockage.${id}`)}
        titre={o("reserve")}
      />
    </div>

    <div class="droite">
      <!-- « Glaner », à la place de « Produire ». -->
      <div class="glanage">
        <button class="glaner" onclick={() => agir({ type: "glaner" })}>{o("glaner")}</button>
        {#if valeurGlanage(etat) === 0}
          <p data-test="glaner-rien">{o("glaner.rien")}</p>
        {/if}
      </div>

      <!-- Le registre : en tête, les achats comme des écritures ; dessous, la chronique. -->
      <article class="registre">
        <h3>{o("registre")}</h3>
        <ul class="ecritures">
          <li>
            {#if valleePleine(etat)}
              <p class="ecriture pleine">{o("vallee.pleine")}</p>
            {:else}
              <button
                class="ecriture"
                disabled={etat.reserve < coutFamille(etat)}
                onclick={() => agir({ type: "installer" })}
              >
                <span class="quoi">{o("installer")}</span>
                <span class="points" aria-hidden="true"></span>
                <span class="prix">{t("prix", { prix: coutFamille(etat) })}</span>
              </button>
            {/if}
            <p class="detail">
              <span data-test="familles"
                >{t("familles.nombre", { familles: Math.round(etat.familles) })}</span
              >
            </p>
          </li>
          {#each stockages as s (s.id)}
            {@const n = etat.stockages[s.id]}
            {@const prix = coutStockage(s, n)}
            <li data-test="stockage-{s.id}">
              <button
                class="ecriture"
                disabled={etat.reserve < prix}
                onclick={() => agir({ type: "construire", stockage: s.id })}
              >
                <span class="quoi">{o("construire")} : {o(`stockage.${s.id}`)}</span>
                <span class="points" aria-hidden="true"></span>
                <span class="prix">{t("prix", { prix })}</span>
              </button>
              <p class="detail">
                {t("stockage.detail", {
                  nombre: n,
                  capacite: s.capacite * etat.multiplicateurs.conservation,
                })}
                {#if devoile && n > 0}
                  · <span data-test="pertes-{s.id}"
                    >{t("stockage.pertes", { pertes: grain[s.id] * s.pertes })}</span
                  >
                {/if}
              </p>
            </li>
          {/each}
          <li>
            {#if outil && outilVisible(etat)}
              <button
                class="ecriture"
                disabled={etat.reserve < outil.cout}
                onclick={() => agir({ type: "outil" })}
              >
                <span class="quoi">{o("acheter")} : {o(`outil.${outil.id}`)}</span>
                <span class="points" aria-hidden="true"></span>
                <span class="prix">{t("prix", { prix: outil.cout })}</span>
              </button>
            {:else if !outil}
              <p class="ecriture pleine">{o("outils.tous")}</p>
            {/if}
            <p class="detail" data-test="outils">
              {#if etat.outils === 0}
                {o("outils.aucun")}
              {:else}
                {o("outils")} :
                {OUTILS.slice(0, etat.outils)
                  .map((d) => o(`outil.${d.id}`).toLowerCase())
                  .join(", ")}.
              {/if}
            </p>
          </li>
        </ul>

        <ol class="chronique" data-test="registre">
          {#each registre as ligne, i (etat.registre.length - i)}
            <li class:autre-main={ligne.cle === "registre.feuille"}>{ligneRegistre(ligne)}</li>
          {/each}
        </ol>
      </article>
    </div>

    <!-- La courbe de la réserve, en bas : la sinusoïde, là où la surface avait une exponentielle. -->
    <div class="bas">
      <Courbe
        points={etat.historique.reserve}
        achats={achatsCourbe(etat)}
        saisons={saisonsCourbe(etat)}
        taille={TAILLE_HISTORIQUE}
        titre={o("courbe")}
        annee={(annee) => t("courbe.annee", { annee })}
      />
    </div>
  </div>

  {#if fissure > 0}
    <Fissure depart={fondCoupe} avancee={fissure} />
  {/if}
</section>

<style>
  /* Le bois de la table, qui se refroidit en hiver. */
  .caves {
    flex: 1 0 auto;
    box-sizing: border-box;
    padding: 20px clamp(12px, 3vw, 32px) 40px;
    font:
      16px/1.45 "Iowan Old Style",
      "Palatino Linotype",
      Palatino,
      "Book Antiqua",
      "URW Palladio L",
      P052,
      Charter,
      "Bitstream Charter",
      Georgia,
      serif;
    color: var(--sur-bois);
    background-color: var(--bois);
    /* Le fil du bois, à peine visible. */
    background-image: repeating-linear-gradient(
      178deg,
      transparent 0 22px,
      rgb(0 0 0 / 6%) 22px 23px,
      transparent 23px 41px,
      rgb(255 255 255 / 3%) 41px 42px
    );
  }
  .page {
    display: grid;
    grid-template-areas:
      "titre titre titre"
      "entete entete entete"
      "temps coupe droite"
      "bas bas droite";
    grid-template-columns: 17rem minmax(0, 1fr) 24rem;
    gap: 20px 32px;
    align-items: start;
    max-width: 1240px;
    margin: 0 auto;
  }
  h2 {
    grid-area: titre;
    margin: 0;
    font-size: 22px;
    font-weight: 400;
    font-style: italic;
  }
  p {
    margin: 0;
  }
  ul,
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  /* En tête : trois colonnes séparées d'un filet, comme la tête d'une page de registre. */
  .entete {
    display: grid;
    grid-area: entete;
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 1fr);
    padding-bottom: 14px;
    border-bottom: 1px solid var(--bois-clair);
  }
  .entete > * {
    padding-inline: 16px;
  }
  .entete > * + * {
    border-left: 1px solid var(--bois-clair);
  }
  .entete > :first-child {
    padding-left: 0;
  }
  .libelle {
    font-style: italic;
    color: var(--sur-bois-doux);
  }
  /* La réserve et les prix : des chiffres alignés. */
  .chiffre,
  .prix,
  .flux {
    font-variant-numeric: lining-nums tabular-nums;
  }
  .chiffre {
    font-size: 28px;
    line-height: 1.2;
  }
  .chiffre strong {
    font-weight: 600;
  }
  .marque-texte {
    font-size: 14px;
    color: var(--sur-bois-doux);
  }
  .marque-texte strong {
    font-weight: 600;
    color: var(--sur-bois);
  }
  .flux {
    align-self: center;
    font-size: 15px;
    color: var(--sur-bois-doux);
  }
  .flux span {
    color: var(--sur-bois);
  }
  .date {
    display: flex;
    flex-direction: column;
    align-self: center;
    text-align: right;
  }
  .date strong {
    font-size: 20px;
    font-weight: 600;
    font-variant-numeric: lining-nums;
  }
  .date span {
    font-style: italic;
    color: var(--sur-bois-doux);
  }

  .temps {
    display: flex;
    flex-direction: column;
    grid-area: temps;
    gap: 12px;
    align-items: center;
    text-align: center;
  }
  .annonce {
    font-style: italic;
    color: var(--sur-bois-doux);
  }
  /* Assez grande pour être la jauge de l'écran, sans que ses noms grossissent sur un grand écran. */
  .coupe {
    grid-area: coupe;
    justify-self: center;
    width: 100%;
    max-width: 36rem;
  }

  .droite {
    display: flex;
    flex-direction: column;
    grid-area: droite;
    gap: 16px;
  }
  /* « Glaner » : une planche de bois, à presser. */
  .glanage {
    text-align: center;
  }
  .glaner {
    width: 100%;
    padding: 10px 0;
    font: inherit;
    font-size: 19px;
    color: var(--sur-bois);
    letter-spacing: 0.02em;
    cursor: pointer;
    background: var(--bois-clair);
    border: 1px solid var(--bois-sombre);
    border-radius: 3px;
    box-shadow:
      inset 0 1px 0 rgb(255 255 255 / 12%),
      0 2px 0 var(--bois-sombre);
  }
  .glaner:hover {
    background: color-mix(in oklab, var(--bois-clair), var(--sur-bois) 8%);
  }
  .glaner:active {
    transform: translateY(2px);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 12%);
  }
  .glanage p {
    margin-top: 6px;
    font-style: italic;
    color: var(--sur-bois-doux);
  }

  /* Le registre : une page de papier réglée, à l'encre, avec sa marge. */
  .registre {
    padding: 14px 16px 18px 28px;
    color: var(--encre);
    background-color: var(--papier);
    background-image: linear-gradient(
      90deg,
      transparent 18px,
      rgb(154 58 40 / 35%) 18px 19px,
      transparent 19px
    );
    border-radius: 2px;
    box-shadow: 0 2px 0 var(--bois-sombre);
  }
  h3 {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 400;
    font-style: italic;
  }
  .ecritures {
    margin-bottom: 14px;
  }
  .ecritures li + li {
    margin-top: 6px;
  }
  /* Une écriture : ce qu'on achète, des points de conduite, puis le prix. */
  .ecriture {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    width: 100%;
    padding: 0;
    font: inherit;
    color: var(--encre);
    text-align: start;
    cursor: pointer;
    background: none;
    border: none;
  }
  .ecriture .points {
    flex: 1;
    min-width: 12px;
    margin: 0 6px;
    border-bottom: 1px dotted currentColor;
    opacity: 0.5;
  }
  /* Trop long pour une ligne, le prix passe à la suivante, toujours à droite. */
  .ecriture .prix {
    margin-left: auto;
    white-space: nowrap;
  }
  .ecriture:hover:enabled .quoi {
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }
  .ecriture:disabled {
    color: var(--eteint);
    cursor: default;
  }
  .ecriture:focus-visible {
    outline: 1px solid var(--encre);
    outline-offset: 2px;
  }
  .ecriture.pleine {
    font-style: italic;
    color: var(--encre-douce);
  }
  .detail {
    font-size: 13px;
    font-style: italic;
    color: var(--encre-douce);
  }
  /* La chronique : des chiffres elzéviriens, la plus récente en haut. */
  .chronique {
    padding-top: 10px;
    font-variant-numeric: oldstyle-nums;
    border-top: 1px solid var(--encre-douce);
  }
  /* Une ligne par écriture, réglée comme le papier d'un registre. */
  .chronique li {
    padding: 3px 0 2px;
    line-height: 1.5;
    border-bottom: 1px solid rgb(90 110 130 / 20%);
  }
  .chronique li + li {
    color: var(--encre-douce);
  }
  /* La ligne de l'atelier qu'écrit la feuille qui annonce : une autre main. */
  .autre-main {
    font-family: ui-monospace, "Courier New", monospace;
    font-style: italic;
    color: #2f3f5c;
  }

  .bas {
    grid-area: bas;
  }

  /* Moins large : le calendrier au-dessus de la coupe, et le registre toujours à droite. */
  @media (max-width: 1180px) {
    .page {
      grid-template-areas:
        "titre titre"
        "entete entete"
        "temps droite"
        "coupe droite"
        "bas bas";
      grid-template-columns: minmax(0, 1fr) 22rem;
    }
  }
  @media (max-width: 760px) {
    .page {
      grid-template-areas: "titre" "entete" "temps" "coupe" "droite" "bas";
      grid-template-columns: minmax(0, 1fr);
    }
    .entete {
      grid-template-columns: minmax(0, 1fr);
      gap: 10px;
    }
    .entete > * {
      padding-inline: 0;
    }
    .entete > * + * {
      border-left: none;
    }
    .date {
      text-align: left;
    }
  }
</style>

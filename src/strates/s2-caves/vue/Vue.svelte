<script lang="ts">
  // Interface minimale des caves : tout est jouable. La direction artistique viendra avec #33.
  import { artefact } from "../../../noyau/logique/artefacts";
  import { avanceeFissure } from "../../../noyau/logique/filet";
  import type { ProprietesVue } from "../../../noyau/logique/types";
  import Fissure from "../../../noyau/ui/Fissure.svelte";
  import type { ActionCaves, EtatCaves } from "../logique";
  import { PERIODE_HISTORIQUE, TAILLE_HISTORIQUE, type LigneRegistre } from "../logique/etat";
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
  import Courbe from "./Courbe.svelte";

  let { etat, agir, o }: ProprietesVue<EtatCaves, ActionCaves> = $props();

  const t = (cle: string, valeurs: Record<string, number> = {}) => remplir(o(cle), valeurs);

  const cap = $derived(capacite(etat));
  const marque = $derived(marqueHiver(etat));
  const part = (x: number) => Math.min(100, (x / Math.max(cap, 1)) * 100);

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

  // Le filet : si le joueur n'a pas creusé après le seuil, une fissure part de la réserve vers le bandeau.
  const fissure = $derived(avanceeFissure(etat.temps, etat.seuilAtteintA));
  let zoneReserve: HTMLElement | undefined = $state();

  const calendrier = $derived.by(() => {
    if (enHiver(etat)) return t("calendrier.hiver", { jours: Math.ceil(JOURS_PAR_AN - etat.jour) });
    if (etat.soudure) return t("calendrier.soudure");
    return t("calendrier.avant-hiver", {
      jours: Math.ceil(saisonChaude(etat.annee) - etat.jour),
      duree: dureeHiver(etat.annee),
    });
  });

  const stockages = $derived(STOCKAGES.filter((s) => stockageVisible(etat, s)));
  const outil = $derived(prochainOutil(etat));
  const registre = $derived(etat.registre.slice(-8).reverse());

  /** Les achats, en index dans l'historique : le dernier point est au dernier multiple de 5 jours. */
  const achats = $derived.by(() => {
    const n = etat.historique.reserve.length;
    const dernier = Math.floor(etat.temps / PERIODE_HISTORIQUE) * PERIODE_HISTORIQUE;
    return etat.historique.achats
      .map((a) => n - 1 - (dernier - a) / PERIODE_HISTORIQUE)
      .filter((i) => i >= 0 && i <= n - 1);
  });
</script>

<section class="caves">
  <h2>{o("titre")}</h2>

  <div class="temps">
    <Calendrier {etat} titre={o("calendrier")} avenir={etat.objets.armoire} />
    <p class="date">
      <strong data-test="date"
        >{t("date", { jour: Math.floor(etat.jour) + 1, annee: etat.annee })}</strong
      ><br />
      <span data-test="saison">{o(`saison.${saison(etat)}`)}</span><br />
      <span data-test="calendrier">{calendrier}</span>
    </p>
  </div>

  <div class="reserve" bind:this={zoneReserve}>
    <p>
      {o("reserve")}
      <strong data-test="reserve"
        >{t("reserve.capacite", { reserve: etat.reserve, capacite: cap })}</strong
      >
    </p>
    <div
      class="jauge"
      role="meter"
      aria-label={o("reserve")}
      aria-valuemin={0}
      aria-valuemax={cap}
      aria-valuenow={Math.floor(etat.reserve)}
    >
      <div class="grain" style:width="{part(etat.reserve)}%"></div>
      <div class="marque" style:left="{part(marque)}%"></div>
    </div>
    {#if devoile}
      <p>
        {o("marque-hiver")}
        <strong data-test="marque">{t("marque-hiver.valeur", { marque })}</strong>
        {#if marque > cap}
          <span data-test="marque-au-dessus">({o("marque-hiver.au-dessus")})</span>
        {/if}
      </p>
    {/if}
  </div>

  {#if fissure > 0}
    <Fissure depart={zoneReserve} avancee={fissure} />
  {/if}

  <ul class="flux">
    <li>
      {o("recolte")} : <span data-test="recolte">{t("par-jour", { quantite: recolte(etat) })}</span>
    </li>
    <li>
      {o("consommation")} :
      <span data-test="consommation">{t("par-jour", { quantite: consommation(etat) })}</span>
    </li>
    {#if devoile}
      <li>
        {o("pertes")} : <span data-test="pertes">{t("par-jour", { quantite: pertes(etat) })}</span>
      </li>
    {/if}
  </ul>

  <p>
    <button class="glaner" onclick={() => agir({ type: "glaner" })}>{o("glaner")}</button>
    {#if valeurGlanage(etat) === 0}
      <span data-test="glaner-rien">{o("glaner.rien")}</span>
    {/if}
  </p>

  <Courbe
    points={etat.historique.reserve}
    {achats}
    taille={TAILLE_HISTORIQUE}
    titre={o("courbe")}
  />

  <h3>{o("familles")}</h3>
  <p>
    <strong data-test="familles"
      >{t("familles.nombre", { familles: Math.round(etat.familles) })}</strong
    >
    {#if valleePleine(etat)}
      · {o("vallee.pleine")}
    {:else}
      <button
        disabled={etat.reserve < coutFamille(etat)}
        onclick={() => agir({ type: "installer" })}
      >
        {o("installer")} ({t("prix", { prix: coutFamille(etat) })})
      </button>
    {/if}
  </p>

  <h3>{o("stockages")}</h3>
  <ul class="stockages">
    {#each stockages as s (s.id)}
      {@const n = etat.stockages[s.id]}
      {@const prix = coutStockage(s, n)}
      <li data-test="stockage-{s.id}">
        <strong>{o(`stockage.${s.id}`)}</strong>
        {t("stockage.detail", {
          nombre: n,
          capacite: s.capacite * etat.multiplicateurs.conservation,
        })}
        {#if devoile && n > 0}
          · <span data-test="pertes-{s.id}"
            >{t("stockage.pertes", { pertes: grain[s.id] * s.pertes })}</span
          >
        {/if}
        <button
          disabled={etat.reserve < prix}
          onclick={() => agir({ type: "construire", stockage: s.id })}
        >
          {o("construire")} ({t("prix", { prix })})
        </button>
      </li>
    {/each}
  </ul>

  <h3>{o("outils")}</h3>
  <p data-test="outils">
    {#if etat.outils === 0}
      {o("outils.aucun")}
    {:else}
      {OUTILS.slice(0, etat.outils)
        .map((d) => o(`outil.${d.id}`))
        .join(", ")}.
    {/if}
  </p>
  {#if outil && outilVisible(etat)}
    <p>
      <button disabled={etat.reserve < outil.cout} onclick={() => agir({ type: "outil" })}>
        {o("acheter")} : {o(`outil.${outil.id}`)} ({t("prix", { prix: outil.cout })})
      </button>
    </p>
  {:else if !outil}
    <p>{o("outils.tous")}</p>
  {/if}

  <h3>{o("registre")}</h3>
  <ol class="registre" data-test="registre">
    {#each registre as ligne, i (etat.registre.length - i)}
      <li class:autre-main={ligne.cle === "registre.feuille"}>{ligneRegistre(ligne)}</li>
    {/each}
  </ol>
</section>

<style>
  .caves {
    max-width: 48rem;
    font-family: Georgia, "Iowan Old Style", "Palatino Linotype", serif;
    font-variant-numeric: tabular-nums;
  }
  .temps {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }
  .jauge {
    position: relative;
    height: 1.25rem;
    border: 1px solid currentColor;
  }
  .grain {
    height: 100%;
    background: #b8913a;
  }
  .marque {
    position: absolute;
    top: -0.25rem;
    bottom: -0.25rem;
    width: 2px;
    margin-left: -1px;
    background: #2f4a6b;
  }
  ul,
  ol {
    list-style: none;
    padding: 0;
  }
  .stockages li {
    margin-block: 0.4rem;
  }
  /* La ligne de l'atelier qu'écrit la feuille qui annonce : une autre main. */
  .autre-main {
    font-family: ui-monospace, monospace;
    font-style: italic;
  }
  .glaner {
    font-size: 1.1rem;
    padding: 0.4rem 1.2rem;
  }
</style>

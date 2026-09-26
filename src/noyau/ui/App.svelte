<script lang="ts">
  import { onDestroy, type Component } from "svelte";
  import { creerEtatNoyau } from "../logique/etat";
  import { Noyau } from "../logique/noyau";
  import type { ActionBase, CommandesNoyau, ProprietesVue } from "../logique/types";
  import { demarrerAutosauvegarde } from "../plateforme/autosauvegarde";
  import { demarrerBoucle } from "../plateforme/boucle";
  import { graineAleatoire, maintenant } from "../plateforme/horloge";
  import { GestionnaireSauvegarde, sauvegarderPartie } from "../plateforme/sauvegarde";
  import { ouvrirStockage } from "../plateforme/stockage";
  import { BUILD, VERSION_JEU } from "../plateforme/version";
  import { creerRegistre } from "../../strates/registre";
  import { rendreStrateReactive } from "./reactivite.svelte";
  import Bandeau from "./Bandeau.svelte";
  import { resumerReprise } from "./reprise";

  type VueStrate = Component<ProprietesVue<object, ActionBase>>;

  const arrets: (() => void)[] = [];
  let avis = $state<string | null>(null);
  let resume = $state<string[] | null>(null);
  let bandeau: ReturnType<typeof Bandeau> | undefined = $state();

  /** Le bouton « creuser », du bandeau ou d'une strate : avant le seuil, le sol résiste. */
  function creuser(noyau: Noyau): void {
    if (!noyau.demanderFouille()) {
      bandeau?.resister();
      return;
    }
    // Provisoire, en attendant la descente (#30).
    avis = "La descente n'existe pas encore dans cette version : la suite arrive bientôt.";
  }

  async function demarrer() {
    const { stockage, persistant } = ouvrirStockage();
    const gestionnaire = new GestionnaireSauvegarde(stockage, VERSION_JEU, maintenant);
    const chargement = await gestionnaire.charger();

    if (chargement.type === "plus-recente") {
      throw new Error(
        `Cette sauvegarde vient d'une version plus récente du jeu (${chargement.versionJeu}). ` +
          "Elle n'a pas été modifiée.",
      );
    }
    if (!persistant) {
      avis = "Le navigateur refuse le stockage : cette partie ne sera pas sauvegardée.";
    } else if (chargement.type === "illisible") {
      avis =
        "La sauvegarde était illisible : elle a été mise de côté, et une partie neuve commence.";
    } else if (chargement.type === "ok" && chargement.depuis === "precedente") {
      avis = "La dernière sauvegarde était illisible : la précédente a été reprise.";
    }

    const etat =
      chargement.type === "ok" ? chargement.etat : creerEtatNoyau(graineAleatoire(), maintenant());
    const noyau = new Noyau(creerRegistre(), etat);
    await noyau.demarrer(maintenant());
    // Rattrape le temps passé depuis la dernière sauvegarde, avant de rendre l'état réactif.
    resume = resumerReprise(noyau.rattraper(maintenant()));
    const etatVue = rendreStrateReactive(noyau);
    arrets.push(demarrerBoucle(noyau, (reprise) => (resume = resumerReprise(reprise) ?? resume)));

    const sauvegarder = () => sauvegarderPartie(noyau.etat, gestionnaire, maintenant());
    await sauvegarder();
    arrets.push(demarrerAutosauvegarde(sauvegarder));

    // L'aide et les fins ne sont pas encore branchées.
    const commandes: CommandesNoyau = {
      demanderFouille: () => creuser(noyau),
      ouvrirAide() {},
      terminer() {},
    };
    return { noyau, strate: noyau.strate, etat: etatVue, commandes };
  }

  const demarrage = demarrer();

  onDestroy(() => arrets.forEach((arreter) => arreter()));
</script>

{#await demarrage}
  <main><p>Chargement…</p></main>
{:then { noyau, strate, etat, commandes }}
  {@const Vue = strate.vue as VueStrate}
  <!-- La Profondeur et les artefacts ne changent qu'à la descente (#30), qui les rendra réactifs. -->
  <Bandeau
    bind:this={bandeau}
    profondeur={noyau.etat.profondeur}
    artefacts={noyau.etat.artefacts}
    oncreuser={() => creuser(noyau)}
  />
  <main>
    {#if avis}
      <p role="status">{avis}</p>
    {/if}
    {#if resume}
      <section role="status" aria-label="Pendant votre absence">
        {#each resume as ligne, i (i)}
          <p>{ligne}</p>
        {/each}
        <button onclick={() => (resume = null)}>D'accord</button>
      </section>
    {/if}
    <Vue
      {etat}
      agir={(action) => noyau.agir(action)}
      noyau={commandes}
      o={(cle) => strate.textes[cle] ?? cle}
      mode="jeu"
    />
  </main>
{:catch erreur}
  <main>
    {#if avis}
      <p role="status">{avis}</p>
    {/if}
    <p role="alert">{erreur instanceof Error ? erreur.message : String(erreur)}</p>
  </main>
{/await}

<!-- Provisoire : pour les playtests, en attendant une place dans le bandeau ou le menu. -->
<footer data-test="version">Strates {VERSION_JEU} · {BUILD}</footer>

<style>
  :global(body) {
    margin: 0;
  }
  main {
    padding: 1rem;
  }
  footer {
    padding: 0 1rem 1rem;
    margin-top: 3rem;
    font-size: 0.75rem;
    opacity: 0.6;
  }
</style>

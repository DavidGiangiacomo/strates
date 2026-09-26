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
  import { resumerReprise } from "./reprise";

  type VueStrate = Component<ProprietesVue<object, ActionBase>>;

  // Pas encore branchées : la descente arrive avec #30, l'aide et les fins plus tard.
  const commandes: CommandesNoyau = {
    demanderFouille() {},
    ouvrirAide() {},
    terminer() {},
  };

  const arrets: (() => void)[] = [];
  let avis = $state<string | null>(null);
  let resume = $state<string[] | null>(null);

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

    return { noyau, strate: noyau.strate, etat: etatVue };
  }

  const demarrage = demarrer();

  onDestroy(() => arrets.forEach((arreter) => arreter()));
</script>

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
  {#await demarrage}
    <p>Chargement…</p>
  {:then { noyau, strate, etat }}
    {@const Vue = strate.vue as VueStrate}
    <Vue
      {etat}
      agir={(action) => noyau.agir(action)}
      noyau={commandes}
      o={(cle) => strate.textes[cle] ?? cle}
      mode="jeu"
    />
  {:catch erreur}
    <p role="alert">{erreur instanceof Error ? erreur.message : String(erreur)}</p>
  {/await}
</main>

<!-- Provisoire : pour les playtests, en attendant une place dans le bandeau ou le menu. -->
<footer data-test="version">Strates {VERSION_JEU} · {BUILD}</footer>

<style>
  footer {
    margin-top: 3rem;
    font-size: 0.75rem;
    opacity: 0.6;
  }
</style>

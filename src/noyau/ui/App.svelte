<script lang="ts">
  import { onDestroy, type Component } from "svelte";
  import { creerEtatNoyau, type EtatNoyau } from "../logique/etat";
  import { Noyau } from "../logique/noyau";
  import type { StrateQuelconque } from "../logique/registre";
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
  import Descente from "./Descente.svelte";
  import Fouille from "./Fouille.svelte";
  import { DUREES, DUREES_REDUITES, Passage } from "./passage.svelte";
  import Pioche from "./Pioche.svelte";
  import { resumerReprise } from "./reprise";

  type VueStrate = Component<ProprietesVue<object, ActionBase>>;

  const arrets: (() => void)[] = [];
  let avis = $state<string | null>(null);
  let resume = $state<string[] | null>(null);
  let bandeau: ReturnType<typeof Bandeau> | undefined = $state();
  /** Multiplie le temps de jeu : réglée par les outils de développement, toujours 1 sinon. */
  let vitesse = $state(1);
  /** La strate montée et son état réactif : ils changent à la descente. */
  let courante = $state.raw<{ strate: StrateQuelconque; etat: object } | null>(null);

  const attendre = (ms: number) => new Promise<void>((fin) => setTimeout(fin, ms));
  const sansMouvement = () =>
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    const registre = creerRegistre();
    const noyau = new Noyau(registre, etat);
    await noyau.demarrer(maintenant());
    // Rattrape le temps passé depuis la dernière sauvegarde, avant de rendre l'état réactif.
    resume = resumerReprise(noyau.rattraper(maintenant()));
    const monter = () => (courante = { strate: noyau.strate, etat: rendreStrateReactive(noyau) });
    monter();

    const sauvegarder = () => sauvegarderPartie(noyau.etat, gestionnaire, maintenant());
    const passage = new Passage({
      noyau,
      maintenant,
      attendre,
      sauvegarder,
      changerStrate: monter,
      resister: () => bandeau?.resister(),
      signaler: (message) => (avis = message),
      durees: sansMouvement() ? DUREES_REDUITES : DUREES,
    });

    arrets.push(
      demarrerBoucle(
        noyau,
        (reprise) => (resume = resumerReprise(reprise) ?? resume),
        maintenant,
        () => vitesse,
        // La strate 7 descend d'elle-même, sans écran de choix (docs/artefacts.md, § 6).
        () => {
          if (noyau.descenteAutomatique) void passage.descendre();
        },
      ),
    );
    await sauvegarder();
    arrets.push(demarrerAutosauvegarde(sauvegarder));

    // L'aide et les fins ne sont pas encore branchées.
    const commandes: CommandesNoyau = {
      demanderFouille: () => void passage.creuser(),
      ouvrirAide() {},
      terminer() {},
    };
    /** Outils de développement : écrit `nouvel` état comme sauvegarde courante, puis recharge. */
    async function remplacerPartie(nouvel: EtatNoyau): Promise<void> {
      // Plus de boucle ni d'autosauvegarde : la fermeture de la page ne doit pas réécrire l'ancienne partie.
      for (const arreter of arrets.splice(0)) arreter();
      if (!(await gestionnaire.ecrire(nouvel))) {
        throw new Error("La sauvegarde n'a pas pu être écrite (lecture seule ?).");
      }
      location.reload();
    }

    const dev = { gestionnaire, profondeurs: registre.numeros(), remplacerPartie };
    return { noyau, passage, commandes, dev };
  }

  const demarrage = demarrer();

  onDestroy(() => arrets.forEach((arreter) => arreter()));
</script>

{#await demarrage}
  <main><p>Chargement…</p></main>
{:then { noyau, passage, commandes, dev }}
  {@const phase = passage.phase}
  <Bandeau
    bind:this={bandeau}
    profondeur={passage.profondeur}
    artefacts={passage.artefacts}
    oncreuser={() => passage.creuser()}
  />
  <!-- La séquence de la descente : docs/strates/descente-1-2.md. -->
  {#if phase !== "jeu"}
    <div class="fond" aria-hidden="true"></div>
  {/if}
  {#if phase === "pioche"}
    <Pioche />
  {:else if phase === "jeu" && passage.cicatrice}
    <Pioche cicatrice />
  {/if}
  {#if passage.ecran && (phase === "fouille" || phase === "rebouchage" || phase === "descente")}
    <Fouille
      ecran={passage.ecran}
      sortie={phase === "descente"}
      referme={phase === "rebouchage"}
      occupe={passage.occupe}
      ondescendre={(emportes) => passage.descendre(emportes)}
      onreboucher={() => passage.reboucher()}
    />
  {/if}
  {#if phase === "descente" || phase === "arrivee"}
    <Descente {phase} transportes={passage.transportes} />
  {/if}
  {#if avis || resume}
    <!-- Au-dessus de la séquence : une descente refusée doit se lire sur l'écran de fouille. -->
    <div class="messages">
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
    </div>
  {/if}
  <main
    class="strate {phase}"
    inert={phase !== "jeu"}
    aria-hidden={phase === "fouille" ? "true" : undefined}
  >
    {#if courante}
      {@const { strate, etat } = courante}
      {@const Vue = strate.vue as VueStrate}
      {#key strate}
        <Vue
          {etat}
          agir={(action) => noyau.agir(action)}
          noyau={commandes}
          o={(cle) => strate.textes[cle] ?? cle}
          mode="jeu"
        />
      {/key}
    {/if}
  </main>
  <!-- Retiré du build de production : import.meta.env.DEV y vaut false. -->
  {#if import.meta.env.DEV}
    {#await import("../../dev/OutilsDev.svelte") then { default: OutilsDev }}
      <OutilsDev {noyau} bind:vitesse {...dev} />
    {/await}
  {/if}
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

  /* Le sol sous la strate : ce que découvre le coup de pioche, et le fond de toute la séquence. */
  .fond {
    position: fixed;
    inset: 24px 0 0;
    z-index: 1;
    background: #1e1e1e;
  }
  .messages {
    position: relative;
    z-index: 8;
    padding: 1rem 1rem 0;
    background: Canvas;
  }
  /* Opaque : pendant la séquence, la strate cache le sol, puis le recouvre en montant. */
  .strate {
    position: relative;
    z-index: 3;
    box-sizing: border-box;
    min-height: calc(100vh - 24px);
    background: Canvas;
  }
  /* P2 : après la fissure, la strate se fend et tombe. */
  .strate.pioche {
    animation: tomber 600ms ease-in 400ms both;
  }
  @keyframes tomber {
    to {
      transform: translateY(30vh);
      opacity: 0;
    }
  }
  .strate.fouille {
    visibility: hidden;
  }
  .strate.rebouchage {
    animation: tomber 500ms ease-out reverse both;
  }
  /* P5 : la nouvelle strate monte d'en bas et se met en place, à la fin du travelling. */
  .strate.descente {
    z-index: 5;
    animation: monter 800ms ease-out 3200ms both;
  }
  @keyframes monter {
    from {
      transform: translateY(100vh);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .strate.pioche,
    .strate.rebouchage {
      animation: none;
      transition: opacity 300ms;
    }
    .strate.pioche {
      opacity: 0;
    }
    .strate.descente {
      animation: fondu 500ms both;
    }
    @keyframes fondu {
      from {
        opacity: 0;
      }
    }
  }
</style>

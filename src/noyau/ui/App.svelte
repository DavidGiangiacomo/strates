<script lang="ts">
  import { onDestroy, type Component } from "svelte";
  import type { JournalSession } from "../../playtest/journal";
  import Journal from "../../playtest/Journal.svelte";
  import { demarrerGardeJournal, metaNavigateur, ouvrirJournal } from "../../playtest/plateforme";
  import { inventaire } from "../logique/artefacts";
  import { creerEtatNoyau, type EtatNoyau } from "../logique/etat";
  import type { Reprise } from "../logique/horsligne";
  import { Noyau } from "../logique/noyau";
  import { lireSauvegarde } from "../logique/sauvegarde";
  import type { StrateQuelconque } from "../logique/registre";
  import type { ActionBase, CommandesNoyau, ProprietesVue } from "../logique/types";
  import {
    appliquerTailleTexte,
    ecrireTailleTexte,
    lireTailleTexte,
    zoneNavigateur,
    type TailleTexte,
  } from "../plateforme/affichage";
  import { MoteurAudio, type BanqueSons } from "../plateforme/audio";
  import { demarrerAutosauvegarde } from "../plateforme/autosauvegarde";
  import { demarrerBoucle } from "../plateforme/boucle";
  import { copierSauvegarde, telechargerSauvegarde } from "../plateforme/export";
  import { graineAleatoire, maintenant } from "../plateforme/horloge";
  import { GestionnaireSauvegarde, sauvegarderPartie } from "../plateforme/sauvegarde";
  import { ouvrirStockage } from "../plateforme/stockage";
  import { BUILD, VERSION_JEU } from "../plateforme/version";
  import { creerRegistre } from "../../strates/registre";
  import { rendreStrateReactive } from "./reactivite.svelte";
  import Bandeau from "./Bandeau.svelte";
  import Descente from "./Descente.svelte";
  import Fente from "./Fente.svelte";
  import Fouille from "./Fouille.svelte";
  import { NOMS_STRATES } from "./fouille";
  import Graphe from "./Graphe.svelte";
  import { grapheOuvrable } from "./graphe";
  import Inventaire from "./Inventaire.svelte";
  import Menu from "./Menu.svelte";
  import { TEXTES_MENU } from "./menu";
  import { CoucheOpacite } from "./opacite.svelte";
  import { DUREES, DUREES_REDUITES, Passage } from "./passage.svelte";
  import Pioche from "./Pioche.svelte";
  import { resumerReprise } from "./reprise";
  import { SONS_NOYAU } from "./sons";

  type VueStrate = Component<ProprietesVue<object, ActionBase>>;

  const arrets: (() => void)[] = [];
  let avis = $state<string | null>(null);
  let resume = $state<string[] | null>(null);
  let bandeau: ReturnType<typeof Bandeau> | undefined = $state();
  /** L'inventaire des objets, ouvert depuis le compteur du bandeau (#45). */
  let inventaireOuvert = $state(false);
  function fermerInventaire(): void {
    inventaireOuvert = false;
    bandeau?.focaliserInventaire();
  }
  /** Le graphe de dépendances, ouvert depuis le bandeau à partir de κ = 50 (#76). */
  let grapheOuvert = $state(false);
  function fermerGraphe(): void {
    grapheOuvert = false;
    bandeau?.focaliserGraphe();
  }
  /** Le menu système, ouvert depuis le bout du bandeau (#48). */
  let menuOuvert = $state(false);
  function fermerMenu(): void {
    menuOuvert = false;
    bandeau?.focaliserMenu();
  }
  /** Un seul volet à la fois, sous le bandeau : l'inventaire, le graphe ou le menu. */
  function ouvrirVolet(volet: "inventaire" | "graphe" | "menu"): void {
    inventaireOuvert = volet === "inventaire";
    grapheOuvert = volet === "graphe";
    menuOuvert = volet === "menu";
  }
  /**
   * La taille du texte : un zoom de tout le jeu, appliqué au chargement par main.ts. Les calques qui
   * se mesurent sur la fenêtre se remesurent quand elle change.
   */
  let taille = $state(lireTailleTexte(zoneNavigateur()));
  /** Le volume et le son coupé, tels que le moteur les garde : le menu les règle. */
  let volume = $state(0);
  let muet = $state(false);
  function changerTaille(nouvelle: TailleTexte): void {
    taille = nouvelle;
    appliquerTailleTexte(document.documentElement, nouvelle);
    ecrireTailleTexte(zoneNavigateur(), nouvelle);
    window.dispatchEvent(new Event("resize"));
  }
  /** Multiplie le temps de jeu : réglée par les outils de développement, toujours 1 sinon. */
  let vitesse = $state(1);
  /**
   * La strate montée, son état réactif, sa couche d'opacité et sa banque de sons : ils changent à la
   * descente.
   */
  let courante = $state.raw<{
    strate: StrateQuelconque;
    etat: object;
    opacite: CoucheOpacite;
    son: BanqueSons;
  } | null>(null);
  /** L'élément de la strate à l'écran : la fente en prend une copie. */
  let elementStrate: HTMLElement | undefined = $state();

  const attendre = (ms: number) => new Promise<void>((fin) => setTimeout(fin, ms));

  /**
   * Le journal de session des playtests (#26), s'il est demandé : l'adresse du jeu suivie de
   * « ?journal=T3 » (docs/playtest-mvp.md, § 3). Sans stockage, pas de journal.
   */
  function ouvrirJournalSession(): { journal: JournalSession; zone: Storage } | null {
    try {
      const zone = window.localStorage;
      const journal = ouvrirJournal({
        url: new URL(location.href),
        zone,
        horloge: maintenant,
        meta: () => metaNavigateur(VERSION_JEU, BUILD),
      });
      return journal ? { journal, zone } : null;
    } catch {
      return null;
    }
  }
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
    const session = ouvrirJournalSession();
    session?.journal.brancher(noyau);
    const reprendre = (reprise: Reprise) => {
      if (reprise.type === "absence") {
        session?.journal.noter({
          type: "absence",
          duree: reprise.duree,
          comptee: reprise.comptee,
          politique: reprise.politique,
          releve: session.journal.releve(),
        });
      }
      resume = resumerReprise(reprise) ?? resume;
    };
    // Rattrape le temps passé depuis la dernière sauvegarde, avant de rendre l'état réactif.
    reprendre(noyau.rattraper(maintenant()));
    // Le son (#46) s'ouvre au premier geste du joueur. Le noyau a sa banque, celle du sol ; chaque
    // strate a la sienne, ouverte au montage de sa vue et libérée quand elle est quittée.
    const moteur = new MoteurAudio();
    volume = moteur.volume;
    muet = moteur.muet;
    arrets.push(() => moteur.arreter());
    const sol = moteur.banque(SONS_NOYAU);
    /** Monte la strate courante. Pendant la descente, elle arrive figée, et muette. */
    const monter = (pendantLaDescente = false) => {
      courante?.son.liberer();
      courante = {
        strate: noyau.strate,
        etat: rendreStrateReactive(noyau),
        opacite: new CoucheOpacite(noyau),
        son: moteur.banque(noyau.strate.sons ?? {}, pendantLaDescente),
      };
      // Le graphe ouvert était celui de la strate quittée ; l'inventaire montrait l'usure d'en haut.
      grapheOuvert = false;
      inventaireOuvert = false;
      menuOuvert = false;
    };
    monter();

    const sauvegarder = () => sauvegarderPartie(noyau.etat, gestionnaire);
    const passage = new Passage({
      noyau,
      maintenant,
      attendre,
      sauvegarder,
      changerStrate: () => monter(true),
      resister: () => bandeau?.resister(),
      sonner: (son, duree) => sol.jouer(son, { duree }),
      signaler: (message) => (avis = message),
      surEvenement: (evenement) => {
        session?.journal.noter(evenement);
        // Figée pendant tout le passage, la strate se tait aussi (docs/strates/descente-1-2.md).
        if (evenement.type === "phase") courante?.son.etouffer(evenement.phase !== "jeu");
      },
      durees: sansMouvement() ? DUREES_REDUITES : DUREES,
    });

    arrets.push(
      demarrerBoucle(
        noyau,
        reprendre,
        maintenant,
        () => vitesse,
        () => {
          session?.journal.suivre();
          courante?.opacite.actualiser();
          passage.actualiser();
          // La strate 7 descend d'elle-même, sans écran de choix (docs/artefacts.md, § 6).
          if (noyau.descenteAutomatique) void passage.descendre();
        },
      ),
    );
    await sauvegarder();
    arrets.push(demarrerAutosauvegarde(sauvegarder));
    if (session) arrets.push(demarrerGardeJournal(session.journal, session.zone));

    // Les fins ne sont pas encore branchées.
    const commandes: CommandesNoyau = {
      demanderFouille: () => void passage.creuser(),
      ouvrirAide() {
        noyau.noterAide();
        session?.journal.noter({ type: "aide" });
      },
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

    const dev = { gestionnaire, profondeurs: registre.numeros(), remplacerPartie, moteur, sol };

    /**
     * Le menu (#48) remplace la partie par une autre, importée ou nouvelle (D-005) : tout s'arrête,
     * la partie en cours est sauvegardée une dernière fois et devient la « précédente », puis la page
     * se recharge sur la nouvelle.
     */
    async function remplacerPar(ecrire: () => Promise<unknown>): Promise<void> {
      for (const arreter of arrets.splice(0)) arreter();
      await sauvegarder();
      await ecrire();
      location.reload();
    }
    const exporter = () => gestionnaire.exporter(noyau.etat);
    const systeme = {
      moteur,
      exporter: () => telechargerSauvegarde(exporter(), new Date(maintenant())),
      copier: () => copierSauvegarde(exporter()),
      /** Importe une sauvegarde : rend ce qui ne va pas, ou rien, et la page se recharge. */
      async importer(texte: string): Promise<string | null> {
        const lecture = lireSauvegarde(texte, VERSION_JEU);
        if (lecture.type === "illisible") return TEXTES_MENU.importIllisible;
        if (lecture.type === "plus-recente") return TEXTES_MENU.importPlusRecente;
        if (!persistant || gestionnaire.lectureSeule) return TEXTES_MENU.importImpossible;
        await remplacerPar(() => gestionnaire.importer(texte));
        return null;
      },
      recommencer: () =>
        void remplacerPar(() =>
          gestionnaire.ecrire(creerEtatNoyau(graineAleatoire(), maintenant())),
        ),
    };
    return { noyau, passage, commandes, dev, session, systeme };
  }

  const demarrage = demarrer();

  onDestroy(() => arrets.forEach((arreter) => arreter()));
</script>

{#await demarrage}
  <main><p>Chargement…</p></main>
{:then { noyau, passage, commandes, dev, session, systeme }}
  {@const phase = passage.phase}
  {@const graphe =
    phase === "jeu" && courante && grapheOuvrable(passage.kappa, courante.strate.logique)}
  <Bandeau
    bind:this={bandeau}
    profondeur={passage.profondeur}
    artefacts={passage.artefacts}
    kappa={passage.kappa}
    oncreuser={() => {
      // Le coup de pioche ouvre la strate : les volets se referment d'abord.
      grapheOuvert = false;
      inventaireOuvert = false;
      menuOuvert = false;
      void passage.creuser();
    }}
    oninventaire={phase === "jeu"
      ? () => (inventaireOuvert ? fermerInventaire() : ouvrirVolet("inventaire"))
      : undefined}
    {inventaireOuvert}
    ongraphe={graphe ? () => (grapheOuvert ? fermerGraphe() : ouvrirVolet("graphe")) : undefined}
    {grapheOuvert}
    onmenu={phase === "jeu" ? () => (menuOuvert ? fermerMenu() : ouvrirVolet("menu")) : undefined}
    {menuOuvert}
  />
  {#if phase === "jeu" && menuOuvert}
    <Menu
      {volume}
      {muet}
      {taille}
      version={VERSION_JEU}
      build={BUILD}
      onvolume={(v) => (volume = systeme.moteur.volume = v)}
      onmuet={(m) => (muet = systeme.moteur.muet = m)}
      ontaille={changerTaille}
      onexporter={systeme.exporter}
      oncopier={systeme.copier}
      onimporter={systeme.importer}
      onrecommencer={systeme.recommencer}
      onfermer={fermerMenu}
    />
  {/if}
  {#if phase === "jeu" && inventaireOuvert}
    <Inventaire
      objets={inventaire(passage.artefacts, passage.profondeur, passage.nommes)}
      onfermer={fermerInventaire}
    />
  {/if}
  {#if graphe && grapheOuvert && courante?.strate.logique.graphe}
    {@const { strate, etat, opacite } = courante}
    <Graphe
      graphe={strate.logique.graphe!(etat)}
      formules={strate.logique.formules?.() ?? []}
      kappa={passage.kappa}
      nom={NOMS_STRATES[strate.logique.numero]}
      o={opacite.o}
      cleLisible={opacite.cleLisible}
      onfermer={fermerGraphe}
    />
  {/if}
  <!-- La séquence de la descente : docs/strates/descente-1-2.md. -->
  {#if phase !== "jeu"}
    <div class="fond" aria-hidden="true"></div>
  {/if}
  {#if phase === "pioche" || phase === "rebouchage"}
    <Fente source={elementStrate} sens={phase === "pioche" ? "ouvrir" : "refermer"} />
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
      onbasculer={(objet, coche) => session?.journal.noter({ type: "case", objet, coche })}
    />
  {/if}
  {#if phase === "descente" || phase === "arrivee"}
    <Descente {phase} transportes={passage.transportes} poche={() => bandeau?.poche() ?? null} />
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
    bind:this={elementStrate}
    class="strate {phase}"
    inert={phase !== "jeu"}
    aria-hidden={phase === "fouille" ? "true" : undefined}
  >
    {#if courante}
      {@const { strate, etat, opacite, son } = courante}
      {@const Vue = strate.vue as VueStrate}
      {#key strate}
        <Vue
          {etat}
          agir={(action) => noyau.agir(action)}
          noyau={commandes}
          o={opacite.o}
          lisible={opacite.lisible}
          mode="jeu"
          {son}
        />
      {/key}
    {/if}
  </main>
  {#if session}
    <Journal journal={session.journal} zone={session.zone} />
  {/if}
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

<style>
  /* Sous la strate, le sol, dans la palette du bandeau : on le voit tout en bas de la page. */
  :global(body) {
    margin: 0;
    background: #1e1e1e;
  }
  main {
    box-sizing: border-box;
    min-height: calc(100vh / var(--zoom, 1) - 24px);
    padding: 1rem;
    background: Canvas;
  }

  /* Le sol sous la strate : ce que découvre le coup de pioche, et le fond de toute la séquence. */
  .fond {
    position: fixed;
    inset: 24px 0 0;
    z-index: 1;
    background: #1e1e1e;
  }
  /* Les messages du noyau, sous le bandeau et dans sa palette : ils n'appartiennent à aucune strate. */
  .messages {
    position: relative;
    z-index: 8;
    padding: 10px 12px;
    font:
      13px/1.45 system-ui,
      sans-serif;
    color: #d6d6d6;
    background: #1e1e1e;
    border-top: 1px solid #3c3c3c;
  }
  .messages p {
    margin: 0 0 4px;
  }
  .messages button {
    margin-top: 4px;
    padding: 1px 10px;
    font: inherit;
    color: inherit;
    cursor: pointer;
    background: transparent;
    border: 1px solid #5c5c5c;
    border-radius: 2px;
  }
  .messages button:hover {
    border-color: #8c8c8c;
  }
  .messages button:focus-visible {
    outline: 1px solid #f2f2f2;
    outline-offset: 1px;
  }
  /*
   * Opaque : pendant la séquence, la strate cache le sol, puis le recouvre en montant. Sa vue en
   * occupe toute la surface (flex: 1), avec son propre fond et ses propres marges.
   */
  .strate {
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    padding: 0;
  }
  /* P2 et « reboucher » : la fente montre deux copies de la strate, qui reste cachée dessous. */
  .strate.pioche,
  .strate.fouille,
  .strate.rebouchage {
    visibility: hidden;
  }
  /* P5 : la nouvelle strate monte d'en bas et se met en place, à la fin du travelling. */
  .strate.descente {
    z-index: 5;
    animation: monter 800ms ease-out 3200ms both;
  }
  @keyframes monter {
    from {
      transform: translateY(calc(100vh / var(--zoom, 1)));
    }
  }

  @media (prefers-reduced-motion: reduce) {
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

<script lang="ts">
  // Panneau des outils de développement (#28). Il n'existe que dans le build de développement :
  // App.svelte ne le charge que si import.meta.env.DEV.
  // - En direct : vitesse du temps, avance immédiate, absence et recul d'horloge simulés.
  // - Par la sauvegarde : saut de strate, édition de l'état, sauvegardes nommées, import. La partie
  //   modifiée est écrite comme une sauvegarde, puis la page se recharge : tout passe par le vrai
  //   chemin de chargement, migrations comprises.
  // - Le son (#46) : volume, sons du sol, et deux voix pour entendre le moteur accorder et battre.
  //   Les sons de la strate courante s'écoutent un à un (#59) : un effet se joue, une rumeur se met
  //   ou s'arrête.
  import { onDestroy, untrack } from "svelte";
  import { creerEtatNoyau, type EtatNoyau } from "../noyau/logique/etat";
  import type { Noyau } from "../noyau/logique/noyau";
  import { lireSauvegarde } from "../noyau/logique/sauvegarde";
  import type { NumeroStrate, SonStrate, SourceSon, Timbre } from "../noyau/logique/types";
  import type { BanqueSons, MoteurAudio } from "../noyau/plateforme/audio";
  import { telechargerSauvegarde } from "../noyau/plateforme/export";
  import { graineAleatoire, maintenant } from "../noyau/plateforme/horloge";
  import type { GestionnaireSauvegarde } from "../noyau/plateforme/sauvegarde";
  import { VERSION_JEU } from "../noyau/plateforme/version";
  import {
    copierEtat,
    entreeCourante,
    lireArtefacts,
    modifierEtat,
    recaler,
    sauterA,
    simulerAbsence,
    simulerRecul,
  } from "./outils";
  import { SAUVEGARDES_NOMMEES } from "./sauvegardes";

  let {
    noyau,
    vitesse = $bindable(1),
    gestionnaire,
    profondeurs,
    remplacerPartie,
    moteur,
    sol,
  }: {
    noyau: Noyau;
    vitesse?: number;
    gestionnaire: GestionnaireSauvegarde;
    profondeurs: NumeroStrate[];
    remplacerPartie: (etat: EtatNoyau) => Promise<void>;
    moteur: MoteurAudio;
    /** La banque du noyau : les sons du sol. */
    sol: SonStrate;
  } = $props();

  const VITESSES = [1, 10, 100, 1000];
  const MIN = 60;
  const H = 3600;

  // Le panneau reste ouvert d'un rechargement à l'autre, dans cet onglet.
  const CLE_OUVERT = "strates.dev.ouvert";
  let ouvert = $state(lireOuvert());

  function lireOuvert(): boolean {
    try {
      return sessionStorage.getItem(CLE_OUVERT) === "1";
    } catch {
      return false;
    }
  }

  function basculer(): void {
    ouvert = !ouvert;
    try {
      sessionStorage.setItem(CLE_OUVERT, ouvert ? "1" : "0");
    } catch {
      // Stockage refusé : le panneau se refermera au prochain rechargement.
    }
  }
  let erreur = $state<string | null>(null);
  let journal = $state<{ jeu: number; horsLigne: number; perturbations: number } | null>(null);
  let texteStrate = $state("");
  let texteArtefacts = $state("");
  let kappa = $state(0);

  function rafraichir(): void {
    const e = entreeCourante(noyau.etat);
    journal = e
      ? { jeu: e.tempsDeJeu, horsLigne: e.tempsHorsLigne, perturbations: e.perturbations.length }
      : null;
    sonsStrate = noyau.strate.sons ?? AUCUN_SON;
  }

  function relireEtat(): void {
    texteStrate = JSON.stringify(noyau.etatStrate, null, 2);
    texteArtefacts = noyau.etat.artefacts.join(", ");
    kappa = noyau.etat.kappa;
  }

  // Le journal n'est pas réactif : on le relit deux fois par seconde tant que le panneau est ouvert.
  // L'état de la strate, lui, est réactif : sans untrack, l'effet se relancerait à chaque tick et
  // écraserait la saisie en cours.
  $effect(() => {
    if (!ouvert) return;
    untrack(() => {
      relireEtat();
      rafraichir();
    });
    const id = setInterval(rafraichir, 500);
    return () => clearInterval(id);
  });

  async function executer(action: () => unknown): Promise<void> {
    erreur = null;
    try {
      await action();
    } catch (e) {
      erreur = e instanceof Error ? e.message : String(e);
    }
  }

  const copie = () => copierEtat(noyau.etat, VERSION_JEU);

  /**
   * Remplace la partie, recalée sur l'heure courante : ni absence ni recul au rechargement, même
   * après une absence ou un recul simulés, ou pour une sauvegarde écrite il y a des semaines.
   */
  const remplacer = (etat: EtatNoyau) => remplacerPartie(recaler(etat, maintenant()));

  function chargerTexte(texte: string): Promise<void> {
    const lecture = lireSauvegarde(texte, VERSION_JEU);
    if (lecture.type === "illisible") throw new Error(`Sauvegarde illisible : ${lecture.raison}.`);
    if (lecture.type === "plus-recente") throw new Error("Sauvegarde d'une version plus récente.");
    return remplacer(lecture.etat);
  }

  async function importer(evenement: Event): Promise<void> {
    const fichier = (evenement.currentTarget as HTMLInputElement).files?.[0];
    if (fichier) await executer(async () => chargerTexte(await fichier.text()));
  }

  const minutes = (s: number) => `${Math.floor(s / 60)} min ${Math.floor(s % 60)} s`;

  // Le son : le volume du moteur, et une banque d'essai pour deux voix, un bourdon et sa quinte,
  // qu'on désaccorde pour entendre battre leurs harmoniques.
  let volume = $state(untrack(() => moteur.volume));
  let muet = $state(untrack(() => moteur.muet));
  const TIMBRES: Timbre[] = ["a", "e", "i", "o", "ou", "sinus", "triangle"];
  let timbre = $state<Timbre>("a");
  let ecart = $state(12);
  let voixTenues = $state(false);
  const essai = untrack(() => moteur.banque({}));
  onDestroy(() => essai.liberer());

  // Les sons de la strate courante, dans une banque à part, ouverte à la première écoute.
  const AUCUN_SON: Readonly<Record<string, SourceSon>> = {};
  let sonsStrate = $state.raw(untrack(() => noyau.strate.sons ?? AUCUN_SON));
  let rumeurs = $state<string[]>([]);
  let ecoute: { strate: unknown; banque: BanqueSons } | null = null;
  onDestroy(() => ecoute?.banque.liberer());
  /** Fait entendre un son de la strate : un effet se joue, une rumeur se met ou s'arrête. */
  function ecouter(nom: string, source: SourceSon): void {
    if (ecoute?.strate !== noyau.strate) {
      ecoute?.banque.liberer();
      ecoute = { strate: noyau.strate, banque: moteur.banque(noyau.strate.sons ?? AUCUN_SON) };
      rumeurs = [];
    }
    if (!("raccord" in source) || !source.raccord) {
      ecoute.banque.jouer(nom);
      return;
    }
    const enCours = rumeurs.includes(nom);
    ecoute.banque.ambiance(nom, { volume: enCours ? 0 : 1, fondu: 0.3 });
    rumeurs = enCours ? rumeurs.filter((r) => r !== nom) : [...rumeurs, nom];
  }
  $effect(() => {
    const reglage = { volume: voixTenues ? 0.3 : 0, timbre, souffle: 0.2, glissement: 0.08 };
    essai.voix("bourdon", { ...reglage, frequence: 110 });
    essai.voix("quinte", { ...reglage, frequence: 165 * 2 ** (ecart / 1200), panoramique: 0.3 });
  });
</script>

<button class="bascule" onclick={basculer} data-test="outils-dev">
  {ouvert ? "fermer" : "dev"}{vitesse !== 1 ? ` ×${vitesse}` : ""}
</button>

{#if ouvert}
  <aside class="panneau" aria-label="Outils de développement">
    {#if erreur}
      <p class="erreur" role="alert">{erreur}</p>
    {/if}

    <section>
      <h2>Temps</h2>
      <p>
        Vitesse
        {#each VITESSES as v (v)}
          <button class:actif={vitesse === v} onclick={() => (vitesse = v)}>×{v}</button>
        {/each}
      </p>
      <p>
        Avancer
        <button onclick={() => executer(() => noyau.avancer(MIN))}>+1 min</button>
        <button onclick={() => executer(() => noyau.avancer(10 * MIN))}>+10 min</button>
        <button onclick={() => executer(() => noyau.avancer(H))}>+1 h</button>
      </p>
    </section>

    <section>
      <h2>Horloge</h2>
      <p>
        Absence
        <button onclick={() => simulerAbsence(noyau.etat, MIN)}>1 min</button>
        <button onclick={() => simulerAbsence(noyau.etat, H)}>1 h</button>
        <button onclick={() => simulerAbsence(noyau.etat, 12 * H)}>12 h</button>
        <button onclick={() => simulerAbsence(noyau.etat, 72 * H)}>3 j</button>
      </p>
      <p>
        Recul
        <button onclick={() => simulerRecul(noyau.etat, 2 * MIN)}>2 min</button>
        <button onclick={() => simulerRecul(noyau.etat, 10 * MIN)}>10 min</button>
        <button onclick={() => simulerRecul(noyau.etat, 2 * H)}>2 h</button>
      </p>
      {#if journal}
        <p class="journal" data-test="journal-dev">
          Strate {noyau.etat.profondeur} : jeu {minutes(journal.jeu)}, hors ligne
          {minutes(journal.horsLigne)}, perturbations {journal.perturbations}
        </p>
      {/if}
    </section>

    <section>
      <h2>Son</h2>
      <label>
        Volume {Math.round(volume * 100)} %
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          bind:value={volume}
          oninput={() => (moteur.volume = volume)}
        />
      </label>
      <label class="case"
        ><input type="checkbox" bind:checked={muet} onchange={() => (moteur.muet = muet)} /> Son coupé</label
      >
      <p>
        Sol
        <button onclick={() => sol.jouer("resiste")}>résiste</button>
        <button onclick={() => sol.jouer("pioche")}>pioche</button>
        <button onclick={() => sol.jouer("descente")}>descente</button>
      </p>
      {#if Object.keys(sonsStrate).length > 0}
        <p data-test="sons-strate">
          Strate
          {#each Object.entries(sonsStrate) as [nom, source] (nom)}
            <button class:actif={rumeurs.includes(nom)} onclick={() => ecouter(nom, source)}
              >{nom}</button
            >
          {/each}
        </p>
      {/if}
      <p>
        Voix
        <select bind:value={timbre} disabled={voixTenues}>
          {#each TIMBRES as t (t)}
            <option value={t}>{t}</option>
          {/each}
        </select>
        <button class:actif={voixTenues} onclick={() => (voixTenues = !voixTenues)}>
          bourdon et quinte
        </button>
        <button
          onclick={() =>
            essai.note({ frequence: 220, rapports: [1, 5 / 4, 3 / 2], duree: 1.5, timbre })}
        >
          accord
        </button>
      </p>
      <label>
        Quinte {ecart > 0 ? "+" : ""}{ecart} cents
        <input type="range" min="-40" max="40" step="1" bind:value={ecart} />
      </label>
    </section>

    <section>
      <h2>Parties</h2>
      <ul>
        {#each SAUVEGARDES_NOMMEES as s (s.nom)}
          <li>
            <button onclick={() => executer(() => chargerTexte(s.texte))}>{s.nom}</button>
            <small>{s.minutes} min</small>
          </li>
        {/each}
      </ul>
      <p>
        Sauter à la strate
        {#each profondeurs as n (n)}
          <button onclick={() => executer(() => remplacer(sauterA(copie(), n)))}>{n}</button>
        {/each}
      </p>
      <p>
        <button
          onclick={() => executer(() => remplacer(creerEtatNoyau(graineAleatoire(), maintenant())))}
        >
          Nouvelle partie
        </button>
        <button
          onclick={() =>
            telechargerSauvegarde(gestionnaire.exporter(noyau.etat), new Date(maintenant()))}
        >
          Télécharger
        </button>
        <label class="fichier"
          >Importer <input type="file" accept=".json" onchange={importer} /></label
        >
      </p>
    </section>

    <section>
      <h2>État</h2>
      <label>
        Strate {noyau.etat.profondeur} (JSON)
        <textarea bind:value={texteStrate} rows="12" spellcheck="false"></textarea>
      </label>
      <label>Artefacts <input bind:value={texteArtefacts} placeholder="s1-turbine, …" /></label>
      <label>κ <input type="number" min="0" max="100" bind:value={kappa} /></label>
      <p>
        <button onclick={relireEtat}>Relire</button>
        <button
          onclick={() =>
            executer(() =>
              remplacer(
                modifierEtat(copie(), {
                  strate: JSON.parse(texteStrate),
                  artefacts: lireArtefacts(texteArtefacts),
                  kappa,
                }),
              ),
            )}
        >
          Appliquer et recharger
        </button>
      </p>
    </section>
  </aside>
{/if}

<style>
  .bascule {
    position: fixed;
    right: 8px;
    bottom: 8px;
    z-index: 30;
    font:
      11px/1.2 ui-monospace,
      monospace;
    padding: 2px 8px;
    opacity: 0.7;
  }
  .panneau {
    position: fixed;
    top: 24px;
    right: 0;
    bottom: 0;
    z-index: 25;
    width: 340px;
    overflow: auto;
    padding: 8px 12px 40px;
    font:
      12px/1.4 ui-monospace,
      monospace;
    color: #222;
    background: #f7f7f2;
    border-left: 1px solid #bbb;
    box-shadow: -2px 0 6px rgb(0 0 0 / 0.08);
  }
  h2 {
    margin: 10px 0 4px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  p,
  ul {
    margin: 4px 0;
  }
  ul {
    padding: 0;
    list-style: none;
  }
  button {
    font: inherit;
    padding: 1px 6px;
  }
  .actif {
    font-weight: bold;
    outline: 1px solid #222;
  }
  label {
    display: block;
    margin: 4px 0;
  }
  textarea,
  input:not([type="file"]) {
    display: block;
    box-sizing: border-box;
    width: 100%;
    font: inherit;
  }
  .fichier input,
  .case input {
    display: inline;
    width: auto;
  }
  .journal {
    color: #555;
  }
  .erreur {
    color: #a00;
  }
</style>

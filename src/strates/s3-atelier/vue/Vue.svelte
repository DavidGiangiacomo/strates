<script lang="ts">
  // L'atelier (fiche, § 6) : un dessin technique, que l'on manipule plus qu'on ne le lit. Le plan au
  // centre et au plus grand, ses lignes et ses colonnes repérées sur le cadre ; la nomenclature à
  // droite, comme un cartouche, et sous elle les objets d'en haut, « Hors plan » ; la légende dessous ;
  // l'établi sous le plan, avec la lime ; en tête, le stock, la production par tour et les cases
  // libres. On prend une pièce d'un clic, on la pose d'un autre, on la tourne d'un clic droit ou de la
  // touche R. Au clavier, un curseur va de case en case : Entrée prend et pose, R tourne, L puis une
  // flèche lime ce côté. Les nombres s'écrivent en base douze, et se lisent en mots aux lecteurs
  // d'écran. Le tic du ressort s'enrichit à chaque pièce entraînée, et chaque geste a son bruit.
  import { tick, untrack } from "svelte";
  import { artefact } from "../../../noyau/logique/artefacts";
  import { avanceeFissure } from "../../../noyau/logique/filet";
  import type { ProprietesVue } from "../../../noyau/logique/types";
  import Fissure from "../../../noyau/ui/Fissure.svelte";
  import { etiquette } from "../../../noyau/ui/inventaire";
  import type { ActionAtelier, EtatAtelier, PieceAtelier } from "../logique";
  import { ecrireLigne, EN_MOTS, enMots, formaterEntier, remplir } from "../logique/notation";
  import {
    agrandissementVisible,
    analyser,
    coinRessort,
    COTES,
    dente,
    grille,
    largeur,
    PIECES,
    pieceDAvance,
    pieceVisible,
    prixPiece,
    prochainAgrandissement,
    restantes,
    TOUR,
    type Cote,
    type EtatPiece,
    type IdPiece,
  } from "../logique/regles";
  import { installerChiffres } from "./chiffres";
  import Piece from "./Piece.svelte";
  import { COUCHES, volumeCrissement, volumesTic } from "./sons";
  import { VARIABLES } from "./theme";

  let { etat, agir, noyau, o, lisible, mode, son }: ProprietesVue<EtatAtelier, ActionAtelier> =
    $props();

  installerChiffres();

  const t = (cle: string, valeurs: Record<string, number> = {}) => remplir(o(cle), valeurs);
  /** Le même texte, ses nombres en mots : ce qu'entend un lecteur d'écran (fiche, § 6). */
  const dire = (cle: string, valeurs: Record<string, number> = {}) =>
    remplir(o(cle), valeurs, EN_MOTS);
  /** Pendant la remontée, l'atelier se montre, et rien ne s'y fait. */
  const envoyer = (action: ActionAtelier) => {
    if (mode === "jeu") agir(action);
  };

  const analyse = $derived(analyser(etat));
  // Le filet (fiche, § 4) : si le joueur n'a pas creusé cinq minutes après le seuil, une fissure part
  // du ressort, traverse le plan et monte vers le bouton du bandeau.
  const fissure = $derived(avanceeFissure(etat.temps, etat.seuilAtteintA));
  let ressort: HTMLElement | undefined = $state();
  const n = $derived(etat.taille);
  const r = $derived(coinRessort(etat.taille));
  /** Ce qui tient chaque case, ligne après ligne : le ressort (-1), rien (0), la pièce d'indice i (i + 1). */
  const occupation = $derived(grille(etat));
  const libres = $derived.by(() => {
    const cases: [number, number][] = [];
    for (let l = 0; l < n; l++)
      for (let c = 0; c < n; c++) if (occupation[l * n + c] === 0) cases.push([l, c]);
    return cases;
  });
  const posees = $derived(etat.pieces.filter((p) => p.case));
  const surEtabli = $derived(etat.pieces.filter((p) => !p.case));
  const legende = $derived(etat.legende.slice(-8).reverse());
  const agrandissement = $derived(prochainAgrandissement(etat));
  const reperes = $derived(Array.from({ length: n }, (_, k) => formaterEntier(k + 1)));

  // ——— Les sons (fiche, § 6). Le tic d'un tour du ressort s'enrichit à chaque pièce entraînée : les
  // couches montent l'une après l'autre. Une pièce entraînée qui frotte crisse dès ses premières
  // saccades, et plus fort quand plusieurs frottent. Au seuil, tous les tics tombent ensemble : un
  // seul grand coup, puis un seul tic, de tous les timbres, jusqu'à la descente.
  const FONDU_TIC = 1.5;
  const FONDU_CRISSEMENT = 0.5;
  const seuil = $derived(etat.seuilAtteintA !== null);
  const tournent = $derived([...analyse.pieces.values()].filter((x) => x.entrainee));
  const entrainees = $derived(tournent.length);
  const frottent = $derived(tournent.filter((x) => x.frottements > 0).length);
  /** Le seuil déjà franchi quand la vue est montée ne sonne pas : l'unisson bat, sans le grand coup. */
  let seuilEntendu = untrack(() => seuil);
  $effect(() => {
    const volumes = volumesTic(entrainees, seuil);
    const tombe = seuil && !seuilEntendu;
    seuilEntendu = seuil;
    if (tombe) son.jouer("ensemble", { volume: 0.8 });
    // Les couches se taisent d'un coup, sous le grand coup ; l'unisson vient après lui.
    for (const nom of COUCHES) {
      son.ambiance(nom, { volume: volumes[nom], fondu: tombe ? 0.15 : FONDU_TIC });
    }
    son.ambiance("unisson", { volume: volumes.unisson, fondu: tombe ? 1 : FONDU_TIC });
    son.ambiance("crissement", { volume: volumeCrissement(frottent), fondu: FONDU_CRISSEMENT });
  });

  // Les gestes, lus dans ce qui change sur le plan : une pièce qui prend une case (posée, déplacée ou
  // échangée) claque, une grande plus grave ; un quart de tour fait un cran ; une dent limée râpe ;
  // le plan agrandi se déplie. Un geste refusé, comme une pièce posée où elle ne tient pas, ne fait
  // rien entendre. Chaque bruit vient de la colonne de sa pièce.
  /** Ce que les gestes changent : la taille du plan, et chaque pièce, sa place comptée depuis le ressort. */
  function relever(e: EtatAtelier) {
    const coin = coinRessort(e.taille);
    return {
      taille: e.taille,
      pieces: new Map(
        e.pieces.map((p) => [
          p.repere,
          {
            place: p.case ? `${p.case[0] - coin},${p.case[1] - coin}` : null,
            rot: p.rot,
            limees: p.limees.length,
          },
        ]),
      ),
    };
  }
  /** D'où vient le bruit d'une pièce : sa colonne sur le plan, de −0,5 à 0,5 ; le milieu, sur l'établi. */
  const colonne = (p: PieceAtelier) =>
    p.case ? (p.case[1] + largeur(p) / 2) / etat.taille - 0.5 : 0;
  let releve = untrack(() => relever(etat));
  $effect(() => {
    const avant = releve;
    releve = relever(etat);
    if (releve.taille > avant.taille) son.jouer("deplier", { volume: 0.6 });
    let pose: PieceAtelier | undefined;
    let cran: PieceAtelier | undefined;
    let limee: PieceAtelier | undefined;
    for (const p of etat.pieces) {
      const a = avant.pieces.get(p.repere);
      const b = releve.pieces.get(p.repere)!;
      if (b.place !== null && b.place !== (a?.place ?? null)) pose ??= p;
      if (a && b.rot !== a.rot) cran ??= p;
      if (a && b.limees > a.limees) limee ??= p;
    }
    untrack(() => {
      if (pose) {
        const vitesse = (largeur(pose) === 2 ? 0.75 : 1) * (0.97 + 0.06 * Math.random());
        son.jouer("pose", { volume: 0.55, vitesse, panoramique: colonne(pose) });
      }
      if (cran) son.jouer("cran", { volume: 0.6, panoramique: colonne(cran) });
      if (limee) son.jouer("lime", { volume: 0.6, panoramique: colonne(limee) });
    });
  });

  /** Le ressort se dessine comme une grande pièce dentée partout, qui tourne au rang 0. */
  const RESSORT: PieceAtelier = { id: "grandeRoue", repere: 0, case: null, rot: 0, limees: [] };
  const infoRessort = $derived<EtatPiece>({
    entrainee: true,
    rang: 0,
    engrenes: 0,
    frottements: 0,
    dentsLibres: 0,
    auRessort: false,
    production: 0,
    cotes: analyse.ressort,
  });

  /** La pièce en main, par son repère : achetée, prise sur l'établi ou sur le plan. */
  let main: number | null = $state(null);
  const enMain = $derived(main === null ? undefined : etat.pieces.find((p) => p.repere === main));

  /** Une gêne se montre au bout d'un tour (fiche, § 3). */
  function montree(cle: string | undefined): boolean {
    if (cle === undefined) return false;
    const debut = etat.genes[cle];
    return debut !== undefined && etat.temps - debut >= TOUR - 1e-9;
  }

  /**
   * Ce que dit une pièce à un lecteur d'écran : « Pièce une douzaine et deux, cliquet, dent à gauche,
   * tourne, frotte à gauche ».
   */
  function description(p: PieceAtelier, info: EtatPiece | undefined): string {
    const mots = [dire("piece.etiquette", { piece: p.repere }), o(`piece.${p.id}`).toLowerCase()];
    const dents = COTES.filter((d) => dente(p, d));
    if (dents.length === 0) mots.push(o("piece.sans-dent"));
    else {
      const cotes = dents.map((d) => o(`cote.${d}`)).join(", ");
      mots.push(`${o(dents.length === 1 ? "piece.dent" : "piece.dents")} ${cotes}`);
    }
    if (info) {
      mots.push(info.entrainee ? o("piece.tourne") : o("piece.immobile"));
      const frotte = COTES.filter((d) => info.cotes[d]!.some((x) => montree(x.cle)));
      if (frotte.length > 0) {
        mots.push(`${o("piece.frotte")} ${frotte.map((d) => o(`cote.${d}`)).join(", ")}`);
      }
    }
    return mots.join(", ");
  }

  // ——— Le curseur (fiche, § 6) : une case du plan, la seule où le clavier entre. Les flèches le
  // déplacent, par-dessus le ressort, où il n'y a rien à faire ; la souris le pose là où elle clique.
  let plan: HTMLElement | undefined = $state();
  let curseur: [number, number] = $state([0, 0]);
  const ici = $derived.by((): [number, number] => {
    const l = Math.max(0, Math.min(curseur[0], n - 1));
    const c = Math.max(0, Math.min(curseur[1], n - 1));
    // Sur le ressort, quand le plan a changé sous lui : la case au-dessus.
    return occupation[l * n + c] === -1 ? [r - 1, c] : [l, c];
  });
  /** Le curseur est-il sur l'élément qui tient ces cases ? */
  const sous = (l: number, c: number, s: number) =>
    ici[0] >= l && ici[0] < l + s && ici[1] >= c && ici[1] < c + s;

  const DIRECTIONS: Record<string, Cote> = {
    ArrowUp: 0,
    ArrowRight: 1,
    ArrowDown: 2,
    ArrowLeft: 3,
  };
  const PAS: Record<Cote, [number, number]> = { 0: [-1, 0], 1: [0, 1], 2: [1, 0], 3: [0, -1] };

  function focaliserCurseur(): void {
    plan?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  }

  /**
   * Le curseur avance d'une case dans la direction `d`, au-delà de la pièce qu'il quitte, et par-dessus
   * le ressort.
   */
  function avancer(d: Cote): void {
    const [dl, dc] = PAS[d];
    const quitte = occupation[ici[0] * n + ici[1]];
    let [l, c] = ici;
    const dedans = () => l >= 0 && c >= 0 && l < n && c < n;
    do {
      l += dl;
      c += dc;
    } while (
      dedans() &&
      (occupation[l * n + c] === -1 || (quitte !== 0 && occupation[l * n + c] === quitte))
    );
    if (!dedans()) return;
    curseur = [l, c];
    void tick().then(focaliserCurseur);
  }

  // Quand le plan s'agrandit, ce qu'il porte se décale d'une couronne : le curseur aussi.
  let tailleConnue = untrack(() => etat.taille);
  $effect(() => {
    const taille = etat.taille;
    if (taille === tailleConnue) return;
    const k = (taille - tailleConnue) / 2;
    tailleConnue = taille;
    untrack(() => (curseur = [curseur[0] + k, curseur[1] + k]));
  });

  // Le focus était dans le plan, et l'élément qui l'avait a disparu (une case libre que l'on vient
  // de remplir, une pièce mise de côté) : il revient au curseur.
  let dansLePlan = false;

  /** Le focus entre dans le plan, au clic ou par un lecteur d'écran : le curseur l'y suit. */
  function suivreFocus(e: FocusEvent): void {
    dansLePlan = true;
    const el = e.target;
    if (!(el instanceof HTMLElement)) return;
    const [l, c] = (el.dataset["case"] ?? "").split(",").map(Number);
    const p = etat.pieces.find((x) => x.repere === Number(el.dataset["piece"]));
    if (l !== undefined && c !== undefined && !Number.isNaN(c)) curseur = [l, c];
    else if (p?.case && !sous(p.case[0], p.case[1], largeur(p))) curseur = [p.case[0], p.case[1]];
  }
  $effect(() => {
    void occupation;
    const actif = document.activeElement;
    if (dansLePlan && (actif === null || actif === document.body)) focaliserCurseur();
  });

  function acheter(id: IdPiece): void {
    envoyer({ type: "acheter", piece: id });
    // Elle vient en main : son repère sera le prochain.
    main = etat.pieces.length + 1;
  }

  /** Une case libre : on y pose la pièce en main, ou on l'y déplace. */
  function cliquerCase(l: number, c: number): void {
    curseur = [l, c];
    if (!enMain) return;
    if (enMain.case) envoyer({ type: "deplacer", repere: enMain.repere, case: [l, c] });
    // Sans rotation : la pièce garde celle qu'on lui a donnée en main, même si le quart de tour
    // demandé juste avant n'est pas encore appliqué.
    else envoyer({ type: "poser", repere: enMain.repere, case: [l, c] });
    main = null;
  }

  /** Une pièce : on la prend, on la repose, ou on l'échange avec celle qu'on tient. */
  function cliquerPiece(p: PieceAtelier): void {
    if (p.case) curseur = [p.case[0], p.case[1]];
    if (main === null) main = p.repere;
    else if (main === p.repere) main = null;
    else {
      envoyer({ type: "echanger", a: main, b: p.repere });
      main = null;
    }
  }

  function tourner(e: MouseEvent, p: PieceAtelier): void {
    e.preventDefault();
    envoyer({ type: "tourner", repere: p.repere });
  }

  /** Une touche tapée dans un champ, comme ceux des outils de développement, ne vise pas le plan. */
  function dansUnChamp(e: KeyboardEvent): boolean {
    const cible = e.target;
    return (
      cible instanceof HTMLElement &&
      (cible.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(cible.tagName))
    );
  }

  /** La pièce qui a le focus, sur le plan ou sur l'établi. */
  function visee(): PieceAtelier | undefined {
    const actif = document.activeElement;
    const repere = actif instanceof HTMLElement ? actif.dataset["piece"] : undefined;
    return repere === undefined ? undefined : etat.pieces.find((p) => p.repere === Number(repere));
  }

  /** La lime levée au clavier : le repère de la pièce visée, dont la flèche suivante désigne le côté. */
  let lime: number | null = $state(null);
  /**
   * Le rôle de la lime est-il levé (fiche, § 7) ? Avant le premier coup, elle n'a pas de légende, et
   * les boutons qui liment montrent l'outil sans dire ce qu'il fait.
   */
  const roleLime = $derived(lisible("lime"));

  // La notice (fiche, § 11) : une page courte, comme la notice d'un plan. L'ouvrir est noté, pour
  // l'acte « sans aide » (§ 7).
  const SECTIONS_AIDE = ["plan", "dents", "mouvement", "nomenclature", "nombres"];
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
  // À l'ouverture, le focus va à la page : la lecture commence par son titre.
  $effect(() => {
    if (aideOuverte) pageAide?.focus();
  });

  function touche(e: KeyboardEvent): void {
    if (dansUnChamp(e)) return;
    if (e.key === "Escape") {
      if (aideOuverte) refermerAide();
      else if (lime !== null) lime = null;
      else main = null;
      return;
    }
    // Ctrl+R et ses semblables appartiennent au navigateur.
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const direction = DIRECTIONS[e.key];
    if (lime !== null) {
      // La lime levée : une flèche désigne le côté à limer ; toute autre touche la repose.
      if (direction !== undefined) {
        e.preventDefault();
        envoyer({ type: "limer", repere: lime, cote: direction });
      }
      lime = null;
      return;
    }
    if (direction !== undefined && plan?.contains(document.activeElement)) {
      e.preventDefault();
      avancer(direction);
      return;
    }
    // R tourne, L lève la lime : la pièce sous le curseur, sinon celle qu'on tient.
    const cible = visee() ?? enMain;
    if (!cible) return;
    if (e.key === "r" || e.key === "R") envoyer({ type: "tourner", repere: cible.repere });
    if ((e.key === "l" || e.key === "L") && COTES.some((d) => dente(cible, d))) lime = cible.repere;
  }
</script>

<svelte:window onkeydown={touche} />

<!-- La lime : un manche, une lame taillée. -->
{#snippet dessinLime()}
  <svg class="dessin-lime" viewBox="0 0 64 12" aria-hidden="true">
    <rect class="manche" x="0.5" y="3" width="17" height="6" rx="2.6" />
    <line class="virole" x1="15" y1="3" x2="15" y2="9" />
    <path class="soie" d="M17.5 4.6 L21 5.2 L21 6.8 L17.5 7.4 Z" />
    <path class="lame" d="M21 2.6 L60 4.4 Q63.4 6 60 7.6 L21 9.4 Z" />
    {#each Array.from({ length: 22 }, (_, k) => 23 + k * 1.7) as x (x)}
      <line class="taille" x1={x} y1="9" x2={x + 1.6} y2="3" />
    {/each}
  </svg>
{/snippet}

<!-- Un texte et ses nombres : en chiffres à l'écran, en mots pour un lecteur d'écran. -->
{#snippet lu(ecrit: string, dit: string)}
  {#if ecrit === dit}{ecrit}{:else}<span aria-hidden="true">{ecrit}</span><span class="lecteur"
      >{dit}</span
    >{/if}
{/snippet}

<section class="atelier" style="{VARIABLES}; --n: {n}" data-test="atelier">
  <header class="entete">
    <h2>{o("titre")}</h2>
    <p>
      <span class="libelle">{o("stock")}</span>
      <strong data-test="stock"
        >{@render lu(
          t("stock.valeur", { stock: etat.stock }),
          dire("stock.valeur", { stock: etat.stock }),
        )}</strong
      >
    </p>
    <p>
      <span class="libelle">{o("production")}</span>
      <strong data-test="production"
        >{@render lu(
          t("production.valeur", { production: analyse.production }),
          dire("production.valeur", { production: analyse.production }),
        )}</strong
      >
    </p>
    <p data-test="cases">
      {#if analyse.casesLibres > 0}
        {@render lu(
          t("cases.valeur", { cases: analyse.casesLibres }),
          dire("cases.valeur", { cases: analyse.casesLibres }),
        )}
      {:else}
        {o("cases.aucune")}
      {/if}
    </p>
    <button
      class="lien-aide"
      bind:this={lienAide}
      aria-expanded={aideOuverte}
      aria-controls="aide-atelier"
      onclick={() => (aideOuverte ? refermerAide() : ouvrirAide())}
      data-test="lien-aide">{o("aide")}</button
    >
  </header>

  <div class="centre">
    <!-- La planche : le plan dans son cadre, ses colonnes et ses lignes repérées en base douze. -->
    <div class="planche">
      <ol class="reperes colonnes" aria-hidden="true">
        {#each reperes as repere, k (k)}
          <li>{repere}</li>
        {/each}
      </ol>
      <ol class="reperes lignes" aria-hidden="true">
        {#each reperes as repere, k (k)}
          <li>{repere}</li>
        {/each}
      </ol>
      <div
        class="plan"
        class:en-main={enMain !== undefined}
        role="group"
        aria-label={o("plan")}
        bind:this={plan}
        onfocusin={suivreFocus}
        onfocusout={(e) => {
          const vers = e.relatedTarget;
          if (vers instanceof Node && !plan?.contains(vers)) dansLePlan = false;
        }}
        data-test="plan"
      >
        <div
          class="ressort"
          bind:this={ressort}
          style="grid-area: {r + 1} / {r + 1} / span 2 / span 2"
          role="img"
          aria-label={o("ressort")}
          data-test="ressort"
        >
          <Piece piece={RESSORT} info={infoRessort} {montree} ressort />
        </div>
        {#each libres as [l, c] (`${l},${c}`)}
          <button
            class="case"
            style="grid-area: {l + 1} / {c + 1}"
            aria-label={dire("case.libre", { ligne: l + 1, colonne: c + 1 })}
            tabindex={sous(l, c, 1) ? 0 : -1}
            data-case="{l},{c}"
            disabled={mode !== "jeu"}
            onclick={() => cliquerCase(l, c)}
          ></button>
        {/each}
        {#each posees as p (p.repere)}
          {@const info = analyse.pieces.get(p.repere)}
          {@const s = largeur(p)}
          <button
            class="piece"
            class:en-main={main === p.repere}
            class:limee={lime === p.repere}
            style="grid-area: {p.case![0] + 1} / {p.case![1] + 1} / span {s} / span {s}"
            aria-label={description(p, info)}
            aria-pressed={main === p.repere}
            tabindex={sous(p.case![0], p.case![1], s) ? 0 : -1}
            data-piece={p.repere}
            disabled={mode !== "jeu"}
            onclick={() => cliquerPiece(p)}
            oncontextmenu={(e) => tourner(e, p)}
          >
            <Piece piece={p} {info} numero={formaterEntier(p.repere)} {montree} />
          </button>
        {/each}
      </div>
    </div>

    <!-- L'établi : les pièces achetées qui ne sont pas sur le plan, et la lime. -->
    <section class="etabli" data-test="etabli">
      <h3>{o("etabli")}</h3>
      <div class="plateau">
        <ul>
          {#each surEtabli as p (p.repere)}
            {@const s = largeur(p)}
            <li style="--s: {s}">
              <button
                class="piece"
                class:en-main={main === p.repere}
                class:limee={lime === p.repere}
                aria-label={description(p, undefined)}
                aria-pressed={main === p.repere}
                data-piece={p.repere}
                disabled={mode !== "jeu"}
                onclick={() => (main = main === p.repere ? null : p.repere)}
                oncontextmenu={(e) => tourner(e, p)}
              >
                <Piece piece={p} numero={formaterEntier(p.repere)} />
              </button>
            </li>
          {/each}
          {#if etat.sansPlan}
            <!-- Creuse, sans dents ni cote : elle ne se pose nulle part. -->
            <li class="sans-plan" data-test="sans-plan">
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <rect x="2" y="2" width="16" height="16" rx="0.8" />
                <circle cx="10" cy="10" r="4.6" />
                <circle class="creux" cx="10" cy="10" r="3.2" />
                <line x1="10" y1="2" x2="10" y2="5.4" />
              </svg>
              <span>{o("sans-plan")}</span>
            </li>
          {/if}
        </ul>
        <figure class="lime" class:levee={lime !== null}>
          {@render dessinLime()}
          <figcaption>{o("lime")}</figcaption>
        </figure>
      </div>
      {#if surEtabli.length === 0 && !etat.sansPlan}
        <p class="vide">{o("etabli.vide")}</p>
      {/if}
      <!-- Au clavier, la lime levée se dit : la flèche suivante désigne le côté. -->
      <p class="lecteur" role="status">
        {lime === null ? "" : `${o("lime")} : ${dire("piece.etiquette", { piece: lime })}`}
      </p>

      {#if enMain}
        <div class="main" data-test="main">
          <p>
            {o("main")} :
            {@render lu(
              t("piece.etiquette", { piece: enMain.repere }),
              dire("piece.etiquette", { piece: enMain.repere }),
            )},
            {o(`piece.${enMain.id}`).toLowerCase()}
          </p>
          <button onclick={() => envoyer({ type: "tourner", repere: enMain.repere })}
            >{o("main.tourner")}</button
          >
          {#if enMain.case}
            <button
              onclick={() => {
                envoyer({ type: "mettreDeCote", repere: enMain.repere });
                main = null;
              }}>{o("main.de-cote")}</button
            >
          {/if}
          {#each COTES as d (d)}
            {#if dente(enMain, d)}
              <!-- Avant le premier coup, la lime dessinée, sans le mot qui dit ce qu'elle fait. -->
              <button
                class="limer"
                data-test="limer-{d}"
                aria-label={roleLime ? undefined : `${o("main.limer")} ${o(`cote.${d}`)}`}
                onclick={() => envoyer({ type: "limer", repere: enMain.repere, cote: d })}
                >{#if roleLime}{o("main.limer")}{:else}{@render dessinLime()}{/if}
                {o(`cote.${d}`)}</button
              >
            {/if}
          {/each}
          <button onclick={() => (main = null)}>{o("main.lacher")}</button>
        </div>
      {/if}
    </section>
  </div>

  <div class="droite">
    <!-- La nomenclature : un tableau à colonnes, comme un cartouche ; sa dernière ligne agrandit le
         plan, et les objets d'en haut s'y ajoutent, « Hors plan ». -->
    <div class="cartouche">
      <table class="nomenclature" data-test="nomenclature">
        <caption>{o("nomenclature")}</caption>
        <thead>
          <tr>
            <th scope="col">{o("nomenclature.repere")}</th>
            <th scope="col">{o("nomenclature.designation")}</th>
            <th scope="col">{o("nomenclature.profil")}</th>
            <th scope="col">{o("nomenclature.exemplaires")}</th>
            <th scope="col">{o("nomenclature.base")}</th>
            <th scope="col">{o("nomenclature.prix")}</th>
          </tr>
        </thead>
        <tbody>
          {#each PIECES as d, i (d.id)}
            {#if pieceVisible(etat, d)}
              {@const reste = restantes(etat, d)}
              {@const prix = prixPiece(etat, d)}
              <!-- Montrée d'avance par un objet d'en haut : d'un trait plus clair, en italique. -->
              <tr data-test="nomenclature-{d.id}" class:avance={pieceDAvance(etat, d)}>
                <td>{@render lu(formaterEntier(i + 1), enMots(i + 1))}</td>
                <th scope="row" class="designation">
                  {o(`piece.${d.id}`)}
                  <!-- La note de la pièce, au survol de sa ligne ou quand son prix a le focus. -->
                  <span class="note" id="note-{d.id}" role="tooltip" data-test="note-{d.id}"
                    >{o(`piece.${d.id}.note`)}</span
                  >
                </th>
                <td class="profil" style="--s: {d.largeur}">
                  <Piece piece={{ id: d.id, repere: 0, case: null, rot: 0, limees: [] }} />
                </td>
                <td>{@render lu(formaterEntier(reste), enMots(reste))}</td>
                <td
                  >{@render lu(
                    t("nomenclature.base.valeur", { base: d.base }),
                    dire("nomenclature.base.valeur", { base: d.base }),
                  )}</td
                >
                <td>
                  {#if reste > 0}
                    <button
                      class="acheter"
                      aria-label={enMots(prix)}
                      aria-describedby="note-{d.id}"
                      disabled={mode !== "jeu" || etat.stock < prix}
                      onclick={() => acheter(d.id)}>{formaterEntier(prix)}</button
                    >
                  {:else}
                    {o("nomenclature.epuisee")}
                  {/if}
                </td>
              </tr>
            {/if}
          {/each}
          <tr class="agrandir">
            {#if agrandissement && agrandissementVisible(etat)}
              <td colspan="5"
                >{@render lu(
                  t("agrandir", { taille: agrandissement.taille }),
                  dire("agrandir", { taille: agrandissement.taille }),
                )}</td
              >
              <td>
                <button
                  class="acheter"
                  aria-label={enMots(agrandissement.prix)}
                  data-test="agrandir"
                  disabled={mode !== "jeu" || etat.stock < agrandissement.prix}
                  onclick={() => envoyer({ type: "agrandir" })}
                  >{formaterEntier(agrandissement.prix)}</button
                >
              </td>
            {:else if !agrandissement}
              <td colspan="6">{o("plan.complet")}</td>
            {/if}
          </tr>
        </tbody>
        {#if etat.horsPlan.length > 0}
          <tbody class="hors-plan" data-test="hors-plan">
            <tr>
              <th scope="rowgroup" colspan="6">{o("hors-plan")}</th>
            </tr>
            {#each etat.horsPlan as id (id)}
              <tr>
                <td></td>
                <th scope="row" colspan="5">{etiquette(artefact(id)?.nomDEnBas ?? id)}</th>
              </tr>
            {/each}
          </tbody>
        {/if}
      </table>
    </div>

    <section class="legende">
      <h3>{o("legende")}</h3>
      <ol data-test="legende">
        {#each legende as ligne, i (etat.legende.length - i)}
          <li>
            {@render lu(
              ecrireLigne(ligne, o(ligne.cle)),
              ecrireLigne(ligne, o(ligne.cle), EN_MOTS),
            )}
          </li>
        {/each}
      </ol>
    </section>
  </div>

  {#if aideOuverte}
    <div
      class="aide"
      id="aide-atelier"
      bind:this={pageAide}
      tabindex="-1"
      role="dialog"
      aria-labelledby="aide-titre"
      data-test="aide"
    >
      <h3 id="aide-titre">{o("aide.titre")}</h3>
      {#each SECTIONS_AIDE as section (section)}
        <h4>{o(`aide.${section}.titre`)}</h4>
        <p>{o(`aide.${section}`)}</p>
      {/each}
      <button class="refermer" onclick={refermerAide}>{o("aide.fermer")}</button>
    </div>
  {/if}

  {#if fissure > 0}
    <Fissure depart={ressort} avancee={fissure} />
  {/if}
</section>

<style>
  .atelier {
    /*
     * Le plan au centre et au plus grand (fiche, § 6) : il prend la hauteur sous l'en-tête, moins
     * l'établi, et la largeur que laisse la nomenclature. Sa taille ne change pas quand il s'agrandit :
     * ses cases rétrécissent, et il se densifie.
     */
    --droite: clamp(24rem, 28vw / var(--zoom, 1), 27rem);
    --reperes: 1.1rem;
    --sous-plan: 9rem;
    --cote: clamp(
      15rem,
      min(
        100vw / var(--zoom, 1) - var(--droite) - 4.25rem - var(--reperes),
        100vh / var(--zoom, 1) - 7.5rem - var(--reperes) - var(--sous-plan)
      ),
      50rem
    );
    --case: calc(var(--cote) / var(--n));
    --case-etabli: min(var(--case), 3rem);
    display: grid;
    flex: 1 0 auto;
    grid-template-areas: "entete entete" "centre droite";
    grid-template-columns: auto var(--droite);
    gap: 16px 32px;
    align-content: start;
    justify-content: center;
    box-sizing: border-box;
    padding: 20px 16px 40px;
    font: 15px/1.4 var(--police);
    font-variant-numeric: tabular-nums;
    color: var(--graphite);
    background-color: var(--papier);
  }
  h2,
  h3,
  p {
    margin: 0;
  }
  h2,
  h3,
  caption {
    font-weight: 400;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  h2 {
    font-size: 18px;
  }
  h3,
  caption {
    margin-bottom: 6px;
    font-size: 13px;
    text-align: start;
    color: var(--graphite-doux);
  }
  ul,
  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  button {
    font: inherit;
    color: inherit;
  }
  /* Pour les lecteurs d'écran seulement : les nombres en mots. */
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

  .entete {
    display: flex;
    flex-wrap: wrap;
    grid-area: entete;
    gap: 8px 32px;
    align-items: baseline;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--graphite);
  }
  .libelle {
    margin-right: 6px;
    font-size: 13px;
    color: var(--graphite-doux);
    text-transform: uppercase;
  }
  .entete strong {
    font-size: 20px;
    font-weight: 600;
  }

  .centre {
    display: flex;
    flex-direction: column;
    grid-area: centre;
    gap: 14px;
    width: calc(var(--cote) + var(--reperes) + 10px);
  }
  /* La planche : le plan, et ses repères sur le cadre, en haut et à gauche. */
  .planche {
    display: grid;
    grid-template-columns: var(--reperes) auto;
    grid-template-rows: var(--reperes) auto;
  }
  .reperes {
    display: grid;
    font-size: 11px;
    line-height: 1;
    color: var(--graphite-doux);
  }
  .reperes li {
    display: grid;
    place-items: center;
  }
  .colonnes {
    grid-area: 1 / 2;
    grid-template-columns: repeat(var(--n), var(--case));
    padding-left: 5px;
  }
  .lignes {
    grid-area: 2 / 1;
    grid-template-rows: repeat(var(--n), var(--case));
    padding-top: 5px;
  }
  /*
   * Le plan : le quadrillage dans son cadre, un double trait comme celui d'un dessin. Le cadre est
   * lisse : il n'a pas de dents.
   */
  .plan {
    display: grid;
    grid-area: 2 / 2;
    grid-template-columns: repeat(var(--n), var(--case));
    grid-template-rows: repeat(var(--n), var(--case));
    width: max-content;
    margin: 3px;
    border: 2px solid var(--graphite);
    outline: 1px solid var(--graphite);
    outline-offset: 2px;
    background-image:
      linear-gradient(var(--quadrillage) 1px, transparent 1px),
      linear-gradient(90deg, var(--quadrillage) 1px, transparent 1px);
    background-size: var(--case) var(--case);
  }
  .case,
  .piece {
    padding: 0;
    cursor: pointer;
    background: none;
    border: none;
  }
  .case:hover:enabled {
    background: color-mix(in oklab, var(--quadrillage), transparent 50%);
  }
  /* Une pièce en main : la case qu'elle prendrait se dessine en tirets. */
  .plan.en-main .case:hover:enabled {
    outline: 1px dashed var(--graphite-doux);
    outline-offset: -4px;
  }
  .case:focus-visible,
  .piece:focus-visible {
    outline: 2px solid var(--graphite);
    outline-offset: -2px;
  }
  .piece.en-main {
    outline: 2px dashed var(--graphite);
    outline-offset: -1px;
  }
  /* La lime levée au clavier, sur la pièce qu'elle vise. */
  .piece.limee {
    outline: 2px dashed var(--vermillon);
    outline-offset: -1px;
  }
  .case:disabled,
  .piece:disabled {
    cursor: default;
  }

  /* L'établi : une bande sous le plan, les pièces mises de côté, et la lime au bout. */
  .plateau {
    display: flex;
    gap: 16px;
    align-items: flex-start;
    justify-content: space-between;
  }
  .etabli ul {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-height: var(--case-etabli);
  }
  .etabli li {
    width: calc(var(--s) * var(--case-etabli));
    height: calc(var(--s) * var(--case-etabli));
  }
  .etabli .piece {
    width: 100%;
    height: 100%;
  }
  .etabli li.sans-plan {
    display: flex;
    gap: 6px;
    align-items: center;
    width: auto;
    height: var(--case-etabli);
    font-size: 13px;
    color: var(--graphite-doux);
  }
  .sans-plan svg {
    width: var(--case-etabli);
    height: var(--case-etabli);
    fill: none;
    stroke: var(--graphite-doux);
    stroke-width: 0.6;
  }
  .sans-plan rect {
    stroke-dasharray: 1.4 1;
  }
  .sans-plan .creux {
    fill: var(--quadrillage);
  }
  .vide {
    font-size: 13px;
    color: var(--graphite-doux);
  }
  /* La lime, posée au bout de l'établi : un manche, une lame taillée. */
  .lime {
    display: flex;
    flex: none;
    flex-direction: column;
    align-items: center;
    margin: 0;
    font-size: 13px;
    color: var(--graphite-doux);
  }
  .lime .dessin-lime {
    width: 7rem;
    height: calc(7rem * 12 / 64);
  }
  /* Dans un bouton, la lime tient dans la ligne. */
  .limer .dessin-lime {
    width: 2.6em;
    height: calc(2.6em * 12 / 64);
    vertical-align: middle;
  }
  .manche {
    fill: var(--papier);
    stroke: var(--graphite);
    stroke-width: 0.6;
  }
  .virole {
    stroke: var(--graphite);
    stroke-width: 0.6;
  }
  .soie {
    fill: var(--acier-sombre);
  }
  .lame {
    fill: var(--acier);
    stroke: var(--acier-sombre);
    stroke-width: 0.5;
  }
  .taille {
    stroke: var(--acier-sombre);
    stroke-width: 0.3;
  }
  .lime.levee .lame {
    stroke: var(--vermillon);
  }
  .lime.levee figcaption {
    color: var(--graphite);
  }
  .main {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: baseline;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid var(--quadrillage);
  }
  .main p {
    flex-basis: 100%;
  }
  .main button,
  .acheter {
    padding: 2px 8px;
    cursor: pointer;
    background: transparent;
    border: 1px solid var(--graphite);
    border-radius: 2px;
  }
  .main button:hover,
  .acheter:hover:enabled {
    background: var(--quadrillage);
  }
  .acheter:disabled {
    color: var(--graphite-doux);
    cursor: default;
    border-color: var(--quadrillage);
  }

  .droite {
    display: flex;
    flex-direction: column;
    grid-area: droite;
    gap: 20px;
  }
  /*
   * La nomenclature, comme le cartouche d'un dessin : un cadre épais, des filets entre les colonnes.
   * Trop étroite pour elle, sa colonne la fait défiler plutôt que d'élargir la page.
   */
  .cartouche {
    max-width: 100%;
    overflow-x: auto;
  }
  .nomenclature {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }
  .nomenclature thead,
  .nomenclature tbody {
    border: 2px solid var(--graphite);
  }
  .nomenclature thead th,
  .hors-plan th[scope="rowgroup"] {
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.04em;
    color: var(--graphite-doux);
    text-align: start;
    text-transform: uppercase;
  }
  .nomenclature th,
  .nomenclature td {
    padding: 3px 5px;
    border: 1px solid var(--quadrillage);
  }
  .nomenclature th[scope="row"] {
    font-weight: 400;
    text-align: start;
  }
  /*
   * Une pièce que les objets d'en haut montrent d'avance (fiche, § 8) : un trait plus clair, et
   * l'italique, qui ne tient pas à la seule couleur.
   */
  .nomenclature tr.avance {
    color: var(--graphite-doux);
  }
  .nomenclature tr.avance .designation {
    font-style: italic;
  }
  .nomenclature tr.avance .profil :global(.dessin) {
    opacity: 0.55;
  }
  .nomenclature td:nth-child(4),
  .nomenclature td:nth-child(5),
  .nomenclature td:last-child {
    text-align: end;
  }
  /* La note d'une pièce : une ligne de nomenclature de plus, au survol ou au clavier. */
  .note {
    display: none;
    font-size: 12px;
    color: var(--graphite-doux);
  }
  .nomenclature tr:hover .note,
  .nomenclature tr:focus-within .note {
    display: block;
  }
  .profil :global(.dessin) {
    width: calc(var(--s) * 18px);
    height: calc(var(--s) * 18px);
  }
  .agrandir td {
    border-top: 1px solid var(--graphite);
  }
  .legende li {
    padding: 2px 0;
    border-bottom: 1px solid var(--quadrillage);
  }
  .legende li + li {
    color: var(--graphite-doux);
  }

  /* Le lien de la notice : un mot au graphite, au bout de l'en-tête. */
  .lien-aide {
    margin-inline-start: auto;
    padding: 2px 4px;
    font-size: 13px;
    letter-spacing: 0.06em;
    color: var(--graphite-doux);
    text-transform: uppercase;
    cursor: pointer;
    background: none;
    border: none;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .lien-aide:hover {
    color: var(--graphite);
  }
  .lien-aide:focus-visible,
  .refermer:focus-visible {
    outline: 1px solid var(--graphite);
    outline-offset: 2px;
  }
  /* La notice : une feuille posée sur le plan, au trait. L'atelier continue de tourner dessous. */
  .aide {
    position: fixed;
    top: 40px;
    right: 16px;
    z-index: 4;
    box-sizing: border-box;
    width: min(26rem, calc(100vw / var(--zoom, 1) - 32px));
    max-height: calc(100vh / var(--zoom, 1) - 56px);
    padding: 16px 20px 18px;
    overflow: auto;
    background: var(--papier);
    border: 1px solid var(--graphite);
    box-shadow: 0 4px 16px rgb(0 0 0 / 0.18);
  }
  .aide:focus {
    outline: none;
  }
  .aide h4 {
    margin: 12px 0 2px;
    font-size: 14px;
    font-weight: 600;
  }
  .aide p {
    color: var(--graphite-doux);
  }
  .refermer {
    margin-top: 14px;
    padding: 0;
    cursor: pointer;
    background: none;
    border: none;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  /* Sur un écran étroit, tout s'empile : le plan prend la largeur, et la nomenclature se resserre. */
  @media (max-width: 900px) {
    .atelier {
      --cote: clamp(12rem, 100vw / var(--zoom, 1) - 2rem - var(--reperes) - 10px, 40rem);
      grid-template-areas: "entete" "centre" "droite";
      grid-template-columns: minmax(0, 1fr);
    }
    .nomenclature {
      font-size: 13px;
    }
    .nomenclature th,
    .nomenclature td {
      padding: 2px 3px;
    }
  }
</style>

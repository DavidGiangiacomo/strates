<script lang="ts">
  // La coupe des stockages, qui sert de jauge (fiche, § 6) : le ciel de la vallée, les greniers posés
  // sur le champ, puis le sol, où sont creusés les silos, les caves et les caves profondes. Le grain
  // remplit d'abord le plus profond, et coule d'une couche à l'autre. La marque d'hiver est un trait
  // horizontal : la réserve doit monter jusqu'à lui avant le premier jour de l'hiver.
  import type { EtatCaves } from "../logique";
  import type { IdStockage } from "../logique/regles";
  import { couches, DEBORD, niveau, type Couche } from "./coupe";

  let {
    etat,
    marque,
    nommee,
    libelle,
    nom,
    titre,
    fond = $bindable(),
  }: {
    etat: Readonly<EtatCaves>;
    /** La marque d'hiver, en boisseaux. */
    marque: number;
    /** La marque porte son nom : après le premier bilan, ou avec les deux fenêtres (fiche, § 7). */
    nommee: boolean;
    /** Le nom de la marque, écrit sur la coupe quand elle est nommée. */
    libelle: string;
    /** Le nom d'un type de stockage. */
    nom: (id: IdStockage) => string;
    titre: string;
    /** Le sol sous la couche la plus profonde : le filet y prend sa fissure (fiche, § 4). */
    fond?: SVGElement;
  } = $props();

  const LARGEUR = 400;
  /** La hauteur d'une couche, quelle que soit sa capacité. */
  const COUCHE = 56;
  /** Au-dessus des greniers, la place de ce qui dépasse la capacité. */
  const CIEL = COUCHE * DEBORD + 14;
  /** Le sol sous la couche la plus profonde. */
  const FOND = 36;
  /** Les stockages sont dessinés à droite des noms des couches. */
  const DEBUT = 96;
  const FIN = LARGEUR - 14;

  const liste = $derived(couches(etat));
  const base = $derived(CIEL + liste.length * COUCHE);
  const hauteur = $derived(base + FOND);
  /** Le bas des greniers : le niveau du champ. */
  const champ = CIEL + COUCHE;
  const y = (n: number) => base - n * COUCHE;
  const yMarque = $derived(y(niveau(liste, marque)));

  /** La largeur d'un stockage seul : plus on descend, plus on creuse grand. */
  const LARGEUR_MAX: Record<IdStockage, number> = {
    grenier: 58,
    silo: 38,
    cave: 72,
    caveProfonde: 116,
  };

  /** Les stockages d'une couche, côte à côte, de plus en plus serrés quand ils sont nombreux. */
  function chambres(c: Couche): { x: number; largeur: number }[] {
    const place = FIN - DEBUT;
    const ecart = Math.min(6, place / (4 * c.nombre));
    const largeur = Math.min(LARGEUR_MAX[c.id], (place - (c.nombre - 1) * ecart) / c.nombre);
    const total = c.nombre * largeur + (c.nombre - 1) * ecart;
    const x0 = DEBUT + (place - total) / 2;
    return Array.from({ length: c.nombre }, (_, j) => ({ x: x0 + j * (largeur + ecart), largeur }));
  }

  /** La part pleine d'une couche : tous ses stockages sont remplis de même. */
  const plein = (c: Couche) => (c.capacite > 0 ? Math.min(1, c.grain / c.capacite) : 0);
  /** Plus une couche est profonde, plus son sol est sombre. */
  const profondeur = (i: number) => (liste.length > 1 ? 1 - i / (liste.length - 1) : 0);
</script>

<svg
  class="jauge"
  viewBox="0 0 {LARGEUR} {hauteur}"
  role="meter"
  aria-label={titre}
  aria-valuemin={0}
  aria-valuemax={Math.round(liste.reduce((s, c) => s + c.capacite, 0))}
  aria-valuenow={Math.floor(etat.reserve)}
  data-test="coupe"
>
  <rect class="ciel" x="0" y="0" width={LARGEUR} height={champ} />
  <rect class="sol" x="0" y={champ} width={LARGEUR} height={hauteur - champ} />
  <rect class="fond" x="0" y={base} width={LARGEUR} height={FOND} bind:this={fond} />
  {#each liste as c, i (c.id)}
    {@const haut = y(i + 1)}
    {#if c.id !== "grenier"}
      <rect
        class="strate-sol"
        x="0"
        y={haut}
        width={LARGEUR}
        height={COUCHE}
        style:opacity={0.25 + 0.75 * profondeur(i)}
      />
    {/if}
    <text class="nom" class:sous-terre={c.id !== "grenier"} x="12" y={haut + COUCHE / 2 + 4}
      >{nom(c.id)}</text
    >
    <g class="couche {c.id}" data-test="couche-{c.id}">
      {#each chambres(c) as ch, j (j)}
        {#if c.id === "grenier"}
          <!-- Un grenier : un bâtiment de bois posé sur le champ, sous son toit. -->
          {@const corps = haut + 18}
          <polygon
            class="toit"
            points="{ch.x - 2},{corps} {ch.x + ch.largeur / 2},{haut + 5} {ch.x +
              ch.largeur +
              2},{corps}"
          />
          <rect class="chambre" x={ch.x} y={corps} width={ch.largeur} height={champ - corps} />
          <rect
            class="grain"
            x={ch.x + 2}
            y={corps + 2}
            width={Math.max(0, ch.largeur - 4)}
            height={champ - corps - 2}
            style:transform="scaleY({plein(c)})"
          />
        {:else}
          <!-- Sous terre : une chambre creusée, plus grande et plus ronde à mesure qu'on descend. -->
          {@const marge = c.id === "caveProfonde" ? 4 : c.id === "cave" ? 7 : 5}
          <rect
            class="chambre creusee"
            x={ch.x}
            y={haut + marge}
            width={ch.largeur}
            height={COUCHE - 2 * marge}
            rx={Math.min(ch.largeur / 2, c.id === "silo" ? 14 : 12)}
          />
          <rect
            class="grain"
            x={ch.x + 2}
            y={haut + marge + 2}
            width={Math.max(0, ch.largeur - 4)}
            height={COUCHE - 2 * marge - 4}
            rx={Math.min(ch.largeur / 2 - 2, 3)}
            style:transform="scaleY({plein(c)})"
          />
        {/if}
      {/each}
    </g>
  {/each}
  <rect class="champ" x="0" y={champ - 3} width={LARGEUR} height="4" />

  <!-- La marque d'hiver : un trait sur toute la coupe, qui monte avec les familles. -->
  <g class="marque" style:transform="translateY({yMarque}px)" data-test="trait-marque">
    <line class="halo" x1="4" x2={LARGEUR - 4} y1="0" y2="0" />
    <line class="trait" x1="4" x2={LARGEUR - 4} y1="0" y2="0" />
    <polygon class="pointe" points="0,-5 8,0 0,5" />
    <polygon class="pointe" points="{LARGEUR},-5 {LARGEUR - 8},0 {LARGEUR},5" />
    {#if nommee}
      <text class="legende" x={LARGEUR - 12} y="-6">{libelle}</text>
    {/if}
  </g>
</svg>

<style>
  .jauge {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
    border-radius: 3px;
    box-shadow: 0 0 0 1px var(--bois-sombre);
  }
  .ciel {
    fill: var(--ciel);
  }
  .sol {
    fill: var(--sol);
  }
  .strate-sol,
  .fond {
    fill: var(--sol-profond);
  }
  .champ {
    fill: var(--champ);
  }
  .nom {
    font-size: 12px;
    font-style: italic;
    fill: var(--encre-douce);
  }
  .nom.sous-terre {
    fill: var(--sur-bois-doux);
  }
  .toit {
    fill: var(--bois-sombre);
  }
  .chambre {
    fill: var(--bois-clair);
  }
  .chambre.creusee {
    fill: var(--bois-sombre);
    stroke: var(--sur-bois-doux);
    stroke-opacity: 0.25;
  }
  /* Le grain coule : il monte et descend lentement, jamais par à-coups. */
  .grain {
    fill: var(--ble);
    transform-box: fill-box;
    transform-origin: 50% 100%;
    transition: transform 700ms ease-out;
  }
  .marque {
    transition: transform 600ms ease-out;
  }
  .halo {
    stroke: var(--papier);
    stroke-opacity: 0.55;
    stroke-width: 4;
  }
  .trait {
    stroke: var(--marque);
    stroke-width: 2;
    stroke-dasharray: 7 4;
  }
  .pointe {
    fill: var(--marque);
  }
  /* Sa légende, cerclée de papier : lisible sur le ciel comme dans le sol. */
  .legende {
    font-size: 13px;
    font-style: italic;
    text-anchor: end;
    fill: var(--marque);
    stroke: var(--papier);
    stroke-width: 5px;
    stroke-linejoin: round;
    paint-order: stroke;
  }
  @media (prefers-reduced-motion: reduce) {
    .grain,
    .marque {
      transition: none;
    }
  }
</style>

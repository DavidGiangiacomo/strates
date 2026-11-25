<script lang="ts">
  // Les tablettes brisées (fiche, § 6), empilées en morceaux sous la tablette ouverte : trois éclats
  // d'argile chacune, la plus vieille en bas, et chacune un peu ailleurs sur le tas. Rien n'y est
  // écrit, et rien n'imite une écriture : la ligne qui suit dit leur nombre.
  let { n }: { n: number } = $props();

  /** Les trois éclats d'une tablette de 58 × 34, séparés par deux fêlures. */
  const ECLATS = [
    "M3,1 L23,1 L20,10 L25,18 L18,34 L4,34 Q1,34 1,31 L1,4 Q1,1 3,1 Z",
    "M23,1 L40,1 L36,12 L41,21 L33,34 L18,34 L25,18 L20,10 Z",
    "M40,1 L55,1 Q57,1 57,4 L57,31 Q57,34 54,34 L33,34 L41,21 L36,12 Z",
  ];
  /** Comment tombent les éclats : un peu écartés, un peu tournés. */
  const ECARTS: readonly (readonly [number, number, number])[] = [
    [-3, 2, -5],
    [0, -1, 3],
    [4, 2, 7],
  ];
  /** La place de chaque tablette sur le tas, de la plus vieille à la plus récente. */
  const PLACES: readonly (readonly [number, number])[] = [
    [10, 44],
    [84, 46],
    [46, 30],
    [120, 34],
    [66, 16],
  ];
  const HAUTEUR = 84;
</script>

<svg class="tas" viewBox="0 0 190 {HAUTEUR}" aria-hidden="true">
  {#each PLACES.slice(0, n) as [x, y], k (k)}
    <g transform="translate({x} {y})" data-test="brisee">
      {#each ECLATS as d, i (i)}
        {@const [dx, dy, r] = ECARTS[(i + k) % ECARTS.length]!}
        <path {d} transform="translate({dx} {dy}) rotate({r} 29 17)" />
      {/each}
    </g>
  {/each}
</svg>

<style>
  .tas {
    display: block;
    width: 100%;
    max-width: 260px;
    height: auto;
  }
  path {
    fill: var(--argile-2);
    stroke: var(--argile-bord);
    stroke-width: 1;
    stroke-linejoin: round;
  }
</style>

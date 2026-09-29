<script lang="ts">
  // Le calendrier circulaire (fiche, § 6) : le temps tourne au lieu d'avancer. Au centre, l'année et
  // son aiguille ; la soudure prolonge l'hiver sur le printemps. Autour, le grand cycle : une case par
  // année vécue, dont l'hiver s'allonge ; un hiver manqué y est barré. Les années futures ne sont pas
  // dessinées, sauf par l'armoire qui compte les hivers (`avenir`). Il est posé sur le bois, et
  // l'aiguille tourne d'un jour par seconde, sans à-coup.
  import type { EtatCaves } from "../logique";
  import { finSoudure } from "../logique/regles";
  import { angleJour, casesCycle, point, saisonsAnnee, secteur, TAILLE } from "./calendrier";

  let {
    etat,
    titre,
    avenir = false,
  }: { etat: Readonly<EtatCaves>; titre: string; avenir?: boolean } = $props();

  const ANNEAU = { interieur: 84, exterieur: 96 };
  const ANNEE = 76;
  const SOUDURE = 62;

  const saisons = $derived(saisonsAnnee(etat.annee));
  const soudure = $derived(angleJour(finSoudure(etat)));
  const cases = $derived(casesCycle(etat, avenir));
  const aiguille = $derived(point(ANNEE + 4, angleJour(etat.jour)));

  /** Le trait qui barre un hiver manqué, au milieu de son arc. */
  function trait(debut: number, fin: number) {
    const a = (debut + fin) / 2;
    return { de: point(ANNEAU.interieur - 3, a), a: point(ANNEAU.exterieur + 3, a) };
  }
</script>

<svg
  class="calendrier"
  viewBox="0 0 {TAILLE} {TAILLE}"
  role="img"
  aria-label={titre}
  data-test="calendrier-circulaire"
>
  {#each cases as c (c.annee)}
    <g
      class="case"
      class:courante={c.annee === etat.annee}
      class:grand={c.grand}
      class:manque={c.rupture === true}
      class:future={c.future}
      data-test="case-{c.annee}"
    >
      <path class="chaude" d={secteur(ANNEAU.interieur, ANNEAU.exterieur, c.debut, c.hiver)} />
      <path class="hiver" d={secteur(ANNEAU.interieur, ANNEAU.exterieur, c.hiver, c.fin)} />
      {#if c.rupture === true}
        {@const t = trait(c.hiver, c.fin)}
        <line class="trait" x1={t.de.x} y1={t.de.y} x2={t.a.x} y2={t.a.y} />
      {/if}
    </g>
  {/each}

  {#each saisons as s (s.saison)}
    <path class="saison {s.saison}" d={secteur(0, ANNEE, angleJour(s.debut), angleJour(s.fin))} />
  {/each}
  <path class="soudure" d={secteur(SOUDURE, ANNEE, 0, soudure)} />
  <circle class="bord" cx={TAILLE / 2} cy={TAILLE / 2} r={ANNEE} />

  <line class="aiguille" x1={TAILLE / 2} y1={TAILLE / 2} x2={aiguille.x} y2={aiguille.y} />
  <circle class="axe" cx={TAILLE / 2} cy={TAILLE / 2} r="3" />
</svg>

<style>
  .calendrier {
    display: block;
    width: 100%;
    max-width: 17rem;
    height: auto;
    aspect-ratio: 1;
  }
  /* Les saisons gardent leurs couleurs en hiver : c'est le reste de l'écran qui se refroidit. */
  .saison {
    stroke: var(--bois);
    stroke-width: 1.5;
  }
  .printemps {
    fill: #b5c48f;
  }
  .ete {
    fill: #dcb652;
  }
  .automne {
    fill: #b88146;
  }
  .hiver {
    fill: #93a6ba;
  }
  .soudure {
    fill: #93a6ba;
    opacity: 0.55;
  }
  .bord {
    fill: none;
    stroke: var(--bois-sombre);
    stroke-width: 2;
  }
  .case .chaude {
    fill: var(--papier-sombre);
  }
  .case.grand .hiver {
    fill: #56708c;
  }
  .case.future {
    opacity: 0.35;
  }
  .case.courante path {
    stroke: var(--papier);
    stroke-width: 1.5;
  }
  .trait {
    stroke: var(--marque);
    stroke-width: 2.5;
  }
  .aiguille {
    stroke: var(--encre);
    stroke-width: 2.5;
    stroke-linecap: round;
  }
  .axe {
    fill: var(--encre);
  }
</style>

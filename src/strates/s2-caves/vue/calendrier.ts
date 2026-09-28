// La géométrie du calendrier circulaire (fiche, § 6) : au centre, l'année, avec ses trois tiers de
// saison chaude et son hiver à sa vraie longueur ; autour, l'anneau du grand cycle, une case par année
// passée. Les angles partent du haut et tournent dans le sens des aiguilles d'une montre.
import type { EtatCaves } from "../logique";
import {
  dureeHiver,
  estGrandHiver,
  JOURS_PAR_AN,
  saisonChaude,
  type Saison,
} from "../logique/regles";

/** Le calendrier se dessine dans un carré de 200 unités. */
export const TAILLE = 200;
const CENTRE = TAILLE / 2;

/** Nombre de cases de l'anneau : les 20 dernières années, l'année en cours comprise. */
export const CASES = 20;
/** Écart entre deux cases de l'anneau, en radians. */
const ECART = 0.03;

export interface Point {
  x: number;
  y: number;
}

/** L'angle d'un jour de l'année, en radians : 0 au premier jour du printemps, en haut. */
export function angleJour(jour: number): number {
  return (jour / JOURS_PAR_AN) * 2 * Math.PI;
}

/** Le point à l'angle `a` sur le cercle de rayon `r`. */
export function point(r: number, a: number): Point {
  return { x: CENTRE + r * Math.sin(a), y: CENTRE - r * Math.cos(a) };
}

const f = (x: number) => x.toFixed(2);

/** Un secteur d'anneau, entre les rayons `r0` < `r1` et les angles `a0` < `a1` ; une part si `r0` vaut 0. */
export function secteur(r0: number, r1: number, a0: number, a1: number): string {
  const grand = a1 - a0 > Math.PI ? 1 : 0;
  const [e0, e1] = [point(r1, a0), point(r1, a1)];
  const exterieur = `M${f(e0.x)},${f(e0.y)} A${r1},${r1} 0 ${grand} 1 ${f(e1.x)},${f(e1.y)}`;
  if (r0 <= 0) return `${exterieur} L${CENTRE},${CENTRE} Z`;
  const [i1, i0] = [point(r0, a1), point(r0, a0)];
  return `${exterieur} L${f(i1.x)},${f(i1.y)} A${r0},${r0} 0 ${grand} 0 ${f(i0.x)},${f(i0.y)} Z`;
}

/** Les saisons de l'année `annee`, en jours : trois tiers égaux de saison chaude, puis l'hiver. */
export function saisonsAnnee(annee: number): { saison: Saison; debut: number; fin: number }[] {
  const s = saisonChaude(annee);
  return [
    { saison: "printemps", debut: 0, fin: s / 3 },
    { saison: "ete", debut: s / 3, fin: (2 * s) / 3 },
    { saison: "automne", debut: (2 * s) / 3, fin: s },
    { saison: "hiver", debut: s, fin: JOURS_PAR_AN },
  ];
}

export interface CaseCycle {
  annee: number;
  /** Début et fin de la case, en radians. */
  debut: number;
  fin: number;
  /** Où commence l'hiver dans la case : sa part de la case est celle de l'hiver dans l'année. */
  hiver: number;
  grand: boolean;
  /** L'hiver a-t-il manqué ? null tant qu'il n'est pas jugé (l'année en cours, ou pendant la soudure). */
  rupture: boolean | null;
  /** Une année à venir, dessinée d'avance par l'armoire qui compte les hivers. */
  future: boolean;
}

/**
 * Les cases de l'anneau du grand cycle : une par année vécue, les 20 dernières au plus. Avec `avenir`
 * (l'armoire qui compte les hivers, fiche, § 8), les places libres de l'anneau montrent d'avance les
 * années à venir et la longueur de leurs hivers.
 */
export function casesCycle(etat: Pick<EtatCaves, "annee" | "hivers">, avenir = false): CaseCycle[] {
  const cases: CaseCycle[] = [];
  const pas = (2 * Math.PI) / CASES;
  const premiere = Math.max(1, etat.annee - CASES + 1);
  const derniere = avenir ? premiere + CASES - 1 : etat.annee;
  for (let annee = premiere; annee <= derniere; annee++) {
    const debut = ((annee - 1) % CASES) * pas + ECART / 2;
    const fin = debut + pas - ECART;
    const jugement = etat.hivers.find((h) => h.annee === annee);
    cases.push({
      annee,
      debut,
      fin,
      hiver: fin - ((fin - debut) * dureeHiver(annee)) / JOURS_PAR_AN,
      grand: estGrandHiver(annee),
      rupture: jugement ? jugement.rupture : null,
      future: annee > etat.annee,
    });
  }
  return cases;
}

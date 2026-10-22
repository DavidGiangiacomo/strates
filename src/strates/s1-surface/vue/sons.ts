// Les sons de la surface (#59 ; fiche, § 6) : ceux d'un logiciel, moderne et tiède. Aucun fond
// sonore : seuls les gestes sonnent.
// - Chaque bouton : un clic feutré, le même pour produire, acheter et améliorer.
// - Chaque objectif atteint : une note discrète, un cran plus haute que la précédente.
// Ils sont calculés, sans fichier, et n'ont rien de commun avec ceux des autres couches (§ 12).
import { creerAlea } from "../../../noyau/logique/alea";
import type { SourceSon } from "../../../noyau/logique/types";
import { blanc, finir, passeBas, resonateur } from "../../../noyau/plateforme/synthese";

export type SonSurface = "clic" | "note";

/** La note du premier objectif, en hertz : un sol, ni grave ni aigu. */
export const NOTE_DE_BASE = 392;

/**
 * Les dix objectifs montent une gamme pentatonique majeure, en demi-tons au-dessus de la note de
 * base : chaque objectif sonne un cran plus haut que le précédent, sans jamais heurter l'oreille.
 */
export const DEGRES_OBJECTIFS = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21] as const;

/** La vitesse de lecture qui joue la note de l'objectif `n` (de 1 à 10) : la note transposée. */
export function vitesseObjectif(n: number): number {
  const degre = DEGRES_OBJECTIFS[Math.min(DEGRES_OBJECTIFS.length, Math.max(1, n)) - 1]!;
  return 2 ** (degre / 12);
}

export const SONS_SURFACE: Readonly<Record<SonSurface, SourceSon>> = {
  // Un clic feutré : un bruit très bref dans un résonateur médium, et une note grave plus brève
  // encore, qui lui donne sa rondeur ; un passe-bas en ôte le claquement.
  clic: {
    duree: 0.08,
    calculer(canaux, fe) {
      const alea = creerAlea(5);
      const canal = canaux[0]!;
      const touche = resonateur(1250, 2.2, fe);
      const feutre = passeBas(2600, fe);
      // Le clic part après le fondu d'entrée de `finir`, qui sinon en mangerait l'attaque.
      for (let i = Math.round(0.002 * fe); i < canal.length; i++) {
        const t = i / fe - 0.002;
        const tic = 3 * touche(blanc(alea) * Math.exp(-t / 0.0012));
        const corps = 0.5 * Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t / 0.012);
        canal[i] = feutre(Math.min(1, t / 0.001) * (tic + corps));
      }
      finir(canaux, fe, 0.6);
    },
  },
  // Une note tiède, comme une lame frappée doucement : la fondamentale, qui dure, et trois
  // partiels qui s'éteignent vite et lui donnent son attaque.
  note: {
    duree: 2.4,
    calculer(canaux, fe) {
      const canal = canaux[0]!;
      const partiels = [
        { rapport: 1, gain: 1, duree: 0.8 },
        { rapport: 2, gain: 0.25, duree: 0.3 },
        { rapport: 3, gain: 0.08, duree: 0.12 },
        { rapport: 4.1, gain: 0.05, duree: 0.03 },
      ];
      const tiede = passeBas(3000, fe);
      for (let i = 0; i < canal.length; i++) {
        const t = i / fe;
        const attaque = t < 0.005 ? (1 - Math.cos((Math.PI * t) / 0.005)) / 2 : 1;
        let x = 0;
        for (const p of partiels) {
          x +=
            p.gain * Math.sin(2 * Math.PI * NOTE_DE_BASE * p.rapport * t) * Math.exp(-t / p.duree);
        }
        canal[i] = tiede(attaque * x);
      }
      finir(canaux, fe, 0.5);
    },
  },
};

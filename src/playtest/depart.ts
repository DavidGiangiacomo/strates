// Les départs de recette (#120 ; docs/strates/strate-7-recette.md) : une partie neuve qui commence à
// l'arrivée dans une strate profonde, pour recetter une strate sans jouer les heures d'avant.
// L'adresse du jeu suivie de « ?depart=lit-soldee » ou de « ?depart=lit-defaut » commence à
// l'arrivée dans le lit, après une dette soldée ou en défaut, avec les objets et la Compréhension
// d'un jeu correct. Elle se combine avec le journal : « ?depart=lit-soldee&journal=T1 ».
// Le lien ne sert que sur un navigateur sans partie : il ne remplace jamais une partie en cours.
import { catalogueDe, preselection } from "../noyau/logique/artefacts";
import { creerEtatNoyau, type EtatNoyau } from "../noyau/logique/etat";
import type { EntreeJournal } from "../noyau/logique/types";

/** Les départs connus, et l'issue de la dette de chacun : le lit en montre les fosses. */
export const DEPARTS = { "lit-soldee": "soldee", "lit-defaut": "defaut" } as const;
export type Depart = keyof typeof DEPARTS;

/** Le départ demandé par l'adresse, s'il est connu ; null sinon. */
export function demandeDepart(url: URL): Depart | null {
  const valeur = url.searchParams.get("depart");
  return valeur !== null && Object.hasOwn(DEPARTS, valeur) ? (valeur as Depart) : null;
}

/** L'adresse sans le départ : une fois la partie créée, un rechargement ne la refait pas. */
export function sansDepart(url: URL): string {
  const copie = new URL(url);
  copie.searchParams.delete("depart");
  return copie.toString();
}

/**
 * Le rythme d'un jeu correct (design doc, §9) : le temps passé dans chacune des six strates d'avant,
 * en minutes, et les points de fouille emportés au départ de chacune.
 */
export const RYTHME_JEU_CORRECT: Readonly<
  Record<1 | 2 | 3 | 4 | 5 | 6, { minutes: number; points: number }>
> = {
  1: { minutes: 75, points: 12 },
  2: { minutes: 120, points: 8 },
  3: { minutes: 150, points: 16 },
  4: { minutes: 150, points: 21 },
  5: { minutes: 120, points: 14 },
  6: { minutes: 180, points: 28 },
};

/** La Compréhension d'un jeu correct à l'arrivée dans le lit : de 55 à 65 (fiche du lit, § 7). */
export const KAPPA_JEU_CORRECT = 60;

const STRATES_AVANT = [1, 2, 3, 4, 5, 6] as const;

/**
 * Une partie neuve à l'arrivée dans le lit. Les six strates d'avant sont au journal, chacune à son
 * rythme, la dernière finie à `maintenant` : la partie n'a pas d'absence à rattraper. Chacune a la
 * fouille d'un jeu correct, sa présélection, et nomme les objets de la strate d'au-dessus, comme le
 * font les strates. La dette finit soldée ou en défaut. Le lit se crée au démarrage du noyau.
 */
export function creerDepart(depart: Depart, graine: number, maintenant: number): EtatNoyau {
  const total = STRATES_AVANT.reduce((s, n) => s + RYTHME_JEU_CORRECT[n].minutes, 0) * 60_000;
  const etat = creerEtatNoyau(graine, maintenant);
  etat.partieCreeeLe = maintenant - total;
  let arrivee = etat.partieCreeeLe;
  let emportesAuDessus: string[] = [];
  for (const n of STRATES_AVANT) {
    const { minutes, points } = RYTHME_JEU_CORRECT[n];
    const emportes = preselection(points, n);
    const nommes = catalogueDe(n - 1)
      .map((a) => a.id)
      .filter((id) => emportesAuDessus.includes(id));
    const fin = arrivee + minutes * 60_000;
    const entree: EntreeJournal = {
      strate: n,
      arrivee,
      tempsDeJeu: minutes * 60,
      tempsHorsLigne: 0,
      aideConsultee: false,
      actes: [],
      leves: [],
      nommes,
      seuil: n === 6 ? { le: fin, issue: DEPARTS[depart] } : { le: fin },
      fouille: { points, emportes, abandonnes: [] },
      perturbations: [],
    };
    etat.meta.journal.strates.push(entree);
    etat.artefacts.push(...emportes);
    emportesAuDessus = emportes;
    arrivee = fin;
  }
  etat.profondeur = 7;
  etat.kappa = KAPPA_JEU_CORRECT;
  return etat;
}

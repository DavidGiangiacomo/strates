// Les départs de recette (#113, #120 ; docs/strates/strate-6-recette.md et strate-7-recette.md) : une
// partie neuve qui commence à l'arrivée dans une strate profonde, pour recetter une strate sans jouer
// les heures d'avant. L'adresse du jeu suivie de « ?depart=dette » commence à l'arrivée dans la dette ;
// suivie de « ?depart=lit-soldee » ou de « ?depart=lit-defaut », à l'arrivée dans le lit, après une
// dette soldée ou en défaut. Toutes ont les objets et la Compréhension d'un jeu correct. Elles se
// combinent avec le journal : « ?depart=dette&journal=D1 ».
// Le lien ne sert que sur un navigateur sans partie : il ne remplace jamais une partie en cours.
import { catalogueDe, preselection } from "../noyau/logique/artefacts";
import { creerEtatNoyau, type EtatNoyau } from "../noyau/logique/etat";
import type { EntreeJournal } from "../noyau/logique/types";

/** Un départ : la strate où il arrive, et, pour le lit, l'issue de la dette, dont il montre les fosses. */
interface DefinitionDepart {
  profondeur: 6 | 7;
  issue?: "soldee" | "defaut";
}

/** Les départs connus. */
export const DEPARTS = {
  dette: { profondeur: 6 },
  "lit-soldee": { profondeur: 7, issue: "soldee" },
  "lit-defaut": { profondeur: 7, issue: "defaut" },
} as const satisfies Readonly<Record<string, DefinitionDepart>>;
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

/**
 * La Compréhension d'un jeu correct à l'arrivée dans la dette comme dans le lit : de 55 à 65 (leurs
 * fiches, § 7).
 */
export const KAPPA_JEU_CORRECT = 60;

const STRATES_AVANT = [1, 2, 3, 4, 5, 6] as const;

/**
 * Une partie neuve à l'arrivée dans la strate du départ. Les strates d'avant sont au journal, chacune
 * à son rythme, la dernière finie à `maintenant` : la partie n'a pas d'absence à rattraper. Chacune a
 * la fouille d'un jeu correct, sa présélection, et nomme les objets de la strate d'au-dessus, comme le
 * font les strates. Avant le lit, la dette finit soldée ou en défaut. La strate d'arrivée se crée au
 * démarrage du noyau.
 */
export function creerDepart(depart: Depart, graine: number, maintenant: number): EtatNoyau {
  const definition: DefinitionDepart = DEPARTS[depart];
  const avant = STRATES_AVANT.filter((n) => n < definition.profondeur);
  const total = avant.reduce((s, n) => s + RYTHME_JEU_CORRECT[n].minutes, 0) * 60_000;
  const etat = creerEtatNoyau(graine, maintenant);
  etat.partieCreeeLe = maintenant - total;
  let arrivee = etat.partieCreeeLe;
  let emportesAuDessus: string[] = [];
  for (const n of avant) {
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
      seuil:
        n === 6 && definition.issue !== undefined
          ? { le: fin, issue: definition.issue }
          : { le: fin },
      fouille: { points, emportes, abandonnes: [] },
      perturbations: [],
    };
    etat.meta.journal.strates.push(entree);
    etat.artefacts.push(...emportes);
    emportesAuDessus = emportes;
    arrivee = fin;
  }
  etat.profondeur = definition.profondeur;
  etat.kappa = KAPPA_JEU_CORRECT;
  return etat;
}

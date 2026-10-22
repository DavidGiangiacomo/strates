// La coupe (#47 ; design doc, § 11 ; bible, § 10) : une vue verticale des huit couches, tirée du
// journal de partie. Une couche atteinte donne le temps de jeu qu'on y a passé ; une couche quittée,
// en plus, les objets abandonnés à sa fouille et l'issue de son seuil quand il en a une. L'horloge
// qui y a reculé la marque « stratigraphie perturbée » (D-005). Les couches pas encore atteintes
// restent inconnues. L'épilogue (#131) en reprendra le modèle.
import type { Journal, NumeroStrate } from "./types";

/** Les huit couches du jeu, de la surface au fond : la coupe les montre toutes. */
export const COUCHES: readonly NumeroStrate[] = [1, 2, 3, 4, 5, 6, 7, 8];

/** Une couche de la coupe. */
export type CoucheCoupe =
  | { strate: NumeroStrate; atteinte: false }
  | {
      strate: NumeroStrate;
      atteinte: true;
      /** La couche en cours : elle ne dit rien de son seuil, pour ne pas l'annoncer. */
      courante: boolean;
      /** Le temps de jeu, en secondes : la présence seule. null si le journal ne l'a pas. */
      tempsDeJeu: number | null;
      /** L'issue de son seuil, quand il en a plusieurs : « soldee » ou « defaut », pour la dette. */
      issue: string | null;
      /** Les objets laissés à sa fouille, par leur identifiant. */
      abandonnes: readonly string[];
      /** L'horloge y a reculé au-delà du seuil de D-005. */
      perturbee: boolean;
    };

/** La coupe, à la profondeur `profondeur` : les huit couches, de la surface au fond. */
export function coupe(journal: Readonly<Journal>, profondeur: NumeroStrate): CoucheCoupe[] {
  // Une entrée par strate ; s'il y en avait deux, la dernière l'emporte.
  const entrees = new Map(journal.strates.map((e) => [e.strate, e]));
  return COUCHES.map((strate) => {
    if (strate > profondeur) return { strate, atteinte: false };
    const entree = entrees.get(strate);
    const courante = strate === profondeur;
    return {
      strate,
      atteinte: true,
      courante,
      tempsDeJeu: entree?.tempsDeJeu ?? null,
      issue: (!courante && entree?.seuil?.issue) || null,
      abandonnes: entree?.fouille?.abandonnes ?? [],
      perturbee: (entree?.perturbations.length ?? 0) > 0,
    };
  });
}

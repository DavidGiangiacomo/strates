// Outils de développement (#28) : de quoi atteindre n'importe quel point du jeu en moins d'une minute.
// Absents du build de production : seul App.svelte les charge, et seulement si import.meta.env.DEV.
import type { EtatNoyau } from "../noyau/logique/etat";
import { ecrireSauvegarde, lireSauvegarde } from "../noyau/logique/sauvegarde";
import type { EntreeJournal, NumeroStrate } from "../noyau/logique/types";

/** Une copie indépendante de l'état, passée par le format de sauvegarde : exactement ce qui s'écrirait. */
export function copierEtat(etat: EtatNoyau, versionJeu: string): EtatNoyau {
  const lecture = lireSauvegarde(ecrireSauvegarde(etat, versionJeu), versionJeu);
  if (lecture.type !== "ok") {
    throw new Error(
      lecture.type === "illisible" ? `État invalide : ${lecture.raison}.` : "État trop récent.",
    );
  }
  return lecture.etat;
}

/**
 * Saute à la strate `n` (modifie `etat`) : elle repart d'un état neuf, et les strates plus profondes
 * sont oubliées, avec leurs entrées de journal. Sauter à la strate courante la recommence.
 */
export function sauterA(etat: EtatNoyau, n: NumeroStrate): EtatNoyau {
  etat.profondeur = n;
  for (const cle of Object.keys(etat.strates)) {
    if (Number(cle) >= n) delete etat.strates[Number(cle) as NumeroStrate];
  }
  etat.meta.journal.strates = etat.meta.journal.strates.filter((e) => e.strate < n);
  return etat;
}

/**
 * Recale une sauvegarde sur `maintenant` (modifie `etat`) : tous les horodatages sont décalés comme si
 * elle venait d'être écrite. Sans cela, une sauvegarde nommée chargée des semaines après sa création
 * subirait aussitôt 12 h d'absence.
 */
export function recaler(etat: EtatNoyau, maintenant: number): EtatNoyau {
  const decalage = maintenant - etat.reference;
  etat.partieCreeeLe += decalage;
  etat.reference = maintenant;
  for (const entree of etat.meta.journal.strates) {
    entree.arrivee += decalage;
    if (entree.seuil) entree.seuil.le += decalage;
    for (const p of entree.perturbations) p.le += decalage;
  }
  return etat;
}

export interface Modifications {
  /** Le nouvel état de la strate courante. */
  strate?: unknown;
  artefacts?: string[];
  kappa?: number;
}

/** Applique des modifications à la main (modifie `etat`). κ est ramené entre 0 et 100. */
export function modifierEtat(etat: EtatNoyau, modifs: Modifications): EtatNoyau {
  if (modifs.strate !== undefined) {
    const range = etat.strates[etat.profondeur];
    if (!range) throw new Error("La strate courante n'a pas d'état.");
    range.etat = modifs.strate;
  }
  if (modifs.artefacts) etat.artefacts = modifs.artefacts;
  if (modifs.kappa !== undefined) {
    if (!Number.isFinite(modifs.kappa)) throw new Error("κ doit être un nombre.");
    etat.kappa = Math.min(100, Math.max(0, modifs.kappa));
  }
  return etat;
}

/** Les identifiants d'artefacts d'une saisie libre : séparés par des virgules ou des espaces. */
export function lireArtefacts(texte: string): string[] {
  return [...new Set(texte.split(/[\s,;]+/).filter(Boolean))];
}

/**
 * Simule une absence de `secondes` (modifie `etat`) : la référence recule, et la boucle constate
 * l'écart à l'image suivante, comme au retour d'un onglet caché.
 */
export function simulerAbsence(etat: EtatNoyau, secondes: number): void {
  etat.reference -= secondes * 1000;
}

/**
 * Simule un recul de l'horloge de `secondes` (modifie `etat`) : la référence passe devant l'horloge.
 * Au-delà de 5 minutes, le noyau note une perturbation (D-005).
 */
export function simulerRecul(etat: EtatNoyau, secondes: number): void {
  etat.reference += secondes * 1000;
}

/** L'entrée du journal de la strate courante, pour l'affichage. */
export function entreeCourante(etat: EtatNoyau): EntreeJournal | undefined {
  return etat.meta.journal.strates.filter((e) => e.strate === etat.profondeur).at(-1);
}

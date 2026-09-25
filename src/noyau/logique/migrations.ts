import type { EtatStrateRange } from "./etat";
import type { LogiqueStrate } from "./types";

/** Une suite de migrations : `migrations[v]` transforme une valeur de version v en version v + 1. */
export type Migrations = Record<number, (valeur: unknown) => unknown>;

/** Levée quand une donnée vient d'une version plus récente que celle que le jeu connaît. */
export class ErreurVersionPlusRecente extends Error {
  override name = "ErreurVersionPlusRecente";
}

/**
 * Fait passer une valeur de la version `depuis` à la version `jusqua`, migration par migration.
 * `quoi` nomme la donnée dans les messages d'erreur.
 */
export function appliquerMigrations(
  valeur: unknown,
  depuis: number,
  jusqua: number,
  migrations: Migrations,
  quoi: string,
): unknown {
  if (depuis > jusqua) {
    throw new ErreurVersionPlusRecente(
      `${quoi} est en version ${depuis}, plus récente que la version ${jusqua} connue du jeu.`,
    );
  }
  let resultat = valeur;
  for (let version = depuis; version < jusqua; version++) {
    const migration = migrations[version];
    if (!migration) {
      throw new Error(`${quoi} : migration manquante de la version ${version} à ${version + 1}.`);
    }
    resultat = migration(resultat);
  }
  return resultat;
}

/** Met l'état rangé d'une strate à la version qu'attend sa logique (D-005). */
export function migrerEtatStrate(
  range: EtatStrateRange,
  logique: Pick<LogiqueStrate<unknown, never>, "numero" | "versionEtat" | "migrations">,
): EtatStrateRange {
  return {
    version: logique.versionEtat,
    etat: appliquerMigrations(
      range.etat,
      range.version,
      logique.versionEtat,
      logique.migrations,
      `L'état de la strate ${logique.numero}`,
    ),
  };
}

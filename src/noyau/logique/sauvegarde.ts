// Format de la sauvegarde : un document JSON unique et versionné (D-005).
import { estNumeroStrate, type EtatNoyau, type EtatStrateRange } from "./etat";
import { appliquerMigrations, ErreurVersionPlusRecente, type Migrations } from "./migrations";
import type { Meta, NumeroStrate } from "./types";

/** Version du format global ; elle augmente à chaque changement incompatible. */
export const FORMAT_SAUVEGARDE = 1;

/** Migrations du format global : `MIGRATIONS_FORMAT[v]` fait passer du format v au format v + 1. */
export const MIGRATIONS_FORMAT: Migrations = {};

export interface Sauvegarde {
  format: number;
  versionJeu: string;
  partieCreeeLe: number;
  reference: number;
  noyau: {
    profondeur: NumeroStrate;
    artefacts: string[];
    kappa: number;
    meta: Meta;
    graine: number;
  };
  /** Un objet par strate visitée, gardé après la descente, avec la version propre à chaque module. */
  strates: Record<string, EtatStrateRange>;
}

export type LectureSauvegarde =
  | { type: "ok"; etat: EtatNoyau; versionJeu: string }
  | { type: "plus-recente"; versionJeu: string }
  | { type: "illisible"; raison: string };

/** Sérialise l'état du noyau. L'état des strates peut être une enveloppe réactive : le JSON la traverse. */
export function ecrireSauvegarde(etat: EtatNoyau, versionJeu: string): string {
  const sauvegarde: Sauvegarde = {
    format: FORMAT_SAUVEGARDE,
    versionJeu,
    partieCreeeLe: etat.partieCreeeLe,
    reference: etat.reference,
    noyau: {
      profondeur: etat.profondeur,
      artefacts: etat.artefacts,
      kappa: etat.kappa,
      meta: etat.meta,
      graine: etat.graine,
    },
    strates: etat.strates,
  };
  return JSON.stringify(sauvegarde);
}

/**
 * Relit une sauvegarde : vérifie qu'elle n'est pas plus récente que le jeu, applique les migrations
 * du format global, puis contrôle sa forme. Les migrations des strates se font au démarrage de chacune.
 */
export function lireSauvegarde(
  texte: string,
  versionJeu: string,
  migrations: Migrations = MIGRATIONS_FORMAT,
  formatCourant: number = FORMAT_SAUVEGARDE,
): LectureSauvegarde {
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    return { type: "illisible", raison: "le texte n'est pas du JSON valide" };
  }
  if (!estObjet(brut) || !Number.isInteger(brut.format) || (brut.format as number) < 1) {
    return { type: "illisible", raison: "le format de la sauvegarde est absent ou invalide" };
  }

  const versionEcrite = typeof brut.versionJeu === "string" ? brut.versionJeu : "?";
  if (
    (brut.format as number) > formatCourant ||
    (versionEcrite !== "?" && comparerVersions(versionEcrite, versionJeu) > 0)
  ) {
    return { type: "plus-recente", versionJeu: versionEcrite };
  }

  let migre: unknown;
  try {
    migre = appliquerMigrations(
      brut,
      brut.format as number,
      formatCourant,
      migrations,
      "Le format",
    );
  } catch (erreur) {
    if (erreur instanceof ErreurVersionPlusRecente) {
      return { type: "plus-recente", versionJeu: versionEcrite };
    }
    return { type: "illisible", raison: `la migration a échoué : ${String(erreur)}` };
  }

  const probleme = problemeDeForme(migre);
  if (probleme) return { type: "illisible", raison: probleme };

  const sauvegarde = migre as Sauvegarde;
  return { type: "ok", etat: versEtatNoyau(sauvegarde), versionJeu: sauvegarde.versionJeu };
}

/** Compare deux versions « x.y.z » : négatif si a < b, 0 si égales, positif si a > b. */
export function comparerVersions(a: string, b: string): number {
  const nombres = (v: string) => v.split(/[.+-]/, 3).map((n) => Number.parseInt(n, 10) || 0);
  const [na, nb] = [nombres(a), nombres(b)];
  for (let i = 0; i < 3; i++) {
    const ecart = (na[i] ?? 0) - (nb[i] ?? 0);
    if (ecart !== 0) return ecart;
  }
  return 0;
}

function versEtatNoyau(s: Sauvegarde): EtatNoyau {
  const strates: EtatNoyau["strates"] = {};
  for (const [cle, range] of Object.entries(s.strates)) {
    strates[Number(cle) as NumeroStrate] = range;
  }
  return {
    profondeur: s.noyau.profondeur,
    artefacts: s.noyau.artefacts,
    kappa: s.noyau.kappa,
    meta: s.noyau.meta,
    graine: s.noyau.graine,
    partieCreeeLe: s.partieCreeeLe,
    reference: s.reference,
    strates,
  };
}

// ——— Contrôle de forme : renvoie la description du premier problème, ou null.

function estObjet(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

const estNombre = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);

function problemeDeForme(x: unknown): string | null {
  if (!estObjet(x)) return "la sauvegarde n'est pas un objet";
  if (typeof x.versionJeu !== "string") return "versionJeu manquante";
  if (!estNombre(x.partieCreeeLe)) return "partieCreeeLe invalide";
  if (!estNombre(x.reference)) return "reference invalide";

  const n = x.noyau;
  if (!estObjet(n)) return "noyau manquant";
  if (!estNumeroStrate(n.profondeur)) return "profondeur invalide";
  if (!Array.isArray(n.artefacts) || !n.artefacts.every((a) => typeof a === "string")) {
    return "artefacts invalides";
  }
  if (!estNombre(n.kappa)) return "kappa invalide";
  if (
    !Number.isInteger(n.graine) ||
    (n.graine as number) < 0 ||
    (n.graine as number) > 0xffffffff
  ) {
    return "graine invalide";
  }
  const probleme = problemeDeMeta(n.meta);
  if (probleme) return probleme;

  if (!estObjet(x.strates)) return "strates manquantes";
  for (const [cle, range] of Object.entries(x.strates)) {
    if (!estNumeroStrate(Number(cle)) || String(Number(cle)) !== cle) {
      return `strate inconnue : ${cle}`;
    }
    if (!estObjet(range) || !Number.isInteger(range.version) || !("etat" in range)) {
      return `état de la strate ${cle} invalide`;
    }
  }
  return null;
}

function problemeDeMeta(meta: unknown): string | null {
  if (!estObjet(meta) || !estObjet(meta.journal) || !Array.isArray(meta.journal.strates)) {
    return "journal de partie invalide";
  }
  for (const entree of meta.journal.strates) {
    if (
      !estObjet(entree) ||
      !estNumeroStrate(entree.strate) ||
      !estNombre(entree.arrivee) ||
      !estNombre(entree.tempsDeJeu) ||
      !estNombre(entree.tempsHorsLigne) ||
      typeof entree.aideConsultee !== "boolean" ||
      !Array.isArray(entree.perturbations)
    ) {
      return "entrée du journal de partie invalide";
    }
  }
  return null;
}

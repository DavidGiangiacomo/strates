// Le journal de session dans le navigateur (#26) : l'activer par l'adresse, le garder d'un
// rechargement à l'autre, l'exporter. Il n'est actif que si l'observateur l'a demandé : l'adresse
// du jeu suivie de « ?journal=T3 » ouvre le journal du testeur T3 ; « ?journal=non » l'arrête.
import { JournalSession, FORMAT_JOURNAL, type MetaJournal } from "./journal";

/** Le code du journal actif, gardé d'un rechargement à l'autre. */
const CLE_ACTIF = "strates.journal.actif";
/** Le journal d'un testeur. Chaque code a le sien : un nouveau testeur n'efface pas le précédent. */
const cleJournal = (code: string) => `strates.journal.${code}`;
/** Un code de testeur : quelques lettres et chiffres (« T3 »), rien qui puisse identifier quelqu'un. */
const CODE = /^[A-Za-z0-9-]{1,12}$/;

/** Ce que l'adresse demande : un code de testeur, l'arrêt du journal, ou rien. */
export function demandeJournal(url: URL): { code: string } | "arret" | null {
  const valeur = url.searchParams.get("journal");
  if (valeur === null) return null;
  if (valeur === "non") return "arret";
  return CODE.test(valeur) ? { code: valeur } : null;
}

export interface ContexteJournal {
  url: URL;
  zone: Storage;
  /** L'horloge système (ms). */
  horloge: () => number;
  /** Ce que la page sait d'elle-même, pour les métadonnées d'un nouveau journal. */
  meta: () => Omit<MetaJournal, "format" | "testeur" | "debut">;
}

/**
 * Le journal à tenir pendant cette séance, ou null. Un code dans l'adresse ouvre le journal de ce
 * testeur, ou le reprend s'il existe déjà ; sans code, le dernier journal actif reprend.
 */
export function ouvrirJournal({
  url,
  zone,
  horloge,
  meta,
}: ContexteJournal): JournalSession | null {
  const demande = demandeJournal(url);
  if (demande === "arret") {
    zone.removeItem(CLE_ACTIF);
    return null;
  }
  const code = demande?.code ?? zone.getItem(CLE_ACTIF);
  if (!code || !CODE.test(code)) return null;

  const existant = zone.getItem(cleJournal(code));
  const journal =
    (existant ? JournalSession.relire(existant, horloge) : null) ??
    new JournalSession(
      { format: FORMAT_JOURNAL, testeur: code, debut: horloge(), ...meta() },
      horloge,
    );
  zone.setItem(CLE_ACTIF, code);
  return journal;
}

/** Écrit le journal dans le stockage du navigateur. Un stockage plein ne perd que la copie locale. */
export function garderJournal(journal: JournalSession, zone: Storage): boolean {
  try {
    zone.setItem(cleJournal(journal.meta.testeur), journal.serialiser());
    return true;
  } catch {
    return false;
  }
}

/** Arrête le journal : il garde ce qu'il a, reste exportable, et n'écrit plus rien. */
export function arreterJournal(journal: JournalSession, zone: Storage): void {
  journal.actif = false;
  garderJournal(journal, zone);
  zone.removeItem(CLE_ACTIF);
}

/**
 * Garde le journal toutes les 10 s, quand la page passe en arrière-plan ou se ferme, et une dernière
 * fois quand on arrête de le garder (un changement de partie par les outils de développement).
 */
export function demarrerGardeJournal(journal: JournalSession, zone: Storage): () => void {
  const garder = () => void garderJournal(journal, zone);
  const surVisibilite = () => {
    if (document.visibilityState === "hidden") garder();
  };
  const minuteur = setInterval(garder, 10_000);
  document.addEventListener("visibilitychange", surVisibilite);
  window.addEventListener("pagehide", garder);
  return () => {
    garder();
    clearInterval(minuteur);
    document.removeEventListener("visibilitychange", surVisibilite);
    window.removeEventListener("pagehide", garder);
  };
}

/** Le nom du fichier exporté : « strates-journal-T3-2026-09-29.json ». */
export function nomExport(journal: JournalSession): string {
  const date = new Date(journal.meta.debut).toISOString().slice(0, 10);
  return `strates-journal-${journal.meta.testeur}-${date}.json`;
}

/** Propose à l'observateur d'enregistrer le journal dans un fichier. */
export function telechargerJournal(journal: JournalSession): void {
  const url = URL.createObjectURL(new Blob([journal.serialiser()], { type: "application/json" }));
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = nomExport(journal);
  lien.click();
  // Révoquer trop tôt peut annuler le téléchargement (Firefox) : on laisse passer le clic.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Les métadonnées que la page peut donner : le navigateur, la fenêtre, le réglage des animations. */
export function metaNavigateur(version: string, build: string) {
  return {
    version,
    build,
    navigateur: navigator.userAgent,
    fenetre: { largeur: window.innerWidth, hauteur: window.innerHeight },
    mouvementReduit:
      typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches,
  };
}

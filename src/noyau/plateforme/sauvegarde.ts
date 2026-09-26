import { noterInstant, type EtatNoyau } from "../logique/etat";
import { ecrireSauvegarde, lireSauvegarde, type LectureSauvegarde } from "../logique/sauvegarde";
import { demanderPersistance, type Stockage } from "./stockage";

export const CLES = {
  courante: "strates.sauvegarde.courante",
  precedente: "strates.sauvegarde.precedente",
  /** Préfixe des sauvegardes illisibles, mises de côté au lieu d'être écrasées. */
  illisible: "strates.sauvegarde.illisible.",
} as const;

export type ResultatChargement =
  | { type: "aucune" }
  | { type: "ok"; etat: EtatNoyau; depuis: "courante" | "precedente"; misesDeCote: string[] }
  | { type: "plus-recente"; versionJeu: string }
  | { type: "illisible"; misesDeCote: string[] };

export type ResultatImport = LectureSauvegarde | { type: "lecture-seule" };

/**
 * Deux emplacements, la sauvegarde courante et la précédente, qui tournent à chaque écriture.
 * Une sauvegarde illisible est mise de côté, jamais écrasée. Une sauvegarde écrite par une version
 * plus récente du jeu fait passer le gestionnaire en lecture seule : il n'écrit plus rien (D-005).
 */
export class GestionnaireSauvegarde {
  #stockage: Stockage;
  #versionJeu: string;
  #maintenant: () => number;
  #lectureSeule = false;
  /** Les textes illisibles déjà mis de côté pendant cette session : pas de doublon. */
  #misDeCote = new Set<string>();

  constructor(stockage: Stockage, versionJeu: string, maintenant: () => number) {
    this.#stockage = stockage;
    this.#versionJeu = versionJeu;
    this.#maintenant = maintenant;
  }

  get lectureSeule(): boolean {
    return this.#lectureSeule;
  }

  /** La courante, sinon la précédente ; les illisibles rencontrées sont mises de côté. */
  async charger(): Promise<ResultatChargement> {
    const misesDeCote: string[] = [];
    for (const emplacement of ["courante", "precedente"] as const) {
      const texte = await this.#stockage.lire(CLES[emplacement]);
      if (texte === null) continue;

      const lecture = lireSauvegarde(texte, this.#versionJeu);
      if (lecture.type === "ok") {
        return { type: "ok", etat: lecture.etat, depuis: emplacement, misesDeCote };
      }
      if (lecture.type === "plus-recente") {
        this.#lectureSeule = true;
        return { type: "plus-recente", versionJeu: lecture.versionJeu };
      }
      misesDeCote.push(await this.#mettreDeCote(texte, emplacement));
    }
    return misesDeCote.length > 0 ? { type: "illisible", misesDeCote } : { type: "aucune" };
  }

  /** Écrit l'état. Renvoie false si rien n'a été écrit (lecture seule, ou stockage en échec). */
  async ecrire(etat: EtatNoyau): Promise<boolean> {
    if (this.#lectureSeule) return false;
    return this.#remplacerCourante(ecrireSauvegarde(etat, this.#versionJeu));
  }

  /** Le texte à exporter, en fichier ou à copier. */
  exporter(etat: EtatNoyau): string {
    return ecrireSauvegarde(etat, this.#versionJeu);
  }

  /** Importe une sauvegarde ; la sauvegarde remplacée reste disponible comme « précédente ». */
  async importer(texte: string): Promise<ResultatImport> {
    if (this.#lectureSeule) return { type: "lecture-seule" };
    const lecture = lireSauvegarde(texte, this.#versionJeu);
    if (lecture.type !== "ok") return lecture;
    const ecrit = await this.#remplacerCourante(ecrireSauvegarde(lecture.etat, this.#versionJeu));
    return ecrit ? lecture : { type: "illisible", raison: "le stockage a refusé l'écriture" };
  }

  async #remplacerCourante(texte: string): Promise<boolean> {
    try {
      const actuelle = await this.#stockage.lire(CLES.courante);
      if (actuelle !== null) {
        const lecture = lireSauvegarde(actuelle, this.#versionJeu);
        if (lecture.type === "plus-recente") {
          // Un autre onglet, d'une version plus récente, vient d'écrire : on ne l'écrase pas.
          this.#lectureSeule = true;
          return false;
        }
        // Une sauvegarde lisible devient la précédente ; une illisible est mise de côté, jamais écrasée.
        if (lecture.type === "ok") await this.#stockage.ecrire(CLES.precedente, actuelle);
        else if (!this.#misDeCote.has(actuelle)) await this.#mettreDeCote(actuelle, "courante");
      }
      await this.#stockage.ecrire(CLES.courante, texte);
      return true;
    } catch (erreur) {
      console.warn("La sauvegarde a échoué :", erreur);
      return false;
    }
  }

  async #mettreDeCote(texte: string, emplacement: "courante" | "precedente"): Promise<string> {
    const cle = `${CLES.illisible}${this.#maintenant()}.${emplacement}`;
    await this.#stockage.ecrire(cle, texte);
    this.#misDeCote.add(texte);
    return cle;
  }
}

/** Sauvegarde la partie : note l'instant, et demande un stockage persistant après la première descente. */
export function sauvegarderPartie(
  etat: EtatNoyau,
  gestionnaire: GestionnaireSauvegarde,
  maintenant: number,
): Promise<boolean> {
  noterInstant(etat, maintenant);
  if (etat.profondeur >= 2) demanderPersistance();
  return gestionnaire.ecrire(etat);
}

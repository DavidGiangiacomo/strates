// Le passage d'une strate à la suivante, du côté de l'interface (docs/strates/descente-1-2.md, P2 à
// P6) : le coup de pioche, l'écran de fouille, « reboucher » ou « descendre », la transition,
// l'arrivée. Le noyau engage la descente ; le passage en règle le spectacle et le moment où le temps
// de la nouvelle strate commence.
import { artefact, type FouilleOuverte } from "../logique/artefacts";
import type { Noyau } from "../logique/noyau";
import type { ApparenceValeur, NumeroStrate } from "../logique/types";
import { formaterBrut, NOMS_STRATES, TEXTES_FOUILLE } from "./fouille";

/**
 * - jeu : la strate se joue ;
 * - pioche : le coup de pioche, la strate se fend (P2) ;
 * - fouille : l'écran de fouille, conversion et choix (P3, P4) ;
 * - rebouchage : la fouille se referme sur la strate ;
 * - descente : le travelling vers le bas (P5) ;
 * - arrivee : les objets rejoignent le bandeau, puis le temps de la nouvelle strate part (P6).
 */
export type Phase = "jeu" | "pioche" | "fouille" | "rebouchage" | "descente" | "arrivee";

/** Les durées de la séquence, en millisecondes. Elles doivent suivre les animations de l'interface. */
export interface Durees {
  pioche: number;
  reboucher: number;
  /** Le travelling, jusqu'à ce que la nouvelle strate soit en place. */
  descente: number;
  /** Le moment du travelling où la Profondeur change. */
  miCourse: number;
  /** L'arrivée : les objets rejoignent le bandeau, puis le temps part. */
  arrivee: number;
  /** L'écart entre deux objets qui rejoignent le compteur du bandeau. */
  parObjet: number;
}

/** Les cibles du storyboard (§ 8) : 8 secondes imposées en tout. */
export const DUREES: Durees = {
  pioche: 1000,
  reboucher: 500,
  descente: 4000,
  miCourse: 1800,
  arrivee: 1000,
  parObjet: 100,
};

/** Sans mouvement : des fondus, 2 secondes environ en tout. */
export const DUREES_REDUITES: Durees = {
  pioche: 300,
  reboucher: 300,
  descente: 500,
  miCourse: 250,
  arrivee: 500,
  parObjet: 0,
};

/** Quand la strate courante n'a pas encore de suite dans cette version du jeu. */
export const PAS_DE_SUITE =
  "La descente n'existe pas encore dans cette version : la suite arrive bientôt.";

/** Ce que montre l'écran de fouille : la fouille, et de quoi écrire la valeur de la strate quittée. */
export interface EcranFouille {
  fouille: FouilleOuverte;
  /** Le nom de la strate quittée. */
  nom: string;
  /** Le nom de sa valeur convertible (« Crédits gagnés »). */
  libelle: string;
  /** Sa notation (I1). */
  formater: (valeur: number) => string;
  /** Sa police et ses couleurs, pour la valeur : le dernier fragment de la strate quittée. */
  apparence?: ApparenceValeur;
}

/** Ce que le passage signale : au journal de session des playtests (#26), s'il est tenu. */
export type EvenementPassage =
  | { type: "creuser"; reponse: "resiste" | "fouille" | "pas-de-suite" }
  | { type: "fouille"; valeur: number; points: number; preselection: string[] }
  | { type: "reboucher" }
  | { type: "descendre"; emportes: string[]; abandonnes: string[] }
  | { type: "phase"; phase: Phase };

export interface DependancesPassage {
  noyau: Noyau;
  /** L'horloge système (ms), pour l'arrivée notée au journal. */
  maintenant: () => number;
  /** Attend `ms` millisecondes. */
  attendre: (ms: number) => Promise<void>;
  /** Sauvegarde la partie : juste après la descente (D-005). */
  sauvegarder: () => Promise<unknown>;
  /** La strate courante a changé : l'interface monte sa vue. */
  changerStrate: () => void;
  /** Le sol résiste : le bandeau tressaille. */
  resister: () => void;
  /** Un message au joueur. */
  signaler: (message: string) => void;
  /** Ce qui se passe, pour le journal de session. */
  surEvenement?: (evenement: EvenementPassage) => void;
  durees?: Durees;
}

export class Passage {
  phase: Phase = $state("jeu");
  ecran: EcranFouille | null = $state.raw(null);
  /** Ce que montre le bandeau : il suit le spectacle, pas l'engagement. */
  profondeur: NumeroStrate = $state(1);
  artefacts: string[] = $state.raw([]);
  /** Les noms d'en haut des objets emportés, qui descendent avec le joueur. */
  transportes: string[] = $state.raw([]);
  /** Une descente est en cours d'engagement : les boutons ne répondent plus. */
  occupe = $state(false);
  /** La fouille a été rebouchée dans cette strate : la fissure reste dessinée. */
  cicatrice = $state(false);

  #d: DependancesPassage;
  #durees: Durees;

  constructor(dependances: DependancesPassage) {
    this.#d = dependances;
    this.#durees = dependances.durees ?? DUREES;
    this.profondeur = dependances.noyau.etat.profondeur;
    this.artefacts = [...dependances.noyau.etat.artefacts];
  }

  #signaler(evenement: EvenementPassage): void {
    this.#d.surEvenement?.(evenement);
  }

  #passer(phase: Phase): void {
    this.phase = phase;
    this.#signaler({ type: "phase", phase });
  }

  /**
   * Le bouton « creuser », du bandeau ou d'une strate. Avant le seuil, le sol résiste. Au seuil, la
   * fouille s'ouvre, sans confirmation (P2). Pendant la séquence, le bouton ne répond pas.
   */
  async creuser(): Promise<void> {
    const { noyau } = this.#d;
    if (this.phase !== "jeu") return;
    if (!noyau.demanderFouille()) {
      this.#signaler({ type: "creuser", reponse: "resiste" });
      this.#d.resister();
      return;
    }
    if (noyau.strateSuivante === null) {
      this.#signaler({ type: "creuser", reponse: "pas-de-suite" });
      this.#d.signaler(PAS_DE_SUITE);
      return;
    }
    const fouille = noyau.ouvrirFouille();
    this.#signaler({ type: "creuser", reponse: "fouille" });
    this.#signaler({
      type: "fouille",
      valeur: fouille.valeur,
      points: fouille.points,
      preselection: [...fouille.preselection],
    });
    const strate = noyau.strate;
    this.ecran = {
      fouille,
      nom: NOMS_STRATES[fouille.strate],
      libelle: strate.textes["fouille.valeur"] ?? TEXTES_FOUILLE.valeur,
      formater: strate.formaterValeur ?? formaterBrut,
      apparence: strate.apparenceValeur,
    };
    this.#passer("pioche");
    await this.#d.attendre(this.#durees.pioche);
    this.#passer("fouille");
  }

  /** Referme la fouille : la strate reprend là où elle s'était figée. */
  async reboucher(): Promise<void> {
    if (this.phase !== "fouille" || this.occupe) return;
    this.#signaler({ type: "reboucher" });
    this.#passer("rebouchage");
    await this.#d.attendre(this.#durees.reboucher);
    this.#d.noyau.reboucher();
    this.ecran = null;
    this.cicatrice = true;
    this.#passer("jeu");
  }

  /**
   * Descend avec les objets `emportes` (P5, P6) : le noyau engage tout, la partie est sauvegardée,
   * puis vient le spectacle. Le temps de la nouvelle strate part à la fin de l'arrivée. Sans choix,
   * pendant le jeu, c'est la descente automatique : la présélection, sans écran.
   */
  async descendre(emportes?: readonly string[]): Promise<void> {
    const { noyau } = this.#d;
    const automatique = this.phase === "jeu" && noyau.descenteAutomatique;
    if (this.occupe || (this.phase !== "fouille" && !automatique)) return;
    this.occupe = true;
    try {
      const fouille = await noyau.descendre(this.#d.maintenant(), emportes);
      this.transportes = fouille.emportes.map((id) => artefact(id)?.nomDHaut ?? id);
      this.#signaler({
        type: "descendre",
        emportes: [...fouille.emportes],
        abandonnes: [...fouille.abandonnes],
      });
    } catch (erreur) {
      this.occupe = false;
      this.#d.signaler(erreur instanceof Error ? erreur.message : String(erreur));
      return;
    }
    this.#d.changerStrate();
    this.cicatrice = false;
    // Une sauvegarde ratée n'arrête pas la descente : la sauvegarde automatique réessaiera.
    const sauvegarde = this.#d.sauvegarder().catch(() => false);

    const d = this.#durees;
    this.#passer("descente");
    await this.#d.attendre(d.miCourse);
    this.profondeur = noyau.etat.profondeur;
    await this.#d.attendre(d.descente - d.miCourse);

    this.#passer("arrivee");
    let ecoule = 0;
    for (const id of noyau.etat.artefacts.slice(this.artefacts.length)) {
      this.artefacts = [...this.artefacts, id];
      await this.#d.attendre(d.parObjet);
      ecoule += d.parObjet;
    }
    this.artefacts = [...noyau.etat.artefacts];
    await this.#d.attendre(Math.max(0, d.arrivee - ecoule));
    await sauvegarde;

    noyau.reprendre();
    this.ecran = null;
    this.transportes = [];
    this.#passer("jeu");
    this.occupe = false;
  }
}

// Le passage d'une strate à la suivante, du côté de l'interface (docs/strates/descente-1-2.md, P2 à
// P6) : le coup de pioche, l'écran de fouille, « reboucher » ou « descendre », la transition,
// l'arrivée. Le noyau engage la descente ; le passage en règle le spectacle et le moment où le temps
// de la nouvelle strate commence.
import { inventaire, type FouilleOuverte, type ObjetInventaire } from "../logique/artefacts";
import type { Noyau } from "../logique/noyau";
import type { ApparenceValeur, NumeroStrate } from "../logique/types";
import { formaterBrut, formuleConversion, NOMS_STRATES, TEXTES_FOUILLE } from "./fouille";
import type { SonNoyau } from "./sons";

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
  /** La formule de la conversion, si la Compréhension la montre déjà (κ > 50). */
  formule?: string;
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
  /**
   * Fait entendre le sol (#46) : le coup sourd quand il résiste, le coup de pioche et l'éboulement,
   * le grondement de la descente. `duree` : le son se coupe à la fin de sa phase.
   */
  sonner?: (son: SonNoyau, duree?: number) => void;
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
  /** La Compréhension : elle monte à l'arrivée, après les objets, sans un mot (docs/comprehension.md, § 7). */
  kappa = $state(0);
  /**
   * Les objets qui descendent avec le joueur : tous ceux qui n'étaient pas encore des cailloux, sous
   * les noms qu'il leur connaît. Leur usure suit la Profondeur du bandeau, qui change à mi-course.
   */
  transportes: ObjetInventaire[] = $state.raw([]);
  /** Les objets nommés, que montre l'inventaire : relus pendant le jeu, figés pendant la séquence. */
  nommes: string[] = $state.raw([]);
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
    this.kappa = dependances.noyau.etat.kappa;
    this.nommes = dependances.noyau.nommes;
  }

  /**
   * Relit les objets nommés, à chaque image : une strate nomme ses objets en cours de jeu. Pendant la
   * séquence, le noyau est déjà en bas : l'inventaire attend la fin de l'arrivée.
   */
  actualiser(): void {
    if (this.phase !== "jeu" || this.occupe) return;
    const nommes = this.#d.noyau.nommes;
    if (!memes(nommes, this.nommes)) this.nommes = nommes;
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
      this.#d.sonner?.("resiste");
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
    const libelle = strate.textes["fouille.valeur"] ?? TEXTES_FOUILLE.valeur;
    this.ecran = {
      fouille,
      nom: NOMS_STRATES[fouille.strate],
      libelle,
      formater: strate.formaterValeur ?? formaterBrut,
      apparence: strate.apparenceValeur,
      formule: formuleConversion(this.kappa, libelle) ?? undefined,
    };
    this.#d.sonner?.("pioche");
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
    let descendent: string[];
    try {
      const fouille = await noyau.descendre(this.#d.maintenant(), emportes);
      // Tous les objets descendent, les nouveaux sous leur nom d'en haut ; les cailloux restent.
      descendent = this.#porter()
        .filter((objet) => objet.niveau !== "inerte")
        .map((objet) => objet.id);
      this.transportes = this.#porter(descendent);
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
    // Le grondement dure le travelling : moins long, sans mouvement, il est coupé à sa fin.
    this.#d.sonner?.("descente", d.descente / 1000);
    this.#passer("descente");
    await this.#d.attendre(d.miCourse);
    // À mi-course, les anciens perdent un cran, et les plus vieux deviennent des cailloux.
    this.profondeur = noyau.etat.profondeur;
    this.transportes = this.#porter(descendent);
    await this.#d.attendre(d.descente - d.miCourse);

    this.#passer("arrivee");
    let ecoule = 0;
    for (const id of noyau.etat.artefacts.slice(this.artefacts.length)) {
      this.artefacts = [...this.artefacts, id];
      await this.#d.attendre(d.parObjet);
      ecoule += d.parObjet;
    }
    this.artefacts = [...noyau.etat.artefacts];
    this.nommes = noyau.nommes;
    this.kappa = noyau.etat.kappa;
    await this.#d.attendre(Math.max(0, d.arrivee - ecoule));
    await sauvegarde;

    noyau.reprendre();
    this.ecran = null;
    this.transportes = [];
    this.#passer("jeu");
    this.occupe = false;
  }

  /** Les objets possédés, à la Profondeur du bandeau et sous les noms connus ; ou ceux de `parmi`. */
  #porter(parmi?: readonly string[]): ObjetInventaire[] {
    const objets = inventaire(this.#d.noyau.etat.artefacts, this.profondeur, this.nommes);
    return parmi ? objets.filter((objet) => parmi.includes(objet.id)) : objets;
  }
}

function memes(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

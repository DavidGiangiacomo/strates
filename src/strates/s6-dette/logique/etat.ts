import {
  CAISSE_INITIALE,
  ORGES_INITIALES,
  PROMESSES,
  prixExemplaire,
  type IdPromesse,
} from "./regles";

/** Une ligne de l'échéancier : ce qui reste dû, pour une promesse (§ 3). */
export interface Echeance {
  /** Son numéro d'ordre : la ligne du livre, qu'elle garde quand elle est reportée. */
  numero: number;
  promesse: IdPromesse;
  /** La crue où elle tombe ; null, dans la dernière tablette, tant que la grande crue n'est pas fixée. */
  crue: number | null;
  /** Le montant dû, majorations comprises. */
  du: number;
  /** Le montant à l'échéance, avant tout report : ce qui compte pour la confiance. */
  origine: number;
  /** Le prix de la promesse, sans majoration : ce qui compte pour la valeur convertible. */
  prix: number;
  reports: number;
}

/**
 * Une ligne écrite au livre : sa clé de texte, et les nombres qu'elle cite. La vue les écrit dans la
 * notation de la dette : les montants en sceaux, les crues en chiffres.
 */
export interface LigneLivre {
  cle: string;
  valeurs: Record<string, number>;
  /** L'objet d'en haut qu'elle cite, par son identifiant : la vue l'écrit sous son nom d'en bas. */
  objet?: string;
}

/** Comment la dette s'achève : soldée, ou en défaut (§ 4). */
export type IssueDette = "soldee" | "defaut";

export interface EtatDette {
  /** Secondes depuis l'arrivée, absences comprises. */
  temps: number;
  /** La dernière crue passée : la première tombe à trente secondes. */
  crues: number;
  /** Ce qu'on a, en noir. Elle croît au fil des secondes, du rapport de chaque crue. */
  caisse: number;
  /** Les exemplaires promis de chaque sorte. */
  promises: Record<IdPromesse, number>;
  /** Ce qui reste dû, dans l'ordre du livre. */
  echeances: Echeance[];
  /** La somme des `origine` des échéances honorées en entier : la confiance en dépend. */
  honore: number;
  /** Le prix des promesses entièrement honorées : la valeur convertible (§ 9). */
  valeur: number;
  /** La tablette ouverte, de 1 à 5. */
  tablette: number;
  /** Les tablettes brisées, dans l'ordre. */
  brisees: number;
  /** La crue de la grande crue, une fois fixée par la dernière promesse. */
  grandeCrue: number | null;
  issue: IssueDette | null;
  /** Le moment de l'issue, en secondes depuis l'arrivée. */
  issueA: number | null;
  /** Les reports de toute la strate : le journal les compte, l'acte « sans un report » aussi (#104). */
  reportees: number;
  /** Les dernières lignes du livre. */
  livre: LigneLivre[];
  /** Les lignes écrites depuis l'arrivée : la dernière du livre porte ce numéro. */
  ecrites: number;
  /** Les multiplicateurs des gages, relus à chaque tick, une fois éveillés (§ 8). */
  multiplicateurs: { confiance: number; report: number };
  /**
   * Les objets d'en haut qui agissent ici, puissants ou utiles, relus à chaque tick : l'éveil les
   * écrit au livre, et les affichages s'en servent (§ 8).
   */
  objets: string[];
}

/**
 * Le livre s'ouvre sur la première tablette (§ 3, « L'arrivée »). Deux mesures d'orge y sont déjà
 * promises, dues à la 1ʳᵉ et à la 2ᵉ crue : 12 et 16. La caisse tient 30.
 */
export function etatInitial(): EtatDette {
  const promises = Object.fromEntries(PROMESSES.map((id) => [id, 0])) as Record<IdPromesse, number>;
  promises.orge = ORGES_INITIALES;
  const echeances: Echeance[] = [];
  for (let n = 0; n < ORGES_INITIALES; n++) {
    const prix = prixExemplaire("orge", n);
    echeances.push({
      numero: n + 1,
      promesse: "orge",
      crue: n + 1,
      du: prix,
      origine: prix,
      prix,
      reports: 0,
    });
  }
  return {
    temps: 0,
    crues: 0,
    caisse: CAISSE_INITIALE,
    promises,
    echeances,
    honore: 0,
    valeur: 0,
    tablette: 1,
    brisees: 0,
    grandeCrue: null,
    issue: null,
    issueA: null,
    reportees: 0,
    // Le livre commence vide : son en-tête, toujours lisible, dit la règle de l'absence (§ 10).
    livre: [],
    ecrites: 0,
    multiplicateurs: { confiance: 1, report: 1 },
    objets: [],
  };
}

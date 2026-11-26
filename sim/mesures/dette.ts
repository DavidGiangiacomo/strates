// Mesures d'une partie de la dette jouée par un joueur automatique, pour l'équilibrage (#105). La partie
// se joue à l'horloge, comme dans le jeu : le joueur passe à son rythme, seconde après seconde, ou
// s'absente, et le noyau rattrape alors l'absence d'un coup, par la politique propre de la dette
// (docs/strates/strate-6.md, § 10).
import { pointsDeFouille } from "../../src/noyau/logique/artefacts";
import { BAREME, gainDesActes, SANS_ARTEFACT } from "../../src/noyau/logique/comprehension";
import { creerEtatNoyau } from "../../src/noyau/logique/etat";
import { Noyau } from "../../src/noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../../src/noyau/logique/registre";
import { logique, type EtatDette, type IssueDette } from "../../src/strates/s6-dette/logique";
import { promisesFaites, TABLETTES } from "../../src/strates/s6-dette/logique/regles";
import { creerJoueur, type ProfilDette } from "../joueurs/dette";

/** Une absence : le joueur part `depart` secondes après son arrivée, et revient `duree` secondes plus tard. */
export interface Absence {
  depart: number;
  duree: number;
}

export interface MesuresDette {
  /** Soldée, en défaut, ou rien dans la limite. */
  issue: IssueDette | null;
  /** L'issue, en secondes depuis l'arrivée, absences comprises ; null si elle n'est pas venue. */
  issueA: number | null;
  /** La tablette où la dette s'est arrêtée. */
  tablette: number;
  /** L'ouverture des tablettes 2 à 5, au même compte ; null pour celles qui ne se sont pas ouvertes. */
  ouvertures: (number | null)[];
  /** La dernière promesse, qui fixe la grande crue ; null si elle n'est pas venue. */
  grandeCrueFixee: number | null;
  /** Les promesses faites, et les gestes tentés, refus compris. */
  promesses: number;
  gestes: number;
  /** Les promesses du joueur à 2, 6 et 18 crues, avant la dernière tablette. */
  termes: { 2: number; 6: number; 18: number };
  /** Les reports de toute la strate. */
  reports: number;
  /** La plus grande caisse de la partie : l'ordre de grandeur des montants. */
  caisseMax: number;
  /** Ce qui a été honoré : la valeur convertible, et ses points de fouille. */
  valeur: number;
  points: number;
  /** Les multiplicateurs des gages, sur la confiance et sur le report. */
  multiplicateurs: { confiance: number; report: number };
  /** Le plafond × 4 des artefacts a-t-il agi ? */
  plafonne: boolean;
  /** Le temps où le joueur était là, jusqu'à l'issue (ou la limite), en secondes. */
  presence: number;
  /**
   * Les actes de compréhension accomplis (fiche, § 7), dans l'ordre : ceux que la dette signale,
   * « sans aide » au seuil, et « sans artefact » si aucun objet n'agissait ici, que le noyau constatera
   * à la descente.
   */
  actes: string[];
  /** Le κ que ces actes rapportent, au barème du noyau. */
  kappa: number;
}

/**
 * Joue une partie de la dette, avec les objets `artefacts` emportés d'en haut et les `absences` du
 * joueur, jusqu'à l'issue (au plus `limite` secondes depuis l'arrivée), et la mesure.
 */
export async function mesurerDette(
  profil: ProfilDette,
  {
    limite = 8 * 3600,
    artefacts = [] as readonly string[],
    absences = [] as readonly Absence[],
  } = {},
): Promise<MesuresDette> {
  const registre = new Registre();
  registre.enregistrer(6, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
  const etatNoyau = creerEtatNoyau(1, 0);
  etatNoyau.profondeur = 6;
  etatNoyau.artefacts = [...artefacts];
  const noyau = new Noyau(registre, etatNoyau);
  await noyau.demarrer(0);
  const etat = () => noyau.etatStrate as EtatDette;
  const joueur = creerJoueur(noyau, profil);
  const parties = [...absences].sort((a, b) => a.depart - b.depart);

  const ouvertures: (number | null)[] = Array.from({ length: TABLETTES - 1 }, () => null);
  let grandeCrueFixee: number | null = null;
  let caisseMax = 0;
  let t = 0;
  let presence = 0;
  /** Note ce que la partie a franchi depuis le dernier regard. */
  const regarder = () => {
    const e = etat();
    caisseMax = Math.max(caisseMax, e.caisse);
    for (let k = 2; k <= e.tablette; k++) ouvertures[k - 2] ??= t;
    if (e.grandeCrue !== null) grandeCrueFixee ??= t;
  };
  while (t < limite && !noyau.seuil.atteint) {
    const absence = parties.find((a) => a.depart === t);
    if (absence) {
      // Le noyau rattrape l'absence d'un coup, au retour.
      t += absence.duree;
      noyau.rattraper(t * 1000);
    } else {
      joueur.passer(t);
      regarder();
      t += 1;
      presence += 1;
      noyau.avancerJusqua(t * 1000, 1);
    }
    regarder();
  }

  const e = etat();
  const actes = [...(noyau.etat.meta.journal.strates.find((x) => x.strate === 6)?.actes ?? [])];
  if (!noyau.etat.artefacts.some((id) => noyau.effets.niveau(id) !== null)) {
    actes.push(SANS_ARTEFACT);
  }
  return {
    issue: e.issue,
    issueA: e.issueA,
    tablette: e.tablette,
    ouvertures,
    grandeCrueFixee,
    promesses: promisesFaites(e),
    gestes: joueur.gestes,
    termes: { ...joueur.termes },
    reports: e.reportees,
    caisseMax,
    valeur: e.valeur,
    points: pointsDeFouille(e.valeur),
    multiplicateurs: { ...e.multiplicateurs },
    plafonne: noyau.effets.plafonne,
    presence,
    actes,
    kappa: gainDesActes(BAREME, 6, actes),
  };
}

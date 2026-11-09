// Mesures d'une partie du lit jouée par un joueur automatique, pour l'équilibrage (#116). La partie se
// joue à l'horloge, comme dans le jeu : le joueur est là, seconde après seconde, ou absent, et le noyau
// rattrape alors l'absence d'un coup, par la politique propre du lit (docs/strates/strate-7.md, § 10).
import { pointsDeFouille } from "../../src/noyau/logique/artefacts";
import { creerEtatNoyau } from "../../src/noyau/logique/etat";
import { Noyau } from "../../src/noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../../src/noyau/logique/registre";
import { logique, type EtatLit } from "../../src/strates/s7-lit/logique";
import { creerJoueur, type ProfilLit } from "../joueurs/lit";

/** Une absence : le joueur part `depart` secondes après son arrivée, et revient `duree` secondes plus tard. */
export interface Absence {
  depart: number;
  duree: number;
}

export interface MesuresLit {
  /** Le bassin plein à la rive, en secondes depuis l'arrivée, absences comprises ; null s'il ne l'est pas. */
  plein: number | null;
  /** La descente, au même compte ; null si elle n'est pas venue dans la limite. */
  descente: number | null;
  /** La descente est venue en présence du joueur. */
  enPresence: boolean;
  /** Le dernier retour du joueur avant la descente (ou la limite) ; null s'il ne s'est jamais absenté. */
  retour: number | null;
  /** Le temps où le joueur était là, jusqu'à la descente (ou la limite), en secondes. */
  presence: number;
  /** Les levées bâties. */
  gestes: number;
  /** Les couches d'eau retenue derrière une levée. */
  retenues: number;
  /** Le limon déposé à la descente (ou à la limite) : la valeur convertible. */
  depose: number;
  points: number;
  /** Les multiplicateurs des objets, sur l'eau retenue et sur l'absence. */
  multiplicateurs: { depot: number; patience: number };
  /** Le plafond × 4 des artefacts a-t-il agi ? */
  plafonne: boolean;
}

/**
 * Joue une partie du lit, avec les objets `artefacts` emportés d'en haut et les `absences` du joueur,
 * jusqu'à la descente (au plus `limite` secondes depuis l'arrivée), et la mesure.
 */
export async function mesurerLit(
  profil: ProfilLit,
  {
    limite = 30 * 24 * 3600,
    artefacts = [] as readonly string[],
    absences = [] as readonly Absence[],
  } = {},
): Promise<MesuresLit> {
  const registre = new Registre();
  registre.enregistrer(7, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
  const etatNoyau = creerEtatNoyau(1, 0);
  etatNoyau.profondeur = 7;
  etatNoyau.artefacts = [...artefacts];
  const noyau = new Noyau(registre, etatNoyau);
  await noyau.demarrer(0);
  const etat = () => noyau.etatStrate as EtatLit;
  const joueur = creerJoueur(noyau, profil);
  const parties = [...absences].sort((a, b) => a.depart - b.depart);

  let t = 0;
  let presence = 0;
  let descente: number | null = null;
  let enPresence = false;
  let retour: number | null = null;
  while (t < limite) {
    const absence = parties.find((a) => a.depart === t);
    if (absence) {
      // Le noyau rattrape l'absence d'un coup, au retour.
      t += absence.duree;
      retour = t;
      noyau.rattraper(t * 1000);
    } else {
      joueur.passer(t);
      t += 1;
      presence += 1;
      noyau.avancerJusqua(t * 1000, 1);
    }
    if (noyau.seuil.atteint) {
      descente = t;
      enPresence = !absence;
      break;
    }
  }

  const e = etat();
  return {
    plein: e.pleinA,
    descente,
    enPresence,
    retour,
    presence,
    gestes: joueur.gestes,
    retenues: e.couches.filter((c) => c.retenue).length,
    depose: e.depose,
    points: pointsDeFouille(e.depose),
    multiplicateurs: { ...e.multiplicateurs },
    plafonne: noyau.effets.plafonne,
  };
}

/** Des absences régulières : le joueur passe `present` secondes, puis part `absent` secondes, et ainsi de suite. */
export function sessions(present: number, absent: number, jusqua = 12 * 3600): Absence[] {
  const absences: Absence[] = [];
  for (let depart = present; depart < jusqua; depart += present + absent) {
    absences.push({ depart, duree: absent });
  }
  return absences;
}

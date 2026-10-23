// Mesures d'une partie de l'atelier jouée par un joueur automatique, pour l'équilibrage (#96).
import { pointsDeFouille } from "../../src/noyau/logique/artefacts";
import { BAREME, gainDesActes, SANS_ARTEFACT } from "../../src/noyau/logique/comprehension";
import { creerEtatNoyau } from "../../src/noyau/logique/etat";
import { Noyau } from "../../src/noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../../src/noyau/logique/registre";
import { logique, type EtatAtelier } from "../../src/strates/s3-atelier/logique";
import { analyser, TOUR } from "../../src/strates/s3-atelier/logique/regles";
import { creerJoueur, toutAchete, type ProfilAtelier, type Releve } from "../joueurs/atelier";

export interface MesuresAtelier {
  /** Le seuil, en secondes de jeu, ou null s'il n'est pas atteint dans la limite. */
  seuil: number | null;
  /** Le cumul au seuil (ou à la limite) : la valeur convertible. */
  cumul: number;
  /** Points de fouille au seuil, puis en continuant de jouer les durées demandées (secondes). */
  points: { auSeuil: number; apres: Record<number, number> };
  /** Le moment où le plan prend chacune de ses tailles, en secondes de jeu. */
  agrandissements: Record<number, number>;
  /** Le moment où toute la nomenclature est achetée : son dernier achat. */
  toutAchete: number | null;
  /** Ce que le joueur a fait : ses achats, ses gestes, ceux de la fin, ses coups de lime. */
  releve: Releve;
  /** Les attentes entre deux achats successifs avant le seuil, en secondes. */
  attentes: { debut: number; duree: number }[];
  /** Les achats par tranche de 10 minutes, jusqu'au seuil. */
  achatsParTranche: number[];
  /** La production au seuil (ou à la limite), par seconde. */
  production: number;
  /** Les pièces posées, et celles qui tournent, au seuil (ou à la limite). */
  posees: number;
  tournent: number;
  /** Le plafond × 4 des artefacts a-t-il agi ? */
  plafonne: boolean;
  /**
   * Les actes de compréhension au seuil, tels que le noyau les créditerait à la descente : ceux qu'il a
   * notés, et « sans artefact » si aucun objet n'agissait (docs/comprehension.md, § 2).
   */
  actes: string[];
  /** Le κ que ces actes rapporteraient, sur les 16 points de l'atelier. */
  kappa: number;
}

/** Les achats se comptent par tranches de 10 minutes. */
export const TRANCHE = 600;

/**
 * Joue une partie de l'atelier, avec les objets `artefacts` emportés d'en haut, jusqu'au seuil (au plus
 * `limite` secondes), et la mesure. Continue ensuite `apresSeuil` secondes au plus. `graine` change
 * le hasard du joueur, à la fin.
 */
export async function mesurerAtelier(
  profil: ProfilAtelier,
  { limite = 5 * 3600, apresSeuil = [] as number[], artefacts = [] as string[], graine = 1 } = {},
): Promise<MesuresAtelier> {
  const registre = new Registre();
  registre.enregistrer(3, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
  const etatNoyau = creerEtatNoyau(1, 0);
  etatNoyau.profondeur = 3;
  etatNoyau.artefacts = [...artefacts];
  const noyau = new Noyau(registre, etatNoyau);
  await noyau.demarrer(0);
  const etat = () => noyau.etatStrate as EtatAtelier;
  const joueur = creerJoueur(noyau, profil, graine);

  const arrivee = etat().taille;
  while (!noyau.seuil.atteint && etat().temps < limite) {
    const debut = etat().temps;
    joueur.passage();
    const e = etat();
    const reste = Math.min(debut + profil.attention, limite) - e.temps;
    if (reste > 0 && !noyau.seuil.atteint) noyau.tick(reste);
  }

  const e = etat();
  const seuil = e.seuilAtteintA;
  const analyse = analyser(e);
  const fin = seuil ?? e.temps;
  const achats = joueur.releve.achats.filter((t) => t <= fin);
  const attentes = achats.slice(1).map((t, i) => ({ debut: achats[i]!, duree: t - achats[i]! }));
  const achatsParTranche: number[] = [];
  for (const t of achats) {
    const k = Math.floor(t / TRANCHE);
    while (achatsParTranche.length <= k) achatsParTranche.push(0);
    achatsParTranche[k]! += 1;
  }
  const entree = noyau.etat.meta.journal.strates.at(-1)!;
  const agit = noyau.etat.artefacts.some((id) => noyau.effets.niveau(id) !== null);
  const actes = agit ? [...entree.actes] : [...entree.actes, SANS_ARTEFACT];
  const infos = [...analyse.pieces.values()];
  const cumul = e.cumul;

  const apres: Record<number, number> = {};
  if (seuil !== null) {
    let ecoule = 0;
    for (const s of [...apresSeuil].sort((x, y) => x - y)) {
      noyau.tick(s - ecoule);
      ecoule = s;
      apres[s] = pointsDeFouille(etat().cumul);
    }
  }

  return {
    seuil,
    cumul,
    points: { auSeuil: pointsDeFouille(cumul), apres },
    agrandissements: { [arrivee]: 0, ...joueur.releve.agrandissements },
    toutAchete: toutAchete(e) ? (achats.at(-1) ?? null) : null,
    releve: joueur.releve,
    attentes,
    achatsParTranche,
    production: analyse.production / TOUR,
    posees: infos.length,
    tournent: infos.filter((x) => x.entrainee).length,
    plafonne: noyau.effets.plafonne,
    actes,
    kappa: gainDesActes(BAREME, 3, actes),
  };
}

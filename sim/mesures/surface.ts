// Mesures d'une partie de la surface jouée par un joueur automatique, pour l'équilibrage (#35).
import { creerEtatNoyau } from "../../src/noyau/logique/etat";
import { Noyau } from "../../src/noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../../src/noyau/logique/registre";
import { logique, type EtatSurface } from "../../src/strates/s1-surface/logique";
import {
  GENERATEURS,
  OBJECTIFS,
  production,
  valeurClic,
  type IdGenerateur,
} from "../../src/strates/s1-surface/logique/regles";
import { creerJoueur, type Profil } from "../joueurs/surface";

export interface MesuresSurface {
  /** Le seuil, en secondes de jeu, ou null s'il n'est pas atteint dans la limite. */
  seuil: number | null;
  /** Le cumul au seuil (ou à la limite) : la valeur convertible. */
  cumul: number;
  /** Le moment où chaque objectif est validé, en secondes. */
  objectifs: (number | null)[];
  /** Le premier achat de chaque générateur, en secondes. */
  premiersAchats: Partial<Record<IdGenerateur, number>>;
  /** Part du cumul due aux clics, à 5 et à 15 minutes. */
  partClic: { a5: number; a15: number };
  /** Les attentes entre deux achats successifs avant le seuil, en secondes. */
  attentes: { debut: number; duree: number }[];
  /** Nombre d'achats avant le seuil. */
  achats: number;
  /** Points de fouille au seuil, puis en continuant de jouer les durées demandées (secondes). */
  points: { auSeuil: number; apres: Record<number, number>; apresUneNuit: number };
}

/** Points de fouille (D-002). */
export const points = (valeur: number) => (valeur < 1 ? 0 : Math.floor(Math.log10(valeur) * 1.4));

function nombreAchats(etat: EtatSurface): number {
  return Object.values(etat.generateurs).reduce((a, n) => a + n, 0) + etat.ameliorations.length;
}

/**
 * Joue une partie jusqu'au seuil (au plus `limite` secondes) et la mesure. Continue ensuite de jouer
 * `apresSeuil` secondes au plus, pour mesurer ce que rapporte le fait de rester.
 */
export async function mesurerSurface(
  profil: Profil,
  { limite = 3 * 3600, apresSeuil = [] as number[] } = {},
): Promise<MesuresSurface> {
  const registre = new Registre();
  registre.enregistrer(1, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
  const noyau = new Noyau(registre, creerEtatNoyau(1, 0));
  await noyau.demarrer(0);
  const etat = () => noyau.etatStrate as EtatSurface;
  const joueur = creerJoueur(noyau, profil);

  const objectifs: (number | null)[] = OBJECTIFS.map(() => null);
  const premiersAchats: Partial<Record<IdGenerateur, number>> = {};
  const attentes: { debut: number; duree: number }[] = [];
  const partClic = { a5: 0, a15: 0 };
  let gainClics = 0;
  let dernierAchat: number | null = null;
  let achats = 0;

  let t = 0;
  for (; t < limite && !noyau.seuil.atteint; t++) {
    gainClics += valeurClic(etat()) * profil.clics(t);
    joueur.seconde(t);
    const s = t + 1;

    for (let i = 0; i < etat().objectif; i++) objectifs[i] ??= s;
    for (const g of GENERATEURS) {
      if (etat().generateurs[g.id] > 0) premiersAchats[g.id] ??= s;
    }
    const n = nombreAchats(etat());
    if (n > achats) {
      if (dernierAchat !== null) attentes.push({ debut: dernierAchat, duree: s - dernierAchat });
      dernierAchat = s;
      achats = n;
    }
    if (s === 300) partClic.a5 = gainClics / etat().cumul;
    if (s === 900) partClic.a15 = gainClics / etat().cumul;
  }

  const seuil = noyau.seuil.atteint ? t : null;
  const cumul = etat().cumul;
  // Une nuit d'absence au seuil : 12 h à 80 %, la production ne change pas sans achat (fiche, § 10).
  const apresUneNuit = points(cumul + production(etat()) * 0.8 * 12 * 3600);
  const apres: Record<number, number> = {};
  if (seuil !== null) {
    for (let s = 1; s <= Math.max(0, ...apresSeuil); s++) {
      joueur.seconde(seuil + s - 1);
      if (apresSeuil.includes(s)) apres[s] = points(etat().cumul);
    }
  }

  return {
    seuil,
    cumul,
    objectifs,
    premiersAchats,
    partClic,
    attentes,
    achats,
    points: { auSeuil: points(cumul), apres, apresUneNuit },
  };
}

// Mesures d'une partie des caves jouée par un joueur automatique, pour l'équilibrage (#36).
import { pointsDeFouille } from "../../src/noyau/logique/artefacts";
import { creerEtatNoyau } from "../../src/noyau/logique/etat";
import { Noyau } from "../../src/noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../../src/noyau/logique/registre";
import { logique, type EtatCaves } from "../../src/strates/s2-caves/logique";
import type { IdStockage } from "../../src/strates/s2-caves/logique/regles";
import { creerJoueur, type ProfilCaves } from "../joueurs/caves";

export interface MesuresCaves {
  /** Le seuil, en secondes de jeu, ou null s'il n'est pas atteint dans la limite. */
  seuil: number | null;
  /** Le cumul au seuil (ou à la limite) : la valeur convertible. */
  cumul: number;
  /** Points de fouille au seuil, puis en continuant de jouer les durées demandées (secondes). */
  points: { auSeuil: number; apres: Record<number, number> };
  /** La première rupture, en secondes de jeu. */
  premiereRupture: number | null;
  /** Les hivers jugés : manqués, dont grands hivers manqués. */
  hivers: { juges: number; manques: number; grandsManques: number };
  /** Le premier hiver a-t-il manqué ? */
  premierHiverManque: boolean;
  /** Nombre d'achats avant le seuil, et le moment du dernier. */
  achats: number;
  dernierAchat: number | null;
  /** Les attentes entre deux achats successifs avant le seuil, en secondes. */
  attentes: { debut: number; duree: number }[];
  /** Au seuil (ou à la limite). */
  familles: number;
  stockages: Record<IdStockage, number>;
  outils: number;
  /** Le plafond × 4 des artefacts a-t-il agi ? */
  plafonne: boolean;
}

function nombreAchats(e: EtatCaves): number {
  return e.installees + e.outils + Object.values(e.stockages).reduce((a, n) => a + n, 0);
}

/**
 * Joue une partie des caves, avec les objets `artefacts` emportés de la surface, jusqu'au seuil (au
 * plus `limite` secondes), et la mesure. Continue ensuite `apresSeuil` secondes au plus.
 */
export async function mesurerCaves(
  profil: ProfilCaves,
  { limite = 4 * 3600, apresSeuil = [] as number[], artefacts = [] as string[] } = {},
): Promise<MesuresCaves> {
  const registre = new Registre();
  registre.enregistrer(2, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
  const etatNoyau = creerEtatNoyau(1, 0);
  etatNoyau.profondeur = 2;
  etatNoyau.artefacts = [...artefacts];
  const noyau = new Noyau(registre, etatNoyau);
  await noyau.demarrer(0);
  const etat = () => noyau.etatStrate as EtatCaves;
  const joueur = creerJoueur(noyau, profil);

  const attentes: { debut: number; duree: number }[] = [];
  let dernierAchat: number | null = null;
  let achats = nombreAchats(etat());
  let premiereRupture: number | null = null;
  const juges: { annee: number; rupture: boolean }[] = [];

  let t = 0;
  for (; t < limite && !noyau.seuil.atteint; t++) {
    const avant = etat().hivers.at(-1)?.annee;
    joueur.seconde(t);
    const s = t + 1;
    const e = etat();
    if (premiereRupture === null && e.bilan.rupture) premiereRupture = s;
    const dernier = e.hivers.at(-1);
    if (dernier && dernier.annee !== avant) juges.push(dernier);
    const n = nombreAchats(e);
    if (n > achats) {
      if (dernierAchat !== null) attentes.push({ debut: dernierAchat, duree: s - dernierAchat });
      dernierAchat = s;
      achats = n;
    }
  }

  const seuil = noyau.seuil.atteint ? t : null;
  const e = etat();
  const mesures = {
    seuil,
    cumul: e.cumul,
    premiereRupture,
    hivers: {
      juges: juges.length,
      manques: juges.filter((h) => h.rupture).length,
      grandsManques: juges.filter((h) => h.rupture && h.annee >= 14).length,
    },
    premierHiverManque: juges[0]?.rupture ?? false,
    achats: achats - nombreAchats(logique.etatInitial({ graine: 1, journal: { strates: [] } })),
    dernierAchat,
    attentes,
    familles: e.familles,
    stockages: { ...e.stockages },
    outils: e.outils,
    plafonne: noyau.effets.plafonne,
  };

  const apres: Record<number, number> = {};
  if (seuil !== null) {
    for (let s = 1; s <= Math.max(0, ...apresSeuil); s++) {
      joueur.seconde(seuil + s - 1);
      if (apresSeuil.includes(s)) apres[s] = pointsDeFouille(etat().cumul);
    }
  }
  return { ...mesures, points: { auSeuil: pointsDeFouille(mesures.cumul), apres } };
}

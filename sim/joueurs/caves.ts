// Un joueur automatique pour les caves (#36), branché sur le noyau. Deux façons de jouer :
// - le réflexe de la surface : acheter dès qu'on peut ce qui se rembourse le plus vite (ou, plus naïf,
//   ce qui coûte le moins cher), et de la place quand la réserve est pleine (docs/strates/strate-2.md,
//   § 5) ;
// - la prévision : ne dépenser que ce qui laisse, au pire moment d'ici la fin de la prochaine soudure,
//   une marge de quelques jours de consommation ; construire d'abord si le grain va déborder.
import type { Noyau } from "../../src/noyau/logique/noyau";
import type { ContexteTick } from "../../src/noyau/logique/types";
import { logique, type ActionCaves, type EtatCaves } from "../../src/strates/s2-caves/logique";
import {
  capacite,
  consommation,
  CONSOMMATION_PAR_FAMILLE,
  coutFamille,
  coutStockage,
  JOURS_PAR_AN,
  prochainOutil,
  recolteParFamille,
  saisonChaude,
  STOCKAGES,
  stockageVisible,
  valleePleine,
} from "../../src/strates/s2-caves/logique/regles";

export interface ProfilCaves {
  /** Ce qui le caractérise, pour les rapports. */
  description: string;
  /** Clics par seconde sur « Glaner », selon le temps de jeu. */
  clics: (t: number) => number;
  /** Secondes entre deux passages du joueur. */
  attention: (t: number) => number;
  /** Jusqu'à quand (s) il joue comme à la surface ; ensuite, il prévoit. Infinity : toujours. */
  reflexeJusqua: number;
  /** La marge de la prévision, en jours de consommation. */
  marge: number;
  /**
   * Ce qu'achète le réflexe : ce qui se rembourse le plus vite (le glouton, par défaut), ou ce qui
   * coûte le moins cher, stockages compris.
   */
  achat?: "rendement" | "moins-cher";
}

/** Le joueur qui arrive de la surface et n'en change pas : il ne passe jamais le premier hiver. */
export const REFLEXE: ProfilCaves = {
  description:
    "achète dès qu'il peut, comme à la surface ; 4 clics/s pendant 10 min ; passe toutes les 5 s",
  clics: (t) => (t < 600 ? 4 : 0),
  attention: () => 5,
  reflexeJusqua: Infinity,
  marge: 0,
};

/** Le joueur qui arrive avec les réflexes de la surface et les corrige après le premier hiver. */
export const APPREND: ProfilCaves = {
  description:
    "comme à la surface jusqu'à 6 min, puis prévision à 30 jours ; passe toutes les 5 s, puis 20 s",
  clics: (t) => (t < 600 ? 4 : 0),
  attention: (t) => (t < 900 ? 5 : 20),
  reflexeJusqua: 6 * 60,
  marge: 30,
};

/** Le joueur naïf : il achète toujours ce qui coûte le moins cher, comme à la surface, sans jamais prévoir. */
export const MOINS_CHER: ProfilCaves = {
  ...REFLEXE,
  description:
    "achète toujours le moins cher dès qu'il peut ; 4 clics/s pendant 10 min ; passe toutes les 5 s",
  achat: "moins-cher",
};

export const CORRECT: ProfilCaves = {
  description: "prévision à 30 jours ; 3 clics/s pendant 15 min ; passe toutes les 5 s, puis 20 s",
  clics: (t) => (t < 900 ? 3 : 0),
  attention: (t) => (t < 900 ? 5 : 20),
  reflexeJusqua: 0,
  marge: 30,
};

export const PRUDENT: ProfilCaves = {
  description:
    "prévision à 90 jours ; 2 clics/s pendant 5 min ; passe toutes les 10 s, puis chaque minute",
  clics: (t) => (t < 300 ? 2 : 0),
  attention: (t) => (t < 600 ? 10 : 60),
  reflexeJusqua: 0,
  marge: 90,
};

export const DISTRAIT: ProfilCaves = {
  description:
    "prévision à 30 jours ; 2 clics/s pendant 5 min ; passe toutes les 10 s, puis chaque minute",
  clics: (t) => (t < 300 ? 2 : 0),
  attention: (t) => (t < 600 ? 10 : 60),
  reflexeJusqua: 0,
  marge: 30,
};

/** Ce qu'une année de saison chaude rapporte par famille, en jours de plein été : 2S/π. */
const anneeUtile = (e: EtatCaves) => (saisonChaude(e.annee) * 2) / Math.PI;

/** La famille ou l'outil qui se rembourse le plus vite, avec son prix. */
function meilleurAchat(e: EtatCaves): { action: ActionCaves; cout: number } | null {
  const an = anneeUtile(e);
  const options: { action: ActionCaves; cout: number; delai: number }[] = [];
  if (!valleePleine(e)) {
    const gain = recolteParFamille(e) * an - CONSOMMATION_PAR_FAMILLE * JOURS_PAR_AN;
    const cout = coutFamille(e);
    options.push({ action: { type: "installer" }, cout, delai: cout / Math.max(gain, 1e-9) });
  }
  const outil = prochainOutil(e);
  if (outil) {
    const gain = e.familles * recolteParFamille(e) * (outil.facteur - 1) * an;
    options.push({ action: { type: "outil" }, cout: outil.cout, delai: outil.cout / gain });
  }
  options.sort((a, b) => a.delai - b.delai);
  return options[0] ?? null;
}

/** Le stockage le moins cher par boisseau de capacité, parmi ceux qui tiennent dans `budget`. */
function meilleurStockage(e: EtatCaves, budget: number): ActionCaves | null {
  let meilleur: { id: (typeof STOCKAGES)[number]["id"]; prix: number } | null = null;
  for (const def of STOCKAGES) {
    const cout = coutStockage(def, e.stockages[def.id]);
    if (!stockageVisible(e, def) || cout > budget) continue;
    const prix = cout / def.capacite;
    if (!meilleur || prix < meilleur.prix) meilleur = { id: def.id, prix };
  }
  return meilleur && { type: "construire", stockage: meilleur.id };
}

/**
 * Sans rien acheter, jusqu'à la fin de la prochaine soudure : la réserve au plus bas, et le grain
 * qui débordera faute de place.
 */
export function prevision(e: EtatCaves, ctx: ContexteTick): { mini: number; deborde: number } {
  const copie = structuredClone(e);
  const annee = copie.annee;
  const debord = copie.pertes.debord;
  let mini = copie.reserve;
  for (let jour = 0; jour < 2 * JOURS_PAR_AN; jour++) {
    logique.tick(copie, 1, ctx);
    mini = Math.min(mini, copie.reserve);
    if (copie.annee > annee && !copie.soudure) break;
  }
  return { mini, deborde: copie.pertes.debord - debord };
}

/** L'achat le moins cher, quel qu'il soit : une famille, un stockage visible ou le prochain outil. */
function achatLeMoinsCher(e: EtatCaves): { action: ActionCaves; cout: number } | null {
  const options: { action: ActionCaves; cout: number }[] = [];
  if (!valleePleine(e)) options.push({ action: { type: "installer" }, cout: coutFamille(e) });
  for (const def of STOCKAGES) {
    if (!stockageVisible(e, def)) continue;
    const cout = coutStockage(def, e.stockages[def.id]);
    options.push({ action: { type: "construire", stockage: def.id }, cout });
  }
  const outil = prochainOutil(e);
  if (outil) options.push({ action: { type: "outil" }, cout: outil.cout });
  options.sort((a, b) => a.cout - b.cout);
  return options[0] ?? null;
}

/** L'action du joueur réflexe, ou null s'il attend. */
function reflexe(e: EtatCaves, achat: ProfilCaves["achat"]): ActionCaves | null {
  const grenier = coutStockage(STOCKAGES[0], e.stockages.grenier);
  if (e.reserve >= 0.95 * capacite(e) && e.reserve >= grenier) {
    return { type: "construire", stockage: "grenier" };
  }
  const choix = achat === "moins-cher" ? achatLeMoinsCher(e) : meilleurAchat(e);
  return choix && e.reserve >= choix.cout ? choix.action : null;
}

/** L'action du joueur qui prévoit, ou null s'il attend. */
function prevoyant(e: EtatCaves, marge: number, ctx: ContexteTick): ActionCaves | null {
  const { mini, deborde } = prevision(e, ctx);
  const libre = Math.min(e.reserve, mini - consommation(e) * marge);
  // Le grain qui déborde est perdu : de la place d'abord, s'il en manque.
  if (deborde > 0.05 * capacite(e)) {
    const stockage = meilleurStockage(e, Math.min(e.reserve, Math.max(0, libre) + deborde));
    if (stockage) return stockage;
  }
  const achat = meilleurAchat(e);
  return achat && libre > 0 && achat.cout <= libre ? achat.action : null;
}

/**
 * Un joueur branché sur un noyau démarré dans les caves. `seconde(t)` joue la seconde t : les clics,
 * un passage si c'est le moment (le joueur achète tant qu'il le veut), puis une seconde de temps.
 */
export function creerJoueur(noyau: Noyau, profil: ProfilCaves) {
  const etat = () => noyau.etatStrate as EtatCaves;
  const ctx: ContexteTick = { effets: noyau.effets, emettre: () => {} };
  let prochainPassage = 0;
  return {
    seconde(t: number): void {
      for (let i = 0; i < profil.clics(t); i++) noyau.agir({ type: "glaner" });
      if (t >= prochainPassage) {
        for (let i = 0; i < 40; i++) {
          const e = etat();
          const action =
            t < profil.reflexeJusqua ? reflexe(e, profil.achat) : prevoyant(e, profil.marge, ctx);
          if (!action) break;
          const avant = e.reserve;
          noyau.agir(action);
          noyau.tick(0);
          if (etat().reserve === avant) break;
        }
        prochainPassage = t + profil.attention(t);
      }
      noyau.avancer(1);
    },
  };
}

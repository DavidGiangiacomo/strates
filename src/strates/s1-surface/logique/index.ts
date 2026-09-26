// La surface : un incrémental orthodoxe, au clic puis automatique (docs/strates/strate-1.md).
import type { ContexteTick, LogiqueStrate } from "../../../noyau/logique/types";
import { etatInitial, PERIODE_HISTORIQUE, TAILLE_HISTORIQUE, type EtatSurface } from "./etat";
import {
  amelioration,
  ameliorationDisponible,
  coutAchat,
  generateur,
  OBJECTIFS,
  production,
  quantiteAbordable,
  SEUIL_PRODUCTION,
  valeurClic,
  type IdGenerateur,
} from "./regles";

export type { EtatSurface } from "./etat";

export type ActionSurface =
  | { type: "produire" }
  | { type: "acheter"; generateur: IdGenerateur; quantite: 1 | 10 | "max" }
  | { type: "ameliorer"; amelioration: string };

// Tolérance pour les multiples de 10 s atteints par une somme de pas en virgule flottante.
const EPSILON = 1e-9;

function gagner(etat: EtatSurface, quantite: number): void {
  etat.credits += quantite;
  etat.cumul += quantite;
}

/** Fait avancer `temps` et ajoute un point d'historique à chaque multiple de 10 s franchi. */
function avancerTemps(etat: EtatSurface, dt: number, p: number): void {
  const avant = Math.floor(etat.temps / PERIODE_HISTORIQUE + EPSILON);
  etat.temps += dt;
  const apres = Math.floor(etat.temps / PERIODE_HISTORIQUE + EPSILON);
  for (let i = 0; i < Math.min(apres - avant, TAILLE_HISTORIQUE); i++) etat.historique.push(p);
  if (etat.historique.length > TAILLE_HISTORIQUE) {
    etat.historique.splice(0, etat.historique.length - TAILLE_HISTORIQUE);
  }
}

/** Valide les objectifs atteints, en cascade, et note le seuil. */
function verifier(etat: EtatSurface): void {
  while (etat.objectif < OBJECTIFS.length && OBJECTIFS[etat.objectif]?.(etat)) etat.objectif++;
  if (etat.seuilAtteintA === null && production(etat) >= SEUIL_PRODUCTION) {
    etat.seuilAtteintA = etat.temps;
  }
}

function acheter(etat: EtatSurface, id: IdGenerateur, quantite: 1 | 10 | "max"): void {
  const g = generateur(id);
  if (!g) return;
  const possedes = etat.generateurs[g.id];
  const k =
    quantite === "max" ? quantiteAbordable(g, possedes, etat.credits) : quantite === 10 ? 10 : 1;
  if (k < 1) return;
  const cout = coutAchat(g, possedes, k);
  if (cout > etat.credits) return;
  etat.credits -= cout;
  etat.generateurs[g.id] = possedes + k;
}

function ameliorer(etat: EtatSurface, id: string): void {
  const def = amelioration(id);
  if (!def || !ameliorationDisponible(etat, def) || def.cout > etat.credits) return;
  etat.credits -= def.cout;
  etat.ameliorations.push(def.id);
}

function lireEffets(etat: EtatSurface, ctx: ContexteTick): void {
  etat.multiplicateur = ctx.effets.multiplicateur("production");
}

export const logique: LogiqueStrate<EtatSurface, ActionSurface> = {
  numero: 1,
  versionEtat: 1,
  migrations: {},
  // P est constante entre deux actions : un pas de n'importe quelle taille est exact.
  // 10 s est le rythme de l'historique.
  pasMax: PERIODE_HISTORIQUE,
  leviers: { principal: "production" },
  horsLigne: { type: "standard" },

  etatInitial: () => etatInitial(),

  tick(etat, dt, ctx) {
    lireEffets(etat, ctx);
    const p = production(etat);
    gagner(etat, p * dt);
    avancerTemps(etat, dt, p);
    verifier(etat);
  },

  agir(etat, action, ctx) {
    lireEffets(etat, ctx);
    switch (action.type) {
      case "produire":
        gagner(etat, valeurClic(etat));
        break;
      case "acheter":
        acheter(etat, action.generateur, action.quantite);
        break;
      case "ameliorer":
        ameliorer(etat, action.amelioration);
        break;
    }
    verifier(etat);
  },

  seuil: (etat) => ({ atteint: etat.seuilAtteintA !== null }),
  valeurConvertible: (etat) => etat.cumul,

  /** La surface telle qu'on l'a laissée, avec sa production qui a tourné pendant toute la partie (§11). */
  remontee(etatSauvegarde, duree) {
    const etat = JSON.parse(JSON.stringify(etatSauvegarde)) as EtatSurface;
    gagner(etat, production(etat) * duree);
    etat.temps += duree;
    return etat;
  },
};

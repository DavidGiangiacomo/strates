// La surface : un incrémental orthodoxe, au clic puis automatique (docs/strates/strate-1.md).
import type {
  ContexteTick,
  Formule,
  GrapheDependances,
  LogiqueStrate,
} from "../../../noyau/logique/types";
import { textes } from "../textes.fr";
import { etatInitial, PERIODE_HISTORIQUE, TAILLE_HISTORIQUE, type EtatSurface } from "./etat";
import { formaterDebit, formaterMontant } from "./notation";
import {
  amelioration,
  ameliorationDisponible,
  avanceeFissure,
  coutAchat,
  generateur,
  GENERATEURS,
  generateurVisible,
  OBJECTIFS,
  production,
  quantiteAbordable,
  SEUIL_PRODUCTION,
  valeurClic,
  type DefAmelioration,
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

/** Valide les objectifs atteints, en cascade, et note le seuil. Chaque objectif laisse une trace. */
function verifier(etat: EtatSurface, ctx: ContexteTick): void {
  while (etat.objectif < OBJECTIFS.length && OBJECTIFS[etat.objectif]?.(etat)) {
    etat.objectif++;
    ctx.emettre({ type: "trace", cle: "objectif", valeurs: { numero: etat.objectif } });
  }
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

/** Ce qu'une amélioration alimente : son moyen de production, toute la production, ou le clic. */
function cibleAmelioration(def: DefAmelioration): string {
  const { effet } = def;
  if (effet.type === "generateur") return effet.generateur;
  return effet.type === "global" ? "production" : "clic";
}

/**
 * Le graphe de dépendances (fiche, § 7) : le clic et les moyens de production alimentent la
 * production, chaque amélioration pointe vers ce qu'elle améliore, et la production mène à l'objectif.
 * Il ne montre que ce que le tableau de bord a déjà montré : les moyens apparus, les améliorations achetées.
 */
function graphe(etat: EtatSurface): GrapheDependances {
  const generateurs = GENERATEURS.filter((g) => generateurVisible(etat, g));
  const ameliorations = etat.ameliorations.flatMap((id) => amelioration(id) ?? []);
  return {
    noeuds: [
      { id: "clic", cle: "produire" },
      ...generateurs.map((g) => ({ id: g.id, cle: `generateur.${g.id}` })),
      ...ameliorations.map((a) => ({ id: a.id, cle: `amelioration.${a.id}` })),
      { id: "production", cle: "production" },
      { id: "objectif", cle: "objectif" },
    ],
    liens: [
      { de: "clic", vers: "production" },
      ...generateurs.map((g) => ({ de: g.id, vers: "production" })),
      ...ameliorations.map((a) => ({ de: a.id, vers: cibleAmelioration(a) })),
      { de: "production", vers: "objectif" },
    ],
  };
}

/**
 * Les formules réelles (fiche, § 3), de la plus simple à la plus profonde : le prix de chaque moyen
 * de production, ce qu'il produit, puis la valeur du clic.
 */
function formules(): Formule[] {
  const ecrire = (cle: string, valeurs: Record<string, string>) =>
    (textes[cle] ?? cle).replace(/\{(\w+)\}/g, (tout, nom: string) => valeurs[nom] ?? tout);
  return [
    ...GENERATEURS.map((g) => ({
      noeud: g.id,
      expression: ecrire("formule.prix", { base: formaterMontant(g.cout) }),
    })),
    ...GENERATEURS.map((g) => ({
      noeud: g.id,
      expression: ecrire("formule.production", { production: formaterDebit(g.production) }),
    })),
    { noeud: "clic", expression: ecrire("formule.clic", {}) },
  ];
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
    verifier(etat, ctx);
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
    verifier(etat, ctx);
  },

  seuil: (etat) => ({ atteint: etat.seuilAtteintA !== null }),
  // Le noyau le lit quand le joueur creuse : « creuser avant la fissure » (fiche, § 7).
  filet: avanceeFissure,
  valeurConvertible: (etat) => etat.cumul,

  graphe,
  formules,

  /** Pour le journal de session : ce que montre le tableau de bord, et la fissure du filet. */
  releve: (etat) => ({
    credits: etat.credits,
    cumul: etat.cumul,
    production: production(etat),
    objectif: etat.objectif,
    fissure: avanceeFissure(etat),
  }),

  /** La surface telle qu'on l'a laissée, avec sa production qui a tourné pendant toute la partie (§11). */
  remontee(etatSauvegarde, duree) {
    const etat = JSON.parse(JSON.stringify(etatSauvegarde)) as EtatSurface;
    gagner(etat, production(etat) * duree);
    etat.temps += duree;
    return etat;
  },
};

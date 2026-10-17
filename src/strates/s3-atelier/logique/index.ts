// L'atelier : on place. Une pièce ne vaut que par l'endroit où elle est, et elle ne tourne que si elle
// tient au ressort, de dent en dent (docs/strates/strate-3.md, § 3). La condition du seuil arrive avec
// #79 ; l'opacité et les actes de compréhension avec #95 ; les objets d'en haut, hors multiplicateurs,
// avec #81.
import { EFFETS_NEUTRES } from "../../../noyau/logique/effets";
import { avanceeFissure } from "../../../noyau/logique/filet";
import type {
  ContexteTick,
  EffetsActifs,
  Formule,
  GrapheDependances,
  LogiqueStrate,
} from "../../../noyau/logique/types";
import { textes } from "../textes.fr";
import { etatInitial, TAILLE_LEGENDE, type EtatAtelier, type PieceAtelier } from "./etat";
import { remplir } from "./notation";
import {
  AGRANDISSEMENTS,
  analyser,
  coteDeBase,
  defPiece,
  dente,
  estCase,
  largeur,
  placeLibre,
  prixPiece,
  prochainAgrandissement,
  restantes,
  TAILLE_MAX,
  TOUR,
  type Analyse,
  type Cote,
  type Frottement,
  type IdPiece,
} from "./regles";

export type { EtatAtelier, PieceAtelier } from "./etat";

export type ActionAtelier =
  | { type: "acheter"; piece: IdPiece }
  | { type: "poser"; repere: number; case: [number, number]; rot: number }
  | { type: "tourner"; repere: number }
  | { type: "deplacer"; repere: number; case: [number, number] }
  | { type: "echanger"; a: number; b: number }
  | { type: "mettreDeCote"; repere: number }
  | { type: "limer"; repere: number; cote: number }
  | { type: "agrandir" };

// Tolérance pour les sommes de pas en virgule flottante, en secondes.
const EPSILON = 1e-9;

/** Les multiplicateurs des objets d'en haut agissent dès l'arrivée (fiche, § 8). */
function lireEffets(etat: EtatAtelier, effets: EffetsActifs): void {
  etat.multiplicateurs.ressort = effets.multiplicateur("ressort");
  etat.multiplicateurs.plan = effets.multiplicateur("plan");
}

/**
 * Écrit une ligne à la légende. Avec un contexte, elle laisse aussi une trace pour le journal de
 * session (#26).
 */
function ecrire(
  etat: EtatAtelier,
  ctx: ContexteTick | null,
  cle: string,
  valeurs: Record<string, number> = {},
): void {
  etat.legende.push({ cle, valeurs });
  if (etat.legende.length > TAILLE_LEGENDE) {
    etat.legende.splice(0, etat.legende.length - TAILLE_LEGENDE);
  }
  ctx?.emettre({ type: "trace", cle, valeurs });
}

/** Les repères des pièces entraînées. */
function entrainees(analyse: Analyse): Set<number> {
  const s = new Set<number>();
  for (const [repere, info] of analyse.pieces) if (info.entrainee) s.add(repere);
  return s;
}

/**
 * Les gênes en cours, après un geste : un frottement qui dure garde son heure, un nouveau prend celle
 * du geste, et un frottement défait est oublié.
 */
function suivreGenes(etat: EtatAtelier, analyse: Analyse): void {
  const actuels = new Set(analyse.frottements.map((f) => f.cle));
  for (const cle of Object.keys(etat.genes)) if (!actuels.has(cle)) delete etat.genes[cle];
  for (const cle of actuels) etat.genes[cle] ??= etat.temps;
}

/**
 * Après chaque geste, la logique refait les contacts, l'entraînement et la production (fiche, § 3), et
 * la légende note ce qui a changé : une pièce qui se met à tourner est ajustée, une pièce qui s'arrête
 * ne tourne plus. Une pièce qu'on vient de poser ou de déplacer a toujours sa ligne. Un frottement ne
 * s'y écrit qu'au bout d'un tour.
 */
function actualiser(
  etat: EtatAtelier,
  ctx: ContexteTick,
  avant: Set<number>,
  bougees: readonly number[] = [],
): void {
  const analyse = analyser(etat);
  suivreGenes(etat, analyse);
  for (const [piece, info] of analyse.pieces) {
    const bougee = bougees.includes(piece);
    if (info.entrainee && (bougee || !avant.has(piece)))
      ecrire(etat, ctx, "legende.ajustee", { piece });
    else if (!info.entrainee && (bougee || avant.has(piece))) {
      ecrire(etat, ctx, "legende.immobile", { piece });
    }
  }
}

/** Un frottement se montre : il a duré un tour. */
function montrer(etat: EtatAtelier, frottement: Frottement, ctx: ContexteTick): void {
  ecrire(etat, ctx, `legende.gene.${frottement.contre}`, { piece: frottement.piece });
}

/** `duree` secondes de production : le stock et le cumul montent ensemble. */
function produire(etat: EtatAtelier, parSeconde: number, duree: number): void {
  if (duree <= 0) return;
  const q = parSeconde * duree;
  etat.stock += q;
  etat.cumul += q;
  etat.temps += duree;
}

function trouver(etat: EtatAtelier, repere: unknown): PieceAtelier | undefined {
  return etat.pieces.find((p) => p.repere === repere);
}

function indice(etat: EtatAtelier, piece: PieceAtelier): number {
  return etat.pieces.indexOf(piece);
}

/** Acheter : la pièce vient sur l'établi, en main. Rien ne change sur le plan. */
function acheter(etat: EtatAtelier, id: unknown): boolean {
  const d = typeof id === "string" ? defPiece(id) : undefined;
  if (!d || restantes(etat, d) <= 0) return false;
  const prix = prixPiece(etat, d);
  if (prix > etat.stock) return false;
  etat.stock -= prix;
  etat.achetees[d.id] += 1;
  etat.pieces.push({ id: d.id, repere: etat.pieces.length + 1, case: null, rot: 0, limees: [] });
  return true;
}

/** Agrandir : une couronne de cases libres tout autour. Les pièces du bord ne touchent plus le cadre. */
function agrandir(etat: EtatAtelier): boolean {
  const a = prochainAgrandissement(etat);
  if (!a || a.prix > etat.stock) return false;
  etat.stock -= a.prix;
  const couronne = (a.taille - etat.taille) / 2;
  etat.taille = a.taille;
  for (const p of etat.pieces) if (p.case) p.case = [p.case[0] + couronne, p.case[1] + couronne];
  return true;
}

/**
 * Applique un geste sur le plan. Renvoie les repères des pièces qui ont bougé, ou null si le geste est
 * impossible : il est alors ignoré, sans erreur (fiche, § 3).
 */
function geste(etat: EtatAtelier, action: ActionAtelier): number[] | null {
  switch (action.type) {
    case "poser": {
      const p = trouver(etat, action.repere);
      const rot = action.rot;
      if (!p || p.case || !estCase(action.case)) return null;
      if (!Number.isInteger(rot) || rot < 0 || rot > 3) return null;
      if (!placeLibre(etat, largeur(p), action.case)) return null;
      p.case = [action.case[0], action.case[1]];
      p.rot = rot as PieceAtelier["rot"];
      return [p.repere];
    }
    case "tourner": {
      const p = trouver(etat, action.repere);
      if (!p) return null;
      p.rot = ((p.rot + 1) % 4) as PieceAtelier["rot"];
      return [];
    }
    case "deplacer": {
      const p = trouver(etat, action.repere);
      if (!p?.case || !estCase(action.case)) return null;
      if (action.case[0] === p.case[0] && action.case[1] === p.case[1]) return null;
      if (!placeLibre(etat, largeur(p), action.case, indice(etat, p))) return null;
      p.case = [action.case[0], action.case[1]];
      return [p.repere];
    }
    case "echanger": {
      // Deux pièces de même taille, dont l'une au moins est posée, échangent leurs places.
      const a = trouver(etat, action.a);
      const b = trouver(etat, action.b);
      if (!a || !b || a === b || (!a.case && !b.case) || largeur(a) !== largeur(b)) return null;
      [a.case, b.case] = [b.case, a.case];
      return [a, b].filter((p) => p.case).map((p) => p.repere);
    }
    case "mettreDeCote": {
      const p = trouver(etat, action.repere);
      if (!p?.case) return null;
      p.case = null;
      return [];
    }
    case "limer": {
      // `cote` est le côté tel qu'il se montre : la lime le rend lisse, pour toujours.
      const p = trouver(etat, action.repere);
      const d = action.cote;
      if (!p || !Number.isInteger(d) || d < 0 || d > 3 || !dente(p, d as Cote)) return null;
      p.limees.push(coteDeBase(p, d as Cote));
      return [];
    }
    default:
      return null;
  }
}

/**
 * Le graphe de dépendances (fiche, § 7). Le ressort entraîne le rouage, de dent en dent. Les dents
 * engrenées et les frottements font la production de chaque pièce ; les côtés, que la lime change, et
 * le cadre, qui frotte, les font. Le rouage et ses pièces font la production, et la production le
 * stock. Le stock paie la nomenclature et l'agrandissement du plan ; le plan reçoit les pièces, et
 * leurs places font les contacts.
 */
function graphe(): GrapheDependances {
  const noeuds = [
    "ressort",
    "rouage",
    "cotes",
    "lime",
    "cadre",
    "engrenages",
    "frottements",
    "piece",
    "production",
    "stock",
    "nomenclature",
    "agrandir",
    "plan",
  ];
  const liens: [string, string][] = [
    ["ressort", "rouage"],
    ["engrenages", "rouage"],
    ["lime", "cotes"],
    ["cotes", "engrenages"],
    ["cotes", "frottements"],
    ["cadre", "frottements"],
    ["plan", "engrenages"],
    ["plan", "frottements"],
    ["engrenages", "piece"],
    ["frottements", "piece"],
    ["rouage", "production"],
    ["piece", "production"],
    ["production", "stock"],
    ["stock", "nomenclature"],
    ["stock", "agrandir"],
    ["nomenclature", "plan"],
    ["agrandir", "plan"],
  ];
  return {
    noeuds: noeuds.map((id) => ({ id, cle: `noeud.${id}` })),
    liens: liens.map(([de, vers]) => ({ de, vers })),
  };
}

/**
 * Les formules réelles (fiche, § 7), de la plus simple à la plus profonde, écrites en base douze : le
 * prix d'un exemplaire, la production d'une pièce, celle de l'atelier, l'entraînement, et le prix des
 * agrandissements.
 */
function formules(): Formule[] {
  const [a, b, c] = AGRANDISSEMENTS;
  const agrandir = remplir(textes["formule.agrandir"] ?? "", {
    a: a!.taille,
    pa: a!.prix,
    b: b!.taille,
    pb: b!.prix,
    c: c!.taille,
    pc: c!.prix,
  });
  return [
    { noeud: "nomenclature", expression: textes["formule.prix"] ?? "" },
    { noeud: "piece", expression: textes["formule.piece"] ?? "" },
    { noeud: "production", expression: textes["formule.production"] ?? "" },
    { noeud: "rouage", expression: textes["formule.rouage"] ?? "" },
    { noeud: "agrandir", expression: agrandir },
  ];
}

export const logique: LogiqueStrate<EtatAtelier, ActionAtelier> = {
  numero: 3,
  versionEtat: 1,
  migrations: {},
  // Un tour. Entre deux gestes, la production ne change pas ; le pas est coupé quand une gêne se montre.
  pasMax: TOUR,
  leviers: { principal: "ressort", secondaires: ["plan"] },
  horsLigne: { type: "standard" },

  etatInitial(ctx) {
    const etat = etatInitial();
    lireEffets(etat, ctx.effets ?? EFFETS_NEUTRES);
    return etat;
  },

  /**
   * Ajoute la production et fait vieillir les frottements : une gêne qui dure un tour se montre, et
   * le pas est coupé à ce moment.
   */
  tick(etat, dt, ctx) {
    lireEffets(etat, ctx.effets);
    const analyse = analyser(etat);
    const parSeconde = analyse.production / TOUR;
    const debut = etat.temps;
    const fin = debut + dt;
    const montrees = analyse.frottements
      .map((f) => ({ f, quand: (etat.genes[f.cle] ?? debut) + TOUR }))
      .filter(({ quand }) => quand > debut + EPSILON && quand <= fin + EPSILON)
      .sort((x, y) => x.quand - y.quand);
    for (const { f, quand } of montrees) {
      produire(etat, parSeconde, Math.min(quand, fin) - etat.temps);
      montrer(etat, f, ctx);
    }
    produire(etat, parSeconde, fin - etat.temps);
  },

  agir(etat, action, ctx) {
    lireEffets(etat, ctx.effets);
    switch (action.type) {
      case "acheter":
        acheter(etat, action.piece);
        return;
      case "agrandir": {
        const avant = entrainees(analyser(etat));
        if (!agrandir(etat)) return;
        actualiser(etat, ctx, avant);
        ecrire(etat, ctx, "legende.agrandi", {
          taille: etat.taille,
          cases: analyser(etat).casesLibres,
        });
        // Au dernier agrandissement, une pièce sans plan paraît sur l'établi, trouvée dessous.
        if (etat.taille === TAILLE_MAX && !etat.sansPlan) {
          etat.sansPlan = true;
          ecrire(etat, ctx, "legende.sans-plan");
        }
        return;
      }
      default: {
        const avant = entrainees(analyser(etat));
        const bougees = geste(etat, action);
        if (bougees === null) return;
        if (action.type === "limer") ecrire(etat, ctx, "legende.limee", { piece: action.repere });
        actualiser(etat, ctx, avant, bougees);
      }
    }
  },

  // Le seuil, l'assemblage sans aucune case libre, arrive avec #79.
  seuil: (etat) => ({ atteint: etat.seuilAtteintA !== null }),
  filet: (etat) => avanceeFissure(etat.temps, etat.seuilAtteintA),
  valeurConvertible: (etat) => etat.cumul,

  graphe,
  formules,

  /** Pour le journal de session : le plan, ce qui tourne et ce qui frotte, le stock et la production. */
  releve(etat) {
    const analyse = analyser(etat);
    let posees = 0;
    let limees = 0;
    for (const p of etat.pieces) {
      if (p.case) posees++;
      limees += p.limees.length;
    }
    return {
      taille: etat.taille,
      stock: etat.stock,
      cumul: etat.cumul,
      production: analyse.production,
      pieces: etat.pieces.length,
      posees,
      entrainees: entrainees(analyse).size,
      frottements: analyse.frottements.length,
      casesLibres: analyse.casesLibres,
      dentsLibres: analyse.dentsLibres,
      limees,
    };
  },
};

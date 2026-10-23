// L'atelier : on place. Une pièce ne vaut que par l'endroit où elle est, et elle ne tourne que si elle
// tient au ressort, de dent en dent (docs/strates/strate-3.md, § 3). Le seuil : l'assemblage achevé,
// sans aucune case libre (§ 4). L'opacité lève les noms, les valeurs et le rôle de la lime, et la
// logique signale ses actes de compréhension (§ 7).
import { CATALOGUE } from "../../../noyau/logique/catalogue";
import { EFFETS_NEUTRES } from "../../../noyau/logique/effets";
import { avanceeFissure } from "../../../noyau/logique/filet";
import type {
  ContexteTick,
  EffetsActifs,
  ElementOpaque,
  Formule,
  GrapheDependances,
  LogiqueStrate,
} from "../../../noyau/logique/types";
import { textes } from "../textes.fr";
import { etatInitial, TAILLE_LEGENDE, type EtatAtelier, type PieceAtelier } from "./etat";
import { ecrireLigne, remplir } from "./notation";
import {
  ACTES,
  AGRANDISSEMENTS,
  analyser,
  assemblageAcheve,
  coteDeBase,
  defPiece,
  estCase,
  largeur,
  limable,
  PIECES,
  placeLibre,
  premierPlanPlein,
  prixPiece,
  prochainAgrandissement,
  restantes,
  sansLimer,
  TAILLE_ARRIVEE,
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
  // Sans `rot`, la pièce se pose dans le sens qu'elle a en main : celui que « tourner » lui a donné.
  | { type: "poser"; repere: number; case: [number, number]; rot?: number }
  | { type: "tourner"; repere: number }
  | { type: "deplacer"; repere: number; case: [number, number] }
  | { type: "echanger"; a: number; b: number }
  | { type: "mettreDeCote"; repere: number }
  | { type: "limer"; repere: number; cote: number }
  | { type: "agrandir" };

// Tolérance pour les sommes de pas en virgule flottante, en secondes.
const EPSILON = 1e-9;

/** Les objets d'en haut : ceux de la surface et ceux des caves agissent tous ici (fiche, § 8). */
const D_EN_HAUT = CATALOGUE.filter((a) => a.origine < 3).map((a) => a.id);

/**
 * Les objets d'en haut agissent dès l'arrivée (fiche, § 8) : leurs multiplicateurs, et la liste de
 * ceux qui agissent, que la nomenclature montre sous « Hors plan ».
 */
function lireEffets(etat: EtatAtelier, effets: EffetsActifs): void {
  etat.multiplicateurs.ressort = effets.multiplicateur("ressort");
  etat.multiplicateurs.plan = effets.multiplicateur("plan");
  const horsPlan = D_EN_HAUT.filter((id) => effets.niveau(id) !== null);
  // Une liste neuve à chaque tick redessinerait la nomenclature pour rien.
  if (horsPlan.join() !== etat.horsPlan.join()) etat.horsPlan = horsPlan;
}

/**
 * Écrit une ligne à la légende. Avec un contexte, elle laisse aussi une trace pour le journal de
 * session (#26) ; sans, à l'arrivée, elle se déduit des objets emportés.
 */
function ecrire(
  etat: EtatAtelier,
  ctx: ContexteTick | null,
  cle: string,
  valeurs: Record<string, number> = {},
  objet?: string,
): void {
  etat.legende.push(objet === undefined ? { cle, valeurs } : { cle, valeurs, objet });
  if (etat.legende.length > TAILLE_LEGENDE) {
    etat.legende.splice(0, etat.legende.length - TAILLE_LEGENDE);
  }
  ctx?.emettre(
    objet === undefined ? { type: "trace", cle, valeurs } : { type: "trace", cle, valeurs, objet },
  );
}

/** Les objets des caves, que l'atelier nomme dès l'arrivée, par leur forme et leur place (fiche, § 8). */
const NOMMES = CATALOGUE.filter((a) => a.origine === 2).map((a) => a.id);

/**
 * L'éveil (fiche, § 8) : chaque objet d'en haut qui agit ici a sa ligne à la légende dès l'arrivée,
 * sous son nom d'en bas. Ceux des caves y prennent le nom que leur donne l'atelier ; ceux de la
 * surface gardent celui des caves, comme un mot étranger. Il n'y a pas d'éveil retardé.
 */
function eveiller(etat: EtatAtelier): void {
  for (const id of etat.horsPlan) ecrire(etat, null, "legende.eveil", {}, id);
}

/** Les repères des pièces entraînées. */
function entrainees(analyse: Analyse): Set<number> {
  const s = new Set<number>();
  for (const [repere, info] of analyse.pieces) if (info.entrainee) s.add(repere);
  return s;
}

/**
 * Les gênes en cours, après un geste : un frottement qui dure garde son heure, un nouveau prend celle
 * du geste, et un frottement défait est oublié. Une pièce qu'on vient de poser ou de déplacer repart
 * pour un tour : ses frottements, et ceux qu'elle subit, prennent l'heure du geste, même quand elle
 * frotte comme avant. Renvoie le nombre de frottements défaits avant d'avoir duré un tour.
 */
function suivreGenes(etat: EtatAtelier, analyse: Analyse, bougees: readonly number[]): number {
  const actuels = new Set(analyse.frottements.map((f) => f.cle));
  let defaites = 0;
  for (const [cle, debut] of Object.entries(etat.genes)) {
    if (actuels.has(cle)) continue;
    if (etat.temps - debut < TOUR - EPSILON) defaites++;
    delete etat.genes[cle];
  }
  for (const f of analyse.frottements) {
    const bouge = bougees.includes(f.piece) || (f.autre !== undefined && bougees.includes(f.autre));
    if (bouge) etat.genes[f.cle] = etat.temps;
    else etat.genes[f.cle] ??= etat.temps;
  }
  return defaites;
}

/**
 * Les gestes qui défont une gêne en la comprenant (fiche, § 7) : tourner, déplacer, échanger, mettre
 * de côté. La lime n'en est pas, ni l'agrandissement, qui éloigne le cadre.
 */
const DEFONT_UNE_GENE: ReadonlySet<string> = new Set([
  "tourner",
  "deplacer",
  "echanger",
  "mettreDeCote",
]);

/**
 * Les levées par l'usage (fiche, § 7) : une pièce prend son nom quand un exemplaire tourne, les
 * valeurs se lèvent au premier agrandissement, la lime prend sa légende au premier coup. Chaque geste
 * les redit : le noyau ne note une levée qu'une fois, et une partie commencée avant l'opacité les
 * retrouve au geste suivant.
 */
function lever(etat: EtatAtelier, analyse: Analyse, ctx: ContexteTick): void {
  const nommees = new Set<IdPiece>();
  for (const p of etat.pieces) if (analyse.pieces.get(p.repere)?.entrainee) nommees.add(p.id);
  for (const id of nommees) ctx.emettre({ type: "levee", element: `nom.${id}` });
  if (etat.taille > TAILLE_ARRIVEE) ctx.emettre({ type: "levee", element: "valeurs" });
  if (!sansLimer(etat)) ctx.emettre({ type: "levee", element: "lime" });
}

/**
 * Après chaque geste, la logique refait les contacts, l'entraînement et la production (fiche, § 3), et
 * la légende note ce qui a changé : une pièce qui se met à tourner est ajustée, une pièce qui s'arrête
 * ne tourne plus. Une pièce qu'on vient de poser ou de déplacer a toujours sa ligne. Un frottement ne
 * s'y écrit qu'au bout d'un tour. Les levées sont redites, et les actes du plan constatés (§ 7) : une
 * gêne défaite avant d'avoir duré un tour, le premier plan plein qui tourne.
 */
function actualiser(
  etat: EtatAtelier,
  ctx: ContexteTick,
  avant: Set<number>,
  bougees: readonly number[] = [],
  geste?: ActionAtelier["type"],
): void {
  const analyse = analyser(etat);
  const defaites = suivreGenes(etat, analyse, bougees);
  for (const [piece, info] of analyse.pieces) {
    const bougee = bougees.includes(piece);
    if (info.entrainee && (bougee || !avant.has(piece)))
      ecrire(etat, ctx, "legende.ajustee", { piece });
    else if (!info.entrainee && (bougee || avant.has(piece))) {
      ecrire(etat, ctx, "legende.immobile", { piece });
    }
  }
  lever(etat, analyse, ctx);
  if (defaites > 0 && geste !== undefined && DEFONT_UNE_GENE.has(geste)) {
    ctx.emettre({ type: "acte", acte: ACTES.geneDefaite });
  }
  if (premierPlanPlein(etat, analyse)) ctx.emettre({ type: "acte", acte: ACTES.premierPlanPlein });
}

/**
 * Le seuil (fiche, § 4) : atteint au geste qui achève l'assemblage, il le reste. La légende l'écrit :
 * « Il ne reste aucune case. »
 */
function verifierSeuil(etat: EtatAtelier, ctx: ContexteTick): void {
  if (etat.seuilAtteintA !== null || !assemblageAcheve(etat)) return;
  etat.seuilAtteintA = etat.temps;
  ecrire(etat, ctx, "cases.aucune");
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
      if (!p || p.case || !estCase(action.case)) return null;
      const rot = action.rot ?? p.rot;
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
      // `cote` est le côté tel qu'il se montre : la lime le rend lisse, pour toujours. Elle ne prend
      // jamais la dernière dent d'une pièce.
      const p = trouver(etat, action.repere);
      const d = action.cote;
      if (!p || !Number.isInteger(d) || d < 0 || d > 3 || !limable(p, d as Cote)) return null;
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

/**
 * Le rappel de reprise (bible, § 10) : la dernière ligne de la légende, puis les cases qui restent,
 * comme l'en-tête les écrit, sauf si cette ligne vient de les dire. Les textes de l'atelier sont
 * provisoires (#68).
 */
function rappel(etat: EtatAtelier): string[] {
  const ecrire = (cle: string, valeurs: Record<string, number> = {}) =>
    remplir(textes[cle] ?? cle, valeurs);
  const derniere = etat.legende.at(-1);
  const lignes = derniere ? [ecrireLigne(derniere, textes[derniere.cle] ?? derniere.cle)] : [];
  const { casesLibres } = analyser(etat);
  const cases =
    casesLibres > 0 ? ecrire("cases.valeur", { cases: casesLibres }) : ecrire("cases.aucune");
  if (!lignes[0]?.includes(cases)) lignes.push(cases);
  return lignes;
}

/** Applique un geste du joueur. Un geste impossible est ignoré sans erreur (fiche, § 3). */
function appliquer(etat: EtatAtelier, action: ActionAtelier, ctx: ContexteTick): void {
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
      actualiser(etat, ctx, avant, bougees, action.type);
    }
  }
}

/** Les objets d'en haut qui lèvent l'opacité dès l'arrivée (fiche, § 8). */
const FENETRES = "s1-double-ecran";
const CAHIER = "s2-registre";

/**
 * L'opacité (fiche, § 7) : le sens des choses. Les dents, le mouvement, le cadre, les cases libres, les
 * prix et le stock, dont dépend le seuil, ne se cachent jamais.
 * - Les noms : une pièce prend le sien quand un exemplaire tourne ; la roue, qui tourne dès l'arrivée,
 *   l'a toujours. Chaque note se lève avec le nom qu'elle dit : celles de la seconde série citent la
 *   pièce de la première dont elles ont le profil, dans le même ordre (« Profil du cliquet. »).
 * - Les valeurs, la production de base de chaque pièce, se lèvent au premier agrandissement.
 * - Le rôle de la lime : sa légende et le mot « Limer », au premier coup.
 * Le délai L(κ) les lève toutes ; les deux fenêtres lèvent les noms, le cahier à lignes tout.
 */
function opacite(): ElementOpaque[] {
  const notes = new Map(PIECES.map((d) => [d.id, [`piece.${d.id}.note`]]));
  for (let i = 0; i < 5; i++) {
    notes.set(PIECES[i]!.id, [...notes.get(PIECES[i]!.id)!, `piece.${PIECES[i + 5]!.id}.note`]);
    notes.set(PIECES[i + 5]!.id, []);
  }
  const noms: ElementOpaque[] = PIECES.filter((d) => d.id !== "roue").map((d) => ({
    id: `nom.${d.id}`,
    cles: [`piece.${d.id}`, ...notes.get(d.id)!],
    objets: [FENETRES, CAHIER],
  }));
  return [
    ...noms,
    { id: "valeurs", cles: ["nomenclature.base.valeur"], objets: [CAHIER] },
    { id: "lime", cles: ["lime", "main.limer", "noeud.lime"], objets: [CAHIER] },
  ];
}

export const logique: LogiqueStrate<EtatAtelier, ActionAtelier> = {
  numero: 3,
  versionEtat: 2,
  migrations: {
    // Version 2 (#80) : les objets d'en haut, sous « Hors plan » dans la nomenclature. Le premier tick
    // les relit.
    1: (etat) => ({ ...(etat as object), horsPlan: [] }),
  },
  // Un tour. Entre deux gestes, la production ne change pas ; le pas est coupé quand une gêne se montre.
  pasMax: TOUR,
  leviers: { principal: "ressort", secondaires: ["plan"] },
  horsLigne: { type: "standard" },

  etatInitial(ctx) {
    const etat = etatInitial();
    const effets = ctx.effets ?? EFFETS_NEUTRES;
    lireEffets(etat, effets);
    eveiller(etat);
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
    appliquer(etat, action, ctx);
    verifierSeuil(etat, ctx);
  },

  seuil: (etat) => ({ atteint: etat.seuilAtteintA !== null }),
  filet: (etat) => avanceeFissure(etat.temps, etat.seuilAtteintA),
  valeurConvertible: (etat) => etat.cumul,

  graphe,
  formules,
  opacite: opacite(),
  rappel,
  // Les objets nommés (descente-1-2.md, § 6) : l'inventaire les montre sous leur nom d'en bas. Le noyau
  // ne garde que ceux du joueur.
  nommes: () => NOMMES,

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

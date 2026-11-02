// Le lit : on attend (docs/strates/strate-7.md). Une crue toutes les trente secondes laisse une couche
// de limon, au bassin ou dans le creux qu'elle atteint (§ 3). Un seul geste : fermer un creux d'une
// levée, derrière laquelle l'eau se repose et laisse tout son limon. Le bassin plein à la rive, la
// descente vient seule, une crue plus tard, sous les yeux du joueur (§ 4 et § 10). L'absence se calcule
// crue par crue, sans plafond, et le bassin plein attend le retour. Le jeu y parle, en quelques
// phrases (§ 11).
import { EFFETS_NEUTRES } from "../../../noyau/logique/effets";
import type {
  ContexteTick,
  EffetsActifs,
  Formule,
  GrapheDependances,
  Journal,
  LogiqueStrate,
} from "../../../noyau/logique/types";
import { textes } from "../textes.fr";
import { etatInitial, type EtatLit, type IssueDette } from "./etat";
import {
  creuxActif,
  creuxPlein,
  CRUE,
  cruesA,
  DUREE_PHRASE,
  EPSILON,
  fermable,
  FORCE_GRANDE_CRUE,
  GRANDE_CRUE,
  LONGUE_ABSENCE,
  PASSE,
  REPOS,
  RIVE,
  tousPleins,
  VOLUME,
} from "./regles";

export type { Couche, EtatLit, IssueDette, Phrase } from "./etat";

/** Le seul geste : bâtir la levée sur un creux, ou l'y déplacer. */
export type ActionLit = { type: "fermer"; creux: number };

/** Les objets d'en haut agissent dès l'arrivée, sur l'eau retenue et sur l'absence (fiche, § 8). */
function lireEffets(etat: EtatLit, effets: EffetsActifs): void {
  etat.multiplicateurs.depot = effets.multiplicateur("depot");
  etat.multiplicateurs.patience = effets.multiplicateur("patience");
}

/** L'issue de la dette, que le journal a notée à son seuil : ses fosses sont dans la rive. */
function issueDette(journal: Readonly<Journal>): IssueDette | null {
  const issue = journal.strates.filter((e) => e.strate === 6).at(-1)?.seuil?.issue;
  return issue === "soldee" || issue === "defaut" ? issue : null;
}

/**
 * Une phrase du jeu, une seule fois. Elle paraît seule : si la précédente est encore là, elle attend
 * qu'elle s'efface (fiche, § 11). Elle laisse une trace pour le journal de session (#26).
 */
function dire(etat: EtatLit, cle: string, a: number, ctx: ContexteTick): void {
  if (etat.dites.some((p) => p.cle === cle)) return;
  const precedente = etat.dites.at(-1);
  etat.dites.push({ cle, a: precedente ? Math.max(a, precedente.a + DUREE_PHRASE) : a });
  ctx.emettre({ type: "trace", cle });
}

/**
 * Une crue, à l'instant `t`. Son limon va au creux atteint qui n'est pas plein, et il le prend tout,
 * jusqu'à le remplir ; sinon, au bassin, qui monte. L'eau retenue derrière la levée laisse tout son
 * limon, × `depot` ; pendant l'absence, tout le limon compte × `patience` ; la grande crue apporte
 * celui de six. Un creux plein enterre sa levée. Les phrases qu'une crue déclenche pendant l'absence
 * attendent le retour, dans `differees`.
 */
function passerCrue(etat: EtatLit, t: number, ctx: ContexteTick, differees: string[] | null): void {
  etat.crues += 1;
  const force = etat.crues === GRANDE_CRUE ? FORCE_GRANDE_CRUE : 1;
  const patience = differees ? etat.multiplicateurs.patience : 1;
  const k = creuxActif(etat);
  if (k !== null) {
    const retenue = etat.levee === k;
    const apport = (retenue ? REPOS * etat.multiplicateurs.depot : PASSE) * force * patience;
    const pris = Math.min(apport, VOLUME - etat.creux[k]!);
    etat.creux[k] = etat.creux[k]! + pris;
    etat.depose += pris;
    etat.couches.push({ crue: etat.crues, ou: k, epaisseur: pris, retenue });
    if (!creuxPlein(etat, k)) return;
    etat.creux[k] = VOLUME;
    if (retenue) etat.levee = null;
    ctx.emettre({ type: "trace", cle: "creux.plein", valeurs: { creux: k } });
    // Le dernier creux plein : il n'y a plus rien à fermer.
    if (tousPleins(etat)) {
      if (differees) differees.push("phrase.decider");
      else dire(etat, "phrase.decider", t, ctx);
    }
    return;
  }
  const monte = Math.min(PASSE * force * patience, RIVE - etat.niveau);
  etat.niveau += monte;
  etat.depose += monte;
  etat.couches.push({ crue: etat.crues, ou: "bassin", epaisseur: monte, retenue: false });
  if (etat.niveau < RIVE - EPSILON) return;
  // Le bassin est plein : le fleuve passe ailleurs. En présence du joueur, la descente part une crue
  // plus tard ; pendant l'absence, elle attend son retour.
  etat.niveau = RIVE;
  etat.pleinA = t;
  if (!differees) etat.descenteA = t + CRUE;
  ctx.emettre({ type: "trace", cle: "bassin.plein" });
}

/** Fait passer `duree` secondes : les crues qui viennent, une à une, tant que le bassin n'est pas plein. */
function avancer(
  etat: EtatLit,
  duree: number,
  ctx: ContexteTick,
  differees: string[] | null,
): void {
  const fin = etat.temps + duree;
  const venues = cruesA(fin);
  while (etat.pleinA === null && etat.crues < venues) {
    passerCrue(etat, (etat.crues + 1) * CRUE, ctx, differees);
  }
  etat.temps = fin;
}

/**
 * Le graphe de dépendances (fiche, § 7). La crue apporte l'eau ; l'eau qui passe et l'eau retenue
 * déposent le limon, et la levée retient l'eau. Le limon va au creux atteint, ou au bassin ; un creux
 * plein se fond dans le bassin. Le bassin monte sur l'échelle, jusqu'à la rive.
 */
function graphe(): GrapheDependances {
  const noeuds = [
    "crue",
    "passe",
    "retenue",
    "levee",
    "limon",
    "creux",
    "bassin",
    "echelle",
    "rive",
  ];
  const liens: [string, string][] = [
    ["crue", "passe"],
    ["crue", "retenue"],
    ["levee", "retenue"],
    ["passe", "limon"],
    ["retenue", "limon"],
    ["limon", "creux"],
    ["limon", "bassin"],
    ["creux", "bassin"],
    ["bassin", "echelle"],
    ["bassin", "rive"],
  ];
  return {
    noeuds: noeuds.map((id) => ({ id, cle: `noeud.${id}` })),
    liens: liens.map(([de, vers]) => ({ de, vers })),
  };
}

/** Les formules réelles (fiche, § 7), de la plus simple à la plus profonde, écrites en lettres. */
function formules(): Formule[] {
  return ["crue", "passe", "retenue", "creux", "rive", "limon"].map((noeud) => ({
    noeud,
    expression: textes[`formule.${noeud}`] ?? "",
  }));
}

export const logique: LogiqueStrate<EtatLit, ActionLit> = {
  numero: 7,
  versionEtat: 1,
  migrations: {},
  // Une crue. Le pas peut être plus long : les crues y passent une à une.
  pasMax: CRUE,
  leviers: { principal: "depot", secondaires: ["patience"] },
  // La sédimentation est du temps réel : l'absence compte en entier, sans plafond (fiche, § 10).
  horsLigne: { type: "propre" },

  etatInitial(ctx) {
    const etat = etatInitial(issueDette(ctx.journal));
    lireEffets(etat, ctx.effets ?? EFFETS_NEUTRES);
    return etat;
  },

  tick(etat, dt, ctx) {
    lireEffets(etat, ctx.effets);
    // De retour d'une absence pendant laquelle le bassin s'est rempli : la descente part une crue
    // après le retour, sous ses yeux.
    if (etat.pleinA !== null && etat.descenteA === null) etat.descenteA = etat.temps + CRUE;
    avancer(etat, dt, ctx, null);
  },

  agir(etat, action, ctx) {
    lireEffets(etat, ctx.effets);
    // Un geste impossible, comme fermer un creux plein, est ignoré sans erreur (fiche, § 3).
    if (action.type !== "fermer" || !fermable(etat, action.creux)) return;
    // Une levée déplacée d'un creux qui n'était pas plein : celle d'un creux plein a disparu.
    if (etat.levee !== null) etat.deplacements += 1;
    etat.levee = action.creux;
  },

  /**
   * L'absence (fiche, § 10) : les crues passent une à une, × `patience`. La levée bâtie avant de partir
   * tient ; quand son creux est plein, elle disparaît. Une descente qui n'est pas partie attend le
   * retour. Au retour d'une heure au moins, le jeu parle, puis dit ce qu'il aurait dit pendant
   * l'absence. Le lit n'écrit aucune ligne : le noyau ne montre pas de résumé.
   */
  absence(etat, duree, ctx) {
    lireEffets(etat, ctx.effets);
    if (etat.descenteA !== null && etat.temps < etat.descenteA - EPSILON) etat.descenteA = null;
    const differees: string[] = [];
    avancer(etat, duree, ctx, differees);
    if (duree >= LONGUE_ABSENCE) dire(etat, "phrase.retour", etat.temps, ctx);
    for (const cle of differees) dire(etat, cle, etat.temps, ctx);
    return { lignes: [] };
  },

  // Le lit n'a pas de seuil à franchir : la descente vient seule, une crue après le bassin plein.
  seuil: (etat) => ({
    atteint: etat.descenteA !== null && etat.temps >= etat.descenteA - EPSILON,
    automatique: true,
  }),
  valeurConvertible: (etat) => etat.depose,

  graphe,
  formules,

  /** Pour le journal de session : le niveau, les crues, la levée et les creux pleins. */
  releve(etat) {
    return {
      crues: etat.crues,
      niveau: etat.niveau,
      depose: etat.depose,
      levee: etat.levee,
      creuxPleins: etat.creux.filter((_, k) => creuxPlein(etat, k)).length,
      plein: etat.pleinA !== null,
    };
  },
};

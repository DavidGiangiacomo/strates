// La dette : on promet (docs/strates/strate-6.md). Une promesse rapporte tout de suite, à chaque crue,
// et se paie plus tard, à son terme (§ 3). À chaque crue, les échéances se paient sur la caisse, dans
// l'ordre du livre ; celle que la caisse ne couvre pas est reportée de deux crues, majorée d'un quart,
// et le report que la confiance ne peut plus porter fait tomber la dette en défaut. Cinq tablettes,
// la dernière toute due à la grande crue, que fixe la dernière promesse du livre (§ 4). L'absence se
// calcule ici : les échéances tombent à leur crue, sans plafond, et le rapport suit la règle commune,
// sauf pendant la grande crue, où l'absence compte en entier (§ 10).
import { EFFETS_NEUTRES } from "../../../noyau/logique/effets";
import type {
  ContexteTick,
  EffetsActifs,
  Formule,
  GrapheDependances,
  LogiqueStrate,
} from "../../../noyau/logique/types";
import { textes } from "../textes.fr";
import { etatInitial, type Echeance, type EtatDette } from "./etat";
import { remplir } from "./notation";
import {
  arrondir,
  confiance,
  couvre,
  CRUE,
  doit,
  EPSILON,
  EPSILON_TEMPS,
  EXEMPLAIRES,
  GRANDE_CRUE_DANS,
  LIVRE_MAX,
  majorationReport,
  MAJORATION_REPORT,
  montantDu,
  PLAFOND_ABSENCE,
  prixExemplaire,
  promisesFaites,
  PROMESSES,
  rapport,
  REPORT_CRUES,
  SORTES,
  TABLETTES,
  tabletteDe,
  TAUX_ABSENCE,
  TERMES,
  toutDu,
  toutePromise,
  type IdPromesse,
  type Terme,
} from "./regles";

export type { Echeance, EtatDette, IssueDette, LigneLivre } from "./etat";
export type { IdPromesse, Terme } from "./regles";

/** Les deux gestes : promettre, à un terme ; solder une échéance avant son terme. */
export type ActionDette =
  { type: "promettre"; promesse: IdPromesse; terme: Terme } | { type: "solder"; echeance: number };

/** Ce qu'une absence a fait tomber, pour le résumé du retour. */
interface Compte {
  honorees: number;
  reportees: number;
}

/** Une absence commencée à `debut` : le rapport y compte à 80 %, douze heures au plus. */
interface Absence {
  debut: number;
}

/** Écrit une ligne au livre, qui ne garde que les dernières. */
function ecrire(etat: EtatDette, cle: string, valeurs: Record<string, number> = {}): void {
  etat.livre.push({ cle, valeurs });
  etat.ecrites += 1;
  if (etat.livre.length > LIVRE_MAX) etat.livre.splice(0, etat.livre.length - LIVRE_MAX);
}

/**
 * Les gages (§ 8) : la confiance × m, et la majoration d'un report divisée par √m. Ils s'éveillent
 * quand la première tablette est brisée : la première se joue sans objet, et le choc d'arrivée reste
 * entier. Leurs autres effets, et l'éveil écrit au livre, sont l'affaire de #90.
 */
function lireEffets(etat: EtatDette, effets: EffetsActifs): void {
  const eveilles = etat.brisees >= 1;
  etat.multiplicateurs.confiance = eveilles ? effets.multiplicateur("confiance") : 1;
  etat.multiplicateurs.report = eveilles ? effets.multiplicateur("report") : 1;
}

/** L'échéance est honorée en entier : la confiance en grandit, et la valeur convertible. */
function honorer(etat: EtatDette, e: Echeance, cle: string, compte: Compte | null): void {
  etat.caisse = Math.max(0, etat.caisse - e.du);
  etat.honore += e.origine;
  etat.valeur += e.prix;
  etat.echeances.splice(etat.echeances.indexOf(e), 1);
  ecrire(etat, cle, { numero: e.numero, crue: e.crue ?? etat.crues, montant: e.du });
  if (compte) compte.honorees++;
}

/** Le défaut : le livre ne bouge plus. On ne promet plus, on ne paie plus (§ 3). */
function tomberEnDefaut(etat: EtatDette, ctx: ContexteTick): void {
  etat.issue = "defaut";
  etat.issueA = etat.temps;
  ecrire(etat, "livre.defaut", { crue: etat.crues });
  ctx.emettre({ type: "trace", cle: "dette.defaut", valeurs: { crue: etat.crues } });
}

/**
 * Une échéance que la caisse ne couvre pas, à la crue `c` : la caisse en paie ce qu'elle peut, et le
 * reste est reporté de deux crues, majoré d'un quart, sans dépasser la grande crue. Si ce report fait
 * passer ce qu'on doit au-dessus de la confiance, elle est échue : c'est le défaut.
 */
function reporter(
  etat: EtatDette,
  e: Echeance,
  c: number,
  ctx: ContexteTick,
  compte: Compte | null,
): void {
  const reste = e.du - etat.caisse;
  etat.caisse = 0;
  const majoration = majorationReport(etat);
  const reporte = arrondir(reste * (1 + majoration));
  if (doit(etat) - e.du + reporte > confiance(etat) * (1 + EPSILON)) {
    ecrire(etat, "livre.echu", { numero: e.numero, crue: c, montant: e.du });
    // Le reste demeure dû, à sa crue.
    e.du = arrondir(reste);
    tomberEnDefaut(etat, ctx);
    return;
  }
  e.du = reporte;
  e.crue = Math.min(c + REPORT_CRUES, etat.grandeCrue ?? Infinity);
  e.reports += 1;
  etat.reportees += 1;
  if (compte) compte.reportees++;
  ecrire(etat, majoration === MAJORATION_REPORT ? "livre.reporte" : "livre.reporteAdouci", {
    numero: e.numero,
    crue: e.crue,
    montant: e.du,
    majoration: Math.round(majoration * 1000) / 10,
  });
  ctx.emettre({
    type: "trace",
    cle: "echeance.reportee",
    valeurs: { numero: e.numero, crue: e.crue, reports: e.reports },
  });
}

/**
 * Les tablettes qui peuvent l'être se brisent, dans l'ordre : toutes leurs promesses faites et
 * honorées. La dernière reste entière jusqu'à la grande crue.
 */
function briser(etat: EtatDette, ctx: ContexteTick): void {
  while (etat.brisees < TABLETTES - 1) {
    const k = etat.brisees + 1;
    if (!toutePromise(etat, k)) return;
    if (etat.echeances.some((e) => tabletteDe(e.promesse) === k)) return;
    etat.brisees = k;
    ecrire(etat, "livre.brisee", { tablette: k });
    ctx.emettre({ type: "trace", cle: "tablette.brisee", valeurs: { tablette: k } });
  }
}

/**
 * La grande crue : tout ce qui reste dû tombe ensemble. Si la caisse le couvre, tout est honoré d'un
 * coup, et la dette est soldée ; sinon, rien ne l'est.
 */
function tomberGrandeCrue(etat: EtatDette, ctx: ContexteTick, compte: Compte | null): void {
  const total = toutDu(etat);
  if (!couvre(etat.caisse, total)) {
    tomberEnDefaut(etat, ctx);
    return;
  }
  for (const e of etat.echeances) {
    etat.honore += e.origine;
    etat.valeur += e.prix;
  }
  if (compte) compte.honorees += etat.echeances.length;
  etat.echeances = [];
  etat.caisse = Math.max(0, etat.caisse - total);
  etat.brisees = TABLETTES;
  etat.issue = "soldee";
  etat.issueA = etat.temps;
  ecrire(etat, "livre.soldee", { crue: etat.crues, montant: total });
  ctx.emettre({ type: "trace", cle: "dette.soldee", valeurs: { crue: etat.crues } });
}

/**
 * La crue `c` : ses échéances se paient sur la caisse, dans l'ordre du livre, ou sont reportées ;
 * puis les tablettes se brisent. À la grande crue, tout ce qui reste dû tombe ensemble.
 */
function passerCrue(etat: EtatDette, c: number, ctx: ContexteTick, compte: Compte | null): void {
  if (etat.grandeCrue === c) {
    tomberGrandeCrue(etat, ctx, compte);
    return;
  }
  for (const e of etat.echeances.filter((x) => x.crue === c)) {
    if (couvre(etat.caisse, e.du)) honorer(etat, e, "livre.honore", compte);
    else reporter(etat, e, c, ctx, compte);
    if (etat.issue !== null) return;
  }
  briser(etat, ctx);
}

/** La prochaine crue où quelque chose tombe ; Infinity s'il n'y en a pas, ou si la dette est finie. */
function prochaineCrue(etat: Readonly<EtatDette>): number {
  if (etat.issue !== null) return Infinity;
  let c = etat.grandeCrue ?? Infinity;
  for (const e of etat.echeances) if (e.crue !== null && e.crue < c) c = e.crue;
  return c;
}

/**
 * Le rapport de `t0` à `t1`, ajouté à la caisse au fil des secondes. En défaut, plus rien ne vient.
 * Pendant une absence, il compte à 80 %, douze heures au plus, sauf entre la dernière promesse et la
 * grande crue : tout s'y est joué à la dernière promesse, et l'absence compte en entier (§ 10).
 */
function crediter(etat: EtatDette, t0: number, t1: number, absence: Absence | null): void {
  if (t1 <= t0 || etat.issue === "defaut") return;
  let duree = t1 - t0;
  let taux = 1;
  const grandeCrueAttendue = etat.grandeCrue !== null && etat.issue === null;
  if (absence && !grandeCrueAttendue) {
    duree = Math.max(0, Math.min(t1, absence.debut + PLAFOND_ABSENCE) - t0);
    taux = TAUX_ABSENCE;
  }
  etat.caisse += (rapport(etat) * taux * duree) / CRUE;
}

/**
 * Fait passer `duree` secondes. Entre deux crues où quelque chose tombe, la caisse croît en ligne
 * droite : deux jours d'absence font 5 760 crues, mais quelques échéances seulement.
 */
function avancer(
  etat: EtatDette,
  duree: number,
  ctx: ContexteTick,
  absence: Absence | null,
  compte: Compte | null,
): void {
  const fin = etat.temps + duree;
  while (etat.issue === null) {
    const c = prochaineCrue(etat);
    if (!Number.isFinite(c) || c * CRUE > fin + EPSILON_TEMPS) break;
    crediter(etat, etat.temps, c * CRUE, absence);
    etat.temps = Math.max(etat.temps, c * CRUE);
    etat.crues = c;
    passerCrue(etat, c, ctx, compte);
  }
  crediter(etat, etat.temps, fin, absence);
  etat.temps = Math.max(etat.temps, fin);
  etat.crues = Math.max(etat.crues, Math.floor((etat.temps + EPSILON_TEMPS) / CRUE));
}

/**
 * Promettre, à un terme. La promesse est de la tablette ouverte, il en reste un exemplaire, et la
 * confiance la permet : ce qu'on doit déjà, plus elle, ne la dépasse pas. Dans la dernière tablette,
 * le terme est ignoré : tout y est dû à la grande crue, sans confiance. La tablette toute promise, la
 * suivante s'ouvre ; la dernière promesse du livre fixe la grande crue, douze crues plus tard.
 */
function promettre(etat: EtatDette, id: IdPromesse, terme: Terme, ctx: ContexteTick): void {
  const sorte = SORTES[id];
  if (!sorte || sorte.tablette !== etat.tablette) return;
  const n = etat.promises[id];
  if (n >= EXEMPLAIRES) return;
  const derniere = etat.tablette === TABLETTES;
  if (!derniere && !TERMES.includes(terme)) return;
  const prix = prixExemplaire(id, n);
  const du = montantDu(prix, derniere ? null : terme);
  if (!derniere && doit(etat) + du > confiance(etat) * (1 + EPSILON)) {
    const promesse = PROMESSES.indexOf(id);
    const derniereLigne = etat.livre.at(-1);
    // Un refus répété ne s'écrit qu'une fois.
    if (derniereLigne?.cle !== "livre.refus" || derniereLigne.valeurs.promesse !== promesse) {
      ecrire(etat, "livre.refus", { promesse });
    }
    ctx.emettre({ type: "trace", cle: "promesse.refusee", valeurs: { promesse } });
    return;
  }
  etat.promises[id] = n + 1;
  etat.echeances.push({
    numero: promisesFaites(etat),
    promesse: id,
    crue: derniere ? null : etat.crues + terme,
    du,
    origine: du,
    prix,
    reports: 0,
  });
  if (!toutePromise(etat, etat.tablette)) return;
  if (!derniere) {
    etat.tablette += 1;
    if (etat.tablette === TABLETTES) ecrire(etat, "livre.derniere");
    return;
  }
  // La grande crue : tout ce qui reste dû y tombe, même ce qui était dû plus tard.
  const grandeCrue = etat.crues + GRANDE_CRUE_DANS;
  etat.grandeCrue = grandeCrue;
  for (const e of etat.echeances) e.crue = Math.min(e.crue ?? grandeCrue, grandeCrue);
  ecrire(etat, "livre.grandeCrue", { crue: grandeCrue });
  ctx.emettre({ type: "trace", cle: "grandeCrue.fixee", valeurs: { crue: grandeCrue } });
}

/** Solder : honorer une échéance avant son terme, à son plein montant, sauf dans la dernière tablette. */
function solder(etat: EtatDette, numero: number, ctx: ContexteTick): void {
  const e = etat.echeances.find((x) => x.numero === numero);
  if (!e || tabletteDe(e.promesse) === TABLETTES || !couvre(etat.caisse, e.du)) return;
  honorer(etat, e, "livre.solde", null);
  briser(etat, ctx);
}

/** Le résumé du retour (§ 10) : « 14 échéances honorées, 2 reportées. » ; null si rien n'est tombé. */
function resumeAbsence({ honorees, reportees }: Compte): string | null {
  const t = (cle: string, n: number) =>
    remplir(textes[n === 1 ? `${cle}.une` : cle] ?? "", { n: String(n) });
  if (honorees === 0 && reportees === 0) return null;
  if (honorees === 0) return `${t("absence.seulesReportees", reportees)}.`;
  if (reportees === 0) return `${t("absence.honorees", honorees)}.`;
  return `${t("absence.honorees", honorees)}, ${t("absence.reportees", reportees)}.`;
}

/**
 * Le graphe de dépendances (§ 7). Les promesses alimentent le rapport, le rapport la caisse, et la
 * caisse honore les échéances, ou les reporte. Ce qui est honoré nourrit la confiance, qui ouvre les
 * promesses : c'est le cycle de la strate. Le terme et le report mènent aux échéances ; les tablettes
 * offrent les promesses, et la dernière mène à la grande crue.
 */
function graphe(): GrapheDependances {
  const noeuds = [
    "tablette",
    "promesse",
    "terme",
    "rapport",
    "caisse",
    "report",
    "echeance",
    "grandeCrue",
    "honore",
    "confiance",
  ];
  const liens: [string, string][] = [
    ["tablette", "promesse"],
    ["promesse", "rapport"],
    ["promesse", "echeance"],
    ["terme", "echeance"],
    ["rapport", "caisse"],
    ["caisse", "echeance"],
    ["caisse", "report"],
    ["report", "echeance"],
    ["tablette", "grandeCrue"],
    ["grandeCrue", "echeance"],
    ["echeance", "honore"],
    ["honore", "confiance"],
    ["confiance", "promesse"],
  ];
  return {
    noeuds: noeuds.map((id) => ({ id, cle: `noeud.${id}` })),
    liens: liens.map(([de, vers]) => ({ de, vers })),
  };
}

/** Les formules réelles (§ 7), de la plus simple à la plus profonde. */
function formules(): Formule[] {
  return ["promesse", "rapport", "terme", "confiance", "report", "grandeCrue", "honore"].map(
    (noeud) => ({ noeud, expression: textes[`formule.${noeud}`] ?? "" }),
  );
}

export const logique: LogiqueStrate<EtatDette, ActionDette> = {
  numero: 6,
  versionEtat: 1,
  migrations: {},
  // Une crue : le pas est coupé à chaque crue.
  pasMax: CRUE,
  // Les gages : la confiance, et la majoration des reports (§ 8).
  leviers: { principal: "confiance", secondaires: ["report"] },
  // Les échéances tombent pendant l'absence, sans plafond (§ 10).
  horsLigne: { type: "propre" },

  etatInitial(ctx) {
    const etat = etatInitial();
    lireEffets(etat, ctx.effets ?? EFFETS_NEUTRES);
    return etat;
  },

  tick(etat, dt, ctx) {
    lireEffets(etat, ctx.effets);
    avancer(etat, dt, ctx, null, null);
  },

  agir(etat, action, ctx) {
    lireEffets(etat, ctx.effets);
    // Soldée ou en défaut, il n'y a plus de geste. Un geste impossible est ignoré sans erreur.
    if (etat.issue !== null) return;
    if (action.type === "promettre") promettre(etat, action.promesse, action.terme, ctx);
    else if (action.type === "solder") solder(etat, action.echeance, ctx);
  },

  /**
   * L'absence (§ 10) : les échéances tombent à leur crue, honorées, reportées ou échues comme en jeu.
   * Le retour dit ce qui est tombé, et la fin, si elle est venue pendant l'absence.
   */
  absence(etat, duree, ctx) {
    lireEffets(etat, ctx.effets);
    const compte: Compte = { honorees: 0, reportees: 0 };
    const issue = etat.issue;
    avancer(etat, duree, ctx, { debut: etat.temps }, compte);
    const lignes: string[] = [];
    const resume = resumeAbsence(compte);
    if (resume) lignes.push(resume);
    if (etat.issue !== issue && etat.issue !== null) lignes.push(textes[`livre.${etat.issue}`]!);
    return { lignes };
  },

  // Atteint dès que l'issue est connue, soldée ou en défaut. Un défaut rend la descente possible, il
  // ne la déclenche pas : le joueur creuse quand il veut (§ 4).
  seuil: (etat) =>
    etat.issue === null ? { atteint: false } : { atteint: true, issue: etat.issue },
  valeurConvertible: (etat) => etat.valeur,

  graphe,
  formules,

  /** Pour le journal de session : la caisse, ce qu'on doit, la confiance, les tablettes, les reports. */
  releve(etat) {
    return {
      crues: etat.crues,
      caisse: Math.floor(etat.caisse),
      rapport: rapport(etat),
      doit: doit(etat),
      confiance: confiance(etat),
      tablette: etat.tablette,
      brisees: etat.brisees,
      promises: promisesFaites(etat),
      reportees: etat.reportees,
      grandeCrue: etat.grandeCrue,
      issue: etat.issue,
    };
  },
};

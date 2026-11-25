// La dette : on promet (docs/strates/strate-6.md). Une promesse rapporte tout de suite, à chaque crue,
// et se paie plus tard, à son terme (§ 3). À chaque crue, les échéances se paient sur la caisse, dans
// l'ordre du livre ; celle que la caisse ne couvre pas est reportée de deux crues, majorée d'un quart,
// et le report que la confiance ne peut plus porter fait tomber la dette en défaut. Cinq tablettes,
// la dernière toute due à la grande crue, que fixe la dernière promesse du livre (§ 4). L'absence se
// calcule ici : les échéances tombent à leur crue, sans plafond, et le rapport suit la règle commune,
// sauf pendant la grande crue, où l'absence compte en entier (§ 10).
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
import { etatInitial, type Echeance, type EtatDette } from "./etat";
import { crueOrdinale, ecrireLigne, formaterSceaux, remplir } from "./notation";
import {
  ACTES,
  arrondir,
  AU_PLUS_JUSTE,
  confiance,
  couvre,
  CRUE,
  DOIGT_QUI_MONTRE,
  doit,
  EPSILON,
  EPSILON_TEMPS,
  EXEMPLAIRES,
  GAGE_QUI_SOUFFLE,
  GRANDE_CRUE_DANS,
  LIVRE_MAX,
  majorationReport,
  MAJORATION_REPORT,
  montantDu,
  OPAQUES,
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

/**
 * Ce qu'un passage du temps fait tomber : pour le résumé du retour d'une absence, et pour la caisse
 * prévue, qui note la caisse juste avant chaque échéance, et avant la grande crue (`null`).
 */
interface Compte {
  honorees: number;
  reportees: number;
  avant?: (numero: number | null, caisse: number) => void;
}

/**
 * Les objets d'en haut qui peuvent agir ici : ceux du chœur, puissants, et ceux du réseau, utiles.
 * Ceux de l'atelier et d'au-dessus n'y sont plus que des ornements ou des cailloux.
 */
const D_EN_HAUT = CATALOGUE.filter((a) => a.origine < 6).map((a) => a.id);

/** Les objets du chœur, que la dette nomme : des gages, nommés par ce qu'ils valent (§ 8). */
const NOMMES = CATALOGUE.filter((a) => a.origine === 5).map((a) => a.id);

/** Une absence commencée à `debut` : le rapport y compte à 80 %, douze heures au plus. */
interface Absence {
  debut: number;
}

/** Écrit une ligne au livre, qui ne garde que les dernières. Elle peut citer un objet d'en haut. */
function ecrire(
  etat: EtatDette,
  cle: string,
  valeurs: Record<string, number> = {},
  objet?: string,
): void {
  etat.livre.push(objet === undefined ? { cle, valeurs } : { cle, valeurs, objet });
  etat.ecrites += 1;
  if (etat.livre.length > LIVRE_MAX) etat.livre.splice(0, etat.livre.length - LIVRE_MAX);
}

/**
 * Les gages (§ 8) : les objets d'en haut qui agissent ici, et leurs multiplicateurs, la confiance × m
 * et la majoration d'un report divisée par √m. Ils s'éveillent quand la première tablette est
 * brisée : la première se joue sans objet, et le choc d'arrivée reste entier. Leurs raccourcis, eux,
 * agissent dès l'arrivée, par l'opacité (`OPACITE`) ; leurs effets uniques viendront avec #118.
 */
function lireEffets(etat: EtatDette, effets: EffetsActifs): void {
  const objets = D_EN_HAUT.filter((id) => effets.niveau(id) !== null);
  // Une liste neuve à chaque tick redessinerait le livre pour rien.
  if (objets.join() !== etat.objets.join()) etat.objets = objets;
  const eveilles = etat.brisees >= 1;
  etat.multiplicateurs.confiance = eveilles ? effets.multiplicateur("confiance") : 1;
  etat.multiplicateurs.report = eveilles ? effets.multiplicateur("report") : 1;
}

/** L'échéance est honorée en entier : la confiance en grandit, et la valeur convertible. */
function honorer(etat: EtatDette, e: Echeance, cle: string, compte: Compte | null): void {
  const avant = confiance(etat);
  etat.caisse = Math.max(0, etat.caisse - e.du);
  etat.honore += e.origine;
  etat.valeur += e.prix;
  etat.echeances.splice(etat.echeances.indexOf(e), 1);
  ecrire(etat, cle, { numero: e.numero, crue: e.crue ?? etat.crues, montant: e.du });
  // Après un report, le livre dit ce que la confiance y gagne : le dû d'avant le report, et rien de
  // ce que le report a coûté (fiche, § 13, question 12).
  if (e.reports > 0) ecrire(etat, "livre.confiance", { montant: confiance(etat) - avant });
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
    // La première tablette brisée, les gages s'éveillent : le livre les reconnaît, un par ligne. La
    // confiance, elle, se comprend : sa valeur se lève (§ 7).
    if (k === 1) {
      ctx.emettre({ type: "levee", element: OPAQUES.confiance });
      for (const objet of etat.objets) {
        ecrire(etat, "livre.eveil", {}, objet);
        ctx.emettre({ type: "trace", cle: "gage.eveil", objet });
      }
    }
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
  // Les actes propres (§ 7) : soldée ; sans une échéance reportée de toute la strate ; et la grande
  // crue fixée au plus juste, puis honorée.
  ctx.emettre({ type: "acte", acte: ACTES.soldee });
  if (etat.reportees === 0) ctx.emettre({ type: "acte", acte: ACTES.sansUnReport });
  if (etat.auPlusJuste) ctx.emettre({ type: "acte", acte: ACTES.auPlusJuste });
}

/**
 * La crue `c` : ses échéances se paient sur la caisse, dans l'ordre du livre, ou sont reportées ;
 * puis les tablettes se brisent. À la grande crue, tout ce qui reste dû tombe ensemble.
 */
function passerCrue(etat: EtatDette, c: number, ctx: ContexteTick, compte: Compte | null): void {
  if (etat.grandeCrue === c) {
    compte?.avant?.(null, etat.caisse);
    tomberGrandeCrue(etat, ctx, compte);
    return;
  }
  for (const e of etat.echeances.filter((x) => x.crue === c)) {
    compte?.avant?.(e.numero, etat.caisse);
    // Une échéance reportée retombe : le report a été vu jusqu'au bout, et se lève (§ 7).
    if (e.reports > 0) ctx.emettre({ type: "levee", element: OPAQUES.report });
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

/** Pour prévoir sans rien signaler au noyau. */
const MUET: ContexteTick = { effets: EFFETS_NEUTRES, emettre: () => {} };

/**
 * La caisse prévue (§ 8) : à chaque échéance, la caisse juste avant qu'elle ne tombe, si rien n'est
 * promis ni soldé d'ici là. La prévision rejoue les règles du livre sur une copie : la caisse croît
 * au rapport présent, les échéances se paient dans l'ordre, et celle que la caisse ne couvre pas est
 * reportée, ce qui pèse sur les suivantes. Par numéro d'échéance, et `null` pour la grande crue une
 * fois fixée. L'état n'est pas touché ; la prévision s'arrête à l'issue qu'elle prévoit.
 */
export function caissesPrevues(etat: Readonly<EtatDette>): Map<number | null, number> {
  const prevues = new Map<number | null, number>();
  if (etat.issue !== null) return prevues;
  const copie: EtatDette = {
    ...etat,
    promises: { ...etat.promises },
    echeances: etat.echeances.map((e) => ({ ...e })),
    livre: [],
    objets: [],
    multiplicateurs: { ...etat.multiplicateurs },
  };
  let derniere = copie.grandeCrue ?? -Infinity;
  for (const e of copie.echeances) if (e.crue !== null) derniere = Math.max(derniere, e.crue);
  if (!Number.isFinite(derniere)) return prevues;
  const compte: Compte = {
    honorees: 0,
    reportees: 0,
    // Une échéance reportée retombe plus tard : seule compte la caisse de sa première crue.
    avant: (numero, caisse) => {
      if (!prevues.has(numero)) prevues.set(numero, caisse);
    },
  };
  avancer(copie, Math.max(0, derniere * CRUE - copie.temps), MUET, null, compte);
  return prevues;
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
    // Le premier refus fait comprendre ce que vaut la confiance (§ 7).
    ctx.emettre({ type: "levee", element: OPAQUES.confiance });
    return;
  }
  etat.promises[id] = n + 1;
  // La première promesse d'une sorte lève son nom ; la première à 6 ou 18 crues, les majorations.
  ctx.emettre({ type: "levee", element: OPAQUES.nom(id) });
  if (!derniere && terme !== 2) ctx.emettre({ type: "levee", element: OPAQUES.majorations });
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
  // Au plus juste : la caisse prévue couvre la grande crue avec moins de deux crues de rapport
  // d'avance (§ 7). Plus tôt, elle ne la couvre pas ; plus tard, le joueur a attendu pour rien.
  const parCrue = rapport(etat);
  const avance =
    (etat.caisse + parCrue * (grandeCrue - etat.temps / CRUE) - toutDu(etat)) / parCrue;
  etat.auPlusJuste = avance >= 0 && avance < AU_PLUS_JUSTE;
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

/**
 * Où en est le seuil, dans les mots que le livre a déjà écrits : la fin, la grande crue fixée, la
 * dernière tablette ouverte, ou, avant elle, la tablette ouverte.
 */
function ligneSeuil(etat: EtatDette): string {
  if (etat.issue !== null) return textes[`livre.${etat.issue}`] ?? "";
  if (etat.grandeCrue !== null) {
    return remplir(textes["livre.grandeCrue"] ?? "", { crue: crueOrdinale(etat.grandeCrue) });
  }
  if (etat.tablette === TABLETTES) return textes["livre.derniere"] ?? "";
  return remplir(textes["rappel.tablette"] ?? "", { n: String(etat.tablette) });
}

/**
 * Le rappel de reprise (bible, § 10) : la dernière ligne du livre, puis où en est le seuil, sauf si
 * cette ligne vient de le dire. Rien que le joueur n'ait déjà lu. Il l'écrit sans l'opacité : il ne
 * vient qu'après une demi-heure d'absence, comptée en entier, et le délai de levée a tout levé.
 */
function rappel(etat: EtatDette): string[] {
  const derniere = etat.livre.at(-1);
  const lignes = derniere
    ? [ecrireLigne(derniere, textes[derniere.cle] ?? "", (x) => formaterSceaux(x))]
    : [];
  const seuil = ligneSeuil(etat);
  if (!lignes.includes(seuil)) lignes.push(seuil);
  return lignes;
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

/**
 * L'opacité (§ 7) : les noms des promesses, sorte par sorte ; la valeur de la confiance, montrée en
 * barre sans échelle ; le report, écrit « Reporté. » sans sa crue ni sa majoration ; et les
 * majorations des termes, quand le montant dû, lui, est toujours écrit. Le doigt qui montre lève les
 * noms dès l'arrivée, le gage qui souffle les noms et la confiance. Le délai L(κ) les lève tous. La
 * vue demande la confiance et le report (`lisible`) pour ce qu'elle tait ; les autres textes couverts
 * deviennent des glyphes.
 */
const OPACITE: readonly ElementOpaque[] = [
  ...PROMESSES.map((id) => ({
    id: OPAQUES.nom(id),
    cles: [`promesse.${id}`],
    objets: [DOIGT_QUI_MONTRE, GAGE_QUI_SOUFFLE],
  })),
  {
    id: OPAQUES.confiance,
    cles: ["livre.confiance", "noeud.confiance"],
    objets: [GAGE_QUI_SOUFFLE],
  },
  { id: OPAQUES.report, cles: ["aide.report", "noeud.report"] },
  { id: OPAQUES.majorations, cles: ["aide.majorations", "noeud.terme"] },
];

/** Les formules réelles (§ 7), de la plus simple à la plus profonde. */
function formules(): Formule[] {
  return ["promesse", "rapport", "terme", "confiance", "report", "grandeCrue", "honore"].map(
    (noeud) => ({ noeud, expression: textes[`formule.${noeud}`] ?? "" }),
  );
}

export const logique: LogiqueStrate<EtatDette, ActionDette> = {
  numero: 6,
  versionEtat: 3,
  migrations: {
    // Version 2 (#90) : les objets d'en haut qui agissent ici. Le premier tick les relit.
    1: (etat) => ({ ...(etat as object), objets: [] }),
    // Version 3 (#104) : la grande crue au plus juste. Une grande crue déjà fixée ne la vaudra pas.
    2: (etat) => ({ ...(etat as object), auPlusJuste: false }),
  },
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
  // Le filet, comme partout : cinq minutes après l'issue, une fissure part de sa ligne vers « creuser »
  // (§ 4). L'absence compte : une dette tombée pendant deux jours la trouve déjà tracée au retour.
  filet: (etat) => avanceeFissure(etat.temps, etat.issueA),
  valeurConvertible: (etat) => etat.valeur,

  graphe,
  formules,
  opacite: OPACITE,

  // Les gages que la dette nomme, une fois éveillés : l'inventaire du noyau les montre sous leur nom
  // d'en bas, et ils le gardent plus bas (descente-1-2.md, § 6). Le noyau ne garde que ceux du joueur.
  nommes: (etat) => (etat.brisees >= 1 ? NOMMES : []),
  rappel,

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

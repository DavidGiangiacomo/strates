// Le réseau : on relie (docs/strates/strate-4.md). Rien ne produit seul : l'eau des sources ne rapporte
// que si elle atteint la ville, et elle n'y arrive que par où le réseau la laisse passer (§ 3). On
// relie les sources une à une ; chacune monte, double toutes les deux minutes et demie, et son eau
// bute de conduite en conduite. Un bassin qui reçoit plus que ses conduites n'emportent monte, puis
// déborde : c'est le signal, et le carnet nomme le goulot. Le seuil : les six sources à plein, et cinq
// minutes sans une source ni un bassin qui monte, en présence du joueur (§ 4). L'absence se calcule
// ici : l'eau coule à 80 %, douze heures au plus, mais les cinq minutes attendent (§ 10).
import { EFFETS_NEUTRES } from "../../../noyau/logique/effets";
import type {
  ContexteTick,
  EffetsActifs,
  Formule,
  GrapheDependances,
  LogiqueStrate,
} from "../../../noyau/logique/types";
import { textes } from "../textes.fr";
import { etatInitial, type Conduite, type EtatReseau, type LigneCarnet } from "./etat";
import { formaterMuids, formaterPouces, remplir } from "./notation";
import {
  capacite,
  CONTENANCE,
  DOUBLEMENT,
  DOUBLEMENTS,
  EPSILON,
  GRANDE_CONDUITE,
  IDS_SOURCES,
  MONTEE,
  ORDRE,
  OUVERTURES,
  partager,
  PLAFOND_ABSENCE,
  prix,
  sourceDe,
  SOURCE_DU_BASSIN,
  SOURCES,
  TAUX_ABSENCE,
  TENUE,
  trace,
  type IdBassin,
  type IdNoeud,
  type IdSource,
  type Ouverture,
} from "./regles";

export type { Conduite, EtatReseau, LigneCarnet } from "./etat";
export type { IdBassin, IdNoeud, IdSource, Ouverture, Trace } from "./regles";

/** Les trois gestes : relier un tracé, élargir une conduite d'un calibre, régler une vanne. */
export type ActionReseau =
  | { type: "relier"; trace: number }
  | { type: "elargir"; trace: number }
  | { type: "vanne"; trace: number; ouverture: Ouverture };

/** Les lignes du carnet que la vue garde. */
export const CARNET_MAX = 12;

/** Le rang d'un nœud dans le carnet : la vue le nomme par `noeud.<id>`. */
export const NOEUDS: readonly IdNoeud[] = [...ORDRE];

// ——— Ce que la vue et les joueurs lisent

/** Le débit d'une source à cet instant, en pouces : 0 si elle n'est pas reliée. */
export function debitSource(etat: Readonly<EtatReseau>, k: IdSource): number {
  const t0 = etat.reliees[k];
  if (t0 === undefined) return 0;
  const x = (etat.temps - t0) / DOUBLEMENT - DOUBLEMENTS;
  return SOURCES[k] * etat.multiplicateurs.debit * 2 ** Math.min(0, x);
}

/** La source est-elle à plein : reliée depuis vingt-cinq minutes ? */
export function aPlein(etat: Readonly<EtatReseau>, k: IdSource): boolean {
  const t0 = etat.reliees[k];
  return t0 !== undefined && etat.temps - t0 >= MONTEE - EPSILON;
}

export function conduite(etat: Readonly<EtatReseau>, numero: number): Conduite | undefined {
  return etat.conduites.find((c) => c.trace === numero);
}

/** Les conduites posées qui partent d'un nœud. */
export function sortiesDe(etat: Readonly<EtatReseau>, noeud: IdNoeud): Conduite[] {
  return etat.conduites.filter((c) => trace(c.trace)!.de === noeud);
}

/** Ce qu'une conduite peut porter, vanne comprise, en pouces. */
export function porte(c: Readonly<Conduite>): number {
  return capacite(c.calibre) * c.vanne;
}

/** Ce que les conduites d'un nœud peuvent emporter, en pouces. */
export function emporte(etat: Readonly<EtatReseau>, noeud: IdNoeud): number {
  return sortiesDe(etat, noeud).reduce((s, c) => s + porte(c), 0);
}

/** Ce qu'un nœud tient au-dessus de son niveau de service, en muids : deux minutes de ses conduites. */
export function contenance(etat: Readonly<EtatReseau>, noeud: IdNoeud): number {
  return CONTENANCE * emporte(etat, noeud);
}

/**
 * Le nœud a-t-il paru sur le plan ? La source k paraît quand la précédente est reliée ; un bassin,
 * avec la première source qui s'y jette ; la ville est toujours là.
 */
export function paru(etat: Readonly<EtatReseau>, noeud: IdNoeud): boolean {
  if (noeud === "ville") return true;
  const k = sourceDe(noeud) ?? SOURCE_DU_BASSIN[noeud as IdBassin];
  return k === 1 || etat.reliees[(k - 1) as IdSource] !== undefined;
}

/** Peut-on relier ce tracé ? Il n'est pas posé, et ses deux bouts ont paru. Le prix vient à part. */
export function reliable(etat: Readonly<EtatReseau>, numero: number): boolean {
  const t = trace(numero);
  return !!t && !conduite(etat, numero) && paru(etat, t.de) && paru(etat, t.vers);
}

/** Le prix de la prochaine opération sur ce tracé : le poser, ou l'élargir ; null s'il n'y en a plus. */
export function prixDe(etat: Readonly<EtatReseau>, numero: number): number | null {
  const t = trace(numero);
  if (!t) return null;
  const c = conduite(etat, numero);
  if (!c) return prix(t, t.pose, etat.multiplicateurs.pose);
  return c.calibre < t.max ? prix(t, c.calibre + 1, etat.multiplicateurs.pose) : null;
}

/** Un bassin est en service quand une conduite posée le touche. */
export function enService(etat: Readonly<EtatReseau>, noeud: IdNoeud): boolean {
  if (noeud === "ville") return true;
  const k = sourceDe(noeud);
  if (k !== null) return etat.reliees[k] !== undefined;
  return etat.conduites.some((c) => {
    const t = trace(c.trace)!;
    return t.de === noeud || t.vers === noeud;
  });
}

/** Les sources et bassins qui montent : chacun est en amont d'un goulot. */
export function goulots(etat: Readonly<EtatReseau>): IdNoeud[] {
  return NOEUDS.filter((n) => etat.montees[n] !== undefined);
}

// ——— Le carnet

/** Écrit une ligne au carnet, qui ne garde que les dernières. */
function ecrire(etat: EtatReseau, cle: string, valeurs: Record<string, number> = {}): void {
  etat.carnet.push({ cle, valeurs });
  etat.ecrites += 1;
  if (etat.carnet.length > CARNET_MAX) etat.carnet.splice(0, etat.carnet.length - CARNET_MAX);
}

const rang = (n: IdNoeud) => NOEUDS.indexOf(n);

/**
 * Les objets d'en haut (§ 8) : le débit de toutes les sources × m, et le prix des conduites ÷ m. Ils
 * s'éveillent à la première source reliée : l'arrivée est la même avec ou sans objets. Leurs autres
 * effets, et l'éveil écrit au carnet, sont l'affaire de #84.
 */
function lireEffets(etat: EtatReseau, effets: EffetsActifs): void {
  const eveilles = IDS_SOURCES.some((k) => k > 1 && etat.reliees[k] !== undefined);
  etat.multiplicateurs.debit = eveilles ? effets.multiplicateur("debit") : 1;
  etat.multiplicateurs.pose = eveilles ? effets.multiplicateur("pose") : 1;
}

/**
 * Le signal (§ 3) : le déversoir coule. Le carnet le note, puis nomme les conduites pleines sous le
 * nœud, « au plus large » si elles ne s'élargissent plus. Un nœud sans conduite déborde sans goulot
 * à nommer : il lui manque une sortie.
 */
function signaler(etat: EtatReseau, n: IdNoeud, ctx: ContexteTick): void {
  etat.signales.push(n);
  ecrire(etat, "carnet.deborde", { noeud: rang(n) });
  for (const c of sortiesDe(etat, n)) {
    const auPlusLarge = c.calibre >= trace(c.trace)!.max;
    ecrire(etat, auPlusLarge ? "carnet.goulotAuPlusLarge" : "carnet.goulot", {
      conduite: c.trace,
    });
  }
  ctx.emettre({ type: "trace", cle: "goulot.signale", valeurs: { noeud: rang(n) } });
}

/**
 * La montée d'un nœud, d'un instant au suivant : elle commence, déborde, ou cesse. Un nœud qui cesse
 * de monter avant le signal compte un goulot défait à temps (l'acte du § 7 viendra avec #98).
 */
function suivreMontee(
  etat: EtatReseau,
  n: IdNoeud,
  monte: boolean,
  deborde: boolean,
  ctx: ContexteTick,
): void {
  if (monte) {
    if (etat.montees[n] === undefined) {
      etat.montees[n] = etat.temps;
      etat.redescendent = etat.redescendent.filter((x) => x !== n);
      ecrire(etat, "carnet.monte", { noeud: rang(n) });
    }
    if (deborde && !etat.signales.includes(n)) signaler(etat, n, ctx);
    return;
  }
  if (etat.montees[n] === undefined) return;
  if (!etat.signales.includes(n)) etat.avantSignal += 1;
  delete etat.montees[n];
  etat.signales = etat.signales.filter((x) => x !== n);
  etat.redescendent.push(n);
}

/** Ce qu'une absence a vu, pour le résumé du retour. */
interface Vu {
  debordes: Set<IdNoeud>;
}

/**
 * L'eau, pendant `dt` secondes, d'amont en aval (§ 3). Chaque nœud reçoit ce qui lui vient, y ajoute
 * ce qui l'attend, et le partage à parts égales entre ses conduites, sans dépasser ce qu'elles
 * portent. Ce qui reste attend au-dessus du niveau de service, jusqu'à deux minutes de ses conduites ;
 * au-delà, le déversoir coule. La ville reçoit, et la caisse avec elle. En présence du joueur, les
 * minutes sans goulot se comptent ; pendant l'absence, elles attendent, sauf si un goulot paraît.
 */
function couler(
  etat: EtatReseau,
  dt: number,
  ctx: ContexteTick,
  presence: boolean,
  vu: Vu | null,
): void {
  etat.temps += dt;
  const avaitUnGoulot = goulots(etat).length > 0;
  const minutes = dt / 60;
  const recus: Partial<Record<IdNoeud, number>> = {};
  for (const k of IDS_SOURCES) recus[`source${k}`] = debitSource(etat, k);
  const debits: Record<number, number> = {};
  let goulot = false;
  for (const n of ORDRE) {
    const recoit = recus[n] ?? 0;
    if (n === "ville") {
      etat.recu += recoit * minutes;
      etat.caisse += recoit * minutes;
      etat.recoit = recoit;
      continue;
    }
    const sorties = sortiesDe(etat, n);
    const capacites = sorties.map(porte);
    const total = capacites.reduce((s, c) => s + c, 0);
    const dispo = (etat.attente[n] ?? 0) + recoit * minutes;
    const part = Math.min(total * minutes, dispo);
    const parts = partager(capacites, part / minutes);
    sorties.forEach((c, i) => {
      debits[c.trace] = parts[i]!;
      const vers = trace(c.trace)!.vers;
      recus[vers] = (recus[vers] ?? 0) + parts[i]!;
    });
    let reste = dispo - part;
    const contient = CONTENANCE * total;
    let deborde = false;
    if (reste > contient * (1 + EPSILON) + EPSILON) {
      etat.perdu += reste - contient;
      reste = contient;
      deborde = true;
    }
    if (reste > EPSILON * Math.max(1, contient)) etat.attente[n] = reste;
    else delete etat.attente[n];
    const monte = recoit > total * (1 + EPSILON) + EPSILON;
    suivreMontee(etat, n, monte, deborde, ctx);
    if (monte) goulot = true;
    if (deborde && vu) vu.debordes.add(n);
    // Redescendu à son niveau de service : stable.
    if (!monte && etat.attente[n] === undefined && etat.redescendent.includes(n)) {
      etat.redescendent = etat.redescendent.filter((x) => x !== n);
      ecrire(etat, "carnet.stable", { noeud: rang(n) });
    }
  }
  etat.debits = debits;

  // Les sources à plein, une fois.
  for (const k of IDS_SOURCES) {
    if (!etat.aPlein.includes(k) && aPlein(etat, k)) {
      etat.aPlein.push(k);
      ecrire(etat, "carnet.aPlein", { source: k, debit: debitSource(etat, k) });
      ctx.emettre({ type: "trace", cle: "source.aPlein", valeurs: { source: k } });
    }
  }

  // La citerne en service : son eau passe. Pleine, elle bourdonne.
  if (etat.citerne && !etat.chante) {
    const passe = sortiesDe(etat, "citerne").some((c) => (etat.debits[c.trace] ?? 0) > 0);
    if (passe) {
      etat.chante = true;
      ecrire(etat, "carnet.citerne");
      ctx.emettre({ type: "trace", cle: "citerne.pleine" });
    }
  }

  // Plus rien ne monte : « Aucun goulot. »
  if (goulot) {
    etat.sansGoulotDepuis = null;
    etat.tenue = 0;
  } else if (avaitUnGoulot) {
    etat.sansGoulotDepuis = etat.temps;
    ecrire(etat, "carnet.aucun");
  }

  // Les cinq minutes du seuil : en présence du joueur, les six sources à plein, sans un goulot.
  if (!goulot && presence && IDS_SOURCES.every((k) => aPlein(etat, k))) {
    const avant = etat.tenue;
    etat.tenue = Math.min(TENUE, etat.tenue + dt);
    for (let m = Math.floor(avant / 60) + 1; m <= Math.floor(etat.tenue / 60 + EPSILON); m++) {
      ecrire(etat, m === 1 ? "carnet.depuisUne" : "carnet.depuis", { minutes: m });
    }
    if (etat.seuilA === null && etat.tenue >= TENUE - EPSILON) {
      etat.seuilA = etat.temps;
      ctx.emettre({ type: "trace", cle: "seuil.atteint" });
    }
  } else if (!goulot && !IDS_SOURCES.every((k) => aPlein(etat, k))) {
    etat.tenue = 0;
  }
}

/**
 * Relier (§ 3, « Les gestes ») : poser la conduite d'un tracé dont les deux bouts ont paru, à son
 * calibre de pose. Pour une source, c'est la relier : sa montée commence. Le quatrième bassin se
 * révèle à la première conduite qu'on y pose : c'est une salle voûtée, la citerne.
 */
function relier(etat: EtatReseau, numero: number, ctx: ContexteTick): void {
  if (!reliable(etat, numero)) return;
  const t = trace(numero)!;
  const p = prix(t, t.pose, etat.multiplicateurs.pose);
  if (etat.caisse + EPSILON < p) return;
  etat.caisse = Math.max(0, etat.caisse - p);
  etat.conduites.push({ trace: numero, calibre: t.pose, vanne: 1 });
  etat.conduites.sort((a, b) => a.trace - b.trace);
  const k = sourceDe(t.de);
  if (k !== null) {
    etat.reliees[k] = etat.temps;
    ecrire(etat, "carnet.reliee", { source: k });
    ctx.emettre({ type: "trace", cle: "source.reliee", valeurs: { source: k } });
  } else {
    ecrire(etat, numero === GRANDE_CONDUITE ? "carnet.grandeConduite" : "carnet.posee", {
      conduite: numero,
    });
    ctx.emettre({ type: "trace", cle: "conduite.posee", valeurs: { conduite: numero } });
  }
  if (!etat.citerne && (t.de === "citerne" || t.vers === "citerne")) {
    etat.citerne = true;
    ecrire(etat, "carnet.voutee");
    ctx.emettre({ type: "trace", cle: "citerne.trouvee" });
  }
}

/** Élargir une conduite d'un calibre, jusqu'au plus fort de son tracé. */
function elargir(etat: EtatReseau, numero: number): void {
  const c = conduite(etat, numero);
  const t = trace(numero);
  if (!c || !t || c.calibre >= t.max) return;
  const p = prix(t, c.calibre + 1, etat.multiplicateurs.pose);
  if (etat.caisse + EPSILON < p) return;
  etat.caisse = Math.max(0, etat.caisse - p);
  c.calibre += 1;
  ecrire(etat, c.calibre >= t.max ? "carnet.auPlusLarge" : "carnet.elargie", {
    conduite: numero,
    debit: capacite(c.calibre),
  });
}

/** Régler une vanne, au quart. Cela ne coûte rien. */
function regler(etat: EtatReseau, numero: number, ouverture: Ouverture): void {
  const c = conduite(etat, numero);
  if (!c || !OUVERTURES.includes(ouverture) || c.vanne === ouverture) return;
  c.vanne = ouverture;
  ecrire(etat, "carnet.vanne", { conduite: numero, quarts: ouverture * 4 });
}

/**
 * Le graphe de dépendances (§ 7) : il ne montre que ce qui est relié. Les sources reliées alimentent
 * leurs bassins, les raccourcis les bassins voisins, et les routes la ville. Les tracés libres n'y
 * sont pas, et rien n'y dit où l'eau bute : le graphe ne résout pas le réseau.
 */
function graphe(etat: EtatReseau): GrapheDependances {
  const noeuds = NOEUDS.filter((n) => enService(etat, n));
  return {
    noeuds: noeuds.map((id) => ({ id, cle: `noeud.${id}` })),
    liens: etat.conduites.map((c) => {
      const t = trace(c.trace)!;
      return { de: t.de, vers: t.vers };
    }),
  };
}

/** Les formules réelles (§ 7), de la plus simple à la plus profonde, chacune sur son nœud. */
function formules(): Formule[] {
  const attaches: [string, string][] = [
    ["pouce", "ville"],
    ["calibre", "bas"],
    ["montee", "source2"],
    ["partage", "bas"],
    ["vanne", "bas"],
    ["contenance", "bas"],
    ["prix", "ville"],
    ["valeur", "ville"],
  ];
  return attaches.map(([cle, noeud]) => ({ noeud, expression: textes[`formule.${cle}`] ?? "" }));
}

/** Le résumé du retour (§ 10) : ce que la ville a reçu, et les bassins qui ont débordé. */
function resumeAbsence(etat: EtatReseau, recuAvant: number, vu: Vu): string[] {
  const lignes: string[] = [];
  const recu = etat.recu - recuAvant;
  if (recu >= 1) lignes.push(remplir(textes["absence.recu"]!, { muids: formaterMuids(recu) }));
  for (const n of NOEUDS.filter((x) => vu.debordes.has(x))) {
    lignes.push(remplir(textes["absence.deborde"]!, { noeud: nomDe(etat, n) }));
  }
  return lignes;
}

/** La clé de texte d'une ligne du carnet : une vanne a la sienne pour chaque ouverture. */
export function cleDeLigne(l: LigneCarnet): string {
  return l.cle === "carnet.vanne" ? `carnet.vanne.${l.valeurs.quarts}` : l.cle;
}

/** Une ligne du carnet, écrite avec ce modèle : ses nœuds par leur nom, ses débits en pouces. */
export function ecrireLigne(etat: Readonly<EtatReseau>, l: LigneCarnet, modele: string): string {
  const v = l.valeurs;
  const valeurs: Record<string, string> = {};
  if (v.noeud !== undefined) valeurs.noeud = nomDe(etat, NOEUDS[v.noeud]!);
  if (v.source !== undefined) valeurs.source = String(v.source);
  if (v.conduite !== undefined) valeurs.conduite = String(v.conduite);
  if (v.debit !== undefined) valeurs.debit = formaterPouces(v.debit);
  if (v.minutes !== undefined) valeurs.minutes = String(v.minutes);
  return remplir(modele, valeurs);
}

/**
 * Où en est le réseau, dans les mots que le carnet a déjà écrits : le nœud qui monte, le plus près de
 * la ville ; les six sources à plein, les minutes sans goulot ; sinon, « Aucun goulot. » s'il a été
 * écrit. Rien d'autre : le carnet ne parle de son seuil qu'en comptant ces minutes.
 */
function ligneEtat(etat: EtatReseau): string | null {
  const montent = goulots(etat);
  if (montent.length > 0) {
    return remplir(textes["carnet.monte"]!, { noeud: nomDe(etat, montent.at(-1)!) });
  }
  if (IDS_SOURCES.every((k) => aPlein(etat, k))) {
    const m = Math.floor(etat.tenue / 60);
    if (m === 1) return textes["carnet.depuisUne"]!;
    if (m > 1) return remplir(textes["carnet.depuis"]!, { minutes: String(m) });
  }
  return etat.sansGoulotDepuis !== null ? textes["carnet.aucun"]! : null;
}

/**
 * Le rappel de reprise (bible, § 10) : la dernière ligne du carnet, puis où en est le réseau, sauf si
 * cette ligne vient de le dire. Rien que le joueur n'ait déjà lu, et pas de « vous ».
 */
function rappel(etat: EtatReseau): string[] {
  const derniere = etat.carnet.at(-1);
  const lignes = derniere ? [ecrireLigne(etat, derniere, textes[cleDeLigne(derniere)] ?? "")] : [];
  const ou = ligneEtat(etat);
  if (ou && !lignes.includes(ou)) lignes.push(ou);
  return lignes;
}

/** Le nom d'un nœud, tel que le carnet l'écrit : le quatrième bassin se nomme citerne une fois révélé. */
export function nomDe(etat: Readonly<EtatReseau>, n: IdNoeud): string {
  if (n === "citerne" && !etat.citerne) return textes["noeud.quatrieme"]!;
  return textes[`noeud.${n}`]!;
}

export const logique: LogiqueStrate<EtatReseau, ActionReseau> = {
  numero: 4,
  versionEtat: 1,
  migrations: {},
  pasMax: 1,
  // Le débit des sources, et le prix des conduites (§ 8).
  leviers: { principal: "debit", secondaires: ["pose"] },
  // L'eau coule pendant l'absence, mais les cinq minutes attendent (§ 10).
  horsLigne: { type: "propre" },

  etatInitial(ctx) {
    const etat = etatInitial();
    lireEffets(etat, ctx.effets ?? EFFETS_NEUTRES);
    return etat;
  },

  tick(etat, dt, ctx) {
    lireEffets(etat, ctx.effets);
    if (dt > 0) couler(etat, dt, ctx, true, null);
  },

  agir(etat, action, ctx) {
    lireEffets(etat, ctx.effets);
    // Un geste impossible est ignoré sans erreur : un tracé inconnu, déjà posé, ou trop cher.
    if (action.type === "relier") relier(etat, action.trace, ctx);
    else if (action.type === "elargir") elargir(etat, action.trace);
    else if (action.type === "vanne") regler(etat, action.trace, action.ouverture);
  },

  /**
   * L'absence (§ 10) : l'eau coule sur 80 % de l'absence, douze heures au plus, par pas d'une
   * seconde. Les sources reliées montent, les bassins débordent si un goulot les attend. La tenue ne
   * s'écoule pas : elle attend le retour, sauf si un goulot paraît.
   */
  absence(etat, duree, ctx) {
    lireEffets(etat, ctx.effets);
    const recuAvant = etat.recu;
    const vu: Vu = { debordes: new Set() };
    let reste = Math.min(duree, PLAFOND_ABSENCE) * TAUX_ABSENCE;
    while (reste > EPSILON) {
      const dt = Math.min(1, reste);
      couler(etat, dt, ctx, false, vu);
      reste -= dt;
    }
    return { lignes: resumeAbsence(etat, recuAvant, vu) };
  },

  seuil: (etat) => ({ atteint: etat.seuilA !== null }),
  valeurConvertible: (etat) => etat.recu,

  graphe,
  formules,
  rappel,

  /** Pour le journal de session : la caisse, ce que reçoit la ville, les sources, les goulots. */
  releve(etat) {
    return {
      caisse: Math.floor(etat.caisse),
      recoit: Math.floor(etat.recoit),
      recu: Math.floor(etat.recu),
      perdu: Math.floor(etat.perdu),
      sources: IDS_SOURCES.filter((k) => etat.reliees[k] !== undefined).length,
      conduites: etat.conduites.length,
      goulots: goulots(etat).length,
      tenue: Math.floor(etat.tenue),
    };
  },
};

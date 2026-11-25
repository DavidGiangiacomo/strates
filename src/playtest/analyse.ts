// L'analyse d'un journal de session (docs/playtest-mvp.md, § 5 et § 9) : les gestes du protocole, la
// compréhension dans les actes, et les temps de la descente. Elle ne remplit pas la fiche seule :
// l'observateur y ajoute ce qui ne se lit pas dans le journal (les mots, la note, les signes).
// Pour la recette du lit (docs/strates/strate-7-recette.md, § 5) : l'attente, les départs et les
// retours, les gestes, les phrases du jeu et le bassin plein.
// Ce module n'importe que des types : Node peut l'exécuter tel quel (analyser.mjs).
import type { EvenementJournal, JournalExporte } from "./journal";
import type { Releve } from "../noyau/logique/types";

/** Les gestes de « jouer comme en strate 1 » (docs/playtest-mvp.md, § 5.1). */
export interface Gestes {
  /** G1 : au moins un achat pendant l'automne de l'an 1, et la réserve sous la marque au premier jour de l'hiver. */
  g1: boolean;
  /** G2 : au moins 10 familles installées pendant la première minute. */
  g2: boolean;
  /** G3 : au moins 3 clics sur « Glaner » pendant le premier hiver. */
  g3: boolean;
  achatsAutomne: number;
  /** Au premier jour de l'hiver de l'an 1 ; null si les caves s'arrêtent avant. */
  entreeHiver: { reserve: number; marque: number } | null;
  installationsPremiereMinute: number;
  glanerHiver: number;
}

export interface AnalyseSession {
  testeur: string;
  version: string;
  surface: {
    /** Le seuil, en minutes de jeu de la surface ; null s'il n'est pas atteint. */
    seuil: number | null;
    /** Du seuil au premier clic sur « creuser » qui ouvre la fouille, en secondes réelles. */
    creuserApresSeuil: number | null;
    /** Clics sur « creuser » qui ont buté sur le sol, avant le seuil. */
    resistances: number;
    /** La fissure du filet a-t-elle paru avant la fouille ? */
    fissure: boolean;
    /** Les ouvertures de l'aide de la surface. */
    aide: number;
  };
  fouille: {
    ouvertures: number;
    rebouchages: number;
    /** Le temps passé sur l'écran de fouille, en secondes réelles. */
    duree: number;
    /** Le choix est-il resté celui de la présélection ? */
    preselectionGardee: boolean;
    emportes: string[];
  } | null;
  caves: {
    gestes: Gestes;
    /** Au moins deux des trois gestes (§ 5.1). */
    commeStrate1: boolean;
    /** G1 refait en l'an 2 : la compréhension, dans les actes, n'y est pas (§ 5.2). */
    g1An2: boolean;
    /** En secondes de jeu des caves : la première disette, puis le premier bilan. */
    premiereRupture: number | null;
    premierBilan: number | null;
    /** Le temps joué dans les caves, en secondes de jeu. */
    duree: number;
    /** Les ouvertures de l'aide des caves. */
    aide: number;
  } | null;
  lit: AnalyseLit | null;
}

/** Ce que le journal dit du lit (docs/strates/strate-7-recette.md, § 5). */
export interface AnalyseLit {
  /** Les ouvertures du jeu dans le lit, la première comprise. */
  seances: number;
  /** Les départs : les absences d'au moins cinq minutes, chacune en minutes, dans l'ordre. */
  departs: number[];
  /** Le temps passé devant le lit avant le premier départ, en minutes ; null s'il n'est jamais parti. */
  avantPremierDepart: number | null;
  /** Le temps passé devant le lit, en minutes : le temps du lit, moins les absences. */
  presence: number;
  /** Le temps du lit, absences comprises, en minutes. */
  duree: number;
  /** Les levées bâties ou déplacées. */
  levees: number;
  /** Les ouvertures de l'aide du lit. */
  aide: number;
  /** Les phrases du jeu dites, par leur clé, dans l'ordre. */
  phrases: string[];
  /** Le bassin plein, en minutes du lit ; null s'il ne l'est pas. */
  plein: number | null;
  /** Le joueur était-il là quand le bassin s'est rempli ? null s'il ne l'est pas. */
  pleinEnPresence: boolean | null;
  /** Le seuil : la descente qui vient seule, une crue après le bassin plein ou après le retour. */
  seuil: number | null;
}

/** Une absence d'au moins cinq minutes : le joueur est parti, puis revenu. */
const DEPART = 5 * 60;

const MINUTE = 60;
const achats = (r: Releve | null) =>
  r
    ? ["installees", "outils", "greniers", "silos", "caves", "cavesProfondes"].reduce(
        (total, cle) => total + (typeof r[cle] === "number" ? (r[cle] as number) : 0),
        0,
      )
    : 0;
const releveDe = (e: EvenementJournal): Releve | null =>
  e.type === "action" || e.type === "releve" || e.type === "absence" ? e.releve : null;
const nombre = (r: Releve | null, cle: string): number | null =>
  r && typeof r[cle] === "number" ? (r[cle] as number) : null;

function analyserSurface(evenements: EvenementJournal[]): AnalyseSession["surface"] {
  const surface = evenements.filter((e) => e.s === 1);
  const seuil = surface.find((e) => e.type === "seuil");
  const ouverture = surface.find((e) => e.type === "creuser" && e.reponse === "fouille");
  return {
    seuil: seuil ? Math.round((seuil.j / MINUTE) * 10) / 10 : null,
    creuserApresSeuil: seuil && ouverture ? Math.round((ouverture.t - seuil.t) / 1000) : null,
    resistances: surface.filter((e) => e.type === "creuser" && e.reponse === "resiste").length,
    fissure: surface.some(
      (e) => (!ouverture || e.t <= ouverture.t) && (nombre(releveDe(e), "fissure") ?? 0) > 0,
    ),
    aide: surface.filter((e) => e.type === "aide").length,
  };
}

function analyserFouille(evenements: EvenementJournal[]): AnalyseSession["fouille"] {
  let ouvertures = 0;
  let rebouchages = 0;
  let duree = 0;
  let ouverteA: number | null = null;
  let preselection: string[] = [];
  for (const e of evenements) {
    if (e.type === "fouille") {
      ouvertures++;
      ouverteA = e.t;
      preselection = e.preselection;
    } else if ((e.type === "reboucher" || e.type === "descendre") && ouverteA !== null) {
      duree += e.t - ouverteA;
      ouverteA = null;
      if (e.type === "reboucher") rebouchages++;
    }
  }
  const descente = evenements.find((e) => e.type === "descendre");
  if (ouvertures === 0 && !descente) return null;
  const emportes = descente?.type === "descendre" ? descente.emportes : [];
  return {
    ouvertures,
    rebouchages,
    duree: Math.round(duree / 1000),
    preselectionGardee:
      emportes.length === preselection.length && emportes.every((id) => preselection.includes(id)),
    emportes,
  };
}

function analyserCaves(evenements: EvenementJournal[]): AnalyseSession["caves"] {
  const caves = evenements.filter((e) => e.s === 2);
  if (caves.length === 0) return null;

  let precedent: Releve | null = null;
  const achatsAutomne: Record<number, number> = { 1: 0, 2: 0 };
  const entreeHiver: Record<number, { reserve: number; marque: number }> = {};
  let installationsPremiereMinute = 0;
  let glanerHiver = 0;
  let premiereRupture: number | null = null;
  for (const e of caves) {
    // Le premier jour d'un hiver, daté par les caves elles-mêmes.
    if (e.type === "trace" && e.cle === "hiver" && e.valeurs) {
      const { annee, reserve, marque } = e.valeurs;
      if (annee !== undefined && reserve !== undefined && marque !== undefined) {
        entreeHiver[annee] ??= { reserve, marque };
      }
    }
    const r = releveDe(e);
    if (!r) continue;
    const annee = nombre(r, "annee");
    if (e.type === "action") {
      // Un achat réussi fait monter ce que la vallée possède ; un achat refusé ne compte pas.
      const achete = precedent !== null && achats(r) > achats(precedent);
      if (achete && r.saison === "automne" && (annee === 1 || annee === 2)) achatsAutomne[annee]!++;
      if (e.action.type === "glaner" && annee === 1 && r.saison === "hiver") glanerHiver += e.n;
    }
    if (e.j <= MINUTE) installationsPremiereMinute = nombre(r, "installees") ?? 0;
    if (premiereRupture === null && r.rupture === true) premiereRupture = e.j;
    precedent = r;
  }
  /** G1, pour une année : acheter en automne, et entrer dans l'hiver sous la marque. */
  const g1 = (annee: number) => {
    const entree = entreeHiver[annee];
    return achatsAutomne[annee]! > 0 && entree !== undefined && entree.reserve < entree.marque;
  };

  const bilan = caves.find((e) => e.type === "trace" && e.cle === "registre.pertes");
  const gestes: Gestes = {
    g1: g1(1),
    g2: installationsPremiereMinute >= 10,
    g3: glanerHiver >= 3,
    achatsAutomne: achatsAutomne[1]!,
    entreeHiver: entreeHiver[1] ?? null,
    installationsPremiereMinute,
    glanerHiver,
  };
  return {
    gestes,
    commeStrate1: [gestes.g1, gestes.g2, gestes.g3].filter(Boolean).length >= 2,
    g1An2: g1(2),
    premiereRupture,
    premierBilan: bilan ? bilan.j : null,
    duree: caves.at(-1)!.j,
    aide: caves.filter((e) => e.type === "aide").length,
  };
}

function analyserLit(evenements: EvenementJournal[]): AnalyseLit | null {
  const lit = evenements.filter((e) => e.s === 7);
  if (lit.length === 0) return null;
  const absences = lit.flatMap((e) => (e.type === "absence" ? [e] : []));
  const departs = absences.filter((e) => e.duree >= DEPART);
  const premier = departs[0];
  const duree = Math.max(...lit.map((e) => e.j));
  const absent = absences.reduce((s, e) => s + e.duree, 0);
  // Le bassin plein se lit dans les relevés : le premier qui le dit plein vient-il d'un retour ?
  const premierPlein = lit.find((e) => releveDe(e)?.plein === true);
  const plein = lit.find((e) => e.type === "trace" && e.cle === "bassin.plein");
  const seuil = lit.find((e) => e.type === "seuil");
  const enMinutes = (s: number) => Math.round((s / MINUTE) * 10) / 10;
  return {
    seances: lit.filter((e) => e.type === "debut").length,
    departs: departs.map((e) => enMinutes(e.duree)),
    avantPremierDepart: premier ? enMinutes(Math.max(0, premier.j - premier.duree)) : null,
    presence: enMinutes(Math.max(0, duree - absent)),
    duree: enMinutes(duree),
    levees: lit
      .filter((e) => e.type === "action" && e.action.type === "fermer")
      .reduce((n, e) => n + (e.type === "action" ? e.n : 0), 0),
    aide: lit.filter((e) => e.type === "aide").length,
    phrases: lit.flatMap((e) => (e.type === "trace" && e.cle.startsWith("phrase.") ? [e.cle] : [])),
    plein: plein ? enMinutes(plein.j) : null,
    pleinEnPresence: premierPlein ? premierPlein.type !== "absence" : null,
    seuil: seuil ? enMinutes(seuil.j) : null,
  };
}

/** Analyse un journal exporté. */
export function analyser(journal: JournalExporte): AnalyseSession {
  const { meta, evenements } = journal;
  return {
    testeur: meta.testeur,
    version: `${meta.version} · ${meta.build}`,
    surface: analyserSurface(evenements),
    fouille: analyserFouille(evenements),
    caves: analyserCaves(evenements),
    lit: analyserLit(evenements),
  };
}

const ouiNon = (b: boolean) => (b ? "oui" : "non");
/** L'entrée dans le premier hiver : « 0 / 3 370 » (la réserve, puis la marque). */
const entree = (g: Gestes) =>
  g.entreeHiver
    ? `${Math.floor(g.entreeHiver.reserve)} / ${Math.floor(g.entreeHiver.marque)}`
    : "pas d'hiver";
const minutes = (s: number | null) =>
  s === null
    ? "—"
    : `${Math.floor(s / MINUTE)} min ${String(Math.round(s % MINUTE)).padStart(2, "0")} s`;

/** Les lignes du lit : ce que le journal en dit, pour la fiche du testeur (strate-7-recette.md, § 8). */
function resumerLit(l: AnalyseLit): string[] {
  const departs =
    l.departs.length === 0
      ? "aucun départ"
      : `${l.departs.length} départ(s) (${l.departs.map((m) => `${m} min`).join(", ")}), le premier après ${l.avantPremierDepart} min`;
  return [
    `Lit : ${l.seances} séance(s), ${departs} ; ${l.presence} min devant le lit sur ${l.duree} min`,
    `Levées : ${l.levees} · aide ouverte ${l.aide} fois · phrases : ${l.phrases.join(", ") || "aucune"}`,
    `Bassin plein : ${l.plein === null ? "non" : `à ${l.plein} min, ${l.pleinEnPresence ? "en présence" : "pendant une absence"}`}` +
      ` · seuil : ${l.seuil === null ? "non atteint" : `à ${l.seuil} min`}`,
  ];
}

/** Les lignes « Depuis le journal » de la fiche d'observation (docs/playtest-mvp.md, § 8). */
export function resumer(a: AnalyseSession): string[] {
  const lignes = [`Testeur ${a.testeur} · Strates ${a.version}`];
  // Un journal de la recette du lit commence dans le lit : la surface et les caves n'y sont pas.
  if (a.lit && a.surface.seuil === null && !a.fouille && !a.caves) {
    return [...lignes, ...resumerLit(a.lit)];
  }
  const s = a.surface;
  lignes.push(
    `Surface : seuil ${s.seuil === null ? "non atteint" : `à ${s.seuil} min`}` +
      (s.creuserApresSeuil === null ? "" : `, creusé ${s.creuserApresSeuil} s après`) +
      `, ${s.resistances} clic(s) sur « creuser » avant, fissure : ${ouiNon(s.fissure)}` +
      `, aide ouverte ${s.aide} fois`,
  );
  if (a.fouille) {
    const f = a.fouille;
    lignes.push(
      `Fouille : ${f.duree} s à l'écran, ${f.rebouchages} rebouchage(s), présélection gardée : ${ouiNon(f.preselectionGardee)}`,
    );
  }
  if (a.caves) {
    const c = a.caves;
    const g = c.gestes;
    lignes.push(
      `G1 ${ouiNon(g.g1)} (${g.achatsAutomne} achat(s) d'automne, ${entree(g)})  G2 ${ouiNon(g.g2)} (${g.installationsPremiereMinute} familles)  G3 ${ouiNon(g.g3)} (${g.glanerHiver} clics)` +
        ` → joue comme en strate 1 : ${ouiNon(c.commeStrate1)}`,
      `G1 en l'an 2 : ${ouiNon(c.g1An2)}`,
      `Première rupture : ${minutes(c.premiereRupture)} · premier bilan : ${minutes(c.premierBilan)} · caves jouées : ${minutes(c.duree)}`,
      `Aide des caves ouverte ${c.aide} fois`,
    );
  } else {
    lignes.push("Caves : pas atteintes.");
  }
  if (a.lit) lignes.push(...resumerLit(a.lit));
  return lignes;
}

/** Une ligne par testeur, en Markdown : pour le compte rendu (docs/playtest-mvp.md, § 11). */
export function tableau(analyses: AnalyseSession[]): string {
  const entetes = [
    "Testeur",
    "Seuil",
    "Creusé après",
    "Fouille",
    "G1",
    "G2",
    "G3",
    "Comme en strate 1",
    "G1 an 2",
    "Première rupture",
    "Premier bilan",
    "Aide",
  ];
  const lignes = analyses.map((a) => [
    a.testeur,
    a.surface.seuil === null ? "—" : `${a.surface.seuil} min`,
    a.surface.creuserApresSeuil === null ? "—" : `${a.surface.creuserApresSeuil} s`,
    a.fouille ? `${a.fouille.duree} s, ${a.fouille.rebouchages} reb.` : "—",
    a.caves
      ? `${ouiNon(a.caves.gestes.g1)} (${a.caves.gestes.achatsAutomne}, ${entree(a.caves.gestes)})`
      : "—",
    a.caves ? `${ouiNon(a.caves.gestes.g2)} (${a.caves.gestes.installationsPremiereMinute})` : "—",
    a.caves ? `${ouiNon(a.caves.gestes.g3)} (${a.caves.gestes.glanerHiver})` : "—",
    a.caves ? ouiNon(a.caves.commeStrate1) : "—",
    a.caves ? ouiNon(a.caves.g1An2) : "—",
    a.caves ? minutes(a.caves.premiereRupture) : "—",
    a.caves ? minutes(a.caves.premierBilan) : "—",
    `${a.surface.aide} / ${a.caves ? a.caves.aide : "—"}`,
  ]);
  return [
    `| ${entetes.join(" | ")} |`,
    `|${entetes.map(() => "---").join("|")}|`,
    ...lignes.map((l) => `| ${l.join(" | ")} |`),
  ].join("\n");
}

/** Une ligne par testeur du lit, en Markdown : pour le compte rendu de sa recette (strate-7-recette.md, § 9). */
export function tableauLit(analyses: AnalyseSession[]): string {
  const entetes = [
    "Testeur",
    "Séances",
    "Départs",
    "Premier départ",
    "Présence",
    "Durée",
    "Levées",
    "Aide",
    "Retour dit",
    "Bassin plein",
    "Seuil",
  ];
  const lignes = analyses.flatMap((a) => {
    const l = a.lit;
    if (!l) return [];
    return [
      [
        a.testeur,
        String(l.seances),
        String(l.departs.length),
        l.avantPremierDepart === null ? "—" : `${l.avantPremierDepart} min`,
        `${l.presence} min`,
        `${l.duree} min`,
        String(l.levees),
        String(l.aide),
        ouiNon(l.phrases.includes("phrase.retour")),
        l.plein === null ? "—" : `${l.plein} min, ${l.pleinEnPresence ? "présent" : "absent"}`,
        l.seuil === null ? "—" : `${l.seuil} min`,
      ],
    ];
  });
  return [
    `| ${entetes.join(" | ")} |`,
    `|${entetes.map(() => "---").join("|")}|`,
    ...lignes.map((l) => `| ${l.join(" | ")} |`),
  ].join("\n");
}

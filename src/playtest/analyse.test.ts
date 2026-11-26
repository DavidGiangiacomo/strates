// L'analyse d'un journal : la surface, la fouille et les caves, puis la dette et le lit de leurs
// recettes (#113, #120), sur des journaux écrits à la main.
// Les gestes sont vérifiés sur les joueurs automatiques dans tests/journal-joueurs.test.ts.
import { describe, expect, it } from "vitest";
import { analyser, estRecette, resumer, tableau, tableauDette, tableauLit } from "./analyse";
import {
  FORMAT_JOURNAL,
  type DonneesJournal,
  type EvenementJournal,
  type JournalExporte,
} from "./journal";
import type { NumeroStrate } from "../noyau/logique/types";

const PRESELECTION = ["s1-equipe", "s1-double-ecran", "s1-serveur", "s1-filiale", "s1-turbine"];

function journal(evenements: [number, NumeroStrate, number, DonneesJournal][]): JournalExporte {
  return {
    meta: {
      format: FORMAT_JOURNAL,
      testeur: "T1",
      version: "0.0.0",
      build: "abc1234",
      debut: 0,
      navigateur: "essai",
      fenetre: { largeur: 1280, hauteur: 720 },
      mouvementReduit: false,
    },
    evenements: evenements.map(([t, s, j, d]) => ({ t, s, j, ...d }) as EvenementJournal),
  };
}

const caves = (releve: Record<string, number | string | boolean>) => ({
  annee: 1,
  saison: "printemps",
  reserve: 250,
  marque: 775,
  installees: 0,
  outils: 0,
  greniers: 1,
  silos: 0,
  caves: 0,
  cavesProfondes: 0,
  rupture: false,
  ...releve,
});

/** Une partie : la surface jusqu'au seuil, une fouille rebouchée, une descente, un an de caves. */
const PARTIE = journal([
  [0, 1, 0, { type: "debut", rechargement: false }],
  [1_000, 1, 1, { type: "releve", releve: { fissure: 0 } }],
  [60_000, 1, 60, { type: "creuser", reponse: "resiste" }],
  [90_000, 1, 90, { type: "aide" }],
  [4_380_000, 1, 4_380, { type: "seuil" }],
  [4_700_000, 1, 4_700, { type: "releve", releve: { fissure: 0.4 } }],
  [4_800_000, 1, 4_800, { type: "creuser", reponse: "fouille" }],
  [4_800_000, 1, 4_800, { type: "fouille", valeur: 6e8, points: 12, preselection: PRESELECTION }],
  [4_830_000, 1, 4_800, { type: "reboucher" }],
  [4_900_000, 1, 4_900, { type: "fouille", valeur: 7e8, points: 12, preselection: PRESELECTION }],
  [4_910_000, 1, 4_900, { type: "case", objet: "s1-filiale", coche: false }],
  [4_920_000, 1, 4_900, { type: "descendre", emportes: PRESELECTION.slice(0, 4), abandonnes: [] }],
  [4_925_000, 2, 0, { type: "releve", releve: caves({}) }],
  // Onze familles la première minute, par séries.
  [
    4_930_000,
    2,
    5,
    { type: "action", action: { type: "installer" }, n: 6, releve: caves({ installees: 6 }) },
  ],
  [
    4_960_000,
    2,
    35,
    { type: "action", action: { type: "installer" }, n: 5, releve: caves({ installees: 11 }) },
  ],
  // Un achat d'automne réussi, un autre refusé.
  [
    5_180_000,
    2,
    255,
    {
      type: "action",
      action: { type: "outil" },
      n: 1,
      releve: caves({ saison: "automne", installees: 11, outils: 2, reserve: 40 }),
    },
  ],
  [
    5_181_000,
    2,
    256,
    {
      type: "action",
      action: { type: "outil" },
      n: 1,
      releve: caves({ saison: "automne", installees: 11, outils: 2, reserve: 40 }),
    },
  ],
  [
    5_200_000,
    2,
    280,
    { type: "trace", cle: "hiver", valeurs: { annee: 1, reserve: 12, marque: 2_900 } },
  ],
  [
    5_205_000,
    2,
    285,
    {
      type: "action",
      action: { type: "glaner" },
      n: 2,
      releve: caves({ saison: "hiver", installees: 11, outils: 2, reserve: 0, rupture: true }),
    },
  ],
  [5_300_000, 2, 373, { type: "trace", cle: "registre.pertes", valeurs: { pourri: 120 } }],
]);

describe("l'analyse d'un journal", () => {
  const a = analyser(PARTIE);

  it("lit la surface : le seuil, le coup de pioche, la fissure", () => {
    expect(a.surface).toEqual({
      seuil: 73,
      creuserApresSeuil: 420,
      resistances: 1,
      fissure: true,
      aide: 1,
    });
  });

  it("lit la fouille : le temps à l'écran, les rebouchages, le choix", () => {
    expect(a.fouille).toEqual({
      ouvertures: 2,
      rebouchages: 1,
      duree: 50,
      preselectionGardee: false,
      emportes: PRESELECTION.slice(0, 4),
    });
  });

  it("lit les gestes : un achat d'automne compte s'il a réussi, et l'hiver se juge à son premier jour", () => {
    expect(a.caves?.gestes).toEqual({
      g1: true,
      g2: true,
      g3: false,
      achatsAutomne: 1,
      entreeHiver: { reserve: 12, marque: 2_900 },
      installationsPremiereMinute: 11,
      glanerHiver: 2,
    });
    expect(a.caves).toMatchObject({
      commeStrate1: true,
      g1An2: false,
      premiereRupture: 285,
      premierBilan: 373,
      duree: 373,
      aide: 0,
    });
  });

  it("ne compte pas G1 à qui entre dans l'hiver au-dessus de la marque", () => {
    const evenements = PARTIE.evenements.map((e) =>
      e.type === "trace" && e.cle === "hiver"
        ? { ...e, valeurs: { annee: 1, reserve: 3_000, marque: 2_900 } }
        : e,
    );
    expect(analyser({ ...PARTIE, evenements }).caves?.gestes.g1).toBe(false);
  });

  it("résume pour la fiche d'observation, et fait un tableau pour le compte rendu", () => {
    expect(resumer(a)).toEqual([
      "Testeur T1 · Strates 0.0.0 · abc1234",
      "Surface : seuil à 73 min, creusé 420 s après, 1 clic(s) sur « creuser » avant, fissure : oui, aide ouverte 1 fois",
      "Fouille : 50 s à l'écran, 1 rebouchage(s), présélection gardée : non",
      "G1 oui (1 achat(s) d'automne, 12 / 2900)  G2 oui (11 familles)  G3 non (2 clics) → joue comme en strate 1 : oui",
      "G1 en l'an 2 : non",
      "Première rupture : 4 min 45 s · premier bilan : 6 min 13 s · caves jouées : 6 min 13 s",
      "Aide des caves ouverte 0 fois",
    ]);
    expect(tableau([a]).split("\n")).toHaveLength(3);
  });

  it("dit quand les caves n'ont pas été atteintes", () => {
    const surface = journal([[0, 1, 0, { type: "debut", rechargement: false }]]);
    expect(analyser(surface).caves).toBeNull();
    expect(resumer(analyser(surface)).at(-1)).toBe("Caves : pas atteintes.");
  });
});

describe("la dette, pour sa recette", () => {
  const MIN = 60_000;
  /** Le relevé de la dette : son issue, ou rien encore. */
  const dette = (issue: "soldee" | "defaut" | null) => ({ crues: 10, caisse: 30, issue });
  const promettre = { type: "promettre", promesse: "orge", terme: 2 };
  const solder = { type: "solder", echeance: 2 };
  // Une partie de recette : des promesses, un refus, un solde, deux reports, la première tablette
  // brisée, l'aide ; un départ de deux heures ; la grande crue fixée ; puis une nuit pendant laquelle
  // la grande crue tombe, soldée, et le joueur qui creuse au retour.
  const PARTIE_DETTE = journal([
    [0, 6, 0, { type: "debut", rechargement: false }],
    [10_000, 6, 10, { type: "action", action: promettre, n: 1, releve: dette(null) }],
    [20_000, 6, 20, { type: "trace", cle: "promesse.refusee", valeurs: { promesse: 0 } }],
    [30_000, 6, 30, { type: "action", action: promettre, n: 2, releve: dette(null) }],
    [40_000, 6, 40, { type: "action", action: solder, n: 1, releve: dette(null) }],
    [9 * MIN, 6, 540, { type: "trace", cle: "echeance.reportee" }],
    [10 * MIN, 6, 600, { type: "trace", cle: "echeance.reportee" }],
    [28 * MIN, 6, 1680, { type: "trace", cle: "tablette.brisee", valeurs: { tablette: 1 } }],
    [30 * MIN, 6, 1800, { type: "aide" }],
    // Il part après 40 minutes, revient deux heures plus tard.
    [160 * MIN, 6, 160 * 60, { type: "debut", rechargement: true }],
    [
      160 * MIN,
      6,
      160 * 60,
      {
        type: "absence",
        duree: 120 * 60,
        comptee: 120 * 60,
        politique: "propre",
        releve: dette(null),
      },
    ],
    [170 * MIN, 6, 170 * 60, { type: "trace", cle: "grandeCrue.fixee" }],
    // La nuit : la grande crue tombe pendant l'absence, soldée ; au retour, il creuse.
    [600 * MIN, 6, 600 * 60, { type: "debut", rechargement: true }],
    [600 * MIN, 6, 600 * 60, { type: "trace", cle: "dette.soldee" }],
    [
      600 * MIN,
      6,
      600 * 60,
      {
        type: "absence",
        duree: 420 * 60,
        comptee: 420 * 60,
        politique: "propre",
        releve: dette("soldee"),
      },
    ],
    [600 * MIN + 10_000, 6, 600 * 60 + 10, { type: "creuser", reponse: "fouille" }],
  ]);
  const a = analyser(PARTIE_DETTE);

  it("compte les séances, les départs et la présence devant la dette", () => {
    expect(a.dette).toMatchObject({
      seances: 3,
      departs: [120, 420],
      avantPremierDepart: 40,
      // 600,2 minutes de la dette, moins 540 minutes d'absence.
      presence: 60.2,
      duree: 600.2,
    });
  });

  it("compte les promesses et les refus, les soldes, les reports, l'aide et les tablettes brisées", () => {
    expect(a.dette).toMatchObject({
      promesses: 3,
      refus: 1,
      soldes: 1,
      reports: 2,
      premierReport: 9,
      tablettes: [28],
      aide: 1,
    });
  });

  it("dit la grande crue, l'issue, si elle est venue en présence, et s'il a creusé ensuite", () => {
    expect(a.dette).toMatchObject({
      grandeCrue: 170,
      issue: "soldee",
      issueA: 600,
      issueEnPresence: false,
      creuse: true,
    });
    const enDefaut = analyser(
      journal([
        [0, 6, 0, { type: "debut", rechargement: false }],
        [49 * MIN, 6, 49 * 60, { type: "trace", cle: "dette.defaut" }],
        [49 * MIN, 6, 49 * 60, { type: "releve", releve: dette("defaut") }],
      ]),
    );
    expect(enDefaut.dette).toMatchObject({
      issue: "defaut",
      issueA: 49,
      issueEnPresence: true,
      grandeCrue: null,
      creuse: false,
    });
  });

  it("résume pour la fiche du testeur, sans la surface ni les caves, et fait un tableau", () => {
    expect(estRecette(a)).toBe(true);
    expect(resumer(a)).toEqual([
      "Testeur T1 · Strates 0.0.0 · abc1234",
      "Dette : 3 séance(s), 2 départ(s) (120 min, 420 min), le premier après 40 min ; 60.2 min devant la dette sur 600.2 min",
      "Promesses : 3, dont 1 refusée(s) · soldées avant terme : 1 · aide ouverte 1 fois",
      "Reports : 2, le premier à 9 min · tablettes brisées : 28 min",
      "Grande crue fixée : à 170 min · issue : soldée à 600 min, pendant une absence · a creusé ensuite : oui",
    ]);
    const lignes = tableauDette([
      a,
      analyser(journal([[0, 1, 0, { type: "debut", rechargement: false }]])),
    ]).split("\n");
    // Le journal sans dette n'a pas de ligne.
    expect(lignes).toHaveLength(3);
    expect(lignes[2]).toContain("| T1 | 3 | 2 | 60.2 min | 600.2 min | 3 | 1 | 1 | 2 | 9 min |");
    expect(lignes[2]).toContain("| soldée, 600 min, absent |");
  });

  it("n'existe pas dans un journal qui n'atteint pas la dette", () => {
    const surface = analyser(journal([[0, 1, 0, { type: "debut", rechargement: false }]]));
    expect(surface.dette).toBeNull();
    expect(estRecette(surface)).toBe(false);
  });
});

describe("le lit, pour sa recette", () => {
  const MIN = 60_000;
  /** Le relevé du lit : le bassin, plein ou non. */
  const lit = (plein: boolean) => ({
    crues: 10,
    niveau: 0,
    depose: 70,
    levee: null,
    creuxPleins: 0,
    plein,
  });
  // Une partie de recette : l'arrivée, une levée, un départ de deux heures, le retour, une heure de
  // présence, puis une nuit pendant laquelle le bassin se remplit, et la descente au retour.
  const PARTIE_LIT = journal([
    [0, 7, 0, { type: "debut", rechargement: false }],
    [0, 7, 0, { type: "trace", cle: "phrase.arrivee" }],
    [60_000, 7, 60, { type: "action", action: { type: "fermer" }, n: 1, releve: lit(false) }],
    [90_000, 7, 90, { type: "aide" }],
    // Il part après 20 minutes, revient deux heures plus tard : un rechargement, puis l'absence.
    [140 * MIN, 7, 140 * 60, { type: "debut", rechargement: true }],
    [
      140 * MIN,
      7,
      140 * 60,
      {
        type: "absence",
        duree: 120 * 60,
        comptee: 120 * 60,
        politique: "propre",
        releve: lit(false),
      },
    ],
    [140 * MIN, 7, 140 * 60, { type: "trace", cle: "phrase.retour" }],
    // Un onglet caché deux minutes : ce n'est pas un départ.
    [
      150 * MIN,
      7,
      150 * 60,
      { type: "absence", duree: 120, comptee: 120, politique: "propre", releve: lit(false) },
    ],
    [
      150 * MIN,
      7,
      150 * 60,
      { type: "action", action: { type: "fermer" }, n: 2, releve: lit(false) },
    ],
    // La nuit : le bassin se remplit pendant l'absence ; au retour, la descente vient une crue après.
    [800 * MIN, 7, 800 * 60, { type: "debut", rechargement: true }],
    [800 * MIN, 7, 800 * 60, { type: "trace", cle: "bassin.plein" }],
    [
      800 * MIN,
      7,
      800 * 60,
      {
        type: "absence",
        duree: 600 * 60,
        comptee: 600 * 60,
        politique: "propre",
        releve: lit(true),
      },
    ],
    [800 * MIN + 30_000, 7, 800 * 60 + 30, { type: "seuil" }],
  ]);
  const a = analyser(PARTIE_LIT);

  it("compte les séances, les départs et la présence devant le lit", () => {
    expect(a.lit).toMatchObject({
      seances: 3,
      departs: [120, 600],
      avantPremierDepart: 20,
      // 800,5 minutes du lit, moins 722 minutes d'absence.
      presence: 78.5,
      duree: 800.5,
    });
  });

  it("compte les levées, l'aide, et les phrases du jeu dites", () => {
    expect(a.lit).toMatchObject({
      levees: 3,
      aide: 1,
      phrases: ["phrase.arrivee", "phrase.retour"],
    });
  });

  it("dit si le bassin s'est rempli en présence ou pendant une absence, et quand vient le seuil", () => {
    expect(a.lit).toMatchObject({ plein: 800, pleinEnPresence: false, seuil: 800.5 });
    const presence = analyser(
      journal([
        [0, 7, 0, { type: "debut", rechargement: false }],
        [5 * MIN, 7, 300, { type: "releve", releve: lit(false) }],
        [130 * MIN, 7, 130 * 60, { type: "trace", cle: "bassin.plein" }],
        [130 * MIN, 7, 130 * 60, { type: "releve", releve: lit(true) }],
      ]),
    );
    expect(presence.lit).toMatchObject({
      plein: 130,
      pleinEnPresence: true,
      seuil: null,
      departs: [],
    });
    expect(presence.lit!.avantPremierDepart).toBeNull();
  });

  it("résume pour la fiche du testeur, sans la surface ni les caves, et fait un tableau", () => {
    expect(resumer(a)).toEqual([
      "Testeur T1 · Strates 0.0.0 · abc1234",
      "Lit : 3 séance(s), 2 départ(s) (120 min, 600 min), le premier après 20 min ; 78.5 min devant le lit sur 800.5 min",
      "Levées : 3 · aide ouverte 1 fois · phrases : phrase.arrivee, phrase.retour",
      "Bassin plein : à 800 min, pendant une absence · seuil : à 800.5 min",
    ]);
    const lignes = tableauLit([
      a,
      analyser(journal([[0, 1, 0, { type: "debut", rechargement: false }]])),
    ]).split("\n");
    // Le journal sans lit n'a pas de ligne.
    expect(lignes).toHaveLength(3);
    expect(lignes[2]).toContain("| T1 | 3 | 2 | 20 min |");
    expect(lignes[2]).toContain("| oui |");
  });

  it("n'existe pas dans un journal qui n'atteint pas le lit", () => {
    expect(analyser(journal([[0, 1, 0, { type: "debut", rechargement: false }]])).lit).toBeNull();
  });
});

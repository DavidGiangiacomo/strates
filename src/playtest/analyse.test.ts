// L'analyse d'un journal : la surface, la fouille et les caves, sur un journal écrit à la main.
// Les gestes sont vérifiés sur les joueurs automatiques dans tests/journal-joueurs.test.ts.
import { describe, expect, it } from "vitest";
import { analyser, resumer, tableau } from "./analyse";
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

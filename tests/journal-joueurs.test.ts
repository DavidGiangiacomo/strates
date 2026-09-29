// Le protocole du test du MVP demande de vérifier l'analyse des journaux sur les joueurs automatiques,
// avant le test (docs/playtest-mvp.md, § 9) : le joueur réflexe doit jouer comme en strate 1, les
// joueurs qui prévoient ne le doivent pas. Chaque joueur joue 13 minutes des caves, journal branché.
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  APPREND,
  CORRECT,
  DISTRAIT,
  PRUDENT,
  REFLEXE,
  creerJoueur,
  type ProfilCaves,
} from "../sim/joueurs/caves";
import { preselection } from "../src/noyau/logique/artefacts";
import { creerEtatNoyau } from "../src/noyau/logique/etat";
import { Noyau } from "../src/noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../src/noyau/logique/registre";
import { analyser, type AnalyseSession } from "../src/playtest/analyse";
import { FORMAT_JOURNAL, JournalSession, type JournalExporte } from "../src/playtest/journal";
import { logique } from "../src/strates/s2-caves/logique";

/** Le journal de 13 minutes de caves d'un joueur automatique, avec les objets d'un jeu correct. */
async function journalDe(profil: ProfilCaves, testeur: string): Promise<JournalExporte> {
  const registre = new Registre();
  registre.enregistrer(2, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
  const etat = creerEtatNoyau(1, 0);
  etat.profondeur = 2;
  etat.artefacts = preselection(12, 1);
  const noyau = new Noyau(registre, etat);
  await noyau.demarrer(0);

  const horloge = { ms: 0 };
  const journal = new JournalSession(
    {
      format: FORMAT_JOURNAL,
      testeur,
      version: "0.0.0",
      build: "sim",
      debut: 0,
      navigateur: "sim",
      fenetre: { largeur: 1280, hauteur: 720 },
      mouvementReduit: false,
    },
    () => horloge.ms,
  );
  journal.brancher(noyau);
  const joueur = creerJoueur(noyau, profil);
  for (let t = 0; t < 13 * 60; t++) {
    journal.suivre();
    joueur.seconde(t);
    horloge.ms += 1000;
  }
  journal.suivre();
  return journal.exporter();
}

const PROFILS = {
  reflexe: REFLEXE,
  apprend: APPREND,
  correct: CORRECT,
  prudent: PRUDENT,
  distrait: DISTRAIT,
};
const JOURNAUX: Record<string, JournalExporte> = {};
const ANALYSES: Record<string, AnalyseSession> = {};
for (const [nom, profil] of Object.entries(PROFILS)) {
  JOURNAUX[nom] = await journalDe(profil, nom);
  ANALYSES[nom] = analyser(JOURNAUX[nom]!);
}

describe("l'analyse des journaux, sur les joueurs automatiques", () => {
  it("fait jouer comme en strate 1 le joueur réflexe et celui qui apprend : G1 et G2", () => {
    for (const nom of ["reflexe", "apprend"]) {
      const caves = ANALYSES[nom]!.caves!;
      expect(caves.commeStrate1).toBe(true);
      expect(caves.gestes.g1).toBe(true);
      expect(caves.gestes.g2).toBe(true);
      expect(caves.gestes.installationsPremiereMinute).toBeGreaterThanOrEqual(15);
    }
  });

  it("ne fait pas jouer comme en strate 1 les joueurs qui prévoient", () => {
    for (const nom of ["correct", "prudent", "distrait"]) {
      const { gestes, commeStrate1 } = ANALYSES[nom]!.caves!;
      expect(commeStrate1).toBe(false);
      expect(gestes.g1).toBe(false);
      expect(gestes.g2).toBe(false);
      expect(gestes.installationsPremiereMinute).toBeLessThanOrEqual(2);
    }
  });

  it("voit tous les joueurs automatiques glaner en hiver : G3 seul ne suffit pas", () => {
    // Ils cliquent quelle que soit la saison (sim/joueurs/caves.ts) : c'est pourquoi il faut deux gestes.
    for (const analyse of Object.values(ANALYSES)) expect(analyse.caves!.gestes.g3).toBe(true);
  });

  it("date la première rupture et le premier bilan", () => {
    const reflexe = ANALYSES.reflexe!.caves!;
    // Disette à 4 min 31, bilan vers 6 min 13 (docs/strates/descente-1-2.md, P7) ; relevés toutes les 5 s.
    expect(reflexe.premiereRupture).toBeGreaterThan(270);
    expect(reflexe.premiereRupture).toBeLessThan(280);
    expect(reflexe.premierBilan).toBeGreaterThan(365);
    expect(reflexe.premierBilan).toBeLessThan(380);
    expect(reflexe.duree).toBeCloseTo(780, 0);
  });

  it("ne voit ni surface ni fouille dans une partie qui commence aux caves", () => {
    expect(ANALYSES.correct!.surface).toEqual({
      seuil: null,
      creuserApresSeuil: null,
      resistances: 0,
      fissure: false,
      aide: 0,
    });
    expect(ANALYSES.correct!.fouille).toBeNull();
  });

  it("tient une séance de 13 minutes en quelques centaines d'événements", () => {
    for (const journal of Object.values(JOURNAUX)) {
      expect(journal.evenements.length).toBeLessThan(2_000);
      expect(JSON.stringify(journal).length).toBeLessThan(500_000);
    }
  });

  it("s'analyse aussi en ligne de commande, avec Node", () => {
    const dossier = mkdtempSync(join(tmpdir(), "strates-journal-"));
    const fichiers = ["reflexe", "correct"].map((nom) => {
      const fichier = join(dossier, `journal-${nom}.json`);
      writeFileSync(fichier, JSON.stringify(JOURNAUX[nom]));
      return fichier;
    });
    const sortie = execFileSync("node", ["src/playtest/analyser.mjs", ...fichiers], {
      encoding: "utf8",
    });
    expect(sortie).toContain("## journal-reflexe.json");
    expect(sortie).toMatch(/joue comme en strate 1 : oui/);
    expect(sortie).toMatch(/joue comme en strate 1 : non/);
    expect(sortie).toContain("| Testeur | Seuil |");
  });
});

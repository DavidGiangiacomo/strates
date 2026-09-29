import { describe, expect, it } from "vitest";
import { creerLogiqueFactice, type EtatFactice } from "../strates/factice/logique";
import { creerEtatNoyau } from "../noyau/logique/etat";
import { Noyau } from "../noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../noyau/logique/registre";
import {
  arrondir,
  FORMAT_JOURNAL,
  JournalSession,
  MAX_EVENEMENTS,
  PERIODE_RELEVE,
  type MetaJournal,
} from "./journal";

const META: MetaJournal = {
  format: FORMAT_JOURNAL,
  testeur: "T3",
  version: "0.0.0",
  build: "abc1234",
  debut: 1_000_000,
  navigateur: "essai",
  fenetre: { largeur: 1280, hauteur: 720 },
  mouvementReduit: false,
};

/** Une séance sur la strate factice, avec une horloge qu'on avance à la main. */
async function seance() {
  const logique = {
    ...creerLogiqueFactice(1),
    releve: (e: EtatFactice) => ({ unites: e.unites / 3, cumul: e.cumul }),
  };
  const registre = new Registre();
  registre.enregistrer(1, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
  const noyau = new Noyau(registre, creerEtatNoyau(1, 0));
  await noyau.demarrer(0);
  const horloge = { ms: META.debut };
  const journal = new JournalSession({ ...META }, () => horloge.ms);
  journal.brancher(noyau);
  /** Avance l'horloge et le jeu de `secondes`, image par image comme la boucle. */
  const jouer = (secondes: number) => {
    for (let i = 0; i < secondes * 10; i++) {
      horloge.ms += 100;
      noyau.avancer(0.1);
      journal.suivre();
    }
  };
  return { noyau, journal, horloge, jouer };
}

const types = (j: JournalSession) => j.evenements.map((e) => e.type);

describe("le journal de session", () => {
  it("note le début de la séance, puis un relevé dès la première image", async () => {
    const { journal } = await seance();
    expect(journal.evenements).toEqual([{ t: 0, s: 1, j: 0, type: "debut", rechargement: false }]);
    journal.suivre();
    expect(journal.evenements[1]).toEqual({
      t: 0,
      s: 1,
      j: 0,
      type: "releve",
      releve: { unites: 0, cumul: 0 },
    });
  });

  it("note chaque action appliquée, avec le relevé qui suit, arrondi au centième", async () => {
    const { noyau, journal, horloge } = await seance();
    horloge.ms += 1500;
    noyau.agir({ type: "produire" });
    noyau.tick(0);
    expect(journal.evenements.at(-1)).toEqual({
      t: 1500,
      s: 1,
      j: 0,
      type: "action",
      action: { type: "produire" },
      n: 1,
      releve: { unites: 0.33, cumul: 1 },
    });
  });

  it("compte une même action répétée dans la même seconde, et sépare les secondes", async () => {
    const { noyau, journal, horloge } = await seance();
    for (let i = 0; i < 4; i++) {
      horloge.ms += 200;
      noyau.agir({ type: "produire" });
      noyau.tick(0);
    }
    horloge.ms += 400;
    noyau.agir({ type: "produire" });
    noyau.tick(0);
    const actions = journal.evenements.filter((e) => e.type === "action");
    expect(actions.map((e) => [e.t, e.type === "action" && e.n])).toEqual([
      [200, 4],
      [1200, 1],
    ]);
    // Le relevé d'une série est celui qui la termine.
    expect(actions[0]?.type === "action" && actions[0].releve?.cumul).toBe(4);
  });

  it("prend un relevé toutes les 5 secondes de jeu", async () => {
    const { journal, jouer } = await seance();
    jouer(12);
    const releves = journal.evenements.filter((e) => e.type === "releve");
    expect(releves.map((e) => e.j)).toEqual([0.1, PERIODE_RELEVE, 2 * PERIODE_RELEVE]);
  });

  it("note le seuil une fois, au moment où il est atteint", async () => {
    const { noyau, journal, jouer } = await seance();
    jouer(1);
    (noyau.etatStrate as EtatFactice).cumul = 999;
    noyau.agir({ type: "produire" });
    jouer(3);
    expect(types(journal).filter((t) => t === "seuil")).toHaveLength(1);
  });

  it("note le seuil tout de suite s'il commence dans une strate déjà au seuil, une seule fois", async () => {
    const { noyau, journal, jouer } = await seance();
    (noyau.etatStrate as EtatFactice).cumul = 999;
    noyau.agir({ type: "produire" });
    noyau.tick(0);
    const relu = JournalSession.relire(
      JSON.stringify({ meta: journal.meta, evenements: [] }),
      () => META.debut,
    )!;
    relu.brancher(noyau);
    jouer(1);
    relu.brancher(noyau);
    expect(relu.evenements.filter((e) => e.type === "seuil")).toHaveLength(1);
  });

  it("note les traces de la strate", async () => {
    const { noyau, journal } = await seance();
    noyau.observateur?.evenement?.({ type: "trace", cle: "objectif", valeurs: { numero: 2 } });
    noyau.observateur?.evenement?.({ type: "acte", acte: "premier-achat" });
    expect(journal.evenements.at(-1)).toMatchObject({
      type: "trace",
      cle: "objectif",
      valeurs: { numero: 2 },
    });
    expect(types(journal)).not.toContain("acte");
  });

  it("se relit après un rechargement, et note la reprise", async () => {
    const { journal, noyau, jouer } = await seance();
    jouer(2);
    const relu = JournalSession.relire(journal.serialiser(), () => META.debut + 60_000);
    expect(relu?.evenements).toEqual(journal.evenements);
    relu!.brancher(noyau);
    expect(relu!.evenements.at(-1)).toMatchObject({ t: 60_000, type: "debut", rechargement: true });
    expect(JournalSession.relire("pas du JSON", () => 0)).toBeNull();
    expect(
      JournalSession.relire(JSON.stringify({ meta: { format: 99 }, evenements: [] }), () => 0),
    ).toBeNull();
  });

  it("n'écrit plus rien une fois arrêté", async () => {
    const { journal, jouer } = await seance();
    journal.actif = false;
    const avant = journal.evenements.length;
    jouer(10);
    expect(journal.evenements).toHaveLength(avant);
  });

  it("s'arrête à sa taille maximale et se dit tronqué", async () => {
    const { journal } = await seance();
    for (let i = 0; i < MAX_EVENEMENTS + 10; i++) journal.noter({ type: "phase", phase: "jeu" });
    expect(journal.evenements).toHaveLength(MAX_EVENEMENTS);
    expect(journal.meta.tronque).toBe(true);
  });

  it("arrondit les nombres d'un relevé, sans toucher au reste", () => {
    expect(arrondir({ a: 1.23456, b: "hiver", c: true, d: null })).toEqual({
      a: 1.23,
      b: "hiver",
      c: true,
      d: null,
    });
    expect(arrondir(null)).toBeNull();
  });
});

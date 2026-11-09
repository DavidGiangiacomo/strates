// La descente du lit vers le fond (#106 ; docs/strates/strate-7.md, § 4 et § 10), jouée à travers le
// noyau et le passage de l'interface, comme à chaque image du jeu : elle vient seule, une crue après le
// bassin plein, en présence du joueur, que le bassin se soit rempli sous ses yeux ou pendant son
// absence. Le sol résiste au bouton « creuser » jusqu'au bout, et la phrase du lit accompagne un
// travelling plus lent. Le fond est encore une strate factice (#117).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { catalogueDe } from "../src/noyau/logique/artefacts";
import { creerEtatNoyau } from "../src/noyau/logique/etat";
import { Noyau } from "../src/noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../src/noyau/logique/registre";
import { DUREES, PAS_DE_SUITE, Passage } from "../src/noyau/ui/passage.svelte";
import { creerLogiqueFactice } from "../src/strates/factice/logique";
import { strate as lit } from "../src/strates/s7-lit";
import type { EtatLit } from "../src/strates/s7-lit/logique";
import { CRUE } from "../src/strates/s7-lit/logique/regles";

const DEBUT = 1_000_000;
const JOUR = 24 * 3600;

async function partie(avecLeFond = true) {
  const registre = new Registre();
  registre.enregistrer(7, async () => lit as StrateQuelconque);
  if (avecLeFond) {
    registre.enregistrer(
      8,
      async () => ({ logique: creerLogiqueFactice(8), vue: null, textes: {} }) as StrateQuelconque,
    );
  }
  const etat = creerEtatNoyau(1, DEBUT);
  etat.profondeur = 7;
  const noyau = new Noyau(registre, etat);
  await noyau.demarrer(DEBUT);
  const appels = { resister: 0, messages: [] as string[] };
  const passage = new Passage({
    noyau,
    maintenant: () => noyau.etat.reference,
    attendre: (ms) => new Promise((fin) => setTimeout(fin, ms)),
    sauvegarder: async () => true,
    changerStrate: () => {},
    resister: () => appels.resister++,
    signaler: (m) => appels.messages.push(m),
  });
  const lit7 = () => noyau.etatStrate as EtatLit;
  /** Une seconde de jeu, puis la fin de l'image : là où le jeu lance la descente automatique. */
  const seconde = () => {
    noyau.avancerJusqua(noyau.etat.reference + 1000, 1);
    passage.actualiser();
  };
  /** Joue jusqu'au bassin plein : moins de trois heures sans un geste. */
  const jusquAuBassinPlein = () => {
    for (let t = 0; lit7().pleinA === null && t < 3 * 3600; t++) seconde();
  };
  /**
   * La descente est lancée : le passage est occupé dès l'image qui la lance, et le travelling part
   * une fois la strate suivante chargée.
   */
  const lancee = async () => {
    if (!passage.occupe) return false;
    await vi.advanceTimersByTimeAsync(0);
    return passage.phase === "descente";
  };
  return { noyau, passage, appels, lit7, seconde, jusquAuBassinPlein, lancee };
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("la descente du lit", () => {
  it("vient seule, une crue après le bassin plein, sous les yeux du joueur", async () => {
    const { noyau, passage, lit7, seconde, jusquAuBassinPlein, lancee } = await partie();
    jusquAuBassinPlein();
    const plein = lit7().pleinA!;
    for (let t = 0; !passage.occupe && t < 2 * CRUE; t++) seconde();
    expect(lit7().temps).toBeCloseTo(plein + CRUE, 0);
    expect(await lancee()).toBe(true);
    expect(passage.ecran).toBeNull();
    expect(passage.phrase).toBe("C'était la seule fois.");

    await vi.runAllTimersAsync();
    expect(noyau.etat.profondeur).toBe(8);
    // Tout le catalogue du lit est emporté, sans écran de choix : 4 points, trois objets.
    const fouille = noyau.etat.meta.journal.strates.find((e) => e.strate === 7)!.fouille!;
    expect(fouille.points).toBe(4);
    expect([...fouille.emportes].sort()).toEqual(
      catalogueDe(7)
        .map((a) => a.id)
        .sort(),
    );
    expect(passage.artefacts).toEqual(noyau.etat.artefacts);
  });

  it("attend le retour du joueur si le bassin s'est rempli pendant son absence", async () => {
    const { noyau, passage, lit7, seconde, lancee } = await partie();
    noyau.rattraper(DEBUT + 14 * JOUR * 1000);
    expect(lit7().pleinA).not.toBeNull();
    passage.actualiser();
    expect(passage.occupe).toBe(false);
    for (let t = 1; t < CRUE; t++) {
      seconde();
      expect(passage.occupe, `${t} s après le retour`).toBe(false);
    }
    seconde();
    expect(await lancee()).toBe(true);
    await vi.runAllTimersAsync();
    expect(noyau.etat.profondeur).toBe(8);
  });

  it("repart d'une crue si le joueur s'absente juste avant elle", async () => {
    const { noyau, passage, seconde, jusquAuBassinPlein, lancee } = await partie();
    jusquAuBassinPlein();
    for (let t = 0; t < 20; t++) seconde();
    // Une absence de dix minutes, à dix secondes de la descente.
    noyau.rattraper(noyau.etat.reference + 600_000);
    passage.actualiser();
    for (let t = 1; t < CRUE; t++) seconde();
    expect(passage.occupe).toBe(false);
    seconde();
    expect(await lancee()).toBe(true);
  });

  it("fait résister le sol au bouton « creuser », du premier instant au bassin plein", async () => {
    const { noyau, passage, appels, seconde, jusquAuBassinPlein } = await partie(false);
    await passage.creuser();
    jusquAuBassinPlein();
    for (let t = 0; t <= CRUE; t++) seconde();
    expect(noyau.seuil).toEqual({ atteint: true, automatique: true });
    await passage.creuser();
    expect(appels.resister).toBe(2);
    expect(passage.phase).toBe("jeu");
    // Sans le fond, le lit plein reste là : la suite n'existe pas encore, et le jeu le dit une fois.
    expect(appels.messages).toEqual([PAS_DE_SUITE]);
    expect(noyau.etat.profondeur).toBe(7);
  });

  it("dure deux fois le travelling habituel", () => {
    expect(DUREES.lente.descente).toBe(8000);
  });
});

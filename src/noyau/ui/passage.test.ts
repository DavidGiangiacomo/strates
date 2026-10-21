// Le passage d'une strate à la suivante, du côté de l'interface (docs/strates/descente-1-2.md).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  creerLogiqueFactice,
  type ActionFactice,
  type EtatFactice,
} from "../../strates/factice/logique";
import { inventaire } from "../logique/artefacts";
import { creerEtatNoyau, type EtatNoyau } from "../logique/etat";
import { Noyau } from "../logique/noyau";
import { Registre, type StrateQuelconque } from "../logique/registre";
import type { LogiqueStrate } from "../logique/types";
import { DUREES, PAS_DE_SUITE, Passage, type EvenementPassage, type Phase } from "./passage.svelte";
import type { SonNoyau } from "./sons";

type LogiqueFactice = LogiqueStrate<EtatFactice, ActionFactice>;

const DEBUT = 1_000_000;
const APPARENCE = { police: "serif", couleur: "black", fond: "white" };

async function partie(
  logiques: LogiqueFactice[] = [creerLogiqueFactice(1), creerLogiqueFactice(2)],
  sauvegarder?: () => Promise<unknown>,
  etat: EtatNoyau = creerEtatNoyau(1, DEBUT),
) {
  const registre = new Registre();
  for (const logique of logiques) {
    registre.enregistrer(
      logique.numero,
      async () =>
        ({
          logique,
          vue: null,
          textes: { "fouille.valeur": "Unités produites" },
          formaterValeur: (v: number) => `${Math.floor(v)} u`,
          apparenceValeur: APPARENCE,
        }) as StrateQuelconque,
    );
  }
  const noyau = new Noyau(registre, etat);
  await noyau.demarrer(DEBUT);

  const appels = {
    resister: 0,
    changer: 0,
    sauvegarder: 0,
    messages: [] as string[],
    evenements: [] as EvenementPassage[],
    sons: [] as [SonNoyau, number | undefined][],
  };
  const passage = new Passage({
    noyau,
    maintenant: () => DEBUT + Date.now(),
    attendre: (ms) => new Promise((fin) => setTimeout(fin, ms)),
    sauvegarder:
      sauvegarder ??
      (async () => {
        appels.sauvegarder++;
        return true;
      }),
    changerStrate: () => appels.changer++,
    resister: () => appels.resister++,
    sonner: (son, duree) => appels.sons.push([son, duree]),
    signaler: (m) => appels.messages.push(m),
    surEvenement: (e) => appels.evenements.push(e),
  });
  return { noyau, passage, appels };
}

function auSeuil(noyau: Noyau): void {
  (noyau.etatStrate as EtatFactice).cumul = 6.12e8;
  noyau.tick(0);
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("le coup de pioche", () => {
  it("fait résister le sol avant le seuil : le bandeau tressaille, le sol sonne sourd", async () => {
    const { passage, appels } = await partie();
    await passage.creuser();
    expect(appels.resister).toBe(1);
    expect(appels.sons).toEqual([["resiste", undefined]]);
    expect(passage.phase).toBe("jeu");
  });

  it("dit que la suite n'existe pas encore quand aucune strate n'est dessous", async () => {
    const { noyau, passage, appels } = await partie([creerLogiqueFactice(1)]);
    auSeuil(noyau);
    await passage.creuser();
    expect(appels.messages).toEqual([PAS_DE_SUITE]);
    expect(passage.phase).toBe("jeu");
    expect(noyau.suspendu).toBe(false);
  });

  it("ouvre la fouille au seuil : la strate se fend, puis l'écran de fouille", async () => {
    const { noyau, passage, appels } = await partie();
    auSeuil(noyau);
    const creuse = passage.creuser();
    expect(passage.phase).toBe("pioche");
    // Le coup de pioche s'entend dès le clic : le coup sourd, puis l'éboulement.
    expect(appels.sons).toEqual([["pioche", undefined]]);
    expect(noyau.suspendu).toBe(true);
    expect(passage.ecran).toMatchObject({
      nom: "La surface",
      libelle: "Unités produites",
      fouille: { strate: 1, points: 12 },
      apparence: APPARENCE,
    });
    expect(passage.ecran?.formater(612.7)).toBe("612 u");

    await vi.advanceTimersByTimeAsync(DUREES.pioche);
    await creuse;
    expect(passage.phase).toBe("fouille");
  });

  it("écrit sur l'écran la formule de la conversion, à partir de κ = 51 seulement", async () => {
    for (const [kappa, formule] of [
      [50, undefined],
      [51, "points = ⌊log₁₀(unités produites) × 1,4⌋"],
    ] as const) {
      const { noyau, passage } = await partie();
      passage.kappa = kappa;
      auSeuil(noyau);
      void passage.creuser();
      expect(passage.ecran?.formule, `κ = ${kappa}`).toBe(formule);
    }
  });

  it("ne répond pas pendant la séquence", async () => {
    const { noyau, passage } = await partie();
    auSeuil(noyau);
    void passage.creuser();
    const fouille = passage.ecran;
    await passage.creuser();
    expect(passage.ecran).toBe(fouille);
  });
});

describe("reboucher", () => {
  it("referme la fouille : la strate reprend, rien n'est noté", async () => {
    const { noyau, passage } = await partie();
    auSeuil(noyau);
    void passage.creuser();
    await vi.advanceTimersByTimeAsync(DUREES.pioche);

    const rebouche = passage.reboucher();
    expect(passage.phase).toBe("rebouchage");
    expect(noyau.suspendu).toBe(true);
    await vi.advanceTimersByTimeAsync(DUREES.reboucher);
    await rebouche;
    expect(passage.phase).toBe("jeu");
    expect(passage.ecran).toBeNull();
    expect(noyau.suspendu).toBe(false);
    expect(noyau.etat.meta.journal.strates[0]?.fouille).toBeUndefined();
    // Le sol a été ouvert une fois : la fissure reste dessinée, jusqu'à la descente.
    expect(passage.cicatrice).toBe(true);
  });
});

describe("la descente", () => {
  async function jusquAuChoix(sauvegarder?: () => Promise<unknown>) {
    const p = await partie(undefined, sauvegarder);
    auSeuil(p.noyau);
    void p.passage.creuser();
    await vi.advanceTimersByTimeAsync(DUREES.pioche);
    return p;
  }

  it("engage, sauvegarde, monte la nouvelle strate, puis suit le storyboard jusqu'au temps qui part", async () => {
    const { noyau, passage, appels } = await jusquAuChoix();
    const phases: Phase[] = [];
    const descend = passage.descendre(["s1-equipe", "s1-turbine"]);
    await vi.advanceTimersByTimeAsync(0);

    // Tout est engagé avant le spectacle.
    expect(noyau.etat.profondeur).toBe(2);
    expect(appels).toMatchObject({ changer: 1, sauvegarder: 1 });
    expect(passage.phase).toBe("descente");
    // Le sol gronde pendant tout le travelling.
    expect(appels.sons.at(-1)).toEqual(["descente", DUREES.descente / 1000]);
    // Les objets emportés descendent avec le joueur, sous leur nom d'en haut, intacts.
    expect(passage.transportes.map((o) => [o.nom, o.niveau])).toEqual([
      ["L'équipe", "puissant"],
      ["La turbine", "puissant"],
    ]);
    // Le bandeau suit le spectacle : la Profondeur change à mi-course, les objets à l'arrivée, puis
    // la Compréhension. La surface a été passée sans aide : 3 points, déjà crédités au noyau.
    expect(passage.profondeur).toBe(1);
    expect(passage.artefacts).toEqual([]);
    expect(noyau.etat.kappa).toBe(3);
    expect(passage.kappa).toBe(0);
    expect(noyau.suspendu).toBe(true);

    await vi.advanceTimersByTimeAsync(DUREES.miCourse);
    expect(passage.profondeur).toBe(2);
    await vi.advanceTimersByTimeAsync(DUREES.descente - DUREES.miCourse);
    phases.push(passage.phase);
    expect(passage.artefacts).toEqual(["s1-equipe"]);
    expect(passage.kappa).toBe(0);
    await vi.advanceTimersByTimeAsync(DUREES.parObjet);
    expect(passage.artefacts).toEqual(["s1-equipe", "s1-turbine"]);
    await vi.advanceTimersByTimeAsync(DUREES.parObjet);
    expect(passage.kappa).toBe(3);
    expect(noyau.suspendu).toBe(true);

    await vi.advanceTimersByTimeAsync(DUREES.arrivee);
    await descend;
    phases.push(passage.phase);
    expect(phases).toEqual(["arrivee", "jeu"]);
    expect(noyau.suspendu).toBe(false);
    expect(passage.ecran).toBeNull();
    expect(passage.transportes).toEqual([]);
    expect(passage.occupe).toBe(false);
  });

  it("montre l'erreur et garde la fouille ouverte si le choix est refusé", async () => {
    const { noyau, passage, appels } = await jusquAuChoix();
    await passage.descendre(["s1-plan", "s1-turbine", "s1-filiale", "s1-serveur"]);
    expect(appels.messages[0]).toMatch(/14 points de fouille/);
    expect(passage.phase).toBe("fouille");
    expect(passage.occupe).toBe(false);
    expect(noyau.etat.profondeur).toBe(1);
  });

  it("ne descend qu'une fois, même demandée deux fois", async () => {
    const { noyau, passage } = await jusquAuChoix();
    void passage.descendre([]);
    await passage.descendre([]);
    await vi.runAllTimersAsync();
    expect(noyau.etat.meta.journal.strates.filter((e) => e.fouille)).toHaveLength(1);
  });

  it("continue si la sauvegarde échoue : la sauvegarde automatique réessaiera", async () => {
    const { noyau, passage } = await jusquAuChoix(() => Promise.reject(new Error("disque plein")));
    const descend = passage.descendre([]);
    await vi.runAllTimersAsync();
    await descend;
    expect(passage.phase).toBe("jeu");
    expect(noyau.etat.profondeur).toBe(2);
    expect(noyau.suspendu).toBe(false);
  });

  it("descend seule, sans écran, quand la strate le demande", async () => {
    const automatique: LogiqueFactice = {
      ...creerLogiqueFactice(1),
      seuil: (e) => ({ atteint: e.cumul >= 1000, automatique: true }),
    };
    const { noyau, passage } = await partie([automatique, creerLogiqueFactice(2)]);
    await passage.descendre();
    expect(noyau.etat.profondeur).toBe(1);

    auSeuil(noyau);
    const descend = passage.descendre();
    await vi.advanceTimersByTimeAsync(0);
    expect(passage.phase).toBe("descente");
    expect(passage.ecran).toBeNull();
    await vi.runAllTimersAsync();
    await descend;
    expect(noyau.etat.profondeur).toBe(2);
    expect(noyau.etat.artefacts).toEqual(noyau.etat.meta.journal.strates[0]?.fouille?.emportes);
  });
});

describe("l'inventaire et l'usure", () => {
  /** Des caves factices, qui nomment l'équipe dès l'arrivée. */
  const caves: LogiqueFactice = { ...creerLogiqueFactice(2), nommes: () => ["s1-equipe"] };
  const vus = (passage: Passage) => passage.transportes.map((o) => `${o.nom} · ${o.niveau}`);
  const inventaireDe = (passage: Passage) =>
    inventaire(passage.artefacts, passage.profondeur, passage.nommes).map(
      (o) => `${o.nom} · ${o.niveau}`,
    );

  async function descendre(passage: Passage, emportes: string[]): Promise<void> {
    void passage.creuser();
    await vi.advanceTimersByTimeAsync(DUREES.pioche);
    void passage.descendre(emportes);
    await vi.advanceTimersByTimeAsync(0);
  }

  it("s'affichent sur deux descentes successives : les noms connus, et l'usure qui change à mi-course", async () => {
    const strates = [creerLogiqueFactice(1), caves, creerLogiqueFactice(3)];
    const { noyau, passage } = await partie(strates);
    expect(inventaireDe(passage)).toEqual([]);

    // Vers les caves : les objets de la surface, sous leur nom d'en haut, intacts.
    auSeuil(noyau);
    await descendre(passage, ["s1-equipe", "s1-turbine"]);
    expect(vus(passage)).toEqual(["L'équipe · puissant", "La turbine · puissant"]);
    // Le noyau est déjà en bas, où les caves ont nommé l'équipe : l'inventaire l'apprendra à l'arrivée.
    expect(noyau.nommes).toEqual(["s1-equipe"]);
    passage.actualiser();
    expect(passage.nommes).toEqual([]);
    await vi.advanceTimersByTimeAsync(DUREES.miCourse);
    expect(vus(passage)).toEqual(["L'équipe · puissant", "La turbine · puissant"]);
    await vi.runAllTimersAsync();
    expect(passage.phase).toBe("jeu");
    expect(inventaireDe(passage)).toEqual(["les bras en plus · puissant", "La turbine · puissant"]);

    // Vers l'atelier : la surface perd un cran à mi-course ; la faucille arrive intacte.
    auSeuil(noyau);
    await descendre(passage, ["s2-faucille"]);
    expect(vus(passage)).toEqual([
      "les bras en plus · puissant",
      "La turbine · puissant",
      "La faucille · puissant",
    ]);
    await vi.advanceTimersByTimeAsync(DUREES.miCourse);
    expect(passage.profondeur).toBe(3);
    expect(vus(passage)).toEqual([
      "les bras en plus · utile",
      "La turbine · utile",
      "La faucille · puissant",
    ]);
    await vi.runAllTimersAsync();
    // L'équipe garde plus bas le nom que lui ont donné les caves.
    expect(inventaireDe(passage)).toEqual([
      "les bras en plus · utile",
      "La turbine · utile",
      "La faucille · puissant",
    ]);
    expect(passage.transportes).toEqual([]);
  });

  it("laisse les cailloux en haut, et fait des plus vieux objets des cailloux à mi-course", async () => {
    const etat = creerEtatNoyau(1, DEBUT);
    etat.profondeur = 5;
    etat.artefacts = ["s1-turbine", "s2-faucille", "s4-carnet"];
    const strates = [creerLogiqueFactice(5), creerLogiqueFactice(6)];
    const { noyau, passage } = await partie(strates, undefined, etat);
    expect(inventaireDe(passage)).toEqual([
      "La turbine · inerte",
      "La faucille · decoratif",
      "Le carnet de relevés · puissant",
    ]);

    auSeuil(noyau);
    await descendre(passage, ["s5-souffle"]);
    expect(vus(passage)).toEqual([
      "La faucille · decoratif",
      "Le carnet de relevés · puissant",
      "Le souffle · puissant",
    ]);
    await vi.advanceTimersByTimeAsync(DUREES.miCourse);
    expect(vus(passage)).toEqual([
      "La faucille · inerte",
      "Le carnet de relevés · utile",
      "Le souffle · puissant",
    ]);
  });

  it("suit les objets que la strate nomme en cours de jeu, mais pas pendant la séquence", async () => {
    const nommes: string[] = [];
    const strate: LogiqueFactice = { ...creerLogiqueFactice(2), nommes: () => nommes };
    const etat = creerEtatNoyau(1, DEBUT);
    etat.profondeur = 2;
    etat.artefacts = ["s1-equipe", "s1-turbine"];
    const { noyau, passage } = await partie([strate, creerLogiqueFactice(3)], undefined, etat);
    const avant = passage.nommes;
    passage.actualiser();
    // Rien n'a changé : le même tableau, pour ne pas réveiller l'interface.
    expect(passage.nommes).toBe(avant);

    nommes.push("s1-turbine");
    passage.actualiser();
    expect(passage.nommes).toEqual(["s1-turbine"]);

    auSeuil(noyau);
    void passage.creuser();
    nommes.push("s1-equipe");
    passage.actualiser();
    expect(passage.nommes).toEqual(["s1-turbine"]);
  });
});

describe("le journal de session", () => {
  it("reçoit les réponses de « creuser », la fouille, le choix et chaque phase", async () => {
    const { noyau, passage, appels } = await partie();
    await passage.creuser();
    auSeuil(noyau);
    void passage.creuser();
    await vi.advanceTimersByTimeAsync(DUREES.pioche);
    void passage.reboucher();
    await vi.advanceTimersByTimeAsync(DUREES.reboucher);
    void passage.creuser();
    await vi.advanceTimersByTimeAsync(DUREES.pioche);
    void passage.descendre(["s1-equipe"]);
    await vi.runAllTimersAsync();

    const resume = appels.evenements.map((e) =>
      e.type === "phase" ? e.phase : e.type === "creuser" ? `creuser:${e.reponse}` : e.type,
    );
    expect(resume).toEqual([
      "creuser:resiste",
      "creuser:fouille",
      "fouille",
      "pioche",
      "fouille",
      "reboucher",
      "rebouchage",
      "jeu",
      "creuser:fouille",
      "fouille",
      "pioche",
      "fouille",
      "descendre",
      "descente",
      "arrivee",
      "jeu",
    ]);
    expect(appels.evenements).toContainEqual({
      type: "descendre",
      emportes: ["s1-equipe"],
      abandonnes: ["s1-double-ecran", "s1-serveur", "s1-filiale", "s1-turbine", "s1-plan"],
    });
    expect(appels.evenements).toContainEqual(
      expect.objectContaining({ type: "fouille", points: 12 }),
    );
  });
});

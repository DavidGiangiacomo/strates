import { describe, expect, it, vi } from "vitest";
import {
  creerLogiqueFactice,
  type ActionFactice,
  type EtatFactice,
} from "../../strates/factice/logique";
import { deriverGraine } from "./alea";
import { creerEtatNoyau, estNumeroStrate } from "./etat";
import { Noyau, PAS } from "./noyau";
import { Registre, type StrateQuelconque } from "./registre";
import type { LogiqueStrate } from "./types";

type LogiqueFactice = LogiqueStrate<EtatFactice, ActionFactice>;

function registreAvec(logique: LogiqueFactice = creerLogiqueFactice(1)): Registre {
  const registre = new Registre();
  registre.enregistrer(
    logique.numero,
    async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque,
  );
  return registre;
}

async function noyauDemarre(graine = 1, logique?: LogiqueFactice): Promise<Noyau> {
  const noyau = new Noyau(registreAvec(logique), creerEtatNoyau(graine, 0));
  await noyau.demarrer(1_000);
  return noyau;
}

const etatDe = (noyau: Noyau) => noyau.etatStrate as EtatFactice;

describe("l'état global", () => {
  it("commence à la surface, sans artefact ni compréhension", () => {
    const etat = creerEtatNoyau(7, 0);
    expect(etat).toMatchObject({ profondeur: 1, artefacts: [], kappa: 0, graine: 7, strates: {} });
    expect(etat.meta.journal.strates).toEqual([]);
  });

  it("n'accepte comme profondeur qu'un entier de 1 à 8", () => {
    expect([1, 4, 8].every(estNumeroStrate)).toBe(true);
    expect([0, 9, 1.5, NaN, "1", null].some(estNumeroStrate)).toBe(false);
    const etat = { ...creerEtatNoyau(1, 0), profondeur: 2.5 } as never;
    expect(() => new Noyau(new Registre(), etat)).toThrow(/Profondeur invalide/);
  });
});

describe("le démarrage", () => {
  it("crée l'état de la strate courante, avec une graine dérivée de la partie", async () => {
    const noyau = await noyauDemarre(123);
    expect(noyau.etat.strates[1]?.version).toBe(1);
    expect(etatDe(noyau)).toMatchObject({ unites: 0, cumul: 0, generateurs: 0 });
    expect(etatDe(noyau).alea.s).toBe(deriverGraine(123, 1));
  });

  it("ouvre une entrée de journal pour la strate, une seule fois", async () => {
    const noyau = await noyauDemarre();
    await noyau.demarrer(5_000);
    expect(noyau.etat.meta.journal.strates).toEqual([
      {
        strate: 1,
        arrivee: 1_000,
        tempsDeJeu: 0,
        tempsHorsLigne: 0,
        aideConsultee: false,
        perturbations: [],
      },
    ]);
  });

  it("reprend l'état existant d'une strate au lieu de le recréer", async () => {
    const noyau = await noyauDemarre();
    noyau.agir({ type: "produire" });
    noyau.tick(0);
    const repris = new Noyau(registreAvec(), noyau.etat);
    await repris.demarrer(2_000);
    expect(etatDe(repris).unites).toBe(1);
  });

  it("migre l'état d'une strate venu d'une version antérieure", async () => {
    // Version 3 de la strate factice : la v1 appelait « stock » ce que la v2 appelle « unites »,
    // et la v3 a ajouté le cumul.
    const logique: LogiqueFactice = {
      ...creerLogiqueFactice(1),
      versionEtat: 3,
      migrations: {
        1: (e) => {
          const { stock, ...reste } = e as { stock: number };
          return { ...reste, unites: stock };
        },
        2: (e) => ({ ...(e as EtatFactice), cumul: (e as EtatFactice).unites }),
      },
    };
    const etat = creerEtatNoyau(1, 0);
    etat.strates[1] = { version: 1, etat: { stock: 42, generateurs: 2, alea: { s: 7 } } };
    const noyau = new Noyau(registreAvec(logique), etat);
    await noyau.demarrer(0);
    expect(noyau.etat.strates[1]).toEqual({
      version: 3,
      etat: { unites: 42, cumul: 42, generateurs: 2, alea: { s: 7 } },
    });
  });

  it("refuse un état de strate plus récent que la strate", async () => {
    const etat = creerEtatNoyau(1, 0);
    etat.strates[1] = { version: 2, etat: {} };
    await expect(new Noyau(registreAvec(), etat).demarrer(0)).rejects.toThrow(/plus récente/);
  });

  it("signale une migration manquante", async () => {
    const logique: LogiqueFactice = { ...creerLogiqueFactice(1), versionEtat: 2, migrations: {} };
    const etat = creerEtatNoyau(1, 0);
    etat.strates[1] = { version: 1, etat: {} };
    await expect(new Noyau(registreAvec(logique), etat).demarrer(0)).rejects.toThrow(
      /migration manquante de la version 1 à 2/,
    );
  });

  it("refuse d'avancer avant d'être démarré", () => {
    const noyau = new Noyau(registreAvec(), creerEtatNoyau(1, 0));
    expect(() => noyau.tick(PAS)).toThrow(/pas démarré/);
  });
});

describe("la boucle de tick", () => {
  it("applique les actions au début du tick suivant, dans l'ordre", async () => {
    const noyau = await noyauDemarre();
    for (let i = 0; i < 10; i++) noyau.agir({ type: "produire" });
    noyau.agir({ type: "acheter" });
    expect(etatDe(noyau).unites).toBe(0);
    noyau.tick(0);
    expect(etatDe(noyau)).toMatchObject({ unites: 0, generateurs: 1 });
  });

  it("découpe un tick en pas égaux qui ne dépassent pas le pasMax de la strate", async () => {
    const logique = creerLogiqueFactice(1);
    const tick = vi.spyOn(logique, "tick");
    const noyau = await noyauDemarre(1, logique);
    noyau.tick(2.5);
    expect(tick).toHaveBeenCalledTimes(3);
    for (const [, dt] of tick.mock.calls) expect(dt).toBeCloseTo(2.5 / 3);
  });

  it("avance par pas fixes et garde le reste pour l'appel suivant", async () => {
    const noyau = await noyauDemarre();
    expect(noyau.avancer(0.25)).toBe(2);
    expect(noyau.avancer(0.04)).toBe(0);
    expect(noyau.avancer(0.01)).toBe(1);
  });

  it("ne dérive pas sur de nombreuses images", async () => {
    const noyau = await noyauDemarre();
    let ticks = 0;
    for (let i = 0; i < 6000; i++) ticks += noyau.avancer(1 / 60);
    expect(ticks).toBe(1000);
    expect(noyau.etat.meta.journal.strates[0]?.tempsDeJeu).toBeCloseTo(100);
  });

  it("fait produire la strate avec le temps", async () => {
    const noyau = await noyauDemarre();
    etatDe(noyau).unites = 10;
    noyau.agir({ type: "acheter" });
    noyau.avancer(10);
    expect(etatDe(noyau).unites).toBeCloseTo(10 - 10 + 10 * 1);
  });

  it("refuse une durée négative ou infinie", async () => {
    const noyau = await noyauDemarre();
    expect(() => noyau.avancer(-1)).toThrow(RangeError);
    expect(() => noyau.avancer(Infinity)).toThrow(RangeError);
    expect(() => noyau.tick(NaN)).toThrow(RangeError);
  });

  it("met à jour le seuil après chaque tick", async () => {
    const noyau = await noyauDemarre();
    expect(noyau.seuil.atteint).toBe(false);
    etatDe(noyau).cumul = 999;
    noyau.agir({ type: "produire" });
    noyau.tick(0);
    expect(noyau.seuil.atteint).toBe(true);
  });

  it("recueille les événements émis par la strate", async () => {
    const noyau = await noyauDemarre();
    etatDe(noyau).unites = 10;
    noyau.agir({ type: "acheter" });
    noyau.tick(0);
    expect(noyau.viderEvenements()).toEqual([{ type: "acte", acte: "premier-achat" }]);
    expect(noyau.viderEvenements()).toEqual([]);
  });

  it("utilise l'état de remplacement pour la suite", async () => {
    const noyau = await noyauDemarre();
    const remplacant = { ...etatDe(noyau), unites: 50 };
    noyau.remplacerEtatStrate(remplacant);
    noyau.agir({ type: "produire" });
    noyau.tick(0);
    expect(remplacant.unites).toBe(51);
    expect(noyau.etat.strates[1]?.etat).toBe(remplacant);
  });
});

describe("le déterminisme", () => {
  it("donne exactement le même état pour la même graine et les mêmes actions", async () => {
    async function partie(): Promise<string> {
      const noyau = await noyauDemarre(2024);
      for (let i = 0; i < 300; i++) {
        noyau.agir({ type: i % 3 === 0 ? "hasard" : "produire" });
        if (i % 50 === 0) noyau.agir({ type: "acheter" });
        noyau.avancer(0.137);
      }
      return JSON.stringify(noyau.etat);
    }
    expect(await partie()).toBe(await partie());
  });
});

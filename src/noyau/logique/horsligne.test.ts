import { describe, expect, it, vi } from "vitest";
import {
  creerLogiqueFactice,
  type ActionFactice,
  type EtatFactice,
} from "../../strates/factice/logique";
import { creerEtatNoyau } from "./etat";
import { PLAFOND_HORS_LIGNE, SEUIL_ABSENCE } from "./horsligne";
import { Noyau } from "./noyau";
import { Registre, type StrateQuelconque } from "./registre";
import type { LogiqueStrate } from "./types";

type LogiqueFactice = LogiqueStrate<EtatFactice, ActionFactice>;

const S = 1000;
const MIN = 60 * S;
const H = 60 * MIN;

/** Horodatage de la dernière référence connue, au départ de chaque test (ms). */
const REFERENCE = 1_000 * H;

/** Un noyau démarré, avec un générateur qui produit une unité par seconde. */
async function noyauProductif(logique: LogiqueFactice = creerLogiqueFactice(1)): Promise<Noyau> {
  const registre = new Registre();
  registre.enregistrer(
    logique.numero,
    async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque,
  );
  const noyau = new Noyau(registre, creerEtatNoyau(1, REFERENCE));
  await noyau.demarrer(REFERENCE);
  etatDe(noyau).generateurs = 1;
  return noyau;
}

const etatDe = (noyau: Noyau) => noyau.etatStrate as EtatFactice;
const journalDe = (noyau: Noyau) => noyau.etat.meta.journal.strates[0]!;

describe("le hors-ligne standard", () => {
  it("fait produire 80 % de l'absence, compté comme temps hors ligne", async () => {
    const noyau = await noyauProductif();
    const reprise = noyau.rattraper(REFERENCE + H);

    expect(reprise).toEqual({
      type: "absence",
      politique: "standard",
      duree: 3600,
      comptee: 3600,
      lignes: [],
    });
    expect(etatDe(noyau).cumul).toBeCloseTo(2880, 6);
    expect(journalDe(noyau)).toMatchObject({ tempsHorsLigne: 3600, tempsDeJeu: 0 });
    expect(noyau.etat.reference).toBe(REFERENCE + H);
  });

  it("ne compte pas plus de 12 heures", async () => {
    const noyau = await noyauProductif();
    const reprise = noyau.rattraper(REFERENCE + 72 * H);

    expect(reprise).toMatchObject({ duree: 72 * 3600, comptee: PLAFOND_HORS_LIGNE });
    expect(etatDe(noyau).cumul).toBeCloseTo(PLAFOND_HORS_LIGNE * 0.8, 6);
    expect(journalDe(noyau).tempsHorsLigne).toBe(PLAFOND_HORS_LIGNE);
  });

  it("compte 12 heures pile en entier", async () => {
    const noyau = await noyauProductif();
    expect(noyau.rattraper(REFERENCE + 12 * H)).toMatchObject({
      duree: PLAFOND_HORS_LIGNE,
      comptee: PLAFOND_HORS_LIGNE,
    });
  });

  it("simule l'absence par les ticks de la strate, sans dépasser son pasMax", async () => {
    const logique = creerLogiqueFactice(1);
    const tick = vi.spyOn(logique, "tick");
    const noyau = await noyauProductif(logique);
    noyau.rattraper(REFERENCE + 10 * MIN);

    expect(tick).toHaveBeenCalledTimes(480);
    expect(Math.max(...tick.mock.calls.map(([, dt]) => dt))).toBeLessThanOrEqual(logique.pasMax);
  });

  it("applique d'abord les actions en file", async () => {
    const noyau = await noyauProductif();
    Object.assign(etatDe(noyau), { unites: 10, generateurs: 0 });
    noyau.agir({ type: "acheter" });
    noyau.rattraper(REFERENCE + H);

    expect(etatDe(noyau).generateurs).toBe(1);
    expect(etatDe(noyau).unites).toBeCloseTo(2880, 6);
  });

  it("met à jour le seuil", async () => {
    const noyau = await noyauProductif();
    expect(noyau.seuil.atteint).toBe(false);
    noyau.rattraper(REFERENCE + H);
    expect(noyau.seuil.atteint).toBe(true);
  });

  it("ne fait rien sans écart", async () => {
    const noyau = await noyauProductif();
    expect(noyau.rattraper(REFERENCE)).toEqual({ type: "aucune" });
    expect(etatDe(noyau).cumul).toBe(0);
  });
});

describe("les autres politiques", () => {
  it("laisse la strate calculer elle-même l'absence, sans plafond", async () => {
    const logique: LogiqueFactice = {
      ...creerLogiqueFactice(1),
      horsLigne: { type: "propre" },
      absence(etat, duree) {
        etat.unites += duree;
        return { lignes: [`${duree} unités sédimentées.`] };
      },
    };
    const noyau = await noyauProductif(logique);
    const reprise = noyau.rattraper(REFERENCE + 72 * H);

    expect(reprise).toEqual({
      type: "absence",
      politique: "propre",
      duree: 72 * 3600,
      comptee: 72 * 3600,
      lignes: ["259200 unités sédimentées."],
    });
    expect(etatDe(noyau).unites).toBe(72 * 3600);
    expect(journalDe(noyau).tempsHorsLigne).toBe(72 * 3600);
  });

  it("refuse une politique propre sans absence()", async () => {
    const logique: LogiqueFactice = { ...creerLogiqueFactice(1), horsLigne: { type: "propre" } };
    const noyau = await noyauProductif(logique);
    expect(() => noyau.rattraper(REFERENCE + H)).toThrow(/absence\(\)/);
  });

  it("ne fait rien passer au fond, mais la référence avance", async () => {
    const logique: LogiqueFactice = { ...creerLogiqueFactice(1), horsLigne: { type: "aucune" } };
    const noyau = await noyauProductif(logique);
    const reprise = noyau.rattraper(REFERENCE + H);

    expect(reprise).toMatchObject({ politique: "aucune", duree: 3600, comptee: 0 });
    expect(etatDe(noyau).cumul).toBe(0);
    expect(journalDe(noyau).tempsHorsLigne).toBe(0);
    expect(noyau.etat.reference).toBe(REFERENCE + H);
  });
});

describe("les reculs d'horloge", () => {
  it("comptent pour zéro, sans perturbation en deçà de 5 minutes", async () => {
    const noyau = await noyauProductif();
    expect(noyau.rattraper(REFERENCE - 2 * MIN)).toEqual({
      type: "recul",
      recul: 120,
      perturbation: false,
    });
    expect(etatDe(noyau).cumul).toBe(0);
    expect(noyau.etat.reference).toBe(REFERENCE);
    expect(journalDe(noyau).perturbations).toEqual([]);
  });

  it("notent une perturbation au-delà de 5 minutes, une seule fois par épisode", async () => {
    const noyau = await noyauProductif();
    expect(noyau.rattraper(REFERENCE - 2 * H)).toMatchObject({ recul: 7200, perturbation: true });
    // Le joueur recharge la page une minute plus tard : c'est le même épisode.
    expect(noyau.rattraper(REFERENCE - 2 * H + MIN)).toMatchObject({ perturbation: false });

    expect(journalDe(noyau).perturbations).toEqual([{ le: REFERENCE - 2 * H, recul: 7200 }]);
    expect(noyau.etat.reference).toBe(REFERENCE);
  });

  it("notent un nouvel épisode une fois l'horloge revenue à la référence", async () => {
    const noyau = await noyauProductif();
    noyau.rattraper(REFERENCE - 2 * H);
    noyau.rattraper(REFERENCE + 1 * S);
    noyau.rattraper(REFERENCE - H);
    expect(journalDe(noyau).perturbations).toHaveLength(2);
  });

  it("ne font rien gagner : reculer puis revenir à l'heure ne compte pas l'écart", async () => {
    const noyau = await noyauProductif();
    noyau.rattraper(REFERENCE - 24 * H);
    expect(noyau.rattraper(REFERENCE)).toEqual({ type: "aucune" });
    expect(etatDe(noyau).cumul).toBe(0);
  });
});

describe("la boucle, image par image", () => {
  it("joue normalement un petit écart, et la référence suit l'horloge", async () => {
    const noyau = await noyauProductif();
    expect(noyau.avancerJusqua(REFERENCE + 1 * S, 1)).toBeNull();

    expect(etatDe(noyau).cumul).toBeCloseTo(1, 9);
    expect(journalDe(noyau)).toMatchObject({ tempsDeJeu: expect.closeTo(1, 9), tempsHorsLigne: 0 });
    expect(noyau.etat.reference).toBe(REFERENCE + 1 * S);
  });

  it("joue normalement une image lente, jusqu'au seuil d'absence", async () => {
    const noyau = await noyauProductif();
    expect(noyau.avancerJusqua(REFERENCE + SEUIL_ABSENCE * S, SEUIL_ABSENCE)).toBeNull();
    expect(journalDe(noyau).tempsHorsLigne).toBe(0);
  });

  it("rattrape un grand écart comme une absence, sans jouer l'image en plus", async () => {
    const noyau = await noyauProductif();
    const reprise = noyau.avancerJusqua(REFERENCE + 10 * MIN, SEUIL_ABSENCE);

    expect(reprise).toMatchObject({ type: "absence", duree: 600, comptee: 600 });
    expect(etatDe(noyau).cumul).toBeCloseTo(480, 6);
    expect(journalDe(noyau)).toMatchObject({ tempsDeJeu: 0, tempsHorsLigne: 600 });
  });

  it("continue de jouer pendant un recul, sans que la référence recule", async () => {
    const noyau = await noyauProductif();
    const reprise = noyau.avancerJusqua(REFERENCE - H, 0.5);
    expect(reprise).toMatchObject({ type: "recul", recul: 3600, perturbation: true });

    // Les images suivantes, pendant le même épisode : rien à signaler.
    expect(noyau.avancerJusqua(REFERENCE - H + 500, 0.5)).toBeNull();
    expect(noyau.avancerJusqua(REFERENCE - H + 1_000, 0.5)).toBeNull();

    expect(etatDe(noyau).cumul).toBeCloseTo(1.5, 9);
    expect(noyau.etat.reference).toBe(REFERENCE);
    expect(journalDe(noyau).perturbations).toHaveLength(1);
  });

  it("ne signale pas un petit recul", async () => {
    const noyau = await noyauProductif();
    expect(noyau.avancerJusqua(REFERENCE - 30 * S, 1)).toBeNull();
    expect(etatDe(noyau).cumul).toBeCloseTo(1, 9);
  });
});

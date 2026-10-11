import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SEUIL_ABSENCE, type Reprise } from "../logique/horsligne";
import type { Noyau } from "../logique/noyau";
import { demarrerBoucle } from "./boucle";

describe("la boucle des images", () => {
  let rappel: FrameRequestCallback | null;
  const annuler = vi.fn();

  beforeEach(() => {
    rappel = null;
    vi.stubGlobal("requestAnimationFrame", (f: FrameRequestCallback) => {
      rappel = f;
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", annuler);
    vi.spyOn(performance, "now").mockReturnValue(1_000);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    annuler.mockClear();
  });

  function image(instant: number): void {
    const f = rappel;
    if (!f) throw new Error("Aucune image demandée.");
    rappel = null;
    f(instant);
  }

  function noyauFactice(reprises: (Reprise | null)[] = []) {
    const avancerJusqua = vi.fn<Noyau["avancerJusqua"]>(() => reprises.shift() ?? null);
    return { noyau: { avancerJusqua } as unknown as Noyau, avancerJusqua };
  }

  it("fournit au noyau l'horloge système et le temps écoulé depuis l'image précédente", () => {
    const { noyau, avancerJusqua } = noyauFactice();
    let horloge = 50_000;
    demarrerBoucle(noyau, undefined, () => horloge);

    image(1_016);
    horloge += 20;
    image(1_036);

    expect(avancerJusqua.mock.calls).toEqual([
      [50_000, expect.closeTo(0.016, 9)],
      [50_020, expect.closeTo(0.02, 9)],
    ]);
  });

  it("appelle apresImage à la fin de chaque image, après le noyau", () => {
    const { noyau, avancerJusqua } = noyauFactice();
    const ordre: string[] = [];
    avancerJusqua.mockImplementation(() => {
      ordre.push("noyau");
      return null;
    });
    demarrerBoucle(
      noyau,
      undefined,
      () => 0,
      undefined,
      () => ordre.push("après"),
    );
    image(1_016);
    image(1_032);
    expect(ordre).toEqual(["noyau", "après", "noyau", "après"]);
  });

  it("borne le pas d'une image : au-delà, c'est au noyau de constater l'absence", () => {
    const { noyau, avancerJusqua } = noyauFactice();
    demarrerBoucle(noyau, undefined, () => 0);
    image(1_000 + 60_000);
    image(500);
    expect(avancerJusqua.mock.calls.map(([, dt]) => dt)).toEqual([SEUIL_ABSENCE, 0]);
  });

  it("multiplie le temps de jeu par la vitesse, sans toucher à l'horloge", () => {
    const { noyau, avancerJusqua } = noyauFactice();
    let vitesse = 1;
    demarrerBoucle(
      noyau,
      undefined,
      () => 7_000,
      () => vitesse,
    );
    image(1_016);
    vitesse = 100;
    image(1_032);
    expect(avancerJusqua.mock.calls).toEqual([
      [7_000, expect.closeTo(0.016, 9)],
      [7_000, expect.closeTo(1.6, 9)],
    ]);
  });

  it("transmet les reprises à signaler", () => {
    const absence: Reprise = {
      type: "absence",
      politique: "standard",
      duree: 60,
      comptee: 60,
      lignes: [],
    };
    const { noyau } = noyauFactice([null, absence]);
    const surReprise = vi.fn();
    demarrerBoucle(noyau, surReprise, () => 0);
    image(1_016);
    image(1_032);
    expect(surReprise.mock.calls).toEqual([[absence]]);
  });

  it("passe les images d'un onglet caché, et laisse toute l'absence à la première image du retour", () => {
    const { noyau, avancerJusqua } = noyauFactice();
    const apresImage = vi.fn();
    let horloge = 50_000;
    let cache = false;
    demarrerBoucle(
      noyau,
      undefined,
      () => horloge,
      undefined,
      apresImage,
      () => cache,
    );
    image(1_016);

    // Caché dix minutes : le navigateur donne encore quelques images, de plus en plus rares.
    cache = true;
    for (const attente of [1_000, 2_000, 4_000, 8_000]) {
      horloge += attente;
      image(horloge);
    }
    expect(avancerJusqua).toHaveBeenCalledTimes(1);
    expect(apresImage).toHaveBeenCalledTimes(1);

    cache = false;
    horloge = 50_000 + 600_000;
    image(horloge);
    expect(avancerJusqua.mock.calls[1]).toEqual([650_000, SEUIL_ABSENCE]);
    expect(apresImage).toHaveBeenCalledTimes(2);
  });

  it("continue de demander des images pendant que l'onglet est caché", () => {
    const { noyau } = noyauFactice();
    demarrerBoucle(
      noyau,
      undefined,
      () => 0,
      undefined,
      undefined,
      () => true,
    );
    image(1_016);
    expect(rappel).not.toBeNull();
  });

  it("s'arrête", () => {
    const { noyau } = noyauFactice();
    demarrerBoucle(noyau, undefined, () => 0)();
    expect(annuler).toHaveBeenCalledWith(1);
  });
});

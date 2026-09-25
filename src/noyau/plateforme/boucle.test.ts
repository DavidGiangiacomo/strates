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

  it("borne le pas d'une image : au-delà, c'est au noyau de constater l'absence", () => {
    const { noyau, avancerJusqua } = noyauFactice();
    demarrerBoucle(noyau, undefined, () => 0);
    image(1_000 + 60_000);
    image(500);
    expect(avancerJusqua.mock.calls.map(([, dt]) => dt)).toEqual([SEUIL_ABSENCE, 0]);
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

  it("s'arrête", () => {
    const { noyau } = noyauFactice();
    demarrerBoucle(noyau, undefined, () => 0)();
    expect(annuler).toHaveBeenCalledWith(1);
  });
});

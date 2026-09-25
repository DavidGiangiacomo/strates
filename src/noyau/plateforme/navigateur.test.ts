// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demarrerAutosauvegarde, INTERVALLE_AUTOSAUVEGARDE } from "./autosauvegarde";
import { ouvrirStockage, StockageMemoire, StockageNavigateur } from "./stockage";

describe("le stockage du navigateur", () => {
  beforeEach(() => localStorage.clear());

  it("lit et écrit dans localStorage", async () => {
    const stockage = new StockageNavigateur(localStorage);
    expect(await stockage.lire("cle")).toBeNull();
    await stockage.ecrire("cle", "valeur");
    expect(localStorage.getItem("cle")).toBe("valeur");
    expect(await stockage.lire("cle")).toBe("valeur");
  });

  it("écrit tout de suite, sans attendre : une écriture lancée à la fermeture aboutit", () => {
    void new StockageNavigateur(localStorage).ecrire("cle", "valeur");
    expect(localStorage.getItem("cle")).toBe("valeur");
  });

  it("s'ouvre sur localStorage quand il est accessible", () => {
    const { stockage, persistant } = ouvrirStockage();
    expect(stockage).toBeInstanceOf(StockageNavigateur);
    expect(persistant).toBe(true);
  });

  it("se replie sur la mémoire quand localStorage est refusé", () => {
    const acces = vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("refusé", "SecurityError");
    });
    const { stockage, persistant } = ouvrirStockage();
    expect(stockage).toBeInstanceOf(StockageMemoire);
    expect(persistant).toBe(false);
    acces.mockRestore();
  });
});

describe("la sauvegarde automatique", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function visibilite(etat: DocumentVisibilityState): void {
    Object.defineProperty(document, "visibilityState", { value: etat, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  }

  it("sauvegarde toutes les 30 secondes", () => {
    const sauvegarder = vi.fn();
    const arreter = demarrerAutosauvegarde(sauvegarder);
    vi.advanceTimersByTime(INTERVALLE_AUTOSAUVEGARDE * 3);
    expect(sauvegarder).toHaveBeenCalledTimes(3);
    arreter();
  });

  it("sauvegarde quand la page passe en arrière-plan, pas quand elle revient", () => {
    const sauvegarder = vi.fn();
    const arreter = demarrerAutosauvegarde(sauvegarder);
    visibilite("hidden");
    visibilite("visible");
    expect(sauvegarder).toHaveBeenCalledTimes(1);
    arreter();
  });

  it("sauvegarde quand la page se ferme", () => {
    const sauvegarder = vi.fn();
    const arreter = demarrerAutosauvegarde(sauvegarder);
    window.dispatchEvent(new Event("pagehide"));
    expect(sauvegarder).toHaveBeenCalledTimes(1);
    arreter();
  });

  it("s'arrête complètement", () => {
    const sauvegarder = vi.fn();
    demarrerAutosauvegarde(sauvegarder)();
    vi.advanceTimersByTime(INTERVALLE_AUTOSAUVEGARDE * 2);
    visibilite("hidden");
    window.dispatchEvent(new Event("pagehide"));
    expect(sauvegarder).not.toHaveBeenCalled();
  });
});

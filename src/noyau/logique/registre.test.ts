import { describe, expect, it, vi } from "vitest";
import { creerLogiqueFactice } from "../../strates/factice/logique";
import { Registre, type StrateQuelconque } from "./registre";
import type { NumeroStrate } from "./types";

function factice(numero: NumeroStrate): StrateQuelconque {
  return { logique: creerLogiqueFactice(numero), vue: null, textes: {} };
}

describe("le registre des strates", () => {
  it("charge la strate enregistrée à une profondeur", async () => {
    const registre = new Registre();
    registre.enregistrer(2, async () => factice(2));
    const strate = await registre.charger(2);
    expect(strate.logique.numero).toBe(2);
  });

  it("ne charge qu'une fois", async () => {
    const registre = new Registre();
    const chargeur = vi.fn(async () => factice(1));
    registre.enregistrer(1, chargeur);
    const [a, b] = await Promise.all([registre.charger(1), registre.charger(1)]);
    await registre.charger(1);
    expect(chargeur).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it("refuse une profondeur sans strate", async () => {
    await expect(new Registre().charger(3)).rejects.toThrow(/profondeur 3/);
  });

  it("refuse deux strates à la même profondeur", () => {
    const registre = new Registre();
    registre.enregistrer(1, async () => factice(1));
    expect(() => registre.enregistrer(1, async () => factice(1))).toThrow(/déjà enregistrée/);
  });

  it("refuse une strate qui se déclare à une autre profondeur", async () => {
    const registre = new Registre();
    registre.enregistrer(4, async () => factice(5));
    await expect(registre.charger(4)).rejects.toThrow(/se déclare strate 5/);
  });

  it("permet de retenter un chargement raté", async () => {
    const registre = new Registre();
    const chargeur = vi
      .fn<() => Promise<StrateQuelconque>>()
      .mockRejectedValueOnce(new Error("réseau coupé"))
      .mockResolvedValueOnce(factice(1));
    registre.enregistrer(1, chargeur);
    await expect(registre.charger(1)).rejects.toThrow("réseau coupé");
    await expect(registre.charger(1)).resolves.toMatchObject({ logique: { numero: 1 } });
  });
});

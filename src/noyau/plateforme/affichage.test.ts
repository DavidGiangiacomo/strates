// @vitest-environment happy-dom
// La taille du texte (#48) : trois tailles, gardées dans le navigateur, appliquées en zoom.
import { describe, expect, it } from "vitest";
import type { ZonePreferences } from "./audio";
import {
  appliquerTailleTexte,
  CLE_TAILLE_TEXTE,
  ecrireTailleTexte,
  lireTailleTexte,
  TAILLES_TEXTE,
} from "./affichage";
import { zoomEcran } from "../ui/ecran";

class Zone implements ZonePreferences {
  contenu = new Map<string, string>();
  getItem(cle: string) {
    return this.contenu.get(cle) ?? null;
  }
  setItem(cle: string, valeur: string) {
    this.contenu.set(cle, valeur);
  }
}

describe("la taille du texte", () => {
  it("se garde d'une session à l'autre", () => {
    const zone = new Zone();
    expect(lireTailleTexte(zone)).toBe(1);
    ecrireTailleTexte(zone, 1.3);
    expect(zone.contenu.get(CLE_TAILLE_TEXTE)).toBe("1.3");
    expect(lireTailleTexte(zone)).toBe(1.3);
  });

  it("revient à la taille normale si la valeur gardée n'en est pas une, ou si le stockage refuse", () => {
    const zone = new Zone();
    zone.setItem(CLE_TAILLE_TEXTE, "2");
    expect(lireTailleTexte(zone)).toBe(1);
    const refus: ZonePreferences = {
      getItem: () => {
        throw new Error("refusé");
      },
      setItem: () => {
        throw new Error("refusé");
      },
    };
    expect(lireTailleTexte(refus)).toBe(1);
    expect(() => ecrireTailleTexte(refus, 1.15)).not.toThrow();
    expect(lireTailleTexte(null)).toBe(1);
  });

  it("zoome tout le document, et donne le zoom aux unités de la fenêtre par --zoom", () => {
    const racine = document.createElement("div");
    appliquerTailleTexte(racine, 1.15);
    expect(racine.style.zoom).toBe("1.15");
    expect(racine.style.getPropertyValue("--zoom")).toBe("1.15");
    appliquerTailleTexte(racine, 1);
    expect(racine.style.zoom).toBe("");
    expect(racine.style.getPropertyValue("--zoom")).toBe("1");
  });

  it("propose trois tailles, de la normale à 130 %", () => {
    expect([...TAILLES_TEXTE]).toEqual([1, 1.15, 1.3]);
  });

  it("se lit sur l'écran, pour corriger ce qui se mesure sur la fenêtre", () => {
    expect(zoomEcran()).toBe(1);
  });
});

import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Noyau } from "../src/noyau/logique/noyau";
import { lireSauvegarde } from "../src/noyau/logique/sauvegarde";
import { VERSION_JEU } from "../src/noyau/plateforme/version";
import { creerRegistre } from "../src/strates/registre";

// De vraies sauvegardes de versions antérieures : toutes doivent encore se charger (D-005).
const dossier = new URL("./sauvegardes/", import.meta.url);
const fichiers = readdirSync(dossier).filter((f) => f.endsWith(".json"));

describe("les sauvegardes archivées", () => {
  it("existent", () => {
    expect(fichiers.length).toBeGreaterThan(0);
  });

  it.each(fichiers)("%s se charge et démarre avec la version courante", async (fichier) => {
    const lecture = lireSauvegarde(readFileSync(new URL(fichier, dossier), "utf8"), VERSION_JEU);
    expect(lecture.type).toBe("ok");
    if (lecture.type !== "ok") return;

    const noyau = new Noyau(creerRegistre(), lecture.etat);
    await noyau.demarrer(lecture.etat.reference);
    noyau.avancer(1);
    expect(noyau.etat.profondeur).toBe(lecture.etat.profondeur);
  });
});

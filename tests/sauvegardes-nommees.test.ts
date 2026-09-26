// Les sauvegardes nommées (#28) : des points précis du jeu, au format de D-005, pour le développement
// et le playtest. Elles sont générées par un joueur automatique ; ce test vérifie que les fichiers de
// sauvegardes-nommees/ sont à jour et qu'ils sont bien ce que leur nom promet.
// Pour les régénérer après un changement de règles : npm run sauvegardes
import { describe, expect, it } from "vitest";
import { CORRECT, creerJoueur } from "../sim/joueurs/surface";
import { creerEtatNoyau } from "../src/noyau/logique/etat";
import { Noyau } from "../src/noyau/logique/noyau";
import { ecrireSauvegarde, lireSauvegarde } from "../src/noyau/logique/sauvegarde";
import { VERSION_JEU } from "../src/noyau/plateforme/version";
import type { EtatSurface } from "../src/strates/s1-surface/logique";
import {
  avanceeFissure,
  production,
  SEUIL_PRODUCTION,
} from "../src/strates/s1-surface/logique/regles";
import { creerRegistre } from "../src/strates/registre";

/** Un instant fixe : les fichiers générés ne changent que si les règles changent. */
const DEBUT = Date.UTC(2026, 0, 1);

const enTexte = (noyau: Noyau) =>
  JSON.stringify(JSON.parse(ecrireSauvegarde(noyau.etat, VERSION_JEU)), null, 2) + "\n";

/** Une partie de la surface, jouée par un joueur correct, photographiée aux moments intéressants. */
async function generer(): Promise<Map<string, string>> {
  const noyau = new Noyau(creerRegistre(), creerEtatNoyau(1, DEBUT));
  await noyau.demarrer(DEBUT);
  const joueur = creerJoueur(noyau, CORRECT);
  const parties = new Map<string, string>();
  const recentes: { s: number; texte: string }[] = [];
  let seuil: number | null = null;

  for (let t = 0; t < 3 * 3600; t++) {
    joueur.seconde(t, DEBUT + (t + 1) * 1000);
    const s = t + 1;
    if (s === 15 * 60) parties.set("surface-15-minutes", enTexte(noyau));
    if (s === 45 * 60) parties.set("surface-45-minutes", enTexte(noyau));
    if (seuil === null) {
      if (s % 10 === 0) recentes.push({ s, texte: enTexte(noyau) });
      if (noyau.seuil.atteint) {
        seuil = s;
        const avant = recentes.filter((r) => r.s <= s - 60).at(-1);
        if (avant) parties.set("surface-juste-avant-le-seuil", avant.texte);
        parties.set("surface-seuil-atteint", enTexte(noyau));
      }
    } else if (s === seuil + 6 * 60) {
      // Le joueur n'a pas creusé : la fissure est à moitié tracée (fiche de la strate 1, § 4).
      parties.set("surface-fissure", enTexte(noyau));
      break;
    }
  }
  return parties;
}

const PARTIES = await generer();

async function charger(nom: string): Promise<{ noyau: Noyau; etat: EtatSurface }> {
  const lecture = lireSauvegarde(PARTIES.get(nom)!, VERSION_JEU);
  if (lecture.type !== "ok") throw new Error(`${nom} : ${lecture.type}`);
  const noyau = new Noyau(creerRegistre(), lecture.etat);
  await noyau.demarrer(lecture.etat.reference);
  return { noyau, etat: noyau.etatStrate as EtatSurface };
}

describe("les sauvegardes nommées", () => {
  it("sont toutes générées", () => {
    expect([...PARTIES.keys()].sort()).toEqual([
      "surface-15-minutes",
      "surface-45-minutes",
      "surface-fissure",
      "surface-juste-avant-le-seuil",
      "surface-seuil-atteint",
    ]);
  });

  it.each([...PARTIES.keys()])("%s est à jour (sinon : npm run sauvegardes)", async (nom) => {
    await expect(PARTIES.get(nom)).toMatchFileSnapshot(`../sauvegardes-nommees/${nom}.json`);
  });

  it("surface-15-minutes et surface-45-minutes : en cours de strate, sous le seuil", async () => {
    for (const [nom, minutes] of [
      ["surface-15-minutes", 15],
      ["surface-45-minutes", 45],
    ] as const) {
      const { noyau, etat } = await charger(nom);
      expect(etat.temps / 60).toBeCloseTo(minutes, 0);
      expect(noyau.seuil.atteint).toBe(false);
    }
  });

  it("surface-juste-avant-le-seuil : le seuil tombe en une à deux minutes de jeu", async () => {
    const { noyau, etat } = await charger("surface-juste-avant-le-seuil");
    expect(noyau.demanderFouille()).toBe(false);
    const joueur = creerJoueur(noyau, CORRECT);
    let s = 0;
    while (!noyau.seuil.atteint && s < 600) joueur.seconde(Math.round(etat.temps) + s++);
    expect(s).toBeGreaterThanOrEqual(60);
    expect(s).toBeLessThanOrEqual(120);
  });

  it("surface-seuil-atteint : la fouille est possible, sans fissure", async () => {
    const { noyau, etat } = await charger("surface-seuil-atteint");
    expect(production(etat)).toBeGreaterThanOrEqual(SEUIL_PRODUCTION);
    expect(noyau.demanderFouille()).toBe(true);
    expect(avanceeFissure(etat)).toBe(0);
  });

  it("surface-fissure : la fissure est à moitié tracée", async () => {
    const { etat } = await charger("surface-fissure");
    expect(avanceeFissure(etat)).toBeCloseTo(0.5, 1);
  });
});

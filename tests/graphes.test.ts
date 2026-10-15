// Chaque strate du jeu expose son graphe de dépendances (#76) et ses formules réelles (#77 ;
// docs/comprehension.md, § 5) : le bandeau offre le graphe à partir de κ = 50, quelle que soit la
// strate, et les formules s'y écrivent une à une au-delà. Une strate ajoutée au registre y passe aussi,
// avec son joueur automatique.
import { describe, expect, it } from "vitest";
import { CORRECT as CORRECT_CAVES, creerJoueur as joueurCaves } from "../sim/joueurs/caves";
import { CORRECT as CORRECT_SURFACE, creerJoueur as joueurSurface } from "../sim/joueurs/surface";
import { formulesAccessibles } from "../src/noyau/logique/comprehension";
import { creerEtatNoyau } from "../src/noyau/logique/etat";
import { problemesGraphe } from "../src/noyau/logique/graphe";
import { Noyau } from "../src/noyau/logique/noyau";
import type { NumeroStrate } from "../src/noyau/logique/types";
import { formulesAffichees } from "../src/noyau/ui/graphe";
import { creerRegistre } from "../src/strates/registre";

/** Les strates qui n'ont rien à calculer : le chœur ne montre jamais de nombres, le fond n'a rien. */
const SANS_FORMULES: readonly NumeroStrate[] = [5, 8];

/** Le joueur automatique de chaque strate du registre : une strate ajoutée y donne le sien. */
const JOUEURS: Partial<Record<NumeroStrate, (noyau: Noyau) => { seconde(t: number): void }>> = {
  1: (noyau) => joueurSurface(noyau, CORRECT_SURFACE),
  2: (noyau) => joueurCaves(noyau, CORRECT_CAVES),
};

/**
 * Une strate du registre jouée jusqu'au seuil par son joueur automatique : les nœuds que son graphe a
 * montrés en chemin, relevés chaque minute, et son graphe au seuil.
 */
async function jouerJusquAuSeuil(numero: NumeroStrate) {
  const etat = creerEtatNoyau(1, 0);
  etat.profondeur = numero;
  const noyau = new Noyau(creerRegistre(), etat);
  await noyau.demarrer(0);
  const joueur = JOUEURS[numero]!(noyau);
  const graphe = () => noyau.strate.logique.graphe!(noyau.etatStrate);
  const vus = new Set<string>();
  for (let t = 0; !noyau.seuil.atteint && t < 8 * 3600; t++) {
    if (t % 60 === 0) for (const { id } of graphe().noeuds) vus.add(id);
    joueur.seconde(t);
  }
  expect(noyau.seuil.atteint, `strate ${numero}`).toBe(true);
  for (const { id } of graphe().noeuds) vus.add(id);
  return { vus, auSeuil: graphe() };
}

describe("les graphes des strates du jeu", () => {
  it("existent pour chaque strate, bien formés, et nommés par ses textes", async () => {
    const registre = creerRegistre();
    expect(registre.numeros().length).toBeGreaterThan(0);
    for (const numero of registre.numeros()) {
      const { logique, textes } = await registre.charger(numero);
      expect(logique.graphe, `strate ${numero}`).toBeDefined();
      const etat = logique.etatInitial({ graine: 1, journal: { strates: [] } });
      const graphe = logique.graphe!(etat);
      expect(graphe.noeuds.length, `strate ${numero}`).toBeGreaterThan(1);
      expect(problemesGraphe(graphe), `strate ${numero}`).toEqual([]);
      for (const { cle } of graphe.noeuds)
        expect(textes[cle], `strate ${numero} : ${cle}`).toBeTruthy();
    }
  });
});

describe("les formules des strates du jeu", () => {
  it("existent pour chaque strate qui calcule, écrites jusqu'au bout", async () => {
    const registre = creerRegistre();
    for (const numero of registre.numeros()) {
      const formules = (await registre.charger(numero)).logique.formules?.() ?? [];
      if (SANS_FORMULES.includes(numero)) {
        expect(formules, `strate ${numero}`).toEqual([]);
        continue;
      }
      expect(formules.length, `strate ${numero}`).toBeGreaterThan(0);
      for (const { noeud, expression } of formules) {
        expect(expression.trim(), `strate ${numero} : ${noeud}`).not.toBe("");
        // Un modèle oublié : « {base} » au lieu du prix.
        expect(expression, `strate ${numero} : ${noeud}`).not.toMatch(/[{}]/);
      }
    }
  });

  it("s'attachent à des nœuds que le graphe montre, et s'y écrivent toutes au seuil, au palier décidé", async () => {
    const registre = creerRegistre();
    for (const numero of registre.numeros()) {
      if (SANS_FORMULES.includes(numero)) continue;
      expect(JOUEURS[numero], `le joueur automatique de la strate ${numero}`).toBeDefined();
      const formules = (await registre.charger(numero)).logique.formules!();
      const { vus, auSeuil } = await jouerJusquAuSeuil(numero);
      for (const { noeud } of formules)
        expect([...vus], `strate ${numero} : ${noeud}`).toContain(noeud);
      expect(problemesGraphe(auSeuil, formules), `strate ${numero}`).toEqual([]);

      // Au seuil, tout compris : aucune à κ = 50, puis les premières, toutes à κ = 100.
      const ecrites = (kappa: number) =>
        [...formulesAffichees(formules, kappa, auSeuil, () => true).values()].flat();
      const premieres = (kappa: number) =>
        formules.slice(0, formulesAccessibles(kappa, formules.length)).map((f) => f.expression);
      expect(ecrites(50), `strate ${numero}`).toEqual([]);
      for (const kappa of [51, 70, 85, 100]) {
        expect(ecrites(kappa).sort(), `strate ${numero}, κ = ${kappa}`).toEqual(
          premieres(kappa).sort(),
        );
      }
      expect(ecrites(100), `strate ${numero}`).toHaveLength(formules.length);
    }
  });
});

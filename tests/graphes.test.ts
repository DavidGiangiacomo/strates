// Chaque strate du jeu expose son graphe de dépendances (#76 ; docs/comprehension.md, § 5) : le bandeau
// l'offre à partir de κ = 50, quelle que soit la strate. Une strate ajoutée au registre y passe aussi.
import { describe, expect, it } from "vitest";
import { problemesGraphe } from "../src/noyau/logique/graphe";
import { creerRegistre } from "../src/strates/registre";

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

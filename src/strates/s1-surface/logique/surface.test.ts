import { describe, expect, it } from "vitest";
import { EFFETS_NEUTRES } from "../../../noyau/logique/effets";
import type { ContexteTick } from "../../../noyau/logique/types";
import { logique, type ActionSurface, type EtatSurface } from ".";
import { TAILLE_HISTORIQUE } from "./etat";
import {
  AMELIORATIONS,
  ameliorationDisponible,
  coutAchat,
  generateur,
  GENERATEURS,
  generateurVisible,
  OBJECTIFS,
  production,
  quantiteAbordable,
  SEUIL_PRODUCTION,
  valeurClic,
  type DefGenerateur,
} from "./regles";

const ctx = (multiplicateur = 1): ContexteTick => ({
  effets: { ...EFFETS_NEUTRES, multiplicateur: () => multiplicateur },
  emettre: () => {},
});

const etatNeuf = (modifs: Partial<EtatSurface> = {}): EtatSurface => ({
  ...logique.etatInitial({ graine: 1, journal: { strates: [] } }),
  ...modifs,
});

const avec = (possedes: Partial<EtatSurface["generateurs"]>, modifs: Partial<EtatSurface> = {}) => {
  const etat = etatNeuf(modifs);
  Object.assign(etat.generateurs, possedes);
  return etat;
};

const agir = (etat: EtatSurface, action: ActionSurface, m = 1) =>
  logique.agir(etat, action, ctx(m));
const def = (id: string): DefGenerateur => generateur(id)!;

describe("le catalogue", () => {
  it("compte 7 générateurs et 29 améliorations aux identifiants uniques", () => {
    expect(GENERATEURS).toHaveLength(7);
    expect(AMELIORATIONS).toHaveLength(29);
    expect(new Set(AMELIORATIONS.map((a) => a.id)).size).toBe(29);
  });

  it("donne à chaque étage un remboursement plus lent que le précédent, à prix de base", () => {
    const delais = GENERATEURS.map((g) => g.cout / g.production);
    expect(delais[0]).toBe(60);
    expect(delais.at(-1)).toBe(1000);
    expect(delais).toEqual([...delais].sort((a, b) => a - b));
  });

  it("compte 10 objectifs, le dernier étant le seuil", () => {
    expect(OBJECTIFS).toHaveLength(10);
    expect(OBJECTIFS[9]!(avec({ filiale: 20 }))).toBe(true); // 20 × 50 k = 1 M cr/s
    expect(OBJECTIFS[9]!(avec({ filiale: 19 }))).toBe(false);
  });
});

describe("les formules", () => {
  it("font coûter chaque exemplaire 15 % de plus que le précédent", () => {
    expect(coutAchat(def("poste"), 0)).toBe(15);
    expect(coutAchat(def("poste"), 1)).toBeCloseTo(17.25, 10);
    expect(coutAchat(def("filiale"), 10)).toBeCloseTo(50e6 * 1.15 ** 10, 0);
  });

  it("calculent le coût d'un lot comme la somme des exemplaires", () => {
    const g = def("serveur");
    let somme = 0;
    for (let i = 0; i < 10; i++) somme += coutAchat(g, 7 + i);
    expect(coutAchat(g, 7, 10)).toBeCloseTo(somme, 6);
  });

  it("trouvent la plus grande quantité abordable, aux frontières près", () => {
    const g = def("poste");
    for (const possedes of [0, 3, 40]) {
      for (const k of [1, 2, 10, 37]) {
        const cout = coutAchat(g, possedes, k);
        expect(quantiteAbordable(g, possedes, cout)).toBe(k);
        expect(quantiteAbordable(g, possedes, cout * (1 - 1e-12))).toBe(k - 1);
      }
    }
    expect(quantiteAbordable(g, 0, 14.99)).toBe(0);
  });

  it("calculent la production : n × base × 2ᵃ × G × artefacts", () => {
    const etat = avec({ poste: 12, equipe: 3 }, { ameliorations: ["poste-10", "globale-1"] });
    expect(production(etat)).toBeCloseTo((12 * 0.25 * 2 + 3 * 1.8) * 1.5, 10);
    etat.multiplicateur = 2;
    expect(production(etat)).toBeCloseTo((12 * 0.25 * 2 + 3 * 1.8) * 1.5 * 2, 10);
  });

  it("calculent le clic : 2ᶜ + p × P", () => {
    const etat = avec({ filiale: 1 });
    expect(valeurClic(etat)).toBe(1);
    etat.ameliorations.push("clic-1", "clic-2", "clic-4");
    expect(valeurClic(etat)).toBeCloseTo(4 + 0.02 * 50_000, 10);
  });

  it("font apparaître un générateur à la moitié de son coût, et une amélioration à son palier", () => {
    expect(generateurVisible(etatNeuf({ cumul: 74 }), def("equipe"))).toBe(false);
    expect(generateurVisible(etatNeuf({ cumul: 75 }), def("equipe"))).toBe(true);

    const palier = AMELIORATIONS.find((a) => a.id === "poste-25")!;
    expect(ameliorationDisponible(avec({ poste: 24 }), palier)).toBe(false);
    expect(ameliorationDisponible(avec({ poste: 25 }), palier)).toBe(true);
    const globale = AMELIORATIONS.find((a) => a.id === "globale-1")!;
    expect(ameliorationDisponible(etatNeuf({ cumul: 9_999 }), globale)).toBe(false);
    expect(ameliorationDisponible(etatNeuf({ cumul: 10_000 }), globale)).toBe(true);
    expect(
      ameliorationDisponible(etatNeuf({ cumul: 1e9, ameliorations: ["globale-1"] }), globale),
    ).toBe(false);
  });
});

describe("les actions", () => {
  it("produisent à la main", () => {
    const etat = etatNeuf();
    agir(etat, { type: "produire" });
    agir(etat, { type: "produire" });
    expect(etat).toMatchObject({ credits: 2, cumul: 2 });
  });

  it("achètent un générateur, et les achats ne diminuent pas le cumul", () => {
    const etat = etatNeuf({ credits: 20, cumul: 20 });
    agir(etat, { type: "acheter", generateur: "poste", quantite: 1 });
    expect(etat.generateurs.poste).toBe(1);
    expect(etat).toMatchObject({ credits: 5, cumul: 20 });
    expect(logique.valeurConvertible(etat)).toBe(20);
  });

  it("achètent par lot de 10, ou le maximum", () => {
    const g = def("poste");
    const etat = etatNeuf({ credits: coutAchat(g, 0, 10) + coutAchat(g, 10, 3) + 1 });
    agir(etat, { type: "acheter", generateur: "poste", quantite: 10 });
    expect(etat.generateurs.poste).toBe(10);
    agir(etat, { type: "acheter", generateur: "poste", quantite: "max" });
    expect(etat.generateurs.poste).toBe(13);
    expect(etat.credits).toBeCloseTo(1, 6);
  });

  it("ignorent un achat impossible, sans rien débiter", () => {
    const etat = etatNeuf({ credits: 100 });
    agir(etat, { type: "acheter", generateur: "poste", quantite: 10 });
    agir(etat, { type: "acheter", generateur: "usine", quantite: 1 });
    agir(etat, { type: "acheter", generateur: "usine", quantite: "max" });
    agir(etat, { type: "acheter", generateur: "inconnu" as never, quantite: 1 });
    expect(etat.credits).toBe(100);
    expect(Object.values(etat.generateurs).every((n) => n === 0)).toBe(true);
  });

  it("achètent une amélioration disponible, une seule fois", () => {
    const etat = avec({ poste: 10 }, { credits: 1_000, cumul: 1_000 });
    agir(etat, { type: "ameliorer", amelioration: "poste-10" });
    agir(etat, { type: "ameliorer", amelioration: "poste-10" });
    expect(etat.ameliorations).toEqual(["poste-10"]);
    expect(etat.credits).toBe(1_000 - 15 * 20);
  });

  it("refusent une amélioration indisponible, trop chère ou inconnue", () => {
    const etat = avec({ poste: 9 }, { credits: 1_000, cumul: 1_000 });
    agir(etat, { type: "ameliorer", amelioration: "poste-10" }); // palier non atteint
    agir(etat, { type: "ameliorer", amelioration: "clic-3" }); // 10 k : trop cher
    agir(etat, { type: "ameliorer", amelioration: "inconnue" });
    expect(etat.ameliorations).toEqual([]);
    expect(etat.credits).toBe(1_000);
  });
});

describe("le temps", () => {
  it("fait produire P × dt, multiplié par les artefacts", () => {
    const etat = avec({ poste: 4 });
    logique.tick(etat, 2, ctx());
    expect(etat).toMatchObject({ credits: 2, cumul: 2, temps: 2 });
    logique.tick(etat, 1, ctx(3));
    expect(etat.cumul).toBeCloseTo(5, 10);
  });

  it("donne le même résultat en un grand pas ou en petits pas", () => {
    const [a, b] = [avec({ serveur: 7 }), avec({ serveur: 7 })];
    logique.tick(a, logique.pasMax, ctx());
    for (let i = 0; i < 100; i++) logique.tick(b, 0.1, ctx());
    expect(b.cumul).toBeCloseTo(a.cumul, 6);
    expect(b.historique).toEqual(a.historique);
  });

  it("garde un point d'historique toutes les 10 s, sur 15 minutes", () => {
    const etat = avec({ poste: 4 });
    for (let i = 0; i < 99; i++) logique.tick(etat, 0.1, ctx());
    expect(etat.historique).toEqual([]);
    logique.tick(etat, 0.1, ctx());
    expect(etat.historique).toEqual([1]);
    // Les sommes de pas tombent à peine sous les multiples de 10 : aucun point ne doit être compté deux fois.
    for (let i = 0; i < 100; i++) logique.tick(etat, 0.1, ctx());
    expect(etat.historique).toEqual([1, 1]);
    for (let i = 0; i < 200; i++) logique.tick(etat, logique.pasMax, ctx());
    expect(etat.historique).toHaveLength(TAILLE_HISTORIQUE);
  });
});

describe("les objectifs et le seuil", () => {
  it("valident les objectifs dans l'ordre, et en cascade", () => {
    const etat = etatNeuf();
    for (let i = 0; i < 15; i++) agir(etat, { type: "produire" });
    expect(etat.objectif).toBe(1);
    agir(etat, { type: "acheter", generateur: "poste", quantite: 1 });
    expect(etat.objectif).toBe(2); // 0,25 cr/s : pas encore 1 cr/s

    // Un objectif déjà rempli quand il devient courant est validé aussitôt.
    const avance = avec({ equipe: 1 }, { ameliorations: ["clic-1"], cumul: 15 });
    avance.generateurs.poste = 1;
    logique.tick(avance, 0, ctx());
    expect(avance.objectif).toBe(4);
  });

  it("atteignent le seuil à 1 M cr/s, et il le reste", () => {
    // Un poste et une amélioration : les objectifs 2 et 4 sont remplis, seul le débit manque.
    const etat = avec({ filiale: 19, poste: 1 }, { temps: 600, ameliorations: ["clic-1"] });
    logique.tick(etat, 1, ctx());
    expect(logique.seuil(etat)).toEqual({ atteint: false });

    etat.credits = coutAchat(def("filiale"), 19);
    agir(etat, { type: "acheter", generateur: "filiale", quantite: 1 });
    expect(production(etat)).toBeGreaterThanOrEqual(SEUIL_PRODUCTION);
    expect(logique.seuil(etat)).toEqual({ atteint: true });
    expect(etat.seuilAtteintA).toBe(601);
    expect(etat.objectif).toBe(OBJECTIFS.length);

    logique.tick(etat, 10, ctx());
    expect(etat.seuilAtteintA).toBe(601);
  });
});

describe("la remontée finale", () => {
  it("rend la surface avec la production de toute la durée écoulée, sans toucher à la sauvegarde", () => {
    const sauvegarde = avec({ usine: 10 }, { credits: 5, cumul: 50 });
    const etat = logique.remontee!(sauvegarde, 3_600);
    expect(etat.credits).toBeCloseTo(5 + 60_000 * 3_600, 3);
    expect(etat.temps).toBe(3_600);
    expect(sauvegarde).toMatchObject({ credits: 5, cumul: 50, temps: 0 });
  });
});

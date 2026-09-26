import { describe, expect, it, vi } from "vitest";
import { creerEtatNoyau, type EtatNoyau } from "../logique/etat";
import { ecrireSauvegarde } from "../logique/sauvegarde";
import { CLES, GestionnaireSauvegarde, sauvegarderPartie } from "./sauvegarde";
import { StockageMemoire, type Stockage } from "./stockage";

const VERSION = "0.2.0";

function partie(kappa: number): EtatNoyau {
  return { ...creerEtatNoyau(1, 1_000), kappa };
}

function gestionnaire(stockage: Stockage = new StockageMemoire()) {
  let instant = 10_000;
  return new GestionnaireSauvegarde(stockage, VERSION, () => instant++);
}

describe("le gestionnaire de sauvegarde", () => {
  it("ne trouve rien dans un stockage vide", async () => {
    expect(await gestionnaire().charger()).toEqual({ type: "aucune" });
  });

  it("relit ce qu'il a écrit", async () => {
    const stockage = new StockageMemoire();
    await gestionnaire(stockage).ecrire(partie(5));
    const chargement = await gestionnaire(stockage).charger();
    expect(chargement).toMatchObject({ type: "ok", depuis: "courante", etat: { kappa: 5 } });
  });

  it("fait tourner la courante et la précédente à chaque écriture", async () => {
    const stockage = new StockageMemoire();
    const g = gestionnaire(stockage);
    for (const kappa of [1, 2, 3]) await g.ecrire(partie(kappa));
    const kappaDe = (cle: string) => JSON.parse(stockage.contenu.get(cle) ?? "null")?.noyau.kappa;
    expect(kappaDe(CLES.courante)).toBe(3);
    expect(kappaDe(CLES.precedente)).toBe(2);
  });

  it("met de côté une courante illisible et reprend la précédente", async () => {
    const stockage = new StockageMemoire();
    await gestionnaire(stockage).ecrire(partie(1));
    await gestionnaire(stockage).ecrire(partie(2));
    stockage.contenu.set(CLES.courante, "{abîmée");

    const g = gestionnaire(stockage);
    const chargement = await g.charger();
    expect(chargement).toMatchObject({ type: "ok", depuis: "precedente", etat: { kappa: 1 } });
    const [cle] = chargement.type === "ok" ? chargement.misesDeCote : [];
    expect(cle).toMatch(/^strates\.sauvegarde\.illisible\.\d+\.courante$/);
    expect(stockage.contenu.get(cle ?? "")).toBe("{abîmée");

    // L'écriture suivante ne recopie pas la courante illisible dans la précédente,
    // et ne la met pas de côté une seconde fois.
    await g.ecrire(partie(3));
    expect(JSON.parse(stockage.contenu.get(CLES.precedente) ?? "").noyau.kappa).toBe(1);
    const illisibles = [...stockage.contenu.keys()].filter((c) => c.startsWith(CLES.illisible));
    expect(illisibles).toHaveLength(1);
  });

  it("met de côté une courante devenue illisible pendant la partie, au lieu de l'écraser", async () => {
    const stockage = new StockageMemoire();
    const g = gestionnaire(stockage);
    await g.ecrire(partie(1));
    stockage.contenu.set(CLES.courante, "{abîmée en cours de partie");

    expect(await g.ecrire(partie(2))).toBe(true);
    const illisibles = [...stockage.contenu.entries()].filter(([c]) =>
      c.startsWith(CLES.illisible),
    );
    expect(illisibles.map(([, texte]) => texte)).toEqual(["{abîmée en cours de partie"]);
    expect(JSON.parse(stockage.contenu.get(CLES.courante) ?? "").noyau.kappa).toBe(2);
  });

  it("met de côté les deux emplacements s'ils sont illisibles", async () => {
    const stockage = new StockageMemoire();
    stockage.contenu.set(CLES.courante, "illisible 1");
    stockage.contenu.set(CLES.precedente, "illisible 2");
    const chargement = await gestionnaire(stockage).charger();
    expect(chargement.type).toBe("illisible");
    const misesDeCote = chargement.type === "illisible" ? chargement.misesDeCote : [];
    expect(misesDeCote.map((cle) => stockage.contenu.get(cle))).toEqual([
      "illisible 1",
      "illisible 2",
    ]);
  });

  it("n'écrase jamais une sauvegarde d'une version plus récente du jeu", async () => {
    const stockage = new StockageMemoire();
    const recente = ecrireSauvegarde(partie(7), "9.0.0");
    stockage.contenu.set(CLES.courante, recente);

    const g = gestionnaire(stockage);
    expect(await g.charger()).toEqual({ type: "plus-recente", versionJeu: "9.0.0" });
    expect(g.lectureSeule).toBe(true);
    expect(await g.ecrire(partie(1))).toBe(false);
    expect(await g.importer(ecrireSauvegarde(partie(2), VERSION))).toEqual({
      type: "lecture-seule",
    });
    expect(stockage.contenu.get(CLES.courante)).toBe(recente);
    expect(stockage.contenu.has(CLES.precedente)).toBe(false);
  });

  it("s'arrête d'écrire si un onglet plus récent a écrit entre-temps", async () => {
    const stockage = new StockageMemoire();
    const g = gestionnaire(stockage);
    await g.ecrire(partie(1));
    const recente = ecrireSauvegarde(partie(9), "9.0.0");
    stockage.contenu.set(CLES.courante, recente);
    expect(await g.ecrire(partie(2))).toBe(false);
    expect(g.lectureSeule).toBe(true);
    expect(stockage.contenu.get(CLES.courante)).toBe(recente);
  });

  it("renvoie false sans planter si le stockage refuse l'écriture", async () => {
    const plein: Stockage = {
      lire: async () => null,
      ecrire: async () => {
        throw new DOMException("quota dépassé", "QuotaExceededError");
      },
    };
    const avertir = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await gestionnaire(plein).ecrire(partie(1))).toBe(false);
    expect(avertir).toHaveBeenCalledOnce();
    avertir.mockRestore();
  });
});

describe("l'export et l'import", () => {
  it("font l'aller-retour, et gardent la sauvegarde remplacée comme précédente", async () => {
    const stockage = new StockageMemoire();
    const g = gestionnaire(stockage);
    await g.ecrire(partie(1));
    const exportee = gestionnaire().exporter(partie(42));

    const resultat = await g.importer(exportee);
    expect(resultat).toMatchObject({ type: "ok", etat: { kappa: 42 } });
    expect(JSON.parse(stockage.contenu.get(CLES.courante) ?? "").noyau.kappa).toBe(42);
    expect(JSON.parse(stockage.contenu.get(CLES.precedente) ?? "").noyau.kappa).toBe(1);
  });

  it("refusent un texte illisible sans rien toucher", async () => {
    const stockage = new StockageMemoire();
    const g = gestionnaire(stockage);
    await g.ecrire(partie(1));
    const avant = new Map(stockage.contenu);
    expect((await g.importer("n'importe quoi")).type).toBe("illisible");
    expect(stockage.contenu).toEqual(avant);
  });

  it("refusent une sauvegarde d'une version plus récente du jeu", async () => {
    const resultat = await gestionnaire().importer(ecrireSauvegarde(partie(1), "9.0.0"));
    expect(resultat).toEqual({ type: "plus-recente", versionJeu: "9.0.0" });
  });
});

describe("la sauvegarde de la partie", () => {
  it("note l'instant dans la référence avant d'écrire", async () => {
    const stockage = new StockageMemoire();
    const etat = partie(1);
    await sauvegarderPartie(etat, gestionnaire(stockage), 50_000);
    expect(etat.reference).toBe(50_000);
    expect(JSON.parse(stockage.contenu.get(CLES.courante) ?? "").reference).toBe(50_000);
  });
});

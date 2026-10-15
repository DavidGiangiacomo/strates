// La Compréhension dans les caves (#78 ; fiche, § 7) : les actes propres de la strate, et ce que les
// hivers lèvent de son opacité.
import { describe, expect, it } from "vitest";
import { BAREME, poidsActe } from "../../../noyau/logique/comprehension";
import type { ContexteTick, EvenementStrate } from "../../../noyau/logique/types";
import { logique } from ".";
import { etatInitial, type EtatCaves } from "./etat";
import { ACTES, ANNEE_SEUIL_AU_PLUS_TOT, OBJETS, PREMIER_GRAND_HIVER, saison } from "./regles";

type Contexte = ContexteTick & { evenements: EvenementStrate[] };

/** Un contexte sans objets d'en haut, qui garde ce que la strate signale. */
function contexte(): Contexte {
  const evenements: EvenementStrate[] = [];
  return {
    effets: { multiplicateur: () => 1, niveau: () => null },
    emettre: (e) => evenements.push(e),
    evenements,
  };
}

const actes = (ctx: Contexte) => ctx.evenements.flatMap((e) => (e.type === "acte" ? [e.acte] : []));
const levees = (ctx: Contexte) =>
  ctx.evenements.flatMap((e) => (e.type === "levee" ? [e.element] : []));

/** Une vallée qui ne manque jamais : 50 familles, tous les outils, des caves profondes pleines. */
function valleeSure(annee?: number): EtatCaves {
  const etat = etatInitial();
  Object.assign(etat, { familles: 50, outils: 4, reserve: 200_000 });
  if (annee !== undefined) Object.assign(etat, { annee, jour: 0 });
  etat.stockages = { grenier: 0, silo: 0, cave: 0, caveProfonde: 2 };
  return etat;
}

/** Joue, jour par jour, jusqu'à ce que `fin` soit vrai (au plus 40 ans). */
function jouerJusqua(etat: EtatCaves, ctx: Contexte, fin: (etat: EtatCaves) => boolean): void {
  for (let i = 0; i < 40 * 420 && !fin(etat); i++) logique.tick(etat, 1, ctx);
}

/** Joue jusqu'au bilan de l'hiver de l'an `annee`, à la fin de sa soudure. */
function jusquauBilan(etat: EtatCaves, ctx: Contexte, annee: number): void {
  jouerJusqua(etat, ctx, (e) => e.annee > annee && !e.soudure);
}

/** Vide la réserve pendant tout l'hiver de l'an `annee` : il manque, puis la réserve revient. */
function manquerHiver(etat: EtatCaves, ctx: Contexte, annee: number): void {
  jouerJusqua(etat, ctx, (e) => e.annee === annee && saison(e) === "hiver");
  const reserve = etat.reserve;
  etat.reserve = 0;
  logique.tick(etat, 1, ctx);
  etat.reserve = reserve;
}

describe("les actes des caves", () => {
  it("sont tous au barème des caves, que le noyau applique", () => {
    for (const acte of Object.values(ACTES)) expect(poidsActe(BAREME, 2, acte)).not.toBeNull();
  });

  it("signalent le premier hiver passé sans rupture, soudure comprise", () => {
    const ctx = contexte();
    const etat = valleeSure();
    jouerJusqua(etat, ctx, (e) => e.annee === 2 && e.soudure && saison(e) === "printemps");
    expect(actes(ctx)).toEqual([]);
    jusquauBilan(etat, ctx, 1);
    expect(actes(ctx)).toEqual([ACTES.premierHiver]);
  });

  it("ne le signalent pas quand le premier hiver manque", () => {
    const ctx = contexte();
    const etat = valleeSure();
    manquerHiver(etat, ctx, 1);
    jusquauBilan(etat, ctx, 1);
    expect(actes(ctx)).toEqual([]);
  });

  it("signalent une année entière sans achat d'automne ni rupture, mais pas l'année de l'arrivée", () => {
    const ctx = contexte();
    const etat = valleeSure();
    jusquauBilan(etat, ctx, 1);
    expect(actes(ctx)).not.toContain(ACTES.anneeSansAchatDAutomne);
    // Un achat de printemps ne compte pas : c'est la grammaire même de l'acte.
    logique.agir(etat, { type: "installer" }, ctx);
    jusquauBilan(etat, ctx, 2);
    expect(actes(ctx)).toEqual([ACTES.premierHiver, ACTES.anneeSansAchatDAutomne]);
  });

  it("manquent l'année où l'on achète en automne, puis la suivante peut compter", () => {
    const ctx = contexte();
    const etat = valleeSure();
    jusquauBilan(etat, ctx, 1);
    jouerJusqua(etat, ctx, (e) => saison(e) === "automne");
    logique.agir(etat, { type: "construire", stockage: "grenier" }, ctx);
    expect(etat.bilan.achatAutomne).toBe(true);
    jusquauBilan(etat, ctx, 2);
    expect(actes(ctx)).toEqual([ACTES.premierHiver]);
    jusquauBilan(etat, ctx, 3);
    expect(actes(ctx)).toEqual([ACTES.premierHiver, ACTES.anneeSansAchatDAutomne]);
  });

  it("manquent l'année d'une rupture, même sans achat d'automne", () => {
    const ctx = contexte();
    const etat = valleeSure();
    jusquauBilan(etat, ctx, 1);
    manquerHiver(etat, ctx, 2);
    jusquauBilan(etat, ctx, 2);
    expect(actes(ctx)).toEqual([ACTES.premierHiver]);
  });

  it(`signalent le seuil au plus tôt, à la fin de l'hiver de l'an ${ANNEE_SEUIL_AU_PLUS_TOT}`, () => {
    expect(PREMIER_GRAND_HIVER).toBe(14);
    expect(ANNEE_SEUIL_AU_PLUS_TOT).toBe(16);
    const ctx = contexte();
    const etat = valleeSure(PREMIER_GRAND_HIVER);
    jouerJusqua(etat, ctx, (e) => logique.seuil(e).atteint);
    expect(etat.hivers.at(-1)?.annee).toBe(ANNEE_SEUIL_AU_PLUS_TOT);
    expect(actes(ctx)).toContain(ACTES.seuilAuPlusTot);
  });

  it("ne signalent pas le seuil au plus tôt quand un grand hiver a manqué", () => {
    const ctx = contexte();
    const etat = valleeSure(PREMIER_GRAND_HIVER);
    manquerHiver(etat, ctx, PREMIER_GRAND_HIVER);
    jouerJusqua(etat, ctx, (e) => logique.seuil(e).atteint);
    expect(etat.hivers.at(-1)?.annee).toBe(ANNEE_SEUIL_AU_PLUS_TOT + 1);
    expect(actes(ctx)).not.toContain(ACTES.seuilAuPlusTot);
  });
});

describe("l'opacité des caves", () => {
  const declares = (logique.opacite ?? []).map((e) => e.id);

  it("déclare la marque, les pertes, le grand cycle et les naissances", () => {
    expect(declares).toEqual(["marque", "pertes", "cycle", "naissances"]);
    const element = (id: string) => logique.opacite!.find((e) => e.id === id)!;
    // Les deux fenêtres lèvent la marque et les pertes, l'armoire le grand cycle (fiche, § 8).
    expect(element("marque").objets).toEqual([OBJETS.fenetres]);
    expect(element("pertes").objets).toEqual([OBJETS.fenetres]);
    expect(element("cycle").objets).toEqual([OBJETS.armoire]);
    // Seul le grand cycle échappe au délai : on le découvre en l'an 5.
    expect(logique.opacite!.filter((e) => e.delai === null).map((e) => e.id)).toEqual(["cycle"]);
  });

  it("se lève au premier bilan : la marque prend son nom, les pertes se montrent", () => {
    const ctx = contexte();
    const etat = valleeSure();
    jouerJusqua(etat, ctx, (e) => e.annee === 2 && e.soudure);
    expect(levees(ctx)).toEqual([]);
    jusquauBilan(etat, ctx, 1);
    expect(levees(ctx)).toEqual(["marque", "pertes", "naissances"]);
  });

  it("n'annonce les naissances qu'après un hiver réussi", () => {
    const ctx = contexte();
    const etat = valleeSure();
    manquerHiver(etat, ctx, 1);
    jusquauBilan(etat, ctx, 1);
    expect(levees(ctx)).toEqual(["marque", "pertes"]);
  });

  it("découvre le grand cycle en l'an 5, quand l'hiver s'allonge", () => {
    const ctx = contexte();
    const etat = valleeSure(4);
    jouerJusqua(etat, ctx, (e) => e.annee === 5 && saison(e) === "automne");
    expect(levees(ctx)).not.toContain("cycle");
    jouerJusqua(etat, ctx, (e) => saison(e) === "hiver");
    expect(levees(ctx)).toContain("cycle");
  });

  it("ne lève que des éléments qu'elle déclare", () => {
    const ctx = contexte();
    const etat = valleeSure();
    jusquauBilan(etat, ctx, 6);
    expect(new Set(levees(ctx))).toEqual(new Set(declares));
  });
});

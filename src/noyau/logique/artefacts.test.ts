import { describe, expect, it } from "vitest";
import {
  catalogueDe,
  effetsActifs,
  facteurUtile,
  fouiller,
  niveauUsure,
  pointsDeFouille,
  preselection,
  verifierChoix,
  type ArtefactDef,
} from "./artefacts";
import { CATALOGUE } from "./catalogue";
import { creerEtatNoyau } from "./etat";

const CAVES = { principal: "recolte", secondaires: ["conservation"] };

describe("les points de fouille", () => {
  it("valent ⌊log₁₀(valeur) × 1,4⌋", () => {
    expect(pointsDeFouille(1e15)).toBe(21);
    expect(pointsDeFouille(1e18)).toBe(25);
    expect(pointsDeFouille(6e8)).toBe(12);
    expect(pointsDeFouille(2.6e6)).toBe(8);
    expect(pointsDeFouille(10)).toBe(1);
  });

  it("valent 0 sous 1, et pour une valeur qui n'est pas un nombre", () => {
    expect(pointsDeFouille(1)).toBe(0);
    expect(pointsDeFouille(0.5)).toBe(0);
    expect(pointsDeFouille(0)).toBe(0);
    expect(pointsDeFouille(-5)).toBe(0);
    expect(pointsDeFouille(Number.NaN)).toBe(0);
  });

  it("ne perdent pas un point aux frontières exactes", () => {
    // 8 points à partir de 10^(8 / 1,4) : juste au-dessus, on les a ; juste en dessous, non.
    const frontiere = 10 ** (8 / 1.4);
    expect(pointsDeFouille(frontiere * 1.000001)).toBe(8);
    expect(pointsDeFouille(frontiere * 0.999999)).toBe(7);
  });
});

describe("l'usure", () => {
  it("fait passer un objet de puissant à utile, décoratif, puis inerte, une descente après l'autre", () => {
    expect([1, 2, 3, 4, 5, 6].map((p) => niveauUsure(1, p))).toEqual([
      null,
      "puissant",
      "utile",
      "decoratif",
      "inerte",
      "inerte",
    ]);
  });

  it("réduit un multiplicateur utile de moitié : × 2 devient × 1,5, × 1,2 devient × 1,1", () => {
    expect(facteurUtile(2)).toBe(1.5);
    expect(facteurUtile(1.2)).toBeCloseTo(1.1, 12);
  });

  it("change les effets sur quatre descentes : la roue chaude, de la surface au réseau et au-delà", () => {
    const leviers = { principal: "production" };
    const effet = (profondeur: number) =>
      effetsActifs(["s1-turbine"], profondeur, profondeur === 2 ? CAVES : leviers);
    expect(effet(2).multiplicateur("recolte")).toBe(1.5);
    expect(effet(2).niveau("s1-turbine")).toBe("puissant");
    expect(effet(3).multiplicateur("production")).toBe(1.25);
    expect(effet(3).niveau("s1-turbine")).toBe("utile");
    expect(effet(4).multiplicateur("production")).toBe(1);
    expect(effet(4).niveau("s1-turbine")).toBeNull();
    expect(effet(5).multiplicateur("production")).toBe(1);
  });
});

describe("les effets actifs", () => {
  it("dirigent chaque multiplicateur vers son levier", () => {
    const effets = effetsActifs(["s1-equipe", "s1-turbine", "s1-filiale"], 2, CAVES);
    expect(effets.multiplicateur("recolte")).toBeCloseTo(1.2 * 1.5, 12);
    expect(effets.multiplicateur("conservation")).toBe(1.5);
    expect(effets.multiplicateur("autre")).toBe(1);
    expect(effets.plafonne).toBe(false);
  });

  it("mènent un multiplicateur secondaire au levier principal d'une strate qui n'a pas de secondaire", () => {
    const effets = effetsActifs(["s1-filiale"], 3, { principal: "production" });
    expect(effets.multiplicateur("production")).toBe(1.25);
  });

  it("disent le niveau des objets qui ne sont pas des multiplicateurs", () => {
    const effets = effetsActifs(["s1-serveur", "s1-double-ecran"], 2, CAVES);
    expect(effets.niveau("s1-serveur")).toBe("puissant");
    expect(effets.niveau("s1-double-ecran")).toBe("puissant");
    expect(effets.niveau("s1-plan")).toBeNull();
    expect(effets.multiplicateur("recolte")).toBe(1);
  });

  it("ignorent les identifiants inconnus et les doublons", () => {
    const effets = effetsActifs(["s1-turbine", "s1-turbine", "s9-inconnu"], 2, CAVES);
    expect(effets.multiplicateur("recolte")).toBe(1.5);
    expect(effets.niveau("s9-inconnu")).toBeNull();
  });

  it("n'agissent pas encore dans la strate d'origine, et jamais au fond, qui n'a pas de leviers", () => {
    expect(effetsActifs(["s1-turbine"], 1, { principal: "production" }).niveau("s1-turbine")).toBe(
      null,
    );
    const fond = effetsActifs(["s1-turbine"], 2, null);
    expect(fond.multiplicateur("recolte")).toBe(1);
    expect(fond.niveau("s1-turbine")).toBe("puissant");
  });
});

describe("le plafond × 4", () => {
  const multiplicateur = (id: string, facteur: number, levier: "principal" | "secondaire") =>
    ({
      id,
      origine: 1,
      nomDHaut: id,
      nomDEnBas: id,
      cout: 1,
      famille: "multiplicateur",
      effet: { puissant: { levier, facteur }, utile: { levier, facteur: facteurUtile(facteur) } },
    }) satisfies ArtefactDef;

  const catalogue = [
    multiplicateur("a", 2, "principal"),
    multiplicateur("b", 2, "principal"),
    multiplicateur("c", 2, "secondaire"),
  ];

  it("réduit tous les multiplicateurs dans la même proportion, pour un total d'exactement × 4", () => {
    const effets = effetsActifs(["a", "b", "c"], 2, CAVES, catalogue);
    expect(effets.plafonne).toBe(true);
    // P = 8, α = ln 4 / ln 8 = 2/3 : chaque × 2 devient × 2^(2/3).
    expect(effets.multiplicateur("recolte")).toBeCloseTo(2 ** (4 / 3), 12);
    expect(effets.multiplicateur("conservation")).toBeCloseTo(2 ** (2 / 3), 12);
    expect(effets.multiplicateur("recolte") * effets.multiplicateur("conservation")).toBeCloseTo(
      4,
      12,
    );
  });

  it("ne touche à rien jusqu'à × 4", () => {
    const effets = effetsActifs(["a", "b"], 2, CAVES, catalogue);
    expect(effets.plafonne).toBe(false);
    expect(effets.multiplicateur("recolte")).toBe(4);
  });

  it("n'agit pas sur le catalogue de la surface, même entier, dans les caves", () => {
    const tout = catalogueDe(1).map((a) => a.id);
    const effets = effetsActifs(tout, 2, CAVES);
    expect(effets.plafonne).toBe(false);
    expect(effets.multiplicateur("recolte") * effets.multiplicateur("conservation")).toBeCloseTo(
      2.7,
      12,
    );
  });
});

describe("la présélection et le choix", () => {
  it("prend les objets les moins chers d'abord, tant que les points suffisent", () => {
    expect(preselection(12, 1)).toEqual([
      "s1-equipe",
      "s1-double-ecran",
      "s1-serveur",
      "s1-filiale",
      "s1-turbine",
    ]);
    expect(preselection(3, 1)).toEqual(["s1-equipe", "s1-double-ecran"]);
    expect(preselection(0, 1)).toEqual([]);
    expect(preselection(99, 1)).toHaveLength(6);
  });

  it("accepte un choix dans les points, et note ce qui est abandonné", () => {
    const fouille = verifierChoix(14, 1, [
      "s1-equipe",
      "s1-double-ecran",
      "s1-serveur",
      "s1-turbine",
      "s1-plan",
    ]);
    expect(fouille).toEqual({
      points: 14,
      emportes: ["s1-equipe", "s1-double-ecran", "s1-serveur", "s1-turbine", "s1-plan"],
      abandonnes: ["s1-filiale"],
    });
    expect(verifierChoix(12, 1, []).abandonnes).toHaveLength(6);
  });

  it("refuse un choix trop cher, un objet d'une autre strate, ou un doublon", () => {
    expect(() => verifierChoix(4, 1, ["s1-turbine", "s1-equipe"])).toThrow(/5 points/);
    expect(() => verifierChoix(12, 2, ["s1-turbine"])).toThrow(/catalogue de la strate 2/);
    expect(() => verifierChoix(12, 1, ["s1-equipe", "s1-equipe"])).toThrow(/une fois/);
  });
});

describe("la fouille", () => {
  function partieALaSurface() {
    const etat = creerEtatNoyau(1, 0);
    etat.meta.journal.strates.push({
      strate: 1,
      arrivee: 0,
      tempsDeJeu: 0,
      tempsHorsLigne: 0,
      aideConsultee: false,
      perturbations: [],
    });
    return etat;
  }

  it("note les points, les objets emportés et abandonnés au journal, et ajoute les objets aux artefacts", () => {
    const etat = partieALaSurface();
    const choix = preselection(12, 1);
    fouiller(etat, 12, choix);
    expect(etat.meta.journal.strates[0]!.fouille).toEqual({
      points: 12,
      emportes: choix,
      abandonnes: ["s1-plan"],
    });
    expect(etat.artefacts).toEqual(choix);
    // La descente elle-même appartient à l'orchestration (#30).
    expect(etat.profondeur).toBe(1);
  });

  it("ne se fait qu'une fois par strate, et laisse tout en l'état si le choix est refusé", () => {
    const etat = partieALaSurface();
    expect(() => fouiller(etat, 3, ["s1-turbine"])).toThrow();
    expect(etat.artefacts).toEqual([]);
    expect(etat.meta.journal.strates[0]!.fouille).toBeUndefined();
    fouiller(etat, 3, ["s1-filiale"]);
    expect(() => fouiller(etat, 3, [])).toThrow(/déjà/);
  });
});

describe("le catalogue", () => {
  it("a des identifiants uniques, préfixés par la strate d'origine, et des coûts entiers", () => {
    expect(new Set(CATALOGUE.map((a) => a.id)).size).toBe(CATALOGUE.length);
    for (const a of CATALOGUE) {
      expect(a.id.startsWith(`s${a.origine}-`)).toBe(true);
      expect(Number.isInteger(a.cout) && a.cout >= 1).toBe(true);
    }
  });

  it("réduit de moitié chaque multiplicateur utile, sur le même levier", () => {
    for (const a of CATALOGUE.filter((a) => a.famille === "multiplicateur")) {
      const { puissant, utile } = a.effet;
      if (!("levier" in puissant) || !("levier" in utile)) throw new Error(`${a.id} sans levier`);
      expect(utile.levier).toBe(puissant.levier);
      expect(utile.facteur).toBeCloseTo(facteurUtile(puissant.facteur), 12);
    }
  });

  it("décrit les effets des autres familles", () => {
    for (const a of CATALOGUE.filter((a) => a.famille !== "multiplicateur")) {
      expect("description" in a.effet.puissant && "description" in a.effet.utile).toBe(true);
    }
  });

  it("compte six objets et 17 points pour la surface (docs/artefacts.md, § 8)", () => {
    const surface = catalogueDe(1);
    expect(surface).toHaveLength(6);
    expect(surface.reduce((total, a) => total + a.cout, 0)).toBe(17);
  });
});

// La couche d'opacité, sans interface (#66 ; docs/comprehension.md, § 4) : l'usage, les objets, le
// délai L(κ), et les glyphes.
import { describe, expect, it } from "vitest";
import { delaiLevee } from "./comprehension";
import {
  elementsOpaques,
  elementsParCle,
  estLeve,
  glyphes,
  GLYPHES,
  type ContexteOpacite,
} from "./opacite";
import type { ElementOpaque } from "./types";

const AUCUN_OBJET: ContexteOpacite["effets"] = { niveau: () => null };
const ctx = (
  kappa: number,
  minutes: number,
  { leves = [] as string[], effets = AUCUN_OBJET } = {},
): ContexteOpacite => ({ leves, kappa, tempsStrate: minutes * 60, effets });

const MARQUE: ElementOpaque = {
  id: "marque",
  cles: ["marque", "marque.valeur"],
  objets: ["s1-double-ecran"],
};
const CYCLE: ElementOpaque = { id: "cycle", delai: null, objets: ["s1-serveur"] };
const NOM: ElementOpaque = { id: "nom", cles: ["nom"], delai: 0.5 };

describe("la levée d'un élément opaque", () => {
  it("se fait par l'usage, dès que la strate l'a signalée", () => {
    expect(estLeve(MARQUE, ctx(0, 0))).toBe(false);
    expect(estLeve(MARQUE, ctx(0, 0, { leves: ["marque"] }))).toBe(true);
    expect(estLeve(MARQUE, ctx(0, 0, { leves: ["nom"] }))).toBe(false);
  });

  it("se fait dès l'arrivée par un objet qui agit ici, puissant ou utile, mais pas usé", () => {
    for (const niveau of ["puissant", "utile"] as const) {
      const effets = { niveau: (id: string) => (id === "s1-double-ecran" ? niveau : null) };
      expect(estLeve(MARQUE, ctx(0, 0, { effets }))).toBe(true);
    }
    // Un objet que la strate ne nomme pas pour cet élément n'y fait rien.
    const autre = { niveau: (id: string) => (id === "s1-turbine" ? ("puissant" as const) : null) };
    expect(estLeve(MARQUE, ctx(0, 0, { effets: autre }))).toBe(false);
  });

  it("se fait de lui-même au bout du délai L(κ), plus vite quand κ est haut", () => {
    // À 8 minutes, κ = 50 a levé la marque ; κ = 0 attend 20 minutes.
    expect(estLeve(MARQUE, ctx(50, 8))).toBe(true);
    expect(estLeve(MARQUE, ctx(0, 8))).toBe(false);
    expect(estLeve(MARQUE, ctx(0, 19.9))).toBe(false);
    expect(estLeve(MARQUE, ctx(0, 20))).toBe(true);
    // À κ = 100, 3 minutes suffisent.
    expect(estLeve(MARQUE, ctx(100, 2.9))).toBe(false);
    expect(estLeve(MARQUE, ctx(100, 3))).toBe(true);
  });

  it("se fait plus tôt pour un élément qui ne demande qu'une part du délai", () => {
    expect(estLeve(NOM, ctx(0, 9.9))).toBe(false);
    expect(estLeve(NOM, ctx(0, 10))).toBe(true);
  });

  it("ne se fait jamais par le délai pour un élément qui en est exempté", () => {
    expect(estLeve(CYCLE, ctx(100, 600))).toBe(false);
    const armoire = { niveau: (id: string) => (id === "s1-serveur" ? ("utile" as const) : null) };
    expect(estLeve(CYCLE, ctx(0, 0, { effets: armoire }))).toBe(true);
    expect(estLeve(CYCLE, ctx(0, 0, { leves: ["cycle"] }))).toBe(true);
  });
});

describe("les éléments encore opaques", () => {
  it("sont ceux qu'aucune des trois façons n'a levés", () => {
    const elements = [MARQUE, CYCLE, NOM];
    expect(elementsOpaques(elements, ctx(0, 0))).toEqual(new Set(["marque", "cycle", "nom"]));
    expect(elementsOpaques(elements, ctx(0, 10))).toEqual(new Set(["marque", "cycle"]));
    expect(elementsOpaques(elements, ctx(0, 10, { leves: ["marque"] }))).toEqual(
      new Set(["cycle"]),
    );
    expect(elementsOpaques([], ctx(0, 0))).toEqual(new Set());
  });

  it("suivent le délai de comprehension.md à chaque palier", () => {
    for (const kappa of [0, 25, 50, 70, 85, 100]) {
      const avant = ctx(kappa, delaiLevee(kappa) / 60 - 0.01);
      const apres = ctx(kappa, delaiLevee(kappa) / 60);
      expect(elementsOpaques([MARQUE], avant)).toEqual(new Set(["marque"]));
      expect(elementsOpaques([MARQUE], apres)).toEqual(new Set());
    }
  });
});

describe("les clés de texte", () => {
  it("mènent chacune à l'élément qui la couvre", () => {
    const parCle = elementsParCle([MARQUE, CYCLE, NOM]);
    expect(parCle.get("marque")).toBe("marque");
    expect(parCle.get("marque.valeur")).toBe("marque");
    expect(parCle.get("nom")).toBe("nom");
    // Un élément sans clé ne couvre aucun texte : la vue le demande à `lisible`.
    expect([...parCle.values()]).not.toContain("cycle");
  });
});

describe("les glyphes", () => {
  it("mettent un glyphe par mot, sans rien laisser du texte", () => {
    const g = glyphes("marque-hiver", "Marque d'hiver");
    expect(g.split(" ")).toHaveLength(2);
    for (const signe of g.split(" ")) expect(GLYPHES).toContain(signe);
  });

  it("masquent une valeur écrite par un modèle", () => {
    const g = glyphes("marque-hiver.valeur", "{marque:boisseau}");
    expect(g).not.toMatch(/[{}a-z0-9]/i);
    expect(g.split(" ")).toHaveLength(1);
  });

  it("sont toujours les mêmes pour la même clé, et changent d'une clé à l'autre", () => {
    expect(glyphes("pertes", "Pertes de grain")).toBe(glyphes("pertes", "Pertes de grain"));
    const differents = new Set(
      ["a", "b", "c", "d", "e", "f"].map((cle) => glyphes(cle, "un deux trois")),
    );
    expect(differents.size).toBeGreaterThan(1);
  });

  it("prennent l'alphabet de la strate quand elle en donne un", () => {
    expect(glyphes("rang", "Le rang", "♩♪")).toMatch(/^[♩♪] [♩♪]$/);
  });
});

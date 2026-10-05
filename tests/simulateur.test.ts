// Le simulateur headless (#23) : la commande `npm run simuler`, ses arguments, et ce qu'elle mesure.
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  duree,
  entier,
  jouer,
  LIMITE_I5,
  lireArguments,
  OBJETS_JEU_CORRECT,
  rediger,
  simuler,
  verdictI5,
  type Partie,
} from "../sim/simulateur";

describe("les arguments du simulateur", () => {
  it("jouent le joueur correct, sans objet, 4 h au plus, si on ne dit rien de plus", () => {
    expect(lireArguments(["caves"])).toEqual({
      strate: "caves",
      joueurs: ["correct"],
      objets: [],
      comparer: false,
      limite: 4 * 3600,
      json: false,
    });
  });

  it("acceptent la profondeur pour nom de strate, et « tous » pour les joueurs", () => {
    expect(lireArguments(["1", "tous"]).joueurs).toEqual([
      "parfait",
      "actif",
      "correct",
      "distrait",
      "occasionnel",
      "moins-cher",
    ]);
    expect(lireArguments(["2", "reflexe", "prudent"])).toMatchObject({
      strate: "caves",
      joueurs: ["reflexe", "prudent"],
    });
  });

  it("emportent les objets d'un jeu correct, ou ceux qu'on nomme", () => {
    expect(lireArguments(["caves", "--objets=jeu-correct"]).objets).toEqual(OBJETS_JEU_CORRECT);
    expect(lireArguments(["caves", "--objets=s1-turbine,s1-equipe"]).objets).toEqual([
      "s1-turbine",
      "s1-equipe",
    ]);
    // Comparer, c'est jouer sans objet, puis avec ceux d'un jeu correct si on n'en nomme pas.
    expect(lireArguments(["caves", "--comparer"])).toMatchObject({
      comparer: true,
      objets: OBJETS_JEU_CORRECT,
    });
  });

  it("jouent la surface une seule fois : aucun objet n'y arrive", () => {
    expect(lireArguments(["surface", "--comparer"])).toMatchObject({ comparer: false, objets: [] });
    expect(() => lireArguments(["surface", "--objets=jeu-correct"])).toThrow(
      /ne reçoit aucun objet/,
    );
  });

  it("disent ce qui ne va pas", () => {
    expect(() => lireArguments([])).toThrow(/Quelle strate/);
    expect(() => lireArguments(["atelier"])).toThrow(/Strate inconnue : atelier/);
    expect(() => lireArguments(["caves", "parfait"])).toThrow(
      /Joueur inconnu pour caves : parfait/,
    );
    expect(() => lireArguments(["caves", "--vite"])).toThrow(/Option inconnue : --vite/);
    expect(() => lireArguments(["caves", "--limite=0"])).toThrow(/en heures/);
    expect(lireArguments(["caves", "--limite=1.5"]).limite).toBe(5_400);
  });
});

describe("le rapport du simulateur", () => {
  const partie = (seuil: number | null, points: number): Partie => ({
    seuil,
    valeur: 2_503_000,
    points,
    details: [["Hivers manqués", "1 sur 16"]],
  });

  it("écrit les durées et les nombres comme le jeu", () => {
    expect(duree(4_361)).toBe("1 h 12 min 41 s");
    expect(duree(285)).toBe("4 min 45 s");
    expect(duree(4 * 3600)).toBe("4 h");
    expect(duree(0)).toBe("0 s");
    expect(entier(2_503_000.7)).toBe("2 503 000");
  });

  it("met les deux parties côte à côte, puis le verdict d'I5", () => {
    const demande = lireArguments(["caves", "correct", "--comparer"]);
    const texte = rediger(demande, [
      { joueur: "correct", sans: partie(6_663, 8), avec: partie(6_658, 9) },
    ]);
    const lignes = texte.split("\n");
    expect(lignes[0]).toBe("Les caves (strate 2) · joueur correct");
    expect(lignes.find((l) => l.includes("Seuil de fouille"))).toMatch(
      /1 h 51 min 3 s\s+1 h 50 min 58 s$/,
    );
    expect(lignes.find((l) => l.includes("avec 5 objets"))).toMatch(/sans objet\s+avec 5 objets/);
    expect(lignes.find((l) => l.includes("Hivers manqués"))).toMatch(/1 sur 16\s+1 sur 16$/);
    expect(lignes.at(-1)).toBe(
      "  I5 : tenu, le seuil tombe à 1 h 51 min 3 s sans objet (moins de 3 h 15)",
    );
  });

  it("dit quand I5 n'est pas tenu, ou quand le seuil n'est pas atteint", () => {
    expect(verdictI5(LIMITE_I5 + 1, 4 * 3600)).toMatch(/^non tenu/);
    expect(verdictI5(null, 4 * 3600)).toBe("seuil non atteint en 4 h de jeu, sans objet");
  });
});

describe("les parties simulées", () => {
  it("mesurent les caves avec et sans les objets d'un jeu correct : I5 tenu, une vallée plus grande", async () => {
    const [resultat] = await jouer(lireArguments(["caves", "correct", "--comparer"]));
    const { sans, avec } = resultat!;
    expect(sans.seuil).not.toBeNull();
    expect(sans.seuil!).toBeLessThan(LIMITE_I5);
    // Avec les rations, le joueur correct descend avec 9 points dans les deux cas ; les objets font
    // une vallée plus grande, et deux fois plus de grain.
    expect(avec!.points).toBeGreaterThanOrEqual(sans.points);
    expect(avec!.valeur).toBeGreaterThan(2 * sans.valeur);
  });

  it("jouent aussi le joueur naïf, qui achète toujours le moins cher", async () => {
    const [surface] = await jouer(lireArguments(["surface", "moins-cher", "--limite=6"]));
    // Il atteint le seuil, mais bien plus tard qu'un joueur qui achète ce qui se rembourse vite.
    expect(surface!.sans.seuil).not.toBeNull();
    expect(surface!.sans.seuil!).toBeGreaterThan(2 * 3600);
  });

  it("se lance en ligne de commande, et rend du JSON sur demande", async () => {
    const sortie = execFileSync(
      "node",
      ["sim/simuler.mjs", "surface", "correct", "--limite=0.1", "--json"],
      {
        encoding: "utf8",
      },
    );
    const [resultat] = JSON.parse(sortie);
    expect(resultat).toMatchObject({ strate: "surface", joueur: "correct", avec: null });
    expect(resultat.sans.seuil).toBeNull();
    expect(await simuler(["--aide"])).toMatch(/^Usage : npm run simuler/);
  });

  it("s'arrête sur une erreur, avec le mode d'emploi", () => {
    expect(() =>
      execFileSync("node", ["sim/simuler.mjs", "atelier"], { encoding: "utf8", stdio: "pipe" }),
    ).toThrow(/Strate inconnue : atelier/);
  });
});

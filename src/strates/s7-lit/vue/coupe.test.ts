// La géométrie de la coupe du lit (fiche, § 6) : les couches et leur dépôt, l'eau de la crue, le
// rocher aux encoches, les fosses de la dette, la berge, les phrases.
import { describe, expect, it } from "vitest";
import { logique, type EtatLit } from "../logique";
import { CREUX, CRUE, DOIGTS, DUREE_PHRASE, RIVE } from "../logique/regles";
import {
  BERGE,
  BORD_RIVE,
  clarte,
  couchesDuBassin,
  couchesDuCreux,
  eau,
  ENCOCHES,
  FOND,
  FOSSES,
  HAUT,
  hauteurRocher,
  LARGEUR,
  momentCrue,
  passageTrouble,
  phraseCourante,
  placesSurLaBerge,
  POCHE,
  PX,
  ROCHER,
  tablettes,
  TASSEMENT,
  TRAITS,
  y,
} from "./coupe";

const CTX = {
  effets: { multiplicateur: () => 1, niveau: () => null },
  emettre: () => {},
};

function lit(secondes: number, levee: number | null = 0): EtatLit {
  const etat = logique.etatInitial({ graine: 1, journal: { strates: [] } });
  if (levee !== null) logique.agir(etat, { type: "fermer", creux: levee }, CTX);
  logique.tick(etat, secondes, CTX);
  return etat;
}

describe("la coupe", () => {
  it("met le fond du bassin en bas, et la rive, trente-six coudées plus haut", () => {
    expect(y(0)).toBe(FOND);
    expect(y(RIVE)).toBeCloseTo(HAUT, 9);
  });

  it("gradue l'échelle d'un trait court tous les sept doigts, et d'un long par coudée", () => {
    expect(TRAITS[0]).toEqual({ y: FOND, long: true });
    expect(TRAITS[1]!.long).toBe(false);
    expect(TRAITS[4]).toEqual({ y: y(28), long: true });
    expect(TRAITS.filter((t) => t.long)).toHaveLength(38);
  });

  it("empile les couches du bassin jusqu'au limon, et remplit la poche d'un creux plein", () => {
    const etat = lit(80 * CRUE);
    const bandes = couchesDuBassin(etat.couches);
    expect(bandes).toHaveLength(etat.couches.filter((c) => c.ou === "bassin").length);
    expect(bandes.at(-1)!.y).toBeCloseTo(y(etat.niveau), 9);
    expect(bandes.reduce((h, b) => h + b.hauteur, 0)).toBeCloseTo(etat.niveau * PX, 9);

    const poche = couchesDuCreux(etat.couches, 0);
    expect(poche).toHaveLength(25);
    expect(poche[0]!.teinte).toBeGreaterThanOrEqual(2);
    expect(poche.at(-1)!.y).toBeCloseTo(y(CREUX[0]! + POCHE.hauteur), 9);
    expect(couchesDuCreux(etat.couches, 3)).toEqual([]);
  });
});

describe("le dépôt", () => {
  it("fait monter la dernière couche au fond, en cinq secondes après le milieu du repos", () => {
    // Le creux du fond plein, la 40ᵉ crue laisse son limon au bassin, à 40 × 30 s.
    const etat = lit(40 * CRUE);
    const derniere = etat.couches.at(-1)!;
    expect(derniere).toMatchObject({ crue: 40, ou: "bassin" });
    const hauteur = (temps: number) => couchesDuBassin(etat.couches, temps).at(-1)!.hauteur;
    expect(hauteur(40 * CRUE)).toBe(0);
    expect(hauteur(40 * CRUE + TASSEMENT / 2)).toBeCloseTo((derniere.epaisseur * PX) / 2, 9);
    expect(hauteur(40 * CRUE + TASSEMENT)).toBeCloseTo(derniere.epaisseur * PX, 9);
    // Sans instant, tout est déposé ; les couches d'avant le sont déjà.
    expect(couchesDuBassin(etat.couches)).toEqual(couchesDuBassin(etat.couches, Infinity));
    expect(couchesDuBassin(etat.couches, 40 * CRUE).slice(0, -1)).toEqual(
      couchesDuBassin(etat.couches).slice(0, -1),
    );
    expect(couchesDuBassin(etat.couches, 40 * CRUE).at(-1)!.y).toBeCloseTo(
      couchesDuBassin(etat.couches).at(-2)!.y,
      9,
    );
  });

  it("dépose de même au fond d'un creux, derrière la levée", () => {
    const etat = lit(CRUE);
    expect(etat.couches).toEqual([
      { crue: 1, ou: 0, epaisseur: expect.any(Number), retenue: true },
    ]);
    expect(couchesDuCreux(etat.couches, 0, CRUE)[0]!.hauteur).toBe(0);
    expect(couchesDuCreux(etat.couches, 0, CRUE + TASSEMENT)).toEqual(
      couchesDuCreux(etat.couches, 0),
    );
  });
});

describe("l'eau de la crue", () => {
  it("monte trouble, s'éclaircit de haut en bas pendant son repos, et se retire claire", () => {
    expect(clarte(20)).toBe(0);
    expect(clarte(25)).toBe(0);
    expect(clarte(CRUE)).toBeCloseTo(0.5, 9);
    expect(clarte(35)).toBe(1);
    expect(clarte(40)).toBe(1);
    expect(clarte(50)).toBe(0);
    for (let t = 15; t < 120; t += 0.7) expect([0, 0.5, 1]).toContain(clarte(t, true));
  });

  it("dit où en est la crue : sa montée, son repos, son retrait, et son numéro", () => {
    expect(momentCrue(0, null)).toBeNull();
    expect(momentCrue(14.9, null)).toBeNull();
    expect(momentCrue(15, null)).toEqual({ crue: 1, phase: "montee" });
    expect(momentCrue(25, null)).toEqual({ crue: 1, phase: "repos" });
    expect(momentCrue(CRUE, null)).toEqual({ crue: 1, phase: "repos" });
    expect(momentCrue(35, null)).toEqual({ crue: 1, phase: "retrait" });
    expect(momentCrue(45, null)).toEqual({ crue: 2, phase: "montee" });
    // Le bassin plein à la 300ᵉ crue : elle se retire, puis le fleuve passe ailleurs.
    expect(momentCrue(300 * CRUE + 10, 300 * CRUE)).toEqual({ crue: 300, phase: "retrait" });
    expect(momentCrue(300 * CRUE + 15, 300 * CRUE)).toBeNull();
  });

  it("passe de l'eau claire, au-dessus, à l'eau trouble, au-dessous, en douceur", () => {
    expect(passageTrouble(0)).toEqual({ haut: 0, bas: 0 });
    expect(passageTrouble(1)).toEqual({ haut: 1, bas: 1 });
    const milieu = passageTrouble(0.5);
    expect(milieu.haut).toBeCloseTo(0.35, 9);
    expect(milieu.bas).toBeCloseTo(0.65, 9);
    let precedent = passageTrouble(0);
    for (let c = 0.05; c <= 1; c += 0.05) {
      const p = passageTrouble(c);
      expect(p.haut).toBeGreaterThanOrEqual(precedent.haut);
      expect(p.bas).toBeGreaterThanOrEqual(p.haut);
      precedent = p;
    }
  });

  it("monte en dix secondes, se repose dix, se retire en dix : la première quinze secondes après l'arrivée", () => {
    expect(eau(0, null)).toBe(0);
    expect(eau(14.9, null)).toBe(0);
    expect(eau(20, null)).toBeCloseTo(0.5, 9);
    // Le limon se dépose à la 30ᵉ seconde, au milieu du repos.
    expect(eau(25, null)).toBe(1);
    expect(eau(CRUE, null)).toBe(1);
    expect(eau(40, null)).toBeCloseTo(0.5, 9);
    expect(eau(45, null)).toBe(0);
    expect(eau(50, null)).toBeCloseTo(0.5, 9);
  });

  it("ne vient plus au bassin plein : le fleuve passe ailleurs, après la dernière crue", () => {
    expect(eau(1000 * CRUE, 900 * CRUE)).toBe(0);
    expect(eau(900 * CRUE + 5, 900 * CRUE)).toBeCloseTo(1, 9);
  });

  it("monte et se retire en trois images, avec moins de mouvement", () => {
    for (let t = 15; t < 120; t += 0.7) expect([0, 0.5, 1]).toContain(eau(t, null, true));
  });
});

describe("les phrases du jeu", () => {
  it("viennent, restent, puis s'effacent, une à une", () => {
    const dites = [
      { cle: "phrase.arrivee", a: 0 },
      { cle: "phrase.retour", a: 100 },
      { cle: "phrase.decider", a: 100 + DUREE_PHRASE },
    ];
    expect(phraseCourante({ dites, temps: 0 })).toEqual({ cle: "phrase.arrivee", opacite: 0 });
    expect(phraseCourante({ dites, temps: 5 })).toEqual({ cle: "phrase.arrivee", opacite: 1 });
    expect(phraseCourante({ dites, temps: 9.25 })!.opacite).toBeCloseTo(0.5, 9);
    expect(phraseCourante({ dites, temps: 12 })).toBeNull();
    expect(phraseCourante({ dites, temps: 105 })!.cle).toBe("phrase.retour");
    expect(phraseCourante({ dites, temps: 115 })!.cle).toBe("phrase.decider");
    expect(phraseCourante({ dites, temps: 0.5 }, true)).toEqual({
      cle: "phrase.arrivee",
      opacite: 1,
    });
  });
});

describe("le rocher aux encoches", () => {
  it("est une bosse basse au fond du bassin, que les premières couches recouvrent", () => {
    expect(hauteurRocher(ROCHER.de)).toBe(0);
    expect(hauteurRocher(ROCHER.a)).toBe(0);
    let plusHaut = 0;
    for (let x = ROCHER.de; x <= ROCHER.a; x++) plusHaut = Math.max(plusHaut, hauteurRocher(x));
    expect(plusHaut).toBeGreaterThan(ROCHER.haut * 0.9);
    // Moins de deux coudées : une douzaine de crues du bassin le recouvrent.
    expect(plusHaut / PX).toBeLessThan(2 * DOIGTS);
  });

  it("porte ses encoches par groupes, gravées sur sa face", () => {
    expect(ENCOCHES.length).toBeGreaterThan(25);
    for (const e of ENCOCHES) {
      expect(e.x).toBeGreaterThan(ROCHER.de);
      expect(e.x).toBeLessThan(ROCHER.a);
      expect(e.y1).toBeGreaterThanOrEqual(FOND - hauteurRocher(e.x));
      expect(e.y2).toBeLessThan(FOND);
      expect(e.y2).toBeGreaterThan(e.y1);
    }
    const ecarts = ENCOCHES.slice(1).map((e, i) => e.x - ENCOCHES[i]!.x);
    expect(new Set(ecarts).size).toBeGreaterThan(1);
    expect(ecarts.filter((d) => d > 4).length).toBeGreaterThanOrEqual(5);
  });
});

describe("les fosses de la dette", () => {
  it("n'existent pas sans issue connue", () => {
    expect(tablettes(null)).toEqual([]);
  });

  it("gardent des tablettes brisées quand la dette a été soldée", () => {
    const eclats = tablettes("soldee");
    expect(eclats).toHaveLength(8);
    expect(eclats.every((t) => t.sceau === null)).toBe(true);
  });

  it("gardent des tablettes entières et scellées quand elle est tombée en défaut", () => {
    const entieres = tablettes("defaut");
    expect(entieres).toHaveLength(5);
    expect(entieres.every((t) => t.sceau !== null)).toBe(true);
  });

  it("sont creusées dans la rive, à droite des creux, et leurs tablettes y reposent au fond", () => {
    for (const f of FOSSES) {
      expect(f.x).toBeGreaterThan(BORD_RIVE + POCHE.largeur);
      expect(f.x + f.largeur).toBeLessThan(LARGEUR);
      expect(f.fond).toBeGreaterThan(HAUT);
    }
    for (const issue of ["soldee", "defaut"] as const) {
      for (const t of tablettes(issue)) {
        const points = t.points.split(" ").map((p) => p.split(",").map(Number) as [number, number]);
        const dans = FOSSES.some((f) =>
          points.every(
            ([px, py]) => px >= f.x && px <= f.x + f.largeur && py > HAUT && py <= f.fond,
          ),
        );
        expect(dans, `${issue} : ${t.points}`).toBe(true);
      }
    }
  });
});

describe("la berge", () => {
  it("pose les objets d'en haut de gauche à droite, en haut de la rive, sans déborder", () => {
    expect(placesSurLaBerge(0)).toEqual([]);
    const places = placesSurLaBerge(10);
    expect(places[0]).toBe(BERGE.de);
    expect(places[1]! - places[0]!).toBe(BERGE.ecart);
    expect(places[0]!).toBeGreaterThan(BORD_RIVE);
    expect(places.at(-1)! + BERGE.ecart / 2).toBeLessThan(LARGEUR);
  });
});

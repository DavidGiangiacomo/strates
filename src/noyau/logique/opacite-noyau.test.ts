// La couche d'opacité vue du noyau (#66 ; docs/comprehension.md, § 4) : la strate factice passe
// d'opaque à lisible, et la vitesse de levée varie avec κ.
import { describe, expect, it } from "vitest";
import {
  coutGenerateur,
  creerLogiqueFactice,
  SEUIL_FACTICE,
  type ActionFactice,
  type EtatFactice,
} from "../../strates/factice/logique";
import { delaiLevee } from "./comprehension";
import { creerEtatNoyau, type EtatNoyau } from "./etat";
import { Noyau, PAS } from "./noyau";
import { Registre, type StrateQuelconque } from "./registre";
import { ecrireSauvegarde, lireSauvegarde } from "./sauvegarde";
import type { LogiqueStrate, NumeroStrate } from "./types";

const DEBUT = 1_000 * 3600 * 1000;
/** Assez de cumul pour le seuil de la strate factice, et quelques points de fouille. */
const CUMUL = 6.12e8;
const NUMEROS = [1, 2, 3, 4, 5, 6, 7, 8] as const satisfies readonly NumeroStrate[];

/** Une partie de strates factices, commencée à `profondeur`, avec κ et des objets. */
async function partie(
  { profondeur = 2 as NumeroStrate, kappa = 0, artefacts = [] as string[] } = {},
  etat: EtatNoyau = creerEtatNoyau(1, DEBUT),
  logique: (n: NumeroStrate) => LogiqueStrate<EtatFactice, ActionFactice> = creerLogiqueFactice,
): Promise<Noyau> {
  const registre = new Registre();
  for (const n of NUMEROS) {
    const strate = { logique: logique(n), vue: null, textes: {} };
    registre.enregistrer(n, async () => strate as StrateQuelconque);
  }
  if (etat.meta.journal.strates.length === 0) Object.assign(etat, { profondeur, kappa, artefacts });
  const noyau = new Noyau(registre, etat);
  await noyau.demarrer(DEBUT);
  return noyau;
}

const etatDe = (noyau: Noyau) => noyau.etatStrate as EtatFactice;
const entree = (noyau: Noyau) => noyau.etat.meta.journal.strates.at(-1)!;
const opaques = (noyau: Noyau) => [...noyau.elementsOpaques()].sort();
const TOUS = ["cumul", "hasard", "seuil", "unites"];

/** Joue, pas à pas, jusqu'à avoir passé `minutes` dans la strate. */
function jouerJusqua(noyau: Noyau, minutes: number): void {
  while (noyau.tempsStrate < minutes * 60) noyau.tick(PAS);
}

/** Achète le premier générateur : la strate factice nomme alors ses unités. */
function premierAchat(noyau: Noyau): void {
  etatDe(noyau).unites = coutGenerateur(0);
  noyau.agir({ type: "acheter" });
  noyau.tick(0);
}

describe("la strate factice, d'opaque à lisible", () => {
  it("arrive opaque : ses noms, un rôle, un compteur et une annonce", async () => {
    expect(opaques(await partie())).toEqual(TOUS);
  });

  it("se lève à l'usage : le premier générateur nomme les unités, le seuil atteint s'annonce", async () => {
    const noyau = await partie();
    premierAchat(noyau);
    expect(opaques(noyau)).toEqual(["cumul", "hasard", "seuil"]);
    etatDe(noyau).cumul = SEUIL_FACTICE - 1;
    noyau.agir({ type: "produire" });
    noyau.tick(0);
    expect(opaques(noyau)).toEqual(["cumul", "hasard"]);
    // Le noyau note les levées au journal de partie, une fois chacune.
    premierAchat(noyau);
    expect(entree(noyau).leves).toEqual(["unites", "seuil"]);
  });

  it("se lève d'elle-même au fil du délai : le rôle à sa moitié, le reste au bout", async () => {
    const noyau = await partie();
    jouerJusqua(noyau, 9.9);
    expect(opaques(noyau)).toEqual(TOUS);
    jouerJusqua(noyau, 10);
    expect(opaques(noyau)).toEqual(["cumul", "seuil", "unites"]);
    jouerJusqua(noyau, 19.9);
    expect(opaques(noyau)).toEqual(["cumul", "seuil", "unites"]);
    jouerJusqua(noyau, 20);
    // L'annonce du seuil est exemptée du délai : elle attend le seuil.
    expect(opaques(noyau)).toEqual(["seuil"]);
  });

  it("se lève plus vite quand κ est haut : 20 minutes à κ = 0, 8 à κ = 50, 3 à κ = 100", async () => {
    for (const [kappa, minutes] of [
      [0, 20],
      [50, 7.75],
      [100, 3],
    ] as const) {
      expect(delaiLevee(kappa) / 60).toBeCloseTo(minutes, 2);
      const noyau = await partie({ kappa });
      jouerJusqua(noyau, delaiLevee(kappa) / 60 - 0.1);
      expect(opaques(noyau)).toContain("cumul");
      jouerJusqua(noyau, delaiLevee(kappa) / 60);
      expect(opaques(noyau)).not.toContain("cumul");
    }
    // À 8 minutes de jeu, une partie à κ = 50 lit déjà son compteur, une partie à κ = 0 non.
    const lente = await partie({ kappa: 0 });
    const rapide = await partie({ kappa: 50 });
    jouerJusqua(lente, 8);
    jouerJusqua(rapide, 8);
    expect(opaques(lente)).toContain("cumul");
    expect(opaques(rapide)).not.toContain("cumul");
  });

  it("compte les absences dans le délai, selon la politique hors ligne de la strate", async () => {
    const noyau = await partie();
    // Un quart d'heure d'absence : le hors-ligne standard le compte entier.
    noyau.rattraper(DEBUT + 15 * 60 * 1000);
    expect(noyau.tempsStrate).toBe(15 * 60);
    expect(opaques(noyau)).toEqual(["cumul", "seuil", "unites"]);
  });

  it("se lève dès l'arrivée par un objet qui agit ici, mais pas par un objet usé", async () => {
    // Une turbine de la surface : puissante à la profondeur 2, sans effet à la 4.
    const puissante = await partie({ profondeur: 2, artefacts: ["s1-turbine"] });
    expect(opaques(puissante)).toEqual(["hasard", "seuil", "unites"]);
    const usee = await partie({ profondeur: 4, artefacts: ["s1-turbine"] });
    expect(opaques(usee)).toEqual(TOUS);
  });

  it("le reste après une sauvegarde : la levée à l'usage est au journal", async () => {
    const noyau = await partie();
    premierAchat(noyau);
    const lecture = lireSauvegarde(ecrireSauvegarde(noyau.etat, "1.0.0"), "1.0.0");
    if (lecture.type !== "ok") throw new Error(lecture.type);
    const reprise = await partie({}, lecture.etat);
    expect(opaques(reprise)).toEqual(["cumul", "hasard", "seuil"]);
  });

  it("recommence opaque dans la strate suivante", async () => {
    const noyau = await partie();
    premierAchat(noyau);
    jouerJusqua(noyau, 20);
    etatDe(noyau).cumul = CUMUL;
    noyau.tick(0);
    expect(opaques(noyau)).toEqual([]);
    noyau.ouvrirFouille();
    await noyau.descendre(DEBUT + 1000, []);
    expect(noyau.etat.profondeur).toBe(3);
    expect(entree(noyau).leves).toEqual([]);
    expect(opaques(noyau)).toEqual(TOUS);
  });

  it("ignore une levée que la strate ne déclare pas", async () => {
    const noyau = await partie({}, undefined, (n) => ({
      ...creerLogiqueFactice(n),
      agir: (_etat, _action, ctx) => ctx.emettre({ type: "levee", element: "inconnu" }),
    }));
    noyau.agir({ type: "produire" });
    noyau.tick(0);
    expect(noyau.viderEvenements()).toEqual([{ type: "levee", element: "inconnu" }]);
    expect(entree(noyau).leves).toEqual([]);
  });

  it("ne cache rien d'une strate qui ne déclare pas d'opacité", async () => {
    const noyau = await partie({}, undefined, (n) => ({
      ...creerLogiqueFactice(n),
      opacite: undefined,
    }));
    expect(noyau.elementsOpaques()).toEqual(new Set());
  });
});

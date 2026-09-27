// Les premières années des caves, jouées à travers le noyau par deux joueurs automatiques : celui qui
// achète dès qu'il peut, comme à la surface, manque le premier hiver ; celui qui garde son grain
// au-dessus de la marque d'hiver le passe (docs/strates/strate-2.md, § 5).
import { describe, expect, it } from "vitest";
import { creerEtatNoyau } from "../../../noyau/logique/etat";
import { Noyau } from "../../../noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../../../noyau/logique/registre";
import type { ContexteTick } from "../../../noyau/logique/types";
import { logique, type ActionCaves, type EtatCaves } from ".";
import {
  capacite,
  coutFamille,
  coutStockage,
  enHiver,
  marqueHiver,
  prochainOutil,
  saison,
  saisonChaude,
  STOCKAGES,
  type DefStockage,
} from "./regles";

async function demarrer(): Promise<Noyau> {
  const registre = new Registre();
  registre.enregistrer(2, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
  const etat = creerEtatNoyau(1, 0);
  etat.profondeur = 2;
  const noyau = new Noyau(registre, etat);
  await noyau.demarrer(0);
  return noyau;
}

/** Ce que le joueur fait maintenant, ou null s'il attend. */
type Politique = (etat: EtatCaves) => ActionCaves | null;

const [GRENIER, SILO] = STOCKAGES;
const prix = (e: EtatCaves, s: DefStockage) => coutStockage(s, e.stockages[s.id]);

/** Comme à la surface : un outil dès qu'il est abordable, sinon une famille ; de la place quand c'est plein. */
const reflexe: Politique = (e) => {
  const outil = prochainOutil(e);
  if (outil && e.reserve >= outil.cout) return { type: "outil" };
  if (e.reserve >= 0.95 * capacite(e) && e.reserve >= prix(e, GRENIER)) {
    return { type: "construire", stockage: "grenier" };
  }
  if (e.reserve >= coutFamille(e)) return { type: "installer" };
  return null;
};

const CTX: ContexteTick = {
  effets: { multiplicateur: () => 1, actif: () => false },
  emettre: () => {},
};

/** La réserve au premier jour de l'hiver qui vient, si l'on n'achète plus rien. */
function reservePrevue(e: EtatCaves): number {
  const copie = structuredClone(e);
  while (!enHiver(copie)) {
    logique.tick(copie, Math.min(5, saisonChaude(copie.annee) - copie.jour), CTX);
  }
  return copie.reserve;
}

/**
 * Garder le grain au-dessus de la marque. De la place quand elle manque pour la marque, ou quand la
 * réserve est presque pleine, jamais en automne ; puis grandir avec ce qui dépassera la marque au premier
 * jour de l'hiver. La réserve baisse à la fin de l'automne : la comparer à la marque en plein été ne
 * suffit pas.
 */
const prudent: Politique = (e) => {
  if (enHiver(e)) return null;
  const marque = marqueHiver(e);
  // Le stockage le moins cher par boisseau de capacité.
  const s = prix(e, GRENIER) / GRENIER.capacite <= prix(e, SILO) / SILO.capacite ? GRENIER : SILO;
  const cap = capacite(e);
  const plein = e.reserve >= 0.9 * cap && saison(e) !== "automne" && cap < 1.6 * marque;
  if ((cap < 1.1 * marque || plein) && e.reserve >= prix(e, s)) {
    return { type: "construire", stockage: s.id };
  }
  const surplus = reservePrevue(e) - 1.1 * marque;
  const outil = prochainOutil(e);
  if (outil && surplus >= outil.cout && e.reserve >= outil.cout) return { type: "outil" };
  // Une famille de plus : son prix, et ce qu'elle mangera de plus pendant l'hiver.
  const famille = coutFamille(e) + marque / e.familles;
  if (surplus >= famille && e.reserve >= coutFamille(e)) return { type: "installer" };
  return null;
};

/** Joue `secondes` secondes : le joueur passe chaque seconde et achète tant qu'il le veut. */
async function jouer(politique: Politique, secondes: number) {
  const noyau = await demarrer();
  const etat = () => noyau.etatStrate as EtatCaves;
  let premiereRupture: number | null = null;
  for (let t = 0; t < secondes; t++) {
    for (let i = 0; i < 50; i++) {
      const action = politique(etat());
      if (!action) break;
      noyau.agir(action);
      noyau.tick(0);
    }
    noyau.avancer(1);
    if (premiereRupture === null && etat().bilan.rupture) premiereRupture = t + 1;
  }
  const bilans = etat().registre.filter((l) => l.cle.startsWith("registre.") && l.valeurs.annee);
  return { noyau, etat: etat(), premiereRupture, bilans };
}

/** Deux ans et la seconde soudure : les bilans des hivers 1 et 2 sont écrits. */
const DEUX_HIVERS = 2 * 420 - 70 + 60;

describe("les premières années, à travers le noyau", () => {
  it("font manquer le premier hiver à qui achète dès qu'il peut, avant 5 minutes", async () => {
    const { premiereRupture, bilans } = await jouer(reflexe, DEUX_HIVERS);
    expect(premiereRupture).not.toBeNull();
    expect(premiereRupture!).toBeLessThan(5 * 60);
    const hiver1 = bilans.find((l) => l.valeurs.annee === 1 && l.cle !== "registre.arrivee");
    expect(hiver1?.cle).toBe("registre.rupture");
    expect(hiver1!.valeurs.departs).toBeGreaterThan(0);
  });

  it("font passer les deux premiers hivers à qui garde son grain au-dessus de la marque", async () => {
    const { etat, premiereRupture, bilans } = await jouer(prudent, DEUX_HIVERS);
    expect(premiereRupture).toBeNull();
    expect(bilans.map((l) => l.cle)).toEqual([
      "registre.arrivee",
      "registre.sans-rupture",
      "registre.sans-rupture",
    ]);
    expect(etat.familles).toBeGreaterThan(20);
  });

  it("rattrapent l'absence avec la politique de la strate, et le noyau la compte en entier", async () => {
    const noyau = await demarrer();
    const etat = noyau.etatStrate as EtatCaves;
    const reprise = noyau.rattraper(3600 * 1000);
    expect(reprise).toMatchObject({ type: "absence", politique: "propre", comptee: 3600 });
    if (reprise.type !== "absence") throw new Error("absence attendue");
    expect(reprise.lignes.at(-1)).toBe("Les premiers froids sont là. L'hiver vous attend.");
    expect(etat.jour).toBe(350);
    expect(noyau.etat.meta.journal.strates.at(-1)!.tempsHorsLigne).toBe(3600);
  });
});

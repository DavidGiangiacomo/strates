// La dette jouée à travers le noyau par les joueurs automatiques de la fiche (docs/strates/strate-6.md,
// § 4) : le joueur naturel solde, le joueur réflexe tombe en défaut, celui qui apprend solde après
// quelques reports. L'issue va au journal, et la descente devient possible sans partir d'elle-même.
// Puis les absences de la fiche (§ 10), rattrapées par le noyau.
import { describe, expect, it } from "vitest";
import {
  APPREND,
  creerJoueur,
  NATUREL,
  REFLEXE,
  type ProfilDette,
} from "../../../../sim/joueurs/dette";
import { pointsDeFouille, preselection } from "../../../noyau/logique/artefacts";
import { creerEtatNoyau } from "../../../noyau/logique/etat";
import { Noyau } from "../../../noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../../../noyau/logique/registre";
import { logique, type EtatDette } from ".";
import { LIVRE_ENTIER } from "./regles";

const MINUTE = 60;
const HEURE = 3600;
/** I5 : la strate se termine en moins de 3 h 15 sans aucun artefact. */
const I5 = 3 * HEURE + 15 * MINUTE;

/** Ce qu'emporte un jeu correct du réseau (21 points) et du chœur (14 points) : docs/artefacts.md, § 8. */
const JEU_CORRECT = [...preselection(21, 4), ...preselection(14, 5)];

async function demarrer(artefacts: readonly string[] = []): Promise<Noyau> {
  const registre = new Registre();
  registre.enregistrer(6, async () => ({ logique, vue: null, textes: {} }) as StrateQuelconque);
  const etat = creerEtatNoyau(1, 0);
  etat.profondeur = 6;
  etat.artefacts = [...artefacts];
  const noyau = new Noyau(registre, etat);
  await noyau.demarrer(0);
  return noyau;
}

/**
 * Une partie, seconde par seconde, jusqu'à l'issue. `absence` interrompt le jeu une fois, quand
 * `quand` le dit, pour `duree` secondes, rattrapées par le noyau.
 */
async function jouer(
  profil: ProfilDette,
  absence?: { quand: (etat: EtatDette) => boolean; duree: number },
  artefacts: readonly string[] = [],
) {
  const noyau = await demarrer(artefacts);
  const etat = () => noyau.etatStrate as EtatDette;
  const joueur = creerJoueur(noyau, profil);
  let lignes: string[] | null = null;
  for (let t = 0; !noyau.seuil.atteint && t < 6 * HEURE; t++) {
    if (absence && lignes === null && absence.quand(etat())) {
      const reprise = noyau.rattraper(noyau.etat.reference + absence.duree * 1000);
      lignes = reprise.type === "absence" ? reprise.lignes : [];
    }
    joueur.seconde(t);
  }
  const journal = noyau.etat.meta.journal.strates.at(-1)!;
  return { noyau, etat: etat(), gestes: joueur.gestes, journal, lignes };
}

describe("une partie de la dette", () => {
  it("se solde en 2 h 52 pour le joueur naturel, sans un report, et vaut le livre entier : 28 points", async () => {
    const { noyau, etat, gestes, journal } = await jouer(NATUREL);
    expect(etat.issue).toBe("soldee");
    expect(etat.issueA! / HEURE).toBeGreaterThan(2.75);
    expect(etat.issueA!).toBeLessThan(3 * HEURE);
    expect(etat.issueA!).toBeLessThan(I5);
    expect(etat.reportees).toBe(0);
    expect(gestes).toBe(118);
    expect(etat.valeur).toBe(LIVRE_ENTIER);
    expect(pointsDeFouille(logique.valeurConvertible(etat))).toBe(28);
    // L'issue va au journal ; la descente devient possible, et le joueur creuse quand il veut.
    expect(journal.seuil).toMatchObject({ issue: "soldee" });
    expect(noyau.seuil).toEqual({ atteint: true, issue: "soldee" });
    expect(noyau.demanderFouille()).toBe(true);
  });

  it("tombe en défaut vers 50 minutes pour le joueur réflexe, avec 12 points, après des dizaines de reports", async () => {
    const { noyau, etat, journal } = await jouer(REFLEXE);
    expect(etat.issue).toBe("defaut");
    expect(etat.issueA! / MINUTE).toBeGreaterThan(40);
    expect(etat.issueA! / MINUTE).toBeLessThan(60);
    expect(pointsDeFouille(etat.valeur)).toBe(12);
    expect(etat.reportees).toBeGreaterThan(30);
    expect(etat.tablette).toBe(3);
    // Un défaut rend la descente possible, il ne la déclenche pas.
    expect(journal.seuil).toMatchObject({ issue: "defaut" });
    expect(noyau.seuil.automatique).toBeUndefined();
    expect(noyau.demanderFouille()).toBe(true);
  });

  it("se solde aussi pour celui qui apprend : ses promesses faites à l'aveugle se paient encore un moment", async () => {
    const { etat } = await jouer(APPREND);
    expect(etat.issue).toBe("soldee");
    expect(etat.issueA!).toBeLessThan(I5);
    expect(etat.reportees).toBeGreaterThan(0);
    expect(etat.reportees).toBeLessThanOrEqual(10);
  });
});

describe("les absences de la fiche (§ 10)", () => {
  it("laissent le joueur naturel revenir sans défaut, même après deux jours, puis solder", async () => {
    const { etat, lignes } = await jouer(NATUREL, {
      quand: (e) => e.temps >= 40 * MINUTE,
      duree: 48 * HEURE,
    });
    expect(lignes![0]).toMatch(/^\d+ échéances honorées, \d+ reportées\.$/);
    expect(etat.issue).toBe("soldee");
    expect(etat.reportees).toBeGreaterThan(0);
    expect(etat.reportees).toBeLessThanOrEqual(6);
  });

  it("comptent en entier jusqu'à la grande crue : partir juste après la dernière promesse ne fait pas tomber", async () => {
    const { etat, lignes } = await jouer(NATUREL, {
      quand: (e) => e.grandeCrue !== null,
      duree: HEURE,
    });
    expect(lignes).toEqual(["24 échéances honorées.", "Honoré. Plus rien n'est dû."]);
    expect(etat.issue).toBe("soldee");
  });

  it("font tomber pendant l'absence un livre trop engagé, et la fin s'écrit au retour", async () => {
    const { etat, lignes, journal } = await jouer(REFLEXE, {
      quand: (e) => e.temps >= 30 * MINUTE,
      duree: 12 * HEURE,
    });
    expect(lignes!.at(-1)).toBe("Échu. Le reste demeure dû.");
    expect(etat.issue).toBe("defaut");
    expect(journal.seuil).toMatchObject({ issue: "defaut" });
  });
});

describe("avec les objets d'un jeu correct (§ 8)", () => {
  it("se solde en 2 h 34 pour le joueur naturel : la confiance × 1,5, éveillée à la première tablette brisée", async () => {
    const { noyau, etat } = await jouer(NATUREL, undefined, JEU_CORRECT);
    expect(etat.issue).toBe("soldee");
    expect(etat.issueA! / HEURE).toBeGreaterThan(2.45);
    expect(etat.issueA! / HEURE).toBeLessThan(2.7);
    expect(etat.multiplicateurs.confiance).toBeCloseTo(1.5, 9);
    // La dette a nommé les gages du joueur : l'inventaire les montre sous leur nom d'en bas.
    expect([...noyau.nommes].sort()).toEqual(
      JEU_CORRECT.filter((id) => id.startsWith("s5")).sort(),
    );
  });

  it("laisse tomber le joueur réflexe en défaut : les gages ne rendent pas le crédit rentable", async () => {
    const { etat } = await jouer(REFLEXE, undefined, JEU_CORRECT);
    expect(etat.issue).toBe("defaut");
    expect(pointsDeFouille(etat.valeur)).toBeLessThan(28);
  });
});

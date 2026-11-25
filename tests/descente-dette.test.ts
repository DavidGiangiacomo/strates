// La descente de la dette vers le lit (#88 ; docs/strates/strate-6.md, § 4 et § 9), jouée à travers le
// noyau et le passage de l'interface. Soldée ou en défaut, l'issue va au journal ; le sol cesse de
// résister, sans que la descente parte d'elle-même ; l'écran de fouille écrit l'issue au-dessus de la
// valeur, en sceaux ; et le lit, dessous, garde les fosses de cette issue. Un défaut survenu pendant
// l'absence suit le même chemin. La partie part de la dette avant sa dernière promesse, comme le
// raccourci des outils de développement.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detteDernierePromesse } from "../src/dev/dette";
import { preselection } from "../src/noyau/logique/artefacts";
import { creerEtatNoyau } from "../src/noyau/logique/etat";
import { Noyau } from "../src/noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../src/noyau/logique/registre";
import { DUREES, Passage } from "../src/noyau/ui/passage.svelte";
import { strate as dette } from "../src/strates/s6-dette";
import {
  logique as logiqueDette,
  type ActionDette,
  type EtatDette,
} from "../src/strates/s6-dette/logique";
import { CRUE } from "../src/strates/s6-dette/logique/regles";
import { strate as lit } from "../src/strates/s7-lit";
import type { EtatLit } from "../src/strates/s7-lit/logique";

const DEBUT = 1_000_000;
const HEURE = 3600;
const DERNIERE: ActionDette = { type: "promettre", promesse: "toutesLesCrues", terme: 2 };
/** Sans les espaces fines des sceaux. */
const lire = (texte: string) => texte.replace(/\u202f/g, " ");

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

async function partie() {
  const registre = new Registre();
  registre.enregistrer(6, async () => dette as StrateQuelconque);
  registre.enregistrer(7, async () => lit as StrateQuelconque);
  const etat = creerEtatNoyau(1, DEBUT);
  etat.profondeur = 6;
  etat.strates[6] = { version: logiqueDette.versionEtat, etat: detteDernierePromesse() };
  const noyau = new Noyau(registre, etat);
  await noyau.demarrer(DEBUT);
  const appels = { resister: 0 };
  const passage = new Passage({
    noyau,
    maintenant: () => noyau.etat.reference,
    attendre: (ms) => new Promise((fin) => setTimeout(fin, ms)),
    sauvegarder: async () => true,
    changerStrate: () => {},
    resister: () => appels.resister++,
    signaler: () => {},
  });
  const etatDette = () => noyau.etatStrate as EtatDette;
  /** La dernière promesse : tout de suite, trop tôt, ou trois crues plus tard, quand la caisse suit. */
  const promettreLaDerniere = (attendre: number) => {
    noyau.avancer(attendre);
    noyau.agir(DERNIERE);
    noyau.tick(0);
    expect(etatDette().grandeCrue).not.toBeNull();
  };
  /** Creuse, et attend que l'écran de fouille soit ouvert. */
  const creuser = async () => {
    const coup = passage.creuser();
    await vi.advanceTimersByTimeAsync(DUREES.pioche);
    await coup;
  };
  return { noyau, passage, appels, etatDette, promettreLaDerniere, creuser };
}

describe("la descente de la dette", () => {
  it("soldée : le sol résiste jusqu'à la grande crue, puis l'écran écrit « soldée » au-dessus du livre entier", async () => {
    const { noyau, passage, appels, etatDette, promettreLaDerniere, creuser } = await partie();
    promettreLaDerniere(3 * CRUE);
    await creuser();
    expect(appels.resister).toBe(1);
    expect(passage.phase).toBe("jeu");

    noyau.avancer(12 * CRUE);
    expect(etatDette().issue).toBe("soldee");
    expect(noyau.seuil).toEqual({ atteint: true, issue: "soldee" });
    expect(noyau.etat.meta.journal.strates.at(-1)!.seuil).toMatchObject({ issue: "soldee" });
    // Un défaut ou un solde ne déclenche rien : le joueur creuse quand il veut.
    passage.actualiser();
    expect(noyau.descenteAutomatique).toBe(false);
    expect(passage.phase).toBe("jeu");

    await creuser();
    expect(passage.phase).toBe("fouille");
    const ecran = passage.ecran!;
    expect(ecran.issue).toBe("soldée");
    expect(ecran.libelle).toBe("Honoré");
    expect(lire(ecran.formater(ecran.fouille.valeur))).toBe("384 ●●●●●●");
    expect(ecran.fouille.points).toBe(28);

    await noyau.descendre(noyau.etat.reference, ecran.fouille.preselection);
    expect(noyau.etat.profondeur).toBe(7);
    // Le lit garde les fosses de la dette soldée : ses tablettes y sont brisées.
    expect((noyau.etatStrate as EtatLit).dette).toBe("soldee");
    const entree = noyau.etat.meta.journal.strates.find((e) => e.strate === 6)!;
    expect(entree.fouille).toMatchObject({ points: 28, emportes: preselection(28, 6) });
  });

  it("en défaut : la grande crue fixée trop tôt n'est pas couverte, et l'écran écrit « en défaut »", async () => {
    const { noyau, passage, etatDette, promettreLaDerniere, creuser } = await partie();
    promettreLaDerniere(0);
    noyau.avancer(12 * CRUE);
    expect(etatDette().issue).toBe("defaut");
    expect(noyau.seuil).toEqual({ atteint: true, issue: "defaut" });

    await creuser();
    const ecran = passage.ecran!;
    expect(ecran.issue).toBe("en défaut");
    // Les quatre premières tablettes honorées : 24 points, la dernière ne compte pas (fiche, § 9).
    expect(ecran.fouille.points).toBe(24);

    await noyau.descendre(noyau.etat.reference, ecran.fouille.preselection);
    expect((noyau.etatStrate as EtatLit).dette).toBe("defaut");
    expect(noyau.etat.meta.journal.strates.find((e) => e.strate === 6)!.seuil).toMatchObject({
      issue: "defaut",
    });
  });

  it("en défaut pendant l'absence : le retour le dit, la fissure est déjà tracée, et la descente suit", async () => {
    const { noyau, passage, etatDette, promettreLaDerniere, creuser } = await partie();
    promettreLaDerniere(0);
    const reprise = noyau.rattraper(noyau.etat.reference + HEURE * 1000);
    expect(reprise).toMatchObject({ type: "absence", politique: "propre" });
    expect(reprise.type === "absence" && reprise.lignes.at(-1)).toBe("Échu. Le reste demeure dû.");
    expect(etatDette().issue).toBe("defaut");
    expect(noyau.seuil).toEqual({ atteint: true, issue: "defaut" });
    expect(noyau.strate.logique.filet!(noyau.etatStrate)).toBe(1);

    await creuser();
    expect(passage.ecran!.issue).toBe("en défaut");
    await noyau.descendre(noyau.etat.reference, passage.ecran!.fouille.preselection);
    expect((noyau.etatStrate as EtatLit).dette).toBe("defaut");
  });
});

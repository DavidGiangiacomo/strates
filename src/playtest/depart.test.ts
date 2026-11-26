// Les départs de recette (#113, #120) : une partie neuve à l'arrivée dans la dette, ou dans le lit
// après une dette soldée ou en défaut, avec les objets et la Compréhension d'un jeu correct, sans
// absence à rattraper.
import { describe, expect, it } from "vitest";
import { preselection } from "../noyau/logique/artefacts";
import { Noyau } from "../noyau/logique/noyau";
import { ecrireSauvegarde, lireSauvegarde } from "../noyau/logique/sauvegarde";
import { creerRegistre } from "../strates/registre";
import type { EtatDette } from "../strates/s6-dette/logique";
import { OPAQUES } from "../strates/s6-dette/logique/regles";
import type { EtatLit } from "../strates/s7-lit/logique";
import {
  creerDepart,
  demandeDepart,
  KAPPA_JEU_CORRECT,
  RYTHME_JEU_CORRECT,
  sansDepart,
} from "./depart";

const MAINTENANT = 1_800_000_000_000;
const adresse = (requete: string) => new URL(`https://exemple.org/strates/${requete}`);

describe("le lien de départ", () => {
  it("se lit dans l'adresse, avec ou sans journal, et seulement s'il est connu", () => {
    expect(demandeDepart(adresse("?depart=lit-soldee"))).toBe("lit-soldee");
    expect(demandeDepart(adresse("?depart=dette&journal=D1"))).toBe("dette");
    expect(demandeDepart(adresse("?journal=T1&depart=lit-defaut"))).toBe("lit-defaut");
    expect(demandeDepart(adresse("?depart=fond"))).toBeNull();
    expect(demandeDepart(adresse("?depart=constructor"))).toBeNull();
    expect(demandeDepart(adresse(""))).toBeNull();
  });

  it("s'efface de l'adresse, qui garde le journal : un rechargement ne le refait pas", () => {
    expect(sansDepart(adresse("?depart=lit-soldee&journal=T1"))).toBe(
      "https://exemple.org/strates/?journal=T1",
    );
  });
});

describe("la partie de départ", () => {
  it("commence à l'arrivée dans le lit, avec la Compréhension d'un jeu correct", () => {
    const etat = creerDepart("lit-soldee", 7, MAINTENANT);
    expect(etat.profondeur).toBe(7);
    expect(etat.kappa).toBe(KAPPA_JEU_CORRECT);
    expect(etat.reference).toBe(MAINTENANT);
  });

  it("porte au journal les six strates d'avant, à leur rythme, la dette finie à l'instant", () => {
    const etat = creerDepart("lit-defaut", 7, MAINTENANT);
    const journal = etat.meta.journal.strates;
    expect(journal.map((e) => e.strate)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const [i, e] of journal.entries()) {
      expect(e.seuil!.le - e.arrivee).toBe(e.tempsDeJeu * 1000);
      if (i > 0) expect(e.arrivee).toBe(journal[i - 1]!.seuil!.le);
    }
    expect(journal[0]!.arrivee).toBe(etat.partieCreeeLe);
    expect(journal.at(-1)!.seuil).toEqual({ le: MAINTENANT, issue: "defaut" });
    expect(creerDepart("lit-soldee", 7, MAINTENANT).meta.journal.strates.at(-1)!.seuil!.issue).toBe(
      "soldee",
    );
  });

  it("emporte les objets d'un jeu correct, et chaque strate nomme ceux d'au-dessus", () => {
    const etat = creerDepart("lit-soldee", 7, MAINTENANT);
    const journal = etat.meta.journal.strates;
    for (const n of [1, 2, 3, 4, 5, 6] as const) {
      const emportes = preselection(RYTHME_JEU_CORRECT[n].points, n);
      expect(journal[n - 1]!.fouille!.emportes).toEqual(emportes);
      for (const id of emportes) expect(etat.artefacts).toContain(id);
    }
    expect(journal[0]!.nommes).toEqual([]);
    // La dette a nommé les objets du chœur : dans le lit, ils gardent leur nom de gage.
    expect(journal[5]!.nommes).toEqual(journal[4]!.fouille!.emportes);
  });

  it("se sauvegarde et se relit comme toute partie", () => {
    const etat = creerDepart("lit-soldee", 7, MAINTENANT);
    const lecture = lireSauvegarde(ecrireSauvegarde(etat, "0.0.0"), "0.0.0");
    expect(lecture.type).toBe("ok");
  });

  it("commence aussi à l'arrivée dans la dette : les cinq strates d'avant au journal, et leurs objets", () => {
    const etat = creerDepart("dette", 7, MAINTENANT);
    expect(etat.profondeur).toBe(6);
    expect(etat.kappa).toBe(KAPPA_JEU_CORRECT);
    const journal = etat.meta.journal.strates;
    expect(journal.map((e) => e.strate)).toEqual([1, 2, 3, 4, 5]);
    // Le chœur vient de finir, sans issue : seule la dette en a une.
    expect(journal.at(-1)!.seuil).toEqual({ le: MAINTENANT });
    const minutes = [1, 2, 3, 4, 5].reduce(
      (s, n) => s + RYTHME_JEU_CORRECT[n as 1 | 2 | 3 | 4 | 5].minutes,
      0,
    );
    expect(MAINTENANT - etat.partieCreeeLe).toBe(minutes * 60_000);
    expect(etat.artefacts).toEqual(
      [1, 2, 3, 4, 5].flatMap((n) =>
        preselection(RYTHME_JEU_CORRECT[n as 1 | 2 | 3 | 4 | 5].points, n as 1 | 2 | 3 | 4 | 5),
      ),
    );
  });

  it("ouvre la dette sans absence à rattraper, les noms et la confiance lisibles par les objets", async () => {
    const noyau = new Noyau(creerRegistre(), creerDepart("dette", 7, MAINTENANT));
    await noyau.demarrer(MAINTENANT);
    expect(noyau.strate.logique.numero).toBe(6);
    expect(noyau.rattraper(MAINTENANT).type).toBe("aucune");
    const dette = noyau.etatStrate as EtatDette;
    expect(dette.temps).toBe(0);
    expect(dette.tablette).toBe(1);
    // Les objets du réseau et du chœur agissent ici ; le doigt qui montre et le gage qui souffle
    // lèvent dès l'arrivée les noms des promesses et la confiance (fiche de la dette, § 7).
    expect(dette.objets).toHaveLength(8);
    const opaques = noyau.elementsOpaques();
    expect([...opaques].sort()).toEqual([OPAQUES.majorations, OPAQUES.report]);
    expect(noyau.etat.meta.journal.strates.at(-1)).toMatchObject({ strate: 6 });
  });

  it("ouvre le lit sans absence à rattraper : les fosses de la dette, et les objets qui agissent", async () => {
    for (const [depart, issue] of [
      ["lit-soldee", "soldee"],
      ["lit-defaut", "defaut"],
    ] as const) {
      const noyau = new Noyau(creerRegistre(), creerDepart(depart, 7, MAINTENANT));
      await noyau.demarrer(MAINTENANT);
      expect(noyau.strate.logique.numero).toBe(7);
      // La dette vient de finir : rien à rattraper, et le lit commence vide.
      expect(noyau.rattraper(MAINTENANT).type).toBe("aucune");
      const lit = noyau.etatStrate as EtatLit;
      expect(lit.dette).toBe(issue);
      expect(lit.temps).toBe(0);
      expect(lit.niveau).toBe(0);
      noyau.tick(0.1);
      // Les objets de la dette et du chœur agissent dans le lit : la pierre qui pèse, l'œuf qui garde…
      expect(lit.objets.length).toBeGreaterThan(0);
      expect(lit.objets.every((id) => id.startsWith("s5-") || id.startsWith("s6-"))).toBe(true);
      expect(noyau.etat.meta.journal.strates.at(-1)).toMatchObject({ strate: 7 });
    }
  });
});

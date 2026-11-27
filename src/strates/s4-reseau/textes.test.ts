// Les textes du réseau (fiche, § 11 ; bible, §§ 2, 4, 5, 6 et 9) : la voix d'un carnet de relevés.
import { describe, expect, it } from "vitest";
import { strate as surface } from "../s1-surface";
import { strate as caves } from "../s2-caves";
import { strate as atelier } from "../s3-atelier";
import { strate as dette } from "../s6-dette";
import { strate as lit } from "../s7-lit";
import { CATALOGUE } from "../../noyau/logique/catalogue";
import { logique, NOEUDS } from "./logique";
import { etatInitial } from "./logique/etat";
import { textes } from "./textes.fr";

const mots = (texte: string) => texte.split(/\s+/).filter((m) => /\p{L}/u.test(m)).length;
// Les mots que la bible interdit partout, et « artefact », réservé au bandeau (docs/bible.md, § 2).
const interdits =
  /ancien|ancêtre|civilisation|prophétie|mystère|secret|(?<!\p{L})destins?(?!\p{L})|magie|bravo|félicitation|artefact/iu;

/** Les clés que la logique écrit au carnet, ou dans le résumé d'une absence. */
const CARNET = [
  "carnet.reliee",
  "carnet.aPlein",
  "carnet.posee",
  "carnet.grandeConduite",
  "carnet.elargie",
  "carnet.auPlusLarge",
  "carnet.vanne.0",
  "carnet.vanne.1",
  "carnet.vanne.2",
  "carnet.vanne.3",
  "carnet.vanne.4",
  "carnet.monte",
  "carnet.deborde",
  "carnet.goulot",
  "carnet.goulotAuPlusLarge",
  "carnet.stable",
  "carnet.aucun",
  "carnet.depuisUne",
  "carnet.depuis",
  "carnet.voutee",
  "carnet.citerne",
  "carnet.eveil",
  "absence.recu",
  "absence.deborde",
];

/** Les objets de l'atelier, que le réseau nomme : ses noms d'en bas comptent dans son budget. */
const NOMMES = CATALOGUE.filter((a) => a.origine === 3);

describe("les textes du réseau", () => {
  it("ont une ligne pour chaque chose que le carnet écrit, et un nom pour chaque nœud", () => {
    for (const cle of CARNET) expect(textes[cle], cle).toBeTruthy();
    for (const n of NOEUDS) expect(textes[`noeud.${n}`], n).toBeTruthy();
    expect(textes["noeud.quatrieme"]).toBe("Quatrième bassin");
    for (const { cle } of logique.graphe!(etatInitial()).noeuds)
      expect(textes[cle], cle).toBeTruthy();
  });

  it("parlent comme un carnet de relevés : la vanne, le bassin, le niveau, sans un mot de trop", () => {
    expect(textes["carnet.vanne.1"]).toBe("Vanne {conduite} : ouverte d'un quart.");
    expect(textes["carnet.aucun"]).toBe("Aucun goulot.");
    expect(textes["carnet.citerne"]).toBe("Citerne qui chante : pleine.");
    // Une ligne par fait : une phrase courte, et le débit à part quand il y en a un.
    for (const cle of CARNET.filter((c) => c.startsWith("carnet."))) {
      expect(textes[cle], cle).toMatch(/^[^.]+\.( \{debit\}\.)?$/u);
      expect(mots(textes[cle]!), cle).toBeLessThanOrEqual(7);
    }
  });

  it("ne laissent dans leurs modèles que les nombres et les noms que la vue sait écrire", () => {
    const connus = new Set([
      "source",
      "debit",
      "conduite",
      "noeud",
      "minutes",
      "muids",
      "prix",
      "capacite",
      "de",
      "vers",
      "ouverture",
      "objet",
    ]);
    for (const [cle, texte] of Object.entries(textes)) {
      for (const [, nom] of texte.matchAll(/\{(\w+)\}/g)) {
        expect(connus, `${cle} : ${nom}`).toContain(nom);
      }
    }
  });

  it("parlent à la troisième personne, sans s'exclamer, sans les mots que la bible interdit", () => {
    for (const [cle, texte] of Object.entries(textes)) {
      expect(texte, cle).not.toMatch(/\bvous\b|\bvotre\b|\bvos\b/i);
      expect(texte, cle).not.toContain("!");
      expect(texte, cle).not.toMatch(interdits);
      // « Creuser » et la fouille sont au noyau, et à son bandeau.
      expect(texte, cle).not.toMatch(/creus|fouill/i);
    }
  });

  it("donnent une notice qui constate les règles, sans dire où chercher le goulot", () => {
    const parties = ["eau", "calibre", "partage", "bassin", "mesures"];
    expect(textes["aide.titre"]).toBe("Notice du réseau");
    const notice = parties.map((p) => {
      expect(textes[`aide.${p}.titre`], p).toBeTruthy();
      return textes[`aide.${p}`]!;
    });
    const tout = notice.join(" ");
    expect(tout).toMatch(/monte, puis déborde/);
    expect(tout).toMatch(/parts égales/);
    expect(tout).not.toMatch(/goulot|aval|chercher|il faut|mieux|conseil|essayer|penser/i);
  });

  it("laissent au fond leurs traces : le temps sans goulot, et la citerne pleine", () => {
    expect(textes["trace.sansGoulot"]).toBe(textes["carnet.depuis"]);
    expect(textes["trace.sansGoulotUne"]).toBe(textes["carnet.depuisUne"]);
    expect(textes["trace.citerne"]).toBe(textes["carnet.citerne"]);
    expect(Object.keys(textes).filter((cle) => cle.startsWith("trace."))).toHaveLength(3);
  });

  it("nomment les objets de l'atelier comme des pièces du réseau, par ce qu'elles font au flux", () => {
    expect(NOMMES.map((a) => a.nomDEnBas)).toEqual([
      "le regard qui grossit",
      "la vanne qui compte",
      "le collier qui serre",
      "la roue qui retient",
      "la conduite qui chante",
    ]);
    for (const a of NOMMES) {
      expect(a.nomDEnBas).toMatch(/^(le|la) \p{L}+ qui \p{L}+$/u);
      expect(a.nomDEnBas.split(" ").length).toBeLessThanOrEqual(5);
    }
  });

  it("tiennent dans leur budget, 600 mots, noms d'en bas compris, hors formules et traces", () => {
    const total =
      Object.entries(textes)
        .filter(([cle]) => !cle.startsWith("formule.") && !cle.startsWith("trace."))
        .reduce((n, [, t]) => n + mots(t), 0) + NOMMES.reduce((n, a) => n + mots(a.nomDEnBas), 0);
    expect(total).toBeLessThanOrEqual(600);
    // Ce qui est écrit, pour la fiche et la bible.
    expect(total).toBe(350);
  });
});

describe("I1 : le réseau est seul à compter en pouces et en muids, les milliers séparés d'un point", () => {
  it("et les autres strates n'en font rien, ni dans leurs textes, ni à l'écran de fouille", () => {
    for (const [nom, autre] of Object.entries({ surface, caves, atelier, dette, lit })) {
      for (const texte of Object.values(autre.textes)) {
        expect(texte, nom).not.toMatch(/\bpouces?\b|\bmuids?\b|\blignes d'eau\b/i);
      }
      expect(autre.formaterValeur!(1_234_567), nom).not.toContain("1.234.567");
    }
  });
});

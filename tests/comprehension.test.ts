// Une nouvelle partie et la Compréhension (#78) : κ progresse à la surface puis dans les caves, et
// l'opacité des caves se lève selon κ. Les strates sont les vraies, jouées par les joueurs
// automatiques du simulateur. Une strate factice attend sous les caves, pour qu'on puisse en descendre.
import { describe, expect, it } from "vitest";
import { CORRECT as CORRECT_CAVES, creerJoueur as joueurCaves } from "../sim/joueurs/caves";
import { CORRECT as CORRECT_SURFACE, creerJoueur as joueurSurface } from "../sim/joueurs/surface";
import {
  CREUSER_AVANT_FISSURE,
  delaiLevee,
  SANS_AIDE,
  SANS_ARTEFACT,
} from "../src/noyau/logique/comprehension";
import { creerEtatNoyau, type EtatNoyau } from "../src/noyau/logique/etat";
import { Noyau } from "../src/noyau/logique/noyau";
import { Registre, type StrateQuelconque } from "../src/noyau/logique/registre";
import { creerLogiqueFactice } from "../src/strates/factice/logique";
import { logique as surface } from "../src/strates/s1-surface/logique";
import { logique as caves, type EtatCaves } from "../src/strates/s2-caves/logique";
import { ACTES, ANNEE_RATIONS, saison } from "../src/strates/s2-caves/logique/regles";

/** Une partie aux vraies strates 1 et 2, à partir de `etat`. */
async function partie(etat: EtatNoyau = creerEtatNoyau(1, 0)): Promise<Noyau> {
  const registre = new Registre();
  const strate = (logique: unknown) => async () =>
    ({ logique, vue: null, textes: {} }) as StrateQuelconque;
  registre.enregistrer(1, strate(surface));
  registre.enregistrer(2, strate(caves));
  registre.enregistrer(3, strate(creerLogiqueFactice(3)));
  const noyau = new Noyau(registre, etat);
  await noyau.demarrer(0);
  return noyau;
}

/** Une partie qui arrive dans les caves, avec κ et les objets donnés. */
function auxCaves(kappa: number, artefacts: string[] = []): Promise<Noyau> {
  const etat = creerEtatNoyau(1, 0);
  Object.assign(etat, { profondeur: 2, kappa, artefacts });
  return partie(etat);
}

const opaques = (noyau: Noyau) => [...noyau.elementsOpaques()].sort();
const entree = (noyau: Noyau, i = -1) => noyau.etat.meta.journal.strates.at(i)!;

describe("une nouvelle partie", () => {
  it("fait monter κ à la surface, puis dans les caves, dont l'opacité se lève en chemin", async () => {
    const noyau = await partie();
    expect(noyau.etat.kappa).toBe(0);

    // La surface, jouée jusqu'au seuil ; le joueur creuse aussitôt, avant la fissure.
    const enSurface = joueurSurface(noyau, CORRECT_SURFACE);
    let t = 0;
    for (; !noyau.seuil.atteint && t < 3 * 3600; t++) enSurface.seconde(t);
    expect(noyau.seuil.atteint).toBe(true);
    noyau.ouvrirFouille();
    await noyau.descendre(t * 1000, []);
    expect(entree(noyau, 0).actes).toEqual([SANS_AIDE, CREUSER_AVANT_FISSURE]);
    expect(noyau.etat.kappa).toBe(8);

    // Les caves, sans objet : tout ce que la fiche cache l'est à l'arrivée.
    noyau.reprendre();
    expect(opaques(noyau)).toEqual(["cycle", "marque", "naissances", "pertes"]);
    const vallee = () => noyau.etatStrate as EtatCaves;
    const enCaves = joueurCaves(noyau, CORRECT_CAVES);
    const jouer = (fin: () => boolean) => {
      for (; !fin() && t < 8 * 3600; t++) enCaves.seconde(t);
    };
    // Le premier bilan nomme la marque, révèle les pertes et, l'hiver passé, annonce les naissances.
    jouer(() => vallee().hivers.length > 0);
    expect(opaques(noyau)).toEqual(["cycle"]);
    // Le grand cycle se découvre en l'an 5, quand l'hiver s'allonge.
    jouer(() => vallee().annee === ANNEE_RATIONS && saison(vallee()) === "hiver");
    expect(opaques(noyau)).toEqual([]);

    jouer(() => noyau.seuil.atteint);
    noyau.ouvrirFouille();
    await noyau.descendre(t * 1000, []);
    expect(entree(noyau, 1).actes).toEqual([
      ACTES.premierHiver,
      ACTES.anneeSansAchatDAutomne,
      ACTES.seuilAuPlusTot,
      SANS_AIDE,
      SANS_ARTEFACT,
    ]);
    expect(noyau.etat.kappa).toBe(22);
  });
});

describe("l'opacité des caves", () => {
  it("se lève selon κ : au délai L(κ), avant même le premier bilan quand κ est haut", async () => {
    for (const [kappa, leve] of [
      [8, false],
      [100, true],
    ] as const) {
      const noyau = await auxCaves(kappa);
      // Un peu plus de trois minutes de caves, sans rien faire : le premier bilan vient vers 6 minutes.
      noyau.avancer(3 * 60 + 1);
      expect((noyau.etatStrate as EtatCaves).hivers).toHaveLength(0);
      expect(opaques(noyau)).toEqual(
        leve ? ["cycle"] : ["cycle", "marque", "naissances", "pertes"],
      );
    }
    // À κ = 8, en arrivant de la surface au mieux, le délai est de 17 minutes : le bilan passe avant.
    expect(Math.round(delaiLevee(8) / 60)).toBe(17);
  });

  it("se lève dès l'arrivée avec les objets de la surface : les deux fenêtres, l'armoire", async () => {
    const noyau = await auxCaves(8, ["s1-double-ecran", "s1-serveur"]);
    expect(opaques(noyau)).toEqual(["naissances"]);
  });
});

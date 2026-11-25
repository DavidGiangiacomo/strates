// Le compte des crues (fiche, § 6) : la bande se lit comme le limon. Les crues passées en bas,
// déposées ; les crues à venir au-dessus, piquées de rouge à leurs échéances ; la grande crue, une
// couche épaisse. Le trait du présent ne bouge pas, et le compte s'arrête à l'issue.
import { describe, expect, it } from "vitest";
import { etatInitial, type EtatDette } from "../logique/etat";
import { CRUE } from "../logique/regles";
import {
  A_VENIR,
  COUCHE,
  compteDesCrues,
  cruePresente,
  EPAISSEUR_GRANDE_CRUE,
  PASSEES,
  type Couche,
} from "./compte";

const aVenir = (couches: Couche[]) => couches.filter((c) => !c.deposee);
const deposees = (couches: Couche[]) => couches.filter((c) => c.deposee);

describe("le compte des crues", () => {
  it("montre à l'arrivée vingt crues à venir au-dessus du présent, et des couches trouvées dessous", () => {
    const { couches, present, hauteur, issue } = compteDesCrues(etatInitial());
    expect(aVenir(couches).map((c) => c.crue)).toEqual(
      Array.from({ length: A_VENIR }, (_, i) => i + 1),
    );
    // Vingt-quatre couches sous le présent, et une de plus sous le bord, pour descendre sans trou.
    expect(deposees(couches)).toHaveLength(PASSEES + 1);
    expect(deposees(couches)[0]).toMatchObject({ crue: 0, y: present, hauteur: COUCHE });
    expect(aVenir(couches)[0]).toMatchObject({ crue: 1, y: present - COUCHE });
    // La place de la grande crue est gardée en haut : la bande a toujours la même hauteur.
    expect(present).toBe((A_VENIR + EPAISSEUR_GRANDE_CRUE - 1) * COUCHE);
    expect(hauteur).toBe(present + PASSEES * COUCHE);
    expect(issue).toBeNull();
  });

  it("pique de rouge les crues à venir où tombent des échéances, une piqûre par échéance", () => {
    const etat = etatInitial();
    etat.echeances.push(
      { numero: 3, promesse: "huile", crue: 6, du: 1, origine: 1, prix: 1, reports: 0 },
      { numero: 4, promesse: "huile", crue: 6, du: 1, origine: 1, prix: 1, reports: 0 },
    );
    const piquees = aVenir(compteDesCrues(etat).couches)
      .filter((c) => c.echeances > 0)
      .map((c) => [c.crue, c.echeances]);
    expect(piquees).toEqual([
      [1, 1],
      [2, 1],
      [6, 2],
    ]);
  });

  it("descend d'un cran à chaque crue : le présent ne bouge pas, la couche passée se dépose", () => {
    const etat = etatInitial();
    const avant = compteDesCrues(etat);
    etat.crues = 1;
    const apres = compteDesCrues(etat);
    expect(apres.present).toBe(avant.present);
    const couche = (c: ReturnType<typeof compteDesCrues>, crue: number) =>
      c.couches.find((x) => x.crue === crue)!;
    expect(couche(avant, 1)).toMatchObject({ deposee: false, y: avant.present - COUCHE });
    expect(couche(apres, 1)).toMatchObject({ deposee: true, y: apres.present });
    // Toutes les couches descendent d'autant : celle de la crue passée, l'échéance qu'elle portait
    // tombée.
    expect(couche(apres, 0).y - couche(avant, 0).y).toBe(COUCHE);
    expect(couche(apres, 2).y - couche(avant, 2).y).toBe(COUCHE);
    expect(couche(apres, 1).echeances).toBe(0);
  });

  it("fait de la grande crue une couche épaisse, à sa place parmi les crues à venir", () => {
    const etat: EtatDette = { ...etatInitial(), crues: 300, echeances: [], grandeCrue: 312 };
    const { couches, present } = compteDesCrues(etat);
    const grande = couches.find((c) => c.grandeCrue)!;
    expect(grande).toMatchObject({ crue: 312, deposee: false, hauteur: 3 * COUCHE });
    expect(grande.y).toBe(present - 11 * COUCHE - 3 * COUCHE);
    // La plus haute des crues à venir touche le haut de la bande.
    expect(Math.min(...couches.map((c) => c.y))).toBe(0);
  });

  it("s'arrête à l'issue : la dernière couche déposée est celle de l'issue, même si le temps passe", () => {
    const etat: EtatDette = {
      ...etatInitial(),
      crues: 60,
      issue: "defaut",
      issueA: 40 * CRUE,
    };
    expect(cruePresente(etat)).toBe(40);
    const { issue, present } = compteDesCrues(etat);
    expect(issue).toMatchObject({ crue: 40, deposee: true, y: present });
    // Soldée à la grande crue : la couche de l'issue est la grande crue, épaisse et déposée.
    const soldee: EtatDette = {
      ...etatInitial(),
      crues: 330,
      grandeCrue: 314,
      issue: "soldee",
      issueA: 314 * CRUE,
    };
    expect(compteDesCrues(soldee).issue).toMatchObject({
      crue: 314,
      grandeCrue: true,
      hauteur: 3 * COUCHE,
    });
  });
});

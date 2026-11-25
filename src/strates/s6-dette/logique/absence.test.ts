// L'absence dans la dette (docs/strates/strate-6.md, § 10) : les échéances tombent à leur crue, à 100 %
// et sans plafond ; le rapport compte à 80 %, douze heures au plus, sauf entre la dernière promesse et
// la grande crue, où l'absence compte en entier. Le retour dit ce qui est tombé.
import { describe, expect, it } from "vitest";
import type { ContexteTick } from "../../../noyau/logique/types";
import { logique, type Echeance, type EtatDette } from ".";
import {
  CRUE,
  EXEMPLAIRES,
  montantDu,
  PLAFOND_ABSENCE,
  prixExemplaire,
  rapport,
  sortesDe,
  TAUX_ABSENCE,
  toutDu,
} from "./regles";

const CTX: ContexteTick = {
  effets: { multiplicateur: () => 1, niveau: () => null },
  emettre: () => {},
};
const HEURE = 3600;
const JOUR = 24 * HEURE;

const neuf = () => logique.etatInitial({ graine: 1, journal: { strates: [] } });
const absence = (etat: EtatDette, duree: number) => logique.absence!(etat, duree, CTX).lignes;

function echeance(numero: number, crue: number, du: number): Echeance {
  return { numero, promesse: "orge", crue, du, origine: du, prix: du, reports: 0 };
}

/** La dernière promesse faite, la grande crue fixée douze crues plus tard, et la caisse à `caisse`. */
function grandeCrueFixee(caisse: number): EtatDette {
  const etat = neuf();
  for (let k = 1; k <= 5; k++) for (const id of sortesDe(k)) etat.promises[id] = EXEMPLAIRES;
  etat.tablette = 5;
  etat.brisees = 4;
  etat.echeances = sortesDe(5).flatMap((id, s) =>
    Array.from({ length: EXEMPLAIRES }, (_, i) => {
      const prix = prixExemplaire(id, i);
      const du = montantDu(prix, null);
      return {
        numero: 97 + s * EXEMPLAIRES + i,
        promesse: id,
        crue: 12,
        du,
        origine: du,
        prix,
        reports: 0,
      };
    }),
  );
  etat.grandeCrue = 12;
  etat.caisse = caisse;
  return etat;
}

describe("l'absence dans la dette", () => {
  it("fait tomber les échéances à leur crue, avec le rapport à 80 %", () => {
    const etat = neuf();
    expect(absence(etat, 2 * CRUE)).toEqual(["2 échéances honorées."]);
    expect(etat.crues).toBe(2);
    expect(etat.temps).toBe(2 * CRUE);
    expect(etat.caisse).toBeCloseTo(30 + TAUX_ABSENCE * 12 - 28, 9);
  });

  it("compte le rapport douze heures au plus, et la crue continue d'avancer", () => {
    const etat = neuf();
    etat.echeances = [];
    absence(etat, 2 * JOUR);
    expect(etat.caisse).toBeCloseTo(30 + (TAUX_ABSENCE * 6 * PLAFOND_ABSENCE) / CRUE, 6);
    expect(etat.crues).toBe((2 * JOUR) / CRUE);
  });

  it("reporte ce que la caisse ne couvre pas, comme en jeu, et le retour le compte", () => {
    const etat = neuf();
    etat.honore = 1_000;
    etat.caisse = 0;
    etat.echeances = [echeance(1, 1, 3), echeance(2, 2, 100)];
    expect(absence(etat, 3 * CRUE)).toEqual(["1 échéance honorée, 1 reportée."]);
    expect(etat.echeances[0]).toMatchObject({ numero: 2, crue: 4, reports: 1 });
    expect(etat.reportees).toBe(1);
  });

  it("dit les reports seuls, et ne dit rien quand rien n'est tombé", () => {
    const etat = neuf();
    etat.honore = 1_000;
    etat.caisse = 0;
    etat.echeances = [echeance(1, 1, 50), echeance(2, 1, 60)];
    expect(absence(etat, CRUE)).toEqual(["2 échéances reportées."]);
    expect(absence(etat, 10)).toEqual([]);
  });

  it("fait tomber en défaut pendant l'absence, et la fin s'écrit au retour", () => {
    const etat = neuf();
    etat.caisse = 0;
    etat.echeances = [echeance(1, 1, 100), echeance(2, 4, 10)];
    expect(absence(etat, JOUR)).toEqual(["Échu. Le reste demeure dû."]);
    expect(etat.issue).toBe("defaut");
    expect(etat.issueA).toBe(CRUE);
    // En défaut, plus rien ne bouge : l'échéance suivante ne tombe pas, la caisse ne reçoit plus rien.
    expect(etat.echeances.map((e) => e.numero)).toEqual([1, 2]);
    expect(etat.caisse).toBe(0);
    expect(etat.temps).toBe(JOUR);
  });

  it("compte en entier jusqu'à la grande crue : une grande crue tout juste couverte le reste", () => {
    const juste = (etat: EtatDette) => toutDu(etat) - 12 * rapport(etat) + 1e6;
    // Tout juste couverte à 100 %, elle ne l'est pas à 80 %.
    const reference = grandeCrueFixee(0);
    const caisse = juste(reference);
    expect(caisse + TAUX_ABSENCE * 12 * rapport(reference)).toBeLessThan(toutDu(reference));

    const etat = grandeCrueFixee(caisse);
    expect(absence(etat, HEURE)).toEqual(["24 échéances honorées.", "Honoré. Plus rien n'est dû."]);
    expect(etat.issue).toBe("soldee");
    expect(etat.issueA).toBe(12 * CRUE);
    // Après la grande crue, la règle commune : le reste de l'heure, à 80 %.
    const apres = etat.caisse - (caisse + 12 * rapport(etat) - toutDu(reference));
    expect(apres / rapport(etat)).toBeCloseTo((TAUX_ABSENCE * (HEURE - 12 * CRUE)) / CRUE, 6);
  });

  it("garde à 80 % le rapport tant que la grande crue n'est pas fixée", () => {
    const etat = grandeCrueFixee(0);
    etat.grandeCrue = null;
    for (const e of etat.echeances) e.crue = null;
    const r = rapport(etat);
    absence(etat, 10 * CRUE);
    expect(etat.caisse / r).toBeCloseTo(TAUX_ABSENCE * 10, 9);
  });

  it("calcule deux semaines d'un coup : la caisse croît en ligne droite entre deux échéances", () => {
    const etat = neuf();
    etat.caisse = 1e9;
    etat.echeances = Array.from({ length: 40 }, (_, i) => echeance(i + 1, 3 * (i + 1), 1e6));
    expect(absence(etat, 14 * JOUR)).toEqual(["40 échéances honorées."]);
    expect(etat.crues).toBe((14 * JOUR) / CRUE);
    expect(etat.caisse).toBeCloseTo(1e9 - 40e6 + (TAUX_ABSENCE * 6 * PLAFOND_ABSENCE) / CRUE, 3);
    expect(etat.issue).toBeNull();
  });
});

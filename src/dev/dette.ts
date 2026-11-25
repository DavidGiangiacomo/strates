// La dette avant sa dernière promesse (#73), pour les tests et les outils de développement : les quatre
// premières tablettes promises, honorées et brisées, et la dernière toute promise sauf une, comme le
// joueur naturel après deux heures et demie (docs/strates/strate-6.md, § 4). La caisse ne couvre pas
// encore la grande crue : il faut attendre deux crues avant que la dernière promesse la couvre.
import { etatInitial, type EtatDette } from "../strates/s6-dette/logique/etat";
import {
  CRUE,
  EXEMPLAIRES,
  GRANDE_CRUE_DANS,
  montantDu,
  prixExemplaire,
  rapport,
  SORTES,
  sortesDe,
  TABLETTES,
  toutDu,
} from "../strates/s6-dette/logique/regles";

/** La crue où la dette s'arrête, comme le joueur naturel à l'ouverture de sa dernière tablette. */
export const CRUE_DERNIERE_TABLETTE = 302;

export function detteDernierePromesse(): EtatDette {
  const etat = etatInitial();
  etat.echeances = [];
  // Les quatre premières tablettes, toutes honorées : la confiance et la valeur en ont gardé le prix.
  for (let k = 1; k < TABLETTES; k++) {
    for (const id of sortesDe(k)) {
      for (let n = 0; n < EXEMPLAIRES; n++) {
        const prix = prixExemplaire(id, n);
        etat.valeur += prix;
        etat.honore += montantDu(prix, 6);
      }
      etat.promises[id] = EXEMPLAIRES;
    }
  }
  etat.brisees = TABLETTES - 1;
  etat.tablette = TABLETTES;
  // La dernière tablette, toute promise sauf la dernière des toutes les crues.
  let numero = 97;
  for (const id of sortesDe(TABLETTES)) {
    const n = id === "toutesLesCrues" ? EXEMPLAIRES - 1 : EXEMPLAIRES;
    for (let i = 0; i < n; i++) {
      const prix = prixExemplaire(id, i);
      const du = montantDu(prix, null);
      etat.echeances.push({ numero, promesse: id, crue: null, du, origine: du, prix, reports: 0 });
      numero++;
    }
    etat.promises[id] = n;
  }
  etat.crues = CRUE_DERNIERE_TABLETTE;
  etat.temps = CRUE_DERNIERE_TABLETTE * CRUE + 1;
  // Ce qu'il faudra à la grande crue, la dernière promesse comprise : la caisse l'atteint en deux crues.
  const derniere = SORTES.toutesLesCrues;
  const du = montantDu(prixExemplaire("toutesLesCrues", EXEMPLAIRES - 1), null);
  const parCrue = rapport(etat) + derniere.rapport;
  etat.caisse = toutDu(etat) + du - (GRANDE_CRUE_DANS + 2) * parCrue;
  etat.livre.push(
    { cle: "livre.brisee", valeurs: { tablette: TABLETTES - 1 } },
    { cle: "livre.derniere", valeurs: {} },
  );
  etat.ecrites += 2;
  return etat;
}

// Le réseau avant sa dernière source (#69), pour les tests et les outils de développement : les cinq
// premières sources reliées et à plein, et le réseau qui les porte, comme le joueur naturel à 1 h 53
// (docs/strates/strate-4.md, § 4). La provision suffit à relier la source 6 : restent la citerne, la
// grande conduite et les cinq minutes du seuil.
import { etatInitial, type Conduite, type EtatReseau } from "../strates/s4-reseau/logique/etat";
import { capacite, MONTEE } from "../strates/s4-reseau/logique/regles";

/** L'instant où le joueur naturel relie la source 6, en secondes. */
export const AVANT_LA_DERNIERE_SOURCE = 6780;

/** Les conduites du joueur naturel avant la source 6 : calibre, et vanne si elle n'est pas ouverte. */
const RESEAU: readonly Conduite[] = [
  { trace: 1, calibre: 1, vanne: 1 },
  { trace: 2, calibre: 5, vanne: 1 },
  { trace: 3, calibre: 4, vanne: 1 },
  { trace: 4, calibre: 7, vanne: 1 },
  { trace: 5, calibre: 5, vanne: 0.75 },
  { trace: 6, calibre: 9, vanne: 1 },
  { trace: 7, calibre: 9, vanne: 1 },
  { trace: 8, calibre: 9, vanne: 0.75 },
  { trace: 9, calibre: 12, vanne: 1 },
  { trace: 10, calibre: 12, vanne: 1 },
];

export function reseauAvantLaDerniereSource(): EtatReseau {
  const etat = etatInitial();
  etat.temps = AVANT_LA_DERNIERE_SOURCE;
  etat.conduites = RESEAU.map((c) => ({ ...c }));
  // Reliées comme le joueur naturel : toutes à plein depuis au moins quatre minutes.
  etat.reliees = { 1: -MONTEE, 2: 15, 3: 1515, 4: 3310, 5: 5050 };
  etat.aPlein = [1, 2, 3, 4, 5];
  etat.debits = Object.fromEntries(etat.conduites.map((c) => [c.trace, capacite(c.calibre)]));
  etat.recoit = 256_640_000_000;
  etat.recu = 2.6e13;
  // De quoi relier la source 6, au calibre 12 : 240 milliards de muids, et un peu plus.
  etat.caisse = 3e11;
  etat.ecrites = 1;
  etat.carnet = [{ cle: "carnet.aucun", valeurs: {} }];
  etat.sansGoulotDepuis = AVANT_LA_DERNIERE_SOURCE - 60;
  return etat;
}

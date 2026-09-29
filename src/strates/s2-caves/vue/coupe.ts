// La coupe des stockages (fiche, § 6) : une coupe du sol de la vallée, qui sert de jauge. Les greniers
// sont au-dessus du sol ; les silos, les caves et les caves profondes, dessous. Le grain remplit
// d'abord le stockage le plus profond : il monte dans la coupe comme dans une jauge. Chaque couche
// construite a la même hauteur, quelle que soit sa capacité : la jauge est linéaire couche par couche.
import type { EtatCaves } from "../logique";
import { capaciteStockage, repartition, STOCKAGES, type IdStockage } from "../logique/regles";

export interface Couche {
  id: IdStockage;
  /** Les stockages construits de ce type. */
  nombre: number;
  /** La capacité de toute la couche, en boisseaux. */
  capacite: number;
  /** Le grain qu'elle contient. */
  grain: number;
}

/**
 * Les couches construites, du fond jusqu'aux greniers. Construire un stockage d'un type nouveau
 * ajoute sa couche : plus on construit, plus on creuse.
 */
export function couches(etat: EtatCaves): Couche[] {
  const grain = repartition(etat);
  return [...STOCKAGES]
    .reverse()
    .filter((s) => etat.stockages[s.id] > 0)
    .map((s) => ({
      id: s.id,
      nombre: etat.stockages[s.id],
      capacite: capaciteStockage(etat, s),
      grain: grain[s.id],
    }));
}

/** Au-delà de la capacité, une quantité monte au-dessus de la dernière couche : d'une couche au plus. */
export const DEBORD = 1;

/**
 * La hauteur d'une quantité de grain dans la coupe, en couches depuis le fond : 1,5 veut dire la
 * première couche pleine et la deuxième à moitié. Au-delà de la capacité, elle continue au-dessus de
 * la dernière couche, à l'échelle de celle-ci, jusqu'à `DEBORD` couche : la marque d'hiver « flotte
 * au-dessus du grenier » (docs/strates/descente-1-2.md, P6).
 */
export function niveau(liste: readonly Couche[], quantite: number): number {
  if (liste.length === 0) return 0;
  let reste = Math.max(0, quantite);
  for (let i = 0; i < liste.length - 1; i++) {
    const c = liste[i]!.capacite;
    if (reste <= c) return i + (c > 0 ? reste / c : 0);
    reste -= c;
  }
  const derniere = liste.at(-1)!.capacite;
  return liste.length - 1 + (derniere > 0 ? Math.min(1 + DEBORD, reste / derniere) : 0);
}

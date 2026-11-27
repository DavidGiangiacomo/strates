// La notation du réseau (docs/strates/strate-4.md, § 1) : le pouce de fontainier, qui mesure un
// débit, et la ligne, un cent quarante-quatrième de pouce ; le muid, qui mesure un volume. Tous les
// nombres sont entiers et s'écrivent en entier, sans suffixe ni puissance de dix, les milliers séparés
// d'un point : « 150.000.000.000.000 pouces ». Sous dix pouces, un débit s'écrit aussi en lignes :
// « 3 pouces 130 lignes ». Aucune autre strate ne compte en pouces ni en muids, ni ne sépare ses
// milliers d'un point (I1). Pour les lecteurs d'écran, un nombre se dit sans séparateur.
import { LIGNES } from "./regles";

/**
 * La partie entière d'un nombre, qu'un écart de calcul ne fait pas tomber d'une unité : 3 999,999 999
 * se lit 4 000, mais 4 000,9 se lit 4 000.
 */
export function entier(x: number): number {
  if (!(x > 0)) return 0;
  const proche = Math.round(x);
  return Math.abs(x - proche) <= 1e-6 * Math.max(1, x) ? proche : Math.floor(x);
}

/** Un entier, les milliers séparés d'un point : « 1.600.000 ». */
export function enEntier(x: number): string {
  // Au-delà de 2⁵³, les chiffres de JavaScript ne sont plus exacts : on écrit ceux qu'il donne.
  const chiffres = BigInt(entier(x)).toString();
  const groupes: string[] = [];
  for (let fin = chiffres.length; fin > 0; fin -= 3) {
    groupes.unshift(chiffres.slice(Math.max(0, fin - 3), fin));
  }
  return groupes.join(".");
}

/** Un débit : « 4.000 pouces », « 1 pouce », sous dix pouces avec ses lignes, « 3 pouces 130 lignes ». */
export function formaterPouces(debit: number): string {
  const enLignes = debit < 10 ? entier(debit * LIGNES) : 0;
  const pouces = debit < 10 ? Math.floor(enLignes / LIGNES) : entier(debit);
  const lignes = enLignes % LIGNES;
  const unite = (n: number, un: string, plusieurs: string) => (n === 1 ? un : plusieurs);
  if (pouces === 0 && lignes > 0) return `${lignes} ${unite(lignes, "ligne", "lignes")}`;
  const p = `${enEntier(pouces)} ${unite(pouces, "pouce", "pouces")}`;
  return lignes > 0 ? `${p} ${lignes} ${unite(lignes, "ligne", "lignes")}` : p;
}

/** Un volume : « 2.050.000.000.000.000 muids », « 1 muid ». */
export function formaterMuids(volume: number): string {
  const n = entier(volume);
  return `${enEntier(n)} ${n === 1 ? "muid" : "muids"}`;
}

/**
 * Un nombre pour les lecteurs d'écran : sans séparateur, qu'ils lisent comme un nombre. Le point des
 * milliers se lirait comme une décimale.
 */
export function pourLecteur(texte: string): string {
  return texte.replace(/(\d)\.(?=\d{3})/g, "$1");
}

/** Remplit un modèle : « Conduite {conduite} : posée. » */
export function remplir(modele: string, valeurs: Record<string, string>): string {
  return modele.replace(/\{(\w+)\}/g, (tout, nom: string) => valeurs[nom] ?? tout);
}

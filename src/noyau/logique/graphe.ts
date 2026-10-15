// Le graphe de dépendances et les formules réelles d'une strate (docs/comprehension.md, § 5) : ce que
// le noyau en vérifie, pour que les affichages de la Compréhension puissent s'y fier.
import type { Formule, GrapheDependances } from "./types";

/**
 * Les défauts d'un graphe et de ses formules, rédigés : un nœud en double, un lien vers un nœud qui
 * n'existe pas, une formule attachée à un nœud absent. Vide si tout va bien.
 */
export function problemesGraphe(
  graphe: GrapheDependances,
  formules: readonly Formule[] = [],
): string[] {
  const problemes: string[] = [];
  const ids = new Set<string>();
  for (const { id } of graphe.noeuds) {
    if (ids.has(id)) problemes.push(`nœud en double : ${id}`);
    ids.add(id);
  }
  for (const { de, vers } of graphe.liens) {
    const absent = [de, vers].find((id) => !ids.has(id));
    if (absent !== undefined) problemes.push(`lien vers un nœud absent : ${absent}`);
    if (de === vers) problemes.push(`nœud lié à lui-même : ${de}`);
  }
  for (const { noeud } of formules) {
    if (!ids.has(noeud)) problemes.push(`formule attachée à un nœud absent : ${noeud}`);
  }
  return problemes;
}

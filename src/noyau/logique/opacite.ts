// La couche d'opacité, écrite une fois pour les huit strates (§15) : ce qui est encore opaque, et ce
// qu'on montre à sa place (docs/comprehension.md, § 4). Elle ne dépend ni de Svelte ni du navigateur.
import { delaiLevee } from "./comprehension";
import type { EffetsActifs, ElementOpaque } from "./types";

/** Ce qu'il faut savoir de la partie pour lever l'opacité d'une strate. */
export interface ContexteOpacite {
  /** Les éléments que la strate a levés à l'usage, notés au journal de partie. */
  leves: readonly string[];
  /** La Compréhension : elle règle le délai de levée. */
  kappa: number;
  /** Le temps passé dans la strate, en secondes, absences comptées selon sa politique hors ligne. */
  tempsStrate: number;
  /** Les effets des objets dans la strate : un objet qui agit lève les éléments qu'il connaît. */
  effets: Pick<EffetsActifs, "niveau">;
}

/** Un élément est-il levé : par l'usage, par un objet qui agit ici, ou par le délai ? */
export function estLeve(element: ElementOpaque, ctx: ContexteOpacite): boolean {
  if (ctx.leves.includes(element.id)) return true;
  if (element.objets?.some((id) => ctx.effets.niveau(id) !== null)) return true;
  const part = element.delai === undefined ? 1 : element.delai;
  return part !== null && ctx.tempsStrate >= part * delaiLevee(ctx.kappa);
}

/** Les identifiants des éléments encore opaques. */
export function elementsOpaques(
  elements: readonly ElementOpaque[],
  ctx: ContexteOpacite,
): Set<string> {
  const opaques = new Set<string>();
  for (const element of elements) {
    if (!estLeve(element, ctx)) opaques.add(element.id);
  }
  return opaques;
}

/** Pour chaque clé de texte, l'élément qui la couvre : `o(cle)` le consulte. */
export function elementsParCle(elements: readonly ElementOpaque[]): ReadonlyMap<string, string> {
  const parCle = new Map<string, string>();
  for (const element of elements) {
    for (const cle of element.cles ?? []) parCle.set(cle, element.id);
  }
  return parCle;
}

/** Les glyphes du noyau : des formes simples, que toutes les polices savent dessiner. */
export const GLYPHES = "◇◆○●△▽□■◁▷";

/**
 * Ce qu'on montre à la place d'un texte opaque : un glyphe par mot, tiré de la clé, toujours le même
 * pour la même clé. Les nombres et les modèles (« {n} ») deviennent des glyphes comme le reste : une
 * valeur écrite par un texte opaque est masquée avec lui.
 */
export function glyphes(cle: string, texte: string, alphabet: string = GLYPHES): string {
  const signes = [...alphabet];
  const mots = texte.split(/\s+/).filter((m) => m.length > 0);
  let h = hacher(cle);
  const resultat: string[] = [];
  for (let i = 0; i < Math.max(1, mots.length); i++) {
    resultat.push(signes[h % signes.length]!);
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  }
  return resultat.join(" ");
}

/** FNV-1a sur 32 bits : un entier stable pour une clé. */
function hacher(texte: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

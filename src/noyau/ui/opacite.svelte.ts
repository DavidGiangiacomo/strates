// La couche d'opacité côté interface (#66 ; docs/comprehension.md, § 4) : ce que la vue d'une strate
// lit à travers elle, `o(cle)` et `lisible(element)`. Elle relit le noyau à chaque image, et ne réveille
// la vue que lorsqu'un élément se lève.
import type { Noyau } from "../logique/noyau";
import { elementsParCle, glyphes } from "../logique/opacite";
import type { StrateQuelconque } from "../logique/registre";

export class CoucheOpacite {
  /** Les éléments encore opaques. Remplacés seulement quand ils changent : la vue n'est pas réveillée pour rien. */
  #opaques: ReadonlySet<string>;
  readonly #noyau: Pick<Noyau, "elementsOpaques" | "strate">;
  readonly #strate: StrateQuelconque;
  /** Pour chaque clé de texte, l'élément qui la couvre. */
  readonly #elementDe: ReadonlyMap<string, string>;

  /** La couche de la strate courante du noyau : elle se recrée à chaque strate montée. */
  constructor(noyau: Pick<Noyau, "elementsOpaques" | "strate">) {
    this.#opaques = $state.raw(noyau.elementsOpaques());
    this.#noyau = noyau;
    this.#strate = noyau.strate;
    this.#elementDe = elementsParCle(noyau.strate.logique.opacite ?? []);
  }

  /**
   * Relit les éléments opaques, à chaque image. Pendant une descente, le noyau est déjà dans la
   * strate suivante alors que la vue de la strate quittée est encore là : elle reste telle quelle.
   */
  actualiser(): void {
    if (this.#noyau.strate !== this.#strate) return;
    const opaques = this.#noyau.elementsOpaques();
    if (!memes(opaques, this.#opaques)) this.#opaques = opaques;
  }

  /** Le texte d'une clé : des glyphes, tant que l'élément qui la couvre est opaque. */
  readonly o = (cle: string): string => {
    const texte = this.#strate.textes[cle] ?? cle;
    const element = this.#elementDe.get(cle);
    if (element === undefined || !this.#opaques.has(element)) return texte;
    return glyphes(cle, texte, this.#strate.glyphes);
  };

  /** Un élément est-il levé ? Un élément que la strate ne déclare pas l'est. */
  readonly lisible = (element: string): boolean => !this.#opaques.has(element);
}

function memes(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

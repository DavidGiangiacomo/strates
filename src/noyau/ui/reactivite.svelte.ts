import type { Noyau } from "../logique/noyau";

/**
 * Enveloppe un objet dans un état réactif Svelte. Attention : les écritures faites à travers
 * l'enveloppe ne remontent pas dans l'objet d'origine, c'est l'enveloppe qu'il faut utiliser.
 */
export function reactif<T extends object>(objet: T): T {
  const enveloppe = $state(objet);
  return enveloppe;
}

/**
 * Rend réactif l'état de la strate courante, et le rend au noyau : la logique continue de le
 * modifier sans rien savoir de Svelte, et la vue se met à jour (docs/architecture.md § 5).
 * Renvoie l'état réactif, à passer à la vue.
 */
export function rendreStrateReactive(noyau: Noyau): object {
  const etat = noyau.etatStrate;
  if (typeof etat !== "object" || etat === null) {
    throw new TypeError("L'état d'une strate doit être un objet.");
  }
  const enveloppe = reactif(etat);
  noyau.remplacerEtatStrate(enveloppe);
  return enveloppe;
}

import type { ActionBase, DefinitionStrate, NumeroStrate } from "./types";

/** Une strate vue du noyau : son état et ses actions lui sont opaques. */
export type StrateQuelconque = DefinitionStrate<unknown, ActionBase>;

/** Charge une strate à la demande ; en pratique, un `import()` dynamique. */
export type ChargeurStrate = () => Promise<StrateQuelconque>;

/** Associe chaque profondeur à la strate qui l'occupe. */
export class Registre {
  #chargeurs = new Map<NumeroStrate, ChargeurStrate>();
  #charges = new Map<NumeroStrate, Promise<StrateQuelconque>>();

  enregistrer(numero: NumeroStrate, chargeur: ChargeurStrate): void {
    if (this.#chargeurs.has(numero)) {
      throw new Error(`La strate ${numero} est déjà enregistrée.`);
    }
    this.#chargeurs.set(numero, chargeur);
  }

  /** Charge la strate une seule fois, et vérifie qu'elle occupe bien ce numéro. */
  charger(numero: NumeroStrate): Promise<StrateQuelconque> {
    const dejaCharge = this.#charges.get(numero);
    if (dejaCharge) return dejaCharge;

    const chargeur = this.#chargeurs.get(numero);
    if (!chargeur) {
      return Promise.reject(
        new Error(`Aucune strate n'est enregistrée à la profondeur ${numero}.`),
      );
    }

    const charge = chargeur()
      .then((strate) => {
        if (strate.logique.numero !== numero) {
          throw new Error(
            `La strate chargée à la profondeur ${numero} se déclare strate ${strate.logique.numero}.`,
          );
        }
        return strate;
      })
      .catch((erreur: unknown) => {
        // Un chargement raté ne reste pas en cache : on pourra le retenter.
        this.#charges.delete(numero);
        throw erreur;
      });
    this.#charges.set(numero, charge);
    return charge;
  }
}

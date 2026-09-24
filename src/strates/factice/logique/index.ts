// Strate factice : un incrémental minimal pour tester le noyau sans dépendre des vraies strates.
// Elle occupe la profondeur 1 en attendant la surface (#24).
import { creerAlea, tirerEntier, type EtatAlea } from "../../../noyau/logique/alea";
import type { LogiqueStrate, NumeroStrate } from "../../../noyau/logique/types";

export interface EtatFactice {
  unites: number;
  /** Tout ce qui a été produit dans la strate : la valeur convertible (D-003). */
  cumul: number;
  generateurs: number;
  alea: EtatAlea;
}

export type ActionFactice = { type: "produire" } | { type: "acheter" } | { type: "hasard" };

export const SEUIL_FACTICE = 1000;

export function coutGenerateur(generateurs: number): number {
  return 10 * 2 ** generateurs;
}

export function seuilAtteint(etat: EtatFactice): boolean {
  return etat.cumul >= SEUIL_FACTICE;
}

function gagner(etat: EtatFactice, quantite: number): void {
  etat.unites += quantite;
  etat.cumul += quantite;
}

export function creerLogiqueFactice(
  numero: NumeroStrate,
): LogiqueStrate<EtatFactice, ActionFactice> {
  return {
    numero,
    versionEtat: 1,
    migrations: {},
    pasMax: 1,
    leviers: { principal: "production" },
    horsLigne: { type: "standard" },

    etatInitial: ({ graine }) => ({ unites: 0, cumul: 0, generateurs: 0, alea: creerAlea(graine) }),

    tick(etat, dt, ctx) {
      gagner(etat, etat.generateurs * dt * ctx.effets.multiplicateur("production"));
    },

    agir(etat, action, ctx) {
      switch (action.type) {
        case "produire":
          gagner(etat, 1);
          break;
        case "acheter": {
          const cout = coutGenerateur(etat.generateurs);
          if (etat.unites < cout) return;
          etat.unites -= cout;
          etat.generateurs += 1;
          if (etat.generateurs === 1) ctx.emettre({ type: "acte", acte: "premier-achat" });
          break;
        }
        case "hasard":
          gagner(etat, tirerEntier(etat.alea, 1, 6));
          break;
      }
    },

    seuil: (etat) => ({ atteint: seuilAtteint(etat) }),
    valeurConvertible: (etat) => etat.cumul,
  };
}

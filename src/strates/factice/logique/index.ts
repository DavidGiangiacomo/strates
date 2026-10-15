// Strate factice : un incrémental minimal pour tester le noyau sans dépendre des vraies strates.
// Elle occupe la profondeur 1 en attendant la surface (#24).
import { creerAlea, tirerEntier, type EtatAlea } from "../../../noyau/logique/alea";
import type { ContexteTick, LogiqueStrate, NumeroStrate } from "../../../noyau/logique/types";

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

function gagner(etat: EtatFactice, quantite: number, ctx: ContexteTick): void {
  const avant = seuilAtteint(etat);
  etat.unites += quantite;
  etat.cumul += quantite;
  // L'annonce du seuil se comprend quand il est atteint : c'est là qu'elle se lève.
  if (!avant && seuilAtteint(etat)) ctx.emettre({ type: "levee", element: "seuil" });
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
      gagner(etat, etat.generateurs * dt * ctx.effets.multiplicateur("production"), ctx);
    },

    agir(etat, action, ctx) {
      switch (action.type) {
        case "produire":
          gagner(etat, 1, ctx);
          break;
        case "acheter": {
          const cout = coutGenerateur(etat.generateurs);
          if (etat.unites < cout) return;
          etat.unites -= cout;
          etat.generateurs += 1;
          if (etat.generateurs === 1) {
            ctx.emettre({ type: "acte", acte: "premier-achat" });
            ctx.emettre({ type: "levee", element: "unites" });
          }
          break;
        }
        case "hasard":
          gagner(etat, tirerEntier(etat.alea, 1, 6), ctx);
          break;
      }
    },

    seuil: (etat) => ({ atteint: seuilAtteint(etat) }),
    valeurConvertible: (etat) => etat.cumul,

    // Un élément de chaque sorte, pour la couche d'opacité du noyau (#66 ; docs/comprehension.md, § 4).
    opacite: [
      // Les noms des unités et des générateurs : levés au premier générateur acheté, sinon au délai.
      { id: "unites", cles: ["unites", "generateurs"] },
      // Le rôle de « Tenter sa chance » : seulement par le délai, à sa moitié.
      { id: "hasard", cles: ["hasard"], delai: 0.5 },
      // Le compteur du seuil : par une turbine de la surface, sinon au bout du délai.
      { id: "cumul", cles: ["cumul"], objets: ["s1-turbine"] },
      // L'annonce du seuil : jamais par le délai, seulement quand il est atteint.
      { id: "seuil", cles: ["seuil"], delai: null },
    ],
  };
}

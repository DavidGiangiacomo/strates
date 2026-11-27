import { Registre } from "../noyau/logique/registre";

/** Les strates du jeu, chargées à la demande. */
export function creerRegistre(): Registre {
  const registre = new Registre();
  registre.enregistrer(1, () => import("./s1-surface").then((m) => m.strate));
  registre.enregistrer(2, () => import("./s2-caves").then((m) => m.strate));
  // La dette et le lit sont publiés pour leurs recettes (#113, #120) : sans les strates 3 à 5, on n'y
  // arrive que par un lien de départ (src/playtest/depart.ts), et les caves n'y mènent pas. La dette
  // soldée ou en défaut descend dans le lit.
  registre.enregistrer(6, () => import("./s6-dette").then((m) => m.strate));
  registre.enregistrer(7, () => import("./s7-lit").then((m) => m.strate));
  // L'atelier et le réseau, en chantier : en développement seulement, tant que les recettes se jouent
  // sur la version publiée (docs/playtest-mvp.md, § 3 ; docs/strates/strate-6-recette.md, § 3). Les
  // outils de développement permettent d'y sauter.
  if (import.meta.env.DEV) {
    registre.enregistrer(3, () => import("./s3-atelier").then((m) => m.strate));
    registre.enregistrer(4, () => import("./s4-reseau").then((m) => m.strate));
  }
  return registre;
}

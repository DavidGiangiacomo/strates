import { Registre } from "../noyau/logique/registre";

/** Les strates du jeu, chargées à la demande. */
export function creerRegistre(): Registre {
  const registre = new Registre();
  registre.enregistrer(1, () => import("./s1-surface").then((m) => m.strate));
  registre.enregistrer(2, () => import("./s2-caves").then((m) => m.strate));
  // L'atelier, en chantier : en développement seulement, tant que le test du MVP se joue sur la
  // version publiée (docs/playtest-mvp.md, § 3). Les outils de développement permettent d'y sauter.
  if (import.meta.env.DEV) {
    registre.enregistrer(3, () => import("./s3-atelier").then((m) => m.strate));
  }
  return registre;
}

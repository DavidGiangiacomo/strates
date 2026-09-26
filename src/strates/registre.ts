import { Registre } from "../noyau/logique/registre";

/** Les strates du jeu, chargées à la demande. */
export function creerRegistre(): Registre {
  const registre = new Registre();
  registre.enregistrer(1, () => import("./s1-surface").then((m) => m.strate));
  return registre;
}

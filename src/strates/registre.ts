import { Registre } from "../noyau/logique/registre";

/** Les strates du jeu, chargées à la demande. */
export function creerRegistre(): Registre {
  const registre = new Registre();
  // En attendant la surface (#24), la strate factice occupe la profondeur 1.
  registre.enregistrer(1, () => import("./factice").then((m) => m.creerStrateFactice(1)));
  return registre;
}

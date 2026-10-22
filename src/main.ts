import { mount } from "svelte";
import {
  appliquerTailleTexte,
  lireTailleTexte,
  zoneNavigateur,
} from "./noyau/plateforme/affichage";
import App from "./noyau/ui/App.svelte";

// La taille du texte (#48) s'applique avant le premier rendu : la page ne saute pas au chargement.
appliquerTailleTexte(document.documentElement, lireTailleTexte(zoneNavigateur()));

const cible = document.getElementById("app");
if (!cible) throw new Error("Élément #app introuvable");

export default mount(App, { target: cible });

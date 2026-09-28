// La table des artefacts (§12, D-002) : une donnée du noyau, pas du code des strates. Le détail des
// objets, leurs effets et leur calibrage sont dans docs/artefacts.md, § 8. Les noms sont provisoires
// jusqu'à la bible narrative (#43) ; le reste du catalogue viendra avec #57.
import type { ArtefactDef } from "./artefacts";

export const CATALOGUE: readonly ArtefactDef[] = [
  // ——— Strate 1, la surface : six objets, 17 points. Puissants dans les caves, utiles dans l'atelier.
  {
    id: "s1-equipe",
    origine: 1,
    nomDHaut: "L'équipe",
    nomDEnBas: "les bras en plus",
    cout: 1,
    famille: "multiplicateur",
    effet: {
      puissant: { levier: "principal", facteur: 1.2 },
      utile: { levier: "principal", facteur: 1.1 },
    },
  },
  {
    id: "s1-double-ecran",
    origine: 1,
    nomDHaut: "Double écran",
    nomDEnBas: "les deux fenêtres",
    cout: 2,
    famille: "raccourci",
    effet: {
      puissant: {
        description:
          "Dès l'arrivée, la marque d'hiver porte son nom et les pertes des stockages sont affichées.",
      },
      utile: { description: "Une part plus petite de l'opacité de l'atelier, levée à l'arrivée." },
    },
  },
  {
    id: "s1-serveur",
    origine: 1,
    nomDHaut: "Le serveur",
    nomDEnBas: "l'armoire qui compte les hivers",
    cout: 2,
    famille: "affichage",
    effet: {
      puissant: {
        description:
          "Dès l'arrivée, l'anneau du grand cycle dessine d'avance les années à venir, avec la longueur de leurs hivers.",
      },
      utile: { description: "Une grandeur future de l'atelier, dévoilée d'avance, moins loin." },
    },
  },
  {
    id: "s1-filiale",
    origine: 1,
    nomDHaut: "La filiale",
    nomDEnBas: "le grenier d'ailleurs",
    cout: 3,
    famille: "multiplicateur",
    effet: {
      puissant: { levier: "secondaire", facteur: 1.5 },
      utile: { levier: "secondaire", facteur: 1.25 },
    },
  },
  {
    id: "s1-turbine",
    origine: 1,
    nomDHaut: "La turbine",
    nomDEnBas: "la roue chaude",
    cout: 4,
    famille: "multiplicateur",
    effet: {
      puissant: { levier: "principal", facteur: 1.5 },
      utile: { levier: "principal", facteur: 1.25 },
    },
  },
  {
    id: "s1-plan",
    origine: 1,
    nomDHaut: "Plan stratégique",
    nomDEnBas: "la feuille qui annonce",
    cout: 5,
    famille: "unique",
    effet: {
      puissant: {
        description:
          "Au seuil des caves, le registre écrit une ligne de plus, d'une autre main : une ligne de l'atelier.",
      },
      utile: {
        description: "Au seuil de l'atelier, la moitié d'une ligne du réseau, coupée au milieu.",
      },
    },
  },
];

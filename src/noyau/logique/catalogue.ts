// La table des artefacts (§12, D-002) : une donnée du noyau, pas du code des strates. Les 34 objets,
// leurs effets et leur calibrage sont dans docs/artefacts.md, § 8. Un multiplicateur vise un levier ; les
// autres effets sont décrits ici et codés par la strate d'arrivée, qui reconnaît l'objet à son
// identifiant (#81, #84, #87, #90, #108 ; les effets uniques, #118). Dans le réseau, le lit et le fond,
// dont les fiches restent à écrire, les effets décrits sont des propositions.
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
      utile: { description: "Dès l'arrivée, les noms de la nomenclature sont levés." },
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
      utile: {
        description:
          "La nomenclature montre d'avance la pièce suivante, avec son profil et son prix.",
      },
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
        description:
          "Au seuil de l'atelier, la légende écrit d'une autre main une demi-ligne du réseau, coupée au milieu.",
      },
    },
  },

  // ——— Strate 2, les caves : cinq objets, 13 points. Puissants dans l'atelier, utiles dans le réseau.
  {
    id: "s2-faucille",
    origine: 2,
    nomDHaut: "La faucille",
    nomDEnBas: "la lame courbe",
    cout: 1,
    famille: "multiplicateur",
    effet: {
      puissant: { levier: "principal", facteur: 1.3 },
      utile: { levier: "principal", facteur: 1.15 },
    },
  },
  {
    id: "s2-calendrier",
    origine: 2,
    nomDHaut: "Le calendrier",
    nomDEnBas: "la roue peinte",
    cout: 2,
    famille: "affichage",
    effet: {
      puissant: {
        description:
          "La nomenclature montre d'avance les deux pièces suivantes, avec leur profil et leur prix.",
      },
      utile: {
        description: "Le débit d'une source se lit avant qu'on la relie. Jamais un goulot.",
      },
    },
  },
  {
    id: "s2-registre",
    origine: 2,
    nomDHaut: "Le registre",
    nomDEnBas: "le cahier à lignes",
    cout: 2,
    famille: "raccourci",
    effet: {
      puissant: {
        description: "Dès l'arrivée, les noms, les valeurs et le rôle de la lime sont levés.",
      },
      utile: { description: "Dès l'arrivée, les noms du réseau sont levés." },
    },
  },
  {
    id: "s2-meule",
    origine: 2,
    nomDHaut: "La meule",
    nomDEnBas: "la roue de pierre",
    cout: 3,
    famille: "multiplicateur",
    effet: {
      puissant: { levier: "principal", facteur: 1.5 },
      utile: { levier: "principal", facteur: 1.25 },
    },
  },
  {
    id: "s2-corde",
    origine: 2,
    nomDHaut: "La corde du puits",
    nomDEnBas: "le fil qui descend",
    cout: 5,
    famille: "unique",
    effet: {
      puissant: {
        description:
          "Au seuil de l'atelier, sous le plan plein, le tracé du réseau paraît un instant : des conduites, des bassins.",
      },
      utile: {
        description: "Au seuil du réseau, sous les bassins, la moitié d'un tracé : une voûte.",
      },
    },
  },

  // ——— Strate 3, l'atelier : cinq objets, 21 points. Puissants dans le réseau, utiles dans le chœur.
  {
    id: "s3-loupe",
    origine: 3,
    nomDHaut: "La loupe",
    nomDEnBas: "le regard qui grossit",
    cout: 3,
    famille: "raccourci",
    effet: {
      puissant: { description: "Dès l'arrivée, les noms et les rôles du réseau sont levés." },
      utile: {
        description:
          "Dès l'arrivée, les noms du chœur sont levés : les pupitres, le rang, l'écoute et le point d'orgue.",
      },
    },
  },
  {
    id: "s3-compte-tours",
    origine: 3,
    nomDHaut: "Le compte-tours",
    nomDEnBas: "la vanne qui compte",
    cout: 4,
    famille: "affichage",
    effet: {
      puissant: {
        description:
          "Le débit des sources et la contenance des bassins se lisent avant qu'on les relie. Jamais un goulot.",
      },
      utile: { description: "Le repère du double, posé d'avance sur chaque barre." },
    },
  },
  {
    id: "s3-etau",
    origine: 3,
    nomDHaut: "L'étau",
    nomDEnBas: "le collier qui serre",
    cout: 4,
    famille: "multiplicateur",
    effet: {
      puissant: { levier: "secondaire", facteur: 1.5 },
      utile: { levier: "secondaire", facteur: 1.25 },
    },
  },
  {
    id: "s3-volant",
    origine: 3,
    nomDHaut: "Le volant",
    nomDEnBas: "la roue qui retient",
    cout: 5,
    famille: "multiplicateur",
    effet: {
      puissant: { levier: "principal", facteur: 1.5 },
      utile: { levier: "principal", facteur: 1.25 },
    },
  },
  {
    id: "s3-boite-a-musique",
    origine: 3,
    nomDHaut: "La boîte à musique",
    nomDEnBas: "la conduite qui chante",
    cout: 5,
    famille: "unique",
    effet: {
      puissant: {
        description:
          "Au seuil du réseau, on entend une fois dans les conduites le bourdon du chœur.",
      },
      utile: { description: "Au seuil du chœur, on entend une fois un stylet sur l'argile." },
    },
  },

  // ——— Strate 4, le réseau : cinq objets, 26 points. Puissants dans le chœur, utiles dans la dette.
  {
    id: "s4-carnet",
    origine: 4,
    nomDHaut: "Le carnet de relevés",
    nomDEnBas: "le doigt qui montre",
    cout: 4,
    famille: "raccourci",
    effet: {
      puissant: { description: "Dès l'arrivée, les noms et les rôles du chœur sont levés." },
      utile: { description: "Dès l'arrivée, les noms des promesses sont levés." },
    },
  },
  {
    id: "s4-jauge",
    origine: 4,
    nomDHaut: "La jauge",
    nomDEnBas: "ce qui monte",
    cout: 5,
    famille: "affichage",
    effet: {
      puissant: {
        description:
          "Les repères du double et d'une fois et demie, posés d'avance sur chaque barre.",
      },
      utile: { description: "La caisse prévue à la prochaine échéance." },
    },
  },
  {
    id: "s4-vanne",
    origine: 4,
    nomDHaut: "La vanne maîtresse",
    nomDEnBas: "ce qui tient",
    cout: 5,
    famille: "multiplicateur",
    effet: {
      puissant: { levier: "secondaire", facteur: 1.5 },
      utile: { levier: "secondaire", facteur: 1.25 },
    },
  },
  {
    id: "s4-conduite",
    origine: 4,
    nomDHaut: "La grande conduite",
    nomDEnBas: "le grave qui dure",
    cout: 6,
    famille: "multiplicateur",
    effet: {
      puissant: { levier: "principal", facteur: 1.4 },
      utile: { levier: "principal", facteur: 1.2 },
    },
  },
  {
    id: "s4-compteur",
    origine: 4,
    nomDHaut: "Le compteur",
    nomDEnBas: "le battement sec",
    cout: 6,
    famille: "unique",
    effet: {
      puissant: {
        description:
          "Au seuil du chœur, un nombre s'inscrit une fois dans la nef, puis s'efface : les Voix venues, écrites en sceaux. C'est le seul nombre du chœur.",
      },
      utile: { description: "Au seuil de la dette, une couche de limon passe sur le livre." },
    },
  },

  // ——— Strate 5, le chœur : cinq objets, 17 points. Puissants dans la dette, utiles dans le lit.
  {
    id: "s5-souffle",
    origine: 5,
    nomDHaut: "Le souffle",
    nomDEnBas: "le gage qui souffle",
    cout: 2,
    famille: "raccourci",
    effet: {
      puissant: {
        description:
          "Dès l'arrivée, les noms des promesses et la valeur de la confiance sont levés.",
      },
      utile: { description: "Dès l'arrivée, les mots du lit sont levés : crue et limon." },
    },
  },
  {
    id: "s5-echo",
    origine: 5,
    nomDHaut: "L'écho",
    nomDEnBas: "le gage qui revient",
    cout: 3,
    famille: "affichage",
    effet: {
      puissant: { description: "La caisse prévue à chacune des prochaines échéances." },
      utile: { description: "La prochaine couche du lit, dessinée d'avance." },
    },
  },
  {
    id: "s5-stalle",
    origine: 5,
    nomDHaut: "La stalle",
    nomDEnBas: "la caution de bois",
    cout: 4,
    famille: "multiplicateur",
    effet: {
      puissant: { levier: "principal", facteur: 1.25 },
      utile: { levier: "principal", facteur: 1.125 },
    },
  },
  {
    id: "s5-silence",
    origine: 5,
    nomDHaut: "Le silence",
    nomDEnBas: "le gage patient",
    cout: 4,
    famille: "multiplicateur",
    effet: {
      puissant: { levier: "secondaire", facteur: 1.5 },
      utile: { levier: "secondaire", facteur: 1.25 },
    },
  },
  {
    id: "s5-voix",
    origine: 5,
    nomDHaut: "La voix seule",
    nomDEnBas: "le gage qui chante",
    cout: 4,
    famille: "unique",
    effet: {
      puissant: {
        description:
          "Pendant les douze crues de la grande crue, une voix tient une note. Elle se tait à la grande crue, ou une crue plus tôt si la caisse ne la couvre pas.",
      },
      utile: {
        description: "Dans le lit, la même voix revient une fois, plus bas, au premier dépôt.",
      },
    },
  },

  // ——— Strate 6, la dette : cinq objets, 32 points. Puissants dans le lit ; utiles au fond, où rien
  // n'est produit ni caché : ils n'y agissent pas, sauf la pierre qui oblige.
  {
    id: "s6-stylet",
    origine: 6,
    nomDHaut: "Le stylet",
    nomDEnBas: "le bâton qui creuse",
    cout: 5,
    famille: "raccourci",
    effet: {
      puissant: {
        description:
          "Dès l'arrivée, les mots du lit sont levés : crue, limon, couche et rive, et les mesures de son échelle.",
      },
      utile: { description: "Au fond, aucun effet : tout s'y lit déjà." },
    },
  },
  {
    id: "s6-sceau",
    origine: 6,
    nomDHaut: "Le sceau",
    nomDEnBas: "le rouleau qui marque",
    cout: 6,
    famille: "affichage",
    effet: {
      puissant: { description: "Les trois prochaines couches du lit, dessinées d'avance." },
      utile: { description: "Au fond, aucun effet : rien ne s'y dépose." },
    },
  },
  {
    id: "s6-poids",
    origine: 6,
    nomDHaut: "Le poids",
    nomDEnBas: "la pierre qui pèse",
    cout: 7,
    famille: "multiplicateur",
    effet: {
      puissant: { levier: "principal", facteur: 1.25 },
      utile: { levier: "principal", facteur: 1.125 },
    },
  },
  {
    id: "s6-bulle",
    origine: 6,
    nomDHaut: "La bulle d'argile",
    nomDEnBas: "l'œuf qui garde",
    cout: 7,
    famille: "affichage",
    effet: {
      puissant: { description: "La rive marquée d'avance : jusqu'où le bassin se remplira." },
      utile: { description: "Au fond, aucun effet : rien ne s'y remplit." },
    },
  },
  {
    id: "s6-tablette",
    origine: 6,
    nomDHaut: "La tablette de prêt",
    nomDEnBas: "la pierre qui oblige",
    cout: 7,
    famille: "unique",
    effet: {
      puissant: {
        description:
          "Quand le lit descend, l'eau se retire un instant et laisse voir la paroi du fond : des encoches, par groupes.",
      },
      utile: { description: "Dans la salle de lecture, la trace de la dette se lit sans clé." },
    },
  },

  // ——— Strate 7, le lit : trois objets, 4 points, que la descente automatique emporte toujours. Au
  // fond, qui ne parle pas, ce sont des encoches et des clés de lecture.
  {
    id: "s7-galet",
    origine: 7,
    nomDHaut: "Le galet",
    nomDEnBas: "|",
    cout: 1,
    famille: "affichage",
    effet: {
      puissant: {
        description:
          "Dans la salle de lecture, les restes retrouvent leur couche : sous chacun, celle d'où il venait.",
      },
      utile: { description: "Rien : aucune strate n'est sous le fond." },
    },
  },
  {
    id: "s7-coquille",
    origine: 7,
    nomDHaut: "La coquille",
    nomDEnBas: "||",
    cout: 1,
    famille: "affichage",
    effet: {
      puissant: {
        description:
          "Dans la salle de lecture, les objets retrouvent leurs deux noms : celui d'en haut sous celui d'en bas.",
      },
      utile: { description: "Rien : aucune strate n'est sous le fond." },
    },
  },
  {
    id: "s7-bois-flotte",
    origine: 7,
    nomDHaut: "Le bois flotté",
    nomDEnBas: "|||",
    cout: 2,
    famille: "affichage",
    effet: {
      puissant: {
        description:
          "Dans la salle de lecture, le compte de la paroi se lit une fois, en chiffres de la surface.",
      },
      utile: { description: "Rien : aucune strate n'est sous le fond." },
    },
  },
];

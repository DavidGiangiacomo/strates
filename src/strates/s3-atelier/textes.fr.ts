// Les textes de l'atelier : provisoires, le temps de la boucle (#67). Leur rédaction est l'objet de
// #68 (fiche, § 11). Ton : les légendes d'un plan et sa nomenclature. Des désignations, des repères,
// des mentions brèves ; personne ne s'adresse au joueur, et aucun texte ne dit « horloge ».
// Les nombres s'écrivent en base douze : `{n}` est un nombre, `{n:mot}` un nombre suivi du mot
// accordé (logique/notation.ts).
export const textes: Record<string, string> = {
  titre: "L'atelier",

  // ——— En tête
  stock: "Stock",
  "stock.valeur": "{stock:pièce}",
  production: "Production",
  "production.valeur": "{production} par tour",
  cases: "Cases libres",
  "cases.valeur": "Il reste {cases:case}.",
  "cases.aucune": "Il ne reste aucune case.",

  // ——— Le plan
  plan: "Le plan",
  ressort: "Ressort",
  "case.libre": "Case libre",
  "piece.etiquette": "Pièce {piece}",
  "piece.tourne": "tourne",
  "piece.immobile": "ne tourne pas",
  "piece.frotte": "frotte",
  "cote.0": "en haut",
  "cote.1": "à droite",
  "cote.2": "en bas",
  "cote.3": "à gauche",

  // ——— La nomenclature
  nomenclature: "Nomenclature",
  "nomenclature.repere": "Rep.",
  "nomenclature.designation": "Désignation",
  "nomenclature.profil": "Profil",
  "nomenclature.exemplaires": "Ex.",
  "nomenclature.base": "Base, par tour",
  "nomenclature.prix": "Prix",
  "nomenclature.epuisee": "—",
  "piece.roue": "Roue dentée",
  "piece.cliquet": "Cliquet",
  "piece.renvoi": "Renvoi",
  "piece.pignon": "Pignon",
  "piece.secteur": "Secteur",
  "piece.echappement": "Roue d'échappement",
  "piece.ancre": "Ancre",
  "piece.champ": "Roue de champ",
  "piece.arbre": "Arbre",
  "piece.rochet": "Rochet",
  "piece.grandeRoue": "Grande roue",
  "piece.balancier": "Balancier",
  agrandir: "Agrandir le plan : {taille} × {taille}",
  "plan.complet": "Le plan a sa taille.",

  // ——— L'établi, et la pièce en main
  etabli: "Établi",
  "etabli.vide": "Rien sur l'établi.",
  lime: "Lime",
  "sans-plan": "Pièce sans plan",
  main: "En main",
  "main.tourner": "Tourner",
  "main.de-cote": "Mettre de côté",
  "main.lacher": "Lâcher",
  "main.limer": "Limer",

  // ——— La légende : ce que l'atelier écrit
  legende: "Légende",
  "legende.arrivee": "Plan de {taille} × {taille}. Il reste {cases:case}.",
  "legende.ajustee": "Pièce {piece} : ajustée.",
  "legende.immobile": "Pièce {piece} : ne tourne pas.",
  "legende.gene.piece": "Pièce {piece} : gêne sa voisine.",
  "legende.gene.cadre": "Pièce {piece} : frotte contre le cadre.",
  "legende.gene.ressort": "Pièce {piece} : frotte contre le ressort.",
  "legende.limee": "Pièce {piece} : une dent limée.",
  "legende.agrandi": "Plan agrandi : {taille} × {taille}. Il reste {cases:case}.",
  "legende.sans-plan": "Pièce sans plan : mise de côté.",

  // La valeur convertible, nommée à l'écran de fouille.
  "fouille.valeur": "Pièces produites",

  // ——— Le graphe de dépendances (docs/comprehension.md, § 5)
  "noeud.ressort": "Ressort",
  "noeud.rouage": "Rouage",
  "noeud.cotes": "Côtés",
  "noeud.lime": "Lime",
  "noeud.cadre": "Cadre",
  "noeud.engrenages": "Dents engrenées",
  "noeud.frottements": "Frottements",
  "noeud.piece": "Production d'une pièce",
  "noeud.production": "Production",
  "noeud.stock": "Stock",
  "noeud.nomenclature": "Nomenclature",
  "noeud.agrandir": "Agrandissement",
  "noeud.plan": "Plan",
  // Les formules réelles, en base douze : 1,3 vaut 1 + 3/12, soit 1,25 ; un tour, 10 secondes.
  "formule.prix": "premier prix × 1,3ⁿ, n étant les exemplaires déjà achetés",
  "formule.piece":
    "base × 2^(dents engrenées − frottements) ; une grande pièce compte ses demi-côtés, et divise l'exposant par 2",
  "formule.production": "la somme des pièces entraînées, par tour de 10 secondes",
  "formule.rouage": "une pièce tourne si un chemin de dents engrenées la relie au ressort",
  "formule.agrandir":
    "un plan de {a} × {a} : {pa:pièce} ; de {b} × {b} : {pb:pièce} ; de {c} × {c} : {pc:pièce}",
};

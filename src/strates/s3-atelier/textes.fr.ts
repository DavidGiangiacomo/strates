// Les textes de l'atelier (#68 ; fiche, § 11). Ton : les légendes d'un plan et sa nomenclature. Des
// désignations, des repères, des mentions brèves : « ajustée », « gêne sa voisine », « à reprendre ».
// Personne ne s'adresse au joueur, aucun texte ne dit « horloge » ni ne nomme la couche, et la notice
// ne dit rien de la fin, de la lime ou du bandeau. Les nombres s'écrivent en base douze : `{n}` est un
// nombre, `{n:mot}` un nombre suivi du mot accordé (logique/notation.ts).
export const textes: Record<string, string> = {
  titre: "Plan d'assemblage",

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
  "case.libre": "Case libre, ligne {ligne}, colonne {colonne}",
  "piece.etiquette": "Pièce {piece}",
  "piece.dent": "dent",
  "piece.dents": "dents",
  "piece.sans-dent": "sans dent",
  "piece.tourne": "tourne",
  "piece.immobile": "ne tourne pas",
  "piece.frotte": "frotte",
  "cote.0": "en haut",
  "cote.1": "à droite",
  "cote.2": "en bas",
  "cote.3": "à gauche",

  // ——— La nomenclature : une désignation et une note par pièce, comme une ligne de nomenclature
  nomenclature: "Nomenclature",
  "nomenclature.repere": "Rep.",
  "nomenclature.designation": "Désignation",
  "nomenclature.profil": "Profil",
  "nomenclature.exemplaires": "Ex.",
  "nomenclature.base": "Base, par tour",
  "nomenclature.prix": "Prix",
  "nomenclature.epuisee": "—",
  // La production de base d'une pièce, que l'opacité cache jusqu'au premier agrandissement (§ 7).
  "nomenclature.base.valeur": "{base}",
  "piece.roue": "Roue dentée",
  "piece.roue.note": "Quatre côtés dentés.",
  "piece.cliquet": "Cliquet",
  "piece.cliquet.note": "Un côté denté : il ferme un bout de rouage.",
  "piece.renvoi": "Renvoi",
  "piece.renvoi.note": "Deux côtés dentés, en équerre : le mouvement tourne d'un quart.",
  "piece.pignon": "Pignon",
  "piece.pignon.note": "Deux côtés dentés, opposés : le mouvement passe tout droit.",
  "piece.secteur": "Secteur",
  "piece.secteur.note": "Trois côtés dentés, un lisse.",
  "piece.echappement": "Roue d'échappement",
  "piece.echappement.note": "Profil de la roue dentée.",
  "piece.ancre": "Ancre",
  "piece.ancre.note": "Profil du cliquet.",
  "piece.champ": "Roue de champ",
  "piece.champ.note": "Profil du renvoi.",
  "piece.arbre": "Arbre",
  "piece.arbre.note": "Profil du pignon.",
  "piece.rochet": "Rochet",
  "piece.rochet.note": "Profil du secteur.",
  "piece.grandeRoue": "Grande roue",
  "piece.grandeRoue.note": "Quatre cases. Quatre côtés dentés.",
  "piece.balancier": "Balancier",
  "piece.balancier.note": "Quatre cases. Un côté denté.",
  agrandir: "Agrandir le plan : {taille} × {taille}",
  "plan.complet": "Le plan a sa taille.",
  // Sous la nomenclature, les objets d'en haut qui agissent ici, sous leur nom d'en bas (fiche, § 8).
  "hors-plan": "Hors plan",

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

  // ——— La légende : ce que le plan note, pièce par pièce
  legende: "Légende",
  "legende.arrivee": "Plan de {taille} × {taille}. Il reste {cases:case}.",
  "legende.ajustee": "Pièce {piece} : ajustée.",
  "legende.immobile": "Pièce {piece} : à reprendre.",
  "legende.gene.piece": "Pièce {piece} : gêne sa voisine.",
  "legende.gene.cadre": "Pièce {piece} : frotte contre le cadre.",
  "legende.gene.ressort": "Pièce {piece} : frotte contre le ressort.",
  "legende.limee": "Pièce {piece} : une dent limée.",
  "legende.agrandi": "Plan agrandi : {taille} × {taille}. Il reste {cases:case}.",
  "legende.sans-plan": "Pièce sans plan : mise de côté.",
  // Un objet d'en haut qui agit, sous son nom d'en bas : ce que l'atelier a posé à côté du plan.
  "legende.eveil": "Hors plan : {objet}.",

  // La valeur convertible, nommée à l'écran de fouille.
  "fouille.valeur": "Pièces produites",

  // ——— La notice : une page courte, comme la notice d'un plan. Rien de la fin, de la lime, du bandeau.
  aide: "Aide",
  "aide.titre": "Notice du plan",
  "aide.fermer": "Refermer",
  "aide.plan.titre": "Le plan",
  "aide.plan":
    "Un carré de cases au cadre lisse, et le ressort au centre. Une pièce tient une case, une grande pièce quatre. Achetée, elle vient en main ; elle se pose sur une case libre, et se tourne d'un quart de tour, d'un clic droit ou de la touche R.",
  "aide.dents.titre": "Les dents",
  "aide.dents":
    "Chaque côté d'une pièce est denté ou lisse. Deux côtés dentés face à face engrènent, et la production de chacune double. Une dent contre un côté lisse, ou contre le cadre, frotte : la production est divisée par deux. Contre une case libre, rien.",
  "aide.mouvement.titre": "Le mouvement",
  "aide.mouvement":
    "Le ressort entraîne les pièces qui le touchent par une dent, et celles-ci leurs voisines, de dent en dent. Une pièce que rien ne relie au ressort ne tourne pas, et ne produit rien.",
  "aide.nomenclature.titre": "La nomenclature",
  "aide.nomenclature":
    "La liste des pièces à poser, avec leurs exemplaires et leur prix. Chaque exemplaire coûte plus que le précédent. La production se compte par tour du ressort.",
  "aide.nombres.titre": "Les nombres",
  "aide.nombres":
    "Ils se comptent par douze. Après 9 viennent ↊ et ↋, puis 10 : une douzaine. 100 est une grosse, douze douzaines.",

  // ——— Les traces que le fond donnera à lire (#109 ; bible, § 5)
  "trace.cases": "Il ne reste aucune case.",
  "trace.pieces": "Pièces : {pieces}.",
  "trace.sans-plan": "Pièce sans plan : mise de côté.",

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
  // Les formules réelles, en base douze : 1,3 vaut 1 + 3/12, soit 1,25 ; un tour, 10 secondes. Lues
  // au-delà de κ = 50 seulement, elles n'entrent pas dans le budget.
  "formule.prix": "premier prix × 1,3ⁿ, n étant les exemplaires déjà achetés",
  "formule.piece":
    "base × 2^(dents engrenées − frottements) ; une grande pièce compte ses demi-côtés, et divise l'exposant par 2",
  "formule.production": "la somme des pièces entraînées, par tour de 10 secondes",
  "formule.rouage": "une pièce tourne si un chemin de dents engrenées la relie au ressort",
  "formule.agrandir":
    "un plan de {a} × {a} : {pa:pièce} ; de {b} × {b} : {pb:pièce} ; de {c} × {c} : {pc:pièce}",
};

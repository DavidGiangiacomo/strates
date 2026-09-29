// Les textes des caves (#17 ; fiche, § 11). Ils seront révisés d'après la bible narrative (#43, #60).
// Ton : celui d'un registre de village. Des phrases courtes, datées, constatées plutôt que racontées,
// sans émotion affichée ; le registre ne s'adresse jamais au joueur. Aucun texte ne mentionne
// « creuser », bien que la vallée n'ait fait que ça, et l'aide ne dit rien du bandeau.
// `{n}` est un nombre, `{n:mot}` un nombre suivi du mot accordé (logique/notation.ts).
export const textes: Record<string, string> = {
  // ——— La vallée
  titre: "La vallée",
  date: "Jour {jour} de l'an {annee}",
  "saison.printemps": "Printemps",
  "saison.ete": "Été",
  "saison.automne": "Automne",
  "saison.hiver": "Hiver",
  "calendrier.avant-hiver": "L'hiver commence dans {jours:jour} ; il durera {duree:jour}.",
  "calendrier.hiver": "Encore {jours:jour} d'hiver.",
  "calendrier.soudure": "La soudure : la récolte ne nourrit pas encore la vallée.",
  calendrier: "Le calendrier : l'année au centre, les années passées autour",

  reserve: "Réserve",
  "reserve.capacite": "{reserve} sur {capacite:boisseau}",
  "marque-hiver": "Marque d'hiver",
  "marque-hiver.valeur": "{marque:boisseau}",
  "marque-hiver.au-dessus": "au-delà de ce que les stockages peuvent contenir",
  recolte: "Récolte",
  consommation: "Consommation",
  pertes: "Pertes",
  "par-jour": "{quantite:boisseau} par jour",
  glaner: "Glaner",
  "glaner.rien": "Il n'y a rien à glaner.",
  courbe: "Réserve, 3 dernières années",
  "courbe.annee": "an {annee}",

  // ——— Le registre : les achats sont des écritures, chacune avec sa note en marge
  registre: "Registre",
  prix: "{prix:boisseau}",
  "familles.nombre": "{familles:famille}",
  installer: "Installer une famille",
  "installer.note": "Une famille de plus aux champs. Elle récolte l'été, et mange toute l'année.",
  "vallee.pleine": "La vallée est pleine.",

  "stockage.grenier": "Grenier",
  "stockage.silo": "Silo",
  "stockage.cave": "Cave",
  "stockage.caveProfonde": "Cave profonde",
  "construire.grenier": "Construire un grenier",
  "construire.silo": "Construire un silo",
  "construire.cave": "Aménager une cave",
  "construire.caveProfonde": "Aménager une cave profonde",
  "stockage.grenier.note": "Un bâtiment de bois sur le champ. Vite rempli, il laisse pourrir.",
  "stockage.silo.note": "Une tour de terre, à moitié enterrée. Le grain s'y garde mieux.",
  "stockage.cave.note": "Une salle sous la vallée, au frais. Le grain n'y bouge presque plus.",
  "stockage.caveProfonde.note":
    "Sous la cave, plus bas encore. On y garde ce qui doit passer les grands hivers.",
  "stockage.detail": "{nombre:construit} · {capacite:boisseau} chacun",
  "stockage.pertes": "pertes : {pertes:boisseau} par jour",

  outils: "Outils",
  "outil.faucille": "Faucille",
  "outil.fleau": "Fléau",
  "outil.charrue": "Charrue",
  "outil.assolement": "Assolement",
  "outil.faucille.acheter": "Acheter une faucille",
  "outil.fleau.acheter": "Acheter un fléau",
  "outil.charrue.acheter": "Acheter une charrue",
  "outil.assolement.acheter": "Adopter l'assolement",
  "outil.faucille.note": "On coupe plus vite, et plus près du sol.",
  "outil.fleau.note": "Le grain se sépare mieux de la paille.",
  "outil.charrue.note": "La terre retournée donne davantage.",
  "outil.assolement.note": "Les champs se reposent à tour de rôle, et rendent plus.",
  "outils.aucun": "Aucun outil.",
  "outils.tous": "La vallée a tous ses outils.",

  // ——— La chronique : ce que le registre écrit, daté et constaté
  "registre.arrivee": "An {annee}. {familles:famille}, un grenier.",
  "registre.sans-rupture":
    "Hiver de l'an {annee} : passé sans rupture. Naissances : {naissances:famille}.",
  "registre.sans-rupture-vallee-pleine":
    "Hiver de l'an {annee} : passé sans rupture. La vallée est pleine.",
  "registre.rupture":
    "Hiver de l'an {annee} : le grain a manqué {jours:jour}. Départs : {departs:famille}.",
  "registre.hivers-allongent":
    "An {annee} : l'hiver durera {duree:jour}. Les hivers s'allongent ; les anciens se souviennent des grands hivers.",
  "registre.grand-hiver-arrive":
    "An {annee} : le grand hiver est là. Les anciens disent qu'une vallée qui en passe trois de suite n'a plus rien à craindre.",
  "registre.grand-hiver":
    "Grand hiver de l'an {annee} : passé sans rupture. Grands hivers de suite : {serie}.",
  "registre.grand-hiver-rupture":
    "Grand hiver de l'an {annee} : le grain a manqué {jours:jour}. Départs : {departs:famille}.",
  "registre.serie-rompue": "Les anciens recommencent à compter.",
  "registre.seuil": "Trois grands hivers sans rupture. La vallée n'a plus rien à craindre.",
  "registre.pertes": "Grain pourri dans les stockages depuis l'arrivée : {pourri:boisseau}.",
  "registre.eveil": "Les familles ont compris {objet}.",
  "registre.attente": "{objets} objets venus d'en haut, que personne ne sait employer.",
  "registre.attente.un": "Un objet venu d'en haut, que personne ne sait employer.",
  // La feuille qui annonce : une ligne de l'atelier (strate 3), d'une autre main. Provisoire (#68, #43).
  "registre.feuille": "Il reste soixante-trois cases.",

  // ——— Le retour d'une absence (fiche, § 10) : l'hiver attend le joueur
  "absence.hiver": "L'hiver vous attendait : rien n'a bougé.",
  "absence.recolte": "La récolte a continué {jours:jour} : {recolte:boisseau}.",
  "absence.premiers-froids": "Les premiers froids sont là. L'hiver vous attend.",
  "absence.rupture": "Le grain allait manquer : le calendrier s'est arrêté.",

  // La valeur convertible, nommée à l'écran de fouille (docs/strates/descente-1-2.md, P3).
  "fouille.valeur": "Grain récolté",

  // ——— L'aide : une page du registre, qui décrit la vallée et rien d'autre
  aide: "Aide",
  "aide.titre": "Comment tient la vallée",
  "aide.fermer": "Refermer",
  "aide.calendrier.titre": "Le calendrier",
  "aide.calendrier":
    "L'année compte 420 jours. Le printemps, l'été et l'automne se partagent la saison chaude ; puis vient l'hiver, où rien ne pousse. L'aiguille avance d'un jour à chaque instant. Autour de l'année, une case par année passée.",
  "aide.reserve.titre": "La réserve",
  "aide.reserve":
    "Tout le grain de la vallée. La récolte y entre ; ce que mangent les familles et ce qui pourrit en sort. Le grain qui ne tient plus dans les stockages est perdu.",
  "aide.stockages.titre": "Les stockages",
  "aide.stockages":
    "Le grain descend d'abord au plus profond, où il se garde le mieux. Un grenier en perd un peu chaque jour ; une cave profonde, presque rien. La coupe montre jusqu'où il monte.",
  "aide.familles.titre": "Les familles",
  "aide.familles":
    "Chaque famille récolte pendant la saison chaude et mange toute l'année. Après un hiver sans manque, des familles naissent ; quand le grain manque, des familles partent.",
  "aide.achats.titre": "Les écritures",
  "aide.achats":
    "Tout se paie en grain : les familles qu'on installe, les stockages, les outils. Un outil s'achète une fois, et fait mieux récolter.",

  // ——— Les traces laissées au fond (strate 8, #109) : trois lignes du registre au plus
  "trace.hivers": "Hivers passés sans rupture : {hivers}.",
  "trace.profondeur.grenier": "Le grain se gardait dans des greniers.",
  "trace.profondeur.silo": "Le grain se gardait jusque dans des silos.",
  "trace.profondeur.cave": "Le grain se gardait jusque dans des caves.",
  "trace.profondeur.caveProfonde": "Le grain se gardait jusque dans des caves profondes.",
};

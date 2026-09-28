// Textes provisoires des caves : ils seront réécrits par #17, d'après la bible narrative.
// Ton : celui d'un registre de village, court, daté, constaté. Aucun texte ne mentionne « creuser »
// (fiche, § 11). `{n}` est un nombre, `{n:mot}` un nombre suivi du mot accordé (logique/notation.ts).
export const textes: Record<string, string> = {
  titre: "La vallée",
  date: "Jour {jour} de l'an {annee}",
  "saison.printemps": "Printemps",
  "saison.ete": "Été",
  "saison.automne": "Automne",
  "saison.hiver": "Hiver",
  "calendrier.avant-hiver": "L'hiver commence dans {jours:jour} ; il durera {duree:jour}.",
  "calendrier.hiver": "Encore {jours:jour} d'hiver.",
  "calendrier.soudure": "La soudure : la récolte ne nourrit pas encore la vallée.",

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

  familles: "Familles",
  "familles.nombre": "{familles:famille}",
  installer: "Installer une famille",
  "vallee.pleine": "La vallée est pleine.",

  stockages: "Stockages",
  "stockage.grenier": "Grenier",
  "stockage.silo": "Silo",
  "stockage.cave": "Cave",
  "stockage.caveProfonde": "Cave profonde",
  "stockage.detail": "{nombre} construits · {capacite:boisseau} chacun",
  "stockage.pertes": "pertes : {pertes:boisseau} par jour",
  construire: "Construire",

  outils: "Outils",
  "outil.faucille": "Faucille",
  "outil.fleau": "Fléau",
  "outil.charrue": "Charrue",
  "outil.assolement": "Assolement",
  "outils.aucun": "Aucun outil.",
  "outils.tous": "La vallée a tous ses outils.",
  acheter: "Acheter",

  prix: "{prix:boisseau}",
  registre: "Registre",
  courbe: "Réserve, 3 dernières années",
  calendrier: "Le calendrier : l'année au centre, les années passées autour",

  "registre.arrivee": "An {annee}. {familles:famille}, un grenier.",
  "registre.sans-rupture":
    "Hiver de l'an {annee} : passé sans rupture. Naissances : {naissances:famille}.",
  "registre.sans-rupture-vallee-pleine": "Hiver de l'an {annee} : passé sans rupture.",
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
  // La feuille qui annonce : une ligne de l'atelier (strate 3), d'une autre main. Provisoire (#68, #43).
  "registre.feuille": "Il reste soixante-trois cases.",

  "absence.hiver": "L'hiver vous attendait : rien n'a bougé.",
  "absence.recolte": "La récolte a continué {jours:jour} : {recolte:boisseau}.",
  "absence.premiers-froids": "Les premiers froids sont là. L'hiver vous attend.",
  "absence.rupture": "Le grain allait manquer : le calendrier s'est arrêté.",
};

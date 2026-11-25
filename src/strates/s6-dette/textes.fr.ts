// Les textes de la dette, en proposition pour #74 (docs/strates/strate-6.md, § 11) : des formules
// d'obligation, datées, à la troisième personne. Pas de « vous », pas de point d'exclamation, pas de
// jugement : le défaut se note comme le reste (bible, § 2). Les nombres s'y glissent par `{cle}`,
// déjà écrits : les montants en sceaux, les crues en ordinaux.
export const textes: Record<string, string> = {
  // ——— Les promesses (§ 3) : ce qu'on obtient tout de suite, du plus petit au plus grand.
  "promesse.orge": "une mesure d'orge",
  "promesse.huile": "une jarre d'huile",
  "promesse.etoffe": "une pièce d'étoffe",
  "promesse.ane": "un âne",
  "promesse.barque": "une barque",
  "promesse.attelage": "un attelage",
  "promesse.champ": "un champ",
  "promesse.verger": "un verger",
  "promesse.troupeau": "un troupeau",
  "promesse.maison": "une maison",
  "promesse.canal": "un canal",
  "promesse.digue": "une digue",
  "promesse.crueQuiVient": "la crue qui vient",
  "promesse.dixCrues": "dix crues",
  "promesse.toutesLesCrues": "toutes les crues",

  // ——— Le haut du livre : la caisse, le rapport, la confiance et la crue.
  caisse: "La caisse",
  rapport: "{montant} par crue",
  confiance: "La confiance",
  "confiance.etat": "Dû : {du} sur {confiance}",
  "crue.prochaine": "La {crue} crue dans {secondes} s",

  // ——— La tablette ouverte : ses trois sortes, et un bouton par terme.
  tablette: "Tablette {n} sur 5",
  "tablette.brisees": "Tablettes brisées : {n}",
  "sorte.restent": "{n} sur 8 à promettre",
  "sorte.rapporte": "rapporte {montant} par crue",
  terme: "à {n} crues : {montant}, à la {crue}",
  "terme.grandeCrue": "à la grande crue : {montant}",

  // ——— L'échéancier : une ligne par échéance, dans l'ordre des crues.
  echeancier: "Les échéances",
  "echeancier.vide": "Rien n'est dû.",
  echeance: "Dû à la {crue} crue : {montant}.",
  "echeance.grandeCrue": "Dû à la grande crue : {montant}.",
  "echeance.reports": "reportée {n} fois",
  // La caisse prévue, que montrent le gage qui revient et ce qui monte (§ 8).
  "echeance.prevue": "Caisse prévue : {montant}.",
  solder: "Solder",
  "grandeCrue.attendue": "Tout ce qui reste dû tombe à la grande crue : {montant}.",
  "grandeCrue.fixee": "La grande crue, à la {crue} crue : {montant}.",

  // ——— Le livre : ce qui s'est passé, ligne à ligne.
  livre: "Le livre",
  "livre.entree": "Les échéances tombent à leur crue, qu'on soit là ou non.",
  "livre.honore": "Dû à la {crue} crue : {montant}. Honoré.",
  "livre.solde": "Dû à la {crue} crue : {montant}. Honoré avant son terme.",
  "livre.reporte": "Reporté à la {crue} crue, majoré d'un quart : {montant}.",
  "livre.reporteAdouci": "Reporté à la {crue} crue, majoré de {majoration} % : {montant}.",
  "livre.echu": "Dû à la {crue} crue : {montant}. Échu.",
  "livre.refus": "La confiance ne suffit pas.",
  "livre.brisee": "La tablette est brisée.",
  "livre.derniere": "Tout ce qui reste dû tombe à la grande crue.",
  // L'éveil des gages, à la première tablette brisée : un objet par ligne (§ 8).
  "livre.eveil": "Les témoins ont reconnu {objet}.",
  "livre.grandeCrue": "La grande crue : à la {crue} crue.",
  // Les deux fins, mot pour mot celles de la bible (§ 7) : même voix, même longueur, même place.
  "livre.soldee": "Honoré. Plus rien n'est dû.",
  "livre.defaut": "Échu. Le reste demeure dû.",

  // ——— Le retour d'une absence, après la durée qu'écrit le noyau (§ 10).
  "absence.honorees": "{n} échéances honorées",
  "absence.honorees.une": "1 échéance honorée",
  "absence.reportees": "{n} reportées",
  "absence.reportees.une": "1 reportée",
  "absence.seulesReportees": "{n} échéances reportées",
  "absence.seulesReportees.une": "1 échéance reportée",

  // ——— L'écran de fouille : la valeur convertible, ce qui a été honoré.
  "fouille.valeur": "Honoré",

  // ——— Le graphe de dépendances (docs/comprehension.md, § 5)
  "noeud.promesse": "Promesses",
  "noeud.terme": "Terme",
  "noeud.rapport": "Rapport",
  "noeud.caisse": "Caisse",
  "noeud.echeance": "Échéances",
  "noeud.report": "Report",
  "noeud.honore": "Honoré",
  "noeud.confiance": "Confiance",
  "noeud.tablette": "Tablettes",
  "noeud.grandeCrue": "Grande crue",

  // ——— Les formules réelles (§ 7), de la plus simple à la plus profonde.
  "formule.promesse": "prix de base × 1,3ⁿ, au n-ième exemplaire",
  "formule.rapport": "la somme des rapports des exemplaires promis",
  "formule.terme": "prix × 1, × 1,2 ou × 1,6, à 2, 6 ou 18 crues",
  "formule.confiance": "60 + 5 × ce qui est honoré en entier, sans les reports",
  "formule.report": "ce qui reste × 1,25, deux crues plus tard",
  "formule.grandeCrue": "dernière promesse + 12 crues : tout ce qui reste dû, d'un coup",
  "formule.honore": "la somme des prix des promesses honorées, sans les intérêts",
};

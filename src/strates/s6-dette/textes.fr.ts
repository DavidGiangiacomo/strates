// Les textes de la dette (#74 ; docs/strates/strate-6.md, § 11 ; bible, §§ 2, 4 à 7, 9 et 10) : un livre
// de comptes, des formules d'obligation, datées, à la troisième personne. Pas de « vous », pas de point
// d'exclamation, pas de jugement : le défaut se note comme le reste. Les nombres s'y glissent par
// `{cle}`, déjà écrits : les montants en sceaux, les crues en ordinaux. Les noms d'en bas des gages
// sont au catalogue des objets (noyau/logique/catalogue.ts) ; les traces (`trace.*`) se lisent au
// fond, et comptent dans son budget, pas dans celui de la dette.
export const textes: Record<string, string> = {
  // ——— Les promesses (§ 3) : ce qu'on obtient tout de suite, du plus petit au plus grand. La
  // dernière tablette promet l'avenir même.
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

  // ——— Les infobulles : ce que chaque chose est, sans dire quoi en faire.
  "infobulle.caisse": "Ce qu'on a.",
  "infobulle.rapport": "Ce que rapportent les promesses faites, à chaque crue.",
  "infobulle.confiance": "Ce qu'on peut devoir, au plus.",
  "infobulle.terme": "Le rapport vient tout de suite ; le prix tombe à la crue écrite.",
  "infobulle.solder": "Honorer avant le terme, au plein montant.",

  // ——— Le livre. Son en-tête, écrit dès l'arrivée et toujours lisible : les échéances tombent
  // pendant l'absence (§ 10). Puis ce qui s'est passé, ligne à ligne.
  livre: "Le livre",
  "livre.entree": "Les échéances tombent à leur crue, qu'on soit là ou non.",
  "livre.honore": "Dû à la {crue} crue : {montant}. Honoré.",
  "livre.solde": "Dû à la {crue} crue : {montant}. Honoré avant son terme.",
  // Sous une échéance reportée, une fois honorée : ce que la confiance y gagne, compté sur le dû
  // d'avant le report (fiche, § 13, question 12).
  "livre.confiance": "La confiance y gagne {montant}, sur le dû d'avant le report.",
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

  // ——— Le rappel de reprise (bible, § 10) : la dernière ligne du livre, puis où en est son seuil,
  // dans les mots que le livre a déjà écrits ; avant la dernière tablette, la tablette ouverte.
  "rappel.tablette": "Tablette {n} sur 5.",

  // ——— L'aide : les usages du livre, comme la notice d'un registre. Elle constate les règles, et ce
  // qu'elles permettent ; elle ne conseille rien, et ne dit rien de la fin.
  aide: "Aide",
  "aide.titre": "Usages du livre",
  "aide.fermer": "Refermer",
  "aide.promesse.titre": "La promesse",
  "aide.promesse":
    "Une promesse rapporte à chaque crue, dès qu'elle est faite. Son prix tombe plus tard, à son terme : à 2 crues tel quel, à 6 crues majoré de 20 %, à 18 crues de 60 %. Chaque exemplaire coûte plus que le précédent.",
  "aide.echeance.titre": "L'échéance",
  "aide.echeance":
    "À sa crue, l'échéance se paie sur la caisse : « Honoré. » Avant sa crue, elle se solde au plein montant, si la caisse la couvre.",
  "aide.report.titre": "Le report",
  "aide.report":
    "Ce que la caisse ne couvre pas est reporté de deux crues, majoré d'un quart. Un report se solde comme toute échéance ; d'ici sa crue, la caisse reçoit le rapport de chaque promesse.",
  "aide.confiance.titre": "La confiance",
  "aide.confiance":
    "Ce qu'on peut devoir, au plus. Une promesse qu'elle ne couvre pas est refusée. Elle grandit de chaque échéance honorée en entier, comptée sur son dû d'avant tout report. Le report qu'elle ne peut plus porter est échu, et le livre s'arrête.",
  "aide.tablettes.titre": "Les tablettes",
  "aide.tablettes":
    "Une tablette toute promise ouvre la suivante ; toute honorée, elle est brisée. La dernière n'a pas de terme : tout y est dû à la grande crue, douze crues après sa dernière promesse, et tout ce qui reste dû y tombe ensemble.",
  "aide.sceaux.titre": "Les sceaux",
  "aide.sceaux":
    "Chaque groupe de trois zéros, à la fin d'un montant, devient un sceau : 125 ●●● vaut 125 milliards. Une crue passe toutes les trente secondes.",

  // ——— L'écran de fouille : la valeur convertible, ce qui a été honoré.
  "fouille.valeur": "Honoré",

  // ——— Les traces pour le fond (bible, § 5) : la ligne de l'issue, et le compte de ce qui a été
  // honoré, en sceaux. Elles comptent dans le budget du fond.
  "trace.soldee": "Honoré. Plus rien n'est dû.",
  "trace.defaut": "Échu. Le reste demeure dû.",
  "trace.honore": "Honoré : {montant}.",

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

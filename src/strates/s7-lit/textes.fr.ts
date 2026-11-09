// Les textes du lit (#92 ; fiche, § 11). Le peuple du lit n'écrivait pas : c'est le jeu qui parle, en
// quatre phrases, et elles seules disent « vous ». Elles ne changent pas avec l'issue de la dette :
// quand le jeu parle, il ne juge pas, et seules les fosses de la rive la montrent (bible, § 7). Le
// reste tient en peu de mots, ceux de la coupe et de l'aide. La lecture de l'échelle s'écrit en lettres
// (logique/notation.ts) : les nombres en lettres ne comptent pas dans le budget de 100 mots.
export const textes: Record<string, string> = {
  // ——— Les phrases du jeu (bible, § 8), chacune une fois, vraies quand elles paraissent. La dernière,
  // le noyau la dit pendant la descente, sur un travelling plus lent (noyau/ui/passage.svelte.ts,
  // PHRASE_DESCENTE).
  "phrase.arrivee": "Rien ne presse.",
  "phrase.retour": "Ce que vous avez laissé en haut est toujours là.",
  "phrase.decider": "Vous n'avez rien à décider ici.",
  "phrase.descente": "C'était la seule fois.",

  // ——— La coupe (fiche, § 6). Un creux se dit avec sa hauteur et son état.
  coupe: "Le bassin, en coupe",
  echelle: "Échelle de crue",
  // L'œuf qui garde marque la rive sur l'échelle : les lecteurs d'écran l'entendent avec elle.
  "echelle.rive": "la rive à {hauteur}",
  "creux.fond": "Creux au fond du bassin",
  "creux.hauteur": "Creux à {hauteur}",
  "creux.sec": "à sec",
  "creux.eau": "sous l'eau",
  "creux.ferme": "fermé",
  "creux.plein": "plein",

  // ——— L'aide (fiche, § 11) : la coupe d'une crue, en quatre légendes, sous le dessin que la direction
  // artistique fera (#107). Les quatre mots du lit, et rien sur la fin. Elle ne dit pas « vous ».
  aide: "Aide",
  "aide.titre": "Une crue",
  "aide.fermer": "Refermer",
  "aide.crue": "La crue monte.",
  "aide.levee": "Derrière la levée, l'eau se repose.",
  "aide.couche": "Elle se retire, et laisse son limon : une couche.",
  "aide.rive": "À droite, la rive.",

  // ——— Le graphe de dépendances (docs/comprehension.md, § 5)
  "noeud.crue": "Crue",
  "noeud.passe": "Eau qui passe",
  "noeud.retenue": "Eau retenue",
  "noeud.levee": "Levée",
  "noeud.limon": "Limon",
  "noeud.creux": "Creux",
  "noeud.bassin": "Bassin",
  "noeud.echelle": "Échelle",
  "noeud.rive": "Rive",
  // Les formules réelles, en lettres comme l'échelle (fiche, § 7). Lues au-delà de κ = 50 seulement,
  // elles n'entrent pas dans le budget.
  "formule.crue": "une crue toutes les trente secondes",
  "formule.passe": "l'eau qui passe : sept doigts par crue",
  "formule.retenue": "l'eau retenue : neuf doigts et un tiers par crue",
  "formule.creux":
    "un creux : vingt-cinq crues d'eau retenue, ou trente-trois et un tiers d'eau qui passe",
  "formule.rive": "la rive : trente-six coudées, de vingt-huit doigts",
  "formule.limon": "tout le limon déposé : celui du bassin, et celui des creux",
};

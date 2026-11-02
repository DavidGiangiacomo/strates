// Les textes du lit (fiche, § 11), à relire avec #92. Le peuple du lit n'écrivait pas : c'est le jeu
// qui parle, en quelques phrases, et elles seules disent « vous ». Le reste tient en peu de mots, ceux
// de la coupe. La lecture de l'échelle s'écrit en lettres (logique/notation.ts) : les nombres en
// lettres ne comptent pas dans le budget de 100 mots.
export const textes: Record<string, string> = {
  // ——— Les phrases du jeu (bible, § 8), chacune une fois. Celle de la descente viendra avec #106.
  "phrase.arrivee": "Rien ne presse.",
  "phrase.retour": "Ce que vous avez laissé en haut est toujours là.",
  "phrase.decider": "Vous n'avez rien à décider ici.",

  // ——— La coupe (fiche, § 6). Un creux se dit avec sa hauteur et son état.
  coupe: "Le bassin, en coupe",
  echelle: "Échelle de crue",
  "creux.fond": "Creux au fond du bassin",
  "creux.hauteur": "Creux à {hauteur}",
  "creux.sec": "à sec",
  "creux.eau": "sous l'eau",
  "creux.ferme": "fermé",
  "creux.plein": "plein",

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

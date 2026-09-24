# Strates — design doc

*Concept n°7 du document « Douze concepts de jeux incrémentaux ».*
*Format visé : **jeu long, 18 à 25 h**, multi-sessions, **prestige structurel** (la descente), hors-ligne oui. Références de cadrage : Kittens Game et Antimatter Dimensions (la durée, les couches de systèmes), Universal Paperclips (le changement de grammaire en cours de route), Outer Wilds (le plaisir d'archéologue).*
*Révisions : D-002, modèle des artefacts ; D-003, valeur convertible de chaque strate (24 septembre 2026). Le détail des décisions est dans `docs/decisions.md`.*

---

## 0. Format et contraintes — pourquoi elles diffèrent

Ce concept est **l'exact opposé des autres** en matière de format, et il faut l'assumer entièrement plutôt que de le faire rentrer dans le moule des trois heures.

| Paramètre | Choix | Raison |
|---|---|---|
| Durée | **18–25 h** | Le concept est un emboîtement de jeux. Chaque strate doit avoir le temps d'être apprise, aimée et quittée : moins de 2 h par strate et aucune ne devient une vraie boucle, juste une skin. |
| Prestige | **Oui, et c'est le concept lui-même** | La descente d'un étage est la remise à zéro, sauf qu'elle ne remet rien à zéro : elle change les règles. C'est le seul des douze où le prestige est une idée et non une convention de genre. |
| Sessions | Nombreuses, courtes ou longues | Jeu de fond, à reprendre pendant des semaines. |
| Hors ligne | Oui, généreux : **80 %, plafond 12 h** | Cohérent avec le format long. C'est aussi le seul levier qui rend les 20 h supportables. |
| Nombre de strates | **7 écrites à la main + une 8ᵉ** | Voir §13 R1 : la génération procédurale infinie est le piège de ce concept. On promet 8 couches, on les fait bien, et le jeu s'arrête. |
| Plateforme | Web/desktop, sauvegarde cloud souhaitable | Durée oblige. |

**Conséquence budgétaire, à regarder en face : ce jeu coûte 6 à 8 fois les autres.** C'est sept boucles d'incrémental à concevoir, équilibrer et habiller. Ce n'est pas un premier projet.

---

## 1. Thèse

Un incrémental classique demande : *jusqu'où peux-tu monter avant de recommencer ?*
Celui-ci demande : *que reste-t-il de toi quand les règles changent ?*

Trois idées structurantes :

- **Chaque strate est un incrémental complet et différent** — ressource, verbe, boucle, esthétique, interface. Pas un reskin : la strate 3 se joue à la souris sur une grille, la strate 5 se joue en réglant des ratios, la strate 6 n'a pas de bouton de production du tout.
- **Le prestige est une descente.** On ne recommence pas au sommet avec un bonus : on descend d'un étage et on trouve une civilisation antérieure qui jouait elle-même à un incrémental. Le mouvement du jeu est toujours vers le bas et jamais vers l'arrière.
- **Ce qu'on emporte se dévalue.** Les ressources de la strate du dessus deviennent, en dessous, des **artefacts** : des objets rares, puissants, incompréhensibles pour ceux d'en bas — et périssables. Un million d'unités d'en haut ne permet d'emporter que deux ou trois objets.

Ce qui monte réellement, d'un bout à l'autre : la **Profondeur**. Elle vaut de 1 à 8. C'est la seule progression qui traverse le jeu, et elle a huit valeurs en vingt heures.

---

## 2. Fiction

Une fouille. Le joueur commence à la surface, dans un présent reconnaissable et ennuyeux — une petite exploitation, des chiffres, des courbes. Puis il creuse.

Chaque strate est une civilisation qui a laissé son jeu derrière elle : ses compteurs, ses générateurs, ses upgrades, ses tooltips. Le joueur ne joue pas *à propos* d'eux : il joue **leur** jeu, avec leurs règles, dans leur interface. On apprend qui ils étaient par la structure de ce qu'ils optimisaient — une civilisation qui comptait en dettes n'a pas la même histoire qu'une civilisation qui comptait en récoltes.

Ce que la partie finit par établir : chaque couche a fini de la même façon, et pas par catastrophe — par saturation. Chacune a atteint un état où son propre jeu n'avait plus de coup à jouer, et s'est arrêtée. La huitième strate est la première qui n'a pas de générateurs du tout.

Note de ton : archéologique, patient, sans mystère surjoué. Pas de « anciens », pas de prophétie. Des inventaires, des outils, des habitudes de comptage. ~5 000 mots répartis sur huit strates.

---

## 3. Boucle de jeu

**Boucle courte** — Propre à chaque strate. C'est l'objet du §5.

**Boucle moyenne (20–60 min)** — Monter en puissance dans la strate courante jusqu'à atteindre son **seuil de fouille** : une condition spécifique à chaque couche, jamais un simple palier de ressource (voir §6).

**Boucle longue (2–3 h)** — Une strate. Descendre. Convertir. Réapprendre.

```
Arriver dans une strate inconnue (interface partiellement opaque)
      ↓ 10-20 min
Comprendre le verbe de la couche
      ↓ 1-2 h
Monter, optimiser, atteindre le seuil de fouille
      ↓
Convertir ses ressources en points de fouille (taux brutal)
      ↓
Choisir les objets qu'on emporte ; le reste est abandonné
      ↓
Descendre : nouvelles règles, artefacts en poche
```

---

## 4. Ressources

Il n'y a **pas de ressource commune** au jeu, et c'est le point le plus important. Chaque strate a la sienne, avec sa propre unité, son propre ordre de grandeur et sa propre notation.

Trois choses seulement traversent les couches :

| Ressource | Rôle | Portée | Notation |
|---|---|---|---|
| **Profondeur** | l'étage courant | 1 → 8 | **entier, toujours** |
| **Artefacts** (A) | objets emportés depuis les strates du dessus, choisis dans le catalogue de la strate quittée | s'usent d'un niveau à chaque descente | unité, jamais plus de 3 chiffres |
| **Compréhension** (κ) | méta-savoir du joueur sur la structure des incrémentaux | 0 → 100 | % |

Les **points de fouille** ne traversent pas : ils naissent à la descente et s'y dépensent aussitôt. Ce qui n'est pas dépensé est perdu.

**Règle structurante n°1 — la conversion est brutale.** À la descente, la ressource de la strate devient des points de fouille : `points = ⌊log₁₀(valeur_convertible) × 1,4⌋`. Une strate terminée avec 10¹⁵ unités donne 21 points ; une strate terminée avec 10¹⁸ en donne 25. Les points servent aussitôt à choisir, dans le catalogue de la strate quittée, les objets qu'on emporte. Chaque objet a un coût, et ce qui n'est pas emporté est abandonné. **L'écart entre jouer correctement et jouer parfaitement est de quatre points : un objet de plus, ou un meilleur objet à la place d'un moins cher.** Cela retire volontairement tout intérêt au farm : on descend quand on est prêt, pas quand on est optimal.

La **valeur convertible** est toujours un cumul sur la strate, jamais le stock au moment de descendre : dépenser ne coûte rien. Pour le chœur, c'est la quantité cachée de Voix que représentent les barres. Pour la dette, c'est ce qui a été honoré ; en défaut, ce qui l'avait été avant le défaut, si bien que le défaut coûte quelques points et jamais tout. Pour le lit, ce sont les sédiments déposés : le budget y est presque fixe, et il suffit à tout emporter. Le détail par strate est dans la décision D-003.

**Règle structurante n°2 — les artefacts périssent.** Ils perdent un niveau de puissance à chaque descente. Un artefact de la strate 2 est puissant en strate 3, utile en 4, décoratif en 5, inerte en 6. Puissant : effet entier. Utile : effet réduit de moitié. Décoratif : visible, sans effet. Inerte : un caillou. Rien ne s'accumule sur huit couches ; on ne devient jamais un dieu.

**Règle structurante n°3 — la Compréhension, elle, ne se perd pas.** Elle ne donne aucun bonus numérique. Elle **débloque des affichages** : le graphe de dépendances, les formules réelles derrière les boutons, la vitesse d'apprentissage des interfaces opaques. C'est le seul progrès permanent du jeu et il porte sur la lecture, pas sur la puissance.

---

## 5. Les huit strates

Chacune est un incrémental autonome. Le tableau est le cœur du document : c'est là que se joue « sept jeux, pas sept skins ».

| # | Strate | Verbe | Ressource | Boucle propre | Interface | Durée cible |
|---|---|---|---|---|---|---|
| 1 | **La surface** | produire | Crédits | incrémental orthodoxe, à clic puis auto | tableau de bord moderne, propre, tiède | 1 h 15 |
| 2 | **Les caves** | stocker | Grain | production **saisonnière** : ça ne monte pas, ça oscille ; il faut lisser | bois, registres, calendrier circulaire | 2 h |
| 3 | **L'atelier** | assembler | Pièces | grille spatiale : les générateurs se posent, s'adjacent, se gênent | plan, souris, encombrement | 2 h 30 |
| 4 | **Le réseau** | relier | Flux | graphe de nœuds : rien ne produit seul, tout est débit et goulot | schéma, câbles, jauges | 2 h 30 |
| 5 | **Le chœur** | accorder | Voix | pas de nombres : des hauteurs et des rapports. On règle des ratios à l'oreille et à l'œil | vertical, coloré, sonore | 2 h |
| 6 | **La dette** | promettre | Engagements | **rien n'est produit** : on emprunte sur l'avenir, tout arrive à échéance | tableaux d'échéances, rouge et noir | 3 h |
| 7 | **Le lit** | attendre | Sédiments | temps réel pur, quasi aucune interaction, tout se dépose | presque vide, grain, lenteur | 2 h |
| 8 | **Le fond** | — | — | voir §10 | — | 20 min |

Trois strates méritent un mot :

**Le chœur (5)** est la seule strate sans compteur numérique visible. Les quantités sont des hauteurs de barres et des rapports. Le joueur qui vient de quatre strates chiffrées passe dix minutes désorienté, puis découvre qu'il peut estimer très correctement à l'œil. C'est le pic de la mécanique de Compréhension.

**La dette (6)** inverse la flèche du temps : chaque « générateur » est une promesse qui rapporte tout de suite et se paie plus tard, à une date affichée. La strate entière est un problème d'échéancier. C'est la plus longue et la plus dure, placée exprès juste avant la plus contemplative.

**Le lit (7)** ne demande presque rien : ça se dépose, en temps réel, y compris hors ligne, et les seules actions sont de rares décisions de placement. Après *La dette*, c'est un soulagement — et c'est aussi la strate qui rend le jeu jouable en deux semaines sans y toucher tous les jours.

---

## 6. Les seuils de fouille — la mécanique de descente

On ne descend jamais en atteignant un nombre. Chaque strate a **sa** condition, et cette condition dit quelque chose de la civilisation qui l'habitait :

| Strate | Condition de descente |
|---|---|
| 1 | Atteindre un palier de production (le seul seuil banal du jeu — c'est le tutoriel) |
| 2 | Passer **trois hivers** sans rupture de stock |
| 3 | Construire un assemblage qui fonctionne **sans aucune case libre** |
| 4 | Faire tourner le réseau sans goulot pendant 5 minutes réelles |
| 5 | Tenir un accord juste pendant 90 s |
| 6 | **Solder toutes ses dettes** — beaucoup de joueurs descendront en défaut, ce qui est une autre fin de strate, autorisée et notée |
| 7 | Aucune : la descente arrive **toute seule**, par sédimentation, au bout d'environ 2 h |
| 8 | — |

La strate 7 est le seul moment du jeu où le joueur ne décide pas, et il ne s'en rend compte qu'après.

---

## 7. Les artefacts (l'arbre d'upgrades, réparti dans le temps)

Un artefact est un objet de la couche du dessus, désigné par le nom que lui donnent **ceux d'en bas**. Une turbine devient « la roue chaude ». Un contrat devient « le papier qui oblige ».

- **Nombre total : 34 artefacts**, répartis dans les catalogues des strates 1 à 7, de 3 à 6 objets par strate. À chaque descente, le joueur choisit ceux qu'il emporte avec ses points de fouille (règle n°1). Selon le parcours, 5 à 9 artefacts sont actifs (puissants ou utiles) dans une strate donnée.
- Le choix se fait sous les noms d'en haut, avec le coût et la famille d'effet, mais sans l'effet exact : on emporte « la turbine » et on découvre en bas « la roue chaude ».
- Effets : multiplicateurs modestes (×1,2 à ×2), déblocages d'affichage, raccourcis d'apprentissage, et 6 artefacts **à effet unique et étrange** (par exemple : *rend visible une ligne de texte de la strate inférieure, avant d'y descendre*).
- **Plafond dur : le cumul des multiplicateurs d'artefacts ne dépasse jamais ×4 dans une strate donnée** (invariant I2). Au-delà, le noyau réduit tous les multiplicateurs dans la même proportion. Aucune couche ne se traverse en pilote automatique grâce à l'équipement.
- Le modèle complet est décrit dans `docs/artefacts.md` (décision D-002).

La dévaluation est affichée franchement : chaque artefact porte un niveau d'usure visible, et le joueur voit ses trésors devenir des cailloux au fil de la descente. C'est le mécanisme émotionnel central du jeu, répété sept fois.

---

## 8. La Compréhension — le seul progrès qui traverse

Chaque strate commence avec une interface **partiellement opaque** : libellés inconnus, unités inconnues, boutons dont la fonction n'est pas décrite. La Compréhension accélère la levée de cette opacité :

- κ = 0 : environ 20 minutes pour comprendre le verbe d'une strate.
- κ = 50 : environ 8 minutes, et le graphe de dépendances est fourni.
- κ = 100 : environ 3 minutes, et les formules réelles sont affichées.

κ augmente par **actes de compréhension** et non par temps passé : trouver le goulot avant que le jeu ne le signale, atteindre un seuil de fouille sans consulter l'aide, réussir une strate sans artefact. Le joueur qui apprend vraiment va de plus en plus vite ; celui qui brute-force refait vingt minutes de découverte à chaque étage.

C'est l'écho direct de la thèse de *La langue morte* — **le vrai upgrade est la compréhension du joueur** — mais appliqué à la grammaire des incrémentaux plutôt qu'à une langue.

---

## 9. Courbes, invariants, rythme

### Rythme cible

| Strate | Temps cumulé | Ordre de grandeur local | Artefacts actifs à l'arrivée | Points de fouille au départ | κ |
|---|---|---|---|---|---|
| 1 | 0–1 h 15 | 10⁹ | 0 | 12 | 0 → 8 |
| 2 | 1 h 15–3 h 15 | 10⁶ (grain, échelle basse **exprès**) | 5 | 8 | 8 → 22 |
| 3 | 3 h 15–5 h 45 | 10¹² | 9 | 16 | 22 → 38 |
| 4 | 5 h 45–8 h 15 | 10¹⁵ | 8 | 21 | 38 → 55 |
| 5 | 8 h 15–10 h 15 | sans nombres (≈ 10¹⁰ en interne) | 8 | 14 | 55 → 70 |
| 6 | 10 h 15–13 h 15 | 10²⁰ (dettes) | 8 | 28 | 70 → 85 |
| 7 | 13 h 15–15 h 15 | 10³ (sédiments) | 8 | 4 | 85 → 96 |
| 8 | 15 h 15–15 h 35 | — | 7 (sans effet mécanique) | — | 100 |

*(15–16 h de trajet principal, 18–25 h pour une partie réelle avec temps morts et exploration.)*

*Artefacts actifs : puissants ou utiles, pour un jeu correct et avec la répartition indicative du catalogue (voir `docs/artefacts.md`). Points de fouille : `⌊log₁₀(valeur) × 1,4⌋` pour l'ordre de grandeur de la strate ; un jeu parfait en donne environ 4 de plus.*

### Invariants d'équilibrage

- **I1** — **Aucune strate ne partage la ressource, l'unité ni la notation d'une autre.** Si deux strates se jouent pareil, l'une des deux est à refaire.
- **I2** — Cumul des multiplicateurs d'artefacts ≤ ×4 par strate.
- **I3** — L'ordre de grandeur local **ne croît pas de façon monotone** à travers les strates (voir le tableau : 10⁹ puis 10⁶ puis 10¹² puis 10¹⁵ puis rien puis 10²⁰ puis 10³). Le joueur ne peut pas s'appuyer sur son intuition de puissance : chaque couche a sa propre échelle et il doit la réapprendre.
- **I4** — Aucun seuil de fouille ne se franchit par accumulation seule. Six des huit demandent une compréhension de la boucle locale.
- **I5** — **Toute strate est terminable en moins de 3 h 15 sans aucun artefact.** Le jeu ne doit jamais dépendre de ce qui a été récolté au-dessus, sinon une mauvaise strate 4 bloque la strate 5 et le jeu casse à 8 heures de partie — le pire endroit possible.

### Hors-ligne

80 %, plafond 12 h, sauf strate 7 (100 %, sans plafond — la sédimentation est du temps réel, c'est sa nature) et strate 6 (**les échéances tombent hors ligne** : revenir après deux jours peut signifier revenir en défaut ; annoncé explicitement à l'entrée de la strate).

---

## 10. Arc narratif — huit couches

**Strate 1 — La surface.** Un incrémental contemporain, compétent, tiède. C'est un tutoriel déguisé en jeu ordinaire. Le premier acte de fouille est une transgression douce : il y a un bouton *creuser* et personne n'a dit de l'utiliser.

**Strate 2 — Les caves.** Le grain, les saisons. Premier choc : la courbe n'est plus une exponentielle mais une sinusoïde. Le joueur apprend qu'il n'y a pas une grammaire des incrémentaux, il y en a plusieurs.

**Strate 3 — L'atelier.** L'espace entre en jeu. Écho volontaire au concept n°8 (*L'horloger*) sans en dépendre.

**Strate 4 — Le réseau.** Rien ne produit seul. Le joueur cesse d'acheter des générateurs et se met à réparer des goulots.

**Strate 5 — Le chœur.** Les nombres disparaissent. C'est la strate dont on se souvient.

**Strate 6 — La dette.** La plus longue, la plus dure, la plus sombre. Tout ce qui est produit est déjà dû. Beaucoup de joueurs finissent en défaut, ce qui est traité sans jugement — et la couche du dessous porte les traces des deux issues.

**Strate 7 — Le lit.** Presque rien à faire. Le sédiment tombe. Le joueur revient de temps en temps. Après vingt heures de systèmes, c'est là que le jeu parle enfin, en trois ou quatre textes très courts.

**Strate 8 — Le fond.** Pas de ressource, pas de générateur, pas de bouton d'achat. Une seule chose : les traces des sept couches, superposées, et la possibilité de les lire dans n'importe quel ordre. Ce n'est pas un jeu ; c'est la salle de lecture. Vingt minutes.

---

## 11. Fins

Au fond, deux options :

- **Remonter.** Refaire le chemin à l'envers, en accéléré (12 minutes), en traversant les sept strates désormais vides — les interfaces sont là, les compteurs à zéro, personne. Puis la surface, telle qu'on l'a laissée, avec sa production qui tourne toujours. Fin.
- **Rester.** Le jeu se ferme sur le fond. La sauvegarde est marquée « au fond ». Rouvrir la partie rouvre le fond, indéfiniment. Il n'y a pas de contenu supplémentaire et le jeu ne prétend pas le contraire.

Pas de score. La seule statistique affichée en fin de partie est la Profondeur : **8**.

**Épilogue (après *Remonter*)** — « La coupe » : une vue verticale unique des huit strates, avec pour chacune la durée qu'on y a passée, le seuil franchi, les artefacts abandonnés. Une image, une page. C'est aussi le meilleur visuel de communication du jeu et il ne coûte presque rien.

---

## 12. Interface et production d'assets

**Il n'y a pas une interface, il y en a huit.** C'est le coût du concept et il est irréductible : chaque strate a sa palette, sa typographie, sa disposition, ses sons. Une couche qui ressemble à la précédente est une couche ratée.

Cadre commun, minimal et permanent : un bandeau supérieur de 24 px, identique dans les huit strates, avec **la Profondeur, les artefacts et le bouton de fouille**. C'est le seul élément stable du jeu et il devient, à force, étrangement rassurant.

**Coût de production réel** — le plus élevé des douze, et de loin :
- 7 boucles d'incrémental conçues et équilibrées séparément (l'essentiel du travail) ;
- 8 directions artistiques légères mais distinctes ;
- ~5 000 mots ;
- une architecture de code où chaque strate est un **module indépendant** partageant seulement le bandeau, la sauvegarde et la table des artefacts.

**Estimation honnête : 6 à 8 fois le budget de *La langue morte*.** Ce n'est pas un premier jeu, c'est le troisième.

---

## 13. Risques

| | Risque | Réponse |
|---|---|---|
| R1 | **La tentation de la génération procédurale infinie** | À refuser fermement. Une profondeur infinie transforme sept jeux en un seul générateur de skins, et détruit exactement ce qui rend le concept unique. 8 strates finies, annoncées comme telles |
| R2 | Volume de travail (7 jeux à équilibrer) | Réponse de production : les strates sont **séquentielles et indépendantes**. On peut livrer 1–3 en accès anticipé et ajouter les suivantes. C'est le seul des douze qui supporte une sortie par tranches |
| R3 | La strate 6 (la dette) fait décrocher à 12 h de jeu | La strate 7 juste après est le contrepoids, et le défaut de paiement est une issue acceptée. Playtest prioritaire |
| R4 | Le joueur perd le fil narratif sur trois semaines | Le bandeau permanent, la coupe consultable à tout moment, et un texte de rappel de 3 lignes à chaque reprise de session |
| R5 | Les strates deviennent inégales en qualité | Critère de recette : chaque strate doit tenir **comme jeu autonome de 2 h**. Celle qui ne tient pas est retirée et le jeu passe à 7 couches. Mieux vaut 6 bonnes que 8 moyennes |

---

## 14. MVP falsifiable

Un mois, pas un week-end — c'est la contrainte de ce concept :

- Strates 1 et 2 complètes, avec la descente et la conversion en artefacts.
- Pas de Compréhension, pas d'autres strates, pas de fin.
- **Obligatoire : le passage de 1 à 2.** L'écran qui change entièrement, les crédits convertis en 12 points de fouille et le choix des objets de la surface qu'on emporte, la ressource qui devient du grain, et **la découverte que la courbe n'est plus exponentielle mais saisonnière**.

**Le test** : au bout de dix minutes dans la strate 2, le joueur essaie-t-il de jouer comme en strate 1 — et est-ce que le moment où il comprend que ça ne marche pas est agréable ou frustrant ? Si c'est frustrant, le concept ne tient pas, et les six strates suivantes ne le sauveront pas.

---

## 15. Notes d'implémentation

- **Architecture en modules.** Chaque strate est un module autonome : son état, son tick, son rendu, ses règles. Le noyau ne connaît que `{ profondeur, artefacts[], κ, meta }`. Ne jamais factoriser les boucles entre strates « pour économiser » : c'est ainsi que sept jeux redeviennent un seul.
- La conversion en artefacts se fait dans le noyau, pas dans les modules : une seule fonction transforme la valeur convertible exposée par le module en points de fouille, et l'écran de choix est lui aussi générique. Le catalogue est une donnée du noyau (la table des artefacts).
- Sauvegarde : un objet par strate, conservé même après la descente (nécessaire pour la remontée finale et pour la coupe).
- L'opacité d'interface est une couche de rendu générique (labels remplacés par des glyphes, valeurs masquées) paramétrée par κ — écrite une fois, réutilisée huit fois. C'est la seule vraie mutualisation possible.
- Strate 7 : la sédimentation doit être calculée à partir de l'horodatage, pas du temps de session, y compris sur des semaines.

---

## À trancher ensuite

1. **Est-ce le bon projet maintenant ?** Réponse honnête : non, pas en premier. C'est le concept le plus ambitieux des douze, et il demande un jeu déjà terminé derrière soi. À garder comme projet n°3.
2. Verrouiller R1 par écrit : 8 strates, jamais plus, jamais de procédural.
3. Concevoir les strates 2 et 5 en détail (les deux plus originales) avant les autres — si celles-là ne tiennent pas, le concept ne tient pas.
4. Prototyper : strates 1 et 2 seulement, avec la descente.

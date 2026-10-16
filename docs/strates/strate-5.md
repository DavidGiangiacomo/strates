# Strate 5 — Le chœur

*Fiche de design, issue [#7](https://github.com/DavidGiangiacomo/strates/issues/7). Première version, écrite avant le MVP : elle sera révisée après lui ([#63](https://github.com/DavidGiangiacomo/strates/issues/63)). Les chiffres viennent d'une simulation grossière de sept profils de joueur (§ 4), à refaire avec le simulateur headless quand la boucle sera codée ([#71](https://github.com/DavidGiangiacomo/strates/issues/71), [#102](https://github.com/DavidGiangiacomo/strates/issues/102)).*

*Choix proposés le 13 octobre 2026, à trancher à la relecture :*
- *la hauteur d'une barre **est** la note que chante le pupitre : régler un rapport de hauteurs, c'est accorder ;*
- *acheter dérange : un pupitre qui reçoit un rang **détonne**, et il faut le réaccorder ;*
- *le seuil demande **le point d'orgue**, le dernier achat de la strate, puis l'accord plein tenu 90 s ;*
- *à l'écran de fouille, la valeur s'écrit en barres, et les points restent des chiffres ;*
- *le chœur n'expose aucune formule ;*
- *l'absence fait venir des Voix, mais ne compte pas dans les 90 s.*

*Renvois : « §6 » désigne une section du [design doc](../design-doc.md), « § 6 » une section de cette fiche.*

Le design doc demande de concevoir cette strate avant les autres : avec les caves, c'est la plus originale, et « si celles-là ne tiennent pas, le concept ne tient pas ». **L'avis est au § 12 : elle tient sur le papier, à deux conditions qu'un prototype doit vérifier.**

## 1. Identité

| | |
|---|---|
| Verbe | accorder |
| Ressource | Voix |
| Unité et notation | **Aucun chiffre, nulle part dans la strate.** Une quantité est une barre : sa hauteur, sa largeur, son éclat. Un prix est une jauge qui se remplit. Une comparaison est un rapport entre deux barres, qu'on lit à l'œil. Aucune autre strate n'écrit ses quantités sans nombres (I1). |
| Ordre de grandeur final | Sans nombres. En interne, ≈ 10¹⁰ Voix venues : 1,5 × 10¹⁰ au seuil en simulation. C'est entre les 10¹⁵ du réseau et les 10²⁰ de la dette, et le joueur n'en sait rien (I3). |
| Durée cible | 2 h avec les objets d'un jeu correct ; en simulation, 2 h 20 sans aucun artefact (§ 4, § 8). |
| κ à l'entrée → à la sortie | 55 → 70, au mieux |

**Le vocabulaire.**
- Un **pupitre** est un groupe de chanteurs qui tient une note. À l'écran, c'est une barre verticale. Le chœur en compte huit au plus : le **bourdon**, qui ne bouge jamais, et sept autres.
- La **hauteur** d'un pupitre est sa note, et c'est la hauteur de sa barre. Le bourdon vaut 1 ; les autres se règlent entre 1 et 4,2 fois le bourdon.
- Les **rangs** d'un pupitre sont ses rangées de chanteurs, et la largeur de sa barre.
- Les **Voix** sont les gens qui viennent chanter : un chœur juste en attire. Celles qui arrivent attendent d'être placées. Les placer est la seule dépense de la strate.

## 2. La civilisation

Un peuple qui chantait ensemble, et qui ne comptait pas. Il ne savait pas combien il était : il savait si c'était juste. Ses seules mesures étaient des rapports : cette voix, deux fois plus haute que celle-là ; ce pupitre, une fois et demie cet autre.

Il optimisait **la justesse**. Un chœur juste attirait des voix, les voix nouvelles dérangeaient l'accord, et il fallait le refaire, plus large. Tout son savoir tenait dans ce geste : faire entrer, puis accorder.

Il a fini par saturation. Un jour, l'accord a été plein : huit pupitres, tous liés, plus rien de faux. Y ajouter une voix l'aurait défait. Ils l'ont tenu, et ils n'ont plus rien ajouté. C'est la première civilisation du jeu dont le dernier geste a été de s'abstenir.

La bible narrative ([`bible.md`](../bible.md), § 4) en donne la suite : sa voix, ses mots, ses traces, et ce qu'il a trouvé sous la nef, des tablettes dont il a pavé le sol, face écrite contre la terre.

## 3. Boucle courte

On ne produit pas, on n'achète pas plus gros : on **accorde**. Le chœur attire des Voix selon sa justesse. On les place dans les pupitres, ce qui les fait détonner, et on réaccorde. La boucle tient en trois temps : **placer, écouter, régler**.

### Les rapports justes

Deux pupitres sont dans un rapport juste quand leurs hauteurs sont entre elles comme deux petits nombres entiers, de 1 à 6. Entre 1 et 4 fois le bourdon, il y en a neuf.

| Rapport | À l'œil | Nom, pour nous |
|---|---|---|
| 6 : 5 | un cinquième de plus | tierce mineure |
| 5 : 4 | un quart de plus | tierce majeure |
| 4 : 3 | un tiers de plus | quarte |
| 3 : 2 | une fois et demie | quinte |
| 5 : 3 | deux tiers de plus | sixte |
| 2 : 1 | le double | octave |
| 5 : 2 | deux fois et demie | — |
| 3 : 1 | le triple | — |
| 4 : 1 | le quadruple | — |

**L'écart** d'une paire est sa distance au rapport juste le plus proche, ou à l'unisson. On le compte en cents (un centième de demi-ton ; une octave en vaut 1 200). **La marge** vaut 15 cents : moins de 1 % de la hauteur. Pour x = écart / marge, une paire est :

| État | Écart | Facteur m | À l'écran et à l'oreille |
|---|---|---|---|
| **juste** | x ≤ 1, autour d'un rapport juste | de 2 (pur) à 1 : `2 − x` | un arc relie les deux barres ; le son est lisse |
| **fausse** | 1 < x ≤ 3 | descend jusqu'à 0,5 à x = 2, puis remonte à 1 | les deux barres battent : leur sommet tremble, le son aussi |
| **étrangère** | x > 3 | 1 | rien |
| **confondue** | x ≤ 1, autour de l'unisson | 1 | les deux barres ont la même hauteur |

- Juste au-delà de l'unisson, la paire est fausse elle aussi : deux voix presque à la même hauteur battent plus que toutes les autres.
- Les neuf rapports comptent autant. C'est le plus simple à lire ; l'équilibrage dira s'il faut que les rapports difficiles rapportent davantage (§ 13).

### Ce que le chœur attire

`Voix par seconde = Σ ampleur(p) × résonance(p)`, sur tous les pupitres.
- **L'ampleur** d'un pupitre vaut `1,5^rangs`.
- **Sa résonance** est le produit des facteurs m de ses paires avec les sept autres. Un pupitre juste avec cinq autres porte 32 fois plus que seul ; un pupitre faux avec deux autres, quatre fois moins.
- La résonance d'un pupitre est son **éclat** à l'écran : un pupitre bien lié brille, un pupitre faux est terne. On voit lequel cloche.

Les Voix venues s'ajoutent au cumul (la valeur convertible, § 9) et aux **Voix qui attendent**, que le joueur place.

### Placer

Il y a quatre choses à faire des Voix qui attendent. Chacune a sa jauge, qui se remplit ; pleine, on peut la jouer.

| Id | Geste | Prix, en Voix | Effet |
|---|---|---|---|
| `rang` | un rang de plus dans un pupitre | `10 × 2,05^rangs` du pupitre | son ampleur × 1,5 ; **le pupitre détonne** |
| `pupitre` | faire entrer un pupitre | 7 100, 230 000, 3,3 × 10⁶, 2,9 × 10⁷, 2,4 × 10⁸, 10⁹ (du 3ᵉ au 8ᵉ) | il entre faux, aussi large que le plus mince |
| `ecoute` | l'écoute d'un pupitre | 81 000, 1,2 × 10⁶, 10⁷, 8,4 × 10⁷, 3,5 × 10⁸, 1,1 × 10⁹, 3,2 × 10⁹ (de la 1ʳᵉ à la 7ᵉ) | un pupitre qui s'écoute revient seul à sa place |
| `orgue` | le point d'orgue | 2,3 × 10⁹ | l'accord plein commence à compter (§ 4) |

- **Détonner.** Le pupitre qui reçoit un rang glisse de 25 à 60 cents, vers le haut ou vers le bas, tiré par la graine. C'est toujours assez pour sortir de la marge : ses paires justes deviennent fausses. Le bourdon ne détonne pas.
- **L'entrée d'un pupitre.** Il entre à une hauteur tirée par la graine, fausse avec au moins un autre et juste avec aucun. Il a autant de rangs que le pupitre le plus mince : il compte tout de suite.
- **L'écoute.** Elle apparaît avec le quatrième pupitre. Un pupitre qui s'écoute et qui détonne revient en 6 secondes là où le joueur l'avait posé. Il sonne faux pendant ce temps, mais il n'y a plus rien à faire.
- **Un rang appartient à un pupitre**, et chaque pupitre a son prix. Le rang le moins cher est toujours celui du pupitre le plus mince : le chœur s'élargit de partout.
- Tous les prix sont à régler à l'équilibrage ([#102](https://github.com/DavidGiangiacomo/strates/issues/102)).

### Régler

- **Tirer** le sommet d'une barre la règle en gros, à la souris ou au doigt.
- **La molette**, ou les flèches haut et bas sur un pupitre choisi au clavier, la règlent finement : 2 cents par cran, 10 avec Maj. Sur un écran tactile, deux boutons au pied de la barre font de même.
- Régler ne coûte rien, et rien n'empêche de régler pendant qu'un pupitre revient.
- **À l'œil d'abord, à l'oreille ensuite.** On pose la barre à peu près au double, ou à une fois et demie. Puis on regarde le battement : il ralentit quand on approche, et s'arrête quand c'est juste. C'est le geste d'accorder une guitare.

### L'arrivée

Le bourdon et un deuxième pupitre chantent déjà, sans aucun rang de plus. Le deuxième est posé 32 cents au-dessus d'une fois et demie le bourdon : la paire est fausse, et les deux barres battent. La première jauge de rang se remplit en 9 secondes.

### État et actions, pour la boucle ([#71](https://github.com/DavidGiangiacomo/strates/issues/71))

```ts
interface Pupitre {
  hauteur: number;        // en hauteurs de bourdon, de 1 à 4,2 ; le bourdon vaut 1
  rangs: number;
  ecoute: boolean;
  place: number;          // la hauteur où le joueur l'a posé : c'est là qu'il revient
  retour: number | null;  // secondes avant le retour d'un pupitre qui s'écoute
}

interface EtatChoeur {
  pupitres: Pupitre[];           // le bourdon d'abord, puis dans l'ordre d'entrée
  attente: number;               // les Voix qui attendent d'être placées
  cumul: number;                 // toutes les Voix venues : la valeur convertible
  orgue: boolean;                // le point d'orgue est acquis
  tenue: number;                 // secondes d'accord plein tenu, depuis le point d'orgue
  seuilAtteintA: number | null;  // valeur de `temps` au seuil
  temps: number;                 // secondes simulées depuis l'arrivée, absences comprises
  rapportsTenus: string[];       // les rapports justes déjà tenus : leurs repères (§ 7)
  alea: EtatAlea;                // les entrées et les glissements
  multiplicateurs: { bourdon: number; tenue: number };  // artefacts, relus à chaque tick
}

type ActionChoeur =
  | { type: "regler"; pupitre: number; hauteur: number }
  | { type: "rang"; pupitre: number }
  | { type: "pupitre" }
  | { type: "ecoute"; pupitre: number }
  | { type: "orgue" };
```

- **`tick(dt)`** ajoute les Voix venues, fait avancer les retours, et compte la tenue. Entre deux actions, la production ne change qu'au retour d'un pupitre : le pas est coupé à ce moment-là.
- **`pasMax`** vaut 1 s.
- **`regler`** borne la hauteur entre 1 et 4,2. La vue en envoie une par tick au plus pendant un glisser.
- La borne haute est à 4,2, et non à 4 : une barre poussée au maximum ne tombe sur aucun rapport juste.
- Un achat impossible est ignoré sans erreur.
- **Seul aléatoire** : la hauteur d'entrée d'un pupitre et le glissement d'un pupitre qui détonne. Il passe par la graine de la strate.

## 4. Boucle moyenne et seuil de fouille

### Progression

Les temps sont ceux du joueur « naturel » de la simulation, sans aucun artefact ; avec les objets d'un jeu correct, tout va un cinquième plus vite (§ 8).

| Temps | Étape | Contenu |
|---|---|---|
| 0 – 7 min | Deux voix | Le bourdon et un pupitre. On découvre qu'une barre se tire, que le battement s'arrête à certaines hauteurs, et qu'un rang de plus le fait revenir. |
| 7 – 36 min | Trois, puis quatre pupitres | Chaque pupitre qui entre doit s'accorder au bourdon **et** aux autres. Le double, le triple et le quadruple se trouvent à l'œil. L'écoute apparaît à 20 minutes. |
| 36 – 84 min | Les rapports difficiles | Cinquième et sixième pupitres. Les rapports évidents sont pris : il faut un quart de plus, un tiers de plus. Certaines paires ne peuvent plus être justes : on choisit lesquelles. Les écoutes s'achètent une à une. |
| 84 – 138 min | Le chœur plein | Septième et huitième pupitres. Il reste à trouver un accord où plus rien n'est faux, et à payer le point d'orgue. |
| 138 – 140 min | La tenue | Quatre-vingt-dix secondes sans rien ajouter. |

La boucle moyenne du §3, c'est **l'entrée d'un pupitre** : six fois dans la strate, un inconnu arrive faux, et l'accord est à refaire, plus large. Entre deux entrées, on élargit le chœur rang par rang, et chaque rang redemande un réglage. Le joueur naturel fait 118 achats et 45 réglages. Après la première heure, il décide encore 5 à 8 fois par tranche de 10 minutes, et n'attend jamais plus de 5 min 30 entre deux achats.

### Quel accord

Un pupitre peut être juste avec le bourdon et faux, ou étranger, avec un autre. Huit pupitres font 28 paires, et elles ne peuvent pas toutes être justes.
- **Au mieux : 21 paires justes sur 28**, par exemple avec les hauteurs 1, 6:5, 5:4, 3:2, 5:3, 2, 5:2 et 3. C'est le résultat d'une recherche exhaustive sur 63 hauteurs candidates.
- **L'accord qui vient naturellement** (1, 5:4, 4:3, 3:2, 2, 5:2, 3, 4) en a 19.
- **Sept rapports justes pris au hasard** en donnent de 15 à 21.
- **Qui accorde de proche en proche** se trompe. Trois « une fois et demie » empilées donnent 27:8 ; avec un pupitre à 10:3, tout proche, la paire est fausse, alors que chacun est juste avec son voisin. Il faut accorder sur le bourdon. C'est la comma des musiciens, et le jeu n'a aucune règle pour elle : elle sort des rapports.

### Le seuil

- **Condition** : le point d'orgue acquis, puis l'**accord plein** tenu 90 secondes.
- **L'accord plein** : les huit pupitres chantent, aucune paire n'est fausse ni confondue, et tous sont liés par des paires justes, directement ou de proche en proche.
- **Tenir** : dès qu'une paire devient fausse, le compte repart de zéro. Or un rang de plus fait détonner. Tenir, c'est donc **ne plus rien ajouter**. Régler reste permis.
- **Le point d'orgue** est le dernier achat de la strate, et le plus cher : il vient 27 minutes après le huitième pupitre. Il donne à la strate un dernier but, une fois le chœur au complet, et à la tenue un début qu'on a voulu. Simulée sans lui, la strate garde sa durée si le huitième pupitre coûte le double ; mais sa dernière étape dure alors 47 minutes d'un seul tenant, et les points tombent à la frontière entre 13 et 14.
- **Une fois atteint**, le seuil le reste.
- **Ce qu'il dit de la civilisation** : elle ne voulait pas le chœur le plus grand, elle voulait un accord auquel on ne puisse plus rien ajouter. Le seuil se franchit en s'abstenant.
- **Pas d'accumulation seule (I4)** : accumuler défait l'accord. En simulation, le joueur qui achète tout et ne règle rien a cinq pupitres après trois heures, et six après cinq. Celui qui accorde mais n'élargit jamais attend le troisième pupitre 36 minutes, au lieu de 7, et n'en voit pas d'autre en cinq heures.
- **Issues** : une seule.
- **L'objectif n'est jamais affiché comme tel.** Quand l'accord est plein et le point d'orgue acquis, une lueur monte le long de la voûte, en 90 secondes. Elle retombe au premier battement. Le joueur voit ce qui la fait monter, et ce qui la fait tomber.

**Une réserve, mesurée** : aux prix de cette fiche, la retenue n'est jamais mise à l'épreuve. Le joueur qui vient de payer le point d'orgue n'a plus rien à dépenser, et rien ne redevient abordable en 90 secondes. En simulation, un joueur qui achète dès qu'il peut ne casse jamais la tenue, avec ou sans point d'orgue. La règle « ne plus rien ajouter » est donc vraie, mais le joueur peut finir la strate sans l'avoir rencontrée. C'est le défaut le plus net de cette version (§ 13, question 3).

### Après le seuil

- Le chœur continue, et les Voix viennent encore. On peut encore élargir, et retenir ensuite.
- Rester rapporte peu : aucun point de plus en 10 minutes, un en une heure, deux en deux heures (§ 9).
- **Filet** : comme partout, si le joueur n'a pas creusé 5 minutes après le seuil, une fissure part du pied du bourdon et monte vers le bouton du bandeau (`src/noyau/logique/filet.ts`).

### En simulation

Sept joueurs automatiques, sans aucun artefact. Le script est un brouillon en JavaScript, joint à l'issue ; il ne partage rien avec le code du jeu.
- Tous règlent un pupitre faux avant d'acheter autre chose, sauf le joueur réflexe.
- Un réglage prend de 6 à 15 secondes, et s'arrête à 1 à 6 cents du rapport pur, selon le joueur.

| Profil | Jeu | Seuil | Points | Paires justes |
|---|---|---|---|---|
| parfait | le meilleur accord ; règle en 6 s, à 1 cent ; passe toutes les 2 s | 1 h 28 | 14 | 21 |
| bon | le rapport le plus juste avec les autres, à chaque entrée | 2 h 05 | 14 | 21 |
| naturel | le double, le triple, le quadruple, puis les autres ; passe toutes les 5 s | 2 h 20 | 14 (1,5 × 10¹⁰) | 19 |
| apprend | réflexe jusqu'à 8 min, puis naturel | 2 h 19 | 14 | 19 |
| distrait | naturel ; passe chaque minute, et achète alors par lots | 2 h 39 | 14 | 19 |
| prudent | naturel ; ne dépense jamais plus du dixième de ce qui attend | 2 h 41 | 13 | 19 |
| hasard | un rapport juste au hasard à chaque entrée, jamais revu | de 2 h 14 à 3 h 51 selon la graine | 14 | 15 à 21 |
| réflexe | achète tout dès qu'il peut, ne règle rien | jamais | 10 ou 11 après 3 h | 0 à 4 |

- **La durée dépend de l'accord** : chaque paire juste double deux pupitres. Le joueur « hasard » montre le risque : sur 12 graines, 5 dépassent 3 h 15. Un vrai joueur revoit un accord qui stagne ; ce profil ne le fait jamais.
- **Les points ne dépendent presque pas du jeu** : les prix fixent ce qu'il faut de Voix pour arriver au seuil. Bien jouer fait gagner du temps, pas des points (§ 9).

## 5. Le choc d'arrivée

Le joueur arrive du réseau. Quatre strates lui ont appris trois réflexes :
- **lire le nombre** : chercher le compteur, la jauge chiffrée, le maillon le plus faible ;
- **acheter dès qu'on peut** ;
- **plus, c'est mieux** : relever ce qui est bas, pousser au maximum.

Le chœur les prend tous les trois à contre-pied. Mais il ne punit pas : c'est la différence avec les caves. Ici, les vieilles habitudes ne font pas échouer. Elles ne mènent nulle part.

### Ce qu'il fait

1. **Il cherche le nombre.** Il n'y en a pas : ni au survol, ni dans les jauges. Des barres, deux qui tremblent, et un son qui bat.
2. **Il achète.** La jauge au pied d'une barre est pleine en 9 secondes. Il clique : la barre s'élargit, glisse un peu, et le battement change. Il recommence. En simulation, le joueur réflexe fait 20 achats en dix minutes.
3. **Il pousse une barre au maximum**, ou il la ramène à la hauteur du bourdon. Rien ne se passe : tout en haut, la paire est étrangère ; tout en bas, les deux voix se confondent, ou battent plus fort encore.
4. **Le chœur n'avance pas.** Le troisième pupitre entre vers 10 minutes, faux, et rien ne brille. Il faut 38 minutes pour le quatrième, contre 20 au joueur qui accorde ; 99 pour le cinquième, contre 36. À 30 minutes, le joueur réflexe a attiré neuf fois moins de Voix ; à une heure, trente fois moins.

### Pourquoi ça échoue

Dans le réseau, on relevait le maillon le plus faible, et chaque capacité de plus servait. Ici, **aucune barre n'est trop basse** : ce qui compte, c'est le rapport entre deux barres. Et **chaque achat défait ce rapport**. Acheter sans régler, c'est élargir un chœur faux. La grammaire du chœur tient en un ordre : **placer, puis accorder**.

### Comment il le comprend

- **Quelque chose cloche dès la première seconde.** Deux barres tremblent, et le son bat. Rien ne dit quoi, mais c'est le seul mouvement de l'écran.
- **Tirer une barre est le seul autre geste possible.** Dès qu'il la bouge, le battement change de vitesse. Il ralentit en approchant d'une fois et demie le bourdon, puis il s'arrête : un arc se pose entre les deux barres, elles s'éclairent, le son devient lisse, et les jauges se remplissent deux fois plus vite.
- **L'achat suivant le défait sous ses yeux.** Le pupitre glisse, l'arc tombe, le battement revient. Il sait déjà le refaire.
- **Il découvre qu'il voit juste.** « Le double » et « une fois et demie » se posent à l'œil, à peu de chose près. Le battement fait le reste. C'est la promesse du §5 : dix minutes de désorientation, puis la surprise d'estimer très correctement sans aucun chiffre.

### Pourquoi c'est agréable, pas frustrant

- **Rien ne se perd.** Aucune Voix ne repart, aucun pupitre ne se tait. Un chœur faux attire moins, c'est tout.
- **Le premier accord est à une minute**, et il est simple : deux barres, un seul rapport, et la barre est déjà presque au bon endroit.
- **La récompense est immédiate, et elle n'est pas un nombre** : un arc, de la lumière, un son qui se pose. Tout le monde sait d'avance ce qu'est une note fausse. La strate s'appuie sur ce savoir, pas sur un tutoriel.
- **La correction ne demande aucun retour en arrière.** Le profil qui apprend à 8 minutes atteint le seuil en même temps que le joueur naturel.
- **La découverte continue** : chaque pupitre qui entre repose le problème, avec des rapports de moins en moins évidents.

### Ce que les objets n'y changent pas

Les objets d'en haut élargissent le bourdon (§ 8). Ils n'accordent rien : avec les multiplicateurs au plafond, le joueur réflexe n'atteint toujours pas le seuil en cinq heures. Ils peuvent agir dès l'arrivée.

## 6. Interface et direction artistique

Vertical, coloré, sonore (§5). C'est la strate la moins écrite du jeu, et la seule qu'on entend avant de la lire. La réalisation est l'objet de [#86](https://github.com/DavidGiangiacomo/strates/issues/86) ; le son, de [#100](https://github.com/DavidGiangiacomo/strates/issues/100).

- **Disposition** : **la nef**. Huit barres montent du sol, sur toute la hauteur de l'écran, le bourdon à gauche.
  - **La hauteur** d'une barre est sa note, en échelle linéaire : une barre deux fois plus haute chante l'octave. Le bourdon occupe un peu moins du quart de la hauteur.
  - **Sa largeur** montre ses rangs.
  - **Son éclat** montre sa résonance.
  - **Les arcs** : une paire juste est reliée par un arc fin, de sommet à sommet. Plus la paire est pure, plus l'arc est net. À mesure que le chœur s'accorde, les arcs se croisent et dessinent **une voûte**. L'accord plein est une voûte fermée.
  - **Le battement** : le sommet de deux barres fausses tremble, au rythme du vrai battement acoustique, plafonné à 3 par seconde.
  - **Le pied** de chaque barre porte sa jauge de rang ; un pupitre qui s'écoute porte un signe au sommet.
  - **Le porche**, à droite : les Voix qui attendent, et les jauges du prochain pupitre, de la prochaine écoute et du point d'orgue.
  - **Les repères** (§ 7) : de fines encoches sur la barre qu'on règle, aux hauteurs des rapports déjà tenus.
- **Palette** : une pierre sombre, bleu nuit. Les barres ont les couleurs saturées d'un vitrail, une teinte par pupitre. Les arcs sont dorés. C'est la première strate en couleurs vives : la surface était blanc cassé, les caves brunes. À vérifier contre l'atelier et le réseau, quand leurs fiches existeront.
- **Typographie** : presque aucun texte. Les rares mots (l'aide, les notes des jauges une fois levées) sont en petites capitales espacées, comme des indications sur une partition. **Aucun chiffre**, pas même dans l'aide.
- **Mouvement** : vertical et lent. Les barres glissent, elles ne sautent pas.
- **Sons** :
  - chaque pupitre est une voix tenue, de synthèse, avec un timbre de voyelle ; le bourdon est grave, et le pupitre le plus haut reste dans le médium ;
  - le battement s'entend parce qu'il est réel : deux sons presque justes battent d'eux-mêmes, et rien n'est simulé. Le moteur audio ([#46](https://github.com/DavidGiangiacomo/strates/issues/46)) en donne les moyens : des voix tenues de synthèse, aux timbres de voyelles, qui glissent et respirent (`son.voix`, [architecture](../architecture.md), § 5) ;
  - une paire pure fait sonner un harmonique léger ;
  - les voix respirent, le volume général reste bas, et le chœur se tait quand l'onglet est caché. Deux heures de notes tenues fatiguent : c'est un risque (§ 13) ;
  - un navigateur ne joue aucun son avant un geste : le chœur commence au premier clic après un rechargement.
- **Jouable sans le son.** Le battement, les arcs et l'éclat disent tout ce que dit l'oreille. Le son rend le réglage plus rapide et plus plaisant ; il ne porte aucune information qui manque à l'écran.
- **Accessibilité** :
  - *moins de mouvement* : le battement devient une hachure fixe au sommet des barres, plus serrée quand l'écart est grand ;
  - *couleurs* : aucune information ne tient à la teinte seule. Juste, c'est un arc ; faux, un tremblement ou une hachure ;
  - *clavier* : tout se fait au clavier, pupitre par pupitre ;
  - *geste fin* : la marge fait 2 à 3 pixels pour une barre moyenne. Le réglage fin est donc un réglage au cran, pas un geste de précision.
- **Ce qui la distingue** : pas un chiffre, presque pas un mot, et un écran qu'on peut jouer les yeux fermés ou le son coupé.
- **À l'écran de fouille** (§ 9) : deux barres, dans la pierre et les couleurs du chœur.

## 7. Opacité et Compréhension

C'est « le pic de la mécanique de Compréhension » (§5), et pour une raison simple : ici, comprendre **est** le jeu. Ce que κ ne donnera jamais, le joueur doit le trouver seul : lire un rapport à l'œil.

- **Jamais caché** : le battement, les arcs, l'éclat et la lueur de la tenue. Le seuil en dépend, et le chœur doit rester faux par maladresse, pas par ignorance.
- **Jamais montré** : les nombres. Aucune valeur ne se lève, quel que soit κ : la strate est exemptée du délai pour toutes ses valeurs ([`comprehension.md`](../comprehension.md), § 4).
- **Opaque à l'arrivée** :
  - *les noms* : les pupitres, le rang, l'écoute et le point d'orgue sont des signes sans légende ;
  - *les rôles* : ce que font les jauges, ce que veut dire un arc, ce que veut dire le tremblement ;
  - *les repères* : il n'y en a aucun.
- **Levé par l'usage** :
  - le premier arc tenu 5 secondes donne aux arcs et au battement leur légende ;
  - le premier rang donne son nom au rang ; la première écoute, à l'écoute ;
  - **un rapport juste tenu 5 secondes laisse son repère** : désormais, la barre qu'on règle porte une encoche à la hauteur de ce rapport, par rapport au bourdon et par rapport à la dernière barre touchée. Neuf rapports, neuf repères. Les repères ne règlent rien : ils disent où chercher, et le battement dit quand on y est.
- **Levé par le délai** `L(κ)` : les noms et les rôles. À κ = 55, c'est 7 minutes ; pour un jeu correct, qui arrive vers κ = 37, c'est 10 minutes. Ce sont les dix minutes de désorientation du §5.
- **Exemptés du délai** : les repères. Ils ne viennent que de l'usage, ou d'un objet. Le délai dit ce que sont les choses ; il ne dit pas où poser les barres.
- **Actes de compréhension** : 15 points, sur le barème de [`comprehension.md`](../comprehension.md), § 2.

  | Acte | Définition | Points |
  |---|---|---|
  | sans aide | le seuil sans avoir ouvert l'aide | 4 |
  | sans artefact | le seuil sans artefact actif | 3 |
  | un rapport juste réglé à l'œil | poser un pupitre dans la marge d'un rapport qui n'a pas encore son repère, d'un seul glisser, sans réglage fin | 3 |
  | les neuf rapports | avoir tenu au moins une fois chacun des neuf rapports justes | 2 |
  | la tenue au premier essai | atteindre le seuil sans que la lueur soit jamais retombée | 3 |

- **Graphe de dépendances** :
  - la hauteur de deux pupitres donne leur rapport, et le rapport donne l'état de la paire ;
  - les paires d'un pupitre donnent sa résonance ; ses rangs, son ampleur ;
  - l'ampleur et la résonance de tous les pupitres donnent les Voix qui viennent ;
  - les Voix qui attendent paient les rangs, les pupitres, les écoutes et le point d'orgue ;
  - un rang fait détonner : il renvoie à la hauteur. L'écoute ramène ;
  - l'accord plein et le point d'orgue donnent la tenue, et la tenue le seuil.
- **Formules exposées** : **aucune**. Le module n'implémente pas `formules()`.
  - Une formule ramènerait des nombres dans la seule strate qui n'en montre pas.
  - Une formule sans chiffres serait un repère, et les repères existent déjà : ce sont eux, les « formules réelles » du chœur, et on les gagne en jouant.
  - Elle ne servirait presque à personne : à κ = 55, le meilleur joueur n'en verrait qu'une.
  - C'est ce que prévoit déjà [`comprehension.md`](../comprehension.md), § 5. La question de [`architecture.md`](../architecture.md), § 9, est tranchée.

## 8. Artefacts reçus

Les objets du réseau sont **puissants**, ceux de l'atelier **utiles**, ceux des caves **décoratifs** ; ceux de la surface sont des cailloux. Les catalogues des strates 2 à 4 n'existent pas encore ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)) : la réception est donc décrite par famille. Elle sera précisée par [#87](https://github.com/DavidGiangiacomo/strates/issues/87).

| Famille d'effet | Réception dans le chœur |
|---|---|
| multiplicateur | **levier principal `bourdon`** : l'ampleur du bourdon × m. **Levier secondaire `tenue`** : un pupitre détonne m fois moins loin. Dès l'arrivée. |
| affichage | des repères posés d'avance : ceux du double et d'une fois et demie pour un objet puissant, celui du double seul pour un objet utile |
| raccourci | les noms et les rôles levés à l'arrivée, sans attendre le délai (§ 7) |
| unique | au cas par cas, au seuil ou à l'entrée d'un pupitre |

**Pourquoi le bourdon, et pas tout le chœur.** Les prix de la strate sont fixes : un multiplicateur sur toutes les Voix la raccourcit presque d'autant. En simulation, × 2,5 sur tout le chœur fait passer la strate de 2 h 20 à 1 h 02. Le bourdon porte environ un tiers du chœur, parce qu'il est juste avec tous : le renforcer aide franchement, sans emporter la strate.

| Multiplicateur sur le bourdon | aucun | × 1,5 | × 1,8 | × 2,5 | × 4 (plafond) |
|---|---|---|---|---|---|
| Seuil du joueur naturel | 2 h 20 | 2 h 01 | 1 h 53 | 1 h 36 | 1 h 16 |

- **Durée** : avec les objets d'un jeu correct, entre × 1,5 et × 1,8, la strate dure 2 heures.
- **Le levier `tenue`** agit dès la première minute : à × 2, un pupitre glisse de 12 à 30 cents, et reste parfois dans la marge. Le réglage devient plus rare. Il ne touche pas aux Voix.
- **Les objets ne rapportent pas de points** : 14 avec ou sans (§ 9). Ils rapportent du temps.
- **I2** : le noyau plafonne le produit des multiplicateurs à × 4. Au plafond, tout sur le bourdon, la strate dure encore 1 h 16.
- **I5** : toute la simulation du § 4 est faite **sans aucun artefact**. Le joueur naturel finit en 2 h 20, les joueurs distrait et prudent en 2 h 40, sous les 3 h 15. Un accord pauvre peut dépasser (§ 4, « hasard ») : c'est le premier réglage à surveiller à l'équilibrage (§ 13).
- **Les noms d'en bas** : un peuple qui n'écrit pas ne peut pas noter « les chanteurs ont compris la roue chaude ». Le nom d'en bas se lit dans l'inventaire du noyau ([#45](https://github.com/DavidGiangiacomo/strates/issues/45)) ; dans la nef, un objet qui agit est posé au pied du bourdon. À préciser avec le catalogue.
- Les effets uniques ne doivent ni accorder un pupitre à la place du joueur, ni tenir l'accord pour lui.

## 9. Valeur convertible

- C'est le **cumul des Voix venues** dans la strate. Les placer ne le diminue pas (D-003).
- Au seuil, il vaut de 0,8 à 1,7 × 10¹⁰ selon le profil : **14 points** pour tous, sauf le joueur prudent, qui en a 13. Il en faut 10¹⁰ pour 14, et 5,2 × 10¹⁰ pour 15.
- **Le budget est presque le même pour tous**, avec ou sans artefacts : les prix fixent ce qu'il faut de Voix pour arriver au seuil. C'est la réponse à la question de D-003, « ce que la conversion récompense » : **la conversion ne récompense pas un jeu plus habile, elle constate que l'accord a été tenu.** L'habileté se paie en temps : de 1 h 28 à 2 h 40. L'écart de quatre points entre un jeu correct et un jeu parfait (§4) n'existe pas dans le chœur. C'est cohérent avec une civilisation qui ne comptait pas, et avec le lit, où le budget est fixe.
- Rester rapporte peu : 14 points après 10 minutes de plus, 15 après une heure, 16 après deux.
- Pour le catalogue ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)) : 14 points, pour un catalogue indicatif de 5 objets à 17 points ([`artefacts.md`](../artefacts.md), § 7). Le joueur laisse un objet en haut, toujours.

### L'écran de fouille

L'écran de fouille appartient au noyau. Il écrit la valeur convertible, les points, et le prix d'un point de plus.
- **La valeur s'écrit en barres**, pas en chiffres : une barre pour les Voix venues, et à côté, plus haute, la barre qu'il faudrait pour un point de plus. Le joueur lit le rapport à l'œil, comme il l'a fait pendant deux heures. C'est la notation de la strate (I1).
- **Les points et les coûts restent des chiffres.** Ils appartiennent au noyau, comme le bandeau, qui a affiché « Profondeur 5 » et « Compréhension 55 % » pendant toute la strate. Les nombres ne reviennent pas dans le chœur : ils n'avaient jamais quitté la voix de celui qui fouille.
- **Le retour des nombres est donc assumé, et borné** : le chœur n'en montre aucun, le fouilleur compte toujours.
- **Conséquence pour le contrat** : `formaterValeur` rend une chaîne de caractères. Il faut que la strate puisse fournir à la place un petit composant, par exemple `DefinitionStrate.vueValeur`, que l'écran de fouille monte avec la valeur et celle du point suivant. À faire avec [#85](https://github.com/DavidGiangiacomo/strates/issues/85).

## 10. Hors-ligne

**Politique propre, presque standard : « le chœur tient, mais ne compte pas sans vous ».**

- **Les Voix viennent** pendant l'absence comme ailleurs : 80 % du temps, plafonné à 12 h, au rythme du chœur tel qu'il a été laissé. Rien ne détonne tout seul : un chœur accordé le reste.
- **La tenue ne compte pas.** Les 90 secondes ne s'écoulent qu'en présence du joueur. Le compte ne repart pas de zéro non plus : il attend.
- **Au retour**, le résumé ne donne aucun chiffre : « Pendant votre absence : le chœur a tenu. Des voix sont venues. »

**Pourquoi.** Avec la politique standard, il suffirait de régler l'accord plein et de fermer l'onglet : le seuil tomberait en l'absence du joueur. Or ces 90 secondes sont le seul moment où le chœur chante sans qu'on le dérange. Elles s'écoutent.

**Conséquences** :
- Un onglet caché est une absence pour le noyau : la tenue se joue la page ouverte.
- **Implémentation** : `absence(etat, duree, ctx)` est un calcul direct, puisque la production est constante. Elle termine d'abord les retours en cours.
- [`architecture.md`](../architecture.md), § 8, annonçait une politique standard : la ligne du chœur est corrigée.
- **Remontée finale** (§11) : à décider avec [#128](https://github.com/DavidGiangiacomo/strates/issues/128).

## 11. Textes

- **Budget** : environ 300 mots, le plus petit du jeu. La rédaction est l'objet de [#72](https://github.com/DavidGiangiacomo/strates/issues/72).
- **Ton** : celui des indications d'une partition. Des infinitifs et des adverbes, jamais une phrase : « tenir », « plus haut », « sans presser ». Rien ne s'adresse au joueur, et rien ne raconte.
- **Aucun chiffre dans aucun texte**, ni en chiffres ni en lettres pour les quantités : « le double » est permis, « deux cents voix » ne l'est pas. Un test le vérifiera, comme il vérifie l'absence de « creuser ».
- **À écrire** :
  - les noms des huit pupitres, du rang, de l'écoute et du point d'orgue ;
  - une note de quelques mots pour chaque jauge, montrée une fois le rôle levé ;
  - la légende des arcs et du battement ;
  - le résumé d'absence (§ 10) ;
  - `fouille.valeur`, le nom de la valeur à l'écran de fouille : « Voix venues » ;
  - l'aide : une page courte, écrite comme la première page d'une partition. Elle dit qu'une barre se tire, qu'un chœur juste attire, et qu'un rang dérange. Elle ne nomme aucun rapport, et ne dit rien de la tenue ni du bandeau.
- **Traces laissées au fond** (strate 8) : pas de phrase. Le dernier accord, dessiné : huit barres et leur voûte. Une ligne au plus, pour la tenue.
- **Aucun texte ne mentionne « creuser ».**

## 12. Critère R5

**Avis : la strate tient, comme jeu autonome de 2 heures. Sur le papier, et à deux conditions.**

Ce qui la fait tenir :
- **Un geste qui est un plaisir en soi.** Chercher une hauteur, voir et entendre le battement ralentir, puis s'arrêter : c'est une petite boucle complète, de dix secondes, avec sa tension et sa résolution. Aucune autre strate n'a une boucle courte aussi sensuelle.
- **Une vraie grammaire d'incrémental, et pas un jouet sonore.** Il y a des prix, une courbe, des paliers, une automatisation qui s'achète (l'écoute). Mais la croissance vient de l'accord, et chaque achat le défait : la tension entre grandir et rester juste dure jusqu'à la dernière minute.
- **Un problème qui se renouvelle six fois.** Chaque pupitre qui entre change l'accord à trouver. Les premiers rapports se voient ; les derniers se cherchent ; à huit, toutes les paires ne peuvent plus être justes, et il faut choisir.
- **Une profondeur qui ne coûte aucune règle.** La comma, les accords plus riches que d'autres, l'intérêt d'accorder sur le bourdon : tout sort des neuf rapports.
- **Un arc lisible et une fin qui est une vraie fin.** La voûte se ferme, et le dernier geste est de ne plus rien ajouter.
- **Rien de commun avec les autres strates (I1).** Ni nombre, ni saison, ni grille, ni débit. Le seul cousinage est avec la surface, pour les prix qui montent, et il est voulu : c'est le squelette d'un incrémental, vu sans ses chiffres.

**Les deux conditions**, que le papier ne peut pas vérifier :
1. **Que le geste reste un plaisir à la centième fois.** La strate demande une cinquantaine de réglages. S'il devient une corvée avant que l'écoute ne le remplace, la strate est ratée. Tout dépend du toucher : la vitesse du glisser, le cran de la molette, la netteté du battement, le son de l'accord qui se pose.
2. **Que la strate se joue vraiment à l'œil.** La marge fait 2 à 3 pixels : le joueur ne pose jamais juste à la main, il approche à l'œil puis affine au cran. Si l'approche à l'œil ne tombe pas assez près, il ne reste qu'un balayage patient, et la promesse du §5 est fausse.

**Ce qui la ferait tomber** : un joueur qui, après un quart d'heure, règle par balayage sans rien anticiper, et trouve ça long.

**Le point faible** est le même que celui des caves avant les rations : la seconde moitié. Après une heure, le joueur naturel décide 5 à 8 fois par tranche de 10 minutes, ce qui tient la cible fixée pour les caves ([#163](https://github.com/DavidGiangiacomo/strates/issues/163)). Mais ce sont des joueurs automatiques, qui ne s'ennuient pas, et les écoutes retirent des gestes à mesure qu'on avance.

**Recommandation.** Avant de coder la strate, un **jouet de deux jours** : trois barres, le son, le battement, les arcs, sans économie. Il répond aux deux conditions pour presque rien, et il peut se faire avant le go / no-go ([#38](https://github.com/DavidGiangiacomo/strates/issues/38)). Pour le go / no-go lui-même, l'avis est : **le chœur ne donne pas de raison d'arrêter.** La strate est concevable en entier, elle respecte les cinq invariants, et son risque se teste à bas coût.

## 13. Questions ouvertes

1. **Le toucher** (§ 12, conditions 1 et 2) : à trancher par le jouet, puis par [#71](https://github.com/DavidGiangiacomo/strates/issues/71).
2. **La durée dépend trop de l'accord** (§ 4, « hasard ») : un joueur qui garde un accord pauvre peut dépasser 3 h 15 sans artefact. Pistes : baisser les prix des trois derniers pupitres ; faire compter moins les paires justes ; montrer mieux qu'un pupitre terne peut être déplacé.
3. **La retenue n'est jamais mise à l'épreuve** (§ 4) : le seuil dit « ne plus rien ajouter », et aux prix actuels il n'y a rien à ajouter pendant ces 90 secondes. Pistes : des rangs moins chers en fin de strate, pour qu'une jauge se remplisse toujours pendant la tenue ; une lueur qui monte dès le premier accord plein, bien avant le point d'orgue, pour que le joueur la fasse tomber plusieurs fois en élargissant ; un point d'orgue qui ne coûte rien et se déclenche. À trancher avec [#85](https://github.com/DavidGiangiacomo/strates/issues/85).
4. **Les neuf rapports comptent autant** (§ 3) : un quadruple se trouve en deux secondes, un cinquième de plus en vingt. Faut-il que les rapports difficiles rapportent davantage ?
5. **Détonner à chaque rang** : c'est le cœur de la strate, et c'est aussi ce qui peut lasser. Variantes à essayer : un glissement plus court quand le pupitre est large ; l'écoute plus tôt.
6. **La fatigue de l'oreille** (§ 6) : deux heures de notes tenues. À juger avec le son ([#100](https://github.com/DavidGiangiacomo/strates/issues/100)), et à faire entendre au playtest.
7. **Les lecteurs d'écran** : la strate est faite pour l'œil et l'oreille. Elle peut dire en mots l'état de chaque paire (« juste », « faux, trop haut »). Est-ce encore le même jeu ? À voir avec [#86](https://github.com/DavidGiangiacomo/strates/issues/86).
8. **Le composant de la valeur à l'écran de fouille** (§ 9) : une extension du contrat, à écrire avec [#85](https://github.com/DavidGiangiacomo/strates/issues/85).
9. **Faire taire un pupitre** : écarté ici, pour garder peu de gestes. Il aiderait à accorder à l'oreille, deux voix à la fois. La vue peut déjà faire ressortir le pupitre qu'on règle.
10. **Les noms d'en bas sans texte** (§ 8) : à préciser avec le catalogue ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)).
11. **Le temps hors ligne des politiques propres** : la question 5 de la [fiche des caves](strate-2.md), § 13, vaut aussi ici.
12. **La remontée finale** (§ 10) : à décider avec [#128](https://github.com/DavidGiangiacomo/strates/issues/128).

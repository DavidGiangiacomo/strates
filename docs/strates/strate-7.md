# Strate 7 — Le lit

*Fiche de design, issue [#75](https://github.com/DavidGiangiacomo/strates/issues/75). Écrite après la bible narrative ([#43](https://github.com/DavidGiangiacomo/strates/issues/43)), le design de la Compréhension ([#44](https://github.com/DavidGiangiacomo/strates/issues/44)) et la fiche de la dette ([#64](https://github.com/DavidGiangiacomo/strates/issues/64)), dont le lit garde les fosses. Les chiffres viennent d'une simulation grossière de quatre profils de joueur (§ 4), à refaire avec le simulateur headless quand la boucle sera codée ([#91](https://github.com/DavidGiangiacomo/strates/issues/91), [#116](https://github.com/DavidGiangiacomo/strates/issues/116)).*

*Choix tranchés le 24 octobre 2026 :*
- *les rares placements disent où l'eau se repose : une levée ferme un creux, et l'eau y laisse tout son limon. Ils dessinent les couches, qu'on retrouve au fond, et font gagner un quart d'heure environ. Sans un geste, le bassin se remplit quand même ;*
- *le lit montre un seul nombre : la hauteur du limon sur une échelle de crue, en coudées et en doigts ;*
- *les objets d'en haut agissent sur l'eau retenue derrière une levée (levier `depot`) et sur l'absence (levier `patience`) ;*
- *si le bassin se remplit pendant une absence, il attend le joueur : la descente part une crue après son retour.*

*Choix proposés, à trancher à la relecture :*
- *une crue toutes les trente secondes, comme la crue dont la dette a fait son calendrier ;*
- *quatre creux, à 0, 9, 18 et 27 coudées, et une seule levée à la fois (§ 3) ;*
- *l'échelle s'écrit en toutes lettres : « neuf coudées et quatorze doigts » (§ 1) ;*
- *une grande crue, à la 150ᵉ crue, dépose une couche épaisse (§ 3) ;*
- *deux actes propres, la levée avant l'eau et la patience (§ 7).*

*Renvois : « §6 » désigne une section du [design doc](../design-doc.md), « § 6 » une section de cette fiche.*

Le lit ne demande presque rien (§5). Après la dette, la plus longue et la plus dure des strates, on n'y promet plus, on n'y achète plus : on **attend**. Le fleuve déborde toutes les trente secondes ; l'eau s'étend sur le bassin, s'y repose, puis se retire, et laisse une couche de limon. De rares gestes disent où l'eau se repose. Au bout de deux heures environ, le bassin est plein jusqu'à la rive, et la descente vient seule. C'est la seule fois du jeu où le joueur ne décide pas de descendre (§6), et la seule où le jeu lui parle ([bible](../bible.md), § 8).

## 1. Identité

| | |
|---|---|
| Verbe | attendre |
| Ressource | Sédiments : le limon déposé |
| Unité et notation | **L'échelle de crue.** Une pierre dressée au bord du bassin, gravée de traits : un long par coudée, un court tous les sept doigts. On y lit la hauteur du limon en coudées et en doigts ; une coudée vaut vingt-huit doigts. La lecture s'écrit sous la pierre, **en toutes lettres** : « neuf coudées et quatorze doigts ». Aucune autre strate ne mesure en coudées, ni n'écrit ses nombres en lettres (I1). C'est le seul nombre du lit. |
| Ordre de grandeur final | ≈ 10³ : le bassin plein tient 1 941 doigts de limon (§ 9). Après les 10²⁰ de la dette, c'est la plus petite échelle du jeu (I3). |
| Durée cible | 2 h. En simulation, sans aucun objet, de 2 h 00 à 2 h 18 selon les gestes ; avec les objets d'un jeu correct, de 1 h 39 à 2 h 18 (§ 4, § 8). |
| κ à l'entrée → à la sortie | 85 → 96, au mieux |

**Le vocabulaire.** La bible donne au lit quatre mots, « crue, limon, couche, rive » (§ 4) ; l'échelle y ajoute les siens.
- **La crue** : toutes les trente secondes, le fleuve monte, l'eau s'étend sur le bassin, se repose, puis se retire.
- **Le limon** : ce que la crue laisse. **Une couche** : le limon d'une crue.
- **Le bassin** : entre le fleuve, à gauche, et la rive, à droite. Il se remplit, couche après couche.
- **La rive** : la hauteur où le bassin est plein, trente-six coudées sur l'échelle. L'eau ne s'y repose plus : le fleuve passe ailleurs.
- **Les creux** : quatre poches, le long de la rive, à des hauteurs croissantes. Quand le limon en atteint un, l'eau s'y engouffre.
- **La levée** : un bourrelet de terre et de pierres qui ferme un creux. Derrière, l'eau se repose et laisse tout son limon.
- **L'échelle** : la pierre graduée, et ses mesures, **la coudée** et **le doigt**.
- **La grande crue** : une crue plus forte que les autres, vers 1 h 15, qui dépose une couche épaisse.

## 2. La civilisation

Les bords d'un fleuve qui débordait chaque année. On laissait la crue déposer son limon, et l'on attendait. De rares gestes : choisir où l'eau se repose, en fermant un creux d'une levée. Pas d'écriture. On reconnaît la plaine inondable, la décrue, le limon qui fait la terre, et l'échelle de crue, une pierre gravée de traits où l'on voyait jusqu'où l'eau était montée.

Ils optimisaient **ce qui se dépose** : l'épaisseur et la régularité des couches. Leur temps était celui du fleuve : une couche par crue, et rien d'autre à compter.

Ils ont fini par saturation : le bassin s'est rempli jusqu'au bord, et la dernière couche a atteint la rive. Il n'y avait plus de place pour attendre. Le fleuve est passé ailleurs, et la descente vient seule (§6).

En creusant son lit, le fleuve avait mis à nu, au fond du bassin, une roche couverte d'encoches, par groupes. Ils ne les ont pas lues : ils les ont laissées recouvrir. C'est leur reste ([bible](../bible.md), § 3), et les premières crues du joueur le recouvrent à leur tour (§ 6). Leur voix, qui n'existe pas, et leurs traces sont dans la bible ([`bible.md`](../bible.md), § 4).

## 3. Boucle courte

Rien ne produit et rien ne s'achète. La boucle tient en un geste rare et une attente : **fermer un creux, laisser venir la crue**.

### La crue

- **Une crue toutes les trente secondes**, comme la crue dont la dette a fait son calendrier ([fiche de la dette](strate-6.md), § 1) : le fleuve monte en dix secondes, l'eau se repose dix secondes, puis se retire en dix secondes. Le limon reste : une couche.
- **L'eau qui passe** laisse les trois quarts de son limon : le bassin monte de sept doigts par crue, un quart de coudée.
- **L'eau qui se repose**, derrière une levée, laisse tout son limon : neuf doigts et un tiers, × le levier `depot` (§ 8).
- **Entre deux crues, rien ne change.** Le temps du lit se compte en crues, comme celui de la dette, mais il ne les numérote pas : la dette a pris son calendrier dans ses couches.

### Les creux

- **Quatre creux** bordent le bassin, le long de la rive, à 0, 9, 18 et 27 coudées sur l'échelle. Le premier est au fond du bassin : l'eau l'atteint dès la première crue.
- **Quand le limon atteint un creux, l'eau s'y engouffre.** Tant qu'il n'est pas plein, tout le limon de la crue y va, et le bassin ne monte plus : **l'échelle s'arrête**.
- **Un creux tient 25 crues d'eau qui se repose**, ou 33 et un tiers d'eau qui passe. Les quatre creux font toute la différence entre un joueur qui les ferme et un joueur qui ne fait rien : 18 minutes.
- Plein, le creux se fond dans le bassin, et l'échelle repart.

### La levée

- **Un seul geste : fermer un creux.** On clique sur un creux, et la levée s'y bâtit. Il n'y en a qu'une à la fois : fermer un autre creux la déplace.
- **Derrière elle, l'eau se repose** et y laisse tout son limon : le creux se remplit en 25 crues au lieu de 33. Dans la coupe, ses couches sont plus sombres que les autres.
- **Elle peut se bâtir avant l'eau**, sur un creux encore à sec : elle attend la crue qui l'atteindra. C'est un acte de compréhension (§ 7).
- **Quand son creux est plein, elle disparaît sous le limon**, et l'on peut en bâtir une autre.
- **Sans levée, l'eau passe.** Le creux se remplit quand même, plus lentement, et le bassin se remplit toujours.

### La grande crue

- **À la 150ᵉ crue**, vers 1 h 15, le fleuve monte plus haut que d'habitude, et la crue apporte le limon de six. Si l'eau va au bassin, l'échelle monte d'une coudée et demie d'un coup.
- **C'est la couche épaisse du compte des crues** ([fiche de la dette](strate-6.md), § 6). Dans la rive, parmi les vieilles couches fines, il y en a déjà une pareille (§ 6) : on reconnaît, en bas, ce que la dette lisait en haut.
- **Rien ne la provoque, rien ne l'empêche.** Elle ne demande aucun geste.

### L'arrivée

Le bassin est vide. Au fond, la roche couverte d'encoches ; à gauche, le fleuve ; à droite, la rive, ses vieilles couches et les fosses de la dette. L'échelle se dresse au bord du bassin, côté fleuve : « aucune coudée ». Le premier creux s'ouvre au fond du bassin. Le jeu parle : « Rien ne presse. » La première crue vient trente secondes plus tard.

### État et actions, pour la boucle ([#91](https://github.com/DavidGiangiacomo/strates/issues/91))

```ts
interface Couche {
  crue: number;                     // le numéro de la crue
  ou: "bassin" | number;            // où est allé son limon : le bassin, ou le creux de ce numéro
  epaisseur: number;                // en doigts
  retenue: boolean;                 // l'eau s'est reposée derrière une levée
}

interface EtatLit {
  temps: number;                    // secondes depuis l'arrivée, absences comprises
  crues: number;                    // les crues passées
  niveau: number;                   // la hauteur du limon sur l'échelle, en doigts
  creux: number[];                  // le limon de chaque creux, en doigts sur la largeur du bassin
  levee: number | null;             // le creux fermé par la levée
  depose: number;                   // tout le limon déposé, en doigts : la valeur convertible
  couches: Couche[];                // pour le dessin, et pour la trace laissée au fond
  pleinA: number | null;            // le temps où le bassin a atteint la rive
  descenteA: number | null;         // une crue après le bassin plein, en présence du joueur
  deplacements: number;             // les levées déplacées d'un creux qui n'était pas plein : la patience
  dites: string[];                  // les phrases du jeu déjà dites
  dette: "soldee" | "defaut" | null; // l'issue de la dette, lue au journal à l'arrivée : ses fosses
  multiplicateurs: { depot: number; patience: number };  // artefacts, relus à chaque tick
}

type ActionLit = { type: "fermer"; creux: number };   // bâtit la levée, ou la déplace
```

- **`tick(dt)`** fait passer les crues : à chacune, le limon va au premier creux atteint qui n'est pas plein, ou au bassin.
- **`pasMax`** vaut une crue, trente secondes : le pas est coupé à chaque crue.
- **`absence(duree)`** fait passer d'un coup les crues de l'absence, sans tick (§ 10).
- **`seuil()`** rend `{ atteint, automatique: true }`. Il est atteint une crue après le bassin plein, en présence du joueur.
- **`valeurConvertible()`** rend `depose`.
- La strate n'utilise pas d'aléatoire : la grande crue est toujours la 150ᵉ. Un geste impossible, comme fermer un creux plein, est ignoré sans erreur.

## 4. Boucle moyenne et seuil de fouille

### Progression

Les temps sont ceux du joueur « attentif » de la simulation, sans aucun artefact : il passe toutes les cinq minutes, et ferme un creux quand il voit l'eau l'atteindre. Avec les objets d'un jeu correct, il finit 14 minutes plus tôt (§ 8).

| Temps | Étape | Contenu |
|---|---|---|
| 0 – 12 min | Le premier creux | « Rien ne presse. » Le joueur ferme le premier creux, au fond du bassin, et l'eau s'y repose. Les premières couches recouvrent la roche aux encoches. |
| 12 – 31 min | Le bassin monte | Sept doigts par crue, jusqu'à neuf coudées. Rien à faire. |
| 31 – 44 min | Le deuxième creux | L'eau s'y engouffre, et l'échelle s'arrête. Le joueur le voit à son passage suivant, et le ferme à 36 minutes. |
| 44 – 63 min | Le bassin monte | Jusqu'à dix-huit coudées. |
| 63 – 75 min | Le troisième creux | Fermé à 66 minutes. |
| 75 – 94 min | La grande crue | À 1 h 15, une couche épaisse. Le bassin monte jusqu'à vingt-sept coudées. |
| 94 – 106 min | Le dernier creux | Fermé à 96 minutes. Plein, il n'y a plus rien à fermer : « Vous n'avez rien à décider ici. » |
| 106 – 124 min | La rive | Le bassin monte jusqu'à trente-six coudées, et le fleuve passe ailleurs. Une crue plus tard, la descente : « C'était la seule fois. » |

La boucle moyenne du §3, c'est **le creux** : quatre fois, l'eau trouve un creux, l'échelle s'arrête, et un geste peut la faire repartir plus vite. Entre deux creux, une vingtaine de minutes de crues sans rien à décider.

### Le seuil

- **Il n'y en a pas** (§6). La descente vient seule quand le bassin est plein jusqu'à la rive : les quatre creux pleins, et trente-six coudées sur l'échelle.
- **Ce qu'il dit de la civilisation** : il n'y avait plus de place pour attendre, et le fleuve est passé ailleurs.
- **La descente attend le joueur.** Le bassin plein reste immobile. La descente part une crue plus tard si le joueur est là ; sinon, une crue après son retour. Il voit le bassin plein, puis la descente, qu'il n'a pas choisie (§ 10).
- **Le bouton « creuser »** résiste jusqu'au bout, comme avant tout seuil ([fiche de la surface](strate-1.md), § 4). C'est la seule strate où il ne cède jamais : la descente se fait sans lui.
- **I4 ne s'y applique pas** : le lit n'a pas de seuil à franchir, et la descente vient en attendant. C'est voulu, et c'est ce que la strate apprend : elle se fait sans le joueur.
- **L'objectif n'est jamais affiché.** L'échelle monte, et la rive ne se marque d'avance qu'avec un objet, l'œuf qui garde (§ 8).

### La fin de la strate

- **Le dernier creux plein**, il n'y a plus rien à fermer. Le jeu le dit, une fois : « Vous n'avez rien à décider ici. » Le joueur attentif l'entend à 1 h 46 ; le bassin met encore dix-huit minutes à atteindre la rive.
- **Le bassin plein**, le fleuve passe ailleurs : l'eau ne monte plus, et le grain seul bouge encore. Une crue plus tard, la descente part. Pendant la descente : « C'était la seule fois. »
- **Pas de filet** : il n'y a pas de seuil à franchir, ni de fouille à ouvrir (`src/noyau/logique/filet.ts`).

### En simulation

Quatre joueurs automatiques, sans aucun artefact, puis avec les objets d'un jeu correct. Le script est un brouillon en Python, hors du dépôt ; il ne partage rien avec le code du jeu.

| Profil | Jeu | Bassin plein | Gestes | Avec les objets |
|---|---|---|---|---|
| prévoyant | passe chaque minute ; dès qu'un creux est plein, bâtit la levée sur le suivant, avant l'eau | 2 h 00 | 4 | 1 h 46 |
| attentif | passe toutes les cinq minutes ; ferme un creux quand l'eau l'atteint | 2 h 04 | 4 | 1 h 50 |
| distrait | passe toutes les demi-heures | 2 h 13 | 1 | 1 h 53 |
| sans un geste | ne fait rien | 2 h 18 | 0 | 2 h 18 |

- **La durée dépend peu du jeu** : de 2 h 00 à 2 h 18. Les crues fixent le rythme, et les gestes gagnent dix-huit minutes au plus.
- **Les points ne dépendent pas du jeu** : le bassin plein tient toujours le même limon, et donne 4 points (§ 9).
- **Le distrait** ferme le premier creux à l'arrivée. Ensuite, ses passages tombent avant que l'eau n'atteigne un creux, ou après qu'il est plein. Selon l'heure de ses passages, il en ferme de un à quatre.
- **Sans un geste**, les objets ne servent à rien, sauf pendant une absence : le levier `depot` passe par la levée (§ 8).
- **Le joueur qui part** : il ferme le premier creux, puis s'absente deux heures ou deux semaines. Il retrouve le bassin plein, à 2 h 13 de crues sans objets, à 1 h 44 avec ceux d'un jeu correct. La descente l'attend (§ 10).

## 5. Le choc d'arrivée

Le joueur vient de la dette : trois heures d'échéances, une décision par minute, et une grande crue à couvrir. Il arrive dans un bassin vide, au bord d'un fleuve.

1. **Il cherche quoi faire.** Il n'y a ni caisse, ni prix, ni liste : un fleuve, un bassin, une pierre graduée, un creux au fond. Le jeu parle, pour la première fois : « Rien ne presse. »
2. **Il clique partout.** Rien ne répond, sauf le creux : une levée s'y bâtit.
3. **La première crue** : l'eau monte, s'étend, se repose derrière la levée, se retire. Il reste une couche, sur la roche aux encoches.
4. **Il attend la suivante**, trente secondes, puis une autre. L'échelle ne bouge pas : l'eau va au creux. Au bout de douze minutes, le creux est plein, et l'échelle commence à monter : « sept doigts ».
5. **Il cherche à aller plus vite.** Rien ne s'achète. Il peut fermer d'avance le creux suivant, et c'est tout.

**Pourquoi ça ne marche pas.** Les six strates d'avant récompensaient l'attention : un geste de plus, au bon moment, rapportait. Ici, la crue vient à son heure, quoi qu'on fasse. La question « que faire de plus ? » n'a pas de réponse.

**Comment il le comprend.** Par l'échelle, qui monte d'elle-même ; par le creux, qui se remplit sans lui, plus lentement ; et par la phrase de l'arrivée, la première que le jeu lui adresse. Il peut fermer la page : le lit continue, et l'attend (§ 10).

**Pourquoi c'est agréable.** C'est un repos, placé exprès après la strate la plus dure (§5). Rien ne peut mal tourner : le bassin se remplit toujours, et la descente vient seule. Le seul geste a un effet qu'on voit, l'eau qui se repose derrière la levée, et la couche plus sombre qu'elle laisse.

## 6. Interface et direction artistique

« Presque vide, grain, lenteur » (§5). La réalisation est l'objet de [#107](https://github.com/DavidGiangiacomo/strates/issues/107) ; le son, de [#114](https://github.com/DavidGiangiacomo/strates/issues/114).

- **Disposition : la coupe du bassin**, vue de côté, sur presque tout l'écran.
  - **Le fleuve**, à gauche : une bande d'eau grise, qui monte à chaque crue.
  - **Le bassin**, au centre : le limon s'y dépose en couches fines, une par crue, dans les ocres. Une couche d'eau retenue est un peu plus sombre : on voit, dans la coupe, où la levée a tenu l'eau.
  - **La rive**, à droite : une berge de vieilles couches, fines et régulières, avec une couche épaisse parmi elles. Ce sont les couches que la dette lisait comme un compte des crues.
  - **Les fosses de la dette**, creusées d'en haut dans la berge : des tablettes brisées si la dette a été soldée, entières et scellées si elle est tombée en défaut ([bible](../bible.md), § 7). Elles sont là dès l'arrivée, sans un mot.
  - **Les creux**, le long de la berge, à leurs hauteurs : quatre poches sombres. La levée est un petit bourrelet de terre et de pierres, à leur bord.
  - **Au fond**, la roche et ses encoches, par groupes, que les premières couches recouvrent.
  - **L'échelle**, au bord du bassin, côté fleuve : une pierre dressée, gravée de traits, que le limon enterre peu à peu. Sous elle, sa lecture, en petites lettres : « neuf coudées et quatorze doigts ».
  - **Les objets d'en haut**, posés sur la berge, en haut de la rive (§ 8).
  - **Rien d'autre** : ni bouton, ni panneau. L'aide s'ouvre d'un lien discret.
- **Palette** : les ocres et les gris du limon, le gris-vert de l'eau, la terre sombre de la rive. Un grain sur tout l'écran, comme d'une pellicule : la seule chose qui bouge entre deux crues.
- **Typographie** : une seule ligne écrite en permanence, la lecture de l'échelle, en minuscules. Les phrases du jeu paraissent au centre, plus grandes, puis s'effacent (§ 11).
- **Mouvement** : très lent. Une crue, c'est dix secondes de montée, dix de repos, dix de retrait.
- **Sons** :
  - l'eau, à chaque crue : elle monte, se tait pendant qu'elle se repose, se retire ; jamais tout à fait la même ;
  - la levée qu'on bâtit : de la terre, des pierres ;
  - un creux qui se remplit : l'eau s'y engouffre, plus sourde ;
  - la grande crue, plus grave et plus longue ;
  - pas de musique. Le gage qui chante, s'il est là, revient une fois, plus bas, au premier dépôt (§ 8).
- **Jouable sans le son.** Le son ne dit rien que la coupe ne montre.
- **Accessibilité** :
  - *moins de mouvement* : la crue monte et se retire en trois images, sans glisser ;
  - *clavier* : la tabulation passe d'un creux à l'autre, et Entrée y bâtit la levée ;
  - *lecteurs d'écran* : la lecture de l'échelle s'annonce à chaque coudée, pas à chaque crue ; une phrase du jeu s'annonce quand elle paraît ; un creux se dit avec sa hauteur et son état, « à sec », « sous l'eau », « fermé », « plein ».
- **Ce qui la distingue** : c'est la seule strate où le temps fait tout. Les autres montraient ce qu'on avait, ce qu'on devait, ce qui s'accordait ; le lit montre ce qui s'est déposé.
- **Pas d'écran de fouille** : la descente se fait sans lui, et emporte tout le catalogue (§ 9).

## 7. Opacité et Compréhension

Le joueur arrive avec κ = 85 au mieux, et plutôt de 55 à 65 pour un jeu correct. Le délai de levée vaut alors de 4 à 7 minutes. Le graphe de dépendances est là dès l'arrivée ; les formules en sont de 10 à 70 % ([`comprehension.md`](../comprehension.md), § 3).

- **Jamais caché** : la crue, l'eau, les couches, l'échelle et ses traits, les creux et la levée. Rien de ce qui fait aller le lit ne se cache.

| Élément opaque | À l'arrivée | Levé par l'usage | Par un objet | Délai |
|---|---|---|---|---|
| la crue et le limon | des glyphes, sur la coupe et dans l'aide | la première crue | le bâton qui creuse, le gage qui souffle | oui |
| la couche et la rive | des glyphes | le premier creux plein | le bâton qui creuse | oui |
| les mesures de l'échelle | la lecture en glyphes : on voit monter le limon, pas sa mesure | la première coudée | le bâton qui creuse | oui |

**Les actes de compréhension propres**, 6 points sur les 11 du barème ([`comprehension.md`](../comprehension.md), § 2) :

| Acte | Définition | Poids |
|---|---|---|
| La levée avant l'eau | une levée bâtie sur un creux encore au-dessus du limon, que la crue atteint ensuite. Le premier creux, au fond du bassin, ne compte pas : l'eau l'atteint dès la première crue | 3 |
| La patience | la descente sans avoir jamais déplacé une levée d'un creux qui n'était pas plein | 3 |

- S'y ajoutent les deux actes génériques, sans aide (2) et sans artefact (3).
- **La levée avant l'eau** suit le modèle de la famille ([`comprehension.md`](../comprehension.md), § 2) : savoir où l'eau se reposera avant que le lit ne le montre.
- **La patience**, « peu de gestes jusqu'à la descente », comme le prévoyait le barème. Le joueur qui ne fait rien l'accomplit aussi, et c'est voulu : comprendre le lit, c'est comprendre qu'il n'a besoin de presque rien.
- En simulation, le prévoyant accomplit les deux actes ; l'attentif, le distrait et le joueur sans un geste, la patience seulement.

**Le graphe de dépendances** : la crue apporte le limon ; l'eau qui passe et l'eau retenue le déposent, et la levée retient l'eau. Le limon va au creux atteint, ou au bassin ; un creux plein se fond dans le bassin. Le bassin monte sur l'échelle, jusqu'à la rive.

**Les formules**, de la plus simple à la plus profonde, écrites en lettres comme l'échelle :
1. une crue toutes les trente secondes ;
2. l'eau qui passe : sept doigts par crue ;
3. l'eau retenue : neuf doigts et un tiers par crue, × dépôt ;
4. un creux : vingt-cinq crues d'eau retenue, ou trente-trois et un tiers d'eau qui passe ;
5. la rive : trente-six coudées ;
6. la valeur convertible : tout le limon déposé.

## 8. Artefacts reçus

Les objets de la dette sont **puissants**, ceux du chœur **utiles**, ceux du réseau **décoratifs** ; ceux de l'atelier, des caves et de la surface sont des cailloux. Les catalogues sont dans [`artefacts.md`](../artefacts.md), § 8 ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)) : leurs effets suivent la réception par famille ci-dessous, et seront codés par [#108](https://github.com/DavidGiangiacomo/strates/issues/108).

Ce sont des choses simples, nommées par ce qu'elles font à qui les tient ([bible](../bible.md), § 6) : « la pierre qui pèse », « l'œuf qui garde ». Un peuple qui n'écrit pas ne note pas leur éveil : leur nom se lit dans l'inventaire du noyau, et chacun est posé sur la berge, en haut de la rive, dès l'arrivée.

| Famille d'effet | Réception dans le lit |
|---|---|
| multiplicateur | **levier principal `depot`** : le limon de l'eau retenue derrière une levée × m. **Levier secondaire `patience`** : le limon déposé pendant l'absence × m. Dès l'arrivée. |
| affichage | les couches à venir, dessinées d'avance en pointillés : trois pour un objet puissant, une pour un objet utile ; la rive marquée sur l'échelle |
| raccourci | les mots du lit et les mesures de l'échelle, levés à l'arrivée (§ 7) |
| unique | au cas par cas, au premier dépôt ou à la descente ; jamais une levée bâtie à la place du joueur |

**Les objets de la dette, puissants, et ceux du chœur, utiles :**

| Objet | Venu de | Effet dans le lit |
|---|---|---|
| la pierre qui pèse | la dette | levier `depot` × 1,25 |
| le rouleau qui marque | la dette | les trois prochaines couches, dessinées d'avance |
| l'œuf qui garde | la dette | la rive marquée d'avance sur l'échelle : jusqu'où le bassin se remplira |
| le bâton qui creuse | la dette | les mots du lit et les mesures de l'échelle, levés à l'arrivée |
| la pierre qui oblige | la dette | quand le lit descend, l'eau se retire un instant et laisse voir la paroi du fond : des encoches, par groupes |
| la caution de bois | le chœur | levier `depot` × 1,125 |
| le gage patient | le chœur | levier `patience` × 1,25 |
| le gage qui revient | le chœur | la prochaine couche, dessinée d'avance |
| le gage qui souffle | le chœur | la crue et le limon, levés à l'arrivée |
| le gage qui chante | le chœur | au premier dépôt, la voix de la grande crue de la dette revient une fois, plus bas, sans un mot |

**Pourquoi l'eau retenue, et pas tout le limon.** Les crues sont fixes : un multiplicateur sur tout le limon raccourcit la strate presque d'autant. En simulation, × 1,41 sur tout le limon fait passer le joueur attentif de 2 h 04 à 1 h 28, et × 1,76 à 1 h 12. Sur l'eau retenue seulement, il ne compte que dans les creux, et seulement derrière une levée : il aide celui qui fait le geste, sans emporter la strate. C'est l'équivalent du ressort de l'atelier ou du bourdon du chœur.

| Multiplicateur sur le dépôt | aucun | × 1,125 | × 1,25 | × 1,41 | × 2 | × 4 (plafond) |
|---|---|---|---|---|---|---|
| joueur attentif | 2 h 04 | 1 h 56 | 1 h 53 | 1 h 50 | 1 h 38 | 1 h 35 |
| joueur prévoyant | 2 h 00 | 1 h 56 | 1 h 52 | 1 h 46 | 1 h 36 | 1 h 24 |

*× 1,41 : la pierre qui pèse et la caution de bois, ce qu'emporte un jeu correct.*

**Le levier `patience`** ne compte que pendant l'absence : le lit se dépose plus vite quand on le laisse seul. Il récompense le verbe de la strate.

| Le joueur qui part | sans objets | patience × 1,25 | et dépôt × 1,41 |
|---|---|---|---|
| ferme le premier creux, puis part | 2 h 13 | 1 h 46 | 1 h 44 |
| attend le premier creux plein, bâtit la levée sur le deuxième, puis part | 2 h 08 | 1 h 46 | 1 h 39 |
| ne fait rien, et part dès l'arrivée | 2 h 18 | 1 h 50 | 1 h 50 |

- **Durée** : avec les objets d'un jeu correct, le joueur attentif finit en 1 h 50 ; celui qui part, en 1 h 44, et en 1 h 39 s'il a bâti la deuxième levée avant de partir. Celui qui reste devant le bassin sans un geste finit en 2 h 18, avec ou sans objets.
- **Les objets ne rapportent pas de points** : 4 avec ou sans (§ 9).
- **I2** : 1,41 × 1,25 = × 1,76, sous le plafond. Le noyau plafonne le produit à × 4 : au plafond, tout sur le dépôt, la strate dure encore 1 h 24 pour le joueur prévoyant.
- **I5** : toute la simulation du § 4 est faite sans aucun artefact. Le lit finit entre 2 h 00 et 2 h 18, sous les 3 h 15, avec la plus large marge du jeu.
- **Les noms d'en bas** sont ceux du catalogue, que donne le lit (bible, § 6). Le lit ne les écrit pas : ils ne se lisent que dans l'inventaire du noyau.
- **Le gage qui chante**, dans la strate où seul le jeu parle : sa voix ne dit pas un mot. Elle vient au premier dépôt, trente secondes après « Rien ne presse. », pour ne pas couvrir la phrase.

## 9. Valeur convertible

- **Tout le limon déposé**, compté en doigts : la hauteur sur l'échelle, plus le limon des quatre creux, ramené à la largeur du bassin. Le bassin plein en tient **1 941** : 1 008 sur l'échelle, jusqu'à la rive, et 233 et un tiers dans chaque creux.
- **4 points, toujours** : ⌊log₁₀(1 941) × 1,4⌋ = 4. Il en faudrait 3 728 pour en avoir 5, et 720 suffisent pour 4. Le bassin plein ne tient ni plus ni moins : c'est la « quantité presque fixe » de D-003.
- **Tout le catalogue est emporté** : trois objets, 4 points ([`artefacts.md`](../artefacts.md), § 8). Il n'y a pas d'écran de fouille : en descente automatique, le noyau applique la présélection, qui prend tout ([`architecture.md`](../architecture.md), § 6).
- **Le lit est la seule strate où le joueur ne choisit pas ce qu'il emporte**, comme il ne choisit pas de descendre.
- **Rester ne rapporte rien** : on ne reste pas. La descente part une crue après le bassin plein.

## 10. Hors-ligne

- **Politique propre, à 100 %, sans plafond** (§9). La sédimentation est du temps réel : c'est sa nature.
- **Le calcul est direct.** Le lit ne change qu'aux crues : `absence(duree)` compte les crues de l'absence et les fait passer une à une, sans tick ([`architecture.md`](../architecture.md), § 9). Deux semaines en font 40 320, mais le bassin est plein en moins de 300 : au-delà, plus rien ne bouge.
- **Le levier `patience`** multiplie le limon déposé pendant l'absence (§ 8).
- **Une levée bâtie avant de partir tient** pendant l'absence. Quand son creux est plein, elle disparaît, et l'on ne peut pas en bâtir d'autre avant le retour.
- **Le bassin plein attend le joueur.** S'il se remplit pendant l'absence, il reste plein et immobile. Au retour, le joueur le voit, et la descente part une crue plus tard. La seule descente qu'il ne décide pas se fait sous ses yeux.
- **Au retour**, le lit n'écrit aucune ligne d'absence : le noyau ne montre donc pas de résumé. Après une demi-heure d'absence, le rappel de reprise ne donne que le lieu ([bible](../bible.md), § 10 : « le lit, rien »). La première fois que le joueur revient d'une absence d'au moins une heure, le jeu parle : « Ce que vous avez laissé en haut est toujours là. »
- **C'est la strate de l'absence** (§5) : on peut la laisser deux semaines. Elle rend le jeu jouable sans y toucher tous les jours.

## 11. Textes

**Budget : 100 mots** ([bible](../bible.md), § 9), le plus petit de toutes les strates. Le peuple du lit n'écrivait pas : c'est le jeu qui parle, une fois, en quatre phrases.

- **Les quatre phrases du jeu** (bible, § 8), en proposition pour [#92](https://github.com/DavidGiangiacomo/strates/issues/92) :

  | Quand | Phrase |
  |---|---|
  | À l'arrivée | « Rien ne presse. » |
  | Au premier retour après une heure d'absence au moins | « Ce que vous avez laissé en haut est toujours là. » |
  | Quand le dernier creux est plein : il n'y a plus rien à fermer | « Vous n'avez rien à décider ici. » |
  | Pendant la descente | « C'était la seule fois. » |

  Chacune paraît seule, au centre de la coupe, puis s'efface. Chacune est vraie au moment où elle paraît : quand le dernier creux est plein, il ne reste plus rien à décider. Elles disent « vous » : c'est la seule fois du jeu (bible, § 2).
- **Les mots de l'interface** : crue, limon, couche et rive (bible, § 4), sur la coupe ; coudée et doigt, sur l'échelle.
- **La lecture de l'échelle**, en toutes lettres : « aucune coudée » à l'arrivée, « sept doigts », « neuf coudées et quatorze doigts », puis « trente-six coudées » à la rive. Les nombres en lettres ne comptent pas dans le budget.
- **L'aide** : une page dessinée, la coupe d'une crue. L'eau monte, se repose derrière une levée, se retire, et la couche reste. Les quatre mots, et rien sur la fin. Elle ne dit pas « vous ».
- **Le rappel de reprise** : rien (bible, § 10). Le noyau donne le lieu.
- **Les traces pour le fond** (bible, § 5) : ses couches, dessinées, sans un mot. C'est la coupe du bassin plein, telle que le joueur l'a remplie : les couches sombres de l'eau retenue dans les creux, la couche épaisse de la grande crue, et dans la rive les fosses de la dette, tablettes brisées ou entières. Elle change avec le parcours : les levées du joueur, et l'issue de la dette.
- **Les noms d'en bas** des objets de la dette sont ceux du catalogue (§ 8). Ils ne s'écrivent que dans l'inventaire du noyau.

## 12. Critère R5

**Avis : le lit tient comme jeu autonome de deux heures, mais autrement que les autres : c'est un jeu d'attente, qu'on quitte et qu'on retrouve. C'est la strate la plus exposée au critère.**

Ce qui le fait tenir :
- **Un geste rare, et qui se voit** : fermer un creux, c'est voir l'eau se reposer derrière la levée, et la couche plus sombre qui en reste. Quatre fois, l'échelle repart plus vite.
- **Le temps, rendu visible** : une couche par crue, l'échelle qui s'enterre, la roche aux encoches qui disparaît, la grande crue. C'est le seul endroit du jeu où l'on regarde le temps passer, et ce qu'il laisse.
- **Une fin qui vient seule** : le bassin plein, le fleuve qui passe ailleurs, et la descente qu'on n'a pas choisie.
- **La seule fois où le jeu parle**, en quatre phrases.
- **Rien de commun avec les autres strates (I1)** : ni achat, ni production, ni rapport, ni échéance ; une mesure en coudées, écrite en lettres.

**La condition** : que l'attente soit un repos, et pas un vide. Le lit doit pouvoir se laisser : fermé deux heures ou deux semaines, il attend. Celui qui reste devant doit avoir de quoi regarder.

**Ce qui le ferait tomber** : un joueur qui reste deux heures devant le bassin, sans comprendre qu'il peut partir, et qui s'ennuie. La première phrase, « Rien ne presse. », doit le lui dire sans le dire.

**Recommandation** : à la recette ([#120](https://github.com/DavidGiangiacomo/strates/issues/120)), observer si les joueurs partent et reviennent, et ce qu'ils disent de l'attente. Le lit ne se juge pas sur une session continue de deux heures, mais sur le retour.

## 13. Questions ouvertes

1. **Le critère R5** (§ 12) : un jeu d'attente tient-il comme strate ? À juger au retour, pas à la session.
2. **Le rythme de la crue** : trente secondes, comme le calendrier de la dette. Une crue par minute serait plus calme, mais donnerait 120 couches au lieu de 240, et le lit ne répondrait plus au compte des crues.
3. **L'échelle en lettres** : « vingt-sept coudées et vingt et un doigts » se lit mal d'un coup d'œil. Les chiffres seraient plus lisibles, mais moins propres au lit. À voir au playtest.
4. **La patience de qui ne fait rien** (§ 7) : l'acte récompense aussi l'absence de tout geste. Faut-il qu'il demande au moins un creux fermé ?
5. **L'échelle qui s'arrête** pendant qu'un creux se remplit : le joueur comprend-il que l'eau va au creux ? Le son de l'eau qui s'y engouffre doit l'y aider.
6. **Le distrait** ferme peu de creux : ses passages tombent entre l'arrivée de l'eau et le creux plein. Un creux atteint pourrait se signaler davantage, sans que le jeu parle.
7. **La descente qui attend** (§ 10) : une crue de délai suffit-elle pour voir le bassin plein ? Et si le joueur revient sur un autre onglet que celui du jeu ? À régler avec la descente automatique ([#106](https://github.com/DavidGiangiacomo/strates/issues/106)).
8. **« Ce que vous avez laissé en haut est toujours là. »** : un joueur qui ne s'absente jamais une heure ne la lira pas. Le lit garde alors trois phrases sur quatre, comme le prévoit le §10 (« trois ou quatre textes »).
9. **Une seule levée** : deux feraient deux décisions de plus, et donneraient un sens à l'ordre des creux. Mais le lit doit rester presque sans gestes.
10. **La trace du lit au fond** : la coupe du bassin plein, à dessiner avec la fiche du fond ([#65](https://github.com/DavidGiangiacomo/strates/issues/65)) et ses traces ([#109](https://github.com/DavidGiangiacomo/strates/issues/109)).
11. **La remontée finale** (§11) : le bassin plein, immobile, l'échelle enterrée. À décider avec [#128](https://github.com/DavidGiangiacomo/strates/issues/128).
12. **Le compte des crues** ([fiche de la dette](strate-6.md), question 11) : le lit y répond par la rive, ses couches fines et sa couche épaisse, et par la grande crue (§ 3). À vérifier quand les deux strates seront dessinées.
13. **La réception des objets** (§ 8) : à coder par [#108](https://github.com/DavidGiangiacomo/strates/issues/108). Le catalogue donnait au gage patient « le levier secondaire du lit » : c'est la patience.

# La Compréhension

*Design du système, issue [#44](https://github.com/DavidGiangiacomo/strates/issues/44). Il précise le §8 du [design doc](design-doc.md) et en tranche le palier κ = 100 (décision D-007). Le code suivra : le modèle et les actes ([#56](https://github.com/DavidGiangiacomo/strates/issues/56)), la couche d'opacité ([#66](https://github.com/DavidGiangiacomo/strates/issues/66)), l'intégration aux strates 1 et 2 ([#78](https://github.com/DavidGiangiacomo/strates/issues/78)).*

*Choix tranchés le 6 octobre 2026 :*
- *les formules réelles apparaissent **progressivement**, à partir de κ = 50, et toutes à κ = 100 ;*
- *κ est **visible** dans le bandeau, mais les actes sont **muets** : rien ne dit ce qui l'a fait monter.*

*Renvois : « §8 » désigne une section du design doc, « § 3 » une section de cette page. Les « fiches » sont celles des strates (`docs/strates/`).*

## 1. Ce qu'elle est

- La Compréhension, κ, va de 0 à 100. Elle s'écrit en pourcentage : « Compréhension 22 % ».
- C'est le seul progrès permanent du jeu (§4, règle 3). Elle ne se perd jamais au fil des strates, et elle appartient à la partie : une nouvelle partie repart de zéro.
- Elle ne donne **aucun bonus numérique**. Elle change la lecture : l'opacité de chaque strate se lève plus vite (§ 4), le graphe de dépendances apparaît (§ 5), puis les formules réelles (§ 5).
- Elle monte par **actes de compréhension**, jamais par le temps passé (§ 2). Le joueur qui apprend vraiment va de plus en plus vite ; celui qui brute-force refait vingt minutes de découverte à chaque étage (§8).

## 2. Les actes de compréhension

### Les règles

- **Un acte se fait une fois par strate et par partie.** Il vaut un nombre fixe de points de κ.
- **Il est muet.** Rien ne l'annonce, ni sur le moment, ni à la descente. Le joueur voit seulement κ monter (§ 7). Une liste d'actes à cocher pousserait à fuir l'aide par calcul, et l'acte ne dirait plus rien de la compréhension.
- **Il est crédité à la descente**, quand le joueur quitte la strate. κ gagné dans une strate agit donc dès l'arrivée dans la suivante.
- **Il se constate dans le jeu, jamais sur déclaration.** C'est un fait mesurable par la logique de la strate ou par le noyau : un seuil atteint sans aide, un hiver passé sans rupture.

### Deux actes génériques

| Acte | Définition | Où |
|---|---|---|
| **Sans aide** | Atteindre le seuil sans avoir ouvert l'aide de la strate. Après le seuil, l'aide est libre. | toutes les strates, de 1 à 7 |
| **Sans artefact** | Atteindre le seuil sans aucun artefact actif, puissant ou utile (D-002) : le joueur a laissé ses objets en haut, ou ils sont usés. | de 2 à 7 ; la surface n'en reçoit jamais |

Les autres actes sont propres à chaque strate. Le modèle de la famille est celui du §8 : **trouver le goulot avant que le jeu ne le signale**. Chaque fiche les définit dans son § 7, avec leur poids.

### Le barème

La progression du §9 est le **maximum** : le joueur qui accomplit tous les actes arrive au fond avec 96, et le fond donne les 4 derniers points. Les fiches des strates 1 et 2 l'entendaient déjà ainsi (« ensemble, ils couvrent les 8 points »).

| Strate | κ à l'arrivée, au mieux | Points | Sans aide | Sans artefact | Actes propres |
|---|---|---|---|---|---|
| 1 · La surface | 0 | 8 | 3 | — | creuser avant la fissure, sans y avoir été poussé : 5 |
| 2 · Les caves | 8 | 14 | 3 | 3 | le premier hiver sans rupture, soudure comprise : 3 ; une année sans achat d'automne et sans rupture : 2 ; le seuil au plus tôt, sans grand hiver manqué : 3 |
| 3 · L'atelier | 22 | 16 | 4 | 3 | à définir par sa fiche : 9, dont la gêne de deux pièces voisines défaite avant que l'atelier ne la montre |
| 4 · Le réseau | 38 | 17 | 4 | 3 | à définir par sa fiche : 10, dont le goulot trouvé avant que le réseau ne le signale |
| 5 · Le chœur | 55 | 15 | 4 | 3 | à définir par sa fiche : 8, dont un rapport juste réglé à l'œil |
| 6 · La dette | 70 | 15 | 3 | 3 | à définir par sa fiche : 9, dont toutes les dettes soldées, sans défaut |
| 7 · Le lit | 85 | 11 | 2 | 3 | à définir par sa fiche : 6, dont la patience (peu de gestes jusqu'à la descente) |
| 8 · Le fond | 96 | 4 | — | — | y arriver |

- Les actes des strates 1 et 2 viennent de leurs fiches (§ 7), revus ici : à la surface, « creuser sans y avoir été poussé » pèse plus que « sans aide », que tout joueur d'incrémentaux fait sans y penser ; dans les caves, « sans artefact » remplace « le premier grand hiver au premier essai », que contient déjà « le seuil au plus tôt ».
- **Un jeu correct** en gagne environ les deux tiers, et arrive au fond vers κ = 65. C'est une estimation : elle sera mesurée au fil des strates, avec leurs joueurs automatiques.

## 3. Les paliers

| κ | Délai de levée (§ 4) | Graphe de dépendances | Formules réelles |
|---|---|---|---|
| 0 | 20 min | — | — |
| 25 | 12 min | — | — |
| 50 | 8 min | oui | aucune encore, puis une à une |
| 70 | 5 min | oui | 40 % |
| 85 | 4 min | oui | 70 % |
| 100 | 3 min | oui | toutes |

- **Le délai de levée** suit le §8 : environ 20 minutes à κ = 0, 8 à κ = 50, 3 à κ = 100. Entre les deux, il décroît régulièrement : `L(κ) = 20 × 0,15^(κ/100)` minutes.
- **Le graphe** apparaît à κ = 50.
- **Les formules** apparaissent ensuite peu à peu (§ 5) : la part accessible vaut `(κ − 50) / 50`.

**Au mieux**, le joueur arrive dans le chœur (5) avec κ = 55 : le graphe y apparaît, et les formules commencent dans la dette (6), à 40 %, puis dans le lit (7), à 70 %. **Un jeu correct** voit le graphe vers la strate 6 ou 7. Le palier κ = 100 n'est atteint qu'au fond, où il ne débloque plus rien d'utile : il dit que tout est lisible (D-007).

## 4. La levée de l'opacité

Chaque strate, sauf la surface, commence **partiellement opaque** (§8). L'opacité porte sur le **sens** des choses, jamais sur ce dont dépend le seuil : on ne cache pas ce qui ferait échouer par ignorance plutôt que par imprévoyance (fiche 2, § 7).

### Trois formes

| Forme | Opaque | Levée |
|---|---|---|
| **Les noms** | un glyphe à la place d'un libellé ; une unité sans nom | le libellé |
| **Les valeurs** | une grandeur masquée, ou montrée sans chiffre (une jauge sans échelle) | la valeur |
| **Les rôles** | un bouton ou un trait dont la fonction n'est pas dite | sa note, sa légende |

Chaque strate déclare ses éléments opaques dans son § 7 ; c'est la couche générique ([#66](https://github.com/DavidGiangiacomo/strates/issues/66)) qui les montre opaques, puis levés.

### Trois façons de lever

1. **Par l'usage** : un événement de la strate lève l'élément, au moment où le joueur a pu le comprendre. Dans les caves, le premier bilan nomme la marque d'hiver et révèle les pertes (fiche 2, § 7). C'est la voie normale.
2. **Par un objet** : un artefact d'affichage ou de raccourci lève des éléments dès l'arrivée. Les deux fenêtres nomment la marque et montrent les pertes (`docs/artefacts.md`, § 8).
3. **Par le délai** : un élément encore opaque après `L(κ)` minutes de jeu dans la strate se lève de lui-même. C'est ce que κ accélère. À κ = 0, tout est lisible au bout de 20 minutes au plus ; à κ = 50, de 8 ; à κ = 100, de 3. Le temps compté est celui de la strate : les absences comptent selon sa politique hors ligne.

Une strate peut exempter un élément du délai :
- quand le comprendre **est** le jeu : le chœur (5), « le pic de la mécanique de Compréhension » (§5), ne montrera jamais de nombres, quel que soit κ ;
- quand sa découverte est un moment de la strate : le grand cycle des caves se découvre en l'an 5, vers 32 minutes, et non au bout du délai (fiche 2, § 7).

**La surface** reste entièrement lisible. C'est le tutoriel de toutes les autres : elle parle notre langue (fiche 1, § 7). La décision de la fiche est confirmée.

## 5. Le graphe et les formules

**Le graphe de dépendances**, à partir de κ = 50 :
- il montre la structure de la strate : ce qui alimente quoi (`graphe()`, `docs/architecture.md`) ;
- un élément encore opaque y reste opaque, par un glyphe à la place de son nom : le graphe donne la forme, pas les mots ;
- il s'ouvre depuis le bandeau, sur la strate courante.

**Les formules réelles**, progressivement :
- chaque strate ordonne ses formules, de la plus simple à la plus profonde (`formules()`), et chacune est attachée à un élément ;
- à κ, les `⌈n × (κ − 50) / 50⌉` premières sont **accessibles**, n étant le nombre de formules de la strate ;
- une formule accessible s'affiche sur son élément, dans le graphe, **dès que cet élément est compris**, c'est-à-dire levé (§ 4) ;
- à κ = 100, toutes le sont ; le chœur n'en a pas ; le fond, rien à calculer.

Ce sont les formules des fiches (§ 3 et § 7) : le coût d'un exemplaire, la récolte, la marque d'hiver. La formule de la conversion à la descente (`docs/strates/descente-1-2.md`, P3) en fait partie, sur l'écran de fouille.

## 6. L'aide

- **Chaque strate a son aide**, écrite dans sa voix : la page « Comment tient la vallée » des caves, le panneau de la surface ([#16](https://github.com/DavidGiangiacomo/strates/issues/16), [#17](https://github.com/DavidGiangiacomo/strates/issues/17)). Elle décrit la strate, jamais le bandeau, et ne nomme pas ce qui est encore opaque.
- **Elle est toujours accessible**, par un lien de la strate. Elle ne coûte rien sur le moment.
- **Sa consultation est notée** : la strate appelle `noyau.ouvrirAide()`, et le noyau le note dans le journal de partie (`noterAide`). L'acte « sans aide » se juge au seuil, sur les ouvertures d'avant.
- **Elle ne prévient pas** que l'ouvrir coûte un acte : les actes sont muets (§ 2). Le joueur qui en a besoin la lit ; c'est sa compréhension qui se mesure, pas sa vertu.

## 7. Ce que voit le joueur

- **Le bandeau** porte « Compréhension 22 % », à côté de la profondeur et des artefacts.
- **κ monte à l'arrivée** dans la strate suivante, juste après que les objets ont rejoint les artefacts (storyboard, P6) : le compteur avance, sans un mot.
- **Il ne voit nulle part** la liste des actes, ni lesquels il a accomplis.
- **L'écran de fouille ne change pas** avec κ : on emporte « la turbine », et on découvre en bas « la roue chaude » (`docs/artefacts.md`, § 6). La découverte reste entière.

## 8. Dans le code

Des indications pour [#56](https://github.com/DavidGiangiacomo/strates/issues/56) et [#66](https://github.com/DavidGiangiacomo/strates/issues/66) ; le détail leur appartient.

- **Les actes** : une strate déclare les siens dans sa définition (identifiant, poids) et les signale par un événement de son contexte, comme ses traces. Le noyau constate les actes génériques au seuil, et crédite κ à la descente, une fois par acte et par partie, dans le journal de partie.
- **L'opacité** : une strate déclare ses éléments opaques et les événements qui les lèvent. La couche générique tient l'état de chaque élément, applique les objets et le délai `L(κ)`, et le donne à la vue.
- **Le graphe et les formules** : les accroches `graphe()` et `formules()` existent déjà dans le contrat. Elles attendent l'attache de chaque formule à un élément.
- **Le bandeau** affiche κ, déjà sauvegardé dans l'état du noyau (`kappa`).

## 9. Questions ouvertes

1. **Le calibrage d'un jeu correct** : environ les deux tiers des actes, κ ≈ 65 au fond. À mesurer strate par strate ; si un jeu correct ne voit jamais le graphe, le palier de 50 est trop haut.
2. **Le délai dans les strates où comprendre est le jeu** : au-delà du chœur, d'autres éléments devront peut-être être exemptés. Chaque fiche le dira.
3. **Le fond** : il donne 4 points à qui y arrive. Faut-il plutôt porter κ à 100 pour tout le monde, comme un épilogue où tout devient lisible ? À trancher avec la fiche du fond ([#65](https://github.com/DavidGiangiacomo/strates/issues/65)).
4. **L'acte « sans aide » à la surface** : presque tous les joueurs le font sans le savoir. Il pèse peu (3 points) ; à revoir si le playtest montre que l'aide de la surface sert vraiment.

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
| 3 · L'atelier | 22 | 16 | 4 | 3 | la gêne défaite avant que l'atelier ne la montre : 5 ; le premier plan plein qui tourne : 4 |
| 4 · Le réseau | 38 | 17 | 4 | 3 | à définir par sa fiche : 10, dont le goulot trouvé avant que le réseau ne le signale |
| 5 · Le chœur | 55 | 15 | 4 | 3 | à définir par sa fiche : 8, dont un rapport juste réglé à l'œil |
| 6 · La dette | 70 | 15 | 3 | 3 | la grande crue honorée, sans défaut : 4 ; toute la strate sans une échéance reportée : 3 ; la grande crue fixée au plus juste, puis honorée : 2 |
| 7 · Le lit | 85 | 11 | 2 | 3 | une levée bâtie avant l'eau, sur un autre creux que le premier : 3 ; la patience, sans jamais déplacer une levée jusqu'à la descente : 3 |
| 8 · Le fond | 96 | 4 | — | — | y arriver |

- Les actes des strates 1 à 3, 6 et 7 viennent de leurs fiches (§ 7). Ceux des strates 1 et 2 sont revus ici : à la surface, « creuser sans y avoir été poussé » pèse plus que « sans aide », que tout joueur d'incrémentaux fait sans y penser ; dans les caves, « sans artefact » remplace « le premier grand hiver au premier essai », que contient déjà « le seuil au plus tôt ». Dans l'atelier, « le seuil sans limer » a quitté le barème à l'équilibrage ([#96](https://github.com/DavidGiangiacomo/strates/issues/96)) : ses 3 points sont allés à la gêne défaite et au premier plan plein.
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
- il s'ouvre depuis le bandeau, sur la strate courante ;
- il montre ce que la strate expose, dans l'état où elle est. Une strate dont le jeu est un graphe, comme le réseau (4), n'y montre que ce que le joueur a déjà relié : le graphe ne la résout pas à sa place.

**Les formules réelles**, progressivement :
- chaque strate ordonne ses formules, de la plus simple à la plus profonde (`formules()`), et chacune est attachée à un élément ;
- à κ, les `⌈n × (κ − 50) / 50⌉` premières sont **accessibles**, n étant le nombre de formules de la strate ;
- une formule accessible s'affiche sur son élément, dans le graphe, **dès que cet élément est compris**, c'est-à-dire levé (§ 4) ;
- à κ = 100, toutes le sont ; le chœur n'en a pas ; le fond, rien à calculer.

Ce sont les formules des fiches (§ 3 et § 7) : le coût d'un exemplaire, la récolte, la marque d'hiver. La formule de la conversion à la descente (`docs/strates/descente-1-2.md`, P3) en fait partie, sur l'écran de fouille. C'est la seule formule du noyau : comme la première de chaque strate, elle est accessible dès κ = 51.

## 6. L'aide

- **Chaque strate a son aide**, écrite dans sa voix : la page « Comment tient la vallée » des caves, le panneau de la surface ([#16](https://github.com/DavidGiangiacomo/strates/issues/16), [#17](https://github.com/DavidGiangiacomo/strates/issues/17)). Elle décrit la strate, jamais le bandeau, et ne nomme pas ce qui est encore opaque.
- **Elle est toujours accessible**, par un lien de la strate. Elle ne coûte rien sur le moment.
- **Sa consultation est notée** : la strate appelle `noyau.ouvrirAide()`, et le noyau le note dans le journal de partie (`noterAide`). L'acte « sans aide » se juge au seuil, sur les ouvertures d'avant.
- **Elle ne prévient pas** que l'ouvrir coûte un acte : les actes sont muets (§ 2). Le joueur qui en a besoin la lit ; c'est sa compréhension qui se mesure, pas sa vertu.

## 7. Ce que voit le joueur

- **Le bandeau** porte « Compréhension 22 % », à côté de la profondeur et des artefacts.
- **κ monte à l'arrivée** dans la strate suivante, juste après que les objets ont rejoint les artefacts (storyboard, P6) : le compteur avance, sans un mot.
- **Il ne voit nulle part** la liste des actes, ni lesquels il a accomplis.
- **L'écran de fouille ne change pas** avec κ, sauf pour la formule de la conversion, à partir de κ = 51 (§ 5). On emporte toujours « la turbine », et on découvre en bas « la roue chaude » (`docs/artefacts.md`, § 6). La découverte reste entière.

## 8. Dans le code

**Fait par [#56](https://github.com/DavidGiangiacomo/strates/issues/56)** : κ, les actes et le suivi de l'aide.
- **Le barème** est dans le noyau (`src/noyau/logique/comprehension.ts`), pas dans les strates : elles ne peuvent pas s'attribuer de κ. Les actes propres des strates 3 à 7 s'y ajouteront avec leurs fiches.
- **Une strate signale un acte** par un événement de son contexte, comme ses traces : `ctx.emettre({ type: "acte", acte: "premier-hiver" })`. Le noyau le note dans l'entrée de la strate au journal de partie (`actes`), une fois, s'il est à son barème ; sinon, il l'ignore.
- **Le noyau constate lui-même** « sans aide », au seuil, si l'aide n'a pas été ouverte avant, et « sans artefact », à la descente, si aucun objet n'agissait dans la strate.
- **À la descente**, il crédite à κ le gain des actes de la strate quittée, plafonné à 100, et le note au journal (`kappaGagne`). Reboucher ne crédite rien. Au fond, l'arrivée est créditée aussitôt.
- **κ et les actes se sauvegardent** : le journal de partie les porte depuis le format 2 de la sauvegarde. Une partie au format 1 n'a accompli aucun acte.
- **Le bandeau** affiche « Compréhension N % ». Il suit le spectacle de la descente : κ y monte à l'arrivée, après les objets (`Passage.kappa`).

**Fait par [#66](https://github.com/DavidGiangiacomo/strates/issues/66)** : la couche d'opacité, écrite une fois pour les huit strates.
- **Une strate déclare ses éléments opaques** (`opacite`) : pour chacun, les clés de texte qu'il couvre, les objets qui le lèvent, et la part du délai qu'il attend (`delai` : 1 par défaut, null pour l'exempter).
- **Elle les lève à l'usage** par un événement, comme ses actes : `ctx.emettre({ type: "levee", element: "marque" })`. Le noyau note la levée dans l'entrée de la strate au journal de partie (`leves`), si l'élément est déclaré. Levé, il le reste : le journal se sauvegarde, depuis le format 3.
- **Le noyau calcule le reste** (`Noyau.elementsOpaques`, `src/noyau/logique/opacite.ts`). Un objet qui agit ici lève dès l'arrivée les éléments qui le nomment. Le délai `L(κ)` se compte sur le temps de la strate, absences comprises selon sa politique hors ligne.
- **La vue lit à travers la couche** (`CoucheOpacite`, `src/noyau/ui/opacite.svelte.ts`) :
  - `o(cle)` rend des glyphes tant que l'élément de la clé est opaque, un par mot, tirés de la clé ;
  - `lisible(element)` dit si un élément est levé, pour ce qui ne s'écrit pas : une jauge sans échelle, un trait ;
  - une strate peut donner ses propres glyphes (`DefinitionStrate.glyphes`).
- **La strate factice** montre les trois façons de lever, et un élément exempté du délai. Ses tests suivent les paliers de κ, du noyau jusqu'à sa vue (`opacite-noyau.test.ts`, `opacite.svelte.test.ts`).

**Fait par [#78](https://github.com/DavidGiangiacomo/strates/issues/78)** : les strates 1 et 2 branchées sur κ et sur l'opacité.
- **« Creuser avant la fissure »** : le clic sur « creuser » passe par le noyau, et la fissure par l'état de la strate. La strate montre donc son filet au noyau (`LogiqueStrate.filet`). Le noyau constate l'acte quand le joueur ouvre la fouille, si la fissure n'est pas encore apparue. Les caves montrent aussi le leur, mais leur barème ne connaît pas cet acte.
- **Les actes des caves** se signalent au bilan de l'hiver (`ACTES`, dans `logique/regles.ts` des caves) :
  - le premier hiver passé sans rupture ;
  - une année sans achat d'automne ni rupture, hors l'année de l'arrivée ;
  - le seuil atteint au bilan de l'an 16.
- **L'opacité des caves** suit leur fiche (§ 7) :
  - la marque d'hiver et les pertes se lèvent au premier bilan, ou dès l'arrivée par les deux fenêtres ;
  - le grand cycle se lève en l'an 5, ou dès l'arrivée par l'armoire, jamais par le délai ;
  - les naissances se lèvent au premier hiver réussi.

  Chaque bilan redit ses levées : une partie commencée avant l'opacité les retrouve au bilan suivant.
- **Le graphe et les formules** : les deux strates les exposent (`graphe`, `formules`), selon leurs fiches (§ 7).
  - Une formule s'attache à un nœud du graphe (`Formule.noeud`).
  - Les noms des nœuds passent par l'opacité : un élément opaque y reste un glyphe.
  - Les affichages sont venus ensuite ([#76](https://github.com/DavidGiangiacomo/strates/issues/76), [#77](https://github.com/DavidGiangiacomo/strates/issues/77)).
- **Mesuré par les joueurs automatiques** ([`strate-2-mesures.md`](strates/strate-2-mesures.md)) :
  - un jeu correct gagne dans les caves 11 points sur 14 avec les objets de la surface, et 14 sans ;
  - avec les 8 points de la surface, s'il creuse avant la fissure, il arrive à l'atelier avec κ = 19 ou 22 ;
  - ces joueurs n'ouvrent jamais l'aide et ne manquent aucun hiver : leurs chiffres sont un plafond.

**Fait par [#76](https://github.com/DavidGiangiacomo/strates/issues/76)** : l'affichage du graphe de dépendances.
- **Le bandeau** offre un bouton « graphe » à partir de κ = 50 (`SEUIL_GRAPHE`), si la strate expose son graphe (`grapheOuvrable`). Comme les objets et κ, il suit le spectacle de la descente : il apparaît à l'arrivée.
- **Le panneau** (`noyau/ui/Graphe.svelte`) s'ouvre sous le bandeau, dans sa palette : il appartient au noyau. La strate continue de vivre dessous.
  - Les noms des nœuds passent par la couche d'opacité : un élément encore opaque y garde ses glyphes.
  - Au survol d'un nœud, ses liens s'éclairent et le reste s'efface.
  - Il se referme par « fermer » ou Échap, et le focus revient au bouton. Il se referme aussi au coup de pioche.
  - Pour les lecteurs d'écran, le graphe se lit en phrases : « Récolte ← Familles, Outils, Saisons ».
- **La disposition** (`noyau/ui/graphe.ts`) se fait en couches, de gauche à droite, de ce qui alimente à ce qui est alimenté (la méthode de Sugiyama, simplifiée).
  - Les liens qui ferment un cycle, comme le bilan qui renvoie aux familles, se tracent en pointillés et entrent dans leur cible par la droite.
  - Un lien qui saute des couches y passe par des points de passage : il contourne les nœuds.
  - Dans chaque couche, des passes de barycentres réduisent les croisements ; l'ordre des nœuds donnés par la strate départage.
- **Un test** vérifie que chaque strate du registre expose un graphe bien formé, nommé par ses textes (`tests/graphes.test.ts`). Une strate ajoutée y passera.

**Fait par [#77](https://github.com/DavidGiangiacomo/strates/issues/77)** : l'affichage des formules réelles.
- **Le palier** est dans le noyau (`formulesAccessibles`, `src/noyau/logique/comprehension.ts`) : les ⌈n × (κ − 50) / 50⌉ premières formules de la strate sont accessibles. Le compte porte sur toutes ses formules, même celles dont le nœud n'a pas encore paru dans le graphe : elles l'y attendent.
- **Le graphe** écrit chaque formule accessible sur son nœud, s'il est compris (`formulesAffichees`, `noyau/ui/graphe.ts`). La couche d'opacité le dit par la clé du nœud (`CoucheOpacite.cleLisible`).
  - Le nœud devient une carte : ses formules s'écrivent sous son nom, en chasse fixe, coupées entre les mots à la française. Sa colonne s'élargit avec lui.
  - Les lecteurs d'écran les lisent après ce qui alimente le nœud : « Récolte — familles × 2,8 boisseaux × … ».
- **L'écran de fouille** écrit la formule de la conversion à partir de κ = 51, sous le prix d'un point de plus : « Formule points = ⌊log₁₀(crédits gagnés) × 1,4⌋ » (`formuleConversion`, `noyau/ui/fouille.ts`). Le taux est celui du calcul (`TAUX_FOUILLE`) : la formule affichée ne peut pas s'en écarter.
- **Un test** joue chaque strate du registre jusqu'au seuil, avec son joueur automatique (`tests/graphes.test.ts`).
  - Chaque formule s'attache à un nœud que le graphe a montré.
  - Au seuil, les formules s'écrivent au palier décidé : aucune à κ = 50, toutes à κ = 100.
  - Le chœur et le fond n'en ont pas. Une strate ajoutée au registre y passera, avec son joueur.
- **En jeu**, aucune formule ne se voit encore : κ vaut au plus 8 dans les caves. Les outils de développement fixent κ pour les voir.

**Fait par [#95](https://github.com/DavidGiangiacomo/strates/issues/95)** : l'atelier branché sur κ et sur l'opacité ([fiche](strates/strate-3.md), § 7).
- **Ses trois actes propres** entrent au barème : la gêne défaite avant que l'atelier ne la montre, le premier plan plein qui tourne, le seuil sans limer. Avec « sans aide » et « sans artefact », l'atelier a ses 16 points.
- **Son opacité** : les noms des pièces (sauf la roue), leurs valeurs et le rôle de la lime. Ils se lèvent à l'usage, par les deux fenêtres et le cahier à lignes, ou au délai.
- **Mesuré** : avec l'équilibrage ([#96](https://github.com/DavidGiangiacomo/strates/issues/96)), ci-dessous.

**Fait par [#96](https://github.com/DavidGiangiacomo/strates/issues/96)** : l'équilibrage de l'atelier ([fiche](strates/strate-3.md), § 14).
- **Le seuil sans limer** quitte le barème. Un assemblage sans un coup de lime existe avec la vraie nomenclature, mais un recuit simulé a dû essayer plus de 3 millions d'échanges pour le trouver : c'est trop dur pour un acte. Ses 3 points vont aux deux autres actes propres. La gêne défaite passe à 5, comme « creuser avant la fissure », qui suit le même modèle (§ 2) ; le premier plan plein passe à 4. L'atelier garde ses 16 points.
- **Mesuré par les joueurs automatiques** ([`strate-3-mesures.md`](strates/strate-3-mesures.md)) :
  - un jeu correct gagne dans l'atelier 9 points sur 16 avec les objets, et 12 sans : « sans aide », la gêne défaite, et « sans artefact » s'il n'en a pas ;
  - il ne remplit jamais le premier plan : il l'agrandit dès qu'il le peut ;
  - arrivé avec κ = 19 ou 22, il descend au réseau avec κ = 28 s'il a gardé ses objets, 34 s'il n'en a jamais emporté. Comme dans les caves, ces chiffres sont un plafond : ces joueurs n'ouvrent jamais l'aide.

**À venir** : les actes propres des strates 4 à 7, avec leurs fiches.

## 9. Questions ouvertes

1. **Le calibrage d'un jeu correct** : environ les deux tiers des actes, κ ≈ 65 au fond. Les joueurs automatiques des caves en gagnent plus (11 points sur 14 avec les objets), parce qu'ils n'ouvrent jamais l'aide et ne manquent aucun hiver. Le vrai calibrage viendra des joueurs du playtest, strate par strate. Si un jeu correct ne voit jamais le graphe, le palier de 50 est trop haut.
2. **Le délai dans les strates où comprendre est le jeu** : au-delà du chœur, d'autres éléments devront peut-être être exemptés. Chaque fiche le dira.
3. **Le fond** : il donne 4 points à qui y arrive. Faut-il plutôt porter κ à 100 pour tout le monde, comme un épilogue où tout devient lisible ? À trancher avec la fiche du fond ([#65](https://github.com/DavidGiangiacomo/strates/issues/65)).
4. **L'acte « sans aide » à la surface** : presque tous les joueurs le font sans le savoir. Il pèse peu (3 points) ; à revoir si le playtest montre que l'aide de la surface sert vraiment.

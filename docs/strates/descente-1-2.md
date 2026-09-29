# Descente 1 → 2 — storyboard du passage

*Storyboard, issue [#11](https://github.com/DavidGiangiacomo/strates/issues/11). Le passage de la surface aux caves est l'élément obligatoire du MVP (§14). L'orchestration de la descente ([#30](https://github.com/DavidGiangiacomo/strates/issues/30)) le code, et les directions artistiques de la surface ([#31](https://github.com/DavidGiangiacomo/strates/issues/31)) et des caves ([#33](https://github.com/DavidGiangiacomo/strates/issues/33)) l'habillent.*

*Choix tranché le 28 septembre 2026 : « creuser » ouvre la fouille, mais seul « descendre » engage. Jusque-là, le joueur peut **reboucher** et retrouver la surface telle qu'il l'a laissée.*

*Renvois : « §14 » désigne une section du [design doc](../design-doc.md), « § 3 » une section de cette page, « fiche 1 » et « fiche 2 » les fiches de la [surface](strate-1.md) et des [caves](strate-2.md).*

## 1. Ce que le passage doit faire

Le §14 demande cinq choses au passage. Chacune a son plan :

| Ce que demande le §14 | Où c'est tenu |
|---|---|
| L'écran change entièrement | P2 et P5 : tout ce qui n'est pas le bandeau quitte l'écran par le bas, puis par le haut |
| Les crédits deviennent 12 points de fouille | P3, la conversion : le taux est affiché, pas seulement le résultat |
| Le joueur choisit les objets de la surface qu'il emporte | P4, le choix : la présélection, et ce qui est abandonné |
| La ressource devient du grain | P6, l'arrivée : là où étaient les crédits, il y a 250 boisseaux |
| La courbe n'est plus exponentielle mais saisonnière | P7, les dix premières minutes : un été, un hiver, un bilan |

Six contraintes viennent du design doc et des fiches :

- **Seul le bandeau reste identique** (§12). Il ne bouge pas de toute la séquence. Seuls ses deux nombres changent : Artefacts, puis Profondeur.
- **Le joueur arrive au jour 70 de l'an 1, pas plus tard** (fiche 2, § 5). Ni la fouille ni la transition ne prennent de temps aux caves.
- **Le choc d'arrivée survit aux objets.** L'écran de fouille ne montre pas leurs effets, et leurs multiplicateurs ne s'éveillent qu'au bilan du premier hiver (fiche 2, § 8).
- **Le mouvement va toujours vers le bas** (§1). Tout ce qui bouge pendant la séquence descend. La seule exception est « reboucher », qui referme au lieu de remonter.
- **L'écran de fouille est générique.** C'est le même à chaque descente, sauf la descente automatique 7 → 8 ([`artefacts.md`](../artefacts.md), § 6). Seules deux choses dans cette page sont propres au passage 1 → 2 : les raccords (§ 5), et la valeur convertible écrite dans la notation de la surface.
- **Aucun texte ne dit « creuser »**, à part le bouton lui-même (fiches 1 et 2, § 11).

## 2. La séquence en un coup d'œil

| Plan | Où | Durée | Ce qui se passe | Ce que fait le joueur |
|---|---|---|---|---|
| **P1** — Le seuil | surface | — | 1 M cr/s : le dernier objectif, puis « Tous les objectifs sont atteints. » Rien n'annonce la fouille. Le filet (la fissure) vient 5 minutes plus tard. | Il joue, ou il attend. |
| **P2** — Le coup de pioche | surface → fouille | 1 s | La fissure traverse le tableau de bord, qui s'ouvre sur le sol. La surface se fige. | Il a cliqué sur « creuser ». |
| **P3** — La conversion | fouille | 2 s | Les crédits gagnés, puis les points de fouille, d'un coup, puis le prix d'un point de plus. | Il lit. |
| **P4** — Le choix | fouille | à son rythme | Le catalogue de la surface, avec la présélection cochée. | Il coche et décoche, puis « descendre » ou « reboucher ». |
| **P5** — La descente | fouille → caves | 4 s | Tout le reste monte hors de l'écran, sauf les objets emportés. Le sol défile, et la Profondeur passe à 2. | Il regarde. |
| **P6** — L'arrivée | caves | 1 s | Jour 70 de l'an 1. Les objets rejoignent le bandeau, le registre écrit sa première page, et l'aiguille se met à tourner. | Il découvre l'écran. |
| **P7** — Les dix premières minutes | caves | 10 min | Le premier été, le premier hiver (4 min 40), le premier bilan (vers 6 min 15), le deuxième été. | Il joue comme en haut, puis autrement. |

**Durée.**
- La séquence impose environ **8 secondes** sans interaction : 1 s pour P2, 2 s pour P3, 4 s pour P5 et 1 s pour P6. Elle se réduit à 2 secondes si le joueur préfère moins de mouvement (§ 8).
- Le choix va au rythme du joueur. Il faut compter de 30 secondes à 2 minutes pour lire six lignes et, peut-être, changer la présélection.
- Du clic sur « creuser » au jour 70, il se passe donc **de 40 secondes à 2 minutes** environ.

## 3. Plan par plan

### P1 — Le seuil (surface)

Rien de nouveau ici : tout est décrit dans la fiche 1, § 4.

- Le dixième objectif, 1 M cr/s, s'affiche comme les autres. Puis le tableau de bord écrit « Tous les objectifs sont atteints. », et l'emplacement de l'objectif reste vide.
- Le bouton « creuser » cesse de résister, sans changer d'aspect ni rien annoncer.
- Cinq minutes plus tard, si le joueur n'a pas creusé, la fissure part du graphique et monte en 2 minutes jusqu'au bouton.
- La surface continue de tourner, et sa valeur convertible monte encore.

### P2 — Le coup de pioche (1 s)

Le clic sur « creuser », une fois le seuil atteint, ouvre la fouille **tout de suite**, sans fenêtre de confirmation. C'est la « transgression douce » du §10 : le jeu ne l'a jamais demandé, et il ne demande pas non plus si on est sûr.

- **De 0 à 0,4 s.** Une fissure part du bouton « creuser » et traverse le tableau de bord jusqu'au bas de l'écran. Si le filet avait déjà paru, c'est sa fissure qui se prolonge. Le dessin est celui de `src/noyau/ui/fissure.ts` : fixe, irrégulier, ramifié.
- **De 0,4 à 1 s.** Le tableau de bord se fend le long de la fissure. Ses deux moitiés glissent vers le bas et s'effacent. Dessous, il y a le sol, c'est-à-dire l'écran de fouille.
- **La surface se fige au clic.** Elle ne reçoit plus de tick, ni d'absence, tant que la fouille est ouverte. Sa valeur convertible est lue à cet instant.
- **Son** (phase 2, [#46](https://github.com/DavidGiangiacomo/strates/issues/46)) : le coup sourd du sol qui résiste, mais suivi cette fois d'un éboulement bref. Le MVP est muet.

```
 P2, à 0,4 s : la fissure part du bouton et traverse le tableau de bord
┌──────────────────────────────────────────────────────────────────┐
│ Profondeur 1   Artefacts 0                              creuser  │
├───────────────────────────────────────────────────────────┬──────┤
│  Crédits  48,2 M cr     Production  1,02 M cr/s           ╲      │
│  Tous les objectifs sont atteints.                        ╱      │
│ ┌──────────────────────────────────────────┐             ╲       │
│ │ Production                           __╱─┼─────╮       ╱       │
│ │                               __---      │     ╰──────╲        │
│ │                    ___---                │  Produire   ╱       │
│ │ _______-----                             │            ╲        │
│ └──────────────────────────────────────────┘  Poste     ╱        │
│                                               Équipe     ╲       │
│                                               …          ╱       │
└──────────────────────────────────────────────────────────╲───────┘
   La branche qui vient du graphique est celle du filet, s'il avait paru.
```

### P3 — La conversion (2 s)

L'écran de fouille appartient au noyau. C'est **le bandeau qui s'ouvre** : le même gris sombre, la même police système, des chiffres alignés, et des libellés courts. Il n'est ni la surface ni les caves : c'est le sol entre les deux. Avec le bandeau, c'est le seul écran que le joueur reverra à chaque descente.

Il se remplit en trois temps, sans défilement de compteur :

1. **À 0 s** : le nom de la strate quittée, « La surface », et la valeur convertible, « Crédits gagnés 612 M cr ».
   - La valeur est écrite **dans la notation de la surface**, avec sa police et sa couleur. C'est le dernier fragment du tableau de bord.
   - Le libellé dit « gagnés » : c'est le cumul, pas le stock. Dépenser n'a rien coûté (D-003).
2. **À 0,8 s** : « Points de fouille 12 », d'un seul coup.
   - Pas de compteur qui monte ni d'effet de gain. Là-haut, chaque gain défilait ; ici, 612 millions deviennent 12, et c'est tout.
3. **À 1,4 s** : « Un point de plus 1,93 Md cr ».
   - C'est ainsi que **le taux brutal est affiché franchement**. Un résultat seul (612 M cr → 12) montre une conversion ; il faut un deuxième point de l'échelle pour montrer le taux.
   - Le joueur voit qu'il faudrait trois fois plus de crédits pour un seul point. C'est la leçon anti-farm du §4, apprise dès la première descente (fiche 1, § 4).
   - La formule elle-même reste cachée. Elle fait partie des formules exposées par la Compréhension ([#44](https://github.com/DavidGiangiacomo/strates/issues/44)).

Pour mémoire, 12 points demandent 373 M cr, 13 points 1,93 Md cr, et 14 points 10 Md cr : chaque point coûte environ cinq fois le précédent. Le joueur correct arrive au seuil avec environ 6 × 10⁸ cr, soit 12 points (fiche 1, § 9).

### P4 — Le choix (au rythme du joueur)

Sous la conversion, le catalogue de la strate quittée ([`artefacts.md`](../artefacts.md), § 6 et § 8) :

- **Six lignes**, par coût croissant (à coût égal, dans l'ordre de la table). Chaque ligne donne une case à cocher, le **nom d'en haut**, le coût et la famille d'effet.
- La famille s'écrit en toutes lettres (« multiplicateur », « affichage », « raccourci », « unique ») tant que la direction artistique n'a pas dessiné ses icônes.
- **Les noms sont familiers.** L'équipe, le serveur, la turbine et la filiale sont des générateurs de la surface ; le double écran et le plan stratégique sont deux de ses améliorations. Le joueur emporte des choses qu'il a achetées.
- **Les effets ne sont pas affichés**, ni les noms d'en bas : on emporte « La turbine » et on découvrira « la roue chaude ».
- **La présélection est cochée d'avance** : les objets les moins chers d'abord, tant que les points suffisent. Avec 12 points, cela fait 1 + 2 + 2 + 3 + 4, et le plan stratégique reste en haut.
- **En tête de la liste**, « Reste 0 point » : les points non dépensés.
- Un objet trop cher pour ce qui reste a sa case inactive. Pour le prendre, il faut d'abord en décocher un autre.
- Un objet décoché est marqué « laissé en haut ».
- **Deux lignes** sous la liste disent les règles, une seule fois : « Ce qui n'est pas emporté est abandonné. » et « Les points qui restent sont perdus. »
- **« descendre »** engage, sans fenêtre de confirmation : c'est le seul geste irréversible de la séquence. Il est permis de n'emporter aucun objet, ou de ne pas dépenser tous ses points.
- **« reboucher »**, un lien discret à gauche, referme la fouille. La touche Échap fait de même.
  - Les deux moitiés du tableau de bord remontent et se rejoignent en 0,5 s. La surface reprend là où elle s'était figée.
  - La fissure reste dessinée : le sol a été ouvert une fois.
  - Le clic suivant sur « creuser » rouvre la fouille, avec des points relus à ce moment-là.
  - C'est le seul mouvement vers le haut du jeu, et il ne fait que refermer.
- Les verbes du sol s'écrivent en minuscules, comme « creuser » : « descendre », « reboucher ».

```
 P4 : l'écran de fouille, présélection cochée
┌──────────────────────────────────────────────────────────────────┐
│ Profondeur 1   Artefacts 0                              creuser  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   La surface                                                     │
│                                                                  │
│   Crédits gagnés                                     612 M cr    │  ← notation de la surface
│   Points de fouille                                        12    │  ← d'un coup, à 0,8 s
│   Un point de plus                                 1,93 Md cr    │  ← le taux, à 1,4 s
│                                                                  │
│   ─────────────────────────────────────────────────────────────  │
│   À emporter                                      Reste 0 point  │
│                                                                  │
│   [x]  L'équipe                    1   multiplicateur            │
│   [x]  Double écran                2   raccourci                 │
│   [x]  Le serveur                  2   affichage                 │
│   [x]  La filiale                  3   multiplicateur            │
│   [x]  La turbine                  4   multiplicateur            │
│   [ ]  Plan stratégique            5   unique    laissé en haut  │
│                                                                  │
│   Ce qui n'est pas emporté est abandonné.                        │
│   Les points qui restent sont perdus.                            │
│                                                                  │
│   reboucher                                       [ descendre ]  │
└──────────────────────────────────────────────────────────────────┘
```

**Accessibilité.**
- À l'ouverture, le focus va sur la première case. La conversion est annoncée une fois, dans une zone de statut.
- Tout se fait au clavier : les cases, puis « descendre », puis « reboucher ».

### P5 — La descente (4 s)

**Au clic sur « descendre », tout est engagé d'un coup, avant toute animation.**
- Le choix est vérifié et noté au journal (`fouiller`).
- Les objets rejoignent les artefacts, et la Profondeur passe à 2.
- L'état de la surface est rangé tel quel.
- Les caves sont créées au jour 70 de l'an 1, et le jeu sauvegarde.

L'animation ne fait que représenter ce qui est déjà fait : un rechargement en plein milieu retrouve le joueur dans les caves. Le bouton « descendre » ne répond plus après le premier clic.

C'est un **travelling vertical vers le bas** : la caméra descend, et le décor monte.

- **De 0 à 0,4 s.** Les textes de l'écran de fouille s'effacent. Il ne reste que les lignes des objets : les objets emportés en clair, l'objet laissé en haut en grisé.
- **De 0,4 à 3,2 s.** Le travelling.
  - Le sol de la fouille monte et sort par le haut de l'écran, en emportant l'objet laissé en haut. On le voit s'éloigner : c'est l'abandon.
  - Les objets emportés, eux, **restent au milieu de l'écran** : ils descendent avec le joueur.
  - Trois ou quatre couches de sol défilent, avec une accélération puis un ralentissement. Ce sont les couches de la coupe ([#47](https://github.com/DavidGiangiacomo/strates/issues/47)), dans la palette du noyau, et le même dessin servira aux sept descentes.
  - À mi-course (vers 1,8 s), la Profondeur du bandeau passe de 1 à 2. C'est le seul changement du bandeau pendant le mouvement.
- **De 3,2 à 4 s.** L'écran des caves monte d'en bas et se met en place. La coupe des stockages arrive là où le sol traversé s'arrête : le grenier, et rien dessous.

La descente ne se passe pas : avec l'arrivée, elle dure 5 secondes, sept fois par partie. Un clic pendant la descente ne fait rien.

```
 P5, à 2 s : le travelling
┌──────────────────────────────────────────────────────────────────┐
│ Profondeur 2   Artefacts 0                              creuser  │  ← Profondeur 2 à mi-course
├──────────────────────────────────────────────────────────────────┤
│░░░░░  [ ]  Plan stratégique · laissé en haut  ░░░░░░░░░░░░░░░░░░░│  ↑ le sol de la fouille
│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│    monte et sort
│▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│
│▒▒▒▒▒▒▒▒▒▒▒     L'équipe       Double écran     ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│  ← les objets emportés
│▒▒▒▒▒▒▒▒▒▒▒     Le serveur     La filiale       ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒│    restent au milieu :
│▓▓▓▓▓▓▓▓▓▓▓     La turbine                      ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│    ils descendent
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
│██████████████████████████████████████████████████████████████████│  ↑ les couches défilent
└──────────────────────────────────────────────────────────────────┘
```

### P6 — L'arrivée (1 s)

- **De 0 à 0,6 s.** Les lignes des objets emportés glissent dans le bandeau, vers « Artefacts », qui compte de 0 à 5, un objet par dixième de seconde. Le bandeau est la poche du joueur.
- **Pendant cette seconde**, le registre écrit sa première page.
- **À 1 s**, l'aiguille du calendrier se met à tourner : le temps des caves commence.

L'écran est entièrement celui des caves (fiche 2, § 6). Le joueur doit y voir d'abord quatre choses, à l'endroit où ses yeux et sa main allaient en haut (§ 5) :

1. **Le calendrier circulaire, à la place du graphique.** L'aiguille est au jour 70, à la fin du printemps. La courbe est devenue un cercle.
2. **La réserve, à la place des crédits** : « 250 sur 400 boisseaux ». La ressource est devenue du grain, six ordres de grandeur plus bas (I3).
   - Sur la coupe des stockages, un trait flotte au-dessus du grenier : c'est la marque d'hiver. Sans les deux fenêtres, il n'a pas de légende.
   - Elle demande déjà 775 boisseaux, presque deux fois ce que le grenier peut contenir, et elle montera avec chaque famille installée.
3. **« Glaner », à la place de « Produire »**, et **« Installer une famille », à la place des générateurs.** Les réflexes de la surface trouvent leurs boutons (fiche 2, § 5).
4. **Le registre et sa première page** :
   - « An 1. 8 familles, un grenier. » ;
   - une ligne par objet qui agit dès l'arrivée : « Les familles ont compris les deux fenêtres. », « Les familles ont compris l'armoire qui compte les hivers. » (§ 6) ;
   - une ligne pour ceux qui attendent : « 3 objets venus d'en haut, que personne ne sait employer. »

**Le temps des caves part à la fin de la descente**, sans attendre un geste du joueur. L'aiguille qui tourne, un jour par seconde, est le premier message de la strate : le temps y est un cercle, et il n'attend pas. Les quelques secondes que prend le joueur pour regarder se prennent sur 280 jours de saison chaude.

**Ce qui est opaque** (fiche 2, § 7) :
- la marque d'hiver n'a pas de nom ;
- les pertes des stockages ne sont pas affichées ;
- les années futures ne sont pas dessinées ;
- les naissances ne sont annoncées nulle part.

Les deux fenêtres lèvent les deux premiers points, et l'armoire le troisième. Avec les objets d'un jeu correct, le joueur arrive donc avec la marque nommée, les pertes visibles et les hivers à venir dessinés. Le premier hiver reste pourtant une épreuve : les multiplicateurs dorment, et **tout ce qui est dévoilé rend l'échec plus lisible, sans l'empêcher** (fiche 2, § 5).

**Le bouton « creuser »** est toujours là, au même endroit. S'il est cliqué dans les caves, le sol résiste : le bouton a suivi le joueur, et ici aussi il faudra le mériter.

```
 P6 : l'arrivée, jour 70 de l'an 1
┌──────────────────────────────────────────────────────────────────┐
│ Profondeur 2   Artefacts 5                              creuser  │
├──────────────────────────────────────────────────────────────────┤
│  Jour 71 de l'an 1 · Printemps           Réserve 250 sur 400 (1) │
│                                                                  │
│     hiver  ╭────╮  printemps   - - - - - - (2)                   │
│        ╭───╯    ╰───╮          ┌─ grenier ──┐  Registre          │
│        │     ●───   │          │▓▓▓▓▓▓▓     │  An 1. 8 familles, │
│        ╰───╮    ╭───╯          └────────────┘  un grenier.       │
│   automne  ╰────╯  été          (le sol,       Les familles ont  │
│               (3)                dessous)      compris les deux  │
│                                                fenêtres.         │
│   [ Glaner ]  (4)                              3 objets venus    │
│                                                d'en haut, que    │
│   Familles 8                                   personne ne sait  │
│   [ Installer une famille ]                    employer.         │
│     25 boisseaux  (5)                                            │
│                                                                  │
│  ──────────────────────────────────────────────────────────────  │
│  Réserve, 3 dernières années  ●                              (6) │
└──────────────────────────────────────────────────────────────────┘
  (1) où étaient les crédits          (4) où était « Produire »
  (2) la marque d'hiver, au-dessus    (5) où étaient les générateurs
      du grenier
  (3) où était le graphique           (6) la courbe commence ici
```

### P7 — Les dix premières minutes (caves)

Le test du §14 se joue ici. La chronologie suivante a été mesurée dans le code du jeu, avec les joueurs automatiques de l'équilibrage ([#36](https://github.com/DavidGiangiacomo/strates/issues/36)) et les cinq objets d'un jeu correct. Le joueur réflexe achète dès qu'il peut ce qui se rembourse le plus vite, comme en haut. Le joueur correct prévoit l'hiver.

| Temps | Calendrier | Ce qui arrive | Joueur réflexe | Joueur correct |
|---|---|---|---|---|
| 0:00 | an 1, jour 70 | L'arrivée : 8 familles, 250 boisseaux, un grenier. | Il installe des familles : 22 au bout de 30 secondes. | Il achète d'abord la faucille ; ses familles viendront plus tard. |
| 0:30 – 4:30 | été, automne | La récolte monte, puis retombe. La courbe de la réserve monte tout l'été, avec une encoche à chaque achat. | Il achète tout, jusqu'aux gros outils de l'automne. | Il achète en été, et garde à l'automne. |
| 4:30 | an 1, jour 341 | — | **Rupture** : la réserve est vide 9 jours avant l'hiver. | Il entre dans l'hiver au-dessus de la marque. |
| 4:40 | an 1, jour 350 | **Le premier hiver**, de 70 jours. « Glaner » ne donne plus rien, et l'écran se refroidit. | Disette : des familles partent chaque jour. | La réserve baisse. |
| 5:50 | an 2, jour 0 | Le printemps, et la soudure. | La disette continue. | La soudure manque : la réserve est vide dès le premier jour. |
| 6:13 – 6:24 | an 2, jours 23 à 34 | **Le premier bilan.** Le registre juge l'hiver et compte le grain pourri, puis **les objets d'en haut s'éveillent** (« Les familles ont compris la roue chaude. »). Sans les deux fenêtres, c'est aussi là que la marque prend son nom. | « Hiver de l'an 1 : le grain a manqué 99 jours. Départs : 16 familles. » | « Hiver de l'an 1 : le grain a manqué 28 jours. Départs : 3 familles. » |
| 6:24 – 11:40 | an 2 | Le deuxième été. Les objets agissent : récolte × 1,8, stockages × 1,5. La courbe remonte : c'est une oscillation, plus une montée. | Il continue d'acheter au meilleur rendement, avec une vallée diminuée. | Il grandit au printemps. |
| 11:40 | an 2, jour 350 | Le deuxième hiver. | | |

**Ce que chaque moment doit faire comprendre :**
- **De 0 à 1 minute, les réflexes marchent.** Installer des familles est récompensé : la récolte grimpe. Le joueur joue comme en haut, et c'est voulu, puisque le test en a besoin.
- **À 4 min 30, la réserve se vide**, alors que tout était visible : la marque, la jauge, la courbe (fiche 2, § 5).
- **À 4 min 40, l'hiver arrête tout.** Le bouton qui rapportait ne rapporte plus rien.
- **Vers 6 min 15, le registre juge.** Au moment même où le premier hiver a manqué, les objets d'en haut s'éveillent : l'échec est suivi d'un cadeau. Le deuxième été rend la correction facile, et le deuxième hiver, à 11 min 40, laisse la prouver.
- **À 10 minutes**, la courbe de la réserve a monté, chuté, puis remonté : **ce n'est plus une exponentielle**. L'aiguille a fait plus d'un tour. C'est le moment du test (§14).

## 4. L'écran de fouille, pour toutes les descentes

Ce que P3 et P4 décrivent pour la surface vaut pour toutes les descentes. Voici ce que l'orchestration ([#30](https://github.com/DavidGiangiacomo/strates/issues/30)) doit en retenir :

- **Il appartient au noyau** et se monte sous le bandeau, dont il prolonge la palette, la police et le ton.
- **Il montre :**
  - le nom de la strate quittée ;
  - la valeur convertible, dans la notation de la strate quittée ;
  - les points de fouille, et le prix d'un point de plus ;
  - le catalogue par coût croissant : nom d'en haut, coût, famille, avec la présélection cochée ;
  - le reste des points, les deux règles, « descendre » et « reboucher ».
- **Il ne montre pas** les effets, les noms d'en bas, ni l'usure future des objets déjà portés. Ce dernier point relève de l'inventaire ([#45](https://github.com/DavidGiangiacomo/strates/issues/45)).
- **La notation appartient à la strate.** Seule la strate quittée sait écrire sa valeur (I1) : « 612 M cr » pour la surface, des boisseaux entiers pour les caves.
  - Le contrat la laisse donc fournir un libellé (« Crédits gagnés ») et un formateur de nombres : la clé de texte `fouille.valeur` et la fonction `formaterValeur(valeur)` de `DefinitionStrate` ([#30](https://github.com/DavidGiangiacomo/strates/issues/30)).
  - Le formateur sert aussi au prix d'un point de plus.
  - La strate donne aussi la police et les couleurs de la valeur : `apparenceValeur` ([#31](https://github.com/DavidGiangiacomo/strates/issues/31)). C'est ce qui en fait « le dernier fragment » de la strate quittée (P3).
  - Le chœur (strate 5), qui n'affiche aucun nombre, pourra y écrire autre chose qu'un nombre (D-003).
- **La strate est figée tant que la fouille est ouverte** : pas de tick, pas d'absence. Un onglet caché pendant le choix ne fait rien avancer.
- **« reboucher »** referme sans rien noter au journal de partie. La strate reprend là où elle était.
- **« descendre »** engage tout d'un coup, puis sauvegarde (P5).
- **Variantes :**
  - la strate 6 affichera son issue, soldée ou en défaut, au-dessus de la valeur ([#64](https://github.com/DavidGiangiacomo/strates/issues/64)) ;
  - la strate 7 n'a pas d'écran : la présélection s'applique seule, et la transition part directement ([#106](https://github.com/DavidGiangiacomo/strates/issues/106)).
- **Textes** : ceux de cette page sont provisoires. Ce sont des textes du noyau, à reprendre avec la bible narrative ([#43](https://github.com/DavidGiangiacomo/strates/issues/43)).

## 5. Les raccords

Le test du §14 demande si le joueur essaie de jouer comme en strate 1. **Il faut donc qu'il le puisse.** À l'endroit où allaient ses yeux et sa main en haut, il doit trouver en bas l'élément qui lui ressemble, et qui le trompera.

C'est une contrainte pour les deux directions artistiques ([#31](https://github.com/DavidGiangiacomo/strates/issues/31), [#33](https://github.com/DavidGiangiacomo/strates/issues/33)). La disposition de la fiche 2 (§ 6) la respecte déjà ; il faut la garder.

| Surface (fiche 1, § 6) | Caves (fiche 2, § 6) | Ce que le raccord dit |
|---|---|---|
| Crédits, en haut | Réserve et sa jauge | La ressource est devenue du grain : 612 M cr, puis 250 boisseaux. |
| Production, en cr/s | Récolte et consommation, par jour | Un débit devient deux flux qui s'opposent. |
| Objectif courant | Date et saison | Il n'y a plus de nombre à atteindre, mais une année à passer. |
| Graphique de production, au centre | Calendrier circulaire | La courbe est devenue un cercle. |
| « Produire » | « Glaner » | Le réflexe du clic trouve son bouton, qui ne donnera rien en hiver. |
| Générateurs | « Installer une famille », stockages | Le réflexe d'achat trouve ses boutons. La famille est le « poste » des caves. |
| Améliorations | Outils | L'amélioration × 2 devient un outil qu'on n'achète qu'une fois. |
| Le graphique, en échelle linéaire | La courbe de la réserve, en bas | L'exponentielle devient une sinusoïde. |
| — | Le registre | Le seul élément sans équivalent : la chronique qui juge. |

Les raccords sont des rimes, pas des copies. Tout le reste change : la palette, la typographie, les formes, le mouvement.

## 6. Les objets, du nom d'en haut au nom d'en bas

- **À la fouille**, le joueur choisit sous les noms d'en haut, qu'il connaît.
- **Pendant la descente**, les objets emportés restent à l'écran et descendent avec lui, puis rejoignent le compteur du bandeau.
- **Dans les caves, un objet prend son nom d'en bas la première fois qu'il agit.** Le registre le note, un objet par ligne, avec la même formule : « Les familles ont compris la roue chaude. »
  - L'affichage et le raccourci (l'armoire qui compte les hivers, les deux fenêtres) agissent dès l'arrivée. Ils sont nommés sur la première page du registre.
  - Les multiplicateurs (les bras en plus, le grenier d'ailleurs, la roue chaude) sont nommés au bilan du premier hiver, quand ils s'éveillent. C'est déjà codé ([#34](https://github.com/DavidGiangiacomo/strates/issues/34)).
  - L'effet unique (la feuille qui annonce) est nommé au seuil, juste avant la ligne qu'il écrit d'une autre main.
  - À l'arrivée, une ligne compte les objets qui n'agissent pas encore : « 3 objets venus d'en haut, que personne ne sait employer. » Elle dit au joueur que ses objets sont bien arrivés, et qu'il ne doit pas encore compter sur eux.
- **Le joueur fait lui-même le lien** entre les deux noms : l'armoire qui compte les hivers est le serveur, et la roue chaude est la turbine. C'est le plaisir d'archéologue du design doc (Outer Wilds).
- **L'inventaire** ([#45](https://github.com/DavidGiangiacomo/strates/issues/45), après le MVP) montrera le nom d'en haut jusqu'à ce que la strate ait nommé l'objet, puis le nom d'en bas. Il faudra que la strate le signale au noyau, par exemple par un événement. Dans le MVP, le bandeau ne montre que le compteur.

## 7. Ce que devient la surface

- **À « descendre », son état est rangé tel quel** dans la sauvegarde (`strates[1]`), avec sa version (§15, D-005). Le noyau ne la fait plus avancer : elle ne reçoit ni tick ni absence.
- **Le journal de partie** garde son passage : temps de jeu, temps hors ligne, seuil, fouille (points, objets emportés et abandonnés). C'est ce que liront la coupe et les fins.
- **Aucun chemin ne remonte.** « reboucher » était la dernière porte ; après « descendre », rien ne mène à la surface avant la fin.
- **Sa production « tourne toujours »** (§11), mais sans être simulée. À la fin « Remonter », `remontee()` rend l'état rangé, augmenté de la production de toute la durée écoulée (fiche 1, § 10). L'état figé suffit.
- **Les crédits ne deviennent pas du grain.** Tout le monde arrive dans les caves avec 250 boisseaux (fiche 2, § 3). Seuls la Profondeur, les objets et, plus tard, la Compréhension traversent.
- Dans le MVP, il n'y a ni remontée ni coupe : la surface reste dans la sauvegarde, intacte, pour [#128](https://github.com/DavidGiangiacomo/strates/issues/128), [#47](https://github.com/DavidGiangiacomo/strates/issues/47) et [#131](https://github.com/DavidGiangiacomo/strates/issues/131).

## 8. Durées et mouvement réduit

| Plan | Durée | Sans mouvement (`prefers-reduced-motion`) |
|---|---|---|
| P2 — Le coup de pioche | 1 s | La fissure paraît entière ; fondu de 0,3 s vers la fouille. |
| P3 — La conversion | 2 s | Les trois lignes paraissent ensemble. |
| P4 — Le choix | au rythme du joueur | Identique. |
| « reboucher » | 0,5 s | Fondu de 0,3 s. |
| P5 et P6 — La descente et l'arrivée | 5 s | Fondu de 1 s vers les caves ; les compteurs du bandeau changent d'un coup. |
| **Total imposé** | **8 s** | **2 s environ** |

Ces durées sont des cibles de départ, réglables au playtest. La descente et l'arrivée ne doivent pas dépasser 5 secondes : elles seront vues sept fois.

## 9. Sauvegarde, absence et cas limites

- **La fouille ouverte n'est jamais sauvegardée.** Fermer la page pendant le choix revient à reboucher : au rechargement, le joueur retrouve la surface, seuil atteint, fouille fermée. Le temps écoulé compte comme une absence ordinaire de la surface.
- **Tout est sauvegardé à « descendre »** (P5). Fermer la page pendant la transition ramène dans les caves, et la transition n'est pas rejouée.
- **Une absence juste après l'arrivée** suit la politique des caves : la saison chaude compte à 80 %, jusqu'au premier jour de l'hiver (fiche 2, § 10).
- **Le bouton « creuser » pendant la fouille et la descente** ne répond pas. Dans les caves, il résiste de nouveau.
- **Un double clic sur « descendre »** ne descend qu'une fois : `fouiller` refuse une deuxième fouille de la même strate, et le bouton se désactive au premier clic.
- **Pour les essais de développement**, les sauvegardes nommées « surface-juste-avant-le-seuil » et « surface-seuil-atteint » mènent directement au passage. Le test du MVP, lui, se joue en partie complète ([protocole](../playtest-mvp.md), § 4).

## 10. Pour la suite

- **L'orchestration ([#30](https://github.com/DavidGiangiacomo/strates/issues/30))** a codé la séquence P2 à P6 et l'écran de fouille du § 4 : voir « Dans le code », plus bas.
- **Les directions artistiques ([#31](https://github.com/DavidGiangiacomo/strates/issues/31), [#33](https://github.com/DavidGiangiacomo/strates/issues/33))** gardent les raccords du § 5, et la coupe des stockages prend la suite du sol traversé : voir « Dans le code », plus bas, et le « Dans le code » des fiches 1 et 2 (§ 6).
- **Le [protocole du test](../playtest-mvp.md) ([#14](https://github.com/DavidGiangiacomo/strates/issues/14))** part de la chronologie de P7. Il observe :
  - le temps entre le seuil et le premier clic sur « creuser » ;
  - si le joueur lit la conversion, garde la présélection, ou rebouche ;
  - puis les dix premières minutes, du premier achat au premier bilan.
- **Le journal de session ([#26](https://github.com/DavidGiangiacomo/strates/issues/26))** enregistre les gestes de la fouille : ouverture (avec les points), cases cochées et décochées, « reboucher », « descendre » (avec les objets emportés).
- **Les textes ([#16](https://github.com/DavidGiangiacomo/strates/issues/16), [#17](https://github.com/DavidGiangiacomo/strates/issues/17))** : ceux de l'écran de fouille appartiennent au noyau ; les lignes du registre du § 6 appartiennent aux caves.
- **Le son ([#46](https://github.com/DavidGiangiacomo/strates/issues/46))** : le coup sourd et l'éboulement de P2, le grondement du sol de P5, puis les premiers sons des caves.

### Dans le code (#30)

- **La logique** est dans le noyau (`Noyau.ouvrirFouille`, `reboucher`, `descendre`, `reprendre` ; `noyau/logique/descente.test.ts`) :
  - la strate est figée pendant la fouille ;
  - la descente s'engage d'un coup, ou pas du tout si la strate suivante ne se charge pas ;
  - la nouvelle strate reste figée jusqu'à la fin de la transition ;
  - le seuil est noté au journal à l'heure où il est atteint.
- **Le spectacle** est dans `noyau/ui/passage.svelte.ts`, qui en tient le minutage (`DUREES`, `DUREES_REDUITES`), et dans `Pioche.svelte`, `Fente.svelte`, `Fouille.svelte` et `Descente.svelte`.
- **Les caves** écrivent la première page du § 6 et nomment la feuille au seuil. Elles reçoivent pour cela les effets des objets dans le contexte d'arrivée (`ContexteArrivee.effets`).
- **Avec la direction artistique de la surface ([#31](https://github.com/DavidGiangiacomo/strates/issues/31))** :
  - au coup de pioche, le tableau de bord se fend en deux moitiés le long de la fissure, qui glissent vers le bas en s'écartant et s'effacent ; au rebouchage, elles remontent et se rejoignent (`Fente.svelte`, deux copies de la strate figée) ;
  - la valeur convertible est écrite dans la police et les couleurs de la surface, sur le fond de ses cartes : un éclat du tableau de bord posé sur le sol (`apparenceValeur`).
- **Avec la direction artistique des caves ([#33](https://github.com/DavidGiangiacomo/strates/issues/33))** :
  - l'écran des caves monte sur le sol traversé, et sa coupe des stockages en prend la suite : un sol sombre, le grenier posé sur le champ, et rien dessous. La marque d'hiver flotte au-dessus du grenier (P6) ;
  - les quatre choses que le joueur doit voir d'abord (P6) sont là où ses yeux et sa main allaient en haut : le calendrier à la place du graphique, la réserve à la place des crédits, « Glaner » à la place de « Produire », et les achats du registre à la place des générateurs.
- **Restent pour la coupe du jeu ([#47](https://github.com/DavidGiangiacomo/strates/issues/47))** : le sol traversé est fait de bandes dans la palette du noyau, et les objets emportés sont des étiquettes aux couleurs du bandeau.
- **Vérifié dans Chromium**, depuis la sauvegarde nommée « surface-seuil-atteint », avec et sans mouvement : le passage complet, « reboucher », la première page du registre, le sol qui résiste dans les caves, et le rechargement.

## 11. Questions ouvertes

À trancher au test du MVP ([#37](https://github.com/DavidGiangiacomo/strates/issues/37)) :

1. **Le prix d'un point de plus** apprend-il que le farm ne vaut rien, ou pousse-t-il à reboucher pour farmer ? Il faut mesurer combien de joueurs rebouchent, et pour combien de temps.
2. **La présélection** : si tout le monde la garde telle quelle, le choix n'en est pas un. Ce n'est pas grave au premier passage, où le joueur ne connaît aucun effet ; à surveiller aux descentes suivantes.
3. **La première page du registre** compte trois ou quatre lignes à l'arrivée. Sont-elles lues, ou le joueur va-t-il droit aux boutons ?
4. **Le premier bilan** empile jusqu'à six lignes : le jugement de l'hiver, les pertes, et trois éveils. Si c'est trop à la fois, les éveils peuvent s'étaler sur les premiers jours du printemps.
5. **Le temps qui part sans attendre** : les premières secondes perdues à regarder l'écran comptent-elles ? C'est la question 8 de la fiche 2.
6. **Les 5 secondes de la descente** : justes au premier passage, peut-être longues au septième.

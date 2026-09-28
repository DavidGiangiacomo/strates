# Test du MVP — protocole et critères

*Protocole, issue [#14](https://github.com/DavidGiangiacomo/strates/issues/14). Il est écrit **avant** que le MVP soit terminé, pour qu'on ne puisse pas ajuster les critères au résultat : le MVP doit pouvoir échouer (§14). Le test lui-même est l'objet de [#37](https://github.com/DavidGiangiacomo/strates/issues/37), qui ajoutera son compte rendu à la fin de cette page. La décision qui en découle est celle du go / no-go ([#38](https://github.com/DavidGiangiacomo/strates/issues/38), D-006).*

*Choix tranchés le 28 septembre 2026 :*
- *chaque testeur joue une **partie complète**, de la surface aux caves, en une séance d'environ 2 h ;*
- ***8 testeurs** : 5 joueurs d'incrémentaux, 3 non-joueurs ;*
- *l'observation est **silencieuse**, puis vient un entretien.*

*Renvois : « §14 » désigne une section du [design doc](design-doc.md), « § 3 » une section de cette page. Les « fiches » sont celles de la [surface](strates/strate-1.md) et des [caves](strates/strate-2.md) ; le « storyboard » est celui du [passage 1 → 2](strates/descente-1-2.md).*

## 1. La question

Le §14 pose une seule question, en deux parties :

> Au bout de dix minutes dans la strate 2, le joueur essaie-t-il de jouer comme en strate 1 — et est-ce que le moment où il comprend que ça ne marche pas est agréable ou frustrant ?

- **Première partie : le réflexe.** La surface apprend trois réflexes : la courbe monte, acheter dès qu'on peut est toujours juste, cliquer rapporte. Les caves les prennent à contre-pied (fiche 2, § 5). La question est de savoir si le joueur les emporte en bas. S'il ne les emporte pas, il n'y a pas de choc, et la seconde partie de la question ne se pose pas.
- **Seconde partie : le plaisir.** Le moment où le joueur comprend que ça ne marche pas doit être agréable. « Si c'est frustrant, le concept ne tient pas, et les six strates suivantes ne le sauveront pas. »

Le test ne juge ni la qualité de la surface, ni l'équilibrage de la fin des caves, ni la Compréhension, absente du MVP. Ce qu'on en apprend est noté comme observation secondaire (§ 5.4), jamais comme critère.

## 2. Les testeurs

**Huit testeurs.**
- **Cinq joueurs d'incrémentaux**, le public visé. Ce sont des personnes qui ont joué au moins une dizaine d'heures à un incrémental au cours des deux dernières années (Cookie Clicker, Antimatter Dimensions, Kittens Game, Universal Paperclips, Melvor Idle…). Ils apportent les réflexes du genre.
- **Trois non-joueurs**, qui n'ont jamais joué à un incrémental ; ils peuvent jouer à d'autres jeux. Ils n'apportent aucun réflexe : c'est la surface qui doit les leur donner.

**Exclusions** : quiconque a participé à la conception, lu le design doc ou une fiche, ou joué à une version de Strates.

**Anonymat.** Chaque testeur reçoit un code, de T1 à T8, qui est le seul identifiant dans les données. Un testeur qui ne va pas jusqu'aux caves (§ 4, étape 1) est remplacé. Les critères demandent au moins six testeurs arrivés dans les caves (§ 6).

**Avant les huit**, une séance pilote, avec un testeur hors panel, vérifie la durée, la consigne, le journal et la fiche d'observation. Ses données ne comptent pas.

## 3. Le matériel

- **La version de playtest publiée** : <https://davidgiangiacomo.github.io/strates/>. Le bas de la page affiche la version et le commit du build ; ils sont notés pour chaque séance.
  - **Tout le test se fait sur le même build.** Rien n'est mergé sur `main` pendant la campagne, puisque chaque merge republie le jeu.
- **Un navigateur de bureau récent**, dans un profil vierge, pour une partie neuve. Pas de navigation privée : le navigateur peut y refuser le stockage.
  - La fenêtre fait au moins 1280 × 720.
  - Le réglage « réduire les animations » du système du testeur est laissé tel quel, et noté.
  - Le MVP est muet.
- **Le journal de session** ([#26](https://github.com/DavidGiangiacomo/strates/issues/26)), activé avant la première seconde de jeu, puis exporté à la fin (§ 9).
- **La fiche d'observation** (§ 8) et **le guide d'entretien** (§ 7).
- **L'enregistrement de l'écran et de la voix**, seulement avec l'accord écrit du testeur. Sinon, les notes suffisent.
- **En présence ou à distance**, en partage d'écran. L'observateur voit l'écran du testeur, mais le testeur ne le voit pas prendre des notes.

## 4. Le déroulé d'une séance

Environ 2 h, en une seule séance : les réflexes de la surface se construisent en jouant, et une interruption ferait passer du temps hors ligne.

| Étape | Durée | Ce qui se passe | L'observateur |
|---|---|---|---|
| 0. Accueil | 5 min | Accord, réglages, journal activé. La consigne est lue telle quelle (plus bas). | Vérifie le build, le navigateur et le journal. |
| 1. La surface | ≈ 75 min (60 à 95) | Le testeur joue librement jusqu'au seuil. | Silencieux. Note les heures des objectifs et les moments de décrochage. |
| 2. Le seuil et la descente | variable | « Tous les objectifs sont atteints. », puis la découverte de « creuser », la fouille, la descente. | Note l'heure du seuil, du premier clic sur « creuser », de la fissure si elle paraît, et le temps passé sur l'écran de fouille. |
| 3. Les caves | 20 min | Le cœur du test : la première année, le premier hiver, le premier bilan, la deuxième année. | Silencieux. Remplit la fiche minute par minute. |
| 4. La question des 20 minutes | — | « Vous pouvez vous arrêter ici, ou continuer autant que vous voulez. » | Note la réponse telle quelle : c'est une donnée (§ 5.3). Si le testeur continue, il joue jusqu'à 10 minutes de plus. |
| 5. L'entretien | 15 à 20 min | Le guide du § 7. | Pose les questions dans l'ordre, sans en suggérer la réponse. |
| 6. Fin | 5 min | Export du journal, remerciements. | Nomme le fichier du code du testeur. |

**La consigne**, lue telle quelle à l'accueil :

> Voici un jeu. Jouez comme vous le feriez chez vous, à votre rythme. Pendant la partie, je ne pourrai pas répondre à vos questions, ni vous aider. Vous pouvez faire une pause ou arrêter quand vous voulez. Après, nous parlerons de la partie.

Ni la consigne ni l'observateur ne parlent de « creuser », de descente, de strates, de caves, d'hiver ou de changement de règles.

**Pendant la partie :**
- **L'observateur ne réagit pas** : ni aide, ni commentaire, ni soupir. À une question, il répond : « Faites comme vous le sentez. »
- **Les pauses** sont permises et notées. Un onglet caché est une absence pour le jeu, qui continue selon ses règles (fiche 1, § 10 ; fiche 2, § 10).
- **Un testeur qui n'a pas atteint le seuil à 100 minutes** s'arrête là. L'entretien porte alors sur la surface seule, et il est remplacé pour les critères.
- **Un testeur qui n'a pas creusé 15 minutes après le seuil** a vu la fissure atteindre le bouton huit minutes plus tôt (fiche 1, § 4). L'observateur dit alors une seule phrase, toujours la même : « Vous pouvez essayer tout ce que l'écran propose. » Il la note avec son heure. Le reste de la séance compte normalement, mais la découverte de « creuser » est notée comme ratée (§ 5.4).

## 5. Ce qu'on observe

### 5.1 Jouer comme en strate 1 : les gestes

Trois gestes, lus dans le journal de session sur la première année des caves, qui dure de l'arrivée à 5 min 50 :

| Geste | Définition | Ce qu'il montre |
|---|---|---|
| **G1** · dépenser l'automne | Un achat pendant l'automne de l'an 1, tel que l'affiche le calendrier, laisse la réserve sous la marque d'hiver. | « Acheter dès qu'on peut », au pire moment (fiche 2, § 5). |
| **G2** · installer au rendement | Au moins 10 familles installées pendant la première minute. | Le « poste » de la surface, acheté en série. |
| **G3** · cliquer l'hiver | Au moins 3 clics sur « Glaner » pendant le premier hiver. | Le réflexe du clic, sur un bouton qui ne donne rien. |

**Un testeur joue comme en strate 1 s'il fait au moins deux des trois gestes.**

**Calibrage**, mesuré dans le code du jeu, avec les joueurs automatiques de l'équilibrage ([#36](https://github.com/DavidGiangiacomo/strates/issues/36)) et les objets d'un jeu correct :
- le joueur réflexe fait G1 (deux achats d'automne sous la marque) et G2 (17 familles la première minute) ;
- le joueur correct, le prudent et le distrait n'en font aucun : de 0 à 2 familles la première minute, et aucun achat d'automne sous la marque.

G3 n'est pas simulé, puisque les joueurs automatiques ne cliquent pas en hiver.

### 5.2 Comprendre

**Un testeur a compris** avant la fin du deuxième hiver, soit environ 13 minutes après l'arrivée, s'il remplit deux conditions :
- **dans ses actes**, il ne refait pas G1 à l'automne de l'an 2 : aucun achat d'automne ne laisse la réserve sous la marque ;
- **dans ses mots**, à l'entretien, il formule la règle sans qu'on la lui souffle : il faut garder du grain pour l'hiver, l'hiver ne produit rien, ou la marque dit ce qu'il faut garder (questions 5 et 6 du § 7).

**Passer le deuxième hiver ne suffit pas.** Une fois les objets éveillés, même le joueur réflexe automatique y entre largement au-dessus de la marque (13 703 boisseaux pour une marque de 3 899) : ce n'est pas une preuve de compréhension.

**Le moment où il comprend** est noté par l'observateur, puis confirmé à l'entretien. C'est le premier signe d'un changement de conduite : renoncer à un achat abordable à l'automne, s'arrêter sur la marque, construire un stockage plutôt qu'installer une famille.

### 5.3 Agréable ou frustrant

- **La note**, demandée à l'entretien, après les questions ouvertes pour ne pas les influencer (question 9) : de 1, très frustrant, à 5, très agréable.
- **La réponse à 20 minutes** (§ 4, étape 4) : continuer ou s'arrêter.
- **Les signes**, notés à la minute près :
  - de frustration : soupir, rire jaune, clics répétés sur un bouton qui ne répond pas, rechargement de la page, abandon, un jugement à voix haute ;
  - de plaisir : exclamation, sourire, « ah, d'accord », le testeur qui se penche vers l'écran.

Les signes éclairent la note sans la remplacer. Ils n'entrent pas dans les critères.

### 5.4 Observations secondaires

Ce ne sont pas des critères. Ce sont les questions laissées au playtest par les fiches et le storyboard, notées avec leur heure :

| Où | Question | Renvoi |
|---|---|---|
| Surface | Le passage du clic à l'automatisation est-il agréable ? Les attentes de fin de strate font-elles décrocher ? | fiche 1, § 14 |
| Surface | Combien de temps entre le seuil et le premier clic sur « creuser » ? La fissure a-t-elle été nécessaire ? | fiche 1, § 4 et § 13 (question 2) |
| Fouille | Le testeur lit-il la conversion ? Garde-t-il la présélection ? Rebouche-t-il, et pour combien de temps ? « Un point de plus » le pousse-t-il à farmer ? | storyboard, § 11 (questions 1 et 2) |
| Descente | Les 5 secondes de la descente sont-elles trop longues ? | storyboard, § 11 (question 6) |
| Caves | Le testeur remarque-t-il la marque dans les 4 min 40 avant le premier hiver ? Perd-il les premières secondes à regarder ? | fiche 2, § 13 (question 8) ; storyboard, § 11 (question 5) |
| Caves | La première page du registre est-elle lue ? Le premier bilan, avec l'éveil des objets, l'est-il ? | storyboard, § 11 (questions 3 et 4) |
| Caves | L'éveil des objets se remarque-t-il ? | fiche 2, § 14 |
| Caves | Le rythme des départs se sent-il sans décourager ? | fiche 2, § 13 (question 3) |

## 6. Les critères, écrits avant le test

On les calcule sur les testeurs arrivés dans les caves, qui doivent être au moins six.

| Critère | Atteint si… |
|---|---|
| **C1** · le réflexe | Plus de la moitié des testeurs jouent comme en strate 1 (§ 5.1), soit 5 sur 8, dont plus de la moitié des joueurs d'incrémentaux, soit 3 sur 5. |
| **C2** · la compréhension | Parmi les testeurs qui ont joué comme en strate 1, au moins les trois quarts ont compris avant la fin du deuxième hiver (§ 5.2). |
| **C3** · le plaisir | Parmi les mêmes testeurs, trois conditions : la note médiane vaut au moins 4, au plus un quart des notes valent 1 ou 2, et au moins les trois quarts choisissent de continuer à 20 minutes. |

**L'échec** du §14, « c'est frustrant », a sa propre définition. Parmi les testeurs qui ont joué comme en strate 1, la moitié ou plus donnent une note de 1 ou 2, ou choisissent de s'arrêter à 20 minutes.

**Les seuils, en nombre de testeurs**, pour qu'aucun arrondi ne se discute après coup :

| Testeurs concernés | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|
| Plus de la moitié | 2 | 3 | 3 | 4 | 4 | 5 |
| Au moins les trois quarts | 3 | 3 | 4 | 5 | 6 | 6 |
| La moitié ou plus | 2 | 2 | 3 | 3 | 4 | 4 |
| Au plus un quart | 0 | 1 | 1 | 1 | 1 | 2 |

**Par groupe.** Les critères sont calculés sur tous les testeurs, puis à part pour les joueurs d'incrémentaux et pour les non-joueurs. Si les deux groupes divergent, le compte rendu le dit. Si C3 échoue chez les joueurs d'incrémentaux, qui sont le public visé, c'est un échec, même quand l'ensemble passe.

### La lecture pour le go / no-go

| C1 | C2 | C3 | Lecture |
|---|---|---|---|
| atteint | atteint | atteint | **Le passage tient** : le changement de grammaire est un plaisir. |
| atteint | non atteint | atteint ou entre deux | **À retravailler** : le choc a lieu, mais la leçon ne passe pas. On reprend la lisibilité (la marque, le registre, la courbe ; [#33](https://github.com/DavidGiangiacomo/strates/issues/33), [#17](https://github.com/DavidGiangiacomo/strates/issues/17)), puis on refait le test. |
| atteint | — | entre deux | **À retravailler**, puis on refait le test : ni plaisir net, ni échec. |
| atteint | — | échec | **Le passage ne tient pas** (§14). |
| non atteint | — | — | **Test non concluant** : le choc n'a pas eu lieu. Les joueurs ont été trop prudents, les raccords du storyboard (§ 5) insuffisants, ou l'équilibrage trop doux (le prix des familles, fiche 2, § 14). On retravaille le choc, puis on refait le test. Ce n'est un argument ni pour ni contre le concept. |

**Les critères ne se réajustent pas.** Si l'un d'eux se révèle mal posé, le compte rendu le dit, mais garde son verdict tel qu'il est écrit ici. Le critère corrigé ne vaut que pour le test suivant.

## 7. Le guide d'entretien

De 15 à 20 minutes, juste après la partie. Les questions vont de l'ouvert au fermé, et aucune ne contient sa réponse. L'observateur relance par « Et ensuite ? » ou « Qu'est-ce qui vous a fait penser ça ? », jamais en proposant une explication.

1. « Racontez-moi la partie, depuis le début. »
2. « Le bouton « creuser » : quand l'avez-vous remarqué ? Qu'est-ce que vous pensiez qu'il faisait ? Pourquoi avez-vous cliqué ? »
3. « L'écran qui a suivi : qu'avez-vous compris ? Comment avez-vous choisi ce que vous emportiez ? »
4. « En arrivant en bas, qu'avez-vous essayé de faire ? »
5. « Que s'est-il passé au premier hiver ? Selon vous, qu'est-ce qui l'expliquait ? »
6. « Avez-vous changé votre façon de jouer ensuite ? Comment ? »
7. « Le trait sur la réserve : l'aviez-vous remarqué ? Qu'indiquait-il ? »
8. « Les objets que vous avez emportés : que sont-ils devenus en bas ? »
9. « Le passage du tableau de bord à la vallée, puis le premier hiver : sur une échelle de 1 à 5, où 1 est très frustrant et 5 très agréable, où le placeriez-vous ? Pourquoi ? »
10. « Si vous repreniez la partie demain, que feriez-vous ? »
11. « Dans la première partie, le tableau de bord, y a-t-il eu des moments d'ennui ? »
12. « Voulez-vous ajouter quelque chose ? »

Ensuite seulement, si le testeur le demande, l'observateur peut expliquer le projet.

## 8. La fiche d'observation

Une fiche par testeur, remplie pendant la séance, puis complétée par le journal de session.

```
Testeur : T_   Profil : joueur d'incrémentaux / non-joueur   Date : ____
Build : Strates _____ · _______   Navigateur : ______   Animations réduites : oui / non

SURFACE
  Début ____   Seuil (« Tous les objectifs sont atteints. ») ____
  Moments de décrochage (heure, signe) : ____________________________
  Premier clic sur « creuser » après le seuil ____   Fissure parue : oui / non
FOUILLE
  Temps sur l'écran ____   Reboucher : ___ fois   Présélection gardée : oui / non
  Objets emportés : _________________________________________________
CAVES (minutes depuis l'arrivée)
  0–1   ____________________________________________________________
  1–4   ____________________________________________________________
  4–6   (premier hiver à 4:40, bilan vers 6:15) _______________________
  6–12  ____________________________________________________________
  12–20 (deuxième hiver à 11:40) ______________________________________
  Moment où il comprend (heure, signe) : ____________________________
  Signes de frustration / de plaisir (heure) : _______________________
  À 20 min : continue / s'arrête   (mots exacts : ____________________)
ENTRETIEN
  Note (question 9) : _   Règle formulée (questions 5 et 6) : oui / non
  Mots exacts : _____________________________________________________
DEPUIS LE JOURNAL
  G1 _  G2 _  G3 _  → joue comme en strate 1 : oui / non
  G1 à l'automne de l'an 2 : oui / non   → a compris : oui / non
```

## 9. Ce que doit enregistrer le journal de session

Pour [#26](https://github.com/DavidGiangiacomo/strates/issues/26). Tout est horodaté en millisecondes depuis le début de la séance, avec le temps de jeu de la strate courante.

- **Les métadonnées** : le code du testeur (saisi par l'observateur), la version et le commit du build, la date, le navigateur, la taille de la fenêtre et le réglage des animations.
- **Les actions** de la strate, avec leurs paramètres :
  - surface : produire, acheter, améliorer ;
  - caves : glaner, installer, construire, outil.
- **« creuser »** : chaque clic, avec la réponse (le sol résiste, la fouille s'ouvre, la suite n'existe pas).
- **L'écran de fouille** :
  - son ouverture (valeur, points, présélection) ;
  - chaque case cochée ou décochée ;
  - « reboucher » ;
  - « descendre » (objets emportés et abandonnés).
- **Les phases du passage** : pioche, fouille, rebouchage, descente, arrivée, jeu.
- **Les absences et les rechargements** : onglet caché, durée, part comptée.
- **Ce que le jeu écrit** : les objectifs atteints à la surface, les lignes du registre des caves (clé et valeurs), et l'apparition de la fissure.
- **Un instantané toutes les 5 secondes de jeu** :
  - surface : crédits, cumul, production ;
  - caves : année, jour, saison, réserve, marque d'hiver, capacité, familles, outils, stockages.

**Rien de personnel** : ni nom, ni adresse, ni mouvements de souris. Le stockage est local, l'export se fait en JSON, d'un clic, et le journal peut être désactivé (#26).

**Un script d'analyse** lit l'export et calcule les gestes G1 à G3, G1 à l'automne de l'an 2, et les temps de la descente. Il est à écrire avec #26, et à vérifier sur les exports des joueurs automatiques avant le test : le joueur réflexe doit jouer comme en strate 1, le joueur correct non.

## 10. Avant le test

Le test attend les dépendances de [#37](https://github.com/DavidGiangiacomo/strates/issues/37) :
- les interfaces des deux strates ([#31](https://github.com/DavidGiangiacomo/strates/issues/31), [#33](https://github.com/DavidGiangiacomo/strates/issues/33)) ;
- leurs textes ([#16](https://github.com/DavidGiangiacomo/strates/issues/16), [#17](https://github.com/DavidGiangiacomo/strates/issues/17)) ;
- le journal de session ([#26](https://github.com/DavidGiangiacomo/strates/issues/26)).

Ensuite viennent la séance pilote (§ 2), le build figé (§ 3), puis les huit séances.

**Le coût** : huit séances de 2 h, plus le pilote, soit environ 18 h d'observation, et une journée d'analyse.

## 11. Compte rendu

*À remplir par [#37](https://github.com/DavidGiangiacomo/strates/issues/37), après les huit séances, sans modifier ce qui précède.*
- *Un tableau par testeur : profil, gestes, compréhension, note, réponse à 20 minutes.*
- *Pour chaque critère : atteint ou non, sur tous les testeurs puis par groupe.*
- *La lecture du § 6, les observations secondaires, et les mots des testeurs.*

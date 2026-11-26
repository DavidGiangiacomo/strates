# Strate 6 — recette R5 de la dette

*Protocole, issue [#113](https://github.com/DavidGiangiacomo/strates/issues/113). Il est écrit **avant** la recette, pour qu'on ne puisse pas ajuster les critères au résultat. La recette elle-même ajoutera son compte rendu à la fin de cette page (§ 10), et l'issue reste ouverte jusque-là. Depuis D-008, une recette n'arrête pas le projet : elle dit si la dette tient (R5), et nourrit la décision de garder huit strates ou d'en retirer une ([#133](https://github.com/DavidGiangiacomo/strates/issues/133)).*

*Choix tranchés le 26 novembre 2026 :*
- *les testeurs arrivent dans la dette par un **lien de départ**, sur la version publiée, **avec les objets et la Compréhension d'un jeu correct** (§ 3) ;*
- *la recette **s'arrête à l'issue de la dette**, soldée ou en défaut. L'enchaînement vers le lit est l'objet de son propre playtest ([#126](https://github.com/DavidGiangiacomo/strates/issues/126)) ;*
- *l'**absence de deux jours** avec des échéances en cours, que demande l'issue, l'organisateur la fait à l'essai (§ 9).*

*Comme pour le lit : les testeurs jouent **chez eux**, à leur rythme, sans observateur, et sont **quatre**, trois joueurs d'incrémentaux et un non-joueur.*

*Renvois : « §13 » désigne une section du [design doc](../design-doc.md), « § 3 » une section de cette page, et « la fiche » celle de la [dette](strate-6.md). Le [protocole de la recette du lit](strate-7-recette.md) sert de modèle : ce qui n'est pas repris ici y est décrit.*

## 1. La question

Le critère R5 (§13) : chaque strate doit tenir **comme jeu autonome de deux heures**. Celle qui ne tient pas est reprise ou retirée.

La dette est la strate la plus longue et la plus dure : près de trois heures sans objet, deux heures et demie avec ceux d'un jeu correct. C'est elle que vise le risque R3 : la strate fait décrocher (fiche, § 12). La recette pose les quatre questions de la fiche, et une cinquième :

1. **Comprend-on, sans aide, qu'une promesse se paie à sa crue ?**
2. **Le premier report est-il vécu comme un avertissement, ou comme une punition ?**
3. **Le quart d'heure avant la dernière promesse est-il tendu, ou vide ?**
4. **Le défaut est-il vécu comme une issue acceptable ?**
5. **Va-t-on jusqu'au bout ?** Soldée ou en défaut, le testeur atteint-il l'issue, ou décroche-t-il ?

**Ce que la recette ne juge pas** :
- l'enchaînement de la dette vers le lit : c'est le playtest R3 ([#126](https://github.com/DavidGiangiacomo/strates/issues/126)) ;
- la fatigue de douze heures de jeu : les testeurs arrivent frais, par le lien. La partie complète la jugera ([#132](https://github.com/DavidGiangiacomo/strates/issues/132)) ;
- l'équilibrage, mesuré par les joueurs automatiques ([#105](https://github.com/DavidGiangiacomo/strates/issues/105), [`strate-6-mesures.md`](strate-6-mesures.md)).

## 2. Les testeurs

**Quatre testeurs** :
- **Trois joueurs d'incrémentaux**, le public visé : au moins une dizaine d'heures à un incrémental au cours des deux dernières années.
- **Un non-joueur**, qui n'a jamais joué à un incrémental.

**Exclusions** : quiconque a participé à la conception, lu le design doc ou une fiche, ou joué à une version de Strates, la recette du lit comprise.

**Codes.** Chaque testeur reçoit un code, seul identifiant dans les données : D1, D2 et D3 pour les joueurs d'incrémentaux, D4 pour le non-joueur. Tous ont le même départ.

**Un testeur qui n'atteint pas l'issue dans les sept jours n'est pas remplacé** : c'est le décrochage que la recette mesure (C1). Seul celui qui n'a pas commencé, empêché, est remplacé.

**Avant les quatre**, l'organisateur fait un essai (§ 9). Ses données ne comptent pas.

## 3. Le matériel

- **La version publiée** : <https://davidgiangiacomo.github.io/strates/>. Le menu, au bout du bandeau, affiche la version et le commit du build, et le journal les garde.
  - Le build ne change pas pendant la recette, puisque chaque merge republie le jeu. Si un merge ne peut pas attendre, le compte rendu le dit, et le journal date chaque séance de sa version.
- **Le lien de départ** de chaque testeur, avec son journal : `https://davidgiangiacomo.github.io/strates/?depart=dette&journal=D1` (puis `D2`, `D3`, `D4`).
- **Ce que fait le lien** (`src/playtest/depart.ts`) :
  - il commence une partie neuve à l'arrivée dans la dette ;
  - les cinq strates d'avant sont au journal de partie, à leur rythme, et le chœur vient de finir ;
  - la partie a les objets et la Compréhension d'un jeu correct : les présélections de chaque strate, et κ = 60 ;
  - huit objets agissent donc dans la dette. Le doigt qui montre et le gage qui souffle lèvent dès l'arrivée les noms des promesses et la confiance : la recette ne voit que l'opacité du report et des majorations ;
  - les gages s'éveillent à la première tablette brisée, vers une demi-heure. La confiance est alors × 1,5 et le report adouci, et le gage qui revient écrit la caisse prévue sous chaque échéance.
- **Ses deux garde-fous**, comme pour le lit :
  - il ne remplace jamais une partie en cours : il faut un navigateur sans partie. Sinon, le jeu le dit, et la partie en cours continue ;
  - l'adresse l'oublie aussitôt : un rechargement reprend la partie, sans la refaire. Le journal, lui, reprend seul.
- **Un ordinateur de bureau**, un navigateur récent, dans un profil neuf ; pas de navigation privée, où le navigateur peut refuser le stockage. Le son est conseillé, pas exigé.
- **Le journal de session** ([#26](https://github.com/DavidGiangiacomo/strates/issues/26)) : le bouton « journal D1 », en bas à gauche, l'exporte d'un clic. Rien de personnel n'y est noté.
- **Un appel**, en vidéo ou au téléphone, pour l'entretien (§ 7).

## 4. Le déroulé

Chez le testeur, sans observateur.

| Étape | Quand | Ce qui se passe |
|---|---|---|
| 0. L'envoi | J0 | L'organisateur envoie le lien et la consigne (plus bas), et convient de l'entretien. |
| 1. Le jeu | dès J0, sept jours au plus | Le testeur ouvre le lien, et joue comme il veut, en une ou plusieurs fois. |
| 2. La fin | à l'issue | Le livre écrit sa dernière ligne en grand : « Honoré. Plus rien n'est dû. » ou « Échu. Le reste demeure dû. » Le testeur exporte le journal et l'envoie. |
| 3. L'entretien | dans les 24 heures | 20 à 25 minutes, le guide du § 7. |

La dette dure deux heures et demie au moins pour un jeu correct, plus pour qui découvre : la plupart joueront en plusieurs fois. Pendant l'absence, les échéances tombent à leur crue, et le rapport compte à 80 %, douze heures au plus. Le livre l'annonce dès l'arrivée, en tête (fiche, § 10). La recette observe ce que les testeurs en font : elle ne le corrige pas.

**À l'issue**, « creuser » cesse de résister, et le lit est dessous. La consigne demande d'exporter le journal avant toute autre chose. Si le testeur creuse quand même, le journal le note (« a creusé ensuite »), et rien de ce qui suit ne compte.

**La consigne**, envoyée telle quelle avec le lien :

> Voici un jeu, ou plutôt un moment d'un jeu plus long : vous arrivez au milieu d'une partie. Jouez comme vous le feriez chez vous, à votre rythme, sur un ordinateur, avec le son si vous le pouvez, en une ou plusieurs fois. Quand une phrase s'écrira en grand sous les tablettes et que plus rien ne s'y fera, la partie sera finie : avant toute autre chose, cliquez sur le bouton « journal », en bas à gauche, puis sur « Exporter », et envoyez-moi le fichier. Nous parlerons ensuite de la partie.

Ni la consigne ni l'organisateur ne parlent de promesse, d'échéance, de crue, de confiance, de report, de défaut, de grande crue ou de descente. À une question avant l'entretien, il répond : « Faites comme vous le sentez. »

## 5. Ce qu'on observe

Le journal donne les faits ; l'entretien, le reste. `npm run analyse -- journal-D1.json …` lit les journaux exportés (`src/playtest/analyse.ts`) : pour chaque testeur, les lignes de sa fiche (§ 8), puis un tableau de tous, pour le compte rendu.

**Depuis le journal :**
- *les séances* : chaque ouverture du jeu dans la dette ;
- *les départs* : les absences d'au moins cinq minutes, et le temps passé devant la dette avant le premier ;
- *la présence* : le temps passé devant la dette, sur le temps de la dette, absences comprises ;
- *les promesses* tentées et les refus (« La confiance ne suffit pas. »), et les échéances soldées avant leur terme ;
- *les reports*, et le premier ;
- *les tablettes brisées*, et quand ;
- *la dernière promesse*, qui fixe la grande crue ;
- *l'issue*, soldée ou en défaut, quand, et si le testeur était là ;
- *les ouvertures de l'aide*, et s'il a creusé ensuite.

**Depuis l'entretien :** ce qu'il a fait en arrivant, ce qu'il a compris d'une promesse, du rouge de l'échéancier, du premier report, de la dernière tablette ; la note du report, celle de l'attente, et celle de la fin en défaut ; ses absences et ce qu'il a trouvé en revenant ; la bande de couches, le son, la durée.

## 6. Les critères, écrits avant la recette

| Critère | Atteint si… |
|---|---|
| **C1** · le bout | Au moins trois testeurs sur quatre atteignent l'issue, soldée ou en défaut, dans les sept jours (au journal). |
| **C2** · la promesse | Au moins trois testeurs sur quatre disent, d'eux-mêmes ou à la question 3, qu'une promesse rapporte tout de suite et se paie plus tard, à sa crue. |
| **C3** · le report | Parmi les testeurs qui ont eu un report (au journal), la note du premier report (question 5) vaut au moins 3 pour plus de la moitié, et aucune ne vaut 1. |
| **C4** · la grande crue | Parmi les testeurs qui ont fait la dernière promesse (au journal), la note de l'attente (question 6) vaut au moins 3 pour plus de la moitié, et aucune ne vaut 1. |
| **C5** · le défaut | Les testeurs tombés en défaut donnent à cette fin (question 7) une note d'au moins 3 ; aucune ne vaut 1. |

- **C3 à C5 ne se jugent que sur ceux qu'ils concernent.** Si deux testeurs ou moins ont eu un report, fait la dernière promesse, ou sont tombés en défaut, le critère n'est pas jugé : le compte rendu le dit, et la recette suivante le reprendra.
- **Les testeurs arrivés à l'issue** comptent pour C2 à C5 ; ceux qui ont décroché, pour C1 et C2.

**L'échec** que la fiche redoute (§ 12, R3) a sa propre définition. Deux testeurs ou plus n'atteignent pas l'issue (au journal), et disent à l'entretien l'avoir laissée par lassitude, ou parce qu'elle était trop longue.

**La lecture :**

| Résultat | Lecture |
|---|---|
| C1 à C5 atteints, ou non jugés | **La dette tient (R5).** |
| C1 non atteint, ou l'échec | **La dette ne tient pas : elle fait décrocher.** Elle est reprise, plus courte, ou la question passe à [#133](https://github.com/DavidGiangiacomo/strates/issues/133). |
| C2 non atteint | **À retravailler : la promesse.** L'aide, l'opacité ou l'échéancier ne disent pas assez qu'elle se paie à sa crue. |
| C3 non atteint | **À retravailler : le report**, peut-être plus doux dans les premières tablettes (fiche, § 13, question 4). |
| C4 non atteint | **À retravailler : l'attente de la grande crue.** La dernière tablette peut revenir en 6 crues : 10 minutes au lieu d'un quart d'heure (fiche, § 13, question 1). |
| C5 non atteint | **À retravailler : la fin en défaut**, ses mots, sa place et son son. |

**Les critères ne se réajustent pas.** Si l'un d'eux se révèle mal posé, le compte rendu le dit, mais garde son verdict tel qu'il est écrit ici. Le critère corrigé ne vaut que pour la recette suivante.

**Les invariants** (§9), vérifiés par les tests, avant la recette :

| Invariant | Dans la dette | Vérifié par |
|---|---|---|
| I1 · rien de commun | elle seule écrit ses montants en sceaux et date en crues | `src/strates/s6-dette/textes.test.ts` |
| I2 · × 4 au plus | × 2,81 avec les objets d'un jeu correct, le plafond n'agit jamais | `tests/equilibrage-dette.test.ts` |
| I3 · pas de croissance monotone | 10²⁰ en caisse, la plus grande échelle du jeu, juste avant les 10³ doigts du lit | `tests/equilibrage-dette.test.ts`, `tests/invariants-lit.test.ts` |
| I4 · pas de seuil par accumulation | qui ne promet que ce qu'il a solde en 5 h 51, deux fois plus lentement ; qui promet sans regarder tombe en défaut | `tests/equilibrage-dette.test.ts` |
| I5 · moins de 3 h 15 sans artefact | de 2 h 52 à 3 h 00 pour qui regarde ses échéances | `tests/equilibrage-dette.test.ts` |

## 7. Le guide d'entretien

De 20 à 25 minutes, dans les 24 heures qui suivent la fin. Les questions vont de l'ouvert au fermé, et aucune ne contient sa réponse. L'organisateur relance par « Et ensuite ? » ou « Qu'est-ce qui vous a fait penser ça ? », jamais en proposant une explication.

1. « Racontez-moi la partie, depuis le début. »
2. « En arrivant, qu'avez-vous essayé de faire ? »
3. « Quand vous preniez quelque chose sur la tablette, à gauche, que se passait-il ensuite ? »
4. « Les lignes rouges, au milieu : que disaient-elles ? Comment vous en serviez-vous ? »
5. « Une ligne a-t-elle été « reportée » ? Qu'avez-vous pensé à ce moment-là ? » Puis : « Sur une échelle de 1 à 5, où 1 est une punition et 5 un avertissement utile, où placeriez-vous ce moment ? »
6. « La dernière tablette : comment avez-vous choisi le moment de votre dernière promesse ? » Puis : « Cette attente, de 1, vide, à 5, tendue, où la placeriez-vous ? »
7. « Comment la partie s'est-elle finie ? » Puis, en défaut : « Cette fin, de 1, un échec, à 5, une fin comme une autre, où la placeriez-vous ? Pourquoi ? »
8. « Avez-vous quitté le jeu, puis êtes-vous revenu ? Qu'avez-vous trouvé en revenant ? »
9. « La bande de couches, à droite : qu'en avez-vous compris ? »
10. « Le son : l'aviez-vous ? Qu'avez-vous entendu ? »
11. « Combien de temps avez-vous joué, à votre avis ? Était-ce trop long, trop court ? »
12. « Voulez-vous ajouter quelque chose ? »

Ensuite seulement, si le testeur le demande, l'organisateur peut expliquer le projet.

## 8. La fiche du testeur

Une fiche par testeur, remplie à l'entretien, puis complétée par le journal.

```
Testeur : D_   Profil : joueur d'incrémentaux / non-joueur
Build : ________   Partie : du ____ au ____   Entretien : le ____

Depuis le journal (npm run analyse) :
  Séances, départs, premier départ, présence :
  Promesses, refus, soldées avant terme, aide :
  Reports, le premier ; tablettes brisées :
  Dernière promesse ; issue (en présence ou non) ; a creusé ensuite :   → C1

L'entretien :
  En arrivant (2) :
  La promesse (3) :                                      → C2 : oui / non
  Les lignes rouges (4) :
  Le premier report (5) : note _ /5, pourquoi :          → C3
  La dernière tablette (6) : note _ /5, pourquoi :       → C4
  La fin (7) : soldée / en défaut, note _ /5, pourquoi :  → C5
  Partir et revenir (8) :
  La bande de couches (9) :
  Le son (10) :
  La durée (11) :
  Mots notables, tels quels :
```

## 9. Avant la recette

La recette attendait l'équilibrage, le son, les textes et l'opacité de la dette ([#105](https://github.com/DavidGiangiacomo/strates/issues/105), [#103](https://github.com/DavidGiangiacomo/strates/issues/103), [#74](https://github.com/DavidGiangiacomo/strates/issues/74), [#104](https://github.com/DavidGiangiacomo/strates/issues/104)) : ils sont faits. Avec ce protocole, la dette est publiée, et seul le lien de départ y mène.

**L'essai de l'organisateur**, avant les quatre, sur la version publiée :
- le lien, le journal, l'export et l'analyse (§ 5), sur une partie jouée jusqu'à l'issue ;
- **l'absence de deux jours avec des échéances en cours**, que demande l'issue. Au milieu de la deuxième tablette, il ferme l'onglet, et le rouvre deux jours plus tard. Il vérifie le retour :
  - le rappel de reprise : la dernière ligne du livre, puis la tablette ouverte ;
  - le résumé : « … échéances honorées, … reportées. » ;
  - pour qui jouait en regardant ses échéances, aucun défaut : la caisse a payé ce qui tombait, à 80 % du rapport ;
  - l'échéancier, la caisse et le compte des crues à jour, et le journal qui note l'absence.

  Les tests le couvrent déjà sans navigateur (`tests/equilibrage-dette.test.ts`, deux jours à 2 h) ; l'essai vérifie le vrai retour, dans un vrai navigateur. Ce qu'il trouve va au compte rendu.

Viennent ensuite le build figé (§ 3), puis les quatre testeurs.

**Le test du prototype** que demandait la fiche ([#73](https://github.com/DavidGiangiacomo/strates/issues/73), § 12) se fait avec cette recette : ses quatre questions sont les questions 1 à 4 du § 1.

**Le coût** : l'envoi, quatre entretiens de vingt-cinq minutes, et une demi-journée d'analyse.

## 10. Compte rendu

*À remplir après les quatre entretiens, sans modifier ce qui précède.*
- *Ce qu'a trouvé l'essai, et l'absence de deux jours.*
- *Le tableau du journal, par testeur (`npm run analyse`).*
- *Pour chaque critère : atteint, non atteint, ou non jugé, et pourquoi.*
- *La lecture du § 6, les observations secondaires, et les mots des testeurs.*

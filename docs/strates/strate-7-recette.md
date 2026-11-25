# Strate 7 — recette R5 du lit

*Protocole, issue [#120](https://github.com/DavidGiangiacomo/strates/issues/120). Il est écrit **avant** la recette, pour qu'on ne puisse pas ajuster les critères au résultat. La recette elle-même ajoutera son compte rendu à la fin de cette page (§ 10), et l'issue reste ouverte jusque-là. Depuis D-008, une recette n'arrête pas le projet : elle dit si le lit tient (R5), et nourrit la décision de garder huit strates ou d'en retirer une ([#133](https://github.com/DavidGiangiacomo/strates/issues/133)).*

*Choix tranchés le 25 novembre 2026 :*
- *les testeurs arrivent dans le lit par un **lien de départ**, sur la version publiée (§ 3) ;*
- *ils jouent **chez eux seulement**, à leur rythme, sans observateur : le journal de session, puis un entretien ;*
- ***quatre testeurs** : trois joueurs d'incrémentaux et un non-joueur, deux après une dette soldée, deux après un défaut ;*
- *la recette **s'arrête au bassin plein** : sans le fond, la descente ne se voit pas encore. Son effet se vérifiera à la recette du fond ([#127](https://github.com/DavidGiangiacomo/strates/issues/127)).*

*Renvois : « §13 » désigne une section du [design doc](../design-doc.md), « § 3 » une section de cette page, et « la fiche » celle du [lit](strate-7.md). Le [protocole du test du MVP](../playtest-mvp.md) sert de modèle : ce qui n'est pas repris ici y est décrit.*

## 1. La question

Le critère R5 (§13) : chaque strate doit tenir **comme jeu autonome de deux heures**. Celle qui ne tient pas est reprise ou retirée.

Le lit est la strate la plus exposée au critère (fiche, § 12). Il tient autrement que les autres : c'est un jeu d'attente, qu'on quitte et qu'on retrouve. Il ne se juge donc pas sur une séance continue de deux heures, mais sur le retour. La recette pose quatre questions :

1. **L'attente est-elle un repos, et pas un vide ?** Le joueur part-il et revient-il ? Que dit-il de l'attente ?
2. **Le geste rare se comprend-il ?** Bâtit-il une levée ? Voit-il l'eau se reposer, et la couche plus sombre ?
3. **Les traces de la dette sont-elles perçues ?** Voit-il les fosses dans la rive, les tablettes brisées ou entières ?
4. **Le jeu qui parle est-il entendu ?** Se souvient-il des phrases, et qu'en pense-t-il ?

**Ce que la recette ne juge pas** :
- la descente qui vient seule. Sans le fond, le jeu dit au bassin plein que la descente n'existe pas encore : la recette du fond la jugera ;
- l'enchaînement depuis la dette, qui n'est pas encore codée : c'est le playtest R3 ([#126](https://github.com/DavidGiangiacomo/strates/issues/126)) ;
- l'équilibrage, mesuré par les joueurs automatiques ([#116](https://github.com/DavidGiangiacomo/strates/issues/116), [`strate-7-mesures.md`](strate-7-mesures.md)).

## 2. Les testeurs

**Quatre testeurs** :
- **Trois joueurs d'incrémentaux**, le public visé : au moins une dizaine d'heures à un incrémental au cours des deux dernières années.
- **Un non-joueur**, qui n'a jamais joué à un incrémental.

**Exclusions** : quiconque a participé à la conception, lu le design doc ou une fiche, ou joué à une version de Strates.

**Codes et départs.** Chaque testeur reçoit un code, seul identifiant dans les données :

| Testeur | Profil | La dette |
|---|---|---|
| T1 | joueur d'incrémentaux | soldée |
| T2 | joueur d'incrémentaux | en défaut |
| T3 | joueur d'incrémentaux | soldée |
| T4 | non-joueur | en défaut |

Un testeur qui n'atteint pas le bassin plein dans les sept jours est remplacé.

**Avant les quatre**, l'organisateur fait un essai : les deux liens, le journal, l'export et l'analyse (§ 5). Ses données ne comptent pas.

## 3. Le matériel

- **La version publiée** : <https://davidgiangiacomo.github.io/strates/>. Le menu, au bout du bandeau, affiche la version et le commit du build, et le journal les garde.
  - Le build ne change pas pendant la recette, puisque chaque merge republie le jeu. Si un merge ne peut pas attendre, le compte rendu le dit, et le journal date chaque séance de sa version.
- **Le lien de départ** de chaque testeur, avec son journal :
  - T1 et T3 : `https://davidgiangiacomo.github.io/strates/?depart=lit-soldee&journal=T1` (puis `T3`) ;
  - T2 et T4 : `https://davidgiangiacomo.github.io/strates/?depart=lit-defaut&journal=T2` (puis `T4`).
- **Ce que fait le lien** (`src/playtest/depart.ts`) :
  - il commence une partie neuve à l'arrivée dans le lit ;
  - les six strates d'avant sont au journal de partie, à leur rythme, et la dette vient de finir, soldée ou en défaut ;
  - la partie a les objets et la Compréhension d'un jeu correct : les présélections de chaque strate, et κ = 60 ;
  - huit objets agissent donc dans le lit, posés sur la berge. Le bâton qui creuse lève dès l'arrivée les mots du lit et ses mesures ; le rouleau qui marque et le gage qui revient dessinent d'avance les quatre couches à venir ; l'œuf qui garde marque la rive. C'est le lit d'un jeu correct, et la recette ne voit pas l'opacité.
- **Ses deux garde-fous** :
  - il ne remplace jamais une partie en cours : il faut un navigateur sans partie. Sinon, le jeu le dit, et la partie en cours continue ;
  - l'adresse l'oublie aussitôt : un rechargement reprend la partie, sans la refaire. Le journal, lui, reprend seul.
- **Un ordinateur de bureau**, un navigateur récent, dans un profil neuf ; pas de navigation privée, où le navigateur peut refuser le stockage. Le son est conseillé, pas exigé.
- **Le journal de session** ([#26](https://github.com/DavidGiangiacomo/strates/issues/26)) : le bouton « journal T1 », en bas à gauche, l'exporte d'un clic. Rien de personnel n'y est noté.
- **Un appel**, en vidéo ou au téléphone, pour l'entretien (§ 7).

## 4. Le déroulé

Chez le testeur, sans observateur.

| Étape | Quand | Ce qui se passe |
|---|---|---|
| 0. L'envoi | J0 | L'organisateur envoie le lien et la consigne (plus bas), et convient de l'entretien. |
| 1. Le jeu | dès J0, à son rythme | Le testeur ouvre le lien, et joue comme il veut, en une ou plusieurs fois. |
| 2. La fin | au bassin plein | Le jeu dit que la descente n'existe pas encore. Le testeur exporte le journal et l'envoie. |
| 3. L'entretien | dans les 24 heures | 15 à 20 minutes, le guide du § 7. |

Le lit compte les absences en entier : il se remplit en deux heures environ, que le testeur reste ou parte. Un testeur qui part le soir trouve le bassin plein le lendemain. C'est la nature du lit (fiche, § 10), et la recette l'observe : elle ne le corrige pas.

**La consigne**, envoyée telle quelle avec le lien :

> Voici un jeu, ou plutôt un moment d'un jeu plus long : vous arrivez au milieu d'une partie. Jouez comme vous le feriez chez vous, à votre rythme, sur un ordinateur, avec le son si vous le pouvez. Vous pouvez faire une pause quand vous voulez. Quand le jeu vous dira que la suite n'existe pas encore, la partie est finie : cliquez sur le bouton « journal », en bas à gauche, puis sur « Exporter », et envoyez-moi le fichier. Nous parlerons ensuite de la partie.

Ni la consigne ni l'organisateur ne parlent d'attendre, de partir, de crue, de levée, de dette ou de descente. À une question avant l'entretien, il répond : « Faites comme vous le sentez. »

## 5. Ce qu'on observe

Le journal donne les faits ; l'entretien, le reste. `npm run analyse -- journal-T1.json …` lit les journaux exportés (`src/playtest/analyse.ts`) : pour chaque testeur, les lignes de sa fiche (§ 8), puis un tableau de tous, pour le compte rendu.

**Depuis le journal :**
- *les séances* : chaque ouverture du jeu dans le lit ;
- *les départs* : les absences d'au moins cinq minutes, et le temps passé devant le lit avant le premier. Un onglet caché deux minutes n'est pas un départ ;
- *la présence* : le temps passé devant le lit, sur le temps du lit, absences comprises ;
- *les levées* bâties ou déplacées, et les ouvertures de l'aide ;
- *les phrases du jeu* dites : « Rien ne presse. » à l'arrivée, « Ce que vous avez laissé en haut est toujours là. » au retour d'une heure au moins, « Vous n'avez rien à décider ici. » au dernier creux plein ;
- *le bassin plein*, en présence ou pendant une absence, et le seuil, une crue après.

**Depuis l'entretien :** ce qu'il a fait en arrivant, pourquoi il est parti et ce qu'il a trouvé en revenant, ce qu'il a vu des creux et de la levée, des fosses de la rive, ce qu'il retient des phrases, la note de l'attente, le son, la fin.

## 6. Les critères, écrits avant la recette

On les calcule sur les testeurs arrivés au bassin plein, qui doivent être quatre (§ 2).

| Critère | Atteint si… |
|---|---|
| **C1** · le retour | Au moins trois testeurs sur quatre partent au moins une fois (une absence d'au moins cinq minutes, au journal) et reviennent avant la fin. |
| **C2** · le repos | La note de l'attente (§ 7, question 7) vaut au moins 4 pour trois testeurs sur quatre, et aucune ne vaut 1. |
| **C3** · le geste | Au moins trois testeurs sur quatre bâtissent une levée (au journal), et savent dire ce qu'elle a changé : l'eau qui se repose, la couche plus sombre, le creux plus vite plein. |
| **C4** · les traces | Au moins deux testeurs sur quatre parlent des fosses ou des tablettes de la rive, d'eux-mêmes ou à la question 5 : au moins un après une dette soldée, et un après un défaut. |

**L'échec** que la fiche redoute (§ 12) a sa propre définition. Deux testeurs ou plus sont restés plus d'une heure et demie devant le bassin sans un départ (au journal), et donnent à l'attente une note de 1 ou 2 : ils n'ont pas compris qu'ils pouvaient partir, et se sont ennuyés.

**La lecture :**

| Résultat | Lecture |
|---|---|
| C1 à C4 atteints | **Le lit tient (R5).** |
| C2 atteint, C1 non | **À retravailler : le départ.** L'attente plaît, mais on ne part pas : « Rien ne presse. » ne le dit pas assez. |
| C2 non atteint, ou l'échec | **Le lit ne tient pas** : l'attente est un vide. Il est repris, ou la question passe à [#133](https://github.com/DavidGiangiacomo/strates/issues/133). |
| C3 non atteint | **À retravailler : le geste** (le creux, la levée, la couche plus sombre). |
| C4 non atteint | **À retravailler : les fosses**, dans la direction artistique. |

**Les critères ne se réajustent pas.** Si l'un d'eux se révèle mal posé, le compte rendu le dit, mais garde son verdict tel qu'il est écrit ici. Le critère corrigé ne vaut que pour la recette suivante.

**Les invariants** (§9), vérifiés par les tests, avant la recette :

| Invariant | Dans le lit | Vérifié par |
|---|---|---|
| I1 · rien de commun | son seul nombre en lettres, en coudées et en doigts ; aucune autre strate n'y compte | `tests/invariants-lit.test.ts` |
| I2 · × 4 au plus | × 1,76 avec les objets d'un jeu correct, le plafond n'agit jamais | `tests/equilibrage-lit.test.ts` |
| I3 · pas de croissance monotone | 10³ doigts, après les 10²⁰ de la dette : la plus petite échelle du jeu | `tests/invariants-lit.test.ts` |
| I4 · pas de seuil par accumulation | ne s'applique pas : la descente vient en attendant, et c'est voulu (fiche, § 4) | — |
| I5 · moins de 3 h 15 sans artefact | de 2 h 00 à 2 h 18, en continu comme avec de longues absences | `tests/equilibrage-lit.test.ts` |

## 7. Le guide d'entretien

De 15 à 20 minutes, dans les 24 heures qui suivent la fin. Les questions vont de l'ouvert au fermé, et aucune ne contient sa réponse. L'organisateur relance par « Et ensuite ? » ou « Qu'est-ce qui vous a fait penser ça ? », jamais en proposant une explication.

1. « Racontez-moi la partie, depuis le début. »
2. « En arrivant, qu'avez-vous essayé de faire ? »
3. « Avez-vous quitté le jeu, puis êtes-vous revenu ? Qu'est-ce qui vous a fait partir ? Qu'avez-vous trouvé en revenant ? »
4. « Les creux, à droite : qu'en avez-vous fait ? Qu'est-ce que ça changeait ? »
5. « Qu'avez-vous vu dans la rive, à droite ? » Puis, s'il ne parle pas des fosses : « Et dans la terre de la rive, sous la berge ? »
6. « Le jeu vous a parlé, quelques fois. Vous souvenez-vous de ce qu'il a dit ? Qu'en avez-vous pensé ? »
7. « L'attente : sur une échelle de 1 à 5, où 1 est très ennuyeuse et 5 très reposante, où la placeriez-vous ? Pourquoi ? »
8. « Le son : l'aviez-vous ? Qu'avez-vous entendu ? »
9. « Comment la partie s'est-elle finie, pour vous ? »
10. « Si cette partie durait deux semaines, comment la joueriez-vous ? »
11. « Voulez-vous ajouter quelque chose ? »

Ensuite seulement, si le testeur le demande, l'organisateur peut expliquer le projet.

## 8. La fiche du testeur

Une fiche par testeur, remplie à l'entretien, puis complétée par le journal.

```
Testeur : T_   Profil : joueur d'incrémentaux / non-joueur   La dette : soldée / en défaut
Build : ________   Partie : du ____ au ____   Entretien : le ____

Depuis le journal (npm run analyse) :
  Séances, départs, premier départ, présence :
  Levées, aide, phrases :
  Bassin plein (en présence ou non), seuil :

L'entretien :
  En arrivant (2) :
  Partir et revenir (3) :
  Les creux et la levée (4) :                          → C3 : oui / non
  La rive, les fosses (5) :   d'eux-mêmes / à la relance / non   → C4 : oui / non
  Les phrases (6) :
  L'attente, note (7) : _ /5, pourquoi :                → C2
  Le son (8) :
  La fin (9) :
  Deux semaines (10) :
  Mots notables, tels quels :
```

## 9. Avant la recette

La recette attendait l'équilibrage, le son, les textes et l'opacité du lit ([#116](https://github.com/DavidGiangiacomo/strates/issues/116), [#114](https://github.com/DavidGiangiacomo/strates/issues/114), [#92](https://github.com/DavidGiangiacomo/strates/issues/92), [#115](https://github.com/DavidGiangiacomo/strates/issues/115)) : ils sont faits. Avec ce protocole, le lit est publié, et seul le lien de départ y mène.

Viennent ensuite l'essai (§ 2), le build figé (§ 3), puis les quatre testeurs.

**Le coût** : l'envoi, quatre entretiens de vingt minutes, et une demi-journée d'analyse.

## 10. Compte rendu

*À remplir après les quatre entretiens, sans modifier ce qui précède.*
- *Le tableau du journal, par testeur (`npm run analyse`).*
- *Pour chaque critère : atteint ou non, et pour C4, par issue de la dette.*
- *La lecture du § 6, les observations secondaires, et les mots des testeurs.*

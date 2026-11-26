# Strate 6 — mesures d'équilibrage

*Fichier généré par `tests/equilibrage-dette.test.ts` : ne pas le modifier à la main. Après un changement des règles, `npm run mesures` le régénère. Les cibles viennent de la [fiche](strate-6.md) et de l'issue #105.*

Chaque joueur est un joueur automatique (`sim/joueurs/dette.ts`), qui joue à l'horloge (`sim/mesures/dette.ts`) : il passe à son rythme et fait, à chaque passage, la promesse que sa façon de jouer lui dicte. Ce sont les onze profils de la fiche (§ 4), repris du brouillon de simulation.

## Joueurs

| Joueur | Jeu |
|---|---|
| parfait | naturel ; passe toutes les 2 s |
| naturel | passe toutes les 5 s ; promet ce que la caisse paiera à chaque échéance, au terme le plus court qui tient |
| hesitant | naturel, mais prend une fois sur trois un terme plus long qu'il ne faut |
| distrait | naturel ; passe chaque minute, et fait alors tout ce qui tient |
| apprend | réflexe jusqu'à son premier report, puis naturel |
| optimiste | compte sur un rapport qui croît de 3 % par crue ; fixe la grande crue dès qu'il peut |
| temeraire | compte sur un rapport qui croît de 8 % par crue ; fixe la grande crue dès qu'il peut |
| gourmand | toujours le terme long, sans regarder la caisse |
| prudent | ne promet que ce que sa caisse couvre déjà, au terme court |
| naif | réflexe, mais cesse de promettre tant qu'une échéance est reportée |
| reflexe | passe toutes les 5 s ; promet la moins chère dès que la confiance le permet, à 6 crues |

## Sans artefact

| Joueur | Issue | À | Tablettes 2 à 5 | Dernière promesse | Termes à 2, 6, 18 | Reports | Plus grande caisse | Points | Actes | κ |
|---|---|---|---|---|---|---|---|---|---|---|
| parfait | soldée | 2 h 52 | 0 h 19, 0 h 52, 1 h 38, 2 h 32 | 2 h 46 | 12, 25, 53 | 0 | 6,3 × 10²⁰ | 28 | soldée, sans un report, au plus juste, sans aide, sans artefact | +15 |
| naturel | soldée | 2 h 52 | 0 h 19, 0 h 52, 1 h 37, 2 h 31 | 2 h 46 | 13, 24, 53 | 0 | 6,2 × 10²⁰ | 28 | soldée, sans un report, au plus juste, sans aide, sans artefact | +15 |
| hesitant | soldée | 2 h 58 | 0 h 19, 0 h 57, 1 h 40, 2 h 37 | 2 h 52 | 8, 25, 55 | 1 | 6,2 × 10²⁰ | 28 | soldée, au plus juste, sans aide, sans artefact | +12 |
| distrait | soldée | 3 h 00 | 0 h 19, 0 h 53, 1 h 36, 2 h 28 | 2 h 54 | 14, 27, 48 | 0 | 6,4 × 10²⁰ | 28 | soldée, sans un report, au plus juste, sans aide, sans artefact | +15 |
| apprend | soldée | 2 h 54 | 0 h 20, 0 h 55, 1 h 40, 2 h 34 | 2 h 48 | 9, 32, 48 | 6 | 6,2 × 10²⁰ | 28 | soldée, au plus juste, sans aide, sans artefact | +12 |
| optimiste | en défaut, tablette 5 | 2 h 34 | 0 h 18, 0 h 48, 1 h 37, 2 h 26 | 2 h 28 | 7, 35, 47 | 13 | 2,2 × 10²⁰ | 23 | sans aide, sans artefact | +6 |
| temeraire | en défaut, tablette 4 | 2 h 14 | 0 h 17, 0 h 45, 1 h 21, — | — | 6, 44, 40 | 34 | 4,5 × 10¹⁶ | 23 | sans aide, sans artefact | +6 |
| gourmand | en défaut, tablette 5 | 3 h 28 | 0 h 46, 1 h 40, 2 h 33, 3 h 20 | 3 h 22 | 0, 0, 90 | 6 | 2,2 × 10²⁰ | 23 | sans aide, sans artefact | +6 |
| prudent | soldée | 5 h 51 | 0 h 51, 2 h 10, 3 h 44, 5 h 30 | 5 h 45 | 86, 0, 0 | 0 | 6,2 × 10²⁰ | 28 | soldée, sans un report, au plus juste, sans aide, sans artefact | +15 |
| naif | en défaut, tablette 2 | 0 h 46 | 0 h 15, —, —, — | — | 0, 38, 0 | 42 | 1,6 × 10⁷ | 11 | sans aide, sans artefact | +6 |
| reflexe | en défaut, tablette 3 | 0 h 49 | 0 h 15, 0 h 42, —, — | — | 0, 46, 0 | 55 | 3,0 × 10⁸ | 12 | sans aide, sans artefact | +6 |

## Avec les objets d'un jeu correct

La présélection de 21 points dans le réseau, puis celle de 14 dans le chœur : le doigt qui montre, ce qui monte, ce qui tient, le grave qui dure, le gage qui souffle, le gage qui revient, la caution de bois, le gage patient. Ils s'éveillent à la première tablette brisée : la confiance × 1,5, le report × 1,875.

| Joueur | Issue | À | Tablettes 2 à 5 | Dernière promesse | Termes à 2, 6, 18 | Reports | Plus grande caisse | Points | Actes | κ |
|---|---|---|---|---|---|---|---|---|---|---|
| parfait | soldée | 2 h 34 | 0 h 19, 0 h 48, 1 h 25, 2 h 14 | 2 h 28 | 10, 26, 54 | 0 | 6,3 × 10²⁰ | 28 | soldée, sans un report, au plus juste, sans aide | +12 |
| naturel | soldée | 2 h 34 | 0 h 19, 0 h 49, 1 h 25, 2 h 14 | 2 h 28 | 11, 26, 54 | 0 | 6,2 × 10²⁰ | 28 | soldée, sans un report, au plus juste, sans aide | +12 |
| hesitant | soldée | 2 h 42 | 0 h 19, 0 h 53, 1 h 33, 2 h 22 | 2 h 36 | 12, 21, 56 | 0 | 6,2 × 10²⁰ | 28 | soldée, sans un report, au plus juste, sans aide | +12 |
| distrait | soldée | 2 h 45 | 0 h 19, 0 h 48, 1 h 25, 2 h 13 | 2 h 39 | 12, 28, 51 | 0 | 6,3 × 10²⁰ | 28 | soldée, sans un report, au plus juste, sans aide | +12 |
| apprend | soldée | 2 h 34 | 0 h 20, 0 h 48, 1 h 25, 2 h 14 | 2 h 28 | 7, 35, 48 | 6 | 6,2 × 10²⁰ | 28 | soldée, au plus juste, sans aide | +9 |
| optimiste | en défaut, tablette 5 | 2 h 27 | 0 h 18, 0 h 54, 1 h 32, 2 h 19 | 2 h 21 | 9, 33, 48 | 18 | 2,2 × 10²⁰ | 23 | sans aide | +3 |
| temeraire | en défaut, tablette 5 | 2 h 00 | 0 h 17, 0 h 40, 1 h 09, 1 h 52 | 1 h 54 | 6, 39, 46 | 18 | 2,2 × 10²⁰ | 23 | sans aide | +3 |
| gourmand | en défaut, tablette 5 | 2 h 59 | 0 h 46, 1 h 31, 2 h 15, 2 h 51 | 2 h 53 | 0, 0, 90 | 1 | 2,2 × 10²⁰ | 23 | sans aide | +3 |
| prudent | soldée | 5 h 51 | 0 h 51, 2 h 10, 3 h 44, 5 h 30 | 5 h 45 | 86, 0, 0 | 0 | 6,2 × 10²⁰ | 28 | soldée, sans un report, au plus juste, sans aide | +12 |
| naif | en défaut, tablette 2 | 1 h 01 | 0 h 15, —, —, — | — | 0, 38, 0 | 53 | 4,4 × 10⁷ | 11 | sans aide | +3 |
| reflexe | en défaut, tablette 4 | 1 h 22 | 0 h 15, 0 h 34, 1 h 03, — | — | 0, 78, 0 | 159 | 3,7 × 10¹³ | 19 | sans aide | +3 |

## Avec des absences

Sans objet. Pendant l'absence, le noyau rattrape le temps d'un coup, par la politique propre de la dette : les échéances tombent à leur crue, le rapport compte à 80 %, douze heures au plus, et en entier entre la dernière promesse et la grande crue (fiche, § 10).

| Rythme | Jeu | Issue | À | Présence | Reports | Points |
|---|---|---|---|---|---|---|
| naturel-1-h | naturel ; part une heure à 40 minutes | soldée | 3 h 46 | 2 h 46 | 6 | 28 |
| naturel-nuit | naturel ; part huit heures à 1 h 30 | soldée | 10 h 30 | 2 h 30 | 2 | 28 |
| naturel-12-h | naturel ; part douze heures à 40 minutes | soldée | 14 h 35 | 2 h 35 | 6 | 28 |
| naturel-2-j | naturel ; part deux jours à 2 h | soldée | 2 j 2 h 22 | 2 h 22 | 2 | 28 |
| naturel-grande-crue | naturel ; part une heure juste après sa dernière promesse | soldée | 2 h 52 | 2 h 46 | 0 | 28 |
| hesitant-12-h | hésitant ; part douze heures à 1 h | soldée | 14 h 39 | 2 h 39 | 3 | 28 |
| apprend-12-h | apprend ; part douze heures à 30 minutes | soldée | 14 h 39 | 2 h 39 | 9 | 28 |
| reflexe-12-h | réflexe ; part douze heures à 30 minutes | en défaut, tablette 2 | 1 h 05 | 0 h 30 | 49 | 10 |

- **Issue** : soldée, ou en défaut, et la tablette où la dette s'est arrêtée. **À** : en temps depuis l'arrivée, absences comprises.
- **Tablettes 2 à 5** : l'ouverture de chacune. **Dernière promesse** : celle qui fixe la grande crue, douze crues avant elle.
- **Termes** : les promesses du joueur à 2, 6 et 18 crues, avant la dernière tablette. **Plus grande caisse** : l'ordre de grandeur des montants.
- **Points** : ceux de la fouille, pour ce qui a été honoré. **Actes** : les actes de compréhension accomplis (fiche, § 7), dans l'ordre. « Sans aide » se constate au seuil : ces joueurs n'ouvrent jamais l'aide. « Sans artefact » se constate à la descente, si aucun objet n'agissait. **κ** : ce qu'ils rapportent, au barème du noyau, sur les 15 points de la dette.
- **La durée** : le joueur naturel solde en 2 h 52, vers les 3 h visées. Le plus lent de ceux qui regardent leurs échéances, le distrait, solde en 3 h 00 : I5 tient, à 15 minutes de la limite.
- **L'attente de la grande crue** : le joueur naturel ouvre la dernière tablette à 2 h 31, fait 23 promesses tout de suite, et la dernière 15 minutes plus tard. C'est le moment où se joue « au plus juste ».
- **Le terme long** : le joueur naturel le prend 59 fois sur cent. Le majorer de 80 % au lieu de 60 % ne change pas ce choix, mais rallonge la strate d'une vingtaine de minutes : le distrait dépasserait alors 3 h 15.
- **Ce que les objets font gagner** : 18 min au naturel, 16 min à l'hésitant, 15 min au distrait.
- **Les gages ne rendent pas le crédit rentable** : avec eux, le réflexe tient jusqu'à 1 h 22 au lieu de 0 h 49, et emporte 19 points au lieu de 12, mais il tombe encore en défaut. Plus de confiance lui donne plus de corde, et le report adouci la lui rend plus longue : il tombe plus tard, pas plus tôt.

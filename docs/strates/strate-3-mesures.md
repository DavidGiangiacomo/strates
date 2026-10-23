# Strate 3 — mesures d'équilibrage

*Fichier généré par `tests/equilibrage-atelier.test.ts` : ne pas le modifier à la main. Après un changement des règles, `npm run mesures` le régénère. Les cibles viennent de la [fiche](strate-3.md) et de l'issue #96 ; l'analyse est dans la section « Équilibrage » de la fiche.*

Chaque profil est un joueur automatique (`sim/joueurs/atelier.ts`). Le joueur réflexe pose la pièce la moins chère sur la première case libre, telle quelle. Les autres posent chaque pièce là où la production monte le plus, en gardant des dents libres. Ils rouvrent leur rouage quand il se ferme et font de la place aux grandes pièces. Tous, sauf le désordonné, revoient leur plan de temps en temps. À la fin, tout acheté, ils relient ce qui ne tourne pas, liment ce qui frotte et règlent le reste par des échanges. Les parties vont jusqu'au seuil, 5 h au plus.

## Profils

| Profil | Jeu |
|---|---|
| parfait | passe toutes les 2 s, revoit son plan chaque minute ; un geste prend 2 s |
| naturel | passe toutes les 5 s, revoit son plan toutes les 3 min ; un geste prend 3 s |
| apprend | réflexe jusqu'à 10 min, puis naturel |
| distrait | naturel ; passe chaque minute, revoit son plan toutes les 10 min |
| prudent | naturel ; ne dépense jamais plus de la moitié de ce qu'il a |
| desordonne | naturel, mais ne revoit jamais son plan |
| reflexe | la pièce la moins chère, sur la première case libre, telle quelle ; passe toutes les 5 s |

## Sans artefact

| Profil | Seuil | Plan de 8 | de 10 | de 12 | Tout acheté | Cumul | Production au seuil | Points | +15 min | +1 h 45 | Achats | Plus longue attente |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| parfait | 147,8 min | 22,1 min | 45,4 min | 93,1 min | 146,6 min | 3,11e+11 | 1,06e+9 par s | 16 | 16 | 17 | 123 | 5,7 min, à 89,1 min |
| naturel | 146,0 min | 21,5 min | 46,1 min | 94,3 min | 144,0 min | 3,64e+11 | 1,35e+9 par s | 16 | 17 | 18 | 123 | 4,9 min, à 73,7 min |
| apprend | 157,3 min | 25,2 min | 53,4 min | 103,8 min | 155,1 min | 4,09e+11 | 1,44e+9 par s | 16 | 17 | 18 | 123 | 6,5 min, à 99,2 min |
| distrait | 159,5 min | 21,0 min | 49,0 min | 103,0 min | 158,1 min | 3,18e+11 | 9,73e+8 par s | 16 | 16 | 17 | 123 | 4,8 min, à 99,2 min |
| prudent | 191,4 min | 30,9 min | 66,0 min | 127,1 min | 189,8 min | 3,77e+11 | 1,06e+9 par s | 16 | 16 | 17 | 123 | 7,3 min, à 119,9 min |
| desordonne | 187,8 min | 19,8 min | 54,3 min | 110,4 min | 185,3 min | 3,39e+11 | 8,42e+8 par s | 16 | 16 | 17 | 123 | 8,7 min, à 82,0 min |
| reflexe | — | 92,8 min | — | — | — | 2,66e+6 | 2,00e+2 par s | 8 | — | — | 46 | 27,3 min, à 268,2 min |

## Avec les objets d'un jeu correct

La présélection de 12 points à la surface, puis celle de 9 dans les caves : les bras en plus, les deux fenêtres, l'armoire qui compte les hivers, le grenier d'ailleurs, la roue chaude, la lame courbe, la roue peinte, le cahier à lignes, la roue de pierre.

| Profil | Seuil | Plan de 8 | de 10 | de 12 | Tout acheté | Cumul | Production au seuil | Points | +15 min | +1 h 45 | Achats | Plus longue attente |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| parfait | 123,2 min | 11,6 min | 34,5 min | 78,5 min | 122,2 min | 3,00e+11 | 1,07e+9 par s | 16 | 16 | 17 | 123 | 4,8 min, à 75,4 min |
| naturel | 134,2 min | 11,4 min | 33,9 min | 80,7 min | 132,1 min | 4,76e+11 | 2,03e+9 par s | 16 | 17 | 18 | 123 | 5,3 min, à 77,3 min |
| apprend | 150,3 min | 18,8 min | 43,8 min | 89,0 min | 148,7 min | 3,22e+11 | 1,06e+9 par s | 16 | 16 | 17 | 123 | 9,3 min, à 82,1 min |
| distrait | 144,7 min | 8,0 min | 35,0 min | 85,0 min | 143,0 min | 3,37e+11 | 1,07e+9 par s | 16 | 16 | 17 | 123 | 5,0 min, à 82,0 min |
| prudent | 160,6 min | 15,5 min | 45,6 min | 102,6 min | 159,4 min | 3,58e+11 | 1,17e+9 par s | 16 | 17 | 18 | 123 | 6,7 min, à 96,7 min |
| desordonne | 237,9 min | 10,2 min | 45,8 min | 101,0 min | 234,3 min | 3,88e+11 | 1,03e+9 par s | 16 | 16 | 17 | 123 | 10,3 min, à 189,5 min |
| reflexe | — | 53,6 min | — | — | — | 3,87e+6 | 2,47e+2 par s | 9 | — | — | 49 | 29,0 min, à 264,4 min |

- **Plan de 8**, **de 10**, **de 12** : quand le plan prend cette taille ; **Tout acheté** : le dernier achat de la nomenclature.
- **Production au seuil** : des pièces entraînées, par seconde (à la limite pour le réflexe).
- **Points** : points de fouille au seuil ; **+15 min** et **+1 h 45** : en continuant de jouer.
- **Plus longue attente** : le plus long intervalle entre deux achats avant le seuil.
- **Le joueur réflexe**, arrêté à 5 h : sans artefact, 46 achats, 48 pièces posées dont 21 qui tournent, 2,7e+6 pièces produites ; avec les objets, 49 achats, 51 pièces posées dont 21 qui tournent, 3,9e+6 pièces produites.

## La dernière ajustée

Du dernier achat au seuil : tout poser, tout relier, ne plus rien laisser frotter. Un geste prend 3 secondes (2 pour le joueur parfait), un quart de tour une seconde.

| Profil | Durée | Gestes | Coups de lime | Échanges |
|---|---|---|---|---|
| parfait, sans objets | 1,3 min | 45 | 22 | 3 |
| naturel, sans objets | 2,1 min | 44 | 34 | 2 |
| apprend, sans objets | 2,2 min | 53 | 28 | 4 |
| distrait, sans objets | 1,4 min | 32 | 17 | 3 |
| prudent, sans objets | 1,6 min | 33 | 26 | 1 |
| desordonne, sans objets | 2,5 min | 61 | 36 | 3 |
| parfait, avec objets | 1,0 min | 34 | 24 | 1 |
| naturel, avec objets | 2,2 min | 52 | 20 | 7 |
| apprend, avec objets | 1,6 min | 37 | 26 | 0 |
| distrait, avec objets | 1,7 min | 39 | 24 | 2 |
| prudent, avec objets | 1,2 min | 26 | 17 | 1 |
| desordonne, avec objets | 3,6 min | 84 | 34 | 12 |

## Achats par tranche de 10 minutes

Jusqu'au seuil. La dernière tranche est celle que le seuil interrompt.

| Profil | Sans objets | Avec objets |
|---|---|---|
| parfait | 18 10 12 14 12 11 7 5 5 4 4 5 6 5 5 | 22 17 14 17 10 5 5 4 6 6 8 7 2 |
| naturel | 18 9 13 14 11 11 5 4 7 6 4 6 6 6 3 | 23 15 17 11 12 7 6 3 5 4 5 6 6 3 |
| apprend | 16 7 10 10 13 12 10 6 4 6 3 5 4 6 5 6 | 19 12 12 13 11 9 6 7 1 6 5 6 6 5 5 |
| distrait | 17 7 11 17 6 12 7 6 6 5 4 4 6 6 4 5 | 24 15 11 15 10 6 7 4 4 5 6 6 4 4 2 |
| prudent | 17 7 6 9 9 8 9 10 5 6 4 4 2 5 3 6 4 4 5 | 22 13 11 8 11 11 6 5 4 3 4 4 4 6 4 7 |
| desordonne | 18 6 13 10 9 8 8 5 2 5 5 11 5 4 3 3 2 4 2 | 21 10 13 11 6 7 6 4 2 4 10 5 3 3 3 2 2 1 2 1 1 2 2 2 |

## Compréhension

Les actes de compréhension au seuil, et le κ qu'ils rapporteraient à la descente, sur les 16 points de l'atelier ([`comprehension.md`](../comprehension.md), § 2). Les joueurs automatiques n'ouvrent jamais l'aide : ils gagnent toujours « sans aide ». Avec les objets, l'acte « sans artefact » est perdu. Ils agrandissent le plan dès qu'ils le peuvent, et ne remplissent donc jamais le premier. Le joueur réflexe n'atteint pas le seuil.

| Profil | κ sans objets | κ avec objets | Actes, sans objets |
|---|---|---|---|
| parfait | 12 sur 16 | 9 sur 16 | gene-defaite, sans-aide, sans-artefact |
| naturel | 12 sur 16 | 9 sur 16 | gene-defaite, sans-aide, sans-artefact |
| apprend | 12 sur 16 | 9 sur 16 | gene-defaite, sans-aide, sans-artefact |
| distrait | 12 sur 16 | 9 sur 16 | gene-defaite, sans-aide, sans-artefact |
| prudent | 12 sur 16 | 9 sur 16 | gene-defaite, sans-aide, sans-artefact |
| desordonne | 12 sur 16 | 9 sur 16 | gene-defaite, sans-aide, sans-artefact |
| reflexe | — | — | — |

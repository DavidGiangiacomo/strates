# Strate 2 — mesures d'équilibrage

*Fichier généré par `tests/equilibrage-caves.test.ts` : ne pas le modifier à la main. Après un changement des règles, `npm run mesures` le régénère. Les cibles viennent de la [fiche](strate-2.md) et de l'issue #36 ; l'analyse est dans la section « Équilibrage » de la fiche.*

Chaque profil est un joueur automatique (`sim/joueurs/caves.ts`). Le joueur réflexe achète dès qu'il peut ce qui se rembourse le plus vite, comme à la surface. Les autres prévoient : ils ne dépensent que ce qui laisse, au plus bas d'ici la fin de la prochaine soudure, une marge de quelques jours de consommation. Les parties vont jusqu'au seuil, trois grands hivers de suite sans rupture ; le joueur réflexe est arrêté à 20 minutes.

## Profils

| Profil | Jeu |
|---|---|
| reflexe | achète dès qu'il peut, comme à la surface ; 4 clics/s pendant 10 min ; passe toutes les 5 s |
| apprend | comme à la surface jusqu'à 6 min, puis prévision à 30 jours ; passe toutes les 5 s, puis 20 s |
| correct | prévision à 30 jours ; 3 clics/s pendant 15 min ; passe toutes les 5 s, puis 20 s |
| prudent | prévision à 90 jours ; 2 clics/s pendant 5 min ; passe toutes les 10 s, puis chaque minute |
| distrait | prévision à 30 jours ; 2 clics/s pendant 5 min ; passe toutes les 10 s, puis chaque minute |

## Sans objets de la surface

| Profil | Seuil | Cumul | Points | +10 min | +1 h | Première rupture | Hivers manqués | Achats | Plus longue attente | Familles |
|---|---|---|---|---|---|---|---|---|---|---|
| reflexe | — | 1,27e+5 | 7 | — | — | 4,5 min | 1 sur 2 | 85 | 3,7 min, à 10,9 min | 50 |
| apprend | 111,0 min | 1,97e+6 | 8 | 8 | 9 | 4,5 min | 2 sur 16 | 135 | 7,0 min, à 20,0 min | 260 |
| correct | 111,0 min | 2,50e+6 | 8 | 9 | 9 | 5,8 min | 1 sur 16 | 149 | 6,0 min, à 85,7 min | 333 |
| prudent | 111,0 min | 1,54e+6 | 8 | 8 | 9 | 27,1 min | 2 sur 16 | 125 | 7,0 min, à 41,0 min | 240 |
| distrait | 111,0 min | 2,34e+6 | 8 | 9 | 9 | 6,0 min | 2 sur 16 | 142 | 7,0 min, à 92,0 min | 315 |

## Avec les objets d'un jeu correct

La présélection pour 12 points : les bras en plus, les deux fenêtres, l'armoire qui compte les hivers, le grenier d'ailleurs, la roue chaude. Leurs multiplicateurs ne s'éveillent qu'au bilan du premier hiver.

| Profil | Seuil | Cumul | Points | +10 min | +1 h | Première rupture | Hivers manqués | Achats | Plus longue attente | Familles |
|---|---|---|---|---|---|---|---|---|---|---|
| reflexe | — | 2,20e+5 | 7 | — | — | 4,5 min | 1 sur 2 | 95 | 3,5 min, à 10,8 min | 52 |
| apprend | 111,0 min | 4,98e+6 | 9 | 9 | 9 | 4,5 min | 1 sur 16 | 157 | 6,3 min, à 99,3 min | 351 |
| correct | 111,0 min | 5,34e+6 | 9 | 9 | 9 | 5,8 min | 2 sur 16 | 166 | 6,3 min, à 92,0 min | 360 |
| prudent | 111,0 min | 5,78e+6 | 9 | 9 | 9 | 5,9 min | 1 sur 16 | 158 | 6,0 min, à 79,0 min | 360 |
| distrait | 111,0 min | 5,80e+6 | 9 | 9 | 9 | 6,0 min | 1 sur 16 | 159 | 6,0 min, à 79,0 min | 360 |

- **Points** : points de fouille au seuil ; **+10 min** et **+1 h** : en continuant de jouer.
- **Hivers manqués** : sur les hivers jugés avant le seuil, soudure comprise.
- **Plus longue attente** : le plus long intervalle entre deux achats avant le seuil.

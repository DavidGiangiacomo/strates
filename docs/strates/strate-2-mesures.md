# Strate 2 — mesures d'équilibrage

*Fichier généré par `tests/equilibrage-caves.test.ts` : ne pas le modifier à la main. Après un changement des règles, `npm run mesures` le régénère. Les cibles viennent de la [fiche](strate-2.md) et des issues #36 et #163 ; l'analyse est dans la section « Équilibrage » de la fiche.*

Chaque profil est un joueur automatique (`sim/joueurs/caves.ts`). Le joueur réflexe achète dès qu'il peut ce qui se rembourse le plus vite, comme à la surface. Les autres prévoient : ils ne dépensent que ce qui laisse, au plus bas d'ici la fin de la prochaine soudure, une marge de quelques jours de consommation. Dès que les rations se comptent, ils prennent les plus larges qui tiennent cette marge, et les resserrent à temps. Les parties vont jusqu'au seuil, trois grands hivers de suite sans rupture ; le joueur réflexe est arrêté à 20 minutes.

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
| apprend | 111,3 min | 3,40e+6 | 9 | 9 | 9 | 4,5 min | 1 sur 16 | 170 | 7,0 min, à 20,0 min | 693 |
| correct | 111,3 min | 4,24e+6 | 9 | 9 | 9 | — | 0 sur 16 | 175 | 5,3 min, à 85,0 min | 872 |
| prudent | 111,3 min | 2,24e+6 | 8 | 9 | 9 | — | 0 sur 16 | 135 | 7,0 min, à 41,0 min | 482 |
| distrait | 111,3 min | 4,30e+6 | 9 | 9 | 9 | — | 0 sur 16 | 155 | 5,0 min, à 22,0 min | 891 |

## Avec les objets d'un jeu correct

La présélection pour 12 points : les bras en plus, les deux fenêtres, l'armoire qui compte les hivers, le grenier d'ailleurs, la roue chaude. Leurs multiplicateurs ne s'éveillent qu'au bilan du premier hiver.

| Profil | Seuil | Cumul | Points | +10 min | +1 h | Première rupture | Hivers manqués | Achats | Plus longue attente | Familles |
|---|---|---|---|---|---|---|---|---|---|---|
| reflexe | — | 2,20e+5 | 7 | — | — | 4,5 min | 1 sur 2 | 95 | 3,5 min, à 10,8 min | 52 |
| apprend | 111,1 min | 8,53e+6 | 9 | 9 | 10 | 4,5 min | 1 sur 16 | 175 | 5,7 min, à 79,0 min | 962 |
| correct | 111,1 min | 1,06e+7 | 9 | 10 | 10 | — | 0 sur 16 | 196 | 5,7 min, à 79,0 min | 1000 |
| prudent | 111,1 min | 8,88e+6 | 9 | 9 | 10 | — | 0 sur 16 | 166 | 6,2 min, à 0,5 min | 1000 |
| distrait | 111,1 min | 1,05e+7 | 9 | 9 | 10 | — | 0 sur 16 | 168 | 6,0 min, à 72,0 min | 1000 |

- **Points** : points de fouille au seuil ; **+10 min** et **+1 h** : en continuant de jouer.
- **Hivers manqués** : sur les hivers jugés avant le seuil, soudure comprise.
- **Plus longue attente** : le plus long intervalle entre deux achats avant le seuil.

## Décisions par tranche de 10 minutes

Les secondes où le joueur achète ou change les rations, jusqu'au seuil (#163). La dernière tranche est celle que le seuil interrompt.

| Profil | 0–10 | 10–20 | 20–30 | 30–40 | 40–50 | 50–60 | 60–70 | 70–80 | 80–90 | 90–100 | 100–110 | 110–120 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| apprend, sans objets | 53 | 9 | 4 | 15 | 13 | 9 | 11 | 8 | 6 | 12 | 6 | 2 |
| correct, sans objets | 30 | 10 | 7 | 16 | 15 | 10 | 11 | 11 | 7 | 10 | 5 | 2 |
| prudent, sans objets | 5 | 3 | 6 | 6 | 6 | 4 | 9 | 9 | 6 | 8 | 3 | 2 |
| distrait, sans objets | 25 | 5 | 4 | 7 | 7 | 7 | 7 | 6 | 4 | 8 | 4 | 2 |
| apprend, avec objets | 59 | 8 | 20 | 12 | 12 | 8 | 8 | 8 | 4 | 10 | 5 | 2 |
| correct, avec objets | 42 | 17 | 20 | 14 | 14 | 11 | 9 | 8 | 4 | 10 | 5 | 2 |
| prudent, avec objets | 19 | 5 | 9 | 7 | 8 | 8 | 6 | 8 | 5 | 8 | 5 | 2 |
| distrait, avec objets | 32 | 6 | 8 | 9 | 9 | 9 | 7 | 7 | 4 | 8 | 4 | 2 |

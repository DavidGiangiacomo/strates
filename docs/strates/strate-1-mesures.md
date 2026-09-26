# Strate 1 — mesures d'équilibrage

*Fichier généré par `tests/equilibrage-surface.test.ts` : ne pas le modifier à la main. Après un changement des règles, `npm run mesures` le régénère. Les cibles viennent de la [fiche](strate-1.md) ; l'analyse est dans sa section « Équilibrage ».*

Chaque profil est un joueur automatique (`sim/joueurs/surface.ts`) qui achète toujours ce qui se rembourse le plus vite. Les parties vont jusqu'au seuil de fouille, 1 M cr/s.

## Profils

| Profil | Jeu |
|---|---|
| parfait | 6 clics/s pendant 10 min, puis 2/s ; achète à la seconde près |
| actif | 5 clics/s pendant 10 min, 2/s jusqu'à 30 min ; passe toutes les 5 s |
| correct | 4 clics/s pendant 5 min, 1/s jusqu'à 15 min ; passe toutes les 5 s, puis 20 s |
| distrait | 3 clics/s pendant 5 min ; passe toutes les 10 s, puis chaque minute |
| occasionnel | 3 clics/s pendant 2 min ; passe toutes les 10 s, puis toutes les 5 min |

## Résultats

| Profil | Seuil | Points | +10 min | +1 h | Une nuit | Achats | Clic à 5 min | Clic à 15 min | Plus longue attente |
|---|---|---|---|---|---|---|---|---|---|
| parfait | 67,5 min | 12 | 12 | 14 | 14 | 167 | 50 % | 7 % | 5,0 min, à 46,8 min |
| actif | 70,1 min | 12 | 12 | 14 | 14 | 166 | 51 % | 7 % | 5,3 min, à 48,5 min |
| correct | 72,7 min | 12 | 12 | 14 | 14 | 167 | 50 % | 6 % | 5,0 min, à 51,0 min |
| distrait | 78,0 min | 12 | 12 | 14 | 14 | 168 | 39 % | 3 % | 6,0 min, à 55,0 min |
| occasionnel | 95,0 min | 12 | 12 | 14 | 14 | 167 | 20 % | 3 % | 5,2 min, à 4,8 min |

- **Points** : points de fouille au seuil ; **+10 min** et **+1 h** : en continuant de jouer ; **une nuit** : après 12 h d'absence au seuil, comptées à 80 %.
- **Clic** : part du cumul due aux clics.
- **Plus longue attente** : le plus long intervalle entre deux achats avant le seuil.

## Objectifs (minutes de jeu)

| Objectif | parfait | actif | correct | distrait | occasionnel |
|---|---|---|---|---|---|
| Produire 15 cr | 0,1 | 0,1 | 0,1 | 0,1 | 0,1 |
| Acheter un poste | 0,1 | 0,1 | 0,1 | 0,2 | 0,2 |
| Atteindre 1 cr/s | 0,4 | 0,5 | 0,7 | 0,8 | 0,8 |
| Acheter une amélioration | 0,4 | 0,5 | 0,7 | 0,8 | 0,8 |
| Atteindre 10 cr/s | 2,2 | 2,6 | 2,1 | 2,7 | 3,2 |
| Atteindre 100 cr/s | 6,5 | 7,3 | 8,7 | 11,0 | 15,0 |
| Atteindre 1 k cr/s | 15,0 | 15,8 | 18,0 | 21,0 | 30,0 |
| Atteindre 10 k cr/s | 28,0 | 29,0 | 31,0 | 35,0 | 45,0 |
| Atteindre 100 k cr/s | 43,6 | 45,2 | 47,7 | 52,0 | 65,0 |
| Atteindre 1 M cr/s | 67,5 | 70,1 | 72,7 | 78,0 | 95,0 |

## Premier achat de chaque générateur (minutes de jeu)

| Générateur | parfait | actif | correct | distrait | occasionnel |
|---|---|---|---|---|---|
| Poste | 0,1 | 0,1 | 0,1 | 0,2 | 0,2 |
| Équipe | 0,6 | 0,8 | 0,9 | 1,2 | 1,2 |
| Serveur | 3,2 | 3,7 | 4,3 | 5,8 | 10,0 |
| Chaîne | 9,9 | 10,8 | 12,7 | 15,0 | 20,0 |
| Turbine | 20,1 | 21,0 | 23,0 | 26,0 | 35,0 |
| Usine | 35,7 | 37,0 | 39,0 | 43,0 | 55,0 |
| Filiale | 51,8 | 53,8 | 56,0 | 61,0 | 75,0 |

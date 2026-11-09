# Strate 7 — mesures d'équilibrage

*Fichier généré par `tests/equilibrage-lit.test.ts` : ne pas le modifier à la main. Après un changement des règles, `npm run mesures` le régénère. Les cibles viennent de la [fiche](strate-7.md) et de l'issue #116.*

Chaque rythme est un joueur automatique (`sim/joueurs/lit.ts`), qui joue à l'horloge (`sim/mesures/lit.ts`). À chaque passage, il ferme le premier creux qui n'est pas plein : quand il le voit sous l'eau, ou d'avance s'il prévoit. Au retour d'une absence, il passe aussitôt. Pendant l'absence, le noyau rattrape le temps d'un coup, crue par crue, par la politique propre du lit : à 100 %, sans plafond. Le bassin plein attend le joueur, et la descente part une crue après son retour.

## Rythmes

| Rythme | Jeu |
|---|---|
| prevoyant | passe chaque minute ; dès qu'un creux est plein, bâtit la levée sur le suivant |
| attentif | passe toutes les cinq minutes ; ferme un creux quand l'eau l'atteint |
| distrait | passe toutes les demi-heures |
| sans-un-geste | ne fait rien, et reste là |
| voyageur-2-h | ferme le premier creux, part deux heures, puis joue en attentif |
| voyageur-2-semaines | ferme le premier creux, puis part deux semaines |
| sessions-1-h | joue cinq minutes par heure, en attentif |
| sessions-30-min | joue dix minutes, part une demi-heure, en attentif |
| nuit | joue une demi-heure en attentif, puis part huit heures |
| part-aussitot | part deux semaines dès l'arrivée, sans un geste |

## Sans artefact

| Rythme | Bassin plein | Descente | Présence | Levées | Couches retenues | Limon | Points |
|---|---|---|---|---|---|---|---|
| prevoyant | 2 h 00 | 2 h 00 | 2 h 00 | 4 | 100 | 1 941 doigts | 4 |
| attentif | 2 h 04 | 2 h 05 | 2 h 05 | 4 | 86 | 1 941 doigts | 4 |
| distrait | 2 h 13 | 2 h 14 | 2 h 14 | 1 | 25 | 1 941 doigts | 4 |
| sans-un-geste | 2 h 18 | 2 h 18 | 2 h 18 | 0 | 0 | 1 941 doigts | 4 |
| voyageur-2-h | 2 h 13 | 2 h 14 | 0 h 14 | 1 | 25 | 1 941 doigts | 4 |
| voyageur-2-semaines | 2 h 13 | 14 j 0 h 02 | 0 h 02 | 1 | 25 | 1 941 doigts | 4 |
| sessions-1-h | 2 h 13 | 3 h 01 | 0 h 16 | 1 | 25 | 1 941 doigts | 4 |
| sessions-30-min | 2 h 11 | 2 h 41 | 0 h 41 | 2 | 36 | 1 941 doigts | 4 |
| nuit | 2 h 13 | 8 h 31 | 0 h 31 | 1 | 25 | 1 941 doigts | 4 |
| part-aussitot | 2 h 18 | 14 j 0 h 01 | 0 h 01 | 0 | 0 | 1 941 doigts | 4 |

## Avec les objets d'un jeu correct

La présélection de 14 points dans le chœur, puis celle de 28 dans la dette : le gage qui souffle, le gage qui revient, la caution de bois, le gage patient, le bâton qui creuse, le rouleau qui marque, la pierre qui pèse, l'œuf qui garde. Sur l'eau retenue, × 1,41 ; sur l'absence, × 1,25.

| Rythme | Bassin plein | Descente | Présence | Levées | Couches retenues | Limon | Points |
|---|---|---|---|---|---|---|---|
| prevoyant | 1 h 46 | 1 h 46 | 1 h 46 | 4 | 72 | 1 941 doigts | 4 |
| attentif | 1 h 51 | 1 h 51 | 1 h 51 | 4 | 61 | 1 941 doigts | 4 |
| distrait | 1 h 53 | 1 h 54 | 1 h 54 | 4 | 56 | 1 941 doigts | 4 |
| sans-un-geste | 2 h 18 | 2 h 18 | 2 h 18 | 0 | 0 | 1 941 doigts | 4 |
| voyageur-2-h | 1 h 44 | 2 h 02 | 0 h 02 | 1 | 15 | 1 941 doigts | 4 |
| voyageur-2-semaines | 1 h 44 | 14 j 0 h 02 | 0 h 02 | 1 | 15 | 1 941 doigts | 4 |
| sessions-1-h | 1 h 43 | 2 h 01 | 0 h 11 | 2 | 23 | 1 941 doigts | 4 |
| sessions-30-min | 1 h 44 | 2 h 01 | 0 h 31 | 2 | 35 | 1 941 doigts | 4 |
| nuit | 1 h 49 | 8 h 31 | 0 h 31 | 1 | 18 | 1 941 doigts | 4 |
| part-aussitot | 1 h 50 | 14 j 0 h 01 | 0 h 01 | 0 | 0 | 1 941 doigts | 4 |

- **Bassin plein** : le limon atteint la rive, en temps depuis l'arrivée, absences comprises. **Descente** : au même compte, une crue après le bassin plein, ou après le retour du joueur.
- **Présence** : le temps où le joueur était là, jusqu'à la descente.
- **Levées** : les levées bâties ; **couches retenues** : les crues dont l'eau s'est reposée derrière une levée.
- **Limon** : la valeur convertible, à la descente.
- **Ce que les objets font gagner** au bassin plein : 14,0 min au prévoyant, 13,5 min à l'attentif, 29,5 min au voyageur, 28,0 min à qui part dès l'arrivée, rien à qui reste sans un geste.

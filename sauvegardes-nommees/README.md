# Sauvegardes nommées

Des points précis du jeu, au format de la décision D-005, pour le développement et le playtest (#28). Chacune est une vraie sauvegarde, écrite par le jeu.

| Fichier | Moment |
|---|---|
| `surface-15-minutes.json` | La surface après 15 minutes de jeu |
| `surface-45-minutes.json` | La surface après 45 minutes de jeu |
| `surface-juste-avant-le-seuil.json` | Une à deux minutes de jeu avant 1 M cr/s |
| `surface-seuil-atteint.json` | Le seuil vient d'être atteint : « creuser » est accepté |
| `surface-fissure.json` | Seuil atteint depuis 6 minutes, sans creuser : la fissure est à moitié tracée |

## Les charger

En développement (`npm run dev`), le panneau des outils (bouton « dev », en bas à droite) les propose sous « Parties ». Il les **recale sur l'heure courante** : sans cela, une sauvegarde écrite il y a des semaines subirait aussitôt 12 h d'absence au chargement.

Le même panneau importe aussi n'importe quel fichier de sauvegarde, recalé de la même façon. Le jeu publié n'a pas encore d'import.

## Les régénérer

Elles sont produites par un joueur automatique (`sim/joueurs/surface.ts`) qui joue une partie correcte, avec une graine et une horloge fixes. `tests/sauvegardes-nommees.test.ts` vérifie qu'elles sont à jour et qu'elles sont bien ce que leur nom promet : par exemple, que le seuil tombe une à deux minutes après `surface-juste-avant-le-seuil`.

Après un changement des règles ou du format :

```sh
npm run sauvegardes
```

Ne pas les modifier à la main : la CI les compare octet par octet à ce que produit le générateur.

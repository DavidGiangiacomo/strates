# Simulateur d'équilibrage

Fait tourner la logique d'une strate sans rendu, sous Node ([#23](https://github.com/DavidGiangiacomo/strates/issues/23)). Il n'importe que des dossiers `logique/`.

- `joueurs/surface.ts` : un joueur automatique pour la surface, qui clique puis achète toujours ce qui se rembourse le plus vite. Il sert au test de partie complète de la strate 1 et à la génération des [sauvegardes nommées](../sauvegardes-nommees/README.md).
- `mesures/surface.ts` : les mesures d'une partie de la surface (seuil, points, objectifs, part du clic, attentes entre deux achats). Elles alimentent `tests/equilibrage-surface.test.ts` et le rapport [`docs/strates/strate-1-mesures.md`](../docs/strates/strate-1-mesures.md).
- `joueurs/caves.ts` : des joueurs automatiques pour les caves, du joueur réflexe, qui achète comme à la surface, aux joueurs qui prévoient l'hiver.
- `mesures/caves.ts` : les mesures d'une partie des caves, avec ou sans artefacts (seuil, points, premières ruptures, hivers manqués, attentes entre deux achats). Elles alimentent `tests/equilibrage-caves.test.ts` et le rapport [`docs/strates/strate-2-mesures.md`](../docs/strates/strate-2-mesures.md).

## La commande

`npm run simuler -- <strate> [joueur… | tous] [options]` fait jouer une strate par un ou plusieurs joueurs, et donne pour chaque partie le temps jusqu'au seuil de fouille, la valeur convertible et les points de fouille, avec ce que la strate mesure en plus. Une partie complète prend une à deux secondes.

```sh
npm run simuler -- surface                      # le joueur correct
npm run simuler -- surface tous                 # les six joueurs de la surface
npm run simuler -- caves correct --comparer     # sans objet, puis avec ceux d'un jeu correct, et I5
npm run simuler -- 2 reflexe --objets=s1-turbine,s1-equipe --limite=6
npm run simuler -- caves tous --json            # les résultats en JSON
```

- **La strate** se nomme par son nom ou par sa profondeur : `surface` ou `1`, `caves` ou `2`.
- **`--objets`** emporte des objets d'en haut : `jeu-correct` (la présélection de 12 points : l'équipe, le double écran, le serveur, la filiale, la turbine), ou une liste d'identifiants. La surface n'en reçoit aucun.
- **`--comparer`** joue chaque partie deux fois, sans objet puis avec, et dit si I5 est tenu : le seuil en moins de 3 h 15 sans aucun artefact.
- **`--limite`** borne la partie, en heures de jeu (4 par défaut) ; **`--json`** rend les résultats en JSON.
- `sim/simulateur.ts` fait le travail, et `sim/simuler.mjs` le lance sous Node : Vite (`runnerImport`) charge le TypeScript et la logique des strates, sans rendu ni navigateur.

## Les stratégies

Chaque joueur est un rythme (clics, passages) et une façon d'acheter :
- **le glouton** achète ce qui se rembourse le plus vite ; c'est le cas de tous les joueurs, sauf un ;
- **le naïf**, `moins-cher`, achète toujours ce qui coûte le moins cher, au rythme du joueur correct à la surface, et du joueur réflexe dans les caves ;
- dans les caves, les joueurs qui **prévoient** ne dépensent que ce qui laisse de quoi passer la prochaine soudure (`joueurs/caves.ts`).

**Ce que montre le joueur naïf** :
- à la surface, il n'atteint le seuil qu'à 4 h 37, au-delà des 3 h 15 d'I5. Les joueurs gloutons l'atteignent entre 1 h 07 et 1 h 35. Acheter au meilleur rendement n'est pas qu'une optimisation : c'est la façon de jouer que la surface suppose ;
- dans les caves, il manque un hiver sur deux et n'atteint pas le seuil en 4 h sans objet ; avec les objets d'un jeu correct, il l'atteint à 2 h 12.


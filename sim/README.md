# Simulateur d'équilibrage

Fait tourner la logique d'une strate sans rendu, sous Node ([#23](https://github.com/DavidGiangiacomo/strates/issues/23)). Il n'importe que des dossiers `logique/`.

- `joueurs/surface.ts` : un joueur automatique pour la surface, qui clique puis achète toujours ce qui se rembourse le plus vite. Il sert au test de partie complète de la strate 1 et à la génération des [sauvegardes nommées](../sauvegardes-nommees/README.md).
- `mesures/surface.ts` : les mesures d'une partie de la surface (seuil, points, objectifs, part du clic, attentes entre deux achats). Elles alimentent `tests/equilibrage-surface.test.ts` et le rapport [`docs/strates/strate-1-mesures.md`](../docs/strates/strate-1-mesures.md).
- `joueurs/caves.ts` : des joueurs automatiques pour les caves, du joueur réflexe, qui achète comme à la surface, aux joueurs qui prévoient l'hiver.
- `mesures/caves.ts` : les mesures d'une partie des caves, avec ou sans artefacts (seuil, points, premières ruptures, hivers manqués, attentes entre deux achats, décisions par tranche de 10 minutes, et les actes de compréhension avec le κ qu'ils rapportent, [#78](https://github.com/DavidGiangiacomo/strates/issues/78)). Elles alimentent `tests/equilibrage-caves.test.ts` et le rapport [`docs/strates/strate-2-mesures.md`](../docs/strates/strate-2-mesures.md).
- `joueurs/atelier.ts` : des joueurs automatiques pour l'atelier ([#96](https://github.com/DavidGiangiacomo/strates/issues/96)), du joueur réflexe, qui pose la pièce la moins chère sur la première case libre, aux joueurs qui cherchent la meilleure case et revoient leur plan.
- `mesures/atelier.ts` : les mesures d'une partie de l'atelier, avec ou sans artefacts (seuil, points, agrandissements du plan, dernier achat, attentes entre deux achats, achats par tranche de 10 minutes, gestes de la dernière ajustée, et les actes de compréhension avec le κ qu'ils rapportent). Elles alimentent `tests/equilibrage-atelier.test.ts` et le rapport [`docs/strates/strate-3-mesures.md`](../docs/strates/strate-3-mesures.md).

## La commande

`npm run simuler -- <strate> [joueur… | tous] [options]` fait jouer une strate par un ou plusieurs joueurs, et donne pour chaque partie le temps jusqu'au seuil de fouille, la valeur convertible et les points de fouille, avec ce que la strate mesure en plus. Une partie complète prend une à deux secondes, et de 5 à 10 dans l'atelier, où le joueur cherche sa case.

```sh
npm run simuler -- surface                      # le joueur correct
npm run simuler -- surface tous                 # les six joueurs de la surface
npm run simuler -- caves correct --comparer     # sans objet, puis avec ceux d'un jeu correct, et I5
npm run simuler -- 2 reflexe --objets=s1-turbine,s1-equipe --limite=6
npm run simuler -- caves tous --json            # les résultats en JSON
npm run simuler -- atelier --comparer           # le joueur naturel, sans objet puis avec, et I5
```

- **La strate** se nomme par son nom ou par sa profondeur : `surface` ou `1`, `caves` ou `2`, `atelier` ou `3`.
- **Le joueur** est le correct quand on n'en nomme aucun ; dans l'atelier, c'est le naturel.
- **`--objets`** emporte des objets d'en haut : `jeu-correct`, ou une liste d'identifiants. Le jeu correct, c'est la présélection de 12 points à la surface : l'équipe, le double écran, le serveur, la filiale, la turbine. L'atelier y ajoute celle de 9 points dans les caves : la faucille, le calendrier, le registre, la meule. La surface n'en reçoit aucun.
- **`--comparer`** joue chaque partie deux fois, sans objet puis avec, et dit si I5 est tenu : le seuil en moins de 3 h 15 sans aucun artefact.
- **`--limite`** borne la partie, en heures de jeu (4 par défaut) ; **`--json`** rend les résultats en JSON.
- `sim/simulateur.ts` fait le travail, et `sim/simuler.mjs` le lance sous Node : Vite (`runnerImport`) charge le TypeScript et la logique des strates, sans rendu ni navigateur.

## Les stratégies

Chaque joueur est un rythme (clics, passages) et une façon d'acheter :
- **le glouton** achète ce qui se rembourse le plus vite ; c'est le cas de presque tous les joueurs. Dans l'atelier, une pièce se rembourse selon la case où il la poserait ;
- **le naïf**, `moins-cher`, achète toujours ce qui coûte le moins cher, au rythme du joueur correct à la surface, et du joueur réflexe dans les caves. Dans l'atelier, c'est le joueur réflexe ;
- dans les caves, les joueurs qui **prévoient** ne dépensent que ce qui laisse de quoi passer la prochaine soudure (`joueurs/caves.ts`). À partir de l'an 5, ils prennent aussi les rations les plus larges qu'ils peuvent tenir, et les resserrent à temps ([#163](https://github.com/DavidGiangiacomo/strates/issues/163)) ;
- dans l'atelier, acheter compte moins que **placer** (`joueurs/atelier.ts`). Les joueurs posent chaque pièce là où la production monte le plus, en gardant des dents libres vers les cases vides. Ils rouvrent leur rouage quand il se ferme, font de la place aux grandes pièces et revoient leur plan de temps en temps. À la fin, tout acheté, ils relient ce qui ne tourne pas, liment ce qui frotte et règlent le reste par des échanges. Le joueur réflexe, lui, pose tout tel quel sur la première case libre.

**Ce que montre le joueur naïf** :
- à la surface, il n'atteint le seuil qu'à 4 h 37, au-delà des 3 h 15 d'I5. Les joueurs gloutons l'atteignent entre 1 h 07 et 1 h 35. Acheter au meilleur rendement n'est pas qu'une optimisation : c'est la façon de jouer que la surface suppose ;
- dans les caves, il manque un hiver sur deux et n'atteint pas le seuil en 4 h sans objet ; avec les objets d'un jeu correct, il l'atteint à 2 h 12.


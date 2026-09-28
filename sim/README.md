# Simulateur d'équilibrage

Fait tourner la logique d'une strate sans rendu, sous Node ([#23](https://github.com/DavidGiangiacomo/strates/issues/23)). Il n'importe que des dossiers `logique/`.

- `joueurs/surface.ts` : un joueur automatique pour la surface, qui clique puis achète toujours ce qui se rembourse le plus vite. Il sert au test de partie complète de la strate 1 et à la génération des [sauvegardes nommées](../sauvegardes-nommees/README.md).
- `mesures/surface.ts` : les mesures d'une partie de la surface (seuil, points, objectifs, part du clic, attentes entre deux achats). Elles alimentent `tests/equilibrage-surface.test.ts` et le rapport [`docs/strates/strate-1-mesures.md`](../docs/strates/strate-1-mesures.md).
- `joueurs/caves.ts` : des joueurs automatiques pour les caves, du joueur réflexe, qui achète comme à la surface, aux joueurs qui prévoient l'hiver.
- `mesures/caves.ts` : les mesures d'une partie des caves, avec ou sans artefacts (seuil, points, premières ruptures, hivers manqués, attentes entre deux achats). Elles alimentent `tests/equilibrage-caves.test.ts` et le rapport [`docs/strates/strate-2-mesures.md`](../docs/strates/strate-2-mesures.md).

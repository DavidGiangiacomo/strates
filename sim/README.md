# Simulateur d'équilibrage

Fait tourner la logique d'une strate sans rendu, sous Node ([#23](https://github.com/DavidGiangiacomo/strates/issues/23)). Il n'importe que des dossiers `logique/`.

- `joueurs/surface.ts` : un joueur automatique pour la surface, qui clique puis achète toujours ce qui se rembourse le plus vite. Il sert au test de partie complète de la strate 1 et à la génération des [sauvegardes nommées](../sauvegardes-nommees/README.md).

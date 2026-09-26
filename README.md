# Strates

Jeu incrémental long (18–25 h) en huit strates. Chaque strate est un incrémental complet et différent ; le prestige est une descente d'un étage, qui change les règles au lieu de les remettre à zéro.

## Version de playtest

**<https://davidgiangiacomo.github.io/strates/>**

Chaque push sur `main` qui passe la CI y est publié automatiquement (job `publier` de `.github/workflows/ci.yml`). Le bas de la page affiche la version et le commit du build (« Strates 0.0.0 · 07eede8 ») : c'est ce qu'il faut noter avec chaque retour de playtest.

Les sauvegardes des testeurs restent dans leur navigateur, propres à ce site.

Réglage unique du dépôt, déjà nécessaire au premier déploiement : *Settings → Pages → Build and deployment → Source : GitHub Actions*.

## Documents

| Fichier | Contenu |
|---|---|
| [`docs/design-doc.md`](docs/design-doc.md) | Le design doc, référence du projet |
| [`docs/roadmap.md`](docs/roadmap.md) | Phases, points de décision et graphe des dépendances |
| [`docs/decisions.md`](docs/decisions.md) | Journal des décisions prises |
| [`docs/strates/modele-fiche.md`](docs/strates/modele-fiche.md) | Modèle de fiche de design, à suivre pour chaque strate |
| [`docs/strates/strate-1.md`](docs/strates/strate-1.md) | Fiche de design de la strate 1, la surface |
| [`docs/architecture.md`](docs/architecture.md) | Contrat entre le noyau et les strates (types, boucle, descente, journal) |
| [`docs/artefacts.md`](docs/artefacts.md) | Modèle des artefacts (points de fouille, usure, plafond, écran de choix) et catalogue |

## Développement

Prérequis : Node 22 (voir `.nvmrc`). La stack est décrite dans la décision D-004.

```sh
npm install          # dépendances
npm run dev          # serveur de développement
npm run build        # build de production dans dist/
npm test             # tests (Vitest)
npm run lint         # ESLint, dont les règles d'architecture
npm run check        # types : application, puis logique sans DOM
npm run format       # Prettier
npm run sauvegardes  # régénère les sauvegardes nommées (sauvegardes-nommees/)
```

### Outils de développement

Avec `npm run dev`, un bouton « dev » en bas à droite ouvre le panneau des outils (#28). Il n'existe pas dans le build de production.

- **Temps** : vitesse ×1, ×10, ×100 ou ×1000 ; avance immédiate de 1 min, 10 min ou 1 h.
- **Horloge** : absence simulée (1 min à 3 jours) et recul d'horloge (2 min à 2 h), pour tester le hors-ligne et les perturbations du journal.
- **Parties** : les [sauvegardes nommées](sauvegardes-nommees/README.md), le saut direct à une strate, une nouvelle partie, le téléchargement et l'import d'une sauvegarde.
- **État** : l'état de la strate courante en JSON, les artefacts et κ, à modifier à la main.

Tout ce qui change la partie passe par une sauvegarde, puis un rechargement : le vrai chemin de chargement, migrations comprises. La partie repart alors de l'heure courante.

La CI (GitHub Actions) lance le lint, le formatage, les types, les tests et le build à chaque push et à chaque pull request. Sur `main`, elle publie ensuite la version de playtest.

## Organisation des tâches

Les tâches sont des **issues GitHub**. Chaque phase est une issue « épopée » ; les strates 3 à 8 ont aussi leur propre épopée. Les tâches sont rattachées à leur épopée comme sous-issues.

### Dépendances

Chaque issue a une section **Dépendances** qui liste les issues qui la bloquent (« Bloquée par : #12 »). Une tâche peut démarrer quand toutes ses issues bloquantes sont fermées. Seules les dépendances directes sont listées : si A bloque B et B bloque C, C ne liste que B.

Le graphe complet est dans [`docs/roadmap.md`](docs/roadmap.md).

### Labels

| Famille | Labels | Usage |
|---|---|---|
| Phase | `phase-0` … `phase-5` | Phase du projet (voir la roadmap) |
| Zone | `noyau`, `strate-1` … `strate-8`, `fins` | Partie du jeu concernée |
| Discipline | `design`, `code`, `infra`, `DA`, `audio`, `écriture`, `équilibrage`, `playtest` | Type de travail |
| Type | `épopée`, `décision` | Issue parente ; décision à prendre et à consigner dans `docs/decisions.md` |

### Critères communs à toute strate

Une strate est terminée quand elle passe sa **recette R5** : elle tient seule comme jeu de 2 h. Elle respecte aussi les invariants I1 à I5 du design doc (§9) :

- **I1** : ressource, unité et notation propres, partagées avec aucune autre strate ;
- **I2** : cumul des multiplicateurs d'artefacts ≤ ×4 ;
- **I3** : ordre de grandeur local non monotone d'une strate à l'autre ;
- **I4** : seuil de fouille impossible à franchir par simple accumulation ;
- **I5** : strate terminable en moins de 3 h 15 sans aucun artefact.

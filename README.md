# Strates

Jeu incrémental long (18–25 h) en huit strates. Chaque strate est un incrémental complet et différent ; le prestige est une descente d'un étage, qui change les règles au lieu de les remettre à zéro.

## Documents

| Fichier | Contenu |
|---|---|
| [`docs/design-doc.md`](docs/design-doc.md) | Le design doc, référence du projet |
| [`docs/roadmap.md`](docs/roadmap.md) | Phases, points de décision et graphe des dépendances |
| [`docs/decisions.md`](docs/decisions.md) | Journal des décisions prises |
| [`docs/strates/modele-fiche.md`](docs/strates/modele-fiche.md) | Modèle de fiche de design, à suivre pour chaque strate |
| [`docs/artefacts.md`](docs/artefacts.md) | Modèle des artefacts (points de fouille, usure, plafond, écran de choix) et catalogue |

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

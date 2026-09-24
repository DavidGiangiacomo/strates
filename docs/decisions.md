# Journal des décisions

Chaque décision importante du projet est consignée ici, avec son contexte et ses conséquences. Une décision se prend dans une issue labellisée `décision`, puis s'inscrit dans ce journal ; si elle modifie le design, le [design doc](design-doc.md) est corrigé dans la foulée.

Format d'une entrée : identifiant, date, statut (*verrouillée*, *active*, *remplacée par D-xxx*), contexte, décision, conséquences, issue d'origine.

---

## D-001 — Huit strates, jamais plus, jamais de procédural

- **Date** : 2026-09-24
- **Statut** : verrouillée
- **Origine** : design doc, §0, §13 (R1) et « À trancher ensuite », point 2

**Contexte.** Le risque R1 est la tentation de la génération procédurale infinie. Une profondeur infinie transformerait sept jeux en un seul générateur de skins, et détruirait exactement ce qui rend le concept unique.

**Décision.** Le jeu a 7 strates écrites à la main plus une 8ᵉ (le fond). Il n'y aura jamais de strate générée, ni de profondeur infinie. Les 8 strates sont annoncées comme telles.

**Conséquences.**
- Aucune tâche de génération procédurale n'entre dans le backlog.
- Toute proposition d'ajouter une strate est refusée.
- Le critère R5 peut **retirer** une strate qui ne tient pas (décision [#133](https://github.com/DavidGiangiacomo/strates/issues/133)), jamais en ajouter une.
- Les pages de l'accès anticipé et de la 1.0 annoncent un nombre fini de strates.

---

## D-002 — Artefacts : points de fouille et choix dans un catalogue

- **Date** : 2026-09-24
- **Statut** : active
- **Origine** : issue [#3](https://github.com/DavidGiangiacomo/strates/issues/3)

**Contexte.** Le design doc décrivait les artefacts de deux façons incompatibles. Au §4, la formule `⌊log₁₀(ressource) × 1,4⌋` donne une **quantité** d'artefacts. Au §7, il y a un **catalogue** de 34 objets nommés, avec des effets propres. Appliquée strate par strate, la formule distribuerait près de 90 artefacts, sans compter la strate 5. Les chiffres des §1, §9 et §14 ne suivaient pas non plus la formule : 13 artefacts pour 10⁹ au lieu de 12, 3 pour un million au lieu de 8.

**Options étudiées.**
1. *Budget et choix* : la formule donne des points, dépensés pour choisir des objets du catalogue.
2. *Seuils automatiques* : la formule donne des points, et chaque objet s'obtient au-delà d'un seuil, sans choix.
3. *Quantité pure* : la formule donne des unités interchangeables. Écartée, car elle abandonne les objets nommés, leurs noms « d'en bas » et les effets uniques du §7.

**Décision.** Option 1, budget et choix.
- La formule reste, mais elle donne des **points de fouille** : `points = ⌊log₁₀(valeur_convertible) × 1,4⌋`.
- À la descente, le joueur dépense ses points pour choisir quels objets du catalogue de la strate quittée il emporte. Ce qu'il n'emporte pas est abandonné, et les points non dépensés sont perdus.
- Le catalogue compte **34 artefacts** au total, de 3 à 6 par strate d'origine.
- L'usure se calcule : niveau = profondeur − origine. 1 : puissant (effet entier). 2 : utile (effet réduit de moitié). 3 : décoratif (visible, sans effet). 4 et plus : inerte.
- Plafond ×4 : si le produit des multiplicateurs actifs d'une strate dépasse 4, le noyau les réduit tous dans la même proportion.
- L'écran de choix est générique et appartient au noyau. Il montre les noms d'en haut, les coûts et la famille d'effet, et propose une présélection. La descente 7 → 8 applique la présélection sans afficher l'écran.

Le modèle complet (données, usure, plafond, écran, calibrage) est décrit dans [`artefacts.md`](artefacts.md).

**Conséquences.**
- Le design doc est corrigé aux §1, §3, §4, §7, §9, §14 et §15.
- La conversion du noyau ([#21](https://github.com/DavidGiangiacomo/strates/issues/21)), l'orchestration de la descente ([#30](https://github.com/DavidGiangiacomo/strates/issues/30)) et le storyboard du passage 1 → 2 ([#11](https://github.com/DavidGiangiacomo/strates/issues/11)) incluent désormais l'écran de choix, **dès le MVP**.
- Les points de fouille ne sont pas une ressource qui traverse les strates : il en reste trois (Profondeur, artefacts, κ).
- La valeur convertible des strates 5 à 8 reste à définir ([#8](https://github.com/DavidGiangiacomo/strates/issues/8)). Elle donne désormais des points, pas des artefacts.
- Les artefacts de la strate 7 ne sont puissants qu'au fond, où rien n'est produit : ce sont des effets uniques ou des clés de lecture ([#57](https://github.com/DavidGiangiacomo/strates/issues/57), [#65](https://github.com/DavidGiangiacomo/strates/issues/65)).

---

## D-003 — Valeur convertible de chaque strate

- **Date** : 2026-09-24
- **Statut** : active
- **Origine** : issue [#8](https://github.com/DavidGiangiacomo/strates/issues/8)

**Contexte.** Le noyau transforme la valeur convertible d'une strate en points de fouille, `⌊log₁₀(valeur) × 1,4⌋` (D-002). Pour les strates 1 à 4, le choix de la grandeur est évident, mais il restait à fixer entre le stock et le cumul. Pour les strates 5 à 8, il ne l'était pas : pas de nombres visibles (5), rien n'est produit et deux issues possibles (6), une descente automatique (7), pas de descente du tout (8).

**Options étudiées pour la strate 6.**
1. *Ce qui a été honoré* : on convertit le total remboursé ; en défaut, ce qui a été honoré avant le défaut.
2. *Ce qui a été promis* : on convertit le total emprunté, mêmes points dans les deux issues, et le défaut change le catalogue.
3. *Honoré, défaut à zéro* : une descente en défaut ne rapporte aucun point. Écartée, car contraire au « sans jugement » du §10.

**Options étudiées pour la strate 7.**
1. *Tout emporter* : le catalogue est calibré pour que le budget fixe suffise à tout emporter.
2. *Les placements décident* : les placements de la strate déterminent quels objets se forment.
3. *Budget fixe, un abandon* : la même trace manquerait au fond pour tous, sans que personne l'ait choisi. Écartée.

**Décision.**

| Strate | Valeur convertible | Points (jeu correct) |
|---|---|---|
| 1 — La surface | total cumulé des Crédits gagnés dans la strate | ≈ 12 |
| 2 — Les caves | total cumulé du Grain récolté | ≈ 8 |
| 3 — L'atelier | total cumulé des Pièces produites | ≈ 16 |
| 4 — Le réseau | total cumulé du Flux acheminé | ≈ 21 |
| 5 — Le chœur | total cumulé des Voix, grandeur cachée que représentent les barres ; échelle interne calibrée vers 10¹⁰ | ≈ 14 |
| 6 — La dette | total des Engagements **honorés** (remboursés). En défaut : ce qui a été honoré avant le défaut | 28 soldé ; 21 à 25 pour un défaut au milieu ou en fin de strate |
| 7 — Le lit | Sédiments déposés à la descente automatique, quantité presque fixe (≈ 10³) | 4, et le catalogue coûte 4 au total : **tout est emporté** |
| 8 — Le fond | aucune : pas de descente après le fond | — |

- Règle générale : on convertit toujours un **cumul** sur la strate, jamais le stock au moment de descendre. Dépenser ne coûte rien, et thésauriser avant de creuser ne rapporte rien.
- Le défaut de la strate 6 coûte en proportion de ce qui restait à honorer, jamais tout. Grâce au log, un défaut en fin de strate ne coûte que 3 points, soit environ un objet. Ce n'est ni une sanction, ni une stratégie gagnante.

**Conséquences.**
- Le contrat de module ([#13](https://github.com/DavidGiangiacomo/strates/issues/13)) expose une valeur convertible cumulée, et l'issue de la strate quand il y en a plusieurs (strate 6).
- La fiche de la strate 5 ([#7](https://github.com/DavidGiangiacomo/strates/issues/7)) définit comment les Voix croissent, et donc ce que la conversion récompense. L'écran de fouille à la sortie du chœur affiche des points chiffrés : la fiche dira si ce retour des nombres est assumé ou s'il faut une variante sans chiffres.
- Les fiches des strates 6 et 7 ([#64](https://github.com/DavidGiangiacomo/strates/issues/64), [#75](https://github.com/DavidGiangiacomo/strates/issues/75)), le seuil de la dette ([#88](https://github.com/DavidGiangiacomo/strates/issues/88)) et le catalogue ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)) en tiennent compte. Le catalogue de la strate 7 coûte au plus 4 points au total.
- Le calibrage de [`artefacts.md`](artefacts.md) (§ 7) et le tableau de rythme du design doc (§9) sont mis à jour.

---

## D-004 — Stack technique : TypeScript, Svelte, Vite

- **Date** : 2026-09-24
- **Statut** : active
- **Origine** : issue [#4](https://github.com/DavidGiangiacomo/strates/issues/4)

**Contexte.** Le jeu vise le web d'abord, puis le desktop (§0). Il a huit interfaces très différentes : tableaux, grille à la souris, graphe de nœuds, rendu coloré et sonore, écran presque vide (§5, §12). Chaque strate est un module indépendant (§15). La logique doit pouvoir tourner sans affichage, pour le calcul hors ligne et pour la simulation d'équilibrage.

**Options étudiées.**
1. *TypeScript + Svelte* : une logique en TypeScript pur, des interfaces en Svelte, avec Canvas ou SVG là où il le faut.
2. *TypeScript sans framework* : aucune dépendance d'interface, mais beaucoup de code pour synchroniser l'état et l'écran.
3. *TypeScript + React* : pertinent pour qui connaît bien React ; plus lourd pour des compteurs mis à jour à chaque tick.
4. *Godot* : export desktop simple, mais export web lourd et interfaces moins souples ; s'éloigne du « web d'abord ».

**Décision.** Option 1.

| Rôle | Choix |
|---|---|
| Langage | TypeScript, en mode strict |
| Build et serveur de développement | Vite |
| Interfaces | Svelte 5 pour tout ce qui est DOM : bandeau, écran de fouille, inventaire, coupe, menus, strates à tableaux |
| Rendus spécifiques | SVG ou Canvas 2D, au choix de chaque strate (par exemple SVG pour le réseau, Canvas pour le chœur et le lit) |
| Son | Web Audio, derrière le moteur audio partagé du noyau |
| Tests | Vitest ; le simulateur d'équilibrage tourne sous Node |
| Qualité | ESLint, Prettier, `svelte-check` |
| Runtime de développement | Node 22 LTS, npm |
| Grands nombres | aucune bibliothèque : le jeu plafonne vers 10²⁰, et un `number` suffit |
| Desktop | Tauri par défaut, à confirmer au moment du build desktop ([#129](https://github.com/DavidGiangiacomo/strates/issues/129)) |

Les versions sont les versions stables courantes au moment de l'initialisation du projet ([#15](https://github.com/DavidGiangiacomo/strates/issues/15)).

**Règles d'architecture.**
- Chaque strate et le noyau séparent leur **logique** (TypeScript pur) de leur **vue** (Svelte, SVG, Canvas).
- La logique n'importe jamais la vue, ni Svelte, ni le DOM. Une règle ESLint l'impose.
- La logique est **déterministe** : pas de `Math.random()` ni de `Date.now()` directs. L'aléatoire passe par un générateur à graine, et le temps est fourni par le noyau. Le même `tick` sert au jeu, au hors-ligne et au simulateur.
- Chaque strate a sa propre notation des nombres (I1) : aucun formateur de nombres n'est partagé entre les strates.

Arborescence cible :

```
src/
  noyau/
    logique/    état global, tick, conversion, sauvegarde (TS pur)
    ui/         bandeau, fouille, inventaire, coupe, menu (Svelte)
  strates/
    s1-surface/
      logique/  (TS pur)
      vue/      (Svelte, DOM)
    s4-reseau/
      vue/      (Svelte + SVG)
    s5-choeur/
      vue/      (Canvas + Web Audio)
    …
sim/            simulateur d'équilibrage (Node)
```

**Conséquences.**
- L'initialisation du projet ([#15](https://github.com/DavidGiangiacomo/strates/issues/15)) et la stratégie de sauvegarde ([#9](https://github.com/DavidGiangiacomo/strates/issues/9)) sont débloquées.
- Le contrat de module ([#13](https://github.com/DavidGiangiacomo/strates/issues/13)) sépare logique et vue : la vue s'abonne à l'état de la logique, et ne le modifie que par des actions.
- Le simulateur ([#23](https://github.com/DavidGiangiacomo/strates/issues/23)) n'importe que la logique.

---

## Décisions en attente

| Issue | Question | Phase |
|---|---|---|
| [#2](https://github.com/DavidGiangiacomo/strates/issues/2) | Strates est-il le projet à lancer maintenant ? | 0 |
| [#9](https://github.com/DavidGiangiacomo/strates/issues/9) | Stratégie de sauvegarde | 0 |
| [#44](https://github.com/DavidGiangiacomo/strates/issues/44) | Palier κ = 100 (dans le design de la Compréhension) | 2 |
| [#38](https://github.com/DavidGiangiacomo/strates/issues/38) | Go / no-go après le MVP | 1 |
| [#133](https://github.com/DavidGiangiacomo/strates/issues/133) | Garder 8 strates ou en retirer une (R5) | 5 |

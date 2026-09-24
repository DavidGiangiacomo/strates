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

## Décisions en attente

| Issue | Question | Phase |
|---|---|---|
| [#2](https://github.com/DavidGiangiacomo/strates/issues/2) | Strates est-il le projet à lancer maintenant ? | 0 |
| [#4](https://github.com/DavidGiangiacomo/strates/issues/4) | Stack technique | 0 |
| [#8](https://github.com/DavidGiangiacomo/strates/issues/8) | Valeur convertible des strates sans quantité simple | 0 |
| [#9](https://github.com/DavidGiangiacomo/strates/issues/9) | Stratégie de sauvegarde | 0 |
| [#44](https://github.com/DavidGiangiacomo/strates/issues/44) | Palier κ = 100 (dans le design de la Compréhension) | 2 |
| [#38](https://github.com/DavidGiangiacomo/strates/issues/38) | Go / no-go après le MVP | 1 |
| [#133](https://github.com/DavidGiangiacomo/strates/issues/133) | Garder 8 strates ou en retirer une (R5) | 5 |

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

## Décisions en attente

| Issue | Question | Phase |
|---|---|---|
| [#2](https://github.com/DavidGiangiacomo/strates/issues/2) | Strates est-il le projet à lancer maintenant ? | 0 |
| [#3](https://github.com/DavidGiangiacomo/strates/issues/3) | Modèle des artefacts : quantité ou catalogue | 0 |
| [#4](https://github.com/DavidGiangiacomo/strates/issues/4) | Stack technique | 0 |
| [#8](https://github.com/DavidGiangiacomo/strates/issues/8) | Valeur convertible des strates sans quantité simple | 0 |
| [#9](https://github.com/DavidGiangiacomo/strates/issues/9) | Stratégie de sauvegarde | 0 |
| [#44](https://github.com/DavidGiangiacomo/strates/issues/44) | Palier κ = 100 (dans le design de la Compréhension) | 2 |
| [#38](https://github.com/DavidGiangiacomo/strates/issues/38) | Go / no-go après le MVP | 1 |
| [#133](https://github.com/DavidGiangiacomo/strates/issues/133) | Garder 8 strates ou en retirer une (R5) | 5 |

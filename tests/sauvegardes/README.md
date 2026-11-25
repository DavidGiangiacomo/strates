# Sauvegardes archivées

De vraies sauvegardes, écrites par le jeu lui-même. `tests/sauvegardes.test.ts` vérifie que chacune se charge et démarre avec la version courante du jeu : c'est ce qui garantit que les migrations (D-005) ne cassent aucune partie en cours.

**Règle** : chaque version publiée du jeu ajoute ici une sauvegarde réelle, nommée `format-<format>_jeu-<version>.json`. Une sauvegarde archivée ne se modifie jamais ; si elle ne se charge plus, c'est une migration qui manque.

**Le lit**, publié pour sa recette ([#120](https://github.com/DavidGiangiacomo/strates/issues/120)), a la sienne : `format-<format>_jeu-<version>_lit.json`, une partie commencée par le lien de départ, puis vingt minutes de jeu avec une levée. Les parties des testeurs doivent se charger jusqu'au bout de la recette, même si le lit change entre-temps.

**Avant la première publication** ([#19](https://github.com/DavidGiangiacomo/strates/issues/19)), aucun joueur n'a de partie : les sauvegardes d'avant publication peuvent être régénérées. C'est le cas de `format-1_jeu-0.0.0.json`, régénérée quand la surface ([#24](https://github.com/DavidGiangiacomo/strates/issues/24)) a remplacé la strate factice à la profondeur 1. Une partie de développement commencée avec la strate factice ne se charge plus : il faut effacer les données du site.

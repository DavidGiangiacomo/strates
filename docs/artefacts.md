# Artefacts

Référence du système d'artefacts. Le modèle vient de la décision [D-002](decisions.md#d-002--artefacts--points-de-fouille-et-choix-dans-un-catalogue) ; le catalogue se remplit au fil des tâches [#10](https://github.com/DavidGiangiacomo/strates/issues/10) (artefacts de la strate 1) et [#57](https://github.com/DavidGiangiacomo/strates/issues/57) (catalogue complet).

## 1. Principe

1. À la descente, la ressource de la strate quittée devient des **points de fouille** : `points = ⌊log₁₀(valeur_convertible) × 1,4⌋`.
2. Les points servent aussitôt à **choisir**, dans le catalogue de la strate quittée, les objets qu'on emporte. Chaque objet a un coût.
3. Ce qui n'est pas emporté est **abandonné** et apparaît dans la coupe. Les points non dépensés sont perdus : ils ne traversent pas les strates.
4. En bas, l'objet prend le nom que lui donnent ceux d'en bas, et agit selon son **usure**. Celle-ci augmente d'un niveau à chaque descente.

La `valeur_convertible` est fournie par le module de la strate. Pour les strates 5 à 8, où elle n'est pas évidente, elle est définie par la décision [#8](https://github.com/DavidGiangiacomo/strates/issues/8). Une valeur inférieure à 1 donne 0 point.

## 2. Modèle de données

```ts
type Famille = "multiplicateur" | "affichage" | "raccourci" | "unique";

interface ArtefactDef {
  id: string;             // identifiant stable, ex. "s1-turbine"
  origine: 1 | 2 | 3 | 4 | 5 | 6 | 7; // strate où l'objet est emporté
  nomDHaut: string;       // nom dans la strate d'origine, affiché à l'écran de choix
  nomDEnBas: string;      // nom donné par la strate suivante, affiché une fois descendu
  cout: number;           // en points de fouille, entier ≥ 1
  famille: Famille;
  effet: {
    puissant: Effet;      // effet entier
    utile: Effet;         // effet réduit (voir § 3)
  };                      // décoratif et inerte : aucun effet mécanique
}

// Dans la sauvegarde : la liste des identifiants emportés, rien d'autre.
// L'usure se calcule, elle ne se stocke pas.
type ArtefactsPossedes = string[];

// Dans le journal de partie (meta), pour la coupe :
interface FouilleJournal {
  strate: number;
  points: number;
  emportes: string[];
  abandonnes: string[];
}
```

Le catalogue est une donnée du noyau (la « table des artefacts » du §12), pas du code des modules.

## 3. Usure

`niveau = profondeur_courante − origine`

| Niveau | Nom | Effet | Affichage |
|---|---|---|---|
| 1 | puissant | effet entier | objet intact |
| 2 | utile | effet réduit de moitié : un multiplicateur ×m devient ×(1 + (m − 1) / 2), soit ×2 → ×1,5 et ×1,2 → ×1,1. Pour les autres familles, la version réduite est écrite pour chaque artefact. | objet usé |
| 3 | décoratif | aucun effet mécanique | l'objet reste visible, simple ornement |
| ≥ 4 | inerte | aucun effet | un caillou dans l'inventaire |

Un artefact de la strate 2 est donc puissant en strate 3, utile en 4, décoratif en 5, inerte en 6. Rien ne s'accumule : à l'arrivée dans une strate, seuls les objets des deux strates du dessus agissent.

## 4. Effets dans la strate d'arrivée

Un artefact ne connaît pas les règles des strates où il arrive. Chaque module déclare comment il reçoit chaque famille d'effet :

- **multiplicateur** : le module désigne son levier principal (et d'éventuels leviers secondaires) sur lequel s'applique le multiplicateur ;
- **affichage** : un élément d'interface dévoilé d'avance (une valeur, un libellé, une jauge) ;
- **raccourci** : un apprentissage accéléré (par exemple, une partie de l'opacité levée à l'arrivée) ;
- **unique** : l'un des 6 effets étranges, codé au cas par cas.

C'est la section 8 de chaque [fiche de strate](strates/modele-fiche.md).

## 5. Plafond ×4 (invariant I2)

Dans une strate, le produit de tous les multiplicateurs d'artefacts actifs, après usure et quelle que soit leur cible, ne dépasse jamais ×4.

Si le produit P dépasse 4, le noyau réduit tous les multiplicateurs dans la même proportion : chaque ×mᵢ devient ×mᵢ^α, avec α = ln 4 / ln P. Les contributions gardent leurs poids relatifs, le total vaut exactement ×4, et l'interface indique « plafonné ».

Les effets uniques ne doivent pas contourner le plafond. Toute strate reste terminable en moins de 3 h 15 sans aucun artefact (I5).

## 6. L'écran de choix

- Il est générique et appartient au noyau : même écran à chaque descente, sous le bandeau.
- Il affiche le catalogue de la strate quittée, sous les **noms d'en haut**, avec leur coût et leur famille d'effet (une icône), mais pas leur effet exact. On emporte « la turbine » et on découvre en bas « la roue chaude ». Le design de la Compréhension ([#44](https://github.com/DavidGiangiacomo/strates/issues/44)) pourra dévoiler davantage à partir d'un certain κ.
- Le noyau propose une présélection (les objets les moins chers d'abord), que le joueur modifie librement. Emporter rien du tout est permis ; c'est aussi un moyen de viser l'acte de compréhension « réussir une strate sans artefact ».
- La descente 7 → 8 est automatique (§6) : le noyau applique la présélection sans afficher l'écran. Le joueur découvre après coup ce qui a été emporté.

## 7. Calibrage (indicatif)

Règles de calibrage pour les catalogues :

- Le coût total du catalogue d'une strate vaut à peu près le budget d'un **jeu parfait** dans cette strate. Un jeu correct laisse en haut un objet, parfois deux.
- Les 4 points d'écart entre un jeu correct et un jeu parfait paient un objet de plus, ou un meilleur objet à la place d'un moins cher.
- Les coûts suivent l'échelle de points de chaque strate, qui n'est pas monotone (I3).

Répartition indicative des 34 artefacts, vérifiée par simulation (présélection « les moins chers d'abord », valeur de la strate 5 supposée à 10¹⁰ en attendant [#8](https://github.com/DavidGiangiacomo/strates/issues/8)) :

| Strate d'origine | Objets au catalogue | Points, jeu correct | Emportés | Abandonnés |
|---|---|---|---|---|
| 1 — La surface | 6 | 12 | 5 | 1 |
| 2 — Les caves | 5 | 8 | 4 | 1 |
| 3 — L'atelier | 5 | 16 | 4 | 1 |
| 4 — Le réseau | 5 | 21 | 4 | 1 |
| 5 — Le chœur | 5 | *#8* | 4 | 1 |
| 6 — La dette | 5 | 28 | 4 | 1 |
| 7 — Le lit | 3 | 4 | 2 | 1 |
| **Total** | **34** | | **27** | **7** |

À l'arrivée dans une strate, le joueur a ainsi **5 à 9 artefacts actifs** (puissants ou utiles), plus 4 ou 5 décoratifs à partir de la strate 4.

**À noter pour le catalogue ([#57](https://github.com/DavidGiangiacomo/strates/issues/57))** : les artefacts de la strate 7 ne sont puissants qu'au fond, où rien n'est produit. Ce sont donc naturellement des effets uniques ou des clés de lecture pour la salle de lecture ([#65](https://github.com/DavidGiangiacomo/strates/issues/65)). De même, les artefacts de la strate 6 n'ont pas d'effet mécanique au fond, où ils sont « utiles ».

## 8. Catalogue

*À remplir : artefacts de la strate 1 ([#10](https://github.com/DavidGiangiacomo/strates/issues/10)), puis catalogue complet ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)).*

# Artefacts

Référence du système d'artefacts. Le modèle vient de la décision [D-002](decisions.md#d-002--artefacts--points-de-fouille-et-choix-dans-un-catalogue) ; le catalogue se remplit au fil des tâches [#10](https://github.com/DavidGiangiacomo/strates/issues/10) (artefacts de la strate 1) et [#57](https://github.com/DavidGiangiacomo/strates/issues/57) (catalogue complet).

## 1. Principe

1. À la descente, la ressource de la strate quittée devient des **points de fouille** : `points = ⌊log₁₀(valeur_convertible) × 1,4⌋`.
2. Les points servent aussitôt à **choisir**, dans le catalogue de la strate quittée, les objets qu'on emporte. Chaque objet a un coût.
3. Ce qui n'est pas emporté est **abandonné** et apparaît dans la coupe. Les points non dépensés sont perdus : ils ne traversent pas les strates.
4. En bas, l'objet prend le nom que lui donnent ceux d'en bas, et agit selon son **usure**. Celle-ci augmente d'un niveau à chaque descente.

La `valeur_convertible` est fournie par le module de la strate. C'est toujours un **cumul** sur la strate, jamais le stock au moment de descendre ; elle est définie strate par strate par la décision [D-003](decisions.md#d-003--valeur-convertible-de-chaque-strate). Une valeur inférieure à 1 donne 0 point.

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

// Un multiplicateur vise un levier de la strate d'arrivée (voir § 4). Pour les autres familles,
// l'effet est décrit ici et codé par la strate d'arrivée, qui le reconnaît par l'identifiant de l'objet.
type Effet =
  | { levier: "principal" | "secondaire"; facteur: number } // famille multiplicateur
  | { description: string };                                // affichage, raccourci, unique

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

Le catalogue est une donnée du noyau (la « table des artefacts » du §12), pas du code des modules : `src/noyau/logique/catalogue.ts`. La conversion (points, usure, plafond, présélection, fouille) est dans `src/noyau/logique/artefacts.ts`. Une strate lit les effets par `EffetsActifs` : `multiplicateur(levier)`, et `niveau(id)` pour les autres familles.

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

- **multiplicateur** : le module désigne son levier principal (et d'éventuels leviers secondaires) sur lequel s'applique le multiplicateur. Un multiplicateur « secondaire » agit sur le premier levier secondaire de la strate d'arrivée ; si elle n'en a pas, sur son levier principal ;
- **affichage** : un élément d'interface dévoilé d'avance (une valeur, un libellé, une jauge) ;
- **raccourci** : un apprentissage accéléré (par exemple, une partie de l'opacité levée à l'arrivée) ;
- **unique** : l'un des 6 effets étranges, codé au cas par cas.

Le module déclare aussi **quand** il reçoit : dès l'arrivée, ou à un moment de sa boucle. Les caves n'éveillent les multiplicateurs qu'au bilan du premier hiver, pour que le choc d'arrivée survive aux artefacts (§ 8).

C'est la section 8 de chaque [fiche de strate](strates/modele-fiche.md).

## 5. Plafond ×4 (invariant I2)

Dans une strate, le produit de tous les multiplicateurs d'artefacts actifs, après usure et quelle que soit leur cible, ne dépasse jamais ×4.

Si le produit P dépasse 4, le noyau réduit tous les multiplicateurs dans la même proportion : chaque ×mᵢ devient ×mᵢ^α, avec α = ln 4 / ln P. Les contributions gardent leurs poids relatifs, le total vaut exactement ×4, et l'interface indique « plafonné ».

Les effets uniques ne doivent pas contourner le plafond. Toute strate reste terminable en moins de 3 h 15 sans aucun artefact (I5).

## 6. L'écran de choix

- Il est générique et appartient au noyau : même écran à chaque descente, sous le bandeau.
- Il affiche le catalogue de la strate quittée, sous les **noms d'en haut**, avec leur coût et leur famille d'effet (une icône), mais pas leur effet exact. On emporte « la turbine » et on découvre en bas « la roue chaude ». Le design de la Compréhension ([#44](https://github.com/DavidGiangiacomo/strates/issues/44)) pourra dévoiler davantage à partir d'un certain κ.
- Le noyau propose une présélection (les objets les moins chers d'abord), que le joueur modifie librement. Emporter rien du tout est permis ; c'est aussi un moyen de viser l'acte de compréhension « réussir une strate sans artefact ».
- Au-dessus du catalogue, la conversion est affichée franchement : la valeur convertible, les points, puis le prix d'un point de plus.
- Seul « descendre » engage. Jusque-là, le joueur peut reboucher et retrouver sa strate telle qu'il l'a laissée.
- Le détail de l'écran, plan par plan, est dans le [storyboard du passage 1 → 2](strates/descente-1-2.md), § 3 et § 4.
- La descente 7 → 8 est automatique (§6) : le noyau applique la présélection sans afficher l'écran. Le joueur découvre après coup ce qui a été emporté.

## 7. Calibrage (indicatif)

Règles de calibrage pour les catalogues :

- Le coût total du catalogue d'une strate vaut à peu près le budget d'un **jeu parfait** dans cette strate. Un jeu correct laisse en haut un objet, parfois deux.
- Les 4 points d'écart entre un jeu correct et un jeu parfait paient un objet de plus, ou un meilleur objet à la place d'un moins cher.
- Les coûts suivent l'échelle de points de chaque strate, qui n'est pas monotone (I3).

Répartition indicative des 34 artefacts, vérifiée par simulation (présélection « les moins chers d'abord », points d'un jeu correct selon D-003) :

| Strate d'origine | Objets au catalogue | Coût total | Points, jeu correct | Emportés | Abandonnés |
|---|---|---|---|---|---|
| 1 — La surface | 6 | 17 | 12 | 5 | 1 |
| 2 — Les caves | 5 | 13 | 8 | 4 | 1 |
| 3 — L'atelier | 5 | 21 | 16 | 4 | 1 |
| 4 — Le réseau | 5 | 26 | 21 | 4 | 1 |
| 5 — Le chœur | 5 | 17 | 14 | 4 | 1 |
| 6 — La dette | 5 | 32 | 28 si soldée | 4 | 1 |
| 7 — Le lit | 3 | 4 | 4 | 3 | 0 |
| **Total** | **34** | | | **28** | **6** |

À l'arrivée dans une strate, le joueur a ainsi **5 à 9 artefacts actifs** (puissants ou utiles), plus 4 ou 5 décoratifs à partir de la strate 4.

**Cas particuliers** :
- **Strate 6** : en défaut, on convertit ce qui a été honoré avant le défaut. Un défaut en fin de strate donne environ 25 points, soit un objet de moins.
- **Strate 7** : la descente est automatique et la quantité de sédiments presque fixe, donc le budget aussi (4 points). Le catalogue coûte au plus 4 au total : **tout est toujours emporté**, et le fond reçoit les mêmes clés pour tous les joueurs.
- **Pour le catalogue ([#57](https://github.com/DavidGiangiacomo/strates/issues/57))** : les artefacts de la strate 7 ne sont puissants qu'au fond, où rien n'est produit. Ce sont donc des effets uniques ou des clés de lecture pour la salle de lecture ([#65](https://github.com/DavidGiangiacomo/strates/issues/65)). De même, les artefacts de la strate 6 n'ont pas d'effet mécanique au fond, où ils sont « utiles ».

## 8. Catalogue

*Artefacts de la strate 1 ([#10](https://github.com/DavidGiangiacomo/strates/issues/10)). Le reste du catalogue viendra avec [#57](https://github.com/DavidGiangiacomo/strates/issues/57).*

### Strate 1 — La surface

Six objets, 17 points au total. Les noms d'en bas sont ceux des caves : une vallée de paysans qui compte en récoltes et ne comprend pas ce qu'elle reçoit (fiche de la [strate 2](strates/strate-2.md), § 2). Les noms et les effets sont provisoires jusqu'à la bible narrative ([#43](https://github.com/DavidGiangiacomo/strates/issues/43)).

| Coût | Id | Nom d'en haut | Nom d'en bas | Famille |
|---|---|---|---|---|
| 1 | `s1-equipe` | L'équipe | les bras en plus | multiplicateur, principal |
| 2 | `s1-double-ecran` | Double écran | les deux fenêtres | raccourci |
| 2 | `s1-serveur` | Le serveur | l'armoire qui compte les hivers | affichage |
| 3 | `s1-filiale` | La filiale | le grenier d'ailleurs | multiplicateur, secondaire |
| 4 | `s1-turbine` | La turbine | la roue chaude | multiplicateur, principal |
| 5 | `s1-plan` | Plan stratégique | la feuille qui annonce | unique |

**Effets.** Puissants dans les caves (strate 2), utiles dans l'atelier (strate 3). Les effets utiles des familles autres que multiplicateur seront écrits avec la fiche de la strate 3 ([#61](https://github.com/DavidGiangiacomo/strates/issues/61)) ; ce qui suit en fixe le principe.

| Objet | Puissant, dans les caves | Utile, dans l'atelier |
|---|---|---|
| les bras en plus | récolte × 1,2 | levier principal × 1,1 |
| les deux fenêtres | dès l'arrivée, la marque d'hiver porte son nom et les pertes des stockages sont affichées : l'opacité du § 7 de la fiche est levée pour ces deux éléments | une part plus petite de l'opacité de l'atelier, levée à l'arrivée |
| l'armoire qui compte les hivers | dès l'arrivée, l'anneau du grand cycle dessine d'avance les années à venir, avec la longueur de leurs hivers | une grandeur future de l'atelier, dévoilée d'avance, moins loin |
| le grenier d'ailleurs | capacité de tous les stockages × 1,5 (levier `conservation`) | levier secondaire de l'atelier, ou principal s'il n'en a pas, × 1,25 |
| la roue chaude | récolte × 1,5 | levier principal × 1,25 |
| la feuille qui annonce | au seuil, le registre écrit une ligne de plus, d'une autre main : une ligne de l'atelier, avant d'y descendre. Proposition : « Il reste soixante-trois cases. » | au seuil de l'atelier, la moitié d'une ligne du réseau (strate 4), coupée au milieu |

Dans les caves, les **multiplicateurs ne s'éveillent qu'au bilan du premier hiver**. Les affichages et les raccourcis agissent dès l'arrivée ; l'effet unique, au seuil.

**Un objet prend son nom d'en bas la première fois qu'il agit**, et le registre le note, un objet par ligne : « Les familles ont compris la roue chaude. » C'est ainsi que le joueur apprend le nom d'en bas de ses objets.
- L'armoire et les deux fenêtres sont nommées sur la première page du registre.
- Les multiplicateurs sont nommés au premier bilan.
- La feuille est nommée au seuil, juste avant sa ligne.

À l'arrivée, une ligne compte aussi les objets qui n'agissent pas encore ([storyboard](strates/descente-1-2.md), § 6).

**Les budgets** (fiche de la [strate 1](strates/strate-1.md), § 9) :
- **12 points, jeu correct** : la présélection prend les cinq objets les moins chers (1 + 2 + 2 + 3 + 4). La feuille qui annonce reste en haut.
- **14 points**, après une heure de plus à la surface : on peut prendre la feuille à la place du grenier d'ailleurs (1 + 2 + 2 + 4 + 5). C'est le « meilleur objet à la place d'un moins cher » du § 7.
- **Aucun budget ne prend tout** : le catalogue coûte 17 points, et la surface n'en donne pas plus de 14 sans un farm déraisonnable.

**Vérifications.**
- **I2** : avec les six objets, le produit des multiplicateurs vaut 1,2 × 1,5 × 1,5 = 2,7 dans les caves, sous × 4. Dans l'atelier, 1,1 × 1,25 × 1,25 ≈ 1,7 ; le noyau plafonnera le total avec les objets des caves.
- **I5** : les caves sont calibrées sans aucun artefact (fiche de la strate 2, § 4). Les objets n'y changent pas la durée, que fixe le calendrier.
- **En simulation**, avec les cinq objets d'un jeu correct actifs dès le début, tous les profils réguliers atteignent toujours le seuil des caves en 1 h 51, avec 9 points au lieu de 8. Depuis les rations de l'hiver ([#163](https://github.com/DavidGiangiacomo/strates/issues/163)), un bon joueur fait aussi 9 points sans objets : les objets lui rapportent ce point 10 minutes après le seuil (fiche de la strate 2, § 9).
- **Le choc d'arrivée** (fiche de la strate 2, § 5) : c'est la raison de l'éveil retardé. Deux joueurs réflexes ont été simulés dans le code du jeu :
  - celui qui achète chaque outil dès qu'il est abordable manque le premier hiver, avec ou sans objets ;
  - celui qui achète les familles au meilleur rendement manque le premier hiver sans artefact (disette à 4 min 37). Mais avec les cinq objets actifs dès l'arrivée, il passe les deux premiers hivers sans disette : la leçon disparaît. Pour la retrouver, il faudrait rester vers récolte × 1,2 et conservation × 1,5.

  Éveillés au premier bilan, les multiplicateurs laissent le premier hiver se jouer comme sans artefact, puis aident à s'en relever.

**Pour la suite.**
- **La conversion** ([#21](https://github.com/DavidGiangiacomo/strates/issues/21)) : faite. La table porte ces six objets, et `EffetsActifs.niveau` dit si un effet autre qu'un multiplicateur est puissant ou utile.
- **La réception dans les caves** ([#34](https://github.com/DavidGiangiacomo/strates/issues/34)) : faite. L'éveil au premier bilan et les trois effets propres (les deux fenêtres, l'armoire, la feuille) sont codés et testés, y compris le choc d'arrivée : avec les objets d'un jeu correct, le joueur réflexe qui achète au meilleur rendement manque encore le premier hiver.
- **Le catalogue des caves** ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)) : avec ces objets, un jeu correct descend des caves avec 9 points ; sans objets, avec 8 ou 9 selon le jeu, depuis les rations. Le catalogue des caves doit en tenir compte, et l'équilibrage des caves ([#36](https://github.com/DavidGiangiacomo/strates/issues/36)) le mesurer avec et sans artefacts.

# Artefacts

Référence du système d'artefacts. Le modèle vient de la décision [D-002](decisions.md#d-002--artefacts--points-de-fouille-et-choix-dans-un-catalogue) ; le catalogue a été écrit par [#10](https://github.com/DavidGiangiacomo/strates/issues/10) (les objets de la surface), puis par [#57](https://github.com/DavidGiangiacomo/strates/issues/57) (les 34 objets, § 8).

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
| 1 | puissant | effet entier | objet intact : trois crans |
| 2 | utile | effet réduit de moitié : un multiplicateur ×m devient ×(1 + (m − 1) / 2), soit ×2 → ×1,5 et ×1,2 → ×1,1. Pour les autres familles, la version réduite est écrite pour chaque artefact. | objet usé : deux crans |
| 3 | décoratif | aucun effet mécanique | l'objet reste visible, simple ornement : un cran |
| ≥ 4 | inerte | aucun effet | un caillou dans l'inventaire, son nom en gris |

Un artefact de la strate 2 est donc puissant en strate 3, utile en 4, décoratif en 5, inerte en 6. Rien ne s'accumule : à l'arrivée dans une strate, seuls les objets des deux strates du dessus agissent.

**L'usure se voit** ([#45](https://github.com/DavidGiangiacomo/strates/issues/45)).
- **Dans l'inventaire du noyau**, que le compteur « Artefacts » du bandeau ouvre : les objets par couche d'origine, chacun avec son nom, ses crans et le mot de son niveau, lisible sans la couleur. L'inventaire ne dit pas ce que fait un objet : la découverte reste dans la strate.
- **Pendant le travelling de chaque descente** : tous les objets qui ne sont pas encore des cailloux descendent avec le joueur. À mi-course, quand la Profondeur change, les anciens perdent un cran, et les plus vieux deviennent des cailloux ([storyboard](strates/descente-1-2.md), P5).

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
- Il affiche le catalogue de la strate quittée, sous les **noms d'en haut**, avec leur coût et leur famille d'effet (une icône), mais pas leur effet exact. On emporte « la turbine » et on découvre en bas « la roue chaude ». Le design de la Compréhension n'y dévoile rien de plus, quel que soit κ : la découverte en bas reste entière ([`comprehension.md`](comprehension.md), § 7).
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

Répartition des 34 artefacts (§ 8), vérifiée sur les données du jeu (présélection « les moins chers d'abord », points d'un jeu correct selon D-003) :

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
- **Strate 6** : on convertit le prix des promesses honorées en entier, sans les intérêts, soit 28 points pour une strate soldée. En défaut, ce qui a été honoré avant le défaut : un défaut à la grande crue, à la toute fin, donne 24 points au plus, soit un objet de moins ([fiche](strates/strate-6.md), § 9).
- **Strate 7** : la descente est automatique et la quantité de sédiments presque fixe, donc le budget aussi (4 points). Le catalogue coûte au plus 4 au total : **tout est toujours emporté**, et le fond reçoit les mêmes clés pour tous les joueurs.
- **Les objets du lit** ne sont puissants qu'au fond, où rien n'est produit : ce sont des clés de lecture pour la salle de lecture (§ 8 ; [#65](https://github.com/DavidGiangiacomo/strates/issues/65)). De même, ceux de la dette n'ont pas d'effet mécanique au fond, où ils sont utiles ; seule la pierre qui oblige y fait quelque chose.

## 8. Catalogue

*Les 34 artefacts ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)), dans `src/noyau/logique/catalogue.ts`. Ceux de la surface viennent du MVP ([#10](https://github.com/DavidGiangiacomo/strates/issues/10)).*

*Choix tranchés le 21 octobre 2026 :*
- *le catalogue est complet : noms, coûts, familles et effets partout. Dans le réseau, le lit et le fond, dont les fiches restent à écrire, les effets sont des propositions ;*
- *un objet étrange par catalogue, de la surface à la dette ; les trois objets du lit sont des clés de lecture pour le fond ;*
- *au fond, ceux qui ne parlent pas nomment les objets du lit par un nombre d'encoches.*

**Le catalogue en bref.**
- **La répartition** : six objets à la surface, cinq dans chaque strate de 2 à 6, trois dans le lit, aux coûts du § 7.
- **Les familles** : 12 multiplicateurs, de × 1,2 à × 1,5 ; 10 affichages ; 6 raccourcis ; 6 effets uniques.
- **Le levier** d'un multiplicateur est le même aux deux étages où il agit, principal ou secondaire. Sa valeur utile est la moitié de sa valeur puissante (§ 3).
- **Les noms d'en bas** sont donnés par la couche où l'objet est puissant, dans son registre ([bible](bible.md), § 6). Plus bas, l'objet garde ce nom.
- **Ce qu'emporte un jeu correct** : la présélection prend tout, sauf l'objet étrange, qui est toujours parmi les plus chers. Un jeu parfait, avec ses 4 points de plus, peut le prendre à la place d'un objet moins cher (§ 7). Au lit, tout est emporté.
- **Les objets laissés en haut ne sont jamais des multiplicateurs** : un jeu correct emporte déjà tous ceux du catalogue. Le plafond × 4 n'est jamais atteint, même avec les deux catalogues du dessus entiers (vérifications, en fin de section).
- **Les autres effets sont codés par les strates d'arrivée**, qui reconnaissent l'objet à son identifiant : [#81](https://github.com/DavidGiangiacomo/strates/issues/81) pour l'atelier, [#84](https://github.com/DavidGiangiacomo/strates/issues/84) pour le réseau, [#87](https://github.com/DavidGiangiacomo/strates/issues/87) pour le chœur, [#90](https://github.com/DavidGiangiacomo/strates/issues/90) pour la dette, [#108](https://github.com/DavidGiangiacomo/strates/issues/108) pour le lit. Les six effets uniques sont l'objet de [#118](https://github.com/DavidGiangiacomo/strates/issues/118).

### Strate 1 — La surface

Six objets, 17 points au total. Les noms d'en bas sont ceux des caves : une vallée de paysans qui compte en récoltes et ne comprend pas ce qu'elle reçoit (fiche de la [strate 2](strates/strate-2.md), § 2). Ils suivent la convention de la [bible narrative](bible.md), § 6.

| Coût | Id | Nom d'en haut | Nom d'en bas | Famille |
|---|---|---|---|---|
| 1 | `s1-equipe` | L'équipe | les bras en plus | multiplicateur, principal |
| 2 | `s1-double-ecran` | Double écran | les deux fenêtres | raccourci |
| 2 | `s1-serveur` | Le serveur | l'armoire qui compte les hivers | affichage |
| 3 | `s1-filiale` | La filiale | le grenier d'ailleurs | multiplicateur, secondaire |
| 4 | `s1-turbine` | La turbine | la roue chaude | multiplicateur, principal |
| 5 | `s1-plan` | Plan stratégique | la feuille qui annonce | unique |

**Effets.** Puissants dans les caves (strate 2), utiles dans l'atelier (strate 3). Les effets utiles sont fixés par la [fiche de l'atelier](strates/strate-3.md), § 8 : ses multiplicateurs tendent le ressort, et ne valent que pour les pièces qu'il entraîne directement.

| Objet | Puissant, dans les caves | Utile, dans l'atelier |
|---|---|---|
| les bras en plus | récolte × 1,2 | levier principal `ressort` × 1,1 |
| les deux fenêtres | dès l'arrivée, la marque d'hiver porte son nom et les pertes des stockages sont affichées : l'opacité du § 7 de la fiche est levée pour ces deux éléments | les noms de la nomenclature, levés à l'arrivée |
| l'armoire qui compte les hivers | dès l'arrivée, l'anneau du grand cycle dessine d'avance les années à venir, avec la longueur de leurs hivers | la nomenclature montre d'avance la pièce suivante, avec son profil et son prix |
| le grenier d'ailleurs | capacité de tous les stockages × 1,5 (levier `conservation`) | levier secondaire `plan` : les agrandissements du plan ÷ 1,25 |
| la roue chaude | récolte × 1,5 | levier principal `ressort` × 1,25 |
| la feuille qui annonce | au seuil, le registre écrit une ligne de plus, d'une autre main : une ligne de l'atelier, avant d'y descendre, dans sa base douze : « Il reste 53 cases. » | au seuil de l'atelier, la moitié d'une ligne du réseau (strate 4), coupée au milieu. Proposition : « Vanne 3 : ouverte d'un » |

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
- **La réception dans l'atelier** : faite. Les multiplicateurs et les affichages avec [#81](https://github.com/DavidGiangiacomo/strates/issues/81), les raccourcis avec son opacité ([#95](https://github.com/DavidGiangiacomo/strates/issues/95)) ([fiche](strates/strate-3.md), § 7 et § 8). La feuille viendra avec les objets étranges ([#118](https://github.com/DavidGiangiacomo/strates/issues/118)).
- **Le catalogue des caves** ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)) : fait, ci-dessous. Avec ces objets, un jeu correct descend des caves avec 9 points ; sans objets, avec 8 ou 9 selon le jeu, depuis les rations. Le point de plus permet d'emporter le fil qui descend.

### Strate 2 — Les caves

Cinq objets, 13 points. Les noms d'en bas sont ceux de l'atelier : des pièces et des outils, nommés par leur forme et leur place.

| Coût | Id | Nom d'en haut | Nom d'en bas | Famille |
|---|---|---|---|---|
| 1 | `s2-faucille` | La faucille | la lame courbe | multiplicateur, principal |
| 2 | `s2-calendrier` | Le calendrier | la roue peinte | affichage |
| 2 | `s2-registre` | Le registre | le cahier à lignes | raccourci |
| 3 | `s2-meule` | La meule | la roue de pierre | multiplicateur, principal |
| 5 | `s2-corde` | La corde du puits | le fil qui descend | unique |

| Objet | Puissant, dans l'atelier | Utile, dans le réseau (proposé) |
|---|---|---|
| la lame courbe | levier `ressort` × 1,3 | levier débit × 1,15 |
| la roue peinte | la nomenclature montre d'avance les deux pièces suivantes, avec leur profil et leur prix | le débit d'une source se lit avant qu'on la relie ; jamais un goulot |
| le cahier à lignes | toute l'opacité de l'atelier levée à l'arrivée : les noms, les valeurs et le rôle de la lime ([fiche](strates/strate-3.md), § 7) | les noms du réseau, levés à l'arrivée |
| la roue de pierre | levier `ressort` × 1,5 | levier débit × 1,25 |
| le fil qui descend | au seuil, sous le plan plein, le tracé du réseau paraît un instant : des conduites, des bassins | au seuil du réseau, sous les bassins, la moitié d'un tracé : une voûte |

- **Les deux multiplicateurs** sont ceux que supposait la fiche de l'atelier (§ 8) : avec ceux de la surface, le ressort vaut × 2,7 pour un jeu correct (1,1 × 1,25 × 1,3 × 1,5).
- **8 points, jeu correct** : la présélection prend les quatre premiers (1 + 2 + 2 + 3), et le fil qui descend reste en haut.
- **9 points**, avec les objets de la surface ou les rations : le point de plus permet de prendre le fil qui descend avec les deux multiplicateurs (1 + 3 + 5), à la place de la roue peinte et du cahier.
- **L'éveil** : dès l'arrivée, la légende de l'atelier note chaque objet, sous « Hors plan » : « Hors plan : la lame courbe. » ([fiche](strates/strate-3.md), § 8).

### Strate 3 — L'atelier

Cinq objets, 21 points. Les noms d'en bas sont ceux du réseau : des pièces du réseau, nommées par ce qu'elles font au flux.

| Coût | Id | Nom d'en haut | Nom d'en bas | Famille |
|---|---|---|---|---|
| 3 | `s3-loupe` | La loupe | le regard qui grossit | raccourci |
| 4 | `s3-compte-tours` | Le compte-tours | la vanne qui compte | affichage |
| 4 | `s3-etau` | L'étau | le collier qui serre | multiplicateur, secondaire |
| 5 | `s3-volant` | Le volant | la roue qui retient | multiplicateur, principal |
| 5 | `s3-boite-a-musique` | La boîte à musique | la conduite qui chante | unique |

| Objet | Puissant, dans le réseau (proposé) | Utile, dans le chœur |
|---|---|---|
| le regard qui grossit | les noms et les rôles du réseau, levés à l'arrivée | les noms du chœur, levés à l'arrivée : les pupitres, le rang, l'écoute et le point d'orgue |
| la vanne qui compte | le débit des sources et la contenance des bassins se lisent avant qu'on les relie ; jamais un goulot | le repère du double, posé d'avance sur chaque barre |
| le collier qui serre | le levier secondaire du réseau × 1,5, que sa fiche définira ; à défaut, débit | levier `tenue` × 1,25 : un pupitre détonne 1,25 fois moins loin |
| la roue qui retient | levier débit × 1,5 | levier `bourdon` × 1,25 |
| la conduite qui chante | au seuil, on entend une fois dans les conduites le bourdon du chœur | au seuil du chœur, on entend une fois un stylet sur l'argile |

- **16 points, jeu correct** : 3 + 4 + 4 + 5. La conduite qui chante reste en haut ; avec 20 points, elle peut remplacer le regard qui grossit.
- **Dans le réseau**, un affichage ne montre jamais un goulot : le barème en fait un acte de compréhension, le goulot trouvé avant que le réseau ne le signale ([`comprehension.md`](comprehension.md), § 2).

### Strate 4 — Le réseau

Cinq objets, 26 points. Les noms d'en bas sont ceux du chœur : un son ou un geste, sans écriture. Le chœur ne les écrit pas : ils ne paraissent que dans l'inventaire du noyau ([#45](https://github.com/DavidGiangiacomo/strates/issues/45)), et l'objet qui agit est posé au pied du bourdon ([fiche](strates/strate-5.md), § 8).

| Coût | Id | Nom d'en haut | Nom d'en bas | Famille |
|---|---|---|---|---|
| 4 | `s4-carnet` | Le carnet de relevés | le doigt qui montre | raccourci |
| 5 | `s4-jauge` | La jauge | ce qui monte | affichage |
| 5 | `s4-vanne` | La vanne maîtresse | ce qui tient | multiplicateur, secondaire |
| 6 | `s4-conduite` | La grande conduite | le grave qui dure | multiplicateur, principal |
| 6 | `s4-compteur` | Le compteur | le battement sec | unique |

| Objet | Puissant, dans le chœur | Utile, dans la dette |
|---|---|---|
| le doigt qui montre | les noms et les rôles du chœur, levés à l'arrivée | les noms des promesses, levés à l'arrivée |
| ce qui monte | les repères du double et d'une fois et demie, posés d'avance sur chaque barre | la caisse prévue à la prochaine échéance |
| ce qui tient | levier `tenue` × 1,5 | levier `report` : la majoration d'un report divisée par √1,25 |
| le grave qui dure | levier `bourdon` × 1,4 | levier `confiance` × 1,2 |
| le battement sec | au seuil, un nombre s'inscrit une fois dans la nef, puis s'efface : les Voix venues, écrites en sceaux, la notation de la dette. C'est le seul nombre du chœur | au seuil de la dette, une couche de limon passe sur le livre |

- **21 points, jeu correct** : 4 + 5 + 5 + 6, et un point reste. Le battement sec reste en haut ; avec 25 points, il peut remplacer le doigt qui montre.
- **Le seul nombre du chœur** vient après le seuil, quand plus rien n'est à régler : la fiche du chœur ne montre aucun nombre pendant le jeu ([fiche](strates/strate-5.md), § 7).

### Strate 5 — Le chœur

Cinq objets, 17 points. Les noms d'en bas sont ceux de la dette : des gages, nommés par ce qu'ils valent. « Souffler », pour la dette, c'est aussi dire tout bas ce qu'on doit répondre.

| Coût | Id | Nom d'en haut | Nom d'en bas | Famille |
|---|---|---|---|---|
| 2 | `s5-souffle` | Le souffle | le gage qui souffle | raccourci |
| 3 | `s5-echo` | L'écho | le gage qui revient | affichage |
| 4 | `s5-stalle` | La stalle | la caution de bois | multiplicateur, principal |
| 4 | `s5-silence` | Le silence | le gage patient | multiplicateur, secondaire |
| 4 | `s5-voix` | La voix seule | le gage qui chante | unique |

| Objet | Puissant, dans la dette | Utile, dans le lit (proposé) |
|---|---|---|
| le gage qui souffle | les noms des promesses et la valeur de la confiance, levés à l'arrivée | les mots du lit, levés à l'arrivée : crue et limon |
| le gage qui revient | la caisse prévue à chacune des prochaines échéances | la prochaine couche, dessinée d'avance |
| la caution de bois | levier `confiance` × 1,25 | levier dépôt × 1,125 |
| le gage patient | levier `report` : la majoration d'un report divisée par √1,5 | le levier secondaire du lit × 1,25, que sa fiche définira ; à défaut, dépôt |
| le gage qui chante | pendant les douze crues de la grande crue, une voix tient une note. Elle se tait à la grande crue, ou une crue plus tôt si la caisse ne doit pas y suffire | dans le lit, la même voix revient une fois, plus bas, au premier dépôt |

- **14 points, jeu correct** : 2 + 3 + 4 + 4. Le gage qui chante reste en haut ; avec 18 points, tout le catalogue est emporté.
- **La dette** : la confiance vaut × 1,5 pour un jeu correct (1,2 × 1,25), le haut de ce que supposait sa fiche (§ 8). Les gages s'éveillent quand la première tablette est brisée : « Les témoins ont reconnu le gage qui chante. »
- **Le gage qui chante** ne change rien à la grande crue : pendant ses douze crues, il n'y a plus rien à faire ([fiche](strates/strate-6.md), § 4). Il en dit seulement l'issue un peu plus tôt.
- **Sa voix dans le lit** est à confirmer par la fiche du lit, qui garde le silence pour la seule fois où le jeu parle ([bible](bible.md), § 8).

### Strate 6 — La dette

Cinq objets, 32 points. Les noms d'en bas sont ceux du lit : des mots simples, et ce que la chose fait à qui la tient.

| Coût | Id | Nom d'en haut | Nom d'en bas | Famille |
|---|---|---|---|---|
| 5 | `s6-stylet` | Le stylet | le bâton qui creuse | raccourci |
| 6 | `s6-sceau` | Le sceau | le rouleau qui marque | affichage |
| 7 | `s6-poids` | Le poids | la pierre qui pèse | multiplicateur, principal |
| 7 | `s6-bulle` | La bulle d'argile | l'œuf qui garde | affichage |
| 7 | `s6-tablette` | La tablette de prêt | la pierre qui oblige | unique |

| Objet | Puissant, dans le lit (proposé) | Utile, au fond |
|---|---|---|
| le bâton qui creuse | les mots du lit, levés à l'arrivée : crue, limon, couche et rive | aucun : tout s'y lit déjà |
| le rouleau qui marque | les trois prochaines couches, dessinées d'avance | aucun |
| la pierre qui pèse | levier dépôt × 1,25 | aucun : le fond n'a pas de levier |
| l'œuf qui garde | la rive marquée d'avance : jusqu'où le bassin se remplira | aucun |
| la pierre qui oblige | quand le lit descend, l'eau se retire un instant et laisse voir la paroi du fond : des encoches, par groupes | dans la salle de lecture, la trace de la dette se lit sans clé |

- **28 points, strate soldée** : 5 + 6 + 7 + 7, et 3 points restent. La pierre qui oblige reste en haut.
- **24 points, défaut à la grande crue** : 5 + 6 + 7, trois objets ; deux restent en haut, comme le prévoit la [fiche de la dette](strates/strate-6.md), § 9.
- **Personne ne prend tout** : le catalogue coûte 32 points, et la dette n'en donne pas plus de 28.
- **Le levier dépôt** reste à définir par la fiche du lit ([#75](https://github.com/DavidGiangiacomo/strates/issues/75)). Le lit dure deux heures, en temps réel : un multiplicateur qui raccourcirait la strate devrait être borné, comme le ressort de l'atelier ou le bourdon du chœur. Pour un jeu correct, il vaut × 1,41, et × 1,76 si le lit n'a pas de levier secondaire.
- **Au fond**, où rien n'est produit ni caché, ces objets sont utiles sans rien faire, sauf la pierre qui oblige ([#65](https://github.com/DavidGiangiacomo/strates/issues/65)).

### Strate 7 — Le lit

Trois objets, 4 points : la descente automatique les emporte toujours tous (§ 6). Au fond, qui ne parle pas, ils sont nommés par un nombre d'encoches, un, deux ou trois traits ([bible](bible.md), § 6) : `|`, `||` et `|||` dans les données, et un lecteur d'écran dit « une encoche ».

| Coût | Id | Nom d'en haut | Au fond | Famille |
|---|---|---|---|---|
| 1 | `s7-galet` | Le galet | une encoche | affichage |
| 1 | `s7-coquille` | La coquille | deux encoches | affichage |
| 2 | `s7-bois-flotte` | Le bois flotté | trois encoches | affichage |

| Objet | Puissant, au fond (proposé) |
|---|---|
| une encoche | dans la salle de lecture, les restes retrouvent leur couche : sous chacun, celle d'où il venait |
| deux encoches | les objets retrouvent leurs deux noms : celui d'en haut sous celui d'en bas |
| trois encoches | le compte de la paroi se lit une fois, en chiffres de la surface |

- **Ce sont des clés de lecture** (D-002) : elles ne produisent rien, et tous les joueurs les ont. La fiche du fond ([#65](https://github.com/DavidGiangiacomo/strates/issues/65)) dira comment la salle de lecture les reçoit.
- **Elles n'ont pas d'effet utile** : il n'y a rien sous le fond.
- **Elles disent ce que le joueur est le seul à savoir** : d'où vient chaque reste, et les deux noms de chaque objet ([bible](bible.md), § 3 et § 6). La troisième lit le premier compte avec la notation de la dernière couche.

### Les six objets étranges

Un par catalogue, de la surface à la dette. Chacun fait passer quelque chose d'une couche à une autre, sans rien jouer à la place du joueur et sans multiplicateur : il ne touche pas au plafond × 4 (I2).

| Origine | Objet | Ce qui passe | Puissant | Utile |
|---|---|---|---|---|
| 1 | la feuille qui annonce | une ligne écrite | au seuil des caves, une ligne de l'atelier | au seuil de l'atelier, une demi-ligne du réseau |
| 2 | le fil qui descend | un dessin | au seuil de l'atelier, le tracé du réseau sous le plan | au seuil du réseau, la moitié d'une voûte sous les bassins |
| 3 | la conduite qui chante | un son | au seuil du réseau, le bourdon du chœur dans les conduites | au seuil du chœur, un stylet sur l'argile |
| 4 | le battement sec | un nombre | au seuil du chœur, les Voix venues, en sceaux | au seuil de la dette, une couche de limon sur le livre |
| 5 | le gage qui chante | une voix | pendant la grande crue, une note tenue qui annonce l'issue | dans le lit, la même voix, une fois |
| 6 | la pierre qui oblige | une paroi | à la descente du lit, la paroi du fond, un instant | au fond, la trace de la dette lisible sans clé |

- **Presque tous annoncent** la couche qui suit celle où ils agissent, comme la feuille qui annonce. Le gage qui chante, lui, porte sa voix d'origine dans la dette, puis dans le lit ; et la pierre qui oblige laisse lire au fond la trace de la dette.
- **Un jeu correct les laisse tous en haut.** Ils récompensent un jeu parfait, ou un choix délibéré à l'écran de fouille, à la place d'un objet moins cher.
- **Ils agissent une fois**, au seuil, à la descente, ou quand plus rien n'est à décider, comme le gage qui chante : ils ne changent pas une strate qui se joue encore.

### Vérifications

- **I2, sur les parcours types.** Le produit des multiplicateurs actifs, à l'arrivée dans chaque strate, avec ce qu'emporte un jeu correct depuis la surface :

  | Strate | Par levier | Total |
  |---|---|---|
  | 2 — Les caves | `recolte` × 1,8 ; `conservation` × 1,5 | × 2,7 |
  | 3 — L'atelier | `ressort` × 2,68 ; `plan` × 1,25 | × 3,35 |
  | 4 — Le réseau | débit × 2,16 ; le secondaire × 1,5, sur débit à défaut | × 3,23 |
  | 5 — Le chœur | `bourdon` × 1,75 ; `tenue` × 1,88 | × 3,28 |
  | 6 — La dette | `confiance` × 1,5 ; `report` × 1,88 | × 2,81 |
  | 7 — Le lit | dépôt × 1,41 ; le secondaire × 1,25, sur dépôt à défaut | × 1,76 |
  | 8 — Le fond | aucun levier | — |

  Les objets qu'un jeu correct laisse en haut sont des objets étranges, sans multiplicateur : avec les deux catalogues du dessus entiers, les totaux sont les mêmes. Le plafond n'est jamais atteint.
- **Les fiches** supposaient ces valeurs : × 2,7 sur le ressort de l'atelier, de × 1,5 à × 1,8 sur le bourdon du chœur, de × 1,25 à × 1,5 sur la confiance de la dette.
- **Les artefacts actifs à l'arrivée**, pour un jeu correct : 5 dans les caves, 9 dans l'atelier, 8 dans le réseau, le chœur, la dette et le lit, 7 au fond, sans effet mécanique. C'est le rythme cible du design doc (§9).
- **Les tests** du noyau vérifient tout cela sur les données du jeu (`src/noyau/logique/artefacts.test.ts`) : les comptes et les coûts du § 7, les six effets uniques, les présélections, les artefacts actifs et le plafond.

### Ce qui reste

- **Les effets, strate par strate**, avec les noms d'en bas que chaque strate dit au noyau par `nommes()` ([#45](https://github.com/DavidGiangiacomo/strates/issues/45)) : c'est ainsi que paraîtront dans l'inventaire les noms d'en bas du chœur et les encoches du fond. Les caves et l'atelier nomment déjà leurs objets. Les strates : l'atelier ([#81](https://github.com/DavidGiangiacomo/strates/issues/81) et [#95](https://github.com/DavidGiangiacomo/strates/issues/95), fait), le réseau ([#84](https://github.com/DavidGiangiacomo/strates/issues/84)), le chœur ([#87](https://github.com/DavidGiangiacomo/strates/issues/87)), la dette ([#90](https://github.com/DavidGiangiacomo/strates/issues/90)) et le lit ([#108](https://github.com/DavidGiangiacomo/strates/issues/108)). Ceux du réseau et du lit sont à confirmer par leurs fiches ([#62](https://github.com/DavidGiangiacomo/strates/issues/62), [#75](https://github.com/DavidGiangiacomo/strates/issues/75)), qui fixeront aussi leurs leviers secondaires.
- **Les six effets uniques** ([#118](https://github.com/DavidGiangiacomo/strates/issues/118)), et les clés du fond, avec sa fiche ([#65](https://github.com/DavidGiangiacomo/strates/issues/65)).
- **Les noms d'en haut et d'en bas** sont à relire avec les textes de chaque strate ([#68](https://github.com/DavidGiangiacomo/strates/issues/68), [#70](https://github.com/DavidGiangiacomo/strates/issues/70), [#72](https://github.com/DavidGiangiacomo/strates/issues/72), [#74](https://github.com/DavidGiangiacomo/strates/issues/74), [#92](https://github.com/DavidGiangiacomo/strates/issues/92)) et la passe finale ([#119](https://github.com/DavidGiangiacomo/strates/issues/119)).

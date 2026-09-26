# Strate 1 — La surface

*Fiche de design, issue [#5](https://github.com/DavidGiangiacomo/strates/issues/5). Première version, avant l'équilibrage ([#35](https://github.com/DavidGiangiacomo/strates/issues/35)). Les chiffres viennent d'une simulation grossière de trois profils de joueur (parfait, correct, distrait), à refaire avec le simulateur headless ([#23](https://github.com/DavidGiangiacomo/strates/issues/23)).*

*Choix tranchés le 26 septembre 2026 : le bouton « creuser » est celui du bandeau, et rien ne le mentionne ; le seuil est une production par seconde ; la surface est une exploitation sans objet.*

*Renvois : « §6 » désigne une section du [design doc](../design-doc.md), « § 6 » une section de cette fiche.*

## 1. Identité

| | |
|---|---|
| Verbe | produire |
| Ressource | Crédits |
| Unité et notation | `cr`, en notation de tableau de bord. Les montants sont des entiers sous 1 000 (« 847 cr »), puis s'écrivent avec trois chiffres significatifs, une virgule décimale et les suffixes k, M, Md (« 12,4 k cr », « 3,05 M cr », « 1,20 Md cr »). Les débits s'écrivent en cr/s, avec trois chiffres significatifs (« 0,25 cr/s »). La surface se réserve ces suffixes : aucune autre strate ne les emploie (I1). |
| Ordre de grandeur final | ≈ 10⁹ cr cumulés (6 × 10⁸ au seuil en simulation), pour une production de 1 M cr/s |
| Durée cible | 1 h 15 ; en simulation, 63 min pour un joueur parfait, 73 pour un joueur correct, 78 pour un joueur distrait |
| κ à l'entrée → à la sortie | 0 → 8 |

Au-delà de 999 Md, le tableau de bord n'a pas d'unité plus grande : il écrit « 1 240 Md cr ». Cela n'arrive qu'à la remontée finale (§ 10) ou après un très long séjour. Même la notation sature.

## 2. La civilisation

La surface, c'est le présent, ou presque : une petite exploitation dont on ne sait pas ce qu'elle produit, seulement ce qu'elle rapporte. Ses moyens de production sont génériques (des postes, des équipes, des serveurs, une usine), et son seul langage est celui du tableau de bord : des chiffres, une courbe, des objectifs.

Elle optimisait un **débit** : des crédits par seconde. Son tableau de bord lui fixait des objectifs de plus en plus ronds, et elle les atteignait.

Elle a fini par saturation. Une fois le dernier objectif atteint, le tableau de bord n'en propose plus : « Tous les objectifs sont atteints. » La production continue, les chiffres montent, et il n'y a plus rien à décider. C'est la première fois que le joueur voit une fin de ce genre ; il en verra six autres.

Le flou sur ce qui est produit est voulu : un présent compétent et tiède, qu'on reconnaît sans pouvoir le nommer. À reprendre dans la bible narrative ([#43](https://github.com/DavidGiangiacomo/strates/issues/43)).

## 3. Boucle courte

Un incrémental orthodoxe, au clic puis automatique : on produit à la main, puis on achète des générateurs qui produisent seuls, et on les améliore.

### Le clic

Le bouton « Produire » rapporte `valeurClic = 2^c + p × P` crédits :
- c est le nombre d'améliorations de clic ×2 achetées (0 à 3) ;
- p est la part de la production rapportée par clic (0, 2 % ou 4 %) ;
- P est la production par seconde.

La production dépasse le clic vers 2 minutes de jeu. Ensuite, le clic reste utile au joueur actif, sans être nécessaire.

### Les générateurs

| Id | Nom (provisoire) | Coût de base | Production de base | Premier achat, joueur correct |
|---|---|---|---|---|
| `poste` | Poste | 15 cr | 0,25 cr/s | 0,5 min |
| `equipe` | Équipe | 150 cr | 1,8 cr/s | 1 min |
| `serveur` | Serveur | 1 800 cr | 13 cr/s | 4 min |
| `chaine` | Chaîne | 22 k cr | 100 cr/s | 13 min |
| `turbine` | Turbine | 280 k cr | 750 cr/s | 23 min |
| `usine` | Usine | 3,6 M cr | 6 000 cr/s | 39 min |
| `filiale` | Filiale | 50 M cr | 50 k cr/s | 56 min |

- Le prochain exemplaire coûte `base × 1,15ⁿ`, où n est le nombre d'exemplaires déjà possédés. En acheter k d'un coup coûte `base × 1,15ⁿ × (1,15ᵏ − 1) / 0,15`.
- Un type de générateur produit `n × production de base × 2^a × G`, où a est le nombre d'améliorations ×2 de ce type et G le multiplicateur global.
- La production totale P est la somme des types. Elle ne change que sur une action (achat ou amélioration) : entre deux actions, elle est constante.
- À prix de base, chaque étage se rembourse plus lentement que le précédent : 60 s pour un poste, 1 000 s pour une filiale. Mais le prix des étages inférieurs monte de 15 % à chaque achat, et l'étage suivant finit toujours par devenir le meilleur achat.
- Un générateur apparaît dans le tableau de bord quand le cumul atteint la moitié de son coût de base. Avant, sa place n'existe pas.

### Les améliorations

| Famille | Nombre | Effet | Coût | Apparaît |
|---|---|---|---|---|
| Par générateur | 3 × 7 | production du type ×2 | base × 20, base × 150, base × 2 000 | à 10, 25 et 50 exemplaires possédés |
| Globales | 3 | toute la production ×1,5 (G vaut au plus 3,375) | 20 k, 2 M, 200 M cr | quand le cumul atteint la moitié du coût |
| Clic | 5 | clic ×2, ×2, ×2, puis +2 % et +2 % de P par clic | 100, 1 k, 10 k, 100 k, 10 M cr | quand le cumul atteint la moitié du coût |

Soit 29 améliorations. Au seuil, un joueur correct possède 8 des 21 améliorations par générateur (celles à 50 exemplaires restent pour après), les 3 globales et 2 améliorations de clic.

### Les objectifs

Le tableau de bord affiche un objectif à la fois, avec la liste de ceux déjà atteints. Ils tiennent lieu de tutoriel : chacun désigne la prochaine chose à faire. Aucun ne rapporte de bonus. Un objectif déjà rempli au moment où il devient l'objectif courant est validé aussitôt.

| # | Objectif | Atteint vers (joueur correct) |
|---|---|---|
| 1 | Produire 15 cr | 5 s |
| 2 | Acheter un poste | 30 s |
| 3 | Atteindre 1 cr/s | 40 s |
| 4 | Acheter une amélioration | 40 s |
| 5 | Atteindre 10 cr/s | 2 min |
| 6 | Atteindre 100 cr/s | 9 min |
| 7 | Atteindre 1 k cr/s | 18 min |
| 8 | Atteindre 10 k cr/s | 31 min |
| 9 | Atteindre 100 k cr/s | 48 min |
| 10 | Atteindre 1 M cr/s : le seuil de fouille | 73 min |

Après le dixième, le tableau de bord affiche « Tous les objectifs sont atteints. », et l'emplacement de l'objectif reste vide.

### État et actions, pour la boucle de jeu ([#24](https://github.com/DavidGiangiacomo/strates/issues/24))

```ts
type IdGenerateur = "poste" | "equipe" | "serveur" | "chaine" | "turbine" | "usine" | "filiale";

interface EtatSurface {
  credits: number;                // le stock, que les achats dépensent
  cumul: number;                  // tout ce qui a été gagné : la valeur convertible
  generateurs: Record<IdGenerateur, number>;
  ameliorations: string[];        // identifiants des améliorations achetées
  objectif: number;               // index de l'objectif courant ; 10 quand tout est atteint
  temps: number;                  // secondes simulées depuis l'arrivée, absences comprises
  seuilAtteintA: number | null;   // valeur de `temps` au seuil
  historique: number[];           // P toutes les 10 s, sur les 15 dernières minutes (90 points)
}

type ActionSurface =
  | { type: "produire" }
  | { type: "acheter"; generateur: IdGenerateur; quantite: 1 | 10 | "max" }
  | { type: "ameliorer"; amelioration: string };
```

- `tick(dt)` : les crédits et le cumul augmentent de P × dt, et `temps` avance. L'historique prend un point à chaque multiple de 10 s. Les objectifs et le seuil sont vérifiés, dans `tick` comme dans `agir`.
- `pasMax` vaut 10 s. P étant constante entre deux actions, un pas de n'importe quelle taille est exact ; 10 s est le rythme de l'historique.
- La surface n'utilise pas d'aléatoire : elle est entièrement prévisible, comme son tableau de bord.
- Un achat impossible (crédits insuffisants, amélioration indisponible) est ignoré sans erreur.

## 4. Boucle moyenne et seuil de fouille

### Progression

| Joueur correct | Étape | Contenu |
|---|---|---|
| 0 – 5 min | Le clic | On produit à la main, on achète les premiers postes et les premières équipes. La production dépasse le clic vers 2 min. |
| 5 – 25 min | Les générateurs | Serveur, chaîne, turbine ; premières améliorations ×2, première amélioration globale. |
| 25 – 55 min | L'échelle | Usine ; améliorations à 25 exemplaires ; deuxième amélioration globale. Le joueur n'intervient plus que toutes les quelques minutes. |
| 55 – 75 min | Le dernier objectif | Filiale, troisième amélioration globale, puis 1 M cr/s. |

Dans la seconde moitié, les objectifs s'espacent de 9 à 25 minutes : c'est la boucle moyenne du §3.

### Le seuil

- **Condition** : P ≥ 1 M cr/s. C'est le dernier objectif du tableau de bord, affiché comme les autres.
- Une fois atteint, le seuil le reste. De toute façon, la production ne baisse jamais dans cette strate ; le moment du seuil est noté dans l'état (`seuilAtteintA`) pour le filet décrit plus bas.
- **Ce qu'il dit de la civilisation** : elle mesurait un débit, et son dernier objectif était un nombre rond. Après, plus rien.
- **Accumulation seule** : c'est l'exception assumée à I4, avec la strate 7. La surface est le tutoriel, et son seuil est le seul seuil banal du jeu (§6).
- **Issues** : une seule.

### Après le seuil

Le jeu continue normalement : les améliorations à 50 exemplaires, d'autres générateurs, une production qui monte encore. Mais il n'y a plus d'objectif. Descendre plus tard rapporte peu (§ 9) : dès la première descente, la conversion apprend que le farm ne vaut rien.

### Le bouton « creuser »

- **Où** : c'est le bouton de fouille du bandeau commun ([#22](https://github.com/DavidGiangiacomo/strates/issues/22)), libellé « creuser ». La vue de la strate n'en a pas d'autre.
- **Quand** : il est visible dès la première seconde. Les objectifs, les infobulles et l'aide du tableau de bord ne le mentionnent jamais. Il est hors du tableau de bord, et personne n'a dit de l'utiliser (§10).
- **Avant le seuil** : il est actif, mais le sol résiste. Le noyau refuse `demanderFouille()`, et le bandeau répond par un bref tressaillement et un son sourd, sans texte ni pénalité. Ce comportement appartient au bandeau : il est le même dans toutes les strates.
- **Au seuil** : rien ne l'annonce. Le bouton cesse simplement de résister, et le clic suivant ouvre la fouille. Le premier acte de fouille est une transgression douce : le jeu ne l'a jamais demandé.
- **Filet** : si le joueur n'a pas creusé 5 minutes après le seuil (en temps de strate), une fissure fine apparaît dans le tableau de bord. Elle s'allonge lentement, du graphique jusqu'au bouton du bandeau, sans texte. Le délai est à régler au playtest : le protocole du MVP ([#14](https://github.com/DavidGiangiacomo/strates/issues/14)) doit mesurer le temps entre le seuil et le premier coup de pioche.

## 5. Le choc d'arrivée

Sans objet à l'arrivée : la surface est la première strate, et personne n'y arrive d'ailleurs. Le joueur y apporte ses habitudes d'autres incrémentaux, et elles marchent toutes. C'est voulu.

La surface prépare en revanche le choc de la strate 2, qui est l'objet même du MVP (§14). Elle doit installer un réflexe : **la courbe monte**. D'où le graphique de production au centre du tableau de bord, en échelle linéaire sur une fenêtre glissante de 15 minutes. La courbe y a toujours la forme d'une exponentielle, et elle monte toujours. Dans les caves, la même attente rencontrera une courbe qui oscille.

## 6. Interface et direction artistique

Un tableau de bord moderne, propre, tiède. C'est la référence : toutes les strates suivantes devront s'en distinguer (§12). La réalisation est l'objet de [#31](https://github.com/DavidGiangiacomo/strates/issues/31).

- **Palette** : fond blanc cassé, gris neutres à peine chauds, un seul accent désaturé (un bleu-vert pâle) et un vert discret pour les objectifs atteints. Aucune couleur franche. Ni bois ni brun, qui iront aux caves.
- **Typographie** : une sans-serif système, avec des chiffres tabulaires pour que les compteurs ne tremblent pas.
- **Disposition** : des cartes à coins arrondis sur une grille. En haut, les indicateurs : crédits, production, objectif courant. Au centre, le graphique de production. À côté, la carte « Produire », la liste des générateurs et les améliorations disponibles.
- **Mouvement** : des transitions courtes et douces ; les compteurs défilent au lieu de sauter.
- **Sons** : un clic feutré, une note discrète à chaque objectif atteint, aucun fond sonore. Le moteur audio n'arrive qu'en phase 2 ([#46](https://github.com/DavidGiangiacomo/strates/issues/46)) : la surface du MVP peut être muette.
- **Ce qui la distingue** : c'est la seule strate qui ressemble à un logiciel.

## 7. Opacité et Compréhension

- **Opacité** : aucune. La surface parle notre langue. C'est la seule strate entièrement lisible dès l'arrivée, et le tutoriel de toutes les autres. La seule chose qu'elle n'explique pas est le bouton « creuser », qui ne lui appartient pas. Ce choix est à confirmer par le design de la Compréhension ([#44](https://github.com/DavidGiangiacomo/strates/issues/44)), qui prévoit une interface partiellement opaque dans chaque strate.
- **Actes de compréhension** : ce sont des propositions, car le barème appartient à [#44](https://github.com/DavidGiangiacomo/strates/issues/44), hors du MVP.
  - Atteindre le seuil sans consulter l'aide (l'acte générique du §8).
  - Creuser avant l'apparition de la fissure, c'est-à-dire sans y avoir été poussé.
  
  Ensemble, ils couvrent les 8 points de κ prévus pour la strate (§9).
- **Graphe de dépendances** : le clic et les sept générateurs alimentent la production. Chaque amélioration pointe vers son générateur, vers la production (les globales) ou vers le clic. La production mène à l'objectif.
- **Formules exposées** : celles du § 3 (coût d'un exemplaire, production d'un type, valeur du clic).

## 8. Artefacts reçus

Sans objet : aucun artefact n'arrive jamais à la surface, puisqu'aucune strate n'est au-dessus (§9 : aucun artefact actif à l'arrivée). Le module déclare tout de même son levier principal, `production`, comme le contrat le demande. I2 et I5 sont respectés d'office.

## 9. Valeur convertible

- C'est le **cumul des crédits gagnés** dans la strate : clics et production, absences comprises. Les achats ne le diminuent pas (D-003).
- En simulation, le cumul au seuil vaut 6 × 10⁸ cr pour les trois profils, soit **12 points**. Un meilleur jeu fait gagner du temps (63 min au lieu de 78), pas des points.
- Rester après le seuil rapporte peu : il faut 3 fois plus de cumul pour 13 points, et 16 fois plus pour 14. En simulation, 10 minutes de plus donnent 12 ou 13 points, et une heure de plus en donne 14.
- Pour le catalogue ([#10](https://github.com/DavidGiangiacomo/strates/issues/10)), le budget réaliste va donc de 12 à 14 points. Les 16 points d'un « jeu parfait », selon la règle générale du §4, ne s'atteignent pas à la surface sans un farm déraisonnable. Avec le catalogue indicatif de [`artefacts.md`](../artefacts.md) (6 objets, 17 points au total), le joueur laisse un ou deux objets en haut.

## 10. Hors-ligne

- Politique **standard** : 80 % de l'absence, plafonnée à 12 h. Rien ne justifie une politique propre, puisque P reste constante pendant l'absence : seuls les achats la changent.
- Effets mesurés en simulation :
  - **avant le seuil**, une nuit d'absence raccourcit la strate de 25 à 35 minutes de jeu actif : le seuil est atteint après 40 à 49 minutes de jeu, au lieu de 73. Les points ne changent pas : toujours 12 ;
  - **après le seuil**, une nuit d'absence rapporte 2 points sans jouer (12 → 14).
  
  Les deux effets sont dans l'esprit d'un jeu de fond, et restent à observer pendant l'équilibrage ([#35](https://github.com/DavidGiangiacomo/strates/issues/35)).
- **Remontée finale** (§11) : `remontee()` rend l'état sauvegardé, augmenté de la production de toute la durée écoulée, à 100 % et sans plafond. C'est « sa production qui tourne toujours ». Après des semaines, le compteur dépasse les unités du tableau de bord (§ 1).

## 11. Textes

- **Budget** : environ 600 mots, soit un huitième des quelque 5 000 mots du jeu. La rédaction est l'objet de [#16](https://github.com/DavidGiangiacomo/strates/issues/16). Ces textes sont provisoires et seront révisés d'après la bible narrative.
- **Ton** : celui d'un logiciel bien fait. Des phrases courtes et polies, sans point d'exclamation ni humour appuyé : « Objectif atteint. » plutôt que « Bravo ! ».
- **À écrire** :
  - le nom et une ligne de description de chaque générateur (7) et de chaque amélioration (29) ;
  - les 10 objectifs et le message final, « Tous les objectifs sont atteints. » ;
  - les libellés du tableau de bord : crédits, production, objectif, « Produire », « Acheter » (×1, ×10, max) ;
  - l'aide de la strate : une page courte, qui décrit tout le tableau de bord et ne dit rien du bandeau ;
  - les traces laissées au fond (strate 8) : trois lignes au plus, par exemple le dernier objectif et le message final.
- **Aucun texte ne mentionne « creuser ».**

## 12. Critère R5

La surface doit tenir comme jeu autonome. Elle est la plus exposée au risque inverse de celui des autres strates : l'ennui, puisqu'elle est banale par construction. Ce qui la fait tenir :
- c'est un incrémental orthodoxe complet et bien rythmé : sept générateurs, 29 améliorations, et, passé le premier quart d'heure, un nouvel étage toutes les 8 à 17 minutes et un objectif toutes les 9 à 25 minutes ;
- sa fin est une vraie fin, la saturation, et elle débouche sur le seul geste que le jeu n'a pas expliqué.

Elle dure 1 h 15 et non 2 h : pour elle, le critère se juge sur la qualité plutôt que sur la durée. L'équilibrage ([#35](https://github.com/DavidGiangiacomo/strates/issues/35)) puis le test du MVP ([#37](https://github.com/DavidGiangiacomo/strates/issues/37)) vérifient qu'on la joue jusqu'au seuil sans décrocher.

## 13. Questions ouvertes

1. **Une nuit d'absence après le seuil** rapporte 2 points sans jouer. À garder si l'équilibrage ([#35](https://github.com/DavidGiangiacomo/strates/issues/35)) le juge acceptable ; sinon, plafonner ce que l'absence ajoute au cumul une fois le seuil atteint.
2. **Délai du filet** (5 minutes avant la fissure) : à régler d'après le test du MVP ([#37](https://github.com/DavidGiangiacomo/strates/issues/37)).
3. **Aucune opacité** : à confirmer par le design de la Compréhension ([#44](https://github.com/DavidGiangiacomo/strates/issues/44)).
4. **Le sol qui résiste** : c'est le comportement commun du bouton de fouille avant le seuil, à inscrire dans la tâche du bandeau ([#22](https://github.com/DavidGiangiacomo/strates/issues/22)).
5. **Budget du catalogue** ([#10](https://github.com/DavidGiangiacomo/strates/issues/10)) : le calibrer sur 12 à 14 points, plutôt que sur 16.
6. **Remontée à 100 %, sans plafond** : c'est une proposition, à confirmer avec la fin « Remonter » ([#128](https://github.com/DavidGiangiacomo/strates/issues/128)).

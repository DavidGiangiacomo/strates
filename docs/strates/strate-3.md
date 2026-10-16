# Strate 3 — L'atelier

*Fiche de design, issue [#61](https://github.com/DavidGiangiacomo/strates/issues/61). Écrite après la bible narrative ([#43](https://github.com/DavidGiangiacomo/strates/issues/43)) et le design de la Compréhension ([#44](https://github.com/DavidGiangiacomo/strates/issues/44)). Les chiffres viennent d'une simulation grossière de sept profils de joueur (§ 4), à refaire avec le simulateur headless quand la boucle sera codée ([#67](https://github.com/DavidGiangiacomo/strates/issues/67), [#96](https://github.com/DavidGiangiacomo/strates/issues/96)).*

*Choix tranchés le 16 octobre 2026 :*
- *les pièces tiennent une case et ont quatre côtés, dentés ou lisses, qu'on tourne pour les ajuster ; dans la dernière heure viennent quelques grandes pièces de deux cases sur deux ;*
- *le seuil demande toute la nomenclature posée, le plan plein, rien qui frotte, et toutes les pièces entraînées par le ressort, de dent en dent ;*
- *l'atelier compte en base douze : après 9 viennent ↊ et ↋, puis 10, une douzaine.*

*Choix proposés, à trancher à la relecture :*
- *le plan grandit par couronnes autour du ressort : 6, 8, 10, puis 12 cases de côté, une grosse de cases ;*
- *la lime : une dent qui frotte peut se limer, pour toujours. Sans elle, la fin demandait jusqu'à des centaines de gestes (§ 4) ;*
- *le temps de l'atelier se compte en tours du ressort, de douze secondes ;*
- *une gêne ne se montre qu'au bout d'un tour : la défaire avant, c'est un acte de compréhension (§ 7) ;*
- *les objets d'en haut tendent le ressort : leurs multiplicateurs ne valent que pour les pièces qu'il entraîne directement (§ 8).*

*Renvois : « §6 » désigne une section du [design doc](../design-doc.md), « § 6 » une section de cette fiche.*

L'atelier est la strate où l'espace entre en jeu (§10). À la surface, on achetait ; dans les caves, on gardait. Ici, on **place** : une pièce ne vaut que par l'endroit où elle est. C'est aussi la première strate qui finit quand il n'y a plus rien à placer.

## 1. Identité

| | |
|---|---|
| Verbe | assembler |
| Ressource | Pièces |
| Unité et notation | **La base douze**, en chiffres : de 0 à 9, puis ↊ (dix) et ↋ (onze). 10 est une douzaine, 100 une grosse (144), 1 000 une grande grosse (1 728). Les chiffres se groupent par trois, séparés par une espace fine : « 4↋6 547 pièces ». Les nombres sont toujours entiers, sans suffixe ni décimale. Le temps se compte en **tours** du ressort, de douze secondes : la production s'écrit « par tour ». Aucune autre strate ne compte en base douze, ni par tour (I1). |
| Ordre de grandeur final | ≈ 10¹² pièces produites : de 2,6 à 4,8 × 10¹¹ au seuil en simulation pour les joueurs réguliers, soit « 4↊ 643 232 628 » pour 3 × 10¹¹. C'est entre le million de boisseaux des caves et les 10¹⁵ du réseau (I3), et le joueur ne le lit qu'en base douze. |
| Durée cible | 2 h 30 avec les objets d'un jeu correct. En simulation, le joueur naturel finit de 2 h 26 à 2 h 42 sans aucun artefact, et de 2 h 17 à 2 h 36 avec (§ 4, § 8). |
| κ à l'entrée → à la sortie | 22 → 38, au mieux |

**Le vocabulaire.**
- **Le plan** : le carré quadrillé où l'on pose les pièces. Son bord est **le cadre**, lisse.
- **Le ressort** : au centre du plan, une pièce fixe de deux cases sur deux, dentée sur ses quatre côtés. Tout le mouvement part de lui.
- **Une pièce** tient une case ; une grande pièce, quatre. Elle a quatre côtés, **dentés** ou **lisses**, et se tourne d'un quart de tour.
- **Engrener** : deux côtés dentés face à face. **Frotter** : un côté denté contre un côté lisse, ou contre le cadre.
- **Entraînée** : reliée au ressort par une chaîne de dents engrenées. Une pièce entraînée tourne ; les autres ne bougent pas.
- **Le rouage** : l'ensemble des pièces entraînées.
- **La nomenclature** : la liste des douze pièces de l'atelier, avec leurs exemplaires et leurs prix. Elle compte 125 pièces en tout.
- **L'établi** : sous le plan, les pièces achetées qui n'y sont pas, et la lime.

## 2. La civilisation

Des artisans à l'établi : des gabarits, des limes, des étaux, et un plan quadrillé où chaque pièce a sa case. Leurs mécanismes s'emboîtent comme ceux d'une horloge, et rien ne le dit. C'est l'écho voulu au concept n°8, *L'horloger* (§10), sans en dépendre.

Ils optimisaient **l'ajustement** : que tout tienne, sans jeu et sans vide. Une pièce bien placée aide ses voisines ; mal placée, elle les gêne. Leur nomenclature disait d'avance tout ce qu'il fallait : tant de pièces de chaque sorte, et un plan pour les recevoir.

Ils ont fini par saturation. Le plan s'est rempli, chaque pièce de la nomenclature a trouvé sa case, et l'assemblage a tourné : il n'y avait plus rien à placer. « Il ne reste aucune case. » C'est la seule couche dont la fin était écrite d'avance, dans une liste.

La bible narrative ([`bible.md`](../bible.md), § 4) en donne la suite : sa voix, ses mots, ses traces, et ce qu'il a trouvé sous l'établi, des « pièces sans plan ».

## 3. Boucle courte

On ne produit pas en achetant : on produit en **assemblant**. Une pièce ne rapporte que si elle tourne, et elle ne tourne que si elle tient au rouage. La boucle tient en trois gestes : **acheter, poser, ajuster**. Rien ne se clique pour produire.

### Le plan et le ressort

- Le plan est un carré de cases, au cadre lisse. Il a 6 cases de côté à l'arrivée, et grandit d'une **couronne** à la fois : 8, 10, puis 12 cases de côté. À 12, il compte une grosse de cases (« 100 »).
- Le ressort occupe les quatre cases du centre, à toutes les tailles. Il ne se déplace pas, ne se retire pas et ne produit rien : il entraîne.
- **Agrandir le plan** ajoute une couronne de cases libres tout autour. Les pièces du bord ne touchent plus le cadre, mais des cases vides.

| Plan | Cases pour les pièces | Prix |
|---|---|---|
| 6 × 6, à l'arrivée | 32 | — |
| 8 × 8 | 60 | 70 000 |
| 10 × 10 | 96 | 4,7 M |
| 12 × 12, une grosse | 140 | 960 M |

*Les nombres de cette fiche sont écrits en base dix, pour l'équipe. À l'écran, tout est en base douze.*

### Les contacts

| Un côté | face à | Effet |
|---|---|---|
| denté | un côté denté | elles **engrènent** : le mouvement passe, et la production de chacune double |
| denté | un côté lisse | elles **frottent** : la production de chacune est divisée par deux |
| denté | le cadre | elle frotte : sa production est divisée par deux |
| lisse | un côté lisse, ou le cadre | rien |
| tout côté | une case libre | rien |

- **Une pièce entraînée** produit `q × 2^(engrenés − frottements)` par seconde, q étant sa production de base. Une pièce qui n'est pas entraînée ne produit rien, quelle que soit sa place.
- **Un frottement ne coupe pas le mouvement** : une pièce qui frotte tourne encore, au ralenti.
- **Une grande pièce** a deux demi-côtés par côté, qui touchent chacun une case. Ses engrenages et ses frottements se comptent par demi-côté, et l'exposant est divisé par deux : engrenée partout, une grande roue produit seize fois sa base, comme une petite roue.
- **La production** est la somme de celle des pièces entraînées. Elle s'affiche par tour, soit douze fois la production par seconde.

### La nomenclature

Douze pièces. Les petites ont une douzaine d'exemplaires chacune. Les deux séries ont les mêmes cinq profils, dans le même ordre ; la seconde vaut beaucoup plus.

| Rep. | Pièce | Côtés dentés | Exemplaires | Base, par tour | Premier prix |
|---|---|---|---|---|---|
| 1 | roue dentée | les quatre | 12, dont 2 posées à l'arrivée | 7 | 88 |
| 2 | cliquet | un | 12 | 37 | 1 750 |
| 3 | renvoi | deux, en équerre | 12 | 180 | 8 800 |
| 4 | pignon | deux, opposés | 12 | 920 | 44 000 |
| 5 | secteur | trois | 12 | 4 600 | 220 000 |
| 6 | roue d'échappement | les quatre | 12 | 23 000 | 1,3 M |
| 7 | ancre | un | 12 | 110 000 | 7,7 M |
| 8 | roue de champ | deux, en équerre | 12 | 570 000 | 47 M |
| 9 | arbre | deux, opposés | 12 | 2,9 M | 290 M |
| ↊ | rochet | trois | 12 | 14 M | 1,8 Md |
| ↋ | grande roue, 2 × 2 | les quatre | 3 | 290 M | 13 Md |
| 10 | balancier, 2 × 2 | un | 2 | 1,4 Md | 38 Md |

- Le prix d'un exemplaire vaut `premier prix × 1,25ⁿ`, n étant le nombre d'exemplaires déjà achetés de cette pièce.
- Une pièce paraît dans la nomenclature quand le cumul atteint la moitié de son premier prix. Les agrandissements aussi.
- **Les comptes tombent juste** : 120 petites pièces et 5 grandes de quatre cases occupent exactement les 140 cases que le ressort laisse au plan de 12 × 12. Toute la nomenclature coûte environ 2,5 × 10¹¹ pièces.
- **Le cliquet vient en deuxième** : avec une seule dent, il ferme un bout de rouage. Avec la roue, le pignon et le renvoi seuls, le premier plan n'est jamais plein et juste (§ 7).
- Tous les prix sont à régler à l'équilibrage ([#96](https://github.com/DavidGiangiacomo/strates/issues/96)).

### Les gestes

- **Acheter** une pièce de la nomenclature : elle vient en main.
- **La poser** sur une case libre ; une grande pièce, sur un carré de quatre cases libres.
- **La tourner** d'un quart de tour, en main ou posée : à la molette, ou d'un clic droit.
- **La déplacer** vers une case libre, ou **l'échanger** avec une autre en la glissant dessus.
- **La mettre de côté** sur l'établi. Elle reste à soi, et rien n'est rendu.
- **Limer une dent** : la lime, sur l'établi, rend lisse un côté denté, pour toujours. Elle ne coûte rien d'autre que la dent : ce côté ne pourra plus jamais engrener, et la pièce a perdu un doublement.
- **Agrandir le plan.**
- Tout est gratuit, sauf acheter et agrandir.
- **Limer contre le cadre est un piège** : le plan va grandir, et la dent limée aurait trouvé une voisine.

### L'arrivée

Le plan de 6 × 6 et son ressort. Deux roues dentées sont déjà posées au-dessus du ressort, engrenées avec lui et entre elles : elles tournent, et produisent 58 pièces par tour (« 4↊ »). Leurs dents du haut et des côtés regardent des cases libres. La première roue à acheter coûte 88 pièces (« 74 ») : elle se paie en un tour et demi.

### État et actions, pour la boucle ([#67](https://github.com/DavidGiangiacomo/strates/issues/67))

```ts
type IdPiece =
  | "roue" | "cliquet" | "renvoi" | "pignon" | "secteur"
  | "echappement" | "ancre" | "champ" | "arbre" | "rochet"
  | "grandeRoue" | "balancier";

interface PieceAtelier {
  id: IdPiece;
  repere: number;                    // son numéro d'achat, pour la légende (« Pièce 14 »)
  case: [number, number] | null;     // ligne et colonne ; le coin haut gauche d'une grande pièce ; null sur l'établi
  rot: 0 | 1 | 2 | 3;                // quarts de tour, dans le sens horaire
  limees: number[];                  // côtés limés, dans l'orientation de base
}

interface EtatAtelier {
  taille: 6 | 8 | 10 | 12;
  pieces: PieceAtelier[];            // dans l'ordre d'achat ; le ressort n'y est pas
  achetees: Record<IdPiece, number>;
  stock: number;                     // les pièces qu'on peut dépenser
  cumul: number;                     // toutes les pièces produites : la valeur convertible
  genes: Record<string, number>;     // frottements en cours, et depuis quand : montrés au bout d'un tour
  temps: number;                     // secondes depuis l'arrivée, absences comprises
  seuilAtteintA: number | null;
  legende: { cle: string; valeurs: Record<string, number> }[];  // les dernières lignes, formatées par la vue
  sansPlan: boolean;                 // la pièce sans plan, trouvée au dernier agrandissement
  multiplicateurs: { ressort: number; plan: number };          // artefacts, relus à chaque tick
}

type ActionAtelier =
  | { type: "acheter"; piece: IdPiece }
  | { type: "poser"; repere: number; case: [number, number]; rot: number }
  | { type: "tourner"; repere: number }
  | { type: "deplacer"; repere: number; case: [number, number] }
  | { type: "echanger"; a: number; b: number }
  | { type: "mettreDeCote"; repere: number }
  | { type: "limer"; repere: number; cote: number }
  | { type: "agrandir" };
```

- **`tick(dt)`** ajoute la production et fait vieillir les frottements : une gêne qui dure un tour se montre. Entre deux actions, la production ne change pas. Le pas est coupé au moment où une gêne se montre.
- **`pasMax`** vaut un tour, douze secondes.
- **Après chaque action**, la logique refait les contacts, l'entraînement (un parcours depuis le ressort, sur 126 pièces au plus) et la production.
- La strate n'utilise pas d'aléatoire. Un geste impossible est ignoré sans erreur.

## 4. Boucle moyenne et seuil de fouille

### Progression

Les temps sont ceux du joueur « naturel » de la simulation, sans aucun artefact. Avec les objets d'un jeu correct, la strate dure de 5 à 25 minutes de moins (§ 8).

| Temps | Étape | Contenu |
|---|---|---|
| 0 – 20 min | Le premier plan | 6 × 6. Roues dentées, cliquets, renvois, premiers pignons. On apprend qu'une pièce doit toucher le rouage pour tourner, que dent contre dent fait doubler, et que dent contre lisse fait frotter. |
| 20 – 47 min | 8 × 8 | Pignons, secteurs, roues d'échappement. Le rouage se referme, et il faut lui laisser des dents. |
| 47 – 89 min | 10 × 10 | Ancres, roues de champ, arbres : la seconde série, aux mêmes profils, des centaines de fois plus forte. Rien ne se remplace : chaque pièce doit trouver sa case. |
| 89 – 155 min | 12 × 12, une grosse | Arbres, rochets, puis les grandes roues (2 h 10) et les balanciers (2 h 29). Il faut leur faire de la place. |
| 155 – 162 min | La dernière ajustée | Tout est acheté. Tout poser, tout relier, limer ce qui frotte : 104 gestes, dont 61 coups de lime. Le seuil tombe à 2 h 42. |

La boucle moyenne du §3, c'est **la couronne**. Trois fois dans la strate, le plan s'agrandit, une nouvelle série de pièces paraît, et il faut leur trouver une place dans un rouage qui tourne déjà. Entre deux couronnes, on achète une pièce, on lui cherche sa case, on tourne ses voisines.

Le joueur naturel fait 126 achats. Après la première heure, il en fait encore 3 à 7 par tranche de 10 minutes, avec bien plus de gestes sur le plan, et n'attend jamais plus de 6 minutes entre deux achats.

### Un rouage fermé ne grandit plus

- Une pièce ne tourne que si elle touche une dent du rouage. Si tout le bord du rouage est lisse, aucune pièce nouvelle ne peut tourner, où qu'on la pose.
- Il faut donc **laisser des dents libres**, tournées vers les cases vides. La grammaire de l'atelier tient en deux règles : « dent contre dent », et « garder une dent pour la suite ».
- Rouvrir un rouage fermé coûte un geste : tourner une pièce du bord.
- La simulation l'a montré d'elle-même. Le premier joueur automatique, qui posait chaque pièce là où elle rapportait le plus, refermait son rouage dès le premier quart d'heure, et ne pouvait plus rien poser.

### Le seuil

- **Condition** : le plan à 12 × 12, **toutes les pièces de la nomenclature posées** (plus une case libre, plus rien sur l'établi), **rien ne frotte**, et **toutes les pièces entraînées**.
- **Ce qu'il dit de la civilisation** : chaque pièce avait sa place, et la liste disait d'avance lesquelles. Quand tout a été ajusté, il n'y avait plus rien à placer.
- **Pas d'accumulation seule (I4)** : l'accumulation achète toute la nomenclature, mais ne la monte pas. Le joueur réflexe, qui pose chaque pièce sur la première case libre sans la tourner, n'atteint jamais le seuil. Après cinq heures, il a acheté 47 pièces, presque aucune ne tourne, et il a produit 2,7 × 10⁶ pièces.
- **Il existe des solutions, et beaucoup** : en partant d'un plan plein mélangé au hasard, un solveur simple en trouve une à chaque essai.
- **Issues** : une seule.
- **L'objectif n'est jamais affiché comme tel.** Mais la légende compte les cases libres (« Il reste 53 cases. »), et l'atelier montre ce qui frotte et ce qui ne tourne pas. Au seuil, la légende écrit « Il ne reste aucune case. », et tout le plan tourne.
- **Une fois atteint**, le seuil le reste.

### La dernière ajustée

Quand la dernière pièce est achetée, il reste à tout poser, à tout relier, et à ne plus rien laisser frotter.
- **Les grandes pièces** demandent un carré libre de quatre cases dans un plan presque plein : on déplace des petites pièces pour le faire. Le joueur qui les voit venir dans la nomenclature peut leur garder la place.
- **La lime** règle un frottement en un geste, si la dent n'est pas nécessaire au mouvement. Ce qu'elle ne règle pas, un échange le règle : il faut une pièce qui ait une dent du bon côté.
- **Sans la lime**, une version précédente de la simulation demandait de 230 à 1 150 échanges pour finir, selon le profil et le hasard : jusqu'à deux heures de rangement. Avec elle, les joueurs réguliers finissent en 40 à 150 gestes, une centaine le plus souvent, dont plus de la moitié de coups de lime : de cinq à dix minutes, un quart d'heure au plus.
- **Ranger en jouant paie.** Le joueur « désordonné », qui ne revoit jamais son plan, finit avec deux fois plus de défauts et une demi-heure de retard (§ 13, question 6).

### Après le seuil

- Le plan tourne, et les pièces viennent encore. Il n'y a plus rien à acheter ni à poser.
- Un rouage achevé, où toutes les dents engrènent, produit neuf fois plus que pendant la montée : rester rapporte un point en un quart d'heure, puis un autre en une heure et demie (§ 9).
- **Filet** : comme partout, si le joueur n'a pas creusé 5 minutes après le seuil, une fissure part du ressort, traverse le plan et monte vers le bouton du bandeau (`src/noyau/logique/filet.ts`).

### En simulation

Sept joueurs automatiques, sans aucun artefact. Le script est un brouillon en Python, hors du dépôt ; il ne partage rien avec le code du jeu.
- Tous, sauf le réflexe, posent chaque pièce là où la production monte le plus, en gardant des dents libres. Ils rouvrent leur rouage quand il est fermé.
- Ils revoient leur plan de temps en temps : ils déplacent ou tournent ce qui frotte et ce qui ne tourne pas, s'ils n'y perdent rien.
- À la fin, ils relient d'abord ce qui ne tourne pas, déplacent une grande pièce qui gêne, puis liment ce qui frotte encore.
- Un geste prend 3 secondes (2 pour le joueur parfait). Un échange à la fin en compte deux : celui qu'on fait, et celui qu'on essaie.

| Profil | Jeu | Seuil | Points | Gestes de la fin |
|---|---|---|---|---|
| parfait | passe toutes les 2 s, revoit son plan chaque minute | 2 h 29 | 15 | 42 |
| naturel | passe toutes les 5 s, revoit son plan toutes les 3 min | 2 h 42 | 16 (3,1 × 10¹¹) | 104 |
| apprend | réflexe jusqu'à 10 min, puis naturel | 2 h 50 | 16 | 150 |
| distrait | naturel ; passe chaque minute, revoit son plan toutes les 10 min | 2 h 52 | 16 | 93 |
| prudent | naturel ; ne dépense jamais plus de la moitié de ce qu'il a | 2 h 55 | 16 | 80 |
| désordonné | naturel, mais ne revoit jamais son plan | 3 h 16 | 16 | 119 |
| réflexe | la pièce la moins chère, sur la première case libre, telle quelle | jamais | 9 après 5 h | — |

- **La durée dépend peu du jeu** : de 2 h 26 à 2 h 55 pour les joueurs réguliers. Les prix fixent le rythme, et le rouage fixe ce qu'on en tire.
- **Les points ne dépendent presque pas du jeu** : le seuil demande toute la nomenclature, et son prix fixe ce qu'il faut produire (§ 9).
- **Sur six parties**, avec des hasards différents dans la revue du plan et la fin, le joueur naturel finit entre 2 h 26 et 2 h 42, toujours avec 16 points.
- **Le joueur désordonné dépasse les 3 h 15**, sur quatre parties : 3 h 16, 3 h 22, 3 h 37, et une fois il ne finit pas en cinq heures. Son plan frotte tant que sa production ne paie jamais les balanciers. C'est le risque de la strate (§ 13, question 6).

## 5. Le choc d'arrivée

Le joueur arrive des caves. Deux strates lui ont appris quatre réflexes :
- **cliquer** : « Produire » à la surface, « Glaner » dans les caves ;
- **acheter ce qui rapporte le plus**, comme à la surface ;
- **attendre le bon moment**, et **garder une réserve**, comme dans les caves : le calendrier décide, et l'on stocke avant l'hiver.

L'atelier les rend tous inutiles. Il en demande un qu'aucune strate n'avait demandé : **l'endroit**.

### Ce qu'il fait

1. **Il cherche le bouton.** Il n'y en a pas : rien ne se clique pour produire. Il y a deux roues qui tournent, un compteur qui monte, et une liste.
2. **Il achète la pièce la moins chère**, une roue dentée, et la pose là où se trouve son curseur, ou sur la première case libre, dans un coin du plan. Elle ne tourne pas, et la production ne bouge pas.
3. **Il attend**, comme dans les caves. Rien ne vient : il n'y a pas de saison, et le plan ne se remplit pas seul.
4. **Il pose une roue contre le cadre**, ou un cliquet lisse contre une roue : les deux pièces ralentissent, et la production baisse.

En simulation, le joueur réflexe, qui pose chaque pièce sur la première case libre sans la tourner, produit 1,6 fois moins que le joueur naturel au bout de dix minutes. Au bout d'une heure, c'est 7 600 fois moins : ses pièces ne tournent pas, et sa production ne bouge plus.

### Pourquoi ça échoue

Dans les caves, le temps faisait le travail : il suffisait d'avoir gardé assez, au bon moment. Ici, **rien ne se passe tout seul**, et **rien ne compte que ce qui se touche**. Une pièce achetée ne vaut rien tant qu'elle n'est pas à sa place. La grammaire de l'atelier : **où, et non quand**.

### Comment il le comprend

- **Le mouvement le montre.** Les deux roues de l'arrivée tournent ; la sienne, dans le coin, ne bouge pas. Il la glisse contre elles : elle se met à tourner, et les deux autres accélèrent.
- **Les dents se voient.** Chaque côté est dessiné, avec ses dents ou son bord lisse. Quand deux dents se font face, l'engrenage se dessine.
- **Le frottement se voit aussi**, au bout d'un tour : un trait vermillon entre les deux pièces, et la légende écrit « Pièce 3 : gêne sa voisine. »

### Pourquoi c'est agréable, pas frustrant

- **Rien ne se perd.** Une pièce mal posée se déplace pour rien. Aucune pièce ne casse, aucun prix ne monte pour une erreur.
- **La première bonne pose arrive en une minute**, et elle est évidente : à côté de ce qui tourne déjà.
- **La règle tient en une phrase**, et elle se voit : dent contre dent.
- **La correction ne demande aucun retour en arrière.** Le joueur qui pose au hasard pendant dix minutes atteint le seuil huit minutes après le joueur naturel : ses premières pièces se déplacent sans frais.
- **La découverte continue** : chaque pièce de la nomenclature a un autre profil, et chaque couronne repose le problème.

## 6. Interface et direction artistique

Plan, souris, encombrement (§5). L'écran est un dessin technique, et la souris est l'outil principal. La réalisation est l'objet de [#80](https://github.com/DavidGiangiacomo/strates/issues/80) ; le son, de [#94](https://github.com/DavidGiangiacomo/strates/issues/94).

- **Disposition** :
  - **le plan**, au centre et au plus grand : le quadrillage, le cadre, le ressort, et les pièces vues de dessus. Chacune porte son numéro dans un petit cercle, comme un repère de dessin ;
  - **la nomenclature**, à droite : un tableau à colonnes (repère, désignation, profil, exemplaires restants, base par tour, prix), comme un cartouche. Sa dernière ligne est l'agrandissement du plan. Les objets venus d'en haut s'y ajoutent, sous « Hors plan » (§ 8) ;
  - **la légende**, sous la nomenclature : les dernières lignes que l'atelier écrit (« Pièce 14 : ajustée. ») ;
  - **l'établi**, sous le plan : les pièces mises de côté, et la lime ;
  - **en tête** : le stock de pièces, la production par tour, et le compte des cases libres.
- **Palette** : le papier d'un plan, gris clair et un peu vert ; le trait au graphite ; les pièces en laiton quand elles tournent, en gris d'acier quand elles sont immobiles ; un vermillon pour les frottements. Ni le blanc et le bleu-vert de la surface, ni les bruns et l'ocre des caves, ni le bleu nuit et les vitraux du chœur.
- **Typographie** : un lettrage technique, monolinéaire, comme au normographe (Bahnschrift ou DIN, sinon une linéale étroite). ↊ et ↋ sont un 2 et un 3 retournés : la vue les dessine elle-même si la police ne les a pas.
- **Mouvement** : chaque pièce entraînée tourne dans le sens contraire de celle qui l'entraîne ; une pièce qui frotte tourne par saccades. Rien d'autre ne bouge.
- **Sons** : un tic régulier, qui s'enrichit à chaque pièce entraînée ; un clic de métal quand on pose ; un crissement quand une pièce frotte ; la lime qui râpe. Pas de musique. Au seuil, tous les tics tombent ensemble.
- **Accessibilité** :
  - *clavier* : un curseur va de case en case ; Entrée prend et pose, R tourne, L lime le côté désigné ;
  - *couleurs* : aucune information ne tient à la teinte seule. Une pièce qui tourne porte une hachure, un frottement un trait en zigzag ;
  - *moins de mouvement* : les pièces ne tournent plus, et la hachure dit qu'elles sont entraînées ;
  - *lecteurs d'écran* : chaque case se lit en mots (« Pièce 14, roue dentée, tourne, frotte à gauche ») ; les nombres en base douze aussi, en grosses et en douzaines.
- **Ce qui la distingue** : la première strate où l'espace compte, la seule en base douze, et la seule où l'on manipule plus qu'on ne lit.
- **À l'écran de fouille** : les pièces produites, en base douze, au graphite sur le papier du plan (`apparenceValeur`).

## 7. Opacité et Compréhension

Le seuil dépend de trois choses visibles, qu'on ne cache jamais : les dents, le mouvement et les cases libres. Le joueur doit échouer par maladresse, pas par ignorance.

- **Jamais caché** : le dessin des côtés de chaque pièce, le mouvement des pièces entraînées, le cadre, le compte des cases libres, les prix et le stock.
- **Opaque à l'arrivée** :
  - *les noms* : les désignations de la nomenclature sont des glyphes ;
  - *les valeurs* : la production de base de chaque pièce, dans la nomenclature ;
  - *les rôles* : la lime, posée sur l'établi sans légende.
- **Levé par l'usage** :
  - une pièce prend son nom quand son premier exemplaire tourne ;
  - les valeurs se lèvent au premier agrandissement ;
  - la lime prend sa légende au premier coup.
- **Levé par le délai** `L(κ)` : 13 minutes, en arrivant avec κ = 22.
- **Les frottements ne sont pas de l'opacité** : ils se montrent au bout d'un tour, à tout κ. C'est ce qui permet l'acte ci-dessous.
- **Actes de compréhension** : 16 points, sur le barème de [`comprehension.md`](../comprehension.md), § 2.

  | Acte | Définition | Points |
  |---|---|---|
  | sans aide | le seuil sans avoir ouvert l'aide | 4 |
  | sans artefact | le seuil sans artefact actif | 3 |
  | la gêne défaite avant que l'atelier ne la montre | défaire un frottement (tourner, déplacer, échanger, mettre de côté) avant qu'il ait duré un tour | 3 |
  | le premier plan plein qui tourne | remplir le plan de 6 × 6, tout entraîné et sans rien qui frotte, avant le premier agrandissement | 3 |
  | sans limer | le seuil sans un seul coup de lime | 3 |

- **Le premier plan plein** est possible avec les trois premières pièces : par exemple les douze roues, les douze cliquets et huit renvois. Avec la roue, le pignon et le renvoi seuls, une recherche systématique n'en a trouvé aucun : il faut une pièce qui ferme un bout de rouage, et c'est pourquoi le cliquet vient en deuxième. L'acte demande de remplir le plan avant de l'agrandir, quand tout pousse à l'agrandir.
- **Sans limer** est l'acte du maître. Les joueurs automatiques liment toujours, une cinquantaine de fois.
- **Graphe de dépendances** :
  - le ressort entraîne le rouage, de dent en dent ;
  - les dents engrenées et les frottements de chaque pièce font sa production ; le cadre et la lime changent ses côtés ;
  - les pièces entraînées font la production, et la production le stock ;
  - le stock paie la nomenclature et l'agrandissement du plan ; le plan reçoit les pièces.
- **Formules exposées**, de la plus simple à la plus profonde :
  1. le prix d'un exemplaire : premier prix × 1,25ⁿ ;
  2. la production d'une pièce entraînée : base × 2^(engrenés − frottements) ;
  3. la production : la somme des pièces entraînées, par tour ;
  4. l'entraînement : une pièce tourne si un chemin de dents engrenées la relie au ressort ;
  5. le prix des agrandissements.

  Elles s'écrivent en base douze. À κ ≤ 38, aucune ne se lit dans l'atelier.

## 8. Artefacts reçus

Les objets des caves sont **puissants** ici, ceux de la surface **utiles**. Le catalogue des caves n'existe pas encore ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)) : leur réception est décrite par famille. Celle des objets de la surface est fixée ici, comme le demandait [`artefacts.md`](../artefacts.md), § 8. Elle sera codée par [#81](https://github.com/DavidGiangiacomo/strates/issues/81).

| Famille d'effet | Réception dans l'atelier |
|---|---|
| multiplicateur | **levier principal `ressort`** : les pièces qui engrènent directement avec le ressort produisent × m. **Levier secondaire `plan`** : le prix des agrandissements ÷ m. Dès l'arrivée. |
| affichage | des pièces dévoilées d'avance : la nomenclature montre celles qui viennent, avec leur profil et leur prix |
| raccourci | les noms et les rôles levés à l'arrivée, sans attendre le délai (§ 7) |
| unique | au cas par cas ; jamais une pièce posée, tournée ou limée à la place du joueur |

**Les objets de la surface, utiles dans l'atelier :**

| Objet | Effet |
|---|---|
| les bras en plus | levier `ressort` × 1,1 |
| la roue chaude | levier `ressort` × 1,25 |
| le grenier d'ailleurs | levier `plan` : agrandissements ÷ 1,25 |
| les deux fenêtres | les noms de la nomenclature, levés à l'arrivée |
| l'armoire qui compte les hivers | la nomenclature montre d'avance la pièce suivante, avec son profil et son prix |
| la feuille qui annonce | au seuil, la légende écrit d'une autre main une demi-ligne du réseau, coupée au milieu. Proposition : « Vanne 3 : ouverte d'un » |

**Pourquoi le ressort, et pas toute la production.** Les prix de la strate sont fixes : un multiplicateur sur toute la production la raccourcit presque d'autant. En simulation, × 2,7 sur tout l'atelier fait passer le joueur naturel de 2 h 42 à 1 h 01, et le plafond × 4 à 46 minutes. Les pièces qui engrènent avec le ressort sont huit au plus : les renforcer aide franchement, sans emporter la strate. C'est aussi un choix de plus, et il est spatial : placer ses meilleures pièces au pied du ressort.

| Multiplicateur sur le ressort | aucun | × 1,375 | × 2,7 | × 4 (plafond) |
|---|---|---|---|---|
| joueur naturel | 2 h 42 | 2 h 36 | 2 h 17 | 2 h 00 |
| joueur prudent | 2 h 55 | 2 h 40 | 2 h 27 | 2 h 11 |
| joueur parfait | 2 h 29 | 2 h 27 | 2 h 10 | 1 h 39 |

*× 1,375 : les seuls objets de la surface (les bras en plus et la roue chaude). × 2,7 : avec deux multiplicateurs parmi les objets des caves, à confirmer par le catalogue. Dès qu'il y a des objets, le grenier d'ailleurs rend aussi le plan moins cher.*

- **Durée** : avec les objets d'un jeu correct, de 2 h 17 à 2 h 36 pour le joueur naturel. La cible de 2 h 30 est tenue.
- **Les objets ne rapportent pas de points** : 16 avec ou sans (§ 9). Ils rapportent du temps.
- **I2** : le noyau plafonne le produit des multiplicateurs à × 4. Au plafond, tout sur le ressort, la strate dure encore 1 h 39 pour le joueur parfait, 2 h pour le naturel.
- **I5** : toute la simulation du § 4 est faite sans aucun artefact. Les joueurs réguliers finissent entre 2 h 26 et 2 h 55, sous les 3 h 15. Le joueur qui ne range jamais son plan, lui, les dépasse (§ 13, question 6).
- **L'éveil** : un objet agit dès l'arrivée, et la légende le note, une ligne par objet, sous « Hors plan » : « Hors plan : la roue chaude. » Les objets des caves y prennent leur nom d'en bas, celui que leur donne l'atelier, par leur forme et leur place (« la lame courbe », « le caisson froid »). Ceux de la surface gardent celui que les caves leur ont donné, comme un mot étranger ([bible](../bible.md), § 6).
- **Pas d'éveil retardé** : dans les caves, il protégeait le choc du premier hiver. Ici, le choc est de placer, et aucun multiplicateur ne fait tourner une pièce mal posée.

## 9. Valeur convertible

- C'est le **cumul des pièces produites** dans la strate. Les dépenser ne le diminue pas (D-003).
- Au seuil, il vaut de 2,6 à 4,8 × 10¹¹ selon le profil et la partie, avec ou sans artefacts : **16 points** pour les joueurs réguliers. Il en faut 2,7 × 10¹¹ pour 16, et 1,4 × 10¹² pour 17. Le joueur parfait, qui finit le plus vite, a produit un peu moins : il est au bord du 16ᵉ point, et descend parfois avec 15.
- **Le budget est presque le même pour tous** : le seuil demande toute la nomenclature, et la nomenclature coûte 2,5 × 10¹¹. Comme dans le chœur, la conversion constate que l'assemblage tourne, et l'habileté se paie en temps. L'écart de quatre points entre un jeu correct et un jeu parfait (§4) n'existe pas dans l'atelier.
- **Rester rapporte un point, puis presque plus** : un rouage achevé produit 1,1 × 10⁹ pièces par seconde, neuf fois plus que pendant la montée. Il donne 17 points un quart d'heure après le seuil, et 18 après une heure trois quarts.
- Pour le catalogue ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)) : 16 points, pour un catalogue indicatif de 5 objets à 21 points ([`artefacts.md`](../artefacts.md), § 7). Le joueur laisse un objet en haut, parfois deux ; celui qui reste un quart d'heure en emporte un de plus.
- **L'écran de fouille** écrit la valeur en base douze (`formaterValeur`), et le prix d'un point de plus aussi. Les points restent ceux du noyau, en base dix.

## 10. Hors-ligne

**Politique standard : 80 %, plafond 12 h.**
- Le rouage tourne pendant l'absence comme devant le joueur : sa production est constante.
- Rien ne se dérègle seul : aucune pièce ne s'use, aucune dent ne casse. Un frottement laissé en partant se montre au retour, s'il ne l'était pas encore.
- Le seuil ne dépend d'aucune durée : l'absence ne peut ni le faire gagner ni le faire perdre.
- Au retour, le résumé du noyau suffit : la durée, et le taux.
- **Remontée finale** (§11) : à décider avec [#128](https://github.com/DavidGiangiacomo/strates/issues/128). Proposition : le plan tel qu'il a été laissé, immobile.

## 11. Textes

- **Budget** : environ 700 mots ([`bible.md`](../bible.md), § 9). La rédaction est l'objet de [#68](https://github.com/DavidGiangiacomo/strates/issues/68).
- **Ton** : les légendes d'un plan et sa nomenclature. Des désignations, des repères, des mentions brèves : « ajustée », « gêne sa voisine », « à reprendre ». Personne ne s'adresse au joueur, et aucun texte ne dit « horloge ».
- **Les nombres** s'écrivent en base douze partout, en chiffres : « Il reste 53 cases. »
- **La ligne de la feuille qui annonce**, dans les caves, est une ligne de l'atelier : elle s'écrit donc aussi en base douze. « Il reste soixante-trois cases. » devient « Il reste 53 cases. » : 63 cases en base dix, et le joueur ne le saura qu'en bas. À changer avec [#68](https://github.com/DavidGiangiacomo/strates/issues/68).
- **À écrire** :
  - les douze désignations de la nomenclature, et une note de quelques mots pour chacune, comme une ligne de nomenclature ;
  - les en-têtes de la nomenclature, l'agrandissement du plan, l'établi et la lime ;
  - les lignes de la légende : une pièce ajustée, une gêne montrée, une pièce qui ne tourne pas, les cases qui restent, le plan agrandi, et « Il ne reste aucune case. » ;
  - l'éveil des objets d'en haut, sous « Hors plan » ;
  - la pièce sans plan (ci-dessous) ;
  - `fouille.valeur` : « Pièces produites » ;
  - l'aide : une page courte, écrite comme la notice d'un plan. Elle dit que les dents engrènent avec les dents, qu'une pièce ne tourne que si elle tient au ressort, et comment se lit la base douze. Elle ne dit rien de la fin, ni de la lime, ni du bandeau.
- **Le reste** ([`bible.md`](../bible.md), § 3) : au dernier agrandissement, une **pièce sans plan** paraît sur l'établi, trouvée dessous. Creuse, sans dents ni cote, elle ne se pose nulle part. Elle n'est pas dans la nomenclature, et le seuil ne la compte pas. La légende la note : « Pièce sans plan : mise de côté. » C'est une conduite du réseau, avec sa vanne ; aucun texte ne le dit.
- **Traces laissées au fond** (strate 8 ; [bible](../bible.md), § 5) : trois lignes de la légende au plus. « Il ne reste aucune case. », le compte des pièces du dernier assemblage (« Pièces : ↊6 », 126 avec le ressort), et « Pièce sans plan : mise de côté. » Le compte des coups de lime pourrait faire varier la trace selon le parcours (« Dents limées : 4↊. ») : à voir avec [#109](https://github.com/DavidGiangiacomo/strates/issues/109).
- **Aucun texte ne mentionne « creuser ».**

## 12. Critère R5

**Avis : l'atelier tient comme jeu autonome de deux heures et demie, sur le papier, à une condition.**

Ce qui le fait tenir :
- **Un geste qui a du corps** : prendre une pièce, la tourner, la poser contre une autre, et la voir se mettre à tourner. C'est le plaisir d'un casse-tête qu'on manipule, et la récompense se voit tout de suite.
- **Une règle d'une phrase, et des conséquences pour deux heures** : dent contre dent. Le rouage qui se ferme, les profils qui se complètent, les grandes pièces qui demandent leur place, tout en sort.
- **Une vraie grammaire d'incrémental** : des prix qui montent, une production exponentielle, des paliers (les couronnes), et une seconde série qui vaut des centaines de fois la première.
- **Un arc lisible, et une fin qui est une vraie fin** : le plan se remplit, la nomenclature se vide, et le dernier geste ferme le rouage. « Il ne reste aucune case. »
- **Rien de commun avec les autres strates (I1)** : ni saison, ni débit, ni rapport, ni échéance. Le réseau relie lui aussi, mais autrement : ici, une pièce tourne ou ne tourne pas ; là-bas, tout est débit et goulot.

**La condition**, que le papier ne peut pas vérifier : **que la fin reste un plaisir.** La dernière ajustée dure de cinq à dix minutes en simulation. Si elle devient une centaine d'échanges à l'aveugle, la strate est ratée. La lime, les frottements montrés, les pièces qui ne tournent pas et la nomenclature lue d'avance doivent suffire à la rendre lisible.

**Ce qui la ferait tomber** : un joueur qui, à la dernière heure, ne voit plus pourquoi son plan ne tourne pas, et déplace des pièces au hasard.

**Le point faible** : la dernière heure achète peu, de 3 à 7 pièces par tranche de 10 minutes, puis une seule. Elle se joue sur le plan, en gestes, et c'est voulu ; le playtest dira si c'est une montée ou une attente.

**Recommandation.** Avant de coder la strate, un **jouet d'un ou deux jours** : le plan, le ressort, les pièces, les règles et le dessin, sans économie, avec une nomenclature à poser en entier. Il dira si poser 125 pièces jusqu'à ce que tout tourne est un plaisir, et combien de temps prend la fin.

## 13. Questions ouvertes

1. **La dernière ajustée** (§ 4, § 12) : la simulation l'estime avec un solveur, ni malin ni humain. Un joueur peut faire mieux, en voyant la structure, ou pire, en s'acharnant. À mesurer avec le jouet, puis au playtest.
2. **La lime est-elle trop généreuse ?** Elle règle tout frottement en un geste, et ôte une part du casse-tête. Pistes : un coup de lime qui coûte des pièces, ou un nombre de limes compté. Mais la lime est aussi ce qui rend la fin sûre : sans elle, jusqu'à deux heures de rangement.
3. **Les grandes pièces** demandent un carré libre dans un plan presque plein. Faut-il montrer d'avance, dans la nomenclature, la place qu'elles prendront ?
4. **La base douze** se lit-elle ? Elle est la notation de la strate (I1), et sa découverte est un petit choc de plus. Mais un joueur qui ne compare plus deux prix d'un coup d'œil s'ennuie. À voir au playtest, et pour les lecteurs d'écran.
5. **Le tour de douze secondes** : assez long pour défaire une gêne avant qu'elle se montre, assez court pour qu'on la voie vite ?
6. **Le joueur désordonné** dépasse les 3 h 15 d'I5 : de 3 h 16 à 3 h 37, et une fois sur quatre il ne finit pas en cinq heures (§ 4). C'est le premier réglage à surveiller. Pistes : une gêne qui se montre plus fort quand elle dure ; un gabarit, qui montre où une pièce tournerait sans frotter ; des frottements moins chers pendant la montée.
7. **Rester un quart d'heure rapporte un point** (§ 9). C'est comme dans les caves, mais c'est la récompense du rouage achevé : faut-il la garder ?
8. **La pièce sans plan** paraît au dernier agrandissement. Faut-il qu'on puisse essayer de la poser, et qu'elle ne s'emboîte avec rien ?
9. **Le toucher** : sur un écran tactile, on prend et on pose d'un toucher, et l'on tourne par un bouton. Est-ce encore le même jeu ? À voir avec [#80](https://github.com/DavidGiangiacomo/strates/issues/80).
10. **Les objets des caves** : leur réception est décrite par famille (§ 8). À préciser avec le catalogue ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)), et à mesurer avec [#81](https://github.com/DavidGiangiacomo/strates/issues/81).
11. **La remontée finale** (§ 10) : à décider avec [#128](https://github.com/DavidGiangiacomo/strates/issues/128).

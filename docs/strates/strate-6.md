# Strate 6 — La dette

*Fiche de design, issue [#64](https://github.com/DavidGiangiacomo/strates/issues/64). Écrite après la bible narrative ([#43](https://github.com/DavidGiangiacomo/strates/issues/43)) et le design de la Compréhension ([#44](https://github.com/DavidGiangiacomo/strates/issues/44)). Les chiffres viennent d'une simulation grossière de onze profils de joueur (§ 4), à refaire avec le simulateur headless quand la boucle sera codée ([#73](https://github.com/DavidGiangiacomo/strates/issues/73), [#105](https://github.com/DavidGiangiacomo/strates/issues/105)).*

*Choix tranchés le 17 octobre 2026 :*
- *une promesse s'achète à terme : on l'obtient tout de suite, elle rapporte dès qu'elle est faite, et on la paie à la crue fixée. Plus le terme est loin, plus elle coûte ;*
- *la dette écrit ses montants en sceaux : un sceau par groupe de trois zéros. « 125 ●●● » vaut 125 milliards ;*
- *les échéances tombent pendant l'absence, sans plafond. Le rapport, lui, suit la règle commune : 80 %, douze heures au plus. L'entrée de la strate l'annonce.*

*Choix proposés, à trancher à la relecture :*
- *un défaut rend la descente possible, il ne la déclenche pas : seul le lit descend sans le joueur (§6) ;*
- *le livre est une pile de cinq tablettes. La dernière est due d'un coup, à la grande crue, que fixe la dernière promesse du livre (§ 4) ;*
- *une échéance qu'on ne peut pas payer est reportée de deux crues, majorée d'un quart. On tombe en défaut quand ce qu'on doit dépasse la confiance, ou quand la grande crue n'est pas couverte (§ 3) ;*
- *la confiance ne grandit que de ce qui est honoré en entier, jamais de la majoration d'un report. Sans cette règle, promettre tout à crédit était la façon la plus rapide de finir (§ 3, § 8) ;*
- *on convertit le prix des promesses honorées, sans les intérêts : payer cher ne doit pas rapporter de points (§ 9) ;*
- *les objets d'en haut sont des gages : ils augmentent la confiance, et adoucissent les reports (§ 8) ;*
- *jusqu'à la grande crue, l'absence compte en entier (§ 10).*

*Renvois : « §6 » désigne une section du [design doc](../design-doc.md), « § 6 » une section de cette fiche.*

La dette est la plus longue, la plus dure et la plus sombre des strates (§10). À la surface, on achetait ; dans l'atelier, on plaçait ; dans le chœur, on accordait. Ici, on ne produit rien : on **promet**. Chaque promesse rapporte tout de suite, et se paie plus tard, à une crue écrite d'avance (§5). Le temps s'y lit à l'envers : on ne regarde pas ce qu'on a, mais ce qu'on doit, et pour quand.

## 1. Identité

| | |
|---|---|
| Verbe | promettre |
| Ressource | Engagements |
| Unité et notation | **Les sceaux.** Les montants sont entiers, arrondis à trois chiffres significatifs, et groupés par trois. Chaque groupe de trois zéros, à la fin d'un montant, devient un sceau : 1 250 s'écrit « 1 250 », 125 000 « 125 ● », 1 250 000 « 1 250 ● », 125 milliards « 125 ●●● ». Le rouge pour ce qui est dû, le noir pour ce qui est en caisse ou honoré. **Les dates se comptent en crues**, une toutes les trente secondes : « Dû à la 42ᵉ crue ». Aucune autre strate n'écrit en sceaux, ni ne date en crues (I1). Le lit, dessous, montre ses couches, une par crue, sans les numéroter : la dette y a pris son calendrier. |
| Ordre de grandeur final | ≈ 10²⁰ : le livre entier vaut 3,84 × 10²⁰ en prix de promesses, « 384 ●●●●●● ». Après le chœur, sans nombres, c'est la plus grande échelle du jeu ; le lit, dessous, compte en milliers (I3). |
| Durée cible | 3 h. En simulation, sans aucun objet, le joueur naturel solde de 2 h 51 à 3 h 02 ; avec les objets d'un jeu correct, de 2 h 36 à 2 h 46 (§ 4, § 8). |
| κ à l'entrée → à la sortie | 70 → 85, au mieux |

**Le vocabulaire.**
- **Une promesse** : ce qu'on obtient tout de suite, contre ce qu'on rendra. Elle rapporte à chaque crue, dès qu'elle est faite, et pour toujours. Son prix est dû à une crue fixée d'avance.
- **Le terme** : la crue où la promesse se paie. Il se choisit en promettant : à 2, 6 ou 18 crues. Plus il est loin, plus la promesse coûte.
- **L'échéance** : une ligne du livre. « Dû à la 42ᵉ crue : 1 250. »
- **Honorer** : payer une échéance. **Solder** : l'honorer avant son terme. **Reporter** : ce que le livre fait d'une échéance que la caisse ne couvre pas.
- **La caisse** : ce qu'on a, en noir.
- **La confiance** : ce qu'on peut devoir, au plus. Elle grandit avec ce qu'on honore.
- **Le livre** : les 120 promesses de la strate, sur cinq tablettes.
- **La tablette** : une page du livre, trois sortes de promesses de huit exemplaires. Quand toutes ses promesses sont faites et honorées, elle est **brisée**.
- **La grande crue** : la crue où tombe tout ce qui reste dû. La dernière promesse du livre la fixe.
- **Le défaut** : une échéance que la caisse ne couvre pas et que la confiance ne peut plus reporter. « Échu. » On ne promet plus rien.

## 2. La civilisation

Les premiers à écrire, et ce qu'ils écrivaient d'abord, c'étaient des comptes : qui doit quoi, à qui, pour quand. Des tablettes d'argile, des sceaux, des témoins. On reconnaît les tablettes de prêt, les intérêts, et la tablette qu'on brise quand la dette est payée.

Ils optimisaient **l'engagement** : ce qu'on obtient tout de suite, contre ce qu'on rendra. Rien n'y était produit, tout arrivait à échéance. Leur temps était une suite de dates : en creusant leurs fosses à archives, ils ont trouvé sous eux des couches de limon fines et régulières, les ont lues comme un compte des années, une couche par crue, et y ont fixé leurs échéances.

Ils ont fini par saturation, de l'une des deux façons que garde la bible ([`bible.md`](../bible.md), § 7) :
- **soldée** : tout ce qui avait été promis a été honoré, et il ne restait rien à promettre ;
- **en défaut** : tout l'avenir était déjà promis, et l'on ne pouvait plus rien engager.

Dans les deux cas, il n'y avait plus de coup à jouer. La bible ([`bible.md`](../bible.md), § 4) en donne la suite : sa voix, ses mots, ses traces, et ce qu'elle a trouvé sous ses archives, « le compte des crues ».

## 3. Boucle courte

On ne produit rien, et rien ne se paie comptant : on **promet**. La boucle tient en trois gestes : **promettre, choisir le terme, honorer**. Aucun bouton ne produit.

### Les promesses

- La tablette ouverte offre trois sortes de promesses, de huit exemplaires chacune. Le n-ième exemplaire d'une sorte coûte son prix de base × 1,3ⁿ.
- **Une promesse rapporte tout de suite** : dès qu'elle est faite, et pour toujours, chaque exemplaire rapporte le rapport de sa sorte à chaque crue. Ce que rapporte une crue s'ajoute à la caisse au fil des secondes.
- **Elle se paie plus tard** : son prix, majoré selon le terme, tombe à la crue fixée.

| Terme | Majoration | En temps réel |
|---|---|---|
| à 2 crues | aucune | 1 minute |
| à 6 crues | + 20 % | 3 minutes |
| à 18 crues | + 60 % | 9 minutes |

- **La confiance** borne ce qu'on doit. Une promesse est refusée si ce qu'on doit déjà, plus elle, dépasse la confiance : « La confiance ne suffit pas. »
- **Elle grandit de ce qu'on honore.** Elle vaut 60, plus cinq fois le montant des échéances honorées en entier, majoration du terme comprise. Une échéance reportée ne compte qu'une fois honorée en entier, et pour son montant d'avant le report : ni la majoration d'un report, ni ce que la caisse en a payé avant, ne comptent jamais.
- **Pourquoi pas tout ce qui a été payé.** La confiance grandissait alors des reports eux-mêmes : plus on reportait, plus on payait, et plus on pouvait promettre. En simulation, avec un gage de × 1,25 sur la confiance, un joueur qui promettait tout à crédit sans regarder ses échéances, puis jouait la dernière tablette avec prudence, soldait en 1 h 40 ; le joueur naturel, en 2 h 46. À l'inverse, une règle qui ne compterait jamais une échéance reportée bloque la strate : un joueur qui a beaucoup reporté finit par ne plus rien devoir, sans assez de confiance pour promettre, ni rien à honorer pour en gagner. Avec la règle retenue, quand plus rien n'est dû, la confiance couvre toujours la moins chère des promesses ouvertes.
- **Le retour** d'une sorte, le nombre de crues qu'il faut à son premier exemplaire pour rapporter son prix, va de 4,2 crues pour la première sorte à 10,8 pour la douzième, 0,6 de plus à chaque sorte. Les premières promesses se paient presque d'elles-mêmes ; les suivantes, de moins en moins. La dernière tablette revient à 8 crues.

### Les échéances

- **À chaque crue**, les échéances de cette crue se paient sur la caisse, dans l'ordre du livre : « Honoré. »
- **Le report** : si la caisse ne couvre pas une échéance, elle en paie ce qu'elle peut, et le reste est reporté de deux crues, majoré d'un quart : « Reporté à la 44ᵉ crue, majoré d'un quart. » Un report peut être reporté à son tour.
- **Le défaut** : un report qui fait passer ce qu'on doit au-dessus de la confiance. « Échu. » La strate s'arrête : on ne promet plus, le livre ne bouge plus.
- **Solder** : toute échéance peut s'honorer avant son terme, à son plein montant, sauf celles de la dernière tablette.
- Le défaut est rare quand on regarde ses échéances. Un joueur qui promet à l'aveugle reporte de plus en plus, et chaque report, majoré, appelle le suivant.

### Les tablettes

- **Cinq tablettes**, de trois sortes et de huit exemplaires : 120 promesses. La tablette suivante s'ouvre dès que la courante est **toute promise** ; il n'est pas besoin d'attendre qu'elle soit honorée.
- **Une tablette brisée** : toutes ses promesses faites et honorées. « La tablette est brisée. » Les tablettes se brisent dans l'ordre.
- **La dernière tablette** est celle de la grande crue :
  - ses promesses n'ont pas de terme : elles sont toutes dues **à la grande crue**, majorées de 60 % ;
  - elles ne demandent pas de confiance, car elles sont gagées sur la grande crue. Elles ne se soldent pas d'avance ;
  - **la dernière promesse du livre fixe la grande crue**, douze crues plus tard, soit six minutes ;
  - **à la grande crue, tout ce qui reste dû tombe ensemble**. Si la caisse le couvre, tout est honoré d'un coup : la strate est soldée. Sinon, rien ne l'est : « Échu. Le reste demeure dû. »

### L'arrivée

Le livre s'ouvre sur la première tablette. Deux promesses y sont déjà écrites, deux mesures d'orge, dues à la 1ʳᵉ et à la 2ᵉ crue : 12 et 16. La caisse tient 30, et elles rapportent 6 par crue. La première échéance tombe à trente secondes : « Honoré. » La mesure d'orge suivante coûte 20 à 2 crues, 24 à 6 crues, 32 à 18 crues ; elle rapporte 3 par crue.

### La nomenclature

Les noms sont une proposition, à reprendre avec les textes ([#74](https://github.com/DavidGiangiacomo/strates/issues/74)) : ce qu'on obtient tout de suite, du plus petit au plus grand. La dernière tablette promet l'avenir même.

| Tablette | Promesse | Prix de base | Rapport par crue | Retour | Prix du 8ᵉ | La sorte entière |
|---|---|---|---|---|---|---|
| 1 | une mesure d'orge | 12 | 3 | 4,2 crues | 75 | 286 |
| 1 | une jarre d'huile | 336 | 70 | 4,8 | 2 110 | 8 020 |
| 1 | une pièce d'étoffe | 9 ● | 1 670 | 5,4 | 56 500 | 215 ● |
| 2 | un âne | 231 ● | 38 400 | 6,0 | 1 450 ● | 5 500 ● |
| 2 | une barque | 5 620 ● | 852 ● | 6,6 | 35 300 ● | 134 ●● |
| 2 | un attelage | 130 ●● | 18 100 ● | 7,2 | 819 ●● | 3 110 ●● |
| 3 | un champ | 2 870 ●● | 368 ●● | 7,8 | 18 ●●● | 68 500 ●● |
| 3 | un verger | 59 700 ●● | 7 110 ●● | 8,4 | 375 ●●● | 1 420 ●●● |
| 3 | un troupeau | 1 170 ●●● | 130 ●●● | 9,0 | 7 340 ●●● | 27 900 ●●● |
| 4 | une maison | 21 500 ●●● | 2 240 ●●● | 9,6 | 135 ●●●● | 514 ●●●● |
| 4 | un canal | 370 ●●●● | 36 300 ●●● | 10,2 | 2 320 ●●●● | 8 840 ●●●● |
| 4 | une digue | 5 930 ●●●● | 549 ●●●● | 10,8 | 37 200 ●●●● | 141 ●●●●● |
| 5 | la crue qui vient | 87 700 ●●●● | 11 ●●●●● | 8,0 | 550 ●●●●● | 2 090 ●●●●● |
| 5 | dix crues | 1 190 ●●●●● | 149 ●●●●● | 8,0 | 7 490 ●●●●● | 28 500 ●●●●● |
| 5 | toutes les crues | 14 800 ●●●●● | 1 850 ●●●●● | 8,0 | 92 800 ●●●●● | 353 ●●●●●● |

- **Les prix de base** : 12, puis × 28 d'une sorte à la suivante, un facteur qui baisse de 1,2 à chaque sorte. Les sauts sont grands au début, plus courts à la fin, pour que les tablettes durent à peu près le même temps.
- **Le livre entier** vaut 3,84 × 10²⁰ en prix de promesses : c'est la valeur convertible d'une strate soldée (§ 9). La dernière tablette en fait presque tout.

### État et actions, pour la boucle ([#73](https://github.com/DavidGiangiacomo/strates/issues/73))

```ts
type IdPromesse =
  | "orge" | "huile" | "etoffe" | "ane" | "barque" | "attelage" | "champ" | "verger"
  | "troupeau" | "maison" | "canal" | "digue" | "crueQuiVient" | "dixCrues" | "toutesLesCrues";

type Terme = 2 | 6 | 18;

interface Echeance {
  numero: number;              // son numéro d'ordre : la ligne du livre
  promesse: IdPromesse;
  crue: number | null;         // la crue où elle tombe ; null, dans la dernière tablette, tant que la grande crue n'est pas fixée
  du: number;                  // le montant dû, majorations comprises
  origine: number;             // le montant à l'échéance, avant tout report : ce qui compte pour la confiance
  prix: number;                // le prix de la promesse, sans majoration : ce qui compte pour la valeur convertible
  reports: number;
}

interface EtatDette {
  temps: number;               // secondes depuis l'arrivée, absences comprises
  caisse: number;
  promises: Record<IdPromesse, number>;  // exemplaires promis
  echeances: Echeance[];       // ce qui reste dû, dans l'ordre du livre
  honore: number;              // la somme des `origine` des échéances honorées en entier : la confiance en dépend
  valeur: number;              // le prix des promesses entièrement honorées : la valeur convertible
  tablette: number;            // la tablette ouverte, de 1 à 5
  brisees: number;             // les tablettes brisées
  grandeCrue: number | null;   // la crue de la grande crue, une fois fixée
  issue: "soldee" | "defaut" | null;
  issueA: number | null;
  livre: { cle: string; valeurs: Record<string, number> }[];  // les dernières lignes, formatées par la vue
  multiplicateurs: { confiance: number; report: number };     // artefacts, relus à chaque tick
}

type ActionDette =
  | { type: "promettre"; promesse: IdPromesse; terme: Terme }   // le terme est ignoré dans la dernière tablette
  | { type: "solder"; echeance: number };
```

- **`tick(dt)`** ajoute le rapport à la caisse. À chaque crue, il honore, reporte ou fait tomber les échéances de la crue, puis brise les tablettes qui peuvent l'être. Entre deux crues, rien d'autre ne change.
- **`pasMax`** vaut une crue, trente secondes : le pas est coupé à chaque crue.
- **`seuil()`** rend `{ atteint, issue }` : atteint dès que l'issue est connue, soldée ou en défaut.
- La strate n'utilise pas d'aléatoire. Un geste impossible est ignoré sans erreur.

## 4. Boucle moyenne et seuil de fouille

### Progression

Les temps sont ceux du joueur « naturel » de la simulation, sans aucun artefact. Avec les objets d'un jeu correct, la strate dure de 8 à 18 minutes de moins (§ 8).

| Temps | Étape | Contenu |
|---|---|---|
| 0 – 20 min | La première tablette | L'orge, l'huile, l'étoffe. Les promesses se paient presque d'elles-mêmes. On apprend qu'une promesse ne coûte rien sur le moment, qu'elle rapporte tout de suite, et que son prix tombe à sa crue. Une promesse toutes les 54 secondes. |
| 20 – 54 min | La deuxième | L'âne, la barque, l'attelage. Les retours s'allongent : il faut choisir ses termes. La première tablette est brisée à 28 minutes. |
| 54 – 99 min | La troisième | Le champ, le verger, le troupeau. Le terme long devient l'outil principal. Une promesse toutes les deux minutes. |
| 99 – 153 min | La quatrième | La maison, le canal, la digue. La tablette la plus longue : 54 minutes. On n'attend jamais plus de six minutes et demie entre deux promesses. |
| 153 – 174 min | La dernière tablette | L'avenir : la crue qui vient, dix crues, toutes les crues. On en promet 23 tout de suite, on attend que la caisse puisse couvrir la grande crue, et l'on fait la dernière promesse à 168 minutes. La grande crue tombe à 2 h 54 : « Honoré. Plus rien n'est dû. » |

La boucle moyenne du §3, c'est **la tablette** : cinq fois dans la strate, une page s'ouvre, de promesses cent à dix mille fois plus grandes, pendant que la page d'avant reste à honorer. Entre deux tablettes, on promet ce que les crues paieront, au terme qui tient.

Le joueur naturel fait 118 promesses. Avant la dernière tablette, il en fait une toutes les 54 secondes au début, toutes les 2 min 12 dans la quatrième tablette.

### Le terme : long quand tout croît, court quand tout ralentit

- Au début d'une tablette, le rapport croît de 12 à 16 % par crue. Payer dans 18 crues, même majoré de 60 %, c'est payer avec une caisse plusieurs fois plus grande : le terme long ne coûte presque rien.
- À la fin d'une tablette, il ne reste que des exemplaires chers, et le rapport ne croît plus. Les termes longs pris trop tard tombent alors tous ensemble.
- Le joueur naturel prend le terme le plus court qui tient : 11 promesses à 2 crues, 27 à 6, 56 à 18, avant la dernière tablette.
- C'est la grammaire de la dette, et elle tient en une phrase : **on paie avec la caisse qu'on aura**, à condition de savoir laquelle.

### Le seuil

- **Condition (soldée)** : la grande crue honorée. Toutes les promesses du livre sont faites, et plus rien n'est dû.
- **Ce qu'il dit de la civilisation** : tout ce qui avait été promis a été honoré, et il ne restait rien à promettre.
- **L'autre issue (en défaut)** : un report que la confiance ne peut plus porter, ou la grande crue que la caisse ne couvre pas. « Échu. Le reste demeure dû. » Tout l'avenir était déjà promis, et l'on ne pouvait plus rien engager.
- **Un défaut rend la descente possible, il ne la déclenche pas.** Le §6 réserve au lit la seule descente que le joueur ne décide pas. En défaut, le livre ne bouge plus : on ne promet plus, on ne paie plus. Le bouton « creuser » cesse de résister, et le joueur creuse quand il veut. C'est la réponse à la question laissée par l'architecture ([`architecture.md`](../architecture.md), § 9).
- **Pas d'accumulation seule (I4)** : le joueur réflexe, qui promet la moins chère dès que la confiance le permet sans regarder ses échéances, tombe en défaut à 51 minutes, avec 12 points. Le joueur prudent, qui ne promet que ce qu'il a déjà en caisse, solde en 5 h 52 : deux fois plus long. Le seuil demande de promettre au-delà de ce qu'on a, et de savoir jusqu'où.
- **L'objectif n'est jamais affiché comme tel.** Mais le livre montre les tablettes qui restent et tout ce qui est dû. Quand la dernière tablette s'ouvre, il écrit : « Tout ce qui reste dû tombe à la grande crue. »
- **Une fois atteint**, le seuil le reste, soldé ou en défaut.

### La grande crue

- La dernière tablette s'ouvre à 2 h 33. Ses 24 promesses peuvent se faire toutes à la fois : elles ne demandent pas de confiance, et rapportent tout de suite.
- **La dernière promesse fixe la grande crue**, douze crues plus tard. La grande crue est couverte si la caisse, avec douze crues de rapport, dépasse tout ce qui reste dû.
- Le joueur naturel fait 23 promesses tout de suite, attend un quart d'heure, et fait la dernière quand la caisse prévue couvre la grande crue. Sa marge est de 0,4 crue de rapport.
- **Trop tôt**, la grande crue tombe sans être couverte : défaut, avec 24 points au plus au lieu de 28. La dernière tablette ne compte pas, ni ce qui restait dû des autres (§ 9). C'est environ un objet de moins, comme le prévoit D-003.
- Pendant les douze crues, il n'y a plus rien à faire : tout est joué à la dernière promesse.

### Après le seuil

- **Soldée** : il n'y a plus rien à promettre ni à payer. Le rapport continue, mais plus rien ne s'honore : rester ne rapporte rien (§ 9).
- **En défaut** : tout s'arrête.
- **Filet** : comme partout, si le joueur n'a pas creusé 5 minutes après le seuil, une fissure part de la ligne de la grande crue, traverse le livre et monte vers le bouton du bandeau (`src/noyau/logique/filet.ts`).

### En simulation

Onze joueurs automatiques, sans aucun artefact. Le script est un brouillon en Python, hors du dépôt ; il ne partage rien avec le code du jeu.
- Le joueur naturel promet ce que la caisse, au rapport présent, paiera à chaque échéance, en comptant le rapport de la promesse nouvelle. Il prend le terme le plus court qui tient, et la sorte qui rapporte le plus pour ce qu'elle coûte.
- Dans la dernière tablette, il fait toutes les promesses sauf une, puis la dernière quand la grande crue est couverte.

| Profil | Jeu | Issue | Points | Reports |
|---|---|---|---|---|
| parfait | naturel ; passe toutes les 2 s | soldée en 2 h 54 | 28 | 0 |
| naturel | passe toutes les 5 s | soldée en 2 h 54 ; de 2 h 51 à 3 h 02 sur huit parties irrégulières | 28 | 0 |
| hésitant | naturel, mais prend souvent un terme plus long qu'il ne faut | soldée de 2 h 55 à 3 h 05 | 28 | 0 |
| distrait | naturel ; passe chaque minute | soldée en 2 h 52 | 28 | 0 |
| apprend | réflexe jusqu'à son premier report, puis naturel | soldée en 2 h 54 | 28 | 6 |
| optimiste | compte sur un rapport qui croît de 3 % par crue ; fixe la grande crue dès qu'il peut | défaut à la grande crue, 2 h 35 | 23 | 17 |
| téméraire | compte sur 8 % par crue | défaut dans la troisième tablette, 1 h 43 | 18 | 35 |
| gourmand | toujours le terme long, sans regarder la caisse | défaut à la grande crue, 3 h 26 | 23 | 8 |
| prudent | ne promet que ce qu'il a déjà en caisse, au terme court | soldée en 5 h 52 | 28 | 0 |
| naïf | réflexe, mais cesse de promettre tant qu'une échéance est reportée | défaut à 0 h 46 | 11 | 43 |
| réflexe | la moins chère, dès que la confiance le permet, au terme proposé (6 crues) | défaut à 0 h 51 | 12 | 69 |

- **La durée dépend peu du jeu** pour les joueurs réguliers : de 2 h 51 à 3 h 05. Le prix des promesses fixe le rythme, et la caisse ce qu'on en tire.
- **Les points disent où l'on est tombé** : 28 en soldant ; 23 en défaut à la grande crue, quand des échéances de la quatrième tablette restaient dues ; 18 dans la troisième tablette ; 11 ou 12 dans la deuxième.
- **Le naïf montre un piège** : cesser de promettre après un report ne sauve pas. Les reports, majorés d'un quart toutes les deux crues, croissent plus vite que le rapport. Il faut au contraire promettre encore, à terme long, ou solder dès que la caisse le permet : c'est ce que fait « apprend » (§ 13, question 4).
- **Beaucoup de joueurs finiront en défaut**, et c'est voulu (§9). Ceux qui regardent leurs échéances soldent, quel que soit leur rythme.

## 5. Le choc d'arrivée

Le joueur vient du chœur : pas un nombre, des barres, une oreille. Il arrive dans un livre de comptes où tout est nombre, date, rouge ou noir.

1. **Il cherche le prix.** Il n'y en a pas, sur le moment : une promesse ne coûte rien maintenant. Le bouton est toujours prêt.
2. **Il promet tout ce qu'il peut.** La confiance l'arrête dès la deuxième promesse : « La confiance ne suffit pas. » Elle grandit à chaque échéance honorée, et il peut bientôt promettre encore.
3. **Les premières échéances sont honorées** : les premières promesses se paient presque d'elles-mêmes, en quatre crues.
4. **Le premier report vient plus tard.** Le joueur réflexe le voit à la 19ᵉ crue, vers 9 min 30 : une ligne rouge, « Reporté à la 21ᵉ crue, majoré d'un quart. », sous une caisse vide.

**Pourquoi ça ne marche pas.** Dans les strates d'avant, un achat se payait, puis rapportait. Ici, il rapporte, puis se paie. Le réflexe « j'ai de quoi, j'achète » devient « j'aurai de quoi », et il faut le vérifier : la caisse à la crue de l'échéance, pas celle du moment.

**Comment il le comprend.** Le livre montre tout : les échéances à venir, leurs crues, la caisse et ce qu'elle reçoit par crue. Le premier report dit exactement ce qui a manqué. Le joueur « apprend » de la simulation, qui joue en réflexe jusqu'à ce premier report puis regarde ses échéances, solde en 2 h 54, comme le joueur naturel. Ses promesses faites à l'aveugle se paient encore un moment : six reports en tout.

**Pourquoi c'est agréable.** Les premières minutes sont généreuses : la première tablette se paie presque d'elle-même, et l'avertissement arrive avant le danger. La dette ne devient dure qu'avec les tablettes, quand les retours s'allongent. Le joueur qui ne regarde jamais rien tombe vers cinquante minutes : il aura vu des dizaines de lignes rouges avant.

## 6. Interface et direction artistique

Tableaux d'échéances, rouge et noir (§5). C'est la strate la plus sombre (§10). La réalisation est l'objet de [#89](https://github.com/DavidGiangiacomo/strates/issues/89) ; le son, de [#103](https://github.com/DavidGiangiacomo/strates/issues/103).

- **Disposition : le livre de comptes.**
  - **L'échéancier**, au centre : une ligne par échéance, dans l'ordre des crues. La crue, la promesse, le montant dû, en rouge. Une échéance honorée passe au noir, porte « Honoré. », puis s'efface. Un report s'écrit sous sa ligne, en rouge. La grande crue, une fois fixée, ferme la liste.
  - **La tablette**, à gauche : ses trois sortes de promesses. Pour chacune, les exemplaires qui restent, en encoches, son rapport, et trois boutons, un par terme, avec le montant dû et sa crue : « à 6 crues : 1 500, à la 48ᵉ ».
  - **En haut** : la caisse et le rapport par crue, en noir ; la confiance, une barre où ce qui est dû s'écrit en rouge, et ce qui reste en noir.
  - **Le compte des crues**, à droite : une bande verticale de couches fines, une par crue, comme le limon dont la dette s'est servie. Les échéances y sont piquées en rouge, sur les couches à venir ; la grande crue est une couche épaisse. C'est le reste de la strate (bible, § 3) : le joueur reconnaîtra ces couches dans le lit.
  - **Les tablettes brisées**, empilées en morceaux sous la tablette ouverte. La dernière reste entière jusqu'à la grande crue.
- **Palette** : l'argile des tablettes, sur une terre sombre, et deux encres, le noir et le rouge. Un rouge de terre cuite, plus sourd que le vermillon des frottements de l'atelier. À vérifier contre le réseau, quand sa fiche existera.
- **Typographie** : une écriture de scribe, gravée plutôt qu'écrite ; des chiffres tabulaires, alignés à droite comme dans un livre de comptes. Les sceaux sont de petites empreintes rondes, imprimées dans l'argile. Rien n'imite une écriture réelle.
- **Mouvement** : lent et régulier, au rythme des crues. Toutes les trente secondes, les lignes de la crue changent de couleur, et une couche s'ajoute au compte des crues.
- **Sons** :
  - le stylet dans l'argile quand on promet ; le sceau pressé quand le terme se fixe ;
  - l'eau, doucement, à chaque crue ; une tablette brisée, un craquement sec ;
  - pendant les douze crues de la grande crue, l'eau monte ;
  - « Échu. » : le silence. Pas de musique.
- **Jouable sans le son.** Le son ne dit rien que le livre ne montre.
- **Accessibilité** :
  - *couleurs* : le rouge et le noir ne disent jamais rien seuls. « Dû », « Honoré », « Reporté » sont écrits ;
  - *moins de mouvement* : les lignes changent sans animation, et le compte des crues s'allonge sans glisser ;
  - *clavier* : tout se fait au clavier : choisir une promesse, un terme, solder ;
  - *lecteurs d'écran* : un montant se lit en entier, « cent vingt-cinq milliards », et non sceau par sceau.
- **Ce qui la distingue** : c'est la seule strate qui montre l'avenir plutôt que le présent. On n'y regarde pas sa caisse, mais ce qu'elle devra être, à telle crue.
- **À l'écran de fouille** (§ 9) : la valeur en sceaux, à l'encre noire sur l'argile, et la ligne de l'issue au-dessus, « soldée » ou « en défaut » ([storyboard](descente-1-2.md), § 4).

## 7. Opacité et Compréhension

Le joueur arrive avec κ = 70 au mieux, et plutôt de 55 à 65 pour un jeu correct. Le délai de levée vaut alors de 5 à 7 minutes. Le graphe de dépendances est là dès l'arrivée ; les formules en sont à 10 ou 40 % ([`comprehension.md`](../comprehension.md), § 3).

- **Jamais caché** : les échéances, leurs crues et leurs montants, la caisse, le rapport, le refus d'une promesse faute de confiance, et la grande crue dès que la dernière tablette s'ouvre. Le seuil en dépend : on tombe en défaut par imprudence, jamais par ignorance.

| Élément opaque | À l'arrivée | Levé par l'usage | Par un objet | Délai |
|---|---|---|---|---|
| les noms des promesses | des glyphes ; le prix et le rapport restent lisibles | la première promesse de chaque sorte | raccourci | oui |
| la confiance | une barre sans échelle : on voit qu'elle se remplit, pas sa valeur | la première promesse refusée, ou la première tablette brisée | affichage | oui |
| le report | « Reporté. », sans sa crue ni sa majoration | le premier report | raccourci | oui |
| les majorations des termes | le montant dû est écrit, pas la majoration | la première promesse à 6 ou à 18 crues | — | oui |

**Les actes de compréhension propres**, 9 points sur les 15 du barème ([`comprehension.md`](../comprehension.md), § 2) :

| Acte | Définition | Poids |
|---|---|---|
| Soldée | la grande crue honorée : le seuil sans défaut | 4 |
| Sans un report | toute la strate sans une échéance reportée | 3 |
| La grande crue au plus juste | la dernière promesse faite quand la caisse prévue couvre la grande crue avec moins de deux crues de rapport d'avance, puis la grande crue honorée | 2 |

- S'y ajoutent les deux actes génériques, sans aide (3) et sans artefact (3).
- En simulation, le joueur naturel accomplit les trois actes propres. « Apprend » manque « sans un report ». Le joueur qui attend trop avant la dernière promesse manque « au plus juste », et c'est bien ce qu'il faut : il a soldé sans savoir de combien.

**Le graphe de dépendances** : les promesses, par sorte, alimentent le rapport ; le rapport, la caisse ; la caisse honore les échéances. Ce qui est honoré nourrit la confiance, qui ouvre les promesses : c'est le cycle de la strate, tracé en pointillés. Le terme et le report mènent aux échéances ; la dernière tablette, à la grande crue.

**Les formules**, de la plus simple à la plus profonde :
1. le prix d'un exemplaire : prix de base × 1,3ⁿ ;
2. le rapport : la somme des rapports des exemplaires promis ;
3. l'échéance : le prix × 1, × 1,2 ou × 1,6, selon le terme ;
4. la confiance : 60 + 5 × ce qui a été honoré en entier, sans les majorations des reports ;
5. le report : ce qui reste × 1,25, deux crues plus tard ;
6. la grande crue : la dernière promesse + 12 crues ; tout ce qui reste dû, d'un coup ;
7. la valeur convertible : la somme des prix des promesses honorées.

## 8. Artefacts reçus

Les objets du chœur sont **puissants**, ceux du réseau **utiles**, ceux de l'atelier **décoratifs** ; ceux des caves et de la surface sont des cailloux. Les catalogues sont dans [`artefacts.md`](../artefacts.md), § 8 ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)) : leurs effets suivent la réception par famille ci-dessous, et seront codés par [#90](https://github.com/DavidGiangiacomo/strates/issues/90).

Ce sont des **gages** (bible, § 6) : on les nomme par ce qu'ils valent ou ce qu'ils garantissent, « le gage qui chante », « la caution de bois ». Un gage ne produit rien : il fait qu'on a crédit.

| Famille d'effet | Réception dans la dette |
|---|---|
| multiplicateur | **levier principal `confiance`** : la confiance × m. **Levier secondaire `report`** : la majoration d'un report, 25 %, divisée par √m, soit 12,5 % au plafond. |
| affichage | la caisse prévue : à chacune des prochaines échéances pour un objet puissant, à la prochaine seulement pour un objet utile |
| raccourci | les noms des promesses et la valeur de la confiance, levés à l'arrivée |
| unique | au cas par cas ; jamais la grande crue honorée à la place du joueur |

**Les objets du chœur, puissants, et ceux du réseau, utiles :**

| Objet | Venu de | Effet dans la dette |
|---|---|---|
| la caution de bois | le chœur | levier `confiance` × 1,25 |
| le gage patient | le chœur | levier `report` : la majoration divisée par √1,5 |
| le gage qui revient | le chœur | la caisse prévue à chacune des prochaines échéances |
| le gage qui souffle | le chœur | les noms des promesses et la valeur de la confiance, levés à l'arrivée |
| le gage qui chante | le chœur | pendant les douze crues de la grande crue, une voix tient une note ; elle se tait à la grande crue, ou une crue plus tôt si la caisse ne doit pas y suffire |
| le grave qui dure | le réseau | levier `confiance` × 1,2 |
| ce qui tient | le réseau | levier `report` : la majoration divisée par √1,25 |
| ce qui monte | le réseau | la caisse prévue à la prochaine échéance |
| le doigt qui montre | le réseau | les noms des promesses, levés à l'arrivée |
| le battement sec | le réseau | au seuil, une couche de limon passe sur le livre |

- **Quand** : les gages s'éveillent quand la première tablette est brisée, vers 28 minutes. Le livre l'écrit, un objet par ligne : « Les témoins ont reconnu le gage qui chante. » La première tablette se joue donc sans objet, et le choc d'arrivée reste entier (§ 5).

**Pourquoi la confiance, et pas le rapport.** Les prix de la strate sont fixes : un multiplicateur sur tous les rapports la raccourcit presque d'autant. En simulation, × 1,25 sur tous les rapports fait passer la strate de 2 h 54 à 2 h 05, et × 2 à 1 h 09. Limité aux promesses qui courent encore, × 2 donne encore 1 h 40. La confiance, elle, ne paie rien : elle permet de promettre plus loin.

| Multiplicateur sur la confiance | aucun | × 1,1 | × 1,25 | × 1,5 | × 2 | × 4 (plafond) |
|---|---|---|---|---|---|---|
| Seuil du joueur naturel | 2 h 54 | 2 h 51 | 2 h 46 | 2 h 36 | 2 h 28 | 2 h 10 |
| Défaut du joueur réflexe | 0 h 51 | 0 h 43 | 0 h 41 | 0 h 40 | 0 h 58 | 0 h 48 |

- **Un gage est un cadeau à double tranchant.** Plus de confiance, c'est plus de corde : le joueur réflexe tombe plus tôt avec × 1,5 qu'avec rien, à 40 minutes au lieu de 51.
- **Les gages ne rendent pas le crédit rentable.** Un joueur qui promet tout ce que la confiance permet, sans regarder ses échéances, puis joue la dernière tablette avec prudence, n'arrive jamais jusqu'à elle : à toutes les valeurs du tableau, il tombe comme le réflexe. C'est la règle de la confiance qui l'en empêche (§ 3). Un jeu plus hardi gagne un peu : le joueur qui compte sur un rapport qui croît de 8 % par crue, puis joue la dernière tablette avec prudence, solde en 2 h 13 avec × 1,5 sur la confiance et sur le report, 23 minutes avant le joueur naturel. Sans gage, il tombe dans la troisième tablette.
- **Le levier `report`** ne sert qu'à qui reporte. Il ne raccourcit pas la strate du joueur naturel, qui ne reporte jamais ; il aide à se relever d'une erreur : au plafond, le joueur naïf tient jusqu'à 2 h 30, au lieu de 46 minutes. Il divise la majoration par √m, et non par m : à 6 %, au plafond, promettre à crédit redevenait rentable, et le joueur qui promet tout sans regarder soldait en 2 h 14.
- **Durée** : avec les objets d'un jeu correct, une confiance entre × 1,25 et × 1,5, la strate dure de 2 h 36 à 2 h 46. Le catalogue donne × 1,5 : le grave qui dure et la caution de bois.
- **Les objets ne rapportent pas de points** : 28 avec ou sans (§ 9). Ils rapportent du temps.
- **I2** : le noyau plafonne le produit des multiplicateurs à × 4. Au plafond, tout sur la confiance, la strate dure encore 2 h 10.
- **I5** : toute la simulation du § 4 est faite **sans aucun artefact**. Le joueur naturel solde de 2 h 51 à 3 h 02, le joueur hésitant jusqu'à 3 h 05 : sous les 3 h 15, avec dix minutes de marge. C'est le premier réglage à surveiller à l'équilibrage (§ 13).
- **Les noms d'en bas** sont donnés par la dette, qui écrit : ce sont les seuls objets du jeu nommés par ce qu'ils garantissent.

## 9. Valeur convertible

- **La somme des prix des promesses entièrement honorées, sans les intérêts** : ni les majorations des termes, ni celles des reports, ni celle de la grande crue. C'est ce que D-003 appelle « ce qui a été honoré », précisé : en comptant les intérêts, payer plus cher la même chose rapporterait des points. En simulation, le joueur réflexe, dont les 69 reports font plus que tripler ce qu'il paie, aurait 13 points au lieu de 12.
- **Soldée** : le livre entier, 3,84 × 10²⁰, « 384 ●●●●●● » : **28 points**, pour tout joueur qui solde. Le seuil demande tout le livre, et son prix fixe la valeur.
- **En défaut** : le prix des promesses honorées avant le défaut. Les tablettes valent, en cumul, 7 points pour la première, 13 pour la deuxième, 18 pour la troisième et 24 pour la quatrième. Un défaut à la grande crue donne donc **24 points** au plus : la dernière tablette ne compte pas. Il en donne 23 quand des échéances de la quatrième tablette restaient dues, comme pour l'optimiste et le gourmand de la simulation. C'est un objet de moins, et D-003 annonçait de 21 à 25 points pour un défaut au milieu ou en fin de strate.
- **Pour le catalogue** ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)) : 5 objets à 32 points au total ([`artefacts.md`](../artefacts.md), § 7). Soldée, le joueur en laisse un en haut ; en défaut à la grande crue, deux.
- **Rester ne rapporte rien** : une fois soldé, il n'y a plus rien à honorer ; en défaut, plus rien ne se paie.
- **À l'écran de fouille**, l'issue s'écrit au-dessus de la valeur : « soldée » ou « en défaut ».

## 10. Hors-ligne

- **Politique propre** ([`architecture.md`](../architecture.md), § 9) : la dette calcule elle-même l'absence. Les échéances tombent à leur crue, à 100 % et sans plafond. Le rapport compte à 80 %, douze heures au plus : c'est la règle commune. Reports et défaut s'appliquent comme en jeu.
- **C'est annoncé à l'entrée.** La première page du livre l'écrit : « Les échéances tombent à leur crue, qu'on soit là ou non. » Au retour, le résumé compte ce qui est tombé, après la durée qu'écrit le noyau : « Absence : 2 j. », puis « 14 échéances honorées, 2 reportées. »
- **Ce que fait une absence**, en simulation :
  - le joueur naturel, ou l'hésitant, s'absente une heure, douze heures ou deux jours, à n'importe quel moment des quatre premières tablettes, ou dans la dernière avant d'avoir fixé la grande crue. Il revient sans défaut : le rapport à 80 % lui coûte de 0 à 4 reports, puis il solde ;
  - une longue absence lui fait même gagner du temps de jeu, jusqu'à 27 minutes : douze heures de rapport ;
  - les joueurs trop engagés tombent pendant l'absence comme en jeu : le réflexe, ou l'optimiste qui part au milieu de la quatrième tablette.
- **Pendant les douze crues de la grande crue**, une absence change tout : une grande crue tout juste couverte à 100 % ne l'est plus à 80 %. En simulation, le joueur naturel qui s'absente juste après sa dernière promesse tombe en défaut, même pour une heure. D'où la proposition : **jusqu'à la grande crue, l'absence compte en entier**. Tout s'est joué à la dernière promesse, et la présence du joueur n'y change rien. Sans cette exception, partir pendant la grande crue serait le seul vrai risque d'un livre bien tenu.
- **Le calcul est direct** : entre deux échéances, la caisse croît en ligne droite. Deux jours font 5 760 crues, mais quelques centaines d'échéances au plus : `absence()` les parcourt une à une, sans simuler crue par crue.
- « Revenir après deux jours peut signifier revenir en défaut » (§9) : c'est vrai pour un livre trop engagé, et pour lui seul.

## 11. Textes

**Budget : 850 mots** ([bible](../bible.md), § 9), le plus grand de toutes les strates : c'est un livre de comptes.

- **Le ton** : des formules d'obligation, datées, à la troisième personne. Le rouge et le noir. Pas de « vous », pas de point d'exclamation, pas de jugement : le défaut se note comme le reste (bible, § 2).
- **Les textes clés**, en proposition pour [#74](https://github.com/DavidGiangiacomo/strates/issues/74) :
  - l'entrée : « Les échéances tombent à leur crue, qu'on soit là ou non. » ;
  - une échéance : « Dû à la 42ᵉ crue : 1 250. » Honorée : « Honoré. » Reportée : « Reporté à la 44ᵉ crue, majoré d'un quart. » ;
  - une promesse refusée : « La confiance ne suffit pas. » ;
  - une tablette : « La tablette est brisée. » ;
  - la dernière tablette : « Tout ce qui reste dû tombe à la grande crue. » Puis, à la dernière promesse : « La grande crue : à la 348ᵉ crue. » ;
  - les deux fins, mot pour mot ceux de la bible (§ 7) : « Honoré. Plus rien n'est dû. » et « Échu. Le reste demeure dû. » Même voix, même longueur, même place ;
  - l'éveil d'un objet : « Les témoins ont reconnu le gage qui chante. » ;
  - le retour d'une absence : « 14 échéances honorées, 2 reportées. » ;
  - le rappel de reprise ([`bible.md`](../bible.md), § 10) : la dernière ligne du livre, puis où en est son seuil.
- **Les dates** s'écrivent en chiffres, « à la 42ᵉ crue » : elles montent à plusieurs centaines. La bible les écrit désormais ainsi (§ 4).
- **Le reste**, « le compte des crues » : la bande des couches porte ce nom. Le joueur reverra ces couches dans le lit, sans que rien ne fasse le lien.
- **Les noms des promesses** (§ 3) : quinze noms, de « une mesure d'orge » à « toutes les crues ».
- **Les noms d'en bas** : des gages (§ 8).
- **Les traces pour le fond** (bible, § 5) : la ligne de l'issue, et le compte de ce qui a été honoré, en sceaux : « Honoré : 384 ●●●●●● ». Trois lignes au plus.

## 12. Critère R5

Pourquoi la dette tient comme jeu autonome de deux heures :
- **Un plaisir connu, retourné** : obtenir d'abord, payer ensuite. C'est la seule strate où l'on joue avec l'avenir, et l'échéancier est une vraie énigme, sans hasard : tout est visible.
- **Un arc net** : cinq tablettes, chacune plus grande, puis la grande crue, un final avec une seule décision, le moment de la fixer.
- **Une tension honnête** : on tombe par imprudence, jamais par ignorance ni par malchance.
- **Deux fins, sans jugement**, que la couche du dessous garde (bible, § 7).

**Le risque R3** (§13) : la strate fait décrocher à douze heures de jeu. Elle est longue et dense : 120 promesses, une décision toutes les une à deux minutes, et un quart d'heure d'attente avant la grande crue. Le prototype ([#73](https://github.com/DavidGiangiacomo/strates/issues/73)) doit être joué tôt par deux ou trois personnes, avec quatre questions :
1. Comprend-on, sans aide, qu'une promesse se paie à sa crue ?
2. Le premier report est-il vécu comme un avertissement ou comme une punition ?
3. Le quart d'heure avant la dernière promesse est-il tendu, ou vide ?
4. Le défaut est-il vécu comme une issue acceptable ?

## 13. Questions ouvertes

1. **L'attente de la grande crue** : un quart d'heure avec 23 promesses faites et rien à décider. Si c'est trop long, la dernière tablette peut revenir plus vite (8 crues → 6) ou être moins majorée.
2. **La marge d'I5** : le joueur hésitant solde en 3 h 05, à dix minutes de la limite. Un vrai joueur, plus lent, pourrait la dépasser. C'est la première mesure de l'équilibrage ([#105](https://github.com/DavidGiangiacomo/strates/issues/105)).
3. **Le prix d'un défaut à la grande crue** : 24 points, ou 23, quand D-003 annonçait qu'un défaut en fin de strate ne coûterait que 3 points. Le poids de la dernière tablette se règle si le catalogue le demande.
4. **Le piège du naïf** (§ 4) : arrêter de promettre après un report mène au défaut. L'aide doit dire comment sortir d'un report : promettre à terme long, solder dès que la caisse le permet. À défaut, les reports pourraient être plus doux dans les premières tablettes.
5. **L'absence pendant la grande crue** (§ 10) : l'exception proposée, à trancher.
6. **La précision des sceaux** : trois chiffres significatifs suffisent-ils pour comparer une caisse et une échéance presque égales ? L'affichage de la caisse prévue (§ 8) le règle pour qui a l'objet ; κ pourrait le donner aussi.
7. **Les termes** : le joueur naturel prend le terme long six fois sur dix. Faut-il le majorer davantage (× 1,8) pour équilibrer le choix ?
8. **La dernière tablette, 24 promesses d'un coup** : un geste pour toutes les faire, sauf la dernière ?
9. **Les noms des promesses** (§ 3) : à trancher avec les textes ([#74](https://github.com/DavidGiangiacomo/strates/issues/74)).
10. **La réception des objets** (§ 8) : fixée par le catalogue ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)), à coder par [#90](https://github.com/DavidGiangiacomo/strates/issues/90).
11. **Le compte des crues et le lit** : les mêmes couches, vues d'en haut puis d'en bas. La fiche du lit ([#75](https://github.com/DavidGiangiacomo/strates/issues/75)) dira comment elles se répondent, et où la grande crue s'y voit.
12. **La confiance et les reports** (§ 3) : une échéance reportée, une fois honorée, rend sa confiance d'origine, mais rien de ce que ses reports ont coûté. Le livre doit le montrer, sans quoi la règle paraîtra arbitraire : peut-être en écrivant, sous « Honoré. », ce que la confiance y gagne.

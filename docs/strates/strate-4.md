# Strate 4 — Le réseau

*Fiche de design, issue [#62](https://github.com/DavidGiangiacomo/strates/issues/62). Écrite après la bible narrative ([#43](https://github.com/DavidGiangiacomo/strates/issues/43)), le design de la Compréhension ([#44](https://github.com/DavidGiangiacomo/strates/issues/44)) et le catalogue des objets ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)), qui avait déjà nommé ceux du réseau. Les chiffres viennent des joueurs automatiques de la boucle codée ([#69](https://github.com/DavidGiangiacomo/strates/issues/69)), neuf profils de joueur (§ 4), qui ont repris une première simulation grossière ; l'équilibrage les reprendra ([#99](https://github.com/DavidGiangiacomo/strates/issues/99)).*

*Choix tranchés le 27 novembre 2026 :*
- *capter, puis réparer. Sur un plan fixe, six sources se relient une à une, chacune des centaines de fois plus forte que la précédente. Chacune crée des goulots en aval, qu'on répare en élargissant une conduite ou en reliant une autre route ;*
- *le seuil demande les six sources reliées et toute leur eau menée à la ville, sans une source ni un bassin qui monte, pendant cinq minutes. Ces minutes ne s'écoulent qu'en présence du joueur ;*
- *le réseau compte en pouces de fontainier et en lignes, un cent quarante-quatrième de pouce ; les nombres s'écrivent en entier ;*
- *les objets d'en haut agissent sur le débit des sources (levier `debit`) et sur le prix des conduites (levier `pose`).*

*Choix proposés, à trancher à la relecture :*
- *le volume se compte en muids, et un pouce verse un muid par minute ; les milliers se séparent d'un point, pour ne pas écrire comme les caves (§ 1) ;*
- *une source reliée ne donne pas tout d'un coup : son débit double toutes les deux minutes et demie, vingt-cinq minutes durant (§ 3) ;*
- *l'eau se partage à parts égales entre les conduites qui sortent d'un bassin. Une conduite pleine laisse le reste aux autres, et les vannes, réglées au quart, corrigent le partage (§ 3) ;*
- *un bassin tient deux minutes de ce que ses conduites emportent : un goulot se voit monter deux ou trois minutes avant de déborder (§ 3) ;*
- *trois actes propres : le goulot trouvé avant le signal, la route reliée avant sa source, et le seuil au plus juste (§ 7).*

*Renvois : « §6 » désigne une section du [design doc](../design-doc.md), « § 6 » une section de cette fiche.*

Le réseau est la strate où rien ne produit seul (§5). Une source qui coule ne rapporte rien tant que son eau n'atteint pas la ville, et l'eau n'atteint la ville que par où le réseau la laisse passer. Tout est débit et goulot. Le joueur arrive de l'atelier, où il achetait des pièces et les plaçait. Ici, il n'achète presque plus rien qui produise : il cesse d'acheter des générateurs et se met à **réparer des goulots** (§10).

## 1. Identité

| | |
|---|---|
| Verbe | relier |
| Ressource | Flux : l'eau menée jusqu'à la ville |
| Unité et notation | **Le pouce de fontainier.** C'est une unité de débit : « Source 2 : 4.000 pouces ». Un pouce vaut cent quarante-quatre lignes, et sous dix pouces, le débit s'écrit aussi en lignes : « 3 pouces 130 lignes ». **Le volume se compte en muids** : un pouce verse un muid par minute. La provision, ce qu'on a à dépenser, les prix et le compteur de la ville s'écrivent en muids. Tous les nombres sont **entiers et écrits en entier**, sans suffixe, sans décimale ni puissance de dix, les milliers séparés d'un point : « 150.000.000.000.000 pouces ». Le temps se compte en minutes, celles du relevé. Aucune autre strate ne compte en pouces ni en muids, ni ne sépare ses milliers d'un point (I1). |
| Ordre de grandeur final | ≈ 10¹⁵ muids reçus par la ville : 2,05 × 10¹⁵ au seuil pour le joueur naturel sans aucun objet, soit « 2.050.000.000.000.000 muids ». Il vient après les 10¹² pièces de l'atelier, et avant le chœur, qui ne montre aucun nombre (I3). À plein, le réseau porte 1,5 × 10¹⁴ pouces. |
| Durée cible | 2 h 30. En simulation, le joueur naturel finit en 2 h 29 sans aucun artefact, et en 2 h 10 avec les objets d'un jeu correct (§ 4, § 8). |
| κ à l'entrée → à la sortie | 38 → 55, au mieux |

*Les nombres de cette fiche sont écrits pour l'équipe, avec des puissances de dix quand ils sont grands. À l'écran, tout s'écrit en entier.*

**Le vocabulaire.** La bible donne au réseau ses mots : source, bassin, conduite, vanne, jauge, niveau, débit, regard, déversoir et relevé ([bible](../bible.md), § 4).
- **Le plan** : le schéma du réseau, des sources sur les hauteurs à la ville en bas. Ses **tracés** sont les conduites qu'on peut poser, numérotées de 1 à 13.
- **Une source** coule sur les hauteurs. Tant qu'elle n'est pas reliée, son eau se perd. **Relier** une source, c'est poser sa conduite.
- **Un bassin** reçoit l'eau de ses conduites d'amont et la rend par celles d'aval. Il y en a quatre : le **bassin bas**, le **bassin du milieu**, le **bassin haut**, et le quatrième, qui se révèle **la citerne** (§ 2).
- **Une conduite** porte au plus son **calibre** : 10 pouces au calibre 1, dix fois plus à chaque calibre. **Élargir** une conduite, c'est lui donner un calibre de plus.
- **Une vanne** est posée sur chaque conduite, avec son numéro. Elle s'ouvre au quart : fermée, d'un quart, de moitié, aux trois quarts, ouverte. Celle de la grande conduite est **la vanne maîtresse**.
- **La jauge** d'un bassin marque son **niveau de service**, où l'eau se tient quand tout passe.
- **Le déversoir** : quand un bassin est plein, l'eau en trop s'y perd.
- **Un goulot** : une conduite pleine sous une source ou un bassin qui monte.
- **Le regard** d'une conduite donne son débit, son calibre et sa vanne.
- **Le carnet de relevés** est la voix du réseau : il note ce qui change, d'une ligne.
- **La ville** reçoit l'eau. **Son compteur** totalise ce qu'elle a reçu, en muids.

## 2. La civilisation

Des fontainiers. Des sources, des bassins, des conduites, des vannes et des jauges : une ville dont l'eau allait partout. On reconnaît les aqueducs, les canaux d'irrigation, l'art de répartir l'eau. Rien n'y produisait seul : tout était débit et goulot (§5).

Ils optimisaient **le débit sans goulot** : que chaque conduite porte ce qu'elle peut, ni plus ni moins. Leur temps était celui des relevés. On passait aux vannes, on lisait les jauges, on notait les niveaux, et l'on recommençait.

Ils ont fini par saturation. Toutes les sources étaient captées et toute leur eau arrivait en ville. Le réseau a tourné sans un goulot si longtemps qu'il n'y avait plus rien à réparer, et les jauges ne bougeaient plus.

En creusant leur dernier bassin, ils sont tombés sur une salle voûtée, immense. Ils en ont fait une citerne ; pleine, elle bourdonne. C'est leur reste ([bible](../bible.md), § 3), et c'est la nef du chœur, dessous : aucun texte ne le dit. Leur voix, leurs mots et leurs traces sont dans la bible ([`bible.md`](../bible.md), § 4).

## 3. Boucle courte

Rien ne se clique pour produire, et presque rien ne s'achète qui produise. Le réseau tient en trois gestes : **relier, élargir, régler**. Une source reliée monte, son eau bute quelque part, et il faut trouver où.

### Le plan

```
  source 1  source 2     source 3      source 4  source 5       source 6
       1 \    / 3            | 4          7 \    / 10              | 11
       bassin bas  <-- 5 --  bassin du  <-- 8 --  bassin   <-- 12 --  la citerne
           |                  milieu              haut
           | 2                  | 6                 | 9                 | 13
           v                    v                   v                   v
       =========================== la ville ===============================
```

Les bassins s'échelonnent dans la vallée, du plus proche de la ville au plus lointain. Chacun peut se vider de deux façons. Par **un raccourci**, court et bon marché, vers le bassin voisin (5, 8, 12). Ou par **sa route** jusqu'à la ville, longue et chère (2, 6, 9, 13). La route de la citerne est **la grande conduite**.

| Tracé | De | Vers | Calibre de pose | Calibre le plus fort | Prix |
|---|---|---|---|---|---|
| 1 | source 1 | bassin bas | 1, posé à l'arrivée | 4 | × 1 |
| 2 | bassin bas | ville | 1, posé à l'arrivée | 5 | × 1 |
| 3 | source 2 | bassin bas | 1 | 5 | × 1 |
| 4 | source 3 | bassin du milieu | 4 | 8 | × 1 |
| 5 | bassin du milieu | bassin bas | 4 | 7 | × 1 |
| 6 | bassin du milieu | ville | 4 | 9 | × 3 |
| 7 | source 4 | bassin haut | 6 | 10 | × 1 |
| 8 | bassin haut | bassin du milieu | 6 | 10 | × 1 |
| 9 | bassin haut | ville | 6 | 13 | × 3 |
| 10 | source 5 | bassin haut | 9 | 13 | × 1 |
| 11 | source 6 | citerne | 12 | 15 | × 1 |
| 12 | citerne | bassin haut | 11 | 13 | × 1 |
| 13 | citerne | ville : la grande conduite | 11 | 15 | × 3 |

- **Un calibre n porte 10ⁿ pouces** : 10 au calibre 1, 100.000 au calibre 5, 10¹⁵ au calibre 15.
- **Le prix** : obtenir le calibre n coûte 2,4 × 10ⁿ⁻¹ muids, arrondi au muid. Cela vaut pour poser une conduite à son calibre de pose comme pour l'élargir d'un calibre. Relier la source 2 coûte 2 muids, le calibre 2 en coûte 24, le calibre 3, 240. **Les trois routes lointaines coûtent trois fois plus** (6, 9 et 13). Un calibre de plus coûte ainsi un peu plus de deux minutes de ce que la conduite portait.
- **Le calibre le plus fort** : chaque tracé a le sien. La route du bassin bas ne porte jamais plus de 100.000 pouces, et celle du milieu, jamais plus d'un milliard. **Une conduite au plus large ne s'élargit plus** : l'eau en trop doit prendre une autre route (§ 4).

### Les sources

| Source | Débit plein | |
|---|---|---|
| 1 | 10 pouces | coule à plein dès l'arrivée |
| 2 | 4.000 pouces | |
| 3 | 1.600.000 pouces | |
| 4 | 640.000.000 pouces | |
| 5 | 256.000.000.000 pouces | |
| 6 | 150.000.000.000.000 pouces | la source de la citerne |

- **Chaque source donne quatre cents fois la précédente, ou presque.** La sixième donne près de six cents fois la cinquième. Le débit plein d'une source ne s'écrit que lorsqu'elle l'atteint, sauf avec un objet (§ 8). Pendant sa montée, le regard de sa conduite donne ce qu'elle donne déjà.
- **Une source reliée monte.** Elle donne d'abord un mille vingt-quatrième de son débit, puis double toutes les deux minutes et demie : elle est à plein au bout de vingt-cinq minutes. Le carnet le note : « Source 2 : reliée. », puis « Source 2 : à plein. 4.000 pouces. ».
- **Les sources se relient dans l'ordre**, de la 2 à la 6 : la suivante paraît sur le plan quand la précédente est reliée.
- **Un bassin paraît avec la première source qui s'y jette** : le bassin du milieu avec la source 3, le bassin haut avec la source 4, le quatrième bassin avec la source 6. On peut poser ses conduites avant que l'eau n'y arrive. Le quatrième se révèle à la première conduite qu'on y pose : c'est une salle voûtée, la citerne (§ 2).

### L'eau

L'eau passe d'amont en aval, à chaque instant. Elle part des sources, traverse les bassins et finit en ville.
- **Le partage.** L'eau qui sort d'un bassin, ou d'une source, se partage **à parts égales** entre ses conduites d'aval. Ce qu'une conduite pleine ne prend pas va aux autres.
- **La vanne.** Une vanne ouverte d'un quart ne laisse passer que le quart du calibre de sa conduite, et une vanne fermée ne laisse rien passer. Les vannes sont la seule façon de corriger le partage. Régler une vanne ne coûte rien.
- **Le bassin.** Un bassin, comme la vasque d'une source, tient deux minutes de ce que ses conduites d'aval emportent. Ensuite, tout dépend de ce qu'il reçoit.
  - Quand il reçoit plus que ses conduites n'emportent, il **monte** : sa jauge passe au-dessus du niveau de service, et le carnet note « Bassin bas : monte. ».
  - Plein, il **déborde** : le déversoir coule et l'eau en trop se perd. C'est **le signal**. Le carnet nomme alors le goulot : « Bassin bas : déborde. Conduite 2 : goulot. », et ajoute « au plus large » si la conduite ne s'élargit plus.
  - Quand il reçoit moins, il **redescend** jusqu'à son niveau de service : « Bassin bas : stable. ».
- **Le goulot est en aval de ce qui monte.** Un bassin qui monte a toutes ses conduites d'aval pleines. Élargir ce qui y entre n'y change rien, ou le fait monter plus vite.
- **Le temps du signal.** Quand une source monte, il s'écoule de deux à trois minutes entre la conduite pleine et le déversoir : 178 secondes, au milieu, en simulation (§ 4).
- **La ville reçoit tout ce qui lui arrive.** Le compteur avance d'un muid par minute et par pouce reçu, et la provision aussi.

### Les gestes

- **Relier** : poser la conduite d'un tracé, à son calibre de pose. Le tracé doit partir d'une source ou d'un bassin qui a paru sur le plan. Pour une source, c'est la relier.
- **Élargir** une conduite d'un calibre, jusqu'au plus fort de son tracé.
- **Régler une vanne**, d'un quart à la fois.
- **Ouvrir un regard** sur une conduite : « Conduite 6 : 1.600.000 pouces sur 10.000.000. Vanne ouverte. ».
- Seuls relier et élargir coûtent. Rien ne se défait : une conduite posée le reste, et une vanne fermée en tient lieu.

### L'arrivée

Le plan est presque vide. Sur les hauteurs, la source 1 coule dans le bassin bas par la conduite 1, et le bassin bas se vide en ville par la conduite 2. Les deux conduites sont au calibre 1 : elles portent les 10 pouces de la source, ni plus ni moins. Les jauges sont au niveau de service et le compteur avance de dix muids par minute. Un peu plus haut, la source 2 paraît, sans débit écrit. La relier coûte 2 muids, soit douze secondes d'eau. Plus loin, les autres tracés sont en pointillés, et le carnet est vierge.

### État et actions, pour la boucle ([#69](https://github.com/DavidGiangiacomo/strates/issues/69))

```ts
type IdNoeud =
  | "source1" | "source2" | "source3" | "source4" | "source5" | "source6"
  | "bas" | "milieu" | "haut" | "citerne" | "ville";

type Ouverture = 0 | 0.25 | 0.5 | 0.75 | 1;

interface Conduite {
  trace: number;                    // de 1 à 13 : le tracé du plan, et le numéro de sa vanne
  calibre: number;                  // elle porte 10^calibre pouces
  vanne: Ouverture;                 // la part de son calibre qu'elle laisse passer
}

interface EtatReseau {
  temps: number;                    // secondes depuis l'arrivée, absences comprises
  conduites: Conduite[];            // celles qui sont posées
  reliees: Partial<Record<1 | 2 | 3 | 4 | 5 | 6, number>>; // quand chaque source a été reliée
  attente: Partial<Record<IdNoeud, number>>; // l'eau au-dessus du niveau de service, en muids
  montees: Partial<Record<IdNoeud, number>>; // depuis quand une source ou un bassin monte
  caisse: number;                   // la provision : les muids à dépenser
  recu: number;                     // tout ce que la ville a reçu, en muids : la valeur convertible
  perdu: number;                    // l'eau des déversoirs, pour le journal
  tenue: number;                    // secondes sans goulot, les six sources à plein, en présence
  carnet: string[];                 // les dernières lignes, pour la vue et le rappel
  multiplicateurs: { debit: number; pose: number }; // artefacts, relus à chaque tick
}

type ActionReseau =
  | { type: "relier"; trace: number }     // pose la conduite de ce tracé
  | { type: "elargir"; trace: number }    // un calibre de plus
  | { type: "vanne"; trace: number; ouverture: Ouverture };
```

- **`tick(dt)`** fait passer l'eau d'amont en aval : la source 6, la citerne, les sources 4 et 5, le bassin haut, la source 3, le bassin du milieu, les sources 1 et 2, le bassin bas, puis la ville. Chaque nœud reçoit, partage, monte ou déborde. La ville reçoit, et la provision avec elle.
- **`pasMax`** vaut une seconde.
- **`absence(duree)`** fait couler le réseau sur l'absence, comptée à 80 % et à 12 h au plus, par pas d'une seconde. Elle ne compte pas la tenue (§ 10).
- **`seuil()`** est atteint quand la tenue arrive à 300 secondes.
- **`valeurConvertible()`** rend `recu`.
- La strate n'utilise pas d'aléatoire. Un geste impossible est ignoré sans erreur : élargir au-delà du plus fort, relier un tracé déjà posé, payer sans provision.

### Dans le code ([#69](https://github.com/DavidGiangiacomo/strates/issues/69))

Le module du réseau est dans `src/strates/s4-reseau`, et il suit ce paragraphe.
- **Les règles** (`logique/regles.ts`) : les treize tracés, les six sources, les calibres et les prix, la montée et le partage à parts égales.
- **La boucle** (`logique/index.ts`) : l'eau d'amont en aval, les trois gestes, le carnet, la montée, le signal, la tenue du seuil et l'absence.
- **L'état** (`logique/etat.ts`) garde aussi ce que la vue et le journal lisent : le débit de chaque conduite au dernier instant, les nœuds qui redescendent, et les goulots défaits avant le signal, que l'acte du § 7 comptera ([#98](https://github.com/DavidGiangiacomo/strates/issues/98)).
- **Les conduites des sources 5 et 6 se posent au calibre de leur premier filet**, 9 et 12 au lieu de 8 et 11. Sans cela, ces deux sources débordaient de leur propre conduite dès qu'on les reliait. Les durées n'en changent pas, et le joueur naturel fait deux achats de moins.
- **Le seuil** ([#82](https://github.com/DavidGiangiacomo/strates/issues/82)) est codé avec la boucle : la tenue, la règle de l'absence et les minutes du carnet. Un goulot qui paraît à 4 min 59 s remet la tenue à zéro, et les tests le vérifient.
- **La notation** (`logique/notation.ts`) écrit les débits en pouces et en lignes, et les volumes en muids, en entier. Les lecteurs d'écran reçoivent les nombres sans séparateur, qu'ils lisent comme des nombres.
- **Des joueurs automatiques** (`sim/joueurs/reseau.ts`) jouent les neuf profils du § 4 à travers le noyau. Sans objets, ils retrouvent la première simulation à la minute près.

## 4. Boucle moyenne et seuil de fouille

### Progression

Les temps sont ceux du joueur « naturel » de la simulation, sans aucun artefact. Avec les objets d'un jeu correct, il finit 19 minutes plus tôt (§ 8).

| Temps | Étape | Contenu |
|---|---|---|
| 0 – 25 min | La source 2 | Relier la source 2 coûte 2 muids. Sa montée fait monter le bassin bas dès la première minute. Il faut élargir la conduite 2, en aval, trois fois, et la conduite 3 aussi. À 25 minutes, la source 2 donne ses 4.000 pouces, et le réseau les porte. |
| 25 – 55 min | La source 3 | 1.600.000 pouces dans le bassin du milieu, qui n'a pas encore de sortie. On relie d'abord le raccourci 5 vers le bassin bas. Mais la conduite 2 est au plus large à 100.000 pouces : il faut la route du milieu, la 6. Le raccourci, qui se remplit le premier, verse encore trop : la vanne 5 se ferme d'un quart. |
| 55 – 84 min | La source 4 | 640.000.000 pouces dans le bassin haut, qui se vide d'abord par son raccourci, la 8, vers le milieu. Huit calibres de plus, sur trois conduites. |
| 84 – 113 min | La source 5 | 256 milliards de pouces : la route du milieu, au plus large à un milliard, ne suffit plus. On relie la route du haut, la 9, et la vanne 8 se ferme d'un quart. |
| 113 – 144 min | La source 6 | Relier la source 6 révèle la citerne (§ 2). Son raccourci, la 12, est vite au plus large ; la grande conduite, la 13, est reliée à 2 h 09, et la vanne 12 se ferme d'un quart. À 2 h 24, plus rien ne monte. |
| 144 – 149 min | Les cinq minutes | « Aucun goulot. », puis « Aucun goulot depuis 4 minutes. » Les jauges ne bougent plus. Le seuil tombe à 2 h 29. |

La boucle moyenne du §3, c'est **la source**. Cinq fois, une source se relie et monte pendant vingt-cinq minutes. Son eau bute de conduite en conduite, et chaque goulot réparé fait paraître le suivant, plus bas. Puis le réseau la porte, et la source suivante attend.

Le joueur naturel fait 52 achats, soit 5 sources, 6 routes et raccourcis et 41 calibres, et règle trois fois une vanne. Le réseau a un goulot à peu près la moitié du temps. Le joueur naturel en défait 41 avant le signal, et en laisse déborder 14.

### Une conduite au plus large

- Chaque tracé a son calibre le plus fort. Les sources 3, 5 et 6 dépassent ce que porte la route qu'elles trouveraient par les raccourcis : **il faut relier** celle de leur bassin.
- **Le raccourci est un choix.** Il coûte moins, et il se pose tout de suite. Mais il se remplit le premier, puisque l'eau se partage à parts égales : il verse dans le bassin voisin plus que celui-ci n'emporte, dès que sa route est au plus large. Il faut alors en fermer la vanne d'un quart, ou plus.
- **La route d'abord** : le joueur qui relie la route d'un bassin avant sa source n'a jamais besoin d'une vanne. En simulation, il fait 39 achats au lieu de 52, et finit à la même heure.

### Le seuil

- **Condition** : les six sources reliées et à plein, et **aucune source ni aucun bassin qui monte** : toute leur eau va à la ville. Cela pendant **cinq minutes**, en présence du joueur (§ 10).
- **Ce qu'il dit de la civilisation** : le réseau a tourné sans un goulot si longtemps qu'il n'y avait plus rien à réparer, et les jauges ne bougeaient plus.
- **Pas d'accumulation seule (I4).**
  - Une source plus forte ne rapporte rien tant que le réseau ne la porte pas.
  - Élargir en amont de ce qui monte ne change rien.
  - Chaque route a son calibre le plus fort : il faut en relier une autre.
  - Un raccourci posé trop tôt verse trop dans le bassin voisin, et seule une vanne le corrige.

  En simulation, le joueur réflexe élargit ce qui entre dans un bassin qui monte, et reste à 10 pouces. Celui qui fait l'achat le moins cher reste à 8 points. Celui qui ne touche jamais une vanne garde, dès la source 3, un petit goulot au bassin bas. Aucun des trois n'atteint le seuil en cinq heures.
- **Issues** : une seule.
- **L'objectif n'est jamais affiché comme tel.** Mais le carnet écrit « Aucun goulot. » quand plus rien ne monte. Les six sources à plein, il compte les minutes : « Aucun goulot depuis 4 minutes. ». Au seuil, il écrit « Aucun goulot depuis 5 minutes. ».
- **Une fois atteint**, le seuil le reste.
- **Avant le seuil**, « creuser » résiste, comme partout ([fiche de la surface](strate-1.md), § 4).

### Après le seuil

- Le réseau coule, et la ville reçoit toujours. Il n'y a plus rien à relier : rester rapporte un 22ᵉ point au bout de 21 minutes, ou de 7 avec les objets d'un jeu correct (§ 9).
- **Filet** : comme partout, si le joueur n'a pas creusé 5 minutes après le seuil, une fissure part de la ville, remonte la grande conduite et monte vers le bouton du bandeau (`src/noyau/logique/filet.ts`).

### En simulation

Neuf joueurs automatiques (`sim/joueurs/reseau.ts`), sans aucun artefact, puis avec les objets d'un jeu correct. Ils jouent le code du jeu à travers le noyau, geste par geste. Les objets s'y éveillent à la première source reliée (§ 8).
- Le joueur naturel passe toutes les 5 secondes. Il répare d'abord ce qui monte le plus près de la ville : il élargit une conduite d'aval pleine dont l'aval suit, ou relie une sortie neuve. Quand un bassin ne peut plus rien élargir ni relier, il ferme d'un quart la vanne qui l'alimente trop.
- Il ne relie la source suivante que lorsque toutes sont à plein et que plus rien ne monte.

| Profil | Jeu | Seuil | Avec les objets | Points |
|---|---|---|---|---|
| parfait | naturel ; passe toutes les 2 s | 2 h 29 | 2 h 10 | 21 |
| naturel | ci-dessus | 2 h 29 | 2 h 10 | 21 (2,04 × 10¹⁵) |
| prévoyant | naturel ; relie la route d'un bassin avant sa source, jamais un raccourci | 2 h 29 | 2 h 13 | 21 |
| apprend | réflexe pendant 10 minutes, puis naturel | 2 h 29 | 2 h 10 | 21 |
| distrait | naturel ; passe chaque minute | 2 h 36 | 2 h 17 | 21 |
| prudent | naturel ; ne dépense jamais plus de la moitié de sa provision | 3 h 09 | 2 h 19 | 21 |
| sans vannes | naturel, mais ne touche jamais une vanne | jamais | jamais | 12 après 5 h |
| moins cher | l'achat le moins cher, quel qu'il soit | jamais | — | 8 après 5 h |
| réflexe | relie dès qu'il peut ; quand un bassin monte, élargit ce qui y entre | jamais | jamais | 4 après 5 h |

- **La durée dépend peu de l'habileté** : de 2 h 29 à 2 h 36 pour les joueurs réguliers. Les sources fixent le rythme, avec leurs vingt-cinq minutes de montée chacune, et les prix fixent le retard des réparations.
- **Elle dépend de la dépense** : le joueur prudent finit à 3 h 09, sous les 3 h 15 d'I5.
- **Les points ne dépendent pas du jeu** : 21 pour tous ceux qui finissent (§ 9).
- **Le joueur qui apprend** finit à la même heure que le naturel : ses dix premières minutes ne lui coûtent rien, sinon une conduite élargie pour rien (§ 7).
- **Le joueur sans vannes** reste bloqué dès la source 3. Le raccourci 5 verse 100.000 pouces dans le bassin bas, dont la route, au plus large, n'en emporte pas davantage : le bassin bas reçoit 4 % de trop, et rien d'autre ne le soulage.

## 5. Le choc d'arrivée

Le joueur arrive de l'atelier. Trois strates lui ont appris trois réflexes :
- **acheter ce qui produit**, comme à la surface ;
- **garder une réserve**, comme dans les caves ;
- **relier ce qui doit tourner à ce qui tourne déjà**, comme dans l'atelier, où une pièce ne produisait que si elle touchait le rouage.

Le réseau garde le troisième et défait les deux autres. Relier ne suffit plus : il faut que l'eau passe.

### Ce qu'il fait

1. **Il cherche ce qui produit.** Il n'y a ni générateur ni pièce à acheter, rien que de l'eau qui coule. La seule chose qui ressemble à un achat, c'est la source 2. Il la relie, pour 2 muids.
2. **L'eau arrive, et le compteur ne bouge presque pas.** La source monte, le bassin bas aussi, et la jauge passe au-dessus du niveau de service.
3. **Il élargit la conduite de la source 2**, la nouvelle, celle qui « produit ». Le bassin bas monte plus vite.
4. **Le déversoir coule.** Le carnet écrit : « Bassin bas : déborde. Conduite 2 : goulot. »

En simulation, le joueur réflexe, qui élargit ce qui entre dans un bassin qui monte, reste à 10 pouces : toute l'eau de la source 2 se perd. Le joueur naturel en reçoit 68 au bout de dix minutes, 9.841 au bout d'une demi-heure, et quatre millions au bout d'une heure.

### Pourquoi ça échoue

Dans l'atelier, une pièce de plus produisait dès qu'elle touchait le rouage. Ici, **l'eau ne va pas plus vite que le plus étroit de son chemin**, et le plus étroit est en aval de ce qui monte. Une source plus forte ne rapporte rien tant que le réseau ne la porte pas. Un bassin plus grand non plus : il déborderait plus tard, c'est tout. La grammaire du réseau : **le maillon le plus faible, et il est plus bas**.

### Comment il le comprend

- **La jauge le montre.** Le bassin qui monte est le seul mouvement de l'écran, avec l'eau.
- **Le regard le dit.** La conduite 2 porte 10 pouces sur 10, et la conduite 3, 3 pouces 130 lignes sur 10.
- **Le carnet le nomme**, au premier signal : « Conduite 2 : goulot. ». Il élargit la conduite 2 : le bassin bas redescend, et le compteur double.
- **La montée continue**, et quelques minutes plus tard, la conduite 2 est de nouveau pleine. Il sait déjà quoi faire.

### Pourquoi c'est agréable, pas frustrant

- **Rien ne se perd, sinon de l'eau.** Le déversoir ne casse rien, et une conduite élargie pour rien reste à soi.
- **La première réparation est à deux minutes et demie**, le temps d'avoir les 24 muids du calibre 2. Elle est évidente une fois qu'on l'a vue : le carnet nomme la conduite.
- **La règle tient en une phrase** et elle se voit : l'eau s'arrête au plus étroit, en aval de ce qui monte.
- **La correction ne demande aucun retour en arrière.** Le profil qui joue en réflexe pendant dix minutes atteint le seuil en même temps que le joueur naturel.
- **La découverte continue** : chaque source repose le problème plus loin, sur une route plus longue, avec des raccourcis et des vannes.

## 6. Interface et direction artistique

Schéma, conduites, jauges (§5). Le design parlait de câbles : ici, ce sont des conduites ([bible](../bible.md), § 4). La réalisation est l'objet de [#83](https://github.com/DavidGiangiacomo/strates/issues/83) ; le son, de [#97](https://github.com/DavidGiangiacomo/strates/issues/97).

- **Disposition** :
  - **le plan**, au centre et au plus grand : les sources en haut, la ville en bas, les bassins entre les deux. Les conduites posées sont des traits d'autant plus épais que leur calibre est fort, où l'eau coule visiblement. Les tracés libres sont en pointillés ;
  - **les jauges**, sur chaque bassin : une colonne graduée, son niveau de service, son bord, et le déversoir qui coule au-dessus ;
  - **le regard**, sous la conduite qu'on survole ou qu'on choisit : son débit, son calibre, sa vanne, et les deux gestes, élargir et relier, avec leur prix ;
  - **le carnet de relevés**, à droite : ses dernières lignes, la plus récente en haut ;
  - **la ville**, en bas, avec son compteur, et la provision.
- **Palette** : la pierre claire d'un mur de bassin, un calcaire chaud ; le gris du plomb pour les conduites ; l'eau en bleu clair ; les jauges sur un émail blanc, en chiffres noirs ; l'écume blanche du déversoir. Pas de couleur d'alarme : un goulot se dit par l'écume et par le carnet. Ni le papier gris-vert, le graphite et le vermillon de l'atelier, ni l'argile et le rouge de la dette, ni le bleu nuit du chœur. À vérifier avec [#83](https://github.com/DavidGiangiacomo/strates/issues/83), contre la surface surtout : c'est l'autre strate claire.
- **Typographie** : une italique à la plume pour les légendes du plan et le carnet (Palatino, sinon une italique à empattements). Les chiffres sont à chasse fixe, alignés en colonne, comme dans un carnet réglé. Les longs nombres doivent se lire d'un coup d'œil : le point des milliers y aide.
- **Mouvement** : l'eau coule le long des conduites, d'autant plus vite qu'elles sont chargées. Une jauge monte et descend en douceur. Rien d'autre ne bouge.
- **Sons** :
  - l'eau dans les conduites : un ruissellement continu, plus large à mesure que la ville reçoit ;
  - un bassin qui monte : l'eau qui s'agite ;
  - le déversoir : une chute ;
  - une vanne : un grincement de métal, d'un cran par quart ;
  - une conduite posée ou élargie : de la pierre et du plomb ;
  - le carnet : une plume ;
  - la citerne en service : un bourdon grave, tenu. C'est le chœur dessous, et rien ne le dit.

  Pas de musique.
- **Jouable sans le son.** Le son ne dit rien que le plan ne montre.
- **Accessibilité** :
  - *clavier* : la tabulation passe de nœud en nœud, puis aux conduites ; Entrée ouvre le regard ; E élargit, R relie, et V fait tourner la vanne d'un quart ;
  - *couleurs* : aucune information ne tient à la teinte seule. Une conduite pleine est dessinée en double trait, et un bassin qui monte porte une flèche ;
  - *moins de mouvement* : l'eau ne coule plus, et des hachures fixes disent qu'elle passe ;
  - *lecteurs d'écran* : un nœud se lit en mots (« Bassin haut, monte, deux sorties pleines »), une conduite aussi (« Conduite 9, 256.000.000.000 pouces sur 1.000.000.000.000, vanne ouverte »). Chaque ligne du carnet s'annonce quand elle s'écrit.
- **Ce qui la distingue** : la seule strate où la production passe par un réseau, et où le plus faible décide de tout. C'est aussi la seule en pouces et en muids.
- **À l'écran de fouille** : l'eau reçue par la ville, en muids, en chiffres à chasse fixe sur la pierre claire (`apparenceValeur`).

### Dans le code ([#69](https://github.com/DavidGiangiacomo/strates/issues/69))

La vue est un schéma sobre, en attendant la direction artistique ([#83](https://github.com/DavidGiangiacomo/strates/issues/83)) : `vue/Vue.svelte`, et le dessin du plan dans `vue/plan.ts`.
- **En haut** : la provision, ce que reçoit la ville et le compteur.
- **Le plan** : les sources, les bassins et leurs jauges, et la ville.
  - Les conduites posées s'épaississent avec leur calibre, et une conduite pleine porte un double trait.
  - Les tracés libres sont en pointillés, avec leur numéro et leur prix. Un clic, ou Entrée, pose la conduite.
  - Un bassin qui monte porte une flèche et se dit aux lecteurs d'écran.
- **Le regard** d'une conduite donne son débit sur son calibre, « élargir » avec son prix, et sa vanne, en cinq positions.
- **Le carnet de relevés** met sa ligne la plus récente en haut, et les lecteurs d'écran l'entendent.
- **Sur un téléphone**, le plan garde une taille lisible et défile en largeur, sans élargir la page.
- **Comme l'atelier**, le réseau n'est inscrit au registre qu'en développement. Les outils de développement y sautent, ou juste avant la dernière source.

## 7. Opacité et Compréhension

Au mieux, le joueur arrive avec κ = 38. Les joueurs automatiques de l'atelier y arrivent avec 28 s'ils ont gardé leurs objets, et 34 s'ils n'en ont jamais emporté ([`comprehension.md`](../comprehension.md), § 8). Le délai de levée vaut alors de 10 à 12 minutes. Le graphe de dépendances et les formules ne paraissent pas : il faut κ = 50 (plus bas).

- **Jamais caché** : l'eau, les conduites et leurs calibres, les jauges, les déversoirs, les nombres et les prix. Tout ce dont dépend le seuil se voit.
- **Jamais montré** sans un objet : le débit plein d'une source qui n'est pas reliée. Ce n'est pas une opacité, mais l'inconnu de la strate.

| Élément opaque | À l'arrivée | Levé par l'usage | Par un objet | Délai |
|---|---|---|---|---|
| les noms du plan : source, bassin, conduite, citerne, ville | des glyphes, sur le plan et dans le carnet | le premier goulot réparé : un bassin qui redescend | le regard qui grossit, le cahier à lignes | oui |
| les unités : le pouce, la ligne, le muid | les nombres, suivis d'une marque sans nom | le premier regard ouvert | le regard qui grossit, le cahier à lignes | oui |
| le rôle de la vanne | la vanne se dessine, sans légende ni ligne au carnet | la première vanne réglée | le regard qui grossit | oui |
| le goulot | au carnet, le mot en glyphes : la conduite est nommée, pas ce qu'elle a | le bassin du premier signal qui redescend | le regard qui grossit | oui |

**Les actes de compréhension propres**, 10 points sur les 17 du barème ([`comprehension.md`](../comprehension.md), § 2) :

| Acte | Définition | Poids |
|---|---|---|
| Le goulot avant le signal | une source ou un bassin qui montait cesse de monter juste après un geste du joueur, avant que son déversoir ne coule. Le geste peut être une conduite élargie ou reliée, ou une vanne réglée | 5 |
| La route avant la source | la route d'un bassin jusqu'à la ville (6, 9 ou 13) reliée avant la première source qui s'y jette (la 3, la 4 ou la 6) | 3 |
| Au plus juste | au seuil, aucune conduite ouverte ne porterait son eau avec un calibre de moins. Les conduites fermées ne comptent pas | 2 |

- S'y ajoutent les deux actes génériques, sans aide (4) et sans artefact (3).
- **Le goulot avant le signal** est le modèle de la famille ([`comprehension.md`](../comprehension.md), § 2) : trouver le goulot avant que le jeu ne le signale. Le joueur a deux à trois minutes pour le voir monter, et il doit chercher en aval.
- **La route avant la source** demande de savoir, avant l'eau, qu'une source nouvelle passera par sa propre route. C'est l'acte de qui a compris le calibre le plus fort.
- **Au plus juste**, « ni plus ni moins » ([bible](../bible.md), § 4) : le joueur n'a jamais élargi une conduite pour rien. Celui qui brute-force le manque, et le joueur qui apprend aussi, s'il a élargi la conduite de la source 1 pendant ses premières minutes.
- **En simulation**, le joueur naturel accomplit le goulot avant le signal et le seuil au plus juste. Le prévoyant accomplit les trois actes, et le joueur qui apprend, le premier seulement.

**Le graphe de dépendances** : les sources reliées alimentent leurs bassins, les bassins s'alimentent les uns les autres par les raccourcis, et les routes alimentent la ville. Il ne montre que ce qui est relié, ce que l'architecture demande d'une strate dont le jeu est un graphe ([`comprehension.md`](../comprehension.md), § 5) : les tracés libres n'y sont pas, et le graphe ne dit pas où l'eau bute. **Dans une vraie partie, il ne paraît jamais dans le réseau.** κ ne monte qu'à la descente, et vaut 38 au plus à l'arrivée ; le graphe paraîtra dans le chœur, au mieux. Les outils de développement le montrent.

**Les formules**, de la plus simple à la plus profonde :
1. la ville : un pouce verse un muid par minute ;
2. une conduite : le calibre n porte 10ⁿ pouces ;
3. une source : elle double toutes les deux minutes et demie, du mille vingt-quatrième jusqu'à son plein ;
4. un bassin : l'eau se partage à parts égales, et une conduite pleine laisse le reste aux autres ;
5. un bassin : une vanne ouverte d'un quart laisse passer le quart du calibre ;
6. un bassin : il tient deux minutes de ce que ses conduites emportent ;
7. la ville : le calibre n coûte 2,4 × 10ⁿ⁻¹ muids, trois fois plus sur les routes lointaines ;
8. la ville : la valeur convertible, toute l'eau reçue.

## 8. Artefacts reçus

Les objets de l'atelier sont **puissants**, ceux des caves **utiles**, ceux de la surface **décoratifs**. Les catalogues sont dans [`artefacts.md`](../artefacts.md), § 8 ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)), et leurs effets seront codés par [#84](https://github.com/DavidGiangiacomo/strates/issues/84). Ce sont des pièces du réseau, nommées par ce qu'elles font au flux ([bible](../bible.md), § 6) : « la vanne qui compte », « la roue qui retient ».

| Famille d'effet | Réception dans le réseau |
|---|---|
| multiplicateur | **levier principal `debit`** : le débit de toutes les sources × m. **Levier secondaire `pose`** : le prix des conduites ÷ m, pour les poser comme pour les élargir. Ils s'éveillent à la première source reliée : l'arrivée est la même avec ou sans objets |
| affichage | le débit plein des sources, écrit sur le plan avant qu'on les relie : de toutes pour un objet puissant, de la prochaine pour un objet utile. **Jamais un goulot** : un affichage ne dit rien de ce que le réseau portera |
| raccourci | les noms, les unités et les rôles levés à l'arrivée (§ 7) ; les noms et les unités seulement, pour un objet utile |
| unique | au seuil, une fois |

**Les objets de l'atelier, puissants, et ceux des caves, utiles :**

| Objet | Venu de | Effet dans le réseau |
|---|---|---|
| la roue qui retient | l'atelier | levier `debit` × 1,5 |
| le collier qui serre | l'atelier | levier `pose` : les conduites coûtent 1,5 fois moins cher |
| la vanne qui compte | l'atelier | le débit plein de chaque source, écrit sur le plan avant qu'on la relie |
| le regard qui grossit | l'atelier | les noms, les unités et les rôles, levés à l'arrivée |
| la conduite qui chante | l'atelier | au seuil, on entend une fois dans les conduites le bourdon du chœur, et la citerne le reprend |
| la roue de pierre | les caves | levier `debit` × 1,25 |
| la lame courbe | les caves | levier `debit` × 1,15 |
| la roue peinte | les caves | le débit plein de la prochaine source, écrit avant qu'on la relie |
| le cahier à lignes | les caves | les noms et les unités, levés à l'arrivée |
| le fil qui descend | les caves | au seuil, sous les bassins, la moitié d'un tracé paraît : une voûte |

**Pourquoi le débit des sources.** Plus d'eau ne sert que si le réseau la porte : sinon, elle déborde. Le levier aide qui répare, sans réparer à sa place. En simulation, il raccourcit peu la strate. C'est le prix des conduites qui fait gagner du temps.

| Multiplicateurs | aucun | débit × 1,25 | débit × 2,16 | jeu correct : débit × 2,16, pose ÷ 1,5 | au plafond : débit × 2,67, pose ÷ 1,5 |
|---|---|---|---|---|---|
| joueur naturel | 2 h 29 | 2 h 26 | 2 h 19 | 2 h 10 | 2 h 10 |
| joueur prudent | 3 h 09 | 3 h 01 | 2 h 56 | 2 h 19 | 2 h 18 |
| joueur prévoyant | 2 h 29 | 2 h 25 | 2 h 25 | 2 h 13 | 2 h 12 |

- **Durée** : avec les objets d'un jeu correct, le joueur naturel finit en 2 h 10 au lieu de 2 h 29.
- **Le débit seul** fait gagner peu de temps : dix minutes à × 2,16, et six au plafond tout entier sur lui, × 4, où le naturel finit en 2 h 23. Plus d'eau, c'est plus de goulots. Il rapporte de l'eau : 2,8 × 10¹⁵ muids au seuil, au lieu de 2,05. Le 22ᵉ point vient alors sept minutes après le seuil, au lieu de vingt et une (§ 9).
- **La pose seule**, au plafond (÷ 4), donne 2 h 10.
- **Les calibres les plus forts laissent de la marge** : même avec le débit au plafond, × 4, chaque bassin garde une route assez large pour ses sources. Avec × 2,16, la source 5 donne 5,5 × 10¹¹ pouces, et la route du haut en porte 10¹³.
- **I2** : 2,16 × 1,5 = × 3,23, sous le plafond. Le noyau plafonne le produit à × 4.
- **I5** : toute la simulation du § 4 est faite sans aucun artefact. Le réseau finit entre 2 h 29 et 3 h 09, sous les 3 h 15.
- **L'éveil** : un objet s'éveille la première fois qu'il agit, et le carnet le note sous son nom d'en bas : « La roue qui retient : en service. ». Les affichages et les raccourcis s'éveillent à l'arrivée, et les multiplicateurs à la première source reliée. L'objet étrange s'éveille au seuil.
- **Les objets de la surface** sont décoratifs : ils se posent au bord du plan, avec leur nom d'en bas, sans rien faire.
- **Les noms d'en bas** sont ceux du catalogue, que donne le réseau (bible, § 6).

## 9. Valeur convertible

- **Toute l'eau reçue par la ville**, en muids : le compteur, qui ne fait que monter. C'est le « total cumulé du Flux acheminé » de D-003. L'eau des déversoirs ne compte pas, et dépenser ne coûte rien.
- **21 points** pour le joueur naturel : ⌊log₁₀(2,05 × 10¹⁵) × 1,4⌋ = 21. Le 21ᵉ point demande 10¹⁵ muids, et le 22ᵉ, 5,2 × 10¹⁵ : 21 minutes de plus au débit plein, ou 7 avec les objets d'un jeu correct.
- **Les points ne dépendent presque pas du jeu.** La dernière source fixe ce que reçoit la ville à la fin, et la montée de vingt-cinq minutes fixe pendant combien de temps. Les 4 points d'un jeu parfait demanderaient 7 × 10¹⁷ muids, soit des dizaines d'heures après le seuil.
- **Le catalogue** : cinq objets, 26 points ([`artefacts.md`](../artefacts.md), § 8). Avec 21 points, la présélection prend le carnet de relevés, la jauge, la vanne maîtresse et la grande conduite (20 points), et le compteur reste en haut. Ces cinq noms d'en haut sont ceux du réseau : le joueur les reconnaît.

## 10. Hors-ligne

**Politique propre, presque standard : « le réseau coule, mais les cinq minutes attendent ».**

- **L'eau coule** pendant l'absence comme ailleurs : 80 % du temps, plafonné à 12 h, au rythme du réseau tel qu'il a été laissé. Les sources reliées continuent de monter. Les bassins débordent si un goulot les attend, et cette eau se perd.
- **La tenue ne compte pas.** Les cinq minutes ne s'écoulent qu'en présence du joueur. Elles ne repartent pas de zéro non plus : elles attendent, sauf si un goulot paraît pendant l'absence.
- **Au retour**, le noyau écrit la durée : « Absence : 8 h 12 min, comptée à 80 %. ». Le réseau ajoute son relevé : « La ville a reçu 1.234.567 muids. », puis, si un bassin a débordé, « Bassin haut : a débordé. ».

**Pourquoi.** Avec la politique standard, il suffirait de réparer le dernier goulot et de fermer l'onglet : le seuil tomberait en l'absence du joueur. Or ces cinq minutes sont la fin du réseau, celle des jauges qui ne bougent plus. Elles se regardent.

**Conséquences** :
- Un onglet caché est une absence pour le noyau : la tenue se joue la page ouverte. C'est la règle du chœur ([fiche](strate-5.md), § 10).
- **Implémentation** : `absence(etat, duree, ctx)` fait couler le réseau par pas d'une seconde, comme la politique standard, sans compter la tenue. Douze heures font 43.200 pas.
- [`architecture.md`](../architecture.md), § 8, hésitait entre une politique standard et une politique propre : sa ligne est corrigée.

## 11. Textes

**Budget : 600 mots** ([bible](../bible.md), § 9) : le carnet de relevés et la légende du plan. La voix est celle du carnet : la vanne, le bassin, le niveau, sans un mot de trop. Les propositions ci-dessous sont pour [#70](https://github.com/DavidGiangiacomo/strates/issues/70).

- **Le carnet** note ce qui change, une ligne par fait :

  | Quand | Ligne |
  |---|---|
  | Une source reliée, puis à plein | « Source 2 : reliée. », « Source 2 : à plein. 4.000 pouces. » |
  | Une conduite posée, ou élargie | « Conduite 5 : posée. », « Conduite 2 : élargie. 1.000 pouces. » |
  | Au calibre le plus fort | « Conduite 2 : au plus large. » |
  | Une vanne | « Vanne 5 : ouverte aux trois quarts. », « fermée », « ouverte d'un quart », « de moitié », « ouverte » |
  | Un bassin qui monte | « Bassin bas : monte. » |
  | Le signal | « Bassin bas : déborde. Conduite 2 : goulot. » |
  | Un bassin qui redescend | « Bassin bas : stable. » |
  | Plus rien ne monte | « Aucun goulot. » |
  | Les six sources à plein, chaque minute | « Aucun goulot depuis 4 minutes. » |
  | Le reste, à la première conduite posée au quatrième bassin | « Quatrième bassin : une salle voûtée. » |
  | La citerne en service | « Citerne qui chante : pleine. » |
  | La grande conduite | « Grande conduite : posée. » |
  | L'éveil d'un objet | « La roue qui retient : en service. » |
- **La légende du plan** : les noms des sources, des bassins, de la citerne et de la ville ; conduite, calibre, vanne, jauge, déversoir, regard ; pouces, lignes et muids.
- **Le regard** : « Conduite 6 : 1.600.000 pouces sur 10.000.000. Vanne ouverte. »
- **L'aide**, la « Notice du réseau » : comment l'eau va des sources à la ville, ce que porte un calibre, comment l'eau se partage, ce que fait une vanne, et ce qu'est un bassin qui monte. Rien sur la fin. Elle ne dit pas « vous ».
- **Le rappel de reprise** ([bible](../bible.md), § 10) : la dernière ligne du carnet, puis l'état du réseau dans sa voix, « Aucun goulot depuis 2 minutes. » ou « Bassin haut : monte. ».
- **Les traces pour le fond** (bible, § 5), trois lignes :
  - le dernier relevé, tel que le joueur l'a laissé : « Vanne 12 : ouverte aux trois quarts. » ;
  - « Aucun goulot depuis 12 minutes. », c'est-à-dire depuis le dernier goulot jusqu'à la descente ;
  - « Citerne qui chante : pleine. ».

  Elles changent avec le parcours : le dernier geste, et le temps que le joueur est resté après le seuil.
- **Les noms d'en bas** des objets de l'atelier sont ceux du catalogue : le regard qui grossit, la vanne qui compte, le collier qui serre, la roue qui retient, la conduite qui chante. Ils comptent dans le budget du réseau.
- **Ce qu'on en attend** : le carnet, la légende et le regard font environ 120 mots, l'aide 150, les noms des objets 20. Il reste de la marge pour la notice et pour les noms des tracés.

## 12. Critère R5

**Avis : le réseau tient comme jeu autonome de deux heures et demie. C'est l'incrémental du maillon le plus faible, à une condition : que le goulot se cherche, et ne se montre pas.**

Ce qui le fait tenir :
- **Un goulot qui se déplace.** Chaque réparation fait paraître le suivant, plus bas ou plus loin. C'est la boucle courte, et elle ne s'use pas, parce que l'eau monte toujours.
- **Une tension à chaque source** : vingt-cinq minutes de montée, où il faut rester devant l'eau.
- **Des choix de forme** : le raccourci, qui coûte moins tout de suite, ou la route, qui ne demande rien plus tard. Puis les vannes, pour corriger ce qu'on a relié trop vite.
- **Une lecture** : les jauges qui montent, le regard, le carnet. Le joueur qui lit trouve le goulot avant le signal.
- **Une fin qui se voit** : les six sources à plein, la grande conduite, les jauges immobiles, la citerne qui chante.
- **Rien de commun avec les autres strates (I1)** : ni générateur à acheter, ni case à remplir, ni saison, ni rapport ; des pouces et des muids.

**La condition** : le plan ne doit jamais désigner le goulot avant le carnet. Les jauges le laissent deviner, et le carnet le nomme, deux à trois minutes plus tard.

**Ce qui le ferait tomber** : un réseau qu'on répare en cliquant sur ce qui est marqué, sans le lire. Ou une attente entre deux sources, si les réparations venaient trop vite et laissaient le joueur sans rien à faire.

**Recommandation** : à la recette ([#111](https://github.com/DavidGiangiacomo/strates/issues/111)), observer si les joueurs cherchent le goulot en aval avant que le carnet ne le nomme, et s'ils comprennent la conduite au plus large et la vanne.

## 13. Questions ouvertes

1. **Le point des milliers** (§ 1) : se lit-il bien, sur quinze chiffres ? Les nombres en entier restent proches des boisseaux des caves ; le point, les pouces et les lignes les en distinguent.
2. **Le muid à la minute** est une convention du jeu, pas une mesure ancienne : le pouce des fontainiers versait bien moins. Faut-il le dire quelque part ? Non, sans doute : aucune couche n'explique ses mesures.
3. **La montée de vingt-cinq minutes** fixe le rythme de la strate. Plus courte, le joueur ne pourrait plus suivre l'eau ; plus longue, il attendrait.
4. **Les vannes** ne servent qu'après un raccourci : le joueur qui relie d'abord les routes n'y touche jamais. Faut-il une autre raison de régler une vanne ?
5. **Le signal nomme le goulot.** Après lui, la réparation est guidée. C'est voulu, et c'est l'acte du § 7 de faire mieux. Mais un joueur qui attend toujours le carnet joue moins bien sans le savoir.
6. **Au plus juste** (§ 7) est presque toujours accompli par qui atteint le seuil sans tâtonner. C'est un acte de 2 points, contre la force brute ; à revoir au playtest.
7. **Le graphe à κ = 50** ne paraît jamais dans le réseau (§ 7). La précaution du design doc reste écrite : le graphe ne montre que ce qui est relié.
8. **Les cinq minutes en présence** : longues, devant des jauges immobiles ? C'est la fin du réseau, et le joueur peut regarder la citerne. Si le playtest les trouve trop longues, le carnet pourrait en dire un peu plus pendant qu'elles passent.
9. **La feuille qui annonce** ([fiche de l'atelier](strate-3.md), § 8) écrit « Vanne 3 : ouverte d'un » : la vanne 3 est celle de la source 2. La ligne est plausible, puisqu'une vanne de source se règle aussi, mais sa source déborde alors. À fixer avec les objets étranges ([#118](https://github.com/DavidGiangiacomo/strates/issues/118)).
10. **La citerne** (§ 2) : le bourdon de la citerne en service, et celui de la conduite qui chante au seuil, doivent annoncer le chœur sans se confondre. À régler avec le son ([#97](https://github.com/DavidGiangiacomo/strates/issues/97)).
11. **Le chœur** ([fiche](strate-5.md), § 5) supposait déjà les réflexes du réseau : chercher le maillon le plus faible, et relever ce qui est bas. Ils y sont. Sa révision ([#63](https://github.com/DavidGiangiacomo/strates/issues/63)) pourra s'appuyer sur cette fiche.
12. **La remontée finale** (§11) : le plan à sec, les jauges à zéro, le carnet ouvert à sa dernière ligne. À décider avec [#128](https://github.com/DavidGiangiacomo/strates/issues/128).
13. **L'éveil des multiplicateurs** à la première source reliée (§ 8) : le code les éveille ainsi ([#69](https://github.com/DavidGiangiacomo/strates/issues/69)). La première simulation les faisait agir dès l'arrivée, où la source 1 débordait aussitôt : elle trouvait 2 h 13 avec les objets, au lieu de 2 h 10.

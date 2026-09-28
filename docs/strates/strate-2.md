# Strate 2 — Les caves

*Fiche de design, issue [#6](https://github.com/DavidGiangiacomo/strates/issues/6). Première version, avant l'équilibrage ([#36](https://github.com/DavidGiangiacomo/strates/issues/36)). Les chiffres viennent d'une simulation grossière de six profils de joueur (§ 4), à refaire avec le simulateur headless ([#23](https://github.com/DavidGiangiacomo/strates/issues/23)).*

*Choix tranchés le 27 septembre 2026 :*
- *le seuil demande trois **grands** hivers de suite sans rupture ;*
- *l'absence ne fait passer aucun hiver : « l'hiver vous attend » ;*
- *les familles s'installent par le joueur, et naissent après un hiver réussi ;*
- *le grain se compte en boisseaux entiers, jamais abrégés.*

*Renvois : « §6 » désigne une section du [design doc](../design-doc.md), « § 6 » une section de cette fiche.*

C'est la strate du test du MVP (§14). Elle doit prouver que le changement de règles est un plaisir et non une frustration. Le § 5 est donc le cœur de cette fiche.

## 1. Identité

| | |
|---|---|
| Verbe | stocker |
| Ressource | Grain |
| Unité et notation | Le **boisseau**, toujours entier et jamais abrégé : « 24 038 boisseaux », « 1 boisseau ». Les milliers sont séparés par une espace fine. Il n'y a ni suffixe, ni décimale, ni notation scientifique. Les débits se comptent par jour (« 312 boisseaux par jour »), et le temps en jours et en années (« jour 214 de l'an 3 »), jamais en secondes. Aucune autre strate ne compte en boisseaux (I1). |
| Ordre de grandeur final | ≈ 10⁶ boisseaux récoltés : de 1,6 à 2,6 × 10⁶ au seuil en simulation. La réserve, elle, ne dépasse pas quelques centaines de milliers. C'est l'échelle basse **exprès** du §9, mille fois sous celle de la surface. |
| Durée cible | 2 h. Le calendrier impose 1 h 51 au plus tôt (§ 4) ; c'est le temps de tous les profils réguliers en simulation. |
| κ à l'entrée → à la sortie | 8 → 22 |

**Le temps.**
- Un jour dure une seconde de jeu, et une année compte 420 jours, soit 7 minutes.
- L'année a une saison chaude (printemps, été, automne, trois tiers égaux) et un hiver.
- L'hiver dure 70 jours de l'an 1 à l'an 4. Il s'allonge ensuite de 10 jours par an, jusqu'à 170 jours à partir de l'an 14 : ce sont les **grands hivers**. La saison chaude raccourcit d'autant.
- Ce **grand cycle** est la boucle longue de la strate.

## 2. La civilisation

Une vallée de paysans, au temps où l'on comptait en récoltes. Elle ne cherchait pas à grandir. Elle cherchait à **ne jamais manquer**. Tout son savoir tenait dans des registres : combien on avait engrangé, combien on avait mangé, et si l'hiver était passé.

Elle optimisait **l'absence de manque**. Son temps était circulaire : la même année revenait, avec seulement des hivers plus longs. Pour garder plus longtemps, elle a creusé : des greniers, puis des silos, puis des caves, puis des caves sous les caves.

Elle a fini par saturation. La vallée était pleine, les caves aussi, et les grands hivers passaient sans rupture. Les registres n'avaient plus rien à noter que « passé sans rupture ». Son dernier geste avait été de creuser plus profond : le joueur le prolonge.

À reprendre dans la bible narrative ([#43](https://github.com/DavidGiangiacomo/strates/issues/43)).

## 3. Boucle courte

La production ne monte pas : elle **oscille**. Chaque saison chaude, la récolte monte puis retombe, et chaque hiver elle s'arrête, alors que les familles mangent toute l'année. Le jeu consiste à **lisser** : garder assez de grain de l'automne pour passer l'hiver, sans en perdre faute de place, et grandir au bon moment.

### Récolte, consommation, réserve

- **Récolte** : `F × 2,8 × O × sin(π d / S)` boisseaux par jour pendant la saison chaude, rien en hiver.
  - F est le nombre de familles ; O le produit des outils (§ 3, « Les outils ») ; d le jour de la saison chaude ; S sa durée (350 jours au début, 250 en grand cycle).
  - Sur une saison, une famille récolte `2,8 × O × 2S/π` boisseaux : 624 × O au début, 446 × O pendant les grands hivers.
- **Consommation** : `F` boisseaux par jour, toute l'année, soit 420 par famille et par an.
  - Sans outils, une famille récolte 1,5 fois ce qu'elle mange au début de la strate, et à peine plus (1,06 fois) pendant les grands hivers : **le grand cycle rend les outils indispensables**.
- **Réserve** : la récolte y entre, et la consommation et les pertes en sortent.
  - Au-delà de la capacité des stockages, le grain qui arrive **déborde** : il est perdu.
  - Si la réserve est vide et que la récolte ne couvre pas la consommation, c'est la **rupture** (la disette).
- **La soudure** : au début du printemps, la récolte reste plus faible que la consommation pendant quelques jours, et l'hiver n'est pas fini tant qu'elle ne la couvre pas. La soudure appartient à l'hiver qui la précède.

### Glaner

Le bouton « Glaner » rapporte `sin(π d / S)` boisseau par clic : 1 au plus fort de l'été, et rien en hiver (« Il n'y a rien à glaner. »).
- Il pèse moins de 10 % de la récolte dans les premières minutes, puis presque rien.
- Il existe pour que le réflexe du clic, appris à la surface, trouve un bouton, et qu'en hiver ce bouton ne donne rien (§ 5).

### Les familles

- **Installer une famille** coûte `25 × 1,08ⁿ` boisseaux, où n est le nombre de familles déjà installées par le joueur.
- **Naissances** : après chaque hiver passé sans rupture, les familles augmentent de 10 %. Les naissances sont gratuites et ne renchérissent pas l'installation.
- **Départs** : chaque jour de rupture, 0,5 % des familles quittent la vallée. Les 8 familles fondatrices restent toujours.
- **La vallée** accueille 250 familles au plus. Pleine, elle refuse les installations et les naissances : « La vallée est pleine. »
- Les familles se comptent en nombre réel (les départs sont fractionnaires), affiché arrondi.

### Les stockages

Le grain remplit d'abord le stockage qui perd le moins : les caves profondes, puis les caves, les silos et les greniers. Chaque stockage perd chaque jour une part du grain qu'il contient.

| Id | Nom | Capacité | Pertes par jour | Sur un hiver de 70 j | Sur un grand hiver | Coût de base |
|---|---|---|---|---|---|---|
| `grenier` | Grenier | 400 | 0,2 % | 13 % | 29 % | 80 |
| `silo` | Silo | 3 000 | 0,1 % | 7 % | 16 % | 900 |
| `cave` | Cave | 20 000 | 0,03 % | 2 % | 5 % | 8 000 |
| `caveProfonde` | Cave profonde | 120 000 | 0,01 % | 0,7 % | 1,7 % | 40 000 |

- Le prochain exemplaire coûte `base × 1,15ⁿ`, où n est le nombre d'exemplaires du même type déjà construits.
- Les grands hivers poussent vers le bas : un grenier y perd près d'un tiers de son grain, une cave profonde presque rien. La strate creuse.

### Les outils

Quatre outils, achetés une fois chacun et dans l'ordre. Chacun multiplie la récolte.

| Id | Nom | Effet | Coût |
|---|---|---|---|
| `faucille` | Faucille | récolte × 1,2 | 150 |
| `fleau` | Fléau | récolte × 1,2 | 1 200 |
| `charrue` | Charrue | récolte × 1,25 | 6 000 |
| `assolement` | Assolement | récolte × 1,25 | 40 000 |

O vaut au plus 2,25. Un stockage ou un outil apparaît quand le cumul atteint la moitié de son coût de base ; l'installation d'une famille est visible dès l'arrivée.

### L'arrivée

An 1, jour 70 : la fin du printemps, avec 8 familles, 250 boisseaux et un grenier. Le premier hiver commence 280 jours plus tard, à 4 min 40 de jeu.

### La marque d'hiver

La jauge de la réserve porte une marque : ce qu'il faut au premier jour de l'hiver pour tenir jusqu'à la fin de la soudure. Elle suppose la consommation actuelle, les pertes des stockages actuels et la durée réelle de l'hiver qui vient.
- Elle monte quand les familles augmentent, et quand les hivers s'allongent.
- Elle **dit toujours la vérité** : aucun hiver n'est plus long que ce qu'elle annonce, et la strate n'a pas d'aléatoire. Le grain manque par imprévoyance, jamais par malchance.

### État et actions, pour la boucle saisonnière ([#25](https://github.com/DavidGiangiacomo/strates/issues/25))

```ts
type IdStockage = "grenier" | "silo" | "cave" | "caveProfonde";

interface EtatCaves {
  reserve: number;                  // boisseaux en réserve (réel, affiché entier)
  cumul: number;                    // tout le grain récolté, glanage compris : la valeur convertible
  familles: number;                 // réel : les départs sont fractionnaires
  installees: number;               // familles installées par le joueur (le prix en dépend)
  stockages: Record<IdStockage, number>;
  outils: number;                   // outils possédés, de 0 à 4, dans l'ordre
  annee: number;                    // 1, 2, …
  jour: number;                     // jour de l'année, de 0 à 420 ; l'hiver occupe la fin
  soudure: boolean;                 // du premier jour du printemps à la fin de la soudure
  bilan: {                          // l'hiver en cours de jugement, jusqu'à la fin de sa soudure
    rupture: boolean;               // la réserve a été vide depuis le bilan précédent
    joursDeRupture: number;
    departs: number;
  };
  hivers: { annee: number; rupture: boolean }[];  // les 20 derniers hivers jugés, pour le calendrier
  serie: number;                    // grands hivers de suite sans rupture
  seuilAtteintA: number | null;     // valeur de `temps` au seuil
  temps: number;                    // secondes simulées depuis l'arrivée, absences comprises
  pertes: { debord: number; pourri: number };
  registre: { cle: string; valeurs: Record<string, number> }[];  // les dernières lignes, à formater par la vue
  historique: { reserve: number[]; achats: number[] };  // tous les 5 jours, sur 3 ans
  multiplicateurs: { recolte: number; conservation: number };  // artefacts, relus à chaque tick
}

type ActionCaves =
  | { type: "glaner" }
  | { type: "installer" }
  | { type: "construire"; stockage: IdStockage }
  | { type: "outil" };             // le prochain outil
```

- **`tick(dt)`** fait avancer le calendrier : récolte, consommation, pertes, débordement et ruptures.
  - Le pas est coupé aux bornes du calendrier : le premier jour de l'hiver, la nouvelle année, la fin de la soudure.
  - La récolte s'intègre exactement sur le pas ; les pertes sont comptées sur la réserve du début du pas.
  - Un pas qui vide la réserve est coupé au moment de la rupture.
- **Le bilan d'un hiver** se fait à la fin de sa soudure, au premier jour où la récolte couvre la consommation. Il écrit une ligne au registre, puis :
  - il applique les naissances, s'il n'y a pas eu de rupture ;
  - il met à jour la série des grands hivers et vérifie le seuil.
- **`pasMax`** vaut 1 s, soit un jour.
- **Les prix** sont arrondis au boisseau : on paie exactement ce qui est affiché.
- La strate n'utilise pas d'aléatoire.
- Un achat impossible (grain insuffisant, vallée pleine, plus d'outil) est ignoré sans erreur. Acheter est permis en toute saison, hiver compris.

## 4. Boucle moyenne et seuil de fouille

### Progression

| Joueur correct | Étape | Contenu |
|---|---|---|
| 0 – 12 min (ans 1 et 2) | L'école des hivers | Hivers de 70 jours. Faucille (1 min), premiers greniers, silo (6 min), fléau (8 min). La première soudure manque de peu. |
| 12 – 35 min (ans 3 à 5) | La vallée se remplit | Charrue (15 min), caves (27 min), assolement (30 min). Les naissances suivent chaque hiver réussi. À partir de l'an 5 (27 min), l'hiver s'allonge. |
| 35 – 94 min (ans 6 à 13) | Le grand cycle | L'hiver gagne 10 jours par an, et la marque monte plus vite que les familles. On construit en bas : première cave profonde à 83 min. La vallée est pleine à la fin de l'an 13 (90 min). |
| 94 – 111 min (ans 14 à 16) | Les grands hivers | Trois hivers de 170 jours, de 2 min 50 chacun. Le seuil tombe au bilan du troisième. |

La boucle moyenne du §3, c'est l'année : 7 minutes, avec au milieu un hiver qui juge ce qu'on a fait de la saison chaude. Le joueur correct fait 157 achats, dont 80 dans les vingt premières minutes, puis de moins en moins. Il ne fait plus aucun achat après 97 minutes (§ 13).

### Le seuil

- **Condition** : trois grands hivers de suite (170 jours) passés sans rupture, soudure comprise.
- **Au plus tôt** : ce sont les hivers des ans 14, 15 et 16. Le seuil tombe à la fin de la soudure de l'an 17, à **1 h 51** de jeu.
- **Si un grand hiver manque** : la série repart de zéro. Manquer le troisième coûte donc trois ans, soit 21 minutes. C'est l'enjeu de la fin de strate.
- **Une fois atteint**, le seuil le reste, même si un hiver manque ensuite.
- **Ce qu'il dit de la civilisation** : elle ne voulait pas le plus de grain, elle voulait ne plus jamais manquer. Trois grands hivers sans rupture, c'est ce que ses registres appelaient n'avoir plus rien à craindre. Ensuite, ils n'ont plus rien à noter.
- **Pas d'accumulation seule (I4)** : le seuil ne regarde ni le cumul ni la réserve moyenne. Il regarde si le grain était là au bon moment.
  - Un joueur qui dépense tout, comme en surface, ne passe pas l'hiver, quelle que soit sa récolte (§ 5).
  - Une vallée qui n'investit pas n'y arrive pas non plus. En simulation, un joueur qui ne construit que des stockages, sans installer de famille ni acheter d'outil, grandit un peu par les naissances, puis manque tous les grands hivers : sans outils, le grand cycle laisse à peine aux familles de quoi manger.
  - Il faut **comprendre la saison** : grandir au printemps, garder à l'automne, et creuser pour les grands hivers.
- **Issues** : une seule.
- **L'objectif n'est jamais affiché comme tel.**
  - Au premier hiver long (an 5), le registre note : « Les hivers s'allongent. Les anciens se souviennent des grands hivers. »
  - Au premier grand hiver : « Le grand hiver est là. Les anciens disent qu'une vallée qui en passe trois de suite n'a plus rien à craindre. »
  - Le registre compte ensuite la série.

### Le calendrier comme minuteur

Le seuil ne peut pas tomber avant 1 h 51, quelle que soit l'habileté du joueur ou la puissance de ses artefacts. C'est voulu : cette strate apprend que le temps est un cycle et ne s'accélère pas. Jouer mieux ne fait pas finir plus tôt. Cela fait passer les hivers sans rupture, grandir davantage, et descendre avec plus de points (§ 9).

### Après le seuil

- Les saisons continuent ; les grands hivers aussi.
- Le registre n'a plus rien à noter, sauf une rupture : c'est la saturation.
- Rester rapporte peu : un point de plus en 10 minutes, puis aucun en deux heures (§ 9).

### Le bouton « creuser »

- C'est le bouton de fouille du bandeau commun, comme partout. Avant le seuil, le sol résiste, et rien dans la strate ne le mentionne.
- **Filet** : si le joueur n'a pas creusé 5 minutes après le seuil (en temps de strate), une fissure apparaît dans la coupe des stockages (§ 6). Elle part du fond de la cave la plus profonde et monte en 2 minutes vers le bouton du bandeau, sans texte ni blocage. En attendant la coupe ([#33](https://github.com/DavidGiangiacomo/strates/issues/33)), elle part de la jauge de la réserve. Le délai, la durée et le tracé sont communs aux strates : `src/noyau/logique/filet.ts` et `src/noyau/ui/fissure.ts`.
- C'est le même principe qu'à la surface, dans le décor des caves ; les constantes sont les mêmes, à régler au playtest.

### En simulation

Six profils de joueur automatiques jouent la strate. Le script est en Python, dans le brouillon de l'issue ; le simulateur headless ([#23](https://github.com/DavidGiangiacomo/strates/issues/23)) le remplacera.
- Tous les profils réguliers suivent une prévision : ils ne dépensent que ce qui laisse, au pire moment d'ici la fin de la prochaine soudure, une marge de 30 jours de consommation (90 pour le prudent).
- Le joueur réflexe dépense tout, dès qu'il peut, comme en surface.
- La simulation juge chaque hiver sur l'année civile, et non de soudure à soudure comme le § 3. Le seuil ne s'en trouve décalé que de quelques jours.

| Profil | Jeu | Seuil | Points | Première rupture |
|---|---|---|---|---|
| réflexe | dépense tout dès qu'il peut ; 4 clics/s | jamais | 7 à 20 min | 4 min 30 |
| apprend | réflexe jusqu'à 6 min, puis correct | 111 min | 8 | 4 min 30 |
| correct | prévision, marge de 30 jours ; passe toutes les 5 s, puis 20 s | 111 min | 8 (2,6 × 10⁶) | 6 min (première soudure, 17 jours) |
| distrait | prévision, marge de 30 jours ; passe chaque minute | 111 min | 8 (2,6 × 10⁶) | 6 min |
| prudent | prévision, marge de 90 jours ; passe chaque minute | 111 min | 8 (1,6 × 10⁶) | 27 min |
| minimal | ne construit que des stockages : ni familles installées ni outils | jamais | 7 à 4 h | 104 min (deuxième grand hiver) |

**Fragilité** : le calibrage de départ est serré. Avec une récolte de 2,5 au lieu de 2,8 par famille, les profils qui n'investissent pas assez tôt s'enfoncent jusqu'aux seules familles fondatrices. Avec 2,7, c'est encore le cas du prudent. À surveiller à l'équilibrage (§ 13).

## 5. Le choc d'arrivée

Le joueur arrive de la surface. Là-haut, il a appris trois réflexes :
- **la courbe monte** ;
- **acheter dès qu'on peut** est toujours juste ;
- **cliquer** rapporte.

Les caves les prennent tous les trois à contre-pied, dans cet ordre.

### Ce qu'il fait

1. **Il achète tout.** Le bouton « Installer une famille » est le « poste » de la surface : pas cher, rentable. Le joueur installe des familles aussi vite que le grain arrive. C'est juste au printemps, et le jeu le récompense : la récolte grimpe.
2. **Il clique.** « Glaner » rapporte, au début.
3. **Il achète le gros objet dès qu'il est abordable.** La réserve culmine à l'automne, puisque la récolte de l'été s'y est accumulée. C'est donc à l'automne que les gros achats deviennent abordables : le fléau, puis la charrue. En simulation, le joueur réflexe achète la charrue au jour 241 : la réserve passe de 6 325 à 325 boisseaux, et il continue d'installer des familles avec le reste.
4. **La récolte tombe sous la consommation.** C'est la fin de l'automne, vers 4 min 30. La réserve est vide, et la disette commence dix secondes avant l'hiver.
5. **L'hiver dure 70 jours.** « Glaner » ne donne rien. Chaque jour, des familles partent : un tiers de la vallée à la fin de l'hiver.

### Pourquoi ça échoue

À la surface, « abordable » voulait dire « à acheter ». Ici, **le grain est à la fois la monnaie et la nourriture**, et il est le plus abondant juste avant d'en avoir le plus besoin. Le réflexe de la surface vide la réserve au pire moment. La grammaire des caves est l'inverse : **acheter au printemps, stocker à l'automne**. Le joueur correct achète ses outils en été (entre 40 et 56 % de la saison) ; le joueur réflexe achète la charrue en automne (69 %).

### Comment il le comprend

- **Tout était visible.** La marque d'hiver était sur la jauge depuis l'arrivée, et la réserve ne l'a jamais atteinte.
- **La courbe le montre.** La courbe de la réserve porte une encoche à chaque achat. En bas de l'écran, le joueur voit la courbe monter tout l'été, puis tomber d'un coup au jour de la charrue, puis toucher zéro.
- **Le registre le dit, sobrement.** « Hiver de l'an 1 : le grain a manqué 81 jours. 18 familles sont parties. »
- **Le calendrier montre le prochain hiver.** Il est à une rotation du premier, et il a la même longueur.

### Pourquoi c'est agréable, pas frustrant

- **L'échec ne coûte presque rien.** Les familles fondatrices restent, rien n'est remis à zéro, et le seuil ne compte que les grands hivers, dix ans plus tard. Les hivers des ans 1 à 13 sont une école, et le jeu ne note pas les copies.
- **La correction est immédiate et récompensée.** Le printemps suivant, la récolte revient avec la charrue achetée, et le joueur n'a qu'à garder son grain au-dessus de la marque. L'hiver suivant, à 11 min 40, passe. Le registre écrit « passé sans rupture », et des familles naissent : la récompense arrive au moment précis de la compréhension.
- **Le joueur change de grammaire en une année**, soit 7 minutes. En simulation, le profil qui apprend à 6 minutes atteint le seuil en même temps que le joueur correct, avec les mêmes points.
- **La découverte continue.** Une fois l'hiver compris, le grand cycle renouvelle le problème : les hivers s'allongent, les greniers ne suffisent plus, il faut creuser.

### Le test du MVP

Le §14 demande : « au bout de dix minutes dans la strate 2, le joueur essaie-t-il de jouer comme en strate 1 ? » Il aura vu deux hivers : le premier à 4 min 40, le deuxième à 11 min 40. Le premier lui montre que ça ne marche pas. Le deuxième lui laisse le prouver autrement.
- Le protocole ([#37](https://github.com/DavidGiangiacomo/strates/issues/37)) doit observer le moment entre la première rupture et le premier hiver réussi, et demander au joueur ce qu'il a compris.
- Le storyboard du passage ([#11](https://github.com/DavidGiangiacomo/strates/issues/11)) doit amener le joueur au jour 70, pas plus tard : il lui faut une saison chaude entière avant le premier hiver.
- Les objets emportés de la surface ne changent pas l'économie du premier hiver : leurs multiplicateurs ne s'éveillent qu'à son bilan (§ 8). Seuls l'affichage et le raccourci peuvent le rendre plus lisible, et c'est voulu.

## 6. Interface et direction artistique

Bois, registres, calendrier circulaire (§5). Tout ce que la surface n'était pas : pas de cartes arrondies, pas de tableau de bord, pas de logiciel. La réalisation est l'objet de [#33](https://github.com/DavidGiangiacomo/strates/issues/33).

- **Palette** :
  - des bruns de bois, l'ocre du blé, l'encre brun-noir sur un papier de registre ;
  - l'hiver refroidit tout l'écran vers un gris bleuté, par une transition lente sur quelques jours, et le printemps le réchauffe.
  - Aucune couleur de la surface : ni blanc cassé, ni bleu-vert.
- **Typographie** : une serif humaniste de système, à chiffres elzéviriens pour le registre. La jauge et les prix utilisent des chiffres alignés. Rien n'est en capitales, et il n'y a pas d'icônes.
- **Disposition** :
  - **Le calendrier circulaire**, à gauche, occupe la place que le graphique avait au centre de la surface. Le disque intérieur est l'année : trois tiers de saison chaude et l'arc de l'hiver, à sa vraie longueur, avec une aiguille qui tourne d'un jour par seconde. L'anneau extérieur est le grand cycle : un segment par année passée, où l'arc de l'hiver est dessiné et marqué d'un trait s'il a manqué. Les années futures ne sont pas dessinées.
  - **La coupe des stockages**, au centre, sert de jauge : une coupe du sol de la vallée, avec les greniers au-dessus, puis les silos, les caves et les caves profondes dessous. Le grain la remplit par le bas, puisque les caves profondes se remplissent d'abord. La marque d'hiver y est un trait horizontal. Construire un stockage l'ajoute à la coupe, et plus on construit, plus on creuse.
  - **Le registre**, à droite : un livre de comptes. En tête, les achats, présentés comme des écritures (« Installer une famille — 31 boisseaux »). En dessous, les dernières lignes de la chronique.
  - **La courbe de la réserve**, en bas : les trois dernières années, en échelle linéaire, avec une encoche à chaque achat. C'est une sinusoïde, là où la surface avait une exponentielle.
- **Mouvement** : lent. L'aiguille tourne en continu et le grain coule dans la coupe. Rien ne défile par à-coups.
- **Sons** (phase 2, [#46](https://github.com/DavidGiangiacomo/strates/issues/46)) : du grain versé, du bois, et le vent en hiver. Le MVP peut être muet.
- **Ce qui la distingue** : c'est la seule strate où le temps est un cercle visible. C'est aussi la première où l'écran n'est pas un logiciel.

## 7. Opacité et Compréhension

On ne cache jamais le calendrier ni la marque d'hiver : ce sont les deux informations dont dépend le seuil, et le grain doit manquer par imprévoyance, pas par ignorance. L'opacité porte sur le **sens** des choses, qu'on apprend en vivant une année.

- **Opaque à l'arrivée** :
  - la marque d'hiver est un trait sur la jauge, sans légende. Elle prend son nom (« marque d'hiver ») au premier bilan ;
  - les pertes des stockages ne sont pas affichées. Le registre les révèle au premier bilan (« 212 boisseaux ont pourri dans les greniers. »), puis le taux de chaque stockage s'affiche ;
  - le grand cycle : les années futures ne sont pas dessinées. On découvre en l'an 5 que l'hiver s'allonge ;
  - les naissances ne sont annoncées qu'au premier bilan réussi.
- **Actes de compréhension** : des propositions, car le barème appartient à [#44](https://github.com/DavidGiangiacomo/strates/issues/44). Ensemble, ils couvrent les 14 points de κ prévus (§9).
  - Atteindre le seuil sans consulter l'aide (l'acte générique du §8).
  - Passer le premier hiver sans rupture, soudure comprise : ne pas avoir eu besoin d'échouer.
  - Une année entière sans achat en automne et sans rupture : la grammaire « acheter au printemps, stocker à l'automne ».
  - Passer le premier grand hiver au premier essai : avoir anticipé le grand cycle.
  - Atteindre le seuil au plus tôt, à la fin de l'hiver de l'an 16 : aucun grand hiver manqué.
- **Graphe de dépendances** :
  - Les familles et les outils alimentent la récolte, modulée par la saison.
  - La réserve reçoit la récolte ; elle perd la consommation des familles et les pertes des stockages, et sa capacité est bornée par les stockages.
  - La marque d'hiver compare la réserve à l'hiver qui vient.
  - Le bilan de l'hiver renvoie aux familles, par les naissances et les départs.
- **Formules exposées** : celles du § 3 (récolte, consommation, pertes, marque d'hiver).

## 8. Artefacts reçus

Seuls les artefacts de la surface peuvent être actifs ici, et ils sont **puissants** (effet entier). Aucune strate n'est au-dessus d'eux, donc aucun n'est utile ni décoratif. Un jeu correct en emporte 5 sur 6. Leur catalogue est dans [`artefacts.md`](../artefacts.md), § 8 ([#10](https://github.com/DavidGiangiacomo/strates/issues/10)) ; leur réception est l'objet de [#34](https://github.com/DavidGiangiacomo/strates/issues/34).

| Famille d'effet | Réception dans les caves | Objets de la surface |
|---|---|---|
| multiplicateur | **levier principal `recolte`** : la récolte et le glanage × m. **Levier secondaire `conservation`** : la capacité de tous les stockages × m. **À partir du bilan du premier hiver** (voir plus bas). | les bras en plus (récolte × 1,2), la roue chaude (récolte × 1,5), le grenier d'ailleurs (conservation × 1,5) |
| affichage | dès l'arrivée | l'armoire qui compte les hivers : l'anneau du grand cycle dessine d'avance les années à venir, avec la longueur de leurs hivers |
| raccourci | dès l'arrivée | les deux fenêtres : la marque d'hiver porte son nom, et les pertes des stockages sont affichées (§ 7) |
| unique | au seuil | la feuille qui annonce : le registre écrit une ligne de plus, d'une autre main, une ligne de l'atelier |

**L'éveil au premier hiver.** Les multiplicateurs ne s'éveillent qu'au bilan du premier hiver, et le registre le note, un objet par ligne : « Les familles ont compris la roue chaude. » Avant, les objets d'en haut sont là, mais personne ne sait s'en servir. C'est ce qui protège le choc d'arrivée (§ 5). Simulé dans le code du jeu, un joueur réflexe qui achète les familles au meilleur rendement passerait les deux premiers hivers sans disette si les cinq objets d'un jeu correct agissaient dès l'arrivée (récolte × 1,8, conservation × 1,5) : il ne manquerait le premier hiver qu'avec des objets bien plus faibles, vers récolte × 1,2. Avec l'éveil, le premier hiver se joue comme sans artefact ; les objets aident ensuite à s'en relever. C'est aussi ainsi que le joueur apprend le nom d'en bas de ses objets.

- **Aucun artefact ne raccourcit la strate** : le calendrier en impose la durée (§ 4). Un artefact rend les hivers plus sûrs et la vallée plus grande. Il rapporte donc des points, pas du temps : en simulation, avec les cinq objets d'un jeu correct, le seuil tombe toujours à 1 h 51, avec 9 points au lieu de 8.
- **I2** : le noyau plafonne le produit des multiplicateurs à × 4. Même à × 4 sur la récolte, le cumul ne gagne qu'un point de fouille au plus (log₁₀ 4 × 1,4 ≈ 0,8).
- **I5** : toute la simulation du § 4 est faite **sans aucun artefact**. La strate se termine en 1 h 51, sous les 3 h 15.
- Les effets uniques ne doivent pas toucher au calendrier : ni hiver raccourci, ni année accélérée. Ce serait le seul moyen de contourner I5 par le haut et le sens de la strate par le bas.

## 9. Valeur convertible

- C'est le **cumul du grain récolté** dans la strate, glanage compris, y compris le grain qui a débordé ou pourri. Ni les achats ni les pertes ne le diminuent (D-003).
- En simulation, le cumul au seuil vaut de 1,6 à 2,6 × 10⁶ boisseaux pour tous les profils réguliers : **8 points** (il en faut de 5,2 × 10⁵ à 2,7 × 10⁶). Un joueur qui a raté ses premiers hivers descend avec les mêmes points qu'un joueur prudent.
- Rester après le seuil rapporte peu. En simulation, le joueur correct gagne 1 point en 10 minutes (9 points), puis plus rien en deux heures : le 10ᵉ demande 1,4 × 10⁷ boisseaux.
- Pour le catalogue : le budget de 8 points correspond au catalogue indicatif de la strate 2 ([`artefacts.md`](../artefacts.md) : 5 objets, 13 points au total). Le joueur laisse donc un ou deux objets en bas.

## 10. Hors-ligne

**Politique propre : « l'hiver vous attend ».** Elle répond à la question laissée ouverte par [`architecture.md`](../architecture.md), § 9 : **aucune rupture ne peut arriver pendant l'absence**, et l'absence ne peut donc pas faire perdre le seuil.

- **Pendant la saison chaude**, l'absence compte comme ailleurs, à 80 %. Le temps compté fait avancer le calendrier, avec récolte, consommation et pertes normales. Il s'arrête :
  - au **premier jour de l'hiver** ;
  - ou à la veille d'une rupture, si elle venait avant.
- **En hiver**, l'absence ne compte pas : le calendrier s'arrête.
- **Pas de plafond** : une saison chaude dure au plus 350 jours, soit moins de 6 minutes. Une nuit d'absence ne fait donc jamais passer plus d'une saison.
- **Au retour**, le résumé de la strate dit où en est l'année. Par exemple : « Pendant votre absence (8 h) : la récolte a continué jusqu'aux premiers froids. L'hiver vous attend. »

**Pourquoi.** Un hiver est une épreuve, et il se joue en présence du joueur. Si l'absence pouvait faire passer un hiver, elle pourrait faire perdre la série des grands hivers sans que le joueur puisse réagir. Pire, elle pourrait la faire gagner sans qu'il la joue.

**Conséquences** à connaître :
- **La strate ne se joue pas en arrière-plan.** Un onglet caché est une absence pour le noyau (`SEUIL_ABSENCE`), donc chaque hiver se joue la page ouverte : environ 31 minutes d'hiver sur les 111 de la strate. Le reste peut passer hors ligne, une saison à la fois.
- La durée réelle ne peut pas descendre sous 1 h 51 : le temps d'absence compte à 80 %.
- **Implémentation** : `absence(etat, duree, ctx)` simule jour par jour, au plus 350 jours, et rédige le résumé.
- **Journal** : le noyau compte l'absence entière comme temps hors ligne (§ 13).
- **Remontée finale** (§11) : à décider avec la fin « Remonter » ([#128](https://github.com/DavidGiangiacomo/strates/issues/128)).

## 11. Textes

- **Budget** : environ 600 mots. La rédaction est l'objet de [#17](https://github.com/DavidGiangiacomo/strates/issues/17), d'après la bible narrative ([#43](https://github.com/DavidGiangiacomo/strates/issues/43)).
- **Ton** : celui d'un registre de village. Des phrases courtes, datées, constatées plutôt que racontées, sans émotion affichée : « Hiver de l'an 3 : passé sans rupture. 6 familles sont nées. » Le registre ne s'adresse jamais au joueur.
- **À écrire** :
  - les noms et une ligne de description des 4 stockages et des 4 outils ;
  - les libellés : réserve, marque d'hiver, familles, « Glaner », « Installer une famille », « Construire », les saisons, « jour N de l'an N » ;
  - les lignes du registre :
    - le bilan d'un hiver, avec ou sans rupture, avec les naissances ou les départs ;
    - les pertes révélées, la vallée pleine, les hivers qui s'allongent ;
    - le premier grand hiver, la série, le seuil ;
    - l'éveil des objets d'en haut (« Les familles ont compris la roue chaude. »), et la ligne de l'atelier qu'écrit la feuille qui annonce ;
  - le résumé d'absence (§ 10) ;
  - l'aide de la strate : une page courte, écrite comme une page du registre, qui décrit le calendrier, la réserve et les stockages, et ne dit rien du bandeau.
- **Traces laissées au fond** (strate 8) : trois lignes du registre au plus. Par exemple la dernière ligne écrite, le nombre d'hivers passés sans rupture, et la profondeur de la cave la plus basse.
- **Aucun texte ne mentionne « creuser »**, bien que la civilisation n'ait fait que ça.

## 12. Critère R5

Les caves doivent tenir seules, comme un petit jeu de gestion agricole de 2 heures. Ce qui les fait tenir :
- **une tension qui revient** : chaque automne pose la même question (combien garder ?), avec une réponse différente chaque année, puisque les familles augmentent et que l'hiver s'allonge ;
- **un arc lisible** : l'école des hivers, la vallée qui se remplit, le grand cycle, puis les trois grands hivers, dont l'enjeu est réel (21 minutes si le troisième manque) ;
- **une fin qui est une vraie fin** : la saturation, la vallée pleine et le registre qui n'a plus rien à noter ;
- **un geste d'agriculture et non d'usine** : garder, et pas seulement produire.

**Le point faible** est la dernière demi-heure. En simulation, le joueur correct ne fait plus que 4 achats après 80 minutes, et son dernier achat tombe à 97 minutes. Les grands hivers occupent le joueur (on les regarde passer), mais on n'y décide plus rien. C'est la première question de l'équilibrage ([#36](https://github.com/DavidGiangiacomo/strates/issues/36)) ; voir § 13.

## 13. Questions ouvertes

1. **La fin de strate sans décision** (§ 12). Pistes pour [#36](https://github.com/DavidGiangiacomo/strates/issues/36), dont les trois premières sont compatibles avec la marque d'hiver :
   - une vallée plus grande, qui se remplit plus tard ;
   - des améliorations de conservation (chats, jarres, chaux), qui divisent les pertes et se paient en fin de strate ;
   - des caves profondes rendues nécessaires aux grands hivers ;
   - le rationnement (question 2).
2. **Le rationnement** : un levier d'hiver qui réduit la consommation, au prix des naissances. Il donnerait une réaction au joueur qui revient au premier jour d'un hiver mal préparé, et une décision pendant les grands hivers. Il est écarté de la première version, pour garder l'hiver comme un jugement de la saison chaude.
3. **Le rythme des départs** : 0,5 % par jour de rupture, avec 8 familles fondatrices qui ne partent jamais. C'est assez dur pour qu'on le sente (un tiers de la vallée sur un hiver raté), assez doux pour qu'on s'en relève en une année. À régler au playtest ([#37](https://github.com/DavidGiangiacomo/strates/issues/37)).
4. **La marge du calibrage de départ** (§ 4, « Fragilité ») : une récolte à peine plus faible fait s'effondrer les profils trop prudents. À élargir si le playtest montre des joueurs qui n'osent pas investir.
5. **Le temps hors ligne des politiques propres** : le noyau compte l'absence entière dans le journal, même quand la strate n'en utilise qu'une partie (§ 10). À trancher pour la coupe, avec les strates 6 et 7.
6. ~~**Les effets des artefacts de la surface**~~ : choisis par [#10](https://github.com/DavidGiangiacomo/strates/issues/10) (§ 8), à coder dans [#34](https://github.com/DavidGiangiacomo/strates/issues/34). Reste à vérifier au playtest que l'éveil au premier hiver se comprend.
7. **La remontée finale** (§ 10) : à décider avec [#128](https://github.com/DavidGiangiacomo/strates/issues/128).
8. **Le premier jour** : le jour 70 laisse 4 min 40 avant le premier hiver. C'est assez pour que le joueur installe des familles et voie la réserve monter, mais c'est peut-être trop peu pour qu'il remarque la marque. À observer au playtest.

# La bible narrative

*Issue [#43](https://github.com/DavidGiangiacomo/strates/issues/43). La référence de tous les textes du jeu : le ton, les huit couches, les restes et les fins, le fil des traces, les noms d'en bas et la répartition des mots. Elle précise le §2 et le §10 du [design doc](design-doc.md). Les fiches des strates en partent pour leur § 2 (la civilisation) et leur § 11 (les textes).*

*Choix tranchés le 15 octobre 2026 :*
- *les couches évoquent des pratiques **reconnaissables, jamais nommées** : ni lieu, ni peuple, ni siècle ;*
- *chaque peuple a trouvé, en creusant, **des restes** de la couche d'en dessous, et les a mal compris ;*
- *dans le lit, **le jeu parle au joueur**, et c'est la seule fois ;*
- *au fond vivaient **les premiers à compter**.*

*Renvois : « §2 » désigne une section du design doc, « § 2 » une section de cette page. Les « fiches » sont celles des strates (`docs/strates/`).*

## 1. Ce que raconte le jeu

Une fouille, de haut en bas. Chaque couche est un peuple qui a vécu sur le sol du précédent et qui a joué son propre jeu : il comptait quelque chose, à sa façon, jusqu'à ne plus avoir de coup à jouer. Plus on descend, plus on remonte le temps.

Le joueur l'apprend de trois façons, sans qu'on le lui dise :
- **par la structure** de ce que chaque peuple optimisait : sa ressource, son seuil, son écran (§2) ;
- **par les restes** : en creusant, chaque peuple a trouvé des choses de la couche d'en dessous, et les a nommées à sa façon. En descendant, le joueur découvre ce qu'elles étaient (§ 3) ;
- **par les fins** : toutes les couches se sont arrêtées de la même façon, par saturation (§ 3). On ne les voit toutes ensemble que du fond (§ 5).

Ce que le jeu ne dit jamais :
- ce que sont devenus les gens d'une couche, ni combien de temps a passé avant la suivante ;
- qu'une couche serait plus avancée qu'une autre ;
- que la surface finira comme les autres : en remontant, on la retrouve qui tourne toujours (§11) ;
- le nom d'un lieu, d'un peuple ou d'une époque.

## 2. Le ton

### Les règles

- **Archéologique, patient, sans mystère surjoué** (§2). Le jeu constate. Il n'explique pas, ne commente pas, ne s'émeut pas.
- **Le joueur reconnaît ; on ne lui dit jamais quoi.** Un établi, une vanne, une tablette de compte se reconnaissent. Aucun texte ne dit « c'était un atelier d'horloger ».
- **Des inventaires, des outils, des habitudes de comptage.** Chaque texte est un objet de la couche : une ligne de registre, une légende de plan, un relevé. Il n'y a pas de narrateur.
- **Chaque couche parle sa langue, et seulement la sienne** (voir « Les voix », plus bas). Le noyau a la sienne, la plus neutre de toutes.
- **Personne ne s'adresse au joueur**, sauf le jeu lui-même, dans le lit, une fois (§ 8). Aucune couche n'écrit « vous », pas même dans son aide ou son résumé d'absence, et le noyau non plus.
- **Le joueur n'a ni nom, ni visage, ni passé.** Le jeu ne dit jamais qui creuse.
- **Pas de point d'exclamation, pas d'humour appuyé, pas de félicitations.** Un seuil atteint se constate.
- **Sans jugement.** Un hiver manqué, une dette en défaut, un objet abandonné se notent comme le reste.

### Les mots

**Interdits dans tous les textes du jeu :**
- « ancien », sous toutes ses formes : pas d'« anciens » (§2). On écrit « vieux » ;
- « ancêtres », « civilisation », « prophétie », « mystère », « secret », « destin », « magie » ;
- les noms propres de lieux, de peuples et de personnes ; les dates et les siècles de notre histoire ;
- « bravo », « félicitations », le point d'exclamation.

**Réservés :**
- « creuser », « fouille », « reboucher » : au noyau seulement. Aucune couche ne les écrit, bien que plusieurs aient creusé. « Descendre » non plus, pour passer à la couche d'en dessous ; « le grain descend au plus profond » reste permis ;
- « vous » : au lit seulement (§ 8) ;
- « artefact » : au bandeau seulement. Partout ailleurs, on dit « objet » ;
- les noms des couches, « La surface », « Les caves »… : au noyau, qui les donne. Les peuples ne se nomment pas.

### Les voix

| Où | Voix | Exemple |
|---|---|---|
| Le noyau | un inventaire de fouille : des noms, des nombres, des constats | « Ce qui n'est pas emporté est abandonné. » |
| 1 · La surface | un logiciel bien fait : poli, bref, sans enthousiasme | « Objectif atteint. » |
| 2 · Les caves | un registre de village : daté, constaté | « Hiver de l'an 3 : passé sans rupture. » |
| 3 · L'atelier | les légendes d'un plan et sa nomenclature : nominales, techniques | « Pièce 14 : ajustée. » |
| 4 · Le réseau | un carnet de relevés : la vanne, le bassin, le niveau | « Bassin haut : stable. » |
| 5 · Le chœur | des indications de partition : des infinitifs, des adverbes | « tenir », « plus haut » |
| 6 · La dette | un livre de comptes : des formules d'obligation, datées | « Dû à la 12ᵉ crue. Honoré. » |
| 7 · Le lit | aucune : ce peuple n'écrivait pas. Le jeu y parle au joueur (§ 8) | « Rien ne presse. » |
| 8 · Le fond | aucune : des encoches, et les traces des autres | — |

## 3. Le monde

### Un même sol

- Les huit couches sont superposées au même endroit. Plus bas, c'est plus vieux.
- Chacune évoque des pratiques réelles, qu'on reconnaît. Mais **l'ordre du sol n'est pas celui des manuels** : le chœur, qui ne comptait pas, vit au-dessus des comptables de la dette, et les fontainiers du réseau sous l'atelier.
- Rien ne monte vers un progrès. Chaque couche compte autrement, et aucune ne compte mieux. C'est l'invariant I3 (§9), raconté.

Huit façons de compter, de bas en haut :

| Couche | Ce qu'elle comptait |
|---|---|
| 8 · Le fond | des encoches, une par une |
| 7 · Le lit | des couches de limon, une par crue |
| 6 · La dette | ce qui est dû, et pour quand |
| 5 · Le chœur | rien : des rapports, à l'oreille |
| 4 · Le réseau | des débits et des niveaux |
| 3 · L'atelier | des pièces et des cases |
| 2 · Les caves | des boisseaux, des jours et des hivers |
| 1 · La surface | des crédits par seconde, et des objectifs |

### Les restes

Chaque peuple a creusé : des fondations, des caves, des bassins, des fosses. En creusant, il a trouvé des choses de la couche d'en dessous. Il ne les a pas comprises : il les a nommées à sa façon, et s'en est servi pour autre chose.

| Couche | Ce qu'elle a trouvé | Ce qu'elle en a fait | Son nom |
|---|---|---|---|
| 1 · La surface | des caves voûtées, sous le site | elle y a mis ses serveurs, au frais | « le sous-sol » |
| 2 · Les caves | des roues de métal dentées, sous les caves profondes | des poids, pour tenir les couvercles des silos | « les roues sans moulin » |
| 3 · L'atelier | des conduites creuses et des vannes, sous l'établi | des pièces portées à la nomenclature, qui ne s'emboîtent avec rien | « pièces sans plan » |
| 4 · Le réseau | une salle voûtée, immense, en creusant un bassin | une citerne ; pleine, elle bourdonne | « la citerne qui chante » |
| 5 · Le chœur | des tablettes couvertes de signes, sous la nef | le sol de la nef, pavé face écrite contre la terre | aucun : il ne lit pas |
| 6 · La dette | des couches de limon fines et régulières, en creusant ses fosses à archives | un compte des années, une couche par crue, où fixer les échéances | « le compte des crues » |
| 7 · Le lit | des encoches sur la roche, que le fleuve a mises à nu | rien : il les a laissées recouvrir | aucun |
| 8 · Le fond | rien : c'est la roche | — | — |

- **Un reste n'est jamais un message.** C'est une chose ordinaire, trouvée par hasard, réemployée. Personne ne l'a cherchée, personne ne l'a comprise : rien ne se transmet que la matière.
- **Le joueur rencontre le nom avant la chose.** Il lit « les roues sans moulin » dans le registre de la vallée, puis trouve dans l'atelier les engrenages qu'elles étaient. Le jeu ne fait jamais le lien : c'est le plaisir de l'archéologue.
- **La fouille du joueur prolonge la leur.** Tous ont creusé pour leur jeu ; lui creuse pour descendre. C'est le même geste, et aucun texte ne le dit.
- **Un peuple qui n'écrit pas montre ses restes sans les nommer.** Le chœur dessine son pavement ; le lit laisse ses encoches sous le limon.

### Les fins

- Chaque couche finit par **saturation** (§2) : son jeu n'a plus de coup à jouer, et elle s'arrête. Jamais de catastrophe, de guerre, d'épidémie ni d'effondrement.
- La fin d'une couche, c'est son seuil de fouille vu de l'intérieur : le joueur y amène la couche, et c'est là qu'elle s'était arrêtée.
- Sa dernière ligne la constate, dans sa voix : « Tous les objectifs sont atteints. », « Passé sans rupture. », « Il ne reste aucune case. » C'est souvent la trace qu'elle laisse au fond (§ 5).
- Après, la couche est recouverte. On ne sait ni comment ni en combien de temps.

## 4. Les huit couches

Pour chaque couche : ce qu'elle était, ce qu'elle optimisait, sa fin, sa voix, ses mots, ses restes, ses traces, et la façon dont elle nomme les objets venus d'en haut (§ 6). « En une ligne » sert à l'équipe, pas au jeu : aucune de ces phrases n'apparaît à l'écran.

### 1 · La surface — produire, Crédits

**En une ligne** : une exploitation qui atteignait ses objectifs.

- **Ce qu'elle était** : le présent, ou presque (fiche 1, § 2). Une exploitation dont on ne sait pas ce qu'elle produit, seulement ce qu'elle rapporte : des postes, des équipes, des serveurs, une chaîne, une turbine, une usine, des filiales. On reconnaît le bureau, la réunion hebdomadaire, le plan stratégique. Le flou est voulu : un présent compétent et tiède.
- **Ce qu'elle optimisait** : un débit, en crédits par seconde, et des objectifs toujours plus ronds.
- **Sa fin** : « Tous les objectifs sont atteints. » La production continue, et il n'y a plus rien à décider. C'est la seule couche qui ne soit pas recouverte : en remontant, on la retrouve qui tourne (§11).
- **Sa voix** : un logiciel bien fait. Des phrases courtes et polies, des libellés.
- **Ses mots** : crédits, production, objectif, poste, équipe, process, réorganisation, rendement.
- **Ses restes** : « le sous-sol », où sont ses serveurs. Ce sont les caves de la vallée ; elle ne le sait pas.
- **Ses traces** : son dernier objectif, « Tous les objectifs sont atteints. », « La production continue. » Elles sont écrites (`trace.1` à `trace.3`).
- **Les objets d'en haut** : aucun. Il n'y a rien au-dessus d'elle.

### 2 · Les caves — stocker, Grain

**En une ligne** : une vallée qui ne voulait jamais manquer.

- **Ce qu'elle était** : des paysans, au temps où l'on comptait en récoltes (fiche 2, § 2). Des familles aux champs, des greniers, des silos, des caves ; la faucille, le fléau, la charrue, l'assolement. On reconnaît le calendrier des champs, la soudure, les rations d'hiver, le registre où l'on note tout.
- **Ce qu'elle optimisait** : l'absence de manque. Son temps était circulaire : la même année revenait, avec des hivers plus longs.
- **Sa fin** : la vallée pleine, les caves pleines, trois grands hivers passés sans rupture. Le registre n'avait plus rien à écrire que « passé sans rupture ». Son dernier geste avait été de creuser plus profond.
- **Sa voix** : un registre de village. Des phrases courtes, datées, constatées. Le registre ne s'adresse à personne.
- **Ses mots** : boisseau, réserve, grenier, silo, cave, famille, récolte, soudure, hiver, rupture, ration. On dit « les vieux », jamais « les anciens ».
- **Ses restes** : « les roues sans moulin », trouvées sous les caves profondes. Elles tiennent les couvercles des silos. Ce sont des engrenages de l'atelier.
- **Ses traces** : le nombre d'hivers passés sans rupture, le stockage le plus profond, la dernière ligne du registre. Les deux premières sont écrites (`trace.hivers`, `trace.profondeur.*`).
- **Les objets d'en haut** : des choses de la ferme et de la maison, et ce qu'elles font pour la vallée. La roue chaude, les deux fenêtres, l'armoire qui compte les hivers. Le registre note leur éveil : « Les familles ont compris la roue chaude. »

### 3 · L'atelier — assembler, Pièces

**En une ligne** : un atelier où chaque pièce avait sa place.

- **Ce qu'il était** : des artisans à l'établi. Des gabarits, des limes, des étaux ; un plan quadrillé où chaque pièce a sa case ; des mécanismes de pièces qui s'emboîtent, comme ceux d'une horloge. C'est l'écho voulu au concept n°8, *L'horloger* (§10), sans en dépendre.
- **Ce qu'il optimisait** : l'ajustement. Que tout tienne, sans jeu et sans vide : une pièce bien placée aide ses voisines ; mal placée, elle les gêne.
- **Sa fin** : le plan plein. Plus une case libre, et l'assemblage tourne : il n'y avait plus rien à placer. « Il ne reste aucune case. » La feuille qui annonce en a déjà fait lire une ligne dans les caves, en base douze comme toutes celles de l'atelier : « Il reste 53 cases. »
- **Sa voix** : les légendes d'un plan et sa nomenclature. Des noms de pièces, des cotes, des mentions brèves : « ajustée », « gêne sa voisine », « à reprendre ».
- **Ses mots** : établi, gabarit, plan, case, pièce, cote, jeu, ajuster, roue dentée, ressort, nomenclature.
- **Ses restes** : des « pièces sans plan », trouvées sous l'établi. Creuses, sans cote, elles ne s'emboîtent avec rien. Ce sont les conduites et les vannes du réseau.
- **Ses traces** : « Il ne reste aucune case. », le compte des pièces du dernier assemblage, une pièce sans plan mise de côté.
- **Les objets d'en haut** : des pièces et des outils, nommés par leur forme et leur place : « la lame courbe », « le caisson froid ».
- **Sa notation** (I1), fixée par sa [fiche](strates/strate-3.md) : la base douze. Après 9 viennent ↊ et ↋, puis 10, une douzaine ; 100 est une grosse.

### 4 · Le réseau — relier, Flux

**En une ligne** : un réseau où tout circulait, et où rien ne produisait.

- **Ce qu'il était** : des fontainiers. Des sources, des bassins, des conduites, des vannes et des jauges : une ville dont l'eau allait partout. On reconnaît les aqueducs, les canaux d'irrigation, l'art de répartir l'eau. Rien n'y produit seul : tout est débit et goulot (§5).
- **Ce qu'il optimisait** : le débit sans goulot. Que chaque conduite porte ce qu'elle peut, ni plus ni moins.
- **Sa fin** : le réseau a tourné sans un goulot, si longtemps qu'il n'y avait plus rien à réparer. Les jauges ne bougeaient plus.
- **Sa voix** : un carnet de relevés. La vanne, le bassin, le niveau, sans un mot de trop : « Vanne 3 : ouverte d'un quart. Bassin haut : stable. »
- **Ses mots** : source, bassin, conduite, vanne, jauge, niveau, débit, regard, déversoir, relevé.
- **Ses restes** : « la citerne qui chante », une salle voûtée trouvée en creusant un bassin. Pleine, elle bourdonne. C'est la nef du chœur.
- **Ses traces** : son dernier relevé, la durée sans goulot, la citerne pleine.
- **Les objets d'en haut** : des pièces du réseau, nommées par ce qu'elles font au flux : « la vanne qui compte », « la roue qui retient ».
- **À fixer par sa fiche** ([#62](https://github.com/DavidGiangiacomo/strates/issues/62)) : sa notation (I1), et le schéma de l'interface. Le design parle de câbles (§5) : ici, ce seront des conduites.

### 5 · Le chœur — accorder, Voix

**En une ligne** : un peuple qui chantait juste, et qui ne comptait pas.

- **Ce qu'il était** : un peuple qui chantait ensemble (fiche 5, § 2). Il ne savait pas combien il était : il savait si c'était juste. On reconnaît le chant à plusieurs voix, le bourdon, la nef voûtée, les intervalles justes.
- **Ce qu'il optimisait** : la justesse. Un chœur juste attirait des voix ; elles dérangeaient l'accord, qu'il fallait refaire, plus large.
- **Sa fin** : l'accord plein. Huit pupitres, tous liés : ajouter une voix l'aurait défait. Ils l'ont tenu, et n'ont plus rien ajouté. C'est la première couche dont le dernier geste a été de s'abstenir.
- **Sa voix** : des indications de partition. Des infinitifs et des adverbes, jamais une phrase, aucun chiffre (fiche 5, § 11).
- **Ses mots** : tenir, plus haut, plus bas, sans presser, ensemble, juste, le double. Pas de quinte, de quarte ni d'octave : ce sont des chiffres déguisés.
- **Ses restes** : des tablettes couvertes de signes, trouvées sous la nef. Il en a pavé le sol, face écrite contre la terre. Il ne les nomme pas, puisqu'il ne lit pas : le pavement se dessine dans la nef, il ne s'écrit pas.
- **Ses traces** : le dernier accord, dessiné : huit barres et leur voûte. Une ligne au plus, pour la tenue.
- **Les objets d'en haut** : il ne les écrit pas. Leur nom ne paraît que dans l'inventaire du noyau, et se dit par le son ou par le geste : « le grave qui dure », « ce qui tient ».

### 6 · La dette — promettre, Engagements

**En une ligne** : un peuple qui vivait de promesses, et qui les écrivait toutes.

- **Ce qu'il était** : les premiers à écrire, et ce qu'ils écrivaient d'abord, c'étaient des comptes : qui doit quoi, à qui, pour quand. Des tablettes d'argile, des sceaux, des témoins. On reconnaît les tablettes de prêt, les intérêts, la tablette qu'on brise quand la dette est payée.
- **Ce qu'il optimisait** : l'engagement. Ce qu'on obtient tout de suite, contre ce qu'on rendra. Rien n'y est produit : tout arrive à échéance (§5).
- **Sa fin** : deux issues, sans jugement (§ 7). Dans les deux cas, il n'y a plus de coup à jouer.
  - **Soldée** : tout ce qui avait été promis a été honoré, et il ne restait rien à promettre.
  - **En défaut** : tout l'avenir était déjà promis, et l'on ne pouvait plus rien engager.
- **Sa voix** : un livre de comptes. Des formules d'obligation, datées, à la troisième personne : « Dû à la 12ᵉ crue. », « Honoré. », « Échu. » Le rouge et le noir.
- **Ses mots** : promettre, devoir, dû, échéance, intérêt, gage, sceau, témoin, honorer, échu, solder, défaut.
- **Ses restes** : « le compte des crues ». En creusant ses fosses à archives, elle a trouvé les couches du lit, fines et régulières. Elle les a lues comme un compte des années, une couche par crue, et y a fixé ses échéances.
- **Ses traces** : la ligne de son issue, et le compte de ce qui a été honoré (§ 7).
- **Les objets d'en haut** : des gages, nommés par ce qu'ils valent ou ce qu'ils garantissent : « le gage qui chante », « la caution de bois ».
- **Sa notation** (I1), fixée par sa [fiche](strates/strate-6.md) : les sceaux. Chaque groupe de trois zéros, à la fin d'un montant, devient un sceau : « 125 ●●● » vaut 125 milliards. Les échéances se datent en crues, de trente secondes, écrites en chiffres : « Dû à la 42ᵉ crue ».

### 7 · Le lit — attendre, Sédiments

**En une ligne** : un peuple qui attendait que le limon se dépose.

- **Ce qu'il était** : les bords d'un fleuve qui débordait chaque année. On laissait la crue déposer son limon, et l'on attendait. De rares gestes : choisir où l'eau se repose. Pas d'écriture. On reconnaît la plaine inondable, la décrue, le limon qui fait la terre.
- **Ce qu'il optimisait** : ce qui se dépose. L'épaisseur et la régularité des couches.
- **Sa fin** : le bassin s'est rempli jusqu'au bord, et la dernière couche a atteint la rive : il n'y avait plus de place pour attendre. Le fleuve est passé ailleurs, et la descente vient seule (§6).
- **Sa voix** : aucune. Dans son silence, le jeu parle au joueur, une fois (§ 8).
- **Ses mots** : ceux de l'interface, très peu : crue, limon, couche, rive.
- **Ses restes** : des encoches sur la roche, que le fleuve a mises à nu en creusant son lit. Il les a laissées recouvrir.
- **Ses traces** : ses couches, dessinées, et dans son limon les fosses de la dette (§ 7). Pas un mot.
- **Les objets d'en haut** : des mots simples, et ce que la chose fait à qui la tient. Le premier exemple du design était « le papier qui oblige » (§7). Mais le papier n'existe pas ici, et les comptes de la dette sont des tablettes : c'est « la pierre qui oblige ».

### 8 · Le fond — les premiers à compter

**En une ligne** : les premiers à compter.

- **Ce qu'il était** : des encoches sur la roche, par groupes, sur toute la paroi. Rien d'autre : ni ressource, ni générateur, ni achat. Un compte qui ne fait que grandir d'un. Le premier jeu, avant tous les autres.
- **Ce qu'il optimisait** : rien que le compte : une encoche de plus.
- **Sa fin** : la paroi pleine. Les encoches s'arrêtent au bord : il n'y avait plus de place pour une de plus. On ne sait pas ce qu'elles comptaient.
- **Sa voix** : aucune. C'est la salle de lecture : les traces des sept couches, superposées au-dessus de la paroi, lisibles dans n'importe quel ordre (§10).
- **Ses traces** : il est lui-même la dernière.
- **Les objets d'en haut** : les objets du lit, qui sont des clés de lecture ([`artefacts.md`](artefacts.md), § 7). Le fond ne parle pas. Proposition : ils s'y distinguent par un nombre d'encoches. À trancher avec le catalogue ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)) et la fiche du fond ([#65](https://github.com/DavidGiangiacomo/strates/issues/65)).

## 5. Le fil des traces

Le fond donne à lire les traces des sept couches (§10). Elles sont plantées dans les textes de chaque couche (`trace.*`), puis rassemblées au fond ([#109](https://github.com/DavidGiangiacomo/strates/issues/109)).

- **Une trace par couche**, de trois lignes au plus, dans la voix de la couche. Le chœur la dessine, avec une ligne au plus ; le lit la dessine, sans un mot.
- **Elle se lit seule, dans n'importe quel ordre.** Elle ne renvoie à aucune autre couche, et ne dit ni « avant », ni « après », ni « en haut ».
- **Elle dit ce que la couche comptait, et où elle s'est arrêtée** : un compte, sa dernière ligne, une chose laissée.
- **Elle change avec le parcours**, quand le parcours l'a changée : l'issue de la dette (§ 7), les objets abandonnés. Ceux-ci, le noyau les nomme sous leurs noms d'en haut, comme dans la coupe.
- **Les restes s'y répondent sans se nommer.** Au fond, sous « les roues sans moulin » des caves, on voit les engrenages de l'atelier ; sous « la citerne qui chante », la nef du chœur. Rien ne relie les deux : le joueur le fait, ou ne le fait pas.

| Couche | Sa trace (proposée) |
|---|---|
| 1 · La surface | « Objectif 10 : atteindre 1 M cr/s. Atteint. », « Tous les objectifs sont atteints. », « La production continue. » |
| 2 · Les caves | « Hivers passés sans rupture : {hivers}. », « Le grain se gardait jusque dans des caves profondes. », la dernière ligne du registre |
| 3 · L'atelier | « Il ne reste aucune case. », le compte des pièces, « Pièce sans plan : mise de côté. » |
| 4 · Le réseau | le dernier relevé, « Aucun goulot. » et depuis quand, « Citerne qui chante : pleine. » |
| 5 · Le chœur | le dernier accord, dessiné, et « tenir » |
| 6 · La dette | la ligne de son issue (§ 7), et le compte de ce qui a été honoré |
| 7 · Le lit | ses couches, dessinées, avec les fosses de la dette |
| 8 · Le fond | les encoches |

## 6. Les noms d'en bas

Un objet emporté prend en bas le nom que lui donnent ceux d'en bas (§7). Ce nom est la trace la plus fine du malentendu entre deux couches.

**La forme**
- Un article défini, un nom concret du monde d'en bas, puis ce que l'objet fait pour eux : un adjectif, un complément ou une relative. « La roue chaude », « le grenier d'ailleurs », « l'armoire qui compte les hivers ».
- En minuscules, sans guillemets dans les textes du jeu : « Les familles ont compris la roue chaude. »
- Court : cinq mots au plus.

**Le sens**
- **Il dit ce que ceux d'en bas ont compris, pas ce qu'est l'objet.** Une turbine n'est pas une roue ; mais elle tourne, et elle chauffe : cela suffit.
- **Le joueur doit pouvoir le reconnaître.** Il a emporté « la turbine » ; il doit, avec un temps de retard, sourire de « la roue chaude ». Un nom qu'on ne relie à rien est raté.
- **Il ne se moque pas.** Ceux d'en bas ne sont pas naïfs : ils nomment avec ce qu'ils savent.
- **Il est donné une fois, par la couche qui reçoit l'objet**, celle où il est puissant. Plus bas, l'objet garde ce nom, comme un mot étranger (`nomDEnBas`, [`artefacts.md`](artefacts.md), § 2).

**Les registres, couche par couche**

| Reçus par | Venus de | Nommés comme | Exemples |
|---|---|---|---|
| 2 · Les caves | la surface | des choses de la ferme et de la maison | la roue chaude, les deux fenêtres |
| 3 · L'atelier | les caves | des pièces et des outils, par leur forme et leur place | la lame courbe, le caisson froid |
| 4 · Le réseau | l'atelier | des pièces du réseau, par ce qu'elles font au flux | la vanne qui compte, la roue qui retient |
| 5 · Le chœur | le réseau | un son ou un geste, sans écriture | le grave qui dure, ce qui tient |
| 6 · La dette | le chœur | des gages, par ce qu'ils valent | le gage qui chante, la caution de bois |
| 7 · Le lit | la dette | des mots simples, par ce que l'objet fait à qui le tient | la pierre qui oblige |
| 8 · Le fond | le lit | aucun mot : un nombre d'encoches, à trancher | — |

**L'éveil** : la première fois qu'un objet agit, la couche qui écrit le note dans sa voix (« Les familles ont compris la roue chaude. ») ; celle qui n'écrit pas le montre. Le chœur pose l'objet au pied du bourdon (fiche 5, § 8).

**Les restes suivent la même règle, dans l'autre sens** (§ 3) : ceux d'en haut nomment ce qu'ils trouvent dessous. Les noms vont dans les deux sens, et le joueur est le seul à les connaître tous.

## 7. La dette et le lit : les deux issues

La dette finit soldée ou en défaut (§6). L'issue se voit dans la dette, dans le lit dessous, au fond et dans la coupe, toujours sans jugement.

- **Dans la dette**, sa dernière ligne :
  - soldée : « Honoré. Plus rien n'est dû. » ;
  - en défaut : « Échu. Le reste demeure dû. »

  Même voix, même longueur, même place.
- **Dans le lit** : la dette creusait ses fosses à archives dans le limon du lit (§ 3). On les voit dans les couches dès l'arrivée, sans un mot :
  - soldée : les tablettes y sont **brisées**. Une dette payée, on brisait sa tablette ;
  - en défaut : les tablettes y sont **entières**, encore scellées. Ce qui était dû y est toujours écrit.
- **Au fond**, la trace de la dette suit son issue (§ 5), et le lit dessiné garde ses fosses.
- **Dans la coupe**, le noyau note « soldée » ou « en défaut », comme le reste.
- **Les textes du lit n'en disent rien** (§ 8). Quand le jeu parle, il ne juge pas.

## 8. Le lit : la seule fois où le jeu parle

« Après vingt heures de systèmes, c'est là que le jeu parle enfin, en trois ou quatre textes très courts » (§10).

- **Qui parle** : le jeu, au joueur. Aucune couche ne s'adresse à lui, et le peuple du lit n'écrivait pas : c'est la seule fois que le jeu dit « vous ». Il ne le redira pas, même au fond.
- **Ce qu'il dit** : le temps, ce qui a été laissé en haut, l'absence de décision. Rien sur les couches, rien sur la suite, rien sur le fond.
- **Comment** : trois ou quatre phrases de quelques mots, séparées par des heures de jeu. Chacune paraît seule sur le vide du lit, puis s'efface.
- **Ni prophétie ni mystère.** Une phrase du lit doit être vraie au pied de la lettre, au moment où elle paraît.

Proposition, à reprendre avec les textes du lit ([#92](https://github.com/DavidGiangiacomo/strates/issues/92)) :

| Quand | Texte |
|---|---|
| À l'arrivée, après la dette | « Rien ne presse. » |
| Au retour d'une longue absence | « Ce que vous avez laissé en haut est toujours là. » |
| Quand les derniers placements sont faits | « Vous n'avez rien à décider ici. » |
| Pendant la descente, que le joueur n'a pas choisie | « C'était la seule fois. » |

La dernière a deux sens, voulus : la seule descente que le joueur n'a pas choisie, et la dernière phrase que le jeu lui adresse.

## 9. La répartition des mots

Environ 5 000 mots pour tout le jeu (§2). Chaque fiche reprend son budget dans son § 11, et un test le vérifie, comme pour les strates 1 et 2.

| Où | Mots | Ce qui compte le plus |
|---|---|---|
| Le noyau | 450 | le bandeau, l'écran de fouille, l'inventaire, la coupe, le menu, les fins |
| 1 · La surface | 600 | les descriptions et l'aide ; 609 écrits |
| 2 · Les caves | 750 | le registre, les notes en marge, l'aide ; 742 écrits, rations comprises |
| 3 · L'atelier | 700 | la nomenclature et les légendes du plan |
| 4 · Le réseau | 600 | le carnet de relevés et la légende du schéma |
| 5 · Le chœur | 300 | des indications, et pas une phrase |
| 6 · La dette | 850 | le livre de comptes : la strate la plus longue |
| 7 · Le lit | 100 | les quatre phrases du jeu, et l'interface |
| 8 · Le fond | 350 | les traces des sept couches, et leurs variantes |
| Les rappels de reprise | 300 | trois lignes par couche, au plus (§ 10) |
| **Total** | **5 000** | |

- **Les traces comptent au fond**, pas dans leur couche. Les noms d'en bas comptent dans la couche qui les donne.
- **Les formules réelles** (`formule.*`), lues au-delà de κ = 50 seulement, n'entrent dans aucun budget.

## 10. Le noyau

Le noyau parle entre les couches : le bandeau, l'écran de fouille, la descente, l'inventaire des objets ([#45](https://github.com/DavidGiangiacomo/strates/issues/45)), la coupe ([#47](https://github.com/DavidGiangiacomo/strates/issues/47)), le menu ([#48](https://github.com/DavidGiangiacomo/strates/issues/48)), les rappels de reprise ([#58](https://github.com/DavidGiangiacomo/strates/issues/58)) et les fins ([#128](https://github.com/DavidGiangiacomo/strates/issues/128), [#131](https://github.com/DavidGiangiacomo/strates/issues/131)).

- **Sa voix** : un inventaire de fouille. Des libellés courts, des nombres, des constats. Ses verbes sont des infinitifs en minuscules : « creuser », « descendre », « reboucher », « remonter », « rester ».
- **Il ne dit jamais « vous »**, ne qualifie rien (ni « bon », ni « rare », ni « précieux ») et ne raconte rien. Le titre du résumé d'absence, « Pendant votre absence », est donc à reprendre.
- **Ses mots** : Profondeur, Artefacts, Compréhension (le bandeau) ; points de fouille, à emporter, laissé en haut, abandonné (la fouille) ; la coupe, soldée, en défaut, stratigraphie perturbée (D-005).

**Les rappels de reprise** (R4, §13) : trois lignes au plus, à chaque reprise de session, avec le résumé de l'absence.
1. Le lieu, écrit par le noyau : « Profondeur 2 · Les caves ».
2. La dernière ligne que la couche a écrite, dans sa voix. Le chœur donne une indication ; le lit, rien.
3. Où en est le seuil, dans la voix de la couche, fourni par la strate : « Grands hivers de suite : 2. »

Jamais de résumé de la civilisation, d'indice, ni de « vous ». Les lignes « En une ligne » du § 4 ne sont pas des rappels.

**La coupe et l'épilogue** (§11) : une ligne par couche, le nom de la couche, le temps passé, le seuil franchi, les objets abandonnés sous leurs noms d'en haut, et « stratigraphie perturbée » si l'horloge a reculé. Sans commentaire.

**La remontée ne dit rien.** Les couches vides défilent, puis la surface qui tourne.

## 11. Ce que la bible demande ensuite

- **Les textes des strates 1 et 2** ([#60](https://github.com/DavidGiangiacomo/strates/issues/60)) : faits. Les vieux remplacent les anciens, plus aucun texte ne dit « vous », les deux restes sont plantés (le serveur « au sous-sol, au frais », la cave profonde où « on trouve les roues sans moulin »), et les traces suivent le § 5. Les tests interdisent désormais « vous » et les mots du § 2, comme « creuser ».
- **Le catalogue** ([#57](https://github.com/DavidGiangiacomo/strates/issues/57)) : les noms d'en bas selon le § 6, dont « la pierre qui oblige », et les noms au fond.
- **Le rappel de reprise** ([#58](https://github.com/DavidGiangiacomo/strates/issues/58)) : le § 10, et le titre du résumé d'absence, sans « votre ».
- **Les fiches** des strates 4, 7 et 8, et la révision de celle du chœur ([#62](https://github.com/DavidGiangiacomo/strates/issues/62), [#63](https://github.com/DavidGiangiacomo/strates/issues/63), [#65](https://github.com/DavidGiangiacomo/strates/issues/65), [#75](https://github.com/DavidGiangiacomo/strates/issues/75)) : leur § 2 part du § 4, leur § 11 du § 5 et du § 9. Celles de l'atelier et de la dette sont faites ([`strate-3.md`](strates/strate-3.md), [`strate-6.md`](strates/strate-6.md)).
- **Les textes du lit** ([#92](https://github.com/DavidGiangiacomo/strates/issues/92)) : le § 8.
- **Les traces du fond** ([#109](https://github.com/DavidGiangiacomo/strates/issues/109)) : les § 5 et 7.

## 12. Questions ouvertes

1. **Les notations proposées** : tranchées par les fiches (I1). La douzaine de l'atelier est devenue la base douze ([fiche](strates/strate-3.md), § 1) ; la dette date ses échéances en crues, et écrit ses montants en sceaux ([fiche](strates/strate-6.md), § 1).
2. **Les noms des objets au fond** : un nombre d'encoches, ou pas de nom du tout.
3. **La dernière phrase du lit** : si ses deux sens se gênent au playtest, garder celui de la descente.
4. **Les restes dessinés** : le pavement du chœur et les encoches sous le limon ne s'écrivent pas. Il faudra qu'on les voie, sans qu'ils attirent plus l'œil qu'un détail.

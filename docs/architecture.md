# Architecture : le contrat entre le noyau et les strates

Ce document définit ce que chaque strate expose au noyau, et ce que le noyau lui fournit. Il découle du §15 du [design doc](design-doc.md) et des décisions [D-002](decisions.md#d-002--artefacts--points-de-fouille-et-choix-dans-un-catalogue) (artefacts), [D-003](decisions.md#d-003--valeur-convertible-de-chaque-strate) (valeur convertible), [D-004](decisions.md#d-004--stack-technique--typescript-svelte-vite) (stack) et [D-005](decisions.md#d-005--stratégie-de-sauvegarde) (sauvegarde). Issue d'origine : [#13](https://github.com/DavidGiangiacomo/strates/issues/13).

## 1. Principes

1. **Huit modules indépendants et un noyau.** Le noyau ne connaît que `{ profondeur, artefacts[], κ, meta }` et l'interface décrite ici. L'état d'une strate lui est **opaque** : il le sauvegarde, le transmet, mais ne le lit jamais.
2. **Ne jamais factoriser les boucles entre strates.** Seuls des outils techniques sont partagés : générateur aléatoire, sauvegarde, moteur audio, couche d'opacité, bandeau, écran de fouille. Aucune règle de jeu, aucune formule, aucun formateur de nombres n'est partagé (I1).
3. **Logique et vue séparées** (D-004). La logique est en TypeScript pur. Elle n'importe ni Svelte, ni le DOM, ni une vue.
4. **Logique déterministe.** Même état, mêmes entrées : même résultat. Le temps est fourni par le noyau, l'aléatoire passe par un générateur à graine dont l'état vit dans l'état de la strate. Le même code sert au jeu, au hors-ligne, au simulateur et aux tests.
5. **Actions sérialisables.** Tout ce que fait le joueur passe par une action, un objet JSON. Le noyau les applique dans l'ordre, ce qui permet de les journaliser (journal de session, [#26](https://github.com/DavidGiangiacomo/strates/issues/26)) et de les rejouer (simulateur, [#23](https://github.com/DavidGiangiacomo/strates/issues/23)).
6. **Unités.** Dans la logique, le temps est en **secondes** (nombre à virgule). Les horodatages en millisecondes n'existent que dans le noyau.

## 2. Arborescence d'une strate

```
src/strates/s2-caves/
  logique/
    index.ts        export const logique: LogiqueStrate<EtatCaves, ActionCaves>
    etat.ts         type EtatCaves, etatInitial
    regles.ts       formules et règles propres à la strate
    migrations.ts   migrations de l'état (D-005)
  vue/
    Vue.svelte      composant racine, monté sous le bandeau
    sons.ts         sa banque de sons, si elle en a (§ 5, « Le son »)
  textes.fr.ts      libellés, infobulles, aide, traces pour le fond
  index.ts          export const strate: DefinitionStrate<EtatCaves, ActionCaves>
```

Le noyau charge chaque strate à la demande (`import()` dynamique) : le code de la strate 5 n'est téléchargé qu'à l'arrivée dans la strate 5.

Le noyau suit la même séparation, avec un troisième dossier :

```
src/noyau/
  logique/      état global, tick, conversion, journal (TS pur)
  plateforme/   ce qui dépend du navigateur : stockage, horloge, audio
  ui/           bandeau, fouille, inventaire, coupe, menu (Svelte)
```

**Ces règles sont imposées par l'outillage**, pas seulement par convention :
- ESLint interdit à tout dossier `logique/` d'importer Svelte, un composant, une `vue/`, une `ui/` ou une `plateforme/`, et d'utiliser le navigateur, `Math.random`, `Date.now` ou `new Date()`. Le simulateur (`sim/`) n'importe pas de vue non plus. Un test (`tests/architecture.test.ts`) vérifie que ces règles sont actives.
- Les dossiers `logique/` sont aussi compilés sans les types du DOM (`tsconfig.logique.json`) : toute référence au navigateur y est une erreur de type.

## 3. Le contrat de la logique

```ts
type NumeroStrate = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Toute action du joueur : un objet sérialisable en JSON, discriminé par `type`. */
interface ActionBase {
  type: string;
}

interface LogiqueStrate<E, A extends ActionBase> {
  numero: NumeroStrate;

  /** Version du format de l'état ; augmente à chaque changement incompatible (D-005). */
  versionEtat: number;
  /** Migrations : `migrations[v]` transforme un état de version v en version v + 1. */
  migrations: Record<number, (etat: unknown) => unknown>;

  /** État à l'arrivée dans la strate. */
  etatInitial(ctx: ContexteArrivee): E;

  /** Avance le temps de `dt` secondes. Déterministe ; ne modifie que `etat`. */
  tick(etat: E, dt: number, ctx: ContexteTick): void;
  /** Plus grand pas de `tick` qui donne encore des résultats justes, en secondes. */
  pasMax: number;

  /** Applique une action du joueur. Déterministe ; ne modifie que `etat`. */
  agir(etat: E, action: A, ctx: ContexteTick): void;

  /** Où en est le seuil de fouille. */
  seuil(etat: E): EtatSeuil;
  /**
   * Où en est la fissure du filet, de 0 (pas encore apparue) à 1, pour une strate qui en tend un. Le
   * noyau la lit quand le joueur creuse : creuser avant elle, c'est un acte (comprehension.md, § 2).
   */
  filet?(etat: E): number;

  /** Valeur convertible en points de fouille : toujours un cumul sur la strate (D-003). */
  valeurConvertible(etat: E): number;

  /** Leviers sur lesquels s'appliquent les multiplicateurs d'artefacts (D-002) ; null pour le fond. */
  leviers: Leviers | null;

  /** Politique hors-ligne (§9, D-005). */
  horsLigne: PolitiqueHorsLigne;
  /** Obligatoire quand `horsLigne.type` vaut « propre » : applique une absence de `duree` secondes. */
  absence?(etat: E, duree: number, ctx: ContexteTick): ResumeAbsence;

  /** Prépare l'état montré pendant la remontée finale (§11). Par défaut : `etatInitial`. */
  remontee?(etatSauvegarde: E, duree: number): E;

  /**
   * Accroches de la Compréhension, pour les affichages débloqués par κ (comprehension.md, § 5) : le
   * graphe de la strate dans cet état, et ses formules réelles, de la plus simple à la plus profonde.
   * Une strate dont le jeu est un graphe n'y montre que ce que le joueur a déjà trouvé.
   */
  graphe?(etat: E): GrapheDependances;
  formules?(): Formule[];

  /**
   * Les éléments d'interface opaques à l'arrivée (comprehension.md, § 4), que la couche d'opacité du
   * noyau lève par l'usage, par un objet ou par le délai L(κ). Sans eux, tout est lisible.
   */
  opacite?: ElementOpaque[];

  /**
   * Les objets d'en haut que la strate a déjà nommés, par leur identifiant (#45) : l'inventaire du
   * noyau les montre sous leur nom d'en bas, et ils le gardent plus bas. Elle peut citer des objets
   * que le joueur n'a pas : le noyau ne garde que les siens. Sans elle, aucun objet n'est nommé.
   */
  nommes?(etat: E): readonly string[];

  /**
   * Le rappel de reprise (bible, § 10 ; #58) : deux lignes au plus, dans la voix et la notation de la
   * strate. La dernière ligne qu'elle a écrite, puis où en est son seuil, sans rien dire que le joueur
   * n'ait déjà lu. Le noyau les fait précéder du lieu. Sans elle, le rappel ne donne que le lieu.
   */
  rappel?(etat: E): readonly string[];

  /**
   * Un relevé de l'état, pour le journal de session des playtests (#26) : quelques grandeurs à plat,
   * celles que le protocole observe. Le noyau ne les lit pas.
   */
  releve?(etat: E): Record<string, number | string | boolean | null>;
}

interface EtatSeuil {
  atteint: boolean;
  /** Issue de la strate quand il y en a plusieurs (strate 6 : « soldee » ou « defaut »). */
  issue?: string;
  /** La descente se fait sans le joueur, sans écran de choix (strate 7). */
  automatique?: boolean;
}

interface Leviers {
  principal: string;
  secondaires?: string[];
}

type PolitiqueHorsLigne =
  | { type: "standard" } // 80 % de l'absence, plafonnée à 12 h, simulée par ticks
  | { type: "propre" }   // la strate calcule elle-même l'absence (strates 6 et 7)
  | { type: "aucune" };  // le fond

interface ResumeAbsence {
  /** Lignes déjà rédigées et formatées avec la notation propre à la strate. */
  lignes: string[];
}

interface GrapheDependances {
  noeuds: { id: string; cle: string }[]; // `cle` : clé de texte du nom, lue à travers l'opacité
  liens: { de: string; vers: string }[]; // `de` alimente `vers`
}

interface Formule {
  noeud: string;      // le nœud du graphe où elle s'affiche, dès qu'il est compris
  expression: string; // la formule lisible, écrite dans la notation de la strate
}

/** Un nom, une valeur ou un rôle, opaque à l'arrivée. Levé, il le reste. */
interface ElementOpaque {
  /** Son nom : la strate le lève à l'usage (`{ type: "levee", element }`), la vue le demande à `lisible`. */
  id: string;
  /** Les clés de texte qu'il couvre : tant qu'il est opaque, `o(cle)` rend des glyphes à leur place. */
  cles?: string[];
  /** Les objets d'en haut qui le lèvent dès l'arrivée, s'ils agissent ici, puissants ou utiles. */
  objets?: string[];
  /** La part de L(κ) au bout de laquelle il se lève de lui-même : 1 par défaut ; null, jamais. */
  delai?: number | null;
}
```

## 4. Ce que le noyau fournit à la logique

```ts
interface ContexteArrivee {
  /** Graine du générateur aléatoire de la strate. */
  graine: number;
  /** Le parcours jusqu'ici, en lecture seule (par exemple, l'issue de la strate 6 pour la strate 7). */
  journal: Readonly<Journal>;
  /** Les effets des artefacts à l'arrivée : de quoi écrire, dès la première page, ce qui agit déjà. */
  effets?: EffetsActifs;
}

interface ContexteTick {
  /** Effets des artefacts actifs, après usure et plafond ×4 (D-002). */
  effets: EffetsActifs;
  /** Signale un événement au noyau. */
  emettre(evenement: EvenementStrate): void;
}

interface EffetsActifs {
  /** Multiplicateur total sur un levier, après usure et plafond ; vaut 1 si aucun artefact n'agit dessus. */
  multiplicateur(levier: string): number;
  /** Comment agit un objet (« s1-serveur ») : puissant, utile, ou null. C'est ainsi qu'une strate reçoit un affichage, un raccourci ou un effet unique ; elle ignore les objets qu'elle ne connaît pas. */
  niveau(artefact: string): "puissant" | "utile" | null;
}

type EvenementStrate =
  /** Acte de compréhension : la strate le signale, le barème est appliqué par le noyau. */
  | { type: "acte"; acte: string }
  /** Levée d'opacité : le joueur a pu comprendre un élément opaque de la strate, à l'usage. */
  | { type: "levee"; element: string }
  /**
   * Trace pour le journal de session (#26) : ce que la strate écrit au joueur (un objectif, une
   * ligne de registre), ou un moment à dater (le premier jour d'un hiver).
   */
  | { type: "trace"; cle: string; valeurs?: Record<string, number>; objet?: string };

/** État d'un générateur pseudo-aléatoire, rangé dans l'état de la strate. */
interface EtatAlea {
  s: number;
}
/** Tire un nombre dans [0, 1) et fait avancer le générateur. Fourni par `noyau/logique`. */
declare function tirer(alea: EtatAlea): number;
```

Le noyau calcule `EffetsActifs` à partir des artefacts possédés, de leur usure (niveau = profondeur − origine) et du plafond ×4, au démarrage de chaque strate (`effetsActifs`, dans `src/noyau/logique/artefacts.ts`). La strate n'a pas à connaître le catalogue, qui est une donnée du noyau (`src/noyau/logique/catalogue.ts`).

De même, la strate ne connaît pas le poids de ses actes de compréhension : le barème est une donnée du noyau (`src/noyau/logique/comprehension.ts`, [`comprehension.md`](comprehension.md)). Un acte qu'il ne connaît pas est ignoré.

## 5. La vue

Chaque strate fournit un composant Svelte racine. Le noyau le monte sous le bandeau, dans une zone sans marge, haute d'au moins un écran et disposée en colonne. La vue y pose son propre fond et ses propres marges ; pour couvrir toute la zone, sa racine prend `flex: 1 0 auto`.

```ts
interface ProprietesVue<E, A extends ActionBase> {
  /** L'état de la strate, en lecture seule. Le noyau le rend réactif ; la logique n'en sait rien. */
  etat: Readonly<E>;
  /** Envoie une action. Elle est mise en file et appliquée au début du tick suivant. */
  agir: (action: A) => void;
  /** Les commandes du noyau accessibles à la strate. */
  noyau: CommandesNoyau;
  /** Texte d'une clé, à travers la couche d'opacité : des glyphes, tant que son élément est opaque. */
  o: (cle: string) => string;
  /** Un élément déclaré dans `opacite` est-il levé ? Un élément que la strate ne déclare pas l'est. */
  lisible: (element: string) => boolean;
  /** « remontee » pendant la fin « Remonter » : interface visible, rien à faire. */
  mode: "jeu" | "remontee";
  /** Ce que la strate fait entendre : ses sons, ses voix, ses notes (voir « Le son », plus bas). */
  son: SonStrate;
}

interface CommandesNoyau {
  /** Demande la descente. Le noyau la refuse tant que le seuil n'est pas atteint. */
  demanderFouille(): void;
  /** La strate ouvre son aide, qu'elle affiche elle-même ; le noyau note la consultation (acte « sans aide »). */
  ouvrirAide(): void;
  /** Termine la partie. Seulement au fond. */
  terminer(fin: "remonter" | "rester"): void;
}

/** Ce qu'exporte `src/strates/sN-nom/index.ts`. */
interface DefinitionStrate<E, A extends ActionBase> {
  logique: LogiqueStrate<E, A>;
  /** Le composant Svelte racine. Il est typé en `unknown` ici pour que la logique n'importe pas Svelte. */
  vue: unknown;
  /** Les textes. `fouille.valeur` nomme la valeur convertible à l'écran de fouille (« Crédits gagnés »). */
  textes: Record<string, string>;
  /** Écrit une valeur convertible dans la notation de la strate, pour l'écran de fouille (I1). */
  formaterValeur?(valeur: number): string;
  /** La police et les couleurs de la valeur convertible à l'écran de fouille : le dernier fragment de la strate quittée. */
  apparenceValeur?: { police: string; couleur: string; fond: string };
  /** Les glyphes de ses textes opaques, dans son style. Sans eux, ceux du noyau. */
  glyphes?: string;
  /** Sa banque de sons, que sa vue joue par `son` : chargée au montage, libérée au démontage. */
  sons?: Record<string, SourceSon>;
}
```

- **Réactivité** : côté interface, le noyau enveloppe l'état dans un état réactif Svelte 5 (`rendreStrateReactive`, dans `noyau/ui`). Le rattrapage du chargement et le simulateur travaillent sur un objet brut, sans cette enveloppe.
  - **Piège** : les écritures faites à travers l'enveloppe ne remontent pas dans l'objet d'origine. Une fois l'état enveloppé, le noyau doit travailler sur l'enveloppe (`remplacerEtatStrate`), sinon la logique et la vue divergent. Un test le vérifie.
  - L'état d'une strate doit donc rester un objet ou un tableau simple (pas d'instance de classe) : Svelte n'enveloppe que ceux-là, et c'est aussi ce qu'exige le JSON de la sauvegarde.
- **Opacité** ([#66](https://github.com/DavidGiangiacomo/strates/issues/66)) : tout libellé ou valeur susceptible d'être opaque passe par `o(cle)` ; ce qui ne s'écrit pas, une jauge ou un trait, demande `lisible(element)`.
  - La couche (`CoucheOpacite`, dans `noyau/ui/opacite.svelte.ts`) relit à chaque image les éléments encore opaques (`Noyau.elementsOpaques`). Elle ne réveille la vue que lorsqu'un élément se lève.
  - À la place d'un texte opaque, elle met un glyphe par mot, tiré de la clé : toujours le même pour la même clé. Une valeur écrite par un modèle (« {n} ») est masquée avec son texte.
  - La levée elle-même se calcule dans le noyau, sans Svelte (`noyau/logique/opacite.ts`) : voir [`comprehension.md`](comprehension.md), § 8.
  - Le graphe de dépendances y lit aussi si un nœud est compris, par sa clé (`cleLisible(cle)`) : un nœud ne montre sa formule qu'alors.
- **Son** : la vue joue ses sons par le moteur audio du noyau, qui les libère au démontage (voir ci-dessous).

### Le son

La vue fait entendre la strate par `son`, le moteur audio du noyau ([#46](https://github.com/DavidGiangiacomo/strates/issues/46), `noyau/plateforme/audio.ts`). Le moteur est partagé, pas les sons : chaque strate a sa banque, et aucun son n'est commun à deux strates (§12).

```ts
interface SonStrate {
  /** Joue une fois l'effet `nom` de la banque : volume, vitesse, panoramique, délai, durée. */
  jouer(nom: string, reglage?: ReglageEffet): void;
  /** Règle une ambiance de la banque, en boucle : elle part à un volume non nul, et s'arrête à 0. */
  ambiance(nom: string, reglage: { volume: number; fondu?: number }): void;
  /** Règle une voix tenue de synthèse : hauteur en hertz, volume, timbre, glissement, souffle. */
  voix(id: string, reglage: ReglageVoix): void;
  /** Joue une note de synthèse, ou un accord : une note sur chaque rapport de la fréquence. */
  note(reglage: ReglageNote): void;
}

/** Un son de la banque : un fichier (une adresse donnée par Vite), ou des échantillons calculés. */
type SourceSon =
  | { fichier: string }
  | {
      duree: number;
      stereo?: boolean;
      /** La fréquence du calcul ; celle du contexte par défaut. Le navigateur rééchantillonne. */
      frequence?: number;
      /** Écrit les échantillons. Un long calcul cède la main : un générateur, qui s'arrête à chaque `yield`. */
      calculer(canaux: Float32Array[], frequence: number): void | Iterator<unknown>;
      /** Pour une ambiance : la fin fondue dans le début, sur `raccord` secondes, sans couture. */
      raccord?: number;
    };
```

- **La banque** se déclare dans `DefinitionStrate.sons`, dans `vue/sons.ts`. Le noyau l'ouvre au montage de la vue : ses fichiers se téléchargent tout de suite. Il la libère quand la strate est quittée : tout se tait en un bref fondu.
- **Les sons calculés ne figent jamais l'image** ([#59](https://github.com/DavidGiangiacomo/strates/issues/59)) :
  - après l'ouverture du son, ils se calculent un par un, en tâche de fond ;
  - un effet demandé avant son tour se calcule aussitôt, pour sonner tout de suite ;
  - un long calcul cède la main : écrit en générateur, il s'arrête à chaque `yield`, et le moteur le poursuit à la tâche suivante. Une ambiance qui cède la main ne se calcule donc pas d'un coup quand on la demande : elle passe en tête, et part en fondu dès qu'elle est prête ;
  - une banque étouffée ne calcule rien. La strate qui arrive, ouverte muette pendant la descente, ne fige pas le travelling : ses sons se calculent quand son temps part ;
  - une rumeur sans aigus peut se calculer plus bas (`frequence`), à moindre coût : le navigateur la rééchantillonne.
- **La boîte à outils de la synthèse** (`noyau/plateforme/synthese.ts`) donne aux banques des bruits, des filtres, un panoramique et de quoi finir un son. C'est un outil technique, comme le moteur : chaque banque y compose ses propres sons.
- **Les ambiances et les voix se règlent.** La vue redit ce qui doit sonner à chaque changement (dans un `$effect`, par exemple), et le moteur s'y rend en douceur.
  - Une voix glisse vers sa nouvelle hauteur, et peut respirer : une houle lente de son volume.
  - Deux voix presque justes battent d'elles-mêmes, car rien n'est simulé : c'est ce dont le chœur a besoin ([fiche](strates/strate-5.md), § 6).
  - Les timbres sont cinq voyelles chantées (`a`, `e`, `i`, `o`, `ou`), le sinus et le triangle.
- **Les effets et les notes se jouent une fois.** Une banque n'en fait pas sonner plus de 32 à la fois.
- **Le son s'ouvre au premier geste du joueur**, car aucun navigateur n'en joue avant. Un effet ou une note demandés plus tôt sont perdus ; une ambiance ou une voix partent au geste. Le son se tait quand l'onglet est caché.
- **Pendant le passage**, la strate figée est aussi muette : sa banque s'étouffe au coup de pioche, et revient quand le temps repart. La strate qui arrive commence muette.
- **Le volume global et le son coupé** se gardent dans le navigateur (`strates.son`) ; le menu système les règle ([#48](https://github.com/DavidGiangiacomo/strates/issues/48)). Un limiteur protège la sortie.
- **Un appel ne lève jamais d'erreur** : ni son coupé, ni sans Web Audio, ni après le démontage, ni quand le navigateur en lève une. Celle-ci est signalée une fois dans la console, comme un nom absent de la banque.
- **Le sol a ses sons**, ceux du noyau, calculés (`noyau/ui/sons.ts`) : le coup sourd du sol qui résiste ; le coup de pioche, avec la fissure qui craque et un éboulement ; le grondement de la descente ([storyboard](strates/descente-1-2.md), P2 et P5).
- **Les strates ont les leurs** : la surface et les caves ([#59](https://github.com/DavidGiangiacomo/strates/issues/59) ; fiches 1 et 2, § 6). Les outils de développement les font entendre un à un : un effet se joue, une ambiance se met ou s'arrête.
- **Tests** : une vue montée dans un test reçoit `SILENCE`. Le moteur se teste sur un contexte simulé (`noyau/plateforme/audio.test.ts`). Son rendu réel a été vérifié dans Chromium, hors ligne : deux voix à une quinte juste ne battent pas ; décalées de 10 cents, elles battent à 2 Hz, comme le veut l'acoustique.

## 6. La boucle du noyau

Implémentation : la classe `Noyau` (`src/noyau/logique/noyau.ts`) pour la logique, et `demarrerBoucle` (`src/noyau/plateforme/boucle.ts`) pour le rythme des images du navigateur.

- **État global** (`EtatNoyau`) : `{ profondeur, artefacts, kappa, meta }`, plus la **graine de la partie** et l'état de chaque strate visitée, avec sa version. La graine d'une strate est dérivée de celle de la partie et du numéro de la strate : une même partie redonne toujours les mêmes tirages.
- **Registre** : associe chaque profondeur à une strate chargée à la demande. Il vérifie que la strate chargée se déclare bien à cette profondeur. Un chargement raté peut être retenté.
- **En session, onglet visible** : un pas fixe de 0,1 s (10 ticks par seconde), mesuré avec l'horloge monotone du navigateur. Un pas trop grand est découpé en pas de `pasMax` au plus.
- **Onglet caché ou fermé, ordinateur en veille** : c'est une absence. À chaque image, la boucle lit aussi l'horloge système (`Noyau.avancerJusqua`) : un écart de plus de 2 s avec la référence déclenche le rattrapage (`Noyau.rattraper`), selon les règles d'horloge de D-005. Au chargement, le rattrapage part de la référence de la sauvegarde. Un recul d'horloge compte pour zéro ; au-delà de 5 minutes, il est noté une fois par épisode dans les perturbations du journal.
  - Tant que l'onglet est caché, la boucle passe les images que le navigateur lui donne encore (Firefox en donne quelques-unes, de plus en plus rares). L'absence est rattrapée en une fois, à la première image du retour : un seul plafond, un seul résumé.
  - La sauvegarde écrit la référence sans la déplacer : une sauvegarde faite pendant que l'onglet est caché garde l'absence à rattraper.
- **Hors-ligne standard** : le noyau simule 80 % de l'absence, plafonnée à 12 h, par ticks de `pasMax` au plus. En politique propre, il appelle `absence()`. Le temps rattrapé s'ajoute à `tempsHorsLigne`, pas à `tempsDeJeu`. Le rattrapage du chargement se fait avant l'enveloppe réactive, sur l'objet brut ; en session, il passe par l'enveloppe, comme les ticks (12 h de la strate factice : moins de 0,1 s dans Chromium).
- **Bandeau** (`noyau/ui/Bandeau.svelte`, §12) : 24 px en haut de l'écran, identique quelle que soit la strate montée, avec la Profondeur, les artefacts, la Compréhension (« Compréhension 22 % ») et le bouton « creuser ». À partir de κ = 50, un bouton « graphe » ouvre le graphe de dépendances de la strate. Au-delà, les formules réelles s'y écrivent une à une, et celle de la conversion sur l'écran de fouille ([`comprehension.md`](comprehension.md), § 8). Le bouton « creuser » a le même aspect avant et après le seuil ; seule sa réponse change. Avant le seuil, `demanderFouille()` refuse : le bandeau tressaille et le sol sonne sourd, sans texte ni pénalité (un bref assombrissement si le joueur préfère moins de mouvement). Le bouton d'une strate qui appellerait `CommandesNoyau.demanderFouille()` a la même réponse. Au bout, après « creuser », le bouton « menu » ouvre le menu système.
- **Menu système** (`noyau/ui/Menu.svelte`, [#48](https://github.com/DavidGiangiacomo/strates/issues/48)) : un volet sous le bandeau, à droite, dans sa palette, ouvert pendant le jeu. Un seul volet est ouvert à la fois : l'inventaire, le graphe ou le menu.
  - **Le son** : le volume et le son coupé du moteur, gardés dans le navigateur.
  - **La taille du texte** : 100, 115 ou 130 %, un zoom de tout le jeu (`noyau/plateforme/affichage.ts`), gardé dans le navigateur (`strates.texte`) et appliqué avant le premier rendu (`main.ts`). Chaque strate garde sa disposition, en plus grand.
    - Le zoom est aussi donné en variable CSS, `--zoom`. Une feuille de style qui mesure sur la fenêtre divise par elle ses unités `vh` et `vw` : `calc(100vh / var(--zoom, 1) - 24px)`.
    - Un calque qui se place d'après la fenêtre (la fissure, le coup de pioche, la fente, le travelling) divise ses mesures par le zoom (`noyau/ui/ecran.ts`).
    - La fissure et le coup de pioche visent le bouton « creuser » là où il est (`milieuCreuser`).
  - **La sauvegarde** : l'exporter en fichier `.json`, la copier en texte, l'importer d'un fichier (D-005). L'import vérifie la version et applique les migrations avant de rien toucher ; il refuse une sauvegarde illisible ou plus récente, et ne fait rien si le navigateur ne garde aucune donnée.
  - **Recommencer** se confirme en deux temps, avec l'export proposé. L'import et la réinitialisation arrêtent tout, sauvegardent une dernière fois la partie en cours, qui devient la « précédente », puis rechargent la page sur la nouvelle partie.
  - **La version** et le commit du build, que notent les retours de playtest, et les crédits.
- **Inventaire** (`noyau/ui/Inventaire.svelte`, [#45](https://github.com/DavidGiangiacomo/strates/issues/45)) : le compteur des artefacts du bandeau l'ouvre, pendant le jeu. C'est un volet sous le bandeau, dans sa palette, et la strate continue de vivre dessous.
  - Les objets y sont rangés par couche d'origine, de la surface vers le bas (`inventaire`, dans `noyau/logique/artefacts.ts`). Chacun montre son nom et son usure : trois crans qui se vident, puissant, utile, décoratif, puis un caillou au nom gris, et toujours le mot (`noyau/ui/Usure.svelte`).
  - Le nom est celui d'en haut jusqu'à ce que la strate d'en dessous l'ait nommé, puis celui d'en bas. Le noyau le sait par `nommes()`, qu'il interroge pour la strate courante et dont il note la réponse au journal à la descente (`Noyau.nommes`) : l'objet garde ce nom plus bas.
  - L'inventaire ne dit pas ce que fait un objet : la découverte reste dans la strate.
- **Le retour du joueur** ([#58](https://github.com/DavidGiangiacomo/strates/issues/58) ; [`bible.md`](bible.md), § 10) : `noyau/ui/reprise.ts` le rédige, `noyau/ui/Retour.svelte` l'affiche sous le bandeau, dans sa palette, jusqu'à « reprendre ». La strate vit dessous.
  - **Le rappel de reprise** vient après une absence d'au moins 30 minutes (`ABSENCE_A_RAPPELER`), au chargement comme au retour sur un onglet resté ouvert : une pause ne rappelle rien. Il tient en trois lignes : le lieu, écrit par le noyau (« Profondeur 2 · Les caves »), puis les deux lignes de la strate, lues par `Noyau.rappel()` dans `rappel()`. Une strate qui n'en a pas ne rappelle que le lieu.
  - **Le résumé de l'absence** suit le rappel, à partir d'une minute d'absence : « Absence : 8 h 12 min, comptée à 80 %. », et « sur 12 h » au plafond. En politique propre, les lignes de la strate suivent la durée. Le fond n'a pas de résumé.
  - Le bloc ne parle que de la strate en jeu : il se cache pendant la fouille et s'efface quand la strate change. Une nouvelle absence le remplace.
- **Actions** : mises en file, appliquées au début du tick suivant dans l'ordre d'arrivée.
- **Journal de session** ([#26](https://github.com/DavidGiangiacomo/strates/issues/26), `src/playtest/`) : pour les playtests, et seulement si l'observateur l'a demandé (`?journal=T3` dans l'adresse).
  - Il observe le noyau (`Noyau.observateur`), qui le prévient de chaque action appliquée et de chaque événement des strates.
  - Il note le relevé de la strate (`releve`), toutes les 5 secondes de jeu et après chaque action, ainsi que les traces, le seuil, ce que signale le passage (réponses de « creuser », fouille, phases) et les ouvertures de l'aide.
  - Le noyau n'en dépend pas : sans journal, l'observateur est vide.
- **Après chaque tick** : le noyau lit `seuil()`, et note au journal l'heure où il est atteint (`seuil.le`, avec l'issue). C'est alors que se juge l'acte « sans aide » : l'aide ouverte après le seuil ne coûte plus rien. Si le seuil est atteint et `automatique` vaut vrai, `Noyau.descenteAutomatique` le signale, et l'interface lance la descente sans le joueur, à la fin de l'image. Sinon, le bouton de fouille du bandeau cesse de résister.
- **Sauvegarde** : selon D-005 (toutes les 30 s, en arrière-plan, après chaque descente). Le format, sa validation et les migrations sont dans `noyau/logique/sauvegarde.ts` et `migrations.ts` ; le stockage, la rotation des deux emplacements et la mise de côté des sauvegardes illisibles, dans `noyau/plateforme/sauvegarde.ts`. Les migrations d'une strate s'appliquent à son démarrage. De vraies sauvegardes de chaque version publiée sont archivées dans `tests/sauvegardes/` et doivent toutes se charger.
  - Le format 2 ([#56](https://github.com/DavidGiangiacomo/strates/issues/56)) ajoute à chaque entrée du journal de partie ses actes de compréhension. La migration du format 1 les laisse vides.
  - Le format 3 ([#66](https://github.com/DavidGiangiacomo/strates/issues/66)) y ajoute les éléments opaques levés à l'usage (`leves`). La migration du format 2 les laisse vides : les objets et le délai lèveront le reste.
  - Le format 4 ([#45](https://github.com/DavidGiangiacomo/strates/issues/45)) y ajoute les objets d'en haut que la strate a nommés (`nommes`), notés à la descente. La migration du format 3 les laisse vides, sauf pour des caves déjà quittées : elles avaient nommé tous les objets de la surface avant leur seuil.

### La descente

La séquence vue par le joueur, plan par plan, est dans le [storyboard du passage 1 → 2](strates/descente-1-2.md) ([#11](https://github.com/DavidGiangiacomo/strates/issues/11)).

La logique est dans `Noyau` (`ouvrirFouille`, `reboucher`, `descendre`, `reprendre`), testée dans `noyau/logique/descente.test.ts`. Le spectacle et son minutage sont dans `noyau/ui/passage.svelte.ts` ; l'écran de fouille est `noyau/ui/Fouille.svelte`. Au coup de pioche, la strate se fend : `noyau/ui/Fente.svelte` montre deux copies de sa vue, découpées de part et d'autre de la fissure (`moitiesFente`), qui glissent et s'effacent, puis remontent au rebouchage. La strate étant figée, une copie de son DOM suffit.

1. `demanderFouille()` : le noyau vérifie que le seuil est atteint (`Noyau.demanderFouille`). S'il n'y a pas de strate dessous (`strateSuivante` vaut null, comme sous les caves dans le MVP), l'interface le dit, et rien ne s'ouvre.
2. `ouvrirFouille()` : les actions en attente sont appliquées, puis la strate se fige (`suspendu`) : ni tick ni absence tant que la fouille est ouverte. Points de fouille = `⌊log₁₀(valeurConvertible()) × 1,4⌋` (D-002) : `pointsDeFouille`, lus à l'ouverture. Rien n'est encore noté.
3. Écran de choix sur le catalogue de la strate quittée, par coût croissant (`catalogueParCout`), avec la présélection (`preselection`).
   - Il écrit la valeur convertible et le prix d'un point de plus (`valeurPourPoints`) dans la notation de la strate quittée : `DefinitionStrate.formaterValeur` et la clé de texte `fouille.valeur` (I1). La valeur prend aussi la police et les couleurs de la strate (`apparenceValeur`).
   - Jusqu'à « descendre », le joueur peut **reboucher** (`reboucher()`) : rien n'est noté, et la strate reprend là où elle s'était figée.
   - En descente automatique, `descendre()` sans choix ouvre la fouille et applique la présélection, sans écran.
4. `descendre(maintenant, emportes)` vérifie le choix et charge la strate suivante. Si le chargement échoue, rien n'a changé : la fouille reste ouverte. Puis tout s'engage d'un coup, avant l'animation :
   - la Compréhension de la strate quittée se conclut : « sans artefact » est constaté si aucun objet n'y agissait, puis le gain de ses actes est crédité à κ et noté au journal (`kappaGagne`) ;
   - les objets que la strate quittée a nommés sont notés au journal (`nommes`) : ils gardent leur nom d'en bas ;
   - `fouiller` note la fouille au journal (points, objets emportés, objets abandonnés), à côté du seuil et de l'issue.
5. Les objets emportés rejoignent `artefacts` (`fouiller`), et la Profondeur augmente de 1. Une action restée en file pour la strate quittée est oubliée.
6. L'état de la strate quittée reste tel quel dans `strates` : gelé, gardé dans la sauvegarde.
7. La strate suivante s'installe : ses effets sont calculés, puis `etatInitial()` est appelé avec une nouvelle graine, le journal et ces effets, et une entrée de journal s'ouvre. L'interface monte sa vue, puis sauvegarde.
8. La nouvelle strate reste figée pendant la transition (4 s, puis 1 s d'arrivée), qui ne fait que représenter ce qui est déjà fait : le bandeau change de Profondeur à mi-course, puis reçoit les objets à l'arrivée, et enfin κ. Tous les objets qui ne sont pas encore des cailloux descendent avec le joueur : à mi-course, avec la Profondeur, les anciens perdent un cran d'usure (`noyau/ui/Descente.svelte`, [#45](https://github.com/DavidGiangiacomo/strates/issues/45)). Son temps part à la fin, par `reprendre()`. Un rechargement pendant la transition retrouve la nouvelle strate, et ne rejoue pas la transition.

### Les fins

Au fond, la vue appelle `noyau.terminer()`. Pour « Remonter », le noyau monte successivement les vues des strates 7 à 1 en mode « remontee », avec l'état préparé par `remontee()`. La surface y reçoit son état sauvegardé et la durée écoulée : sa production a continué. Pour « Rester », le noyau marque la sauvegarde « au fond ».

## 7. Le journal de partie

Le journal vit dans `meta`, dans la sauvegarde (D-005). Il alimente la coupe, les fins, le rappel de reprise et certaines strates (la strate 7 lit l'issue de la strate 6).

```ts
interface Meta {
  journal: Journal;
  fin?: "remonter" | "rester";
}

interface Journal {
  strates: EntreeJournal[];
}

interface EntreeJournal {
  strate: NumeroStrate;
  /** Horodatage d'arrivée dans la strate (ms). */
  arrivee: number;
  /** Temps de jeu actif et temps d'absence compté, en secondes. */
  tempsDeJeu: number;
  tempsHorsLigne: number;
  aideConsultee: boolean;
  /** Les actes de compréhension accomplis dans la strate, une fois chacun (docs/comprehension.md). */
  actes: string[];
  /** Le κ que ces actes ont rapporté, crédité à la descente (à l'arrivée, pour le fond). */
  kappaGagne?: number;
  /** Les éléments opaques levés à l'usage, une fois chacun (docs/comprehension.md, § 4). */
  leves: string[];
  /** Les objets d'en haut que la strate a nommés, notés à la descente : ils gardent ce nom plus bas. */
  nommes: string[];
  seuil?: { le: number; issue?: string };
  /** La fouille à la sortie de la strate (D-002). */
  fouille?: { points: number; emportes: string[]; abandonnes: string[] };
  /** Reculs d'horloge constatés, en secondes : « stratigraphie perturbée » dans la coupe (D-005). */
  perturbations: { le: number; recul: number }[];
}
```

## 8. Confrontation aux huit strates

Le contrat a été relu strate par strate, en particulier pour les strates atypiques 5 à 8.

| Strate | Leviers | Valeur convertible | Seuil | Hors-ligne | Rendu | Particularités couvertes |
|---|---|---|---|---|---|---|
| 1 — La surface | production | Crédits gagnés | 1 M cr/s de production | standard | Svelte, DOM | « creuser » est le bouton de fouille du bandeau, que rien ne mentionne ; `remontee()` fait tourner la production pendant l'absence |
| 2 — Les caves | récolte ; conservation | Grain récolté | trois grands hivers de suite sans rupture | propre : l'absence s'arrête au premier jour de l'hiver (voir § 9) | Svelte, DOM + SVG | les saisons sont un cycle interne à l'état ; les ruptures de stock se comptent dans l'état |
| 3 — L'atelier | ressort ; plan | Pièces produites | toute la nomenclature posée dans le plan plein, rien ne frotte, tout est entraîné par le ressort | standard | Svelte, grille DOM ou SVG | poser, tourner, échanger et limer sont des actions avec coordonnées, sérialisables ; une gêne se montre au bout d'un tour, et le pas du tick est coupé à ce moment ([fiche](strates/strate-3.md), § 3) |
| 4 — Le réseau | débit | Flux acheminé | 5 min sans goulot | standard, ou propre (voir § 9) | Svelte + SVG | « goulot trouvé avant le signal » est un acte émis par la strate ; le graphe de dépendances ne doit pas résoudre la strate |
| 5 — Le chœur | bourdon ; tenue | Voix venues, cachées (≈ 10¹⁰) | le point d'orgue, puis l'accord plein tenu 90 s | propre : les Voix viennent pendant l'absence, mais les 90 s ne s'écoulent qu'en présence du joueur (voir § 9) | Canvas + Web Audio | aucun nombre dans la vue ; les nombres existent dans l'état, invisibles ; à l'écran de fouille, la valeur s'écrit en barres |
| 6 — La dette | confiance ; report | prix des promesses honorées, sans les intérêts | la grande crue honorée (soldée), ou un défaut, via `issue` | propre : les échéances tombent pendant l'absence, sans plafond (voir § 9) | Svelte, DOM | l'issue est journalisée et transmise à la strate 7 par `ContexteArrivee.journal` ; le pas du tick est coupé à chaque crue, de trente secondes ([fiche](strates/strate-6.md), § 3) |
| 7 — Le lit | dépôt | Sédiments déposés (≈ 10³) | automatique, via `automatique` | propre : 100 %, sans plafond, calcul direct sur des semaines | Canvas | la descente se fait sans écran ; tout le catalogue est emporté (D-003) |
| 8 — Le fond | aucun (`null`) | — | jamais atteint | aucune | Svelte, DOM | pas de production ; lit le journal de partie ; appelle `terminer()` |

## 9. Questions renvoyées aux fiches de strate

Le contrat les permet toutes ; c'est la fiche de chaque strate qui tranche.

- **Strate 1** ([#5](https://github.com/DavidGiangiacomo/strates/issues/5)) : que fait le bouton « creuser » avant le seuil ? *Tranché par la [fiche](strates/strate-1.md), § 4 : c'est le bouton de fouille du bandeau ; avant le seuil, le sol résiste (un tressaillement, un son sourd, sans texte).*
- **Strate 2** ([#6](https://github.com/DavidGiangiacomo/strates/issues/6)) : une rupture de stock pendant l'absence compte-t-elle contre les trois hivers ? Si oui, il faut une politique hors-ligne propre, pour que l'absence ne fasse pas perdre le seuil sans que le joueur puisse réagir. *Tranché par la [fiche](strates/strate-2.md), § 10 : aucune rupture n'arrive pendant l'absence. Politique propre, « l'hiver attend » : l'absence compte à 80 % pendant la saison chaude, jusqu'au premier jour de l'hiver ou jusqu'à la veille d'une rupture ; en hiver, elle ne compte pas.*
- **Strate 4** ([#62](https://github.com/DavidGiangiacomo/strates/issues/62)) : les 5 minutes sans goulot se comptent-elles pendant l'absence ?
- **Strate 5** ([#7](https://github.com/DavidGiangiacomo/strates/issues/7)) : `formules()` réintroduirait des nombres dans la seule strate qui n'en montre pas. Faut-il l'omettre, ou écrire les formules sans chiffres ? *Tranché par la [fiche](strates/strate-5.md), § 7 : le chœur n'implémente pas `formules()`. Ses repères, gagnés en tenant un rapport juste, en tiennent lieu. La fiche demande aussi une extension du contrat (§ 9) : à l'écran de fouille, la strate doit pouvoir fournir un composant à la place de la chaîne de `formaterValeur`, pour écrire sa valeur en barres. Et sa politique hors-ligne est propre (§ 10) : les 90 secondes du seuil ne s'écoulent pas pendant l'absence.*
- **Strate 6** ([#64](https://github.com/DavidGiangiacomo/strates/issues/64)) : un défaut déclenche-t-il la descente, ou la rend-il seulement possible ? *Réponse de la [fiche](strates/strate-6.md), § 4 : il la rend seulement possible. Le §6 réserve au lit la seule descente sans le joueur ; en défaut, le livre ne bouge plus, et le joueur creuse quand il veut. Sa politique hors-ligne est propre (§ 10) : les échéances tombent à leur crue, sans plafond ; le rapport compte à 80 %, douze heures au plus, sauf pendant les douze crues de la grande crue, où l'absence compte en entier.*
- **Strate 7** ([#75](https://github.com/DavidGiangiacomo/strates/issues/75)) : `absence()` doit calculer des semaines de sédimentation directement, sans simuler tick par tick.

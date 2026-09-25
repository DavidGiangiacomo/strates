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

  /** Accroches de la Compréhension, pour les affichages débloqués par κ (phases 2 et 3). */
  graphe?(etat: E): GrapheDependances;
  formules?(): Formule[];
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
  noeuds: { id: string; cle: string }[]; // `cle` : clé de texte du libellé
  liens: { de: string; vers: string }[];
}

interface Formule {
  cle: string;        // l'élément d'interface concerné
  expression: string; // la formule lisible, écrite dans la notation de la strate
}
```

## 4. Ce que le noyau fournit à la logique

```ts
interface ContexteArrivee {
  /** Graine du générateur aléatoire de la strate. */
  graine: number;
  /** Le parcours jusqu'ici, en lecture seule (par exemple, l'issue de la strate 6 pour la strate 7). */
  journal: Readonly<Journal>;
}

interface ContexteTick {
  /** Effets des artefacts actifs, après usure et plafond ×4 (D-002). */
  effets: EffetsActifs;
  /** Signale un événement au noyau. */
  emettre(evenement: EvenementStrate): void;
}

interface EffetsActifs {
  /** Multiplicateur total sur un levier ; vaut 1 si aucun artefact n'agit dessus. */
  multiplicateur(levier: string): number;
  /** Un affichage, un raccourci ou un effet unique est-il actif ? La strate ignore les identifiants qu'elle ne connaît pas. */
  actif(effet: string): boolean;
}

type EvenementStrate =
  /** Acte de compréhension : la strate le signale, le barème est appliqué par le noyau. */
  { type: "acte"; acte: string };

/** État d'un générateur pseudo-aléatoire, rangé dans l'état de la strate. */
interface EtatAlea {
  s: number;
}
/** Tire un nombre dans [0, 1) et fait avancer le générateur. Fourni par `noyau/logique`. */
declare function tirer(alea: EtatAlea): number;
```

Le noyau calcule `EffetsActifs` à partir des artefacts possédés, de leur usure (niveau = profondeur − origine) et du plafond ×4. La strate n'a pas à connaître le catalogue.

## 5. La vue

Chaque strate fournit un composant Svelte racine. Le noyau le monte sous le bandeau.

```ts
interface ProprietesVue<E, A extends ActionBase> {
  /** L'état de la strate, en lecture seule. Le noyau le rend réactif ; la logique n'en sait rien. */
  etat: Readonly<E>;
  /** Envoie une action. Elle est mise en file et appliquée au début du tick suivant. */
  agir: (action: A) => void;
  /** Les commandes du noyau accessibles à la strate. */
  noyau: CommandesNoyau;
  /** Texte d'une clé, à travers la couche d'opacité (phase 2 ; d'ici là, le texte clair). */
  o: (cle: string) => string;
  /** « remontee » pendant la fin « Remonter » : interface visible, rien à faire. */
  mode: "jeu" | "remontee";
}

interface CommandesNoyau {
  /** Demande la descente. Le noyau la refuse tant que le seuil n'est pas atteint. */
  demanderFouille(): void;
  /** Ouvre l'aide de la strate ; le noyau note la consultation (acte « sans aide »). */
  ouvrirAide(): void;
  /** Termine la partie. Seulement au fond. */
  terminer(fin: "remonter" | "rester"): void;
}

/** Ce qu'exporte `src/strates/sN-nom/index.ts`. */
interface DefinitionStrate<E, A extends ActionBase> {
  logique: LogiqueStrate<E, A>;
  /** Le composant Svelte racine. Il est typé en `unknown` ici pour que la logique n'importe pas Svelte. */
  vue: unknown;
  textes: Record<string, string>;
}
```

- **Réactivité** : côté interface, le noyau enveloppe l'état dans un état réactif Svelte 5 (`rendreStrateReactive`, dans `noyau/ui`). Le hors-ligne et le simulateur travaillent sur un objet brut, sans cette enveloppe.
  - **Piège** : les écritures faites à travers l'enveloppe ne remontent pas dans l'objet d'origine. Une fois l'état enveloppé, le noyau doit travailler sur l'enveloppe (`remplacerEtatStrate`), sinon la logique et la vue divergent. Un test le vérifie.
  - L'état d'une strate doit donc rester un objet ou un tableau simple (pas d'instance de classe) : Svelte n'enveloppe que ceux-là, et c'est aussi ce qu'exige le JSON de la sauvegarde.
- **Opacité** : tout libellé ou valeur susceptible d'être opaque passe par `o(cle)`. La couche d'opacité ([#66](https://github.com/DavidGiangiacomo/strates/issues/66)) remplacera l'implémentation sans toucher aux strates.
- **Son** : la vue joue ses sons par le moteur audio du noyau ([#46](https://github.com/DavidGiangiacomo/strates/issues/46)), qui les libère au démontage.

## 6. La boucle du noyau

Implémentation : la classe `Noyau` (`src/noyau/logique/noyau.ts`) pour la logique, et `demarrerBoucle` (`src/noyau/plateforme/boucle.ts`) pour le rythme des images du navigateur.

- **État global** (`EtatNoyau`) : `{ profondeur, artefacts, kappa, meta }`, plus la **graine de la partie** et l'état de chaque strate visitée, avec sa version. La graine d'une strate est dérivée de celle de la partie et du numéro de la strate : une même partie redonne toujours les mêmes tirages.
- **Registre** : associe chaque profondeur à une strate chargée à la demande. Il vérifie que la strate chargée se déclare bien à cette profondeur. Un chargement raté peut être retenté.
- **En session, onglet visible** : un pas fixe de 0,1 s (10 ticks par seconde), mesuré avec l'horloge monotone du navigateur. Un pas trop grand est découpé en pas de `pasMax` au plus.
- **Onglet caché ou fermé** : c'est une absence. Au retour, l'écart est calculé selon les règles d'horloge de D-005, puis la politique hors-ligne de la strate s'applique.
- **Hors-ligne standard** : le noyau simule 80 % de l'absence, plafonnée à 12 h, par ticks de `pasMax` au plus. En politique propre, il appelle `absence()`.
- **Actions** : mises en file, appliquées au début du tick suivant dans l'ordre d'arrivée, et journalisées si le journal de session est actif.
- **Après chaque tick** : le noyau lit `seuil()`. Si le seuil est atteint et `automatique` vaut vrai, il lance la descente sans le joueur. Sinon, il rend le bouton de fouille disponible dans le bandeau.
- **Sauvegarde** : selon D-005 (toutes les 30 s, en arrière-plan, après chaque descente).

### La descente

1. `demanderFouille()` : le noyau vérifie que le seuil est atteint.
2. Points de fouille = `⌊log₁₀(valeurConvertible()) × 1,4⌋` (D-002).
3. Écran de choix sur le catalogue de la strate quittée, avec la présélection. En descente automatique, la présélection s'applique sans écran.
4. Le journal reçoit le seuil, l'issue et la fouille (points, objets emportés, objets abandonnés).
5. Les objets emportés rejoignent `artefacts`, et la Profondeur augmente de 1.
6. L'état de la strate quittée est gelé et gardé dans la sauvegarde.
7. La strate suivante est chargée, `etatInitial()` est appelé avec une nouvelle graine et le journal, puis sa vue est montée. Le jeu sauvegarde.

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
| 1 — La surface | production | Crédits gagnés | palier de production | standard | Svelte, DOM | le bouton « creuser » de la vue appelle `demanderFouille()` ; `remontee()` fait tourner la production pendant l'absence |
| 2 — Les caves | récolte ; conservation | Grain récolté | trois hivers sans rupture | standard, ou propre (voir § 9) | Svelte, DOM | les saisons sont un cycle interne à l'état ; les ruptures de stock se comptent dans l'état |
| 3 — L'atelier | production | Pièces produites | grille pleine qui fonctionne | standard | Svelte, grille DOM ou Canvas | placer et retirer sont des actions avec coordonnées, sérialisables |
| 4 — Le réseau | débit | Flux acheminé | 5 min sans goulot | standard, ou propre (voir § 9) | Svelte + SVG | « goulot trouvé avant le signal » est un acte émis par la strate ; le graphe de dépendances ne doit pas résoudre la strate |
| 5 — Le chœur | voix | Voix cumulées, cachées (≈ 10¹⁰) | accord juste tenu 90 s | standard | Canvas + Web Audio | aucun nombre dans la vue ; les nombres existent dans l'état, invisibles |
| 6 — La dette | rendement des promesses | Engagements honorés | soldée ou défaut, via `issue` | propre : les échéances tombent pendant l'absence | Svelte, DOM | l'issue est journalisée et transmise à la strate 7 par `ContexteArrivee.journal` |
| 7 — Le lit | dépôt | Sédiments déposés (≈ 10³) | automatique, via `automatique` | propre : 100 %, sans plafond, calcul direct sur des semaines | Canvas | la descente se fait sans écran ; tout le catalogue est emporté (D-003) |
| 8 — Le fond | aucun (`null`) | — | jamais atteint | aucune | Svelte, DOM | pas de production ; lit le journal de partie ; appelle `terminer()` |

## 9. Questions renvoyées aux fiches de strate

Le contrat les permet toutes ; c'est la fiche de chaque strate qui tranche.

- **Strate 1** ([#5](https://github.com/DavidGiangiacomo/strates/issues/5)) : que fait le bouton « creuser » avant le seuil ? Le noyau refuse la descente tant que le seuil n'est pas atteint.
- **Strate 2** ([#6](https://github.com/DavidGiangiacomo/strates/issues/6)) : une rupture de stock pendant l'absence compte-t-elle contre les trois hivers ? Si oui, il faut une politique hors-ligne propre, pour que l'absence ne fasse pas perdre le seuil sans que le joueur puisse réagir.
- **Strate 4** ([#62](https://github.com/DavidGiangiacomo/strates/issues/62)) : les 5 minutes sans goulot se comptent-elles pendant l'absence ?
- **Strate 5** ([#7](https://github.com/DavidGiangiacomo/strates/issues/7)) : `formules()` réintroduirait des nombres dans la seule strate qui n'en montre pas. Faut-il l'omettre, ou écrire les formules sans chiffres ?
- **Strate 6** ([#64](https://github.com/DavidGiangiacomo/strates/issues/64)) : un défaut déclenche-t-il la descente, ou la rend-il seulement possible ?
- **Strate 7** ([#75](https://github.com/DavidGiangiacomo/strates/issues/75)) : `absence()` doit calculer des semaines de sédimentation directement, sans simuler tick par tick.

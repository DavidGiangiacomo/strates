// Des joueurs automatiques pour l'atelier (#96), branchés sur le noyau. Ils jouent les profils de la
// fiche (docs/strates/strate-3.md, § 4) :
// - le réflexe pose la pièce la moins chère sur la première case libre, telle quelle : il n'atteint
//   jamais le seuil (I4) ;
// - les autres posent chaque pièce là où la production monte le plus, en gardant des dents libres. Ils
//   rouvrent leur rouage quand il se ferme, font de la place aux grandes pièces, et revoient leur plan
//   de temps en temps : ils tournent ou déplacent ce qui frotte et ce qui ne tourne pas, s'ils y
//   gagnent ;
// - à la fin, tout acheté et posé, ils relient d'un échange ce qui ne tourne pas, liment ce qui frotte,
//   et règlent le reste en tournant ou en échangeant.
// Chaque geste prend quelques secondes de jeu, pendant lesquelles l'atelier produit.
import { creerAlea, tirer } from "../../src/noyau/logique/alea";
import type { Noyau } from "../../src/noyau/logique/noyau";
import type {
  ActionAtelier,
  EtatAtelier,
  PieceAtelier,
} from "../../src/strates/s3-atelier/logique";
import {
  agrandissementVisible,
  analyser,
  coinRessort,
  COTES,
  defPiece,
  dente,
  grille,
  largeur,
  limable,
  oppose,
  PIECES,
  pieceVisible,
  prixPiece,
  prochainAgrandissement,
  restantes,
  TAILLE_MAX,
  type Analyse,
  type Cote,
  type DefPiece,
  type IdPiece,
} from "../../src/strates/s3-atelier/logique/regles";

export interface ProfilAtelier {
  /** Ce qui le caractérise, pour les rapports. */
  description: string;
  /** Secondes entre deux passages. */
  attention: number;
  /** Secondes entre deux revues du plan ; Infinity : jamais. */
  revue: number;
  /** La durée d'un geste, en secondes : acheter et poser, déplacer, échanger, limer. Un quart de tour prend une seconde. */
  geste: number;
  /** Jusqu'à quand il joue en réflexe, en secondes ; Infinity : toujours. */
  reflexeJusqua: number;
  /** La part de son stock qu'il s'autorise à dépenser d'un coup. */
  depense: number;
}

export const NATUREL: ProfilAtelier = {
  description: "passe toutes les 5 s, revoit son plan toutes les 3 min ; un geste prend 3 s",
  attention: 5,
  revue: 180,
  geste: 3,
  reflexeJusqua: 0,
  depense: 1,
};

export const PARFAIT: ProfilAtelier = {
  ...NATUREL,
  description: "passe toutes les 2 s, revoit son plan chaque minute ; un geste prend 2 s",
  attention: 2,
  revue: 60,
  geste: 2,
};

export const APPREND: ProfilAtelier = {
  ...NATUREL,
  description: "réflexe jusqu'à 10 min, puis naturel",
  reflexeJusqua: 600,
};

export const DISTRAIT: ProfilAtelier = {
  ...NATUREL,
  description: "naturel ; passe chaque minute, revoit son plan toutes les 10 min",
  attention: 60,
  revue: 600,
};

export const PRUDENT: ProfilAtelier = {
  ...NATUREL,
  description: "naturel ; ne dépense jamais plus de la moitié de ce qu'il a",
  depense: 0.5,
};

export const DESORDONNE: ProfilAtelier = {
  ...NATUREL,
  description: "naturel, mais ne revoit jamais son plan",
  revue: Infinity,
};

export const REFLEXE: ProfilAtelier = {
  ...NATUREL,
  description:
    "la pièce la moins chère, sur la première case libre, telle quelle ; passe toutes les 5 s",
  revue: Infinity,
  reflexeJusqua: Infinity,
};

type Rot = PieceAtelier["rot"];
type Place = [number, number];

/** À production presque égale, une pose qui garde des dents libres l'emporte : un rouage fermé ne grandit plus. */
const OUVERTURE = 0.003;

/** La dernière ajustée a ses limites : au-delà de ces gestes, le joueur renonce, et la partie ne finit pas. */
const GESTES_FIN_MAX = 600;

/** La case voisine dans la direction `d`. */
const PAS: Record<Cote, Place> = { 0: [-1, 0], 1: [0, 1], 2: [1, 0], 3: [0, -1] };

/** Les quarts de tour qui changent la pièce : une roue n'en a qu'un, un pignon deux. */
function rotationsUtiles(p: PieceAtelier): Rot[] {
  const garde = p.rot;
  const vues = new Set<string>();
  const utiles: Rot[] = [];
  for (const r of [0, 1, 2, 3] as const) {
    p.rot = r;
    const profil = COTES.map((d) => (dente(p, d) ? 1 : 0)).join("");
    if (!vues.has(profil)) {
      vues.add(profil);
      utiles.push(r);
    }
  }
  p.rot = garde;
  return utiles;
}

/** Les coins où une pièce de `s` cases tiendrait, sur des cases libres, ligne après ligne. */
function placesLibres(e: EtatAtelier, s: number, g = grille(e)): Place[] {
  const n = e.taille;
  const places: Place[] = [];
  for (let l = 0; l + s <= n; l++) {
    for (let c = 0; c + s <= n; c++) {
      let libre = true;
      for (let i = 0; i < s && libre; i++) {
        for (let j = 0; j < s && libre; j++) libre = g[(l + i) * n + c + j] === 0;
      }
      if (libre) places.push([l, c]);
    }
  }
  return places;
}

/** Les coins où une pièce de `s` cases tiendrait contre le ressort, ou contre une pièce qui tourne. */
function placesUtiles(e: EtatAtelier, a: Analyse, s: number): Place[] {
  const n = e.taille;
  const g = grille(e);
  const tourne = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= n || y >= n) return false;
    const o = g[x * n + y]!;
    return o === -1 || (o > 0 && a.pieces.get(e.pieces[o - 1]!.repere)?.entrainee === true);
  };
  return placesLibres(e, s, g).filter(([l, c]) => {
    for (let k = 0; k < s; k++) {
      if (tourne(l - 1, c + k) || tourne(l + s, c + k)) return true;
      if (tourne(l + k, c - 1) || tourne(l + k, c + s)) return true;
    }
    return false;
  });
}

/** La case que touche le demi-côté `h` du côté `d` d'une pièce de `s` cases, coin en `[l, c]`. */
function caseTouchee(l: number, c: number, s: number, d: Cote, h: number): Place {
  if (d === 0) return [l - 1, c + h];
  if (d === 1) return [l + h, c + s];
  if (d === 2) return [l + s, c + h];
  return [l + h, c - 1];
}

/**
 * « Garder une dent pour la suite » (fiche, § 4) : chaque région de cases libres devrait garder au moins
 * une dent du rouage tournée vers elle. Un mur de côtés lisses la fermerait pour de bon : plus rien n'y
 * tournerait sans défaire ce qui tourne déjà. Rend le nombre de régions fermées.
 */
function fermeture(e: EtatAtelier, a: Analyse): number {
  const n = e.taille;
  const g = grille(e);
  const region = new Int32Array(n * n).fill(-1);
  const tailles: number[] = [];
  for (let i = 0; i < n * n; i++) {
    if (g[i] !== 0 || region[i] !== -1) continue;
    const k = tailles.length;
    let taille = 0;
    const pile = [i];
    region[i] = k;
    while (pile.length > 0) {
      const j = pile.pop()!;
      taille++;
      const x = Math.floor(j / n);
      const y = j % n;
      for (const d of COTES) {
        const u = x + PAS[d][0];
        const v = y + PAS[d][1];
        if (u < 0 || v < 0 || u >= n || v >= n || g[u * n + v] !== 0 || region[u * n + v] !== -1) {
          continue;
        }
        region[u * n + v] = k;
        pile.push(u * n + v);
      }
    }
    tailles.push(taille);
  }
  if (tailles.length === 0) return 0;
  const dents = tailles.map(() => 0);
  const compter = (l: number, c: number, s: number, d: Cote) => {
    for (let h = 0; h < s; h++) {
      const [x, y] = caseTouchee(l, c, s, d, h);
      const k = x < 0 || y < 0 || x >= n || y >= n ? -1 : region[x * n + y]!;
      if (k >= 0) dents[k]! += 1;
    }
  };
  for (const p of e.pieces) {
    if (!p.case || !a.pieces.get(p.repere)?.entrainee) continue;
    for (const d of COTES) if (dente(p, d)) compter(p.case[0], p.case[1], largeur(p), d);
  }
  const r = coinRessort(n);
  for (const d of COTES) compter(r, r, 2, d);
  return dents.filter((x) => x === 0).length;
}

/** Les cases que couvrirait une pièce de `s` cases posée en `place`. */
function cases([l, c]: Place, s: number): string[] {
  const liste: string[] = [];
  for (let i = 0; i < s; i++) for (let j = 0; j < s; j++) liste.push(`${l + i},${c + j}`);
  return liste;
}

interface Pose {
  place: Place;
  rot: Rot;
  /** La production de l'atelier, par tour, une fois la pièce posée. */
  production: number;
  /** Elle ne ferme aucune région de cases libres : le rouage pourra y grandir. */
  ouverte: boolean;
  score: number;
}

/**
 * La meilleure place pour `p`, une pièce de l'état `e`, qu'on modifie le temps de l'essai : là où la
 * production de l'atelier monte le plus, la pièce entraînée, en gardant des dents libres, et plutôt
 * sans fermer le rouage. Null si elle ne tourne nulle part.
 */
function meilleurePose(
  e: EtatAtelier,
  p: PieceAtelier,
  interdites?: ReadonlySet<string>,
): Pose | null {
  const garde = { case: p.case, rot: p.rot };
  const s = largeur(p);
  p.case = null;
  const a0 = analyser(e);
  // Une pose est ouverte si elle ne ferme aucune région de plus.
  const avant = fermeture(e, a0);
  const places = placesUtiles(e, a0, s).filter(
    (place) => !interdites || !cases(place, s).some((x) => interdites.has(x)),
  );
  const rotations = rotationsUtiles(p);
  let meilleure: Pose | null = null;
  for (const place of places) {
    for (const rot of rotations) {
      p.case = place;
      p.rot = rot;
      const a = analyser(e);
      const info = a.pieces.get(p.repere)!;
      if (!info.entrainee) continue;
      const ouverte = fermeture(e, a) <= avant;
      const score = a.production * (1 + OUVERTURE * info.dentsLibres);
      if (
        !meilleure ||
        (ouverte && !meilleure.ouverte) ||
        (ouverte === meilleure.ouverte && score > meilleure.score)
      ) {
        meilleure = { place, rot, production: a.production, ouverte, score };
      }
    }
  }
  p.case = garde.case;
  p.rot = garde.rot;
  return meilleure;
}

/**
 * Ce que touche une petite pièce, autour d'elle : ses côtés engrenés ; ses côtés lisses contre le
 * ressort, que la lime ne règle pas ; et ses autres frottements, ceux de ses dents et ceux que ses côtés
 * lisses font aux dents d'à côté.
 */
function contacts(e: EtatAtelier, g: Int32Array, p: PieceAtelier): [number, number, number] {
  const n = e.taille;
  const [l, c] = p.case!;
  let engrenes = 0;
  let contreRessort = 0;
  let frottements = 0;
  for (const d of COTES) {
    const x = l + PAS[d][0];
    const y = c + PAS[d][1];
    const mienne = dente(p, d);
    if (x < 0 || y < 0 || x >= n || y >= n) {
      if (mienne) frottements++;
      continue;
    }
    const o = g[x * n + y]!;
    if (o === 0) continue;
    const sienne = o === -1 || dente(e.pieces[o - 1]!, oppose(d));
    if (mienne && sienne) engrenes++;
    else if (o === -1) contreRessort++;
    else if (mienne || sienne) frottements++;
  }
  return [engrenes, contreRessort, frottements];
}

/**
 * Tourne une petite pièce posée vers ce qui engrène le plus autour d'elle, sans côté lisse contre le
 * ressort, puis vers ce qui frotte le moins.
 */
function tournerAuMieux(e: EtatAtelier, g: Int32Array, p: PieceAtelier): void {
  let meilleure: { rot: Rot; cle: [number, number, number] } | null = null;
  for (const rot of rotationsUtiles(p)) {
    p.rot = rot;
    const [engrenes, contreRessort, frottements] = contacts(e, g, p);
    const cle: [number, number, number] = [-engrenes, contreRessort, frottements];
    const mieux =
      !meilleure ||
      cle[0] < meilleure.cle[0] ||
      (cle[0] === meilleure.cle[0] &&
        (cle[1] < meilleure.cle[1] || (cle[1] === meilleure.cle[1] && cle[2] < meilleure.cle[2])));
    if (mieux) meilleure = { rot, cle };
  }
  p.rot = meilleure!.rot;
}

/** Le côté d'un frottement, tel que sa clé le nomme : « 3:1.0:7 », la pièce 3 frotte à droite. */
const coteDuFrottement = (cle: string) => Number(cle.split(":")[1]!.split(".")[0]) as Cote;

/**
 * Ce qu'il reste à régler à la fin, pesé selon ce que ça coûte : une pièce qui ne tourne pas compte le
 * plus ; puis ce que la lime ne règle pas, un côté lisse contre le ressort, ou une grande pièce qui
 * engrène d'une moitié de côté et frotte de l'autre ; puis ce qu'un coup de lime règle.
 */
function reste(e: EtatAtelier, a = analyser(e)): number {
  let cout = 0;
  for (const info of a.pieces.values()) if (!info.entrainee) cout += 100;
  for (const f of a.frottements) {
    const engrene = a.pieces
      .get(f.piece)!
      .cotes[coteDuFrottement(f.cle)]!.some((x) => x.contact === "engrene");
    cout += f.contre === "ressort" || engrene ? 10 : 1;
  }
  return cout;
}

/** Le plan tel qu'il est : sa taille, et chaque pièce, sa place, son sens et ses dents limées. */
function signaturePlan(e: EtatAtelier): string {
  const pieces = e.pieces.map((p) => `${p.case?.join(",") ?? "-"}:${p.rot}:${p.limees.join("")}`);
  return `${e.taille}|${pieces.join(";")}`;
}

/** Toute la nomenclature est achetée. */
export function toutAchete(e: EtatAtelier): boolean {
  return PIECES.every((d) => restantes(e, d) <= 0);
}

/** Ce que le joueur a fait pendant la partie. */
export interface Releve {
  /** Le moment de chaque achat, en secondes de jeu. */
  achats: number[];
  /** Le moment où le plan prend chacune de ses tailles, en secondes de jeu. */
  agrandissements: Record<number, number>;
  gestes: number;
  /** Les gestes faits une fois toute la nomenclature achetée : la dernière ajustée. */
  gestesFin: number;
  limages: number;
  echanges: number;
}

/**
 * Un joueur branché sur un noyau démarré dans l'atelier. `passage()` joue un passage : le joueur fait
 * ce qu'il veut, chaque geste prenant son temps de jeu. Le hasard décide quand il revoit son plan, à un
 * quart près de son rythme, et quelle pièce il relie d'abord à la fin : `graine` fait une autre partie.
 */
export function creerJoueur(noyau: Noyau, profil: ProfilAtelier, graine = 1) {
  const etat = () => noyau.etatStrate as EtatAtelier;
  const alea = creerAlea(graine);
  const releve: Releve = {
    achats: [],
    agrandissements: {},
    gestes: 0,
    gestesFin: 0,
    limages: 0,
    echanges: 0,
  };
  /** Le moment de la prochaine revue du plan : son rythme, à un quart près. */
  const ecartRevue = () => profil.revue * (0.75 + 0.5 * tirer(alea));
  let prochaineRevue = ecartRevue();
  let cache: { signature: string; poses: Map<IdPiece, Pose | null> } | null = null;
  /**
   * Ce qui a déjà été cherché en vain sur ce plan, pour ne pas le chercher à chaque passage : rouvrir le
   * rouage pour ce qu'il peut payer, ou poser les pièces de l'établi.
   */
  let impasse: string | null = null;
  let etabliSansPose: { signature: string; reperes: Set<number> } | null = null;
  /** À la fin, les pièces pour lesquelles aucun échange n'aide, sur ce plan. */
  let vaines: { signature: string; reperes: Set<number> } | null = null;
  /** Les échanges à trois se cherchent longtemps : le joueur n'en cherche qu'un nombre fini. */
  let recherchesTriples = 40;

  /**
   * Un geste : appliqué tout de suite, puis le temps qu'il prend, pendant lequel l'atelier produit. Le
   * geste qui achève l'assemblage arrête là la partie : le seuil tombe à cet instant.
   */
  function faire(action: ActionAtelier, duree = profil.geste): void {
    noyau.agir(action);
    noyau.tick(0);
    if (action.type === "acheter") releve.achats.push(etat().temps);
    if (action.type === "agrandir") releve.agrandissements[etat().taille] = etat().temps;
    if (duree > 0 && !noyau.seuil.atteint) noyau.tick(duree);
    releve.gestes++;
    if (toutAchete(etat())) releve.gestesFin++;
    if (action.type === "limer") releve.limages++;
    if (action.type === "echanger") releve.echanges++;
  }

  /** Tourne une pièce posée jusqu'à `rot`, d'un quart de tour à la fois. */
  function tournerVers(repere: number, rot: Rot): void {
    const p = etat().pieces.find((x) => x.repere === repere)!;
    for (let k = (rot - p.rot + 4) % 4; k > 0; k--) faire({ type: "tourner", repere }, 1);
  }

  /** Pose une pièce de l'établi, ou déplace une pièce posée, puis la tourne comme il faut. */
  function placer(repere: number, place: Place, rot: Rot): void {
    const p = etat().pieces.find((x) => x.repere === repere)!;
    if (!p.case) {
      faire({ type: "poser", repere, case: place, rot });
      return;
    }
    if (p.case[0] !== place[0] || p.case[1] !== place[1]) {
      faire({ type: "deplacer", repere, case: place });
    }
    tournerVers(repere, rot);
  }

  /**
   * La meilleure pose de chaque pièce visible qu'il reste à acheter, sur le plan tel qu'il est : elle ne
   * se recalcule que quand le plan change, ou qu'une pièce paraît.
   */
  function poses(e: EtatAtelier): Map<IdPiece, Pose | null> {
    const visibles = PIECES.filter((d) => restantes(e, d) > 0 && pieceVisible(e, d));
    const signature = `${visibles.map((d) => d.id).join(",")}|${signaturePlan(e)}`;
    if (cache?.signature === signature) return cache.poses;
    const copie = structuredClone(e);
    const essais = new Map<IdPiece, Pose | null>();
    for (const d of visibles) {
      const p: PieceAtelier = {
        id: d.id,
        repere: copie.pieces.length + 1,
        case: null,
        rot: 0,
        limees: [],
      };
      copie.pieces.push(p);
      essais.set(d.id, meilleurePose(copie, p));
      copie.pieces.pop();
    }
    cache = { signature, poses: essais };
    return essais;
  }

  /**
   * La pièce à acheter : celle qui rapporte le plus pour son prix, là où il la poserait, sans fermer le
   * rouage : il attend plutôt de quoi en acheter une qui le fait grandir. Quand le plan a sa taille et
   * toute la nomenclature a paru, tout doit être acheté : celles qui ne rapportent rien viennent aussi,
   * la moins chère d'abord.
   */
  function choisirAchat(e: EtatAtelier): { d: DefPiece; pose: Pose | null } | null {
    const budget = e.stock * profil.depense;
    const avant = analyser(e).production;
    const fin =
      e.taille === TAILLE_MAX && PIECES.every((d) => restantes(e, d) <= 0 || pieceVisible(e, d));
    let choix: { d: DefPiece; pose: Pose | null; valeur: number; prix: number } | null = null;
    for (const [id, pose] of poses(e)) {
      const d = defPiece(id)!;
      const prix = prixPiece(e, d);
      if (prix > budget) continue;
      const gain = pose ? pose.production - avant : 0;
      if (!fin && (gain <= 0 || !pose?.ouverte)) continue;
      const valeur = Math.max(0, gain) / prix;
      if (!choix || valeur > choix.valeur || (valeur === choix.valeur && prix < choix.prix)) {
        choix = { d, pose, valeur, prix };
      }
    }
    return choix;
  }

  /**
   * Le rouage n'a plus de place où la pièce `d` tournerait : tourner une pièce du bord vers une case
   * libre, celle qui permet ensuite la meilleure pose. Rien si l'atelier n'y gagne pas, pièce posée.
   */
  function ouvrirPour(e: EtatAtelier, d: DefPiece): boolean {
    const copie = structuredClone(e);
    const avant = analyser(copie).production;
    const n = copie.taille;
    const g = grille(copie);
    const nouvelle: PieceAtelier = {
      id: d.id,
      repere: copie.pieces.length + 1,
      case: null,
      rot: 0,
      limees: [],
    };
    copie.pieces.push(nouvelle);
    let meilleur: { repere: number; rot: Rot; production: number } | null = null;
    for (const p of copie.pieces) {
      if (p === nouvelle || !p.case || largeur(p) > 1) continue;
      const [l, c] = p.case;
      const auBord = COTES.some((dir) => {
        const x = l + PAS[dir][0];
        const y = c + PAS[dir][1];
        return x >= 0 && y >= 0 && x < n && y < n && g[x * n + y] === 0;
      });
      if (!auBord) continue;
      const garde = p.rot;
      for (const rot of rotationsUtiles(p)) {
        if (rot === garde) continue;
        p.rot = rot;
        const pose = meilleurePose(copie, nouvelle);
        if (
          pose?.ouverte &&
          pose.production > avant &&
          (!meilleur || pose.production > meilleur.production)
        ) {
          meilleur = { repere: p.repere, rot, production: pose.production };
        }
      }
      p.rot = garde;
    }
    if (!meilleur) return false;
    tournerVers(meilleur.repere, meilleur.rot);
    return true;
  }

  /** Un rouage fermé se rouvre d'un geste : tourner une pièce du bord, celle qui y perd le moins. */
  function rouvrir(e: EtatAtelier): boolean {
    const copie = structuredClone(e);
    let meilleure: { repere: number; rot: Rot; production: number } | null = null;
    for (const p of copie.pieces) {
      if (!p.case || largeur(p) > 1) continue;
      const garde = p.rot;
      for (const rot of rotationsUtiles(p)) {
        if (rot === garde) continue;
        p.rot = rot;
        const a = analyser(copie);
        if (a.dentsLibres > 0 && (!meilleure || a.production > meilleure.production)) {
          meilleure = { repere: p.repere, rot, production: a.production };
        }
      }
      p.rot = garde;
    }
    if (!meilleure) return false;
    tournerVers(meilleure.repere, meilleure.rot);
    return true;
  }

  /**
   * Fait de la place à une grande pièce : le carré de quatre cases où elle tournerait en déplaçant le
   * moins de petites pièces, puis la meilleure production. Les petites vont ailleurs, là où elles
   * tournent, ou sur l'établi.
   */
  function degager(repere: number): boolean {
    const e = etat();
    const copie = structuredClone(e);
    const grande = copie.pieces.find((x) => x.repere === repere)!;
    const n = copie.taille;
    const g = grille(copie);
    let libres = 0;
    for (const o of g) if (o === 0) libres++;
    let meilleur: { place: Place; rot: Rot; occupees: number[]; production: number } | null = null;
    for (let l = 0; l + 2 <= n; l++) {
      for (let c = 0; c + 2 <= n; c++) {
        const occupees = new Set<number>();
        let possible = true;
        for (const x of cases([l, c], 2)) {
          const [i, j] = x.split(",").map(Number) as [number, number];
          const o = g[i * n + j]!;
          if (o === -1 || (o > 0 && largeur(copie.pieces[o - 1]!) > 1)) possible = false;
          else if (o > 0) occupees.add(o - 1);
        }
        if (!possible || occupees.size === 0) continue;
        if (meilleur && occupees.size > meilleur.occupees.length) continue;
        // Les petites pièces du carré doivent trouver une case ailleurs, ou aller sur l'établi.
        if (libres - (4 - occupees.size) < 0) continue;
        const sorties = [...occupees].map((i) => copie.pieces[i]!);
        const gardes = sorties.map((p) => p.case);
        for (const p of sorties) p.case = null;
        for (const rot of rotationsUtiles(grande)) {
          grande.case = [l, c];
          grande.rot = rot;
          const a = analyser(copie);
          const tourne = a.pieces.get(repere)!.entrainee;
          const mieux =
            !meilleur ||
            occupees.size < meilleur.occupees.length ||
            a.production > meilleur.production;
          if (tourne && mieux) {
            meilleur = {
              place: [l, c],
              rot,
              occupees: sorties.map((p) => p.repere),
              production: a.production,
            };
          }
        }
        grande.case = null;
        sorties.forEach((p, k) => (p.case = gardes[k]!));
      }
    }
    if (!meilleur) return false;
    const carre = new Set(cases(meilleur.place, 2));
    for (const r of meilleur.occupees) {
      const copie2 = structuredClone(etat());
      const p = copie2.pieces.find((x) => x.repere === r)!;
      const pose = meilleurePose(copie2, p, carre);
      if (pose) placer(r, pose.place, pose.rot);
      else faire({ type: "mettreDeCote", repere: r });
    }
    faire({ type: "poser", repere, case: meilleur.place, rot: meilleur.rot });
    return true;
  }

  /**
   * La revue du plan : chaque petite pièce qui frotte ou ne tourne pas est tournée ou déplacée là où la
   * production de l'atelier monte le plus, si elle y gagne sans fermer une région du plan.
   */
  function revoir(): void {
    const a0 = analyser(etat());
    const reperes = etat()
      .pieces.filter((p) => {
        const info = p.case && largeur(p) === 1 ? a0.pieces.get(p.repere) : undefined;
        return info !== undefined && (info.frottements > 0 || !info.entrainee);
      })
      .map((p) => p.repere);
    for (const repere of reperes) {
      if (noyau.seuil.atteint) return;
      const copie = structuredClone(etat());
      const p = copie.pieces.find((x) => x.repere === repere)!;
      const a = analyser(copie);
      const ferme = fermeture(copie, a);
      const pose = meilleurePose(copie, p);
      if (!pose || pose.production <= a.production * (1 + 1e-9)) continue;
      p.case = pose.place;
      p.rot = pose.rot;
      if (fermeture(copie, analyser(copie)) <= ferme) placer(repere, pose.place, pose.rot);
    }
  }

  /** Le réflexe : la pièce la moins chère, sur la première case libre, telle quelle (fiche, § 5). */
  function reflexe(): boolean {
    const e = etat();
    const enMain = e.pieces.find((p) => !p.case);
    if (enMain) {
      const place = placesLibres(e, largeur(enMain))[0];
      if (place) {
        faire({ type: "poser", repere: enMain.repere, case: place, rot: enMain.rot });
        return true;
      }
    } else {
      const achat = PIECES.filter(
        (d) => pieceVisible(e, d) && restantes(e, d) > 0 && prixPiece(e, d) <= e.stock,
      ).sort((x, y) => prixPiece(e, x) - prixPiece(e, y))[0];
      if (achat) {
        faire({ type: "acheter", piece: achat.id }, 0);
        return true;
      }
    }
    const a = prochainAgrandissement(e);
    const plein = placesLibres(e, 1).length === 0;
    if (plein && a && agrandissementVisible(e) && a.prix <= e.stock) {
      faire({ type: "agrandir" });
      return true;
    }
    return false;
  }

  /**
   * Le meilleur échange pour la pièce `a` de la copie `e` : avec la petite pièce qui, une fois chacune
   * tournée au mieux, laisse le moins à régler. La copie revient telle qu'elle était.
   */
  function meilleurEchange(
    e: EtatAtelier,
    a: PieceAtelier,
    exclues: ReadonlySet<PieceAtelier> = new Set(),
  ): { b: PieceAtelier; rots: [Rot, Rot]; apres: number } | null {
    let meilleur: { b: PieceAtelier; rots: [Rot, Rot]; apres: number } | null = null;
    for (const b of e.pieces) {
      if (b === a || exclues.has(b) || !b.case || largeur(b) > 1) continue;
      const ca = a.case!;
      const cb = b.case;
      const ra = a.rot;
      const rb = b.rot;
      a.case = cb;
      b.case = ca;
      const g = grille(e);
      tournerAuMieux(e, g, a);
      tournerAuMieux(e, g, b);
      const apres = reste(e);
      if (!meilleur || apres < meilleur.apres) meilleur = { b, rots: [a.rot, b.rot], apres };
      a.case = ca;
      b.case = cb;
      a.rot = ra;
      b.rot = rb;
    }
    return meilleur;
  }

  /** Échange deux pièces posées, puis les tourne comme il faut. */
  function echanger(a: number, b: number, rots: [Rot, Rot]): void {
    // Un échange en compte deux : celui qu'on fait, et celui qu'on a essayé avant.
    faire({ type: "echanger", a, b }, 2 * profil.geste);
    tournerVers(a, rots[0]);
    tournerVers(b, rots[1]);
  }

  /** Les pièces `cibles`, dans un ordre tiré au hasard. */
  function melanger(cibles: readonly number[]): number[] {
    const liste = [...cibles];
    for (let i = liste.length - 1; i > 0; i--) {
      const j = Math.floor(tirer(alea) * (i + 1));
      [liste[i], liste[j]] = [liste[j]!, liste[i]!];
    }
    return liste;
  }

  /**
   * Un échange qui règle quelque chose : pour l'une des pièces `cibles`, prises au hasard, celui qui
   * laisse le moins à régler, s'il en laisse moins qu'avant.
   */
  function echangeSimple(cibles: readonly number[]): boolean {
    const copie = structuredClone(etat());
    const avant = reste(copie);
    for (const repere of melanger(cibles)) {
      const a = copie.pieces.find((x) => x.repere === repere)!;
      const simple = meilleurEchange(copie, a);
      if (simple && simple.apres < avant) {
        echanger(repere, simple.b.repere, simple.rots);
        return true;
      }
    }
    return false;
  }

  /**
   * Quand aucun échange simple n'aide, un échange à trois : la pièce prend la place d'une autre, qui
   * prend celle d'une troisième, qui vient à sa place. Il se cherche longtemps : une fois par pièce et
   * par plan, et un nombre fini de fois dans la partie.
   */
  function echangeTriple(cibles: readonly number[]): boolean {
    const plan = signaturePlan(etat());
    if (vaines?.signature !== plan) vaines = { signature: plan, reperes: new Set() };
    for (const repere of melanger(cibles)) {
      if (vaines.reperes.has(repere) || recherchesTriples <= 0) continue;
      recherchesTriples--;
      vaines.reperes.add(repere);
      const copie = structuredClone(etat());
      const avant = reste(copie);
      const a = copie.pieces.find((x) => x.repere === repere)!;
      let triple: {
        b: PieceAtelier;
        rotsAB: [Rot, Rot];
        c: PieceAtelier;
        rotsBC: [Rot, Rot];
        apres: number;
      } | null = null;
      for (const b of copie.pieces) {
        if (b === a || !b.case || largeur(b) > 1) continue;
        const ca = a.case!;
        const cb = b.case;
        const ra = a.rot;
        const rb = b.rot;
        a.case = cb;
        b.case = ca;
        const g = grille(copie);
        tournerAuMieux(copie, g, a);
        tournerAuMieux(copie, g, b);
        const rotsAB: [Rot, Rot] = [a.rot, b.rot];
        const suite = meilleurEchange(copie, b, new Set([a]));
        if (suite && suite.apres < avant && (!triple || suite.apres < triple.apres)) {
          triple = { b, rotsAB, c: suite.b, rotsBC: suite.rots, apres: suite.apres };
        }
        a.case = ca;
        b.case = cb;
        a.rot = ra;
        b.rot = rb;
      }
      if (triple) {
        echanger(repere, triple.b.repere, triple.rotsAB);
        echanger(triple.b.repere, triple.c.repere, triple.rotsBC);
        return true;
      }
    }
    return false;
  }

  /**
   * Rien n'aide : le joueur bouge quand même l'une des pièces `cibles`, de l'échange qui fait le moins
   * de mal. Le plan change, et il cherche à nouveau.
   */
  function perturber(cibles: readonly number[]): boolean {
    if (cibles.length === 0) return false;
    const repere = cibles[Math.floor(tirer(alea) * cibles.length)]!;
    const copie = structuredClone(etat());
    const a = copie.pieces.find((x) => x.repere === repere)!;
    const simple = meilleurEchange(copie, a);
    if (!simple) return false;
    echanger(repere, simple.b.repere, simple.rots);
    return true;
  }

  /**
   * Une pièce à régler, de plus en plus loin : un échange simple, un quart de tour, un quart de tour et
   * un échange, un échange à trois ; et, quand rien n'aide, un échange au moindre mal.
   */
  function regler(e: EtatAtelier, cibles: readonly number[]): boolean {
    return (
      echangeSimple(cibles) ||
      tournerUnePiece(e) ||
      cibles.some(tournerEtEchanger) ||
      echangeTriple(cibles) ||
      perturber(cibles)
    );
  }

  /**
   * Lime une dent qui frotte, si elle n'engrène nulle part : une grande pièce peut engrener d'une moitié.
   * Jamais la dent d'une pièce qui ne tourne pas : il faudra la relier. La dernière d'une pièce, le jeu
   * la refuse.
   */
  function limerUneDent(e: EtatAtelier, a: Analyse): boolean {
    for (const f of a.frottements) {
      if (f.contre === "ressort") continue;
      const d = coteDuFrottement(f.cle);
      const info = a.pieces.get(f.piece)!;
      if (!info.entrainee || info.cotes[d]!.some((x) => x.contact === "engrene")) continue;
      const p = e.pieces.find((x) => x.repere === f.piece)!;
      if (!limable(p, d)) continue;
      faire({ type: "limer", repere: f.piece, cote: d });
      return true;
    }
    return false;
  }

  /**
   * Une pièce qui ne tourne pas, que ni un quart de tour ni un échange seuls ne relient : la tourner, et
   * du même coup échanger une voisine, en face d'une de ses dents, contre une pièce qui lui présente la
   * sienne. Rien si l'atelier n'y gagne pas.
   */
  function tournerEtEchanger(repere: number): boolean {
    const copie = structuredClone(etat());
    const avant = reste(copie);
    const p = copie.pieces.find((x) => x.repere === repere)!;
    const n = copie.taille;
    const s = largeur(p);
    const [l, c] = p.case!;
    const garde = p.rot;
    let meilleur: {
      rot: Rot;
      voisine: number;
      autre: number;
      rots: [Rot, Rot];
      apres: number;
    } | null = null;
    for (const rot of rotationsUtiles(p)) {
      p.rot = rot;
      const g = grille(copie);
      for (const d of COTES) {
        if (!dente(p, d)) continue;
        for (let h = 0; h < s; h++) {
          const [x, y] = caseTouchee(l, c, s, d, h);
          const o = x < 0 || y < 0 || x >= n || y >= n ? 0 : g[x * n + y]!;
          if (o <= 0) continue;
          const voisine = copie.pieces[o - 1]!;
          if (largeur(voisine) > 1 || dente(voisine, oppose(d))) continue;
          const echange = meilleurEchange(copie, voisine, new Set([p]));
          if (echange && echange.apres < avant && (!meilleur || echange.apres < meilleur.apres)) {
            meilleur = {
              rot,
              voisine: voisine.repere,
              autre: echange.b.repere,
              rots: echange.rots,
              apres: echange.apres,
            };
          }
        }
      }
    }
    p.rot = garde;
    if (!meilleur) return false;
    tournerVers(repere, meilleur.rot);
    echanger(meilleur.voisine, meilleur.autre, meilleur.rots);
    return true;
  }

  /** Une pièce qui frotte contre le ressort, ou une grande pièce mal tournée : un meilleur quart de tour. */
  function tournerUnePiece(e: EtatAtelier): boolean {
    const copie = structuredClone(e);
    const avant = reste(copie);
    for (const p of copie.pieces) {
      const garde = p.rot;
      let meilleur: { rot: Rot; apres: number } | null = null;
      for (const rot of rotationsUtiles(p)) {
        if (rot === garde) continue;
        p.rot = rot;
        const apres = reste(copie);
        if (apres < avant && (!meilleur || apres < meilleur.apres)) meilleur = { rot, apres };
      }
      p.rot = garde;
      if (meilleur) {
        tournerVers(p.repere, meilleur.rot);
        return true;
      }
    }
    return false;
  }

  /**
   * La dernière ajustée (fiche, § 4) : ce qui reste sur l'établi va sur une case libre, même sans
   * tourner ; puis relier ce qui ne tourne pas, limer ce qui frotte, et régler le reste d'un quart de
   * tour ou d'un échange.
   */
  function finir(): boolean {
    // Au-delà de six cents gestes, le joueur renonce : la partie ne finit pas.
    if (releve.gestesFin > GESTES_FIN_MAX) return false;
    const e = etat();
    const enMain = e.pieces.find((p) => !p.case);
    if (enMain) {
      const copie = structuredClone(e);
      const p = copie.pieces.find((x) => x.repere === enMain.repere)!;
      const pose = meilleurePose(copie, p);
      if (pose) {
        placer(enMain.repere, pose.place, pose.rot);
        return true;
      }
      // Elle ne tourne nulle part : là où elle laisse le moins à régler.
      let moindre: { place: Place; rot: Rot; cout: number } | null = null;
      for (const place of placesLibres(copie, largeur(p))) {
        for (const rot of rotationsUtiles(p)) {
          p.case = place;
          p.rot = rot;
          const cout = reste(copie);
          if (!moindre || cout < moindre.cout) moindre = { place, rot, cout };
        }
      }
      p.case = null;
      if (moindre) {
        placer(enMain.repere, moindre.place, moindre.rot);
        return true;
      }
      if (largeur(enMain) > 1) return degager(enMain.repere);
      return false;
    }
    const a = analyser(e);
    const immobiles = e.pieces.filter((p) => !a.pieces.get(p.repere)!.entrainee);
    const petites = immobiles.filter((p) => largeur(p) === 1).map((p) => p.repere);
    if (petites.length > 0) return regler(e, petites);
    if (immobiles.length > 0) {
      // Une grande pièce qui ne tourne pas : un quart de tour, ou un échange autour d'elle.
      if (tournerUnePiece(e)) return true;
      if (immobiles.some((p) => tournerEtEchanger(p.repere))) return true;
      const g = grille(e);
      const n = e.taille;
      const voisines = new Set<number>();
      for (const grande of immobiles) {
        const [l, c] = grande.case!;
        for (const d of COTES) {
          for (let h = 0; h < 2; h++) {
            const [x, y] = caseTouchee(l, c, 2, d, h);
            const o = x < 0 || y < 0 || x >= n || y >= n ? 0 : g[x * n + y]!;
            if (o > 0 && largeur(e.pieces[o - 1]!) === 1) voisines.add(e.pieces[o - 1]!.repere);
          }
        }
      }
      return regler(e, [...voisines]);
    }
    if (a.frottements.length === 0) return false;
    // Ce que la lime ne règle pas : un côté lisse contre le ressort, une grande pièce qui engrène d'une
    // moitié. Un quart de tour, ou un échange pour la pièce ou ses voisines.
    const durs = a.frottements.filter(
      (f) =>
        f.contre === "ressort" ||
        a.pieces.get(f.piece)!.cotes[coteDuFrottement(f.cle)]!.some((x) => x.contact === "engrene"),
    );
    // Le reste se lime d'abord : chaque coup de lime ne coûte qu'un geste.
    if (limerUneDent(e, a)) return true;
    if (durs.length === 0) return false;
    const genees = new Set<number>();
    for (const f of durs) {
      genees.add(f.piece);
      if (f.autre !== undefined) genees.add(f.autre);
    }
    const voisines = e.pieces.filter((p) => largeur(p) === 1 && genees.has(p.repere));
    return regler(
      e,
      voisines.map((p) => p.repere),
    );
  }

  /** Une décision du joueur, pendant la montée ou à la fin : fausse s'il n'a plus rien à faire. */
  function decider(): boolean {
    const e = etat();
    if (toutAchete(e)) return finir();
    // D'abord ce qu'il tient : une pièce de l'établi, là où elle tourne.
    const plan = signaturePlan(e);
    if (etabliSansPose?.signature !== plan)
      etabliSansPose = { signature: plan, reperes: new Set() };
    for (const enMain of e.pieces.filter((p) => !p.case)) {
      if (etabliSansPose.reperes.has(enMain.repere)) continue;
      const copie = structuredClone(e);
      const p = copie.pieces.find((x) => x.repere === enMain.repere)!;
      const pose = meilleurePose(copie, p);
      if (pose) {
        placer(enMain.repere, pose.place, pose.rot);
        return true;
      }
      if (largeur(enMain) > 1 && degager(enMain.repere)) return true;
      etabliSansPose.reperes.add(enMain.repere);
    }
    const achat = choisirAchat(e);
    const a = prochainAgrandissement(e);
    const libres = placesLibres(e, 1).length;
    // Le plan s'agrandit quand il est presque plein, ou que plus rien n'y rapporte.
    if (a && agrandissementVisible(e) && a.prix <= e.stock * profil.depense) {
      if (libres <= 2 || !achat) {
        faire({ type: "agrandir" });
        return true;
      }
    }
    if (!achat) {
      // Plus rien ne rapporte : le rouage est peut-être fermé, ou n'a plus de place utile. Il le rouvre
      // pour les meilleures pièces qu'il peut payer.
      if (libres === 0) return false;
      const payables = PIECES.filter(
        (d) =>
          d.largeur === 1 &&
          restantes(e, d) > 0 &&
          pieceVisible(e, d) &&
          prixPiece(e, d) <= e.stock * profil.depense,
      ).sort((x, y) => y.base - x.base);
      const signature = `${payables.map((d) => d.id).join(",")}|${plan}`;
      if (signature === impasse) return false;
      for (const d of payables.slice(0, 2)) if (ouvrirPour(e, d)) return true;
      if (analyser(e).dentsLibres === 0 && rouvrir(e)) return true;
      impasse = signature;
      return false;
    }
    faire({ type: "acheter", piece: achat.d.id }, 0);
    const nouvelle = etat().pieces.at(-1)!;
    if (achat.pose)
      faire({
        type: "poser",
        repere: nouvelle.repere,
        case: achat.pose.place,
        rot: achat.pose.rot,
      });
    return true;
  }

  return {
    releve,
    /** Un passage : le joueur fait ce qu'il veut, chaque geste prenant son temps. */
    passage(): void {
      const t = etat().temps;
      if (t < profil.reflexeJusqua) {
        for (let k = 0; k < 40 && !noyau.seuil.atteint; k++) if (!reflexe()) break;
        return;
      }
      if (t >= prochaineRevue) {
        revoir();
        prochaineRevue = etat().temps + ecartRevue();
      }
      for (let k = 0; k < 200 && !noyau.seuil.atteint; k++) if (!decider()) break;
    },
  };
}

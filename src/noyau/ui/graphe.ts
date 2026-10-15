// La disposition du graphe de dépendances (#76 ; docs/comprehension.md, § 5) : de gauche à droite, ce
// qui alimente, puis ce qui est alimenté. Écrite une fois pour les huit strates, à partir de ce que
// chacune expose (`LogiqueStrate.graphe`). Les textes sont ceux du noyau.
import { SEUIL_GRAPHE } from "../logique/comprehension";
import type { GrapheDependances, LogiqueStrate } from "../logique/types";

export const TEXTES_GRAPHE = {
  /** Le bouton du bandeau, en minuscules comme « creuser ». */
  ouvrir: "graphe",
  titre: "Ce qui alimente quoi",
  fermer: "fermer",
  /** Pour les lecteurs d'écran : « Récolte ← Familles, Outils, Saisons ». */
  alimente: "←",
} as const;

/**
 * Le bandeau offre le graphe à partir de κ = 50, si la strate en expose un. Une strate dont le jeu est
 * un graphe (le réseau, 4) n'y montre que ce que le joueur a déjà trouvé : le graphe ne la résout pas.
 */
export function grapheOuvrable(
  kappa: number,
  logique: Pick<LogiqueStrate<never, never>, "graphe">,
) {
  return kappa >= SEUIL_GRAPHE && logique.graphe !== undefined;
}

/** Un nom trop long pour sa boîte s'arrête sur des points de suspension. */
export function nomCourt(nom: string, longueur = 24): string {
  return nom.length > longueur ? `${nom.slice(0, longueur - 1).trimEnd()}…` : nom;
}

/** Les mesures de la disposition, en pixels. */
export const DIMENSIONS = {
  /** Un nœud : son nom tient sur une ligne. */
  largeur: 156,
  hauteur: 26,
  /** Entre deux couches, la place des liens. */
  ecartX: 56,
  ecartY: 12,
  marge: 12,
  /** Un point de passage : la place d'un lien qui traverse une couche. */
  passage: 8,
} as const;

export interface NoeudDispose {
  id: string;
  cle: string;
  /** La colonne : 0 à gauche, là où rien n'alimente le nœud. */
  couche: number;
  /** Le coin haut gauche. */
  x: number;
  y: number;
}

export interface LienDispose {
  de: string;
  vers: string;
  /** Un lien qui revient en arrière et ferme un cycle : il entre dans `vers` par la droite. */
  retour: boolean;
  /** Le tracé SVG, du bord de `de` à celui de `vers`. */
  chemin: string;
}

export interface Disposition {
  noeuds: NoeudDispose[];
  liens: LienDispose[];
  largeur: number;
  hauteur: number;
}

interface Point {
  x: number;
  y: number;
}

/**
 * Dispose un graphe en couches (la méthode de Sugiyama, simplifiée) :
 * 1. un parcours en profondeur, dans l'ordre des nœuds, repère les liens qui ferment un cycle : les
 *    retours. Pour la disposition, ils sont pris à l'envers ;
 * 2. chaque nœud prend la couche du plus long chemin qui y mène, puis avance au plus près de ce qu'il
 *    alimente ;
 * 3. un lien qui saute des couches passe par un point de passage dans chacune : il contourne les
 *    nœuds au lieu de les traverser ;
 * 4. dans chaque couche, quelques passes de barycentres rapprochent chaque élément de ses voisins,
 *    pour croiser moins de liens.
 * Un retour se trace dans le sens du lien : il entre dans sa cible par la droite. Un lien vers un nœud
 * inconnu, ou d'un nœud vers lui-même, est ignoré.
 */
export function disposer(graphe: GrapheDependances): Disposition {
  const D = DIMENSIONS;
  const ids = graphe.noeuds.map((n) => n.id);
  const connus = new Set(ids);
  const liens = graphe.liens.filter(
    (l) => connus.has(l.de) && connus.has(l.vers) && l.de !== l.vers,
  );
  if (ids.length === 0) return { noeuds: [], liens: [], largeur: 0, hauteur: 0 };

  // 1. Les retours, puis les arcs sans cycle : un retour y est pris à l'envers.
  const sortants = new Map(ids.map((id) => [id, [] as string[]]));
  for (const l of liens) sortants.get(l.de)!.push(l.vers);
  const parcours = new Map<string, "en-cours" | "fini">();
  const retours = new Set<string>();
  const postOrdre: string[] = [];
  const visiter = (id: string): void => {
    parcours.set(id, "en-cours");
    for (const suivant of sortants.get(id)!) {
      const etat = parcours.get(suivant);
      if (etat === "en-cours") retours.add(cleLien(id, suivant));
      else if (etat === undefined) visiter(suivant);
    }
    parcours.set(id, "fini");
    postOrdre.push(id);
  };
  for (const id of ids) if (!parcours.has(id)) visiter(id);
  const estRetour = (l: { de: string; vers: string }) => retours.has(cleLien(l.de, l.vers));
  const arcs = liens.map((l) => (estRetour(l) ? { de: l.vers, vers: l.de } : l));

  const avant = new Map(ids.map((id) => [id, [] as string[]]));
  const apres = new Map(ids.map((id) => [id, [] as string[]]));
  for (const a of arcs) {
    apres.get(a.de)!.push(a.vers);
    avant.get(a.vers)!.push(a.de);
  }

  // 2. Les couches, dans un ordre où chaque nœud vient après ce qui l'alimente.
  const ordre = ordreTopologique(ids, avant, apres);
  const couche = new Map<string, number>();
  for (const id of ordre) {
    couche.set(id, Math.max(0, ...avant.get(id)!.map((p) => couche.get(p)! + 1)));
  }
  for (const id of [...ordre].reverse()) {
    const suivants = apres.get(id)!;
    if (suivants.length > 0) couche.set(id, Math.min(...suivants.map((s) => couche.get(s)!)) - 1);
  }
  const premiere = Math.min(...couche.values());
  for (const id of ids) couche.set(id, couche.get(id)! - premiere);
  const nombre = Math.max(...couche.values()) + 1;
  const couches: string[][] = Array.from({ length: nombre }, () => []);
  for (const id of ids) couches[couche.get(id)!]!.push(id);

  // 3. Les chaînes : un arc qui saute des couches y laisse un point de passage, un par couche.
  const precedents = new Map(ids.map((id) => [id, [] as string[]]));
  const suivants = new Map(ids.map((id) => [id, [] as string[]]));
  const chaines = arcs.map((a, i) => {
    const chaine = [a.de];
    for (let c = couche.get(a.de)! + 1; c < couche.get(a.vers)!; c++) {
      const passage = `\u0000${i}:${c}`;
      couches[c]!.push(passage);
      chaine.push(passage);
    }
    chaine.push(a.vers);
    for (let k = 1; k < chaine.length; k++) {
      const [x, y] = [chaine[k - 1]!, chaine[k]!];
      if (!suivants.has(x)) suivants.set(x, []);
      if (!precedents.has(y)) precedents.set(y, []);
      suivants.get(x)!.push(y);
      precedents.get(y)!.push(x);
    }
    return chaine;
  });

  // 4. L'ordre dans chaque couche. Une position va de 0 à 1 : les couches de tailles différentes se
  // répondent. Les passes partent de la droite : ce qui alimente se range d'abord sur ce qu'il alimente.
  // À l'arrivée, l'ordre des nœuds donnés départage.
  const position = new Map<string, number>();
  const placer = (c: string[]) =>
    c.forEach((id, i) => position.set(id, c.length > 1 ? i / (c.length - 1) : 0.5));
  couches.forEach(placer);
  // Un élément sans voisin de ce côté garde sa place ; les autres se rangent dans les places restantes.
  const trier = (c: string[], voisins: Map<string, string[]>) => {
    const barycentre = new Map<string, number>();
    for (const id of c) {
      const v = voisins.get(id) ?? [];
      if (v.length > 0) barycentre.set(id, v.reduce((s, w) => s + position.get(w)!, 0) / v.length);
    }
    const ranges = c.filter((id) => barycentre.has(id));
    ranges.sort((a, b) => barycentre.get(a)! - barycentre.get(b)!);
    let k = 0;
    for (let i = 0; i < c.length; i++) if (barycentre.has(c[i]!)) c[i] = ranges[k++]!;
    placer(c);
  };
  const versLaGauche = () => {
    for (const c of couches.slice(0, -1).reverse()) trier(c, suivants);
  };
  for (let passe = 0; passe < 4; passe++) {
    versLaGauche();
    for (const c of couches.slice(1)) trier(c, precedents);
  }
  versLaGauche();

  // 5. Les coordonnées : chaque couche est centrée sur la plus haute.
  const estNoeud = (id: string) => connus.has(id);
  const haut = (id: string) => (estNoeud(id) ? D.hauteur : D.passage);
  const hauteurCouche = (c: string[]) =>
    c.reduce((h, id) => h + haut(id), 0) + Math.max(0, c.length - 1) * D.ecartY;
  const plusHaute = Math.max(...couches.map(hauteurCouche));
  const coin = new Map<string, Point>();
  couches.forEach((c, i) => {
    let y = D.marge + (plusHaute - hauteurCouche(c)) / 2;
    for (const id of c) {
      coin.set(id, { x: D.marge + i * (D.largeur + D.ecartX), y });
      y += haut(id) + D.ecartY;
    }
  });
  const noeuds: NoeudDispose[] = graphe.noeuds.map(({ id, cle }) => ({
    id,
    cle,
    couche: couche.get(id)!,
    ...coin.get(id)!,
  }));

  // 6. Les tracés : des courbes d'un bord à l'autre, droites à travers les points de passage.
  const milieu = (id: string) => coin.get(id)!.y + haut(id) / 2;
  const tracer = (chaine: string[], retour: boolean): string => {
    const premier = chaine[0]!;
    const dernier = chaine.at(-1)!;
    // Les étapes, dans le sens des arcs : sortie de `premier`, chaque passage, entrée dans `dernier`.
    const etapes: { de: Point; a: Point }[] = [];
    let depuis: Point = { x: coin.get(premier)!.x + D.largeur, y: milieu(premier) };
    for (const passage of chaine.slice(1, -1)) {
      const { x: px } = coin.get(passage)!;
      etapes.push({ de: depuis, a: { x: px, y: milieu(passage) } });
      depuis = { x: px + D.largeur, y: milieu(passage) };
      etapes.push({ de: { x: px, y: milieu(passage) }, a: depuis });
    }
    etapes.push({ de: depuis, a: { x: coin.get(dernier)!.x, y: milieu(dernier) } });
    const sens = retour ? etapes.reverse().map(({ de, a }) => ({ de: a, a: de })) : etapes;
    const debut = sens[0]!.de;
    return (
      `M${f(debut.x)},${f(debut.y)}` +
      sens
        .map(({ de, a }) => {
          if (de.y === a.y && Math.abs(a.x - de.x) === D.largeur) return ` L${f(a.x)},${f(a.y)}`;
          const cx = (de.x + a.x) / 2;
          return ` C${f(cx)},${f(de.y)} ${f(cx)},${f(a.y)} ${f(a.x)},${f(a.y)}`;
        })
        .join("")
    );
  };
  const lienDisposes = liens.map((l, i) => {
    const retour = estRetour(l);
    return { de: l.de, vers: l.vers, retour, chemin: tracer(chaines[i]!, retour) };
  });

  return {
    noeuds,
    liens: lienDisposes,
    largeur: 2 * D.marge + nombre * D.largeur + (nombre - 1) * D.ecartX,
    hauteur: 2 * D.marge + plusHaute,
  };
}

/** Un ordre où chaque nœud suit ce qui l'alimente ; à égalité, celui des nœuds donnés. */
function ordreTopologique(
  ids: string[],
  avant: Map<string, string[]>,
  apres: Map<string, string[]>,
): string[] {
  const restants = new Map(ids.map((id) => [id, avant.get(id)!.length]));
  const ordre: string[] = [];
  const prets = ids.filter((id) => restants.get(id) === 0);
  while (prets.length > 0) {
    const id = prets.shift()!;
    ordre.push(id);
    for (const s of apres.get(id)!) {
      restants.set(s, restants.get(s)! - 1);
      if (restants.get(s) === 0) prets.push(s);
    }
  }
  return ordre;
}

/** Deux décimales suffisent à un tracé. */
function f(x: number): string {
  return String(Math.round(x * 100) / 100);
}

function cleLien(de: string, vers: string): string {
  return `${de}\u0000${vers}`;
}

/** Un nœud et ses voisins : ce qui l'alimente et ce qu'il alimente. Le survol les éclaire. */
export function voisinsDe(graphe: GrapheDependances, id: string): ReadonlySet<string> {
  const proches = new Set([id]);
  for (const l of graphe.liens) {
    if (l.de === id) proches.add(l.vers);
    if (l.vers === id) proches.add(l.de);
  }
  return proches;
}

/**
 * Pour les lecteurs d'écran, le graphe en phrases : chaque nœud alimenté, et ce qui l'alimente.
 * « Récolte ← Familles, Outils, Saisons ».
 */
export function phrasesGraphe(graphe: GrapheDependances, nom: (cle: string) => string): string[] {
  const cles = new Map(graphe.noeuds.map((n) => [n.id, n.cle]));
  return graphe.noeuds.flatMap(({ id, cle }) => {
    const sources = graphe.liens.filter((l) => l.vers === id && cles.has(l.de));
    if (sources.length === 0) return [];
    const noms = sources.map((l) => nom(cles.get(l.de)!)).join(", ");
    return [`${nom(cle)} ${TEXTES_GRAPHE.alimente} ${noms}`];
  });
}

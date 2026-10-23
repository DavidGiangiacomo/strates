// Les deux chiffres de l'atelier qu'aucune police n'a sûrement : ↊ et ↋, un 2 et un 3 retournés
// (fiche, § 6). La vue les dessine elle-même, au trait monolinéaire du normographe, dans une police de
// deux glyphes construite au chargement : rien à télécharger, et le texte reste le même, ↊ et ↋, pour
// la copie comme pour les lecteurs d'écran. Elle passe avant les autres polices de l'atelier, pour ces
// deux caractères seulement (`unicode-range`) : ils sont les mêmes sur tous les systèmes.

/** Le nom de la police, en tête de `POLICE` (theme.ts). */
export const FAMILLE_CHIFFRES = "Strates Atelier Chiffres";

/** Un point du dessin, en unités de la police : mille par cadratin, l'axe des y vers le haut. */
type Point = readonly [number, number];

/** La chasse des chiffres, et leur hauteur, celle des capitales. */
const CHASSE = 556;
const HAUTEUR = 700;
/** L'épaisseur du trait. */
const TRAIT = 92;
/** Les bords gauche et droit du dessin. */
const GAUCHE = 60;
const DROITE = CHASSE - GAUCHE;
/** Un pas d'arc, en radians : quatre degrés. */
const PAS = Math.PI / 45;
const DEG = Math.PI / 180;

/** Une ellipse : son centre et ses rayons, ceux de la ligne médiane du trait. */
interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

function sur(e: Ellipse, a: number): Point {
  return [e.cx + e.rx * Math.cos(a), e.cy + e.ry * Math.sin(a)];
}

/** La normale à droite du trait, qui parcourt l'ellipse dans le sens horaire : vers son centre. */
function normale(e: Ellipse, a: number): Point {
  const x = -e.ry * Math.cos(a);
  const y = -e.rx * Math.sin(a);
  const n = Math.hypot(x, y);
  return [x / n, y / n];
}

/** Les angles d'un arc parcouru dans le sens horaire, de `de` à `a`, au pas de quatre degrés. */
function angles(de: number, a: number): number[] {
  const n = Math.ceil((de - a) / PAS);
  return Array.from({ length: n + 1 }, (_, k) => de - ((de - a) * k) / n);
}

const decaler = ([x, y]: Point, [nx, ny]: Point, d: number): Point => [x + nx * d, y + ny * d];

/** Un arc d'ellipse au trait, coupé droit à ses deux bouts : son contour. */
function arc(e: Ellipse, de: number, a: number): Point[] {
  const as = angles(de, a);
  const gauche = as.map((t) => decaler(sur(e, t), normale(e, t), -TRAIT / 2));
  const droite = as.map((t) => decaler(sur(e, t), normale(e, t), TRAIT / 2));
  return [...gauche, ...droite.reverse()];
}

/** Le point de la droite (`p`, direction `d`) à la hauteur `y`. */
function aLaHauteur(p: Point, d: Point, y: number): Point {
  return [p[0] + ((y - p[1]) * d[0]) / d[1], y];
}

/**
 * Le 2, debout : une panse en haut, une diagonale tangente qui descend vers la gauche, et une base.
 * Le bord supérieur de la diagonale tombe sur le coin bas gauche ; la base est coupée selon lui.
 */
function deux(): Point[][] {
  const panse: Ellipse = {
    cx: (GAUCHE + DROITE) / 2,
    cy: HAUTEUR - TRAIT / 2 - 175,
    rx: (DROITE - GAUCHE - TRAIT) / 2,
    ry: 175,
  };
  const coin: Point = [GAUCHE, 0];
  // La diagonale : tangente à la panse, et décalée d'un demi-trait du coin. Quelques passes suffisent.
  let d: Point = [-0.6, -0.8];
  let tangence = 0;
  for (let passe = 0; passe < 30; passe++) {
    const q = decaler(coin, [d[1], -d[0]], -TRAIT / 2);
    const ecart = (a: number) => {
      const [x, y] = sur(panse, a);
      return (x - q[0]) * panse.ry * Math.cos(a) + (y - q[1]) * panse.rx * Math.sin(a);
    };
    let bas = -Math.PI / 2;
    let haut = 0;
    for (let k = 0; k < 60; k++) {
      const milieu = (bas + haut) / 2;
      if (ecart(milieu) < 0) bas = milieu;
      else haut = milieu;
    }
    tangence = (bas + haut) / 2;
    const t = sur(panse, tangence);
    const n = Math.hypot(q[0] - t[0], q[1] - t[1]);
    d = [(q[0] - t[0]) / n, (q[1] - t[1]) / n];
  }
  const as = angles(160 * DEG, tangence);
  const gauche = as.map((a) => decaler(sur(panse, a), normale(panse, a), -TRAIT / 2));
  const droite = as.map((a) => decaler(sur(panse, a), normale(panse, a), TRAIT / 2));
  const t = sur(panse, tangence);
  const n: Point = [d[1], -d[0]];
  // En bas, la diagonale est coupée à l'horizontale : son bord supérieur tombe sur le coin.
  const bordInferieur = aLaHauteur(decaler(t, n, -TRAIT / 2), d, 0);
  const diagonale = [...gauche, bordInferieur, coin, ...droite.reverse()];
  const base = [coin, [DROITE, 0], [DROITE, TRAIT], aLaHauteur(coin, d, TRAIT)] as Point[];
  return [diagonale, base];
}

/** Le 3, debout : deux panses, la plus grande en bas, et la langue du milieu. */
function trois(): Point[][] {
  const milieu = TRAIT / 2 + 2 * 162;
  const haute: Ellipse = { cx: DROITE - TRAIT / 2 - 160, cy: milieu + 142, rx: 160, ry: 142 };
  const basse: Ellipse = { cx: DROITE - TRAIT / 2 - 180, cy: TRAIT / 2 + 162, rx: 180, ry: 162 };
  const langue: Point[] = [
    [haute.cx - 90, milieu - TRAIT / 2],
    [haute.cx + 2, milieu - TRAIT / 2],
    [haute.cx + 2, milieu + TRAIT / 2],
    [haute.cx - 90, milieu + TRAIT / 2],
  ];
  return [arc(haute, 150 * DEG, -90 * DEG), arc(basse, 90 * DEG, -150 * DEG), langue];
}

/** Retourné : un demi-tour autour du centre du chiffre. */
function retourner(contours: Point[][]): Point[][] {
  return contours.map((c) => c.map(([x, y]): Point => [CHASSE - x, HAUTEUR - y]));
}

/** L'aire signée d'un contour : négative quand il tourne dans le sens horaire. */
function aire(c: readonly Point[]): number {
  let s = 0;
  for (let i = 0; i < c.length; i++) {
    const [x1, y1] = c[i]!;
    const [x2, y2] = c[(i + 1) % c.length]!;
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
}

/**
 * Les deux glyphes, ↊ puis ↋, en contours entiers, dans le sens horaire comme TrueType le veut pour un
 * contour extérieur. Les contours d'un même chiffre se recouvrent : la police les réunit.
 */
export function glyphes(): Point[][][] {
  return [retourner(deux()), retourner(trois())].map((contours) =>
    contours.map((c) => {
      const entiers = c.map(([x, y]): Point => [Math.round(x), Math.round(y)]);
      return aire(entiers) > 0 ? entiers.reverse() : entiers;
    }),
  );
}

// ——— La police : un fichier TrueType minimal.

/** Un tampon d'octets, écrit en gros-boutiste comme toutes les tables d'une police. */
class Octets {
  private readonly octets: number[] = [];
  u8(v: number): this {
    this.octets.push(v & 0xff);
    return this;
  }
  u16(v: number): this {
    return this.u8(v >> 8).u8(v);
  }
  u32(v: number): this {
    return this.u16(v >>> 16).u16(v & 0xffff);
  }
  texte(s: string): this {
    for (const c of s) this.u8(c.charCodeAt(0));
    return this;
  }
  /** Du texte en UTF-16 gros-boutiste, pour la table des noms. */
  utf16(s: string): this {
    for (let i = 0; i < s.length; i++) this.u16(s.charCodeAt(i));
    return this;
  }
  get longueur(): number {
    return this.octets.length;
  }
  aligner(): this {
    while (this.octets.length % 4 !== 0) this.u8(0);
    return this;
  }
  tableau(): Uint8Array<ArrayBuffer> {
    return Uint8Array.from(this.octets);
  }
}

/** La somme de contrôle d'une table : ses mots de 32 bits, additionnés modulo 2³². */
function somme(t: Uint8Array): number {
  const lecture = new DataView(t.buffer, t.byteOffset, t.byteLength);
  let s = 0;
  for (let i = 0; i + 4 <= t.length; i += 4) s = (s + lecture.getUint32(i)) >>> 0;
  const reste = t.length % 4;
  if (reste > 0) {
    let mot = 0;
    for (let k = 0; k < 4; k++) mot = (mot << 8) | (t[t.length - reste + k] ?? 0);
    s = (s + (mot >>> 0)) >>> 0;
  }
  return s;
}

/** Des champs de 16 bits, dans l'ordre de leur table. */
function champs(o: Octets, ...valeurs: number[]): Octets {
  for (const v of valeurs) o.u16(v);
  return o;
}

/** Les noms de la police, par leur numéro : la famille, le style, l'identifiant, le nom complet… */
const NOMS: Record<number, string> = {
  1: FAMILLE_CHIFFRES,
  2: "Regular",
  3: "StratesAtelierChiffres-1.0",
  4: FAMILLE_CHIFFRES,
  5: "Version 1.0",
  6: "StratesAtelierChiffres",
};

/** Créée le 22 octobre 2026, en secondes depuis 1904. */
const DATE = Date.UTC(2026, 9, 22) / 1000 + 2_082_844_800;
const ASCENDANT = 905;
const DESCENDANT = -212;
const PREMIER = 0x218a;
const DERNIER = 0x218b;

/** La police, en octets : un fichier TrueType complet, à trois glyphes (.notdef, ↊, ↋). */
export function police(): Uint8Array<ArrayBuffer> {
  const dessins = glyphes();
  // glyf et loca. Le glyphe 0, .notdef, est vide : il finit où il commence. Les points sont tous sur
  // la courbe, sans instruction, chaque coordonnée un écart de 16 bits au point précédent.
  const glyf = new Octets();
  const debuts = [0];
  const boites: [number, number, number, number][] = [];
  for (const contours of dessins) {
    debuts.push(glyf.longueur);
    const points = contours.flat();
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const boite: [number, number, number, number] = [
      Math.min(...xs),
      Math.min(...ys),
      Math.max(...xs),
      Math.max(...ys),
    ];
    boites.push(boite);
    champs(glyf, contours.length, ...boite);
    let fin = -1;
    for (const c of contours) glyf.u16((fin += c.length));
    glyf.u16(0);
    for (let i = 0; i < points.length; i++) glyf.u8(0x01);
    for (const axe of [0, 1]) {
      let precedent = 0;
      for (const p of points) {
        glyf.u16(p[axe]! - precedent);
        precedent = p[axe]!;
      }
    }
    glyf.aligner();
  }
  debuts.push(glyf.longueur);
  const loca = new Octets();
  for (const d of debuts) loca.u32(d);
  const xMin = Math.min(...boites.map((b) => b[0]));
  const yMin = Math.min(...boites.map((b) => b[1]));
  const xMax = Math.max(...boites.map((b) => b[2]));
  const yMax = Math.max(...boites.map((b) => b[3]));
  const points = dessins.map((contours) => contours.flat().length);

  // head : la version, la révision, l'ajustement de la somme (écrit à la fin), le nombre magique ; les
  // drapeaux, mille unités par cadratin, les dates ; la boîte des glyphes, le style, la plus petite
  // taille lisible, la direction, loca en entrées de 32 bits, le format des glyphes.
  const head = champs(new Octets(), 1, 0).u32(0x00010000).u32(0).u32(0x5f0f3cf5);
  champs(head, 0x0003, 1000).u32(0).u32(DATE).u32(0).u32(DATE);
  champs(head, xMin, yMin, xMax, yMax, 0, 8, 2, 1, 0);

  // hhea : la version ; l'ascendante, la descendante, l'interligne ; la chasse la plus grande, les
  // approches les plus petites, l'étendue ; la pente du curseur ; cinq champs réservés ; trois chasses.
  const hhea = champs(new Octets(), 1, 0, ASCENDANT, DESCENDANT, 0);
  champs(hhea, CHASSE, xMin, Math.min(...boites.map((b) => CHASSE - b[2])), xMax);
  champs(hhea, 1, 0, 0, 0, 0, 0, 0, 0, 3);

  // maxp : la version 1.0, trois glyphes, les plus grands nombres de points et de contours, et des
  // zéros pour tout le reste, sauf les deux zones.
  const maxp = new Octets().u32(0x00010000);
  champs(maxp, 3, Math.max(...points), Math.max(...dessins.map((c) => c.length)), 0, 0, 2);
  champs(maxp, 0, 0, 0, 0, 0, 0, 0, 0);

  // OS/2, version 4 : la chasse moyenne, la graisse normale, la chasse normale, aucune restriction ;
  // indices, exposants et rayure ; pas de classe ni de Panose ; le bloc « Formes numérales »
  // (U+2150 à U+218F, le bit 54) ; aucun fondeur ; le style normal ; les caractères couverts ; les
  // métriques typographiques et Windows ; le latin ; les hauteurs d'x et de capitale.
  const os2 = champs(new Octets(), 4, CHASSE, 400, 5, 0);
  champs(os2, 650, 600, 0, 75, 650, 600, 0, 350, 50, 300, 0);
  for (let i = 0; i < 10; i++) os2.u8(0);
  os2
    .u32(0)
    .u32(1 << 22)
    .u32(0)
    .u32(0)
    .texte("NONE");
  champs(os2, 0x0040, PREMIER, DERNIER, ASCENDANT, DESCENDANT, 0, ASCENDANT, -DESCENDANT);
  os2.u32(1).u32(0);
  champs(os2, 500, HAUTEUR, 0, 32, 0);

  const hmtx = champs(new Octets(), CHASSE, 0);
  for (const b of boites) champs(hmtx, CHASSE, b[0]);

  // cmap : une sous-table Windows Unicode de format 4. Deux segments : ↊ et ↋, vers les glyphes 1 et
  // 2, puis la fin obligatoire.
  const cmap = champs(new Octets(), 0, 1, 3, 1).u32(12);
  champs(cmap, 4, 32, 0, 4, 4, 1, 0);
  champs(cmap, DERNIER, 0xffff, 0, PREMIER, 0xffff, (1 - PREMIER) & 0xffff, 1, 0, 0);

  const ids = Object.keys(NOMS).map(Number);
  const name = champs(new Octets(), 0, ids.length, 6 + 12 * ids.length);
  let decalage = 0;
  for (const id of ids) {
    const longueur = NOMS[id]!.length * 2;
    champs(name, 3, 1, 0x0409, id, longueur, decalage);
    decalage += longueur;
  }
  for (const id of ids) name.utf16(NOMS[id]!);

  // post, version 3 : sans noms de glyphes.
  const post = new Octets().u32(0x00030000).u32(0);
  champs(post, -100, 50).u32(0).u32(0).u32(0).u32(0).u32(0);

  const tables: [string, Uint8Array][] = [
    ["OS/2", os2.tableau()],
    ["cmap", cmap.tableau()],
    ["glyf", glyf.tableau()],
    ["head", head.tableau()],
    ["hhea", hhea.tableau()],
    ["hmtx", hmtx.tableau()],
    ["loca", loca.tableau()],
    ["maxp", maxp.tableau()],
    ["name", name.tableau()],
    ["post", post.tableau()],
  ];

  // Le répertoire des tables, rangées par leur étiquette, chacune alignée sur quatre octets.
  const fichier = new Octets().u32(0x00010000);
  champs(fichier, tables.length, 128, 3, tables.length * 16 - 128);
  let position = 12 + 16 * tables.length;
  let positionHead = 0;
  for (const [etiquette, t] of tables) {
    if (etiquette === "head") positionHead = position;
    fichier.texte(etiquette).u32(somme(t)).u32(position).u32(t.length);
    position += Math.ceil(t.length / 4) * 4;
  }
  for (const [, t] of tables) {
    for (const o of t) fichier.u8(o);
    fichier.aligner();
  }
  const octets = fichier.tableau();
  // L'ajustement de head : la somme du fichier entier doit valoir 0xB1B0AFBA.
  const ajustement = (0xb1b0afba - somme(octets)) >>> 0;
  new DataView(octets.buffer).setUint32(positionHead + 8, ajustement);
  return octets;
}

let installee = false;

/** Ajoute la police aux polices du document, une fois. Sans `FontFace`, comme sous happy-dom, rien. */
export function installerChiffres(): void {
  if (installee || typeof document === "undefined" || typeof FontFace !== "function") return;
  installee = true;
  const face = new FontFace(FAMILLE_CHIFFRES, police(), { unicodeRange: "U+218A-218B" });
  document.fonts.add(face);
  void face.load().catch(() => {});
}

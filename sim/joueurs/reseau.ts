// Des joueurs automatiques pour le réseau, branchés sur le noyau. Ils jouent les profils de la fiche
// (docs/strates/strate-4.md, § 4) :
// - le joueur naturel répare d'abord ce qui monte le plus près de la ville. Il élargit une conduite
//   pleine dont l'aval suit, ou relie une sortie neuve. Quand un bassin ne peut plus rien élargir ni
//   relier, il ferme d'un quart la vanne qui l'alimente trop. Il relie la source suivante quand toutes
//   sont à plein et que plus rien ne monte ;
// - le parfait, le distrait, le prudent et celui qui ne touche jamais une vanne jouent comme lui ;
// - le prévoyant relie la route d'un bassin jusqu'à la ville avant la source qui s'y jette ;
// - le réflexe relie dès qu'il peut, et quand un bassin monte, élargit ce qui y entre ; celui qui
//   apprend joue ainsi pendant dix minutes, puis comme le naturel ;
// - le joueur « moins cher » fait toujours l'achat le moins cher, quel qu'il soit.
// L'équilibrage les reprendra (#99).
import type { Noyau } from "../../src/noyau/logique/noyau";
import {
  aPlein,
  conduite,
  debitSource,
  emporte,
  goulots,
  porte,
  prixDe,
  reliable,
  sortiesDe,
  type ActionReseau,
  type Conduite,
  type EtatReseau,
  type IdNoeud,
  type Ouverture,
} from "../../src/strates/s4-reseau/logique";
import {
  IDS_SOURCES,
  ORDRE,
  partager,
  sourceDe,
  trace,
  traceDeSource,
  TRACES,
} from "../../src/strates/s4-reseau/logique/regles";

export interface ProfilReseau {
  /** Ce qui le caractérise, pour les rapports. */
  description: string;
  /** Secondes entre deux passages. */
  attention: number;
  /**
   * Comment il répare : le naturel cherche le goulot en aval de ce qui monte ; le réflexe élargit ce
   * qui entre dans un bassin qui monte ; le joueur « moins cher » fait l'achat le moins cher.
   */
  strategie: "naturel" | "reflexe" | "apprend" | "moinsCher";
  /** Règle-t-il les vannes ? */
  vannes: boolean;
  /** Relie-t-il la route d'un bassin jusqu'à la ville avant sa source ? */
  prevoit?: boolean;
  /** Ne dépense jamais plus de la moitié de la provision. */
  prudent?: boolean;
}

const NATUREL_BASE = { strategie: "naturel", vannes: true } as const;

export const PARFAIT: ProfilReseau = {
  ...NATUREL_BASE,
  description: "naturel ; passe toutes les 2 s",
  attention: 2,
};

export const NATUREL: ProfilReseau = {
  ...NATUREL_BASE,
  description:
    "passe toutes les 5 s ; répare d'abord ce qui monte le plus près de la ville, relie une sortie quand une conduite est au plus large, règle les vannes",
  attention: 5,
};

export const PREVOYANT: ProfilReseau = {
  ...NATUREL_BASE,
  description: "naturel ; relie la route d'un bassin avant sa source",
  attention: 5,
  prevoit: true,
};

export const APPREND: ProfilReseau = {
  description: "réflexe pendant 10 minutes, puis naturel",
  attention: 5,
  strategie: "apprend",
  vannes: true,
};

export const DISTRAIT: ProfilReseau = {
  ...NATUREL_BASE,
  description: "naturel ; passe chaque minute",
  attention: 60,
};

export const PRUDENT: ProfilReseau = {
  ...NATUREL_BASE,
  description: "naturel ; ne dépense jamais plus de la moitié de sa provision",
  attention: 5,
  prudent: true,
};

export const SANS_VANNES: ProfilReseau = {
  ...NATUREL_BASE,
  description: "naturel, mais ne touche jamais une vanne",
  attention: 5,
  vannes: false,
};

export const MOINS_CHER: ProfilReseau = {
  description: "l'achat le moins cher, quel qu'il soit",
  attention: 5,
  strategie: "moinsCher",
  vannes: false,
};

export const REFLEXE: ProfilReseau = {
  description: "relie dès qu'il peut ; quand un bassin monte, élargit ce qui y entre",
  attention: 5,
  strategie: "reflexe",
  vannes: false,
};

/** Le joueur qui apprend joue en réflexe pendant ses dix premières minutes. */
export const APPRENTISSAGE = 600;

const peutPayer = (etat: EtatReseau, prix: number | null, profil: ProfilReseau) =>
  prix !== null && prix <= (profil.prudent ? etat.caisse / 2 : etat.caisse);

const vers = (c: Conduite) => trace(c.trace)!.vers;

/** Ce qu'un nœud reçoit, en pouces : sa source, et ce que lui portent ses conduites d'amont. */
function recoit(etat: EtatReseau, n: IdNoeud): number {
  const k = sourceDe(n);
  const amont = etat.conduites
    .filter((c) => vers(c) === n)
    .reduce((s, c) => s + (etat.debits[c.trace] ?? 0), 0);
  return (k === null ? 0 : debitSource(etat, k)) + amont;
}

/** Ce qu'un nœud pourrait encore recevoir sans monter, en pouces. */
function marge(etat: EtatReseau, n: IdNoeud): number {
  return n === "ville" ? Infinity : emporte(etat, n) - recoit(etat, n);
}

/**
 * Rouvrir d'un quart la vanne `c` sous le nœud `n` : son aval peut-il recevoir l'eau de plus ? Le
 * partage à parts égales dit ce que la conduite prendrait.
 */
function reouvrirTient(etat: EtatReseau, n: IdNoeud, c: Conduite): boolean {
  const sorties = sortiesDe(etat, n);
  const avant = sorties.map(porte);
  const apres = sorties.map((x) =>
    x.trace === c.trace ? porte(x) + 10 ** x.calibre / 4 : porte(x),
  );
  const i = sorties.indexOf(c);
  const q = recoit(etat, n);
  const sumAvant = avant.reduce((s, x) => s + x, 0);
  const sumApres = apres.reduce((s, x) => s + x, 0);
  const plus =
    partager(apres, Math.min(q, sumApres))[i]! - partager(avant, Math.min(q, sumAvant))[i]!;
  return plus <= marge(etat, vers(c));
}

/** Le nœud a-t-il une route jusqu'à la ville, par les conduites posées ? */
function route(etat: EtatReseau, n: IdNoeud, vus = new Set<IdNoeud>()): boolean {
  if (n === "ville") return true;
  if (vus.has(n)) return false;
  vus.add(n);
  return sortiesDe(etat, n).some((c) => route(etat, vers(c), vus));
}

function moinsCherDe<T>(liste: readonly T[], prix: (x: T) => number): T {
  return liste.reduce((a, b) => (prix(b) < prix(a) ? b : a));
}

/** La source suivante à relier, ou null : toutes le sont. */
function suivante(etat: EtatReseau) {
  const k = IDS_SOURCES.find((x) => etat.reliees[x] === undefined);
  return k === undefined ? null : k;
}

/** Le joueur naturel (§ 4, « En simulation »). */
function naturel(etat: EtatReseau, profil: ProfilReseau): ActionReseau | null {
  // Les nœuds qui montent, du plus proche de la ville au plus haut.
  const montent = goulots(etat).sort((a, b) => ORDRE.indexOf(b) - ORDRE.indexOf(a));
  for (const n of montent) {
    const sorties = sortiesDe(etat, n);
    // a. Une sortie pleine dont l'aval suit : l'élargir, la moins chère d'abord.
    const elargir = sorties.filter(
      (c) => c.vanne >= 1 && c.calibre < trace(c.trace)!.max && !montent.includes(vers(c)),
    );
    if (elargir.length > 0) {
      const c = moinsCherDe(elargir, (x) => prixDe(etat, x.trace)!);
      return peutPayer(etat, prixDe(etat, c.trace), profil)
        ? { type: "elargir", trace: c.trace }
        : null;
    }
    // b. Une vanne fermée dont l'aval a la marge de l'eau de plus : la rouvrir d'un quart.
    if (profil.vannes) {
      const c = sorties.find(
        (x) => x.vanne < 1 && !montent.includes(vers(x)) && reouvrirTient(etat, n, x),
      );
      if (c) return { type: "vanne", trace: c.trace, ouverture: (c.vanne + 0.25) as Ouverture };
    }
    // c. Une sortie neuve : la relier, la moins chère d'abord.
    const neuves = TRACES.filter((t) => t.de === n && reliable(etat, t.numero));
    if (neuves.length > 0) {
      const t = moinsCherDe(neuves, (x) => prixDe(etat, x.numero)!);
      return peutPayer(etat, prixDe(etat, t.numero), profil)
        ? { type: "relier", trace: t.numero }
        : null;
    }
    // d. L'aval monte aussi : il a été vu d'abord.
    if (sorties.some((c) => montent.includes(vers(c)))) continue;
    // e. Plus rien à élargir ni à relier : fermer d'un quart la vanne d'un bassin qui l'alimente,
    // si ce bassin a une autre sortie qui ne monte pas.
    if (profil.vannes) {
      for (const t of TRACES) {
        const c = conduite(etat, t.numero);
        if (t.vers !== n || !c || c.vanne <= 0 || sourceDe(t.de) !== null) continue;
        const autres = sortiesDe(etat, t.de).filter(
          (x) => x.trace !== c.trace && !montent.includes(vers(x)),
        );
        if (autres.length > 0) {
          return { type: "vanne", trace: c.trace, ouverture: (c.vanne - 0.25) as Ouverture };
        }
      }
    }
  }
  if (montent.length > 0) return null;
  // Toutes les sources à plein, plus rien ne monte : relier la suivante.
  if (IDS_SOURCES.some((k) => etat.reliees[k] !== undefined && !aPlein(etat, k))) return null;
  const k = suivante(etat);
  if (k === null) return null;
  const t = traceDeSource(k);
  if (profil.prevoit && !route(etat, t.vers)) {
    const r = TRACES.find((x) => x.de === t.vers && x.vers === "ville");
    if (r && reliable(etat, r.numero)) {
      return peutPayer(etat, prixDe(etat, r.numero), profil)
        ? { type: "relier", trace: r.numero }
        : null;
    }
  }
  return peutPayer(etat, prixDe(etat, t.numero), profil)
    ? { type: "relier", trace: t.numero }
    : null;
}

/** Le joueur réflexe : relier dès qu'il peut ; quand un bassin monte, élargir ce qui y entre. */
function reflexe(etat: EtatReseau, profil: ProfilReseau): ActionReseau | null {
  const k = suivante(etat);
  if (k !== null) {
    const t = traceDeSource(k);
    if (reliable(etat, t.numero) && peutPayer(etat, prixDe(etat, t.numero), profil)) {
      return { type: "relier", trace: t.numero };
    }
  }
  const montent = goulots(etat).sort((a, b) => etat.montees[a]! - etat.montees[b]!);
  for (const n of montent) {
    const entrees = etat.conduites.filter((c) => vers(c) === n && c.calibre < trace(c.trace)!.max);
    if (entrees.length === 0) continue;
    const c = moinsCherDe(entrees, (x) => prixDe(etat, x.trace)!);
    return peutPayer(etat, prixDe(etat, c.trace), profil)
      ? { type: "elargir", trace: c.trace }
      : null;
  }
  return null;
}

/** Le joueur « moins cher » : l'achat le moins cher, quel qu'il soit. */
function moinsCher(etat: EtatReseau, profil: ProfilReseau): ActionReseau | null {
  const options: { prix: number; action: ActionReseau }[] = [];
  const k = suivante(etat);
  if (k !== null) {
    const t = traceDeSource(k);
    if (reliable(etat, t.numero)) {
      options.push({ prix: prixDe(etat, t.numero)!, action: { type: "relier", trace: t.numero } });
    }
  }
  for (const c of etat.conduites) {
    const p = prixDe(etat, c.trace);
    if (p !== null) options.push({ prix: p, action: { type: "elargir", trace: c.trace } });
  }
  if (options.length === 0) return null;
  const o = moinsCherDe(options, (x) => x.prix);
  return peutPayer(etat, o.prix, profil) ? o.action : null;
}

/** Le geste d'un passage à l'instant `t`, ou null : rien à faire, ou de quoi attendre. */
export function geste(etat: EtatReseau, profil: ProfilReseau, t: number): ActionReseau | null {
  switch (profil.strategie) {
    case "moinsCher":
      return moinsCher(etat, profil);
    case "reflexe":
      return reflexe(etat, profil);
    case "apprend":
      return t < APPRENTISSAGE ? reflexe(etat, profil) : naturel(etat, profil);
    case "naturel":
      return naturel(etat, profil);
  }
}

/**
 * Un joueur branché sur un noyau démarré dans le réseau. `passer(t)` joue un passage à l'instant t,
 * si c'est le moment : un geste au plus. `seconde(t)` joue la seconde t : le passage, puis une
 * seconde de temps. `gestes` compte les gestes faits.
 */
export function creerJoueur(noyau: Noyau, profil: ProfilReseau) {
  let prochainPassage = 0;
  const joueur = {
    gestes: 0,
    passer(t: number): void {
      if (t < prochainPassage) return;
      prochainPassage = t + profil.attention;
      const action = geste(noyau.etatStrate as EtatReseau, profil, t);
      if (!action) return;
      noyau.agir(action);
      noyau.tick(0);
      joueur.gestes++;
    },
    seconde(t: number): void {
      joueur.passer(t);
      noyau.avancer(1);
    },
  };
  return joueur;
}

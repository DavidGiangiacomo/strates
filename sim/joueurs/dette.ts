// Des joueurs automatiques pour la dette, branchés sur le noyau. Ils jouent les onze profils de la
// fiche (docs/strates/strate-6.md, § 4), que l'équilibrage a repris du brouillon de simulation
// (#105) :
// - le joueur naturel promet ce que la caisse paiera, au terme le plus court qui tient ; le parfait,
//   le distrait et l'hésitant jouent comme lui, plus ou moins attentifs, ou trop prudents sur le terme ;
// - l'optimiste et le téméraire comptent sur un rapport qui croît, et fixent la grande crue dès qu'ils
//   le peuvent ;
// - le réflexe promet la moins chère dès que la confiance le permet, sans regarder ses échéances ;
//   le naïf aussi, mais s'arrête tant qu'une échéance est reportée ; celui qui apprend est réflexe
//   jusqu'à son premier report ;
// - le gourmand prend toujours le terme long, sans regarder la caisse ;
// - le prudent ne promet que ce que sa caisse couvre déjà.
// Ce sont des joueurs de test : ils ne voient que ce que le livre montre.
import { creerAlea, tirer, type EtatAlea } from "../../src/noyau/logique/alea";
import type { Noyau } from "../../src/noyau/logique/noyau";
import type { ActionDette, EtatDette, IdPromesse } from "../../src/strates/s6-dette/logique";
import {
  confiance,
  CRUE,
  doit,
  EXEMPLAIRES,
  GRANDE_CRUE_DANS,
  montantDu,
  prixExemplaire,
  rapport,
  SORTES,
  sortesDe,
  TABLETTES,
  TERMES,
  toutDu,
  type Terme,
} from "../../src/strates/s6-dette/logique/regles";

export interface ProfilDette {
  /** Ce qui le caractérise, pour les rapports. */
  description: string;
  /** Secondes entre deux passages. */
  attention: number;
  /** Les gestes qu'il fait au plus à chaque passage, tant qu'une promesse tient : 1 par défaut. */
  parPassage?: number;
  strategie: "naturel" | "reflexe" | "apprend" | "naif" | "gourmand" | "prudent";
  /** Ce qu'il croit que le rapport croîtra à chaque crue : 0 pour qui compte sur le rapport présent. */
  croissance?: number;
  /** La part des promesses où il prend le terme d'après, plus long qu'il ne faut. */
  hesitation?: number;
  /** Dans la dernière tablette, il fixe la grande crue dès qu'il le peut, sans attendre la caisse. */
  presse?: boolean;
}

export const PARFAIT: ProfilDette = {
  description: "naturel ; passe toutes les 2 s",
  attention: 2,
  strategie: "naturel",
};

export const NATUREL: ProfilDette = {
  description:
    "passe toutes les 5 s ; promet ce que la caisse paiera à chaque échéance, au terme le plus court qui tient",
  attention: 5,
  strategie: "naturel",
};

export const HESITANT: ProfilDette = {
  description: "naturel, mais prend une fois sur trois un terme plus long qu'il ne faut",
  attention: 5,
  strategie: "naturel",
  hesitation: 1 / 3,
};

export const DISTRAIT: ProfilDette = {
  description: "naturel ; passe chaque minute, et fait alors tout ce qui tient",
  attention: 60,
  parPassage: 24,
  strategie: "naturel",
};

export const APPREND: ProfilDette = {
  description: "réflexe jusqu'à son premier report, puis naturel",
  attention: 5,
  strategie: "apprend",
};

export const OPTIMISTE: ProfilDette = {
  description:
    "compte sur un rapport qui croît de 3 % par crue ; fixe la grande crue dès qu'il peut",
  attention: 5,
  strategie: "naturel",
  croissance: 0.03,
  presse: true,
};

export const TEMERAIRE: ProfilDette = {
  description:
    "compte sur un rapport qui croît de 8 % par crue ; fixe la grande crue dès qu'il peut",
  attention: 5,
  strategie: "naturel",
  croissance: 0.08,
  presse: true,
};

export const GOURMAND: ProfilDette = {
  description: "toujours le terme long, sans regarder la caisse",
  attention: 5,
  strategie: "gourmand",
};

export const PRUDENT: ProfilDette = {
  description: "ne promet que ce que sa caisse couvre déjà, au terme court",
  attention: 5,
  strategie: "prudent",
};

export const NAIF: ProfilDette = {
  description: "réflexe, mais cesse de promettre tant qu'une échéance est reportée",
  attention: 5,
  strategie: "naif",
};

export const REFLEXE: ProfilDette = {
  description:
    "passe toutes les 5 s ; promet la moins chère dès que la confiance le permet, à 6 crues",
  attention: 5,
  strategie: "reflexe",
};

/** Les onze profils de la fiche (§ 4), du parfait au réflexe. */
export const JOUEURS: Readonly<Record<string, ProfilDette>> = {
  parfait: PARFAIT,
  naturel: NATUREL,
  hesitant: HESITANT,
  distrait: DISTRAIT,
  apprend: APPREND,
  optimiste: OPTIMISTE,
  temeraire: TEMERAIRE,
  gourmand: GOURMAND,
  prudent: PRUDENT,
  naif: NAIF,
  reflexe: REFLEXE,
};

/** Les exemplaires qu'on peut encore promettre dans la tablette ouverte, avec leur prix. */
function offres(etat: EtatDette) {
  return sortesDe(etat.tablette)
    .filter((id) => etat.promises[id] < EXEMPLAIRES)
    .map((id) => ({
      id,
      prix: prixExemplaire(id, etat.promises[id]),
      rapport: SORTES[id].rapport,
    }));
}

/** Les offres, de celle qui rapporte le plus pour ce qu'elle coûte à celle qui rapporte le moins. */
const meilleures = (etat: EtatDette) =>
  offres(etat).sort((a, b) => b.rapport / b.prix - a.rapport / a.prix);

/**
 * Ce que la caisse reçoit de `de` à `a`, en crues depuis maintenant, au rapport `r` qu'on croit
 * croître de `g` par crue. Sans croissance, la caisse croît en ligne droite.
 */
function recette(r: number, g: number, de: number, a: number): number {
  if (g === 0) return r * (a - de);
  const k = Math.log(1 + g);
  return (r * (Math.exp(k * a) - Math.exp(k * de))) / k;
}

/**
 * La caisse, au rapport `r` qu'on croit croître de `g` par crue, paiera-t-elle chaque échéance à sa
 * crue, celle-ci comprise ? Ce qui tombe à la même crue se paie d'un coup.
 */
function tient(etat: EtatDette, nouvelle: { crue: number; du: number }, r: number, g = 0): boolean {
  const dues = etat.echeances
    .filter((e) => e.crue !== null)
    .map((e) => ({ crue: e.crue!, du: e.du }))
    .concat([nouvelle])
    .sort((a, b) => a.crue - b.crue);
  const maintenant = etat.temps / CRUE;
  let caisse = etat.caisse;
  let x = 0;
  for (const d of dues) {
    const y = d.crue - maintenant;
    caisse += recette(r, g, x, y);
    x = y;
    caisse -= d.du;
    if (caisse < 0) return false;
  }
  return true;
}

/**
 * La dernière tablette : toutes les promesses sauf une, puis la dernière quand la caisse prévue couvre
 * la grande crue. Pressé, il fait la dernière tout de suite.
 */
function derniereTablette(etat: EtatDette, presse: boolean): ActionDette | null {
  const o = meilleures(etat)[0];
  if (!o) return null;
  const reste = offres(etat).reduce((n, x) => n + EXEMPLAIRES - etat.promises[x.id], 0);
  if (reste > 1 || presse) return { type: "promettre", promesse: o.id, terme: 2 };
  const restant = (CRUE * (etat.crues + GRANDE_CRUE_DANS) - etat.temps) / CRUE;
  const prevue = etat.caisse + (rapport(etat) + o.rapport) * restant;
  return prevue >= toutDu(etat) + montantDu(o.prix, null)
    ? { type: "promettre", promesse: o.id, terme: 2 }
    : null;
}

/**
 * Le joueur naturel : la sorte qui rapporte le plus pour ce qu'elle coûte, au terme le plus court qui
 * tient, en comptant le rapport de la promesse nouvelle. L'hésitant prend parfois le terme d'après.
 */
function naturel(etat: EtatDette, profil: ProfilDette, alea: EtatAlea): ActionDette | null {
  if (etat.tablette === TABLETTES) return derniereTablette(etat, profil.presse ?? false);
  const r = rapport(etat);
  const g = profil.croissance ?? 0;
  for (const o of meilleures(etat)) {
    const permis = TERMES.filter((t) => doit(etat) + montantDu(o.prix, t) <= confiance(etat));
    const i = permis.findIndex((t) =>
      tient(etat, { crue: etat.crues + t, du: montantDu(o.prix, t) }, r + o.rapport, g),
    );
    if (i < 0) continue;
    const plusLong = permis[i + 1];
    const terme =
      plusLong !== undefined && tirer(alea) < (profil.hesitation ?? 0) ? plusLong : permis[i]!;
    return { type: "promettre", promesse: o.id, terme };
  }
  return null;
}

/** Le joueur réflexe : la moins chère, au terme proposé, dès que la confiance le permet. */
function reflexe(etat: EtatDette): ActionDette | null {
  const terme: Terme = 6;
  const o = offres(etat).sort((a, b) => a.prix - b.prix)[0];
  if (!o) return null;
  if (etat.tablette < TABLETTES && doit(etat) + montantDu(o.prix, terme) > confiance(etat)) {
    return null;
  }
  return { type: "promettre", promesse: o.id as IdPromesse, terme };
}

/** Le gourmand : la meilleure sorte que la confiance permet, toujours à 18 crues. */
function gourmand(etat: EtatDette): ActionDette | null {
  if (etat.tablette === TABLETTES) return derniereTablette(etat, true);
  const o = meilleures(etat).find((x) => doit(etat) + montantDu(x.prix, 18) <= confiance(etat));
  return o ? { type: "promettre", promesse: o.id, terme: 18 } : null;
}

/** Le prudent : au terme court, ce que la caisse couvre déjà, en plus de tout ce qu'il doit. */
function prudent(etat: EtatDette): ActionDette | null {
  if (etat.tablette === TABLETTES) return derniereTablette(etat, false);
  for (const o of meilleures(etat)) {
    const du = montantDu(o.prix, 2);
    if (doit(etat) + du > confiance(etat)) continue;
    if (etat.caisse >= doit(etat) + du) return { type: "promettre", promesse: o.id, terme: 2 };
  }
  return null;
}

/** Le geste d'un passage, ou null : la dette finie, ou rien qui tienne. */
export function geste(
  etat: EtatDette,
  profil: ProfilDette,
  alea: EtatAlea = creerAlea(1),
): ActionDette | null {
  if (etat.issue !== null) return null;
  switch (profil.strategie) {
    case "naturel":
      return naturel(etat, profil, alea);
    case "reflexe":
      return reflexe(etat);
    case "apprend":
      return etat.reportees > 0 ? naturel(etat, profil, alea) : reflexe(etat);
    case "naif":
      return etat.echeances.some((e) => e.reports > 0) ? null : reflexe(etat);
    case "gourmand":
      return gourmand(etat);
    case "prudent":
      return prudent(etat);
  }
}

/**
 * Un joueur branché sur un noyau démarré dans la dette. `passer(t)` joue un passage à l'instant t, si
 * c'est le moment : un geste, ou plusieurs pour qui passe rarement (`parPassage`). `seconde(t)` joue
 * la seconde t : le passage, puis une seconde de temps. `gestes` compte les promesses faites ou
 * tentées, et `termes` celles faites à 2, 6 et 18 crues avant la dernière tablette.
 */
export function creerJoueur(noyau: Noyau, profil: ProfilDette, graine = 1) {
  let prochainPassage = 0;
  const alea = creerAlea(graine);
  const joueur = {
    gestes: 0,
    termes: { 2: 0, 6: 0, 18: 0 } as Record<Terme, number>,
    passer(t: number): void {
      if (t < prochainPassage) return;
      prochainPassage = t + profil.attention;
      for (let k = 0; k < (profil.parPassage ?? 1); k++) {
        const etat = noyau.etatStrate as EtatDette;
        const action = geste(etat, profil, alea);
        if (!action) return;
        const faites = etat.echeances.length + etat.honore;
        const derniere = etat.tablette === TABLETTES;
        noyau.agir(action);
        noyau.tick(0);
        joueur.gestes++;
        const apres = noyau.etatStrate as EtatDette;
        // Un refus ne change rien au livre : le joueur attend son prochain passage.
        if (apres.echeances.length + apres.honore === faites) return;
        if (action.type === "promettre" && !derniere) joueur.termes[action.terme]++;
      }
    },
    seconde(t: number): void {
      joueur.passer(t);
      noyau.avancer(1);
    },
  };
  return joueur;
}

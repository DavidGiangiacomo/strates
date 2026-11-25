// Des joueurs automatiques pour la dette, branchés sur le noyau. Ils jouent les profils de la fiche
// (docs/strates/strate-6.md, § 4) : le joueur naturel, qui promet ce que la caisse paiera, au terme le
// plus court qui tient ; le joueur réflexe, qui promet la moins chère dès que la confiance le permet,
// sans regarder ses échéances ; et celui qui apprend, réflexe jusqu'à son premier report. Ce sont des
// joueurs de test ; l'équilibrage les reprendra (#105).
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
  strategie: "naturel" | "reflexe" | "apprend";
}

export const NATUREL: ProfilDette = {
  description:
    "passe toutes les 5 s ; promet ce que la caisse paiera à chaque échéance, au terme le plus court qui tient",
  attention: 5,
  strategie: "naturel",
};

export const REFLEXE: ProfilDette = {
  description:
    "passe toutes les 5 s ; promet la moins chère dès que la confiance le permet, à 6 crues",
  attention: 5,
  strategie: "reflexe",
};

export const APPREND: ProfilDette = {
  description: "réflexe jusqu'à son premier report, puis naturel",
  attention: 5,
  strategie: "apprend",
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

/**
 * La caisse, au rapport `r`, paiera-t-elle chaque échéance à sa crue, celle-ci comprise ? La caisse
 * croît en ligne droite entre deux crues ; ce qui tombe à la même crue se paie d'un coup.
 */
function tient(etat: EtatDette, nouvelle: { crue: number; du: number }, r: number): boolean {
  const dues = etat.echeances
    .filter((e) => e.crue !== null)
    .map((e) => ({ crue: e.crue!, du: e.du }))
    .concat([nouvelle])
    .sort((a, b) => a.crue - b.crue);
  let caisse = etat.caisse;
  let t = etat.temps;
  for (const d of dues) {
    caisse += (r * (d.crue * CRUE - t)) / CRUE;
    t = d.crue * CRUE;
    caisse -= d.du;
    if (caisse < 0) return false;
  }
  return true;
}

/**
 * Le joueur naturel : la sorte qui rapporte le plus pour ce qu'elle coûte, au terme le plus court qui
 * tient, en comptant le rapport de la promesse nouvelle. Dans la dernière tablette, il fait toutes les
 * promesses sauf une, puis la dernière quand la caisse prévue couvre la grande crue.
 */
function naturel(etat: EtatDette): ActionDette | null {
  const r = rapport(etat);
  const choix = offres(etat).sort((a, b) => b.rapport / b.prix - a.rapport / a.prix);
  if (etat.tablette === TABLETTES) {
    const reste = choix.reduce((n, o) => n + EXEMPLAIRES - etat.promises[o.id], 0);
    const o = choix[0];
    if (!o) return null;
    if (reste > 1) return { type: "promettre", promesse: o.id, terme: 2 };
    const restant = (CRUE * (etat.crues + GRANDE_CRUE_DANS) - etat.temps) / CRUE;
    const prevue = etat.caisse + (r + o.rapport) * restant;
    return prevue >= toutDu(etat) + montantDu(o.prix, null)
      ? { type: "promettre", promesse: o.id, terme: 2 }
      : null;
  }
  for (const o of choix) {
    for (const terme of TERMES) {
      const du = montantDu(o.prix, terme);
      if (doit(etat) + du > confiance(etat)) break;
      if (tient(etat, { crue: etat.crues + terme, du }, r + o.rapport)) {
        return { type: "promettre", promesse: o.id, terme };
      }
    }
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

/** Le geste d'un passage, ou null : la dette finie, ou rien qui tienne. */
export function geste(etat: EtatDette, profil: ProfilDette): ActionDette | null {
  if (etat.issue !== null) return null;
  const strategie =
    profil.strategie === "apprend"
      ? etat.reportees > 0
        ? "naturel"
        : "reflexe"
      : profil.strategie;
  return strategie === "naturel" ? naturel(etat) : reflexe(etat);
}

/**
 * Un joueur branché sur un noyau démarré dans la dette. `passer(t)` joue un passage à l'instant t, si
 * c'est le moment : un geste au plus. `seconde(t)` joue la seconde t : le passage, puis une seconde de
 * temps. `gestes` compte les promesses faites ou tentées.
 */
export function creerJoueur(noyau: Noyau, profil: ProfilDette) {
  let prochainPassage = 0;
  const joueur = {
    gestes: 0,
    passer(t: number): void {
      if (t < prochainPassage) return;
      prochainPassage = t + profil.attention;
      const action = geste(noyau.etatStrate as EtatDette, profil);
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

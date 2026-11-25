// Le compte des crues (fiche, § 6 ; bible, § 3) : une bande verticale de couches fines, une par crue,
// le limon que la dette a trouvé en creusant ses fosses à archives. Elle se lit comme le limon : les
// crues passées en bas, déposées ; les crues à venir au-dessus, encore vides, piquées de rouge à leurs
// échéances ; la grande crue, une couche épaisse. À chaque crue, une couche se dépose et la bande
// descend d'un cran : le trait du présent ne bouge pas. À l'issue, le compte s'arrête.
import type { EtatDette } from "../logique";
import { CRUE } from "../logique/regles";

/** Les couches déposées que la bande montre sous le présent : les plus vieilles ont été trouvées. */
export const PASSEES = 24;
/** Les crues à venir : le plus long terme, dix-huit crues, et un report. */
export const A_VENIR = 20;
/** L'épaisseur d'une couche, dans les unités de la bande. */
export const COUCHE = 8;
/** La grande crue est une couche épaisse : trois fois une autre. */
export const EPAISSEUR_GRANDE_CRUE = 3;
/** La largeur de la bande. */
export const LARGEUR = 48;
/** Une couche à venir porte au plus cinq piqûres, une par échéance. */
export const PIQURES_MAX = 5;

export interface Couche {
  crue: number;
  /** Déposée : la crue est passée. Sinon, elle est à venir, encore vide. */
  deposee: boolean;
  grandeCrue: boolean;
  /** Le haut de la couche, depuis le haut de la bande, et son épaisseur. */
  y: number;
  hauteur: number;
  /** Les échéances qui y tombent, piquées en rouge : seulement sur les couches à venir. */
  echeances: number;
}

export interface CompteDesCrues {
  /** Les couches à venir, du présent vers le haut, puis les couches déposées, vers le bas. */
  couches: Couche[];
  /** Le trait du présent, entre les couches déposées et les couches à venir. */
  present: number;
  hauteur: number;
  /** La couche de l'issue, la dernière déposée : la fissure en part. Null tant que la dette court. */
  issue: Couche | null;
}

/** La crue présente : la dernière passée ; une fois la dette finie, celle de son issue. */
export function cruePresente(etat: Pick<EtatDette, "crues" | "issue" | "issueA">): number {
  if (etat.issue === null || etat.issueA === null) return etat.crues;
  return Math.min(etat.crues, Math.floor(etat.issueA / CRUE + 1e-9));
}

/** Le compte des crues d'un état de la dette. */
export function compteDesCrues(
  etat: Pick<EtatDette, "crues" | "issue" | "issueA" | "grandeCrue" | "echeances">,
): CompteDesCrues {
  const presente = cruePresente(etat);
  const epaisseur = (c: number) => (c === etat.grandeCrue ? EPAISSEUR_GRANDE_CRUE : 1) * COUCHE;
  // Le présent ne bouge pas : la place de la grande crue est gardée en haut de la bande.
  const present = (A_VENIR + EPAISSEUR_GRANDE_CRUE - 1) * COUCHE;
  const dues = new Map<number, number>();
  for (const e of etat.echeances) {
    if (e.crue !== null && e.crue > presente) dues.set(e.crue, (dues.get(e.crue) ?? 0) + 1);
  }
  const couches: Couche[] = [];
  let y = present;
  for (let crue = presente + 1; crue <= presente + A_VENIR; crue++) {
    const hauteur = epaisseur(crue);
    y -= hauteur;
    couches.push({
      crue,
      deposee: false,
      grandeCrue: crue === etat.grandeCrue,
      y,
      hauteur,
      echeances: dues.get(crue) ?? 0,
    });
  }
  // Une couche de plus, sous le bord : quand la bande descend, rien ne manque en bas.
  y = present;
  for (let crue = presente; crue >= presente - PASSEES; crue--) {
    const hauteur = epaisseur(crue);
    couches.push({
      crue,
      deposee: true,
      grandeCrue: crue === etat.grandeCrue,
      y,
      hauteur,
      echeances: 0,
    });
    y += hauteur;
  }
  const issue = etat.issue === null ? null : (couches.find((c) => c.crue === presente) ?? null);
  return { couches, present, hauteur: present + PASSEES * COUCHE, issue };
}

// La coupe du lit, en version sobre (fiche, § 6) : sa géométrie, sans Svelte. Le fleuve à gauche, le
// bassin au centre et ses couches, la rive à droite et ses quatre creux, l'échelle au bord du bassin,
// côté fleuve. La direction artistique la reprendra (#107).
import type { Couche, EtatLit } from "../logique";
import { CREUX, CRUE, DOIGTS, DUREE_PHRASE, RIVE, VOLUME } from "../logique/regles";

export const LARGEUR = 1000;
export const HAUTEUR = 620;
/** Le fond du bassin, en y ; la rive est en haut, à `HAUT`. */
export const FOND = 580;
export const HAUT = 100;
/** Pixels par doigt, sur l'échelle. */
export const PX = (FOND - HAUT) / RIVE;
/** La hauteur de `doigts` sur l'échelle, en y. */
export const y = (doigts: number): number => FOND - doigts * PX;

export const FLEUVE = { x: 0, largeur: 150 };
export const BASSIN = { x: 150, largeur: 610 };
/** Là où commence la rive, et où s'ouvrent les creux. */
export const BORD_RIVE = BASSIN.x + BASSIN.largeur;
/** Une poche de creux, creusée dans la rive : sa largeur en pixels, sa hauteur en doigts. */
export const POCHE = { largeur: 110, hauteur: 2 * DOIGTS };
/** La pierre de l'échelle, dressée au bord du bassin, côté fleuve. */
export const ECHELLE = { x: 164, largeur: 16, haut: RIVE + DOIGTS };
/** L'eau d'une crue monte d'une coudée et demie au-dessus du limon. */
export const CRETE = 42;
/** Une phrase du jeu vient en une seconde et demie, et s'efface de même. */
export const FONDU = 1.5;

/** Une bande de la coupe : une couche, ou une vieille couche de la rive. */
export interface Bande {
  y: number;
  hauteur: number;
  /** 0 ou 1 en alternance, d'une couche à l'autre ; 2 ou 3 pour l'eau retenue, plus sombre. */
  teinte: number;
}

const teinte = (c: Couche): number => (c.crue % 2) + (c.retenue ? 2 : 0);

/** Les couches du bassin, empilées depuis le fond, chacune à son épaisseur. */
export function couchesDuBassin(couches: readonly Couche[]): Bande[] {
  const bandes: Bande[] = [];
  let base = 0;
  for (const c of couches) {
    if (c.ou !== "bassin") continue;
    bandes.push({ y: y(base + c.epaisseur), hauteur: c.epaisseur * PX, teinte: teinte(c) });
    base += c.epaisseur;
  }
  return bandes;
}

/** Les couches du creux `k`, dans sa poche : un creux plein emplit sa poche. */
export function couchesDuCreux(couches: readonly Couche[], k: number): Bande[] {
  const bas = y(CREUX[k]!);
  const echelle = (POCHE.hauteur * PX) / VOLUME;
  const bandes: Bande[] = [];
  let base = 0;
  for (const c of couches) {
    if (c.ou !== k) continue;
    bandes.push({
      y: bas - (base + c.epaisseur) * echelle,
      hauteur: c.epaisseur * echelle,
      teinte: teinte(c),
    });
    base += c.epaisseur;
  }
  return bandes;
}

/** Les vieilles couches de la rive : fines et régulières, avec une couche épaisse parmi elles. */
export const VIEILLES: readonly (Bande & { epaisse: boolean })[] = (() => {
  const bandes: (Bande & { epaisse: boolean })[] = [];
  let haut = FOND;
  for (let i = 0; haut > y(RIVE); i++) {
    const epaisse = i === 37;
    const hauteur = Math.min(epaisse ? 21 : 7, haut - y(RIVE));
    bandes.push({ y: haut - hauteur, hauteur, teinte: i % 2, epaisse });
    haut -= hauteur;
  }
  return bandes;
})();

/** Les traits de l'échelle : un long par coudée, un court tous les sept doigts. */
export const TRAITS: readonly { y: number; long: boolean }[] = Array.from(
  { length: ECHELLE.haut / 7 + 1 },
  (_, i) => ({ y: y(i * 7), long: i % 4 === 0 }),
);

/**
 * L'eau de la crue à l'instant `temps`, de 0, à sec, à 1, au plus haut. Elle monte en dix secondes,
 * se repose dix, se retire en dix : la n-ième crue laisse son limon au milieu de son repos, à n × 30 s.
 * La première monte quinze secondes après l'arrivée ; le bassin plein, le fleuve passe ailleurs.
 * `reduit` : moins de mouvement, la crue monte et se retire en trois images, sans glisser.
 */
export function eau(temps: number, pleinA: number | null, reduit = false): number {
  if (temps < CRUE / 2) return 0;
  if (pleinA !== null && temps >= pleinA + CRUE / 2) return 0;
  const u = (temps + CRUE / 2) % CRUE;
  const f = u < 10 ? u / 10 : u < 20 ? 1 : 1 - (u - 20) / 10;
  return reduit ? Math.round(f * 2) / 2 : f;
}

/** La phrase du jeu à l'instant `temps`, et son opacité : elle vient, reste, puis s'efface. */
export function phraseCourante(
  etat: Pick<EtatLit, "dites" | "temps">,
  reduit = false,
): { cle: string; opacite: number } | null {
  const p = etat.dites.find((d) => etat.temps >= d.a && etat.temps < d.a + DUREE_PHRASE);
  if (!p) return null;
  const ecoule = etat.temps - p.a;
  const opacite = reduit ? 1 : Math.min(1, ecoule / FONDU, (DUREE_PHRASE - ecoule) / FONDU);
  return { cle: p.cle, opacite };
}

// Les sons des caves (#59 ; fiche, § 6) : du grain, du bois, des registres, et les saisons.
// - Une rumeur par saison, en boucle : des oiseaux au printemps, des grillons l'été, des feuilles
//   sèches à l'automne, le vent l'hiver.
// - Glaner : une poignée de grain. Installer une famille, construire, acheter un outil : du bois.
//   Changer les rations, et chaque nouvelle ligne du registre : la plume qui gratte le papier.
// Ils sont calculés, sans fichier, et n'ont rien de commun avec ceux de la surface (§ 12).
import { creerAlea, tirer, type EtatAlea } from "../../../noyau/logique/alea";
import type { SourceSon } from "../../../noyau/logique/types";
import {
  ajouter,
  bandeVariable,
  blanc,
  brun,
  finir,
  normaliserParEtapes,
  panoramique,
  passeBas,
  passeHaut,
  resonateur,
} from "../../../noyau/plateforme/synthese";
import type { Saison } from "../logique/regles";

export type SonCaves = Saison | "grain" | "bois" | "plume";

/** Les durées des sons, en secondes. Les rumeurs bouclent : le moteur fond leur fin dans leur début. */
export const DUREES_SONS: Readonly<Record<SonCaves, number>> = {
  printemps: 30,
  ete: 10,
  automne: 12,
  hiver: 14,
  grain: 0.9,
  bois: 0.35,
  plume: 0.62,
};

/** Le premier trait de plume : celui qu'on entend quand les rations changent. */
export const TRAIT = 0.18;

/**
 * Le volume de la rumeur de chaque saison. Les oiseaux et les grillons sont épars et piquants, les
 * feuilles discrètes, le vent dense : leurs volumes les mettent à la même hauteur, le vent un peu
 * au-dessus, car l'hiver doit se sentir.
 */
export const RUMEURS: Readonly<Record<Saison, number>> = {
  printemps: 0.35,
  ete: 0.4,
  automne: 0.8,
  hiver: 0.4,
};

/** Le fondu d'une rumeur à la suivante, en secondes : quelques jours du calendrier. */
export const FONDU_SAISON = 5;

export const SONS_CAVES: Readonly<Record<SonCaves, SourceSon>> = {
  // Le printemps : la mésange tout près, le pinson un peu plus loin, le merle au loin, et des
  // pépiements épars.
  printemps: {
    duree: DUREES_SONS.printemps,
    stereo: true,
    frequence: 24000,
    raccord: 2,
    *calculer(canaux, fe) {
      const alea = creerAlea(61);
      const fin = DUREES_SONS.printemps - 1;
      yield* air(canaux, fe, alea, 0.03);
      // La mésange : deux notes qui alternent, ti-tu, ti-tu.
      for (let t = 0.6 + tirer(alea); t < fin; t += 6 + 3 * tirer(alea)) {
        const haut = 5200 * (1 + 0.05 * blanc(alea));
        const bas = 3600 * (1 + 0.05 * blanc(alea));
        const cadence = 0.24 + 0.06 * tirer(alea);
        for (let k = 0; k < 2 + Math.floor(4 * tirer(alea)); k++) {
          const d = t + cadence * k;
          const proche = { gain: 0.8, position: -0.5, coupure: 9000 };
          syllabe(canaux, fe, {
            ...proche,
            debut: d,
            duree: 0.08,
            de: haut * 1.02,
            a: haut * 0.97,
          });
          syllabe(canaux, fe, {
            ...proche,
            debut: d + 0.11,
            duree: 0.09,
            de: bas * 1.03,
            a: bas * 0.95,
          });
        }
        yield;
      }
      // Le pinson : un trille qui descend, puis une fioriture qui monte et retombe.
      for (let t = 3 + tirer(alea); t < fin; t += 7 + 4 * tirer(alea)) {
        const n = 8 + Math.floor(7 * tirer(alea));
        const plusLoin = { gain: 0.5, position: 0.55, coupure: 6500 };
        for (let k = 0; k < n; k++) {
          const f = 6200 - (2000 * k) / n;
          syllabe(canaux, fe, {
            ...plusLoin,
            debut: t + 0.055 * k,
            duree: 0.028,
            de: f * 1.08,
            a: f * 0.85,
          });
        }
        const debut = t + 0.055 * n + 0.03;
        syllabe(canaux, fe, { ...plusLoin, debut, duree: 0.22, de: 3000, a: 5200, retour: 3600 });
        yield;
      }
      // Le merle : une phrase flûtée, de notes graves qui glissent.
      for (let t = 6 + 2 * tirer(alea); t < fin - 1; t += 9 + 3 * tirer(alea)) {
        let d = t;
        for (let k = 0; k < 4 + Math.floor(3 * tirer(alea)); k++) {
          const f = [1900, 2300, 2600, 2100, 2900, 2450][Math.floor(6 * tirer(alea))]!;
          const duree = 0.08 + 0.14 * tirer(alea);
          const de = f * (1 + 0.06 * blanc(alea));
          const a = f * (1 + 0.06 * blanc(alea));
          const loin = { gain: 0.45, position: 0.1, coupure: 4500, vibrato: 0.012 };
          syllabe(canaux, fe, { ...loin, debut: d, duree, de, a });
          d += duree + 0.03 + 0.06 * tirer(alea);
        }
        yield;
      }
      // Des pépiements, d'un côté ou de l'autre : tchip, tchip.
      for (let t = 1.5 * tirer(alea); t < fin; t += 1.5 + 3 * tirer(alea)) {
        const epars = { gain: 0.3, position: 0.9 * blanc(alea), coupure: 4000 };
        for (let k = 0; k < 1 + Math.floor(3 * tirer(alea)); k++) {
          syllabe(canaux, fe, { ...epars, debut: t + 0.13 * k, duree: 0.035, de: 3000, a: 4600 });
        }
      }
      yield* normaliserParEtapes(canaux, 0.8);
    },
  },
  // L'été : quatre grillons, chacun à sa place, à sa hauteur et à son rythme.
  ete: {
    duree: DUREES_SONS.ete,
    stereo: true,
    frequence: 24000,
    raccord: 1.5,
    *calculer(canaux, fe) {
      const alea = creerAlea(67);
      yield* air(canaux, fe, alea, 0.02);
      const grillons = [
        { frequence: 4600, pulsations: 3, cadence: 30, periode: 0.6, gain: 0.9, position: -0.55 },
        { frequence: 4250, pulsations: 4, cadence: 27, periode: 0.75, gain: 0.6, position: 0.45 },
        { frequence: 5050, pulsations: 3, cadence: 33, periode: 0.68, gain: 0.45, position: 0.85 },
        { frequence: 3900, pulsations: 5, cadence: 24, periode: 1.1, gain: 0.35, position: -0.15 },
      ];
      for (const g of grillons) {
        // Plus il est discret, plus il est loin : le lointain perd ses aigus.
        const coupure = 4000 + 6000 * g.gain;
        for (let t = g.periode * tirer(alea); t < DUREES_SONS.ete;) {
          for (let k = 0; k < g.pulsations; k++) {
            const f = g.frequence * (1 + 0.004 * blanc(alea));
            syllabe(canaux, fe, {
              debut: t + k / g.cadence,
              duree: 0.55 / g.cadence,
              de: f * 1.01,
              a: f * 0.97,
              gain: g.gain * (k === 0 ? 0.8 : 1),
              position: g.position,
              coupure,
            });
          }
          t += g.periode * (1 + 0.06 * blanc(alea));
        }
        yield;
      }
      yield* normaliserParEtapes(canaux, 0.7);
    },
  },
  // L'automne : un vent léger, et les feuilles sèches qu'il remue, serrées dans les rafales.
  automne: {
    duree: DUREES_SONS.automne,
    stereo: true,
    frequence: 24000,
    raccord: 2,
    *calculer(canaux, fe) {
      const alea = creerAlea(71);
      const rafale = rafales(alea, [0.09, 0.17, 0.41], 0.45, 0.35);
      yield* souffle(canaux, fe, alea, rafale, {
        grave: 0.3,
        bande: 0.15,
        de: 300,
        a: 700,
        q: 1.2,
      });
      for (let t = 0, n = 1; t < DUREES_SONS.automne; n++) {
        if (n % 64 === 0) yield;
        const g = rafale(t);
        t += -Math.log(1 - tirer(alea)) / (8 + 55 * g ** 3);
        crepitement(canaux, fe, alea, {
          debut: t,
          frequence: 2500 + 6500 * tirer(alea),
          q: 1.5 + 2.5 * tirer(alea),
          decroissance: 0.0003 + 0.0009 * tirer(alea),
          gain: (0.08 + 0.3 * tirer(alea) ** 2) * g,
          position: 0.8 * blanc(alea),
        });
      }
      // De temps en temps, une feuille traîne au sol.
      for (let t = 1 + 3 * tirer(alea); t < DUREES_SONS.automne - 1; t += 2.5 + 4 * tirer(alea)) {
        frottement(canaux, fe, alea, {
          debut: t,
          duree: 0.12 + 0.2 * tirer(alea),
          frequence: 2600,
          accroches: 180,
          gain: 0.15,
          position: 0.7 * blanc(alea),
        });
      }
      yield* normaliserParEtapes(canaux, 0.75);
    },
  },
  // L'hiver : le vent, ses rafales lentes, et parfois son sifflement.
  hiver: {
    duree: DUREES_SONS.hiver,
    stereo: true,
    // Le vent n'a pas d'aigus : il se calcule à 16 kHz.
    frequence: 16000,
    raccord: 2,
    *calculer(canaux, fe) {
      const alea = creerAlea(73);
      const rafale = rafales(alea, [0.05, 0.11, 0.23], 0.5, 0.55);
      yield* souffle(canaux, fe, alea, rafale, {
        grave: 0.6,
        bande: 0.35,
        de: 280,
        a: 900,
        q: 2,
        sifflement: 0.05,
      });
      yield* normaliserParEtapes(canaux, 0.8);
    },
  },
  // Une poignée de grain : une pluie serrée de grains secs qui se raréfie, et le tas qui la reçoit.
  grain: {
    duree: DUREES_SONS.grain,
    stereo: true,
    calculer(canaux, fe) {
      const alea = creerAlea(41);
      for (let k = 0; k < 260; k++) {
        const u = tirer(alea);
        crepitement(canaux, fe, alea, {
          debut: 0.012 + 0.7 * u ** 2.2,
          frequence: 2400 + 4200 * tirer(alea),
          q: 2 + 3 * tirer(alea),
          decroissance: 0.0004 + 0.0012 * tirer(alea),
          gain: (0.3 + 0.7 * tirer(alea)) * (1 - 0.6 * u),
          position: 0.5 * blanc(alea),
        });
      }
      const tas = passeBas(900, fe);
      for (let i = 0; i < Math.round(0.6 * fe); i++) {
        const t = i / fe;
        const enveloppe = Math.min(1, t / 0.02) * Math.exp(-t / 0.25);
        ajouter(canaux, Math.round(0.01 * fe) + i, 0.6 * enveloppe * tas(blanc(alea)));
      }
      finir(canaux, fe, 0.6);
    },
  },
  // Du bois frappé : une planche, ses modes inharmoniques vite amortis, et le choc du maillet.
  bois: {
    duree: DUREES_SONS.bois,
    calculer(canaux, fe) {
      const alea = creerAlea(43);
      const canal = canaux[0]!;
      const modes = [
        { rapport: 1, gain: 1, duree: 0.07 },
        { rapport: 2.31, gain: 0.55, duree: 0.04 },
        { rapport: 3.89, gain: 0.3, duree: 0.022 },
        { rapport: 5.6, gain: 0.18, duree: 0.012 },
        { rapport: 7.9, gain: 0.1, duree: 0.007 },
      ];
      const choc = resonateur(1800, 1.2, fe);
      // Le coup part après le fondu d'entrée de `finir`, qui sinon en mangerait l'attaque.
      for (let i = Math.round(0.002 * fe); i < canal.length; i++) {
        const t = i / fe - 0.002;
        let x = 1.5 * choc(blanc(alea) * Math.exp(-t / 0.0015));
        for (const m of modes) {
          x +=
            m.gain *
            Math.sin(2 * Math.PI * 210 * m.rapport * t + m.rapport) *
            Math.exp(-t / m.duree);
        }
        canal[i] = Math.min(1, t / 0.0008) * Math.tanh(1.2 * x);
      }
      finir(canaux, fe, 0.7);
    },
  },
  // La plume : trois traits plus ou moins appuyés, et la pointe qui accroche les fibres du papier.
  plume: {
    duree: DUREES_SONS.plume,
    calculer(canaux, fe) {
      const alea = creerAlea(47);
      const traits = [
        { debut: 0, duree: TRAIT - 0.02, appui: 1 },
        { debut: 0.21, duree: 0.12, appui: 0.8 },
        { debut: 0.37, duree: 0.2, appui: 0.9 },
      ];
      for (const trait of traits) {
        frottement(canaux, fe, alea, {
          debut: trait.debut,
          duree: trait.duree,
          frequence: 4200,
          accroches: 300,
          gain: trait.appui,
          position: 0,
        });
      }
      finir(canaux, fe, 0.45);
    },
  },
};

// ——— Les gestes des sons des caves

/**
 * Un sifflement d'oiseau, ou une stridulation : un son presque pur qui glisse de `de` à `a` (puis
 * à `retour`), avec une attaque vive et une chute douce. Plus `coupure` est basse, plus il est loin.
 */
function syllabe(
  canaux: Float32Array[],
  fe: number,
  o: {
    debut: number;
    duree: number;
    de: number;
    a: number;
    retour?: number;
    gain: number;
    position: number;
    coupure: number;
    vibrato?: number;
  },
): void {
  const n0 = Math.round(o.debut * fe);
  const n = Math.round(o.duree * fe);
  const [gauche, droite] = panoramique(o.position);
  const loin = passeBas(o.coupure, fe);
  // La glissade est exponentielle : la hauteur est multipliée par le même rapport à chaque échantillon.
  const moitie = o.retour === undefined ? n : Math.round(n / 2);
  const montee = (o.a / o.de) ** (1 / Math.max(1, moitie));
  const retombee = o.retour === undefined ? 1 : (o.retour / o.a) ** (1 / Math.max(1, n - moitie));
  let hauteur = o.de;
  let phase = 0;
  const harmonique = 4 * Math.max(o.de, o.a, o.retour ?? 0) < 0.9 * fe ? 0.05 : 0;
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const f = o.vibrato
      ? hauteur * (1 + o.vibrato * Math.sin((2 * Math.PI * 28 * i) / fe))
      : hauteur;
    hauteur *= i < moitie ? montee : retombee;
    phase += (2 * Math.PI * f) / fe;
    const enveloppe =
      u < 0.15
        ? Math.sin((Math.PI / 2) * (u / 0.15)) ** 2
        : Math.cos((Math.PI / 2) * ((u - 0.15) / 0.85)) ** 2;
    const x = Math.sin(phase) + harmonique * Math.sin(2 * phase);
    ajouter(canaux, n0 + i, o.gain * enveloppe * loin(x), gauche, droite);
  }
}

/** Un craquement minuscule : un grain qui tombe, une feuille qui se froisse. */
function crepitement(
  canaux: Float32Array[],
  fe: number,
  alea: EtatAlea,
  o: {
    debut: number;
    frequence: number;
    q: number;
    decroissance: number;
    gain: number;
    position: number;
  },
): void {
  const n0 = Math.round(o.debut * fe);
  const filtre = resonateur(o.frequence, o.q, fe);
  const [gauche, droite] = panoramique(o.position);
  const attaque = 0.0002 * fe;
  const decroit = Math.exp(-1 / (o.decroissance * fe));
  let enveloppe = 3 * o.gain;
  for (let i = 0; i < Math.round(6 * o.decroissance * fe); i++) {
    const x = Math.min(1, i / attaque) * enveloppe * filtre(blanc(alea));
    ajouter(canaux, n0 + i, x, gauche, droite);
    enveloppe *= decroit;
  }
}

/**
 * Un frottement : une pointe qui gratte une surface, une plume sur le papier ou une feuille sur le
 * sol. Un bruit aigu, par à-coups : la pointe accroche, puis saute, `accroches` fois par seconde.
 */
function frottement(
  canaux: Float32Array[],
  fe: number,
  alea: EtatAlea,
  o: {
    debut: number;
    duree: number;
    frequence: number;
    accroches: number;
    gain: number;
    position: number;
  },
): void {
  const n0 = Math.round(o.debut * fe);
  const n = Math.round(o.duree * fe);
  const aigu = resonateur(o.frequence, 2.5, fe);
  const corps = resonateur(o.frequence / 3, 0.9, fe);
  const lisse = passeBas(9000, fe);
  const [gauche, droite] = panoramique(o.position);
  const relache = Math.exp(-1 / (0.0012 * fe));
  let accroche = 0;
  for (let i = 0; i < n; i++) {
    const u = i / n;
    const appui = 1.9 * u ** 0.3 * (1 - u) ** 0.8;
    if (tirer(alea) < o.accroches / fe) accroche = 0.5 + 0.5 * tirer(alea);
    accroche *= relache;
    const bruit = blanc(alea);
    const x = aigu(bruit) * (0.15 + 2 * accroche) + 0.15 * corps(bruit);
    ajouter(canaux, n0 + i, o.gain * appui * lisse(x), gauche, droite);
  }
}

/** Les longues boucles cèdent la main tous les tant d'échantillons : le moteur les poursuit plus tard. */
const ETAPE = 4096;

/** Un souffle d'air immobile, à peine audible : l'espace autour des oiseaux et des grillons. */
function* air(canaux: Float32Array[], fe: number, alea: EtatAlea, gain: number): Generator<void> {
  for (const canal of canaux) {
    const doux = passeBas(800, fe);
    for (let i = 0; i < canal.length; i++) {
      canal[i] = canal[i]! + gain * doux(blanc(alea));
      if (i % ETAPE === ETAPE - 1) yield;
    }
  }
}

/**
 * Des rafales : une houle lente entre 0 et 1, autour de `base`, faite de quelques ondes aux périodes
 * sans rapport entre elles, pour qu'aucune ne revienne à l'identique.
 */
function rafales(
  alea: EtatAlea,
  frequences: readonly number[],
  base: number,
  ampleur: number,
): (t: number) => number {
  const ondes = frequences.map((f, i) => ({
    f,
    phase: 2 * Math.PI * tirer(alea),
    poids: 1 / (i + 1),
  }));
  const total = ondes.reduce((s, o) => s + o.poids, 0);
  return (t) => {
    const houle = ondes.reduce(
      (s, o) => s + o.poids * Math.sin(2 * Math.PI * o.f * t + o.phase),
      0,
    );
    return Math.min(1, Math.max(0, base + (ampleur * houle) / total));
  };
}

/**
 * Le vent : un grondement grave, un souffle dont la hauteur monte avec la rafale, et parfois un
 * sifflement étroit. Chaque canal a ses propres rafales, un peu décalées : le vent vient de partout.
 */
function* souffle(
  canaux: Float32Array[],
  fe: number,
  alea: EtatAlea,
  rafale: (t: number) => number,
  o: { grave: number; bande: number; de: number; a: number; q: number; sifflement?: number },
): Generator<void> {
  for (const [c, canal] of canaux.entries()) {
    const graves = brun(alea);
    const sourd = passeBas(300, fe);
    const bande = bandeVariable(o.q, fe);
    const adouci = passeBas(1800, fe);
    const sifflement = bandeVariable(30, fe);
    const clair = passeHaut(80, fe);
    const decalage = 0.9 * c;
    // Les rafales sont lentes : il suffit de les relire tous les 32 échantillons.
    let g = 0;
    let h = 0;
    for (let i = 0; i < canal.length; i++) {
      if (i % 32 === 0) {
        g = rafale(i / fe + decalage);
        h = rafale(i / fe + decalage + 3.7);
      }
      // La force croît comme le carré de la rafale : elle enfle, puis retombe presque au calme.
      const force = g * g;
      let x = o.grave * (0.3 + 0.7 * force) * sourd(graves());
      x += o.bande * force * adouci(bande(blanc(alea), o.de + (o.a - o.de) * g));
      if (o.sifflement) x += o.sifflement * h ** 3 * sifflement(blanc(alea), 550 + 450 * h);
      canal[i] = canal[i]! + clair(x);
      if (i % ETAPE === ETAPE - 1) yield;
    }
  }
}

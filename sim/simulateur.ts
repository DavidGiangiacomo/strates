// Le simulateur headless (#23) : fait jouer une strate, sans rendu et en temps accéléré, par un joueur
// automatique, puis donne le temps jusqu'au seuil de fouille, la valeur convertible et les points de
// fouille. Il compare, si on le lui demande, une partie avec les objets d'en haut et une partie
// sans : toute strate doit se terminer en moins de 3 h 15 sans aucun artefact (I5, §9). Il
// n'importe que la logique des strates (D-004). Il se lance par `npm run simuler` (simuler.mjs).
import type { NumeroStrate } from "../src/noyau/logique/types";
import * as joueursCaves from "./joueurs/caves";
import * as joueursSurface from "./joueurs/surface";
import { mesurerCaves } from "./mesures/caves";
import { mesurerSurface } from "./mesures/surface";

/** I5 : une strate se termine en moins de 3 h 15 sans aucun artefact. */
export const LIMITE_I5 = 3 * 3600 + 15 * 60;

/** Les objets d'un jeu correct à la surface : la présélection de 12 points (docs/artefacts.md, § 8). */
export const OBJETS_JEU_CORRECT = [
  "s1-equipe",
  "s1-double-ecran",
  "s1-serveur",
  "s1-filiale",
  "s1-turbine",
];

/** Une partie simulée, jusqu'au seuil ou jusqu'à la limite. */
export interface Partie {
  /** Le seuil, en secondes de jeu ; null s'il n'est pas atteint dans la limite. */
  seuil: number | null;
  /** La valeur convertible au seuil (ou à la limite). */
  valeur: number;
  points: number;
  /** Ce que la strate mesure en plus, déjà écrit : libellé, puis valeur. */
  details: [string, string][];
}

interface Joueur {
  description: string;
}

interface StrateSimulee {
  numero: NumeroStrate;
  nom: string;
  /** L'unité de sa valeur convertible. */
  unite: string;
  /** Peut-elle recevoir des objets d'en haut ? La surface, non : aucune strate n'est au-dessus. */
  recoitDesObjets: boolean;
  joueurs: Record<string, Joueur>;
  jouer(joueur: string, options: { objets: string[]; limite: number }): Promise<Partie>;
}

const JOUEURS_SURFACE = {
  parfait: joueursSurface.PARFAIT,
  actif: joueursSurface.ACTIF,
  correct: joueursSurface.CORRECT,
  distrait: joueursSurface.DISTRAIT,
  occasionnel: joueursSurface.OCCASIONNEL,
  "moins-cher": joueursSurface.MOINS_CHER,
};

const JOUEURS_CAVES = {
  reflexe: joueursCaves.REFLEXE,
  apprend: joueursCaves.APPREND,
  correct: joueursCaves.CORRECT,
  prudent: joueursCaves.PRUDENT,
  distrait: joueursCaves.DISTRAIT,
  "moins-cher": joueursCaves.MOINS_CHER,
};

export const STRATES: Record<string, StrateSimulee> = {
  surface: {
    numero: 1,
    nom: "La surface",
    unite: "cr",
    recoitDesObjets: false,
    joueurs: JOUEURS_SURFACE,
    async jouer(joueur, { limite }) {
      const m = await mesurerSurface(JOUEURS_SURFACE[joueur as keyof typeof JOUEURS_SURFACE], {
        limite,
      });
      const attente = Math.max(0, ...m.attentes.map((a) => a.duree));
      return {
        seuil: m.seuil,
        valeur: m.cumul,
        points: m.points.auSeuil,
        details: [
          ["Achats avant le seuil", String(m.achats)],
          ["Plus longue attente entre deux achats", duree(attente)],
          ["Part du clic à 5 min", pourcent(m.partClic.a5)],
        ],
      };
    },
  },
  caves: {
    numero: 2,
    nom: "Les caves",
    unite: "boisseaux",
    recoitDesObjets: true,
    joueurs: JOUEURS_CAVES,
    async jouer(joueur, { objets, limite }) {
      const m = await mesurerCaves(JOUEURS_CAVES[joueur as keyof typeof JOUEURS_CAVES], {
        limite,
        artefacts: objets,
      });
      const details: [string, string][] = [
        ["Première rupture", m.premiereRupture === null ? "aucune" : duree(m.premiereRupture)],
        ["Hivers manqués", `${m.hivers.manques} sur ${m.hivers.juges}`],
        ["Grands hivers manqués", String(m.hivers.grandsManques)],
        ["Familles", String(Math.round(m.familles))],
      ];
      if (objets.length > 0) details.push(["Plafond × 4 atteint", m.plafonne ? "oui" : "non"]);
      return { seuil: m.seuil, valeur: m.cumul, points: m.points.auSeuil, details };
    },
  },
};

/** Les noms qu'on peut donner à une strate : son nom ou sa profondeur. */
const ALIAS: Record<string, string> = { "1": "surface", "2": "caves" };

export interface Demande {
  strate: string;
  joueurs: string[];
  /** Les objets venus d'en haut ; vide pour une partie sans artefact. */
  objets: string[];
  /** Jouer chaque partie deux fois : sans objet, puis avec. */
  comparer: boolean;
  /** En secondes de jeu. */
  limite: number;
  json: boolean;
}

export const USAGE = `Usage : npm run simuler -- <strate> [joueur… | tous] [options]

  strate        surface (ou 1), caves (ou 2)
  joueur        correct par défaut ; « tous » les joue tous
  --objets=…    les objets emportés de la surface : jeu-correct, ou une liste
                d'identifiants séparés par des virgules (s1-equipe,s1-turbine)
  --comparer    chaque partie deux fois, sans objet puis avec (jeu-correct par
                défaut), et le verdict d'I5 : le seuil en moins de 3 h 15 sans objet
  --limite=H    durée de jeu au plus, en heures (4 par défaut)
  --json        les résultats en JSON

Joueurs de la surface : ${Object.keys(JOUEURS_SURFACE).join(", ")}
Joueurs des caves : ${Object.keys(JOUEURS_CAVES).join(", ")}`;

/** Lit la ligne de commande ; lève une erreur qui dit quoi corriger. */
export function lireArguments(args: readonly string[]): Demande {
  const positions = args.filter((a) => !a.startsWith("--"));
  const options = new Map(
    args
      .filter((a) => a.startsWith("--"))
      .map((a) => {
        const [cle, ...valeur] = a.slice(2).split("=");
        return [cle!, valeur.join("=")] as const;
      }),
  );
  for (const cle of options.keys()) {
    if (!["objets", "comparer", "limite", "json"].includes(cle)) {
      throw new Error(`Option inconnue : --${cle}.`);
    }
  }

  const [nomStrate, ...nomsJoueurs] = positions;
  if (nomStrate === undefined) throw new Error("Quelle strate ?");
  const strate = ALIAS[nomStrate] ?? nomStrate;
  const def = STRATES[strate];
  if (!def) throw new Error(`Strate inconnue : ${nomStrate}.`);

  const connus = Object.keys(def.joueurs);
  const joueurs = nomsJoueurs.length === 0 ? ["correct"] : nomsJoueurs;
  const liste = joueurs.includes("tous") ? connus : joueurs;
  for (const j of liste) {
    if (!connus.includes(j)) throw new Error(`Joueur inconnu pour ${strate} : ${j}.`);
  }

  // Comparer n'a de sens que pour une strate qui reçoit des objets : la surface joue une fois.
  const comparer = options.has("comparer") && def.recoitDesObjets;
  const texteObjets = options.get("objets") ?? (comparer ? "jeu-correct" : "");
  const objets =
    texteObjets === "jeu-correct"
      ? [...OBJETS_JEU_CORRECT]
      : texteObjets.split(",").filter((id) => id !== "");
  if (objets.length > 0 && !def.recoitDesObjets) {
    throw new Error(`${def.nom} ne reçoit aucun objet : aucune strate n'est au-dessus.`);
  }

  const heures = options.has("limite") ? Number(options.get("limite")) : 4;
  if (!(heures > 0)) throw new Error("La limite est une durée en heures, plus grande que 0.");

  return {
    strate,
    joueurs: liste,
    objets,
    comparer,
    limite: Math.round(heures * 3600),
    json: options.has("json"),
  };
}

// ——— L'écriture des résultats

/** Une durée de jeu, sans ses parties nulles : « 1 h 12 min 41 s », « 4 min 45 s », « 4 h ». */
export function duree(secondes: number): string {
  const total = Math.round(secondes);
  const parties = [
    [Math.floor(total / 3600), "h"],
    [Math.floor((total % 3600) / 60), "min"],
    [total % 60, "s"],
  ] as const;
  const texte = parties
    .filter(([n]) => n > 0)
    .map(([n, unite]) => `${n} ${unite}`)
    .join(" ");
  return texte || "0 s";
}

/** Un entier, les milliers séparés par une espace fine : « 638 915 675 ». */
export function entier(x: number): string {
  return String(Math.floor(x)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const pourcent = (x: number) => `${Math.round(x * 100)} %`;

interface Resultat {
  joueur: string;
  sans: Partie;
  avec: Partie | null;
}

/** Les parties demandées, dans l'ordre des joueurs. */
export async function jouer(demande: Demande): Promise<Resultat[]> {
  const def = STRATES[demande.strate]!;
  const resultats: Resultat[] = [];
  for (const joueur of demande.joueurs) {
    const premiere = demande.comparer ? [] : demande.objets;
    const sans = await def.jouer(joueur, { objets: premiere, limite: demande.limite });
    const avec = demande.comparer
      ? await def.jouer(joueur, { objets: demande.objets, limite: demande.limite })
      : null;
    resultats.push({ joueur, sans, avec });
  }
  return resultats;
}

/** Le rapport, en texte : un bloc par joueur, avec une colonne par partie. */
export function rediger(demande: Demande, resultats: readonly Resultat[]): string {
  const def = STRATES[demande.strate]!;
  const objets = demande.objets.length;
  const lignes: string[] = [];
  for (const { joueur, sans, avec } of resultats) {
    lignes.push(
      `${def.nom} (strate ${def.numero}) · joueur ${joueur}`,
      `  ${def.joueurs[joueur]!.description}`,
      "",
    );
    const colonnes = avec ? [sans, avec] : [sans];
    const entetes = avec
      ? ["sans objet", `avec ${objets} objet${objets > 1 ? "s" : ""}`]
      : [objets > 0 ? `avec ${objets} objet${objets > 1 ? "s" : ""}` : "partie"];
    const tableau: string[][] = [
      ["", ...entetes],
      [
        "Seuil de fouille",
        ...colonnes.map((p) => (p.seuil === null ? "non atteint" : duree(p.seuil))),
      ],
      ["Valeur convertible", ...colonnes.map((p) => `${entier(p.valeur)} ${def.unite}`)],
      ["Points de fouille", ...colonnes.map((p) => String(p.points))],
      ...sans.details.map(([libelle], i) => [
        libelle,
        ...colonnes.map((p) => p.details[i]?.[1] ?? ""),
      ]),
    ];
    const largeurs = tableau[0]!.map((_, c) => Math.max(...tableau.map((l) => l[c]!.length)));
    for (const ligne of tableau) {
      lignes.push(
        `  ${ligne
          .map((cellule, c) => cellule.padEnd(largeurs[c]! + 3))
          .join("")
          .trimEnd()}`,
      );
    }
    if (avec || objets === 0) lignes.push("", `  I5 : ${verdictI5(sans.seuil, demande.limite)}`);
    lignes.push("");
  }
  return lignes.join("\n").trimEnd();
}

/** Le verdict d'I5 pour une partie sans objet. */
export function verdictI5(seuil: number | null, limite: number): string {
  if (seuil === null) return `seuil non atteint en ${duree(limite)} de jeu, sans objet`;
  return seuil < LIMITE_I5
    ? `tenu, le seuil tombe à ${duree(seuil)} sans objet (moins de 3 h 15)`
    : `non tenu, le seuil tombe à ${duree(seuil)} sans objet (plus de 3 h 15)`;
}

/** La commande entière : lit les arguments, joue, et rend le texte à écrire. */
export async function simuler(args: readonly string[]): Promise<string> {
  if (args.length === 0 || args.includes("--aide")) return USAGE;
  const demande = lireArguments(args);
  const resultats = await jouer(demande);
  if (demande.json) {
    return JSON.stringify(
      resultats.map((r) => ({ strate: demande.strate, objets: demande.objets, ...r })),
      null,
      2,
    );
  }
  return rediger(demande, resultats);
}

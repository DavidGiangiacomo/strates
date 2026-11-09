// L'équilibrage du lit (#116) : des parties complètes, jouées par des joueurs automatiques, en continu
// ou avec de longues absences, sans artefact puis avec les objets d'un jeu correct, doivent tomber dans
// les cibles de la fiche (docs/strates/strate-7.md) et de l'issue. Les mesures sont publiées dans
// docs/strates/strate-7-mesures.md, tenu à jour par ce test.
// Pour le régénérer après un changement de règles : npm run mesures
import { describe, expect, it } from "vitest";
import { ATTENTIF, DISTRAIT, PREVOYANT, SANS_UN_GESTE, type ProfilLit } from "../sim/joueurs/lit";
import { mesurerLit, sessions, type Absence, type MesuresLit } from "../sim/mesures/lit";
import { artefact, preselection } from "../src/noyau/logique/artefacts";
import { CRUE, RIVE, VOLUME } from "../src/strates/s7-lit/logique/regles";

const H = 3600;
const JOUR = 24 * H;

interface Rythme {
  profil: ProfilLit;
  /** Ce qu'il fait de son temps, pour le rapport. */
  description: string;
  absences: Absence[];
}

/**
 * Les joueurs en continu de la fiche (§ 4), puis des rythmes d'absence : le joueur qui ferme le premier
 * creux et part, celui qui revient par sessions, celui qui joue une demi-heure avant la nuit, et celui
 * qui part dès l'arrivée (§ 8 et § 10).
 */
const RYTHMES: Record<string, Rythme> = {
  prevoyant: { profil: PREVOYANT, description: PREVOYANT.description, absences: [] },
  attentif: { profil: ATTENTIF, description: ATTENTIF.description, absences: [] },
  distrait: { profil: DISTRAIT, description: DISTRAIT.description, absences: [] },
  "sans-un-geste": {
    profil: SANS_UN_GESTE,
    description: "ne fait rien, et reste là",
    absences: [],
  },
  "voyageur-2-h": {
    profil: ATTENTIF,
    description: "ferme le premier creux, part deux heures, puis joue en attentif",
    absences: [{ depart: 60, duree: 2 * H }],
  },
  "voyageur-2-semaines": {
    profil: ATTENTIF,
    description: "ferme le premier creux, puis part deux semaines",
    absences: [{ depart: 60, duree: 14 * JOUR }],
  },
  "sessions-1-h": {
    profil: ATTENTIF,
    description: "joue cinq minutes par heure, en attentif",
    absences: sessions(5 * 60, 55 * 60),
  },
  "sessions-30-min": {
    profil: ATTENTIF,
    description: "joue dix minutes, part une demi-heure, en attentif",
    absences: sessions(10 * 60, 30 * 60),
  },
  nuit: {
    profil: ATTENTIF,
    description: "joue une demi-heure en attentif, puis part huit heures",
    absences: [{ depart: 30 * 60, duree: 8 * H }],
  },
  "part-aussitot": {
    profil: SANS_UN_GESTE,
    description: "part deux semaines dès l'arrivée, sans un geste",
    absences: [{ depart: 0, duree: 14 * JOUR }],
  },
};
/** Ceux qui jouent sans s'absenter. */
const EN_CONTINU = ["prevoyant", "attentif", "distrait", "sans-un-geste"];
const NOMS = Object.keys(RYTHMES);

/** Les objets d'un jeu correct : la présélection de 14 points dans le chœur, puis celle de 28 dans la dette. */
const OBJETS = [...preselection(14, 5), ...preselection(28, 6)];

type Variante = "sans" | "avec";
const MESURES: Record<Variante, Record<string, MesuresLit>> = { sans: {}, avec: {} };
for (const variante of ["sans", "avec"] as const) {
  for (const [nom, { profil, absences }] of Object.entries(RYTHMES)) {
    MESURES[variante][nom] = await mesurerLit(profil, {
      artefacts: variante === "avec" ? OBJETS : [],
      absences,
    });
  }
}

const minutes = (s: number | null) => (s === null ? Infinity : s / 60);
const chaque = (f: (m: MesuresLit, variante: Variante, nom: string) => void) => {
  for (const variante of ["sans", "avec"] as const) {
    for (const nom of NOMS) f(MESURES[variante][nom]!, variante, nom);
  }
};

describe("l'équilibrage du lit", () => {
  it("remplit le bassin entre 1 h 30 et 2 h 30, en continu comme avec de longues absences, avec ou sans objets", () => {
    chaque((m, variante, nom) => {
      expect(minutes(m.plein), `${nom}, ${variante}`).toBeGreaterThan(90);
      expect(minutes(m.plein), `${nom}, ${variante}`).toBeLessThan(150);
    });
  });

  it("le remplit vers 2 h, à un quart d'heure près, pour les joueurs en continu sans objets", () => {
    const moyenne =
      EN_CONTINU.reduce((a, nom) => a + minutes(MESURES.sans[nom]!.plein), 0) / EN_CONTINU.length;
    expect(Math.abs(moyenne - 120)).toBeLessThan(15);
  });

  it("tient sous 3 h 15 sans aucun artefact (I5)", () => {
    for (const nom of NOMS) expect(minutes(MESURES.sans[nom]!.plein)).toBeLessThan(195);
    for (const nom of EN_CONTINU) expect(minutes(MESURES.sans[nom]!.descente)).toBeLessThan(195);
  });

  it("fait venir la descente sous les yeux du joueur, une crue après le bassin plein ou après son retour", () => {
    chaque((m, variante, nom) => {
      expect(m.enPresence, `${nom}, ${variante}`).toBe(true);
      const depart = Math.max(m.plein!, m.retour ?? 0);
      expect(m.descente! - depart, `${nom}, ${variante}`).toBeGreaterThanOrEqual(CRUE);
      expect(m.descente! - depart, `${nom}, ${variante}`).toBeLessThanOrEqual(CRUE + 1);
    });
  });

  it("donne toujours 4 points : le bassin plein tient 1 941 doigts, environ 10³, quoi qu'on fasse", () => {
    chaque((m) => {
      expect(m.depose).toBeCloseTo(RIVE + 4 * VOLUME, 6);
      expect(m.points).toBe(4);
    });
  });

  it("ne touche pas au plafond × 4 avec les objets d'un jeu correct (I2)", () => {
    chaque((m, variante) => {
      expect(m.plafonne).toBe(false);
      const attendus =
        variante === "avec" ? { depot: 1.25 * 1.125, patience: 1.25 } : { depot: 1, patience: 1 };
      expect(m.multiplicateurs.depot).toBeCloseTo(attendus.depot, 9);
      expect(m.multiplicateurs.patience).toBeCloseTo(attendus.patience, 9);
    });
  });

  it("fait gagner les objets à qui ferme les creux, ou à qui part, mais rien à qui reste sans un geste", () => {
    for (const nom of [
      "prevoyant",
      "attentif",
      "distrait",
      "voyageur-2-semaines",
      "part-aussitot",
    ]) {
      expect(MESURES.avec[nom]!.plein!).toBeLessThan(MESURES.sans[nom]!.plein!);
    }
    expect(MESURES.avec["sans-un-geste"]!.plein).toBe(MESURES.sans["sans-un-geste"]!.plein);
  });

  it("publie ses mesures dans docs/strates/strate-7-mesures.md (sinon : npm run mesures)", async () => {
    await expect(rapport()).toMatchFileSnapshot("../docs/strates/strate-7-mesures.md");
  });
});

// ——— Le rapport

const fmt = (x: number, decimales = 1) =>
  Number.isFinite(x) ? x.toFixed(decimales).replace(".", ",") : "—";
/** Un entier, ses milliers séparés : « 1 941 ». */
const entier = (x: number) => String(Math.floor(x)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
/** Une durée lisible : « 2 h 04 », « 14 j 0 h 01 ». */
function duree(s: number | null): string {
  if (s === null) return "—";
  const m = Math.round(s / 60);
  const j = Math.floor(m / (24 * 60));
  const h = Math.floor((m % (24 * 60)) / 60);
  const reste = `${h} h ${String(m % 60).padStart(2, "0")}`;
  return j > 0 ? `${j} j ${reste}` : reste;
}

function tableau(entetes: string[], lignes: string[][]): string {
  return [
    `| ${entetes.join(" | ")} |`,
    `|${entetes.map(() => "---").join("|")}|`,
    ...lignes.map((l) => `| ${l.join(" | ")} |`),
  ].join("\n");
}

function resultats(variante: Variante): string {
  return tableau(
    [
      "Rythme",
      "Bassin plein",
      "Descente",
      "Présence",
      "Levées",
      "Couches retenues",
      "Limon",
      "Points",
    ],
    NOMS.map((nom) => {
      const m = MESURES[variante][nom]!;
      return [
        nom,
        duree(m.plein),
        duree(m.descente),
        duree(m.presence),
        String(m.gestes),
        String(m.retenues),
        `${entier(m.depose)} doigts`,
        String(m.points),
      ];
    }),
  );
}

function rapport(): string {
  const rythmes = tableau(
    ["Rythme", "Jeu"],
    NOMS.map((nom) => [nom, RYTHMES[nom]!.description]),
  );
  const objets = OBJETS.map((id) => artefact(id)?.nomDEnBas ?? id).join(", ");
  const gain = (nom: string) =>
    `${fmt(minutes(MESURES.sans[nom]!.plein) - minutes(MESURES.avec[nom]!.plein))} min`;

  return `# Strate 7 — mesures d'équilibrage

*Fichier généré par \`tests/equilibrage-lit.test.ts\` : ne pas le modifier à la main. Après un changement des règles, \`npm run mesures\` le régénère. Les cibles viennent de la [fiche](strate-7.md) et de l'issue #116.*

Chaque rythme est un joueur automatique (\`sim/joueurs/lit.ts\`), qui joue à l'horloge (\`sim/mesures/lit.ts\`). À chaque passage, il ferme le premier creux qui n'est pas plein : quand il le voit sous l'eau, ou d'avance s'il prévoit. Au retour d'une absence, il passe aussitôt. Pendant l'absence, le noyau rattrape le temps d'un coup, crue par crue, par la politique propre du lit : à 100 %, sans plafond. Le bassin plein attend le joueur, et la descente part une crue après son retour.

## Rythmes

${rythmes}

## Sans artefact

${resultats("sans")}

## Avec les objets d'un jeu correct

La présélection de 14 points dans le chœur, puis celle de 28 dans la dette : ${objets}. Sur l'eau retenue, × ${fmt(1.25 * 1.125, 2)} ; sur l'absence, × 1,25.

${resultats("avec")}

- **Bassin plein** : le limon atteint la rive, en temps depuis l'arrivée, absences comprises. **Descente** : au même compte, une crue après le bassin plein, ou après le retour du joueur.
- **Présence** : le temps où le joueur était là, jusqu'à la descente.
- **Levées** : les levées bâties ; **couches retenues** : les crues dont l'eau s'est reposée derrière une levée.
- **Limon** : la valeur convertible, à la descente.
- **Ce que les objets font gagner** au bassin plein : ${gain("prevoyant")} au prévoyant, ${gain("attentif")} à l'attentif, ${gain("voyageur-2-semaines")} au voyageur, ${gain("part-aussitot")} à qui part dès l'arrivée, rien à qui reste sans un geste.
`;
}

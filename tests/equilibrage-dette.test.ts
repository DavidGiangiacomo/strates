// L'équilibrage de la dette (#105) : des parties complètes, jouées par les onze joueurs automatiques de
// la fiche, sans artefact puis avec les objets d'un jeu correct, et des parties avec de longues
// absences, doivent tomber dans les cibles de la fiche (docs/strates/strate-6.md) et de l'issue. Les
// actes de compréhension qu'ils accomplissent, et le κ qu'ils en gagnent, sont mesurés aussi (#104).
// Les mesures sont publiées dans docs/strates/strate-6-mesures.md, tenu à jour par ce test.
// Pour le régénérer après un changement de règles : npm run mesures
import { describe, expect, it } from "vitest";
import {
  APPREND,
  HESITANT,
  JOUEURS,
  NATUREL,
  REFLEXE,
  type ProfilDette,
} from "../sim/joueurs/dette";
import { mesurerDette, type Absence, type MesuresDette } from "../sim/mesures/dette";
import { OBJETS_JEU_CORRECT_DETTE } from "../sim/simulateur";
import { artefact, PLAFOND_MULTIPLICATEURS, preselection } from "../src/noyau/logique/artefacts";
import { SANS_AIDE, SANS_ARTEFACT } from "../src/noyau/logique/comprehension";
import { ACTES, LIVRE_ENTIER } from "../src/strates/s6-dette/logique/regles";

const MIN = 60;
const H = 3600;
/** I5 : la strate se termine en moins de 3 h 15 sans aucun artefact. */
const I5 = 3 * H + 15 * MIN;

/** Les objets d'un jeu correct : la présélection de 21 points dans le réseau, puis celle de 14 dans le chœur. */
const OBJETS = OBJETS_JEU_CORRECT_DETTE;
const NOMS = Object.keys(JOUEURS);
/** Ceux qui regardent leurs échéances : ils soldent, quel que soit leur rythme. */
const REGULIERS = ["parfait", "naturel", "hesitant", "distrait", "apprend"];
/** Ceux qui ne les regardent pas, ou comptent sur un avenir meilleur : ils tombent en défaut. */
const IMPRUDENTS = ["optimiste", "temeraire", "gourmand", "naif", "reflexe"];

type Variante = "sans" | "avec";
const MESURES: Record<Variante, Record<string, MesuresDette>> = { sans: {}, avec: {} };
for (const variante of ["sans", "avec"] as const) {
  for (const [nom, profil] of Object.entries(JOUEURS)) {
    MESURES[variante][nom] = await mesurerDette(profil, {
      artefacts: variante === "avec" ? OBJETS : [],
    });
  }
}

/** Des absences de la fiche (§ 10) : une heure, une nuit, douze heures, deux jours. */
interface Rythme {
  profil: ProfilDette;
  description: string;
  absences: Absence[];
}
const DERNIERE_PROMESSE = MESURES.sans.naturel!.grandeCrueFixee!;
const RYTHMES: Record<string, Rythme> = {
  "naturel-1-h": {
    profil: NATUREL,
    description: "naturel ; part une heure à 40 minutes",
    absences: [{ depart: 40 * MIN, duree: H }],
  },
  "naturel-nuit": {
    profil: NATUREL,
    description: "naturel ; part huit heures à 1 h 30",
    absences: [{ depart: 90 * MIN, duree: 8 * H }],
  },
  "naturel-12-h": {
    profil: NATUREL,
    description: "naturel ; part douze heures à 40 minutes",
    absences: [{ depart: 40 * MIN, duree: 12 * H }],
  },
  "naturel-2-j": {
    profil: NATUREL,
    description: "naturel ; part deux jours à 2 h",
    absences: [{ depart: 2 * H, duree: 48 * H }],
  },
  "naturel-grande-crue": {
    profil: NATUREL,
    description: "naturel ; part une heure juste après sa dernière promesse",
    absences: [{ depart: DERNIERE_PROMESSE + 5, duree: H }],
  },
  "hesitant-12-h": {
    profil: HESITANT,
    description: "hésitant ; part douze heures à 1 h",
    absences: [{ depart: H, duree: 12 * H }],
  },
  "apprend-12-h": {
    profil: APPREND,
    description: "apprend ; part douze heures à 30 minutes",
    absences: [{ depart: 30 * MIN, duree: 12 * H }],
  },
  "reflexe-12-h": {
    profil: REFLEXE,
    description: "réflexe ; part douze heures à 30 minutes",
    absences: [{ depart: 30 * MIN, duree: 12 * H }],
  },
};
const ABSENCES: Record<string, MesuresDette> = {};
for (const [nom, { profil, absences }] of Object.entries(RYTHMES)) {
  ABSENCES[nom] = await mesurerDette(profil, { absences, limite: 80 * H });
}

const minutes = (s: number | null) => (s === null ? Infinity : s / 60);
/** L'attente de la grande crue : de l'ouverture de la dernière tablette à la dernière promesse. */
const attente = (m: MesuresDette) =>
  m.grandeCrueFixee === null || m.ouvertures[3] == null
    ? null
    : (m.grandeCrueFixee - m.ouvertures[3]) / 60;
/** La part des termes longs, avant la dernière tablette. */
const partLongue = (m: MesuresDette) => m.termes[18] / (m.termes[2] + m.termes[6] + m.termes[18]);

describe("l'équilibrage de la dette", () => {
  it("se solde vers 3 h pour le joueur naturel, sans objet : de 2 h 45 à 3 h", () => {
    const m = MESURES.sans.naturel!;
    expect(m.issue).toBe("soldee");
    expect(minutes(m.issueA)).toBeGreaterThan(165);
    expect(minutes(m.issueA)).toBeLessThan(180);
  });

  it("tient sous 3 h 15 sans aucun artefact pour tous ceux qui regardent leurs échéances (I5)", () => {
    for (const nom of REGULIERS) {
      const m = MESURES.sans[nom]!;
      expect(m.issue, nom).toBe("soldee");
      expect(m.issueA!, nom).toBeLessThan(I5);
    }
    // Le plus lent garde un quart d'heure de marge.
    const plusLent = Math.max(...REGULIERS.map((nom) => MESURES.sans[nom]!.issueA!));
    expect(I5 - plusLent).toBeGreaterThanOrEqual(14 * MIN);
  });

  it("fait tomber en défaut qui ne regarde pas ses échéances, avec moins de points", () => {
    for (const variante of ["sans", "avec"] as const) {
      for (const nom of IMPRUDENTS) {
        const m = MESURES[variante][nom]!;
        expect(m.issue, `${nom}, ${variante}`).toBe("defaut");
        expect(m.points, `${nom}, ${variante}`).toBeLessThan(28);
      }
    }
  });

  it("garde le solde atteignable au prudent, mais en deux fois plus de temps (I4)", () => {
    const m = MESURES.sans.prudent!;
    expect(m.issue).toBe("soldee");
    expect(minutes(m.issueA)).toBeGreaterThan(2 * minutes(MESURES.sans.naturel!.issueA));
  });

  it("monte aux 10²⁰ : le livre entier, 3,84 × 10²⁰, et 28 points pour qui solde", () => {
    for (const variante of ["sans", "avec"] as const) {
      for (const nom of NOMS) {
        const m = MESURES[variante][nom]!;
        if (m.issue !== "soldee") continue;
        expect(m.valeur, `${nom}, ${variante}`).toBe(LIVRE_ENTIER);
        expect(m.points, `${nom}, ${variante}`).toBe(28);
        expect(Math.floor(Math.log10(m.caisseMax)), `${nom}, ${variante}`).toBe(20);
      }
    }
  });

  it("raccourcit la strate avec les objets d'un jeu correct, sans toucher au plafond × 4 (I2)", () => {
    for (const nom of NOMS) {
      const m = MESURES.avec[nom]!;
      expect(m.plafonne, nom).toBe(false);
      expect(m.multiplicateurs.confiance * m.multiplicateurs.report).toBeLessThanOrEqual(
        PLAFOND_MULTIPLICATEURS,
      );
    }
    expect(MESURES.avec.naturel!.multiplicateurs.confiance).toBeCloseTo(1.5, 9);
    expect(MESURES.avec.naturel!.multiplicateurs.report).toBeCloseTo(1.875, 9);
    for (const nom of REGULIERS) {
      expect(MESURES.avec[nom]!.issueA!, nom).toBeLessThan(MESURES.sans[nom]!.issueA!);
    }
    expect(minutes(MESURES.avec.naturel!.issueA)).toBeGreaterThan(150);
    expect(minutes(MESURES.avec.naturel!.issueA)).toBeLessThan(160);
  });

  it("ne rend pas le crédit rentable : avec les gages, le réflexe tient plus longtemps, mais tombe encore", () => {
    const sans = MESURES.sans.reflexe!;
    const avec = MESURES.avec.reflexe!;
    expect(avec.issue).toBe("defaut");
    expect(avec.issueA!).toBeGreaterThan(sans.issueA!);
    expect(avec.points).toBeGreaterThan(sans.points);
    expect(avec.points).toBeLessThan(28);
  });

  it("fait attendre un quart d'heure la dernière promesse : le moment du « plus juste »", () => {
    for (const nom of ["parfait", "naturel", "hesitant", "apprend"]) {
      const a = attente(MESURES.sans[nom]!);
      expect(a, nom).toBeGreaterThan(10);
      expect(a, nom).toBeLessThan(20);
    }
  });

  it("fait prendre le terme long au joueur naturel six fois sur dix", () => {
    expect(partLongue(MESURES.sans.naturel!)).toBeGreaterThan(0.5);
    expect(partLongue(MESURES.sans.naturel!)).toBeLessThan(0.7);
  });

  it("laisse le joueur qui regarde ses échéances revenir d'une absence sans défaut, puis solder", () => {
    for (const nom of Object.keys(RYTHMES)) {
      const m = ABSENCES[nom]!;
      if (RYTHMES[nom]!.profil === REFLEXE) {
        // Le livre trop engagé tombe pendant l'absence.
        expect(m.issue, nom).toBe("defaut");
        expect(m.presence, nom).toBeLessThan(m.issueA!);
        continue;
      }
      expect(m.issue, nom).toBe("soldee");
      expect(m.points, nom).toBe(28);
    }
    // Parti juste après sa dernière promesse, il solde pendant l'absence, à l'heure dite.
    const gc = ABSENCES["naturel-grande-crue"]!;
    expect(gc.issueA).toBe(MESURES.sans.naturel!.issueA);
    expect(gc.reports).toBe(0);
  });

  it("fait accomplir les actes de la fiche : les trois au naturel, aucun à qui tombe en défaut", () => {
    for (const variante of ["sans", "avec"] as const) {
      for (const nom of NOMS) {
        const m = MESURES[variante][nom]!;
        const propres = m.actes.filter((a) => a !== SANS_AIDE && a !== SANS_ARTEFACT);
        if (m.issue === "defaut") expect(propres, `${nom}, ${variante}`).toEqual([]);
        expect(m.actes, `${nom}, ${variante}`).toContain(SANS_AIDE);
        expect(m.actes.includes(SANS_ARTEFACT), `${nom}, ${variante}`).toBe(variante === "sans");
      }
    }
    expect(MESURES.sans.naturel!.actes).toEqual([
      ACTES.soldee,
      ACTES.sansUnReport,
      ACTES.auPlusJuste,
      SANS_AIDE,
      SANS_ARTEFACT,
    ]);
    expect(MESURES.sans.naturel!.kappa).toBe(15);
    expect(MESURES.sans.apprend!.actes).not.toContain(ACTES.sansUnReport);
    expect(70 + MESURES.sans.naturel!.kappa).toBe(85);
  });

  it("publie ses mesures dans docs/strates/strate-6-mesures.md (sinon : npm run mesures)", async () => {
    expect(OBJETS).toEqual([...preselection(21, 4), ...preselection(14, 5)]);
    await expect(rapport()).toMatchFileSnapshot("../docs/strates/strate-6-mesures.md");
  });
});

// ——— Le rapport

const fmt = (x: number, decimales = 1) =>
  Number.isFinite(x) ? x.toFixed(decimales).replace(".", ",") : "—";
/** Une durée lisible : « 2 h 52 », « 2 j 2 h 22 ». */
function duree(s: number | null): string {
  if (s === null) return "—";
  const m = Math.round(s / 60);
  const j = Math.floor(m / (24 * 60));
  const h = Math.floor((m % (24 * 60)) / 60);
  const reste = `${h} h ${String(m % 60).padStart(2, "0")}`;
  return j > 0 ? `${j} j ${reste}` : reste;
}
const EXPOSANTS = "⁰¹²³⁴⁵⁶⁷⁸⁹";
/** Un ordre de grandeur : « 6,2 × 10²⁰ ». */
function grandeur(x: number): string {
  if (!(x > 0)) return "0";
  const e = Math.floor(Math.log10(x));
  const exposant = [...String(e)].map((c) => EXPOSANTS[Number(c)]).join("");
  return `${fmt(x / 10 ** e)} × 10${exposant}`;
}

function tableau(entetes: string[], lignes: string[][]): string {
  return [
    `| ${entetes.join(" | ")} |`,
    `|${entetes.map(() => "---").join("|")}|`,
    ...lignes.map((l) => `| ${l.join(" | ")} |`),
  ].join("\n");
}

/** Les actes et les issues, dits en mots. */
const NOMS_ACTES: Record<string, string> = {
  [SANS_AIDE]: "sans aide",
  [SANS_ARTEFACT]: "sans artefact",
  [ACTES.soldee]: "soldée",
  [ACTES.sansUnReport]: "sans un report",
  [ACTES.auPlusJuste]: "au plus juste",
};
const issue = (m: MesuresDette) =>
  m.issue === null ? "—" : m.issue === "soldee" ? "soldée" : `en défaut, tablette ${m.tablette}`;

function resultats(variante: Variante): string {
  return tableau(
    [
      "Joueur",
      "Issue",
      "À",
      "Tablettes 2 à 5",
      "Dernière promesse",
      "Termes à 2, 6, 18",
      "Reports",
      "Plus grande caisse",
      "Points",
      "Actes",
      "κ",
    ],
    NOMS.map((nom) => {
      const m = MESURES[variante][nom]!;
      return [
        nom,
        issue(m),
        duree(m.issueA),
        m.ouvertures.map(duree).join(", "),
        duree(m.grandeCrueFixee),
        `${m.termes[2]}, ${m.termes[6]}, ${m.termes[18]}`,
        String(m.reports),
        grandeur(m.caisseMax),
        String(m.points),
        m.actes.map((a) => NOMS_ACTES[a] ?? a).join(", "),
        `+${m.kappa}`,
      ];
    }),
  );
}

function absences(): string {
  return tableau(
    ["Rythme", "Jeu", "Issue", "À", "Présence", "Reports", "Points"],
    Object.entries(RYTHMES).map(([nom, r]) => {
      const m = ABSENCES[nom]!;
      return [
        nom,
        r.description,
        issue(m),
        duree(m.issueA),
        duree(m.presence),
        String(m.reports),
        String(m.points),
      ];
    }),
  );
}

function rapport(): string {
  const joueurs = tableau(
    ["Joueur", "Jeu"],
    NOMS.map((nom) => [nom, JOUEURS[nom]!.description]),
  );
  const objets = OBJETS.map((id) => artefact(id)?.nomDEnBas ?? id).join(", ");
  const naturel = MESURES.sans.naturel!;
  const plusLent = REGULIERS.reduce((a, b) =>
    MESURES.sans[a]!.issueA! >= MESURES.sans[b]!.issueA! ? a : b,
  );
  const gain = (nom: string) =>
    `${fmt(minutes(MESURES.sans[nom]!.issueA) - minutes(MESURES.avec[nom]!.issueA), 0)} min`;
  const reflexe = { sans: MESURES.sans.reflexe!, avec: MESURES.avec.reflexe! };

  return `# Strate 6 — mesures d'équilibrage

*Fichier généré par \`tests/equilibrage-dette.test.ts\` : ne pas le modifier à la main. Après un changement des règles, \`npm run mesures\` le régénère. Les cibles viennent de la [fiche](strate-6.md) et de l'issue #105.*

Chaque joueur est un joueur automatique (\`sim/joueurs/dette.ts\`), qui joue à l'horloge (\`sim/mesures/dette.ts\`) : il passe à son rythme et fait, à chaque passage, la promesse que sa façon de jouer lui dicte. Ce sont les onze profils de la fiche (§ 4), repris du brouillon de simulation.

## Joueurs

${joueurs}

## Sans artefact

${resultats("sans")}

## Avec les objets d'un jeu correct

La présélection de 21 points dans le réseau, puis celle de 14 dans le chœur : ${objets}. Ils s'éveillent à la première tablette brisée : la confiance × ${fmt(MESURES.avec.naturel!.multiplicateurs.confiance)}, le report × ${fmt(MESURES.avec.naturel!.multiplicateurs.report, 3)}.

${resultats("avec")}

## Avec des absences

Sans objet. Pendant l'absence, le noyau rattrape le temps d'un coup, par la politique propre de la dette : les échéances tombent à leur crue, le rapport compte à 80 %, douze heures au plus, et en entier entre la dernière promesse et la grande crue (fiche, § 10).

${absences()}

- **Issue** : soldée, ou en défaut, et la tablette où la dette s'est arrêtée. **À** : en temps depuis l'arrivée, absences comprises.
- **Tablettes 2 à 5** : l'ouverture de chacune. **Dernière promesse** : celle qui fixe la grande crue, douze crues avant elle.
- **Termes** : les promesses du joueur à 2, 6 et 18 crues, avant la dernière tablette. **Plus grande caisse** : l'ordre de grandeur des montants.
- **Points** : ceux de la fouille, pour ce qui a été honoré. **Actes** : les actes de compréhension accomplis (fiche, § 7), dans l'ordre. « Sans aide » se constate au seuil : ces joueurs n'ouvrent jamais l'aide. « Sans artefact » se constate à la descente, si aucun objet n'agissait. **κ** : ce qu'ils rapportent, au barème du noyau, sur les 15 points de la dette.
- **La durée** : le joueur naturel solde en ${duree(naturel.issueA)}, vers les 3 h visées. Le plus lent de ceux qui regardent leurs échéances, le ${plusLent}, solde en ${duree(MESURES.sans[plusLent]!.issueA)} : I5 tient, à ${fmt((I5 - MESURES.sans[plusLent]!.issueA!) / 60, 0)} minutes de la limite.
- **L'attente de la grande crue** : le joueur naturel ouvre la dernière tablette à ${duree(naturel.ouvertures[3] ?? null)}, fait 23 promesses tout de suite, et la dernière ${fmt(attente(naturel)!, 0)} minutes plus tard. C'est le moment où se joue « au plus juste ».
- **Le terme long** : le joueur naturel le prend ${fmt(100 * partLongue(naturel), 0)} fois sur cent. Le majorer de 80 % au lieu de 60 % ne change pas ce choix, mais rallonge la strate d'une vingtaine de minutes : le distrait dépasserait alors 3 h 15.
- **Ce que les objets font gagner** : ${gain("naturel")} au naturel, ${gain("hesitant")} à l'hésitant, ${gain("distrait")} au distrait.
- **Les gages ne rendent pas le crédit rentable** : avec eux, le réflexe tient jusqu'à ${duree(reflexe.avec.issueA)} au lieu de ${duree(reflexe.sans.issueA)}, et emporte ${reflexe.avec.points} points au lieu de ${reflexe.sans.points}, mais il tombe encore en défaut. Plus de confiance lui donne plus de corde, et le report adouci la lui rend plus longue : il tombe plus tard, pas plus tôt.
`;
}

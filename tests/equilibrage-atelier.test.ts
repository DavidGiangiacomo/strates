// L'équilibrage de l'atelier (#96) : des parties complètes, jouées par des joueurs automatiques de
// profils différents, sans artefact puis avec les objets d'un jeu correct, doivent tomber dans les
// cibles de la fiche (docs/strates/strate-3.md) et de l'issue. Les mesures sont publiées dans
// docs/strates/strate-3-mesures.md, tenu à jour par ce test.
// Pour le régénérer après un changement de règles : npm run mesures
import { describe, expect, it } from "vitest";
import {
  APPREND,
  DESORDONNE,
  DISTRAIT,
  NATUREL,
  PARFAIT,
  PRUDENT,
  REFLEXE,
  type ProfilAtelier,
} from "../sim/joueurs/atelier";
import { mesurerAtelier, TRANCHE, type MesuresAtelier } from "../sim/mesures/atelier";
import { artefact, preselection } from "../src/noyau/logique/artefacts";
import { BAREME, poidsActe, SANS_AIDE, SANS_ARTEFACT } from "../src/noyau/logique/comprehension";
import { ACTES } from "../src/strates/s3-atelier/logique/regles";

const PROFILS: Record<string, ProfilAtelier> = {
  parfait: PARFAIT,
  naturel: NATUREL,
  apprend: APPREND,
  distrait: DISTRAIT,
  prudent: PRUDENT,
  desordonne: DESORDONNE,
  reflexe: REFLEXE,
};
/** Les joueurs réguliers revoient leur plan ; le désordonné ne le revoit jamais. */
const REGULIERS = ["parfait", "naturel", "apprend", "distrait", "prudent"];
/** Ceux qui atteignent le seuil : tous, sauf le réflexe. */
const FINISSENT = [...REGULIERS, "desordonne"];

/** Les objets d'un jeu correct : la présélection de 12 points à la surface, puis celle de 9 dans les caves. */
const OBJETS = [...preselection(12, 1), ...preselection(9, 2)];

/** Une partie s'arrête à 5 h ; après le seuil, on continue un quart d'heure, puis 1 h 45. */
const LIMITE = 5 * 3600;
const APRES = [900, 6300];

type Variante = "sans" | "avec";
const MESURES: Record<Variante, Record<string, MesuresAtelier>> = { sans: {}, avec: {} };
for (const variante of ["sans", "avec"] as const) {
  for (const [nom, profil] of Object.entries(PROFILS)) {
    MESURES[variante][nom] = await mesurerAtelier(profil, {
      limite: LIMITE,
      apresSeuil: APRES,
      artefacts: variante === "avec" ? OBJETS : [],
    });
  }
}

const minutes = (s: number | null | undefined) => (s == null ? Infinity : s / 60);
const plusLongueAttente = (m: MesuresAtelier) =>
  m.attentes.reduce((max, a) => (a.duree > max.duree ? a : max), { debut: 0, duree: 0 });
/** La dernière ajustée : du dernier achat au seuil. */
const derniereAjustee = (m: MesuresAtelier) => minutes(m.seuil) - minutes(m.toutAchete);
const achats = (m: MesuresAtelier) => m.achatsParTranche.reduce((a, n) => a + n, 0);
/** Les achats des tranches de 10 minutes entières, de 60 minutes jusqu'au seuil. */
const tranchesApresLaPremiereHeure = (m: MesuresAtelier) =>
  m.achatsParTranche.slice(3600 / TRANCHE, Math.floor((m.seuil ?? 0) / TRANCHE));
const chaque = (
  noms: readonly string[],
  f: (m: MesuresAtelier, variante: Variante, nom: string) => void,
) => {
  for (const variante of ["sans", "avec"] as const) {
    for (const nom of noms) f(MESURES[variante][nom]!, variante, nom);
  }
};

describe("l'équilibrage de l'atelier", () => {
  it("fait atteindre le seuil aux joueurs réguliers vers 2 h 30, de 2 h à 3 h 15, avec ou sans objets", () => {
    chaque(REGULIERS, (m) => {
      expect(minutes(m.seuil)).toBeGreaterThan(120);
      expect(minutes(m.seuil)).toBeLessThan(195);
    });
    // En moyenne, à un quart d'heure près, sans les objets comme avec.
    for (const variante of ["sans", "avec"] as const) {
      const moyenne =
        REGULIERS.reduce((a, nom) => a + minutes(MESURES[variante][nom]!.seuil), 0) /
        REGULIERS.length;
      expect(Math.abs(moyenne - 150)).toBeLessThan(15);
    }
  });

  it("tient sous 3 h 15 sans aucun artefact (I5)", () => {
    for (const nom of REGULIERS) expect(minutes(MESURES.sans[nom]!.seuil)).toBeLessThan(195);
  });

  it("laisse finir le joueur qui ne revoit jamais son plan, plus tard que le naturel (§ 13, question 6)", () => {
    for (const variante of ["sans", "avec"] as const) {
      const { desordonne, naturel } = MESURES[variante];
      expect(desordonne!.seuil).not.toBeNull();
      expect(desordonne!.seuil!).toBeGreaterThan(naturel!.seuil!);
    }
  });

  it("ne fait pas finir l'accumulation seule : le joueur réflexe n'atteint jamais le seuil (I4)", () => {
    for (const variante of ["sans", "avec"] as const) {
      const m = MESURES[variante].reflexe!;
      expect(m.seuil).toBeNull();
      expect(m.tournent).toBeLessThan(m.posees / 2);
    }
  });

  it("donne 16 points à qui finit, pour 2 à 8 × 10¹¹ pièces, avec ou sans objets", () => {
    chaque(FINISSENT, (m) => {
      expect(m.points.auSeuil).toBe(16);
      expect(m.cumul).toBeGreaterThan(2e11);
      expect(m.cumul).toBeLessThan(8e11);
    });
  });

  it("rend le séjour peu rentable : +1 point en un quart d'heure au plus, +2 en 1 h 45 au plus", () => {
    chaque(FINISSENT, (m) => {
      expect(m.points.apres[900]! - m.points.auSeuil).toBeLessThanOrEqual(1);
      expect(m.points.apres[6300]! - m.points.auSeuil).toBeLessThanOrEqual(2);
    });
  });

  it("garde la dernière ajustée courte : moins de 80 gestes, en 5 minutes au plus", () => {
    chaque(REGULIERS, (m) => {
      expect(m.releve.gestesFin).toBeLessThan(80);
      expect(derniereAjustee(m)).toBeLessThanOrEqual(5);
    });
  });

  it("fait acheter jusqu'au bout : après la première heure, une pièce au moins par tranche de 10 minutes, 4 en moyenne", () => {
    chaque(REGULIERS, (m) => {
      const tranches = tranchesApresLaPremiereHeure(m);
      expect(tranches.length).toBeGreaterThanOrEqual(6);
      expect(Math.min(...tranches)).toBeGreaterThanOrEqual(1);
      expect(tranches.reduce((a, n) => a + n, 0) / tranches.length).toBeGreaterThanOrEqual(4);
    });
  });

  it("n'impose pas plus de 12 minutes sans achat aux joueurs réguliers", () => {
    chaque(REGULIERS, (m) => expect(plusLongueAttente(m).duree).toBeLessThanOrEqual(12 * 60));
  });

  it("ne touche pas au plafond × 4 avec les objets d'un jeu correct (I2)", () => {
    chaque(FINISSENT, (m) => expect(m.plafonne).toBe(false));
  });

  it("donne à qui finit « sans aide » et la gêne défaite, « sans artefact » sans les objets, jamais le premier plan plein", () => {
    const tous = Object.values(BAREME[3]).reduce((a, n) => a + n, 0);
    const poids = (acte: string) => poidsActe(BAREME, 3, acte) ?? 0;
    chaque(FINISSENT, (m, variante) => {
      expect(m.actes).toEqual(expect.arrayContaining([SANS_AIDE, ACTES.geneDefaite]));
      expect(m.actes.includes(SANS_ARTEFACT)).toBe(variante === "sans");
      expect(m.actes).not.toContain(ACTES.premierPlanPlein);
      const manques =
        poids(ACTES.premierPlanPlein) + (variante === "avec" ? poids(SANS_ARTEFACT) : 0);
      expect(m.kappa).toBe(tous - manques);
    });
  });

  it("publie ses mesures dans docs/strates/strate-3-mesures.md (sinon : npm run mesures)", async () => {
    await expect(rapport()).toMatchFileSnapshot("../docs/strates/strate-3-mesures.md");
  });
});

// ——— Le rapport

const fmt = (x: number) => (Number.isFinite(x) ? x.toFixed(1).replace(".", ",") : "—");
const enMinutes = (s: number | null | undefined) => (s == null ? "—" : `${fmt(s / 60)} min`);
const noms = Object.keys(PROFILS);

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
      "Profil",
      "Seuil",
      "Plan de 8",
      "de 10",
      "de 12",
      "Tout acheté",
      "Cumul",
      "Production au seuil",
      "Points",
      "+15 min",
      "+1 h 45",
      "Achats",
      "Plus longue attente",
    ],
    noms.map((nom) => {
      const m = MESURES[variante][nom]!;
      const attente = plusLongueAttente(m);
      return [
        nom,
        enMinutes(m.seuil),
        enMinutes(m.agrandissements[8]),
        enMinutes(m.agrandissements[10]),
        enMinutes(m.agrandissements[12]),
        enMinutes(m.toutAchete),
        m.cumul.toExponential(2).replace(".", ","),
        `${m.production.toExponential(2).replace(".", ",")} par s`,
        String(m.points.auSeuil),
        String(m.points.apres[900] ?? "—"),
        String(m.points.apres[6300] ?? "—"),
        String(achats(m)),
        `${fmt(attente.duree / 60)} min, à ${fmt(attente.debut / 60)} min`,
      ];
    }),
  );
}

function fin(): string {
  return tableau(
    ["Profil", "Durée", "Gestes", "Coups de lime", "Échanges"],
    (["sans", "avec"] as const).flatMap((variante) =>
      FINISSENT.map((nom) => {
        const m = MESURES[variante][nom]!;
        return [
          `${nom}, ${variante === "sans" ? "sans objets" : "avec objets"}`,
          `${fmt(derniereAjustee(m))} min`,
          String(m.releve.gestesFin),
          String(m.releve.limages),
          String(m.releve.echanges),
        ];
      }),
    ),
  );
}

function rythme(): string {
  return tableau(
    ["Profil", "Sans objets", "Avec objets"],
    FINISSENT.map((nom) => [
      nom,
      MESURES.sans[nom]!.achatsParTranche.join(" "),
      MESURES.avec[nom]!.achatsParTranche.join(" "),
    ]),
  );
}

function comprehension(): string {
  const kappa = (m: MesuresAtelier) => (m.seuil === null ? "—" : `${m.kappa} sur 16`);
  return tableau(
    ["Profil", "κ sans objets", "κ avec objets", "Actes, sans objets"],
    noms.map((nom) => {
      const sans = MESURES.sans[nom]!;
      return [
        nom,
        kappa(sans),
        kappa(MESURES.avec[nom]!),
        sans.seuil === null ? "—" : sans.actes.join(", "),
      ];
    }),
  );
}

function rapport(): string {
  const profils = tableau(
    ["Profil", "Jeu"],
    noms.map((nom) => [nom, PROFILS[nom]!.description]),
  );
  const objets = OBJETS.map((id) => artefact(id)?.nomDEnBas ?? id).join(", ");
  const reflexe = (variante: Variante) => {
    const m = MESURES[variante].reflexe!;
    return `${achats(m)} achats, ${m.posees} pièces posées dont ${m.tournent} qui tournent, ${m.cumul.toExponential(1).replace(".", ",")} pièces produites`;
  };

  return `# Strate 3 — mesures d'équilibrage

*Fichier généré par \`tests/equilibrage-atelier.test.ts\` : ne pas le modifier à la main. Après un changement des règles, \`npm run mesures\` le régénère. Les cibles viennent de la [fiche](strate-3.md) et de l'issue #96 ; l'analyse est dans la section « Équilibrage » de la fiche.*

Chaque profil est un joueur automatique (\`sim/joueurs/atelier.ts\`). Le joueur réflexe pose la pièce la moins chère sur la première case libre, telle quelle. Les autres posent chaque pièce là où la production monte le plus, en gardant des dents libres. Ils rouvrent leur rouage quand il se ferme et font de la place aux grandes pièces. Tous, sauf le désordonné, revoient leur plan de temps en temps. À la fin, tout acheté, ils relient ce qui ne tourne pas, liment ce qui frotte et règlent le reste par des échanges. Les parties vont jusqu'au seuil, 5 h au plus.

## Profils

${profils}

## Sans artefact

${resultats("sans")}

## Avec les objets d'un jeu correct

La présélection de 12 points à la surface, puis celle de 9 dans les caves : ${objets}.

${resultats("avec")}

- **Plan de 8**, **de 10**, **de 12** : quand le plan prend cette taille ; **Tout acheté** : le dernier achat de la nomenclature.
- **Production au seuil** : des pièces entraînées, par seconde (à la limite pour le réflexe).
- **Points** : points de fouille au seuil ; **+15 min** et **+1 h 45** : en continuant de jouer.
- **Plus longue attente** : le plus long intervalle entre deux achats avant le seuil.
- **Le joueur réflexe**, arrêté à 5 h : sans artefact, ${reflexe("sans")} ; avec les objets, ${reflexe("avec")}.

## La dernière ajustée

Du dernier achat au seuil : tout poser, tout relier, ne plus rien laisser frotter. Un geste prend 3 secondes (2 pour le joueur parfait), un quart de tour une seconde.

${fin()}

## Achats par tranche de 10 minutes

Jusqu'au seuil. La dernière tranche est celle que le seuil interrompt.

${rythme()}

## Compréhension

Les actes de compréhension au seuil, et le κ qu'ils rapporteraient à la descente, sur les 16 points de l'atelier ([\`comprehension.md\`](../comprehension.md), § 2). Les joueurs automatiques n'ouvrent jamais l'aide : ils gagnent toujours « sans aide ». Avec les objets, l'acte « sans artefact » est perdu. Ils agrandissent le plan dès qu'ils le peuvent, et ne remplissent donc jamais le premier. Le joueur réflexe n'atteint pas le seuil.

${comprehension()}
`;
}

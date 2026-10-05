// L'équilibrage des caves (#36, puis #163 pour les rations) : des parties complètes, jouées par des
// joueurs automatiques de profils différents, avec et sans les objets de la surface, doivent tomber dans
// les cibles de la fiche (docs/strates/strate-2.md) et des issues. Les mesures sont publiées dans
// docs/strates/strate-2-mesures.md, tenu à jour par ce test.
// Pour le régénérer après un changement de règles : npm run mesures
import { describe, expect, it } from "vitest";
import {
  APPREND,
  CORRECT,
  DISTRAIT,
  PRUDENT,
  REFLEXE,
  type ProfilCaves,
} from "../sim/joueurs/caves";
import { mesurerCaves, TRANCHE, type MesuresCaves } from "../sim/mesures/caves";
import { artefact, preselection } from "../src/noyau/logique/artefacts";

const PROFILS: Record<string, ProfilCaves> = {
  reflexe: REFLEXE,
  apprend: APPREND,
  correct: CORRECT,
  prudent: PRUDENT,
  distrait: DISTRAIT,
};
const REGULIERS = ["apprend", "correct", "prudent", "distrait"];

/** Les objets qu'emporte de la surface un jeu correct : la présélection pour 12 points. */
const OBJETS = preselection(12, 1);

type Variante = "sans" | "avec";
const MESURES: Record<Variante, Record<string, MesuresCaves>> = { sans: {}, avec: {} };
for (const variante of ["sans", "avec"] as const) {
  for (const [nom, profil] of Object.entries(PROFILS)) {
    MESURES[variante][nom] = await mesurerCaves(profil, {
      // Le joueur réflexe n'atteint jamais le seuil : 20 minutes suffisent à le voir échouer.
      limite: nom === "reflexe" ? 20 * 60 : 4 * 3600,
      apresSeuil: [600, 3600],
      artefacts: variante === "avec" ? OBJETS : [],
    });
  }
}

const minutes = (s: number | null | undefined) => (s == null ? Infinity : s / 60);
const plusLongueAttente = (m: MesuresCaves) =>
  m.attentes.reduce((max, a) => (a.duree > max.duree ? a : max), { debut: 0, duree: 0 });
/**
 * Les décisions de la seconde moitié (#163) : celles des tranches de 10 minutes entières, de 60 minutes
 * jusqu'au seuil.
 */
const SECONDE_MOITIE = 60 * 60;
const decisionsSecondeMoitie = (m: MesuresCaves) =>
  m.decisions.slice(SECONDE_MOITIE / TRANCHE, Math.floor((m.seuil ?? 0) / TRANCHE));
const chaque = (f: (m: MesuresCaves, variante: Variante, nom: string) => void) => {
  for (const variante of ["sans", "avec"] as const) {
    for (const nom of REGULIERS) f(MESURES[variante][nom]!, variante, nom);
  }
};

describe("l'équilibrage des caves", () => {
  it("fait atteindre le seuil aux joueurs réguliers en 1 h 51, avec ou sans objets de la surface", () => {
    chaque((m) => {
      expect(minutes(m.seuil)).toBeGreaterThan(105);
      expect(minutes(m.seuil)).toBeLessThan(125);
    });
  });

  it("tient sous 3 h 15 sans aucun artefact (I5)", () => {
    for (const nom of REGULIERS) expect(minutes(MESURES.sans[nom]!.seuil)).toBeLessThan(195);
  });

  it("donne 8 ou 9 points sans objets selon le jeu, 9 avec, pour 10⁶ à 10⁷ boisseaux", () => {
    chaque((m, variante, nom) => {
      if (variante === "sans") expect([8, 9]).toContain(m.points.auSeuil);
      else expect(m.points.auSeuil).toBe(9);
      // Les objets de la surface ne retirent jamais de point.
      expect(m.points.auSeuil).toBeLessThanOrEqual(MESURES.avec[nom]!.points.auSeuil);
      expect(m.cumul).toBeGreaterThan(5e5);
      expect(m.cumul).toBeLessThan(2e7);
    });
  });

  it("demande des décisions jusqu'au seuil : 3 au moins par tranche de 10 minutes, 5 en moyenne, après 60 minutes", () => {
    chaque((m) => {
      const tranches = decisionsSecondeMoitie(m);
      expect(tranches.length).toBeGreaterThanOrEqual(4);
      expect(Math.min(...tranches)).toBeGreaterThanOrEqual(3);
      expect(tranches.reduce((a, n) => a + n, 0) / tranches.length).toBeGreaterThanOrEqual(5);
    });
  });

  it("fait manquer le premier hiver à qui joue comme à la surface, avant 5 minutes, même avec les objets", () => {
    for (const variante of ["sans", "avec"] as const) {
      for (const nom of ["reflexe", "apprend"]) {
        const m = MESURES[variante][nom]!;
        expect(m.premierHiverManque).toBe(true);
        expect(minutes(m.premiereRupture)).toBeLessThan(5);
      }
      expect(MESURES[variante].reflexe!.seuil).toBeNull();
    }
  });

  it("ne fait manquer aucun grand hiver aux joueurs réguliers", () => {
    chaque((m) => expect(m.hivers.grandsManques).toBe(0));
  });

  it("n'impose jamais plus de 8 minutes sans achat, grands hivers compris", () => {
    chaque((m) => expect(plusLongueAttente(m).duree).toBeLessThanOrEqual(8 * 60));
  });

  it("rend le farm peu rentable : +1 point en 10 minutes au plus, +2 en une heure au plus", () => {
    chaque((m) => {
      expect(m.points.apres[600]! - m.points.auSeuil).toBeLessThanOrEqual(1);
      expect(m.points.apres[3600]! - m.points.auSeuil).toBeLessThanOrEqual(2);
    });
  });

  it("ne touche pas au plafond × 4 avec les objets d'un jeu correct (I2)", () => {
    chaque((m) => expect(m.plafonne).toBe(false));
  });

  it("publie ses mesures dans docs/strates/strate-2-mesures.md (sinon : npm run mesures)", async () => {
    await expect(rapport()).toMatchFileSnapshot("../docs/strates/strate-2-mesures.md");
  });
});

// ——— Le rapport

const fmt = (x: number) => (Number.isFinite(x) ? x.toFixed(1).replace(".", ",") : "—");
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
      "Cumul",
      "Points",
      "+10 min",
      "+1 h",
      "Première rupture",
      "Hivers manqués",
      "Achats",
      "Plus longue attente",
      "Familles",
    ],
    noms.map((nom) => {
      const m = MESURES[variante][nom]!;
      const attente = plusLongueAttente(m);
      return [
        nom,
        m.seuil === null ? "—" : `${fmt(minutes(m.seuil))} min`,
        m.cumul.toExponential(2).replace(".", ","),
        String(m.points.auSeuil),
        String(m.points.apres[600] ?? "—"),
        String(m.points.apres[3600] ?? "—"),
        m.premiereRupture === null ? "—" : `${fmt(minutes(m.premiereRupture))} min`,
        `${m.hivers.manques} sur ${m.hivers.juges}`,
        String(m.achats),
        `${fmt(attente.duree / 60)} min, à ${fmt(attente.debut / 60)} min`,
        String(Math.round(m.familles)),
      ];
    }),
  );
}

function decisions(): string {
  const n = Math.max(
    ...REGULIERS.flatMap((nom) =>
      [MESURES.sans, MESURES.avec].map((v) => v[nom]!.decisions.length),
    ),
  );
  const tranches = Array.from(
    { length: n },
    (_, i) => `${(i * TRANCHE) / 60}–${((i + 1) * TRANCHE) / 60}`,
  );
  return tableau(
    ["Profil", ...tranches],
    (["sans", "avec"] as const).flatMap((variante) =>
      REGULIERS.map((nom) => [
        `${nom}, ${variante === "sans" ? "sans objets" : "avec objets"}`,
        ...tranches.map((_, i) => String(MESURES[variante][nom]!.decisions[i] ?? "")),
      ]),
    ),
  );
}

function rapport(): string {
  const profils = tableau(
    ["Profil", "Jeu"],
    noms.map((nom) => [nom, PROFILS[nom]!.description]),
  );
  const objets = OBJETS.map((id) => artefact(id)?.nomDEnBas ?? id).join(", ");

  return `# Strate 2 — mesures d'équilibrage

*Fichier généré par \`tests/equilibrage-caves.test.ts\` : ne pas le modifier à la main. Après un changement des règles, \`npm run mesures\` le régénère. Les cibles viennent de la [fiche](strate-2.md) et des issues #36 et #163 ; l'analyse est dans la section « Équilibrage » de la fiche.*

Chaque profil est un joueur automatique (\`sim/joueurs/caves.ts\`). Le joueur réflexe achète dès qu'il peut ce qui se rembourse le plus vite, comme à la surface. Les autres prévoient : ils ne dépensent que ce qui laisse, au plus bas d'ici la fin de la prochaine soudure, une marge de quelques jours de consommation. Dès que les rations se comptent, ils prennent les plus larges qui tiennent cette marge, et les resserrent à temps. Les parties vont jusqu'au seuil, trois grands hivers de suite sans rupture ; le joueur réflexe est arrêté à 20 minutes.

## Profils

${profils}

## Sans objets de la surface

${resultats("sans")}

## Avec les objets d'un jeu correct

La présélection pour 12 points : ${objets}. Leurs multiplicateurs ne s'éveillent qu'au bilan du premier hiver.

${resultats("avec")}

- **Points** : points de fouille au seuil ; **+10 min** et **+1 h** : en continuant de jouer.
- **Hivers manqués** : sur les hivers jugés avant le seuil, soudure comprise.
- **Plus longue attente** : le plus long intervalle entre deux achats avant le seuil.

## Décisions par tranche de 10 minutes

Les secondes où le joueur achète ou change les rations, jusqu'au seuil (#163). La dernière tranche est celle que le seuil interrompt.

${decisions()}
`;
}

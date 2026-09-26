// L'équilibrage de la surface (#35) : plusieurs parties complètes, jouées par des joueurs automatiques
// de profils différents, doivent tomber dans les cibles de la fiche (docs/strates/strate-1.md).
// Les mesures sont aussi publiées dans docs/strates/strate-1-mesures.md, tenu à jour par ce test.
// Pour le régénérer après un changement de règles : npm run mesures
import { describe, expect, it } from "vitest";
import {
  ACTIF,
  CORRECT,
  DISTRAIT,
  OCCASIONNEL,
  PARFAIT,
  type Profil,
} from "../sim/joueurs/surface";
import { mesurerSurface, type MesuresSurface } from "../sim/mesures/surface";
import { GENERATEURS, OBJECTIFS } from "../src/strates/s1-surface/logique/regles";
import { textes } from "../src/strates/s1-surface/textes.fr";

const PROFILS: Record<string, Profil> = {
  parfait: PARFAIT,
  actif: ACTIF,
  correct: CORRECT,
  distrait: DISTRAIT,
  occasionnel: OCCASIONNEL,
};

const MESURES: Record<string, MesuresSurface> = {};
for (const [nom, profil] of Object.entries(PROFILS)) {
  MESURES[nom] = await mesurerSurface(profil, { limite: 4 * 3600, apresSeuil: [600, 3600] });
}

const minutes = (s: number | null | undefined) => (s == null ? Infinity : s / 60);
const plusLongueAttente = (m: MesuresSurface) =>
  m.attentes.reduce((max, a) => (a.duree > max.duree ? a : max), { debut: 0, duree: 0 });

describe("l'équilibrage de la surface", () => {
  it("fait atteindre le seuil à tous les profils, avec 12 points de fouille", () => {
    for (const m of Object.values(MESURES)) {
      expect(m.seuil).not.toBeNull();
      expect(m.points.auSeuil).toBe(12);
    }
  });

  it("tient 1 h 15 environ pour les joueurs réguliers, et moins de 2 h pour un joueur occasionnel", () => {
    for (const nom of ["parfait", "actif", "correct", "distrait"]) {
      expect(minutes(MESURES[nom]!.seuil)).toBeGreaterThan(60);
      expect(minutes(MESURES[nom]!.seuil)).toBeLessThan(85);
    }
    expect(minutes(MESURES.correct!.seuil)).toBeGreaterThan(65);
    expect(minutes(MESURES.correct!.seuil)).toBeLessThan(80);
    expect(minutes(MESURES.occasionnel!.seuil)).toBeLessThan(120);
  });

  it("fait passer du clic à l'automatisation entre 5 et 15 minutes", () => {
    for (const nom of ["parfait", "actif", "correct"]) {
      expect(MESURES[nom]!.partClic.a5).toBeGreaterThan(0.3);
      expect(MESURES[nom]!.partClic.a5).toBeLessThan(0.7);
    }
    for (const m of Object.values(MESURES)) expect(m.partClic.a15).toBeLessThan(0.15);
  });

  it("n'impose jamais plus de 6 minutes d'attente à un joueur attentif", () => {
    for (const nom of ["parfait", "actif"]) {
      expect(plusLongueAttente(MESURES[nom]!).duree).toBeLessThanOrEqual(6 * 60);
    }
  });

  it("rend le farm peu rentable : +1 point en 10 minutes au plus, +2 en une heure au plus", () => {
    for (const m of Object.values(MESURES)) {
      expect(m.points.apres[600]! - m.points.auSeuil).toBeLessThanOrEqual(1);
      expect(m.points.apres[3600]! - m.points.auSeuil).toBeLessThanOrEqual(2);
      expect(m.points.apresUneNuit - m.points.auSeuil).toBeLessThanOrEqual(3);
    }
  });

  it("publie ses mesures dans docs/strates/strate-1-mesures.md (sinon : npm run mesures)", async () => {
    await expect(rapport()).toMatchFileSnapshot("../docs/strates/strate-1-mesures.md");
  });
});

// ——— Le rapport

const fmt = (x: number) => (Number.isFinite(x) ? x.toFixed(1).replace(".", ",") : "—");
const pct = (x: number) => `${Math.round(x * 100)} %`;
const noms = Object.keys(PROFILS);

function tableau(entetes: string[], lignes: string[][]): string {
  return [
    `| ${entetes.join(" | ")} |`,
    `|${entetes.map(() => "---").join("|")}|`,
    ...lignes.map((l) => `| ${l.join(" | ")} |`),
  ].join("\n");
}

function rapport(): string {
  const resultats = tableau(
    [
      "Profil",
      "Seuil",
      "Points",
      "+10 min",
      "+1 h",
      "Une nuit",
      "Achats",
      "Clic à 5 min",
      "Clic à 15 min",
      "Plus longue attente",
    ],
    noms.map((nom) => {
      const m = MESURES[nom]!;
      const attente = plusLongueAttente(m);
      return [
        nom,
        `${fmt(minutes(m.seuil))} min`,
        String(m.points.auSeuil),
        String(m.points.apres[600]),
        String(m.points.apres[3600]),
        String(m.points.apresUneNuit),
        String(m.achats),
        pct(m.partClic.a5),
        pct(m.partClic.a15),
        `${fmt(attente.duree / 60)} min, à ${fmt(attente.debut / 60)} min`,
      ];
    }),
  );
  const objectifs = tableau(
    ["Objectif", ...noms],
    OBJECTIFS.map((_, i) => [
      textes[`objectif.${i + 1}`] ?? `objectif ${i + 1}`,
      ...noms.map((nom) => fmt(minutes(MESURES[nom]!.objectifs[i]))),
    ]),
  );
  const generateurs = tableau(
    ["Générateur", ...noms],
    GENERATEURS.map((g) => [
      textes[`generateur.${g.id}`] ?? g.id,
      ...noms.map((nom) => fmt(minutes(MESURES[nom]!.premiersAchats[g.id]))),
    ]),
  );
  const profils = tableau(
    ["Profil", "Jeu"],
    noms.map((nom) => [nom, PROFILS[nom]!.description]),
  );

  return `# Strate 1 — mesures d'équilibrage

*Fichier généré par \`tests/equilibrage-surface.test.ts\` : ne pas le modifier à la main. Après un changement des règles, \`npm run mesures\` le régénère. Les cibles viennent de la [fiche](strate-1.md) ; l'analyse est dans sa section « Équilibrage ».*

Chaque profil est un joueur automatique (\`sim/joueurs/surface.ts\`) qui achète toujours ce qui se rembourse le plus vite. Les parties vont jusqu'au seuil de fouille, 1 M cr/s.

## Profils

${profils}

## Résultats

${resultats}

- **Points** : points de fouille au seuil ; **+10 min** et **+1 h** : en continuant de jouer ; **une nuit** : après 12 h d'absence au seuil, comptées à 80 %.
- **Clic** : part du cumul due aux clics.
- **Plus longue attente** : le plus long intervalle entre deux achats avant le seuil.

## Objectifs (minutes de jeu)

${objectifs}

## Premier achat de chaque générateur (minutes de jeu)

${generateurs}
`;
}

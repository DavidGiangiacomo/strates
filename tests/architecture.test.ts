import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// Vérifie que la configuration ESLint impose les règles d'architecture de D-004 :
// la logique n'importe ni Svelte, ni vue, ni interface, ni plateforme,
// et n'utilise ni le navigateur, ni l'horloge, ni Math.random.

const eslint = new ESLint();

async function reglesEnfreintes(code: string, chemin: string): Promise<(string | null)[]> {
  const [resultat] = await eslint.lintText(code, { filePath: chemin });
  return resultat?.messages.map((message) => message.ruleId) ?? [];
}

const LOGIQUE = "src/strates/s0-exemple/logique/regles.ts";
const LOGIQUE_NOYAU = "src/noyau/logique/etat.ts";
const VUE = "src/strates/s0-exemple/vue/outils.ts";
const SIM = "sim/strategie.ts";

describe("la logique d'une strate", () => {
  it("n'importe pas Svelte", async () => {
    const code = 'import { mount } from "svelte";\nexport const m = mount;\n';
    expect(await reglesEnfreintes(code, LOGIQUE)).toContain("no-restricted-imports");
  });

  it("n'importe pas de composant Svelte", async () => {
    const code = 'import Vue from "./Vue.svelte";\nexport const v = Vue;\n';
    expect(await reglesEnfreintes(code, LOGIQUE)).toContain("no-restricted-imports");
  });

  it("n'importe ni vue, ni interface, ni plateforme", async () => {
    for (const chemin of [
      "../vue/outils",
      "../../../noyau/ui/bandeau",
      "../../../noyau/plateforme",
    ]) {
      const code = `import { x } from "${chemin}";\nexport const y = x;\n`;
      expect(await reglesEnfreintes(code, LOGIQUE)).toContain("no-restricted-imports");
    }
  });

  it("n'utilise pas le navigateur", async () => {
    const code = "export const titre = () => document.title;\n";
    expect(await reglesEnfreintes(code, LOGIQUE)).toContain("no-restricted-globals");
  });

  it("n'utilise ni Math.random ni Date.now", async () => {
    const code = "export const a = () => Math.random();\nexport const t = () => Date.now();\n";
    const regles = await reglesEnfreintes(code, LOGIQUE);
    expect(regles.filter((r) => r === "no-restricted-properties")).toHaveLength(2);
  });

  it("ne lit pas l'horloge avec new Date()", async () => {
    const code = "export const t = () => new Date();\n";
    expect(await reglesEnfreintes(code, LOGIQUE)).toContain("no-restricted-syntax");
  });

  it("peut importer la logique du noyau", async () => {
    const code = 'import { x } from "../../../noyau/logique/alea";\nexport const y = x;\n';
    expect(await reglesEnfreintes(code, LOGIQUE)).not.toContain("no-restricted-imports");
  });
});

describe("la logique du noyau", () => {
  it("suit les mêmes règles", async () => {
    const code =
      'import { x } from "../plateforme/stockage";\nexport const y = () => x ?? Date.now();\n';
    const regles = await reglesEnfreintes(code, LOGIQUE_NOYAU);
    expect(regles).toContain("no-restricted-imports");
    expect(regles).toContain("no-restricted-properties");
  });
});

describe("hors de la logique", () => {
  it("une vue peut importer Svelte et utiliser le navigateur", async () => {
    const code =
      'import { mount } from "svelte";\nexport const m = mount;\nexport const t = () => document.title;\n';
    const regles = await reglesEnfreintes(code, VUE);
    expect(regles).not.toContain("no-restricted-imports");
    expect(regles).not.toContain("no-restricted-globals");
  });
});

describe("le simulateur", () => {
  it("n'importe pas de vue", async () => {
    const code = 'import { x } from "../src/strates/s1-surface/vue/outils";\nexport const y = x;\n';
    expect(await reglesEnfreintes(code, SIM)).toContain("no-restricted-imports");
  });
});

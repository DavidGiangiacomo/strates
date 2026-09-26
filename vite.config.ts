import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

/** Le commit du build, affiché dans le jeu pour relier chaque retour de playtest à une version (#19). */
function identifiantBuild(): string {
  let commit = process.env.GITHUB_SHA ?? "";
  if (!commit) {
    try {
      commit = execSync("git rev-parse HEAD", { encoding: "utf8", stdio: "pipe" }).trim();
    } catch {
      // Hors d'un dépôt git : pas d'identifiant.
    }
  }
  return commit ? commit.slice(0, 7) : "dev";
}

export default defineConfig({
  // Chemins relatifs : le même build fonctionne à la racine d'un site comme sous /strates/ (GitHub Pages).
  base: "./",
  plugins: [svelte()],
  define: {
    __VERSION_JEU__: JSON.stringify(version),
    __BUILD__: JSON.stringify(identifiantBuild()),
  },
  // Les tests des runes ($state, $effect) ont besoin de la version navigateur de Svelte.
  resolve: process.env.VITEST ? { conditions: ["browser"] } : undefined,
  test: {
    include: ["src/**/*.test.ts", "sim/**/*.test.ts", "tests/**/*.test.ts"],
    // Par défaut, la logique se teste sous Node. Les tests des runes Svelte déclarent
    // l'environnement happy-dom en tête de fichier, pour être compilés comme côté navigateur.
    environment: "node",
  },
});

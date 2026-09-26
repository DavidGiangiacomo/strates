import { readFileSync } from "node:fs";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

export default defineConfig({
  plugins: [svelte()],
  define: { __VERSION_JEU__: JSON.stringify(version) },
  // Les tests des runes ($state, $effect) ont besoin de la version navigateur de Svelte.
  resolve: process.env.VITEST ? { conditions: ["browser"] } : undefined,
  test: {
    include: ["src/**/*.test.ts", "sim/**/*.test.ts", "tests/**/*.test.ts"],
    // Par défaut, la logique se teste sous Node. Les tests des runes Svelte déclarent
    // l'environnement happy-dom en tête de fichier, pour être compilés comme côté navigateur.
    environment: "node",
  },
});

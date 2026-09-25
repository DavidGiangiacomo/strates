import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte()],
  // Les tests des runes ($state, $effect) ont besoin de la version navigateur de Svelte.
  resolve: process.env.VITEST ? { conditions: ["browser"] } : undefined,
  test: {
    include: ["src/**/*.test.ts", "sim/**/*.test.ts", "tests/**/*.test.ts"],
    // Par défaut, la logique se teste sous Node. Les tests des runes Svelte déclarent
    // l'environnement happy-dom en tête de fichier, pour être compilés comme côté navigateur.
    environment: "node",
  },
});

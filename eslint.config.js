import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import svelte from "eslint-plugin-svelte";
import { defineConfig } from "eslint/config";
import globals from "globals";
import ts from "typescript-eslint";
import svelteConfig from "./svelte.config.js";

// La logique est en TypeScript pur et déterministe : ni Svelte, ni vue, ni navigateur,
// ni horloge, ni aléatoire non reproductible (D-004, docs/architecture.md § 1).
const importsInterditsLogique = [
  "error",
  {
    patterns: [
      { regex: "^svelte(/|$)", message: "La logique n'importe pas Svelte (D-004)." },
      { regex: "\\.svelte$", message: "La logique n'importe pas de composant Svelte (D-004)." },
      {
        regex: "(^|/)(vue|ui|plateforme)(/|$)",
        message: "La logique n'importe ni vue, ni interface, ni plateforme (D-004).",
      },
    ],
  },
];

const navigateurEtTempsReel = [
  "window",
  "document",
  "navigator",
  "localStorage",
  "sessionStorage",
  "performance",
  "requestAnimationFrame",
  "setTimeout",
  "setInterval",
].map((name) => ({
  name,
  message:
    "La logique ne touche ni au navigateur ni au temps réel : le noyau lui fournit le temps.",
}));

export default defineConfig(
  { ignores: ["dist/", "coverage/", "node_modules/"] },
  js.configs.recommended,
  ts.configs.recommended,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: {
      parserOptions: { parser: ts.parser, extraFileExtensions: [".svelte"], svelteConfig },
    },
  },
  {
    files: ["src/**/logique/**/*.ts"],
    rules: {
      "no-restricted-imports": importsInterditsLogique,
      "no-restricted-globals": ["error", ...navigateurEtTempsReel],
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message: "Utiliser le générateur à graine (docs/architecture.md § 4).",
        },
        {
          object: "Date",
          property: "now",
          message: "Le temps est fourni par le noyau (docs/architecture.md § 1).",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: "Le temps est fourni par le noyau (docs/architecture.md § 1).",
        },
      ],
    },
  },
  {
    // Le simulateur tourne sous Node et ne charge que la logique (D-004).
    files: ["sim/**/*.ts"],
    rules: { "no-restricted-imports": importsInterditsLogique },
  },
);

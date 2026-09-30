// Le point d'entrée du simulateur headless (#23) : `npm run simuler -- caves correct --comparer`.
// Vite charge le simulateur et la logique des strates, en TypeScript, sans rendu ni navigateur.
import { fileURLToPath } from "node:url";
import { runnerImport } from "vite";

const { module } = await runnerImport(fileURLToPath(new URL("./simulateur.ts", import.meta.url)));
try {
  console.log(await module.simuler(process.argv.slice(2)));
} catch (erreur) {
  console.error(erreur instanceof Error ? erreur.message : String(erreur));
  console.error("\n" + module.USAGE);
  process.exitCode = 1;
}

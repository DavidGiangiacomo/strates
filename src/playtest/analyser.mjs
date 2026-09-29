// Analyse des journaux de session exportés (docs/playtest-mvp.md, § 9) :
//   npm run analyse -- T1.json T2.json …
// Pour chaque journal, les lignes de la fiche d'observation ; puis un tableau de tous, en Markdown.
// Node exécute analyse.ts tel quel (Node 22.18 ou plus : les types sont effacés au chargement).
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { analyser, resumer, tableau } from "./analyse.ts";

const fichiers = process.argv.slice(2);
if (fichiers.length === 0) {
  console.error("Usage : npm run analyse -- journal-T1.json journal-T2.json …");
  process.exit(1);
}

const analyses = [];
for (const fichier of fichiers) {
  try {
    const analyse = analyser(JSON.parse(readFileSync(fichier, "utf8")));
    analyses.push(analyse);
    console.log(`## ${basename(fichier)}\n\n${resumer(analyse).join("\n")}\n`);
  } catch (erreur) {
    console.error(`${fichier} : illisible (${erreur instanceof Error ? erreur.message : erreur}).`);
    process.exitCode = 1;
  }
}
if (analyses.length > 0) console.log(`## Tous\n\n${tableau(analyses)}`);

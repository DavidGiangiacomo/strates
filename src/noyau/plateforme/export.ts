/** Propose au joueur d'enregistrer sa sauvegarde dans un fichier `.json`. */
export function telechargerSauvegarde(texte: string, maintenant: Date): void {
  const date = maintenant.toISOString().slice(0, 10);
  const url = URL.createObjectURL(new Blob([texte], { type: "application/json" }));
  const lien = document.createElement("a");
  lien.href = url;
  lien.download = `strates-sauvegarde-${date}.json`;
  lien.click();
  // Révoquer trop tôt peut annuler le téléchargement (Firefox) : on laisse passer le clic.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Copie la sauvegarde dans le presse-papiers, en texte. */
export function copierSauvegarde(texte: string): Promise<void> {
  return navigator.clipboard.writeText(texte);
}

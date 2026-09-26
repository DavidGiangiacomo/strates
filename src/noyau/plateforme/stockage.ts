/**
 * Où ranger la sauvegarde. Une interface, plusieurs implémentations : le navigateur maintenant,
 * un fichier pour le desktop (#129), le cloud plus tard (#49) (D-005).
 */
export interface Stockage {
  lire(cle: string): Promise<string | null>;
  ecrire(cle: string, valeur: string): Promise<void>;
}

/**
 * Le stockage du navigateur (`localStorage`). Les opérations sont synchrones sous l'interface
 * asynchrone : une écriture lancée pendant `pagehide` aboutit avant la fermeture.
 */
export class StockageNavigateur implements Stockage {
  #zone: Storage;

  constructor(zone: Storage) {
    this.#zone = zone;
  }

  async lire(cle: string): Promise<string | null> {
    return this.#zone.getItem(cle);
  }

  async ecrire(cle: string, valeur: string): Promise<void> {
    this.#zone.setItem(cle, valeur);
  }
}

/** Un stockage en mémoire : pour les tests, et en secours si le navigateur refuse le sien. */
export class StockageMemoire implements Stockage {
  readonly contenu = new Map<string, string>();

  async lire(cle: string): Promise<string | null> {
    return this.contenu.get(cle) ?? null;
  }

  async ecrire(cle: string, valeur: string): Promise<void> {
    this.contenu.set(cle, valeur);
  }
}

/**
 * Ouvre le stockage du navigateur, ou un stockage en mémoire s'il est inaccessible
 * (navigation privée stricte, stockage désactivé). `persistant` dit si la partie survivra.
 */
export function ouvrirStockage(): { stockage: Stockage; persistant: boolean } {
  try {
    const zone = window.localStorage;
    const essai = "strates.essai";
    zone.setItem(essai, essai);
    zone.removeItem(essai);
    return { stockage: new StockageNavigateur(zone), persistant: true };
  } catch {
    return { stockage: new StockageMemoire(), persistant: false };
  }
}

let persistanceDemandee = false;

/**
 * Demande au navigateur de ne pas effacer les données du jeu. Safari efface celles d'un site
 * non visité depuis 7 jours (D-005, « Risque connu »). Une seule demande par session.
 */
export function demanderPersistance(): void {
  if (persistanceDemandee) return;
  persistanceDemandee = true;
  navigator.storage?.persist?.().catch(() => {});
}

// @vitest-environment happy-dom
// Les compteurs du tableau de bord défilent au lieu de sauter (fiche, § 6).
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import type { Window as FenetreSimulee } from "happy-dom";
import Compteur from "./Compteur.svelte";

/** Les réglages du navigateur simulé : « moins de mouvement ». */
const appareil = () => (window as unknown as FenetreSimulee).happyDOM.settings.device;

let composant: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (composant) unmount(composant);
  composant = null;
  document.body.innerHTML = "";
  appareil().prefersReducedMotion = "no-preference";
});

function monter() {
  const props = $state({ valeur: 100, formater: (v: number) => String(Math.round(v)) });
  composant = mount(Compteur, { target: document.body, props });
  flushSync();
  return props;
}

const affiche = () => Number(document.body.textContent);
const attendre = (ms: number) => new Promise((fin) => setTimeout(fin, ms));

describe("un compteur du tableau de bord", () => {
  it("part de sa valeur, puis défile vers la nouvelle au lieu de sauter", async () => {
    const props = monter();
    expect(affiche()).toBe(100);

    props.valeur = 1_000;
    flushSync();
    expect(affiche()).toBe(100);
    // La première image qui change montre une valeur de passage.
    let passage = affiche();
    for (let i = 0; i < 100 && passage === 100; i++) {
      await attendre(5);
      passage = affiche();
    }
    expect(passage).toBeGreaterThan(100);
    expect(passage).toBeLessThan(1_000);

    await attendre(800);
    expect(affiche()).toBe(1_000);
  });

  it("saute quand le joueur préfère moins de mouvement", () => {
    appareil().prefersReducedMotion = "reduce";
    const props = monter();
    props.valeur = 1_000;
    flushSync();
    expect(affiche()).toBe(1_000);
  });
});

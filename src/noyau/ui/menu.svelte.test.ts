// @vitest-environment happy-dom
// Le menu système (#48) : le son, la taille du texte, la sauvegarde, recommencer en deux temps, la
// version et les crédits.
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TailleTexte } from "../plateforme/affichage";
import Menu from "./Menu.svelte";
import { TEXTES_MENU } from "./menu";

let composant: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (composant) unmount(composant);
  composant = null;
  document.body.innerHTML = "";
});

function monter(surcharges: Record<string, unknown> = {}) {
  const props = {
    volume: 0.7,
    muet: false,
    taille: 1 as TailleTexte,
    version: "0.1.0",
    build: "abc1234",
    onvolume: vi.fn(),
    onmuet: vi.fn(),
    ontaille: vi.fn(),
    onexporter: vi.fn(),
    oncopier: vi.fn(async () => {}),
    onimporter: vi.fn(async () => null as string | null),
    onrecommencer: vi.fn(),
    onfermer: vi.fn(),
    ...surcharges,
  };
  composant = mount(Menu, { target: document.body, props });
  flushSync();
  return props;
}

const element = <T extends Element = HTMLElement>(test: string) =>
  document.querySelector<T>(`[data-test=${test}]`)!;
const texte = (selecteur: string) =>
  document.querySelector(selecteur)?.textContent?.replace(/\s+/g, " ").trim();
/** Laisse passer les promesses du composant. */
const attendre = () => new Promise((fin) => setTimeout(fin, 0));

describe("le menu système", () => {
  it("prend le focus, et se referme par son bouton ou par Échap", () => {
    const { onfermer } = monter();
    const menu = element("menu");
    expect(document.activeElement).toBe(menu);
    expect(menu.getAttribute("role")).toBe("dialog");
    document.querySelector<HTMLButtonElement>("[data-test=menu] .fermer")!.click();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onfermer).toHaveBeenCalledTimes(2);
  });

  it("règle le volume et coupe le son", () => {
    const { onvolume, onmuet } = monter();
    expect(texte("label.ligne")).toBe("Volume 70 %");
    expect(document.querySelector("label.ligne strong")?.textContent).toBe("70\u202f%");
    const curseur = element<HTMLInputElement>("volume");
    curseur.value = "0.35";
    curseur.dispatchEvent(new Event("input", { bubbles: true }));
    expect(onvolume).toHaveBeenCalledWith(0.35);
    element<HTMLInputElement>("muet").click();
    expect(onmuet).toHaveBeenCalledWith(true);
  });

  it("propose trois tailles du texte, et dit laquelle vaut", () => {
    const { ontaille } = monter({ taille: 1.15 });
    const choix = [...document.querySelectorAll<HTMLInputElement>("[name=taille-texte]")];
    expect(choix.map((c) => c.parentElement?.textContent?.trim())).toEqual([
      "100 %",
      "115 %",
      "130 %",
    ]);
    expect(choix.map((c) => c.checked)).toEqual([false, true, false]);
    choix[2]!.click();
    expect(ontaille).toHaveBeenCalledWith(1.3);
  });

  it("exporte la sauvegarde en fichier, et la copie en texte", async () => {
    const { onexporter, oncopier } = monter();
    element<HTMLButtonElement>("exporter").click();
    expect(onexporter).toHaveBeenCalledOnce();
    element<HTMLButtonElement>("copier").click();
    await attendre();
    flushSync();
    expect(oncopier).toHaveBeenCalledOnce();
    expect(texte("[data-test=message]")).toBe(TEXTES_MENU.copiee);
  });

  it("dit quand le navigateur refuse la copie", async () => {
    monter({ oncopier: vi.fn(async () => Promise.reject(new Error("refusé"))) });
    element<HTMLButtonElement>("copier").click();
    await attendre();
    flushSync();
    expect(texte("[data-test=message]")).toBe(TEXTES_MENU.copieRefusee);
  });

  it("importe un fichier, et dit ce qui ne va pas", async () => {
    const onimporter = vi.fn(async () => TEXTES_MENU.importIllisible);
    monter({ onimporter });
    const champ = document.querySelector<HTMLInputElement>("[data-test=menu] input[type=file]")!;
    const ouvrir = vi.spyOn(champ, "click").mockImplementation(() => {});
    element<HTMLButtonElement>("importer").click();
    expect(ouvrir).toHaveBeenCalledOnce();
    Object.defineProperty(champ, "files", {
      value: [new File(['{"format":4}'], "partie.json", { type: "application/json" })],
    });
    champ.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(onimporter).toHaveBeenCalledWith('{"format":4}'));
    await attendre();
    flushSync();
    expect(texte("[data-test=message]")).toBe(TEXTES_MENU.importIllisible);
  });

  it("recommence en deux temps, avec l'export proposé ; le focus va à ce qui ne détruit rien", async () => {
    const { onrecommencer, onexporter } = monter();
    element<HTMLButtonElement>("recommencer").click();
    await attendre();
    flushSync();
    expect(onrecommencer).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain(TEXTES_MENU.avertissement);
    expect(document.activeElement).toBe(element("garder"));

    const exporterDAbord = [...document.querySelectorAll("button")].find(
      (b) => b.textContent === TEXTES_MENU.exporterDAbord,
    )!;
    exporterDAbord.click();
    expect(onexporter).toHaveBeenCalledOnce();

    element<HTMLButtonElement>("garder").click();
    flushSync();
    expect(document.body.textContent).not.toContain(TEXTES_MENU.avertissement);
    expect(onrecommencer).not.toHaveBeenCalled();

    element<HTMLButtonElement>("recommencer").click();
    await attendre();
    flushSync();
    element<HTMLButtonElement>("confirmer").click();
    expect(onrecommencer).toHaveBeenCalledOnce();
  });

  it("donne la version, que notent les retours de playtest, et les crédits", () => {
    monter();
    expect(texte("[data-test=version]")).toBe("Strates 0.1.0 · abc1234");
    expect(document.body.textContent).toContain("Un jeu de David Giangiacomo.");
  });
});

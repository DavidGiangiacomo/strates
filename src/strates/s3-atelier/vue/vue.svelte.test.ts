// @vitest-environment happy-dom
import { flushSync, mount, tick, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { strate } from "..";
import type {
  CommandesNoyau,
  ContexteTick,
  ReglageAmbiance,
  ReglageEffet,
  SonStrate,
} from "../../../noyau/logique/types";
import { logique, type ActionAtelier, type EtatAtelier } from "../logique";
import { etatInitial } from "../logique/etat";
import { TOUR } from "../logique/regles";
import { volumeCrissement, volumesTic } from "./sons";
import Vue from "./Vue.svelte";

const commandes: CommandesNoyau = { demanderFouille() {}, ouvrirAide() {}, terminer() {} };
const CTX: ContexteTick = {
  effets: { multiplicateur: () => 1, niveau: () => null },
  emettre: () => {},
};

let composant: ReturnType<typeof mount> | null = null;
afterEach(() => {
  if (composant) unmount(composant);
  composant = null;
  document.body.innerHTML = "";
});

/**
 * La couche d'opacité, simulée : les éléments encore opaques rendent un glyphe à la place de leurs
 * textes, comme le noyau (docs/comprehension.md, § 4).
 */
function couche(opaques: readonly string[] = []) {
  const cachees = new Set(
    (logique.opacite ?? []).filter((e) => opaques.includes(e.id)).flatMap((e) => e.cles ?? []),
  );
  return {
    o: (cle: string) => (cachees.has(cle) ? "◇" : (strate.textes[cle] ?? `?${cle}`)),
    lisible: (element: string) => !opaques.includes(element),
  };
}

/** Ce que la vue fait entendre, appel après appel. */
function ecoute() {
  const appels: { type: string; nom?: string; reglage?: unknown }[] = [];
  const son: SonStrate = {
    jouer: (nom, reglage) => void appels.push({ type: "jouer", nom, reglage }),
    ambiance: (nom, reglage) => void appels.push({ type: "ambiance", nom, reglage }),
    voix: (nom, reglage) => void appels.push({ type: "voix", nom, reglage }),
    note: (reglage) => void appels.push({ type: "note", reglage }),
  };
  /** Les effets joués : leurs noms, ou les réglages de ceux qui s'appellent `nom`. */
  const joues = () => appels.filter((a) => a.type === "jouer").map((a) => a.nom!);
  const reglages = (nom: string) =>
    appels.filter((a) => a.type === "jouer" && a.nom === nom).map((a) => a.reglage as ReglageEffet);
  /** Le dernier volume de chaque ambiance. */
  const volumes = () => {
    const derniers: Record<string, number> = {};
    for (const a of appels) {
      if (a.type === "ambiance") derniers[a.nom!] = (a.reglage as ReglageAmbiance).volume;
    }
    return derniers;
  };
  return { son, joues, reglages, volumes };
}

function monter(
  modifs: (etat: EtatAtelier) => void = () => {},
  mode: "jeu" | "remontee" = "jeu",
  opaques: readonly string[] = [],
) {
  const etat = $state(etatInitial());
  modifs(etat);
  const actions: ActionAtelier[] = [];
  const sons = ecoute();
  composant = mount(Vue, {
    target: document.body,
    props: {
      etat,
      agir: (action: ActionAtelier) => actions.push(action),
      noyau: commandes,
      ...couche(opaques),
      mode,
      son: sons.son,
    },
  });
  flushSync();
  /** Applique les actions envoyées, comme le noyau au tick suivant. */
  const appliquer = () => {
    for (const action of actions.splice(0)) logique.agir(etat, action, CTX);
    flushSync();
  };
  return { etat, actions, appliquer, sons };
}

/** Le texte d'un élément, sans ce que `cacher` désigne. */
function lire(selecteur: string, cacher: string): string {
  const copie = document.querySelector(selecteur)?.cloneNode(true) as Element | undefined;
  if (!copie) return "";
  for (const x of copie.querySelectorAll(cacher)) x.remove();
  return (copie.textContent ?? "").replace(/[ \t\n\r]+/g, " ").trim();
}
/** Ce que l'on voit : les nombres en chiffres, sans leurs mots, réservés aux lecteurs d'écran. */
const texte = (selecteur: string) => lire(selecteur, ".lecteur");
/** Ce qu'entend un lecteur d'écran : les nombres en mots. */
const entendu = (selecteur: string) => lire(selecteur, '[aria-hidden="true"]');
const cliquer = (selecteur: string) => {
  (document.querySelector(selecteur) as HTMLElement).click();
  flushSync();
};
const etiquette = (repere: number) =>
  document.querySelector(`.plan [data-piece="${repere}"]`)?.getAttribute("aria-label");

describe("la vue de l'atelier", () => {
  it("affiche en base douze le stock, la production par tour et les cases libres", () => {
    monter((etat) => (etat.stock = 1728));
    expect(texte("[data-test=stock]")).toBe("1 000 pièces");
    expect(texte("[data-test=production]")).toBe("48 par tour");
    expect(texte("[data-test=cases]")).toBe("Il reste 26 cases.");
    expect(texte("[data-test=legende]")).toBe("Plan de 6 × 6. Il reste 26 cases.");
  });

  it("dessine le plan : le ressort, les cases libres et les deux roues qui tournent", () => {
    monter();
    expect(document.querySelectorAll(".plan .case")).toHaveLength(30);
    expect(document.querySelectorAll(".plan .piece")).toHaveLength(2);
    expect(etiquette(1)).toBe(
      "Pièce un, roue dentée, dents en haut, à droite, en bas, à gauche, tourne",
    );
    expect(document.querySelector("[data-test=ressort]")?.getAttribute("aria-label")).toBe(
      "Ressort",
    );
    // Sans objet d'en haut, rien sous « Hors plan ».
    expect(document.querySelector("[data-test=hors-plan]")).toBeNull();
  });

  it("emboîte les dents engrenées, et fait tourner chaque moyeu à contresens de celui qui l'entraîne", () => {
    // Une troisième roue au-dessus de la première : elle engrène avec elle, et frotte contre le cadre.
    monter((e) => e.pieces.push({ id: "roue", repere: 3, case: [0, 2], rot: 0, limees: [] }));
    const moyeu = (selecteur: string) => document.querySelector(`${selecteur} .moyeu`)!.classList;
    const sens = (selecteur: string) =>
      ["horaire", "antihoraire"].find((c) => moyeu(selecteur).contains(c));
    expect(sens("[data-test=ressort]")).toBe("horaire");
    expect(sens('.plan [data-piece="1"]')).toBe("antihoraire");
    expect(sens('.plan [data-piece="3"]')).toBe("horaire");
    // Une pièce qui frotte tourne par saccades.
    expect(moyeu('.plan [data-piece="3"]').contains("saccades")).toBe(true);
    expect(moyeu('.plan [data-piece="1"]').contains("saccades")).toBe(false);
    // Les dents d'un côté engrené passent la limite des cases : trois par côté. La roue 1 engrène en
    // haut, à droite et en bas ; la roue 3 en bas seulement.
    const longues = (repere: number) =>
      [...document.querySelectorAll(`.plan [data-piece="${repere}"] polygon.dent`)].filter((d) =>
        d.getAttribute("points")!.includes("-0.6"),
      ).length;
    expect(longues(1)).toBe(9);
    expect(longues(3)).toBe(3);
  });

  it("laisse immobile le moyeu d'une pièce que rien n'entraîne", () => {
    monter((e) => e.pieces.push({ id: "roue", repere: 3, case: [5, 0], rot: 0, limees: [] }));
    const moyeu = document.querySelector('.plan [data-piece="3"] .moyeu')!;
    expect(moyeu.classList.contains("tourne")).toBe(false);
  });

  it("promène au clavier un curseur de case en case, par-dessus le ressort", async () => {
    monter();
    const plan = document.querySelector("[data-test=plan]")!;
    const focalisables = () => plan.querySelectorAll<HTMLElement>('[tabindex="0"]');
    expect(focalisables()).toHaveLength(1);
    focalisables()[0]!.focus();
    const presser = async (key: string) => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key }));
      flushSync();
      await tick();
    };
    const ici = () =>
      document.activeElement?.getAttribute("data-case") ??
      `pièce ${document.activeElement?.getAttribute("data-piece")}`;
    expect(ici()).toBe("0,0");
    await presser("ArrowRight");
    await presser("ArrowRight");
    expect(ici()).toBe("0,2");
    await presser("ArrowDown");
    expect(ici()).toBe("pièce 1");
    await presser("ArrowDown");
    expect(ici()).toBe("4,2");
    // Au bord, il reste où il est.
    await presser("ArrowDown");
    await presser("ArrowDown");
    expect(ici()).toBe("5,2");
    expect(focalisables()).toHaveLength(1);
  });

  it("au clavier, R tourne la pièce sous le curseur, et L puis une flèche lime ce côté", () => {
    const { actions } = monter();
    const piece = document.querySelector<HTMLElement>('.plan [data-piece="1"]')!;
    piece.focus();
    const presser = (key: string) => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key }));
      flushSync();
    };
    presser("r");
    presser("l");
    expect(piece.classList.contains("limee")).toBe(true);
    expect(document.querySelector('[role="status"]')?.textContent?.trim()).toBe("Lime : Pièce un");
    presser("ArrowLeft");
    // Échap repose la lime sans limer : la flèche suivante déplace le curseur.
    presser("L");
    presser("Escape");
    presser("ArrowUp");
    expect(actions).toEqual([
      { type: "tourner", repere: 1 },
      { type: "limer", repere: 1, cote: 3 },
    ]);
    expect(piece.classList.contains("limee")).toBe(false);
  });

  it("garde le focus sur le plan quand la case du curseur se remplit", () => {
    const { appliquer } = monter((e) =>
      e.pieces.push({ id: "roue", repere: 3, case: null, rot: 0, limees: [] }),
    );
    cliquer('.etabli [data-piece="3"]');
    const libre = document.querySelector<HTMLElement>('[data-case="2,1"]')!;
    libre.focus();
    libre.click();
    flushSync();
    appliquer();
    expect(document.activeElement?.getAttribute("data-piece")).toBe("3");
  });

  it("dit à un lecteur d'écran la place d'une case libre, en mots, et les dents d'une pièce", () => {
    monter((e) => {
      e.taille = 12;
      e.pieces.push({ id: "cliquet", repere: 3, case: null, rot: 1, limees: [] });
      e.pieces.push({ id: "cliquet", repere: 4, case: null, rot: 0, limees: [0] });
    });
    const libre = (l: number, c: number) =>
      document.querySelector(`[data-case="${l},${c}"]`)?.getAttribute("aria-label");
    expect(libre(0, 0)).toBe("Case libre, ligne un, colonne un");
    expect(libre(11, 10)).toBe("Case libre, ligne une douzaine, colonne onze");
    const etabli = (repere: number) =>
      document.querySelector(`.etabli [data-piece="${repere}"]`)?.getAttribute("aria-label");
    expect(etabli(3)).toBe("Pièce trois, cliquet, dent à droite");
    expect(etabli(4)).toBe("Pièce quatre, cliquet, sans dent");
  });

  it("montre la nomenclature au fil du cumul, avec ses prix en base douze", () => {
    monter((etat) => (etat.cumul = 900));
    expect(texte("[data-test=nomenclature-roue]")).toContain("74");
    expect(document.querySelector("[data-test=nomenclature-cliquet]")).not.toBeNull();
    expect(document.querySelector("[data-test=nomenclature-renvoi]")).toBeNull();
    expect(document.querySelector("[data-test=agrandir]")).toBeNull();
  });

  it("achète une pièce, qui vient en main, et la pose d'un clic sur une case libre", () => {
    const { etat, actions, appliquer } = monter((e) => (e.stock = 100));
    cliquer("[data-test=nomenclature-roue] .acheter");
    expect(actions).toEqual([{ type: "acheter", piece: "roue" }]);
    appliquer();
    expect(texte("[data-test=main]")).toContain("Pièce 3, roue dentée");
    cliquer('[data-case="2,1"]');
    expect(actions).toEqual([{ type: "poser", repere: 3, case: [2, 1] }]);
    appliquer();
    expect(etat.pieces[2]!.case).toEqual([2, 1]);
    expect(texte("[data-test=production]")).toBe("5↊ par tour");
    expect(document.querySelector("[data-test=main]")).toBeNull();
  });

  it("prend une pièce du plan, la déplace, l'échange ou la met de côté", () => {
    const { actions } = monter((e) =>
      e.pieces.push({ id: "cliquet", repere: 3, case: [5, 5], rot: 0, limees: [] }),
    );
    cliquer('.plan [data-piece="1"]');
    cliquer('[data-case="0,0"]');
    cliquer('.plan [data-piece="1"]');
    cliquer('.plan [data-piece="3"]');
    cliquer('.plan [data-piece="2"]');
    cliquer("[data-test=main] button:nth-of-type(2)");
    expect(actions).toEqual([
      { type: "deplacer", repere: 1, case: [0, 0] },
      { type: "echanger", a: 1, b: 3 },
      { type: "mettreDeCote", repere: 2 },
    ]);
  });

  it("tourne une pièce d'un clic droit, ou de la touche R quand elle est en main", () => {
    const { actions } = monter();
    document
      .querySelector('.plan [data-piece="2"]')!
      .dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
    cliquer('.plan [data-piece="1"]');
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r" }));
    expect(actions).toEqual([
      { type: "tourner", repere: 2 },
      { type: "tourner", repere: 1 },
    ]);
  });

  it("laisse la touche R aux champs de saisie, et Ctrl+R au navigateur", () => {
    const { actions } = monter();
    cliquer('.plan [data-piece="1"]');
    const champ = document.createElement("input");
    document.body.append(champ);
    champ.dispatchEvent(new KeyboardEvent("keydown", { key: "r", bubbles: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "r", ctrlKey: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "R", metaKey: true }));
    expect(actions).toEqual([]);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "R", shiftKey: true }));
    expect(actions).toEqual([{ type: "tourner", repere: 1 }]);
  });

  it("cache, tant qu'ils sont opaques, les noms, les valeurs et le mot qui dit ce que fait la lime", () => {
    monter(
      (e) => {
        e.cumul = 900;
        e.pieces.push({ id: "cliquet", repere: 3, case: null, rot: 1, limees: [] });
      },
      "jeu",
      ["nom.cliquet", "valeurs", "lime"],
    );
    // Le nom du cliquet et sa valeur : des glyphes. Ceux de la roue, qui tourne dès l'arrivée, non.
    expect(texte("[data-test=nomenclature-cliquet] .designation")).toBe("◇ ◇");
    expect(texte("[data-test=nomenclature-cliquet] td:nth-child(5)")).toBe("◇");
    expect(texte("[data-test=nomenclature-roue] .designation")).toBe(
      "Roue dentée Quatre côtés dentés.",
    );
    // La lime sur l'établi, sans légende ; en main, ses boutons la montrent sans dire « Limer ».
    expect(texte(".lime figcaption")).toBe("◇");
    cliquer('.etabli [data-piece="3"]');
    const bouton = document.querySelector("[data-test=limer-1]")!;
    expect(bouton.querySelector(".dessin-lime")).not.toBeNull();
    expect(texte("[data-test=limer-1]")).toBe("à droite");
    expect(bouton.getAttribute("aria-label")).toBe("◇ à droite");
  });

  it("propose de limer les côtés dentés de la pièce en main", () => {
    const { actions } = monter((e) =>
      e.pieces.push({ id: "cliquet", repere: 3, case: null, rot: 1, limees: [] }),
    );
    cliquer('.etabli [data-piece="3"]');
    expect(document.querySelectorAll("[data-test^=limer-]")).toHaveLength(1);
    cliquer("[data-test=limer-1]");
    expect(actions).toEqual([{ type: "limer", repere: 3, cote: 1 }]);
    // La lime a son rôle : le bouton le dit, sans dessin.
    expect(texte("[data-test=limer-1]")).toBe("Limer à droite");
    expect(document.querySelector("[data-test=limer-1] .dessin-lime")).toBeNull();
  });

  it("ne dit un frottement qu'au bout d'un tour, en mots comme en trait", () => {
    const { etat, appliquer, actions } = monter((e) => {
      e.pieces.push({ id: "cliquet", repere: 3, case: null, rot: 0, limees: [] });
    });
    actions.push({ type: "poser", repere: 3, case: [0, 2], rot: 0 });
    appliquer();
    const roue = "Pièce un, roue dentée, dents en haut, à droite, en bas, à gauche, tourne";
    expect(etiquette(1)).toBe(roue);
    expect(document.querySelectorAll(".frotte")).toHaveLength(0);
    etat.temps += TOUR;
    flushSync();
    expect(etiquette(1)).toBe(`${roue}, frotte en haut`);
    expect(etiquette(3)).toBe(
      "Pièce trois, cliquet, dent en haut, ne tourne pas, frotte en haut, en bas",
    );
    expect(document.querySelectorAll(".frotte").length).toBeGreaterThan(0);
  });

  it("lie à chaque prix la note de sa pièce, qui paraît au survol ou au clavier", () => {
    monter((etat) => (etat.cumul = 900));
    const prix = document.querySelector("[data-test=nomenclature-cliquet] .acheter")!;
    const note = document.getElementById(prix.getAttribute("aria-describedby")!)!;
    expect(note.textContent).toBe("Un côté denté : il ferme un bout de rouage.");
    expect(note.getAttribute("role")).toBe("tooltip");
  });

  it("ouvre la notice du plan, note l'ouverture, et la referme par Échap", () => {
    let ouvertures = 0;
    commandes.ouvrirAide = () => ouvertures++;
    monter();
    cliquer("[data-test=lien-aide]");
    const notice = document.querySelector<HTMLElement>("[data-test=aide]")!;
    expect(notice.getAttribute("role")).toBe("dialog");
    expect(document.activeElement).toBe(notice);
    expect(texte("#aide-titre")).toBe("Notice du plan");
    expect([...notice.querySelectorAll("h4")].map((h) => h.textContent)).toEqual([
      "Le plan",
      "Les dents",
      "Le mouvement",
      "La nomenclature",
      "Les nombres",
    ]);
    expect(ouvertures).toBe(1);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    flushSync();
    expect(document.querySelector("[data-test=aide]")).toBeNull();
    expect(document.activeElement).toBe(document.querySelector("[data-test=lien-aide]"));
    commandes.ouvrirAide = () => {};
  });

  it("écrit la légende : une pièce à reprendre, et l'objet d'en haut sous son nom d'en bas", () => {
    monter((etat) => {
      etat.legende.push(
        { cle: "legende.eveil", valeurs: {}, objet: "s2-meule" },
        { cle: "legende.immobile", valeurs: { piece: 14 } },
      );
    });
    expect(texte("[data-test=legende] li:nth-child(1)")).toBe("Pièce 12 : à reprendre.");
    expect(entendu("[data-test=legende] li:nth-child(1)")).toBe(
      "Pièce une douzaine et deux : à reprendre.",
    );
    expect(texte("[data-test=legende] li:nth-child(2)")).toBe("Hors plan : la roue de pierre.");
  });

  it("lit en mots, aux lecteurs d'écran, les nombres de l'en-tête, de la nomenclature et du plan", () => {
    monter((etat) => {
      etat.stock = 1728;
      etat.cumul = 900;
    });
    expect(entendu("[data-test=stock]")).toBe("une grande grosse de pièces");
    expect(entendu("[data-test=production]")).toBe("quatre douzaines et huit par tour");
    expect(entendu("[data-test=cases]")).toBe("Il reste deux douzaines et six cases.");
    const roue = document.querySelector("[data-test=nomenclature-roue]")!;
    // Le prix de la troisième roue : 88 pièces, « 74 ».
    expect(roue.querySelector(".acheter")?.getAttribute("aria-label")).toBe(
      "sept douzaines et quatre",
    );
    expect(entendu("[data-test=nomenclature-roue] td:nth-child(4)")).toBe("dix");
  });

  it("dessine d'un trait plus clair les pièces que les objets d'en haut montrent d'avance", () => {
    monter((etat) => (etat.horsPlan = ["s1-serveur", "s2-calendrier"]));
    const ligne = (id: string) => document.querySelector(`[data-test=nomenclature-${id}]`);
    expect(ligne("roue")?.classList.contains("avance")).toBe(false);
    for (const id of ["cliquet", "renvoi", "pignon"]) {
      expect(ligne(id)?.classList.contains("avance"), id).toBe(true);
    }
    expect(ligne("secteur")).toBeNull();
  });

  it("ajoute à la nomenclature les objets d'en haut qui agissent, sous « Hors plan »", () => {
    monter((etat) => (etat.horsPlan = ["s1-turbine", "s2-faucille"]));
    const lignes = [...document.querySelectorAll("[data-test=hors-plan] th")].map((th) =>
      th.textContent?.trim(),
    );
    expect(lignes).toEqual(["Hors plan", "La roue chaude", "La lame courbe"]);
  });

  it("pendant la remontée, se montre sans rien laisser faire", () => {
    const { actions } = monter((e) => (e.stock = 1000), "remontee");
    cliquer("[data-test=nomenclature-roue] .acheter");
    cliquer('.plan [data-piece="1"]');
    expect(actions).toEqual([]);
  });
});

describe("les sons de l'atelier", () => {
  it("bat le tic du ressort dès l'arrivée, et l'enrichit à chaque pièce entraînée", () => {
    const { actions, appliquer, sons } = monter((e) =>
      e.pieces.push({ id: "pignon", repere: 3, case: null, rot: 1, limees: [] }),
    );
    // Les deux roues de l'arrivée tournent : le ressort bat, et les rouages s'y mêlent à peine. Rien
    // d'autre ne sonne.
    expect(sons.volumes()).toEqual({ ...volumesTic(2, false), crissement: 0 });
    expect(Object.keys(sons.volumes()).filter((nom) => sons.volumes()[nom]! > 0)).toEqual([
      "ressort",
      "rouages",
    ]);
    expect(sons.joues()).toEqual([]);
    // Un pignon contre la première roue : il tourne sans frotter, et les rouages montent.
    actions.push({ type: "poser", repere: 3, case: [1, 1] });
    appliquer();
    expect(sons.volumes()).toEqual({ ...volumesTic(3, false), crissement: 0 });
    expect(sons.volumes()["rouages"]).toBeGreaterThan(volumesTic(2, false).rouages);
  });

  it("crisse dès qu'une pièce entraînée frotte, plus fort quand elles sont plusieurs", () => {
    // Deux roues au-dessus de celles de l'arrivée : elles tournent, et frottent contre le cadre.
    const { sons } = monter((e) => {
      e.pieces.push({ id: "roue", repere: 3, case: [0, 2], rot: 0, limees: [] });
      e.pieces.push({ id: "roue", repere: 4, case: [0, 3], rot: 0, limees: [] });
    });
    expect(sons.volumes()["crissement"]).toBe(volumeCrissement(2));
    expect(volumeCrissement(2)).toBeGreaterThan(volumeCrissement(1));
  });

  it("au seuil, fait tomber tous les tics ensemble : un seul grand coup, puis l'unisson", () => {
    const { etat, sons } = monter();
    etat.seuilAtteintA = etat.temps;
    flushSync();
    expect(sons.joues()).toEqual(["ensemble"]);
    expect(sons.volumes()).toEqual({ ...volumesTic(2, true), crissement: 0 });
    // Le grand coup ne sonne qu'une fois.
    etat.pieces.push({ id: "roue", repere: 3, case: null, rot: 0, limees: [] });
    flushSync();
    expect(sons.joues()).toEqual(["ensemble"]);
  });

  it("retrouve l'unisson sans le grand coup, quand le seuil était franchi avant", () => {
    const { sons } = monter((e) => (e.seuilAtteintA = 0));
    expect(sons.joues()).toEqual([]);
    expect(sons.volumes()).toEqual({ ...volumesTic(2, true), crissement: 0 });
  });

  it("donne à chaque geste son bruit, une fois appliqué : poser, déplacer, tourner, limer, agrandir", () => {
    const { appliquer, sons } = monter((e) => {
      e.stock = 1e6;
      e.cumul = 1e6;
      e.pieces.push({ id: "cliquet", repere: 3, case: null, rot: 0, limees: [] });
    });
    // Poser : un clic de métal, à gauche du plan, d'où vient la pièce.
    cliquer('.etabli [data-piece="3"]');
    cliquer('[data-case="4,0"]');
    expect(sons.joues()).toEqual([]);
    appliquer();
    expect(sons.joues()).toEqual(["pose"]);
    expect(sons.reglages("pose")[0]!.panoramique).toBeLessThan(-0.3);
    // Déplacer : la pièce reprend une case.
    cliquer('.plan [data-piece="3"]');
    cliquer('[data-case="5,5"]');
    appliquer();
    expect(sons.joues()).toEqual(["pose", "pose"]);
    expect(sons.reglages("pose")[1]!.panoramique).toBeGreaterThan(0.3);
    // Tourner : un cran.
    document
      .querySelector('.plan [data-piece="3"]')!
      .dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
    appliquer();
    expect(sons.joues().at(-1)).toBe("cran");
    // Limer : la dent du cliquet, tournée à droite.
    cliquer('.plan [data-piece="3"]');
    cliquer("[data-test=limer-1]");
    appliquer();
    expect(sons.joues().at(-1)).toBe("lime");
    // Agrandir : le plan se déplie, et ses pièces, qui se décalent d'une couronne, ne claquent pas.
    cliquer("[data-test=agrandir]");
    appliquer();
    expect(sons.joues()).toEqual(["pose", "pose", "cran", "lime", "deplier"]);
  });

  it("ne fait rien entendre d'un geste refusé, et claque plus grave pour une grande pièce", () => {
    const { appliquer, sons } = monter((e) =>
      e.pieces.push({ id: "grandeRoue", repere: 3, case: null, rot: 0, limees: [] }),
    );
    // Au-dessus des roues de l'arrivée, la grande roue ne tient pas : rien ne se pose.
    cliquer('.etabli [data-piece="3"]');
    cliquer('[data-case="0,2"]');
    appliquer();
    expect(sons.joues()).toEqual([]);
    cliquer('.etabli [data-piece="3"]');
    cliquer('[data-case="4,0"]');
    appliquer();
    expect(sons.joues()).toEqual(["pose"]);
    expect(sons.reglages("pose")[0]!.vitesse).toBeLessThan(0.8);
  });
});

// @vitest-environment happy-dom
// La vue du lit (fiche, § 6) : sa palette et son grain, les creux qu'on ferme d'un clic ou au clavier,
// la crue trouble qui s'éclaircit et la couche qui monte, le rocher aux encoches, les fosses de la
// dette, les objets sur la berge, la lecture de l'échelle, les phrases du jeu et l'aide dessinée ;
// les mots et les mesures encore opaques, en glyphes.
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it, vi } from "vitest";
import { strate } from "..";
import { elementsParCle, GLYPHES, glyphes } from "../../../noyau/logique/opacite";
import type {
  CommandesNoyau,
  ContexteTick,
  ReglageAmbiance,
  ReglageEffet,
  SonStrate,
} from "../../../noyau/logique/types";
import { logique, type ActionLit, type EtatLit } from "../logique";
import { etatInitial } from "../logique/etat";
import { CRUE, GRANDE_CRUE } from "../logique/regles";
import { ENCOCHES, TASSEMENT } from "./coupe";
import { PLACES } from "./sons";
import { POLICE } from "./theme";
import Vue from "./Vue.svelte";

const commandes: CommandesNoyau = { demanderFouille() {}, ouvrirAide() {}, terminer() {} };
const silence: SonStrate = { jouer() {}, ambiance() {}, voix() {}, note() {} };
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

/** Pour chaque clé de texte, l'élément opaque qui la couvre. */
const ELEMENT_DE = elementsParCle(logique.opacite ?? []);

/**
 * Monte la vue, avec les éléments `opaques` encore opaques : leurs clés de texte deviennent des
 * glyphes, comme à travers la couche d'opacité du noyau.
 */
function monter(
  modifs: (etat: EtatLit) => void = () => {},
  mode: "jeu" | "remontee" = "jeu",
  opaques: readonly string[] = [],
  son: SonStrate = silence,
) {
  const etat = $state(etatInitial());
  modifs(etat);
  const actions: ActionLit[] = [];
  composant = mount(Vue, {
    target: document.body,
    props: {
      etat,
      agir: (action: ActionLit) => actions.push(action),
      noyau: commandes,
      o: (cle: string) => {
        const texte = strate.textes[cle] ?? `?${cle}`;
        return opaques.includes(ELEMENT_DE.get(cle) ?? "") ? glyphes(cle, texte) : texte;
      },
      lisible: (element: string) => !opaques.includes(element),
      mode,
      son,
    },
  });
  flushSync();
  /** Fait passer `secondes` d'un coup, puis redessine. */
  const avancer = (secondes: number) => {
    logique.tick(etat, secondes, CTX);
    flushSync();
  };
  return { etat, actions, avancer };
}

const creux = (k: number) => document.querySelector<SVGElement>(`[data-creux="${k}"]`)!;
/** Un clic sur un creux : un élément SVG n'a pas de `click()`. */
const cliquer = (k: number) => creux(k).dispatchEvent(new MouseEvent("click", { bubbles: true }));
const etiquettes = () =>
  [...document.querySelectorAll("[data-creux]")].map((e) => e.getAttribute("aria-label"));
const texte = (selecteur: string) => document.querySelector(selecteur)?.textContent?.trim() ?? "";
/** Les éléments du dessin, que les lecteurs d'écran ne voient pas. */
const dessines = (test: string) =>
  document.querySelectorAll(`svg > g[aria-hidden="true"] [data-test=${test}]`);

describe("l'habit du lit", () => {
  it("prend sa palette et sa police, sous un ciel gris et voilé", () => {
    monter();
    const style = document.querySelector(".lit")!.getAttribute("style")!;
    expect(style).toContain(`--police: ${POLICE}`);
    expect(style).toContain("--ciel-haut:");
    expect(style).toContain("--limon:");
  });

  it("couvre l'écran d'un grain, sans rien dire", () => {
    monter();
    expect(document.querySelector("[data-test=grain]")!.getAttribute("aria-hidden")).toBe("true");
  });

  it("dessine au fond le rocher aux encoches", () => {
    monter();
    expect(dessines("encoche")).toHaveLength(ENCOCHES.length);
  });

  it("creuse dans la rive les fosses de la dette : tablettes brisées, ou entières et scellées", () => {
    const compte = () => ["fosse", "eclat", "tablette", "sceau"].map((t) => dessines(t).length);
    monter();
    expect(compte()).toEqual([0, 0, 0, 0]);
    unmount(composant!);

    monter((e) => {
      e.dette = "soldee";
    });
    expect(compte()).toEqual([2, 8, 0, 0]);
    unmount(composant!);

    monter((e) => {
      e.dette = "defaut";
    });
    expect(compte()).toEqual([2, 0, 5, 5]);
  });

  it("pose sur la berge les objets d'en haut, sans écrire leur nom", () => {
    monter((e) => {
      e.objets = ["s5-echo", "s6-poids", "s6-bulle"];
    });
    const objets = [...document.querySelectorAll('svg > g[aria-hidden="true"] [data-objet]')];
    expect(objets.map((g) => g.getAttribute("data-objet"))).toEqual([
      "s5-echo",
      "s6-poids",
      "s6-bulle",
    ]);
    expect(objets.every((g) => (g.textContent ?? "").trim() === "")).toBe(true);
  });
});

describe("la coupe du lit", () => {
  it("montre les quatre creux, chacun avec sa hauteur et son état", () => {
    monter();
    expect(etiquettes()).toEqual([
      "Creux au fond du bassin, sous l'eau",
      "Creux à neuf coudées, à sec",
      "Creux à dix-huit coudées, à sec",
      "Creux à vingt-sept coudées, à sec",
    ]);
    for (let k = 0; k < 4; k++) {
      expect(creux(k).getAttribute("role")).toBe("button");
      expect(creux(k).getAttribute("tabindex")).toBe("0");
    }
  });

  it("bâtit la levée sur un creux d'un clic, ou au clavier, et la dessine", () => {
    const { etat, actions } = monter();
    cliquer(1);
    creux(2).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    creux(3).dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    expect(actions).toEqual([
      { type: "fermer", creux: 1 },
      { type: "fermer", creux: 2 },
    ]);
    logique.agir(etat, actions[0]!, CTX);
    flushSync();
    expect(creux(1).querySelector(".levee")).not.toBeNull();
    expect(creux(1).getAttribute("aria-label")).toBe("Creux à neuf coudées, fermé");
    expect(creux(1).getAttribute("aria-disabled")).toBe("true");
  });

  it("n'envoie rien pour un creux plein, ni pendant la remontée", () => {
    const plein = monter((e) => logique.tick(e, 34 * CRUE, CTX));
    expect(creux(0).getAttribute("aria-label")).toBe("Creux au fond du bassin, plein");
    cliquer(0);
    expect(plein.actions).toEqual([]);
    unmount(composant!);

    const remontee = monter(() => {}, "remontee");
    cliquer(1);
    expect(remontee.actions).toEqual([]);
    expect(creux(1).getAttribute("aria-disabled")).toBe("true");
  });

  it("dessine les couches du bassin à mesure que les crues passent", () => {
    const { etat, avancer } = monter();
    expect(document.querySelectorAll("svg > g[aria-hidden] .couche")).toHaveLength(0);
    avancer(40 * CRUE);
    const bassin = etat.couches.filter((c) => c.ou === "bassin").length;
    expect(bassin).toBeGreaterThan(0);
    expect(document.querySelectorAll("svg > g[aria-hidden] .couche")).toHaveLength(bassin);
    expect(creux(0).querySelectorAll(".couche")).toHaveLength(34);
  });
});

describe("la crue", () => {
  const arrets = () =>
    [...document.querySelectorAll("#lit-eau stop")].map((s) => Number(s.getAttribute("offset")));

  it("monte trouble, puis s'éclaircit de haut en bas pendant son repos", () => {
    const { avancer } = monter();
    // Elle monte.
    avancer(20);
    expect(document.querySelector("[data-test=eau]")!.getAttribute("fill")).toBe("url(#lit-eau)");
    expect(arrets()).toEqual([0, 0]);
    // Au milieu de son repos.
    avancer(10);
    const [haut, bas] = arrets();
    expect(haut).toBeCloseTo(0.35, 9);
    expect(bas).toBeCloseTo(0.65, 9);
    // À la fin de son repos, elle est claire.
    avancer(5);
    expect(arrets()).toEqual([1, 1]);
  });

  it("fait monter sa couche au fond, lentement", () => {
    const { avancer } = monter();
    const hauteur = () => Number(creux(0).querySelector(".couche")!.getAttribute("height"));
    // La première crue laisse son limon au creux du fond, à trente secondes.
    avancer(CRUE);
    expect(hauteur()).toBe(0);
    avancer(TASSEMENT / 2);
    const moitie = hauteur();
    expect(moitie).toBeGreaterThan(0);
    avancer(TASSEMENT / 2);
    expect(hauteur()).toBeCloseTo(2 * moitie, 6);
  });
});

describe("l'échelle", () => {
  it("se lit en lettres sur la roche, et s'annonce aux lecteurs d'écran à la coudée près", () => {
    const { avancer } = monter();
    expect(texte(".socle .lecture")).toBe("aucune coudée");
    // Sans levée, le creux du fond prend 34 crues ; la 35ᵉ va au bassin.
    avancer(35 * CRUE);
    expect(texte(".lecture")).toBe("sept doigts");
    expect(texte(".lecteur")).toBe("Échelle de crue : aucune coudée");
    avancer(4 * CRUE);
    expect(texte(".lecture")).toBe("une coudée et sept doigts");
    expect(texte(".lecteur")).toBe("Échelle de crue : une coudée");
  });
});

describe("les phrases du jeu", () => {
  it("paraissent au centre, puis s'effacent : « Rien ne presse. » à l'arrivée", () => {
    const { avancer } = monter();
    avancer(5);
    expect(texte(".phrase")).toBe("Rien ne presse.");
    expect(document.querySelector<HTMLElement>(".phrase")!.style.opacity).toBe("1");
    avancer(10);
    expect(texte(".phrase")).toBe("");
  });
});

describe("les objets d'en haut", () => {
  const avenir = () => document.querySelectorAll("[data-test=avenir]");
  /** Le rouleau qui marque, puissant, et le gage qui revient, utile, agissent ici. */
  const niveaux: Record<string, "puissant" | "utile"> = {
    "s6-sceau": "puissant",
    "s5-echo": "utile",
  };
  const AVEC_OBJETS: ContexteTick = {
    effets: { multiplicateur: () => 1, niveau: (id) => niveaux[id] ?? null },
    emettre: () => {},
  };

  it("dessinent d'avance, en pointillés, les couches à venir, à leur place", () => {
    monter();
    expect(avenir()).toHaveLength(0);
    unmount(composant!);

    const { etat } = monter((e) => {
      e.objets = ["s5-echo", "s6-sceau"];
    });
    // Les quatre prochaines crues iront au creux du fond.
    expect(avenir()).toHaveLength(4);
    expect(creux(0).querySelectorAll("[data-test=avenir]")).toHaveLength(4);
    // La levée bâtie, elles se redessinent : l'eau retenue y laissera tout son limon.
    const avant = creux(0).querySelector("[data-test=avenir]")!.getAttribute("height");
    logique.agir(etat, { type: "fermer", creux: 0 }, AVEC_OBJETS);
    flushSync();
    expect(avenir()).toHaveLength(4);
    const apres = creux(0).querySelector("[data-test=avenir]")!.getAttribute("height");
    expect(Number(apres)).toBeGreaterThan(Number(avant));
  });

  it("marquent la rive sur l'échelle avec l'œuf qui garde, et les lecteurs d'écran l'entendent", () => {
    monter();
    expect(document.querySelector("[data-test=rive-marquee]")).toBeNull();
    expect(texte(".lecteur")).toBe("Échelle de crue : aucune coudée");
    unmount(composant!);

    monter((e) => {
      e.objets = ["s6-bulle"];
    });
    expect(document.querySelector("[data-test=rive-marquee]")).not.toBeNull();
    expect(texte(".lecteur")).toBe("Échelle de crue : aucune coudée, la rive à trente-six coudées");
  });
});

describe("l'aide", () => {
  it("s'ouvre d'un lien discret, dessine une crue en trois moments, et se referme", () => {
    const ouvrir = vi.spyOn(commandes, "ouvrirAide");
    monter();
    expect(document.querySelector("[data-test=aide]")).toBeNull();
    document.querySelector<HTMLButtonElement>("[data-test=lien-aide]")!.click();
    flushSync();
    // L'ouvrir est noté par le noyau : l'acte « sans aide » est perdu.
    expect(ouvrir).toHaveBeenCalledTimes(1);
    const aide = document.querySelector("[data-test=aide]")!;
    expect(aide.getAttribute("role")).toBe("dialog");
    expect(texte("[data-test=aide] h3")).toBe("Une crue");
    // Trois petites coupes, chacune sur sa légende, sans un mot ; la rive est à droite de chacune.
    const dessins = aide.querySelectorAll("[data-test=crue-dessinee]");
    expect(dessins).toHaveLength(3);
    expect([...dessins].every((d) => d.getAttribute("aria-hidden") === "true")).toBe(true);
    const legendes = [...aide.querySelectorAll("li")].map((li) =>
      (li.textContent ?? "").replace(/\s+/g, " ").trim(),
    );
    expect(legendes).toEqual([
      "La crue monte.",
      "Derrière la levée, l'eau se repose.",
      "Elle se retire, et laisse son limon : une couche.",
      "À droite, la rive.",
    ]);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    flushSync();
    expect(document.querySelector("[data-test=aide]")).toBeNull();
    document.querySelector<HTMLButtonElement>("[data-test=lien-aide]")!.click();
    flushSync();
    document.querySelector<HTMLButtonElement>("[data-test=aide] .refermer")!.click();
    flushSync();
    expect(document.querySelector("[data-test=aide]")).toBeNull();
    ouvrir.mockRestore();
  });
});

describe("l'opacité", () => {
  /** Rien que des glyphes du noyau, un par mot. */
  const enGlyphes = new RegExp(`^[${GLYPHES}]( [${GLYPHES}])*$`, "u");

  it("écrit en glyphes les mesures encore opaques : on voit monter le limon, pas sa mesure", () => {
    const { avancer } = monter(
      (e) => {
        e.objets = ["s6-bulle"];
      },
      "jeu",
      ["mesures"],
    );
    expect(texte(".lecture")).toMatch(enGlyphes);
    const lecteur = texte(".lecteur");
    expect(lecteur).toMatch(/^Échelle de crue : /);
    expect(lecteur).not.toMatch(/coudée|doigt/);
    expect(lecteur).toMatch(/, la rive à /);
    const [, , ...hauts] = etiquettes();
    expect(etiquettes()[0]).toBe("Creux au fond du bassin, sous l'eau");
    for (const etiquette of hauts) {
      expect(etiquette).toMatch(/^Creux à .+, à sec$/);
      expect(etiquette).not.toMatch(/coudée/);
    }
    // Le limon monte quand même : la coupe le montre.
    avancer(40 * CRUE);
    expect(texte(".lecture")).toMatch(enGlyphes);
  });

  it("ne nomme pas dans l'aide la crue, le limon, la couche ni la rive encore opaques", () => {
    monter(() => {}, "jeu", ["crue", "couche"]);
    document.querySelector<HTMLButtonElement>("[data-test=lien-aide]")!.click();
    flushSync();
    expect(texte("[data-test=aide] h3")).toMatch(enGlyphes);
    const legendes = [...document.querySelectorAll("[data-test=aide] li")].map((li) =>
      (li.textContent ?? "").replace(/\s+/g, " ").trim(),
    );
    expect(legendes[0]).toMatch(enGlyphes);
    // La levée et l'eau ne se cachent jamais.
    expect(legendes[1]).toBe("Derrière la levée, l'eau se repose.");
    expect(legendes[2]).toMatch(enGlyphes);
    expect(legendes[3]).toMatch(enGlyphes);
    // Les dessins restent : on voit la crue, sans son nom.
    expect(document.querySelectorAll("[data-test=crue-dessinee]")).toHaveLength(3);
  });
});

describe("le son", () => {
  /** Une banque qui note ce qu'on lui demande. */
  function ecoute() {
    const effets: [string, ReglageEffet | undefined][] = [];
    const ambiances: [string, ReglageAmbiance][] = [];
    const son: SonStrate = {
      jouer: (nom, reglage) => effets.push([nom, reglage]),
      ambiance: (nom, reglage) => ambiances.push([nom, reglage]),
      voix() {},
      note() {},
    };
    return { son, effets, ambiances, noms: () => effets.map(([nom]) => nom) };
  }

  it("fait murmurer le fleuve au loin dès l'arrivée, et l'enfle un peu pendant la crue", () => {
    const { son, ambiances } = ecoute();
    const { avancer } = monter(() => {}, "jeu", [], son);
    expect(ambiances.at(-1)).toEqual(["fleuve", { volume: 0.2, fondu: 8 }]);
    avancer(16);
    expect(ambiances.at(-1)).toEqual(["fleuve", { volume: 0.32, fondu: 8 }]);
    // Il ne change de réglage qu'au début et à la fin de la crue.
    const avant = ambiances.length;
    avancer(10);
    expect(ambiances).toHaveLength(avant);
  });

  it("laisse le fleuve s'éloigner jusqu'au silence quand le bassin est plein", () => {
    const { son, ambiances } = ecoute();
    monter(
      (e) => {
        e.temps = 600;
        e.pleinA = 600;
      },
      "jeu",
      [],
      son,
    );
    expect(ambiances.at(-1)).toEqual(["fleuve", { volume: 0, fondu: 25 }]);
  });

  it("fait monter l'eau de chaque crue, la tait au repos, puis la retire", () => {
    const { son, effets, noms } = ecoute();
    const { avancer } = monter(() => {}, "jeu", [], son);
    avancer(14);
    expect(noms()).toEqual([]);
    // La première crue monte à quinze secondes, et va au creux du fond.
    avancer(2);
    expect(noms()).toEqual(["montee-1", "engouffre"]);
    expect(effets[0]![1]).toMatchObject({ panoramique: PLACES.bassin });
    expect(effets[1]![1]).toMatchObject({ panoramique: PLACES.creux, dans: 3 });
    // Au repos, elle se tait ; elle se retire à trente-cinq secondes.
    avancer(10);
    expect(noms()).toHaveLength(2);
    avancer(10);
    expect(noms()).toEqual(["montee-1", "engouffre", "retrait-1"]);
    // La suivante prend la variante suivante.
    avancer(10);
    expect(noms().slice(3)).toEqual(["montee-2", "engouffre"]);
  });

  it("ne fait pas sonner un moment déjà commencé quand la vue est montée", () => {
    const { son, noms } = ecoute();
    const { avancer } = monter(
      (e) => {
        e.temps = 20;
      },
      "jeu",
      [],
      son,
    );
    avancer(1);
    expect(noms()).toEqual([]);
    avancer(15);
    expect(noms()).toEqual(["retrait-1"]);
  });

  it("fait la grande crue plus grave et plus longue", () => {
    const { son, effets } = ecoute();
    const { avancer } = monter(
      (e) => {
        e.temps = GRANDE_CRUE * CRUE - 15.5;
        e.crues = GRANDE_CRUE - 1;
      },
      "jeu",
      [],
      son,
    );
    avancer(1);
    const [nom, reglage] = effets[0]!;
    expect(nom).toMatch(/^montee-/);
    expect(reglage!.vitesse).toBeLessThan(0.75);
  });

  it("fait entendre la levée bâtie, et rien quand elle disparaît sous le limon", () => {
    const { son, effets, noms } = ecoute();
    const { etat } = monter(() => {}, "jeu", [], son);
    logique.agir(etat, { type: "fermer", creux: 1 }, CTX);
    flushSync();
    expect(noms()).toEqual(["levee"]);
    expect(effets[0]![1]).toMatchObject({ panoramique: PLACES.creux });
    etat.levee = null;
    flushSync();
    expect(noms()).toEqual(["levee"]);
  });
});

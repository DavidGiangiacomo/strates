// @vitest-environment happy-dom
// La vue de la dette (fiche, § 6), en livre de comptes sobre : la caisse et la confiance, la tablette
// et ses termes, l'échéancier, les dernières lignes du livre, et la fin. Puis ce qui reste opaque
// (§ 7) : les noms en glyphes, la confiance sans sa valeur, le report sans sa crue.
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { strate } from "..";
import { elementsParCle, glyphes } from "../../../noyau/logique/opacite";
import type {
  CommandesNoyau,
  ContexteTick,
  ReglageAmbiance,
  ReglageEffet,
  SonStrate,
} from "../../../noyau/logique/types";
import { logique, type ActionDette, type EtatDette } from "../logique";
import { etatInitial } from "../logique/etat";
import { CRUE, EXEMPLAIRES, montantDu, prixExemplaire, sortesDe } from "../logique/regles";
import { flotDeLaCrue, PLACES, RETRAIT, SCEAU_APRES } from "./sons";
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
 * glyphes, ceux de la dette, comme à travers la couche d'opacité du noyau.
 */
function monter(
  modifs: (etat: EtatDette) => void = () => {},
  mode: "jeu" | "remontee" = "jeu",
  opaques: readonly string[] = [],
  son: SonStrate = silence,
) {
  const etat = $state(etatInitial());
  modifs(etat);
  const actions: ActionDette[] = [];
  composant = mount(Vue, {
    target: document.body,
    props: {
      etat,
      agir: (action: ActionDette) => actions.push(action),
      noyau: commandes,
      o: (cle: string) => {
        const texte = strate.textes[cle] ?? `?${cle}`;
        return opaques.includes(ELEMENT_DE.get(cle) ?? "")
          ? glyphes(cle, texte, strate.glyphes)
          : texte;
      },
      lisible: (element: string) => !opaques.includes(element),
      mode,
      son,
    },
  });
  flushSync();
  /** Fait passer `secondes` d'un coup, ou applique un geste, puis redessine. */
  const avancer = (secondes: number) => {
    logique.tick(etat, secondes, CTX);
    flushSync();
  };
  const appliquer = () => {
    for (const action of actions.splice(0)) logique.agir(etat, action, CTX);
    flushSync();
  };
  return { etat, actions, avancer, appliquer };
}

/** Sans les espaces fines, pour lire les montants comme la fiche les écrit. */
const lire = (texte: string | null | undefined) =>
  (texte ?? "")
    .replace(/\u202f/g, " ")
    .replace(/\s+/g, " ")
    .trim();
/** Le texte d'un élément, sans ce que `cacher` désigne. */
function sans(element: Element | null | undefined, cacher: string): string {
  const copie = element?.cloneNode(true) as Element | undefined;
  if (!copie) return "";
  for (const e of copie.querySelectorAll(cacher)) e.remove();
  return lire(copie.textContent);
}
/** Ce qui se voit : les montants en sceaux, sans leurs mots, réservés aux lecteurs d'écran. */
const vu = (element: Element | null | undefined) => sans(element, ".lecteur");
/** Ce qu'entend un lecteur d'écran : les montants en mots. */
const entendu = (selecteur: string) =>
  sans(document.querySelector(selecteur), '[aria-hidden="true"]');
const texte = (selecteur: string) => vu(document.querySelector(selecteur));
const tous = (selecteur: string) => [...document.querySelectorAll(selecteur)].map(vu);
const boutons = (selecteur: string) => [
  ...document.querySelectorAll<HTMLButtonElement>(`${selecteur} button`),
];

describe("le haut du livre", () => {
  it("montre la caisse, le rapport, ce qu'on doit sur la confiance, et la crue qui vient", () => {
    monter();
    expect(texte(".caisse")).toBe("La caisse 30 6 par crue");
    expect(texte(".etat-confiance")).toBe("Dû : 28 sur 60");
    expect(texte("[data-test=crue]")).toBe("La 1ʳᵉ crue dans 30 s");
  });

  it("dit les montants en lettres aux lecteurs d'écran", () => {
    monter((etat) => {
      etat.caisse = 125e9;
    });
    expect(entendu(".caisse .montant")).toBe("cent vingt-cinq milliards");
    expect(texte(".caisse .montant")).toBe("125 ●●●");
    expect(entendu(".rapport")).toBe("six par crue");
  });
});

describe("la tablette", () => {
  it("offre ses trois sortes, leurs exemplaires et un bouton par terme, avec le montant dû et sa crue", () => {
    monter();
    expect(tous(".sorte h3")).toEqual([
      "une mesure d'orge",
      "une jarre d'huile",
      "une pièce d'étoffe",
    ]);
    expect(tous("[data-sorte=orge] button")).toEqual([
      "à 2 crues : 20, à la 2ᵉ",
      "à 6 crues : 24, à la 6ᵉ",
      "à 18 crues : 32, à la 18ᵉ",
    ]);
    expect(texte("[data-sorte=orge] .texte-encoches")).toBe("6 sur 8 à promettre");
    expect(texte("[data-sorte=etoffe] .rapporte")).toBe("rapporte 1 670 par crue");
  });

  it("promet d'un clic, au terme choisi", () => {
    const { actions } = monter();
    boutons("[data-sorte=huile]")[1]!.click();
    expect(actions).toEqual([{ type: "promettre", promesse: "huile", terme: 6 }]);
  });

  it("dans la dernière tablette, n'a qu'un bouton par sorte : à la grande crue", () => {
    monter((etat) => {
      for (let k = 1; k <= 4; k++) for (const id of sortesDe(k)) etat.promises[id] = EXEMPLAIRES;
      etat.tablette = 5;
      etat.echeances = [];
    });
    const du = montantDu(prixExemplaire("dixCrues", 0), null);
    expect(du).toBe(1_900e15);
    expect(tous("[data-sorte=dixCrues] button")).toEqual(["à la grande crue : 1 900 ●●●●●"]);
    expect(texte("[data-test=grande-crue]")).toBe(
      "Tout ce qui reste dû tombe à la grande crue : 0.",
    );
  });
});

describe("l'échéancier", () => {
  it("écrit chaque échéance à sa crue, en rouge, et offre de la solder", () => {
    const { actions } = monter();
    expect(tous(".echeance .du")).toEqual(["Dû à la 1ʳᵉ crue : 12.", "Dû à la 2ᵉ crue : 16."]);
    boutons("[data-echeance='2']")[0]!.click();
    expect(actions).toEqual([{ type: "solder", echeance: 2 }]);
  });

  it("ne laisse pas solder ce que la caisse ne couvre pas", () => {
    monter((etat) => {
      etat.caisse = 13;
    });
    expect(boutons(".echeance").map((b) => b.disabled)).toEqual([false, true]);
  });

  it("passe au noir l'échéance honorée, « Honoré. », puis l'efface à la crue suivante", () => {
    const { avancer } = monter();
    avancer(CRUE);
    expect(tous(".livre li")).toEqual(["Dû à la 1ʳᵉ crue : 12. Honoré."]);
    expect(tous(".echeance.honoree")).toEqual(["Dû à la 1ʳᵉ crue : 12. une mesure d'orge Honoré."]);
    expect(tous(".echeance:not(.honoree) .du")).toEqual(["Dû à la 2ᵉ crue : 16."]);
    // La même ligne : elle a changé d'encre, sans quitter sa place.
    expect(document.querySelectorAll(".echeance")).toHaveLength(2);
    avancer(CRUE);
    expect(tous(".echeance.honoree .du")).toEqual(["Dû à la 2ᵉ crue : 16."]);
    avancer(CRUE);
    expect(document.querySelectorAll(".echeance")).toHaveLength(0);
  });

  it("passe au noir aussi l'échéance soldée avant son terme, jusqu'à la crue suivante", () => {
    const { actions, appliquer, avancer } = monter();
    boutons("[data-echeance='2']")[0]!.click();
    expect(actions).toEqual([{ type: "solder", echeance: 2 }]);
    appliquer();
    expect(tous(".echeance.honoree .du")).toEqual(["Dû à la 2ᵉ crue : 16."]);
    expect(texte(".echeance.honoree .honore")).toBe("Honoré.");
    avancer(CRUE);
    expect(tous(".echeance.honoree .du")).toEqual(["Dû à la 1ʳᵉ crue : 12."]);
  });

  it("écrit le refus de la confiance, et le report sous sa crue", () => {
    const { etat, appliquer, avancer } = monter();
    boutons("[data-sorte=orge]")[0]!.click();
    boutons("[data-sorte=orge]")[0]!.click();
    appliquer();
    expect(tous(".livre li").at(-1)).toBe("La confiance ne suffit pas.");
    expect(document.querySelector(".livre li:last-child")!.classList.contains("rouge")).toBe(true);
    // Trois mesures d'orge rapportent 9 : la caisse vide en paie 9, et le reste, 3, est majoré.
    etat.caisse = 0;
    etat.honore = 100;
    avancer(CRUE);
    expect(tous(".livre li").at(-1)).toBe("Reporté à la 3ᵉ crue, majoré d'un quart : 4.");
    expect(tous(".echeance .reports")).toEqual(["reportée 1 fois"]);
  });
});

describe("le livre", () => {
  it("garde à chaque ligne sa place : les lecteurs d'écran n'entendent que la nouvelle", () => {
    const { avancer } = monter((etat) => {
      etat.livre = Array.from({ length: 40 }, (_, k) => ({
        cle: "livre.brisee",
        valeurs: { tablette: k },
      }));
      etat.ecrites = 57;
    });
    const avant = [...document.querySelectorAll(".livre li")];
    expect(avant).toHaveLength(10);
    avancer(CRUE);
    const apres = [...document.querySelectorAll(".livre li")];
    expect(apres).toHaveLength(10);
    for (let k = 0; k < 9; k++) expect(apres[k]).toBe(avant[k + 1]);
    expect(vu(apres[9])).toBe("Dû à la 1ʳᵉ crue : 12. Honoré.");
    expect(document.querySelector(".livre ol")!.getAttribute("aria-live")).toBe("polite");
  });
});

describe("les gages (fiche, § 8)", () => {
  it("écrivent la caisse prévue à chaque échéance avec le gage qui revient, une fois éveillés", () => {
    const { etat } = monter((e) => {
      e.objets = ["s5-echo"];
    });
    expect(document.querySelectorAll("[data-test=prevue]")).toHaveLength(0);
    etat.brisees = 1;
    flushSync();
    expect(tous("[data-test=prevue]")).toEqual(["Caisse prévue : 36.", "Caisse prévue : 30."]);
    expect(entendu("[data-test=prevue]")).toBe("Caisse prévue : trente-six.");
  });

  it("ne l'écrivent qu'à la prochaine échéance avec ce qui monte", () => {
    monter((e) => {
      e.objets = ["s4-jauge"];
      e.brisees = 1;
    });
    expect(tous(".echeance")).toEqual([
      "Dû à la 1ʳᵉ crue : 12. une mesure d'orge Caisse prévue : 36. Solder",
      "Dû à la 2ᵉ crue : 16. une mesure d'orge Solder",
    ]);
  });

  it("sont reconnus au livre sous leur nom d'en bas", () => {
    monter((e) => {
      e.livre.push({ cle: "livre.eveil", valeurs: {}, objet: "s5-voix" });
      e.livre.push({ cle: "livre.eveil", valeurs: {}, objet: "s4-conduite" });
      e.ecrites += 2;
    });
    expect(tous(".livre li").slice(-2)).toEqual([
      "Les témoins ont reconnu le gage qui chante.",
      "Les témoins ont reconnu le grave qui dure.",
    ]);
  });
});

describe("le livre et son aide (fiche, § 11)", () => {
  it("écrit en tête, toujours, que les échéances tombent qu'on soit là ou non", () => {
    const { avancer } = monter();
    expect(texte("[data-test=entree]")).toBe(
      "Les échéances tombent à leur crue, qu'on soit là ou non.",
    );
    avancer(40 * CRUE);
    expect(texte("[data-test=entree]")).toBe(
      "Les échéances tombent à leur crue, qu'on soit là ou non.",
    );
  });

  it("ouvre l'aide, la note pour l'acte « sans aide », y met le focus, et la referme par Échap", () => {
    let consultations = 0;
    const etat = $state(etatInitial());
    composant = mount(Vue, {
      target: document.body,
      props: {
        etat,
        agir: () => {},
        noyau: { ...commandes, ouvrirAide: () => consultations++ },
        o: (cle: string) => strate.textes[cle] ?? `?${cle}`,
        lisible: () => true,
        mode: "jeu",
        son: silence,
      },
    });
    flushSync();
    const lien = document.querySelector<HTMLButtonElement>("[data-test=lien-aide]")!;
    expect(lien.getAttribute("aria-expanded")).toBe("false");
    lien.click();
    flushSync();
    expect(consultations).toBe(1);
    const aide = document.querySelector<HTMLElement>("[data-test=aide]")!;
    expect(document.activeElement).toBe(aide);
    expect(tous("[data-test=aide] dt")).toEqual([
      "La promesse",
      "L'échéance",
      "Le report",
      "La confiance",
      "Les tablettes",
      "Les sceaux",
    ]);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    flushSync();
    expect(document.querySelector("[data-test=aide]")).toBeNull();
    expect(document.activeElement).toBe(lien);
  });

  it("donne une infobulle à la caisse, au rapport, à la confiance, aux termes et à « Solder »", () => {
    monter();
    expect(document.querySelector(".caisse .libelle")!.getAttribute("title")).toBe("Ce qu'on a.");
    expect(document.querySelector(".confiance")!.getAttribute("title")).toBe(
      "Ce qu'on peut devoir, au plus.",
    );
    expect(document.querySelector(".rapport")!.getAttribute("title")).toBeTruthy();
    expect(boutons("[data-sorte=orge]")[0]!.getAttribute("title")).toBeTruthy();
    expect(boutons(".echeance")[0]!.getAttribute("title")).toBe(
      "Honorer avant le terme, au plein montant.",
    );
  });
});

describe("la direction artistique (fiche, § 6)", () => {
  it("écrit chaque sceau en empreinte ronde : le caractère reste dans le texte, sans se voir", () => {
    monter((etat) => {
      etat.caisse = 125e9;
    });
    const sceaux = [...document.querySelectorAll(".caisse .montant .sceau")];
    expect(sceaux.map((s) => s.textContent)).toEqual(["●", "●", "●"]);
    expect(texte(".caisse .montant")).toBe("125 ●●●");
  });

  it("écrit ce qu'on doit à l'encre rouge, et ce qui reste à l'encre noire", () => {
    monter();
    expect(texte(".etat-confiance .doit")).toBe("Dû : 28");
    expect(texte(".etat-confiance")).toBe("Dû : 28 sur 60");
    expect(entendu(".etat-confiance")).toBe("Dû : vingt-huit sur soixante");
    const part = document.querySelector<HTMLElement>(".confiance .part")!;
    expect(Number.parseFloat(part.style.width)).toBeCloseTo((28 / 60) * 100, 6);
  });

  it("creuse les encoches des exemplaires qui restent, et trace à peine celles des promis", () => {
    monter();
    expect(document.querySelectorAll("[data-sorte=orge] .entaille")).toHaveLength(EXEMPLAIRES);
    expect(document.querySelectorAll("[data-sorte=orge] .entaille.promise")).toHaveLength(2);
    expect(document.querySelectorAll("[data-sorte=huile] .entaille.promise")).toHaveLength(0);
  });

  it("empile en morceaux, sous la tablette ouverte, les tablettes brisées", () => {
    const { etat } = monter();
    expect(document.querySelector(".tas-brisees")).toBeNull();
    etat.brisees = 2;
    flushSync();
    const tas = [...document.querySelectorAll("[data-test=brisee]")];
    expect(tas).toHaveLength(2);
    for (const tablette of tas) expect(tablette.querySelectorAll("path")).toHaveLength(3);
    expect(texte(".brisees")).toBe("Tablettes brisées : 2");
  });

  it("dresse au bord droit le compte des crues, qui porte son nom, piqué de rouge aux échéances", () => {
    const { actions, appliquer } = monter();
    expect(document.querySelector("[data-test=compte]")!.getAttribute("aria-label")).toBe(
      "Le compte des crues",
    );
    expect(texte(".compte .nom")).toBe("Le compte des crues");
    expect(document.querySelectorAll("[data-test=a-venir]")).toHaveLength(20);
    expect(document.querySelectorAll("[data-test=deposee]")).toHaveLength(25);
    // Les deux mesures d'orge, à la 1ʳᵉ et à la 2ᵉ crue.
    expect(document.querySelectorAll("[data-test=piqure]")).toHaveLength(2);
    boutons("[data-sorte=orge]")[1]!.click();
    expect(actions).toEqual([{ type: "promettre", promesse: "orge", terme: 6 }]);
    appliquer();
    expect(document.querySelectorAll("[data-crue='6'] [data-test=piqure]")).toHaveLength(1);
  });

  it("y dépose une couche à chaque crue : la bande descend d'un cran sous le présent", () => {
    const { avancer } = monter();
    const haut = () => document.querySelector("[data-test=deposee]")!.getAttribute("data-crue");
    const place = (crue: number) =>
      document.querySelector<SVGElement>(`[data-crue='${crue}']`)!.style.transform;
    expect(haut()).toBe("0");
    const avant = place(1);
    avancer(CRUE);
    expect(haut()).toBe("1");
    expect(place(1)).not.toBe(avant);
    expect(document.querySelectorAll("[data-test=piqure]")).toHaveLength(1);
  });

  it("y fait de la grande crue, une fois fixée, une couche épaisse", () => {
    monter((etat) => {
      etat.grandeCrue = 12;
    });
    const grande = document.querySelector(".couche.grande rect")!;
    expect(grande.getAttribute("height")).toBe("24");
    expect(document.querySelector(".couche.grande")!.getAttribute("data-crue")).toBe("12");
  });

  it("y arrête le compte à l'issue : la couche de l'issue reste la dernière déposée", () => {
    const { etat } = monter((e) => {
      e.issue = "defaut";
      e.issueA = 10 * CRUE;
      e.crues = 10;
      e.temps = 10 * CRUE;
    });
    expect(document.querySelector("[data-test=couche-issue]")).not.toBeNull();
    etat.crues = 25;
    etat.temps = 25 * CRUE;
    flushSync();
    expect(document.querySelector("[data-test=deposee]")!.getAttribute("data-crue")).toBe("10");
  });
});

describe("l'opacité (fiche, § 7)", () => {
  /** Rien que des glyphes de la dette, un par mot : jamais le disque plein, qui est son sceau. */
  const enGlyphes = new RegExp(`^[${strate.glyphes}]( [${strate.glyphes}])*$`, "u");

  it("écrit en glyphes le nom d'une sorte encore opaque ; son prix, son rapport et ses termes restent lisibles", () => {
    monter(() => {}, "jeu", ["nom.orge"]);
    const [orge, huile] = tous(".sorte h3");
    expect(orge).toMatch(enGlyphes);
    expect(orge).not.toMatch(/●/);
    expect(huile).toBe("une jarre d'huile");
    expect(texte("[data-sorte=orge] .rapporte")).toBe("rapporte 3 par crue");
    expect(tous("[data-sorte=orge] button")[0]).toBe("à 2 crues : 20, à la 2ᵉ");
    // L'échéancier aussi le tait, sans rien cacher de ce qui est dû.
    expect(tous(".echeance .promesse")[0]).toMatch(enGlyphes);
    expect(tous(".echeance .du")).toEqual(["Dû à la 1ʳᵉ crue : 12.", "Dû à la 2ᵉ crue : 16."]);
  });

  it("montre la confiance en barre sans échelle tant que sa valeur est opaque", () => {
    monter(() => {}, "jeu", ["confiance"]);
    expect(document.querySelector(".etat-confiance")).toBeNull();
    expect(texte(".confiance .libelle")).toBe("La confiance");
    const part = document.querySelector<HTMLElement>(".confiance .part")!;
    expect(part.style.width).toBe(`${(28 / 60) * 100}%`);
  });

  it("écrit « Reporté. » tant que le report est opaque : sa crue et sa majoration se lisent à l'échéancier", () => {
    const { etat, avancer } = monter(() => {}, "jeu", ["report"]);
    etat.caisse = 0;
    etat.honore = 100;
    etat.echeances = [
      { numero: 1, promesse: "orge", crue: 1, du: 9, origine: 9, prix: 9, reports: 0 },
    ];
    avancer(CRUE);
    expect(tous(".livre li").at(-1)).toBe("Reporté.");
    expect(document.querySelector(".livre li:last-child")!.classList.contains("rouge")).toBe(true);
    expect(tous(".echeance .du")).toEqual(["Dû à la 3ᵉ crue : 4."]);
    expect(tous(".echeance .reports")).toEqual(["reportée 1 fois"]);
  });

  it("tait dans l'aide les majorations des termes, et le report, encore opaques", () => {
    monter(() => {}, "jeu", ["majorations", "report"]);
    document.querySelector<HTMLButtonElement>("[data-test=lien-aide]")!.click();
    flushSync();
    const [promesse, , report] = tous("[data-test=aide] dd");
    expect(promesse).toMatch(/^Une promesse rapporte à chaque crue, dès qu'elle est faite\. /);
    expect(promesse).not.toMatch(/majoré|%/);
    expect(report).toMatch(enGlyphes);
  });

  it("dit dans l'aide les majorations une fois levées", () => {
    monter();
    document.querySelector<HTMLButtonElement>("[data-test=lien-aide]")!.click();
    flushSync();
    expect(tous("[data-test=aide] dd")[0]).toMatch(
      / À 2 crues, le prix tel quel ; à 6 crues, majoré de 20 % ; à 18 crues, de 60 %\.$/,
    );
  });
});

describe("le son (fiche, § 6)", () => {
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

  it("se tait à l'arrivée : la fosse à archives n'a pas de fond sonore", () => {
    const { son, noms, ambiances } = ecoute();
    monter(() => {}, "jeu", [], son);
    expect(noms()).toEqual([]);
    expect(ambiances.every(([, r]) => r.volume === 0)).toBe(true);
  });

  it("fait écrire au stylet la promesse, puis presser le sceau ; un refus, le stylet bute", () => {
    const { son, effets, noms } = ecoute();
    const { etat, appliquer } = monter(() => {}, "jeu", [], son);
    boutons("[data-sorte=orge]")[0]!.click();
    expect(noms()).toEqual(["stylet", "sceau"]);
    expect(effets[1]![1]).toMatchObject({ dans: SCEAU_APRES, panoramique: PLACES.tablette });
    appliquer();
    // Trois mesures d'orge : la quatrième, à 26, passerait la confiance.
    boutons("[data-sorte=orge]")[0]!.click();
    expect(noms().slice(2)).toEqual(["bute"]);
    appliquer();
    expect(etat.livre.at(-1)!.cle).toBe("livre.refus");
  });

  it("fait écrire au stylet seul l'échéance soldée", () => {
    const { son, noms } = ecoute();
    monter(() => {}, "jeu", [], son);
    boutons("[data-echeance='2']")[0]!.click();
    expect(noms()).toEqual(["stylet"]);
  });

  it("fait passer l'eau, doucement, au bord droit, à chaque crue ; pas pour les crues d'une absence", () => {
    const { son, effets, noms } = ecoute();
    const { avancer } = monter(() => {}, "jeu", [], son);
    avancer(CRUE);
    expect(noms()).toEqual(["flot"]);
    expect(effets[0]![1]).toEqual(flotDeLaCrue(1));
    avancer(5 * CRUE);
    expect(noms()).toEqual(["flot"]);
  });

  it("fait craquer chaque tablette brisée, à gauche", () => {
    const { son, effets, noms } = ecoute();
    const { etat } = monter(() => {}, "jeu", [], son);
    etat.brisees = 1;
    flushSync();
    expect(noms()).toEqual(["brisure"]);
    expect(effets[0]![1]).toMatchObject({ panoramique: PLACES.tablette, dans: 0 });
  });

  it("fait monter l'eau pendant la grande crue ; soldée, elle se retire, puis la dernière tablette se brise", () => {
    const { son, effets, ambiances, noms } = ecoute();
    const { etat } = monter(
      (e) => {
        e.crues = 300;
        e.temps = 300 * CRUE;
        e.grandeCrue = 312;
        e.brisees = 4;
      },
      "jeu",
      [],
      son,
    );
    const eau = () => ambiances.filter(([nom]) => nom === "grande-eau").at(-1)![1];
    const depart = eau().volume;
    expect(depart).toBeGreaterThan(0);
    etat.crues = 306;
    flushSync();
    expect(eau().volume).toBeGreaterThan(depart);
    etat.issue = "soldee";
    etat.issueA = 312 * CRUE;
    etat.brisees = 5;
    flushSync();
    expect(eau()).toEqual({ volume: 0, fondu: RETRAIT });
    expect(noms()).toEqual(["reflux", "brisure"]);
    expect(effets.find(([nom]) => nom === "brisure")![1]).toMatchObject({ dans: RETRAIT });
  });

  it("se tait d'un coup en défaut : « Échu. », le silence", () => {
    const { son, ambiances, noms } = ecoute();
    const { etat } = monter(
      (e) => {
        e.crues = 300;
        e.grandeCrue = 312;
      },
      "jeu",
      [],
      son,
    );
    etat.issue = "defaut";
    etat.issueA = 312 * CRUE;
    flushSync();
    const derniere = ambiances.at(-1)!;
    expect(derniere[0]).toBe("grande-eau");
    expect(derniere[1].volume).toBe(0);
    expect(derniere[1].fondu).toBeLessThanOrEqual(0.1);
    expect(noms()).toEqual([]);
  });
});

describe("la fin", () => {
  it("s'écrit à sa place, et plus rien ne se fait : soldée", () => {
    monter((etat) => {
      etat.issue = "soldee";
      etat.echeances = [];
    });
    expect(texte(".fin")).toBe("Honoré. Plus rien n'est dû.");
    expect(boutons(".tablette").every((b) => b.disabled)).toBe(true);
    expect(texte(".vide")).toBe("Rien n'est dû.");
  });

  it("s'écrit à sa place, et plus rien ne se fait : en défaut", () => {
    monter((etat) => {
      etat.issue = "defaut";
    });
    expect(texte(".fin")).toBe("Échu. Le reste demeure dû.");
    // Le compte des crues s'est arrêté : la crue qui vient ne se compte plus.
    expect(document.querySelector("[data-test=crue]")).toBeNull();
    expect(boutons(".echeance").every((b) => b.disabled)).toBe(true);
  });

  it("fait partir une fissure de la ligne de l'issue, cinq minutes après elle, sans texte", () => {
    const { etat } = monter((e) => {
      e.issue = "defaut";
      e.issueA = 1_000;
      e.temps = 1_000 + 299;
    });
    expect(document.querySelector("[data-test=fissure]")).toBeNull();
    const texteAvant = document.body.textContent;
    etat.temps = 1_000 + 360;
    flushSync();
    const trace = document.querySelector("[data-test=fissure] path");
    expect(trace?.getAttribute("stroke-dashoffset")).toBe("0.5");
    expect(document.body.textContent).toBe(texteAvant);
  });

  it("pendant la remontée, se montre sans que rien ne s'y fasse", () => {
    const { actions } = monter(() => {}, "remontee");
    for (const b of boutons(".dette")) {
      expect(b.disabled).toBe(true);
      b.click();
    }
    expect(actions).toEqual([]);
  });
});

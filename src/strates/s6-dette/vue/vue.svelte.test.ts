// @vitest-environment happy-dom
// La vue de la dette (fiche, § 6), en livre de comptes sobre : la caisse et la confiance, la tablette
// et ses termes, l'échéancier, les dernières lignes du livre, et la fin.
import { flushSync, mount, unmount } from "svelte";
import { afterEach, describe, expect, it } from "vitest";
import { strate } from "..";
import type { CommandesNoyau, ContexteTick, SonStrate } from "../../../noyau/logique/types";
import { logique, type ActionDette, type EtatDette } from "../logique";
import { etatInitial } from "../logique/etat";
import { CRUE, EXEMPLAIRES, montantDu, prixExemplaire, sortesDe } from "../logique/regles";
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

function monter(modifs: (etat: EtatDette) => void = () => {}, mode: "jeu" | "remontee" = "jeu") {
  const etat = $state(etatInitial());
  modifs(etat);
  const actions: ActionDette[] = [];
  composant = mount(Vue, {
    target: document.body,
    props: {
      etat,
      agir: (action: ActionDette) => actions.push(action),
      noyau: commandes,
      o: (cle: string) => strate.textes[cle] ?? `?${cle}`,
      lisible: () => true,
      mode,
      son: silence,
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
const texte = (selecteur: string) => lire(document.querySelector(selecteur)?.textContent);
const tous = (selecteur: string) =>
  [...document.querySelectorAll(selecteur)].map((e) => lire(e.textContent));
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
    expect(document.querySelector(".caisse .montant")!.getAttribute("aria-label")).toBe(
      "cent vingt-cinq milliards",
    );
    expect(texte(".caisse .montant")).toBe("125 ●●●");
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

  it("dit ce qui est honoré au livre, et l'échéance s'efface", () => {
    const { avancer } = monter();
    avancer(CRUE);
    expect(tous(".echeance .du")).toEqual(["Dû à la 2ᵉ crue : 16."]);
    expect(tous(".livre li")).toEqual([
      "Les échéances tombent à leur crue, qu'on soit là ou non.",
      "Dû à la 1ʳᵉ crue : 12. Honoré.",
    ]);
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
    expect(lire(apres[9]!.textContent)).toBe("Dû à la 1ʳᵉ crue : 12. Honoré.");
    expect(document.querySelector(".livre ol")!.getAttribute("aria-live")).toBe("polite");
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

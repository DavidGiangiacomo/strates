// Un modèle de texte coupé à ses valeurs : le montant que l'échéancier aligne à droite, ce qu'on doit
// que la confiance écrit en rouge.
import { describe, expect, it } from "vitest";
import { textes } from "../textes.fr";
import { couper, morceaux } from "./morceaux";

describe("les morceaux d'un modèle", () => {
  it("rendent le texte autour des valeurs, et chaque valeur avec son nom", () => {
    expect(morceaux("Dû à la {crue} crue : {montant}.", { crue: "4ᵉ", montant: "12" })).toEqual([
      { texte: "Dû à la " },
      { texte: "4ᵉ", nom: "crue" },
      { texte: " crue : " },
      { texte: "12", nom: "montant" },
      { texte: "." },
    ]);
    // Une valeur absente reste écrite comme dans le modèle.
    expect(morceaux("{a} et {b}", { a: "1" })).toEqual([
      { texte: "1", nom: "a" },
      { texte: " et " },
      { texte: "{b}" },
    ]);
  });

  it("coupent une ligne de l'échéancier avant son montant", () => {
    const valeurs = { crue: "4ᵉ", montant: "12" };
    expect(couper(textes.echeance!, valeurs, "montant")).toEqual(["Dû à la 4ᵉ crue :", "12."]);
    expect(couper(textes.echeancier!, valeurs, "montant")).toEqual(["Les échéances", ""]);
  });
});

// Un modèle de texte coupé à ses valeurs, pour que la vue les place ou les teinte : le montant dû,
// aligné à droite comme dans un livre de comptes ; ce qu'on doit, à l'encre rouge (fiche, § 6).

/** Un morceau de texte, et le nom de la valeur qu'il écrit, s'il en écrit une. */
export interface Morceau {
  texte: string;
  nom?: string;
}

/** Le modèle « Dû à la {crue} crue : {montant}. », rempli et coupé à chaque valeur. */
export function morceaux(modele: string, valeurs: Readonly<Record<string, string>>): Morceau[] {
  const resultat: Morceau[] = [];
  let debut = 0;
  for (const m of modele.matchAll(/\{(\w+)\}/g)) {
    const nom = m[1]!;
    if (m.index > debut) resultat.push({ texte: modele.slice(debut, m.index) });
    resultat.push(valeurs[nom] === undefined ? { texte: m[0] } : { texte: valeurs[nom], nom });
    debut = m.index + m[0].length;
  }
  if (debut < modele.length) resultat.push({ texte: modele.slice(debut) });
  return resultat;
}

/**
 * Le modèle coupé avant la valeur `nom` : ce qui la précède, sans l'espace qui l'en sépare, et ce
 * qui commence avec elle. Sans cette valeur, tout est dans la première part.
 */
export function couper(
  modele: string,
  valeurs: Readonly<Record<string, string>>,
  nom: string,
): [string, string] {
  const parts = morceaux(modele, valeurs);
  const i = parts.findIndex((m) => m.nom === nom);
  const texte = (ms: Morceau[]) => ms.map((m) => m.texte).join("");
  if (i < 0) return [texte(parts), ""];
  return [texte(parts.slice(0, i)).trimEnd(), texte(parts.slice(i))];
}

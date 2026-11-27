// Les textes du réseau (docs/strates/strate-4.md, § 11 ; bible, § 4) : la voix d'un carnet de
// relevés, la vanne, le bassin, le niveau, sans un mot de trop. Les nombres s'écrivent dans la
// notation du réseau, en pouces et en muids, les milliers séparés d'un point ; la vue les remplit.
export const textes: Record<string, string> = {
  // ——— Les nœuds du plan, tels que le carnet les nomme
  "noeud.source1": "Source 1",
  "noeud.source2": "Source 2",
  "noeud.source3": "Source 3",
  "noeud.source4": "Source 4",
  "noeud.source5": "Source 5",
  "noeud.source6": "Source 6",
  "noeud.bas": "Bassin bas",
  "noeud.milieu": "Bassin du milieu",
  "noeud.haut": "Bassin haut",
  "noeud.quatrieme": "Quatrième bassin",
  "noeud.citerne": "Citerne",
  "noeud.ville": "Ville",

  // ——— Le carnet de relevés : une ligne par fait (§ 11)
  "carnet.reliee": "Source {source} : reliée.",
  "carnet.aPlein": "Source {source} : à plein. {debit}.",
  "carnet.posee": "Conduite {conduite} : posée.",
  "carnet.grandeConduite": "Grande conduite : posée.",
  "carnet.elargie": "Conduite {conduite} : élargie. {debit}.",
  "carnet.auPlusLarge": "Conduite {conduite} : au plus large. {debit}.",
  "carnet.vanne.0": "Vanne {conduite} : fermée.",
  "carnet.vanne.1": "Vanne {conduite} : ouverte d'un quart.",
  "carnet.vanne.2": "Vanne {conduite} : ouverte de moitié.",
  "carnet.vanne.3": "Vanne {conduite} : ouverte aux trois quarts.",
  "carnet.vanne.4": "Vanne {conduite} : ouverte.",
  "carnet.monte": "{noeud} : monte.",
  "carnet.deborde": "{noeud} : déborde.",
  "carnet.goulot": "Conduite {conduite} : goulot.",
  "carnet.goulotAuPlusLarge": "Conduite {conduite} : goulot, au plus large.",
  "carnet.stable": "{noeud} : stable.",
  "carnet.aucun": "Aucun goulot.",
  "carnet.depuisUne": "Aucun goulot depuis 1 minute.",
  "carnet.depuis": "Aucun goulot depuis {minutes} minutes.",
  "carnet.voutee": "Quatrième bassin : une salle voûtée.",
  "carnet.citerne": "Citerne qui chante : pleine.",

  // ——— L'interface
  plan: "Plan",
  carnet: "Carnet de relevés",
  regard: "Regard",
  vanne: "Vanne",
  provision: "Provision",
  compteur: "Compteur",
  "ville.recoit": "La ville reçoit {debit}.",
  "regard.conduite": "Conduite {conduite} : {debit} sur {capacite}.",
  "regard.vanne": "Vanne {ouverture}.",
  "regard.choisir": "Choisir une conduite.",
  "geste.elargir": "élargir, {prix}",
  "geste.auPlusLarge": "au plus large",
  "geste.relier": "relier, {prix}",
  "trace.libre": "Tracé {conduite}, de {de} à {vers} : relier, {prix}.",
  "trace.pose": "Conduite {conduite}, de {de} à {vers} : {debit} sur {capacite}.",
  "ouverture.0": "fermée",
  "ouverture.1": "ouverte d'un quart",
  "ouverture.2": "ouverte de moitié",
  "ouverture.3": "ouverte aux trois quarts",
  "ouverture.4": "ouverte",
  "noeud.monte": "{noeud}, monte",
  "source.sansDebit": "{noeud}, sans débit écrit",

  // ——— Les formules réelles (§ 7), au-delà de κ = 50 : hors du budget de mots
  "formule.pouce": "Un pouce verse un muid par minute.",
  "formule.calibre": "Calibre 1 : 10 pouces ; chaque calibre porte dix fois le précédent.",
  "formule.montee":
    "Une source reliée donne d'abord le mille vingt-quatrième de son débit, et double toutes les deux minutes et demie, jusqu'à son plein.",
  "formule.partage":
    "L'eau se partage à parts égales ; une conduite pleine laisse le reste aux autres.",
  "formule.vanne": "Vanne ouverte d'un quart : le quart du calibre.",
  "formule.contenance": "Un bassin tient deux minutes de ce que ses conduites emportent.",
  "formule.prix":
    "Calibre 1 : 2 muids, calibre 2 : 24 muids, et dix fois plus à chaque calibre ; trois fois plus sur les routes lointaines.",
  "formule.valeur": "Valeur : toute l'eau reçue par la ville.",

  // ——— Le retour d'une absence (§ 10)
  "absence.recu": "La ville a reçu {muids}.",
  "absence.deborde": "{noeud} : a débordé.",
};

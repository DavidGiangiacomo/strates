// Les textes du réseau (docs/strates/strate-4.md, § 11 ; bible, §§ 2, 4 et 9) : la voix d'un carnet
// de relevés. La vanne, le bassin, le niveau, sans un mot de trop, à la troisième personne : pas de
// « vous », pas d'exclamation, pas de conseil. Les nombres s'y glissent par `{cle}`, déjà écrits dans
// la notation du réseau : les débits en pouces et en lignes, les volumes en muids, en entier, les
// milliers séparés d'un point. Les noms d'en bas des objets de l'atelier sont au catalogue
// (noyau/logique/catalogue.ts) ; les traces (`trace.*`) se lisent au fond, et comptent dans son budget.
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
  // Le quatrième bassin se révèle à la première conduite qu'on y pose : c'est la citerne (§ 3).
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
  // Le signal : le déversoir coule, puis le carnet nomme les conduites pleines sous le nœud.
  "carnet.deborde": "{noeud} : déborde.",
  "carnet.goulot": "Conduite {conduite} : goulot.",
  "carnet.goulotAuPlusLarge": "Conduite {conduite} : goulot, au plus large.",
  "carnet.stable": "{noeud} : stable.",
  "carnet.aucun": "Aucun goulot.",
  "carnet.depuisUne": "Aucun goulot depuis 1 minute.",
  "carnet.depuis": "Aucun goulot depuis {minutes} minutes.",
  // Le reste (bible, § 3) : une salle voûtée, immense. Pleine, elle bourdonne. C'est la nef du chœur.
  "carnet.voutee": "Quatrième bassin : une salle voûtée.",
  "carnet.citerne": "Citerne qui chante : pleine.",
  // L'éveil d'un objet d'en haut, sous son nom d'en bas (bible, § 6), pour #84.
  "carnet.eveil": "{objet} : en service.",

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
  "plan.libre": "Tracé {conduite}, de {de} à {vers} : relier, {prix}.",
  "plan.pose": "Conduite {conduite}, de {de} à {vers} : {debit} sur {capacite}.",
  "ouverture.0": "fermée",
  "ouverture.1": "ouverte d'un quart",
  "ouverture.2": "ouverte de moitié",
  "ouverture.3": "ouverte aux trois quarts",
  "ouverture.4": "ouverte",
  "noeud.monte": "{noeud}, monte",
  "source.sansDebit": "{noeud}, sans débit écrit",

  // ——— La notice du réseau : l'aide, comme la notice d'un carnet de fontainier. Elle constate les
  // règles, et ne conseille rien ; elle ne dit pas où chercher un goulot, ni rien de la fin.
  aide: "Aide",
  "aide.titre": "Notice du réseau",
  "aide.fermer": "Refermer",
  "aide.eau.titre": "L'eau",
  "aide.eau":
    "L'eau va des sources à la ville, de bassin en bassin, par les conduites. Une source reliée donne d'abord un filet, puis double toutes les deux minutes et demie, jusqu'à son plein.",
  "aide.calibre.titre": "Le calibre",
  "aide.calibre":
    "Une conduite porte au plus son calibre : dix pouces au premier, dix fois plus à chaque calibre. Chaque tracé a son calibre le plus fort.",
  "aide.partage.titre": "Le partage",
  "aide.partage":
    "L'eau qui sort d'un bassin se partage à parts égales entre ses conduites ; ce qu'une conduite pleine ne prend pas va aux autres. Une vanne, réglée au quart, ne laisse passer que sa part du calibre.",
  "aide.bassin.titre": "Le bassin",
  "aide.bassin":
    "Un bassin tient deux minutes de ce que ses conduites emportent. S'il reçoit davantage, il monte, puis déborde : l'eau du déversoir est perdue.",
  "aide.mesures.titre": "Les mesures",
  "aide.mesures":
    "Un pouce vaut cent quarante-quatre lignes, et verse un muid par minute. Le regard d'une conduite donne son débit, son calibre et sa vanne.",

  // ——— L'écran de fouille : la valeur convertible, l'eau reçue.
  "fouille.valeur": "Eau reçue par la ville",

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

  // ——— Les traces pour le fond (bible, § 5) : le dernier relevé, tel que le joueur l'a laissé (une
  // ligne du carnet), le temps sans goulot jusqu'à la descente, et la citerne. Elles comptent dans le
  // budget du fond.
  "trace.sansGoulot": "Aucun goulot depuis {minutes} minutes.",
  "trace.sansGoulotUne": "Aucun goulot depuis 1 minute.",
  "trace.citerne": "Citerne qui chante : pleine.",
};

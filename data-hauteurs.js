/* Hauteur adulte des plantes, en centimètres.
   Sert à calculer l'ombre qu'une plante projette sur ses voisines : c'est
   un vrai levier de permaculture (le maïs qui abrite les salades de l'été),
   et une vraie erreur quand on l'ignore (le tournesol qui étouffe les carottes).

   Valeurs indicatives, pour une conduite classique au potager.
   Plante absente de cette liste = considérée à 60 cm. */

const HAUTEURS = {

  /* --- Légumes --- */
  "tomate": 150, "courgette": 60, "concombre": 180, "aubergine": 90, "poivron": 70,
  "haricot-nain": 45, "haricot-rame": 200, "pois": 80, "feve": 100,
  "carotte": 40, "radis": 20, "navet": 30, "betterave": 40, "panais": 45,
  "pomme-de-terre": 60, "oignon": 40, "ail": 40, "echalote": 35, "poireau": 60,
  "laitue": 25, "mache": 12, "roquette": 30, "epinard": 30, "blette": 60,
  "chou-pomme": 50, "chou-fleur": 60, "brocoli": 70, "chou-kale": 90, "chou-bruxelles": 90,
  "celeri-branche": 60, "celeri-rave": 50, "fenouil-bulbe": 60,
  "artichaut": 150, "asperge": 150, "butternut": 40, "potiron": 40,
  "mais-doux": 220, "topinambour": 250, "chicoree": 30, "pourpier": 15, "oseille": 50,
  "capucine": 30, "oeillet-inde": 30,

  /* --- Fruits --- */
  "fraisier": 25, "melon": 40, "pasteque": 40, "physalis": 120, "rhubarbe": 100,
  "framboisier": 180, "groseillier": 130, "cassissier": 150, "groseillier-maquereau": 120,
  "murier": 200, "myrtillier": 150, "vigne": 250, "kiwai": 400, "noisetier": 400,
  "pommier": 400, "poirier": 450, "prunier": 400, "cerisier": 500, "pecher": 350, "figuier": 350,

  /* --- Aromatiques --- */
  "basilic": 40, "persil": 30, "ciboulette": 30, "thym": 30, "romarin": 120,
  "sauge": 70, "origan": 50, "marjolaine": 40, "menthe": 60, "coriandre": 50,
  "aneth": 100, "estragon": 100, "laurier-sauce": 300, "cerfeuil": 40, "liveche": 200,
  "sarriette": 40, "melisse": 70, "ail-des-ours": 30, "lavande": 60, "raifort": 100,

  /* --- Médicinales --- */
  "calendula": 50, "camomille-romaine": 25, "camomille-matricaire": 50, "echinacea": 100,
  "achillee": 70, "millepertuis": 60, "valeriane": 150, "bourrache": 80, "consoude": 100,
  "ortie": 120, "plantain": 30, "reine-des-pres": 120, "mauve": 100, "bouillon-blanc": 200,
  "guimauve": 150, "bardane": 150, "pissenlit": 25, "passiflore": 400, "aubepine": 400,
  "sureau": 400, "hysope": 50, "verveine-citronnelle": 150, "angelique": 200, "tanaisie": 100,

  /* --- Légumes complémentaires et perpétuels --- */
  "cornichon": 150, "chou-rave": 35, "chou-chinois": 40, "pois-gourmand": 150,
  "epinard-fraise": 50, "cresson-de-terre": 25, "roquette-sauvage": 40,
  "chou-daubenton": 120, "poireau-perpetuel": 45, "oignon-rocambole": 120, "ciboule": 45,
  "crosne": 60, "cardon": 150, "salsifis": 100, "scorsonere": 100, "chervis": 120,
  "arroche": 150, "tetragone": 40, "chenopode-bon-henri": 60, "poire-de-terre": 200,

  /* --- Aromatiques complémentaires --- */
  "ciboule-chine": 40, "fenouil-bronze": 180, "sauge-ananas": 120, "absinthe": 100,
  "rue": 70, "nepeta": 80, "shiso": 60, "stevia": 60,

  /* --- Médicinales complémentaires --- */
  "melilot": 120, "onagre": 150, "aigremoine": 80, "alchemille": 40,
  "armoise": 150, "salicaire": 120, "agastache": 90,

  /* --- Engrais verts --- */
  "phacelie": 80, "moutarde-blanche": 70, "seigle": 150, "vesce": 60,
  "trefle-incarnat": 40, "sarrasin": 80
};

const HAUTEUR_PAR_DEFAUT = 60;

/* Seuils : à partir de 150 cm, une plante fait de l'ombre à ses voisines */
const HAUTEUR_OMBRAGEANTE = 150;
const HAUTEUR_BASSE = 45;

function hauteurPlante(plante) {
  if (!plante) return HAUTEUR_PAR_DEFAUT;
  return HAUTEURS[plante.id] != null ? HAUTEURS[plante.id] : HAUTEUR_PAR_DEFAUT;
}

function classeHauteur(plante) {
  const h = hauteurPlante(plante);
  if (h >= HAUTEUR_OMBRAGEANTE) return "haute";
  if (h <= HAUTEUR_BASSE) return "basse";
  return "moyenne";
}

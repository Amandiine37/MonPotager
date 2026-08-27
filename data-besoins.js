/* Références pour le calcul d'autosuffisance
   -------------------------------------------
   kg     : consommation annuelle indicative d'UN adulte, en kilos
   parM2  : rendement moyen en kilos par mètre carré cultivé
   piece  : poids moyen d'une unité (une salade, un poireau, une tête d'ail…)
   botte  : poids moyen d'une botte

   Ces valeurs sont des moyennes de jardin, pas une vérité : un potager bien
   conduit fait mieux, une année sèche fait moins. Elles servent à donner un
   ordre de grandeur, pas une comptabilité.

   Les aromatiques et les médicinales ne figurent pas ici : on ne mesure pas
   son autonomie en thym ou en camomille, quelques pieds suffisent toujours. */

const BESOINS = {

  /* --- Les gros pourvoyeurs de calories --- */
  "pomme-de-terre": { kg: 45, parM2: 3,   piece: 0.15 },
  "butternut":      { kg: 8,  parM2: 3,   piece: 1.5 },
  "potiron":        { kg: 8,  parM2: 4,   piece: 2.5 },
  "topinambour":    { kg: 3,  parM2: 4 },
  "mais-doux":      { kg: 3,  parM2: 1.5, piece: 0.25 },

  /* --- Légumes-fruits d'été --- */
  "tomate":         { kg: 20, parM2: 5,   piece: 0.15 },
  "courgette":      { kg: 10, parM2: 5,   piece: 0.5 },
  "concombre":      { kg: 5,  parM2: 6,   piece: 0.4 },
  "aubergine":      { kg: 4,  parM2: 4,   piece: 0.3 },
  "poivron":        { kg: 4,  parM2: 3,   piece: 0.15 },
  "melon":          { kg: 4,  parM2: 2,   piece: 1.2 },

  /* --- Légumineuses --- */
  "haricot-nain":   { kg: 6,  parM2: 1.5 },
  "haricot-rame":   { kg: 4,  parM2: 3 },
  "pois":           { kg: 4,  parM2: 1 },
  "feve":           { kg: 3,  parM2: 1.5 },

  /* --- Racines et bulbes --- */
  "carotte":        { kg: 12, parM2: 4,   piece: 0.1,  botte: 0.6 },
  "betterave":      { kg: 5,  parM2: 4,   piece: 0.25, botte: 0.8 },
  "navet":          { kg: 3,  parM2: 3,   piece: 0.2,  botte: 0.6 },
  "panais":         { kg: 3,  parM2: 3,   piece: 0.3 },
  "radis":          { kg: 2,  parM2: 2,   botte: 0.2 },
  "celeri-rave":    { kg: 2,  parM2: 3,   piece: 0.8 },
  "oignon":         { kg: 9,  parM2: 3,   piece: 0.12 },
  "ail":            { kg: 1,  parM2: 1.5, piece: 0.06 },
  "echalote":       { kg: 1.5, parM2: 1.5, piece: 0.03 },
  "poireau":        { kg: 8,  parM2: 4,   piece: 0.25, botte: 1.2 },

  /* --- Feuilles et salades --- */
  "laitue":         { kg: 6,  parM2: 2.5, piece: 0.3 },
  "mache":          { kg: 1.5, parM2: 1 },
  "roquette":       { kg: 1,  parM2: 1.5 },
  "epinard":        { kg: 4,  parM2: 2 },
  "blette":         { kg: 5,  parM2: 4,   piece: 0.5 },
  "chicoree":       { kg: 3,  parM2: 2.5, piece: 0.5 },
  "oseille":        { kg: 1,  parM2: 2 },
  "pourpier":       { kg: 0.5, parM2: 1.5 },

  /* --- Choux --- */
  "chou-pomme":     { kg: 6,  parM2: 4,   piece: 1.2 },
  "chou-fleur":     { kg: 4,  parM2: 3,   piece: 1 },
  "brocoli":        { kg: 3,  parM2: 2,   piece: 0.5 },
  "chou-kale":      { kg: 3,  parM2: 3,   piece: 0.8 },
  "chou-bruxelles": { kg: 2,  parM2: 2 },

  /* --- Divers --- */
  "celeri-branche": { kg: 2,  parM2: 4,   piece: 0.6 },
  "fenouil-bulbe":  { kg: 2,  parM2: 2.5, piece: 0.35 },
  "artichaut":      { kg: 2,  parM2: 2,   piece: 0.35 },
  "asperge":        { kg: 1.5, parM2: 0.5, botte: 0.5 },
  /* --- Légumes complémentaires et perpétuels --- */
  "cornichon":      { kg: 2,  parM2: 4,   piece: 0.03 },
  "chou-rave":      { kg: 3,  parM2: 4,   piece: 0.3 },
  "chou-chinois":   { kg: 3,  parM2: 4,   piece: 1 },
  "pois-gourmand":  { kg: 4,  parM2: 1.5 },
  "epinard-fraise": { kg: 1,  parM2: 2 },
  "cresson-de-terre": { kg: 1, parM2: 1.5 },
  "roquette-sauvage": { kg: 1, parM2: 1.5 },
  "chou-daubenton": { kg: 4,  parPied: 3 },
  "poireau-perpetuel": { kg: 3, parM2: 3 },
  "oignon-rocambole": { kg: 1, parM2: 1.5 },
  "ciboule":        { kg: 1,  parM2: 2 },
  "crosne":         { kg: 2,  parM2: 2 },
  "cardon":         { kg: 2,  parM2: 3,   piece: 1.5 },
  "salsifis":       { kg: 2,  parM2: 2.5 },
  "scorsonere":     { kg: 2,  parM2: 2.5 },
  "chervis":        { kg: 2,  parM2: 2.5 },
  "arroche":        { kg: 2,  parM2: 2.5 },
  "tetragone":      { kg: 3,  parM2: 3 },
  "chenopode-bon-henri": { kg: 2, parM2: 2 },
  "poire-de-terre": { kg: 5,  parPied: 4 },

  /* --- Fruits du potager (au mètre carré) --- */
  "rhubarbe":       { kg: 3,  parM2: 3 },
  "fraisier":       { kg: 4,  parM2: 1.5 },
  "melon":          { kg: 4,  parM2: 2,   piece: 1.2 },
  "pasteque":       { kg: 3,  parM2: 2.5, piece: 4 },
  "physalis":       { kg: 1,  parM2: 1.5 },

  /* --- Petits fruits et fruitiers (au pied : un arbre, pas des m²) --- */
  "framboisier":    { kg: 4,  parPied: 1.5 },
  "groseillier":    { kg: 2,  parPied: 4 },
  "cassissier":     { kg: 2,  parPied: 4 },
  "groseillier-maquereau": { kg: 1.5, parPied: 4 },
  "murier":         { kg: 3,  parPied: 8 },
  "myrtillier":     { kg: 2,  parPied: 3 },
  "vigne":          { kg: 5,  parPied: 8 },
  "kiwai":          { kg: 3,  parPied: 15 },
  "noisetier":      { kg: 1.5, parPied: 4 },
  "pommier":        { kg: 25, parPied: 60 },
  "poirier":        { kg: 12, parPied: 40 },
  "prunier":        { kg: 8,  parPied: 40 },
  "cerisier":       { kg: 6,  parPied: 30 },
  "pecher":         { kg: 6,  parPied: 25 },
  "figuier":        { kg: 4,  parPied: 20 }
};

/* Conseils affichés selon le niveau d'autonomie atteint */
const PALIERS_AUTONOMIE = [
  { min: 100, titre: "Autonomie atteinte",       emoji: "🏆",
    texte: "Tu produis de quoi couvrir les besoins de ton foyer. Pense maintenant à la conservation : congélation, lacto-fermentation, séchage, cave. C'est là que se joue le fait de manger son potager toute l'année." },
  { min: 75,  titre: "Presque autonome",         emoji: "🌟",
    texte: "Il ne manque plus grand-chose. Regarde d'abord les légumes qui se conservent longtemps (pommes de terre, courges, oignons, carottes) : ce sont eux qui font tenir l'hiver." },
  { min: 50,  titre: "Belle production",         emoji: "🌿",
    texte: "Tu couvres la moitié de tes besoins. Pour progresser sans agrandir : échelonne tes semis, occupe les planches libérées, et ajoute des légumes d'hiver (mâche, poireaux, choux)." },
  { min: 25,  titre: "Le potager nourrit déjà",  emoji: "🌱",
    texte: "Un quart des besoins, c'est déjà beaucoup de repas. Concentre-toi sur les légumes à gros rendement au mètre carré : courgettes, tomates, blettes, courges." },
  { min: 0,   titre: "Début de récolte",         emoji: "🌾",
    texte: "Tout commence. Note tes récoltes au fil de l'été : c'est en les mesurant une première année que tu sauras quoi ajuster la suivante." }
];

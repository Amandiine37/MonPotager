/* ============================================================
   Mon Potager — Plan du potager
   Un plan = une grille de mailles. On donne les dimensions, on
   découpe la forme si besoin, puis on « peint » les plantes.
   L'appli surveille les associations et propose les meilleurs
   emplacements.
   ============================================================ */

const MAILLES = [
  { m: 0.25, label: "25 cm — précis" },
  { m: 0.5,  label: "50 cm — recommandé" },
  { m: 1,    label: "1 m — vue d'ensemble" }
];

const MAX_CELLULES = 3000;   // au-delà, l'affichage devient poussif

/* Palette de couleurs distinctes, attribuées dans l'ordre d'utilisation */
const COULEURS_PLAN = [
  "#c0392b", "#27ae60", "#2980b9", "#d68910", "#8e44ad", "#16a085",
  "#d35400", "#2c3e50", "#7f8c8d", "#c2185b", "#558b2f", "#00838f",
  "#6d4c41", "#5e35b1", "#ef6c00", "#00695c", "#ad1457", "#37474f",
  "#9e9d24", "#4527a0"
];

/* Ce qu'on peut poser sur une case sans que ce soit une culture :
   c'est ce qui permet de faire reposer la terre, et l'appli en tient compte
   dans la rotation. Les identifiants commencent par « couv- » pour ne jamais
   se confondre avec un identifiant de plante. */
const COUVERTURES = {
  "couv-repos": {
    id: "couv-repos", nom: "Repos (sol paillé)", emoji: "🍂", couleur: "#a1887f",
    detail: "Case laissée au repos sous un paillage épais. Le sol se reconstitue, la vie souterraine travaille, et rien ne prélève.",
    nourrit: 1
  },
  "couv-engrais-vert": {
    id: "couv-engrais-vert", nom: "Engrais vert", emoji: "🌾", couleur: "#8bc34a",
    detail: "Phacélie, moutarde, seigle-vesce, féverole… Couvre le sol, le structure en profondeur et le nourrit quand on le couche sur place.",
    nourrit: 2
  }
};

const DUREE_ROTATION = 4;        // années avant de refaire la même famille
const REPOS_CONSEILLE = 4;       // années sans repos au-delà desquelles on alerte

/* ---------------- Ensoleillement et besoin en eau ----------------
   Les fiches décrivent l'exposition et l'arrosage en toutes lettres.
   On les interprète ici plutôt que de dupliquer l'information. */

const EXPOSITIONS = {
  "ombre":     { niveau: 0, nom: "Ombre",       emoji: "🌑", couleur: "#6b7b8c" },
  "mi-ombre":  { niveau: 1, nom: "Mi-ombre",    emoji: "⛅", couleur: "#9db4c0" },
  "soleil":    { niveau: 2, nom: "Plein soleil", emoji: "☀️", couleur: "#f5d78e" }
};

/* Ce que la plante demande : un niveau, ou "tolerant" si elle accepte les deux */
function besoinSoleil(plante) {
  const t = sansAccents(plante.expo || "");
  if (/craint le soleil/.test(t)) return "mi-ombre";
  if (/^ombre/.test(t)) return "ombre";
  const aSoleil = /soleil/.test(t);
  const aOmbre = /mi-ombre|ombre/.test(t);
  if (aSoleil && aOmbre) return "tolerant";
  if (aOmbre) return "mi-ombre";
  if (/plein soleil/.test(t)) return "plein-soleil";
  if (aSoleil) return "soleil";
  return "tolerant";
}

const LIBELLE_BESOIN_SOLEIL = {
  "ombre": "à l'ombre", "mi-ombre": "à mi-ombre", "tolerant": "au soleil ou à mi-ombre",
  "soleil": "au soleil", "plein-soleil": "en plein soleil"
};

/* Vérifie une plante contre l'exposition d'une case. null = tout va bien. */
function verifierSoleil(plante, expoCase) {
  const besoin = besoinSoleil(plante);
  const niveau = EXPOSITIONS[expoCase].niveau;
  /* Formulations sans pronom : les noms de plantes n'ont pas tous le même genre */
  if (besoin === "tolerant") {
    return niveau === 0 ? `${plante.nom} — la mi-ombre passe, l'ombre franche non.` : null;
  }
  if (besoin === "ombre") {
    return niveau === 2 ? `${plante.nom} — plante d'ombre, le plein soleil la grille.` : null;
  }
  if (besoin === "mi-ombre") {
    if (niveau === 2) return `${plante.nom} — préfère la mi-ombre ; au plein soleil, montée en graine ou feuilles brûlées.`;
    return null;
  }
  // soleil ou plein soleil
  if (niveau === 0) return `${plante.nom} — a besoin de soleil ; à l'ombre, pas de récolte.`;
  if (niveau === 1) return besoin === "plein-soleil"
    ? `${plante.nom} — réclame le plein soleil ; à mi-ombre, la récolte sera maigre.` : null;
  return null;
}

const EAUX = {
  0: { nom: "Peu ou pas d'eau", emoji: "🏜️" },
  1: { nom: "Arrosage modéré",  emoji: "💧" },
  2: { nom: "Arrosage régulier", emoji: "💧💧" },
  3: { nom: "Arrosage abondant", emoji: "💧💧💧" }
};

/* ---------------- Ombre portée par les plantes hautes ----------------
   Dans l'hémisphère nord, l'ombre d'une plante tombe vers le NORD.
   C'est une ressource : maïs, tournesol ou haricots à rames abritent les
   salades des coups de chaud. C'est aussi un piège si on ignore où elle tombe. */

const ORIENTATIONS = {
  haut:   { nom: "en haut du plan",   dx: 0,  dy: -1 },
  bas:    { nom: "en bas du plan",    dx: 0,  dy: 1 },
  gauche: { nom: "à gauche du plan",  dx: -1, dy: 0 },
  droite: { nom: "à droite du plan",  dx: 1,  dy: 0 }
};

function versLeNord(plan) {
  return ORIENTATIONS[plan.nord || "haut"];
}

/* Portée de l'ombre, en cases.
   En France, de mai à septembre, le soleil de mi-journée monte à 50-60° : l'ombre
   fait environ 0,6 fois la hauteur de la plante. Un maïs de 2,20 m ombre donc sur
   1,30 m, un pommier de 4 m sur 2,40 m. Plafonné à 4 m, au-delà c'est du détail. */
function porteeOmbre(plan, plante) {
  const h = hauteurPlante(plante);
  if (h < HAUTEUR_OMBRAGEANTE) return 0;
  const metres = Math.min(h / 100 * 0.6, 4);
  return Math.max(1, Math.round(metres / plan.maille));
}

/* Renvoie { "x,y": { par: plante, force: 1|2 } } pour les cases ombragées */
function ombresPortees(plan) {
  const ombres = {};
  const n = versLeNord(plan);

  Object.keys(plan.plantations).forEach(cle => {
    const id = plan.plantations[cle];
    if (estCouverture(id)) return;
    const p = PLANTE_PAR_ID[id];
    if (!p) return;
    const portee = porteeOmbre(plan, p);
    if (!portee) return;

    const [x, y] = cle.split(",").map(Number);
    for (let d = 1; d <= portee; d++) {
      const nx = x + n.dx * d, ny = y + n.dy * d;
      const cible = nx + "," + ny;
      if (!celluleValide(plan, nx, ny)) break;
      const force = d === 1 ? 2 : 1;          // plus on s'éloigne, plus l'ombre est douce
      if (!ombres[cible] || ombres[cible].force < force) {
        ombres[cible] = { par: p, force: force };
      }
    }
  });
  return ombres;
}

/* Exposition réellement subie par une case : le déclaré, assombri par les voisines hautes */
function expoEffective(plan, cle, ombres) {
  const declare = expoCase(plan, cle);
  const ombre = ombres && ombres[cle];
  if (!ombre) return declare;
  const niveau = EXPOSITIONS[declare].niveau;
  const baisse = ombre.force === 2 ? 1 : 0;   // ombre proche = un cran de moins
  const cible = Math.max(0, niveau - baisse);
  return Object.keys(EXPOSITIONS).find(k => EXPOSITIONS[k].niveau === cible);
}

function besoinEau(plante) {
  const t = sansAccents(plante.eau || "");
  if (/abondant|genereux|jamais sec/.test(t)) return 3;
  if (/regulier/.test(t)) return 2;
  if (/modere|2 premieres annees/.test(t)) return 1;
  return 0;   // aucun, très faible, faible, presque aucun…
}

function estCouverture(id) { return !!COUVERTURES[id]; }
function estEngraisVert(id) { return !!(PLANTE_PAR_ID[id] && PLANTE_PAR_ID[id].cat === "engrais"); }
function contenuCase(id) { return id ? (COUVERTURES[id] || PLANTE_PAR_ID[id] || null) : null; }

let outilPlan = { mode: "planter", planteId: "", expo: "mi-ombre" };
let planOuvert = "";
let suggestionsVisibles = false;

/* ---------------- Modèle ---------------- */

function tousLesPlans() {
  if (!Array.isArray(etat.plans)) etat.plans = [];
  return etat.plans;
}

function planCourant() {
  const plans = tousLesPlans();
  if (!plans.length) return null;
  return plans.find(p => p.id === planOuvert) || plans[0];
}

function creerPlan(nom, largeur, hauteur, maille) {
  const plan = {
    id: nouvelId(),
    nom: nom,
    couleurs: {},              // planteId → indice de couleur, figé à la 1re utilisation
    expo: {},                  // "x,y" : "mi-ombre" | "ombre"  (soleil par défaut)
    largeur: largeur,          // en mètres
    hauteur: hauteur,          // en mètres
    maille: maille,            // en mètres
    annee: anneePlanning(),
    exclues: {},               // "x,y" : true  → hors du potager
    plantations: {},           // "x,y" : planteId
    notes: ""
  };
  tousLesPlans().push(plan);
  planOuvert = plan.id;
  sauver();
  return plan;
}

function colonnes(plan) { return Math.max(1, Math.round(plan.largeur / plan.maille)); }
function rangees(plan) { return Math.max(1, Math.round(plan.hauteur / plan.maille)); }
function surfaceMaille(plan) { return plan.maille * plan.maille; }

function celluleValide(plan, x, y) {
  return x >= 0 && y >= 0 && x < colonnes(plan) && y < rangees(plan) && !plan.exclues[x + "," + y];
}

function planteEn(plan, x, y) {
  const id = plan.plantations[x + "," + y];
  return id && !estCouverture(id) ? PLANTE_PAR_ID[id] : null;
}

/* Plantes réellement cultivées sur le plan, dans l'ordre d'apparition
   (les couvertures ne sont pas des cultures) */
function plantesDuPlan(plan) {
  const vues = [];
  for (let y = 0; y < rangees(plan); y++) {
    for (let x = 0; x < colonnes(plan); x++) {
      const id = plan.plantations[x + "," + y];
      if (id && !estCouverture(id) && !vues.includes(id)) vues.push(id);
    }
  }
  return vues;
}

/* Couleur STABLE : attribuée une fois pour toutes à la première utilisation et
   mémorisée dans le plan. Auparavant elle dépendait de l'ordre d'apparition
   dans la grille, si bien qu'ajouter une plante en haut décalait les couleurs
   de toutes les autres. */
function couleurPlante(plan, id) {
  if (estCouverture(id)) return COUVERTURES[id].couleur;
  if (!id) return "#9e9e9e";
  if (!plan.couleurs) migrerCouleurs(plan);
  if (plan.couleurs[id] == null) {
    const prises = Object.values(plan.couleurs);
    let i = 0;
    while (prises.includes(i) && i < COULEURS_PLAN.length) i++;
    plan.couleurs[id] = i % COULEURS_PLAN.length;
  }
  return COULEURS_PLAN[plan.couleurs[id] % COULEURS_PLAN.length];
}

/* Plans créés avant la correction : on fige l'ordre actuel une bonne fois */
function migrerCouleurs(plan) {
  plan.couleurs = {};
  plantesDuPlan(plan).forEach((id, i) => { plan.couleurs[id] = i % COULEURS_PLAN.length; });
}

/* ---------------- Densité de plantation ----------------
   On lit l'espacement de la fiche ("50 cm entre pieds, 80 cm entre rangs")
   pour estimer le nombre de plants qui tiennent sur une surface. */

function espacementsCm(plante) {
  const valeurs = [];
  const regex = /(\d+([,.]\d+)?)\s*(cm|m)\b/gi;
  let m;
  while ((m = regex.exec(plante.esp || "")) !== null) {
    const n = parseFloat(m[1].replace(",", "."));
    valeurs.push(m[3].toLowerCase() === "m" ? n * 100 : n);
  }
  return valeurs;
}

function densiteParM2(plante) {
  const v = espacementsCm(plante);
  if (!v.length) return null;
  const a = v[0], b = v.length > 1 ? v[1] : v[0];
  if (!a || !b) return null;
  return 10000 / (a * b);
}

function surfacesParPlante(plan) {
  const compte = {};
  Object.keys(plan.plantations).forEach(cle => {
    const id = plan.plantations[cle];
    compte[id] = (compte[id] || 0) + 1;
  });
  return Object.keys(compte).map(id => {
    const p = contenuCase(id);
    const couverture = estCouverture(id);
    const surface = compte[id] * surfaceMaille(plan);
    const densite = (p && !couverture) ? densiteParM2(p) : null;
    return {
      plante: p, id: id, couverture: couverture, cellules: compte[id], surface: surface,
      nbPlants: densite ? Math.max(1, Math.round(surface * densite)) : null
    };
  }).filter(s => s.plante).sort((a, b) => b.surface - a.surface);
}

/* ---------------- Voisinage et conseils ---------------- */

/* Les 8 cases autour : c'est à cette distance que le compagnonnage agit */
function voisines(plan, x, y) {
  const liste = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (celluleValide(plan, nx, ny)) liste.push({ x: nx, y: ny, planteId: plan.plantations[nx + "," + ny] });
    }
  }
  return liste;
}

function sontAmies(a, b) {
  if (!a || !b || a.id === b.id) return false;
  return (a.amis || []).includes(b.nom) || (b.amis || []).includes(a.nom);
}

function sontEnnemies(a, b) {
  if (!a || !b || a.id === b.id) return false;
  return (a.ennemis || []).includes(b.nom) || (b.ennemis || []).includes(a.nom);
}

/* Analyse complète : conflits de voisinage, bonnes associations, rotation */
function analyserPlan(plan) {
  const conflits = {}, bonus = {};
  const cellulesEnConflit = {};

  Object.keys(plan.plantations).forEach(cle => {
    const [x, y] = cle.split(",").map(Number);
    const p = PLANTE_PAR_ID[plan.plantations[cle]];
    if (!p) return;
    voisines(plan, x, y).forEach(v => {
      const q = v.planteId ? PLANTE_PAR_ID[v.planteId] : null;
      if (!q) return;
      const paire = [p.nom, q.nom].sort().join(" ↔ ");
      if (sontEnnemies(p, q)) {
        conflits[paire] = (conflits[paire] || 0) + 1;
        cellulesEnConflit[cle] = true;
        cellulesEnConflit[v.x + "," + v.y] = true;
      } else if (sontAmies(p, q)) {
        bonus[paire] = (bonus[paire] || 0) + 1;
      }
    });
  });

  const rot = analyserRotation(plan);
  const cond = analyserConditions(plan);

  return {
    conflits: Object.keys(conflits).map(k => ({ paire: k, nb: conflits[k] })),
    bonus: Object.keys(bonus).map(k => ({ paire: k, nb: bonus[k] })),
    rotation: rot,
    conditions: cond,
    cellulesEnConflit: cellulesEnConflit,
    cellulesFatiguees: rot.cellulesFatiguees,
    cellulesMalExposees: cond.cellulesMalExposees
  };
}

/* ---------------- Ensoleillement et eau sur le plan ---------------- */

function expoCase(plan, cle) {
  return (plan.expo && plan.expo[cle]) || "soleil";
}

function analyserConditions(plan) {
  const soleil = {}, cellulesMalExposees = {};
  const surfacesEau = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const voisinagesSecsHumides = {};
  const ombres = ombresPortees(plan);
  const abris = {}, abrisPerdus = {};

  Object.keys(plan.plantations).forEach(cle => {
    const id = plan.plantations[cle];
    if (estCouverture(id)) return;
    const p = PLANTE_PAR_ID[id];
    if (!p) return;

    // Ensoleillement, ombre portée comprise
    const effective = expoEffective(plan, cle, ombres);
    const probleme = verifierSoleil(p, effective);
    if (probleme) {
      const ombre = ombres[cle];
      const texte = ombre && effective !== expoCase(plan, cle)
        ? `${probleme} Ici, l'ombre vient de ${ombre.par.nom}.`
        : probleme;
      soleil[texte] = (soleil[texte] || 0) + 1;
      cellulesMalExposees[cle] = true;
    } else if (ombres[cle] && besoinSoleil(p) !== "plein-soleil" && besoinSoleil(p) !== "soleil") {
      // Bien joué : une plante qui aime la fraîcheur, à l'abri d'une haute
      const cleAbri = p.nom + "|" + ombres[cle].par.nom;
      abris[cleAbri] = (abris[cleAbri] || 0) + 1;
    }

    // Besoin en eau : surface par niveau
    surfacesEau[besoinEau(p)] += surfaceMaille(plan);

    // Voisinage entre une assoiffée et une plante qui déteste l'eau
    const [x, y] = cle.split(",").map(Number);
    const nEau = besoinEau(p);
    voisines(plan, x, y).forEach(v => {
      const q = v.planteId && !estCouverture(v.planteId) ? PLANTE_PAR_ID[v.planteId] : null;
      if (!q) return;
      const ecart = Math.abs(nEau - besoinEau(q));
      if (ecart >= 3) {
        const paire = [p.nom, q.nom].sort().join(" ↔ ");
        voisinagesSecsHumides[paire] = true;
      }
    });
  });

  /* Ombre disponible et inutilisée : une occasion de placer une plante de fraîcheur */
  const ombreLibre = Object.keys(ombres).filter(c => !plan.plantations[c]);
  const sources = [];
  ombreLibre.forEach(c => { if (!sources.includes(ombres[c].par.nom)) sources.push(ombres[c].par.nom); });

  return {
    soleil: Object.keys(soleil).map(t => ({ texte: t, nb: soleil[t] })),
    cellulesMalExposees: cellulesMalExposees,
    surfacesEau: surfacesEau,
    arrosageIncompatible: Object.keys(voisinagesSecsHumides),
    zonesOmbre: Object.keys(plan.expo || {}).length,
    ombres: ombres,
    abris: Object.keys(abris).map(k => ({ plante: k.split("|")[0], sous: k.split("|")[1], nb: abris[k] })),
    ombreLibre: ombreLibre.length,
    sourcesOmbre: sources
  };
}

/* Plantes de la bibliothèque qui apprécieraient l'ombre portée disponible */
function candidatsOmbre() {
  return PLANTES.filter(p => {
    const b = besoinSoleil(p);
    return (b === "mi-ombre" || b === "ombre" || b === "tolerant") && classeHauteur(p) !== "haute";
  }).slice(0, 40);
}

/* ---------------- Rotation et repos de la terre ----------------
   On remonte TOUS les plans antérieurs portant le même nom, pas seulement
   l'année précédente : la règle porte sur 4 ans, et le repos compte. */

function historiqueDuPlan(plan) {
  return tousLesPlans()
    .filter(p => p.id !== plan.id && p.nom === plan.nom && p.annee < plan.annee)
    .sort((a, b) => b.annee - a.annee);
}

/* Ce qu'a porté une case au fil des ans, du plus récent au plus ancien */
function historiqueCase(plan, cle, historique) {
  return historique
    .map(p => ({ annee: p.annee, id: p.plantations[cle] }))
    .filter(e => e.id);
}

function groupeRotation(famille) {
  const r = ROTATION.find(g => g.familles.includes(famille));
  return r ? r : null;
}

function analyserRotation(plan) {
  const historique = historiqueDuPlan(plan);
  const anneesSuivies = historique.length;

  const famillesRepetees = {};   // "Famille|écart" → { famille, ecart, exemples[] }
  const cellulesFatiguees = {};
  const memeGroupe = {};
  let casesAvecPasse = 0, casesSansRepos = 0, casesReposees = 0, casesApresEngraisVert = 0;

  Object.keys(plan.plantations).forEach(cle => {
    const idActuel = plan.plantations[cle];
    if (estCouverture(idActuel)) return;
    const p = PLANTE_PAR_ID[idActuel];
    if (!p || p.viv) return;                    // les vivaces restent en place, c'est normal

    const passe = historiqueCase(plan, cle, historique);
    if (!passe.length) return;
    casesAvecPasse++;

    // 1. Même famille revenue trop tôt
    const memeFamille = passe.find(e => {
      const q = contenuCase(e.id);
      return q && !estCouverture(e.id) && q.fam === p.fam;
    });
    if (memeFamille) {
      const ecart = plan.annee - memeFamille.annee;
      if (ecart < DUREE_ROTATION) {
        const q = PLANTE_PAR_ID[memeFamille.id];
        const cle2 = p.fam + "|" + ecart;
        const entree = famillesRepetees[cle2] || (famillesRepetees[cle2] =
          { famille: p.fam, ecart: ecart, annee: memeFamille.annee, libre: memeFamille.annee + DUREE_ROTATION, exemples: [] });
        const exemple = `${p.nom} après ${q ? q.nom : "la même famille"}`;
        if (!entree.exemples.includes(exemple)) entree.exemples.push(exemple);
        cellulesFatiguees[cle] = true;
      }
    }

    // 2. Même groupe de rotation deux ans de suite (gourmand après gourmand…)
    const anDernier = passe.find(e => e.annee === plan.annee - 1);
    if (anDernier && !estCouverture(anDernier.id)) {
      const q = PLANTE_PAR_ID[anDernier.id];
      const ga = groupeRotation(p.fam), gb = q ? groupeRotation(q.fam) : null;
      if (ga && gb && ga.ordre === gb.ordre && p.fam !== q.fam) {
        memeGroupe[ga.groupe] = memeGroupe[ga.groupe] || { groupe: ga.groupe, exemples: [] };
        const ex = `${p.nom} après ${q.nom}`;
        if (!memeGroupe[ga.groupe].exemples.includes(ex)) memeGroupe[ga.groupe].exemples.push(ex);
      }
    }

    // 3. Le repos de la terre
    /* Un engrais vert REELLEMENT cultive vaut autant qu'une jachere :
       il couvre, structure et nourrit. On le compte comme un repos. */
    const dernierRepos = passe.find(e => estCouverture(e.id) || estEngraisVert(e.id));
    if (!dernierRepos) {
      if (anneesSuivies >= REPOS_CONSEILLE) { casesSansRepos++; cellulesFatiguees[cle] = true; }
    } else {
      casesReposees++;
      const nourrissant = estCouverture(dernierRepos.id)
        ? COUVERTURES[dernierRepos.id].nourrit >= 2
        : true;
      if (dernierRepos.annee === plan.annee - 1 && nourrissant) casesApresEngraisVert++;
    }
  });

  return {
    anneesSuivies: anneesSuivies,
    casesAvecPasse: casesAvecPasse,
    famillesRepetees: Object.values(famillesRepetees),
    memeGroupe: Object.values(memeGroupe),
    casesSansRepos: casesSansRepos,
    casesReposees: casesReposees,
    casesApresEngraisVert: casesApresEngraisVert,
    cellulesFatiguees: cellulesFatiguees,
    partReposee: partRepos(plan)
  };
}

/* Part des cases du plan actuellement mises au repos */
function partRepos(plan) {
  const total = colonnes(plan) * rangees(plan) - Object.keys(plan.exclues).length;
  if (!total) return 0;
  const repos = Object.keys(plan.plantations).filter(c => estCouverture(plan.plantations[c])).length;
  return Math.round(repos / total * 100);
}

/* Score d'un emplacement pour une plante : + les amies autour, - les ennemies */
function scoreCellule(plan, x, y, plante, ombresCalculees) {
  if (!celluleValide(plan, x, y) || plan.plantations[x + "," + y]) return null;
  let score = 0, amies = 0, ennemies = 0;

  // Une case mal exposée est éliminée d'office : le compagnonnage ne rattrape pas un manque de soleil
  const cleCase = x + "," + y;
  const ombres = ombresCalculees || ombresPortees(plan);
  const effective = expoEffective(plan, cleCase, ombres);
  const soucisSoleil = verifierSoleil(plante, effective);
  if (soucisSoleil) return { score: -99, amies: 0, ennemies: 0, soleil: soucisSoleil };

  // À l'inverse, l'ombre d'une plante haute est une aubaine pour qui aime la fraîcheur
  if (ombres[cleCase] && ["mi-ombre", "ombre", "tolerant"].includes(besoinSoleil(plante))) score += 2;

  voisines(plan, x, y).forEach(v => {
    const q = v.planteId ? PLANTE_PAR_ID[v.planteId] : null;
    if (!q) return;
    if (sontEnnemies(plante, q)) { score -= 3; ennemies++; }
    else if (sontAmies(plante, q)) { score += 2; amies++; }
    else if (q.id === plante.id) { score += 1; }   // regrouper la même plante
  });
  return { score: score, amies: amies, ennemies: ennemies };
}

/* Les meilleurs emplacements libres pour la plante sélectionnée */
function meilleuresCellules(plan, planteId) {
  const plante = PLANTE_PAR_ID[planteId];
  if (!plante) return {};
  const scores = [];
  const ombres = ombresPortees(plan);   // calculées une seule fois pour tout le plan
  for (let y = 0; y < rangees(plan); y++) {
    for (let x = 0; x < colonnes(plan); x++) {
      const s = scoreCellule(plan, x, y, plante, ombres);
      if (s && s.score > 0) scores.push({ cle: x + "," + y, score: s.score });
    }
  }
  if (!scores.length) return {};
  const max = Math.max.apply(null, scores.map(s => s.score));
  const retenues = {};
  scores.filter(s => s.score >= Math.max(2, max - 1)).forEach(s => { retenues[s.cle] = true; });
  return retenues;
}

/* Compagnons conseillés d'après ce qui est déjà planté */
function compagnonsConseilles(plan) {
  const presentes = plantesDuPlan(plan).map(id => PLANTE_PAR_ID[id]).filter(Boolean);
  if (!presentes.length) return [];
  const scores = {};
  presentes.forEach(p => {
    (p.amis || []).forEach(nom => {
      const q = PLANTE_PAR_NOM[nom];
      if (!q || presentes.some(r => r.id === q.id)) return;
      (scores[q.id] = scores[q.id] || { plante: q, pour: [] }).pour.push(p.nom);
    });
  });
  return Object.values(scores)
    .sort((a, b) => b.pour.length - a.pour.length)
    .slice(0, 6);
}

/* ---------------- Palette : les plantes que j'utilise ---------------- */

function mesPlantes() {
  const ids = [];
  const ajouter = id => { if (id && PLANTE_PAR_ID[id] && !ids.includes(id)) ids.push(id); };
  entreesPlanning().forEach(e => ajouter(e.planteId));
  etat.cultures.forEach(c => ajouter(c.planteId));
  etat.favoris.forEach(ajouter);
  const plan = planCourant();
  if (plan) plantesDuPlan(plan).forEach(ajouter);
  return ids.map(id => PLANTE_PAR_ID[id]);
}

/* ---------------- Écran ---------------- */

function vuePlan() {
  const plans = tousLesPlans();

  if (!plans.length) {
    return `
      <div class="carte carte-astuce">
        <h3>📐 Dessine ton potager</h3>
        <p>Donne les dimensions de ta parcelle : l'appli en fait une grille que tu remplis
        au doigt. Tu peux ensuite <strong>découper</strong> les cases inutiles pour obtenir une
        forme en L, contourner un cabanon ou une allée.</p>
        <p>Une fois le plan tracé, tu y places tes plantes — et l'appli te prévient si deux
        voisines ne s'entendent pas, ou te montre les meilleurs emplacements.</p>
        <button class="bouton" onclick="formulairePlan()">➕ Créer mon premier plan</button>
      </div>`;
  }

  const plan = planCourant();
  const analyse = analyserPlan(plan);
  const surfaces = surfacesParPlante(plan);
  const surfaceTotale = (colonnes(plan) * rangees(plan) - Object.keys(plan.exclues).length) * surfaceMaille(plan);
  const occupees = Object.keys(plan.plantations).length * surfaceMaille(plan);

  return `
    ${plans.length > 1 ? `
      <div class="filtres">
        <div class="onglets">
          ${plans.map(p => `<button class="onglet ${p.id === plan.id ? "actif" : ""}"
            onclick="planOuvert='${p.id}';suggestionsVisibles=false;afficher()">${esc(p.nom)}</button>`).join("")}
        </div>
      </div>` : ""}

    <div class="carte">
      <div class="zone-tete">
        <div>
          <h3>${esc(plan.nom)}</h3>
          <p class="note">${nombreFr(plan.largeur)} × ${nombreFr(plan.hauteur)} m ·
            ${nombreFr(Math.round(surfaceTotale * 10) / 10)} m² cultivables ·
            occupé à ${surfaceTotale ? Math.round(occupees / surfaceTotale * 100) : 0} % ·
            mailles de ${plan.maille * 100} cm · année ${plan.annee}</p>
        </div>
        <div class="zone-boutons">
          <button class="bouton-icone" onclick="formulairePlan('${plan.id}')" title="Modifier">✏️</button>
          <button class="bouton-icone" onclick="supprimerPlan('${plan.id}')" title="Supprimer">🗑</button>
        </div>
      </div>

      ${barreOutils(plan)}
      ${palettePlantes(plan)}

      <div class="plan-cadre">${grillePlan(plan, analyse)}</div>

      <div class="barre-boutons marge-haut">
        <button class="bouton" onclick="formulairePlan()">➕ Nouveau plan</button>
        <button class="bouton bouton-doux" onclick="dupliquerPlanAnneeSuivante('${plan.id}')">📅 Copier pour ${plan.annee + 1}</button>
        <button class="bouton bouton-doux" onclick="viderPlantations('${plan.id}')">🧹 Tout dépeindre</button>
      </div>
    </div>

    ${panneauConseils(plan, analyse)}
    ${panneauConditions(plan, analyse.conditions)}
    ${panneauRotation(plan, analyse.rotation)}
    ${panneauSurfaces(surfaces)}
  `;
}

/* ---------- Ensoleillement et arrosage ---------- */

function panneauConditions(plan, c) {
  const eaux = Object.keys(c.surfacesEau).filter(n => c.surfacesEau[n] > 0);
  if (!c.soleil.length && !c.arrosageIncompatible.length && !eaux.length
      && !c.abris.length && !c.ombreLibre) return "";

  return `
    ${c.soleil.length ? `
      <div class="carte carte-alerte">
        <h3>☀️ Exposition mal adaptée <span class="compteur">${c.soleil.length}</span></h3>
        <ul class="liste-simple">${c.soleil.map(s =>
          `<li>${esc(s.texte)} <span class="note">(${s.nb} case${s.nb > 1 ? "s" : ""})</span></li>`).join("")}</ul>
        <p class="note">Ces cases sont hachurées de bleu sur le plan. Utilise l'outil ☀️ pour
          vérifier ou corriger les zones d'ombre que tu as déclarées.</p>
      </div>` : ""}

    ${c.abris.length || c.ombreLibre ? `
      <div class="carte carte-perma">
        <h3>🌾 L'ombre des plantes hautes</h3>
        ${c.abris.length ? `
          <p>Bien vu :</p>
          <ul class="liste-simple">${c.abris.map(a =>
            `<li><strong>${esc(a.plante)}</strong> profite de l'ombre ${esc(a.sous === a.plante ? "de ses voisines" : "de " + a.sous)}
              — ${a.nb} case${a.nb > 1 ? "s" : ""}.</li>`).join("")}</ul>` : ""}
        ${c.ombreLibre ? `
          <p>${c.ombreLibre} case${c.ombreLibre > 1 ? "s" : ""} ${c.ombreLibre > 1 ? "sont" : "est"} à l'ombre
            de ${esc(c.sourcesOmbre.join(", "))} et ${c.ombreLibre > 1 ? "restent" : "reste"} libre${c.ombreLibre > 1 ? "s" : ""}.
            C'est exactement là qu'il faut mettre les plantes qui souffrent de la chaleur — salades,
            épinards, mâche, cerfeuil, persil — pour les empêcher de monter en graine l'été.</p>` : ""}
        <p class="note">Les hachures grises sur le plan marquent l'ombre portée. Elle tombe vers le nord,
          que tu as placé <strong>${esc(versLeNord(plan).nom)}</strong> — modifiable dans les réglages du plan.</p>
      </div>` : ""}

    <div class="carte">
      <h3>💧 Arrosage</h3>
      ${!c.zonesOmbre ? `<p class="note">💡 Tu n'as déclaré aucune zone d'ombre : l'appli considère
        tout le plan en plein soleil. L'outil ☀️ permet de marquer le pied d'un mur, l'ombre d'un
        arbre ou d'une haie — les alertes d'exposition en dépendent.</p>` : ""}
      ${eaux.length ? `
        <p class="note">Surface par besoin en eau. Regrouper les plantes qui boivent pareil, c'est
          moins d'arrosage et moins de gaspillage.</p>
        <ul class="liste-surfaces">
          ${eaux.sort((a, b) => b - a).map(n => `
            <li>
              <span class="surface-nom">${EAUX[n].emoji} ${EAUX[n].nom}</span>
              <span class="surface-chiffres">${nombreFr(Math.round(c.surfacesEau[n] * 100) / 100)} m²</span>
            </li>`).join("")}
        </ul>` : ""}
      ${c.arrosageIncompatible.length ? `
        <div class="alerte-assoc marge-haut">
          ⚠️ Voisines aux besoins opposés — l'une sera noyée ou l'autre assoiffée :
          ${esc(c.arrosageIncompatible.join(", "))}.
        </div>` : ""}
    </div>`;
}

/* ---------- Barre d'outils ---------- */

function barreOutils(plan) {
  const outils = [
    ["planter", "🎨", "Planter"],
    ["soleil", "☀️", "Soleil"],
    ["gomme", "🧽", "Effacer"],
    ["decouper", "✂️", "Découper"],
    ["info", "👆", "Info"]
  ];
  return `
    <div class="plan-outils">
      ${outils.map(([mode, emoji, label]) => `
        <button class="outil ${outilPlan.mode === mode ? "actif" : ""}"
                onclick="choisirOutil('${mode}')" title="${label}">
          <span class="outil-emoji">${emoji}</span>${label}
        </button>`).join("")}
      ${outilPlan.mode === "planter" && outilPlan.planteId ? `
        <button class="outil ${suggestionsVisibles ? "actif" : ""}" onclick="basculerSuggestions()"
                title="Meilleurs emplacements">
          <span class="outil-emoji">✨</span>Où planter ?
        </button>` : ""}
    </div>
    ${outilPlan.mode === "decouper" ? `<p class="note plan-aide">✂️ Touche les cases qui ne font pas partie du potager (allée, cabanon…). Retouche-les pour les remettre.</p>` : ""}
    ${outilPlan.mode === "info" ? `<p class="note plan-aide">👆 Touche une case pour savoir ce qu'il y a dessus et ce qu'en pensent ses voisines.</p>` : ""}
    ${outilPlan.mode === "soleil" ? paletteSoleil() : ""}`;
}

function paletteSoleil() {
  return `
    <p class="note plan-aide">☀️ Marque les coins ombragés de ton potager — mur, haie, arbre.
      Tout est considéré au plein soleil par défaut. Le plan affiche l'ensoleillement tant que
      cet outil est actif.</p>
    <div class="plan-palette">
      ${Object.keys(EXPOSITIONS).reverse().map(cle => {
        const e = EXPOSITIONS[cle];
        return `<button class="pastille-plante ${outilPlan.expo === cle ? "actif" : ""}"
                  style="--couleur:${e.couleur}"
                  onclick="outilPlan.expo='${cle}';afficher()">
                  <span class="pastille-couleur"></span>${e.emoji} ${e.nom}
                </button>`;
      }).join("")}
    </div>`;
}

function choisirOutil(mode) {
  outilPlan.mode = mode;
  if (mode !== "planter") suggestionsVisibles = false;
  afficher();
}

function basculerSuggestions() {
  suggestionsVisibles = !suggestionsVisibles;
  afficher();
}

/* ---------- Palette ---------- */

function palettePlantes(plan) {
  if (outilPlan.mode !== "planter") return "";
  const liste = mesPlantes();

  const paletteRepos = `
    <div class="plan-palette plan-palette-repos">
      <span class="note palette-titre">Faire reposer la terre :</span>
      ${Object.values(COUVERTURES).map(c => `
        <button class="pastille-plante ${outilPlan.planteId === c.id ? "actif" : ""}"
                style="--couleur:${c.couleur}" title="${esc(c.detail)}"
                onclick="outilPlan.planteId='${c.id}';suggestionsVisibles=false;afficher()">
          <span class="pastille-couleur"></span>${c.emoji} ${esc(c.nom)}
        </button>`).join("")}
    </div>`;

  if (!liste.length) {
    return `
      <div class="alerte-assoc">
        Aucune plante à placer pour l'instant. Ajoute-en à ton planning, ou
        <button class="mini-bouton" onclick="choisirPlantePourPlan()">choisis-en une dans la bibliothèque</button>.
      </div>
      ${paletteRepos}`;
  }

  return `
    <div class="plan-palette">
      ${liste.map(p => {
        const actif = outilPlan.planteId === p.id;
        const couleur = plantesDuPlan(plan).includes(p.id) ? couleurPlante(plan, p.id) : "#9e9e9e";
        return `
          <button class="pastille-plante ${actif ? "actif" : ""}"
                  style="--couleur:${couleur}"
                  onclick="outilPlan.planteId='${p.id}';suggestionsVisibles=false;afficher()">
            <span class="pastille-couleur"></span>${esc(p.nom)}
          </button>`;
      }).join("")}
      <button class="pastille-plante pastille-ajout" onclick="choisirPlantePourPlan()">＋ autre plante</button>
    </div>
    ${paletteRepos}`;
}

function choisirPlantePourPlan() {
  filtrePicker = { cat: "toutes", q: "", lettre: "" };
  ouvrirModale("Choisir une plante", `<div id="picker">${contenuPickerPlan()}</div>`);
}

function contenuPickerPlan() {
  const liste = chercherPlantes(filtrePicker.q, filtrePicker.cat, null, null, filtrePicker.lettre);
  return `
    <input class="champ-recherche" type="search" placeholder="Rechercher une plante…" value="${esc(filtrePicker.q)}"
           oninput="filtrePicker.q=this.value;majPickerPlan(true)">
    <div class="onglets">
      ${[["toutes", "Toutes"], ["legume", "🥕"], ["fruit", "🍓"], ["aromatique", "🌿"], ["medicinale", "🌼"], ["engrais", "🌾"]].map(([v, l]) =>
        `<button type="button" class="onglet ${filtrePicker.cat === v ? "actif" : ""}" onclick="filtrePicker.cat='${v}';majPickerPlan()">${l}</button>`).join("")}
    </div>
    ${barreAlphabet("filtrePicker", filtrePicker, "majPickerPlan")}
    <div class="picker-liste">
      ${liste.map(p => `
        <button type="button" class="picker-item" onclick="retenirPlantePourPlan('${p.id}')">
          <span class="cal-emoji">${CATEGORIES[p.cat].emoji}</span>
          <span class="picker-texte"><strong>${esc(p.nom)}</strong><span class="note">${esc(p.fam)}</span></span>
          <span class="picker-signe">＋</span>
        </button>`).join("") || `<p class="vide">Aucune plante ne correspond.</p>`}
    </div>`;
}

function majPickerPlan(garderFocus) {
  const boite = document.getElementById("picker");
  if (!boite) return;
  boite.innerHTML = contenuPickerPlan();
  if (garderFocus) {
    const champ = boite.querySelector(".champ-recherche");
    if (champ) { champ.focus(); champ.setSelectionRange(champ.value.length, champ.value.length); }
  }
}

function retenirPlantePourPlan(id) {
  outilPlan.mode = "planter";
  outilPlan.planteId = id;
  if (!etat.favoris.includes(id)) etat.favoris.push(id);
  sauver();
  fermerModale();
  afficher();
}

/* ---------- La grille ---------- */

function grillePlan(plan, analyse) {
  const c = colonnes(plan), r = rangees(plan);
  const suggestions = (suggestionsVisibles && outilPlan.planteId)
    ? meilleuresCellules(plan, outilPlan.planteId) : {};

  const ombres = ombresPortees(plan);
  const cases = [];
  for (let y = 0; y < r; y++) {
    for (let x = 0; x < c; x++) {
      const cle = x + "," + y;
      const exclue = !!plan.exclues[cle];
      const id = plan.plantations[cle];
      const ex = expoCase(plan, cle);
      const vueSoleil = outilPlan.mode === "soleil";

      const remplissage = exclue ? "#e6e3da"
        : vueSoleil ? EXPOSITIONS[ex].couleur
        : (id ? couleurPlante(plan, id) : "#f7f9f4");

      const classes = ["case-plan"];
      if (exclue) classes.push("case-exclue");
      if (estCouverture(id)) classes.push("case-repos");
      if (!vueSoleil && analyse.cellulesEnConflit[cle]) classes.push("case-conflit");
      if (!vueSoleil && analyse.cellulesFatiguees[cle]) classes.push("case-fatiguee");
      if (!vueSoleil && analyse.cellulesMalExposees[cle]) classes.push("case-mal-exposee");
      if (suggestions[cle]) classes.push("case-suggeree");
      const contenu = contenuCase(id);

      cases.push(
        `<rect class="${classes.join(" ")}" data-cle="${cle}" x="${x}" y="${y}" width="1" height="1"
               fill="${remplissage}" onclick="cliquerCellule(${x},${y})">
           <title>${x * plan.maille}–${(x + 1) * plan.maille} m / ${y * plan.maille}–${(y + 1) * plan.maille} m${contenu ? " · " + esc(contenu.nom) : exclue ? " · hors potager" : " · libre"} · ${EXPOSITIONS[ex].nom}</title>
         </rect>`);

      // Coin marqué sur les cases ombragées, pour garder l'info visible en vue « plantes »
      if (!vueSoleil && !exclue && ex !== "soleil") {
        cases.push(`<path class="coin-ombre" d="M${x + 1} ${y} L${x + 1} ${y + 0.34} L${x + 0.66} ${y} Z"
                          fill="${EXPOSITIONS[ex].couleur}" pointer-events="none"/>`);
      }
      // Hachures là où une plante haute projette son ombre
      if (!exclue && ombres[cle]) {
        cases.push(`<rect class="ombre-portee" x="${x}" y="${y}" width="1" height="1"
                          fill="url(#hachures-ombre)" opacity="${ombres[cle].force === 2 ? 0.5 : 0.28}"
                          pointer-events="none"/>`);
      }
    }
  }

  // Repères métriques : une ligne plus marquée tous les mètres
  const pasMetre = Math.max(1, Math.round(1 / plan.maille));
  const reperes = [];
  for (let x = 0; x <= c; x += pasMetre) reperes.push(`<line class="repere" x1="${x}" y1="0" x2="${x}" y2="${r}"/>`);
  for (let y = 0; y <= r; y += pasMetre) reperes.push(`<line class="repere" x1="0" y1="${y}" x2="${c}" y2="${y}"/>`);

  /* Chaque case doit rester visable au doigt : on impose une largeur minimale
     et on laisse le plan défiler horizontalement s'il ne tient pas à l'écran. */
  const TAILLE_MINI = 30;

  return `
    <div class="plan-cotes">
      <span class="cote-haut">↔ ${nombreFr(plan.largeur)} m</span>
      <span class="cote-gauche">↕ ${nombreFr(plan.hauteur)} m</span>
    </div>
    <div class="plan-defilement">
      <svg class="plan-grille" viewBox="0 0 ${c} ${r}" preserveAspectRatio="xMidYMid meet"
           style="min-width:${c * TAILLE_MINI}px"
           role="img" aria-label="Plan du potager ${esc(plan.nom)}">
        <defs>
          <pattern id="hachures-ombre" width=".22" height=".22" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2=".22" stroke="#3a4a5a" stroke-width=".09"/>
          </pattern>
        </defs>
        ${cases.join("")}
        ${reperes.join("")}
      </svg>
    </div>
    <p class="note plan-defilement-aide">↔ Le plan défile latéralement s'il est plus large que l'écran.</p>`;
}

function cliquerCellule(x, y) {
  const plan = planCourant();
  if (!plan) return;
  const cle = x + "," + y;

  if (outilPlan.mode === "decouper") {
    if (plan.exclues[cle]) delete plan.exclues[cle];
    else { plan.exclues[cle] = true; delete plan.plantations[cle]; }
    sauver(); afficher(); return;
  }

  if (outilPlan.mode === "soleil") {
    if (!plan.expo) plan.expo = {};
    if (outilPlan.expo === "soleil") delete plan.expo[cle];   // soleil = valeur par défaut
    else plan.expo[cle] = outilPlan.expo;
    sauver(); afficher(); return;
  }

  if (outilPlan.mode === "gomme") {
    delete plan.plantations[cle];
    sauver(); afficher(); return;
  }

  if (outilPlan.mode === "info") { infoCellule(plan, x, y); return; }

  // Mode planter
  if (plan.exclues[cle]) return;
  if (!outilPlan.planteId) {
    ouvrirModale("Choisis d'abord une plante", `
      <p>Sélectionne une plante dans la palette au-dessus du plan, puis touche les cases où tu veux la mettre.</p>
      <div class="modale-actions"><button class="bouton" onclick="fermerModale()">D'accord</button></div>`);
    return;
  }
  plan.plantations[cle] = outilPlan.planteId;
  sauver();
  afficher();
}

function infoCellule(plan, x, y) {
  const cle = x + "," + y;
  const idCase = plan.plantations[cle];

  // Une case au repos se raconte différemment d'une culture
  if (estCouverture(idCase)) {
    const c = COUVERTURES[idCase];
    const passe = historiqueCase(plan, cle, historiqueDuPlan(plan));
    ouvrirModale("Cette case", `
      <h4>${c.emoji} ${esc(c.nom)}</h4>
      <p>${esc(c.detail)}</p>
      ${passe.length ? `<h4>Son passé</h4><ul class="liste-simple">${passe.map(e => {
        const q = contenuCase(e.id);
        return `<li>${e.annee} — ${q ? esc(q.nom) : "inconnu"}</li>`;
      }).join("")}</ul>` : `<p class="note">Aucun historique enregistré pour cette case.</p>`}
      <div class="modale-actions"><button class="bouton" onclick="fermerModale()">Fermer</button></div>`);
    return;
  }

  const p = planteEn(plan, x, y);
  const voisinage = voisines(plan, x, y)
    .map(v => v.planteId ? PLANTE_PAR_ID[v.planteId] : null)
    .filter(Boolean);
  const uniques = [];
  voisinage.forEach(q => { if (!uniques.some(u => u.id === q.id)) uniques.push(q); });

  let corps = `<p class="note">Case ${x * plan.maille}–${(x + 1) * plan.maille} m × ${y * plan.maille}–${(y + 1) * plan.maille} m`
    + (plan.exclues[cle] ? " — <strong>hors potager</strong>" : "") + "</p>";

  const ex = expoCase(plan, cle);
  corps += `<p class="note">${EXPOSITIONS[ex].emoji} Cette case est déclarée <strong>${EXPOSITIONS[ex].nom.toLowerCase()}</strong>.</p>`;

  if (p) {
    corps += `<h4>${CATEGORIES[p.cat].emoji} ${esc(p.nom)}</h4>
      <p class="note">${esc(p.fam)} · espacement ${esc(p.esp)}</p>
      <p class="note">☀️ Se plaît ${LIBELLE_BESOIN_SOLEIL[besoinSoleil(p)]} · ${EAUX[besoinEau(p)].emoji} ${EAUX[besoinEau(p)].nom.toLowerCase()}</p>
      <p><a href="#plantes/${p.id}" onclick="fermerModale()">Voir la fiche complète →</a></p>`;

    const soucis = verifierSoleil(p, ex);
    if (soucis) corps += `<div class="alerte-assoc">☀️ ${esc(soucis)}</div>`;

    const amies = uniques.filter(q => sontAmies(p, q));
    const ennemies = uniques.filter(q => sontEnnemies(p, q));
    if (ennemies.length) corps += `<div class="alerte-assoc">⚠️ ${esc(p.nom)} n'aime pas ${esc(ennemies.map(q => q.nom).join(", "))} juste à côté.</div>`;
    if (amies.length) corps += `<div class="info-assoc">🤝 Bien accompagnée par ${esc(amies.map(q => q.nom).join(", "))}.</div>`;
    if (!amies.length && !ennemies.length) corps += `<p class="note">Voisinage neutre.</p>`;

    // Ce que cette case a porté les années précédentes
    const passe = historiqueCase(plan, cle, historiqueDuPlan(plan));
    if (passe.length) {
      corps += `<h4>Son passé</h4><ul class="liste-simple">${passe.map(e => {
        const q = contenuCase(e.id);
        const memeFam = q && !estCouverture(e.id) && q.fam === p.fam;
        return `<li>${e.annee} — ${q ? esc(q.nom) : "inconnu"}${memeFam ? " <strong>(même famille ⚠️)</strong>" : ""}</li>`;
      }).join("")}</ul>`;
      const repos = passe.find(e => estCouverture(e.id));
      corps += repos
        ? `<p class="note">🍂 Dernier repos en ${repos.annee}.</p>`
        : `<p class="note">🍂 Cette case n'a jamais été mise au repos sur la période enregistrée.</p>`;
    }
  } else {
    corps += uniques.length
      ? `<p>Case libre. Autour : ${esc(uniques.map(q => q.nom).join(", "))}.</p>`
      : `<p>Case libre, sans voisinage planté.</p>`;
  }

  ouvrirModale("Cette case", corps + `
    <div class="modale-actions"><button class="bouton" onclick="fermerModale()">Fermer</button></div>`);
}

/* ---------- Panneaux d'analyse ---------- */

function panneauConseils(plan, analyse) {
  const compagnons = compagnonsConseilles(plan);
  // Le panneau rotation, lui, s'affiche toujours : il est rendu à part dans vuePlan()
  if (!analyse.conflits.length && !analyse.bonus.length && !compagnons.length) return "";

  return `
    ${analyse.conflits.length ? `
      <div class="carte carte-alerte">
        <h3>⚠️ Voisinages à revoir <span class="compteur">${analyse.conflits.length}</span></h3>
        <ul class="liste-simple">${analyse.conflits.map(c =>
          `<li><strong>${esc(c.paire)}</strong> — ${c.nb} contact${c.nb > 1 ? "s" : ""} sur le plan. Éloigne-les d'au moins une case.</li>`).join("")}</ul>
        <p class="note">Les cases concernées sont bordées de rouge sur le plan.</p>
      </div>` : ""}


    ${analyse.bonus.length ? `
      <div class="carte carte-perma">
        <h3>🤝 Bonnes associations en place <span class="compteur">${analyse.bonus.length}</span></h3>
        <ul class="liste-simple">${analyse.bonus.slice(0, 8).map(b =>
          `<li>${esc(b.paire)}</li>`).join("")}</ul>
      </div>` : ""}

    ${compagnons.length ? `
      <div class="carte carte-astuce">
        <h3>💡 Ce qui manque à ce plan</h3>
        <p class="note">D'après ce que tu as déjà planté, ces plantes rendraient service à leurs voisines :</p>
        <ul class="liste-simple">${compagnons.map(c =>
          `<li><strong>${esc(c.plante.nom)}</strong> — bonne compagne de ${esc(c.pour.slice(0, 3).join(", "))}
            <button class="mini-bouton" onclick="retenirPlantePourPlan('${c.plante.id}')">La placer</button></li>`).join("")}</ul>
      </div>` : ""}`;
}

function panneauRotation(plan, r) {
  const rienASignaler = !r.famillesRepetees.length && !r.memeGroupe.length && !r.casesSansRepos;

  if (!r.anneesSuivies) {
    return `
      <div class="carte carte-astuce">
        <h3>🔄 Rotation et repos de la terre</h3>
        <p>Ce plan est le premier de son nom : l'appli n'a rien à comparer pour l'instant.</p>
        <p class="note">À la fin de la saison, le bouton <strong>« 📅 Copier pour ${plan.annee + 1} »</strong>
        crée le plan de l'année suivante. C'est à partir de là que la rotation devient vérifiable —
        et l'appli remontera alors sur toutes les années enregistrées, pas seulement la précédente.</p>
        <p class="note">Repos en cours sur ce plan : <strong>${r.partReposee} %</strong> de la surface.
          ${r.partReposee ? "" : `💡 Pense à en mettre une partie <strong>au repos</strong> ou en
          <strong>engrais vert</strong> — c'est dans la palette, sous les plantes. Une terre qui
          produit sans discontinuer s'épuise, quelle que soit la rotation.`}</p>
      </div>`;
  }

  return `
    <div class="carte ${rienASignaler ? "carte-perma" : "carte-suivi"}">
      <h3>🔄 Rotation et repos de la terre</h3>
      <p class="note">Comparé aux ${r.anneesSuivies} année${r.anneesSuivies > 1 ? "s" : ""} enregistrée${r.anneesSuivies > 1 ? "s" : ""}
        sous le nom « ${esc(plan.nom)} ». Règle appliquée : <strong>${DUREE_ROTATION} ans</strong> avant
        qu'une famille revienne au même endroit.</p>

      ${r.famillesRepetees.length ? `
        <h4>Familles revenues trop tôt</h4>
        <ul class="liste-simple">${r.famillesRepetees.map(f => `
          <li><strong>${esc(f.famille)}</strong> — déjà à cet endroit en ${f.annee}, soit
            ${f.ecart} an${f.ecart > 1 ? "s" : ""} d'écart au lieu de ${DUREE_ROTATION}.
            Cet emplacement ne sera libre qu'en <strong>${f.libre}</strong>.
            <span class="note">(${esc(f.exemples.slice(0, 3).join(", "))})</span></li>`).join("")}</ul>` : ""}

      ${r.memeGroupe.length ? `
        <h4>Deux cultures du même type qui se suivent</h4>
        <ul class="liste-simple">${r.memeGroupe.map(g => `
          <li>${esc(g.groupe)} — ${esc(g.exemples.slice(0, 3).join(", "))}.
            Le sol puise les mêmes éléments deux ans de suite.</li>`).join("")}</ul>` : ""}

      ${r.casesSansRepos ? `
        <h4>Terre jamais mise au repos</h4>
        <p><strong>${r.casesSansRepos} case${r.casesSansRepos > 1 ? "s" : ""}</strong>
          ${r.casesSansRepos > 1 ? "n'ont" : "n'a"} connu ni repos ni engrais vert depuis
          ${r.anneesSuivies} an${r.anneesSuivies > 1 ? "s" : ""} de culture continue.
          Même bien tournée, une terre qui produit sans arrêt s'appauvrit.</p>
        <p class="note">Ces cases sont marquées d'un liseré brun sur le plan. Poser un
          <strong>🌾 engrais vert</strong> une saison suffit souvent à tout relancer.</p>` : ""}

      ${r.casesApresEngraisVert ? `
        <h4>✅ Bien joué</h4>
        <p>${r.casesApresEngraisVert} case${r.casesApresEngraisVert > 1 ? "s" : ""} ${r.casesApresEngraisVert > 1 ? "sont cultivées" : "est cultivée"}
          juste après un engrais vert : c'est exactement là qu'il faut mettre les plus gourmandes.</p>` : ""}

      ${rienASignaler ? `<p>✅ Aucune famille ne revient trop tôt, et la terre a été ménagée. Rien à corriger.</p>` : ""}

      <p class="note marge-haut">Repos en cours sur ce plan : <strong>${r.partReposee} %</strong> de la surface.
        ${r.partReposee < 10 ? "Beaucoup de jardiniers en laissent 10 à 25 % chaque année, par roulement." : ""}</p>
    </div>`;
}

function panneauSurfaces(surfaces) {
  if (!surfaces.length) return "";
  return `
    <div class="carte">
      <h3>📊 Ce que contient le plan</h3>
      <ul class="liste-surfaces">
        ${surfaces.map(s => `
          <li>
            <span class="pastille-couleur" style="--couleur:${couleurPlante(planCourant(), s.id)}"></span>
            <span class="surface-nom">${s.couverture ? s.plante.emoji : CATEGORIES[s.plante.cat].emoji} ${esc(s.plante.nom)}</span>
            <span class="surface-chiffres">${nombreFr(Math.round(s.surface * 100) / 100)} m²${s.nbPlants ? ` · ≈ ${s.nbPlants} plant${s.nbPlants > 1 ? "s" : ""}` : ""}</span>
          </li>`).join("")}
      </ul>
      <p class="note">Le nombre de plants est estimé d'après l'espacement conseillé sur chaque fiche.</p>
    </div>`;
}

/* ---------- Créer / modifier / supprimer ---------- */

function formulairePlan(id) {
  const plan = id ? tousLesPlans().find(p => p.id === id) : null;
  ouvrirModale(plan ? "Modifier le plan" : "Nouveau plan", `
    <form onsubmit="enregistrerPlan(event,'${id || ""}')">
      <label>Nom
        <input name="nom" required placeholder="Grande planche, carré potager…" value="${esc(plan ? plan.nom : "")}">
      </label>
      <div class="deux-colonnes">
        <label>Largeur (m)
          <input type="number" name="largeur" step="0.25" min="0.5" max="60" required value="${plan ? plan.largeur : 6}">
        </label>
        <label>Profondeur (m)
          <input type="number" name="hauteur" step="0.25" min="0.5" max="60" required value="${plan ? plan.hauteur : 4}">
        </label>
      </div>
      <label>Taille des cases
        <select name="maille">
          ${MAILLES.map(m => `<option value="${m.m}" ${plan && plan.maille === m.m ? "selected" : (!plan && m.m === 0.5 ? "selected" : "")}>${m.label}</option>`).join("")}
        </select>
      </label>
      <div class="deux-colonnes">
        <label>Année
          <input type="number" name="annee" min="2000" max="2100" value="${plan ? plan.annee : anneePlanning()}">
        </label>
        <label>Où est le nord ?
          <select name="nord">
            ${Object.keys(ORIENTATIONS).map(k =>
              `<option value="${k}" ${(plan ? plan.nord : "haut") === k ? "selected" : ""}>${ORIENTATIONS[k].nom}</option>`).join("")}
          </select>
        </label>
      </div>
      <p class="note">Le nord sert à calculer l'ombre que les plantes hautes projettent sur leurs
        voisines. Mets-toi face à ton potager comme sur le plan.</p>
      ${plan ? `<p class="note">Réduire les dimensions supprime les plantations qui sortent du cadre.</p>` : ""}
      <div class="modale-actions">
        <button type="button" class="bouton bouton-doux" onclick="fermerModale()">Annuler</button>
        <button type="submit" class="bouton">Enregistrer</button>
      </div>
    </form>`);
}

function enregistrerPlan(ev, id) {
  ev.preventDefault();
  const f = new FormData(ev.target);
  const largeur = Number(f.get("largeur")), hauteur = Number(f.get("hauteur")), maille = Number(f.get("maille"));

  const nbCases = Math.round(largeur / maille) * Math.round(hauteur / maille);
  if (nbCases > MAX_CELLULES) {
    alert(`Ce plan ferait ${nbCases} cases, c'est trop pour rester fluide.\n\nChoisis des cases plus grandes, ou découpe ton terrain en plusieurs plans.`);
    return;
  }

  if (id) {
    const plan = tousLesPlans().find(p => p.id === id);
    Object.assign(plan, {
      nom: f.get("nom").trim(), largeur: largeur, hauteur: hauteur,
      maille: maille, annee: Number(f.get("annee")) || plan.annee,
      nord: f.get("nord") || "haut"
    });
    // On retire ce qui dépasse du nouveau cadre
    [plan.plantations, plan.exclues].forEach(objet => {
      Object.keys(objet).forEach(cle => {
        const [x, y] = cle.split(",").map(Number);
        if (x >= colonnes(plan) || y >= rangees(plan)) delete objet[cle];
      });
    });
  } else {
    creerPlan(f.get("nom").trim(), largeur, hauteur, maille);
    const plan = planCourant();
    plan.annee = Number(f.get("annee")) || plan.annee;
    plan.nord = f.get("nord") || "haut";
  }
  sauver();
  fermerModale();
  afficher();
}

function supprimerPlan(id) {
  const plan = tousLesPlans().find(p => p.id === id);
  if (!confirm(`Supprimer le plan « ${plan.nom} » ? Cette action est définitive.`)) return;
  etat.plans = tousLesPlans().filter(p => p.id !== id);
  planOuvert = "";
  sauver();
  afficher();
}

function viderPlantations(id) {
  const plan = tousLesPlans().find(p => p.id === id);
  if (!Object.keys(plan.plantations).length) return;
  if (!confirm("Retirer toutes les plantes de ce plan ? La forme découpée est conservée.")) return;
  plan.plantations = {};
  sauver();
  afficher();
}

function dupliquerPlanAnneeSuivante(id) {
  const source = tousLesPlans().find(p => p.id === id);
  const copie = JSON.parse(JSON.stringify(source));
  copie.id = nouvelId();
  copie.annee = source.annee + 1;
  copie.plantations = {};   // on repart d'un plan vide : c'est tout l'intérêt de la rotation
  tousLesPlans().push(copie);
  planOuvert = copie.id;
  sauver();
  afficher();
  ouvrirModale("Plan " + copie.annee + " créé", `
    <p>La forme et les dimensions ont été reprises, mais <strong>les plantations sont vides</strong> :
    c'est voulu, pour que tu repenses ta rotation.</p>
    <p class="note">En replantant, l'appli comparera avec ${source.annee} et te préviendra si une
    famille revient au même endroit.</p>
    <div class="modale-actions"><button class="bouton" onclick="fermerModale()">D'accord</button></div>`);
}

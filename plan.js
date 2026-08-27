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

let outilPlan = { mode: "planter", planteId: "" };
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
  return id ? PLANTE_PAR_ID[id] : null;
}

/* Plantes réellement présentes sur le plan, dans l'ordre d'apparition */
function plantesDuPlan(plan) {
  const vues = [];
  for (let y = 0; y < rangees(plan); y++) {
    for (let x = 0; x < colonnes(plan); x++) {
      const id = plan.plantations[x + "," + y];
      if (id && !vues.includes(id)) vues.push(id);
    }
  }
  return vues;
}

function couleurPlante(plan, planteId) {
  const i = plantesDuPlan(plan).indexOf(planteId);
  return i < 0 ? "#9e9e9e" : COULEURS_PLAN[i % COULEURS_PLAN.length];
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
    const p = PLANTE_PAR_ID[id];
    const surface = compte[id] * surfaceMaille(plan);
    const densite = p ? densiteParM2(p) : null;
    return {
      plante: p, cellules: compte[id], surface: surface,
      nbPlants: densite ? Math.max(1, Math.round(surface * densite)) : null
    };
  }).sort((a, b) => b.surface - a.surface);
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

  // Rotation : même famille au même endroit que sur le plan de l'an dernier
  const precedent = tousLesPlans().find(a =>
    a.id !== plan.id && a.nom === plan.nom && a.annee === plan.annee - 1);
  const rotation = [];
  if (precedent) {
    Object.keys(plan.plantations).forEach(cle => {
      const p = PLANTE_PAR_ID[plan.plantations[cle]];
      const q = PLANTE_PAR_ID[precedent.plantations[cle]];
      if (!p || !q || p.viv || p.id === q.id) return;
      if (p.fam === q.fam) {
        const texte = `${p.nom} revient sur l'emplacement de ${q.nom} — même famille (${p.fam}).`;
        if (!rotation.includes(texte)) rotation.push(texte);
      }
    });
  }

  return {
    conflits: Object.keys(conflits).map(k => ({ paire: k, nb: conflits[k] })),
    bonus: Object.keys(bonus).map(k => ({ paire: k, nb: bonus[k] })),
    rotation: rotation,
    cellulesEnConflit: cellulesEnConflit,
    annePrecedente: !!precedent
  };
}

/* Score d'un emplacement pour une plante : + les amies autour, - les ennemies */
function scoreCellule(plan, x, y, plante) {
  if (!celluleValide(plan, x, y) || plan.plantations[x + "," + y]) return null;
  let score = 0, amies = 0, ennemies = 0;
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
  for (let y = 0; y < rangees(plan); y++) {
    for (let x = 0; x < colonnes(plan); x++) {
      const s = scoreCellule(plan, x, y, plante);
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
    ${panneauSurfaces(surfaces)}
  `;
}

/* ---------- Barre d'outils ---------- */

function barreOutils(plan) {
  const outils = [
    ["planter", "🎨", "Planter"],
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
    ${outilPlan.mode === "info" ? `<p class="note plan-aide">👆 Touche une case pour savoir ce qu'il y a dessus et ce qu'en pensent ses voisines.</p>` : ""}`;
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

  if (!liste.length) {
    return `
      <div class="alerte-assoc">
        Aucune plante à placer pour l'instant. Ajoute-en à ton planning, ou
        <button class="mini-bouton" onclick="choisirPlantePourPlan()">choisis-en une dans la bibliothèque</button>.
      </div>`;
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
    </div>`;
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
      ${[["toutes", "Toutes"], ["legume", "🥕"], ["fruit", "🍓"], ["aromatique", "🌿"], ["medicinale", "🌼"]].map(([v, l]) =>
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

  const cases = [];
  for (let y = 0; y < r; y++) {
    for (let x = 0; x < c; x++) {
      const cle = x + "," + y;
      const exclue = !!plan.exclues[cle];
      const id = plan.plantations[cle];
      const remplissage = exclue ? "#e6e3da" : (id ? couleurPlante(plan, id) : "#f7f9f4");
      const classes = ["case-plan"];
      if (exclue) classes.push("case-exclue");
      if (analyse.cellulesEnConflit[cle]) classes.push("case-conflit");
      if (suggestions[cle]) classes.push("case-suggeree");
      const p = id ? PLANTE_PAR_ID[id] : null;
      cases.push(
        `<rect class="${classes.join(" ")}" data-cle="${cle}" x="${x}" y="${y}" width="1" height="1"
               fill="${remplissage}" onclick="cliquerCellule(${x},${y})">
           <title>${x * plan.maille}–${(x + 1) * plan.maille} m / ${y * plan.maille}–${(y + 1) * plan.maille} m${p ? " · " + esc(p.nom) : exclue ? " · hors potager" : " · libre"}</title>
         </rect>`);
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
  const p = planteEn(plan, x, y);
  const cle = x + "," + y;
  const voisinage = voisines(plan, x, y)
    .map(v => v.planteId ? PLANTE_PAR_ID[v.planteId] : null)
    .filter(Boolean);
  const uniques = [];
  voisinage.forEach(q => { if (!uniques.some(u => u.id === q.id)) uniques.push(q); });

  let corps = `<p class="note">Case ${x * plan.maille}–${(x + 1) * plan.maille} m × ${y * plan.maille}–${(y + 1) * plan.maille} m`
    + (plan.exclues[cle] ? " — <strong>hors potager</strong>" : "") + "</p>";

  if (p) {
    corps += `<h4>${CATEGORIES[p.cat].emoji} ${esc(p.nom)}</h4>
      <p class="note">${esc(p.fam)} · ${esc(p.expo)} · espacement ${esc(p.esp)}</p>
      <p><a href="#plantes/${p.id}" onclick="fermerModale()">Voir la fiche complète →</a></p>`;

    const amies = uniques.filter(q => sontAmies(p, q));
    const ennemies = uniques.filter(q => sontEnnemies(p, q));
    if (ennemies.length) corps += `<div class="alerte-assoc">⚠️ ${esc(p.nom)} n'aime pas ${esc(ennemies.map(q => q.nom).join(", "))} juste à côté.</div>`;
    if (amies.length) corps += `<div class="info-assoc">🤝 Bien accompagnée par ${esc(amies.map(q => q.nom).join(", "))}.</div>`;
    if (!amies.length && !ennemies.length) corps += `<p class="note">Voisinage neutre.</p>`;
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
  const rien = !analyse.conflits.length && !analyse.rotation.length && !analyse.bonus.length && !compagnons.length;
  if (rien) return "";

  return `
    ${analyse.conflits.length ? `
      <div class="carte carte-alerte">
        <h3>⚠️ Voisinages à revoir <span class="compteur">${analyse.conflits.length}</span></h3>
        <ul class="liste-simple">${analyse.conflits.map(c =>
          `<li><strong>${esc(c.paire)}</strong> — ${c.nb} contact${c.nb > 1 ? "s" : ""} sur le plan. Éloigne-les d'au moins une case.</li>`).join("")}</ul>
        <p class="note">Les cases concernées sont bordées de rouge sur le plan.</p>
      </div>` : ""}

    ${analyse.rotation.length ? `
      <div class="carte carte-suivi">
        <h3>🔄 Rotation</h3>
        <ul class="liste-simple">${analyse.rotation.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
        <p class="note">Comparé au plan « ${esc(plan.nom)} » de ${plan.annee - 1}.</p>
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

function panneauSurfaces(surfaces) {
  if (!surfaces.length) return "";
  return `
    <div class="carte">
      <h3>📊 Ce que contient le plan</h3>
      <ul class="liste-surfaces">
        ${surfaces.map(s => `
          <li>
            <span class="pastille-couleur" style="--couleur:${couleurPlante(planCourant(), s.plante.id)}"></span>
            <span class="surface-nom">${CATEGORIES[s.plante.cat].emoji} ${esc(s.plante.nom)}</span>
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
      <label>Année
        <input type="number" name="annee" min="2000" max="2100" value="${plan ? plan.annee : anneePlanning()}">
      </label>
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
      maille: maille, annee: Number(f.get("annee")) || plan.annee
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

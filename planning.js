/* ============================================================
   Mon Potager — Mon planning de l'année
   Planning personnel : la bibliothèque sert de point de départ,
   tout reste ensuite ajustable à la main.
   ============================================================ */

const UNITES = ["kg", "g", "pièces", "bottes", "litres", "bouquets"];

const STATUTS_PLANNING = {
  prevu:   { label: "Prévu",     emoji: "○", classe: "st-prevu" },
  encours: { label: "En cours",  emoji: "◐", classe: "st-encours" },
  fait:    { label: "Fait",      emoji: "●", classe: "st-fait" },
  annule:  { label: "Annulé",    emoji: "✕", classe: "st-annule" }
};

/* Plantes qui ne supportent pas le gel : on alerte si elles sont
   plantées ou semées dehors avant la fin des gelées de printemps. */
const GEL_SENSIBLES = [
  "tomate", "aubergine", "poivron", "courgette", "concombre", "cornichon",
  "melon", "pasteque", "butternut", "potiron", "mais-doux", "basilic",
  "haricot-nain", "haricot-rame", "pourpier", "tetragone", "physalis",
  "poire-de-terre", "verveine-citronnelle", "passiflore", "sauge-ananas",
  "shiso", "stevia", "sarrasin"
];

const TYPES_OBSERVATION = {
  gel:        { label: "Gelée",             emoji: "❄️" },
  canicule:   { label: "Forte chaleur",     emoji: "🔥" },
  secheresse: { label: "Sécheresse",        emoji: "🏜️" },
  pluie:      { label: "Fortes pluies",     emoji: "🌧️" },
  grele:      { label: "Grêle",             emoji: "🧊" },
  vent:       { label: "Vent, tempête",     emoji: "💨" },
  autre:      { label: "Autre observation", emoji: "📝" }
};

/* ---------------- Accès aux données ---------------- */

function anneePlanning() {
  return etat.reglages.anneePlanning || aujourdhui().getFullYear();
}

function changerAnnee(delta) {
  etat.reglages.anneePlanning = anneePlanning() + delta;
  sauver();
  afficher();
}

function entreesPlanning(annee) {
  return etat.planning
    .filter(e => e.annee === (annee || anneePlanning()))
    .sort((a, b) => {
      const pa = PLANTE_PAR_ID[a.planteId], pb = PLANTE_PAR_ID[b.planteId];
      const da = premierMois(a), db = premierMois(b);
      if (da !== db) return da - db;
      return (pa ? pa.nom : "").localeCompare(pb ? pb.nom : "", "fr");
    });
}

function entreePlanning(id) { return etat.planning.find(e => e.id === id); }

function premierMois(entree) {
  const tous = ORDRE_ACTIONS.flatMap(c => entree.mois[c] || []);
  return tous.length ? Math.min.apply(null, tous) : 13;
}

/* Décale une liste de mois de N mois (report sur l'année : 13 -> 1) */
function decalerMois(liste, decalage) {
  if (!decalage) return liste.slice();
  return liste.map(m => ((m - 1 + decalage) % 12 + 12) % 12 + 1).sort((a, b) => a - b);
}

function ajouterAuPlanning(planteId, annee) {
  const p = PLANTE_PAR_ID[planteId];
  if (!p) return null;
  const cible = annee || anneePlanning();
  if (etat.planning.some(e => e.annee === cible && e.planteId === planteId)) return null;

  const decalage = etat.meteo.decalage || 0;
  const entree = {
    id: nouvelId(),
    annee: cible,
    planteId: planteId,
    zoneId: "",
    mois: {
      sa: decalerMois(p.sa || [], decalage),
      sp: decalerMois(p.sp || [], decalage),
      pl: decalerMois(p.pl || [], decalage),
      re: decalerMois(p.re || [], decalage)
    },
    objectif: "",
    unite: "kg",
    recoltes: [],
    faits: {},          // "pl-5" : true  → action cochée comme faite
    statut: "prevu",
    notes: ""
  };
  etat.planning.push(entree);
  sauver();
  return entree;
}

function supprimerEntreePlanning(id) {
  const e = entreePlanning(id);
  const p = e && PLANTE_PAR_ID[e.planteId];
  if (!confirm(`Retirer ${p ? p.nom : "cette plante"} du planning ${e.annee} ? Les récoltes enregistrées seront perdues.`)) return;
  etat.planning = etat.planning.filter(x => x.id !== id);
  sauver();
  afficher();
}

function basculerMoisPlanning(id, cle, mois) {
  const e = entreePlanning(id);
  if (!e) return;
  const liste = e.mois[cle] || (e.mois[cle] = []);
  const i = liste.indexOf(mois);
  if (i >= 0) liste.splice(i, 1); else liste.push(mois);
  liste.sort((a, b) => a - b);
  sauver();
  rafraichirGrilleModale(id);
}

function basculerFait(id, cle, mois) {
  const e = entreePlanning(id);
  if (!e) return;
  const marque = cle + "-" + mois;
  if (e.faits[marque]) delete e.faits[marque]; else e.faits[marque] = true;
  const total = ORDRE_ACTIONS.reduce((n, c) => n + (e.mois[c] || []).length, 0);
  const faits = Object.keys(e.faits).length;
  if (e.statut !== "annule") e.statut = faits === 0 ? "prevu" : (faits >= total ? "fait" : "encours");
  sauver();
  afficher();
}

/* ---------------- Récoltes ---------------- */

function totalRecoltes(entree) {
  const totaux = {};
  (entree.recoltes || []).forEach(r => {
    let u = r.unite || "kg";
    let q = Number(r.quantite) || 0;
    if (u === "g") { u = "kg"; q = q / 1000; }   // on n'affiche jamais « 5 000 g »
    totaux[u] = (totaux[u] || 0) + q;
  });
  return totaux;
}

function formaterTotaux(totaux) {
  const cles = Object.keys(totaux).filter(u => totaux[u] > 0);
  if (!cles.length) return "";
  return cles.map(u => nombreFr(totaux[u]) + " " + u).join(" · ");
}

function arrondi(n) {
  return Math.round(n * 100) / 100;
}

/* Nombre à la française : 5,5 et non 5.5 */
function nombreFr(n) {
  return arrondi(n).toLocaleString("fr-FR");
}

function bilanRecoltesAnnee(annee) {
  const totaux = {};
  entreesPlanning(annee).forEach(e => {
    const t = totalRecoltes(e);
    Object.keys(t).forEach(u => { totaux[u] = (totaux[u] || 0) + t[u]; });
  });
  return totaux;
}

/* ---------------- Alertes du planning ---------------- */

function moisDernierGel() {
  const d = etat.meteo.gelPrintemps || "05-15";
  return parseInt(d.split("-")[0], 10);
}

function moisPremierGel() {
  const d = etat.meteo.gelAutomne || "11-05";
  return parseInt(d.split("-")[0], 10);
}

function alertesPlanning(annee) {
  const entrees = entreesPlanning(annee);
  const alertes = [];
  const gelPrintemps = moisDernierGel();
  const gelAutomne = moisPremierGel();

  // 1. Risque de gel au printemps
  entrees.forEach(e => {
    const p = PLANTE_PAR_ID[e.planteId];
    if (!p || !GEL_SENSIBLES.includes(p.id)) return;
    const dehors = [].concat(e.mois.sp || [], e.mois.pl || []);
    const tropTot = dehors.filter(m => m >= 2 && m < gelPrintemps);
    const limite = dehors.filter(m => m === gelPrintemps);

    if (tropTot.length) {
      alertes.push({
        type: "gel",
        texte: `${p.nom} ne supporte pas le gel : une mise en terre ${deMois(Math.min.apply(null, tropTot))} est trop tôt, tes dernières gelées tombent vers le ${dateGelLisible(etat.meteo.gelPrintemps)}. Prévois un abri, ou décale.`,
        entreeId: e.id
      });
    } else if (limite.length) {
      alertes.push({
        type: "gel",
        texte: `${p.nom} est prévue ${enMois(gelPrintemps)}, le mois même de tes dernières gelées (vers le ${dateGelLisible(etat.meteo.gelPrintemps)}) : attends la fin du mois pour la sortir.`,
        entreeId: e.id
      });
    }
  });

  // 2. Récolte prévue après les premières gelées, pour une plante gélive
  entrees.forEach(e => {
    const p = PLANTE_PAR_ID[e.planteId];
    if (!p || !GEL_SENSIBLES.includes(p.id)) return;
    const tardives = (e.mois.re || []).filter(m => m > gelAutomne);
    if (tardives.length) {
      alertes.push({
        type: "gel",
        texte: `Récolte de ${p.nom} prévue ${enMois(Math.max.apply(null, tardives))}, après tes premières gelées (vers le ${dateGelLisible(etat.meteo.gelAutomne)}). Prévois un voile ou avance la récolte.`,
        entreeId: e.id
      });
    }
  });

  // 3. Mauvaises associations dans une même zone
  const parZone = {};
  entrees.forEach(e => {
    if (!e.zoneId) return;
    (parZone[e.zoneId] = parZone[e.zoneId] || []).push(e);
  });
  Object.keys(parZone).forEach(zid => {
    const liste = parZone[zid];
    const zone = zoneParId(zid);
    for (let i = 0; i < liste.length; i++) {
      for (let j = i + 1; j < liste.length; j++) {
        const a = PLANTE_PAR_ID[liste[i].planteId], b = PLANTE_PAR_ID[liste[j].planteId];
        if (!a || !b) continue;
        if ((a.ennemis || []).includes(b.nom) || (b.ennemis || []).includes(a.nom)) {
          alertes.push({
            type: "association",
            texte: `${a.nom} et ${b.nom} sont prévues toutes les deux dans « ${zone ? zone.nom : "une même zone"} », or elles ne s'entendent pas.`,
            entreeId: liste[i].id
          });
        }
      }
    }
  });

  // 4. Rotation : même famille au même endroit que l'an dernier
  entrees.forEach(e => {
    if (!e.zoneId) return;
    const p = PLANTE_PAR_ID[e.planteId];
    if (!p || p.viv) return;
    const precedent = etat.planning.find(x =>
      x.annee === e.annee - 1 && x.zoneId === e.zoneId && x.planteId !== e.planteId &&
      (PLANTE_PAR_ID[x.planteId] || {}).fam === p.fam);
    if (precedent) {
      const zone = zoneParId(e.zoneId);
      alertes.push({
        type: "rotation",
        texte: `Rotation : ${p.nom} (${p.fam}) revient dans « ${zone ? zone.nom : "la même zone"} », où tu avais déjà ${(PLANTE_PAR_ID[precedent.planteId] || {}).nom} — même famille — en ${e.annee - 1}. Change-la de place.`,
        entreeId: e.id
      });
    }
  });

  // 5. Mois surchargés
  const charge = chargeParMois(entrees);
  charge.forEach((n, i) => {
    if (n >= 12) alertes.push({
      type: "charge",
      texte: `${MOIS[i]} est très chargé : ${n} interventions prévues. Regarde si certains semis peuvent être décalés.`
    });
  });

  return alertes;
}

function chargeParMois(entrees) {
  const charge = new Array(12).fill(0);
  entrees.forEach(e => ORDRE_ACTIONS.forEach(c =>
    (e.mois[c] || []).forEach(m => { charge[m - 1]++; })));
  return charge;
}

function enMois(numero) {
  return "en " + MOIS[numero - 1].toLowerCase();
}

function dateGelLisible(jourMois) {
  if (!jourMois) return "?";
  const [m, j] = jourMois.split("-").map(Number);
  return `${j} ${MOIS[m - 1].toLowerCase()}`;
}

/* ---------------- Écran Planning ---------------- */

let ongletPlanning = "annee";

function vuePlanning() {
  const annee = anneePlanning();
  const entrees = entreesPlanning(annee);
  const alertes = alertesPlanning(annee);
  const bilan = formaterTotaux(bilanRecoltesAnnee(annee));

  const onglets = [
    ["annee", "Vue de l'année"],
    ["mois", "Mois par mois"],
    ["meteo", "Météo & gelées"]
  ];

  let contenu = "";
  if (ongletPlanning === "annee") contenu = planningVueAnnee(entrees, alertes);
  if (ongletPlanning === "mois") contenu = planningVueMois(entrees);
  if (ongletPlanning === "meteo") contenu = planningVueMeteo(annee);

  return `
    <header class="entete">
      <div class="planning-tete">
        <div>
          <p class="surtitre">Mon planning</p>
          <h1>Année ${annee}</h1>
        </div>
        <div class="selecteur-annee">
          <button class="bouton-icone" onclick="changerAnnee(-1)" title="Année précédente">◀</button>
          <span>${annee}</span>
          <button class="bouton-icone" onclick="changerAnnee(1)" title="Année suivante">▶</button>
        </div>
      </div>
      <p class="sous-titre">${entrees.length} plante${entrees.length > 1 ? "s" : ""} planifiée${entrees.length > 1 ? "s" : ""}${bilan ? " · récolté cette année : " + bilan : ""}</p>
    </header>

    <div class="onglets onglets-larges">
      ${onglets.map(([v, l]) =>
        `<button class="onglet ${ongletPlanning === v ? "actif" : ""}" onclick="ongletPlanning='${v}';afficher()">${l}</button>`).join("")}
    </div>

    ${contenu}
  `;
}

/* ---------- Vue de l'année (grille) ---------- */

function planningVueAnnee(entrees, alertes) {
  if (!entrees.length) {
    return `
      <div class="carte carte-astuce">
        <h3>Ton planning est vide</h3>
        <p>Choisis les plantes que tu veux cultiver cette année : l'appli remplit automatiquement les mois de semis, de plantation et de récolte à partir de sa bibliothèque. Ensuite, tu ajustes tout comme tu veux — c'est <em>ton</em> planning, pas celui du livre.</p>
        <button class="bouton" onclick="choisirPlantePlanning()">➕ Ajouter ma première plante</button>
        ${etat.planning.length ? `<p class="note marge-haut">Astuce : tu peux aussi <button class="mini-bouton" onclick="copierAnneePrecedente()">reprendre le planning de ${anneePlanning() - 1}</button></p>` : ""}
      </div>`;
  }

  const moisActuel = moisCourant();
  const charge = chargeParMois(entrees);
  const chargeMax = Math.max.apply(null, charge) || 1;

  const enTete = MOIS_COURT.map((m, i) =>
    `<div class="cal-mois ${i + 1 === moisActuel ? "cal-actuel" : ""}">${m}</div>`).join("");

  const lignes = entrees.map(e => {
    const p = PLANTE_PAR_ID[e.planteId];
    if (!p) return "";
    const zone = e.zoneId ? zoneParId(e.zoneId) : null;
    const st = STATUTS_PLANNING[e.statut] || STATUTS_PLANNING.prevu;
    const totaux = formaterTotaux(totalRecoltes(e));

    const cellules = [];
    for (let m = 1; m <= 12; m++) {
      const actes = ORDRE_ACTIONS.filter(c => (e.mois[c] || []).includes(m));
      cellules.push(`<div class="cal-case ${m === moisActuel ? "cal-actuel" : ""}" onclick="ajusterPeriodes('${e.id}')">${
        actes.map(c => `<span class="cal-marque ${ACTIONS[c].classe} ${e.faits[c + "-" + m] ? "marque-faite" : ""}" title="${ACTIONS[c].label}${e.faits[c + "-" + m] ? " — fait" : ""}"></span>`).join("")
      }</div>`);
    }

    return `
      <div class="cal-ligne ligne-planning ${e.statut === "annule" ? "ligne-annulee" : ""}">
        <div class="cal-nom plan-nom">
          <button class="plan-titre" onclick="ajusterPeriodes('${e.id}')">
            <span class="cal-emoji">${CATEGORIES[p.cat].emoji}</span>
            <span class="plan-nom-texte">
              <strong>${esc(p.nom)}</strong>
              <span class="plan-meta">
                <span class="statut-point ${st.classe}">${st.emoji}</span>${st.label}${zone ? " · " + esc(zone.nom) : ""}${totaux ? " · 🧺 " + esc(totaux) : ""}
              </span>
            </span>
          </button>
        </div>
        <div class="cal-cases">${cellules.join("")}</div>
      </div>`;
  }).join("");

  const barres = charge.map((n, i) => `
    <div class="charge-colonne ${i + 1 === moisActuel ? "cal-actuel" : ""}" title="${MOIS[i]} : ${n} intervention${n > 1 ? "s" : ""}">
      <div class="charge-barre" style="height:${Math.round(n / chargeMax * 100)}%"></div>
      <span class="charge-nombre">${n || ""}</span>
    </div>`).join("");

  return `
    <div class="barre-boutons">
      <button class="bouton" onclick="choisirPlantePlanning()">➕ Ajouter une plante</button>
      <button class="bouton bouton-doux" onclick="genererRappelsPlanning()">🔔 Créer les rappels</button>
      <button class="bouton bouton-doux" onclick="exporterPlanningCsv()">📤 Exporter</button>
    </div>

    ${alertes.length ? `
      <div class="carte carte-alerte">
        <h3>⚠️ À vérifier <span class="compteur">${alertes.length}</span></h3>
        <ul class="liste-simple">${alertes.map(a => `<li>${esc(a.texte)}</li>`).join("")}</ul>
      </div>` : `
      <div class="carte carte-perma">
        <h3>✅ Planning cohérent</h3>
        <p class="note">Aucun risque de gel, de mauvaise association, de rotation ni de surcharge détecté.</p>
      </div>`}

    <div class="legende">
      ${ORDRE_ACTIONS.map(c => `<span class="legende-item"><span class="cal-marque ${ACTIONS[c].classe}"></span>${ACTIONS[c].label}</span>`).join("")}
      <span class="legende-item"><span class="cal-marque marque-faite act-sp"></span>Fait</span>
    </div>

    <p class="note astuce-clic">👉 Touche le nom d'une plante (ou une case) pour ajuster ses mois, cocher ce qui est fait et noter tes récoltes.</p>

    <div class="calendrier">
      <div class="cal-entete">
        <div class="cal-nom cal-nom-entete">Plante</div>
        <div class="cal-cases">${enTete}</div>
      </div>
      ${lignes}
    </div>

    <div class="carte">
      <h3>📊 Charge de travail sur l'année</h3>
      <p class="note">Nombre d'interventions prévues chaque mois. Les pics valent souvent la peine d'être étalés.</p>
      <div class="charge-graphe">${barres}</div>
      <div class="charge-legende">${MOIS_COURT.map(m => `<span>${m[0]}</span>`).join("")}</div>
    </div>
  `;
}

/* ---------- Vue mois par mois ---------- */

let moisOuvert = 0;

function planningVueMois(entrees) {
  if (!moisOuvert) moisOuvert = moisCourant();

  const blocs = MOIS.map((nom, i) => {
    const m = i + 1;
    const actions = [];
    entrees.forEach(e => {
      const p = PLANTE_PAR_ID[e.planteId];
      if (!p || e.statut === "annule") return;
      ORDRE_ACTIONS.forEach(c => {
        if ((e.mois[c] || []).includes(m)) actions.push({ entree: e, plante: p, cle: c });
      });
    });

    const ouvert = m === moisOuvert;
    const faits = actions.filter(a => a.entree.faits[a.cle + "-" + m]).length;

    return `
      <div class="carte carte-mois ${ouvert ? "ouverte" : ""} ${m === moisCourant() ? "carte-mois-actuel" : ""}">
        <button class="mois-tete" onclick="moisOuvert=${ouvert ? 0 : m};afficher()">
          <span class="mois-nom">${nom}${m === moisCourant() ? ' <span class="badge">ce mois-ci</span>' : ""}</span>
          <span class="mois-compte">${actions.length ? `${faits}/${actions.length}` : "—"} <span class="chevron">${ouvert ? "▾" : "▸"}</span></span>
        </button>
        ${ouvert ? `
          ${actions.length ? `<ul class="liste-taches">${actions.map(a => {
            const marque = a.cle + "-" + m;
            const fait = !!a.entree.faits[marque];
            return `
              <li class="tache ${fait ? "faite" : ""}">
                <label>
                  <input type="checkbox" ${fait ? "checked" : ""} onchange="basculerFait('${a.entree.id}','${a.cle}',${m})">
                  <span class="tache-texte">
                    <strong>${ACTIONS[a.cle].emoji} ${ACTIONS[a.cle].court} — ${esc(a.plante.nom)}</strong>
                    <span class="tache-detail">${esc(a.plante.expo)} · profondeur ${esc(a.plante.prof)} · espacement ${esc(a.plante.esp)}</span>
                  </span>
                </label>
                <a class="bouton-icone" href="#plantes/${a.plante.id}" title="Fiche">📖</a>
                ${a.cle === "re" ? `<button class="bouton-icone" onclick="formulaireRecolte('${a.entree.id}')" title="Noter une récolte">🧺</button>` : ""}
              </li>`;
          }).join("")}</ul>` : `<p class="rien">Rien de prévu ce mois-ci dans ton planning.</p>`}
          <div class="travaux-mois">
            <h4>🌍 Travaux ${deMois(m)}</h4>
            <ul class="liste-simple">${(TRAVAUX[m] || []).map(t => `<li>${esc(t)}</li>`).join("")}</ul>
          </div>
        ` : ""}
      </div>`;
  }).join("");

  return `
    <div class="barre-boutons">
      <button class="bouton" onclick="choisirPlantePlanning()">➕ Ajouter une plante</button>
    </div>
    ${blocs}`;
}

/* ---------- Vue météo ---------- */

function planningVueMeteo(annee) {
  const journal = (etat.meteo.journal || [])
    .filter(o => o.date.startsWith(String(annee)))
    .sort((a, b) => b.date.localeCompare(a.date));

  const decalage = etat.meteo.decalage || 0;
  const libelleDecalage = decalage === 0 ? "aucun décalage"
    : (decalage > 0 ? `${decalage} mois plus tard` : `${-decalage} mois plus tôt`);

  return `
    ${blocMeteo()}

    <div class="carte">
      <h3>❄️ Mes dates de gelées</h3>
      <p class="note">Ce sont les deux dates qui commandent tout le potager. Observe-les sur ton terrain et affine-les d'année en année : un fond de vallée gèle bien plus tard qu'un coteau exposé au sud.</p>
      <div class="deux-colonnes">
        <label>Dernière gelée de printemps
          <input type="date" value="${annee}-${etat.meteo.gelPrintemps || "05-15"}"
                 onchange="enregistrerGel('gelPrintemps',this.value)">
        </label>
        <label>Première gelée d'automne
          <input type="date" value="${annee}-${etat.meteo.gelAutomne || "11-05"}"
                 onchange="enregistrerGel('gelAutomne',this.value)">
        </label>
      </div>
      <p class="note">Par défaut : les Saints de Glace (15 mai) et début novembre, valeurs courantes en climat tempéré Centre / Ouest.</p>
    </div>

    <div class="carte">
      <h3>📐 Décalage de saison</h3>
      <p class="note">Si ton terrain est systématiquement en avance ou en retard sur le calendrier de référence, règle-le ici : les nouvelles plantes ajoutées au planning seront décalées d'autant.</p>
      <div class="decalage-boutons">
        ${[-2, -1, 0, 1, 2].map(d => `
          <button class="onglet ${decalage === d ? "actif" : ""}" onclick="reglerDecalage(${d})">
            ${d === 0 ? "Aucun" : (d > 0 ? "+" : "") + d + " mois"}
          </button>`).join("")}
      </div>
      <p class="note marge-haut">Réglage actuel : <strong>${libelleDecalage}</strong>.
        ${decalage !== 0 ? `<button class="mini-bouton" onclick="appliquerDecalageAuPlanning()">L'appliquer au planning ${annee}</button>` : ""}</p>
    </div>

    <div class="carte">
      <h3>📖 Mon journal météo ${annee}</h3>
      <p class="note">Note ce qui sort de l'ordinaire : une gelée tardive, une canicule, trois semaines sans pluie. L'année prochaine, ces notes valent tous les almanachs.</p>
      <button class="bouton" onclick="formulaireObservation()">➕ Noter une observation</button>
      ${journal.length ? `<ul class="liste-observations">${journal.map(o => `
        <li class="observation">
          <span class="obs-emoji">${TYPES_OBSERVATION[o.type] ? TYPES_OBSERVATION[o.type].emoji : "📝"}</span>
          <span class="obs-texte">
            <strong>${TYPES_OBSERVATION[o.type] ? TYPES_OBSERVATION[o.type].label : "Observation"}</strong>
            <span class="tache-date">${dateFr(o.date)}</span>
            ${o.note ? `<span class="tache-detail">${esc(o.note)}</span>` : ""}
          </span>
          <button class="bouton-icone" onclick="supprimerObservation('${o.id}')" title="Supprimer">🗑</button>
        </li>`).join("")}</ul>`
      : `<p class="rien marge-haut">Aucune observation pour ${annee}.</p>`}
    </div>

    <div class="carte carte-astuce">
      <h3>💡 Lire son jardin sans station météo</h3>
      <ul class="liste-simple">
        <li><strong>Le sol avant le calendrier</strong> : un sol à moins de 10 °C ne fait germer ni haricot ni courgette, quelle que soit la date. Si la terre colle à la bêche, c'est trop tôt.</li>
        <li><strong>Les plantes sauvages sont le meilleur thermomètre</strong> : quand le lilas fleurit, on peut semer les haricots ; quand le pissenlit est en fleurs, la terre est réchauffée.</li>
        <li><strong>Une gelée blanche annoncée</strong> : arrose le soir, couvre d'un voile, et laisse le voile jusqu'au dégel complet du matin.</li>
        <li><strong>Après une forte pluie</strong>, n'entre pas sur les planches : marcher sur un sol détrempé le tasse pour des mois.</li>
        <li><strong>Canicule</strong> : arrose tôt le matin, jamais en plein soleil, et double l'épaisseur du paillage plutôt que la fréquence d'arrosage.</li>
      </ul>
    </div>
  `;
}

function enregistrerGel(cle, valeur) {
  if (!valeur) return;
  etat.meteo[cle] = valeur.slice(5); // on ne garde que MM-JJ
  sauver();
  afficher();
}

function reglerDecalage(d) {
  etat.meteo.decalage = d;
  sauver();
  afficher();
}

function appliquerDecalageAuPlanning() {
  const d = etat.meteo.decalage || 0;
  if (!d) return;
  const entrees = entreesPlanning();
  if (!confirm(`Décaler les ${entrees.length} plante(s) du planning de ${d > 0 ? "+" : ""}${d} mois ?`)) return;
  entrees.forEach(e => {
    ORDRE_ACTIONS.forEach(c => { e.mois[c] = decalerMois(e.mois[c] || [], d); });
    e.faits = {};
  });
  sauver();
  afficher();
}

function formulaireObservation() {
  ouvrirModale("Noter une observation", `
    <form onsubmit="enregistrerObservation(event)">
      <label>Type
        <select name="type">
          ${Object.keys(TYPES_OBSERVATION).map(t =>
            `<option value="${t}">${TYPES_OBSERVATION[t].emoji} ${TYPES_OBSERVATION[t].label}</option>`).join("")}
        </select>
      </label>
      <label>Date
        <input type="date" name="date" required value="${iso(aujourdhui())}">
      </label>
      <label>Ce que tu as constaté
        <textarea name="note" rows="3" placeholder="Gelée blanche, les pousses de courgette ont grillé…"></textarea>
      </label>
      <div class="modale-actions">
        <button type="button" class="bouton bouton-doux" onclick="fermerModale()">Annuler</button>
        <button type="submit" class="bouton">Enregistrer</button>
      </div>
    </form>`);
}

function enregistrerObservation(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  etat.meteo.journal = etat.meteo.journal || [];
  etat.meteo.journal.push({
    id: nouvelId(),
    type: f.get("type"),
    date: f.get("date"),
    note: f.get("note").trim()
  });
  sauver();
  fermerModale();
  afficher();
}

function supprimerObservation(id) {
  etat.meteo.journal = (etat.meteo.journal || []).filter(o => o.id !== id);
  sauver();
  afficher();
}

/* ---------- Choisir une plante ---------- */

let filtrePicker = { cat: "toutes", q: "", lettre: "" };

function choisirPlantePlanning() {
  ouvrirModale("Ajouter une plante au planning", `<div id="picker">${contenuPicker()}</div>`);
}

function contenuPicker() {
  const annee = anneePlanning();
  const dejaPlanifiees = entreesPlanning(annee).map(e => e.planteId);
  const liste = chercherPlantes(filtrePicker.q, filtrePicker.cat, null, null, filtrePicker.lettre);

  return `
    <input class="champ-recherche" type="search" placeholder="Rechercher une plante…" value="${esc(filtrePicker.q)}"
           oninput="filtrePicker.q=this.value;majPicker(true)">
    <div class="onglets">
      ${[["toutes", "Toutes"], ["legume", "🥕"], ["fruit", "🍓"], ["aromatique", "🌿"], ["medicinale", "🌼"], ["engrais", "🌾"]].map(([v, l]) =>
        `<button type="button" class="onglet ${filtrePicker.cat === v ? "actif" : ""}" onclick="filtrePicker.cat='${v}';majPicker()">${l}</button>`).join("")}
    </div>
    ${barreAlphabet("filtrePicker", filtrePicker, "majPicker")}
    <p class="note">${liste.length} plante${liste.length > 1 ? "s" : ""}</p>
    <div class="picker-liste">
      ${liste.map(p => {
        const deja = dejaPlanifiees.includes(p.id);
        return `
          <button type="button" class="picker-item ${deja ? "picker-deja" : ""}" ${deja ? "disabled" : ""}
                  onclick="validerAjoutPlanning('${p.id}')">
            <span class="cal-emoji">${CATEGORIES[p.cat].emoji}</span>
            <span class="picker-texte">
              <strong>${esc(p.nom)}</strong>
              <span class="note">${esc(p.fam)}${p.viv ? " · vivace" : ""}</span>
            </span>
            <span class="picker-signe">${deja ? "✓" : "＋"}</span>
          </button>`;
      }).join("") || `<p class="vide">Aucune plante ne correspond.</p>`}
    </div>`;
}

function majPicker(garderFocus) {
  const boite = document.getElementById("picker");
  if (!boite) return;
  boite.innerHTML = contenuPicker();
  if (garderFocus) {
    const champ = boite.querySelector(".champ-recherche");
    if (champ) { champ.focus(); champ.setSelectionRange(champ.value.length, champ.value.length); }
  }
}

function validerAjoutPlanning(planteId) {
  const entree = ajouterAuPlanning(planteId);
  fermerModale();
  if (entree) ajusterPeriodes(entree.id);
  else afficher();
}

function copierAnneePrecedente() {
  const source = anneePlanning() - 1;
  const aCopier = etat.planning.filter(e => e.annee === source);
  if (!aCopier.length) { alert(`Aucun planning enregistré pour ${source}.`); return; }
  if (!confirm(`Reprendre les ${aCopier.length} plante(s) de ${source} dans le planning ${anneePlanning()} ? Les récoltes ne sont pas copiées.`)) return;
  aCopier.forEach(e => {
    etat.planning.push({
      id: nouvelId(), annee: anneePlanning(), planteId: e.planteId, zoneId: e.zoneId,
      mois: { sa: (e.mois.sa || []).slice(), sp: (e.mois.sp || []).slice(),
              pl: (e.mois.pl || []).slice(), re: (e.mois.re || []).slice() },
      objectif: e.objectif, unite: e.unite, recoltes: [], faits: {}, statut: "prevu", notes: ""
    });
  });
  sauver();
  afficher();
}

/* ---------- Ajuster une entrée ---------- */

function ajusterPeriodes(id) {
  const e = entreePlanning(id);
  if (!e) return;
  const p = PLANTE_PAR_ID[e.planteId];
  ouvrirModale(p ? p.nom : "Entrée du planning", `<div id="editeur-planning">${contenuEditeur(id)}</div>`);
}

function contenuEditeur(id) {
  const e = entreePlanning(id);
  const p = PLANTE_PAR_ID[e.planteId];
  const totaux = formaterTotaux(totalRecoltes(e));

  const grille = ORDRE_ACTIONS.map(cle => `
    <div class="edit-ligne">
      <div class="edit-label ${ACTIONS[cle].classe}">${ACTIONS[cle].emoji} ${ACTIONS[cle].court}</div>
      <div class="edit-mois">
        ${MOIS_COURT.map((m, i) => {
          const mois = i + 1;
          const actif = (e.mois[cle] || []).includes(mois);
          const fait = !!e.faits[cle + "-" + mois];
          const reference = (p[cle] || []).includes(mois);
          return `<button type="button" class="edit-case ${actif ? ACTIONS[cle].classe + " edit-actif" : ""} ${fait ? "edit-fait" : ""} ${reference && !actif ? "edit-reference" : ""}"
                    title="${MOIS[i]}${reference ? " — conseillé par la bibliothèque" : ""}"
                    onclick="basculerMoisPlanning('${id}','${cle}',${mois})">${m}</button>`;
        }).join("")}
      </div>
    </div>`).join("");

  const recoltes = (e.recoltes || []).slice().sort((a, b) => b.date.localeCompare(a.date));

  return `
    <p class="note">${esc(p.fam)}${p.viv ? " · vivace" : ""} · cycle ${esc(p.cyc)} — <a href="#plantes/${p.id}" onclick="fermerModale()">voir la fiche</a></p>

    <h4>Périodes de l'année</h4>
    <p class="note">Touche un mois pour l'ajouter ou l'enlever. Les mois <span class="edit-case edit-reference exemple-case">·</span> en pointillés sont ceux que conseille la bibliothèque.</p>
    <div class="edit-grille">${grille}</div>

    <h4>Où et combien</h4>
    <div class="deux-colonnes">
      <label>Zone du potager
        <select onchange="majEntree('${id}','zoneId',this.value)">
          <option value="">— non assignée —</option>
          ${etat.zones.map(z => `<option value="${z.id}" ${e.zoneId === z.id ? "selected" : ""}>${esc(z.nom)}</option>`).join("")}
        </select>
      </label>
      <label>Objectif de récolte
        <input value="${esc(e.objectif)}" placeholder="20 kg, 6 pieds…" onchange="majEntree('${id}','objectif',this.value)">
      </label>
    </div>

    <label>Statut
      <select onchange="majEntree('${id}','statut',this.value)">
        ${Object.keys(STATUTS_PLANNING).map(s =>
          `<option value="${s}" ${e.statut === s ? "selected" : ""}>${STATUTS_PLANNING[s].label}</option>`).join("")}
      </select>
    </label>

    <label>Mes notes
      <textarea rows="2" placeholder="Variété, provenance des graines, ce qui a marché…"
                onchange="majEntree('${id}','notes',this.value)">${esc(e.notes)}</textarea>
    </label>

    <h4>🧺 Mes récoltes${totaux ? ` <span class="badge">${esc(totaux)}</span>` : ""}</h4>
    ${recoltes.length ? `<ul class="liste-recoltes">${recoltes.map(r => `
      <li>
        <span><strong>${nombreFr(r.quantite)} ${esc(r.unite)}</strong> · ${dateCourteFr(r.date)}${r.note ? " · " + esc(r.note) : ""}</span>
        <button class="bouton-icone" onclick="supprimerRecolte('${id}','${r.id}')" title="Supprimer">🗑</button>
      </li>`).join("")}</ul>` : `<p class="rien">Aucune récolte enregistrée.</p>`}
    <button type="button" class="bouton bouton-doux" onclick="formulaireRecolte('${id}')">➕ Noter une récolte</button>

    <div class="modale-actions modale-actions-reparties">
      <button type="button" class="bouton-danger" onclick="fermerModale();supprimerEntreePlanning('${id}')">Retirer du planning</button>
      <button type="button" class="bouton" onclick="fermerModale();afficher()">Terminé</button>
    </div>`;
}

function rafraichirGrilleModale(id) {
  const boite = document.getElementById("editeur-planning");
  if (boite) boite.innerHTML = contenuEditeur(id);
}

function majEntree(id, champ, valeur) {
  const e = entreePlanning(id);
  if (!e) return;
  e[champ] = valeur;
  sauver();
}

/* ---------- Récoltes ---------- */

function formulaireRecolte(id) {
  const e = entreePlanning(id);
  const p = PLANTE_PAR_ID[e.planteId];
  ouvrirModale(`Récolte : ${p.nom}`, `
    <form onsubmit="enregistrerRecolte(event,'${id}')">
      <div class="deux-colonnes">
        <label>Quantité
          <input type="number" name="quantite" step="0.1" min="0" required autofocus placeholder="2,5">
        </label>
        <label>Unité
          <select name="unite">
            ${UNITES.map(u => `<option ${e.unite === u ? "selected" : ""}>${u}</option>`).join("")}
          </select>
        </label>
      </div>
      <label>Date
        <input type="date" name="date" required value="${iso(aujourdhui())}">
      </label>
      <label>Note
        <textarea name="note" rows="2" placeholder="Belle qualité, quelques fruits éclatés…"></textarea>
      </label>
      <div class="modale-actions">
        <button type="button" class="bouton bouton-doux" onclick="fermerModale()">Annuler</button>
        <button type="submit" class="bouton">Enregistrer</button>
      </div>
    </form>`);
}

function enregistrerRecolte(ev, id) {
  ev.preventDefault();
  const f = new FormData(ev.target);
  const e = entreePlanning(id);
  e.recoltes = e.recoltes || [];
  e.recoltes.push({
    id: nouvelId(),
    quantite: Number(f.get("quantite")) || 0,
    unite: f.get("unite"),
    date: f.get("date"),
    note: f.get("note").trim()
  });
  e.unite = f.get("unite");
  sauver();
  fermerModale();
  afficher();
}

function supprimerRecolte(idEntree, idRecolte) {
  const e = entreePlanning(idEntree);
  e.recoltes = (e.recoltes || []).filter(r => r.id !== idRecolte);
  sauver();
  rafraichirGrilleModale(idEntree);
}

/* ---------- Rappels et export ---------- */

function genererRappelsPlanning() {
  const annee = anneePlanning();
  const entrees = entreesPlanning(annee);
  let crees = 0;

  entrees.forEach(e => {
    const p = PLANTE_PAR_ID[e.planteId];
    if (!p || e.statut === "annule") return;
    ORDRE_ACTIONS.forEach(cle => {
      (e.mois[cle] || []).forEach(m => {
        const identifiant = `plan-${e.id}-${cle}-${m}`;
        if (etat.taches.some(t => t.id === identifiant)) return;
        if (e.faits[cle + "-" + m]) return;
        etat.taches.push({
          id: identifiant,
          titre: `${ACTIONS[cle].label} : ${p.nom}`,
          detail: `Planning ${annee} · ${p.expo} · profondeur ${p.prof} · espacement ${p.esp}`,
          date: `${annee}-${String(m).padStart(2, "0")}-01`,
          planteId: p.id,
          fait: false,
          auto: false
        });
        crees++;
      });
    });
  });

  sauver();
  alert(crees
    ? `${crees} rappel${crees > 1 ? "s" : ""} créé${crees > 1 ? "s" : ""} au 1er du mois concerné. Retrouve-les dans l'onglet Rappels, où tu peux les décaler à la date que tu veux.`
    : "Tous les rappels de ce planning existent déjà.");
  afficher();
}

function exporterPlanningCsv() {
  const annee = anneePlanning();
  const entrees = entreesPlanning(annee);
  if (!entrees.length) { alert("Le planning est vide."); return; }

  const lignes = [["Plante", "Famille", "Zone", "Statut", "Semis abri", "Semis terre", "Plantation", "Récolte", "Objectif", "Récolté", "Notes"]];
  entrees.forEach(e => {
    const p = PLANTE_PAR_ID[e.planteId] || {};
    const zone = e.zoneId ? zoneParId(e.zoneId) : null;
    const mois = cle => (e.mois[cle] || []).map(m => MOIS_COURT[m - 1]).join(" ");
    lignes.push([
      p.nom || "", p.fam || "", zone ? zone.nom : "", (STATUTS_PLANNING[e.statut] || {}).label || "",
      mois("sa"), mois("sp"), mois("pl"), mois("re"),
      e.objectif || "", formaterTotaux(totalRecoltes(e)), (e.notes || "").replace(/\n/g, " ")
    ]);
  });

  const csv = "﻿" + lignes.map(l =>
    l.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(blob);
  lien.download = `planning-potager-${annee}.csv`;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(lien.href);
}

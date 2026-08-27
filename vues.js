/* ============================================================
   Mon Potager en permaculture — affichage des écrans
   ============================================================ */

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function deMois(numero) {
  const nom = MOIS[numero - 1].toLowerCase();
  return /^[aeiouy]/.test(nom) ? "d'" + nom : "de " + nom;
}

function pastille(cle) {
  const a = ACTIONS[cle];
  return `<span class="pastille ${a.classe}">${a.emoji} ${a.court}</span>`;
}

function lienPlante(p) {
  return `<a class="lien-plante" href="#plantes/${p.id}">${esc(p.nom)}</a>`;
}

/* ---------- Fenêtre modale ---------- */

function ouvrirModale(titre, corps) {
  const fond = document.getElementById("modale");
  fond.innerHTML = `
    <div class="modale-boite" role="dialog" aria-modal="true">
      <div class="modale-tete">
        <h2>${esc(titre)}</h2>
        <button class="bouton-icone" onclick="fermerModale()" aria-label="Fermer">✕</button>
      </div>
      <div class="modale-corps">${corps}</div>
    </div>`;
  fond.classList.add("ouverte");
  fond.onclick = e => { if (e.target === fond) fermerModale(); };
}

function fermerModale() {
  const fond = document.getElementById("modale");
  fond.classList.remove("ouverte");
  fond.innerHTML = "";
}

/* ============================================================
   ACCUEIL
   ============================================================ */

function vueAccueil() {
  const maintenant = aujourdhui();
  const mois = maintenant.getMonth() + 1;
  const semaine = numeroSemaine(maintenant);

  const retard = tachesEnRetard();
  const bientot = tachesProchainement(7);
  const suivies = actionsFavorisDuMois();

  const blocAction = (cle) => {
    const liste = plantesDuMois(mois, cle);
    if (!liste.length) return "";
    const a = ACTIONS[cle];
    return `
      <div class="carte">
        <h3 class="titre-action ${a.classe}">${a.emoji} ${a.label} <span class="compteur">${liste.length}</span></h3>
        <div class="nuage">${liste.map(p =>
          `<a class="puce ${estFavori(p.id) ? "puce-favorite" : ""}" href="#plantes/${p.id}">${esc(p.nom)}</a>`
        ).join("")}</div>
      </div>`;
  };

  const travaux = (TRAVAUX[mois] || []).map(t => `<li>${esc(t)}</li>`).join("");

  return `
    <header class="entete">
      <p class="surtitre">Semaine ${semaine} · ${maintenant.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
      <h1>${MOIS[mois - 1]} au potager</h1>
    </header>

    ${messageBienvenue()}

    ${bandeauSauvegardeAccueil()}

    ${resumeMeteoAccueil()}

    ${resumeAutonomieAccueil()}

    ${retard.length ? `
      <div class="carte carte-alerte">
        <h3>⏰ En retard <span class="compteur">${retard.length}</span></h3>
        <ul class="liste-taches">${retard.slice(0, 6).map(ligneTache).join("")}</ul>
        ${retard.length > 6 ? `<a class="lien-plus" href="#taches">Voir les ${retard.length} tâches en retard →</a>` : ""}
      </div>` : ""}

    ${bientot.length ? `
      <div class="carte">
        <h3>📅 Les 7 prochains jours <span class="compteur">${bientot.length}</span></h3>
        <ul class="liste-taches">${bientot.slice(0, 8).map(ligneTache).join("")}</ul>
      </div>` : ""}

    ${suivies.length ? `
      <div class="carte carte-suivi">
        <h3>⭐ Mes plantes suivies — à faire ce mois-ci</h3>
        <ul class="liste-simple">${suivies.map(s =>
          `<li>${pastille(s.action.cle)} ${lienPlante(s.plante)}</li>`).join("")}</ul>
      </div>` : `
      <div class="carte carte-astuce">
        <h3>⭐ Suis tes plantes</h3>
        <p>Mets une étoile sur les plantes que tu cultives : tu recevras un rappel dès que c'est le moment de les semer ou de les planter.</p>
        <a class="bouton" href="#plantes">Parcourir les plantes</a>
      </div>`}

    ${blocAction("sa")}
    ${blocAction("sp")}
    ${blocAction("pl")}
    ${blocAction("re")}

    <div class="carte carte-perma">
      <h3>🌍 Les travaux ${deMois(mois)}</h3>
      <ul class="liste-simple">${travaux}</ul>
      <a class="lien-plus" href="#permaculture">Toutes les fiches permaculture →</a>
    </div>
  `;
}

function ligneTache(t) {
  const jour = iso(aujourdhui());
  const enRetard = !t.fait && t.date < jour;
  const plante = t.planteId ? PLANTE_PAR_ID[t.planteId] : null;
  return `
    <li class="tache ${t.fait ? "faite" : ""} ${enRetard ? "retard" : ""}">
      <label>
        <input type="checkbox" ${t.fait ? "checked" : ""} onchange="basculerTache('${t.id}')">
        <span class="tache-texte">
          <strong>${esc(t.titre)}</strong>
          <span class="tache-date">${dateCourteFr(t.date)}${enRetard ? " · en retard" : ""}</span>
          ${t.detail ? `<span class="tache-detail">${esc(t.detail)}</span>` : ""}
        </span>
      </label>
      ${plante ? `<a class="bouton-icone" href="#plantes/${plante.id}" title="Fiche ${esc(plante.nom)}">📖</a>` : ""}
      ${t.auto ? "" : `<button class="bouton-icone" onclick="supprimerTache('${t.id}')" title="Supprimer">🗑</button>`}
    </li>`;
}

/* ============================================================
   CALENDRIER
   ============================================================ */

let filtreCalendrier = { cat: "toutes", q: "" };

function vueCalendrier() {
  const moisActuel = moisCourant();
  const liste = chercherPlantes(filtreCalendrier.q, filtreCalendrier.cat, null, null);

  const enTete = MOIS_COURT.map((m, i) =>
    `<div class="cal-mois ${i + 1 === moisActuel ? "cal-actuel" : ""}">${m}</div>`).join("");

  const lignes = liste.map(p => {
    const cellules = [];
    for (let m = 1; m <= 12; m++) {
      const actes = actionsDuMois(p, m);
      cellules.push(`<div class="cal-case ${m === moisActuel ? "cal-actuel" : ""}">${
        actes.map(c => `<span class="cal-marque ${ACTIONS[c].classe}" title="${ACTIONS[c].label}"></span>`).join("")
      }</div>`);
    }
    return `
      <div class="cal-ligne">
        <a class="cal-nom" href="#plantes/${p.id}">
          <span class="cal-emoji">${CATEGORIES[p.cat].emoji}</span>${esc(p.nom)}
        </a>
        <div class="cal-cases">${cellules.join("")}</div>
      </div>`;
  }).join("");

  return `
    <header class="entete">
      <h1>Calendrier annuel</h1>
      <p class="sous-titre">${liste.length} plante${liste.length > 1 ? "s" : ""} · climat tempéré Centre / Ouest</p>
    </header>

    ${barreFiltres("filtreCalendrier", filtreCalendrier)}

    <div class="legende">
      ${ORDRE_ACTIONS.map(c => `<span class="legende-item"><span class="cal-marque ${ACTIONS[c].classe}"></span>${ACTIONS[c].label}</span>`).join("")}
    </div>

    <div class="calendrier">
      <div class="cal-entete">
        <div class="cal-nom cal-nom-entete">Plante</div>
        <div class="cal-cases">${enTete}</div>
      </div>
      ${lignes || `<p class="vide">Aucune plante ne correspond à ta recherche.</p>`}
    </div>
  `;
}

function barreFiltres(nomVariable, valeurs) {
  const onglets = [
    ["toutes", "Toutes"],
    ["legume", "🥕 Légumes"],
    ["fruit", "🍓 Fruits"],
    ["aromatique", "🌿 Aromatiques"],
    ["medicinale", "🌼 Médicinales"]
  ];
  return `
    <div class="filtres">
      <input class="champ-recherche" type="search" placeholder="Rechercher une plante, une famille, un bienfait…"
             value="${esc(valeurs.q)}" oninput="majFiltre('${nomVariable}','q',this.value)">
      <div class="onglets">
        ${onglets.map(([v, l]) =>
          `<button class="onglet ${valeurs.cat === v ? "actif" : ""}" onclick="majFiltre('${nomVariable}','cat','${v}')">${l}</button>`
        ).join("")}
      </div>
    </div>`;
}

/* Retrouve l'objet de filtre à partir de son nom (résolu à l'appel, donc
   indépendant de l'ordre de chargement des fichiers) */
function objetFiltre(nom) {
  if (nom === "filtreCalendrier") return filtreCalendrier;
  if (nom === "filtrePicker") return filtrePicker;
  return filtrePlantes;
}

function majFiltre(nomVariable, cle, valeur) {
  const cible = objetFiltre(nomVariable);
  cible[cle] = valeur;
  afficher();
  if (cle === "q") {
    const champ = document.querySelector(".champ-recherche");
    if (champ) { champ.focus(); champ.setSelectionRange(valeur.length, valeur.length); }
  }
}

/* Filtre alphabétique réutilisable.
   fonctionMaj : nom de la fonction à rappeler après clic ("afficher" par défaut) */
function barreAlphabet(nomVariable, valeurs, fonctionMaj) {
  const maj = fonctionMaj || "afficher";
  const lettreActive = valeurs.lettre || "";
  const bouton = (lettre, libelle, dispo) => `
    <button type="button" class="lettre ${lettreActive === lettre ? "actif" : ""} ${dispo ? "" : "lettre-vide"}"
            ${dispo ? "" : "disabled"}
            onclick="objetFiltre('${nomVariable}').lettre='${lettre}';${maj}()">${libelle}</button>`;

  return `
    <div class="alphabet" role="group" aria-label="Filtrer par première lettre">
      ${bouton("", "Tout", true)}
      ${ALPHABET.map(l => bouton(l, l, !!LETTRES_DISPONIBLES[l])).join("")}
    </div>`;
}

/* ============================================================
   PLANTES (liste + fiche détaillée)
   ============================================================ */

let filtrePlantes = { cat: "toutes", q: "", mois: 0, lettre: "" };

function vuePlantes(idPlante) {
  if (idPlante && PLANTE_PAR_ID[idPlante]) return fichePlante(PLANTE_PAR_ID[idPlante]);

  const moisFiltre = Number(filtrePlantes.mois) || null;
  const liste = chercherPlantes(filtrePlantes.q, filtrePlantes.cat, moisFiltre, null, filtrePlantes.lettre);

  const cartes = liste.map(p => {
    const actes = moisFiltre ? actionsDuMois(p, moisFiltre) : actionsDuMois(p, moisCourant());
    return `
      <a class="carte-plante" href="#plantes/${p.id}">
        <div class="carte-plante-tete">
          <span class="carte-plante-emoji">${CATEGORIES[p.cat].emoji}</span>
          <div>
            <h3>${esc(p.nom)}${estFavori(p.id) ? ' <span class="etoile">★</span>' : ""}</h3>
            <p class="latin">${esc(p.latin)}</p>
          </div>
        </div>
        <p class="carte-plante-fam">${esc(p.fam)}${p.viv ? " · vivace" : ""}${p.med ? " · usage médicinal" : ""}</p>
        <div class="nuage-petit">${actes.map(c => pastille(c)).join("") || '<span class="rien">Rien à faire ce mois-ci</span>'}</div>
      </a>`;
  }).join("");

  return `
    <header class="entete">
      <h1>Les plantes</h1>
      <p class="sous-titre">${liste.length} fiche${liste.length > 1 ? "s" : ""} sur ${PLANTES.length}${filtrePlantes.lettre ? ` · lettre ${filtrePlantes.lettre}` : ""}</p>
    </header>

    ${barreFiltres("filtrePlantes", filtrePlantes)}

    ${barreAlphabet("filtrePlantes", filtrePlantes)}

    <div class="filtre-mois">
      <label>Filtrer par mois d'intervention
        <select onchange="majFiltre('filtrePlantes','mois',this.value)">
          <option value="0">Tous les mois</option>
          ${MOIS.map((m, i) => `<option value="${i + 1}" ${Number(filtrePlantes.mois) === i + 1 ? "selected" : ""}>${m}</option>`).join("")}
        </select>
      </label>
    </div>

    <div class="grille-plantes">${cartes || `<p class="vide">Aucune plante ne correspond.</p>`}</div>
  `;
}

function fichePlante(p) {
  const bande = (cle) => {
    const mois = p[cle] || [];
    if (!mois.length) return "";
    const a = ACTIONS[cle];
    return `
      <div class="frise">
        <div class="frise-label">${a.emoji} ${a.label}</div>
        <div class="frise-mois">${MOIS_COURT.map((m, i) =>
          `<span class="frise-case ${mois.includes(i + 1) ? a.classe + " frise-active" : ""}" title="${MOIS[i]}">${m[0]}</span>`
        ).join("")}</div>
      </div>`;
  };

  const listeNoms = (noms, classe) => {
    if (!noms || !noms.length) return `<p class="rien">Aucune indication particulière.</p>`;
    return `<div class="nuage">${noms.map(n => {
      const cible = PLANTE_PAR_NOM[n];
      return cible
        ? `<a class="puce ${classe}" href="#plantes/${cible.id}">${esc(n)}</a>`
        : `<span class="puce ${classe}">${esc(n)}</span>`;
    }).join("")}</div>`;
  };

  const rotation = ROTATION.find(r => r.familles.includes(p.fam));

  return `
    <header class="entete entete-fiche">
      <a class="retour" href="#plantes">← Toutes les plantes</a>
      <div class="fiche-tete">
        <div>
          <p class="surtitre">${CATEGORIES[p.cat].emoji} ${CATEGORIES[p.cat].label} · ${esc(p.fam)}${p.viv ? " · vivace" : " · annuelle"}</p>
          <h1>${esc(p.nom)}</h1>
          <p class="latin">${esc(p.latin)}</p>
        </div>
        <button class="bouton-etoile ${estFavori(p.id) ? "active" : ""}" onclick="clicFavori('${p.id}')">
          ${estFavori(p.id) ? "★ Suivie" : "☆ Suivre"}
        </button>
      </div>
    </header>

    <div class="carte">
      <h3>📅 Quand intervenir</h3>
      ${ORDRE_ACTIONS.map(bande).join("") || `<p class="rien">Pas de calendrier renseigné.</p>`}
    </div>

    <div class="carte">
      <h3>🌱 Comment la cultiver</h3>
      <dl class="fiche-infos">
        <div><dt>Exposition</dt><dd>${esc(p.expo)}</dd></div>
        <div><dt>Sol</dt><dd>${esc(p.sol)}</dd></div>
        <div><dt>Arrosage</dt><dd>${esc(p.eau)}</dd></div>
        <div><dt>Espacement</dt><dd>${esc(p.esp)}</dd></div>
        <div><dt>Profondeur de semis</dt><dd>${esc(p.prof)}</dd></div>
        <div><dt>Levée</dt><dd>${esc(p.lev)}</dd></div>
        <div><dt>Du semis à la récolte</dt><dd>${esc(p.cyc)}</dd></div>
      </dl>
    </div>

    ${p.arbre ? `
    <div class="carte carte-arbre">
      <h3>🌳 Arbre et arbuste : ce qui change</h3>
      <dl class="fiche-infos">
        <div><dt>Pollinisation</dt><dd>${esc(p.arbre.pollinisation)}</dd></div>
        <div><dt>Taille</dt><dd>${esc(p.arbre.taille)}</dd></div>
        <div><dt>Forme conseillée</dt><dd>${esc(p.arbre.forme)}</dd></div>
        <div><dt>Première récolte</dt><dd>${esc(p.arbre.premiere)}</dd></div>
      </dl>
    </div>` : ""}

    <div class="carte carte-perma">
      <h3>🌍 En permaculture</h3>
      <p>${esc(p.perma)}</p>
    </div>

    ${p.conseils ? `
    <div class="carte">
      <h3>💡 Bon à savoir</h3>
      <p>${esc(p.conseils)}</p>
    </div>` : ""}

    <div class="carte">
      <h3>🤝 Bonnes associations</h3>
      ${listeNoms(p.amis, "puce-amie")}
      <h3 class="marge-haut">⚠️ À éviter à côté</h3>
      ${listeNoms(p.ennemis, "puce-ennemie")}
    </div>

    ${rotation ? `
    <div class="carte">
      <h3>🔄 Rotation des cultures</h3>
      <p><strong>${esc(p.fam)}</strong> — groupe « ${esc(rotation.groupe)} », position ${rotation.ordre} sur 4 dans la rotation.</p>
      <p class="note">${esc(rotation.note)}</p>
      <p class="note">Attends au moins 3 à 4 ans avant de remettre une plante de la même famille au même endroit.</p>
    </div>` : ""}

    ${p.med ? `
    <div class="carte carte-medicinale">
      <h3>⚕️ Propriétés médicinales</h3>
      <p class="note"><strong>Partie utilisée :</strong> ${esc(p.med.partie)}</p>
      <ul class="liste-simple">${p.med.bienfaits.map(b => `<li>${esc(b)}</li>`).join("")}</ul>
      <h4>Préparation et usage</h4>
      <p>${esc(p.med.usage)}</p>
      <div class="encart-precaution">
        <strong>Précautions</strong>
        <p>${esc(p.med.precautions)}</p>
      </div>
      <p class="mention-legale">Informations d'usage traditionnel, données à titre indicatif. Elles ne remplacent pas l'avis d'un médecin ou d'un pharmacien, en particulier en cas de traitement en cours, de grossesse ou pour un enfant.</p>
    </div>` : ""}

    <div class="actions-fiche">
      <button class="bouton" onclick="formulaireCulture(null,'${p.id}')">➕ L'ajouter à mon potager</button>
    </div>
  `;
}

function clicFavori(id) {
  basculerFavori(id);
  afficher();
}

/* ============================================================
   MON POTAGER
   ============================================================ */

let ongletPotager = "plan";

function vuePotager() {
  const onglets = [["plan", "📐 Plan"], ["zones", "📋 Mes planches"]];
  return `
    <header class="entete">
      <h1>Mon potager</h1>
      <p class="sous-titre">${ongletPotager === "plan"
        ? "Dessine ta parcelle et place tes plantes"
        : "Ce que tu as semé et planté, planche par planche"}</p>
    </header>
    <div class="onglets onglets-larges">
      ${onglets.map(([v, l]) =>
        `<button class="onglet ${ongletPotager === v ? "actif" : ""}" onclick="ongletPotager='${v}';afficher()">${l}</button>`).join("")}
    </div>
    ${ongletPotager === "plan" ? vuePlan() : vueZones()}`;
}

function vueZones() {
  if (!etat.zones.length) {
    return `
      <div class="carte carte-astuce">
        <h3>Commence par créer une zone</h3>
        <p>Une zone, c'est une planche, un carré, une jardinière, une serre… Tu y enregistreras ensuite ce que tu sèmes et ce que tu plantes, et l'appli te préviendra des associations à éviter et de la rotation des cultures.</p>
        <button class="bouton" onclick="formulaireZone()">➕ Créer ma première zone</button>
      </div>`;
  }

  const zones = etat.zones.map(z => {
    const cultures = culturesDeZone(z.id).sort((a, b) => b.date.localeCompare(a.date));
    const actives = cultures.filter(c => c.statut !== "termine");
    const familles = {};
    actives.forEach(c => {
      const p = PLANTE_PAR_ID[c.planteId];
      if (p) familles[p.fam] = (familles[p.fam] || 0) + 1;
    });

    const alertes = [];
    actives.forEach(c => {
      const conflits = conflitsAssociation(z.id, c.planteId);
      const p = PLANTE_PAR_ID[c.planteId];
      if (p && conflits.length) {
        const message = `${p.nom} et ${conflits.join(", ")} ne s'entendent pas.`;
        if (!alertes.includes(message)) alertes.push(message);
      }
    });

    return `
      <div class="carte carte-zone">
        <div class="zone-tete">
          <div>
            <h3>${esc(z.nom)}</h3>
            <p class="note">${esc(z.expo || "Exposition non précisée")}${z.notes ? " · " + esc(z.notes) : ""}</p>
          </div>
          <div class="zone-boutons">
            <button class="bouton-icone" onclick="formulaireZone('${z.id}')" title="Modifier">✏️</button>
            <button class="bouton-icone" onclick="supprimerZone('${z.id}')" title="Supprimer">🗑</button>
          </div>
        </div>

        ${alertes.length ? `<div class="alerte-assoc">⚠️ ${alertes.map(esc).join("<br>")}</div>` : ""}

        ${Object.keys(familles).length ? `<p class="familles">${Object.keys(familles).map(f =>
          `<span class="puce puce-famille">${esc(f)} × ${familles[f]}</span>`).join("")}</p>` : ""}

        ${cultures.length ? `<ul class="liste-cultures">${cultures.map(ligneCulture).join("")}</ul>`
          : `<p class="rien">Rien de planté ici pour l'instant.</p>`}

        <button class="bouton bouton-doux" onclick="formulaireCulture('${z.id}')">➕ Ajouter une culture</button>
      </div>`;
  }).join("");

  return `
    <p class="note">${etat.zones.length} zone${etat.zones.length > 1 ? "s" : ""} · ${culturesActives().length} culture${culturesActives().length > 1 ? "s" : ""} en cours</p>
    ${zones}
    <button class="bouton" onclick="formulaireZone()">➕ Nouvelle zone</button>
  `;
}

function ligneCulture(c) {
  const p = PLANTE_PAR_ID[c.planteId];
  if (!p) return "";
  const type = TYPES_CULTURE[c.type] || { label: c.type };
  const rot = conflitRotation(c.zoneId, c.planteId);
  return `
    <li class="culture statut-${c.statut}">
      <div class="culture-info">
        <a class="culture-nom" href="#plantes/${p.id}">${CATEGORIES[p.cat].emoji} ${esc(p.nom)}</a>
        <span class="culture-meta">${esc(type.label)} le ${dateCourteFr(c.date)}${c.quantite ? " · " + esc(c.quantite) : ""} · ${esc(STATUTS[c.statut] || c.statut)}</span>
        ${c.notes ? `<span class="culture-notes">${esc(c.notes)}</span>` : ""}
        ${rot ? `<span class="culture-rotation">🔄 ${esc(rot.plante)} (${esc(rot.famille)}) a déjà occupé cette zone le ${dateCourteFr(rot.date)} — pense à la rotation.</span>` : ""}
      </div>
      <div class="culture-boutons">
        <button class="bouton-icone" onclick="formulaireCulture('${c.zoneId}',null,'${c.id}')" title="Modifier">✏️</button>
        <button class="bouton-icone" onclick="supprimerCulture('${c.id}')" title="Supprimer">🗑</button>
      </div>
    </li>`;
}

/* ---------- Formulaires zone ---------- */

function formulaireZone(id) {
  const z = id ? zoneParId(id) : null;
  ouvrirModale(z ? "Modifier la zone" : "Nouvelle zone", `
    <form onsubmit="enregistrerZone(event,'${id || ""}')">
      <label>Nom de la zone
        <input name="nom" required placeholder="Planche nord, carré des aromatiques…" value="${esc(z ? z.nom : "")}">
      </label>
      <label>Exposition
        <select name="expo">
          ${["", "Plein soleil", "Mi-ombre", "Ombre", "Sous serre / abri"].map(o =>
            `<option ${z && z.expo === o ? "selected" : ""}>${o || "— à préciser —"}</option>`).join("")}
        </select>
      </label>
      <label>Notes (taille, type de sol…)
        <textarea name="notes" rows="2">${esc(z ? z.notes : "")}</textarea>
      </label>
      <div class="modale-actions">
        <button type="button" class="bouton bouton-doux" onclick="fermerModale()">Annuler</button>
        <button type="submit" class="bouton">Enregistrer</button>
      </div>
    </form>`);
}

function enregistrerZone(e, id) {
  e.preventDefault();
  const f = new FormData(e.target);
  const donnees = {
    nom: f.get("nom").trim(),
    expo: f.get("expo") === "— à préciser —" ? "" : f.get("expo"),
    notes: f.get("notes").trim()
  };
  if (id) Object.assign(zoneParId(id), donnees);
  else etat.zones.push(Object.assign({ id: nouvelId() }, donnees));
  sauver();
  fermerModale();
  afficher();
}

function supprimerZone(id) {
  const z = zoneParId(id);
  const n = culturesDeZone(id).length;
  if (!confirm(`Supprimer « ${z.nom} »${n ? ` et ses ${n} culture(s)` : ""} ? Cette action est définitive.`)) return;
  etat.zones = etat.zones.filter(x => x.id !== id);
  etat.cultures = etat.cultures.filter(c => c.zoneId !== id);
  synchroniserTaches();
  sauver();
  afficher();
}

/* ---------- Formulaire culture ---------- */

function formulaireCulture(zoneId, planteId, cultureId) {
  if (!etat.zones.length) {
    ouvrirModale("Crée d'abord une zone", `
      <p>Pour enregistrer une culture, il faut d'abord une zone (une planche, un carré, une jardinière…).</p>
      <div class="modale-actions"><button class="bouton" onclick="fermerModale();formulaireZone()">Créer une zone</button></div>`);
    return;
  }

  const c = cultureId ? etat.cultures.find(x => x.id === cultureId) : null;
  const zoneChoisie = c ? c.zoneId : (zoneId || etat.zones[0].id);
  const planteChoisie = c ? c.planteId : (planteId || "");

  const optionsPlantes = Object.keys(CATEGORIES).map(cat => {
    const liste = PLANTES.filter(p => p.cat === cat);
    return `<optgroup label="${CATEGORIES[cat].pluriel}">${liste.map(p =>
      `<option value="${p.id}" ${planteChoisie === p.id ? "selected" : ""}>${esc(p.nom)}</option>`).join("")}</optgroup>`;
  }).join("");

  ouvrirModale(c ? "Modifier la culture" : "Nouvelle culture", `
    <form onsubmit="enregistrerCulture(event,'${cultureId || ""}')">
      <label>Zone
        <select name="zoneId" onchange="apercuAssociations()">
          ${etat.zones.map(z => `<option value="${z.id}" ${zoneChoisie === z.id ? "selected" : ""}>${esc(z.nom)}</option>`).join("")}
        </select>
      </label>
      <label>Plante
        <select name="planteId" required onchange="apercuAssociations()">
          <option value="">— choisir —</option>
          ${optionsPlantes}
        </select>
      </label>
      <div id="apercu-assoc"></div>
      <label>Type
        <select name="type">
          ${Object.keys(TYPES_CULTURE).map(t =>
            `<option value="${t}" ${c && c.type === t ? "selected" : ""}>${TYPES_CULTURE[t].label}</option>`).join("")}
        </select>
      </label>
      <label>Date
        <input type="date" name="date" required value="${c ? c.date : iso(aujourdhui())}">
      </label>
      <label>Quantité
        <input name="quantite" placeholder="6 pieds, 1 rang de 2 m…" value="${esc(c ? c.quantite : "")}">
      </label>
      <label>Statut
        <select name="statut">
          ${Object.keys(STATUTS).map(s =>
            `<option value="${s}" ${c && c.statut === s ? "selected" : ""}>${STATUTS[s]}</option>`).join("")}
        </select>
      </label>
      <label>Notes
        <textarea name="notes" rows="2" placeholder="Variété, provenance des graines…">${esc(c ? c.notes : "")}</textarea>
      </label>
      <div class="modale-actions">
        <button type="button" class="bouton bouton-doux" onclick="fermerModale()">Annuler</button>
        <button type="submit" class="bouton">Enregistrer</button>
      </div>
    </form>`);
  apercuAssociations();
}

function apercuAssociations() {
  const boite = document.getElementById("apercu-assoc");
  if (!boite) return;
  const form = boite.closest("form");
  const zoneId = form.zoneId.value;
  const planteId = form.planteId.value;
  if (!planteId) { boite.innerHTML = ""; return; }

  const conflits = conflitsAssociation(zoneId, planteId);
  const rot = conflitRotation(zoneId, planteId);
  const p = PLANTE_PAR_ID[planteId];
  let html = "";

  if (conflits.length) {
    html += `<div class="alerte-assoc">⚠️ ${esc(p.nom)} n'aime pas la compagnie de ${esc(conflits.join(", "))} déjà présent(s) dans cette zone.</div>`;
  }
  if (rot) {
    html += `<div class="alerte-rotation">🔄 ${esc(rot.plante)}, de la même famille (${esc(rot.famille)}), a occupé cette zone le ${dateCourteFr(rot.date)}. L'idéal est d'attendre 3 à 4 ans.</div>`;
  }
  if (!html && p.amis && p.amis.length) {
    html = `<div class="info-assoc">🤝 Bons voisins : ${esc(p.amis.slice(0, 5).join(", "))}.</div>`;
  }
  boite.innerHTML = html;
}

function enregistrerCulture(e, id) {
  e.preventDefault();
  const f = new FormData(e.target);
  const donnees = {
    zoneId: f.get("zoneId"),
    planteId: f.get("planteId"),
    type: f.get("type"),
    date: f.get("date"),
    quantite: f.get("quantite").trim(),
    statut: f.get("statut"),
    notes: f.get("notes").trim()
  };
  if (id) Object.assign(etat.cultures.find(c => c.id === id), donnees);
  else etat.cultures.push(Object.assign({ id: nouvelId() }, donnees));
  synchroniserTaches();
  sauver();
  fermerModale();
  if (pageCourante() !== "potager") aller("#potager"); else afficher();
}

function supprimerCulture(id) {
  if (!confirm("Supprimer cette culture et ses rappels associés ?")) return;
  etat.cultures = etat.cultures.filter(c => c.id !== id);
  synchroniserTaches();
  sauver();
  afficher();
}

/* ============================================================
   TÂCHES & RAPPELS
   ============================================================ */

let afficherTachesFaites = false;

function vueTaches() {
  const jour = iso(aujourdhui());
  let liste = tachesTriees();
  if (!afficherTachesFaites) liste = liste.filter(t => !t.fait);

  const groupes = {
    "En retard": liste.filter(t => !t.fait && t.date < jour),
    "Cette semaine": liste.filter(t => t.date >= jour && t.date <= ajouterJours(jour, 7)),
    "À venir": liste.filter(t => t.date > ajouterJours(jour, 7)),
    "Terminées": liste.filter(t => t.fait)
  };

  const sections = Object.keys(groupes).filter(g => groupes[g].length).map(g => `
    <div class="carte">
      <h3>${g} <span class="compteur">${groupes[g].length}</span></h3>
      <ul class="liste-taches">${groupes[g].map(ligneTache).join("")}</ul>
    </div>`).join("");

  const suivies = actionsFavorisDuMois();

  return `
    <header class="entete">
      <h1>Mes rappels</h1>
      <p class="sous-titre">Les rappels de récolte et de repiquage se créent tout seuls quand tu ajoutes une culture.</p>
    </header>

    <div class="barre-boutons">
      <button class="bouton" onclick="formulaireTache()">➕ Nouveau rappel</button>
      <button class="bouton bouton-doux" onclick="afficherTachesFaites=!afficherTachesFaites;afficher()">
        ${afficherTachesFaites ? "Masquer" : "Afficher"} les tâches faites
      </button>
    </div>

    ${suivies.length ? `
      <div class="carte carte-suivi">
        <h3>⭐ Suggestions ${deMois(moisCourant())}</h3>
        <p class="note">D'après les plantes que tu suis :</p>
        <ul class="liste-simple">${suivies.map(s => `
          <li>
            ${pastille(s.action.cle)} ${lienPlante(s.plante)}
            <button class="mini-bouton" onclick="creerTacheDepuisSuggestion('${s.plante.id}','${s.action.cle}')">Créer le rappel</button>
          </li>`).join("")}</ul>
      </div>` : ""}

    ${sections || `<div class="carte"><p class="rien">Aucun rappel pour le moment. 🌤</p></div>`}

    ${blocNotifications()}
  `;
}

function blocNotifications() {
  const actif = etat.reglages.notifs && notificationsPossibles() && Notification.permission === "granted";
  return `
    <div class="carte carte-reglages">
      <h3>🔔 Notifications</h3>
      <p class="note">${actif
        ? "Activées : à l'ouverture de l'appli, tu es prévenue s'il y a des tâches en retard ou des semis à faire."
        : "Reçois une notification quand des tâches sont en retard ou qu'un semis est à faire ce mois-ci."}</p>
      ${actif
        ? `<button class="bouton bouton-doux" onclick="desactiverNotifications()">Désactiver</button>`
        : `<button class="bouton" onclick="demanderNotifications()">Activer les notifications</button>`}
    </div>

    ${carteSynchronisation()}

    ${carteSauvegarde()}`;
}

async function demanderNotifications() {
  await activerNotifications();
  afficher();
}

function desactiverNotifications() {
  etat.reglages.notifs = false;
  sauver();
  afficher();
}

function formulaireTache(id) {
  const t = id ? etat.taches.find(x => x.id === id) : null;
  ouvrirModale(t ? "Modifier le rappel" : "Nouveau rappel", `
    <form onsubmit="enregistrerTache(event,'${id || ""}')">
      <label>Intitulé
        <input name="titre" required placeholder="Semer les carottes, pailler les tomates…" value="${esc(t ? t.titre : "")}">
      </label>
      <label>Date
        <input type="date" name="date" required value="${t ? t.date : iso(aujourdhui())}">
      </label>
      <label>Détail (facultatif)
        <textarea name="detail" rows="2">${esc(t ? t.detail : "")}</textarea>
      </label>
      <div class="modale-actions">
        <button type="button" class="bouton bouton-doux" onclick="fermerModale()">Annuler</button>
        <button type="submit" class="bouton">Enregistrer</button>
      </div>
    </form>`);
}

function enregistrerTache(e, id) {
  e.preventDefault();
  const f = new FormData(e.target);
  const donnees = { titre: f.get("titre").trim(), date: f.get("date"), detail: f.get("detail").trim() };
  if (id) Object.assign(etat.taches.find(t => t.id === id), donnees);
  else ajouterTache(donnees);
  sauver();
  fermerModale();
  afficher();
}

function creerTacheDepuisSuggestion(planteId, cleAction) {
  const p = PLANTE_PAR_ID[planteId];
  ajouterTache({
    titre: `${ACTIONS[cleAction].label} : ${p.nom}`,
    detail: `${p.expo} · profondeur ${p.prof} · espacement ${p.esp}`,
    date: iso(aujourdhui()),
    planteId: planteId
  });
  sauver();
  afficher();
}

function basculerTache(id) {
  const t = etat.taches.find(x => x.id === id);
  if (t) { t.fait = !t.fait; sauver(); afficher(); }
}

function supprimerTache(id) {
  etat.taches = etat.taches.filter(t => t.id !== id);
  sauver();
  afficher();
}

/* ============================================================
   PERMACULTURE
   ============================================================ */

let ongletPerma = "principes";

function vuePermaculture() {
  const onglets = [
    ["principes", "Principes"],
    ["travaux", "Travaux du mois"],
    ["rotation", "Rotation"],
    ["preparations", "Purins & décoctions"]
  ];

  let contenu = "";

  if (ongletPerma === "principes") {
    contenu = PRINCIPES.map(p => `
      <div class="carte">
        <h3>${esc(p.titre)}</h3>
        <p>${esc(p.texte)}</p>
      </div>`).join("");
  }

  if (ongletPerma === "travaux") {
    contenu = MOIS.map((m, i) => `
      <div class="carte ${i + 1 === moisCourant() ? "carte-mois-actuel" : ""}">
        <h3>${m}${i + 1 === moisCourant() ? " <span class=\"badge\">ce mois-ci</span>" : ""}</h3>
        <ul class="liste-simple">${(TRAVAUX[i + 1] || []).map(t => `<li>${esc(t)}</li>`).join("")}</ul>
      </div>`).join("");
  }

  if (ongletPerma === "rotation") {
    contenu = `
      <div class="carte carte-astuce">
        <h3>Le principe</h3>
        <p>On ne remet jamais la même famille de plantes au même endroit deux années de suite. Chaque famille puise des éléments différents et attire ses propres maladies : en tournant, le sol se repose et les problèmes ne s'installent pas. Le cycle complet dure 4 ans.</p>
      </div>` +
      ROTATION.map(r => `
      <div class="carte">
        <h3><span class="numero-rotation">${r.ordre}</span> ${esc(r.groupe)}</h3>
        <p class="note">Familles : ${r.familles.map(f => `<span class="puce puce-famille">${esc(f)}</span>`).join(" ")}</p>
        <p><strong>Exemples :</strong> ${esc(r.exemples)}</p>
        <p>${esc(r.note)}</p>
      </div>`).join("");
  }

  if (ongletPerma === "preparations") {
    contenu = PREPARATIONS.map(p => `
      <div class="carte">
        <h3>${esc(p.nom)}</h3>
        <p class="note">Période : ${esc(p.quand)}</p>
        <h4>Recette</h4><p>${esc(p.recette)}</p>
        <h4>Utilisation</h4><p>${esc(p.usage)}</p>
        <div class="encart-precaution"><strong>Attention</strong><p>${esc(p.attention)}</p></div>
      </div>`).join("");
  }

  return `
    <header class="entete">
      <h1>Permaculture</h1>
      <p class="sous-titre">Les repères pour un potager qui se nourrit tout seul</p>
    </header>
    <div class="onglets onglets-larges">
      ${onglets.map(([v, l]) =>
        `<button class="onglet ${ongletPerma === v ? "actif" : ""}" onclick="ongletPerma='${v}';afficher()">${l}</button>`).join("")}
    </div>
    ${contenu}
  `;
}

/* ---------- Table des vues ---------- */

const VUES = {
  accueil: vueAccueil,
  calendrier: vueCalendrier,
  planning: (arg) => vuePlanning(arg),
  autonomie: (arg) => vueAutonomiePage(arg),
  plantes: vuePlantes,
  potager: vuePotager,
  taches: vueTaches,
  permaculture: vuePermaculture
};

/* ============================================================
   CLOCHE DES NOUVEAUTÉS
   ============================================================ */

function ouvrirNouveautes() {
  const nonLues = nouveautesNonLues();
  const corps = NOUVEAUTES.map((n, i) => `
    <div class="nouveaute ${i < nonLues ? "nouveaute-neuve" : ""}">
      <div class="nouveaute-tete">
        <h4>${esc(n.titre)}</h4>
        <span class="nouveaute-version">v${esc(n.version)} · ${dateFr(n.date)}${i < nonLues ? ' <span class="badge">nouveau</span>' : ""}</span>
      </div>
      <ul class="liste-nouveautes">
        ${n.points.map(p => `<li><span class="nouveaute-emoji">${p.emoji}</span><span>${p.texte}</span></li>`).join("")}
      </ul>
    </div>`).join("");

  ouvrirModale("Quoi de neuf ?", `
    ${corps}
    <div class="modale-actions">
      <button class="bouton" onclick="fermerModale()">J'ai vu</button>
    </div>`);

  marquerNouveautesLues();
}

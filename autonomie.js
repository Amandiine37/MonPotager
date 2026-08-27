/* ============================================================
   Mon Potager — Autosuffisance
   Compare ce que tu as récolté aux besoins annuels de ton foyer.
   ============================================================ */

/* Un enfant est compté pour un demi-adulte */
const PART_ENFANT = 0.5;

function foyer() {
  const f = etat.reglages.foyer || {};
  return { adultes: f.adultes == null ? 2 : f.adultes, enfants: f.enfants || 0 };
}

function equivalentAdultes() {
  const f = foyer();
  return Math.max(f.adultes + f.enfants * PART_ENFANT, 0.5);
}

function majFoyer(champ, valeur) {
  const f = foyer();
  f[champ] = Math.max(0, Math.min(20, parseInt(valeur, 10) || 0));
  etat.reglages.foyer = f;
  sauver();
  afficher();
}

/* Besoin annuel du foyer pour une plante, en kg */
function besoinFoyer(planteId) {
  const b = BESOINS[planteId];
  return b ? b.kg * equivalentAdultes() : 0;
}

/* Convertit une récolte en kilos. Renvoie null si l'unité n'est pas convertible. */
function recolteEnKg(planteId, recolte) {
  const q = Number(recolte.quantite) || 0;
  const b = BESOINS[planteId] || {};
  switch (recolte.unite) {
    case "kg":     return q;
    case "g":      return q / 1000;
    case "pièces": return b.piece ? q * b.piece : null;
    case "bottes": return b.botte ? q * b.botte : null;
    default:       return null;   // litres, bouquets : non comptabilisés
  }
}

/* Bilan d'autosuffisance pour une année */
function bilanAutonomie(annee) {
  const entrees = entreesPlanning(annee);
  const parPlante = {};
  let nonComptabilisees = 0;

  entrees.forEach(e => {
    const p = PLANTE_PAR_ID[e.planteId];
    if (!p || !BESOINS[p.id]) return;
    let kg = 0;
    (e.recoltes || []).forEach(r => {
      const converti = recolteEnKg(p.id, r);
      if (converti == null) nonComptabilisees++;
      else kg += converti;
    });
    const besoin = besoinFoyer(p.id);
    parPlante[p.id] = {
      plante: p,
      entree: e,
      recolte: kg,
      besoin: besoin,
      pourcent: besoin > 0 ? Math.round(kg / besoin * 100) : 0,
      manque: Math.max(besoin - kg, 0)
    };
  });

  const lignes = Object.values(parPlante).sort((a, b) => b.pourcent - a.pourcent || b.besoin - a.besoin);

  const recolteTotale = lignes.reduce((n, l) => n + l.recolte, 0);
  const besoinCultive = lignes.reduce((n, l) => n + l.besoin, 0);
  const besoinComplet = Object.keys(BESOINS).reduce((n, id) => n + besoinFoyer(id), 0);

  return {
    lignes: lignes,
    recolteTotale: recolteTotale,
    besoinCultive: besoinCultive,
    besoinComplet: besoinComplet,
    pourcentCultive: besoinCultive > 0 ? Math.round(recolteTotale / besoinCultive * 100) : 0,
    pourcentComplet: besoinComplet > 0 ? Math.round(recolteTotale / besoinComplet * 100) : 0,
    nonComptabilisees: nonComptabilisees,
    quotasAtteints: lignes.filter(l => l.pourcent >= 100).length
  };
}

/* Ce qu'il faudrait en plus pour combler un manque.
   Les légumes se comptent en mètres carrés, les arbres et arbustes en pieds. */
function surfaceNecessaire(planteId, kgManquants) {
  const b = BESOINS[planteId];
  if (!b || kgManquants <= 0) return null;

  if (b.parPied) {
    const pieds = Math.ceil(kgManquants / b.parPied);
    return { valeur: pieds, texte: pieds + (pieds > 1 ? " pieds" : " pied") };
  }
  if (b.parM2) {
    const m2 = Math.round(kgManquants / b.parM2 * 10) / 10;
    return { valeur: m2, texte: nombreFr(m2) + " m²" };
  }
  return null;
}

function palierAutonomie(pourcent) {
  return PALIERS_AUTONOMIE.find(p => pourcent >= p.min) || PALIERS_AUTONOMIE[PALIERS_AUTONOMIE.length - 1];
}

/* ---------------- Affichage ---------------- */

function jauge(pourcent, classe) {
  const largeur = Math.min(pourcent, 100);
  return `
    <div class="jauge ${classe || ""}">
      <div class="jauge-remplissage" style="width:${largeur}%"></div>
      ${pourcent > 100 ? `<span class="jauge-depassement">+${pourcent - 100} %</span>` : ""}
    </div>`;
}

function classeNiveau(pourcent) {
  if (pourcent >= 100) return "niveau-plein";
  if (pourcent >= 60) return "niveau-bon";
  if (pourcent >= 25) return "niveau-moyen";
  return "niveau-bas";
}

/* Écran complet, avec son en-tête et son sélecteur d'année */
function vueAutonomiePage() {
  const annee = anneePlanning();
  return `
    <header class="entete">
      <div class="planning-tete">
        <div>
          <p class="surtitre">Autosuffisance</p>
          <h1>Nourrir mon foyer</h1>
        </div>
        <div class="selecteur-annee">
          <button class="bouton-icone" onclick="changerAnnee(-1)" title="Année précédente">◀</button>
          <span>${annee}</span>
          <button class="bouton-icone" onclick="changerAnnee(1)" title="Année suivante">▶</button>
        </div>
      </div>
      <p class="sous-titre">D'après les récoltes notées dans ton planning ${annee}</p>
    </header>
    ${vueAutonomie()}`;
}

function vueAutonomie() {
  const annee = anneePlanning();
  const bilan = bilanAutonomie(annee);
  const f = foyer();
  const eq = equivalentAdultes();

  const reglageFoyer = `
    <div class="carte">
      <h3>👨‍👩‍👧 Mon foyer</h3>
      <p class="note">Combien de personnes ce potager doit-il nourrir ? Les enfants de moins de 12 ans sont comptés pour une demi-part.</p>
      <div class="deux-colonnes">
        <label>Adultes
          <input type="number" min="0" max="20" value="${f.adultes}" onchange="majFoyer('adultes',this.value)">
        </label>
        <label>Enfants (moins de 12 ans)
          <input type="number" min="0" max="20" value="${f.enfants}" onchange="majFoyer('enfants',this.value)">
        </label>
      </div>
      <p class="note">Soit <strong>${nombreFr(eq)} part${eq > 1 ? "s" : ""} adulte</strong>, c'est-à-dire environ
        <strong>${nombreFr(Math.round(bilan.besoinComplet))} kg de légumes par an</strong> pour une alimentation
        entièrement issue du potager.</p>
    </div>`;

  if (!bilan.lignes.length) {
    return `
      ${reglageFoyer}
      <div class="carte carte-astuce">
        <h3>Rien à mesurer pour l'instant</h3>
        <p>L'autosuffisance se calcule à partir des <strong>récoltes que tu notes dans ton planning ${annee}</strong>.
        Ajoute des légumes à ton planning, puis note ce que tu ramasses : les jauges se rempliront toutes seules.</p>
        <button class="bouton" onclick="aller('#planning')">Aller à mon planning</button>
      </div>`;
  }

  const palier = palierAutonomie(bilan.pourcentComplet);

  const lignes = bilan.lignes.map(l => {
    const surface = surfaceNecessaire(l.plante.id, l.manque);
    const atteint = l.pourcent >= 100;
    return `
      <div class="ligne-autonomie">
        <div class="autonomie-tete">
          <span class="autonomie-nom">
            ${CATEGORIES[l.plante.cat].emoji}
            <a href="#plantes/${l.plante.id}">${esc(l.plante.nom)}</a>
            ${atteint ? '<span class="coche-quota">✓ quota atteint</span>' : ""}
          </span>
          <span class="autonomie-chiffres">
            <strong>${nombreFr(l.recolte)}</strong> / ${nombreFr(Math.round(l.besoin * 10) / 10)} kg
            <span class="autonomie-pourcent">${l.pourcent} %</span>
          </span>
        </div>
        ${jauge(l.pourcent, classeNiveau(l.pourcent))}
        ${!atteint && l.manque > 0 ? `
          <p class="autonomie-manque">
            Il manque ${nombreFr(Math.round(l.manque * 10) / 10)} kg${surface ? ` — soit environ <strong>${esc(surface.texte)}</strong> de plus, au rendement moyen` : ""}.
          </p>` : ""}
      </div>`;
  }).join("");

  /* Les légumes qui pèsent lourd dans l'alimentation et qui ne sont pas au planning */
  const cultivees = bilan.lignes.map(l => l.plante.id);
  const absents = Object.keys(BESOINS)
    .filter(id => !cultivees.includes(id) && PLANTE_PAR_ID[id])
    .sort((a, b) => BESOINS[b].kg - BESOINS[a].kg)
    .slice(0, 6);

  return `
    ${reglageFoyer}

    <div class="carte carte-bilan">
      <h3>${palier.emoji} ${esc(palier.titre)}</h3>

      <div class="bilan-principal">
        <span class="bilan-chiffre">${bilan.pourcentComplet} %</span>
        <span class="bilan-libelle">de l'alimentation en légumes du foyer</span>
      </div>
      ${jauge(bilan.pourcentComplet, classeNiveau(bilan.pourcentComplet))}
      <p class="note">${nombreFr(Math.round(bilan.recolteTotale * 10) / 10)} kg récoltés sur les
        ${nombreFr(Math.round(bilan.besoinComplet))} kg qu'il faudrait pour nourrir ${nombreFr(eq)} part${eq > 1 ? "s" : ""} adulte toute l'année.</p>

      <h4 class="marge-haut">Sur ce que tu cultives réellement</h4>
      ${jauge(bilan.pourcentCultive, classeNiveau(bilan.pourcentCultive))}
      <p class="note"><strong>${bilan.pourcentCultive} %</strong> des besoins couverts pour les
        ${bilan.lignes.length} légume${bilan.lignes.length > 1 ? "s" : ""} de ton planning ${annee} —
        et <strong>${bilan.quotasAtteints}</strong> quota${bilan.quotasAtteints > 1 ? "s" : ""} déjà atteint${bilan.quotasAtteints > 1 ? "s" : ""}.</p>

      <p>${esc(palier.texte)}</p>

      ${bilan.nonComptabilisees ? `<p class="note">ℹ️ ${bilan.nonComptabilisees} récolte${bilan.nonComptabilisees > 1 ? "s" : ""} en litres ou en bouquets ${bilan.nonComptabilisees > 1 ? "n'ont" : "n'a"} pas pu être convertie${bilan.nonComptabilisees > 1 ? "s" : ""} en kilos.</p>` : ""}
    </div>

    <div class="carte">
      <h3>🥕 Légume par légume</h3>
      <p class="note">Récolté sur besoin annuel du foyer. Les récoltes notées en pièces ou en bottes sont converties en kilos.</p>
      ${lignes}
    </div>

    ${absents.length ? `
      <div class="carte carte-astuce">
        <h3>💡 Ce qui pèse le plus dans une alimentation</h3>
        <p>Ces légumes comptent beaucoup dans les besoins d'un foyer et ne sont pas encore dans ton planning ${annee} :</p>
        <div class="nuage">${absents.map(id => {
          const p = PLANTE_PAR_ID[id];
          return `<button class="puce" onclick="ajouterDepuisAutonomie('${id}')">${esc(p.nom)} · ${nombreFr(Math.round(besoinFoyer(id)))} kg/an ＋</button>`;
        }).join("")}</div>
      </div>` : ""}

    <div class="carte">
      <h3>📏 D'où viennent ces chiffres ?</h3>
      <p class="note">Les besoins annuels s'appuient sur la consommation moyenne d'un adulte en France, et les
      rendements sur des moyennes de jardin amateur. Un potager bien conduit fait mieux, une année sèche fait moins :
      ce sont des ordres de grandeur, pour se situer et décider quoi ajuster l'année suivante — pas une comptabilité.</p>
      <p class="note">Les aromatiques et les médicinales ne sont pas comptées : on ne mesure pas son autonomie en thym.</p>
    </div>
  `;
}

function ajouterDepuisAutonomie(planteId) {
  const entree = ajouterAuPlanning(planteId);
  if (entree) ajusterPeriodes(entree.id);
  else afficher();
}

/* Résumé pour l'accueil, dès qu'il y a des récoltes */
function resumeAutonomieAccueil() {
  const bilan = bilanAutonomie(aujourdhui().getFullYear());
  if (!bilan.lignes.length || bilan.recolteTotale <= 0) return "";
  return `
    <div class="carte carte-suivi">
      <h3>⚖️ Mon autonomie ${aujourdhui().getFullYear()}</h3>
      <div class="bilan-principal bilan-compact">
        <span class="bilan-chiffre">${bilan.pourcentComplet} %</span>
        <span class="bilan-libelle">${nombreFr(Math.round(bilan.recolteTotale * 10) / 10)} kg récoltés · ${bilan.quotasAtteints} quota${bilan.quotasAtteints > 1 ? "s" : ""} atteint${bilan.quotasAtteints > 1 ? "s" : ""}</span>
      </div>
      ${jauge(bilan.pourcentComplet, classeNiveau(bilan.pourcentComplet))}
      <a class="lien-plus" href="#autonomie">Voir le détail légume par légume →</a>
    </div>`;
}

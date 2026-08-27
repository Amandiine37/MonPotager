/* ============================================================
   Mon Potager — Prévisions météo (option)
   Service utilisé : Open-Meteo (open-meteo.com), gratuit et sans compte.
   Désactivé par défaut. Une fois activé, l'appli envoie uniquement
   les coordonnées du lieu choisi pour récupérer les prévisions.
   ============================================================ */

const METEO_GEOCODAGE = "https://geocoding-api.open-meteo.com/v1/search";
const METEO_PREVISIONS = "https://api.open-meteo.com/v1/forecast";

/* Codes météo de l'OMM, tels que renvoyés par Open-Meteo */
const CODES_METEO = {
  0:  ["Ciel dégagé", "☀️"],
  1:  ["Peu nuageux", "🌤️"],
  2:  ["Passages nuageux", "⛅"],
  3:  ["Couvert", "☁️"],
  45: ["Brouillard", "🌫️"], 48: ["Brouillard givrant", "🌫️"],
  51: ["Bruine légère", "🌦️"], 53: ["Bruine", "🌦️"], 55: ["Bruine forte", "🌦️"],
  56: ["Bruine verglaçante", "🧊"], 57: ["Bruine verglaçante", "🧊"],
  61: ["Pluie faible", "🌧️"], 63: ["Pluie", "🌧️"], 65: ["Forte pluie", "🌧️"],
  66: ["Pluie verglaçante", "🧊"], 67: ["Pluie verglaçante", "🧊"],
  71: ["Neige faible", "🌨️"], 73: ["Neige", "🌨️"], 75: ["Forte neige", "🌨️"],
  77: ["Grains de neige", "🌨️"],
  80: ["Averses", "🌦️"], 81: ["Averses", "🌦️"], 82: ["Fortes averses", "🌦️"],
  85: ["Averses de neige", "🌨️"], 86: ["Averses de neige", "🌨️"],
  95: ["Orage", "⛈️"], 96: ["Orage et grêle", "⛈️"], 99: ["Orage et grêle", "⛈️"]
};

function libelleMeteo(code) { return CODES_METEO[code] || ["—", "🌡️"]; }

/* Températures du sol et semis possibles (à 6 cm de profondeur) */
const SEUILS_SOL = [
  { min: 16, texte: "Sol chaud : tout est possible, y compris courges, concombres, melons et basilic." },
  { min: 13, texte: "Sol tiède : haricots et maïs peuvent être semés." },
  { min: 10, texte: "Sol qui se réchauffe : carottes, betteraves, radis, laitues." },
  { min: 7,  texte: "Sol encore frais : pois, fèves, épinards et salades seulement." },
  { min: -99, texte: "Sol trop froid : rien ne germera dehors, garde tes semis sous abri." }
];

function conseilSol(temperature) {
  if (temperature == null) return null;
  return SEUILS_SOL.find(s => temperature >= s.min).texte;
}

/* ---------------- Appels au service ---------------- */

async function chercherCommune(nom) {
  const url = `${METEO_GEOCODAGE}?name=${encodeURIComponent(nom)}&count=8&language=fr&format=json`;
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error("Recherche impossible");
  const donnees = await reponse.json();
  return (donnees.results || []).map(r => ({
    nom: r.name,
    detail: [r.admin2, r.admin1, r.country].filter(Boolean).join(", "),
    lat: Math.round(r.latitude * 10000) / 10000,
    lon: Math.round(r.longitude * 10000) / 10000
  }));
}

async function telechargerPrevisions() {
  const lieu = etat.meteo.lieu;
  if (!lieu) throw new Error("Aucun lieu choisi");

  const url = `${METEO_PREVISIONS}?latitude=${lieu.lat}&longitude=${lieu.lon}`
    + "&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max"
    + "&hourly=soil_temperature_6cm&timezone=auto&forecast_days=7";

  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error("Prévisions indisponibles");
  const d = await reponse.json();
  const j = d.daily || {};

  // Température moyenne du sol, jour par jour
  const solParJour = {};
  const heures = (d.hourly && d.hourly.time) || [];
  const sols = (d.hourly && d.hourly.soil_temperature_6cm) || [];
  heures.forEach((h, i) => {
    if (sols[i] == null) return;
    const jour = h.slice(0, 10);
    (solParJour[jour] = solParJour[jour] || []).push(sols[i]);
  });

  const vent = j.wind_speed_10m_max || j.windspeed_10m_max || [];

  const jours = (j.time || []).map((date, i) => {
    const releves = solParJour[date] || [];
    return {
      date: date,
      code: j.weathercode ? j.weathercode[i] : null,
      tMax: j.temperature_2m_max ? j.temperature_2m_max[i] : null,
      tMin: j.temperature_2m_min ? j.temperature_2m_min[i] : null,
      pluie: j.precipitation_sum ? j.precipitation_sum[i] : null,
      probaPluie: j.precipitation_probability_max ? j.precipitation_probability_max[i] : null,
      vent: vent[i] != null ? vent[i] : null,
      sol: releves.length ? Math.round(releves.reduce((a, b) => a + b, 0) / releves.length * 10) / 10 : null
    };
  });

  etat.meteo.previsions = { maj: new Date().toISOString(), jours: jours };
  sauver();
  return jours;
}

/* ---------------- Lecture jardinière des prévisions ---------------- */

function conseilsMeteo() {
  const p = etat.meteo.previsions;
  if (!p || !p.jours || !p.jours.length) return [];
  const jours = p.jours;
  const conseils = [];

  // Gel annoncé
  const gel = jours.filter(j => j.tMin != null && j.tMin <= 2);
  if (gel.length) {
    const premier = gel[0];
    const gravite = premier.tMin <= 0 ? "Gelée annoncée" : "Risque de gelée";
    conseils.push({
      niveau: "alerte",
      emoji: "❄️",
      texte: `${gravite} ${jourRelatif(premier.date)} (${arrondiUn(premier.tMin)} °C au plus bas). Rentre ou couvre tes plants fragiles, arrose le soir : un sol humide restitue de la chaleur la nuit.`
    });
    const menacees = plantesGelivesEnTerre();
    if (menacees.length) conseils.push({
      niveau: "alerte", emoji: "🪴",
      texte: `Dans ton planning, ${menacees.join(", ")} ${menacees.length > 1 ? "sont sensibles" : "est sensible"} au gel à cette période : voile d'hivernage conseillé.`
    });
  }

  // Pluie à venir : inutile d'arroser
  const pluie3 = jours.slice(0, 3).reduce((n, j) => n + (j.pluie || 0), 0);
  if (pluie3 >= 10) {
    conseils.push({ niveau: "info", emoji: "🌧️",
      texte: `${arrondiUn(pluie3)} mm de pluie attendus sur 3 jours : inutile d'arroser. Profites-en pour semer, la terre sera parfaitement humide.` });
  } else if (pluie3 < 1 && jours.slice(0, 5).every(j => (j.pluie || 0) < 1)) {
    conseils.push({ niveau: "attention", emoji: "🏜️",
      texte: "Aucune pluie annoncée cette semaine : arrose en profondeur et espacé plutôt qu'un peu chaque jour, et vérifie l'épaisseur de ton paillage." });
  }

  // Chaleur
  const chaud = jours.filter(j => j.tMax != null && j.tMax >= 30);
  if (chaud.length) {
    conseils.push({ niveau: "attention", emoji: "🔥",
      texte: `Jusqu'à ${arrondiUn(Math.max.apply(null, chaud.map(j => j.tMax)))} °C cette semaine. Arrose tôt le matin, jamais en plein soleil, et ombre les jeunes semis aux heures chaudes.` });
  }

  // Vent
  const vente = jours.filter(j => j.vent != null && j.vent >= 50);
  if (vente.length) {
    conseils.push({ niveau: "attention", emoji: "💨",
      texte: `Vent jusqu'à ${Math.round(Math.max.apply(null, vente.map(j => j.vent)))} km/h ${jourRelatif(vente[0].date)} : vérifie les tuteurs, les voiles et les serres.` });
  }

  // Température du sol
  const sols = jours.map(j => j.sol).filter(t => t != null);
  if (sols.length) {
    const moyenne = Math.round(sols.reduce((a, b) => a + b, 0) / sols.length * 10) / 10;
    conseils.push({ niveau: "info", emoji: "🌡️",
      texte: `Sol à ${arrondiUn(moyenne)} °C en moyenne cette semaine (à 6 cm). ${conseilSol(moyenne)}` });
  }

  if (!conseils.length) {
    conseils.push({ niveau: "info", emoji: "🌤️", texte: "Rien de particulier à signaler cette semaine : conditions normales au jardin." });
  }
  return conseils;
}

/* Plantes gélives dont le planning prévoit une mise en terre ou une récolte ce mois-ci */
function plantesGelivesEnTerre() {
  const m = moisCourant();
  const noms = [];
  entreesPlanning().forEach(e => {
    const p = PLANTE_PAR_ID[e.planteId];
    if (!p || !GEL_SENSIBLES.includes(p.id) || e.statut === "annule") return;
    const concerne = ORDRE_ACTIONS.some(c => c !== "sa" && (e.mois[c] || []).includes(m));
    if (concerne && !noms.includes(p.nom)) noms.push(p.nom);
  });
  return noms;
}

function arrondiUn(n) {
  return (Math.round(n * 10) / 10).toLocaleString("fr-FR");
}

function jourRelatif(dateIso) {
  const ecart = joursEntre(iso(aujourdhui()), dateIso);
  if (ecart <= 0) return "aujourd'hui";
  if (ecart === 1) return "demain";
  return "le " + dateCourteFr(dateIso);
}

function nomJour(dateIso) {
  const ecart = joursEntre(iso(aujourdhui()), dateIso);
  if (ecart === 0) return "Auj.";
  if (ecart === 1) return "Demain";
  return depuisIso(dateIso).toLocaleDateString("fr-FR", { weekday: "short" });
}

/* ---------------- Affichage ---------------- */

function blocMeteo() {
  if (!etat.meteo.enLigne || !etat.meteo.lieu) {
    return `
      <div class="carte">
        <h3>🌦️ Prévisions météo <span class="badge badge-option">option</span></h3>
        <p>Active les prévisions à 7 jours pour savoir s'il faut arroser, si une gelée arrive, et si ton sol est assez chaud pour semer.</p>
        <div class="encart-confidentialite">
          <strong>Ce que ça implique</strong>
          <p>Cette option est la seule de l'application qui utilise internet. Elle interroge
          <strong>Open-Meteo</strong> (open-meteo.com), un service gratuit et sans compte, en lui envoyant
          uniquement les coordonnées du lieu que tu choisis. Aucune donnée de ton potager n'est transmise,
          et tu peux la désactiver à tout moment. Sans connexion, l'appli continue de fonctionner
          normalement avec les dernières prévisions reçues.</p>
        </div>
        <button class="bouton" onclick="formulaireLieu()">📍 Choisir mon lieu et activer</button>
      </div>`;
  }

  const p = etat.meteo.previsions;
  const lieu = etat.meteo.lieu;
  const conseils = conseilsMeteo();

  const bandeau = p && p.jours ? `
    <div class="meteo-jours">
      ${p.jours.map(j => {
        const [texte, emoji] = libelleMeteo(j.code);
        const gele = j.tMin != null && j.tMin <= 2;
        return `
          <div class="meteo-jour ${gele ? "meteo-gel" : ""}" title="${esc(texte)}">
            <span class="meteo-nom">${nomJour(j.date)}</span>
            <span class="meteo-emoji">${emoji}</span>
            <span class="meteo-max">${j.tMax != null ? arrondiUn(j.tMax) + "°" : "—"}</span>
            <span class="meteo-min ${gele ? "min-gel" : ""}">${j.tMin != null ? arrondiUn(j.tMin) + "°" : "—"}</span>
            <span class="meteo-pluie">${j.pluie ? arrondiUn(j.pluie) + " mm" : "—"}</span>
            <span class="meteo-sol">${j.sol != null ? "sol " + arrondiUn(j.sol) + "°" : ""}</span>
          </div>`;
      }).join("")}
    </div>
    <div class="meteo-legende">
      <span>max / min</span><span>pluie</span><span>sol à 6 cm</span>
    </div>` : `<p class="rien">Aucune prévision téléchargée pour l'instant.</p>`;

  return `
    <div class="carte">
      <h3>🌦️ Prévisions à 7 jours</h3>
      <p class="note">
        📍 ${esc(lieu.nom)}${lieu.detail ? " · " + esc(lieu.detail) : ""}
        ${p && p.maj ? ` · mis à jour ${majLisible(p.maj)}` : ""}
      </p>
      ${bandeau}
      <div class="barre-boutons marge-haut">
        <button class="bouton bouton-doux" onclick="rafraichirMeteo()">🔄 Actualiser</button>
        <button class="bouton bouton-doux" onclick="formulaireLieu()">📍 Changer de lieu</button>
        <button class="bouton bouton-doux" onclick="desactiverMeteo()">Désactiver</button>
      </div>
      <p class="mention-legale">Données : Open-Meteo.com — prévisions gratuites, sans compte.</p>
    </div>

    <div class="carte carte-perma">
      <h3>👩‍🌾 Ce que ça veut dire au potager</h3>
      <ul class="liste-conseils">
        ${conseils.map(c => `
          <li class="conseil conseil-${c.niveau}">
            <span class="conseil-emoji">${c.emoji}</span>
            <span>${esc(c.texte)}</span>
          </li>`).join("")}
      </ul>
    </div>`;
}

function majLisible(dateIso) {
  const d = new Date(dateIso);
  const jour = iso(d) === iso(aujourdhui())
    ? "aujourd'hui"
    : "le " + d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return `${jour} à ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
}

/* ---------------- Choix du lieu ---------------- */

function formulaireLieu() {
  ouvrirModale("Où se trouve ton potager ?", `
    <p class="note">Tape le nom de ta commune. L'appli demande la liste des communes correspondantes à Open-Meteo, puis n'utilisera plus que les coordonnées de celle que tu choisis.</p>
    <form onsubmit="lancerRechercheCommune(event)">
      <label>Commune
        <input name="commune" required autofocus placeholder="Tours, Angers, Le Mans…"
               value="${esc(etat.meteo.lieu ? etat.meteo.lieu.nom : "")}">
      </label>
      <div class="modale-actions">
        <button type="button" class="bouton bouton-doux" onclick="fermerModale()">Annuler</button>
        <button type="submit" class="bouton">Rechercher</button>
      </div>
    </form>
    <div id="resultats-communes"></div>`);
}

async function lancerRechercheCommune(ev) {
  ev.preventDefault();
  const nom = new FormData(ev.target).get("commune").trim();
  const boite = document.getElementById("resultats-communes");
  boite.innerHTML = `<p class="note">Recherche en cours…</p>`;

  try {
    const resultats = await chercherCommune(nom);
    if (!resultats.length) {
      boite.innerHTML = `<p class="rien">Aucune commune trouvée pour « ${esc(nom)} ». Vérifie l'orthographe.</p>`;
      return;
    }
    boite.innerHTML = `
      <h4>Choisis ta commune</h4>
      <div class="picker-liste">
        ${resultats.map((r, i) => `
          <button type="button" class="picker-item" onclick="choisirLieu(${i})">
            <span class="cal-emoji">📍</span>
            <span class="picker-texte">
              <strong>${esc(r.nom)}</strong>
              <span class="note">${esc(r.detail)}</span>
            </span>
            <span class="picker-signe">＋</span>
          </button>`).join("")}
      </div>`;
    window._communesTrouvees = resultats;
  } catch (e) {
    boite.innerHTML = `<div class="alerte-assoc">Impossible de joindre le service : vérifie ta connexion internet, puis réessaie.</div>`;
  }
}

async function choisirLieu(index) {
  const lieu = (window._communesTrouvees || [])[index];
  if (!lieu) return;
  etat.meteo.lieu = lieu;
  etat.meteo.enLigne = true;
  sauver();
  fermerModale();
  await rafraichirMeteo();
}

async function rafraichirMeteo() {
  const bouton = document.querySelector('[onclick="rafraichirMeteo()"]');
  if (bouton) { bouton.disabled = true; bouton.textContent = "⏳ Téléchargement…"; }
  try {
    await telechargerPrevisions();
  } catch (e) {
    alert("Prévisions indisponibles pour le moment. Vérifie ta connexion internet — l'appli garde les dernières prévisions reçues.");
  }
  afficher();
}

function desactiverMeteo() {
  if (!confirm("Désactiver les prévisions ? Plus aucune connexion internet ne sera utilisée.")) return;
  etat.meteo.enLigne = false;
  etat.meteo.previsions = null;
  sauver();
  afficher();
}

/* Rafraîchissement automatique, au maximum une fois toutes les 3 heures */
async function actualiserMeteoSiNecessaire() {
  if (!etat.meteo.enLigne || !etat.meteo.lieu) return;
  const p = etat.meteo.previsions;
  if (p && p.maj && (Date.now() - new Date(p.maj).getTime()) < 3 * 3600 * 1000) return;
  try {
    await telechargerPrevisions();
    if (pageCourante() === "planning" || pageCourante() === "accueil") afficher();
  } catch (e) {
    /* hors connexion : on garde les dernières prévisions */
  }
}

/* Résumé court pour l'accueil : uniquement s'il y a quelque chose d'important */
function resumeMeteoAccueil() {
  if (!etat.meteo.enLigne || !etat.meteo.previsions) return "";
  const importants = conseilsMeteo().filter(c => c.niveau === "alerte" || c.niveau === "attention");
  if (!importants.length) return "";
  return `
    <div class="carte carte-alerte">
      <h3>🌦️ Météo des 7 jours</h3>
      <ul class="liste-conseils">
        ${importants.map(c => `
          <li class="conseil conseil-${c.niveau}">
            <span class="conseil-emoji">${c.emoji}</span><span>${esc(c.texte)}</span>
          </li>`).join("")}
      </ul>
      <a class="lien-plus" href="#planning" onclick="ongletPlanning='meteo'">Voir les prévisions complètes →</a>
    </div>`;
}

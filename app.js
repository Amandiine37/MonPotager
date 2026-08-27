/* ============================================================
   Mon Potager en permaculture — moteur de l'application
   Données stockées dans le navigateur (localStorage)
   ============================================================ */

const PLANTES = [].concat(LEGUMES, AROMATIQUES, MEDICINALES)
  .sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

const PLANTE_PAR_ID = {};
const PLANTE_PAR_NOM = {};
PLANTES.forEach(p => { PLANTE_PAR_ID[p.id] = p; PLANTE_PAR_NOM[p.nom] = p; });

const CATEGORIES = {
  legume:     { label: "Légume",      pluriel: "Légumes",              emoji: "🥕" },
  aromatique: { label: "Aromatique",  pluriel: "Aromatiques",          emoji: "🌿" },
  medicinale: { label: "Médicinale",  pluriel: "Plantes médicinales",  emoji: "🌼" }
};

const ACTIONS = {
  sa: { cle: "sa", label: "Semis sous abri",   court: "Semis abri",  emoji: "🏠", classe: "act-sa" },
  sp: { cle: "sp", label: "Semis en pleine terre", court: "Semis terre", emoji: "🌱", classe: "act-sp" },
  pl: { cle: "pl", label: "Plantation / repiquage", court: "Plantation", emoji: "🪴", classe: "act-pl" },
  re: { cle: "re", label: "Récolte",            court: "Récolte",     emoji: "🧺", classe: "act-re" }
};
const ORDRE_ACTIONS = ["sa", "sp", "pl", "re"];

/* ---------------- Stockage ---------------- */

const CLE_STOCKAGE = "potager-permaculture-v1";

const etatVide = () => ({
  zones: [],
  cultures: [],
  taches: [],
  favoris: [],
  planning: [],
  meteo: {
    journal: [],
    gelPrintemps: "05-15",   // Saints de Glace
    gelAutomne: "11-05",
    decalage: 0,
    enLigne: false,          // prévisions Open-Meteo : désactivées par défaut
    lieu: null,
    previsions: null
  },
  reglages: { notifs: false, dernierRappel: "", anneePlanning: 0, derniereNouveauteVue: "" }
});

let etat = charger();

function charger() {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE);
    if (!brut) return etatVide();
    const donnees = JSON.parse(brut);
    const base = etatVide();
    return Object.assign(base, donnees, {
      reglages: Object.assign(base.reglages, donnees.reglages || {}),
      meteo: Object.assign(base.meteo, donnees.meteo || {})
    });
  } catch (e) {
    console.warn("Données illisibles, réinitialisation.", e);
    return etatVide();
  }
}

function sauver() {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat));
  } catch (e) {
    alert("Impossible d'enregistrer : l'espace de stockage du navigateur est plein.");
  }
}

const nouvelId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ---------------- Dates ---------------- */

const aujourdhui = () => new Date();
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const depuisIso = s => { const [a, m, j] = s.split("-").map(Number); return new Date(a, m - 1, j); };

function moisCourant() { return aujourdhui().getMonth() + 1; }

function numeroSemaine(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const jour = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - jour);
  const debutAnnee = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - debutAnnee) / 86400000) + 1) / 7);
}

function dateFr(s) {
  if (!s) return "";
  const d = depuisIso(s);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function dateCourteFr(s) {
  if (!s) return "";
  const d = depuisIso(s);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function joursEntre(a, b) {
  return Math.round((depuisIso(b) - depuisIso(a)) / 86400000);
}

function ajouterJours(s, n) {
  const d = depuisIso(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

/* Convertit un texte de durée ("4 à 5 mois", "6 à 10 semaines") en nombre de jours */
function dureeEnJours(texte) {
  if (!texte) return null;
  const nombres = (texte.match(/\d+([,.]\d+)?/g) || []).map(n => parseFloat(n.replace(",", ".")));
  if (!nombres.length) return null;
  const valeur = nombres[nombres.length - 1];
  if (/mois/i.test(texte)) return Math.round(valeur * 30);
  if (/semaine/i.test(texte)) return Math.round(valeur * 7);
  if (/an/i.test(texte)) return Math.round(valeur * 365);
  return Math.round(valeur);
}

/* ---------------- Recherche dans les plantes ---------------- */

function sansAccents(s) {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/* Première lettre d'un nom, sans accent et en majuscule (Œillet -> O, Épinard -> E) */
function premiereLettre(nom) {
  const s = sansAccents(nom).replace(/^[^a-zœ]+/, "");
  const c = (s[0] || "").toUpperCase();
  return c === "Œ" ? "O" : c;
}

/* Lettres réellement présentes dans la bibliothèque, pour griser les autres */
const LETTRES_DISPONIBLES = (() => {
  const set = {};
  PLANTES.forEach(p => { set[premiereLettre(p.nom)] = true; });
  return set;
})();

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function plantesDuMois(mois, cle) {
  return PLANTES.filter(p => (p[cle] || []).includes(mois));
}

function actionsDuMois(plante, mois) {
  return ORDRE_ACTIONS.filter(cle => (plante[cle] || []).includes(mois));
}

function chercherPlantes(texte, categorie, filtreMois, filtreAction, lettre) {
  const q = sansAccents(texte);
  return PLANTES.filter(p => {
    if (categorie && categorie !== "toutes" && p.cat !== categorie) return false;
    if (categorie === "medicinales-utiles" && !p.med) return false;
    if (lettre && premiereLettre(p.nom) !== lettre) return false;
    if (filtreMois && filtreAction) {
      if (!(p[filtreAction] || []).includes(filtreMois)) return false;
    } else if (filtreMois) {
      if (!ORDRE_ACTIONS.some(c => (p[c] || []).includes(filtreMois))) return false;
    }
    if (!q) return true;
    const cible = sansAccents([p.nom, p.latin, p.fam, (p.med && p.med.bienfaits || []).join(" ")].join(" "));
    return cible.includes(q);
  });
}

/* ---------------- Cultures et zones ---------------- */

function zoneParId(id) { return etat.zones.find(z => z.id === id); }
function culturesDeZone(id) { return etat.cultures.filter(c => c.zoneId === id); }
function culturesActives() { return etat.cultures.filter(c => c.statut !== "termine"); }

const TYPES_CULTURE = {
  "semis-abri":  { label: "Semé sous abri", cle: "sa" },
  "semis-terre": { label: "Semé en pleine terre", cle: "sp" },
  "plantation":  { label: "Planté", cle: "pl" }
};

const STATUTS = {
  "en-cours": "En culture",
  "recolte":  "En récolte",
  "termine":  "Terminé"
};

/* Détecte les mauvaises associations dans une même zone */
function conflitsAssociation(zoneId, planteId) {
  const plante = PLANTE_PAR_ID[planteId];
  if (!plante) return [];
  const voisines = culturesDeZone(zoneId)
    .filter(c => c.statut !== "termine" && c.planteId !== planteId)
    .map(c => PLANTE_PAR_ID[c.planteId])
    .filter(Boolean);
  const conflits = [];
  voisines.forEach(v => {
    if ((plante.ennemis || []).includes(v.nom) || (v.ennemis || []).includes(plante.nom)) {
      if (!conflits.includes(v.nom)) conflits.push(v.nom);
    }
  });
  return conflits;
}

/* Détecte un risque de rotation : même famille botanique cultivée récemment dans la zone */
function conflitRotation(zoneId, planteId) {
  const plante = PLANTE_PAR_ID[planteId];
  if (!plante || plante.viv) return null;
  const limite = ajouterJours(iso(aujourdhui()), -1095); // 3 ans
  const precedente = etat.cultures.find(c =>
    c.zoneId === zoneId &&
    c.planteId !== planteId &&
    c.date >= limite &&
    (PLANTE_PAR_ID[c.planteId] || {}).fam === plante.fam
  );
  if (!precedente) return null;
  return { famille: plante.fam, plante: (PLANTE_PAR_ID[precedente.planteId] || {}).nom, date: precedente.date };
}

/* ---------------- Tâches ---------------- */

function ajouterTache(t) {
  etat.taches.push(Object.assign({ id: nouvelId(), fait: false, auto: false }, t));
}

/* Régénère les tâches automatiques liées aux cultures */
function synchroniserTaches() {
  const attendues = {};

  etat.cultures.forEach(c => {
    const plante = PLANTE_PAR_ID[c.planteId];
    if (!plante || c.statut === "termine") return;

    if (c.type === "semis-abri" && (plante.pl || []).length) {
      attendues[`auto-${c.id}-repiquage`] = {
        titre: `Repiquer ${plante.nom}`,
        detail: "Environ 5 semaines après le semis, quand le plant a 3 ou 4 vraies feuilles.",
        date: ajouterJours(c.date, 35),
        cultureId: c.id, planteId: plante.id, auto: true
      };
    }

    const duree = dureeEnJours(plante.cyc);
    if (duree && duree < 400) {
      attendues[`auto-${c.id}-recolte`] = {
        titre: `Récolte estimée : ${plante.nom}`,
        detail: `Cycle indicatif de ${plante.cyc} à partir du ${dateCourteFr(c.date)}.`,
        date: ajouterJours(c.date, duree),
        cultureId: c.id, planteId: plante.id, auto: true
      };
    }
  });

  // Supprimer les tâches auto devenues obsolètes
  etat.taches = etat.taches.filter(t => !t.auto || attendues[t.id]);

  // Créer ou mettre à jour
  Object.keys(attendues).forEach(id => {
    const existante = etat.taches.find(t => t.id === id);
    if (existante) {
      existante.titre = attendues[id].titre;
      existante.detail = attendues[id].detail;
      existante.date = attendues[id].date;
    } else {
      etat.taches.push(Object.assign({ id: id, fait: false }, attendues[id]));
    }
  });
}

function tachesTriees() {
  return etat.taches.slice().sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

function tachesEnRetard() {
  const jour = iso(aujourdhui());
  return tachesTriees().filter(t => !t.fait && t.date && t.date < jour);
}

function tachesProchainement(jours) {
  const debut = iso(aujourdhui());
  const fin = ajouterJours(debut, jours);
  return tachesTriees().filter(t => !t.fait && t.date >= debut && t.date <= fin);
}

/* ---------------- Rappels / notifications ---------------- */

function notificationsPossibles() {
  return typeof Notification !== "undefined";
}

async function activerNotifications() {
  if (!notificationsPossibles()) {
    alert("Ton navigateur ne gère pas les notifications.");
    return false;
  }
  const reponse = await Notification.requestPermission();
  const ok = reponse === "granted";
  etat.reglages.notifs = ok;
  sauver();
  if (ok) {
    new Notification("Mon Potager", { body: "Les rappels sont activés 🌱", icon: "icon-192.png" });
  } else {
    alert("Les notifications ont été refusées. Tu peux les réautoriser dans les réglages de ton navigateur.");
  }
  return ok;
}

function verifierRappels() {
  if (!etat.reglages.notifs || !notificationsPossibles() || Notification.permission !== "granted") return;
  const jour = iso(aujourdhui());
  if (etat.reglages.dernierRappel === jour) return;

  const retard = tachesEnRetard().length;
  const semaine = tachesProchainement(7).length;
  const suivies = actionsFavorisDuMois().length;

  const morceaux = [];
  if (retard) morceaux.push(`${retard} tâche${retard > 1 ? "s" : ""} en retard`);
  if (semaine) morceaux.push(`${semaine} pour les 7 jours à venir`);
  if (suivies) morceaux.push(`${suivies} semis/plantation possible${suivies > 1 ? "s" : ""} ce mois-ci`);
  if (!morceaux.length) return;

  new Notification("Mon Potager 🌱", {
    body: morceaux.join(" · "),
    icon: "icon-192.png",
    tag: "potager-rappel"
  });
  etat.reglages.dernierRappel = jour;
  sauver();
}

/* Actions du mois pour les plantes suivies (favoris) */
function actionsFavorisDuMois() {
  const mois = moisCourant();
  const resultat = [];
  etat.favoris.forEach(id => {
    const p = PLANTE_PAR_ID[id];
    if (!p) return;
    actionsDuMois(p, mois).forEach(cle => {
      if (cle === "re") return; // on ne rappelle que les semis/plantations
      resultat.push({ plante: p, action: ACTIONS[cle] });
    });
  });
  return resultat;
}

function estFavori(id) { return etat.favoris.includes(id); }

function basculerFavori(id) {
  const i = etat.favoris.indexOf(id);
  if (i >= 0) etat.favoris.splice(i, 1); else etat.favoris.push(id);
  sauver();
}

/* ---------------- Export / import ---------------- */

function exporterDonnees() {
  const contenu = JSON.stringify(etat, null, 2);
  const blob = new Blob([contenu], { type: "application/json" });
  const lien = document.createElement("a");
  lien.href = URL.createObjectURL(blob);
  lien.download = `mon-potager-${iso(aujourdhui())}.json`;
  document.body.appendChild(lien);
  lien.click();
  document.body.removeChild(lien);
  URL.revokeObjectURL(lien.href);
}

function importerDonnees(fichier) {
  const lecteur = new FileReader();
  lecteur.onload = () => {
    try {
      const donnees = JSON.parse(lecteur.result);
      if (!donnees || typeof donnees !== "object") throw new Error("format");
      etat = Object.assign(etatVide(), donnees);
      synchroniserTaches();
      sauver();
      alert("Sauvegarde restaurée.");
      afficher();
    } catch (e) {
      alert("Ce fichier n'est pas une sauvegarde valide.");
    }
  };
  lecteur.readAsText(fichier);
}

/* ---------------- Cloche des nouveautés ---------------- */

function nouveautesNonLues() {
  const vue = etat.reglages.derniereNouveauteVue;
  if (!vue) return NOUVEAUTES.length;
  const index = NOUVEAUTES.findIndex(n => n.version === vue);
  return index < 0 ? NOUVEAUTES.length : index;
}

function marquerNouveautesLues() {
  etat.reglages.derniereNouveauteVue = VERSION_ACTUELLE;
  sauver();
  majCloche();
}

function majCloche() {
  const pastille = document.getElementById("pastille-cloche");
  if (!pastille) return;
  const n = nouveautesNonLues();
  pastille.textContent = n > 9 ? "9+" : String(n);
  pastille.hidden = n === 0;
}

/* ---------------- Navigation ---------------- */

const PAGES = ["accueil", "calendrier", "planning", "autonomie", "plantes", "potager", "taches", "permaculture"];

function pageCourante() {
  const h = (location.hash || "#accueil").slice(1).split("/")[0];
  return PAGES.includes(h) ? h : "accueil";
}

function argumentPage() {
  const parties = (location.hash || "").slice(1).split("/");
  return parties.length > 1 ? decodeURIComponent(parties.slice(1).join("/")) : null;
}

function aller(hash) { location.hash = hash; }

/* Un lien qui pointe vers un écran inconnu de cette version = fichiers dépareillés.
   Plutôt que de retomber silencieusement sur l'accueil (ce qui donne l'impression
   qu'un bouton ne marche pas), on le dit et on propose de recharger. */
function pageInconnue() {
  const h = (location.hash || "").slice(1).split("/")[0];
  return h && !PAGES.includes(h) ? h : null;
}

function afficher() {
  const conteneur = document.getElementById("contenu");

  const inconnue = pageInconnue();
  if (inconnue) {
    conteneur.innerHTML = `
      <header class="entete"><h1>Écran indisponible</h1></header>
      <div class="carte carte-alerte">
        <h3>Cette page vient d'une version plus récente</h3>
        <p>L'écran « ${inconnue} » n'existe pas dans la version actuellement chargée : ton
        navigateur utilise encore une ancienne copie de l'application.</p>
        <p><strong>Recharge la page</strong> pour récupérer la dernière version.</p>
        <button class="bouton" onclick="location.reload()">Recharger l'application</button>
      </div>`;
    return;
  }

  const page = pageCourante();
  document.querySelectorAll(".nav-item").forEach(b => {
    b.classList.toggle("actif", b.dataset.page === page);
  });
  conteneur.innerHTML = VUES[page](argumentPage());
  conteneur.scrollTop = 0;
  window.scrollTo(0, 0);
  majCloche();
  majBarreMeteo();
}

window.addEventListener("hashchange", afficher);

window.addEventListener("DOMContentLoaded", () => {
  synchroniserTaches();
  sauver();
  afficher();
  verifierRappels();
  actualiserMeteoSiNecessaire();
  surveillerMisesAJour();
});

/* ---------------- Mises à jour de l'application ----------------
   L'appli garde une copie d'elle-même pour fonctionner hors connexion.
   Quand une nouvelle version est déposée, la copie déjà ouverte continue de
   tourner jusqu'au prochain rechargement : on prévient donc explicitement,
   au lieu de laisser croire qu'un bouton « ne marche pas ». */

function surveillerMisesAJour() {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.register("sw.js").then(enregistrement => {
    enregistrement.addEventListener("updatefound", () => {
      const nouveau = enregistrement.installing;
      if (!nouveau) return;
      nouveau.addEventListener("statechange", () => {
        if (nouveau.state === "installed" && navigator.serviceWorker.controller) {
          bandeauMiseAJour();
        }
      });
    });
    enregistrement.update().catch(() => {});   // vérifie à chaque ouverture
  }).catch(() => {});
}

function bandeauMiseAJour() {
  if (document.getElementById("bandeau-maj")) return;
  const bandeau = document.createElement("div");
  bandeau.id = "bandeau-maj";
  bandeau.className = "bandeau-maj";
  bandeau.innerHTML =
    "<span>🌱 Une nouvelle version de l'appli est prête.</span>"
    + '<button class="bouton" onclick="location.reload()">Recharger</button>';
  document.body.appendChild(bandeau);
}

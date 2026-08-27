/* ============================================================
   Mon Potager — Synchronisation entre appareils (Firebase)

   Facultatif. Sans configuration Firebase, ou si on ne l'active pas,
   l'application fonctionne exactement comme avant, en local.

   Principe : un document par potager, contenant l'état complet.
   Le dernier appareil qui écrit fait foi. C'est volontairement simple :
   un potager est tenu par une personne, pas par une équipe.
   ============================================================ */

const SDK_FIREBASE = "https://www.gstatic.com/firebasejs/10.12.2/";
const DELAI_ENVOI_MS = 1500;      // on regroupe les modifications rapprochées
/* 23 h et non 24 : l'horloge de l'appareil peut être en avance sur celle du
   serveur, et la règle de sécurité refuserait une date trop lointaine. */
const DUREE_APPAIRAGE_MS = 23 * 3600 * 1000;

/* Rubriques réellement synchronisées : ce qui décrit le potager.
   Les réglages propres à l'appareil (notifications, lieu météo,
   prévisions téléchargées) restent locaux. */
const RUBRIQUES_SYNC = ["zones", "cultures", "taches", "favoris", "planning", "plans"];

let firebase = null;        // modules chargés à la demande
let docPotager = null;
let arretEcoute = null;
let minuteurEnvoi = null;
let envoiEnCours = false;

/* ---------------- État de la synchronisation ---------------- */

function reglagesSync() {
  if (!etat.reglages.sync) {
    etat.reglages.sync = { actif: false, code: "", dernierEnvoi: "", dernierRecu: "", erreur: "" };
  }
  return etat.reglages.sync;
}

function appareilId() {
  if (!etat.reglages.appareilId) {
    etat.reglages.appareilId = nouvelId() + nouvelId();
    sauver();
  }
  return etat.reglages.appareilId;
}

function firebaseConfigure() {
  const c = window.CONFIG_FIREBASE;
  return !!(c && c.projectId && c.projectId !== "A_REMPLIR" && c.apiKey && c.apiKey !== "A_REMPLIR");
}

function syncActive() {
  return firebaseConfigure() && reglagesSync().actif && !!reglagesSync().code;
}

/* Code de potager lisible : potager-a4k7-2m9x */
function nouveauCodePotager() {
  const lettres = "abcdefghjkmnpqrstuvwxyz23456789";   // sans i, l, o, 0, 1
  const bloc = () => Array.from({ length: 4 }, () =>
    lettres[Math.floor(Math.random() * lettres.length)]).join("");
  return `potager-${bloc()}-${bloc()}`;
}

function nouveauCodeAppairage() {
  const lettres = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 24 }, () =>
    lettres[Math.floor(Math.random() * lettres.length)]).join("");
}

/* ---------------- Chargement du SDK ---------------- */

async function chargerFirebase() {
  if (firebase) return firebase;
  if (!firebaseConfigure()) throw new Error("Firebase n'est pas configuré");

  const [app, auth, fs] = await Promise.all([
    import(SDK_FIREBASE + "firebase-app.js"),
    import(SDK_FIREBASE + "firebase-auth.js"),
    import(SDK_FIREBASE + "firebase-firestore.js")
  ]);

  const application = app.initializeApp(window.CONFIG_FIREBASE);
  const authentification = auth.getAuth(application);
  await auth.signInAnonymously(authentification);

  const base = fs.getFirestore(application);
  try {
    await fs.enableIndexedDbPersistence(base);   // permet d'écrire hors connexion
  } catch (e) {
    /* déjà activée, ou navigateur qui ne le permet pas : sans conséquence */
  }

  firebase = { fs: fs, base: base, uid: authentification.currentUser.uid };
  return firebase;
}

/* ---------------- Extraction et fusion des données ---------------- */

function donneesASynchroniser() {
  const paquet = {};
  RUBRIQUES_SYNC.forEach(r => { paquet[r] = etat[r]; });
  paquet.meteo = {
    journal: etat.meteo.journal,
    gelPrintemps: etat.meteo.gelPrintemps,
    gelAutomne: etat.meteo.gelAutomne,
    decalage: etat.meteo.decalage
  };
  paquet.foyer = etat.reglages.foyer || null;
  return paquet;
}

function appliquerDonnees(paquet) {
  if (!paquet) return;
  RUBRIQUES_SYNC.forEach(r => { if (Array.isArray(paquet[r])) etat[r] = paquet[r]; });
  if (paquet.meteo) {
    etat.meteo.journal = paquet.meteo.journal || [];
    etat.meteo.gelPrintemps = paquet.meteo.gelPrintemps || etat.meteo.gelPrintemps;
    etat.meteo.gelAutomne = paquet.meteo.gelAutomne || etat.meteo.gelAutomne;
    etat.meteo.decalage = paquet.meteo.decalage || 0;
  }
  if (paquet.foyer) etat.reglages.foyer = paquet.foyer;
  synchroniserTaches();
}

function nombreElements(paquet) {
  if (!paquet) return 0;
  return RUBRIQUES_SYNC.reduce((n, r) => n + ((paquet[r] || []).length), 0);
}

/* ---------------- Envoi ---------------- */

function planifierEnvoi() {
  if (!syncActive() || !docPotager) return;
  clearTimeout(minuteurEnvoi);
  minuteurEnvoi = setTimeout(envoyer, DELAI_ENVOI_MS);
}

async function envoyer() {
  if (!syncActive() || !docPotager || envoiEnCours) return;
  envoiEnCours = true;
  try {
    const f = await chargerFirebase();
    await f.fs.updateDoc(docPotager, {
      donnees: donneesASynchroniser(),
      maj: Date.now(),
      majPar: appareilId()
    });
    reglagesSync().dernierEnvoi = new Date().toISOString();
    reglagesSync().erreur = "";
  } catch (e) {
    reglagesSync().erreur = "Envoi impossible : " + (e.code || e.message);
  } finally {
    envoiEnCours = false;
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat));
    majEtatSync();
  }
}

/* ---------------- Écoute ---------------- */

async function ecouter() {
  if (!syncActive()) return;
  const f = await chargerFirebase();
  docPotager = f.fs.doc(f.base, "potagers", reglagesSync().code);

  if (arretEcoute) arretEcoute();
  arretEcoute = f.fs.onSnapshot(docPotager, instantane => {
    if (!instantane.exists()) return;
    const d = instantane.data();
    if (!d || d.majPar === appareilId()) return;   // c'est notre propre écriture

    appliquerDonnees(d.donnees);
    reglagesSync().dernierRecu = new Date().toISOString();
    reglagesSync().erreur = "";
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat));
    afficher();
  }, erreur => {
    reglagesSync().erreur = "Lecture impossible : " + (erreur.code || erreur.message);
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat));
    majEtatSync();
  });
}

function arreterEcoute() {
  if (arretEcoute) { arretEcoute(); arretEcoute = null; }
  docPotager = null;
}

/* ---------------- Activation ---------------- */

async function activerSync() {
  if (!firebaseConfigure()) {
    ouvrirModale("Synchronisation non configurée", `
      <p>Firebase n'est pas encore paramétré sur cette copie de l'application.</p>
      <p class="note">Le fichier <strong>firebase-config.js</strong> contient encore des
      « A_REMPLIR ». Suis le guide <strong>GUIDE-FIREBASE.md</strong> fourni avec l'appli
      (10 minutes, une seule fois), puis reviens ici.</p>
      <div class="modale-actions"><button class="bouton" onclick="fermerModale()">D'accord</button></div>`);
    return;
  }

  ouvrirModale("Activer la synchronisation", `
    <p>Ton potager sera copié en ligne, dans <strong>ton</strong> espace privé, et se
    synchronisera automatiquement entre tes appareils.</p>
    <div class="encart-confidentialite">
      <strong>Ce que ça implique</strong>
      <p>Tes données quittent cet appareil pour être stockées chez Google (Firebase).
      Seuls les appareils que tu auras toi-même appairés peuvent les lire : connaître
      le code de ton potager ne suffit pas. Tu peux tout supprimer à tout moment.</p>
    </div>
    <div class="modale-actions modale-actions-reparties">
      <button class="bouton bouton-doux" onclick="fermerModale()">Annuler</button>
      <button class="bouton" onclick="creerPotagerEnLigne()">Créer mon potager en ligne</button>
    </div>
    <p class="note marge-haut">Tu as déjà un potager en ligne sur un autre appareil ?
      <button class="mini-bouton" onclick="formulaireAppairage()">Appairer cet appareil</button></p>`);
}

async function creerPotagerEnLigne() {
  fermerModale();
  ouvrirModale("Création en cours", `<p class="note">Connexion à Firebase…</p>`);
  try {
    const f = await chargerFirebase();
    const code = nouveauCodePotager();
    await f.fs.setDoc(f.fs.doc(f.base, "potagers", code), {
      membresUid: [f.uid],
      donnees: donneesASynchroniser(),
      maj: Date.now(),
      majPar: appareilId(),
      creeLe: Date.now()
    });
    const r = reglagesSync();
    r.actif = true; r.code = code; r.erreur = "";
    r.dernierEnvoi = new Date().toISOString();
    sauver();
    await ecouter();
    fermerModale();
    ouvrirModale("C'est fait 🌱", `
      <p>Ton potager est maintenant synchronisé. Son code :</p>
      <p class="code-potager">${esc(code)}</p>
      <p class="note">Pour retrouver ton potager sur un autre appareil, va dans
      <strong>Rappels → Synchronisation</strong> et utilise « Ajouter un appareil ».</p>
      <div class="modale-actions"><button class="bouton" onclick="fermerModale();afficher()">Terminé</button></div>`);
  } catch (e) {
    fermerModale();
    alert("Impossible de créer le potager en ligne : " + (e.code || e.message)
      + "\n\nVérifie ta connexion et la configuration Firebase.");
  }
}

/* ---------------- Appairage d'un second appareil ---------------- */

async function creerCodeAppairage() {
  try {
    const f = await chargerFirebase();
    const jeton = nouveauCodeAppairage();
    await f.fs.setDoc(f.fs.doc(f.base, "appairages", jeton), {
      potager: reglagesSync().code,
      utilise: false,
      expireLe: Date.now() + DUREE_APPAIRAGE_MS,
      creeLe: Date.now()
    });
    ouvrirModale("Ajouter un appareil", `
      <p>Sur l'autre appareil : ouvre l'appli, puis
      <strong>Rappels → Synchronisation → Appairer cet appareil</strong>, et saisis
      ces deux informations :</p>
      <p class="note">Code du potager</p>
      <p class="code-potager">${esc(reglagesSync().code)}</p>
      <p class="note">Code d'appairage (valable 24 h, une seule fois)</p>
      <p class="code-potager code-long">${esc(jeton)}</p>
      <div class="modale-actions"><button class="bouton" onclick="fermerModale()">Terminé</button></div>`);
  } catch (e) {
    const code = e.code || "";
    const aide = code.includes("permission-denied")
      ? `<p>Firebase a refusé l'écriture. Dans presque tous les cas, c'est que les
         <strong>règles de sécurité</strong> ne sont pas à jour : ouvre la console Firebase →
         Firestore Database → onglet <strong>Règles</strong>, recolle le contenu du fichier
         <strong>firestore.rules</strong> puis clique sur <strong>Publier</strong>.</p>`
      : code.includes("unavailable")
        ? `<p>Firebase est injoignable : vérifie ta connexion internet, puis réessaie.</p>`
        : `<p>Vérifie ta connexion et la configuration Firebase.</p>`;

    ouvrirModale("Impossible de créer le code", `
      ${aide}
      <p class="note">Message technique : <strong>${esc(e.code || e.message)}</strong></p>
      <div class="modale-actions"><button class="bouton" onclick="fermerModale()">D'accord</button></div>`);
  }
}

function formulaireAppairage() {
  fermerModale();
  ouvrirModale("Appairer cet appareil", `
    <p class="note">Saisis les deux codes affichés sur l'appareil qui possède déjà le potager.</p>
    <form onsubmit="lancerAppairage(event)">
      <label>Code du potager
        <input name="code" required placeholder="potager-a4k7-2m9x" autocapitalize="off" spellcheck="false">
      </label>
      <label>Code d'appairage
        <input name="jeton" required placeholder="24 caractères" autocapitalize="off" spellcheck="false">
      </label>
      <div class="encart-precaution">
        <strong>Attention</strong>
        <p>Le potager en ligne remplacera ce qui est enregistré sur cet appareil.
        Si tu as des données ici que tu veux garder, exporte-les d'abord.</p>
      </div>
      <div class="modale-actions">
        <button type="button" class="bouton bouton-doux" onclick="fermerModale()">Annuler</button>
        <button type="submit" class="bouton">Appairer</button>
      </div>
    </form>
    <div id="resultat-appairage"></div>`);
}

async function lancerAppairage(ev) {
  ev.preventDefault();
  const f = new FormData(ev.target);
  const code = f.get("code").trim().toLowerCase();
  const jeton = f.get("jeton").trim().toLowerCase();
  const boite = document.getElementById("resultat-appairage");
  boite.innerHTML = `<p class="note">Appairage en cours…</p>`;

  try {
    const fb = await chargerFirebase();
    // 1. on s'ajoute à la liste des appareils autorisés
    await fb.fs.updateDoc(fb.fs.doc(fb.base, "potagers", code), {
      membresUid: fb.fs.arrayUnion(fb.uid),
      jetonUtilise: jeton
    });
    // 2. on consomme le code d'appairage
    await fb.fs.updateDoc(fb.fs.doc(fb.base, "appairages", jeton), {
      utilise: true, utiliseLe: Date.now()
    });

    const r = reglagesSync();
    r.actif = true; r.code = code; r.erreur = "";
    sauver();
    await ecouter();

    fermerModale();
    alert("Appareil appairé. Ton potager va apparaître dans quelques secondes.");
    afficher();
  } catch (e) {
    boite.innerHTML = `<div class="alerte-assoc">Appairage refusé : ${esc(e.code || e.message)}.
      Vérifie les deux codes — le code d'appairage ne sert qu'une fois et expire au bout de 24 h.</div>`;
  }
}

/* ---------------- Désactivation ---------------- */

function desactiverSync() {
  if (!confirm("Arrêter la synchronisation sur cet appareil ?\n\nTes données restent ici, et le potager en ligne reste disponible pour tes autres appareils.")) return;
  arreterEcoute();
  const r = reglagesSync();
  r.actif = false;
  sauver();
  afficher();
}

async function supprimerPotagerEnLigne() {
  if (!confirm("Supprimer définitivement le potager en ligne ?\n\nLes données restent sur cet appareil, mais tes autres appareils ne se synchroniseront plus et ne pourront plus le récupérer.")) return;
  try {
    const f = await chargerFirebase();
    await f.fs.deleteDoc(f.fs.doc(f.base, "potagers", reglagesSync().code));
    arreterEcoute();
    const r = reglagesSync();
    r.actif = false; r.code = ""; r.dernierEnvoi = ""; r.dernierRecu = "";
    sauver();
    alert("Potager en ligne supprimé.");
    afficher();
  } catch (e) {
    alert("Suppression impossible : " + (e.code || e.message));
  }
}

/* ---------------- Affichage ---------------- */

function majEtatSync() {
  const zone = document.getElementById("etat-sync");
  if (zone) zone.innerHTML = ligneEtatSync();
}

function ligneEtatSync() {
  const r = reglagesSync();
  if (r.erreur) return `<span class="etat-erreur">⚠️ ${esc(r.erreur)}</span>`;
  if (r.dernierEnvoi || r.dernierRecu) {
    const dates = [r.dernierEnvoi, r.dernierRecu].filter(Boolean).sort();
    return `<span class="etat-ok">✓ synchronisé ${majLisible(dates[dates.length - 1])}</span>`;
  }
  return `<span class="etat-moyen">en attente de la première synchronisation</span>`;
}

function carteSynchronisation() {
  const r = reglagesSync();

  if (!firebaseConfigure()) {
    return `
      <div class="carte carte-reglages">
        <h3>☁️ Synchronisation entre appareils <span class="badge badge-option">non configurée</span></h3>
        <p class="note">Pour retrouver ton potager sur ton téléphone et ton ordinateur, et avoir
        une sauvegarde automatique en ligne, il faut créer un espace Firebase — c'est gratuit et
        ça prend 10 minutes, une seule fois.</p>
        <p class="note">Tout est expliqué pas à pas dans le fichier <strong>GUIDE-FIREBASE.md</strong>
        fourni avec l'application.</p>
      </div>`;
  }

  if (!syncActive()) {
    return `
      <div class="carte carte-reglages">
        <h3>☁️ Synchronisation entre appareils <span class="badge badge-option">inactive</span></h3>
        <p class="note">Active-la pour retrouver ton potager sur tous tes appareils, et pour qu'il
        soit sauvegardé en ligne automatiquement à chaque modification.</p>
        <div class="barre-boutons">
          <button class="bouton" onclick="activerSync()">☁️ Activer la synchronisation</button>
        </div>
      </div>`;
  }

  return `
    <div class="carte carte-reglages">
      <h3>☁️ Synchronisation active</h3>
      <p class="note">Code de ton potager :</p>
      <p class="code-potager">${esc(r.code)}</p>
      <p class="note" id="etat-sync">${ligneEtatSync()}</p>

      <p class="note">Chaque modification part en ligne automatiquement. Tes autres appareils
      appairés se mettent à jour en quelques secondes. Hors connexion, l'appli continue de
      fonctionner et enverra tout au retour du réseau.</p>

      <div class="barre-boutons">
        <button class="bouton" onclick="creerCodeAppairage()">📱 Ajouter un appareil</button>
        <button class="bouton bouton-doux" onclick="envoyer()">🔄 Forcer l'envoi</button>
      </div>

      <h4>Arrêter</h4>
      <div class="barre-boutons">
        <button class="bouton bouton-doux" onclick="desactiverSync()">Arrêter sur cet appareil</button>
        <button class="bouton-danger" onclick="supprimerPotagerEnLigne()">Supprimer le potager en ligne</button>
      </div>

      <p class="mention-legale">Les données sont hébergées par Google (Firebase), dans la région
      choisie à la création du projet. Seuls les appareils que tu as appairés peuvent les lire.
      L'export local reste disponible et fonctionne indépendamment.</p>
    </div>`;
}

/* ---------------- Retours : idées et bugs ----------------
   Déposés dans une collection à part. Personne ne peut les relire depuis
   l'appli : ils se consultent dans la console Firebase. */

function formulaireRetour(type) {
  const bug = type === "bug";
  ouvrirModale(bug ? "Signaler un problème" : "Proposer une idée", `
    <form onsubmit="envoyerRetour(event,'${bug ? "bug" : "idee"}')">
      <label>${bug ? "Que s'est-il passé ?" : "Ton idée en une ligne"}
        <input name="titre" required maxlength="150" autofocus
               placeholder="${bug ? "Le bouton X ne fait rien" : "Pouvoir noter la météo du jour"}">
      </label>
      <label>${bug ? "Détaille : à quel endroit, qu'attendais-tu ?" : "Explique un peu"}
        <textarea name="detail" rows="5" maxlength="2000"
                  placeholder="${bug ? "Écran Planning, après avoir cliqué sur…" : "Ça me servirait à…"}"></textarea>
      </label>
      <div class="encart-confidentialite">
        <strong>Ce qui est envoyé</strong>
        <p>Uniquement ton texte, la version de l'appli et le type d'appareil — rien de ton potager,
        aucune donnée personnelle. Le message part chez Firebase et n'est lisible que par
        la personne qui gère l'application.</p>
      </div>
      <div class="modale-actions">
        <button type="button" class="bouton bouton-doux" onclick="fermerModale()">Annuler</button>
        <button type="submit" class="bouton">Envoyer</button>
      </div>
    </form>
    <div id="resultat-retour"></div>`);
}

async function envoyerRetour(ev, type) {
  ev.preventDefault();
  const f = new FormData(ev.target);
  const boite = document.getElementById("resultat-retour");
  boite.innerHTML = `<p class="note">Envoi en cours…</p>`;

  const message = {
    type: type,
    titre: f.get("titre").trim().slice(0, 150),
    detail: (f.get("detail") || "").trim().slice(0, 2000),
    version: typeof VERSION_ACTUELLE !== "undefined" ? VERSION_ACTUELLE : "?",
    appareil: navigator.userAgent.slice(0, 200),
    envoyeLe: Date.now()
  };

  if (!firebaseConfigure()) {
    boite.innerHTML = `
      <div class="alerte-assoc">L'envoi n'est pas configuré sur cette copie de l'application.
        Copie ton message et transmets-le directement :</div>
      <textarea rows="5" onclick="this.select()">${esc(message.titre + "\n\n" + message.detail)}</textarea>`;
    return;
  }

  try {
    const fb = await chargerFirebase();
    await fb.fs.setDoc(fb.fs.doc(fb.base, "retours", nouvelId() + nouvelId()), message);
    fermerModale();
    ouvrirModale("Merci 🌱", `
      <p>${type === "bug" ? "Le problème est signalé." : "L'idée est notée."} Elle sera lue,
      même si tu ne reçois pas de réponse directe — l'appli ne sait pas te répondre.</p>
      <div class="modale-actions"><button class="bouton" onclick="fermerModale()">Fermer</button></div>`);
  } catch (e) {
    boite.innerHTML = `
      <div class="alerte-assoc">Envoi impossible (${esc(e.code || e.message)}).
        ${String(e.code || "").includes("permission-denied")
          ? "Les règles de sécurité Firebase ne sont pas à jour : recolle le fichier firestore.rules dans la console et publie."
          : "Vérifie ta connexion, puis réessaie."}</div>`;
  }
}

function carteBeta() {
  return `
    <div class="carte carte-beta">
      <h3>🧪 Version bêta <span class="badge badge-beta">bêta</span></h3>
      <p>Cette application est en construction. Des choses manquent, d'autres se comporteront
      bizarrement — et c'est en le disant qu'on l'améliore.</p>
      <div class="barre-boutons">
        <button class="bouton" onclick="formulaireRetour('idee')">💡 Proposer une idée</button>
        <button class="bouton bouton-doux" onclick="formulaireRetour('bug')">🐛 Signaler un problème</button>
      </div>
      <p class="note">Version actuellement installée : <strong>${typeof VERSION_ACTUELLE !== "undefined" ? esc(VERSION_ACTUELLE) : "?"}</strong>.
        La cloche 🔔 en haut liste tout ce qui a été ajouté.</p>
    </div>`;
}

/* ---------------- Démarrage ---------------- */

function demarrerSync() {
  if (!syncActive()) return;
  ecouter().catch(e => {
    reglagesSync().erreur = "Connexion impossible : " + (e.code || e.message);
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(etat));
  });
}

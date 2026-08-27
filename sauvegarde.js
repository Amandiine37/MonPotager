/* ============================================================
   Mon Potager — Protection des données
   Les données vivent dans le navigateur. Ce fichier limite les
   risques de perte : stockage durable, copie de secours locale,
   et rappel d'export quand la dernière sauvegarde date trop.
   ============================================================ */

const CLE_SAUVEGARDE_AUTO = "potager-permaculture-v1-auto";
const DELAI_RAPPEL_JOURS = 14;      // au-delà, on rappelle d'exporter
const DELAI_COPIE_JOURS = 3;        // fréquence de la copie de secours interne

/* ---------------- État des données ---------------- */

function donneesPresentes() {
  return etat.zones.length > 0
    || etat.cultures.length > 0
    || etat.planning.length > 0
    || (etat.plans || []).length > 0
    || etat.favoris.length > 0
    || etat.taches.some(t => !t.auto);
}

function nombreDonnees() {
  return etat.zones.length + etat.cultures.length + etat.planning.length
    + (etat.plans || []).length
    + etat.taches.filter(t => !t.auto).length + etat.favoris.length;
}

function joursDepuisSauvegarde() {
  const d = etat.reglages.derniereSauvegarde;
  if (!d) return null;
  return joursEntre(d, iso(aujourdhui()));
}

function besoinRappelSauvegarde() {
  if (!donneesPresentes()) return false;
  const masque = etat.reglages.rappelSauvegardeMasque;
  if (masque && masque > iso(aujourdhui())) return false;
  const jours = joursDepuisSauvegarde();
  return jours === null || jours >= DELAI_RAPPEL_JOURS;
}

function masquerRappelSauvegarde() {
  etat.reglages.rappelSauvegardeMasque = ajouterJours(iso(aujourdhui()), 7);
  sauver();
  afficher();
}

/* ---------------- Stockage durable ----------------
   Sans cela, un navigateur à court d'espace peut supprimer les données
   d'un site sans prévenir. Cette demande le lui interdit. */

async function demanderStockagePersistant() {
  if (!navigator.storage || !navigator.storage.persist) return false;
  try {
    const dejaAccorde = await navigator.storage.persisted();
    if (dejaAccorde) { etat.reglages.stockagePersistant = true; sauver(); return true; }
    const accorde = await navigator.storage.persist();
    etat.reglages.stockagePersistant = accorde;
    sauver();
    return accorde;
  } catch (e) {
    return false;
  }
}

async function etatStockage() {
  if (!navigator.storage || !navigator.storage.persisted) return "inconnu";
  try {
    return (await navigator.storage.persisted()) ? "durable" : "ordinaire";
  } catch (e) {
    return "inconnu";
  }
}

/* ---------------- Copie de secours interne ----------------
   Protège des fausses manœuvres dans l'appli (suppression d'une zone,
   d'une culture…). Ne protège PAS d'un effacement des données du
   navigateur : pour cela, il faut un export sur ton disque. */

function copieDeSecours() {
  try {
    const brut = localStorage.getItem(CLE_SAUVEGARDE_AUTO);
    return brut ? JSON.parse(brut) : null;
  } catch (e) {
    return null;
  }
}

function faireCopieDeSecours(forcer) {
  if (!donneesPresentes()) return;
  const existante = copieDeSecours();
  if (!forcer && existante && existante.date
      && joursEntre(existante.date.slice(0, 10), iso(aujourdhui())) < DELAI_COPIE_JOURS) return;
  try {
    localStorage.setItem(CLE_SAUVEGARDE_AUTO, JSON.stringify({
      date: new Date().toISOString(),
      elements: nombreDonnees(),
      donnees: etat
    }));
  } catch (e) {
    /* espace insuffisant : on ne bloque pas l'appli pour autant */
  }
}

function restaurerCopieDeSecours() {
  const copie = copieDeSecours();
  if (!copie) { alert("Aucune copie de secours disponible."); return; }
  const quand = new Date(copie.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  if (!confirm(`Revenir à la copie du ${quand} (${copie.elements} éléments) ?\n\nTout ce que tu as saisi depuis sera perdu.`)) return;
  etat = Object.assign(etatVide(), copie.donnees);
  synchroniserTaches();
  sauver();
  alert("Copie de secours restaurée.");
  afficher();
}

/* ---------------- Rappel sur l'accueil ---------------- */

function bandeauSauvegardeAccueil() {
  if (!besoinRappelSauvegarde()) return "";
  const jours = joursDepuisSauvegarde();
  const texte = jours === null
    ? `Tu as saisi ${nombreDonnees()} éléments et tu n'as encore <strong>jamais exporté</strong> tes données.`
    : `Ta dernière sauvegarde date de <strong>${jours} jours</strong>.`;

  return `
    <div class="carte carte-alerte">
      <h3>💾 Pense à sauvegarder</h3>
      <p>${texte} Tes données ne vivent que dans ce navigateur : si tu le nettoies, ou s'il fait
      le ménage tout seul, elles disparaissent définitivement.</p>
      <div class="barre-boutons">
        <button class="bouton" onclick="exporterDonnees()">💾 Sauvegarder maintenant</button>
        <button class="bouton bouton-doux" onclick="masquerRappelSauvegarde()">Plus tard</button>
      </div>
    </div>`;
}

/* ---------------- Message de bienvenue (première ouverture) ---------------- */

function messageBienvenue() {
  if (etat.reglages.bienvenueVue) return "";
  return `
    <div class="carte carte-astuce">
      <h3>👋 Bienvenue dans ton potager</h3>
      <p>Deux choses à savoir avant de commencer :</p>
      <ul class="liste-simple">
        <li><strong>Tes données restent sur cet appareil.</strong> Il n'y a pas de compte, rien
        n'est envoyé sur internet, et personne d'autre ne voit ton potager — pas même les autres
        personnes qui utilisent cette appli.</li>
        <li><strong>Elles ne sont pas sauvegardées ailleurs.</strong> Si tu effaces les données de
        ton navigateur, tout disparaît. Pense à exporter ta sauvegarde de temps en temps :
        c'est dans l'onglet Rappels, tout en bas.</li>
      </ul>
      <p class="note">Le plus sûr : <strong>installe l'appli</strong> (menu du navigateur →
      « Installer l'application » ou « Ajouter à l'écran d'accueil »). Les données d'une appli
      installée sont bien mieux protégées, en particulier sur iPhone.</p>
      <button class="bouton" onclick="masquerBienvenue()">J'ai compris</button>
    </div>`;
}

function masquerBienvenue() {
  etat.reglages.bienvenueVue = true;
  demanderStockagePersistant();
  sauver();
  afficher();
}

/* ---------------- Carte complète, écran Rappels ---------------- */

function carteSauvegarde() {
  const jours = joursDepuisSauvegarde();
  const copie = copieDeSecours();
  const etatTexte = etat.reglages.stockagePersistant
    ? '<span class="etat-ok">✓ stockage durable accordé</span>'
    : '<span class="etat-moyen">stockage ordinaire</span>';

  return `
    <div class="carte carte-reglages">
      <h3>💾 Mes données et leur sauvegarde</h3>

      <p class="note">Ton potager contient <strong>${nombreDonnees()} éléments</strong>.
        Dernière sauvegarde : <strong>${jours === null ? "jamais" : jours === 0 ? "aujourd'hui" : "il y a " + jours + " jour" + (jours > 1 ? "s" : "")}</strong>.
        État du stockage : ${etatTexte}.</p>

      <div class="barre-boutons">
        <button class="bouton" onclick="exporterDonnees()">💾 Exporter ma sauvegarde</button>
        <label class="bouton bouton-doux fichier">📂 Restaurer un fichier
          <input type="file" accept="application/json" onchange="if(this.files[0])importerDonnees(this.files[0])">
        </label>
      </div>

      <h4>Où sont mes données ?</h4>
      <p class="note">Uniquement dans ce navigateur, sur cet appareil. Il n'y a pas de compte et
      rien n'est envoyé sur internet. Conséquence : elles ne sont pas partagées entre ton
      téléphone et ton ordinateur, et <strong>personne ne peut les récupérer à ta place</strong>
      si elles sont effacées.</p>

      <h4>Ce qui peut les effacer</h4>
      <ul class="liste-simple">
        <li>Vider les données de navigation ou l'historique du navigateur.</li>
        <li>Utiliser l'appli en navigation privée : tout disparaît en fermant.</li>
        <li><strong>Sur iPhone :</strong> Safari efface les données des sites non installés au bout
        de 7 jours sans visite. Installer l'appli sur l'écran d'accueil règle le problème.</li>
        <li>Un navigateur à court d'espace qui fait le ménage tout seul.</li>
      </ul>

      <h4>Comment se protéger</h4>
      <ul class="liste-simple">
        <li><strong>Installe l'appli</strong> sur ton écran d'accueil ou ton bureau : c'est la
        protection la plus efficace.</li>
        <li><strong>Exporte de temps en temps</strong> : le fichier obtenu se range où tu veux et
        se recharge sur n'importe quel appareil. C'est aussi comme ça qu'on transfère son potager
        du PC au téléphone.</li>
        <li>L'appli te rappellera de le faire si plus de ${DELAI_RAPPEL_JOURS} jours passent sans sauvegarde.</li>
      </ul>

      <h4>Copie de secours interne</h4>
      ${copie ? `
        <p class="note">Une copie est conservée automatiquement dans le navigateur, refaite tous les
        ${DELAI_COPIE_JOURS} jours. Dernière : <strong>${new Date(copie.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</strong>
        (${copie.elements} éléments).</p>
        <p class="note">⚠️ Elle te sauve d'une fausse manœuvre dans l'appli, <strong>pas</strong> d'un
        effacement du navigateur — elle est rangée au même endroit que tes données.</p>
        <div class="barre-boutons">
          <button class="bouton bouton-doux" onclick="restaurerCopieDeSecours()">↩️ Revenir à cette copie</button>
          <button class="bouton bouton-doux" onclick="faireCopieDeSecours(true);afficher()">🔄 Refaire la copie maintenant</button>
        </div>`
      : `<p class="rien">Aucune copie pour l'instant : elle se crée dès que tu saisis quelque chose.</p>`}
    </div>`;
}

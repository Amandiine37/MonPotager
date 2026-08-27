# Guide : activer la synchronisation (Firebase)

**À quoi ça sert ?**

Sans cette étape, l'application marche très bien… mais ton potager reste enfermé dans un seul
navigateur : pas de synchro entre le téléphone et l'ordinateur, et si tu effaces les données du
navigateur, tout est perdu.

Firebase est un espace de stockage posé sur internet. Une fois branché :

- ton potager est **le même partout**, téléphone et ordinateur ;
- il est **sauvegardé automatiquement** à chaque modification ;
- ça continue de marcher **hors connexion** : tout repart en ligne au retour du réseau.

C'est **gratuit** pour cet usage (on est très loin des limites payantes), il faut **10 minutes**
une seule fois, et un **compte Google personnel** (pas le compte professionnel).

---

## Étape 1 — Créer le projet

1. Va sur **https://console.firebase.google.com** et connecte-toi avec ton compte Google personnel.
2. Clique sur **« Créer un projet »**.
3. Nom du projet : `mon-potager` (ou ce que tu veux).
4. À l'écran « Google Analytics », **désactive** Analytics : inutile ici, et ça évite une étape.
5. Clique sur **Créer le projet**, puis **Continuer** quand c'est prêt.

---

## Étape 2 — Créer la base de données

1. Dans le menu de gauche : **Créer** (ou « Build ») → **Firestore Database**.
2. Clique sur **« Créer une base de données »**.
3. Emplacement : choisis une région **en Europe**, par exemple `eur3 (europe-west)`.
   ⚠️ Ce choix est **définitif**, mais n'importe quelle région européenne convient.
4. Choisis **« Démarrer en mode production »** (on met les bonnes règles juste après).
5. Clique sur **Créer**.

---

## Étape 3 — Autoriser la connexion anonyme

L'appli n'a pas de comptes ni de mots de passe : chaque appareil reçoit une identité anonyme.
C'est elle qui sert à vérifier qui a le droit de lire ton potager.

1. Menu de gauche : **Créer** → **Authentication**.
2. Clique sur **« Commencer »**.
3. Dans la liste des fournisseurs, choisis **« Anonyme »**.
4. Bascule l'interrupteur sur **Activé**, puis **Enregistrer**.

---

## Étape 4 — Écrire les règles de sécurité

1. Retourne dans **Firestore Database**, onglet **« Règles »**.
2. **Efface tout** ce qui s'y trouve.
3. Ouvre le fichier **`firestore.rules`** de ce dossier, sélectionne tout, copie, et colle
   dans Firebase.
4. Clique sur **Publier**.

> ⚠️ **Cette étape n'est pas une formalité.** Ces règles sont ce qui empêche réellement
> quelqu'un de lire ton potager, même en bidouillant l'application. Sans elles, n'importe qui
> pourrait tout lire.

**Ce qu'elles font, en clair :**

| La règle | Ce qu'elle empêche |
|---|---|
| Un potager n'est lisible que par les **appareils inscrits** dans sa liste | Que quelqu'un qui devine ton code voie ton potager |
| On n'ajoute un appareil qu'avec un **code d'appairage** valide, non expiré, non utilisé | Qu'un code qui traîne serve deux fois |
| Personne ne peut **lister** les potagers ni les codes | Qu'on découvre les potagers des autres |
| Un appareil qui s'appaire ne peut **qu'ajouter son identifiant** | Qu'il écrase les données existantes au passage |

---

## Étape 5 — Récupérer la configuration

1. En haut à gauche, clique sur la **roue dentée** → **Paramètres du projet**.
2. Descends jusqu'à **« Vos applications »**.
3. Clique sur l'icône **`</>`** (application Web).
4. Surnom : `potager`. **Ne coche pas** « Firebase Hosting ». Clique sur **Enregistrer l'application**.
5. Firebase affiche un bloc de code contenant `const firebaseConfig = { … }`.
6. Ouvre le fichier **`firebase-config.js`** de ce dossier avec le Bloc-notes, et recopie tes
   valeurs à la place des `"A_REMPLIR"`. Garde bien les guillemets.

> Ces valeurs ne sont **pas** des mots de passe. Elles peuvent rester visibles dans un dépôt
> public : ce sont les règles de l'étape 4 qui protègent tes données.

---

## Étape 6 — Redéposer l'appli et activer

1. Redépose tous les fichiers du dossier sur GitHub (dont `firebase-config.js` rempli).
2. Ouvre l'appli, va dans **Rappels → Synchronisation**.
3. Clique sur **« ☁️ Activer la synchronisation »** puis **« Créer mon potager en ligne »**.
4. Note le **code de ton potager** qui s'affiche (`potager-xxxx-xxxx`).

---

## Ajouter un deuxième appareil

Sur l'appareil qui a déjà le potager :

1. **Rappels → Synchronisation → 📱 Ajouter un appareil**.
2. Deux codes s'affichent : le **code du potager** et un **code d'appairage** (valable 24 h,
   utilisable une seule fois).

Sur le nouvel appareil :

3. **Rappels → Synchronisation → Activer** → **« Appairer cet appareil »**.
4. Saisis les deux codes, valide.

⚠️ **Le potager en ligne remplace ce qui était sur le nouvel appareil.** Si tu y avais saisi des
choses, exporte-les d'abord (Rappels → Exporter ma sauvegarde).

---

## Questions courantes

**Est-ce que les autres personnes à qui j'ai partagé l'appli voient mon potager ?**
Non, jamais. Chacun crée son propre potager en ligne, lisible uniquement par ses propres
appareils. L'appli est partagée, pas les données.

**Et si je ne fais rien de tout ça ?**
L'appli continue de fonctionner exactement comme avant, en local. La synchronisation est
entièrement facultative.

**Que se passe-t-il si je modifie mon potager sur deux appareils en même temps ?**
Le dernier enregistrement gagne. C'est volontairement simple : un potager est tenu par une
personne, pas par une équipe. En pratique, on ne jardine pas sur deux téléphones à la fois.

**Combien ça coûte ?**
Rien. Le plan gratuit de Firebase autorise 50 000 lectures et 20 000 écritures par jour ; un
potager en consomme quelques dizaines. Aucune carte bancaire n'est demandée.

**Comment j'arrête tout ?**
Dans **Rappels → Synchronisation** : « Arrêter sur cet appareil » garde le potager en ligne pour
les autres, « Supprimer le potager en ligne » efface tout côté Firebase. Dans les deux cas, tes
données restent sur l'appareil.

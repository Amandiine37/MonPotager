# Mon Potager en permaculture

Application de gestion du potager : planning de plantation personnalisable, calendrier de semis,
fiches détaillées des légumes, fruits, aromatiques et plantes médicinales, associations de
cultures, rotation, travaux du mois et rappels.

Les dates sont calées sur un **climat tempéré Centre / Ouest de la France**.
Sous un climat plus froid (Nord, Est, montagne), décale les semis de 2 à 3
semaines plus tard ; sous un climat doux (Sud), de 2 à 3 semaines plus tôt.

## Lancer l'application

```bash
python serve.py
```

Puis ouvrir http://localhost:4176 dans le navigateur.
(Le port 4176 est libre : 4173 est pris par suivi-revente, 4174 par Tribu.)

Sur téléphone ou sur PC, le menu du navigateur propose « Installer l'application »
ou « Ajouter à l'écran d'accueil » : elle s'ouvre alors comme une vraie appli et
fonctionne sans connexion internet.

## Les 8 écrans

| Écran | À quoi il sert |
|---|---|
| **Accueil** | Ce qu'il y a à semer, planter et récolter ce mois-ci, les rappels en retard et les travaux de permaculture du mois. |
| **Planning** | **Ton** calendrier de plantation de l'année : tu choisis tes plantes, tu ajustes les mois, tu suis tes récoltes. |
| **Autonomie** | Tes récoltes comparées aux besoins de ton foyer, avec des jauges qui se remplissent. |
| **Calendrier** | Le calendrier de référence : les 12 mois de toutes les plantes de la bibliothèque, sans rien de personnel. |
| **Plantes** | 107 fiches détaillées (légumes, fruits, aromatiques, médicinales) : culture, associations, rotation, conseils permaculture, propriétés médicinales. |
| **Potager** | Tes zones (planches, carrés, serre) et ce que tu y as semé ou planté, avec alertes d'association et de rotation. |
| **Rappels** | Les tâches à faire, créées automatiquement à partir de tes cultures ou ajoutées à la main. |
| **Perma** | Principes, travaux mois par mois, rotation des cultures sur 4 ans, recettes de purins et décoctions. |

> **Calendrier ou Planning ?** *Calendrier* ne change jamais : c'est le savoir de référence.
> *Planning* est à toi : il part du calendrier de référence, puis tu le modifies comme tu veux.

## L'écran Planning en détail

**Construire son planning**

1. « ➕ Ajouter une plante » ouvre la bibliothèque (recherche, catégories et filtre alphabétique).
2. La plante arrive avec ses mois de semis, plantation et récolte déjà remplis d'après sa fiche.
3. Touche son nom pour tout ajuster : chaque mois s'ajoute ou s'enlève d'un doigt. Les cases
   en pointillés rappellent ce que conseille la bibliothèque — tu peux t'en écarter librement.

**Ce que tu peux noter sur chaque plante**

- la zone du potager où elle ira ;
- un objectif de récolte (« 20 kg », « 6 pieds ») ;
- ses récoltes réelles au fur et à mesure, en kg, en pièces, en bottes… avec les totaux de l'année ;
- un statut (prévu, en cours, fait, annulé), qui avance tout seul quand tu coches les interventions ;
- tes notes de l'année : variété, provenance des graines, ce qui a marché.

**Les trois vues**

- **Vue de l'année** : la grille des 12 mois, les alertes, et un graphique de charge de travail
  qui montre les mois où tu t'es surchargée.
- **Mois par mois** : la liste de ce qu'il y a à faire chaque mois, à cocher au fur et à mesure,
  avec les travaux de permaculture du mois juste en dessous.
- **Météo & gelées** : les prévisions à 7 jours (en option), tes deux dates de gelées,
  ton décalage de saison et ton journal d'observations de l'année.

**Les alertes automatiques**

| Alerte | Quand elle se déclenche |
|---|---|
| ❄️ Gel | Une plante gélive est mise en terre avant tes dernières gelées, ou récoltée après les premières. |
| ⚠️ Association | Deux plantes qui ne s'entendent pas sont prévues dans la même zone. |
| 🔄 Rotation | Une plante de la même famille revient dans une zone occupée l'an dernier. |
| 📊 Surcharge | Un mois dépasse 12 interventions prévues. |

**Les boutons utiles**

- **🔔 Créer les rappels** : transforme tout le planning en rappels datés au 1er du mois concerné,
  que tu peux ensuite décaler un par un dans l'écran Rappels.
- **📤 Exporter** : un fichier `.csv` ouvrable dans Excel ou LibreOffice.
- **Reprendre le planning de l'année précédente** : proposé quand tu passes à l'année suivante
  (les flèches ◀ ▶ à côté de l'année).

## L'autosuffisance

Onglet **Autonomie** (menu du bas). Il partage l'année sélectionnée avec le Planning, dont il
lit les récoltes. Tu indiques combien de personnes vivent au foyer
(les enfants de moins de 12 ans comptent pour une demi-part) et tes récoltes se transforment
en jauges.

**Deux repères, volontairement distincts :**

- **Sur ce que tu cultives** — as-tu récolté assez des légumes que tu as effectivement plantés ?
  C'est le chiffre qui dit si tes surfaces sont bien dimensionnées.
- **Sur une alimentation complète en légumes** — ta vraie part d'autonomie. Il est forcément
  plus bas, et c'est normal : personne ne cultive les 63 espèces de la liste.

**Espèce par espèce**, chaque ligne indique le récolté, le besoin annuel du foyer, le
pourcentage, et surtout **ce qu'il faudrait en plus** pour combler le manque. Les légumes se
comptent en mètres carrés (« il manque 60 kg de pommes de terre — soit environ 20 m² de plus »),
les arbres et arbustes en pieds (« il manque 40 kg de pommes — soit environ 1 pied de plus »).
Un badge « quota atteint » apparaît à 100 %.

En bas, l'appli propose les légumes qui **pèsent le plus** dans l'alimentation d'un foyer et
qui ne sont pas encore à ton planning, avec le besoin annuel calculé pour ton foyer.

**Les unités sont converties automatiquement** : les grammes en kilos, les pièces et les bottes
en kilos grâce à un poids moyen par légume (une salade ≈ 300 g, un poireau ≈ 250 g, une tête
d'ail ≈ 60 g). Les récoltes notées en litres ou en bouquets ne sont pas convertibles : elles
sont exclues du calcul, et l'appli te le signale.

Le résumé apparaît aussi sur l'écran d'accueil dès que tu as noté une récolte.

**D'où viennent les chiffres.** Les besoins annuels s'appuient sur la consommation moyenne d'un
adulte en France, les rendements sur des moyennes de jardin amateur. Tout est dans
`data-besoins.js`, une ligne par légume, facile à corriger si tes chiffres réels diffèrent —
et ils différeront. Les aromatiques et les médicinales ne sont pas comptées.

## Les prévisions météo (option, désactivée par défaut)

**Le plus simple : l'icône 🌦️ en haut de l'écran**, juste à gauche de la cloche. Elle est
éteinte (grisée) tant que les prévisions ne sont pas activées ; un appui propose de choisir
ton lieu. Une fois allumée, elle affiche le temps et la température du jour, et un **point
rouge** apparaît dès qu'il y a une alerte (gelée, canicule, vent fort) ; un appui ouvre les
7 jours et les conseils.

Les réglages complets sont dans **Planning → Météo & gelées**, bouton
« 📍 Choisir mon lieu et activer ».
Tu tapes le nom de ta commune, tu la choisis dans la liste, et l'appli affiche 7 jours de
prévisions : températures max/min, pluie, vent et surtout **température du sol à 6 cm** —
la seule donnée qui dit vraiment si une graine va germer.

Le tout est traduit en conseils de jardinage : faut-il arroser, une gelée arrive-t-elle
(avec les plantes de ton planning qui sont concernées), le sol est-il assez chaud pour semer
des haricots. Les alertes importantes remontent aussi sur l'écran d'accueil.

**Ce que ça implique.** C'est la seule partie de l'application qui utilise internet. Elle
interroge **Open-Meteo** (open-meteo.com), gratuit et sans compte, en lui envoyant uniquement
les coordonnées de la commune choisie. Rien de ton potager n'est transmis. Les prévisions se
rafraîchissent au maximum une fois toutes les 3 heures, et sont conservées pour rester
consultables hors connexion. Le bouton « Désactiver » supprime le lieu et les prévisions, et
l'appli redevient totalement hors ligne.

## Ce que fait l'appli toute seule

- **Rappel de repiquage** : 5 semaines après un semis sous abri.
- **Récolte estimée** : à partir de la durée de culture de la plante.
- **Alerte d'association** : si deux plantes qui ne s'entendent pas sont dans la même zone.
- **Alerte de rotation** : si une plante de la même famille botanique a occupé la zone dans les 3 dernières années.
- **Suggestions du mois** : pour les plantes marquées d'une ⭐ (bouton « Suivre » sur la fiche).
- **Alertes du planning** : gel, associations, rotation et mois surchargés (voir plus haut).
- **Notifications** : à activer depuis l'écran Rappels. Elles se déclenchent à l'ouverture de l'appli, une fois par jour maximum.

## Où sont mes données ?

Uniquement dans le navigateur de cet appareil (`localStorage`). Il n'y a pas de compte à
créer, et rien de ton potager n'est jamais envoyé sur internet — la seule connexion sortante
possible est l'option météo décrite plus haut, qui ne transmet que des coordonnées.

Conséquence : les données ne sont **pas** partagées entre le PC et le téléphone,
et **personne ne peut les récupérer à ta place** si elles sont effacées.

### Ce qui peut les effacer

- Vider les données de navigation ou l'historique du navigateur.
- Utiliser l'appli en navigation privée : tout disparaît en fermant.
- **Sur iPhone** : Safari efface les données des sites non installés au bout de 7 jours sans
  visite. C'est le risque le plus courant, et il surprend tout le monde.
- Un navigateur à court d'espace qui fait le ménage tout seul.

### Les trois protections en place

1. **Installer l'appli** (menu du navigateur → « Installer » ou « Ajouter à l'écran d'accueil »)
   est de loin la plus efficace : elle lève notamment la limite des 7 jours sur iPhone.
2. **Le stockage durable** : l'appli demande au navigateur, via `navigator.storage.persist()`,
   de ne jamais supprimer ses données pour faire de la place. Accordé ou non selon le
   navigateur ; l'état réel est affiché dans l'écran Rappels.
3. **Le rappel de sauvegarde** : passé 14 jours sans export, un bandeau apparaît sur l'accueil.
   Le bouton « Plus tard » le repousse d'une semaine. Exporter remet le compteur à zéro.

### Copie de secours interne

Une copie complète est conservée dans le navigateur, refaite tous les 3 jours, restaurable
depuis l'écran Rappels. Elle rattrape une **fausse manœuvre dans l'appli** (zone supprimée par
erreur) mais **pas** un effacement du navigateur : elle est rangée au même endroit que les
données. Elle ne remplace donc jamais un export.

### La synchronisation entre appareils (Firebase, facultative)

C'est la solution la plus confortable : le potager est **le même sur le téléphone et
l'ordinateur**, et **sauvegardé en ligne automatiquement** à chaque modification. Elle
demande de créer un espace Firebase — gratuit, 10 minutes, une seule fois.

Tout est expliqué pas à pas dans **`GUIDE-FIREBASE.md`**. En résumé :

1. Créer un projet Firebase et une base Firestore en Europe.
2. Activer la connexion **Anonyme** dans Authentication.
3. Coller le contenu de **`firestore.rules`** dans les règles Firestore, et publier.
4. Recopier la configuration dans **`firebase-config.js`**.
5. Dans l'appli : **Rappels → Synchronisation → Activer**.

**Comment ça marche.** Chaque appareil reçoit une identité anonyme. Un potager n'est lisible
que par les appareils inscrits dans sa liste : connaître le code `potager-xxxx-xxxx` ne suffit
pas. Pour ajouter un appareil, le premier génère un **code d'appairage à usage unique valable
24 h**, à saisir sur le second.

**En cas de modification simultanée sur deux appareils, le dernier enregistrement gagne.**
C'est volontairement simple : un potager est tenu par une personne, pas par une équipe.

**Ce qui n'est pas synchronisé** : les réglages propres à l'appareil — notifications, lieu
météo et prévisions téléchargées. Ils restent locaux, c'est voulu.

Sans configuration Firebase, ou si on ne l'active pas, l'application fonctionne exactement
comme avant, entièrement en local.

### L'export, seule vraie sauvegarde locale

Écran **Rappels** → **Exporter ma sauvegarde** : un fichier `.json` que tu ranges où tu veux
(disque, cloud, mail à toi-même). **Restaurer un fichier** le recharge sur n'importe quel
appareil — c'est aussi comme ça qu'on transfère son potager du PC au téléphone.

## Mettre l'application en ligne (GitHub Pages)

Comme pour *Tribu* et *reventes* :

1. Créer un dépôt sur le compte GitHub personnel, par exemple `potager`.
   Il peut être **public** sans souci : il n'y a aucun mot de passe dans ces fichiers.
   Les valeurs de `firebase-config.js` ne sont pas des secrets — ce sont les règles de
   `firestore.rules` qui protègent les données.
2. Y déposer **tous les fichiers** de ce dossier. `serve.py` et `make_icons.py`
   ne servent qu'en local, mais les garder ne pose aucun problème.
3. Dans le dépôt : **Settings → Pages → Source : `main` / dossier `/ (root)`**.
4. Au bout d'une minute, l'application est à l'adresse
   `https://VOTRE-COMPTE.github.io/potager/`.
5. Sur le téléphone : ouvrir l'adresse dans Chrome → menu **⋮** →
   **« Ajouter à l'écran d'accueil »**.

**Pour mettre à jour plus tard :** redéposer les fichiers modifiés sur GitHub.
L'application se met à jour toute seule au prochain lancement (le cache est en
« réseau d'abord »).

⚠️ Attention : les données du potager restent liées à l'adresse utilisée. Si tu
travailles d'abord en local (`localhost:4176`) puis que tu passes à l'adresse
GitHub Pages, tu repartiras d'un potager vide. Utilise **Exporter / Importer**
(écran Rappels) pour transférer tes zones et tes cultures.

## Contenu de la base

- **43 légumes** (dont capucine et œillet d'Inde, les fleurs compagnes)
- **20 fruits** : fruits du potager (fraisier, melon, pastèque, physalis, rhubarbe), petits fruits (framboisier, groseilliers, cassissier, mûrier, myrtillier, vigne, kiwaï, noisetier) et fruitiers (pommier, poirier, prunier, cerisier, pêcher, figuier)
- **20 aromatiques**
- **25 plantes médicinales**
- **72 mois de travaux** répartis sur l'année
- **6 recettes** de purins et décoctions maison
- **63 légumes et fruits** avec besoins annuels et rendements, pour le calcul d'autosuffisance

## Annoncer une nouveauté dans la cloche

Ouvre `data-nouveautes.js` et ajoute un bloc **en haut** de la liste, avec un numéro de version
plus récent. La pastille rouge réapparaît alors sur la cloche jusqu'à ce qu'on l'ouvre.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page unique de l'application |
| `styles.css` | Habillage |
| `app.js` | Données, dates, rappels, alphabet, cloche, navigation |
| `planning.js` | Tout l'écran Planning : grille, récoltes, alertes, gelées |
| `meteo.js` | Les prévisions Open-Meteo et leur traduction en conseils |
| `autonomie.js` | L'écran Autosuffisance : jauges, conversions, surfaces |
| `sauvegarde.js` | Protection des données : rappel d'export, copie de secours, stockage durable |
| `sync.js` | Synchronisation Firebase entre appareils |
| `firebase-config.js` | La configuration Firebase, à remplir une fois (voir `GUIDE-FIREBASE.md`) |
| `firestore.rules` | Règles de sécurité à coller dans la console Firebase |
| `vues.js` | Affichage des écrans et des formulaires |
| `data-legumes.js` · `data-fruits.js` · `data-aromatiques.js` · `data-medicinales.js` | Base de connaissances des plantes, un fichier par catégorie |
| `data-permaculture.js` | Travaux du mois, rotation, préparations, principes |
| `data-besoins.js` | Besoins annuels par adulte, rendements au m², poids moyens |
| `data-nouveautes.js` | Le contenu de la cloche 🔔 |
| `sw.js` · `manifest.webmanifest` | Fonctionnement hors connexion et installation |
| `make_icons.py` | Regénère les icônes (`python make_icons.py`) |
| `serve.py` | Serveur local de développement |

## Pour ajouter une plante

Ouvrir le fichier de la bonne catégorie et copier un bloc existant. Les mois
s'écrivent en chiffres (1 = janvier) :

- `sa` : semis sous abri
- `sp` : semis en pleine terre
- `pl` : plantation ou repiquage
- `re` : récolte

Important : dans `amis` et `ennemis`, écrire le **nom exact** d'une autre plante
de la base (par exemple `"Laitue / Salade"` et non `"Laitue"`), sinon le lien et
les alertes d'association ne fonctionnent pas.

## Avertissement

Les informations médicinales relèvent de l'usage traditionnel et sont données à
titre indicatif. Elles ne remplacent pas l'avis d'un médecin ou d'un pharmacien,
en particulier en cas de traitement en cours, de grossesse ou pour un enfant.
Certaines plantes de la base sont toxiques en usage interne (consoude, tanaisie)
ou interagissent fortement avec des médicaments (millepertuis) : les
avertissements figurent sur chaque fiche.

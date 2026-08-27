# Mon Potager en permaculture

Application de gestion du potager : planning de plantation personnalisable, calendrier de semis, fiches
détaillées des légumes, aromatiques et plantes médicinales, associations de
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

## Les 7 écrans

| Écran | À quoi il sert |
|---|---|
| **Accueil** | Ce qu'il y a à semer, planter et récolter ce mois-ci, les rappels en retard et les travaux de permaculture du mois. |
| **Planning** | **Ton** calendrier de plantation de l'année : tu choisis tes plantes, tu ajustes les mois, tu suis tes récoltes. |
| **Calendrier** | Le calendrier de référence : les 12 mois de toutes les plantes de la bibliothèque, sans rien de personnel. |
| **Plantes** | 91 fiches détaillées : culture, associations, rotation, conseils permaculture, propriétés médicinales. |
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
- **Météo & gelées** : tes deux dates de gelées, ton décalage de saison et ton journal
  d'observations de l'année.

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

## Ce que fait l'appli toute seule

- **Rappel de repiquage** : 5 semaines après un semis sous abri.
- **Récolte estimée** : à partir de la durée de culture de la plante.
- **Alerte d'association** : si deux plantes qui ne s'entendent pas sont dans la même zone.
- **Alerte de rotation** : si une plante de la même famille botanique a occupé la zone dans les 3 dernières années.
- **Suggestions du mois** : pour les plantes marquées d'une ⭐ (bouton « Suivre » sur la fiche).
- **Alertes du planning** : gel, associations, rotation et mois surchargés (voir plus haut).
- **Notifications** : à activer depuis l'écran Rappels. Elles se déclenchent à l'ouverture de l'appli, une fois par jour maximum.

## Où sont mes données ?

Uniquement dans le navigateur de cet appareil (`localStorage`). Rien n'est envoyé
sur internet, il n'y a pas de compte à créer.

Conséquence : les données ne sont **pas** partagées entre le PC et le téléphone,
et vider les données du navigateur les efface. L'écran **Rappels** propose un
bouton **Exporter** (fichier `.json` à conserver) et **Importer** pour restaurer.

## Mettre l'application en ligne (GitHub Pages)

Comme pour *Tribu* et *reventes* :

1. Créer un dépôt sur le compte GitHub personnel, par exemple `potager`.
   Il peut être **public** sans souci : il n'y a aucune clé ni aucun mot de passe
   dans ces fichiers (pas de Firebase ici).
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

- **46 légumes et petits fruits** (dont capucine et œillet d'Inde, les fleurs compagnes)
- **20 aromatiques**
- **25 plantes médicinales**
- **72 mois de travaux** répartis sur l'année
- **6 recettes** de purins et décoctions maison

## Annoncer une nouveauté dans la cloche

Ouvre `data-nouveautes.js` et ajoute un bloc **en haut** de la liste, avec un numéro de version
plus récent. La pastille rouge réapparaît alors sur la cloche jusqu'à ce qu'on l'ouvre.

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Page unique de l'application |
| `styles.css` | Habillage |
| `app.js` | Données, dates, rappels, alphabet, cloche, navigation |
| `planning.js` | Tout l'écran Planning : grille, récoltes, alertes, météo |
| `vues.js` | Affichage des écrans et des formulaires |
| `data-legumes.js` · `data-aromatiques.js` · `data-medicinales.js` | Base de connaissances des plantes |
| `data-permaculture.js` | Travaux du mois, rotation, préparations, principes |
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

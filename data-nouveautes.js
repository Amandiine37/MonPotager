/* Journal des nouveautés affiché dans la cloche 🔔
   La plus récente en premier. Pour annoncer une nouveauté, ajoute un bloc en haut :
   la pastille rouge réapparaîtra automatiquement sur la cloche. */

const NOUVEAUTES = [

{ version: "2.0", date: "2026-08-27", titre: "Le plan de ton potager",
  points: [
    { emoji: "📐", texte: "<strong>Dessine ta parcelle</strong> dans l'onglet Potager : tu donnes les dimensions, et tu peux <strong>découper</strong> les cases inutiles pour obtenir une forme en L, contourner une allée ou un cabanon. Plusieurs plans possibles." },
    { emoji: "🎨", texte: "<strong>Place tes plantes au doigt</strong> : la palette reprend celles de ton planning, de tes cultures et de tes favorites. Chaque plante a sa couleur." },
    { emoji: "✨", texte: "<strong>« Où planter ? »</strong> surligne en orange les meilleurs emplacements pour la plante choisie — près de ses amies, loin de ses ennemies." },
    { emoji: "⚠️", texte: "<strong>Les mauvais voisinages s'entourent de rouge</strong> pendant que tu dessines, avec la liste des paires à séparer. Et l'appli te dit ce qui manque à ton plan." },
    { emoji: "📊", texte: "<strong>Les surfaces sont calculées</strong> : « 2,25 m² de tomates ≈ 9 plants », d'après l'espacement de chaque fiche." }
  ] },

{ version: "1.9", date: "2026-08-27", titre: "Les fruits arrivent en nombre",
  points: [
    { emoji: "🍓", texte: "<strong>Nouvelle catégorie Fruits</strong> dans l'écran Plantes et dans le planning : les fraises ne sont plus rangées avec les carottes, et le framboisier n'est plus classé en médicinale." },
    { emoji: "🫐", texte: "<strong>20 fiches de fruits</strong> : petits fruits (groseillier, cassissier, mûrier, myrtillier, vigne, kiwaï, noisetier) et fruitiers (pommier, poirier, prunier, cerisier, pêcher, figuier)." },
    { emoji: "🌳", texte: "<strong>Un bloc spécial arbres</strong> sur ces fiches : pollinisation (faut-il deux variétés ?), taille, forme conseillée et nombre d'années avant la première récolte." },
    { emoji: "📏", texte: "<strong>L'autosuffisance compte en pieds</strong> pour les arbres : « il manque 40 kg de pommes — soit environ 1 pied de plus », et non plus en mètres carrés." }
  ] },

{ version: "1.6", date: "2026-08-27", titre: "Un potager sur tous tes appareils",
  points: [
    { emoji: "☁️", texte: "<strong>Synchronisation entre appareils</strong> : ton potager se retrouve à l'identique sur ton téléphone et ton ordinateur, et se sauvegarde en ligne tout seul à chaque modification." },
    { emoji: "📱", texte: "<strong>Appairage sécurisé</strong> : un code à usage unique, valable 24 h, à saisir sur le second appareil. Connaître le code de ton potager ne suffit pas à le lire." },
    { emoji: "🔌", texte: "<strong>Ça marche toujours hors connexion</strong> : tu jardines sans réseau, tout part en ligne au retour. Et la synchronisation reste facultative — sans elle, l'appli fonctionne comme avant." },
    { emoji: "⚙️", texte: "À activer dans <strong>Rappels → Synchronisation</strong>, après avoir suivi une fois le guide Firebase fourni avec l'appli." }
  ] },

{ version: "1.5", date: "2026-08-27", titre: "Ne plus perdre son potager",
  points: [
    { emoji: "💾", texte: "<strong>Rappel de sauvegarde</strong> : si plus de 14 jours passent sans export, l'appli te le signale sur l'accueil. Tes données ne vivent que dans ce navigateur — personne ne peut les récupérer à ta place." },
    { emoji: "🔒", texte: "<strong>Stockage durable</strong> : l'appli demande au navigateur de ne jamais effacer tes données pour faire de la place." },
    { emoji: "↩️", texte: "<strong>Copie de secours interne</strong>, refaite tous les 3 jours : elle te rattrape si tu supprimes une zone ou une culture par erreur." },
    { emoji: "📖", texte: "<strong>Tout est expliqué</strong> dans l'onglet Rappels : où sont tes données, ce qui peut les effacer, et comment t'en protéger. À lire une fois, surtout sur iPhone." }
  ] },

{ version: "1.4", date: "2026-08-27", titre: "La météo à portée de pouce",
  points: [
    { emoji: "🌦️", texte: "<strong>Une icône météo en haut de l'écran</strong>, à côté de cette cloche. Éteinte tant que tu n'as pas activé les prévisions ; une fois allumée, elle affiche le temps et la température du jour." },
    { emoji: "🔴", texte: "<strong>Un point rouge apparaît</strong> quand quelque chose mérite ton attention : gelée annoncée, canicule, vent fort. Un appui ouvre les 7 jours et les conseils du jardinier." },
    { emoji: "♻️", texte: "<strong>Fini les versions fantômes</strong> : quand une mise à jour de l'appli est prête, un bandeau te propose de recharger. Avant, l'ancienne version continuait de tourner et les nouveautés semblaient ne pas marcher." }
  ] },

{ version: "1.3", date: "2026-08-27", titre: "Où en est mon autosuffisance ?",
  points: [
    { emoji: "⚖️", texte: "<strong>Nouvel onglet Autonomie</strong> dans le menu du bas : indique combien de personnes vivent au foyer, et tes récoltes se transforment en jauges qui se remplissent." },
    { emoji: "🥕", texte: "<strong>Légume par légume</strong> : combien tu as récolté, combien il faudrait, et combien de mètres carrés en plus il te manque pour y arriver." },
    { emoji: "🏆", texte: "<strong>Deux repères</strong> : ton autonomie sur ce que tu cultives déjà, et ton autonomie sur une alimentation complète en légumes. Le résumé apparaît aussi sur l'accueil." }
  ] },

{ version: "1.2", date: "2026-08-27", titre: "Les prévisions météo, en option",
  points: [
    { emoji: "🌦️", texte: "<strong>Prévisions à 7 jours</strong> dans Planning → Météo : températures, pluie, vent et surtout <strong>température du sol</strong>, la donnée qui dit vraiment si tu peux semer." },
    { emoji: "👩‍🌾", texte: "<strong>Traduites en conseils de jardinage</strong> : faut-il arroser, une gelée arrive-t-elle, le sol est-il assez chaud pour les haricots. Les alertes importantes remontent aussi sur l'accueil." },
    { emoji: "🔒", texte: "<strong>Option, désactivée par défaut.</strong> C'est la seule partie de l'appli qui utilise internet : elle interroge Open-Meteo avec les coordonnées de la commune que tu choisis, et rien d'autre. Sans connexion, tout le reste fonctionne comme avant." }
  ] },

{ version: "1.1", date: "2026-08-27", titre: "Le planning de plantation arrive",
  points: [
    { emoji: "📋", texte: "<strong>Nouvel onglet Planning</strong> : construis ton propre calendrier de l'année. Tu choisis tes plantes dans la bibliothèque, et tu ajustes librement les mois de semis, de plantation et de récolte." },
    { emoji: "🧺", texte: "<strong>Suivi des récoltes</strong> : note ce que tu ramasses au fur et à mesure (en kg, en pièces, en bottes…). L'appli fait les totaux de l'année." },
    { emoji: "🌡️", texte: "<strong>Météo et gelées</strong> : renseigne tes dates de gelées et note tes observations de l'année. L'appli te signale les plantations trop risquées et te propose de décaler ton planning." },
    { emoji: "🔤", texte: "<strong>Filtre alphabétique</strong> sur l'écran Plantes : une lettre, et tu ne vois plus que les plantes qui commencent par elle." },
    { emoji: "🔔", texte: "<strong>Cette cloche</strong> : elle t'annonce chaque nouveauté ajoutée à l'application." }
  ] },

{ version: "1.0", date: "2026-08-24", titre: "Première version",
  points: [
    { emoji: "🌱", texte: "91 fiches de plantes : 46 légumes, 20 aromatiques et 25 médicinales, avec culture, associations et propriétés." },
    { emoji: "📅", texte: "Calendrier annuel de référence des semis, plantations et récoltes." },
    { emoji: "🧑‍🌾", texte: "Gestion des zones du potager, avec alertes d'association et de rotation des cultures." },
    { emoji: "🌍", texte: "Fiches permaculture : principes, travaux du mois, rotation sur 4 ans et recettes de purins." }
  ] }

];

const VERSION_ACTUELLE = NOUVEAUTES[0].version;

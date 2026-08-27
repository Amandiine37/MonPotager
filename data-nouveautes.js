/* Journal des nouveautés affiché dans la cloche 🔔
   La plus récente en premier. Pour annoncer une nouveauté, ajoute un bloc en haut :
   la pastille rouge réapparaîtra automatiquement sur la cloche. */

const NOUVEAUTES = [

{ version: "1.4", date: "2026-08-27", titre: "La météo à portée de pouce",
  points: [
    { emoji: "🌦️", texte: "<strong>Une icône météo en haut de l'écran</strong>, à côté de cette cloche. Éteinte tant que tu n'as pas activé les prévisions ; une fois allumée, elle affiche le temps et la température du jour." },
    { emoji: "🔴", texte: "<strong>Un point rouge apparaît</strong> quand quelque chose mérite ton attention : gelée annoncée, canicule, vent fort. Un appui ouvre les 7 jours et les conseils du jardinier." }
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

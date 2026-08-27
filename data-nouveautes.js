/* Journal des nouveautés affiché dans la cloche 🔔
   La plus récente en premier. Pour annoncer une nouveauté, ajoute un bloc en haut :
   la pastille rouge réapparaîtra automatiquement sur la cloche. */

const NOUVEAUTES = [

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

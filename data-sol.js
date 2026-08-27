/* Préparation et entretien du sol — le socle de tout le reste.
   Un potager, c'est d'abord une terre : on la connaît, on la couvre, on la nourrit. */

/* Reconnaître son sol, sans laboratoire */
const TESTS_SOL = [
  { titre: "Le test du boudin", duree: "2 minutes", emoji: "🤏",
    comment: "Prends une poignée de terre humide (pas détrempée) et roule-la entre tes paumes pour en faire un boudin de la taille d'un crayon.",
    lecture: [
      "Impossible, ça s'effrite → sol <strong>sableux</strong>",
      "Le boudin tient mais casse si on le courbe → sol <strong>limoneux</strong>, l'équilibre idéal",
      "Le boudin se courbe en anneau sans casser → sol <strong>argileux</strong>"
    ] },
  { titre: "Le test du bocal", duree: "24 heures", emoji: "🫙",
    comment: "Remplis un bocal au tiers de terre, complète d'eau, secoue fort, laisse reposer une journée. Les couches se déposent par densité.",
    lecture: [
      "En bas le <strong>sable</strong>, au milieu le <strong>limon</strong>, en haut l'<strong>argile</strong>",
      "Ce qui flotte, c'est la <strong>matière organique</strong> : plus il y en a, mieux c'est",
      "Mesure la hauteur de chaque couche : tu as la composition exacte de ta terre"
    ] },
  { titre: "Le test du vinaigre", duree: "1 minute", emoji: "🧪",
    comment: "Verse un peu de vinaigre blanc sur une poignée de terre sèche.",
    lecture: [
      "Ça mousse et pétille → sol <strong>calcaire</strong> (pH élevé) : oublie les myrtilles, les terres de bruyère",
      "Aucune réaction → sol <strong>neutre ou acide</strong>, la grande majorité des potagers"
    ] },
  { titre: "Lire les herbes qui poussent", duree: "en se promenant", emoji: "🌿",
    comment: "Les plantes spontanées disent la vérité sur un sol, gratuitement et toute l'année.",
    lecture: [
      "Ortie, gaillet, chénopode → sol <strong>riche en azote</strong>, parfait pour le potager",
      "Prêle, renoncule, jonc → sol <strong>humide, tassé, mal drainé</strong>",
      "Coquelicot, moutarde → sol <strong>calcaire</strong>",
      "Oseille sauvage, fougère, bruyère → sol <strong>acide</strong>",
      "Chardon, liseron, plantain → sol <strong>compacté</strong>, qui manque d'air"
    ] }
];

/* Corriger ce qu'on a, plutôt que rêver d'autre chose */
const TYPES_SOL = [
  { type: "Sol argileux", emoji: "🧱", couleur: "argile",
    reconnait: "Colle aux bottes, dur comme la pierre en été, se craquelle. Retient l'eau et les éléments nutritifs.",
    atouts: "Très fertile, ne se dessèche pas vite, garde les engrais.",
    defauts: "Se réchauffe tard au printemps, asphyxie les racines quand il est détrempé, impossible à travailler au mauvais moment.",
    faire: [
      "Ne JAMAIS marcher ni travailler dessus quand il est mouillé : on le tasse pour des années",
      "Apporter du compost mûr et du sable grossier, en surface, chaque automne",
      "Cultiver sur buttes ou planches surélevées pour le drainage",
      "Semer des engrais verts à racines pivotantes : moutarde, phacélie, féverole",
      "Paillage permanent : il empêche la croûte de se former"
    ] },
  { type: "Sol sableux", emoji: "🏖️", couleur: "sable",
    reconnait: "Coule entre les doigts, l'eau s'infiltre aussitôt, se réchauffe très vite.",
    atouts: "Facile à travailler toute l'année, précoce au printemps, jamais d'asphyxie.",
    defauts: "Ne retient ni l'eau ni les nutriments : tout est lessivé aux premières pluies.",
    faire: [
      "Compost, compost, compost : c'est le seul moyen de lui donner de la mémoire",
      "Paillage épais et permanent, sinon il sèche en deux jours",
      "Arroser peu mais souvent, l'inverse d'un sol argileux",
      "Apporter de l'argile si tu peux en trouver (bentonite), ou du BRF",
      "Ne jamais le laisser nu : engrais vert dès qu'une planche se libère"
    ] },
  { type: "Sol limoneux", emoji: "🌾", couleur: "limon",
    reconnait: "Doux et poudreux au toucher, ni collant ni granuleux. C'est le sol de rêve.",
    atouts: "Équilibré, fertile, facile à travailler, retient l'eau sans excès.",
    defauts: "Se tasse et forme une croûte de battance sous la pluie, s'érode facilement.",
    faire: [
      "Le couvrir en permanence : c'est sa seule vraie faiblesse",
      "Ne pas le travailler finement, la croûte se forme d'autant plus vite",
      "Compost régulier pour maintenir la structure",
      "Éviter le passage répété au même endroit : trace des allées définitives"
    ] },
  { type: "Sol calcaire", emoji: "🪨", couleur: "calcaire",
    reconnait: "Clair, caillouteux, sec. Le vinaigre mousse dessus. Les feuilles jaunissent entre les nervures (chlorose).",
    atouts: "Bien drainé, se réchauffe vite, idéal pour les aromatiques méditerranéennes.",
    defauts: "Bloque l'absorption du fer, sèche vite, pH trop élevé pour beaucoup de plantes.",
    faire: [
      "Renoncer aux plantes de terre acide : myrtille, rhododendron. Elles y mourront.",
      "Compost et fumier bien décomposés en grande quantité",
      "Paillage d'aiguilles de pin ou d'écorces, qui acidifient lentement",
      "Arroser à l'eau de pluie, pas au robinet",
      "Miser sur ce qui adore ça : thym, romarin, lavande, sauge, figuier, vigne"
    ] }
];

/* Les gestes qui construisent un sol, dans l'ordre où on les apprend */
const GESTES_SOL = [
  { titre: "Ne plus retourner la terre", emoji: "🚫", niveau: "Le geste fondateur",
    texte: "Bêcher ou labourer retourne des couches vivantes qui ne devraient jamais se croiser : les organismes de surface, qui ont besoin d'air, se retrouvent étouffés en profondeur, et inversement. Il faut des années pour reconstituer cette vie.",
    pratique: "À la place : une <strong>grelinette</strong>, qui décompacte sans retourner. On l'enfonce, on bascule le manche vers soi, on recule. Deux passages par an suffisent, et encore." },
  { titre: "Ne jamais laisser le sol nu", emoji: "🍂", niveau: "Le geste fondateur",
    texte: "Un sol nu se tasse sous la pluie, cuit au soleil, perd son humidité et ses nutriments, et se couvre d'herbes indésirables. Dans la nature, la terre nue n'existe pas : c'est une blessure que le vivant s'empresse de refermer.",
    pratique: "Paille, foin, tontes séchées, feuilles mortes, BRF, carton brun. <strong>5 à 10 cm</strong> d'épaisseur. Le paillage divise par deux ou trois les besoins d'arrosage et supprime l'essentiel du désherbage." },
  { titre: "Nourrir le sol, pas la plante", emoji: "🪱", niveau: "Le changement de regard",
    texte: "En agriculture conventionnelle, on nourrit la plante avec des engrais solubles. En permaculture, on nourrit le sol : les vers de terre, les champignons et les bactéries transforment la matière organique et la mettent à disposition des racines, au bon rythme.",
    pratique: "Compost mûr en surface (2 à 3 cm par an), paillages qui se décomposent, purins dilués. Jamais d'engrais soluble, qui court-circuite et appauvrit la vie du sol." },
  { titre: "Le compost", emoji: "♻️", niveau: "L'outil de base",
    texte: "Le compost transforme les déchets de cuisine et de jardin en la meilleure nourriture possible pour la terre. Bien conduit, il ne sent rien et ne demande presque rien.",
    pratique: "Alterner <strong>matières vertes</strong> (épluchures, tontes, mauvaises herbes) et <strong>matières brunes</strong> (feuilles mortes, carton, broyat) — environ deux tiers de brun. Retourner deux fois. Prêt en 6 à 12 mois quand il sent le sous-bois." },
  { titre: "Les engrais verts", emoji: "🌾", niveau: "L'outil de base",
    texte: "Semer une plante non pour la manger, mais pour le sol. Elle le couvre, ses racines le décompactent, et couchée sur place elle le nourrit.",
    pratique: "<strong>Phacélie</strong> (partout, très mellifère), <strong>moutarde</strong> (rapide, mais pas avant des choux), <strong>féverole et vesce</strong> (fixent l'azote), <strong>seigle</strong> (hiver, racines puissantes). Semer dès qu'une planche se libère, faucher avant montée en graine et laisser sur place." },
  { titre: "Le BRF et les buttes", emoji: "🪵", niveau: "Pour aller plus loin",
    texte: "Le bois raméal fragmenté — broyat de jeunes branches — imite le sol forestier et nourrit les champignons qui structurent la terre. Les buttes de bois enterré (culture en lasagnes, hügelkultur) créent une réserve d'eau et de fertilité pour des années.",
    pratique: "BRF en couche de 3 à 5 cm en surface, <strong>jamais enfoui</strong> (il provoquerait une faim d'azote). Compter une saison avant que ça profite aux cultures : à poser en automne." },
  { titre: "Le faux-semis", emoji: "🌱", niveau: "L'astuce qui change tout",
    texte: "Préparer la planche deux à trois semaines avant de semer, arroser, laisser lever toutes les graines d'adventices présentes… puis les supprimer d'un coup de binette superficielle avant de semer pour de vrai.",
    pratique: "Le semis se retrouve alors presque seul, avec des semaines d'avance sur les herbes. C'est l'astuce la plus rentable du potager, surtout pour les carottes." },
  { titre: "Le pH, sans se compliquer", emoji: "⚗️", niveau: "Pour aller plus loin",
    texte: "La plupart des légumes se plaisent entre 6 et 7. En dessous de 5,5, l'acidité bloque l'assimilation ; au-dessus de 7,5, c'est le fer qui devient indisponible.",
    pratique: "Un testeur de jardinerie à quelques euros suffit. Sol trop acide : cendres de bois tamisées (avec parcimonie) ou chaux. Sol trop calcaire : compost, terreau de feuilles, paillages acidifiants. Dans les deux cas, la correction prend des années — mieux vaut choisir des plantes adaptées." }
];

/* Le calendrier du sol : quand faire quoi */
const CALENDRIER_SOL = {
  "Automne (octobre-novembre)": [
    "C'est LE moment clé : tout ce que tu poses maintenant sera intégré au printemps",
    "Compost mûr en surface, sans l'enfouir",
    "Semer les engrais verts d'hiver : seigle, vesce, féverole",
    "Ramasser les feuilles mortes et en couvrir les planches vides",
    "Poser le BRF, qui aura tout l'hiver pour commencer à se décomposer"
  ],
  "Hiver (décembre-février)": [
    "Ne rien faire, surtout pas marcher sur une terre gorgée d'eau",
    "Laisser les couvertures travailler",
    "Préparer le plan de l'année et commander les graines",
    "Faire analyser ou tester son sol si on ne le connaît pas encore"
  ],
  "Printemps (mars-avril)": [
    "Passer la grelinette quand la terre s'émiette sans coller",
    "Coucher ou faucher les engrais verts 2 à 3 semaines avant de semer",
    "Écarter le paillage sur les zones à semer, pour que le sol se réchauffe",
    "Faux-semis sur les planches destinées aux carottes et aux légumes lents"
  ],
  "Été (mai-septembre)": [
    "Repailler dès qu'une planche se dénude",
    "Ne jamais laisser une planche vide plus de trois semaines : engrais vert ou paillage",
    "Purins d'ortie puis de consoude, dilués, pour accompagner la production",
    "Arroser en profondeur et espacé, jamais un peu tous les jours"
  ]
};

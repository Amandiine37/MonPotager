/* Engrais verts — les plantes qu'on sème pour le sol, pas pour l'assiette.
   Elles le couvrent, le décompactent, le nourrissent, et nourrissent les abeilles
   au passage. Dans le plan du potager, elles comptent comme un repos de la terre.

   Règle générale : semer dès qu'une planche se libère, faucher AVANT la montée
   en graine, et laisser sur place en paillage. Jamais enfouir profondément. */

const ENGRAIS_VERTS = [

{ id:"phacelie", nom:"Phacélie", latin:"Phacelia tanacetifolia", cat:"engrais", fam:"Boraginacées", viv:false,
  sa:[], sp:[3,4,5,6,7,8,9], pl:[], re:[5,6,7,8,9,10],
  expo:"Soleil ou mi-ombre", sol:"Tous types", eau:"Aucun",
  esp:"À la volée, 1 g/m²", prof:"1 cm (recouvrir, la graine déteste la lumière)", lev:"8 à 12 jours", cyc:"2 à 3 mois",
  amis:["Toutes les cultures"],
  ennemis:[],
  perma:"L'engrais vert universel : aucune famille botanique commune avec les légumes du potager, donc il s'intercale n'importe où dans la rotation sans jamais poser de problème. Racines fines qui structurent la surface, biomasse abondante, et une floraison bleue qui attire abeilles et syrphes comme un aimant.",
  conseils:"Faucher à la floraison, avant que les graines ne se forment — sinon elle se ressème partout. Gélive : un semis d'août-septembre meurt seul en hiver et fait un paillage tout prêt.",
  engrais:{ role:"Structure le sol, couvre vite, très mellifère", duree:"2 à 3 mois", gel:"Détruite par le gel", azote:false } },

{ id:"moutarde-blanche", nom:"Moutarde blanche", latin:"Sinapis alba", cat:"engrais", fam:"Brassicacées", viv:false,
  sa:[], sp:[3,4,5,6,7,8,9], pl:[], re:[5,6,7,8,9,10],
  expo:"Soleil", sol:"Tous types, même pauvre", eau:"Aucun",
  esp:"À la volée, 2 g/m²", prof:"1 cm", lev:"4 à 6 jours", cyc:"6 à 8 semaines",
  amis:["Pomme de terre"],
  ennemis:["Chou pommé","Chou-fleur","Brocoli","Chou kale","Radis","Navet","Roquette"],
  perma:"La plus rapide de toutes : couverte en un mois. Ses racines libèrent des composés soufrés qui assainissent le sol, notamment contre les nématodes de la pomme de terre. ATTENTION : c'est une Brassicacée, donc jamais avant ou après des choux, des radis ou des navets — ce serait faire l'inverse d'une rotation.",
  conseils:"Faucher dès l'apparition des fleurs jaunes. Gélive, elle se couche seule en décembre.",
  engrais:{ role:"Couverture éclair, assainit le sol", duree:"6 à 8 semaines", gel:"Détruite par le gel", azote:false } },

{ id:"seigle", nom:"Seigle fourrager", latin:"Secale cereale", cat:"engrais", fam:"Poacées", viv:false,
  sa:[], sp:[9,10,11], pl:[], re:[3,4,5],
  expo:"Soleil", sol:"Tous types, même pauvre et acide", eau:"Aucun",
  esp:"À la volée, 15 g/m²", prof:"2 cm", lev:"8 à 10 jours", cyc:"6 à 8 mois",
  amis:[],
  ennemis:[],
  perma:"Le champion de l'hiver : il pousse quand tout dort, résiste à -20°C, et son système racinaire descend à plus d'un mètre en fissurant les sols les plus tassés. C'est LA solution pour une parcelle compactée ou une terre lourde.",
  conseils:"Faucher en mars-avril, avant qu'il ne monte à épi, sinon il devient dur à couper et épuise le sol. Laisse 2 à 3 semaines entre le fauchage et le semis suivant : ses racines freinent la germination des petites graines.",
  engrais:{ role:"Décompacte en profondeur, tient tout l'hiver", duree:"6 à 8 mois", gel:"Très résistant", azote:false } },

{ id:"vesce", nom:"Vesce commune", latin:"Vicia sativa", cat:"engrais", fam:"Fabacées", viv:false,
  sa:[], sp:[3,4,8,9,10], pl:[], re:[5,6,7],
  expo:"Soleil", sol:"Tous types", eau:"Aucun",
  esp:"À la volée, 10 g/m²", prof:"2 cm", lev:"8 à 12 jours", cyc:"4 à 6 mois",
  amis:["Seigle fourrager"],
  ennemis:["Haricot nain","Petit pois","Fève"],
  perma:"Légumineuse : elle capte l'azote de l'air et le laisse dans le sol. Un mélange seigle + vesce est le duo classique d'hiver — le seigle porte la vesce et décompacte, la vesce fertilise. Ne pas la faire suivre de pois ou de haricots, ce sont les mêmes maladies.",
  conseils:"Faucher à la floraison, quand la teneur en azote est maximale. Laisser sur place : c'est là que se trouve tout le bénéfice.",
  engrais:{ role:"Apporte de l'azote gratuitement", duree:"4 à 6 mois", gel:"Résiste jusqu'à -10°C", azote:true } },

{ id:"trefle-incarnat", nom:"Trèfle incarnat", latin:"Trifolium incarnatum", cat:"engrais", fam:"Fabacées", viv:false,
  sa:[], sp:[8,9], pl:[], re:[4,5,6],
  expo:"Soleil", sol:"Léger, plutôt drainé", eau:"Aucun",
  esp:"À la volée, 3 g/m²", prof:"1 cm", lev:"8 jours", cyc:"7 à 8 mois",
  amis:["Toutes les cultures"],
  ennemis:["Haricot nain","Petit pois","Fève"],
  perma:"Légumineuse d'hiver aux épis rouge sang au printemps : magnifique, très mellifère, et fixatrice d'azote. Plus lente que la vesce mais elle couvre mieux et étouffe les adventices tout l'hiver.",
  conseils:"Semer tôt, en août ou début septembre : semé trop tard il n'aura pas le temps de s'installer avant le froid. Faucher en pleine floraison.",
  engrais:{ role:"Azote, couverture d'hiver, très mellifère", duree:"7 à 8 mois", gel:"Résistant", azote:true } },

{ id:"sarrasin", nom:"Sarrasin", latin:"Fagopyrum esculentum", cat:"engrais", fam:"Polygonacées", viv:false,
  sa:[], sp:[5,6,7], pl:[], re:[7,8,9],
  expo:"Soleil", sol:"Pauvre, acide, caillouteux — il s'en contente", eau:"Aucun",
  esp:"À la volée, 8 g/m²", prof:"2 cm", lev:"4 à 6 jours", cyc:"2 à 3 mois",
  amis:["Toutes les cultures"],
  ennemis:["Oseille","Rhubarbe"],
  perma:"L'engrais vert d'été, très rapide, qui pousse là où rien ne veut pousser. Sa particularité : il rend le phosphore du sol assimilable par les cultures suivantes. Ses fleurs blanches nourrissent les abeilles en plein creux estival. Se ressème facilement, ce qui est un avantage ou une plaie selon le point de vue.",
  conseils:"Ultra gélif : le premier gel le couche net, on n'a même pas à le faucher. Semer après une récolte de juin-juillet, il occupe la place jusqu'aux semis d'automne.",
  engrais:{ role:"Libère le phosphore, pousse en sol pauvre", duree:"2 à 3 mois", gel:"Détruit au premier gel", azote:false } }

];

/* Itinéraire du carnet (aucun numéro de réservation ici : ils sont dans data/secret.enc).
   Pour changer une étape : modifier ce fichier puis recharger la page.
   onglet : "aller" ou "retour". type : "trajet" (un déplacement) ou "pause" (attente ou changement de gare). */
window.CARNET = {
  titre: "Valmorel",
  sous: "Lille, du 27 décembre au 4 janvier",
  depart: "2026-12-27T21:55:00+01:00",
  fin: "2027-01-04T09:55:00+01:00",

  etapes: [
    {
      id: "s1", onglet: "aller", type: "trajet", quand: "2026-12-27T21:55:00+01:00",
      jour: "Dimanche 27 décembre", mode: "Bus de nuit", marque: "FlixBus N769",
      de: { heure: "21h55", lieu: "Lille", ou: "Boulevard de Turin, 59800 Lille, parking près de la gare Lille Europe", carte: "50.639197,3.076202" },
      a: { heure: "06h50", jour: "lundi 28", lieu: "Lyon", ou: "Gare routière Gerland, 52 avenue Tony Garnier, 69007 Lyon, quai 6 à 11", carte: "Gare routière Gerland, 52 avenue Tony Garnier, 69007 Lyon" },
      duree: "8 h 55",
      boutonCarte: "Où prendre le bus ?",
      savoir: ["Sois à l'arrêt 15 minutes avant le départ.", "Le bus affiche Toulon comme destination : c'est normal, c'est le bon.", "Les places ne sont pas numérotées : on s'assoit où on veut.", "Chacun a droit à 1 sac à main ou à dos (7 kg, 42 × 30 × 18 cm) et 1 bagage en soute (20 kg, 80 × 50 × 30 cm)."]
    },
    {
      id: "c1", onglet: "aller", type: "pause",
      texte: "À Lyon, on va de la gare routière Gerland à la gare Part-Dieu.",
      duree: "Il y a 1 h 18 avant le train.",
      itineraire: { de: "Gare routière Gerland, Lyon", a: "Gare de Lyon Part-Dieu", mode: "transit" }, boutonCarte: "Voir le chemin"
    },
    {
      id: "s3", onglet: "aller", type: "trajet", quand: "2026-12-28T08:08:00+01:00",
      jour: "Lundi 28 décembre", mode: "Trains TER (2 trains)", marque: "TER 17972 puis 883105",
      de: { heure: "08h08", lieu: "Lyon Part-Dieu", ou: "Gare SNCF Lyon Part-Dieu", carte: "Gare de Lyon Part-Dieu" },
      a: { heure: "11h10", lieu: "Moûtiers", ou: "Gare SNCF Moûtiers-Salins-Brides-les-Bains", carte: "Gare de Moûtiers-Salins-Brides-les-Bains" },
      duree: "3 h 02",
      boutonCarte: "Où prendre le train ?",
      jambes: [
        { titre: "Train 1", texte: "08h08 Lyon Part-Dieu, arrivée 09h20 à Aix-les-Bains-Le Revard." },
        { titre: "On change de train", texte: "C'est la même gare : Aix-les-Bains-Le Revard. On a 19 minutes. Le quai n'est pas écrit sur les billets : regarder les écrans de la gare." },
        { titre: "Train 2", texte: "09h39 Aix-les-Bains-Le Revard, arrivée 11h10 à Moûtiers." }
      ],
      savoir: ["Un seul billet pour vous deux (2 adultes), au nom de Sofian. Il compte pour les 2 trains.", "Le billet ne peut être ni échangé, ni remboursé. Il est valable seulement ce jour-là."]
    },
    {
      id: "c3", onglet: "aller", type: "pause",
      texte: "À Moûtiers, on attend le bus pour Valmorel.",
      duree: "Il y a 2 h 20 d'attente.",
      lieu: "Gare routière, Moûtiers", boutonCarte: "Voir la gare routière"
    },
    {
      id: "s5", onglet: "aller", type: "trajet", quand: "2026-12-28T13:30:00+01:00",
      jour: "Lundi 28 décembre", mode: "Bus S62", marque: "Altibus",
      de: { heure: "13h30", lieu: "Moûtiers", ou: "Gare routière de Moûtiers", carte: "Gare routière, Moûtiers" },
      a: { heure: "14h10", lieu: "Valmorel", ou: "Arrêt Valmorel Crève Cœur (Les Avanchers-Valmorel)", carte: "Valmorel Crève Coeur, Les Avanchers-Valmorel" },
      duree: "40 min",
      boutonCarte: "Où prendre le bus ?",
      savoir: ["Sois à l'arrêt 15 minutes avant le départ (le mail d'Altibus le demande, le billet dit 5 minutes).", "Les bagages sont compris dans le prix.", "Le billet est montré au conducteur, sur le téléphone ou imprimé."]
    },

    {
      id: "s6", onglet: "retour", type: "trajet", quand: "2027-01-03T17:00:00+01:00",
      jour: "Dimanche 3 janvier", mode: "Bus S62", marque: "Altibus",
      de: { heure: "17h00", lieu: "Valmorel", ou: "Arrêt Valmorel Crève Cœur (Les Avanchers-Valmorel)", carte: "Valmorel Crève Coeur, Les Avanchers-Valmorel" },
      a: { heure: "17h40", lieu: "Moûtiers", ou: "Gare routière de Moûtiers", carte: "Gare routière, Moûtiers" },
      duree: "40 min",
      boutonCarte: "Où prendre le bus ?",
      savoir: ["Sois à l'arrêt 15 minutes avant le départ.", "En montagne, la météo peut retarder le bus : ne pas partir trop juste."]
    },
    {
      id: "c4", onglet: "retour", type: "pause",
      texte: "À Moûtiers, on attend le bus de nuit.",
      duree: "Il y a 4 h 55 d'attente.",
      lieu: "Gare routière centrale, Moûtiers", boutonCarte: "Voir la gare routière"
    },
    {
      id: "s8", onglet: "retour", type: "trajet", quand: "2027-01-03T22:35:00+01:00",
      jour: "Dimanche 3 janvier", mode: "Bus de nuit", marque: "FlixBus SKI74",
      de: { heure: "22h35", lieu: "Moûtiers", ou: "Gare routière centrale, place de la Gare, 73600 Moûtiers, quai 1, près de la gare SNCF", carte: "45.486556,6.53042" },
      a: { heure: "09h55", jour: "lundi 4", lieu: "Lille", ou: "Boulevard de Turin, 59800 Lille, parking près de la gare Lille Europe", carte: "50.639197,3.076202" },
      duree: "11 h 20",
      boutonCarte: "Où prendre le bus ?",
      savoir: ["Sois à l'arrêt 15 minutes avant le départ.", "Places numérotées : 20C pour Sofian, 20D pour Jules.", "Le bus affiche Bruxelles-Nord comme destination : c'est normal, c'est le bon.", "Chacun a droit à 1 sac à main ou à dos (7 kg) et 1 bagage en soute (20 kg)."]
    }
  ],

  sejour: {
    titre: "À Valmorel",
    texte: "On arrive le lundi 28 décembre à 14h10 et on repart le dimanche 3 janvier à 17h00.",
    manque: ["Où on dort : adresse et heure d'arrivée", "Les forfaits de ski", "La location du matériel"],
    lieu: "Valmorel"
  },

  infos: [
    { titre: "Skis dans le bus de nuit", texte: "Les billets FlixBus ne disent rien sur le matériel de ski. À vérifier auprès de FlixBus avant de partir." },
    { titre: "Louer les skis", texte: "Altibus propose jusqu'à 50 % de réduction chez Skiset, et 5 % de plus pour ses clients.", lien: { texte: "Voir Skiset", url: "https://www.skiset.com/partner/altibus-news" } },
    { titre: "Montagne", texte: "Le bus de montagne peut être en retard à cause de la météo. Mieux vaut ne pas viser le train ou le bus suivant à la minute près." }
  ]
};

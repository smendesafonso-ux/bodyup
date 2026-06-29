// BODYUP — bibliothèque d'exercices maison (sans matériel)

export type Intensity = "doux" | "modéré" | "intense";
export type ExoCategory = "Cardio" | "Renforcement" | "Gainage" | "Souplesse" | "HIIT";

export interface Exercise {
  id: string;
  name: string;
  emoji: string;
  category: ExoCategory;
  intensity: Intensity;
  defaultMin: number;
  kcalPerMin: number;
  muscles: string[];
  desc: string;
  steps: string[];
  tip: string;
}

export const intensityClass: Record<Intensity, string> = { doux: "d1", modéré: "d2", intense: "d3" };

export const exercises: Exercise[] = [
  { id: "marche", name: "Marche sur place", emoji: "🚶", category: "Cardio", intensity: "doux", defaultMin: 10, kcalPerMin: 4, muscles: ["Jambes", "Cardio"],
    desc: "Idéal pour démarrer en douceur ou récupérer.", steps: ["Tiens-toi droit, regard devant.", "Lève les genoux en alternance à un rythme régulier.", "Balance les bras pour accompagner le mouvement."], tip: "Garde un rythme où tu peux encore parler." },
  { id: "jumping-jacks", name: "Jumping jacks", emoji: "🤸", category: "Cardio", intensity: "intense", defaultMin: 5, kcalPerMin: 10, muscles: ["Tout le corps", "Cardio"],
    desc: "Cardio explosif qui réchauffe tout le corps.", steps: ["Pieds joints, bras le long du corps.", "Saute en écartant jambes et bras au-dessus de la tête.", "Reviens en sautant à la position de départ."], tip: "Atterris souplement sur la pointe des pieds." },
  { id: "squats", name: "Squats", emoji: "🦵", category: "Renforcement", intensity: "modéré", defaultMin: 8, kcalPerMin: 8, muscles: ["Cuisses", "Fessiers"],
    desc: "Le roi des exercices pour le bas du corps.", steps: ["Pieds largeur d'épaules, pointes légèrement vers l'extérieur.", "Descends en poussant les fesses vers l'arrière, dos droit.", "Remonte en poussant dans les talons."], tip: "Les genoux ne dépassent pas la pointe des pieds." },
  { id: "fentes", name: "Fentes avant", emoji: "🦿", category: "Renforcement", intensity: "modéré", defaultMin: 8, kcalPerMin: 7, muscles: ["Cuisses", "Fessiers"],
    desc: "Renforce les jambes et l'équilibre.", steps: ["Debout, fais un grand pas en avant.", "Descends jusqu'à ce que le genou arrière frôle le sol.", "Pousse pour revenir et change de jambe."], tip: "Garde le buste bien droit pendant la descente." },
  { id: "pompes", name: "Pompes", emoji: "💪", category: "Renforcement", intensity: "intense", defaultMin: 6, kcalPerMin: 8, muscles: ["Pectoraux", "Triceps", "Épaules"],
    desc: "Le grand classique pour le haut du corps.", steps: ["Mains un peu plus larges que les épaules, corps gainé.", "Descends en pliant les coudes jusqu'à frôler le sol.", "Pousse pour remonter sans creuser le dos."], tip: "Serre les abdos et les fessiers tout du long." },
  { id: "pompes-genoux", name: "Pompes sur genoux", emoji: "🙌", category: "Renforcement", intensity: "modéré", defaultMin: 6, kcalPerMin: 6, muscles: ["Pectoraux", "Triceps"],
    desc: "Version accessible des pompes.", steps: ["Pose les genoux au sol, chevilles croisées.", "Descends la poitrine vers le sol, coudes vers l'arrière.", "Remonte en gardant le dos aligné."], tip: "Une excellente étape avant les pompes complètes." },
  { id: "gainage", name: "Gainage (planche)", emoji: "🧘", category: "Gainage", intensity: "modéré", defaultMin: 5, kcalPerMin: 5, muscles: ["Abdominaux", "Dos"],
    desc: "Renforce la ceinture abdominale en profondeur.", steps: ["Appuie sur les avant-bras et la pointe des pieds.", "Aligne tête, dos et talons sur une ligne droite.", "Tiens la position en respirant calmement."], tip: "Ne laisse pas les hanches s'affaisser." },
  { id: "planche-laterale", name: "Planche latérale", emoji: "📐", category: "Gainage", intensity: "modéré", defaultMin: 6, kcalPerMin: 5, muscles: ["Obliques"],
    desc: "Cible les muscles latéraux du ventre.", steps: ["Sur le côté, en appui sur un avant-bras.", "Soulève le bassin pour aligner le corps.", "Tiens, puis change de côté."], tip: "Garde l'épaule au-dessus du coude." },
  { id: "abdos", name: "Crunchs", emoji: "🔥", category: "Renforcement", intensity: "modéré", defaultMin: 6, kcalPerMin: 6, muscles: ["Abdominaux"],
    desc: "Travail ciblé des abdominaux.", steps: ["Allongé, genoux pliés, mains derrière la tête.", "Décolle les épaules en soufflant.", "Redescends sans poser complètement la tête."], tip: "Ne tire pas sur la nuque avec les mains." },
  { id: "releves-jambes", name: "Relevés de jambes", emoji: "🦵", category: "Renforcement", intensity: "modéré", defaultMin: 6, kcalPerMin: 6, muscles: ["Abdominaux bas"],
    desc: "Cible le bas des abdominaux.", steps: ["Allongé, jambes tendues, mains sous les fessiers.", "Lève les jambes à la verticale, abdos serrés.", "Redescends lentement sans toucher le sol."], tip: "Plus tu descends lentement, plus c'est efficace." },
  { id: "russian-twist", name: "Russian twist", emoji: "🔄", category: "Renforcement", intensity: "modéré", defaultMin: 6, kcalPerMin: 7, muscles: ["Obliques"],
    desc: "Rotation du buste pour les obliques.", steps: ["Assis, buste incliné en arrière, pieds décollés.", "Joins les mains et tourne le buste à droite puis à gauche.", "Garde le dos gainé tout du long."], tip: "Tiens un objet lesté pour intensifier." },
  { id: "mountain-climbers", name: "Mountain climbers", emoji: "⛰️", category: "HIIT", intensity: "intense", defaultMin: 6, kcalPerMin: 11, muscles: ["Tout le corps", "Cardio"],
    desc: "Gainage dynamique très cardio.", steps: ["En position de planche, mains sous les épaules.", "Ramène un genou vers la poitrine puis l'autre, rapidement.", "Garde le bassin bas et stable."], tip: "Plus tu accélères, plus l'effet cardio monte." },
  { id: "burpees", name: "Burpees", emoji: "💥", category: "HIIT", intensity: "intense", defaultMin: 5, kcalPerMin: 13, muscles: ["Tout le corps"],
    desc: "L'exercice complet ultime, brûle un max.", steps: ["Accroupi, pose les mains au sol.", "Lance les pieds en arrière en planche (+ pompe optionnelle).", "Reviens accroupi et saute en l'air bras tendus."], tip: "Ralentis le rythme plutôt que sacrifier la forme." },
  { id: "montees-genoux", name: "Montées de genoux", emoji: "🏃", category: "Cardio", intensity: "intense", defaultMin: 5, kcalPerMin: 9, muscles: ["Cardio", "Jambes"],
    desc: "Course sur place genoux hauts.", steps: ["Cours sur place en montant les genoux à hauteur de hanches.", "Garde le buste droit et les abdos serrés.", "Utilise les bras pour accélérer."], tip: "Vise un rythme rapide mais contrôlé." },
  { id: "talons-fesses", name: "Talons-fesses", emoji: "🦶", category: "Cardio", intensity: "modéré", defaultMin: 5, kcalPerMin: 9, muscles: ["Cardio", "Ischios"],
    desc: "Cardio doux qui échauffe l'arrière des cuisses.", steps: ["Cours sur place en ramenant les talons vers les fessiers.", "Reste sur l'avant des pieds.", "Accompagne avec les bras."], tip: "Parfait en échauffement." },
  { id: "corde", name: "Corde à sauter (sans corde)", emoji: "🪢", category: "Cardio", intensity: "intense", defaultMin: 8, kcalPerMin: 12, muscles: ["Cardio", "Mollets"],
    desc: "Le mouvement de la corde, sans la corde.", steps: ["Petits sauts sur la pointe des pieds.", "Tourne les poignets comme si tu tenais une corde.", "Garde un rythme régulier."], tip: "Reste léger, genoux légèrement fléchis." },
  { id: "chaise-murale", name: "Chaise murale", emoji: "🪑", category: "Gainage", intensity: "modéré", defaultMin: 4, kcalPerMin: 5, muscles: ["Cuisses"],
    desc: "Isométrie qui fait brûler les cuisses.", steps: ["Dos contre un mur, descends comme assis sur une chaise.", "Cuisses parallèles au sol, genoux à 90°.", "Tiens la position en respirant."], tip: "Plus tu tiens, plus ça chauffe — reste gainé." },
  { id: "pont-fessier", name: "Pont fessier", emoji: "🍑", category: "Renforcement", intensity: "doux", defaultMin: 6, kcalPerMin: 5, muscles: ["Fessiers", "Lombaires"],
    desc: "Active les fessiers et soulage le dos.", steps: ["Allongé, genoux pliés, pieds à plat.", "Pousse dans les talons pour lever le bassin.", "Serre les fessiers en haut puis redescends."], tip: "Marque une pause d'une seconde en haut." },
  { id: "superman", name: "Superman", emoji: "🦸", category: "Renforcement", intensity: "doux", defaultMin: 5, kcalPerMin: 4, muscles: ["Dos", "Lombaires"],
    desc: "Renforce le dos en douceur.", steps: ["À plat ventre, bras tendus devant.", "Décolle bras et jambes simultanément.", "Tiens 2 secondes puis relâche."], tip: "Regarde le sol pour protéger la nuque." },
  { id: "dips-chaise", name: "Dips sur chaise", emoji: "🛋️", category: "Renforcement", intensity: "modéré", defaultMin: 6, kcalPerMin: 7, muscles: ["Triceps"],
    desc: "Cible l'arrière des bras avec une chaise.", steps: ["Mains sur le bord d'une chaise, dos face au siège.", "Descends en pliant les coudes vers l'arrière.", "Remonte en poussant dans les paumes."], tip: "Garde les coudes serrés, pas écartés." },
  { id: "hiit-debutant", name: "HIIT débutant", emoji: "⚡", category: "HIIT", intensity: "intense", defaultMin: 15, kcalPerMin: 12, muscles: ["Tout le corps", "Cardio"],
    desc: "Circuit fractionné : 30s d'effort, 30s de repos.", steps: ["Enchaîne jumping jacks, squats, mountain climbers.", "30 secondes d'effort, 30 secondes de récupération.", "Répète le circuit jusqu'à la fin du temps."], tip: "Adapte l'intensité, l'important est de tenir." },
  { id: "cardio-maison", name: "Cardio maison", emoji: "💓", category: "Cardio", intensity: "modéré", defaultMin: 20, kcalPerMin: 9, muscles: ["Cardio"],
    desc: "Séance cardio continue à intensité modérée.", steps: ["Alterne marche rapide, montées de genoux et talons-fesses.", "Garde un rythme soutenu mais régulier.", "Reste en mouvement tout le long."], tip: "Bois une gorgée d'eau toutes les 5 minutes." },
  { id: "yoga", name: "Yoga matinal", emoji: "🧘‍♀️", category: "Souplesse", intensity: "doux", defaultMin: 20, kcalPerMin: 3, muscles: ["Souplesse", "Équilibre"],
    desc: "Réveille le corps en douceur et apaise l'esprit.", steps: ["Enchaîne salutation au soleil, chien tête en bas, posture de l'enfant.", "Respire profondément à chaque mouvement.", "Tiens chaque posture 20 à 30 secondes."], tip: "Ne force jamais : va jusqu'à une tension confortable." },
  { id: "stretching", name: "Stretching complet", emoji: "🤸‍♂️", category: "Souplesse", intensity: "doux", defaultMin: 10, kcalPerMin: 2.5, muscles: ["Souplesse"],
    desc: "Étirements de tout le corps pour récupérer.", steps: ["Étire successivement nuque, épaules, dos, jambes.", "Tiens chaque étirement 20 à 30 secondes.", "Respire lentement, sans à-coups."], tip: "Idéal après une séance ou le soir." },
  { id: "etirements-dos", name: "Étirements du dos", emoji: "🙆", category: "Souplesse", intensity: "doux", defaultMin: 8, kcalPerMin: 2.5, muscles: ["Dos"],
    desc: "Soulage les tensions du dos et de la nuque.", steps: ["Posture du chat-vache à quatre pattes.", "Enroule puis cambre le dos lentement.", "Termine en posture de l'enfant."], tip: "Parfait après une longue journée assise." },
];

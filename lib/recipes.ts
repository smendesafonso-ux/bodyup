// BODYUP — bibliothèque de recettes (FR, avec photos, sans clé API)
// Photos : LoremFlickr (Creative Commons) par mot-clé, stables via ?lock=

export type MealKey = "petit-dej" | "dejeuner" | "diner" | "collation";

export const foodPhoto = (keyword: string, lock: number) =>
  `https://loremflickr.com/640/420/${encodeURIComponent(keyword)}?lock=${lock}`;

const hash = (s: string) => { let n = 0; for (const c of s) n = (n * 31 + c.charCodeAt(0)) % 100000; return n; };
/** Photo pour une recette IA (mot-clé dérivé du nom). */
export const aiPhoto = (name: string) => foodPhoto(`${name.split(/[ ,(]/)[0]},food`, hash(name));

export interface LibRecipe {
  id: string;
  name: string;
  emoji: string;
  photo: string;
  meal: MealKey;
  time: number;
  kcal: number; protein: number; carbs: number; fat: number;
  tag: string;
  ingredients: string[];
  steps: string[];
}

const r = (id: string, name: string, emoji: string, kw: string, lock: number, meal: MealKey, time: number, kcal: number, protein: number, carbs: number, fat: number, tag: string, ingredients: string[], steps: string[]): LibRecipe =>
  ({ id, name, emoji, photo: foodPhoto(kw, lock), meal, time, kcal, protein, carbs, fat, tag, ingredients, steps });

export const recipes: LibRecipe[] = [
  // Petit-déjeuner
  r("porridge", "Porridge avoine & banane", "🥣", "oatmeal,banana", 11, "petit-dej", 8, 320, 10, 55, 6, "Énergie longue durée",
    ["60 g de flocons d'avoine", "200 ml de lait", "1 banane", "1 c. à café de miel", "Quelques amandes"],
    ["Fais chauffer le lait avec l'avoine 4-5 min en remuant.", "Ajoute la banane écrasée.", "Verse dans un bol, ajoute miel et amandes."]),
  r("oeufs-avocat", "Œufs brouillés & avocat", "🍳", "scrambled,eggs", 12, "petit-dej", 10, 350, 18, 8, 27, "Riche en protéines",
    ["3 œufs", "1/2 avocat", "1 tranche de pain complet", "Sel, poivre", "Ciboulette"],
    ["Bats les œufs, cuis-les doucement à la poêle.", "Écrase l'avocat sur le pain grillé.", "Sers les œufs avec l'avocat, assaisonne."]),
  r("pancakes", "Pancakes protéinés", "🥞", "protein,pancakes", 13, "petit-dej", 15, 380, 25, 45, 9, "Post-entraînement",
    ["1 banane", "2 œufs", "40 g de flocons d'avoine", "1 dose de protéine vanille", "1 c. à café de levure"],
    ["Mixe tous les ingrédients.", "Cuis de petites galettes à la poêle 2 min par face.", "Sers avec des fruits rouges."]),
  r("yaourt-bowl", "Bowl yaourt grec & fruits rouges", "🫐", "yogurt,berries", 14, "petit-dej", 5, 280, 20, 30, 8, "Léger",
    ["200 g de yaourt grec", "100 g de fruits rouges", "20 g de granola", "1 c. à café de miel"],
    ["Verse le yaourt dans un bol.", "Ajoute les fruits rouges et le granola.", "Termine avec un filet de miel."]),
  r("toast-saumon", "Toast complet & saumon fumé", "🥪", "smoked,salmon,toast", 15, "petit-dej", 7, 340, 22, 30, 14, "Riche en oméga-3",
    ["2 tranches de pain complet", "80 g de saumon fumé", "2 c. à soupe de fromage frais", "Aneth", "Citron"],
    ["Tartine le pain de fromage frais.", "Dépose le saumon fumé.", "Ajoute aneth, un trait de citron et du poivre."]),

  // Déjeuner
  r("poulet-riz", "Poulet grillé, riz & légumes", "🍗", "grilled,chicken,rice", 21, "dejeuner", 25, 520, 42, 55, 12, "Équilibré",
    ["150 g de blanc de poulet", "70 g de riz (cru)", "150 g de brocoli", "1 c. à soupe d'huile d'olive", "Épices"],
    ["Cuis le riz.", "Grille le poulet assaisonné 6-7 min par face.", "Fais cuire le brocoli à la vapeur.", "Dresse l'ensemble."]),
  r("buddha-quinoa", "Buddha bowl quinoa & pois chiches", "🥗", "buddha,bowl,quinoa", 22, "dejeuner", 20, 480, 18, 60, 18, "Végétarien",
    ["80 g de quinoa (cru)", "150 g de pois chiches", "1/2 avocat", "Carottes râpées", "Sauce tahini"],
    ["Cuis le quinoa.", "Réchauffe les pois chiches avec des épices.", "Assemble le bol avec avocat et carottes.", "Nappe de sauce tahini."]),
  r("wrap-poulet", "Wrap poulet & avocat", "🌯", "chicken,wrap", 23, "dejeuner", 15, 480, 38, 32, 21, "Rapide",
    ["1 tortilla complète", "120 g de poulet", "1/2 avocat", "Salade", "Tomate", "Yaourt + citron"],
    ["Émince et poêle le poulet.", "Garnis la tortilla de salade, tomate, avocat, poulet.", "Ajoute la sauce, roule serré."]),
  r("saumon-roti", "Saumon rôti & légumes verts", "🐟", "roasted,salmon", 24, "dejeuner", 25, 540, 42, 18, 28, "Riche en oméga-3",
    ["180 g de pavé de saumon", "150 g de haricots verts", "100 g d'épinards", "Huile d'olive", "Citron, ail"],
    ["Préchauffe le four à 200°C.", "Enfourne le saumon 12-15 min.", "Fais sauter les légumes à l'ail.", "Sers avec du citron."]),
  r("cesar", "Salade César au poulet", "🥗", "caesar,salad,chicken", 25, "dejeuner", 15, 420, 35, 12, 26, "Riche en protéines",
    ["120 g de poulet grillé", "Laitue romaine", "20 g de parmesan", "Croûtons", "Sauce César légère"],
    ["Grille le poulet et émince-le.", "Mélange la salade avec la sauce.", "Ajoute poulet, parmesan et croûtons."]),
  r("bolo", "Pâtes complètes bolognaise", "🍝", "bolognese,pasta", 26, "dejeuner", 25, 560, 30, 70, 16, "Réconfortant",
    ["80 g de pâtes complètes (cru)", "120 g de bœuf haché 5%", "Sauce tomate", "Oignon, ail", "Herbes"],
    ["Cuis les pâtes al dente.", "Fais revenir oignon, ail puis la viande.", "Ajoute la sauce tomate, mijote 10 min.", "Mélange aux pâtes."]),
  r("curry-pois", "Curry de pois chiches & riz", "🍛", "chickpea,curry", 27, "dejeuner", 20, 510, 18, 72, 16, "Végétarien",
    ["150 g de pois chiches", "70 g de riz (cru)", "200 ml de lait de coco", "Curry, oignon, ail", "Épinards"],
    ["Cuis le riz.", "Fais revenir oignon, ail et curry.", "Ajoute pois chiches et lait de coco, mijote 10 min.", "Incorpore les épinards."]),

  // Dîner
  r("omelette", "Omelette champignons & salade", "🍳", "mushroom,omelette", 31, "diner", 12, 320, 22, 8, 22, "Léger",
    ["3 œufs", "100 g de champignons", "Salade verte", "Herbes", "Huile d'olive"],
    ["Poêle les champignons.", "Verse les œufs battus, cuis l'omelette.", "Sers avec une salade assaisonnée."]),
  r("soupe-lentilles", "Soupe lentilles & légumes", "🥣", "lentil,soup", 32, "diner", 25, 280, 16, 40, 5, "Végétarien",
    ["100 g de lentilles", "Carotte, céleri, oignon", "1 l de bouillon", "Cumin", "Persil"],
    ["Fais revenir les légumes.", "Ajoute lentilles et bouillon.", "Laisse mijoter 20 min.", "Mixe légèrement si tu veux."]),
  r("cabillaud", "Cabillaud & ratatouille", "🐟", "cod,ratatouille", 33, "diner", 30, 380, 38, 20, 14, "Riche en protéines",
    ["180 g de cabillaud", "Courgette, aubergine, poivron", "Sauce tomate", "Ail, herbes de Provence"],
    ["Prépare la ratatouille (légumes + tomate) 20 min.", "Cuis le cabillaud vapeur ou au four 12 min.", "Sers le poisson sur la ratatouille."]),
  r("steak-haricots", "Steak haché & haricots verts", "🥩", "beef,green,beans", 34, "diner", 15, 420, 38, 12, 25, "Riche en fer",
    ["150 g de steak haché 5%", "200 g de haricots verts", "1 c. à soupe d'huile", "Ail, persil"],
    ["Cuis les haricots verts à la vapeur.", "Poêle le steak 3-4 min par face.", "Fais sauter les haricots à l'ail, sers."]),
  r("tofu-wok", "Tofu sauté & légumes wok", "🥦", "tofu,stir,fry", 35, "diner", 20, 360, 22, 28, 18, "Vegan",
    ["150 g de tofu ferme", "Brocoli, poivron, carotte", "Sauce soja", "Gingembre, ail", "Graines de sésame"],
    ["Coupe et dore le tofu.", "Fais sauter les légumes au wok.", "Ajoute tofu, sauce soja, gingembre.", "Parsème de sésame."]),
  r("pizza", "Pizza maison légère", "🍕", "homemade,pizza", 36, "diner", 25, 520, 26, 58, 20, "Plaisir",
    ["1 pâte fine", "Sauce tomate", "125 g de mozzarella", "Jambon ou légumes", "Basilic"],
    ["Étale la sauce sur la pâte.", "Ajoute mozzarella et garniture.", "Enfourne 12 min à 220°C.", "Ajoute le basilic frais."]),
  r("crevettes", "Poêlée crevettes & courgettes", "🦐", "shrimp,zucchini", 37, "diner", 15, 320, 34, 12, 14, "Léger & protéiné",
    ["180 g de crevettes", "2 courgettes", "Ail, persil", "1 c. à soupe d'huile d'olive", "Citron"],
    ["Poêle les courgettes en rondelles.", "Ajoute les crevettes et l'ail 4 min.", "Termine avec persil et citron."]),

  // Collation
  r("skyr", "Skyr, myrtilles & amandes", "🫐", "skyr,blueberries", 41, "collation", 4, 220, 20, 18, 8, "Riche en protéines",
    ["150 g de skyr", "80 g de myrtilles", "15 g d'amandes"],
    ["Verse le skyr dans un bol.", "Ajoute myrtilles et amandes concassées."]),
  r("smoothie", "Smoothie banane & protéine", "🥤", "banana,smoothie", 42, "collation", 5, 250, 22, 32, 4, "Post-entraînement",
    ["1 banane", "200 ml de lait", "1 dose de protéine", "Glaçons"],
    ["Mets tous les ingrédients au blender.", "Mixe 30 secondes.", "Sers bien frais."]),
  r("pomme-pb", "Pomme & beurre de cacahuète", "🍎", "apple,peanut,butter", 43, "collation", 2, 200, 6, 24, 10, "Rapide",
    ["1 pomme", "1 c. à soupe de beurre de cacahuète"],
    ["Coupe la pomme en quartiers.", "Trempe-les dans le beurre de cacahuète."]),
  r("houmous", "Houmous & bâtonnets de légumes", "🥕", "hummus,vegetables", 44, "collation", 5, 180, 7, 20, 8, "Végétarien",
    ["80 g de houmous", "Carotte, concombre, poivron"],
    ["Coupe les légumes en bâtonnets.", "Sers avec le houmous."]),
  r("barre", "Barre énergie maison", "🍫", "energy,bar,oats", 45, "collation", 10, 230, 8, 30, 9, "Avant le sport",
    ["50 g de flocons d'avoine", "1 c. à soupe de miel", "1 c. à soupe de beurre de cacahuète", "20 g de chocolat noir"],
    ["Mélange avoine, miel et beurre de cacahuète.", "Tasse dans un moule, ajoute le chocolat fondu.", "Réfrigère 1 h, coupe en barres."]),
];

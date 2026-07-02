// ============================================================
// Base d'aliments FR embarquée dans l'app (valeurs CIQUAL / USDA).
// Recherche instantanée, hors-ligne, insensible aux accents et à la casse.
// Aliments : valeurs pour 100 g · Boissons : valeurs pour 100 ml.
// ============================================================

export interface LocalFood {
  name: string;
  cat: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  unit?: "ml"; // absent = grammes
}

/** Normalise pour la recherche : minuscules, sans accents, œ→oe, apostrophes unifiées. */
export const normText = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[’ʼ]/g, "'");

const F = (name: string, cat: string, kcal: number, p: number, c: number, f: number): LocalFood => ({ name, cat, kcal, p, c, f });
const B = (name: string, kcal: number, p: number, c: number, f: number): LocalFood => ({ name, cat: "Boissons", kcal, p, c, f, unit: "ml" });

export const LOCAL_FOODS: LocalFood[] = [
  // ---- Fruits ----
  F("Pomme", "Fruits", 52, 0.3, 14, 0.2), F("Banane", "Fruits", 89, 1.1, 23, 0.3), F("Orange", "Fruits", 47, 0.9, 12, 0.1),
  F("Fraise", "Fruits", 33, 0.7, 8, 0.3), F("Raisin", "Fruits", 69, 0.7, 18, 0.2), F("Poire", "Fruits", 57, 0.4, 15, 0.1),
  F("Pêche", "Fruits", 39, 0.9, 10, 0.3), F("Ananas", "Fruits", 50, 0.5, 13, 0.1), F("Mangue", "Fruits", 60, 0.8, 15, 0.4),
  F("Kiwi", "Fruits", 61, 1.1, 15, 0.5), F("Myrtille", "Fruits", 57, 0.7, 14, 0.3), F("Framboise", "Fruits", 52, 1.2, 12, 0.7),
  F("Pastèque", "Fruits", 30, 0.6, 8, 0.2), F("Melon", "Fruits", 34, 0.8, 8, 0.2), F("Citron", "Fruits", 29, 1.1, 9, 0.3),
  F("Avocat", "Fruits", 160, 2, 9, 15), F("Clémentine", "Fruits", 47, 0.9, 12, 0.2), F("Abricot", "Fruits", 48, 1.4, 11, 0.4),
  F("Cerise", "Fruits", 63, 1, 16, 0.2), F("Prune", "Fruits", 46, 0.7, 11, 0.3), F("Datte", "Fruits", 282, 2.5, 75, 0.4),
  F("Figue", "Fruits", 74, 0.8, 19, 0.3), F("Grenade", "Fruits", 83, 1.7, 19, 1.2), F("Litchi", "Fruits", 66, 0.8, 17, 0.4),
  F("Noix de coco (chair)", "Fruits", 354, 3.3, 15, 33), F("Pamplemousse", "Fruits", 42, 0.8, 11, 0.1),
  // ---- Légumes ----
  F("Tomate", "Légumes", 18, 0.9, 3.9, 0.2), F("Carotte", "Légumes", 41, 0.9, 10, 0.2), F("Brocoli", "Légumes", 34, 2.8, 7, 0.4),
  F("Épinard", "Légumes", 23, 2.9, 3.6, 0.4), F("Courgette", "Légumes", 17, 1.2, 3.1, 0.3), F("Poivron", "Légumes", 31, 1, 6, 0.3),
  F("Concombre", "Légumes", 15, 0.7, 3.6, 0.1), F("Laitue", "Légumes", 15, 1.4, 2.9, 0.2), F("Salade verte", "Légumes", 15, 1.4, 2.9, 0.2),
  F("Haricot vert", "Légumes", 31, 1.8, 7, 0.2), F("Champignon de Paris", "Légumes", 22, 3.1, 3.3, 0.3),
  F("Oignon", "Légumes", 40, 1.1, 9, 0.1), F("Aubergine", "Légumes", 25, 1, 6, 0.2), F("Chou-fleur", "Légumes", 25, 1.9, 5, 0.3),
  F("Petit pois", "Légumes", 81, 5, 14, 0.4), F("Pomme de terre (cuite)", "Légumes", 87, 2, 20, 0.1),
  F("Patate douce (cuite)", "Légumes", 90, 2, 21, 0.1), F("Maïs", "Légumes", 86, 3.2, 19, 1.2), F("Betterave", "Légumes", 43, 1.6, 10, 0.2),
  F("Poireau", "Légumes", 31, 1.5, 7, 0.3), F("Courge butternut", "Légumes", 45, 1, 12, 0.1), F("Radis", "Légumes", 16, 0.7, 3.4, 0.1),
  F("Endive", "Légumes", 17, 0.9, 4, 0.1), F("Asperge", "Légumes", 20, 2.2, 3.9, 0.1), F("Artichaut", "Légumes", 47, 3.3, 11, 0.2),
  F("Fenouil", "Légumes", 31, 1.2, 7, 0.2), F("Navet", "Légumes", 28, 0.9, 6, 0.1), F("Potiron", "Légumes", 26, 1, 7, 0.1),
  F("Chou rouge", "Légumes", 31, 1.4, 7, 0.2),
  // ---- Viandes, poissons, œufs ----
  F("Poulet (blanc, cuit)", "Viandes & poissons", 165, 31, 0, 3.6), F("Poulet (cuisse, avec peau)", "Viandes & poissons", 210, 26, 0, 11),
  F("Dinde (escalope, cuite)", "Viandes & poissons", 135, 29, 0, 1), F("Bœuf haché 5% (cuit)", "Viandes & poissons", 170, 26, 0, 7),
  F("Bœuf haché 15% (cuit)", "Viandes & poissons", 250, 24, 0, 17), F("Steak de bœuf (cuit)", "Viandes & poissons", 250, 26, 0, 15),
  F("Porc (filet, cuit)", "Viandes & poissons", 143, 26, 0, 4), F("Jambon blanc", "Viandes & poissons", 110, 18, 1, 4),
  F("Jambon cru", "Viandes & poissons", 240, 26, 0.5, 15), F("Bacon", "Viandes & poissons", 290, 20, 1, 23),
  F("Saumon (cuit)", "Viandes & poissons", 208, 20, 0, 13), F("Saumon fumé", "Viandes & poissons", 215, 23, 0, 13),
  F("Thon au naturel", "Viandes & poissons", 116, 26, 0, 1), F("Thon (frais, cuit)", "Viandes & poissons", 184, 30, 0, 6),
  F("Cabillaud (cuit)", "Viandes & poissons", 105, 23, 0, 1), F("Colin (cuit)", "Viandes & poissons", 100, 22, 0, 1),
  F("Truite (cuite)", "Viandes & poissons", 148, 21, 0, 7), F("Maquereau (cuit)", "Viandes & poissons", 260, 24, 0, 18),
  F("Dorade (cuite)", "Viandes & poissons", 110, 22, 0, 2.5), F("Crevette", "Viandes & poissons", 99, 24, 0.2, 0.3),
  F("Moules (cuites)", "Viandes & poissons", 110, 17, 4, 2.5), F("Calamar", "Viandes & poissons", 92, 16, 3, 1.4),
  F("Surimi", "Viandes & poissons", 96, 8, 13, 1), F("Sardine", "Viandes & poissons", 208, 25, 0, 11),
  F("Lardons", "Viandes & poissons", 280, 15, 1, 24), F("Merguez", "Viandes & poissons", 290, 14, 2, 25),
  F("Saucisse de Toulouse", "Viandes & poissons", 320, 15, 1, 28), F("Chorizo", "Viandes & poissons", 455, 24, 2, 38),
  F("Saucisson sec", "Viandes & poissons", 415, 26, 1, 34), F("Pâté de campagne", "Viandes & poissons", 330, 14, 2, 29),
  F("Foie gras", "Viandes & poissons", 462, 8, 2, 46), F("Boudin noir", "Viandes & poissons", 300, 11, 4, 27),
  F("Agneau (gigot, cuit)", "Viandes & poissons", 230, 26, 0, 14), F("Veau (escalope, cuite)", "Viandes & poissons", 172, 31, 0, 5),
  F("Canard (magret, cuit)", "Viandes & poissons", 190, 24, 0, 10), F("Lapin (cuit)", "Viandes & poissons", 173, 27, 0, 7),
  F("Nuggets de poulet", "Viandes & poissons", 296, 15, 18, 18), F("Cordon bleu", "Viandes & poissons", 252, 16, 15, 14),
  F("Poisson pané", "Viandes & poissons", 220, 13, 18, 11), F("Œuf entier", "Viandes & poissons", 155, 13, 1.1, 11),
  F("Œuf dur", "Viandes & poissons", 155, 13, 1.1, 11), F("Blanc d'œuf", "Viandes & poissons", 52, 11, 0.7, 0.2),
  F("Steak haché de soja", "Viandes & poissons", 150, 17, 6, 6),
  // ---- Produits laitiers ----
  F("Yaourt nature", "Produits laitiers", 61, 3.5, 4.7, 3.3), F("Yaourt grec", "Produits laitiers", 97, 9, 4, 5),
  F("Skyr nature", "Produits laitiers", 63, 11, 4, 0.2), F("Fromage blanc 0%", "Produits laitiers", 47, 8, 4, 0.2),
  F("Fromage blanc 3%", "Produits laitiers", 72, 7, 4, 3), F("Cottage cheese", "Produits laitiers", 98, 11, 3.4, 4.3),
  F("Comté", "Produits laitiers", 410, 27, 0, 33), F("Mozzarella", "Produits laitiers", 280, 22, 2.2, 17),
  F("Emmental", "Produits laitiers", 380, 28, 0, 29), F("Gruyère", "Produits laitiers", 410, 27, 0, 33),
  F("Camembert", "Produits laitiers", 300, 20, 0.5, 24), F("Feta", "Produits laitiers", 264, 14, 4, 21),
  F("Chèvre (bûche)", "Produits laitiers", 290, 20, 2.5, 23), F("Parmesan", "Produits laitiers", 420, 36, 0, 30),
  F("Roquefort", "Produits laitiers", 370, 19, 2, 32), F("Raclette (fromage)", "Produits laitiers", 330, 23, 0.5, 26),
  F("Beurre", "Produits laitiers", 717, 0.9, 0.1, 81), F("Crème fraîche 30%", "Produits laitiers", 290, 2.4, 3, 30),
  F("Crème fraîche légère 15%", "Produits laitiers", 165, 2.6, 4, 15),
  // ---- Féculents & céréales ----
  F("Riz blanc (cuit)", "Féculents & céréales", 130, 2.7, 28, 0.3), F("Riz basmati (cuit)", "Féculents & céréales", 121, 2.5, 25, 0.4),
  F("Riz complet (cuit)", "Féculents & céréales", 111, 2.6, 23, 0.9), F("Pâtes (cuites)", "Féculents & céréales", 131, 5, 25, 1.1),
  F("Pâtes complètes (cuites)", "Féculents & céréales", 124, 5, 26, 0.9), F("Quinoa (cuit)", "Féculents & céréales", 120, 4.4, 21, 1.9),
  F("Semoule (cuite)", "Féculents & céréales", 112, 3.8, 23, 0.2), F("Boulgour (cuit)", "Féculents & céréales", 83, 3, 19, 0.2),
  F("Gnocchi", "Féculents & céréales", 156, 4, 32, 1), F("Nouilles asiatiques (cuites)", "Féculents & céréales", 138, 4.5, 25, 2),
  F("Baguette", "Féculents & céréales", 270, 9, 55, 1.3), F("Pain complet", "Féculents & céréales", 247, 9, 41, 3.5),
  F("Pain de mie", "Féculents & céréales", 280, 8, 49, 4), F("Pain aux céréales", "Féculents & céréales", 260, 10, 43, 4.5),
  F("Pain pita", "Féculents & céréales", 260, 9, 52, 1.5), F("Tortilla / wrap (galette)", "Féculents & céréales", 306, 8, 50, 8),
  F("Galette de riz", "Féculents & céréales", 387, 8, 82, 3), F("Flocons d'avoine", "Féculents & céréales", 379, 13, 67, 7),
  F("Corn flakes", "Féculents & céréales", 357, 7, 84, 0.9), F("Muesli", "Féculents & céréales", 360, 10, 60, 7),
  F("Biscotte", "Féculents & céréales", 390, 12, 72, 6),
  // ---- Légumineuses ----
  F("Lentilles (cuites)", "Légumineuses", 116, 9, 20, 0.4), F("Pois chiches (cuits)", "Légumineuses", 164, 9, 27, 2.6),
  F("Haricots rouges (cuits)", "Légumineuses", 127, 9, 22, 0.5), F("Haricots blancs (cuits)", "Légumineuses", 139, 9, 25, 0.5),
  F("Tofu", "Légumineuses", 76, 8, 1.9, 4.8), F("Fèves (cuites)", "Légumineuses", 110, 8, 20, 0.4),
  // ---- Oléagineux & graines ----
  F("Amande", "Oléagineux", 579, 21, 22, 50), F("Noix", "Oléagineux", 654, 15, 14, 65), F("Noisette", "Oléagineux", 628, 15, 17, 61),
  F("Cacahuète", "Oléagineux", 567, 26, 16, 49), F("Beurre de cacahuète", "Oléagineux", 588, 25, 20, 50),
  F("Graines de chia", "Oléagineux", 486, 17, 42, 31), F("Pistache", "Oléagineux", 560, 20, 28, 45),
  F("Noix de cajou", "Oléagineux", 553, 18, 30, 44),
  // ---- Matières grasses ----
  F("Huile d'olive", "Matières grasses", 884, 0, 0, 100), F("Huile de tournesol", "Matières grasses", 884, 0, 0, 100),
  F("Margarine", "Matières grasses", 717, 0.2, 0.7, 80),
  // ---- Petit-déjeuner & sucré ----
  F("Confiture", "Sucré", 250, 0.4, 63, 0.1), F("Miel", "Sucré", 304, 0.3, 82, 0), F("Pâte à tartiner chocolat", "Sucré", 539, 6, 57, 31),
  F("Chocolat noir 70%", "Sucré", 598, 8, 46, 43), F("Chocolat au lait", "Sucré", 535, 7.6, 59, 30), F("Sucre", "Sucré", 400, 0, 100, 0),
  F("Croissant", "Sucré", 406, 8, 46, 21), F("Pain au chocolat", "Sucré", 414, 8, 47, 22), F("Brioche", "Sucré", 375, 8, 50, 15),
  F("Cookie", "Sucré", 480, 5, 64, 22), F("Madeleine", "Sucré", 460, 6, 58, 22), F("Compote de pomme", "Sucré", 42, 0.2, 10, 0.1),
  F("Glace vanille", "Sucré", 200, 3.5, 24, 10), F("Sorbet fruits", "Sucré", 130, 0.3, 32, 0.1),
  F("Gaufre", "Sucré", 310, 7, 43, 12), F("Beignet", "Sucré", 400, 6, 45, 21), F("Barre de céréales", "Sucré", 390, 6, 65, 11),
  F("Gâteau au chocolat", "Sucré", 390, 5, 50, 19), F("Tarte aux pommes", "Sucré", 265, 3, 37, 12),
  F("Crème dessert chocolat", "Sucré", 120, 3, 18, 4), F("Mousse au chocolat", "Sucré", 190, 5, 22, 9),
  F("Flan pâtissier", "Sucré", 145, 4, 22, 4.5), F("Petit-beurre", "Sucré", 435, 7, 74, 12),
  F("Yaourt à boire", "Sucré", 76, 2.8, 12, 1.8),
  // ---- Plats & divers ----
  F("Pizza margherita", "Plats", 266, 11, 33, 10), F("Frites", "Plats", 312, 3.4, 41, 15), F("Quiche lorraine", "Plats", 280, 9, 22, 18),
  F("Sushi", "Plats", 140, 4, 30, 0.5), F("Houmous", "Plats", 166, 8, 14, 10), F("Ketchup", "Plats", 112, 1.3, 26, 0.2),
  F("Mayonnaise", "Plats", 680, 1, 2, 75), F("Sauce tomate", "Plats", 35, 1.6, 7, 0.4), F("Chips", "Plats", 536, 6, 53, 34),
  F("Yaourt aux fruits", "Plats", 90, 3.5, 15, 2.5), F("Crêpe", "Plats", 220, 6, 30, 8), F("Pâtes bolognaise", "Plats", 130, 6, 16, 4),
  F("Salade César", "Plats", 180, 9, 6, 13), F("Burger maison", "Plats", 250, 15, 20, 12), F("Wrap poulet", "Plats", 200, 12, 22, 7),
  F("Kebab", "Plats", 215, 13, 18, 10), F("Croque-monsieur", "Plats", 280, 14, 24, 14), F("Lasagnes", "Plats", 150, 8, 14, 7),
  F("Hachis parmentier", "Plats", 110, 7, 10, 4.5), F("Gratin dauphinois", "Plats", 120, 3, 13, 6),
  F("Ratatouille", "Plats", 35, 1, 5, 1.2), F("Soupe de légumes", "Plats", 35, 1.2, 6, 0.7),
  F("Purée de pommes de terre", "Plats", 90, 2, 14, 3), F("Couscous (plat complet)", "Plats", 145, 8, 17, 5),
  F("Paëlla", "Plats", 155, 9, 18, 5), F("Tartiflette", "Plats", 160, 7, 12, 9), F("Riz cantonais", "Plats", 163, 6, 22, 5),
  F("Taboulé", "Plats", 130, 3.5, 20, 4),

  // ============================================================
  // BOISSONS — valeurs pour 100 ml
  // ============================================================
  // Eaux & basiques
  B("Eau", 0, 0, 0, 0), B("Eau gazeuse", 0, 0, 0, 0), B("Eau aromatisée (sucrée)", 20, 0, 4.8, 0),
  B("Eau de coco", 19, 0.7, 3.7, 0.2),
  // Cafés & thés
  B("Café noir", 2, 0.1, 0, 0), B("Café au lait", 27, 1.5, 2.4, 1), B("Cappuccino", 35, 1.7, 3.5, 1.5),
  B("Café latte", 42, 2.2, 3.8, 1.9), B("Thé nature", 1, 0, 0.2, 0), B("Thé glacé (Ice Tea)", 29, 0, 7, 0),
  B("Chocolat chaud", 77, 3.2, 10, 2.5), B("Kombucha", 19, 0, 4.5, 0),
  // Sodas & boissons sucrées
  B("Coca-Cola", 42, 0, 10.6, 0), B("Coca-Cola zéro", 0, 0, 0, 0), B("Orangina", 42, 0, 10, 0),
  B("Fanta orange", 43, 0, 10.4, 0), B("Sprite", 20, 0, 4.6, 0), B("Limonade", 40, 0, 10, 0),
  B("Schweppes tonic", 37, 0, 8.9, 0), B("Red Bull", 45, 0, 11, 0), B("Boisson énergisante (type Monster)", 47, 0, 11.5, 0),
  B("Sirop à l'eau (dilué)", 35, 0, 8.7, 0), B("Boisson isotonique (sport)", 26, 0, 6.3, 0),
  // Jus & smoothies
  B("Jus d'orange", 45, 0.7, 10, 0.2), B("Jus de pomme", 46, 0.1, 11, 0.1), B("Jus de raisin", 63, 0.3, 15, 0.1),
  B("Jus multifruits", 50, 0.4, 11.5, 0.1), B("Jus d'ananas", 53, 0.4, 12.6, 0.1), B("Jus de tomate", 20, 0.8, 3.5, 0.1),
  B("Smoothie aux fruits", 55, 0.7, 12, 0.3), B("Citronnade", 40, 0.1, 10, 0),
  // Laits & boissons végétales
  B("Lait entier", 65, 3.2, 4.7, 3.6), B("Lait demi-écrémé", 46, 3.3, 4.8, 1.6), B("Lait écrémé", 33, 3.3, 4.9, 0.1),
  B("Lait d'amande", 24, 0.5, 3, 1.1), B("Lait de soja", 40, 3.3, 2.5, 1.9), B("Lait d'avoine", 45, 0.4, 7.5, 1.4),
  B("Lait de coco (boisson)", 20, 0.2, 2.7, 0.9), B("Milkshake vanille", 112, 3.5, 17, 3.2),
  // Alcools
  B("Bière", 43, 0.5, 3.6, 0), B("Bière sans alcool", 24, 0.4, 5.3, 0), B("Vin rouge", 85, 0.1, 2.6, 0),
  B("Vin blanc sec", 77, 0.1, 0.9, 0), B("Vin rosé", 75, 0.1, 1.5, 0), B("Champagne", 76, 0.2, 1.4, 0),
  B("Cidre brut", 42, 0, 3, 0), B("Whisky", 222, 0, 0, 0), B("Vodka", 222, 0, 0, 0), B("Rhum", 222, 0, 0, 0),
  B("Gin", 222, 0, 0, 0), B("Pastis", 250, 0, 3, 0), B("Mojito", 87, 0, 8, 0), B("Spritz", 80, 0, 6, 0),
  B("Sangria", 80, 0.1, 7, 0),
];

/** Boissons en accès rapide dans la fenêtre d'ajout (quantité par défaut en ml). */
export const QUICK_DRINKS: { name: string; emoji: string; defaultMl: number }[] = [
  { name: "Eau", emoji: "💧", defaultMl: 250 },
  { name: "Café noir", emoji: "☕", defaultMl: 120 },
  { name: "Thé nature", emoji: "🍵", defaultMl: 250 },
  { name: "Jus d'orange", emoji: "🍊", defaultMl: 200 },
  { name: "Coca-Cola", emoji: "🥤", defaultMl: 330 },
  { name: "Lait demi-écrémé", emoji: "🥛", defaultMl: 200 },
  { name: "Bière", emoji: "🍺", defaultMl: 250 },
  { name: "Vin rouge", emoji: "🍷", defaultMl: 125 },
];

/**
 * Recherche locale instantanée avec score de pertinence :
 * nom exact > commence par > début de mot > tous les mots trouvés > contient.
 */
export function searchLocalFoods(q: string, limit = 10): LocalFood[] {
  const nq = normText(q.trim());
  if (nq.length < 2) return [];
  const tokens = nq.split(/\s+/).filter(Boolean);

  const scored: { food: LocalFood; score: number }[] = [];
  for (const food of LOCAL_FOODS) {
    const nn = normText(food.name);
    let score = 0;
    if (nn === nq) score = 100;
    else if (nn.startsWith(nq)) score = 90;
    else if (nn.split(/[\s\-'()/]+/).some((w) => w.startsWith(nq))) score = 75;
    else if (tokens.length > 1 && tokens.every((t) => nn.includes(t))) score = 65;
    else if (nn.includes(nq)) score = 50;
    if (score > 0) scored.push({ food, score });
  }
  scored.sort((a, b) => b.score - a.score || a.food.name.length - b.food.name.length);
  return scored.slice(0, limit).map((x) => x.food);
}

// BODYUP — données de démonstration (mock). À remplacer par l'API / Supabase.

export interface FoodItem { name: string; qty: string; kcal: number }
export interface Meal {
  key: string;
  emoji: string;
  tint: string;
  name: string;
  kcal: number | null;
  color: string;
  items: FoodItem[];
  empty?: boolean;
}

export const journalMeals: Meal[] = [
  {
    key: "petit-dej", emoji: "🍳", tint: "rgba(255,194,75,.13)", name: "Petit-déjeuner",
    kcal: 520, color: "var(--amber)",
    items: [
      { name: "Flocons d'avoine", qty: "80 g", kcal: 304 },
      { name: "Banane", qty: "1 moyenne", kcal: 105 },
      { name: "Yaourt grec", qty: "150 g", kcal: 111 },
    ],
  },
  {
    key: "dejeuner", emoji: "🥗", tint: "rgba(201,255,60,.13)", name: "Déjeuner",
    kcal: 680, color: "var(--lime)",
    items: [
      { name: "Poulet grillé + riz", qty: "320 g", kcal: 520 },
      { name: "Salade verte vinaigrette", qty: "1 bol", kcal: 160 },
    ],
  },
  {
    key: "collation", emoji: "🍎", tint: "rgba(255,122,83,.13)", name: "Collation",
    kcal: 500, color: "var(--coral)",
    items: [
      { name: "Amandes", qty: "30 g", kcal: 174 },
      { name: "Barre protéinée", qty: "1 barre", kcal: 326 },
    ],
  },
  {
    key: "diner", emoji: "🌙", tint: "rgba(183,155,255,.13)", name: "Dîner",
    kcal: null, color: "var(--txt-3)", items: [], empty: true,
  },
];

export interface Workout { emoji: string; tint: string; name: string; dur: string; kcal: number; diff: string; diffClass: string }

export const workouts: Workout[] = [
  { emoji: "🔥", tint: "rgba(255,122,83,.12)", name: "HIIT débutant", dur: "15 min", kcal: 300, diff: "Intense", diffClass: "d3" },
  { emoji: "🧘", tint: "rgba(201,255,60,.12)", name: "Yoga matinal", dur: "20 min", kcal: 90, diff: "Doux", diffClass: "d1" },
  { emoji: "💪", tint: "rgba(255,194,75,.12)", name: "Renfo · squats & gainage", dur: "12 min", kcal: 140, diff: "Modéré", diffClass: "d2" },
];

export interface Recipe { emoji: string; bg: string; title: string; time: string; kcal: number; tag: string; fav: boolean; p: number; c: number; f: number }

export const recipes: Recipe[] = [
  { emoji: "🐟", bg: "linear-gradient(140deg,rgba(201,255,60,.18),rgba(91,209,255,.1))", title: "Saumon rôti & légumes verts", time: "25 min", kcal: 540, tag: "Sans gluten", fav: false, p: 42, c: 18, f: 28 },
  { emoji: "🥙", bg: "linear-gradient(140deg,rgba(255,194,75,.18),rgba(255,122,83,.1))", title: "Wrap poulet & avocat", time: "15 min", kcal: 480, tag: "Riche en protéines", fav: true, p: 38, c: 32, f: 21 },
];

export interface ChatMsg { from: "ai" | "me"; html: string }

export const coachThread: ChatMsg[] = [
  { from: "ai", html: "Salut Sébastien 👋 Tu as <b>600 kcal disponibles</b> ce soir grâce à ton HIIT. Comment puis-je t'aider ?" },
  { from: "me", html: "Pourquoi suis-je fatigué en ce moment ?" },
  { from: "ai", html: "Plusieurs pistes d'après tes données : ton sommeil est à <b>6h12 en moyenne</b> cette semaine, sous ton besoin. Tu es aussi en léger déficit de protéines depuis 4 jours, ce qui peut jouer sur la récupération.<br><br>Je te suggère un dîner protéiné et de viser 7h30 de sommeil. <b>Ceci ne remplace pas un avis médical</b> — si la fatigue persiste, consulte un professionnel." },
];

export const coachChips = [
  "Comment manger plus de protéines ?",
  "Combien d'eau boire ?",
  "Quel exercice aujourd'hui ?",
];

export interface Badge { emoji: string; label: string; locked?: boolean }
export const badges: Badge[] = [
  { emoji: "🔥", label: "14 jours" },
  { emoji: "💧", label: "Hydraté" },
  { emoji: "🏃", label: "10k pas" },
  { emoji: "🔒", label: "Marathon", locked: true },
];

// ---- Tablette ----
export interface PlanSlot { emoji: string; name: string; kcal: number | null }
export interface PlanDay { day: string; date: string; today?: boolean; slots: PlanSlot[] }

export const weekPlan: PlanDay[] = [
  { day: "Lun", date: "29", today: true, slots: [
    { emoji: "🍳", name: "Avoine", kcal: 520 }, { emoji: "🥗", name: "Poulet riz", kcal: 680 }, { emoji: "🐟", name: "Saumon", kcal: 540 },
  ]},
  { day: "Mar", date: "30", slots: [
    { emoji: "🥞", name: "Pancakes", kcal: 480 }, { emoji: "🥙", name: "Wrap", kcal: 480 }, { emoji: "", name: "", kcal: null },
  ]},
  { day: "Mer", date: "01", slots: [
    { emoji: "🥣", name: "Skyr", kcal: 310 }, { emoji: "", name: "", kcal: null }, { emoji: "🍲", name: "Curry", kcal: 590 },
  ]},
  { day: "Jeu", date: "02", slots: [
    { emoji: "", name: "", kcal: null }, { emoji: "🥗", name: "Buddha", kcal: 520 }, { emoji: "", name: "", kcal: null },
  ]},
];

export interface Insight { variant: "v" | "c" | "k"; icon: "spark" | "trend" | "bolt"; html: string }
export const insights: Insight[] = [
  { variant: "v", icon: "spark", html: "Tu manques de <b>protéines depuis 4 jours</b>. Un dîner protéiné aujourd'hui comblerait l'écart." },
  { variant: "c", icon: "trend", html: "Tes <b>repas du soir sont trop riches</b> en moyenne (+18% kcal). On peut alléger le dîner." },
  { variant: "k", icon: "bolt", html: "Bonne nouvelle : ton <b>hydratation est en hausse</b> de 22% cette semaine. Continue." },
];

// ---- Liste de courses intelligente ----
export interface ShopItem { name: string; qty: string; checked?: boolean }
export interface ShopAisle { rayon: string; emoji: string; items: ShopItem[] }

export const shoppingList: ShopAisle[] = [
  { rayon: "Fruits & légumes", emoji: "🥬", items: [
    { name: "Avocat", qty: "×2" }, { name: "Épinards frais", qty: "200 g", checked: true },
    { name: "Banane", qty: "×6" }, { name: "Citron", qty: "×2" },
  ]},
  { rayon: "Protéines", emoji: "🐟", items: [
    { name: "Filet de saumon", qty: "300 g" }, { name: "Blanc de poulet", qty: "500 g" },
    { name: "Pois chiches", qty: "1 boîte", checked: true }, { name: "Œufs", qty: "×12" },
  ]},
  { rayon: "Épicerie", emoji: "🌾", items: [
    { name: "Riz complet", qty: "1 kg" }, { name: "Huile d'olive", qty: "1 bouteille", checked: true },
    { name: "Tortillas", qty: "×8" },
  ]},
  { rayon: "Produits laitiers", emoji: "🥛", items: [
    { name: "Yaourt grec", qty: "500 g" }, { name: "Skyr nature", qty: "×4" },
  ]},
];

// ---- Photos de progression ----
export interface ProgressPoint { month: string; weight: number; emoji: string }
export const progressTimeline: ProgressPoint[] = [
  { month: "Fév", weight: 82.0, emoji: "🧍" },
  { month: "Mar", weight: 81.1, emoji: "🧍" },
  { month: "Avr", weight: 80.2, emoji: "🧍" },
  { month: "Mai", weight: 79.4, emoji: "🧍" },
  { month: "Juin", weight: 78.6, emoji: "🧍" },
];

export const mealSuggestions = [
  { emoji: "🐟", bg: "linear-gradient(140deg,rgba(201,255,60,.18),rgba(91,209,255,.1))", title: "Saumon & légumes verts", time: "25 min", kcal: 540 },
  { emoji: "🥙", bg: "linear-gradient(140deg,rgba(255,194,75,.18),rgba(255,122,83,.1))", title: "Wrap poulet avocat", time: "15 min", kcal: 480 },
  { emoji: "🍲", bg: "linear-gradient(140deg,rgba(183,155,255,.18),rgba(91,209,255,.1))", title: "Curry pois chiches", time: "30 min", kcal: 560 },
];

"use client";

// TheMealDB — base de recettes gratuite (photos + étapes). Clé de test "1".
const BASE = "https://www.themealdb.com/api/json/v1/1";

export interface MealLite { id: string; title: string; thumb: string }
export interface MealFull extends MealLite {
  category: string;
  area: string;
  steps: string[];
  ingredients: { name: string; measure: string }[];
  youtube?: string;
}

type Raw = Record<string, string | null>;

export async function mealCategories(): Promise<string[]> {
  try {
    const r = await fetch(`${BASE}/categories.php`);
    const j = await r.json();
    return ((j.categories as Raw[]) ?? []).map((c) => String(c.strCategory)).filter(Boolean);
  } catch { return []; }
}

export async function mealsByCategory(cat: string): Promise<MealLite[]> {
  try {
    const r = await fetch(`${BASE}/filter.php?c=${encodeURIComponent(cat)}`);
    const j = await r.json();
    return ((j.meals as Raw[]) ?? []).map((m) => ({ id: String(m.idMeal), title: String(m.strMeal), thumb: String(m.strMealThumb) }));
  } catch { return []; }
}

export async function mealsByIngredient(ing: string): Promise<MealLite[]> {
  try {
    const r = await fetch(`${BASE}/filter.php?i=${encodeURIComponent(ing)}`);
    const j = await r.json();
    return ((j.meals as Raw[]) ?? []).map((m) => ({ id: String(m.idMeal), title: String(m.strMeal), thumb: String(m.strMealThumb) }));
  } catch { return []; }
}

export async function searchMeals(q: string): Promise<MealLite[]> {
  try {
    const r = await fetch(`${BASE}/search.php?s=${encodeURIComponent(q)}`);
    const j = await r.json();
    return ((j.meals as Raw[]) ?? []).map((m) => ({ id: String(m.idMeal), title: String(m.strMeal), thumb: String(m.strMealThumb) }));
  } catch { return []; }
}

export async function mealLookup(id: string): Promise<MealFull | null> {
  try {
    const r = await fetch(`${BASE}/lookup.php?i=${encodeURIComponent(id)}`);
    const j = await r.json();
    const m = (j.meals as Raw[] | null)?.[0];
    if (!m) return null;
    const ingredients: { name: string; measure: string }[] = [];
    for (let i = 1; i <= 20; i++) {
      const n = m[`strIngredient${i}`];
      const me = m[`strMeasure${i}`];
      if (n && String(n).trim()) ingredients.push({ name: String(n).trim(), measure: String(me ?? "").trim() });
    }
    const steps = String(m.strInstructions ?? "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
    return {
      id: String(m.idMeal), title: String(m.strMeal), thumb: String(m.strMealThumb),
      category: String(m.strCategory ?? ""), area: String(m.strArea ?? ""),
      steps, ingredients, youtube: m.strYoutube ? String(m.strYoutube) : undefined,
    };
  } catch { return null; }
}

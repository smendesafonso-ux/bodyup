"use client";

import { supabase, todayISO } from "./supabase";
import type { FoodHit } from "./foods";
import type { NewFood } from "./useDay";

export interface FavFood {
  id: string;
  name: string;
  kcal100: number;
  p100: number;
  c100: number;
  f100: number;
  unit: "g" | "ml";
}

export interface RecentFood {
  name: string;
  qty: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  count: number; // nombre de fois consommé récemment
}

export async function loadFavorites(userId: string): Promise<FavFood[]> {
  const { data } = await supabase
    .from("favorite_foods")
    .select("id, name, kcal100, p100, c100, f100, unit")
    .eq("user_id", userId)
    .order("name");
  return ((data as FavFood[]) ?? []).map((f) => ({ ...f, p100: Number(f.p100), c100: Number(f.c100), f100: Number(f.f100) }));
}

export async function addFavorite(userId: string, hit: FoodHit): Promise<void> {
  await supabase.from("favorite_foods").upsert(
    { user_id: userId, name: hit.name, kcal100: hit.kcal100, p100: hit.p100, c100: hit.c100, f100: hit.f100, unit: hit.unit ?? "g" },
    { onConflict: "user_id,name" }
  );
}

export async function removeFavoriteByName(userId: string, name: string): Promise<void> {
  await supabase.from("favorite_foods").delete().eq("user_id", userId).eq("name", name);
}

export const favToHit = (f: FavFood): FoodHit => ({
  name: f.name, brand: null, kcal100: f.kcal100, p100: f.p100, c100: f.c100, f100: f.f100, unit: f.unit, source: "base",
});

/** Aliments récents : les 150 dernières entrées, dédupliquées, triées par fréquence puis récence. */
export async function loadRecentFoods(userId: string, limit = 8): Promise<RecentFood[]> {
  const { data } = await supabase
    .from("food_entries")
    .select("name, qty, kcal, protein, carbs, fat")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(150);
  const seen = new Map<string, RecentFood>();
  for (const e of (data ?? []) as Omit<RecentFood, "count">[]) {
    const key = e.name.toLowerCase();
    const cur = seen.get(key);
    if (cur) cur.count += 1;
    else seen.set(key, { ...e, count: 1 });
  }
  return [...seen.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

/** Date d'hier au format AAAA-MM-JJ (heure locale). */
export function yesterdayISO(): string {
  const d = new Date(todayISO() + "T12:00:00");
  d.setDate(d.getDate() - 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Entrées d'hier pour un repas donné (pour « recopier le repas d'hier »). */
export async function loadYesterdayMeal(userId: string, mealType: string): Promise<NewFood[]> {
  const { data } = await supabase
    .from("food_entries")
    .select("meal_type, name, qty, kcal, protein, carbs, fat")
    .eq("user_id", userId)
    .eq("date", yesterdayISO())
    .eq("meal_type", mealType)
    .order("created_at");
  return ((data as NewFood[]) ?? []);
}

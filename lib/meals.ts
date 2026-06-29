"use client";

import { supabase } from "./supabase";

export interface AiMeal {
  name: string;
  emoji: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  time: number;
  tag: string;
  ingredients: string[];
  steps: string[] | string; // tableau d'étapes (ancien format: chaîne)
}

export interface SuggestParams {
  mealType: string;
  diet?: string | null;
  allergies?: string[];
  goal?: string | null;
  remaining: { kcal: number; protein: number; carbs: number; fat: number };
  count?: number;
}

export async function suggestMeals(params: SuggestParams): Promise<AiMeal[]> {
  const { data, error } = await supabase.functions.invoke("suggest-meals", { body: params });
  if (error) {
    let detail = error.message || "Génération impossible";
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) detail = body.detail ? `${body.error} — ${String(body.detail).slice(0, 200)}` : body.error;
    } catch { /* garde le message générique */ }
    throw new Error(detail);
  }
  if (data?.error) throw new Error(data.error);
  return (data?.meals ?? []) as AiMeal[];
}

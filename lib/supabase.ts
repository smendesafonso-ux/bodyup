import { createClient } from "@supabase/supabase-js";

// URL + clé PUBLISHABLE (anon). Conçue pour être embarquée dans le front :
// la sécurité est assurée par les règles RLS définies dans supabase/schema.sql.
// La clé secrète (sb_secret_…) ne doit JAMAIS apparaître ici.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://poarxjchlboobosgleaz.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_kZFk_nQsxTHGGEGH-3lChQ_NH_43wek";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ---- Types alignés sur le schéma SQL ----
export interface Profile {
  id: string;
  display_name: string | null;
  username: string | null;
  sexe: "homme" | "femme" | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  target_kg: number | null;
  goal: "perte" | "maintien" | "masse" | null;
  activity: number | null;
  pace: number | null;
  bmr: number | null;
  tdee: number | null;
  calorie_target: number | null;
  onboarded: boolean;
  points: number | null;
  level: number | null;
}

export interface FoodEntry {
  id: string;
  user_id: string;
  date: string;
  meal_type: "petit-dej" | "dejeuner" | "collation" | "diner";
  name: string;
  qty: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

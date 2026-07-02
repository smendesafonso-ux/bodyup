"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, todayISO, type FoodEntry } from "./supabase";

export type NewFood = Omit<FoodEntry, "id" | "user_id" | "date">;

export function useDay(userId: string | undefined, weightKg?: number | null) {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [glasses, setGlasses] = useState(0);
  const [steps, setSteps] = useState(0);
  const [sleepMin, setSleepMin] = useState(0);
  const [workoutKcal, setWorkoutKcal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayISO());

  // Bascule automatique au changement de jour (minuit local), même app ouverte.
  useEffect(() => {
    const check = () => setDate((d) => { const t = todayISO(); return d !== t ? t : d; });
    const id = setInterval(check, 30000);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", check); window.removeEventListener("focus", check); };
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [fe, w, wo] = await Promise.all([
      supabase.from("food_entries").select("*").eq("user_id", userId).eq("date", date).order("created_at"),
      supabase.from("water_logs").select("glasses,steps,sleep_min").eq("user_id", userId).eq("date", date).maybeSingle(),
      supabase.from("workout_logs").select("kcal").eq("user_id", userId).eq("date", date),
    ]);
    setEntries((fe.data as FoodEntry[]) ?? []);
    setGlasses((w.data?.glasses as number) ?? 0);
    setSteps((w.data?.steps as number) ?? 0);
    setSleepMin((w.data?.sleep_min as number) ?? 0);
    setWorkoutKcal(((wo.data as { kcal: number }[]) ?? []).reduce((n, x) => n + x.kcal, 0));
    setLoading(false);
  }, [userId, date]);

  useEffect(() => { load(); }, [load]);

  const addEntry = useCallback(async (e: NewFood) => {
    if (!userId) return;
    const { error } = await supabase.from("food_entries").insert({ user_id: userId, date, ...e });
    if (error) throw new Error("Enregistrement impossible. Vérifie ta connexion puis réessaie.");
    await load();
  }, [userId, date, load]);

  const deleteEntry = useCallback(async (id: string) => {
    await supabase.from("food_entries").delete().eq("id", id);
    await load();
  }, [load]);

  const setWater = useCallback(async (delta: number) => {
    if (!userId) return;
    const g = Math.max(0, glasses + delta);
    setGlasses(g);
    await supabase.from("water_logs").upsert({ user_id: userId, date, glasses: g }, { onConflict: "user_id,date" });
  }, [userId, date, glasses]);

  const addWorkout = useCallback(async (name: string, kcal: number) => {
    if (!userId) return;
    const { error } = await supabase.from("workout_logs").insert({ user_id: userId, date, name, kcal });
    if (error) throw new Error("Enregistrement impossible. Vérifie ta connexion puis réessaie.");
    await load();
  }, [userId, date, load]);

  const setDailyMetric = useCallback(async (patch: { steps?: number; sleep_min?: number }) => {
    if (!userId) return;
    if (patch.steps != null) setSteps(patch.steps);
    if (patch.sleep_min != null) setSleepMin(patch.sleep_min);
    await supabase.from("water_logs").upsert({ user_id: userId, date, ...patch }, { onConflict: "user_id,date" });
  }, [userId, date]);

  const consumed = entries.reduce((n, e) => n + e.kcal, 0);
  const macros = {
    p: entries.reduce((n, e) => n + e.protein, 0),
    c: entries.reduce((n, e) => n + e.carbs, 0),
    f: entries.reduce((n, e) => n + e.fat, 0),
  };

  // Les pas comptent dans les calories brûlées : ≈ 0,0004 kcal × poids (kg) par pas
  // (marche ~0,5 kcal/kg/km, ~1 250 pas/km). Ex : 8 000 pas à 75 kg ≈ 240 kcal.
  const stepsKcal = Math.round(steps * 0.0004 * (weightKg ?? 70));
  const burned = workoutKcal + stepsKcal;

  return { entries, glasses, steps, sleepMin, burned, workoutKcal, stepsKcal, loading, consumed, macros, addEntry, deleteEntry, setWater, addWorkout, setDailyMetric, reload: load };
}

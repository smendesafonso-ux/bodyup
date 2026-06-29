"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase, todayISO, type FoodEntry } from "./supabase";

export type NewFood = Omit<FoodEntry, "id" | "user_id" | "date">;

export function useDay(userId: string | undefined) {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [glasses, setGlasses] = useState(0);
  const [burned, setBurned] = useState(0);
  const [loading, setLoading] = useState(true);
  const date = todayISO();

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [fe, w, wo] = await Promise.all([
      supabase.from("food_entries").select("*").eq("user_id", userId).eq("date", date).order("created_at"),
      supabase.from("water_logs").select("glasses").eq("user_id", userId).eq("date", date).maybeSingle(),
      supabase.from("workout_logs").select("kcal").eq("user_id", userId).eq("date", date),
    ]);
    setEntries((fe.data as FoodEntry[]) ?? []);
    setGlasses((w.data?.glasses as number) ?? 0);
    setBurned(((wo.data as { kcal: number }[]) ?? []).reduce((n, x) => n + x.kcal, 0));
    setLoading(false);
  }, [userId, date]);

  useEffect(() => { load(); }, [load]);

  const addEntry = useCallback(async (e: NewFood) => {
    if (!userId) return;
    await supabase.from("food_entries").insert({ user_id: userId, date, ...e });
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
    await supabase.from("workout_logs").insert({ user_id: userId, date, name, kcal });
    await load();
  }, [userId, date, load]);

  const consumed = entries.reduce((n, e) => n + e.kcal, 0);
  const macros = {
    p: entries.reduce((n, e) => n + e.protein, 0),
    c: entries.reduce((n, e) => n + e.carbs, 0),
    f: entries.reduce((n, e) => n + e.fat, 0),
  };

  return { entries, glasses, burned, loading, consumed, macros, addEntry, deleteEntry, setWater, addWorkout, reload: load };
}

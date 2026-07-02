"use client";

import { supabase } from "./supabase";

export interface DayEntry {
  meal_type: string;
  name: string;
  qty: string | null;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayHistory {
  date: string; // AAAA-MM-JJ
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  entries: DayEntry[];
  burned: number;
  workouts: string[];
  glasses: number;
  steps: number;
  sleepMin: number;
  weight: number | null;
}

/** Charge l'intégralité de l'historique (repas, séances, eau, pas, sommeil, poids), agrégé par jour. */
export async function loadHistory(userId: string): Promise<DayHistory[]> {
  const [fe, wa, wo, we] = await Promise.all([
    supabase.from("food_entries").select("date, meal_type, name, qty, kcal, protein, carbs, fat").eq("user_id", userId).order("date").order("created_at"),
    supabase.from("water_logs").select("date, glasses, steps, sleep_min").eq("user_id", userId),
    supabase.from("workout_logs").select("date, name, kcal").eq("user_id", userId),
    supabase.from("weight_logs").select("date, weight_kg").eq("user_id", userId).order("date"),
  ]);

  const days = new Map<string, DayHistory>();
  const day = (date: string): DayHistory => {
    let d = days.get(date);
    if (!d) {
      d = { date, kcal: 0, protein: 0, carbs: 0, fat: 0, entries: [], burned: 0, workouts: [], glasses: 0, steps: 0, sleepMin: 0, weight: null };
      days.set(date, d);
    }
    return d;
  };

  for (const e of (fe.data ?? []) as (DayEntry & { date: string })[]) {
    const d = day(e.date);
    d.entries.push(e);
    d.kcal += e.kcal; d.protein += e.protein; d.carbs += e.carbs; d.fat += e.fat;
  }
  for (const w of (wa.data ?? []) as { date: string; glasses: number | null; steps: number | null; sleep_min: number | null }[]) {
    const d = day(w.date);
    d.glasses = w.glasses ?? 0; d.steps = w.steps ?? 0; d.sleepMin = w.sleep_min ?? 0;
  }
  for (const w of (wo.data ?? []) as { date: string; name: string; kcal: number }[]) {
    const d = day(w.date);
    d.burned += w.kcal; d.workouts.push(`${w.name} (+${w.kcal} kcal)`);
  }
  for (const w of (we.data ?? []) as { date: string; weight_kg: number }[]) {
    day(w.date).weight = Number(w.weight_kg);
  }

  return [...days.values()].sort((a, b) => (a.date < b.date ? 1 : -1)); // plus récent en premier
}

const csvField = (v: string | number | null) => {
  const s = v == null ? "" : String(v);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const MEAL_LABEL: Record<string, string> = { "petit-dej": "Petit-déjeuner", dejeuner: "Déjeuner", collation: "Collation", diner: "Dîner" };

/** CSV complet, une ligne par jour (séparateur « ; » pour Excel FR, avec BOM UTF-8). */
export function buildHistoryCsv(days: DayHistory[]): string {
  const header = [
    "Date", "Calories consommées (kcal)", "Protéines (g)", "Glucides (g)", "Lipides (g)",
    "Nb aliments", "Calories brûlées (kcal)", "Séances", "Eau (L)", "Pas", "Sommeil (h)", "Poids (kg)", "Détail des repas",
  ].join(";");
  const rows = days.map((d) => {
    const detail = d.entries
      .map((e) => `${MEAL_LABEL[e.meal_type] ?? e.meal_type} : ${e.name}${e.qty ? ` — ${e.qty}` : ""} (${e.kcal} kcal, P${e.protein}/G${e.carbs}/L${e.fat})`)
      .join(" | ");
    return [
      d.date, d.kcal, d.protein, d.carbs, d.fat,
      d.entries.length, d.burned, d.workouts.join(" | "),
      (d.glasses * 0.25).toFixed(2).replace(".", ","), d.steps || "",
      d.sleepMin ? (d.sleepMin / 60).toFixed(1).replace(".", ",") : "", d.weight ?? "",
      detail,
    ].map(csvField).join(";");
  });
  return "﻿" + [header, ...rows].join("\r\n"); // préfixé du BOM UTF-8 (accents corrects dans Excel)
}

/** Déclenche le téléchargement d'un fichier CSV côté navigateur. */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

"use client";

import { supabase } from "./supabase";

export interface Stats {
  daysLogged: number;
  entriesTotal: number;
  workouts: number;
  weightLogs: number;
  lost: number;
  maxGlasses: number;
  maxSteps: number;
}

export interface Badge {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  points: number;
  earned: (s: Stats) => boolean;
}

export const BADGES: Badge[] = [
  { id: "first_meal", emoji: "🥗", label: "Premier repas", desc: "Enregistre ton 1er aliment", points: 10, earned: (s) => s.entriesTotal >= 1 },
  { id: "active7", emoji: "🔥", label: "7 jours actifs", desc: "Note tes repas sur 7 jours", points: 50, earned: (s) => s.daysLogged >= 7 },
  { id: "active30", emoji: "📅", label: "30 jours", desc: "30 jours de suivi", points: 150, earned: (s) => s.daysLogged >= 30 },
  { id: "first_workout", emoji: "💪", label: "Première séance", desc: "Termine 1 séance", points: 10, earned: (s) => s.workouts >= 1 },
  { id: "workout10", emoji: "🏋️", label: "10 séances", desc: "Termine 10 séances", points: 80, earned: (s) => s.workouts >= 10 },
  { id: "first_weigh", emoji: "⚖️", label: "Première pesée", desc: "Enregistre ton poids", points: 10, earned: (s) => s.weightLogs >= 1 },
  { id: "loss1", emoji: "📉", label: "−1 kg", desc: "Perds 1 kg", points: 60, earned: (s) => s.lost >= 1 },
  { id: "loss5", emoji: "🎯", label: "−5 kg", desc: "Perds 5 kg", points: 200, earned: (s) => s.lost >= 5 },
  { id: "hydrated", emoji: "💧", label: "Hydraté", desc: "8 verres d'eau en un jour", points: 30, earned: (s) => s.maxGlasses >= 8 },
  { id: "steps10k", emoji: "🚶", label: "10 000 pas", desc: "10 000 pas en un jour", points: 40, earned: (s) => s.maxSteps >= 10000 },
];

const EMOJIS = ["🌱", "🙂", "😀", "😄", "😎", "🤩", "🔥", "🏆", "👑"];
export const emojiForLevel = (lvl: number) => EMOJIS[Math.min(Math.max(lvl - 1, 0), EMOJIS.length - 1)] ?? "🙂";
export const computePoints = (s: Stats) => BADGES.reduce((n, b) => n + (b.earned(s) ? b.points : 0), 0);
export const levelFor = (points: number) => 1 + Math.floor(points / 150);
export const pointsToNext = (points: number) => 150 - (points % 150);

export async function loadStats(userId: string): Promise<Stats> {
  const [fe, wo, wl, wat] = await Promise.all([
    supabase.from("food_entries").select("date").eq("user_id", userId).limit(2000),
    supabase.from("workout_logs").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("weight_logs").select("weight_kg").eq("user_id", userId).order("date", { ascending: true }).limit(300),
    supabase.from("water_logs").select("glasses,steps").eq("user_id", userId).limit(400),
  ]);
  const dates = new Set(((fe.data as { date: string }[]) ?? []).map((r) => r.date));
  const wArr = ((wl.data as { weight_kg: number }[]) ?? []).map((r) => Number(r.weight_kg));
  const waterRows = (wat.data as { glasses: number; steps: number }[]) ?? [];
  return {
    daysLogged: dates.size,
    entriesTotal: (fe.data as unknown[])?.length ?? 0,
    workouts: wo.count ?? 0,
    weightLogs: wArr.length,
    lost: wArr.length >= 2 ? +(wArr[0] - wArr[wArr.length - 1]).toFixed(1) : 0,
    maxGlasses: waterRows.reduce((m, r) => Math.max(m, r.glasses ?? 0), 0),
    maxSteps: waterRows.reduce((m, r) => Math.max(m, r.steps ?? 0), 0),
  };
}

export async function persistGamification(userId: string, points: number, level: number): Promise<void> {
  await supabase.from("profiles").update({ points, level }).eq("id", userId);
}

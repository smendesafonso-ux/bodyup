"use client";

import { supabase } from "./supabase";

export interface Fast {
  id: string;
  started_at: string;
  ended_at: string | null;
  target_h: number;
}

export const FASTING_PROTOCOLS = [
  { label: "14:10", hours: 14, desc: "Doux — 14 h de jeûne" },
  { label: "16:8", hours: 16, desc: "Classique — 16 h de jeûne" },
  { label: "18:6", hours: 18, desc: "Avancé — 18 h de jeûne" },
] as const;

export async function getActiveFast(userId: string): Promise<Fast | null> {
  const { data } = await supabase
    .from("fasting_logs")
    .select("id, started_at, ended_at, target_h")
    .eq("user_id", userId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Fast) ?? null;
}

export async function startFast(userId: string, targetH: number): Promise<Fast | null> {
  const { data, error } = await supabase
    .from("fasting_logs")
    .insert({ user_id: userId, target_h: targetH })
    .select("id, started_at, ended_at, target_h")
    .single();
  if (error) throw new Error("Impossible de démarrer le jeûne. As-tu exécuté update_v2.sql dans Supabase ?");
  return (data as Fast) ?? null;
}

export async function endFast(id: string): Promise<void> {
  await supabase.from("fasting_logs").update({ ended_at: new Date().toISOString() }).eq("id", id);
}

/** Historique des jeûnes terminés (les plus récents en premier). */
export async function loadFastHistory(userId: string, limit = 10): Promise<Fast[]> {
  const { data } = await supabase
    .from("fasting_logs")
    .select("id, started_at, ended_at, target_h")
    .eq("user_id", userId)
    .not("ended_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(limit);
  return ((data as Fast[]) ?? []);
}

export const fastElapsedH = (f: Fast): number =>
  ((f.ended_at ? new Date(f.ended_at) : new Date()).getTime() - new Date(f.started_at).getTime()) / 3600000;

"use client";

import { supabase, todayISO } from "./supabase";

export type ShareCat = "poids" | "pas" | "courses";
export const SHARE_LABELS: Record<ShareCat, string> = { poids: "Poids & évolution", pas: "Pas & sommeil", courses: "Liste de courses" };
export const ALL_CATS: ShareCat[] = ["poids", "pas", "courses"];

export interface Connection {
  id: string;
  requester_id: string;
  requester_email: string;
  addressee_email: string;
  addressee_id: string | null;
  status: "pending" | "accepted";
  requester_categories: string[];
  addressee_categories: string[];
}

export async function loadConnections(): Promise<Connection[]> {
  const { data } = await supabase.from("connections").select("*").order("created_at", { ascending: false });
  return (data as Connection[]) ?? [];
}

export async function sendInvite(requesterId: string, requesterEmail: string, addresseeEmail: string, categories: ShareCat[]): Promise<string | null> {
  const { error } = await supabase.from("connections").insert({
    requester_id: requesterId, requester_email: requesterEmail.toLowerCase(),
    addressee_email: addresseeEmail.trim().toLowerCase(), requester_categories: categories,
  });
  return error ? error.message : null;
}

export async function acceptInvite(id: string, addresseeId: string, categories: ShareCat[]): Promise<void> {
  await supabase.from("connections").update({ status: "accepted", addressee_id: addresseeId, addressee_categories: categories, updated_at: new Date().toISOString() }).eq("id", id);
}

export async function removeConnection(id: string): Promise<void> {
  await supabase.from("connections").delete().eq("id", id);
}

export async function updateCategories(id: string, side: "requester" | "addressee", categories: ShareCat[]): Promise<void> {
  const patch = side === "requester" ? { requester_categories: categories } : { addressee_categories: categories };
  await supabase.from("connections").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
}

export interface SharedData {
  weights: { date: string; weight_kg: number }[];
  steps: number;
  sleepMin: number;
  buy: { name: string; category: string }[];
}

export async function loadSharedData(otherId: string): Promise<SharedData> {
  const today = todayISO();
  const [w, wd, p] = await Promise.all([
    supabase.from("weight_logs").select("date,weight_kg").eq("user_id", otherId).order("date", { ascending: true }).limit(60),
    supabase.from("water_logs").select("steps,sleep_min").eq("user_id", otherId).eq("date", today).maybeSingle(),
    supabase.from("pantry").select("name,category").eq("user_id", otherId).eq("status", "buy").order("name"),
  ]);
  return {
    weights: (w.data as { date: string; weight_kg: number }[]) ?? [],
    steps: (wd.data?.steps as number) ?? 0,
    sleepMin: (wd.data?.sleep_min as number) ?? 0,
    buy: (p.data as { name: string; category: string }[]) ?? [],
  };
}

"use client";

import { supabase, todayISO } from "./supabase";
import type { LibRecipe } from "./recipes";

export type ShareCat = "poids" | "pas" | "courses";
export const SHARE_LABELS: Record<ShareCat, string> = { poids: "Poids & évolution", pas: "Pas & sommeil", courses: "Liste de courses" };
export const ALL_CATS: ShareCat[] = ["poids", "pas", "courses"];

export interface Connection {
  id: string;
  requester_id: string;
  requester_username: string | null;
  addressee_id: string;
  addressee_username: string | null;
  status: "pending" | "accepted";
  requester_categories: string[];
  addressee_categories: string[];
}

/** Définit / met à jour son nom d'utilisateur. */
export async function setUsername(userId: string, username: string): Promise<string | null> {
  const { error } = await supabase.from("profiles").update({ username: username.trim() }).eq("id", userId);
  if (error) return /duplicate|unique/i.test(error.message) ? "Ce nom d'utilisateur est déjà pris." : error.message;
  return null;
}

/** Résout un nom d'utilisateur en id (via fonction SECURITY DEFINER). */
export async function resolveUsername(uname: string): Promise<string | null> {
  const { data } = await supabase.rpc("find_user_by_username", { uname });
  return (data as string) ?? null;
}

export async function loadConnections(): Promise<Connection[]> {
  const { data } = await supabase.from("connections").select("*").order("created_at", { ascending: false });
  return (data as Connection[]) ?? [];
}

export async function sendInvite(requesterId: string, requesterUsername: string, addresseeId: string, addresseeUsername: string, categories: ShareCat[]): Promise<string | null> {
  const { error } = await supabase.from("connections").insert({
    requester_id: requesterId, requester_username: requesterUsername,
    addressee_id: addresseeId, addressee_username: addresseeUsername, requester_categories: categories,
  });
  if (error) return /duplicate|unique/i.test(error.message) ? "Tu as déjà un partage avec cette personne." : error.message;
  return null;
}

export async function acceptInvite(id: string, categories: ShareCat[]): Promise<void> {
  await supabase.from("connections").update({ status: "accepted", addressee_categories: categories, updated_at: new Date().toISOString() }).eq("id", id);
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

/* ---------- Partage de recettes entre amis ---------- */
export interface SharedRecipe {
  id: string;
  from_user: string;
  from_username: string | null;
  to_user: string;
  recipe: LibRecipe;
  seen: boolean;
  created_at: string;
}

export async function shareRecipe(fromUser: string, fromUsername: string | null, toUser: string, recipe: LibRecipe): Promise<string | null> {
  const { error } = await supabase.from("shared_recipes").insert({ from_user: fromUser, from_username: fromUsername, to_user: toUser, recipe });
  if (error) return error.message;
  return null;
}

export async function loadReceivedRecipes(): Promise<SharedRecipe[]> {
  const { data } = await supabase.from("shared_recipes").select("*").order("created_at", { ascending: false }).limit(100);
  return (data as SharedRecipe[]) ?? [];
}

export async function markRecipeSeen(id: string): Promise<void> {
  await supabase.from("shared_recipes").update({ seen: true }).eq("id", id);
}

export async function deleteSharedRecipe(id: string): Promise<void> {
  await supabase.from("shared_recipes").delete().eq("id", id);
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

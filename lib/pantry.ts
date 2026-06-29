"use client";

import { supabase } from "./supabase";

export type PantryStatus = "have" | "buy";
export interface PantryItem {
  id: string;
  name: string;
  category: string;
  status: PantryStatus;
}

// Catalogue d'épices, condiments et basiques pour remplir vite le garde-manger.
export const STAPLES: { category: string; items: string[] }[] = [
  { category: "Épices & herbes", items: ["Sel", "Poivre", "Paprika", "Cumin", "Curcuma", "Curry", "Cannelle", "Origan", "Thym", "Basilic", "Ail en poudre", "Piment", "Gingembre", "Muscade", "Herbes de Provence", "Persil", "Coriandre"] },
  { category: "Huiles & condiments", items: ["Huile d'olive", "Huile de tournesol", "Vinaigre balsamique", "Sauce soja", "Moutarde", "Mayonnaise", "Ketchup", "Miel", "Concentré de tomate", "Crème fraîche"] },
  { category: "Basiques", items: ["Farine", "Sucre", "Riz", "Pâtes", "Œufs", "Lait", "Beurre", "Levure", "Bouillon cube", "Lentilles", "Pois chiches", "Chapelure"] },
];

export async function loadPantry(userId: string): Promise<PantryItem[]> {
  const { data } = await supabase.from("pantry").select("id,name,category,status").eq("user_id", userId).order("name");
  return (data as PantryItem[]) ?? [];
}

export async function addPantryItem(userId: string, name: string, category: string, status: PantryStatus): Promise<PantryItem | null> {
  const { data } = await supabase.from("pantry").insert({ user_id: userId, name, category, status }).select("id,name,category,status").maybeSingle();
  return (data as PantryItem) ?? null;
}

export async function addManyToBuy(userId: string, items: { name: string; category?: string }[]): Promise<void> {
  if (!items.length) return;
  await supabase.from("pantry").insert(items.map((i) => ({ user_id: userId, name: i.name, category: i.category ?? "Autre", status: "buy" })));
}

export async function setPantryStatus(id: string, status: PantryStatus): Promise<void> {
  await supabase.from("pantry").update({ status }).eq("id", id);
}

export async function removePantryItem(id: string): Promise<void> {
  await supabase.from("pantry").delete().eq("id", id);
}

// Recherche dans le catalogue : épices/basiques + table foods.
export async function searchCatalog(q: string): Promise<{ name: string; category: string }[]> {
  const query = q.trim().toLowerCase();
  if (query.length < 1) return [];
  const staples = STAPLES.flatMap((c) => c.items.map((i) => ({ name: i, category: c.category }))).filter((x) => x.name.toLowerCase().includes(query));
  const { data } = await supabase.from("foods").select("name,category").ilike("name", `%${q.trim()}%`).limit(10);
  const foods = ((data as { name: string; category: string }[]) ?? []).map((f) => ({ name: f.name, category: f.category ?? "Autre" }));
  const seen = new Set<string>();
  const out: { name: string; category: string }[] = [];
  for (const x of [...staples, ...foods]) {
    const k = x.name.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(x); }
  }
  return out.slice(0, 14);
}

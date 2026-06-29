"use client";

import { supabase } from "./supabase";

export interface FoodHit {
  name: string;
  brand: string | null;
  kcal100: number;
  p100: number;
  c100: number;
  f100: number;
  source: "base" | "off"; // base BODYUP ou Open Food Facts
  nutriscore?: string | null; // a..e (code-barres uniquement)
  nova?: number | null; // 1..4 (degré de transformation)
}

/** Recherche dans la table de référence BODYUP (aliments génériques). */
async function searchLocal(q: string): Promise<FoodHit[]> {
  const { data } = await supabase
    .from("foods")
    .select("name, brand, kcal, protein, carbs, fat")
    .ilike("name", `%${q}%`)
    .limit(12);
  return (data ?? []).map((f) => ({
    name: f.name as string,
    brand: (f.brand as string) ?? null,
    kcal100: f.kcal as number,
    p100: Number(f.protein),
    c100: Number(f.carbs),
    f100: Number(f.fat),
    source: "base" as const,
  }));
}

/** Recherche en direct sur Open Food Facts (produits + marques + code-barres). */
async function searchOFF(q: string): Promise<FoodHit[]> {
  const url =
    "https://fr.openfoodfacts.org/cgi/search.pl?" +
    new URLSearchParams({
      search_terms: q, search_simple: "1", action: "process", json: "1",
      page_size: "15", fields: "product_name,product_name_fr,brands,nutriments",
    }).toString();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return [];
    const json = await res.json();
    const out: FoodHit[] = [];
    for (const p of json.products ?? []) {
      const n = p.nutriments ?? {};
      const kcal = n["energy-kcal_100g"];
      const name = p.product_name_fr || p.product_name;
      if (!name || kcal == null) continue;
      out.push({
        name: String(name).trim(),
        brand: p.brands ? String(p.brands).split(",")[0].trim() : null,
        kcal100: Math.round(kcal),
        p100: round1(n.proteins_100g),
        c100: round1(n.carbohydrates_100g),
        f100: round1(n.fat_100g),
        source: "off",
      });
    }
    return out;
  } catch {
    return [];
  }
}

const round1 = (v: unknown) => (typeof v === "number" ? Math.round(v * 10) / 10 : 0);

/** Recherche un produit par code-barres sur Open Food Facts. */
export async function lookupBarcode(code: string): Promise<FoodHit | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_fr,brands,nutriments,nutriscore_grade,nova_group`,
      { signal: ctrl.signal }
    );
    clearTimeout(t);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;
    const p = json.product;
    const n = p.nutriments ?? {};
    const kcal = n["energy-kcal_100g"];
    const name = p.product_name_fr || p.product_name;
    if (!name || kcal == null) return null;
    const grade = typeof p.nutriscore_grade === "string" ? p.nutriscore_grade.toLowerCase() : null;
    return {
      name: String(name).trim(),
      brand: p.brands ? String(p.brands).split(",")[0].trim() : null,
      kcal100: Math.round(kcal),
      p100: round1(n.proteins_100g),
      c100: round1(n.carbohydrates_100g),
      f100: round1(n.fat_100g),
      source: "off",
      nutriscore: grade && "abcde".includes(grade) ? grade : null,
      nova: typeof p.nova_group === "number" ? p.nova_group : null,
    };
  } catch {
    return null;
  }
}

/** Recherche combinée : base BODYUP d'abord (propre), puis Open Food Facts. */
export async function searchFoods(q: string): Promise<FoodHit[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const [local, off] = await Promise.all([searchLocal(query), searchOFF(query)]);
  const seen = new Set(local.map((f) => f.name.toLowerCase()));
  const merged = [...local];
  for (const f of off) {
    const key = f.name.toLowerCase();
    if (!seen.has(key)) { seen.add(key); merged.push(f); }
  }
  return merged.slice(0, 25);
}

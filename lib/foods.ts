"use client";

import { supabase } from "./supabase";
import { searchLocalFoods, normText, LOCAL_FOODS, type LocalFood } from "./foods-local";

export interface FoodHit {
  name: string;
  brand: string | null;
  kcal100: number; // pour 100 g (ou 100 ml pour les boissons)
  p100: number;
  c100: number;
  f100: number;
  unit?: "g" | "ml"; // ml = boisson
  source: "base" | "off"; // base BODYUP ou Open Food Facts
  nutriscore?: string | null; // a..e (code-barres uniquement)
  nova?: number | null; // 1..4 (degré de transformation)
}

const hitFromLocal = (f: LocalFood): FoodHit => ({
  name: f.name,
  brand: null,
  kcal100: f.kcal,
  p100: f.p,
  c100: f.c,
  f100: f.f,
  unit: f.unit ?? "g",
  source: "base",
});

/** Recherche instantanée (synchrone, hors-ligne) dans la base embarquée. */
export function searchFoodsInstant(q: string): FoodHit[] {
  return searchLocalFoods(q).map(hitFromLocal);
}

/** Retrouve un aliment de la base embarquée par son nom exact (boissons rapides). */
export function localFoodByName(name: string): FoodHit | null {
  const f = LOCAL_FOODS.find((x) => x.name === name);
  return f ? hitFromLocal(f) : null;
}

/** Recherche dans la table de référence BODYUP côté Supabase (complément de la base embarquée). */
async function searchSupabase(q: string): Promise<FoodHit[]> {
  try {
    const { data } = await supabase
      .from("foods")
      .select("name, brand, category, kcal, protein, carbs, fat")
      .ilike("name", `%${q}%`)
      .limit(12);
    return (data ?? []).map((f) => ({
      name: f.name as string,
      brand: (f.brand as string) ?? null,
      kcal100: f.kcal as number,
      p100: Number(f.protein),
      c100: Number(f.carbs),
      f100: Number(f.fat),
      unit: f.category === "Boissons" ? ("ml" as const) : ("g" as const),
      source: "base" as const,
    }));
  } catch {
    return [];
  }
}

const round1 = (v: unknown) => (typeof v === "number" ? Math.round(v * 10) / 10 : 0);

async function fetchJson(url: string, timeoutMs: number): Promise<unknown | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

type OffProduct = {
  product_name?: string;
  product_name_fr?: string;
  brands?: string;
  nutriments?: Record<string, unknown>;
};

function offToHits(products: OffProduct[]): FoodHit[] {
  const out: FoodHit[] = [];
  for (const p of products) {
    const n = p.nutriments ?? {};
    const kcal = n["energy-kcal_100g"];
    const name = p.product_name_fr || p.product_name;
    // Filtre les fiches inexploitables (sans nom, kcal absente ou aberrante).
    if (!name || typeof kcal !== "number" || kcal < 0 || kcal > 950) continue;
    out.push({
      name: String(name).trim(),
      brand: p.brands ? String(p.brands).split(",")[0].trim() : null,
      kcal100: Math.round(kcal),
      p100: round1(n.proteins_100g),
      c100: round1(n.carbohydrates_100g),
      f100: round1(n.fat_100g),
      unit: "g",
      source: "off",
    });
  }
  return out;
}

/** Recherche Open Food Facts (produits + marques), avec repli fr → world si le premier échoue. */
async function searchOFF(q: string): Promise<FoodHit[]> {
  const params = new URLSearchParams({
    search_terms: q, search_simple: "1", action: "process", json: "1",
    page_size: "15", fields: "product_name,product_name_fr,brands,nutriments",
  }).toString();
  let json = (await fetchJson(`https://fr.openfoodfacts.org/cgi/search.pl?${params}`, 5000)) as { products?: OffProduct[] } | null;
  if (!json?.products?.length) {
    json = (await fetchJson(`https://world.openfoodfacts.org/cgi/search.pl?${params}`, 5000)) as { products?: OffProduct[] } | null;
  }
  return offToHits(json?.products ?? []);
}

/** Recherche un produit par code-barres sur Open Food Facts. */
export async function lookupBarcode(code: string): Promise<FoodHit | null> {
  const json = (await fetchJson(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_fr,brands,nutriments,nutriscore_grade,nova_group`,
    6000
  )) as { status?: number; product?: OffProduct & { nutriscore_grade?: string; nova_group?: number } } | null;
  if (!json || json.status !== 1 || !json.product) return null;
  const p = json.product;
  const n = p.nutriments ?? {};
  const kcal = n["energy-kcal_100g"];
  const name = p.product_name_fr || p.product_name;
  if (!name || typeof kcal !== "number") return null;
  const grade = typeof p.nutriscore_grade === "string" ? p.nutriscore_grade.toLowerCase() : null;
  return {
    name: String(name).trim(),
    brand: p.brands ? String(p.brands).split(",")[0].trim() : null,
    kcal100: Math.round(kcal),
    p100: round1(n.proteins_100g),
    c100: round1(n.carbohydrates_100g),
    f100: round1(n.fat_100g),
    unit: "g",
    source: "off",
    nutriscore: grade && "abcde".includes(grade) ? grade : null,
    nova: typeof p.nova_group === "number" ? p.nova_group : null,
  };
}

/** Score de pertinence d'un résultat par rapport à la requête (pour trier les fiches OFF). */
function relevance(name: string, nq: string): number {
  const nn = normText(name);
  if (nn === nq) return 100;
  if (nn.startsWith(nq)) return 90;
  if (nn.split(/[\s\-'()/]+/).some((w) => w.startsWith(nq))) return 75;
  if (nn.includes(nq)) return 50;
  return 10;
}

/**
 * Recherche combinée : base embarquée (instantanée, fiable) puis
 * base BODYUP Supabase et Open Food Facts, dédupliquées et triées par pertinence.
 */
export async function searchFoods(q: string): Promise<FoodHit[]> {
  const query = q.trim();
  if (query.length < 2) return [];
  const nq = normText(query);

  const local = searchFoodsInstant(query);
  const [base, off] = await Promise.all([searchSupabase(query), searchOFF(query)]);

  const seen = new Set(local.map((f) => normText(f.name)));
  const merged = [...local];
  for (const f of base) {
    const key = normText(f.name);
    if (!seen.has(key)) { seen.add(key); merged.push(f); }
  }
  const offSorted = off
    .map((f) => ({ f, s: relevance(f.name, nq) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.f);
  for (const f of offSorted) {
    const key = normText(f.brand ? `${f.name}|${f.brand}` : f.name);
    if (!seen.has(key)) { seen.add(key); merged.push(f); }
  }
  return merged.slice(0, 25);
}

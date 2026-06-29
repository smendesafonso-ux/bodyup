"use client";

import { supabase } from "./supabase";

export interface FoodAnalysis {
  name: string;
  confidence: number;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  score?: number; // note santé 0–100
  advice?: string; // avis nutritionnel court
  items: { name: string; grams: number; kcal: number; protein?: number; carbs?: number; fat?: number }[];
}

/** Redimensionne une image et renvoie le base64 (sans préfixe data:). */
export function fileToBase64(file: File, maxDim = 1024, quality = 0.8): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas indisponible"));
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve({ data: dataUrl.split(",")[1], mediaType: "image/jpeg" });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("image illisible")); };
    img.src = url;
  });
}

/** Envoie l'image à l'Edge Function sécurisée qui appelle Claude. */
export async function analyzeFoodPhoto(file: File): Promise<FoodAnalysis> {
  const { data: img } = await fileToBase64(file);
  const { data, error } = await supabase.functions.invoke("analyze-food", {
    body: { image: img, mediaType: "image/jpeg" },
  });
  if (error) {
    // functions.invoke masque le corps : on l'extrait pour voir la vraie cause
    let detail = error.message || "Analyse impossible";
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) detail = body.detail ? `${body.error} — ${String(body.detail).slice(0, 200)}` : body.error;
    } catch { /* garde le message générique */ }
    throw new Error(detail);
  }
  if (data?.error) throw new Error(data.error);
  return data as FoodAnalysis;
}

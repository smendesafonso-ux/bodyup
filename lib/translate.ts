"use client";

import { supabase } from "./supabase";

/** Traduit une liste de textes en français (même ordre). */
export async function translateTexts(texts: string[]): Promise<string[]> {
  if (!texts.length) return [];
  const { data, error } = await supabase.functions.invoke("translate", { body: { texts } });
  if (error) {
    let detail = error.message || "Traduction impossible";
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) detail = body.detail ? `${body.error} — ${String(body.detail).slice(0, 200)}` : body.error;
    } catch { /* garde le message générique */ }
    throw new Error(detail);
  }
  if (data?.error) throw new Error(data.error);
  const out = (data?.translations as string[]) ?? [];
  // sécurité : si le nombre ne correspond pas, on renvoie l'original
  return out.length === texts.length ? out : texts;
}

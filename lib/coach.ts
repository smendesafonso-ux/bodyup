"use client";

import { supabase } from "./supabase";

export interface CoachMsg { role: "user" | "assistant"; text: string }
export interface CoachContext {
  name?: string | null;
  goal?: string | null;
  weight_kg?: number | null;
  target_kg?: number | null;
  calorie_target?: number | null;
  tdee?: number | null;
  today: { consumed: number; remaining: number; protein: number; carbs: number; fat: number; glasses: number; steps: number; burned: number };
}

export async function askCoach(messages: CoachMsg[], context: CoachContext): Promise<string> {
  const { data, error } = await supabase.functions.invoke("coach", { body: { messages, context } });
  if (error) {
    let detail = error.message || "Le coach est indisponible";
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) detail = body.detail ? `${body.error} — ${String(body.detail).slice(0, 200)}` : body.error;
    } catch { /* garde le message générique */ }
    throw new Error(detail);
  }
  if (data?.error) throw new Error(data.error);
  return (data?.reply ?? "").toString();
}

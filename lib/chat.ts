"use client";

import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface ChatMsg {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

/** Fil de discussion avec un proche (les plus anciens en premier). */
export async function loadThread(me: string, other: string, limit = 200): Promise<ChatMsg[]> {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${me},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${me})`)
    .order("created_at", { ascending: true })
    .limit(limit);
  return ((data as ChatMsg[]) ?? []);
}

export async function sendMessage(me: string, other: string, body: string): Promise<ChatMsg> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id: me, recipient_id: other, body: body.trim() })
    .select("*")
    .single();
  if (error) throw new Error("Envoi impossible. Vérifie ta connexion (et que update_v2.sql est exécuté dans Supabase).");
  return data as ChatMsg;
}

/** Marque comme lus tous les messages reçus de `other`. */
export async function markThreadRead(me: string, other: string): Promise<void> {
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", me)
    .eq("sender_id", other)
    .is("read_at", null);
}

/** Nombre de messages non lus, par expéditeur. */
export async function loadUnreadCounts(me: string): Promise<Record<string, number>> {
  const { data } = await supabase
    .from("messages")
    .select("sender_id")
    .eq("recipient_id", me)
    .is("read_at", null);
  const counts: Record<string, number> = {};
  for (const m of (data ?? []) as { sender_id: string }[]) counts[m.sender_id] = (counts[m.sender_id] ?? 0) + 1;
  return counts;
}

/**
 * Abonnement temps réel aux messages qui me sont adressés.
 * Renvoie le canal — à désabonner avec `supabase.removeChannel(ch)`.
 * (Le composant garde en plus un polling léger en secours si le temps réel est indisponible.)
 */
export function subscribeToMessages(me: string, onMessage: (m: ChatMsg) => void): RealtimeChannel {
  // nom unique : plusieurs abonnements peuvent coexister (badge global + fil ouvert)
  return supabase
    .channel(`messages-${me}-${Math.random().toString(36).slice(2)}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${me}` },
      (payload) => onMessage(payload.new as ChatMsg)
    )
    .subscribe();
}

"use client";

// Notifications push serveur (Web Push / VAPID) : reçues même app fermée.
// La clé PUBLIQUE ci-dessous est faite pour être embarquée dans le front ;
// la clé privée correspondante vit uniquement dans les secrets Supabase.

import { supabase } from "./supabase";

const VAPID_PUBLIC_KEY = "BHLIm1TIpULalqB8wJBpA49kdYsjTsNSLMoYnVFkwEdgG6t89aUfoiGsU-ePEWDi_BVKBQczZXco7yfGP7MfQ0I";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

/**
 * Abonne cet appareil au push serveur et enregistre l'abonnement côté Supabase.
 * À appeler quand la permission notifications est accordée.
 * Sur iPhone : nécessite l'app installée sur l'écran d'accueil (iOS 16.4+).
 */
export async function enablePush(userId: string): Promise<boolean> {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = reg ? await reg.pushManager.getSubscription() : null;
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }
    const j = sub.toJSON();
    if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) return false;
    await supabase.from("push_subscriptions").upsert(
      { user_id: userId, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth },
      { onConflict: "endpoint" }
    );
    return true;
  } catch {
    return false; // push indisponible (navigateur, PWA non installée…) — les notifs locales restent actives
  }
}

/** Envoie une notification push à un proche connecté (via la fonction Edge « push »). */
export function sendPushTo(to: string, title: string, body: string, tag = "msg"): void {
  // volontairement non bloquant : l'échec du push ne doit jamais bloquer l'envoi du message
  supabase.functions.invoke("push", { body: { action: "send", to, title, body, tag } }).catch(() => {});
}

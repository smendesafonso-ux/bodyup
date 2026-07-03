// BODYUP — Edge Function "push"
// Envoie une notification Web Push (VAPID) aux appareils d'un proche connecté —
// fonctionne même quand son app est fermée. La clé privée VAPID reste côté serveur.
// Secrets requis : VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:…).
// Anti-abus : l'expéditeur doit être authentifié ET connecté (partage accepté) au destinataire.

import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contact@bodyup.app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

const db = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}`,
      "content-type": "application/json", ...(init.headers ?? {}),
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return json({ error: "server_not_configured", detail: "VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY manquants" }, 500);

  const authHeader = req.headers.get("Authorization");
  const apikey = req.headers.get("apikey") ?? "";
  if (!authHeader || !SUPABASE_URL) return json({ error: "unauthorized" }, 401);
  const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: authHeader, apikey } });
  if (!who.ok) return json({ error: "unauthorized" }, 401);
  const uid = (await who.json()).id as string;

  try {
    const b = await req.json();
    if (b.action !== "send") return json({ error: "bad_request" }, 400);

    const to = String(b.to ?? "");
    if (!to) return json({ error: "bad_request" }, 400);

    // n'autorise l'envoi qu'entre proches connectés (partage accepté)
    const conns = await (await db(
      `connections?status=eq.accepted&or=(and(requester_id.eq.${uid},addressee_id.eq.${to}),and(addressee_id.eq.${uid},requester_id.eq.${to}))&select=id`
    )).json();
    if (!Array.isArray(conns) || conns.length === 0) return json({ error: "not_connected" }, 403);

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    const payload = JSON.stringify({
      title: String(b.title ?? "BODYUP"),
      body: String(b.body ?? "").slice(0, 160),
      tag: String(b.tag ?? "msg"),
    });

    const subs = await (await db(`push_subscriptions?user_id=eq.${to}&select=id,endpoint,p256dh,auth`)).json();
    let sent = 0;
    for (const s of Array.isArray(subs) ? subs : []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        sent++;
      } catch (e) {
        // abonnement expiré / appareil désinscrit → nettoyage
        const status = (e as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) await db(`push_subscriptions?id=eq.${s.id}`, { method: "DELETE" });
      }
    }
    return json({ ok: true, sent });
  } catch (e) {
    return json({ error: "exception", detail: String(e) }, 500);
  }
});

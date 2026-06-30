// BODYUP — Edge Function "coach"
// Coach santé conversationnel via Claude, en français, avec le contexte de l'utilisateur
// (objectif, cibles, stats du jour) et la mémoire de la conversation.
// Clé en secret serveur. Réservé aux utilisateurs connectés.

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-opus-4-8";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

type Msg = { role: "user" | "assistant"; text: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!ANTHROPIC_API_KEY) return json({ error: "server_not_configured" }, 500);

  const authHeader = req.headers.get("Authorization");
  const apikey = req.headers.get("apikey") ?? "";
  if (!authHeader || !SUPABASE_URL) return json({ error: "unauthorized" }, 401);
  const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { Authorization: authHeader, apikey } });
  if (!who.ok) return json({ error: "unauthorized" }, 401);

  try {
    const b = await req.json();
    const history: Msg[] = Array.isArray(b.messages) ? b.messages : [];
    const c = b.context ?? {};
    const t = c.today ?? {};

    const ctx = `CONTEXTE UTILISATEUR (à utiliser pour personnaliser tes réponses, ne le récite pas tel quel) :
- Prénom : ${c.name ?? "—"}
- Objectif : ${c.goal ?? "maintien"}${c.weight_kg ? ` · poids ${c.weight_kg} kg → cible ${c.target_kg ?? "?"} kg` : ""}
- Cible calorique du jour : ${c.calorie_target ?? "?"} kcal (dépense estimée TDEE ${c.tdee ?? "?"})
- Aujourd'hui : ${Math.round(t.consumed ?? 0)} kcal consommées, il reste ~${Math.round(t.remaining ?? 0)} kcal · protéines ${Math.round(t.protein ?? 0)} g, glucides ${Math.round(t.carbs ?? 0)} g, lipides ${Math.round(t.fat ?? 0)} g · eau ${t.glasses ?? 0} verres · ${t.steps ?? 0} pas · ${Math.round(t.burned ?? 0)} kcal brûlées.`;

    const system = `Tu es "Coach BODYUP", un coach santé bienveillant, motivant et concret, qui répond TOUJOURS en français.
Domaines : nutrition, perte/prise de poids, activité physique, hydratation, sommeil, habitudes et motivation.
Style : chaleureux, tutoiement, réponses COURTES et actionnables (2 à 5 phrases ou une courte liste à puces), avec des chiffres concrets quand c'est utile. Pas de jargon inutile. Utilise au plus 1 emoji.
Sers-toi du contexte ci-dessous pour personnaliser (calories restantes, macros, objectif…) sans le réciter.
Limites : tu n'es pas médecin. Pour des symptômes, douleurs, pathologies, grossesse, troubles alimentaires ou médicaments, recommande gentiment de consulter un professionnel de santé, sans donner de diagnostic. Ne propose jamais de régime dangereux ou très basses calories.

${ctx}`;

    const messages = history
      .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.text === "string" && m.text.trim())
      .map((m) => ({ role: m.role, content: [{ type: "text", text: m.text }] }));
    if (!messages.length || messages[0].role !== "user") return json({ error: "bad_request" }, 400);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 800, system, messages }),
    });
    if (!res.ok) { const detail = await res.text(); return json({ error: "anthropic_error", status: res.status, detail }, 502); }
    const data = await res.json();
    if (data.stop_reason === "refusal") return json({ error: "refused" }, 422);
    const textBlock = (data.content ?? []).find((x: { type: string }) => x.type === "text");
    if (!textBlock?.text) return json({ error: "empty_response" }, 502);
    return json({ reply: textBlock.text }, 200);
  } catch (e) {
    return json({ error: "exception", detail: String(e) }, 500);
  }
});

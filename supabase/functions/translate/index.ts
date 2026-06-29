// BODYUP — Edge Function "translate"
// Traduit une liste de textes en français via Claude. Clé en secret serveur.
// Réservé aux utilisateurs connectés.

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

const schema = {
  type: "object",
  additionalProperties: false,
  properties: { translations: { type: "array", items: { type: "string" } } },
  required: ["translations"],
};

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
    const { texts } = await req.json();
    if (!Array.isArray(texts) || !texts.length) return json({ error: "missing_texts" }, 400);

    const prompt = `Traduis en français naturel et culinaire CHAQUE chaîne du tableau ci-dessous.
Renvoie EXACTEMENT le même nombre d'éléments, dans le MÊME ORDRE. Ne fusionne pas, n'ajoute rien, ne numérote pas.
Tableau JSON : ${JSON.stringify(texts)}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        output_config: { format: { type: "json_schema", schema } },
        messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      }),
    });
    if (!res.ok) { const detail = await res.text(); return json({ error: "anthropic_error", status: res.status, detail }, 502); }
    const data = await res.json();
    if (data.stop_reason === "refusal") return json({ error: "refused" }, 422);
    const textBlock = (data.content ?? []).find((x: { type: string }) => x.type === "text");
    if (!textBlock?.text) return json({ error: "empty_response" }, 502);
    return json(JSON.parse(textBlock.text), 200);
  } catch (e) {
    return json({ error: "exception", detail: String(e) }, 500);
  }
});

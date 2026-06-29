// BODYUP — Edge Function "analyze-food"
// Proxy sécurisé vers l'API Claude (vision). La clé Anthropic reste ICI,
// côté serveur, dans le secret ANTHROPIC_API_KEY — jamais dans le front.
// N'autorise QUE les utilisateurs connectés (vérification du jeton Supabase),
// pour éviter qu'un tiers consomme ton crédit Claude.

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = Deno.env.get("ANTHROPIC_MODEL") ?? "claude-opus-4-8";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL"); // injecté automatiquement par Supabase

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: "string", description: "Nom du plat en français" },
    confidence: { type: "number", description: "Confiance 0–1" },
    grams: { type: "number", description: "Portion totale estimée en grammes" },
    kcal: { type: "integer" },
    protein: { type: "integer" },
    carbs: { type: "integer" },
    fat: { type: "integer" },
    score: { type: "integer", description: "Note santé de 0 (mauvais) à 100 (excellent)" },
    advice: { type: "string", description: "Avis nutritionnel court (1 phrase) en français" },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          grams: { type: "number" },
          kcal: { type: "integer" },
        },
        required: ["name", "grams", "kcal"],
      },
    },
  },
  required: ["name", "confidence", "grams", "kcal", "protein", "carbs", "fat", "score", "advice", "items"],
};

const PROMPT = `Tu es un nutritionniste. Analyse la photo de nourriture et estime au mieux :
- le nom du plat (en français),
- la portion totale visible en grammes,
- les calories totales (kcal) et les macros (protéines, glucides, lipides en grammes) pour CETTE portion,
- une note santé "score" de 0 à 100 (qualité nutritionnelle globale du plat),
- un "advice" : un avis nutritionnel court et utile en français (1 phrase),
- la liste des aliments distincts identifiés.
Donne une estimation réaliste même si l'image est imparfaite. confidence reflète ta certitude (0 à 1).
Ce sont des estimations, pas un avis médical.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!ANTHROPIC_API_KEY) return json({ error: "server_not_configured" }, 500);

  // --- Exiger un utilisateur connecté ---
  const authHeader = req.headers.get("Authorization");
  const apikey = req.headers.get("apikey") ?? "";
  if (!authHeader || !SUPABASE_URL) return json({ error: "unauthorized" }, 401);
  const who = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: authHeader, apikey },
  });
  if (!who.ok) return json({ error: "unauthorized" }, 401);

  try {
    const { image, mediaType } = await req.json();
    if (!image || typeof image !== "string") return json({ error: "missing_image" }, 400);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        output_config: { format: { type: "json_schema", schema } },
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType ?? "image/jpeg", data: image } },
              { type: "text", text: PROMPT },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return json({ error: "anthropic_error", status: res.status, detail }, 502);
    }

    const data = await res.json();
    if (data.stop_reason === "refusal") return json({ error: "refused" }, 422);

    const textBlock = (data.content ?? []).find((b: { type: string }) => b.type === "text");
    if (!textBlock?.text) return json({ error: "empty_response" }, 502);

    return json(JSON.parse(textBlock.text), 200);
  } catch (e) {
    return json({ error: "exception", detail: String(e) }, 500);
  }
});

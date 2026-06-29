// BODYUP — Edge Function "suggest-meals"
// Génère des idées de repas via Claude, adaptées au profil et aux macros restantes.
// Clé Anthropic en secret serveur (ANTHROPIC_API_KEY). Réservé aux utilisateurs connectés.

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
  properties: {
    meals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          emoji: { type: "string" },
          kcal: { type: "integer" },
          protein: { type: "integer" },
          carbs: { type: "integer" },
          fat: { type: "integer" },
          time: { type: "integer", description: "Temps de préparation en minutes" },
          tag: { type: "string", description: "Court atout, ex: Riche en protéines" },
          ingredients: { type: "array", items: { type: "string" }, description: "Ingrédients AVEC quantités, ex: '150 g de poulet'" },
          steps: { type: "array", items: { type: "string" }, description: "Étapes de préparation claires, une par élément" },
        },
        required: ["name", "emoji", "kcal", "protein", "carbs", "fat", "time", "tag", "ingredients", "steps"],
      },
    },
  },
  required: ["meals"],
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
    const b = await req.json();
    const mealType: string = b.mealType ?? "repas";
    const diet: string = b.diet ?? "omnivore";
    const allergies: string[] = Array.isArray(b.allergies) ? b.allergies : [];
    const goal: string = b.goal ?? "maintien";
    const r = b.remaining ?? {};
    const count: number = Math.min(Math.max(Number(b.count ?? 3), 1), 4);

    const prompt = `Tu es un nutritionniste. Propose ${count} idées de "${mealType}" en français, adaptées au profil et qui se rapprochent AU MIEUX de ce qu'il reste à consommer aujourd'hui.
Reste à consommer : ~${Math.round(r.kcal ?? 0)} kcal, ${Math.round(r.protein ?? 0)} g protéines, ${Math.round(r.carbs ?? 0)} g glucides, ${Math.round(r.fat ?? 0)} g lipides.
Objectif de l'utilisateur : ${goal}. Régime : ${diet}. À EXCLURE absolument (allergies/intolérances) : ${allergies.length ? allergies.join(", ") : "aucune"}.
Pour chaque repas, vise des valeurs proches des macros restantes (sans forcément les dépasser), donne un emoji pertinent, les kcal et macros, le temps de préparation, un atout court (tag), la liste des ingrédients AVEC leurs quantités (ex : "150 g de poulet", "1 c. à soupe d'huile d'olive") et les étapes de préparation détaillées (tableau "steps", une étape claire par élément). Recettes réalistes et faciles à suivre.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
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

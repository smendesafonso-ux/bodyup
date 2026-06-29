// BODYUP — Edge Function "suggest-meals"
// Génère des recettes via Claude, en français, adaptées au profil, aux macros
// restantes ET au garde-manger (ingrédients have/buy). Variété forcée.
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
          time: { type: "integer" },
          tag: { type: "string" },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string", description: "Ingrédient AVEC quantité, ex: '150 g de poulet'" },
                have: { type: "boolean", description: "true si déjà dans le garde-manger, false si à acheter" },
              },
              required: ["name", "have"],
            },
          },
          steps: { type: "array", items: { type: "string" } },
        },
        required: ["name", "emoji", "kcal", "protein", "carbs", "fat", "time", "tag", "ingredients", "steps"],
      },
    },
  },
  required: ["meals"],
};

const CUISINES = ["méditerranéenne", "asiatique", "mexicaine", "indienne", "française", "italienne", "moyen-orientale", "japonaise", "thaï", "marocaine", "espagnole", "grecque"];
const pick = (n: number) => [...CUISINES].sort(() => Math.random() - 0.5).slice(0, n);

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
    const pantry: string[] = Array.isArray(b.pantry) ? b.pantry : [];
    const exclude: string[] = Array.isArray(b.exclude) ? b.exclude : [];
    const count: number = Math.min(Math.max(Number(b.count ?? 3), 1), 4);
    const seed = b.seed ?? Math.random();

    const prompt = `Tu es un chef nutritionniste. Propose ${count} idées de "${mealType}" EN FRANÇAIS, adaptées et proches de ce qu'il reste à consommer aujourd'hui.
Reste à consommer : ~${Math.round(r.kcal ?? 0)} kcal, ${Math.round(r.protein ?? 0)} g protéines, ${Math.round(r.carbs ?? 0)} g glucides, ${Math.round(r.fat ?? 0)} g lipides.
Objectif : ${goal}. Régime : ${diet}. À EXCLURE (allergies) : ${allergies.length ? allergies.join(", ") : "aucune"}.

GARDE-MANGER de l'utilisateur (ingrédients déjà disponibles) : ${pantry.length ? pantry.join(", ") : "non renseigné"}.
- Privilégie des recettes qui utilisent ces ingrédients du garde-manger.
- Pour CHAQUE ingrédient d'une recette : "name" inclut la quantité (ex "150 g de poulet"), et "have"=true s'il correspond (même approximativement) à un ingrédient du garde-manger, sinon "have"=false (= à acheter).

VARIÉTÉ (très important) : sois original et varié. NE REPROPOSE PAS ces recettes déjà vues : ${exclude.length ? exclude.join(" ; ") : "aucune"}.
Varie les cuisines (par ex. ${pick(3).join(", ")}), les sources de protéines et les techniques d'une proposition à l'autre. Graine d'aléa unique : ${seed}.

Pour chaque repas : un emoji pertinent, kcal et macros proches des valeurs restantes, le temps de préparation (min), un atout court (tag), les ingrédients (avec have), et des étapes de préparation détaillées (une étape claire par élément). Recettes réalistes et faciles.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 3000,
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

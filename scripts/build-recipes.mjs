// Build-time : récupère TheMealDB, traduit en FR (MyMemory, gratuit), écrit lib/recipes-fr.json
// Résumable : le cache de traduction (scripts/.trcache.json) permet de relancer sans tout refaire.
// Usage : node scripts/build-recipes.mjs [LIMIT]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CACHE = join(__dirname, ".trcache.json");
const OUT = join(ROOT, "lib", "recipes-fr.json");
const LIMIT = parseInt(process.argv[2] || "70", 10);
const EMAIL = "app@bodyup.fr"; // augmente le quota gratuit MyMemory

const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
let sinceSave = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const saveCache = () => writeFileSync(CACHE, JSON.stringify(cache));

function chunkText(text, max = 480) {
  if (text.length <= max) return [text];
  const out = [];
  let cur = "";
  for (const part of text.split(/(?<=[.!?])\s+/)) {
    if ((cur + " " + part).length > max) { if (cur) out.push(cur.trim()); cur = part; }
    else cur += " " + part;
    while (cur.length > max) { out.push(cur.slice(0, max)); cur = cur.slice(max); }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function mmCall(q) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=en|fr&de=${EMAIL}`;
    let j;
    try { j = await (await fetch(url)).json(); } catch { await sleep(1500 * (attempt + 1)); continue; }
    const txt = j?.responseData?.translatedText ?? "";
    if (typeof txt === "string" && /MYMEMORY WARNING|YOU USED ALL|QUERY LENGTH LIMIT|TOO MANY/i.test(txt)) throw new Error("QUOTA: " + txt);
    if ((j.responseStatus == 200) && txt) { await sleep(220); return txt; }
    await sleep(1500 * (attempt + 1));
  }
  return q; // échec doux : garde l'original
}

async function tr(text) {
  text = (text || "").trim();
  if (!text) return "";
  if (cache[text]) return cache[text];
  const parts = chunkText(text);
  const res = [];
  for (const p of parts) res.push(await mmCall(p));
  const joined = res.join(" ").replace(/\s+/g, " ").trim();
  cache[text] = joined;
  if (++sinceSave >= 10) { saveCache(); sinceSave = 0; }
  return joined;
}

function shuffleSeeded(arr, seed) {
  const a = [...arr]; let st = seed >>> 0;
  const rng = () => { st = (st * 1664525 + 1013904223) >>> 0; return st / 4294967296; };
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const AREA = { American: "Américaine", British: "Britannique", Canadian: "Canadienne", Chinese: "Chinoise", Croatian: "Croate", Dutch: "Néerlandaise", Egyptian: "Égyptienne", Filipino: "Philippine", French: "Française", Greek: "Grecque", Indian: "Indienne", Irish: "Irlandaise", Italian: "Italienne", Jamaican: "Jamaïcaine", Japanese: "Japonaise", Kenyan: "Kényane", Malaysian: "Malaisienne", Mexican: "Mexicaine", Moroccan: "Marocaine", Polish: "Polonaise", Portuguese: "Portugaise", Russian: "Russe", Spanish: "Espagnole", Thai: "Thaïlandaise", Tunisian: "Tunisienne", Turkish: "Turque", Ukrainian: "Ukrainienne", Vietnamese: "Vietnamienne", Unknown: "Recette du monde" };
const CAT = {
  Breakfast: { meal: "petit-dej", emoji: "🍳", k: 350, p: 15, c: 40, f: 12, t: 15 },
  Dessert: { meal: "collation", emoji: "🍰", k: 300, p: 6, c: 42, f: 12, t: 20 },
  Side: { meal: "collation", emoji: "🥗", k: 220, p: 7, c: 28, f: 9, t: 15 },
  Starter: { meal: "dejeuner", emoji: "🍲", k: 280, p: 13, c: 26, f: 11, t: 20 },
  Beef: { meal: "diner", emoji: "🥩", k: 520, p: 38, c: 24, f: 28, t: 35 },
  Chicken: { meal: "dejeuner", emoji: "🍗", k: 480, p: 40, c: 30, f: 18, t: 30 },
  Pork: { meal: "diner", emoji: "🥓", k: 520, p: 35, c: 24, f: 30, t: 35 },
  Lamb: { meal: "diner", emoji: "🍖", k: 540, p: 38, c: 22, f: 32, t: 40 },
  Goat: { meal: "diner", emoji: "🍖", k: 520, p: 38, c: 20, f: 30, t: 40 },
  Seafood: { meal: "dejeuner", emoji: "🐟", k: 420, p: 35, c: 20, f: 18, t: 25 },
  Pasta: { meal: "dejeuner", emoji: "🍝", k: 560, p: 22, c: 72, f: 16, t: 25 },
  Vegetarian: { meal: "dejeuner", emoji: "🥗", k: 430, p: 16, c: 55, f: 15, t: 25 },
  Vegan: { meal: "diner", emoji: "🥦", k: 400, p: 15, c: 55, f: 12, t: 25 },
  Miscellaneous: { meal: "dejeuner", emoji: "🍽️", k: 450, p: 20, c: 45, f: 18, t: 30 },
};
const DEF = { meal: "dejeuner", emoji: "🍽️", k: 450, p: 20, c: 45, f: 18, t: 30 };

function frMeasure(s) {
  return (s || "").replace(/\btablespoons?\b|\btbs\b|\btbsp\b/gi, "c. à soupe").replace(/\bteaspoons?\b|\btsp\b/gi, "c. à café")
    .replace(/\bcups?\b/gi, "tasse").replace(/\bcloves?\b/gi, "gousses").replace(/\bpinch\b/gi, "pincée")
    .replace(/\bhandful\b/gi, "poignée").replace(/\bsliced\b/gi, "tranché").replace(/\bchopped\b/gi, "haché")
    .replace(/\bpound(s)?\b|\blb(s)?\b/gi, "livre").replace(/\bdiced\b/gi, "en dés").trim();
}

async function fetchAll() {
  const seen = new Map();
  for (const l of "abcdefghijklmnopqrstuvwxyz") {
    try {
      const r = await (await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${l}`)).json();
      for (const m of (r.meals || [])) if (!seen.has(m.idMeal)) seen.set(m.idMeal, m);
    } catch { /* ignore */ }
    await sleep(120);
  }
  return [...seen.values()];
}

async function buildRecipe(m) {
  const cat = CAT[m.strCategory] || DEF;
  const ings = [];
  for (let i = 1; i <= 20; i++) {
    const name = (m[`strIngredient${i}`] || "").trim();
    const meas = (m[`strMeasure${i}`] || "").trim();
    if (!name) continue;
    const frName = await tr(name);
    const frMeas = frMeasure(meas);
    ings.push(frMeas ? `${frMeas} ${frName}` : frName);
  }
  let parts = (m.strInstructions || "").split(/\r?\n+/).map((s) => s.replace(/^STEP\s*\d+[:.)]?/i, "").trim()).filter(Boolean);
  if (parts.length <= 1) parts = (m.strInstructions || "").split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  parts = parts.slice(0, 8);
  const steps = [];
  for (const p of parts) steps.push(await tr(p));
  return {
    id: "tmdb-" + m.idMeal,
    name: await tr(m.strMeal),
    emoji: cat.emoji,
    photo: m.strMealThumb,
    video: m.strYoutube || "",
    meal: cat.meal,
    time: cat.t,
    kcal: cat.k, protein: cat.p, carbs: cat.c, fat: cat.f,
    tag: AREA[m.strArea] || "Recette du monde",
    ingredients: ings,
    steps,
  };
}

(async () => {
  console.log("Fetch TheMealDB…");
  const meals = await fetchAll();
  console.log("Total meals:", meals.length, "→ on en prend", LIMIT);
  const picked = shuffleSeeded(meals, 4242).slice(0, LIMIT);
  const out = [];
  try {
    for (const m of picked) {
      const rec = await buildRecipe(m);
      if (rec.steps.length && rec.ingredients.length) out.push(rec);
      console.log(`${out.length}/${LIMIT}`, rec.name);
    }
  } catch (e) {
    console.error("⏸ Arrêt (quota ?) :", e.message, "— on écrit ce qui est déjà traduit.");
  }
  saveCache();
  writeFileSync(OUT, JSON.stringify(out, null, 0));
  console.log("✅ Écrit", out.length, "recettes →", OUT);
})();

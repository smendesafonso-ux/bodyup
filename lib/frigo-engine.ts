// Moteur du module de révision « fluides frigo » : progression + sélection adaptative.
// Tout est stocké en localStorage (outil personnel, aucun serveur requis).

import { QUESTIONS, THEMES, type Question, type ThemeId } from "./frigo-data";

const KEY = "frigo_progress_v1";

export interface ThemeStat {
  mastery: number;  // 0–100, part de 50
  seen: number;
  correct: number;
}
export interface QuizRecord {
  ts: number;
  score: number;
  total: number;
  weakTheme: ThemeId;
}
export interface Progress {
  xp: number;
  bestStreak: number;
  themes: Record<ThemeId, ThemeStat>;
  history: QuizRecord[];
  badges: string[];
  answered: number;
}

const emptyThemes = (): Record<ThemeId, ThemeStat> =>
  Object.fromEntries(THEMES.map((t) => [t.id, { mastery: 50, seen: 0, correct: 0 }])) as Record<ThemeId, ThemeStat>;

export function loadProgress(): Progress {
  if (typeof window === "undefined") return blank();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const p = JSON.parse(raw) as Progress;
    // fusion défensive si de nouveaux thèmes apparaissent
    const themes = emptyThemes();
    for (const t of THEMES) if (p.themes?.[t.id]) themes[t.id] = p.themes[t.id];
    return { ...blank(), ...p, themes };
  } catch {
    return blank();
  }
}

function blank(): Progress {
  return { xp: 0, bestStreak: 0, themes: emptyThemes(), history: [], badges: [], answered: 0 };
}

export function saveProgress(p: Progress) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* quota — ignore */ }
}

export function resetProgress(): Progress {
  const b = blank();
  saveProgress(b);
  return b;
}

// Maîtrise moyenne pondérée = niveau global (0–100)
export function globalMastery(p: Progress): number {
  const vals = THEMES.map((t) => p.themes[t.id].mastery);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

// Niveau ludique basé sur l'XP
export const LEVELS = [
  { min: 0, name: "Apprenti", emoji: "🔧" },
  { min: 150, name: "Opérateur", emoji: "🧊" },
  { min: 400, name: "Technicien", emoji: "❄️" },
  { min: 800, name: "Frigoriste confirmé", emoji: "🛠️" },
  { min: 1400, name: "Expert F-Gas", emoji: "🏅" },
  { min: 2200, name: "Maître du froid", emoji: "👑" },
];
export function levelFor(xp: number) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].min) idx = i;
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1];
  const into = xp - cur.min;
  const span = next ? next.min - cur.min : 1;
  return { ...cur, idx, next, progress: next ? Math.min(into / span, 1) : 1, toNext: next ? next.min - xp : 0 };
}

/* ----- Mise à jour de la maîtrise après une réponse ----- */
// Correct → on se rapproche de 100 (plus vite si la question était difficile).
// Faux → on descend (plus fort si la question était facile : une erreur facile pèse).
export function updateMastery(m: number, correct: boolean, d: 1 | 2 | 3): number {
  if (correct) {
    const gain = (100 - m) * (0.18 + d * 0.06);
    return Math.min(100, Math.round(m + gain));
  }
  const loss = m * (0.34 - d * 0.05);
  return Math.max(0, Math.round(m - loss));
}

/* ----- Sélection adaptative des questions d'un quiz ----- */
// Pondération par faiblesse : plus un thème est mal maîtrisé, plus il a de chances d'être tiré.
// La difficulté visée suit le niveau de maîtrise du thème (on ne noie pas un débutant sous du niveau 3).
export function pickQuiz(p: Progress, count: number, forceTheme?: ThemeId): Question[] {
  const pool = forceTheme ? QUESTIONS.filter((q) => q.theme === forceTheme) : [...QUESTIONS];
  const picked: Question[] = [];
  const used = new Set<string>();

  const themeWeight = (t: ThemeId) => {
    const m = p.themes[t].mastery;
    return Math.pow((100 - m) + 12, 1.3); // base 12 pour que les thèmes maîtrisés reviennent parfois
  };

  const targetDiff = (t: ThemeId): 1 | 2 | 3 => {
    const m = p.themes[t].mastery;
    if (m < 40) return 1;
    if (m < 70) return 2;
    return 3;
  };

  const themes = forceTheme ? [forceTheme] : THEMES.map((t) => t.id);

  for (let n = 0; n < count && used.size < pool.length; n++) {
    // 1) choisir un thème pondéré par la faiblesse
    let theme: ThemeId;
    if (forceTheme) {
      theme = forceTheme;
    } else {
      const weights = themes.map(themeWeight);
      const total = weights.reduce((a, b) => a + b, 0);
      let r = pseudoRandom(p.answered + n) * total;
      theme = themes[0];
      for (let i = 0; i < themes.length; i++) { r -= weights[i]; if (r <= 0) { theme = themes[i]; break; } }
    }

    // 2) dans ce thème, préférer une question non utilisée proche de la difficulté cible
    const want = targetDiff(theme);
    const candidates = pool.filter((q) => q.theme === theme && !used.has(q.id));
    if (candidates.length === 0) {
      // repli : n'importe quelle question restante
      const any = pool.find((q) => !used.has(q.id));
      if (!any) break;
      used.add(any.id); picked.push(any); continue;
    }
    candidates.sort((a, b) => Math.abs(a.d - want) - Math.abs(b.d - want));
    // un peu d'aléa parmi les meilleures pour ne pas figer l'ordre
    const top = candidates.slice(0, Math.min(3, candidates.length));
    const chosen = top[Math.floor(pseudoRandom(p.answered * 7 + n * 13) * top.length)];
    used.add(chosen.id);
    picked.push(chosen);
  }

  // mélange final
  return shuffle(picked, p.answered + count);
}

// Aléa déterministe léger (évite Math.random qui casserait un rendu SSR/hydration)
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 999.13 + 17.7) * 43758.5453;
  return x - Math.floor(x);
}
function shuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom(seed + i) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ----- Badges débloqués ----- */
export const BADGE_DEFS: { id: string; emoji: string; name: string; test: (p: Progress) => boolean }[] = [
  { id: "first", emoji: "🎯", name: "Premier quiz terminé", test: (p) => p.history.length >= 1 },
  { id: "streak5", emoji: "🔥", name: "Série de 5 bonnes réponses", test: (p) => p.bestStreak >= 5 },
  { id: "streak10", emoji: "⚡", name: "Série de 10", test: (p) => p.bestStreak >= 10 },
  { id: "perfect", emoji: "💯", name: "Un quiz parfait", test: (p) => p.history.some((h) => h.score === h.total && h.total >= 5) },
  { id: "mastery70", emoji: "🧊", name: "Niveau global ≥ 70 %", test: (p) => globalMastery(p) >= 70 },
  { id: "mastery90", emoji: "👑", name: "Niveau global ≥ 90 %", test: (p) => globalMastery(p) >= 90 },
  { id: "grind", emoji: "📚", name: "100 questions répondues", test: (p) => p.answered >= 100 },
  { id: "allthemes", emoji: "🌍", name: "Tous les thèmes ≥ 60 %", test: (p) => THEMES.every((t) => p.themes[t.id].mastery >= 60) },
];

export function refreshBadges(p: Progress): string[] {
  const unlocked = new Set(p.badges);
  const fresh: string[] = [];
  for (const b of BADGE_DEFS) if (!unlocked.has(b.id) && b.test(p)) { unlocked.add(b.id); fresh.push(b.id); }
  p.badges = [...unlocked];
  return fresh; // badges nouvellement débloqués (pour l'animation)
}

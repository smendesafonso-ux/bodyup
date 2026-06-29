"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import s from "@/styles/mobile.module.css";
import { Icon, type IconName } from "./Icon";
import { CalorieRing } from "./CalorieRing";
import { fr } from "@/lib/nutrition";
import { useAuth } from "@/lib/auth";
import { useDay, type NewFood } from "@/lib/useDay";
import { searchFoods, lookupBarcode, type FoodHit } from "@/lib/foods";
import { analyzeFoodPhoto, type FoodAnalysis } from "@/lib/vision";
import type { Profile } from "@/lib/supabase";
import { workouts, recipes, coachThread, coachChips, badges, shoppingList, progressTimeline } from "@/lib/data";

type Tab = "home" | "journal" | "repas" | "scan" | "exo" | "coach" | "stats" | "profil" | "courses" | "progress";
type Day = ReturnType<typeof useDay>;
type MealKey = "petit-dej" | "dejeuner" | "collation" | "diner";

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "home", label: "Accueil", icon: "home" },
  { id: "journal", label: "Journal", icon: "journal" },
  { id: "repas", label: "Repas IA", icon: "meals" },
  { id: "scan", label: "Scan", icon: "camera" },
  { id: "exo", label: "Exercices", icon: "exo" },
  { id: "coach", label: "Coach IA", icon: "spark" },
  { id: "stats", label: "Stats", icon: "stats" },
];

const MEAL_DEFS: { key: MealKey; emoji: string; tint: string; name: string; color: string }[] = [
  { key: "petit-dej", emoji: "🍳", tint: "rgba(255,194,75,.13)", name: "Petit-déjeuner", color: "var(--amber)" },
  { key: "dejeuner", emoji: "🥗", tint: "rgba(201,255,60,.13)", name: "Déjeuner", color: "var(--lime)" },
  { key: "collation", emoji: "🍎", tint: "rgba(255,122,83,.13)", name: "Collation", color: "var(--coral)" },
  { key: "diner", emoji: "🌙", tint: "rgba(183,155,255,.13)", name: "Dîner", color: "var(--violet)" },
];

const macroGoals = (target: number) => ({
  p: Math.round((target * 0.3) / 4),
  c: Math.round((target * 0.4) / 4),
  f: Math.round((target * 0.3) / 9),
});

export default function MobileApp() {
  const { profile, user } = useAuth();
  const day = useDay(user?.id);
  const [tab, setTab] = useState<Tab>("home");
  const [addMeal, setAddMeal] = useState<MealKey | null>(null);

  const target = profile?.calorie_target ?? 2000;

  return (
    <div className={s.stage}>
      <aside className={s.pitch}>
        <div className={s.brandmark}>
          <span className={s.logoDot}><Icon name="check" size={24} style={{ color: "#0a1400" }} /></span>
          <b>BODYUP</b>
        </div>
        <h1>Ton coach santé <em>IA</em>, dans une seule main.</h1>
        <p>Nutrition, activité, hydratation et accompagnement personnalisé. Tes données sont synchronisées sur tous tes appareils.</p>
        <div className={s.pillrow}>
          <span className={s.pill}><span className={s.d} />Compte synchronisé</span>
          <span className={s.pill}><span className={s.d} style={{ background: "var(--coral)" }} />Journal sauvegardé</span>
          <span className={s.pill}><span className={s.d} style={{ background: "var(--sky)" }} />Plan personnalisé</span>
        </div>
        <div className={s.demolinks}>
          <Link href="/tablet" className={s.alt}><Icon name="tablet" size={16} /> Version tablette</Link>
        </div>
      </aside>

      <div className={s.phone}>
        <div className={s.screen}>
          <StatusBar />
          <div className={s.view}>
            <div className={s.page} key={tab}>
              {tab === "home" && <HomeScreen profile={profile} day={day} target={target} onAvatar={() => setTab("profil")} />}
              {tab === "journal" && <JournalScreen day={day} onAdd={(m) => setAddMeal(m)} />}
              {tab === "repas" && <RepasScreen day={day} go={setTab} />}
              {tab === "scan" && <ScanScreen day={day} />}
              {tab === "exo" && <ExoScreen day={day} target={target} />}
              {tab === "coach" && <CoachScreen />}
              {tab === "stats" && <StatsScreen profile={profile} go={setTab} />}
              {tab === "profil" && <ProfilScreen profile={profile} email={user?.email ?? ""} />}
              {tab === "courses" && <CoursesScreen back={() => setTab("repas")} />}
              {tab === "progress" && <ProgressScreen profile={profile} back={() => setTab("stats")} />}
            </div>
          </div>

          {addMeal && (
            <AddFoodSheet
              defaultMeal={addMeal}
              onClose={() => setAddMeal(null)}
              onSave={async (food) => { await day.addEntry(food); setAddMeal(null); setTab("journal"); }}
            />
          )}

          <nav className={s.tabbar}>
            <div className={s.tabinner}>
              {TABS.map((t) =>
                t.id === "scan" ? (
                  <button key={t.id} className={`${s.tab} ${s.scan} ${tab === t.id ? s.on : ""}`} onClick={() => setTab(t.id)}>
                    <span className={s.fab}><Icon name="camera" /></span>Scan
                  </button>
                ) : (
                  <button key={t.id} className={`${s.tab} ${tab === t.id ? s.on : ""}`} onClick={() => setTab(t.id)}>
                    <Icon name={t.icon} />{t.label}
                  </button>
                )
              )}
            </div>
          </nav>
        </div>
      </div>

      <div className={s.hint}>App connectée · données synchronisées via Supabase</div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className={s.statusbar}>
      <span>9:41</span>
      <span className={s.ic}>
        <svg viewBox="0 0 18 13" fill="currentColor"><rect x="0" y="8" width="3" height="5" rx="1" /><rect x="5" y="5" width="3" height="8" rx="1" /><rect x="10" y="2" width="3" height="11" rx="1" /><rect x="15" y="0" width="3" height="13" rx="1" opacity=".4" /></svg>
        <svg viewBox="0 0 26 13" fill="none"><rect x="1" y="1" width="21" height="11" rx="3" stroke="currentColor" opacity=".5" /><rect x="3" y="3" width="16" height="7" rx="1.5" fill="currentColor" /></svg>
      </span>
    </div>
  );
}

/* ---------------- ACCUEIL ---------------- */
function HomeScreen({ profile, day, target, onAvatar }: { profile: Profile | null; day: Day; target: number; onAvatar: () => void }) {
  const remaining = target - day.consumed + day.burned;
  const goals = macroGoals(target);
  const name = profile?.display_name ?? "toi";
  const initials = (name[0] ?? "?").toUpperCase();
  const pct = (v: number, g: number) => Math.min(Math.round((v / g) * 100), 100);

  return (
    <>
      <div className={`${s.phead} ${s.r} ${s.r1}`}>
        <div>
          <div className={s.hi}>Bonjour</div>
          <h2>{name}</h2>
          <span className={s.flame}><Icon name="flame" size={14} /> {day.consumed > 0 ? "Journée en cours" : "Commence ta journée"}</span>
        </div>
        <button className={s.ava} onClick={onAvatar} style={{ cursor: "pointer", border: "1px solid var(--card-bd)" }}>{initials}</button>
      </div>

      <div className={`${s.hero} ${s.r} ${s.r2}`}>
        <div className={s.ringwrap}>
          <CalorieRing value={Math.max(remaining, 0)} fraction={remaining / target} trigger={`${day.consumed}-${day.burned}`} />
          <div className={s.statlist}>
            <div className={s.statline}><span className={s.dot} style={{ background: "var(--lime)" }} /><div className={s.t}><span>Objectif</span><b>{fr(target)}</b></div></div>
            <div className={s.statline}><span className={s.dot} style={{ background: "var(--coral)" }} /><div className={s.t}><span>Consommé</span><b>{fr(day.consumed)}</b></div></div>
            <div className={s.statline}><span className={s.dot} style={{ background: "var(--sky)" }} /><div className={s.t}><span>Brûlé</span><b>+{fr(day.burned)}</b></div></div>
          </div>
        </div>
      </div>

      <div className={`${s.macros} ${s.r} ${s.r3}`}>
        <MacroBar label="Protéines" val={day.macros.p} max={goals.p} pct={pct(day.macros.p, goals.p)} color="var(--lime)" />
        <MacroBar label="Glucides" val={day.macros.c} max={goals.c} pct={pct(day.macros.c, goals.c)} color="var(--amber)" />
        <MacroBar label="Lipides" val={day.macros.f} max={goals.f} pct={pct(day.macros.f, goals.f)} color="var(--coral)" />
      </div>

      <div className={`${s.mgrid} ${s.r} ${s.r4}`}>
        <Metric icon="trend" tint="rgba(201,255,60,.12)" color="var(--lime)" v={profile?.weight_kg ? String(profile.weight_kg) : "—"} unit=" kg" k={`Cible ${profile?.target_kg ?? "—"} kg`} />
        <Metric icon="flameLine" tint="rgba(255,122,83,.12)" color="var(--coral)" v={fr(day.burned)} unit=" kcal" k="Brûlées aujourd'hui" />
        <Metric icon="clock" tint="rgba(91,209,255,.12)" color="var(--sky)" v={fr(Math.max(remaining, 0))} unit=" kcal" k="Restantes" />
        <Metric icon="check" tint="rgba(183,155,255,.12)" color="var(--violet)" v={String(day.entries.length)} unit=" repas" k="Enregistrés" />
      </div>

      <div className={`${s.water} ${s.r} ${s.r5}`}>
        <div className={s.lab}><b>{(day.glasses * 0.25).toFixed(1)} L</b>/ 2.0 L</div>
        <div className={s.glasses}>
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className={`${s.gl} ${i < day.glasses ? s.f : ""}`} />)}
        </div>
        <button className={s.addw} onClick={() => day.setWater(1)}>+</button>
      </div>

      <div className={`${s.sectionH} ${s.r} ${s.r6}`}><h3>Analyse IA</h3></div>
      <div className={`${s.insight} ${s.r} ${s.r6}`}>
        <div className={s.orb}><Icon name="spark" size={20} /></div>
        <div>
          <p>{insightText(remaining, day.macros.p, goals.p)}</p>
          <span className={s.tag}>Calculé à partir de ton journal du jour</span>
        </div>
      </div>
    </>
  );
}

function insightText(remaining: number, prot: number, protGoal: number) {
  if (remaining < 0) return <>Tu as <b>dépassé ton objectif</b> de {fr(-remaining)} kcal. Une marche ou une séance rééquilibrerait ta journée.</>;
  if (prot < protGoal * 0.6) return <>Il te reste <b>{fr(remaining)} kcal</b> et tu es en dessous de ton objectif protéines. Vise un repas riche en protéines.</>;
  return <>Bon rythme : <b>{fr(remaining)} kcal disponibles</b>. Continue comme ça pour rester dans ton objectif.</>;
}

function MacroBar({ label, val, max, pct, color }: { label: string; val: number; max: number; pct: number; color: string }) {
  return (
    <div className={s.macro}>
      <div className={s.top}><span>{label}</span><span><b>{val}</b>/{max}g</span></div>
      <div className={s.bar}><i style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

function Metric({ icon, tint, color, trend, v, unit, k }: { icon: IconName; tint: string; color: string; trend?: { txt: string; up: boolean }; v: string; unit: string; k: string }) {
  return (
    <div className={s.mcard}>
      {trend && <span className={`${s.trend} ${trend.up ? s.up : s.down}`}>{trend.txt}</span>}
      <div className={s.ico} style={{ background: tint, color }}><Icon name={icon} size={18} /></div>
      <div className={s.v}>{v}<small>{unit}</small></div>
      <div className={s.k}>{k}</div>
    </div>
  );
}

/* ---------------- JOURNAL ---------------- */
function JournalScreen({ day, onAdd }: { day: Day; onAdd: (m: MealKey) => void }) {
  const delay = [s.r1, s.r2, s.r3, s.r4];
  return (
    <>
      <div className={`${s.phead} ${s.r} ${s.r1}`}>
        <div><div className={s.hi}>Aujourd&apos;hui</div><h2>Journal</h2></div>
        <div className={s.ava} style={{ fontSize: 13, lineHeight: 1.1, textAlign: "center" }}>{fr(day.consumed)}<br /><span style={{ fontSize: 9, color: "var(--txt-2)" }}>kcal</span></div>
      </div>
      {MEAL_DEFS.map((m, i) => {
        const items = day.entries.filter((e) => e.meal_type === m.key);
        const sum = items.reduce((n, e) => n + e.kcal, 0);
        return (
          <div key={m.key} className={`${s.meal} ${s.r} ${delay[i]} ${items.length === 0 ? s.dashed : ""}`}>
            <div className={s.mh}>
              <div className={s.lft}>
                <div className={s.em} style={{ background: m.tint }}>{m.emoji}</div>
                <div><b>{m.name}</b><span>{items.length ? `${fr(sum)} kcal · ${items.length} aliment${items.length > 1 ? "s" : ""}` : "Non enregistré"}</span></div>
              </div>
              <div className={s.kc} style={{ color: items.length ? m.color : "var(--txt-3)" }}>{items.length ? fr(sum) : "—"}</div>
            </div>
            {items.map((it) => (
              <div key={it.id} className={s.fitem}>
                <div className={s.nm}>{it.name}{it.qty && <small>{it.qty}</small>}</div>
                <div className={s.c} style={{ display: "flex", alignItems: "center" }}>
                  {fr(it.kcal)} kcal
                  <button className={s.delx} onClick={() => day.deleteEntry(it.id)} aria-label="Supprimer">✕</button>
                </div>
              </div>
            ))}
            <button className={s.addmeal} onClick={() => onAdd(m.key)} style={items.length ? { marginTop: 10 } : undefined}>
              <Icon name="plus" size={16} /> Ajouter un aliment
            </button>
          </div>
        );
      })}
    </>
  );
}

/* ---------------- AJOUT D'ALIMENT (modal) ---------------- */
function AddFoodSheet({ defaultMeal, onClose, onSave }: { defaultMeal: MealKey; onClose: () => void; onSave: (f: NewFood) => Promise<void> }) {
  const [meal, setMeal] = useState<MealKey>(defaultMeal);
  const [mode, setMode] = useState<"search" | "manual">("search");
  const [busy, setBusy] = useState(false);

  // recherche
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [sel, setSel] = useState<FoodHit | null>(null);
  const [grams, setGrams] = useState("100");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // saisie manuelle
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [mp, setMp] = useState(""); const [mc, setMc] = useState(""); const [mf, setMf] = useState("");
  const [qty, setQty] = useState("");

  useEffect(() => {
    if (sel) return;
    if (query.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const r = await searchFoods(query);
      setResults(r); setSearching(false);
    }, 350);
    return () => clearTimeout(timer.current);
  }, [query, sel]);

  const g = parseFloat(grams) || 0;
  const factor = g / 100;
  const calc = sel ? {
    kcal: Math.round(sel.kcal100 * factor),
    p: Math.round(sel.p100 * factor),
    c: Math.round(sel.c100 * factor),
    f: Math.round(sel.f100 * factor),
  } : null;

  const saveSearch = async () => {
    if (!sel || !calc || g <= 0) return;
    setBusy(true);
    await onSave({
      meal_type: meal, name: sel.brand ? `${sel.name} (${sel.brand})` : sel.name, qty: `${g} g`,
      kcal: calc.kcal, protein: calc.p, carbs: calc.c, fat: calc.f,
    });
  };
  const saveManual = async () => {
    if (!name || !kcal) return;
    setBusy(true);
    await onSave({
      meal_type: meal, name, qty: qty || null,
      kcal: parseInt(kcal) || 0, protein: parseInt(mp) || 0, carbs: parseInt(mc) || 0, fat: parseInt(mf) || 0,
    });
  };

  return (
    <div className={s.modalwrap} onClick={onClose}>
      <div className={s.sheet} onClick={(e) => e.stopPropagation()}>
        <h3>Ajouter un aliment <span className={s.x} onClick={onClose}>✕</span></h3>
        <div className={s.mealpick}>
          {MEAL_DEFS.map((m) => (
            <button key={m.key} className={meal === m.key ? s.on : ""} onClick={() => setMeal(m.key)}>{m.emoji} {m.name.split("-")[0].split(" ")[0]}</button>
          ))}
        </div>

        {mode === "search" ? (
          <>
            {!sel && (
              <>
                <label>Rechercher un aliment</label>
                <input className={s.inp} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex : poulet, banane, Nutella…" autoFocus />
                {searching && <div className={s.searching}><span className={s.sp} /> Recherche…</div>}
                {!searching && results.length > 0 && (
                  <div className={s.results}>
                    {results.map((r, i) => (
                      <div key={i} className={s.ritem} onClick={() => { setSel(r); setResults([]); }}>
                        <div className={s.rn}>
                          <b>{r.name}</b>
                          <span>{r.brand ? `${r.brand} · ` : ""}{r.kcal100} kcal / 100 g</span>
                        </div>
                        <span className={`${s.srcbadge} ${r.source === "base" ? s.srcbase : s.srcoff}`}>{r.source === "base" ? "BODYUP" : "OFF"}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!searching && query.trim().length >= 2 && results.length === 0 && (
                  <div className={s.empty2}>Aucun résultat — essaie un autre terme ou la saisie manuelle.</div>
                )}
              </>
            )}

            {sel && calc && (
              <>
                <div className={s.selfood}>
                  <div className={s.sn}><b>{sel.name}</b><span>{sel.brand ? `${sel.brand} · ` : ""}{sel.kcal100} kcal / 100 g</span></div>
                  <button className={s.clear} onClick={() => { setSel(null); setGrams("100"); }} aria-label="Changer">✕</button>
                </div>
                <label>Quantité</label>
                <div className={s.gramrow}>
                  <input className={s.inp} type="number" inputMode="numeric" value={grams} onChange={(e) => setGrams(e.target.value)} />
                  <span className={s.u}>grammes</span>
                </div>
                <div className={s.calcprev}>
                  <div><b>{calc.kcal}</b><span>kcal</span></div>
                  <div><b>{calc.p}g</b><span>prot</span></div>
                  <div><b>{calc.c}g</b><span>gluc</span></div>
                  <div><b>{calc.f}g</b><span>lip</span></div>
                </div>
                <button className={s.savebtn} onClick={saveSearch} disabled={busy || g <= 0}>{busy ? "Ajout…" : "Ajouter au journal"}</button>
              </>
            )}

            <button className={s.switchmode} onClick={() => setMode("manual")}>Pas dans la liste ? <u>Saisie manuelle</u></button>
          </>
        ) : (
          <>
            <label>Aliment</label>
            <input className={s.inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Poulet grillé + riz" autoFocus />
            <label>Quantité (optionnel)</label>
            <input className={s.inp} value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Ex : 320 g" />
            <label>Calories (kcal)</label>
            <input className={s.inp} type="number" inputMode="numeric" value={kcal} onChange={(e) => setKcal(e.target.value)} placeholder="520" />
            <label>Macros (g) — protéines / glucides / lipides</label>
            <div className={s.row3}>
              <input className={s.inp} type="number" inputMode="numeric" value={mp} onChange={(e) => setMp(e.target.value)} placeholder="P" />
              <input className={s.inp} type="number" inputMode="numeric" value={mc} onChange={(e) => setMc(e.target.value)} placeholder="G" />
              <input className={s.inp} type="number" inputMode="numeric" value={mf} onChange={(e) => setMf(e.target.value)} placeholder="L" />
            </div>
            <button className={s.savebtn} onClick={saveManual} disabled={busy || !name || !kcal}>{busy ? "Ajout…" : "Ajouter au journal"}</button>
            <button className={s.switchmode} onClick={() => setMode("search")}><u>← Revenir à la recherche</u></button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- SCAN IA (photo Claude + code-barres) ---------------- */
function ScanScreen({ day }: { day: Day }) {
  const [mode, setMode] = useState(0);
  const [meal, setMeal] = useState<MealKey>("dejeuner");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [photo, setPhoto] = useState<FoodAnalysis | null>(null);
  const [bc, setBc] = useState<FoodHit | null>(null);
  const [code, setCode] = useState("");
  const [grams, setGrams] = useState("100");
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const modes: { icon: IconName; label: string }[] = [
    { icon: "camera", label: "Photo" }, { icon: "barcode", label: "Code-barres" }, { icon: "mic", label: "Vocal" },
  ];

  const reset = () => { setPhoto(null); setBc(null); setErr(null); setCode(""); setGrams("100"); setScanning(false); };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr(null); setPhoto(null);
    try {
      const r = await analyzeFoodPhoto(file);
      setPhoto(r); setGrams(String(Math.round(r.grams)));
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Analyse impossible. Réessaie.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const runBarcode = async (value?: string) => {
    const c = (value ?? code).trim();
    if (c.length < 6) return;
    setBusy(true); setErr(null); setBc(null);
    const hit = await lookupBarcode(c);
    setBusy(false);
    if (hit) { setBc(hit); setGrams("100"); }
    else setErr("Produit introuvable sur Open Food Facts. Essaie la photo ou la saisie manuelle.");
  };

  const g = parseFloat(grams) || 0;
  // photo : valeurs absolues pour la portion estimée → on met à l'échelle
  const pf = photo && photo.grams > 0 ? g / photo.grams : 0;
  const bf = g / 100;
  const calc = photo
    ? { kcal: Math.round(photo.kcal * pf), p: Math.round(photo.protein * pf), c: Math.round(photo.carbs * pf), f: Math.round(photo.fat * pf) }
    : bc
    ? { kcal: Math.round(bc.kcal100 * bf), p: Math.round(bc.p100 * bf), c: Math.round(bc.c100 * bf), f: Math.round(bc.f100 * bf) }
    : null;
  const resultName = photo ? photo.name : bc ? (bc.brand ? `${bc.name} (${bc.brand})` : bc.name) : "";

  const addToJournal = async () => {
    if (!calc || g <= 0) return;
    setBusy(true);
    await day.addEntry({ meal_type: meal, name: resultName, qty: `${g} g`, kcal: calc.kcal, protein: calc.p, carbs: calc.c, fat: calc.f });
    reset();
  };

  return (
    <>
      <div className={`${s.phead} ${s.r} ${s.r1}`}><div><div className={s.hi}>Reconnaissance par IA</div><h2>Scan</h2></div></div>
      <div className={`${s.scanmodes} ${s.r} ${s.r2}`}>
        {modes.map((m, i) => (
          <div key={m.label} className={`${s.smode} ${mode === i ? s.on : ""}`} onClick={() => { setMode(i); reset(); }}>
            <Icon name={m.icon} size={20} /><span>{m.label}</span>
          </div>
        ))}
      </div>

      {mode === 0 && (
        <>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
          <div className={`${s.cam} ${s.r} ${s.r3}`}>
            <div className={s.frame}><span /><span /><span /><span /></div>
            {!busy && (
              <div className={s.capture} onClick={() => fileRef.current?.click()}>
                <div className={s.cbtn}><Icon name="camera" size={32} /></div>
                <span>Prendre une photo de ton repas</span>
              </div>
            )}
            {busy && <div className={s.analyzing}><div className={s.asp} /><span>L&apos;IA analyse ton repas…</span></div>}
          </div>
        </>
      )}

      {mode === 1 && (
        <div className={`${s.r} ${s.r3}`}>
          {scanning ? (
            <BarcodeScanner
              onDetected={(v) => { setScanning(false); setCode(v); runBarcode(v); }}
              onClose={() => setScanning(false)}
              onUnsupported={() => { setScanning(false); setErr("Le scan caméra n'est pas disponible sur ce navigateur (souvent le cas sur iPhone/Safari). Saisis le numéro du code-barres à la main."); }}
            />
          ) : (
            <>
              <div className={s.bcform}>
                <input inputMode="numeric" placeholder="Saisis le code-barres" value={code} onChange={(e) => setCode(e.target.value)} />
                <button onClick={() => runBarcode()} disabled={busy}>{busy ? "…" : "Chercher"}</button>
              </div>
              <button className={s.scanbcbtn} onClick={() => { setErr(null); setScanning(true); }}>
                <Icon name="camera" size={18} /> Scanner avec la caméra
              </button>
            </>
          )}
        </div>
      )}

      {mode === 2 && (
        <div className={`${s.scanerr} ${s.r} ${s.r3}`} style={{ background: "rgba(183,155,255,.1)", borderColor: "rgba(183,155,255,.3)", color: "var(--txt)" }}>
          La saisie vocale arrive bientôt. En attendant, utilise la photo ou la recherche d&apos;aliments dans le Journal.
        </div>
      )}

      {err && <div className={`${s.scanerr} ${s.r}`}>{err}</div>}

      {calc && (
        <div className={`${s.scancard} ${s.r}`}>
          <div className={s.ttl}><b>{resultName}</b>{photo && <span className={s.conf}>{Math.round(photo.confidence * 100)}% sûr</span>}</div>
          <div className={s.qtyrow}>
            <input type="number" inputMode="numeric" value={grams} onChange={(e) => setGrams(e.target.value)} />
            <span className={s.u}>grammes</span>
          </div>
          <div className={s.nrow}>
            <div className={s.ncell}><b>{calc.kcal}</b><span>kcal</span></div>
            <div className={s.ncell}><b>{calc.p}g</b><span>prot</span></div>
            <div className={s.ncell}><b>{calc.c}g</b><span>gluc</span></div>
            <div className={s.ncell}><b>{calc.f}g</b><span>lip</span></div>
          </div>
          <div className={s.mealpick}>
            {MEAL_DEFS.map((m) => (
              <button key={m.key} className={meal === m.key ? s.on : ""} onClick={() => setMeal(m.key)}>{m.emoji} {m.name.split("-")[0].split(" ")[0]}</button>
            ))}
          </div>
          <div className={s.scanbtns}>
            <button className={`${s.btn} ${s.ghost}`} onClick={reset}><Icon name="refresh" size={16} />Reprendre</button>
            <button className={`${s.btn} ${s.prim}`} onClick={addToJournal} disabled={busy || g <= 0}><Icon name="check" size={16} />Valider</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- EXERCICES (live : ajoute des kcal brûlées) ---------------- */
function ExoScreen({ day, target }: { day: Day; target: number }) {
  const delay = [s.r3, s.r4, s.r5];
  const remaining = target - day.consumed + day.burned;
  return (
    <>
      <div className={`${s.phead} ${s.r} ${s.r1}`}><div><div className={s.hi}>À la maison · Sans matériel</div><h2>Exercices</h2></div></div>
      <div className={`${s.budget} ${s.r} ${s.r2}`}>
        <div className={s.l}>Budget calorique en direct</div>
        <div className={s.calc}>
          <span>{fr(target)}</span><span className={s.op}>−</span><span>{fr(day.consumed)}</span><span className={s.op}>+</span>
          <span style={{ color: "var(--lime)" }}>{fr(day.burned)}</span><span className={s.op}>=</span><span className={s.res}>{fr(remaining)} kcal</span>
        </div>
      </div>
      <div className={`${s.sectionH} ${s.r} ${s.r3}`} style={{ marginTop: 18 }}><h3>Séances rapides</h3><a>Terminer → +kcal</a></div>
      {workouts.map((w, i) => (
        <div key={w.name} className={`${s.workout} ${s.r} ${delay[i]}`}>
          <div className={s.ph} style={{ background: w.tint }}>{w.emoji}</div>
          <div className={s.info}>
            <b>{w.name}</b>
            <div className={s.row}>
              <span><Icon name="clock" size={13} />{w.dur}</span>
              <span><Icon name="flameLine" size={13} />{w.kcal} kcal</span>
            </div>
            <span className={`${s.diff} ${s[w.diffClass]}`}>{w.diff}</span>
          </div>
          <button className={s.play} onClick={() => day.addWorkout(w.name, w.kcal)} aria-label="Terminer la séance"><Icon name="check" size={18} /></button>
        </div>
      ))}
    </>
  );
}

/* ---------------- REPAS IA (ajoute au journal) ---------------- */
function RepasScreen({ day, go }: { day: Day; go: (t: Tab) => void }) {
  const [meal, setMeal] = useState(0);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const tabs = ["Dîner", "Petit-déj", "Déjeuner", "Collation"];
  const delay = [s.r3, s.r4];
  return (
    <>
      <div className={`${s.phead} ${s.r} ${s.r1}`}>
        <div><div className={s.hi}>Idées adaptées à tes objectifs</div><h2>Repas IA <span className={s.demoflag}>DÉMO</span></h2></div>
        <button className={s.headact} onClick={() => go("courses")} aria-label="Liste de courses"><Icon name="cart" /></button>
      </div>
      <div className={`${s.mealtabs} ${s.r} ${s.r2}`}>
        {tabs.map((t, i) => <div key={t} className={`${s.mtab} ${meal === i ? s.on : ""}`} onClick={() => setMeal(i)}>{t}</div>)}
      </div>
      {recipes.map((rc, i) => (
        <div key={rc.title} className={`${s.recipe} ${s.r} ${delay[i]}`}>
          <div className={s.img} style={{ background: rc.bg }}>{rc.emoji}
            <span className={s.badge}><Icon name="spark" size={11} />Suggestion IA</span>
            <span className={s.fav}><Icon name="heart" size={16} style={rc.fav ? { color: "var(--coral)", fill: "var(--coral)" } : undefined} /></span>
          </div>
          <div className={s.body}>
            <h4>{rc.title}</h4>
            <div className={s.meta}>
              <span><Icon name="clock" size={13} />{rc.time}</span>
              <span><Icon name="flameLine" size={13} />{rc.kcal} kcal</span>
              <span>{rc.tag}</span>
            </div>
            <div className={s.minimacros}>
              <div className={s.mm}><b>{rc.p}g</b><span>Prot</span></div>
              <div className={s.mm}><b>{rc.c}g</b><span>Gluc</span></div>
              <div className={s.mm}><b>{rc.f}g</b><span>Lip</span></div>
            </div>
            <div className={s.acts}>
              <button className={s.add} onClick={async () => {
                await day.addEntry({ meal_type: "diner", name: rc.title, qty: "1 portion", kcal: rc.kcal, protein: rc.p, carbs: rc.c, fat: rc.f });
                setAdded((a) => ({ ...a, [rc.title]: true }));
              }}>
                <Icon name={added[rc.title] ? "check" : "plus"} size={15} />{added[rc.title] ? "Ajouté" : "Au journal"}
              </button>
              <button className={s.cartbtn} onClick={() => go("courses")} aria-label="Ajouter aux courses"><Icon name="cart" size={16} /></button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

/* ---------------- Scanner code-barres (caméra) ---------------- */
function BarcodeScanner({ onDetected, onClose, onUnsupported }: { onDetected: (v: string) => void; onClose: () => void; onUnsupported: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    // BarcodeDetector n'est pas typé dans la lib standard
    const Detector = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (s: CanvasImageSource) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    if (!Detector || !navigator.mediaDevices?.getUserMedia) { onUnsupported(); return; }
    const detector = new Detector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (stopped) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = videoRef.current;
        if (v) { v.srcObject = stream; await v.play(); }
        const tick = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes && codes.length && codes[0].rawValue) { onDetected(codes[0].rawValue); return; }
          } catch { /* ignore une frame illisible */ }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch { onUnsupported(); }
    })();

    return () => { stopped = true; cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach((t) => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={s.bcam}>
      <video ref={videoRef} playsInline muted />
      <div className={s.bframe} />
      <div className={s.bline} />
      <button className={s.bclose} onClick={onClose} aria-label="Fermer">✕</button>
      <div className={s.bhint}>Vise le code-barres du produit</div>
    </div>
  );
}

/* ---------------- COACH IA (démo) ---------------- */
function CoachScreen() {
  const [draft, setDraft] = useState("");
  const delay = [s.r2, s.r3, s.r4];
  return (
    <>
      <div className={`${s.coachhead} ${s.r} ${s.r1}`}>
        <div className={s.orb}><Icon name="spark" size={24} /></div>
        <div><b>Coach BODYUP <span className={s.demoflag}>DÉMO</span></b><span className={s.on}><i />En ligne · 24h/24</span></div>
      </div>
      <div className={s.chat}>
        {coachThread.map((m, i) => (
          <div key={i} className={`${s.bub} ${m.from === "ai" ? s.ai : s.me} ${s.r} ${delay[i] ?? ""}`} dangerouslySetInnerHTML={{ __html: m.html }} />
        ))}
        <div className={`${s.chips} ${s.r} ${s.r5}`}>
          {coachChips.map((c) => <span key={c} className={s.chip} onClick={() => setDraft(c)}>{c}</span>)}
        </div>
      </div>
      <div className={`${s.composer} ${s.r} ${s.r6}`}>
        <input placeholder="Pose ta question au coach…" value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button className={s.snd}><Icon name="send" size={18} /></button>
      </div>
    </>
  );
}

/* ---------------- STATS (démo visuelle) ---------------- */
function StatsScreen({ profile, go }: { profile: Profile | null; go: (t: Tab) => void }) {
  const week = [55, 70, 48, 85, 30, 92, 78];
  const labels = ["L", "M", "M", "J", "V", "S", "D"];
  const lost = profile?.weight_kg && profile?.target_kg ? (profile.weight_kg - profile.target_kg).toFixed(1) : "—";
  return (
    <>
      <div className={`${s.phead} ${s.r} ${s.r1}`}>
        <div><div className={s.hi}>7 derniers jours</div><h2>Statistiques</h2></div>
        <button className={s.headact} onClick={() => go("progress")} aria-label="Photos de progression"><Icon name="camera" /></button>
      </div>
      <div className={`${s.kpibig} ${s.r} ${s.r2}`}>
        <div className={s.l}>Écart jusqu&apos;à ta cible</div>
        <div className={s.v}>{lost} <small>kg à perdre</small></div>
        <div className={s.weekbars}>
          {week.map((h, i) => (
            <div key={i} className={`${s.wb} ${i === 4 ? s.miss : ""}`}><div className={s.col} style={{ height: `${h}%` }} /><div className={s.dl}>{labels[i]}</div></div>
          ))}
        </div>
      </div>
      <div className={`${s.kgrid} ${s.r} ${s.r3}`}>
        <Metric icon="check" tint="rgba(201,255,60,.12)" color="var(--lime)" v={profile?.calorie_target ? fr(profile.calorie_target) : "—"} unit=" kcal" k="Objectif quotidien" />
        <Metric icon="trend" tint="rgba(255,194,75,.12)" color="var(--amber)" v={profile?.tdee ? fr(profile.tdee) : "—"} unit=" kcal" k="Dépense (TDEE)" />
        <Metric icon="clock" tint="rgba(91,209,255,.12)" color="var(--sky)" v={profile?.bmr ? fr(profile.bmr) : "—"} unit=" kcal" k="Métabolisme (BMR)" />
        <Metric icon="target" tint="rgba(183,155,255,.12)" color="var(--violet)" v={profile?.target_kg ? String(profile.target_kg) : "—"} unit=" kg" k="Poids cible" />
      </div>
      <div className={`${s.sectionH} ${s.r} ${s.r4}`}><h3>Récompenses <span className={s.demoflag}>DÉMO</span></h3></div>
      <div className={`${s.badgewrap} ${s.r} ${s.r4}`}>
        {badges.map((b) => <div key={b.label} className={`${s.bdg} ${b.locked ? s.lock : ""}`}>{b.emoji}<span>{b.label}</span></div>)}
      </div>
    </>
  );
}

/* ---------------- PROFIL (live + déconnexion) ---------------- */
function ProfilScreen({ profile, email }: { profile: Profile | null; email: string }) {
  const { signOut } = useAuth();
  const name = profile?.display_name ?? "Utilisateur";
  const initials = (name[0] ?? "?").toUpperCase();
  const goalLabel = profile?.goal === "perte" ? "perte de poids" : profile?.goal === "masse" ? "prise de masse" : "maintien";
  const deficit = profile?.tdee && profile?.calorie_target ? profile.tdee - profile.calorie_target : null;
  return (
    <>
      <div className={`${s.profhero} ${s.r} ${s.r1}`}>
        <div className={s.av}>{initials}</div>
        <h2>{name}</h2>
        <div className={s.sub}>{email}</div>
        <div className={s.sub}>Objectif : {goalLabel}{profile?.weight_kg ? ` · ${profile.weight_kg} → ${profile.target_kg} kg` : ""}</div>
      </div>
      <div className={`${s.prem} ${s.r} ${s.r2}`}>
        <div className={s.ico}><Icon name="diamond" size={22} /></div>
        <div><b>BODYUP Premium</b><span>IA illimitée · plans sportifs · rapports PDF</span></div>
        <button className={s.go}>Essayer</button>
      </div>
      <div className={s.sectionH} style={{ marginTop: 6 }}><h3>Ton plan calculé</h3></div>
      <div className={`${s.plist} ${s.r} ${s.r3}`}>
        <ProfRow icon="clock" label="Métabolisme basal (BMR)" val={profile?.bmr ? `${fr(profile.bmr)} kcal` : "—"} />
        <ProfRow icon="trend" label="Dépense quotidienne (TDEE)" val={profile?.tdee ? `${fr(profile.tdee)} kcal` : "—"} />
        <ProfRow icon="target" label="Objectif calorique" val={profile?.calorie_target ? `${fr(profile.calorie_target)} kcal` : "—"} />
        {deficit ? <ProfRow icon="plus" label="Déficit quotidien" val={`−${fr(deficit)} kcal`} /> : null}
      </div>
      <div className={s.sectionH}><h3>Connexions santé <span className={s.demoflag}>BIENTÔT</span></h3></div>
      <div className={`${s.sync} ${s.r} ${s.r4}`}>
        <div className={s.synccard}><Icon name="heart" size={24} style={{ color: "var(--coral)" }} /><b>Apple Health</b><span style={{ color: "var(--txt-3)" }}>À venir</span></div>
        <div className={s.synccard}><Icon name="fit" size={24} style={{ color: "var(--sky)" }} /><b>Google Fit</b><span style={{ color: "var(--txt-3)" }}>À venir</span></div>
      </div>
      <button className={s.logout} onClick={signOut}>Se déconnecter</button>
    </>
  );
}

function ProfRow({ icon, label, val, chevron }: { icon: IconName; label: string; val?: string; chevron?: boolean }) {
  return (
    <div className={s.prow}>
      <div className={s.pic}><Icon name={icon} size={17} /></div>{label}
      {val && <span className={s.val}>{val}</span>}
      {chevron && <span className={s.ch}>›</span>}
    </div>
  );
}

/* ---------------- LISTE DE COURSES (démo) ---------------- */
function CoursesScreen({ back }: { back: () => void }) {
  const initial = new Set<string>();
  shoppingList.forEach((a) => a.items.forEach((it) => { if (it.checked) initial.add(`${a.rayon}-${it.name}`); }));
  const [checked, setChecked] = useState<Set<string>>(initial);
  const total = shoppingList.reduce((n, a) => n + a.items.length, 0);
  const toggle = (key: string) => setChecked((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const delay = [s.r2, s.r3, s.r4, s.r5];
  return (
    <>
      <div className={`${s.subhead} ${s.r} ${s.r1}`}>
        <button className={s.backbtn} onClick={back} aria-label="Retour"><Icon name="arrowLeft" size={18} /></button>
        <div><div className={s.hi}>Générée depuis tes repas</div><h2>Liste de courses</h2></div>
      </div>
      <div className={`${s.famsync} ${s.r} ${s.r1}`}>
        <Icon name="fit" size={18} />
        <span><b>Synchronisation familiale</b> active · 2 membres voient cette liste en temps réel.</span>
      </div>
      {shoppingList.map((a, i) => (
        <div key={a.rayon} className={`${s.rayon} ${s.r} ${delay[i]}`}>
          <div className={s.rayonh}><span className={s.em}>{a.emoji}</span>{a.rayon}<span className={s.ct}>{a.items.length} articles</span></div>
          <div className={s.slist}>
            {a.items.map((it) => {
              const key = `${a.rayon}-${it.name}`; const done = checked.has(key);
              return (
                <div key={it.name} className={`${s.sitem} ${done ? s.done : ""}`} onClick={() => toggle(key)}>
                  <span className={s.cbox}><Icon name="check" size={13} /></span>
                  <span className={s.snm}>{it.name}</span><span className={s.sqty}>{it.qty}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <div className={s.sfoot}>
        <div className={s.sprog}>
          <div className={s.bar}><i style={{ width: `${(checked.size / total) * 100}%` }} /></div>
          <span>{checked.size} / {total} articles cochés</span>
        </div>
        <button className={s.share} aria-label="Partager la liste"><Icon name="send" size={20} /></button>
      </div>
    </>
  );
}

/* ---------------- PHOTOS DE PROGRESSION (démo) ---------------- */
function ProgressScreen({ profile, back }: { profile: Profile | null; back: () => void }) {
  const first = progressTimeline[0];
  const last = progressTimeline[progressTimeline.length - 1];
  const lost = (first.weight - last.weight).toFixed(1);
  const toGo = profile?.target_kg ? (last.weight - profile.target_kg).toFixed(1) : "—";
  return (
    <>
      <div className={`${s.subhead} ${s.r} ${s.r1}`}>
        <button className={s.backbtn} onClick={back} aria-label="Retour"><Icon name="arrowLeft" size={18} /></button>
        <div><div className={s.hi}>Avant / après · 5 mois</div><h2>Progression <span className={s.demoflag}>DÉMO</span></h2></div>
        <button className={s.headact} aria-label="Ajouter une photo"><Icon name="camera" /></button>
      </div>
      <div className={`${s.compare} ${s.r} ${s.r2}`}>
        <div className={`${s.cphoto} ${s.before}`}>🧍<span className={s.ctag}>AVANT</span><div className={s.cw}><b>{first.weight} kg</b><span>{first.month} 2026</span></div></div>
        <div className={`${s.cphoto} ${s.after}`}>🧍<span className={s.ctag}>APRÈS</span><div className={s.cw}><b>{last.weight} kg</b><span>{last.month} 2026</span></div></div>
      </div>
      <div className={`${s.cresult} ${s.r} ${s.r3}`}>
        <div className={s.big}>−{lost}<small> kg</small></div>
        <div className={s.cr}>Tu as perdu <b>{lost} kg</b> en 5 mois.<br />Plus que {toGo} kg avant ta cible.</div>
      </div>
      <div className={`${s.sectionH} ${s.r} ${s.r4}`}><h3>Évolution mensuelle</h3></div>
      <div className={`${s.timeline} ${s.r} ${s.r4}`}>
        {progressTimeline.map((p, i) => (
          <div key={p.month} className={`${s.tnode} ${i === progressTimeline.length - 1 ? s.last : ""}`}>
            <div className={s.tph}>{p.emoji}</div><div className={s.tm}>{p.month}</div><div className={s.tw}>{p.weight} kg</div>
          </div>
        ))}
      </div>
      <button className={`${s.addphoto} ${s.r} ${s.r5}`}><Icon name="plus" size={16} /> Ajouter une photo ce mois-ci</button>
    </>
  );
}

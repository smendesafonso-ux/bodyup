"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import s from "@/styles/mobile.module.css";
import { Modal } from "./Modal";
import { Icon, type IconName } from "./Icon";
import { CalorieRing } from "./CalorieRing";
import { fr } from "@/lib/nutrition";
import { useAuth } from "@/lib/auth";
import { supabase, todayISO } from "@/lib/supabase";
import { useDay, type NewFood } from "@/lib/useDay";
import { searchFoods, searchFoodsInstant, localFoodByName, lookupBarcode, type FoodHit } from "@/lib/foods";
import { QUICK_DRINKS, portionsFor } from "@/lib/foods-local";
import { loadHistory, buildHistoryCsv, downloadCsv, loadEntryDates, computeStreak, type DayHistory } from "@/lib/history";
import { loadFavorites, addFavorite, removeFavoriteByName, favToHit, loadRecentFoods, loadYesterdayMeal, type FavFood, type RecentFood } from "@/lib/favorites";
import { FASTING_PROTOCOLS, getActiveFast, startFast, endFast, loadFastHistory, fastElapsedH, type Fast } from "@/lib/fasting";
import { loadThread, sendMessage, markThreadRead, loadUnreadCounts, subscribeToMessages, type ChatMsg } from "@/lib/chat";
import { uploadProgressPhoto, loadProgressPhotos, deleteProgressPhoto, type ProgressPhoto } from "@/lib/photos";
import { enablePush, pushSupported } from "@/lib/push";
import { analyzeFoodPhoto, type FoodAnalysis } from "@/lib/vision";
import { suggestMeals, normIngredients, type AiMeal } from "@/lib/meals";
import { translateTexts } from "@/lib/translate";
import type { Profile } from "@/lib/supabase";
import { coachChips } from "@/lib/data";
import { askCoach, type CoachMsg } from "@/lib/coach";
import { notifSupported, notifPermission, requestNotif, showNotif, remindersEnabled, setRemindersEnabled, startReminderLoop, notifPrefs, setNotifPref, notifyMessage, NOTIF_CATS, type NotifCat } from "@/lib/notifications";
import { exercises, intensityClass, type Exercise, type Intensity } from "@/lib/exercises";
import { loadPantry, addPantryItem, addManyToBuy, setPantryStatus, removePantryItem, searchCatalog, STAPLES, type PantryItem } from "@/lib/pantry";
import { mealCategories, mealsByCategory, mealLookup, type MealLite, type MealFull } from "@/lib/themealdb";
import { loadConnections, sendInvite, acceptInvite, removeConnection, loadSharedData, resolveUsername, setUsername, shareRecipe, loadReceivedRecipes, markRecipeSeen, SHARE_LABELS, ALL_CATS, type Connection, type ShareCat, type SharedData, type SharedRecipe } from "@/lib/social";
import { loadStats, computePoints, levelFor, emojiForLevel, persistGamification, BADGES, type Stats } from "@/lib/gamification";
import { recipes as libRecipes, aiPhoto, shuffleSeeded, ytId, type LibRecipe } from "@/lib/recipes";

type Tab = "home" | "journal" | "repas" | "scan" | "exo" | "coach" | "stats" | "profil" | "courses" | "progress" | "partage" | "histo" | "msg";
type Day = ReturnType<typeof useDay>;
type MealKey = "petit-dej" | "dejeuner" | "collation" | "diner";

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "home", label: "Accueil", icon: "home" },
  { id: "journal", label: "Journal", icon: "journal" },
  { id: "repas", label: "Recettes", icon: "meals" },
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

// Répartition macros : personnalisable dans Profil (défaut 30 % P / 40 % G / 30 % L).
const macroGoals = (target: number, profile?: Profile | null) => {
  const p = profile?.macro_p ?? 30;
  const c = profile?.macro_c ?? 40;
  const f = profile?.macro_f ?? 30;
  return {
    p: Math.round((target * p) / 100 / 4),
    c: Math.round((target * c) / 100 / 4),
    f: Math.round((target * f) / 100 / 9),
  };
};

export const MACRO_PRESETS: { label: string; p: number; c: number; f: number }[] = [
  { label: "Équilibré", p: 30, c: 40, f: 30 },
  { label: "Protéiné", p: 40, c: 30, f: 30 },
  { label: "Low-carb", p: 35, c: 25, f: 40 },
  { label: "Prise de masse", p: 30, c: 45, f: 25 },
];

const NUTRI_COLOR: Record<string, string> = { a: "#038141", b: "#85BB2F", c: "#FECB02", d: "#EE8100", e: "#E63E11" };
const NUTRI_TEXT: Record<string, string> = { a: "#fff", b: "#1a2e00", c: "#3a2e00", d: "#fff", e: "#fff" };
const NUTRI_LABEL: Record<string, string> = {
  a: "Excellente qualité nutritionnelle", b: "Bonne qualité nutritionnelle",
  c: "Qualité nutritionnelle moyenne", d: "Qualité nutritionnelle médiocre", e: "Mauvaise qualité nutritionnelle",
};

export default function MobileApp() {
  const { profile, user } = useAuth();
  const day = useDay(user?.id, profile?.weight_kg);
  const [tab, setTab] = useState<Tab>("home");
  const [addMeal, setAddMeal] = useState<MealKey | null>(null);
  const [unread, setUnread] = useState(0);
  const [chatWith, setChatWith] = useState<{ id: string; name: string } | null>(null);

  // Rappels locaux (hydratation, repas, bilan, journée vide) tant que la PWA tourne.
  const entriesRef = useRef(0);
  entriesRef.current = day.entries.length;
  useEffect(() => { const id = startReminderLoop(() => entriesRef.current > 0); return () => clearInterval(id); }, []);

  // Messages entre proches : compteur de non-lus + notification temps réel.
  const refreshUnread = useCallback(async () => {
    if (!user) return;
    const counts = await loadUnreadCounts(user.id);
    setUnread(Object.values(counts).reduce((n, x) => n + x, 0));
  }, [user]);
  useEffect(() => { refreshUnread(); }, [refreshUnread]);
  useEffect(() => {
    if (!user) return;
    const ch = subscribeToMessages(user.id, async (m) => {
      refreshUnread();
      const conns = await loadConnections();
      const c = conns.find((x) => x.requester_id === m.sender_id || x.addressee_id === m.sender_id);
      const name = (c?.requester_id === m.sender_id ? c?.requester_username : c?.addressee_username) ?? "un proche";
      notifyMessage(name, m.body);
    });
    const poll = window.setInterval(refreshUnread, 30000); // secours si le temps réel est indisponible
    return () => { supabase.removeChannel(ch); clearInterval(poll); };
  }, [user, refreshUnread]);

  // Push serveur : (ré)enregistre cet appareil à chaque lancement si la permission est déjà accordée,
  // pour recevoir les messages même app fermée.
  useEffect(() => {
    if (user && notifPermission() === "granted") enablePush(user.id);
  }, [user]);

  const openChat = (friend: { id: string; name: string }) => { setChatWith(friend); setTab("msg"); };

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
              {tab === "repas" && <RepasScreen day={day} profile={profile} target={target} go={setTab} />}
              {tab === "scan" && <ScanScreen day={day} />}
              {tab === "exo" && <ExoScreen day={day} target={target} />}
              {tab === "coach" && <CoachScreen profile={profile} day={day} target={target} />}
              {tab === "stats" && <StatsScreen profile={profile} day={day} go={setTab} />}
              {tab === "profil" && <ProfilScreen profile={profile} email={user?.email ?? ""} go={setTab} unread={unread} />}
              {tab === "courses" && <CoursesScreen back={() => setTab("repas")} />}
              {tab === "progress" && <ProgressScreen back={() => setTab("stats")} />}
              {tab === "histo" && <HistoryScreen profile={profile} back={() => setTab("stats")} />}
              {tab === "msg" && <MessagesScreen initial={chatWith} onOpened={refreshUnread} back={() => { setChatWith(null); setTab("profil"); }} />}
              {tab === "partage" && <PartageScreen back={() => setTab("profil")} onChat={openChat} />}
            </div>
          </div>

          {addMeal && (
            <AddFoodSheet
              defaultMeal={addMeal}
              userId={user?.id}
              onClose={() => setAddMeal(null)}
              onSave={async (food) => { await day.addEntry(food); setAddMeal(null); setTab("journal"); }}
              onSaveMany={async (foods) => { for (const f of foods) await day.addEntry(f); setAddMeal(null); setTab("journal"); }}
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
  const { user } = useAuth();
  const remaining = target - day.consumed + day.burned;
  const goals = macroGoals(target, profile);
  const name = profile?.display_name ?? "toi";
  const initials = (name[0] ?? "?").toUpperCase();
  const pct = (v: number, g: number) => Math.min(Math.round((v / g) * 100), 100);

  // Série de jours consécutifs avec au moins un repas enregistré (streak).
  const [streak, setStreak] = useState(0);
  useEffect(() => {
    if (!user) return;
    loadEntryDates(user.id).then((d) => setStreak(computeStreak(d, todayISO()))).catch(() => {});
  }, [user, day.entries.length]);

  return (
    <>
      <div className={`${s.phead} ${s.r} ${s.r1}`}>
        <div>
          <div className={s.hi}>Bonjour</div>
          <h2>{name}</h2>
          <span className={s.flame}>
            <Icon name="flame" size={14} />{" "}
            {streak >= 2 ? `Série : ${streak} jours d'affilée` : day.consumed > 0 ? "Journée en cours" : "Commence ta journée"}
          </span>
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

      <FastingCard userId={user?.id} />

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

/* ---------------- JEÛNE INTERMITTENT (carte accueil) ---------------- */
function FastingCard({ userId }: { userId?: string }) {
  const [fast, setFast] = useState<Fast | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!userId) return;
    getActiveFast(userId).then(setFast).catch(() => {});
    loadFastHistory(userId).then((h) => setDoneCount(h.length)).catch(() => {});
  }, [userId]);
  // rafraîchit le chrono chaque minute
  useEffect(() => {
    if (!fast) return;
    const id = setInterval(() => forceTick((x) => x + 1), 60000);
    return () => clearInterval(id);
  }, [fast]);

  const begin = async (hours: number) => {
    if (!userId) return;
    setErr(null); setPickerOpen(false);
    try { setFast(await startFast(userId, hours)); } catch (x) { setErr(x instanceof Error ? x.message : "Erreur"); }
  };
  const stop = async () => {
    if (!fast) return;
    await endFast(fast.id);
    setFast(null); setDoneCount((c) => c + 1);
  };

  const elapsed = fast ? fastElapsedH(fast) : 0;
  const hh = Math.floor(elapsed);
  const mm = Math.floor((elapsed - hh) * 60);
  const pct = fast ? Math.min((elapsed / fast.target_h) * 100, 100) : 0;
  const reached = fast != null && elapsed >= fast.target_h;

  return (
    <>
      <div className={`${s.fastcard} ${s.r} ${s.r5}`}>
        <div className={s.fasthead}>
          <b>⏳ Jeûne intermittent</b>
          {fast
            ? <button className={s.wlog} style={{ background: "var(--card)", color: "var(--txt-2)" }} onClick={stop}>{reached ? "Terminer ✓" : "Arrêter"}</button>
            : <button className={s.wlog} onClick={() => setPickerOpen(true)}>Démarrer</button>}
        </div>
        {fast ? (
          <>
            <div className={s.fastline}>
              <b style={{ color: reached ? "var(--lime)" : "var(--txt)" }}>{hh}h{String(mm).padStart(2, "0")}</b>
              <span> / {fast.target_h} h {reached ? "— objectif atteint 🎉" : ""}</span>
            </div>
            <div className={s.bar}><i style={{ width: `${pct}%`, background: reached ? "var(--lime)" : "var(--violet)" }} /></div>
          </>
        ) : (
          <div className={s.fastline}><span>{doneCount > 0 ? `${doneCount} jeûne${doneCount > 1 ? "s" : ""} terminé${doneCount > 1 ? "s" : ""} · prêt pour le prochain ?` : "16:8, 14:10 ou 18:6 — choisis ton protocole."}</span></div>
        )}
        {err && <div className={s.scanerr} style={{ margin: "8px 0 0" }}>{err}</div>}
      </div>

      {pickerOpen && (
        <Modal center onClose={() => setPickerOpen(false)}>
            <h3>Démarrer un jeûne <span className={s.x} onClick={() => setPickerOpen(false)}>✕</span></h3>
            {FASTING_PROTOCOLS.map((p) => (
              <div key={p.label} className={s.connrow} style={{ cursor: "pointer" }} onClick={() => begin(p.hours)}>
                <div className={s.av2}>{p.label.split(":")[0]}h</div>
                <div className={s.ce}><b>{p.label}</b><span>{p.desc}</span></div>
                <span className={s.ch}>›</span>
              </div>
            ))}
            <div className={s.empty2}>Le chrono démarre maintenant — l&apos;app t&apos;indique quand l&apos;objectif est atteint.</div>
        </Modal>
      )}
    </>
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
function AddFoodSheet({ defaultMeal, userId, onClose, onSave, onSaveMany }: {
  defaultMeal: MealKey; userId?: string; onClose: () => void;
  onSave: (f: NewFood) => Promise<void>; onSaveMany: (fs: NewFood[]) => Promise<void>;
}) {
  const [meal, setMeal] = useState<MealKey>(defaultMeal);
  const [mode, setMode] = useState<"search" | "manual">("search");
  const [busy, setBusy] = useState(false);

  // recherche
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [sel, setSel] = useState<FoodHit | null>(null);
  const [grams, setGrams] = useState("100");
  const reqId = useRef(0);

  // favoris & récents (saisie en 1 geste)
  const [favs, setFavs] = useState<FavFood[]>([]);
  const [recents, setRecents] = useState<RecentFood[]>([]);
  const [isFav, setIsFav] = useState(false);
  useEffect(() => {
    if (!userId) return;
    loadFavorites(userId).then(setFavs).catch(() => {});
    loadRecentFoods(userId).then(setRecents).catch(() => {});
  }, [userId]);
  const toggleFav = async () => {
    if (!userId || !sel) return;
    if (isFav) { setIsFav(false); await removeFavoriteByName(userId, sel.name); setFavs((p) => p.filter((f) => f.name !== sel.name)); }
    else { setIsFav(true); await addFavorite(userId, sel); loadFavorites(userId).then(setFavs).catch(() => {}); }
  };

  // saisie manuelle
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [mp, setMp] = useState(""); const [mc, setMc] = useState(""); const [mf, setMf] = useState("");
  const [qty, setQty] = useState("");

  useEffect(() => {
    if (sel) return;
    const q = query.trim();
    if (q.length < 2) { setResults([]); setSearching(false); return; }
    // 1) base embarquée : résultats immédiats, même hors-ligne
    setResults(searchFoodsInstant(q));
    setSearching(true);
    // 2) recherche complète (Supabase + Open Food Facts) après une courte pause de frappe ;
    //    reqId ignore les réponses arrivées trop tard (anti-résultats périmés)
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      const r = await searchFoods(q);
      if (reqId.current === id) { setResults(r); setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query, sel]);

  const pick = (r: FoodHit) => { setSel(r); setIsFav(favs.some((f) => f.name === r.name)); setResults([]); setGrams(r.unit === "ml" ? "250" : "100"); };
  const pickDrink = (name: string, ml: number) => {
    const hit = localFoodByName(name);
    if (hit) { setSel(hit); setIsFav(favs.some((f) => f.name === hit.name)); setResults([]); setQuery(""); setGrams(String(ml)); }
  };
  const unitLabel = sel?.unit === "ml" ? "ml" : "grammes";

  // Ajout direct d'un aliment récent (mêmes quantités que la dernière fois)
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const quickAdd = async (r: RecentFood) => {
    setBusy(true); setSaveErr(null);
    try {
      await onSave({ meal_type: meal, name: r.name, qty: r.qty, kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat });
    } catch (x) {
      setSaveErr(x instanceof Error ? x.message : "Enregistrement impossible. Réessaie.");
    } finally { setBusy(false); }
  };

  // Recopie le même repas qu'hier (ex : petit-déj identique tous les matins)
  const [copying, setCopying] = useState(false);
  const copyYesterday = async () => {
    if (!userId || copying) return;
    setCopying(true); setSaveErr(null);
    try {
      const rows = await loadYesterdayMeal(userId, meal);
      if (rows.length === 0) { setSaveErr("Rien d'enregistré hier pour ce repas."); return; }
      await onSaveMany(rows.map((r) => ({ ...r, meal_type: meal })));
    } catch (x) {
      setSaveErr(x instanceof Error ? x.message : "Copie impossible. Réessaie.");
    } finally { setCopying(false); }
  };

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
    setBusy(true); setSaveErr(null);
    try {
      await onSave({
        meal_type: meal, name: sel.brand ? `${sel.name} (${sel.brand})` : sel.name, qty: `${g} ${sel.unit ?? "g"}`,
        kcal: calc.kcal, protein: calc.p, carbs: calc.c, fat: calc.f,
      });
    } catch (x) {
      setSaveErr(x instanceof Error ? x.message : "Enregistrement impossible. Réessaie.");
    } finally {
      setBusy(false);
    }
  };
  const saveManual = async () => {
    if (!name || !kcal) return;
    setBusy(true); setSaveErr(null);
    try {
      await onSave({
        meal_type: meal, name, qty: qty || null,
        kcal: parseInt(kcal) || 0, protein: parseInt(mp) || 0, carbs: parseInt(mc) || 0, fat: parseInt(mf) || 0,
      });
    } catch (x) {
      setSaveErr(x instanceof Error ? x.message : "Enregistrement impossible. Réessaie.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose}>
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
                <label>Rechercher un aliment ou une boisson</label>
                <input className={s.inp} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex : poulet, banane, coca, Nutella…" autoFocus />
                {query.trim().length < 2 && (
                  <>
                    <button className={s.copyday} onClick={copyYesterday} disabled={copying || busy}>
                      <Icon name="refresh" size={15} /> {copying ? "Copie…" : "Recopier le repas d'hier"}
                    </button>
                    {favs.length > 0 && (
                      <>
                        <div className={s.eflabel} style={{ marginTop: 12 }}>⭐ Favoris</div>
                        <div className={s.results}>
                          {favs.slice(0, 8).map((f) => (
                            <div key={f.id} className={s.ritem} onClick={() => pick(favToHit(f))}>
                              <div className={s.rn}><b>{f.name}</b><span>{f.kcal100} kcal / 100 {f.unit}</span></div>
                              <span className={s.srcbadge} style={{ color: "var(--amber)", borderColor: "rgba(255,194,75,.35)" }}>★</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {recents.length > 0 && (
                      <>
                        <div className={s.eflabel} style={{ marginTop: 12 }}>🕐 Récents — ajout en 1 clic</div>
                        <div className={s.results}>
                          {recents.map((r) => (
                            <div key={r.name} className={s.ritem} onClick={() => quickAdd(r)}>
                              <div className={s.rn}><b>{r.name}</b><span>{r.qty ? `${r.qty} · ` : ""}{r.kcal} kcal{r.count > 1 ? ` · ×${r.count}` : ""}</span></div>
                              <Icon name="plus" size={16} />
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    <div className={s.eflabel} style={{ marginTop: 12 }}>Boissons rapides</div>
                    <div className={s.staplechips}>
                      {QUICK_DRINKS.map((d) => (
                        <span key={d.name} onClick={() => pickDrink(d.name, d.defaultMl)}>{d.emoji} {d.name}</span>
                      ))}
                    </div>
                    {saveErr && <div className={s.scanerr} style={{ margin: "10px 0 0" }}>{saveErr}</div>}
                  </>
                )}
                {results.length > 0 && (
                  <div className={s.results}>
                    {results.map((r, i) => (
                      <div key={i} className={s.ritem} onClick={() => pick(r)}>
                        <div className={s.rn}>
                          <b>{r.name}</b>
                          <span>{r.brand ? `${r.brand} · ` : ""}{r.kcal100} kcal / 100 {r.unit ?? "g"}</span>
                        </div>
                        {r.nutriscore && <span className={s.nsmini} style={{ background: NUTRI_COLOR[r.nutriscore], color: NUTRI_TEXT[r.nutriscore] }}>{r.nutriscore.toUpperCase()}</span>}
                        <span className={`${s.srcbadge} ${r.source === "base" ? s.srcbase : s.srcoff}`}>{r.source === "base" ? "BODYUP" : "OFF"}</span>
                      </div>
                    ))}
                  </div>
                )}
                {searching && <div className={s.searching}><span className={s.sp} /> Recherche en ligne (produits &amp; marques)…</div>}
                {!searching && query.trim().length >= 2 && results.length === 0 && (
                  <div className={s.empty2}>Aucun résultat — essaie un autre terme ou la saisie manuelle.</div>
                )}
              </>
            )}

            {sel && calc && (
              <>
                <div className={s.selfood}>
                  <div className={s.sn}><b>{sel.name}</b><span>{sel.brand ? `${sel.brand} · ` : ""}{sel.kcal100} kcal / 100 {sel.unit ?? "g"}</span></div>
                  {userId && (
                    <button className={s.clear} onClick={toggleFav} aria-label="Favori" style={{ color: isFav ? "var(--amber)" : "var(--txt-3)", fontSize: 16 }}>{isFav ? "★" : "☆"}</button>
                  )}
                  <button className={s.clear} onClick={() => { setSel(null); setGrams("100"); }} aria-label="Changer">✕</button>
                </div>
                <label>Quantité</label>
                <div className={s.gramrow}>
                  <input className={s.inp} type="number" inputMode="numeric" value={grams} onChange={(e) => setGrams(e.target.value)} />
                  <span className={s.u}>{unitLabel}</span>
                </div>
                <div className={s.staplechips} style={{ marginBottom: 12 }}>
                  {portionsFor(sel.name, sel.unit).map(([label, pg]) => (
                    <span key={label} className={g === pg ? s.chipon : ""} onClick={() => setGrams(String(pg))}>{label}</span>
                  ))}
                </div>
                <div className={s.calcprev}>
                  <div><b>{calc.kcal}</b><span>kcal</span></div>
                  <div><b>{calc.p}g</b><span>prot</span></div>
                  <div><b>{calc.c}g</b><span>gluc</span></div>
                  <div><b>{calc.f}g</b><span>lip</span></div>
                </div>
                {(sel.nutriscore || sel.sugars100 != null || sel.fiber100 != null || sel.salt100 != null) && (
                  <div className={s.nutriline}>
                    {sel.nutriscore && <span className={s.nsmini} style={{ background: NUTRI_COLOR[sel.nutriscore], color: NUTRI_TEXT[sel.nutriscore] }}>{sel.nutriscore.toUpperCase()}</span>}
                    {sel.sugars100 != null && <span>Sucres <b>{sel.sugars100} g</b></span>}
                    {sel.fiber100 != null && <span>Fibres <b>{sel.fiber100} g</b></span>}
                    {sel.salt100 != null && <span>Sel <b>{sel.salt100} g</b></span>}
                    <small>/ 100 {sel.unit ?? "g"}</small>
                  </div>
                )}
                {saveErr && <div className={s.scanerr} style={{ margin: "10px 0 0" }}>{saveErr}</div>}
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
            {saveErr && <div className={s.scanerr} style={{ margin: "10px 0 0" }}>{saveErr}</div>}
            <button className={s.savebtn} onClick={saveManual} disabled={busy || !name || !kcal}>{busy ? "Ajout…" : "Ajouter au journal"}</button>
            <button className={s.switchmode} onClick={() => setMode("search")}><u>← Revenir à la recherche</u></button>
          </>
        )}
    </Modal>
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
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [itemGrams, setItemGrams] = useState<Record<number, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const modes: { icon: IconName; label: string }[] = [
    { icon: "camera", label: "Photo" }, { icon: "barcode", label: "Code-barres" }, { icon: "mic", label: "Vocal" },
  ];

  const reset = () => { setPhoto(null); setBc(null); setErr(null); setCode(""); setGrams("100"); setScanning(false); setBusy(false); setItemGrams({}); };

  useEffect(() => {
    if (photo || bc) resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [photo, bc]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr(null); setPhoto(null);
    try {
      const r = await analyzeFoodPhoto(file);
      setPhoto(r);
      const list = r.items?.length ? r.items : [{ grams: r.grams }];
      setChecked(new Set(list.map((_, i) => i)));
      setItemGrams(Object.fromEntries(list.map((it, i) => [i, String(Math.round(it.grams ?? 0))])));
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

  // Code-barres : valeurs pour 100 g → mise à l'échelle par la quantité
  const g = parseFloat(grams) || 0;
  const bf = g / 100;
  const bcCalc = bc ? { kcal: Math.round(bc.kcal100 * bf), p: Math.round(bc.p100 * bf), c: Math.round(bc.c100 * bf), f: Math.round(bc.f100 * bf) } : null;
  const bcName = bc ? (bc.brand ? `${bc.name} (${bc.brand})` : bc.name) : "";
  const addBarcode = async () => {
    if (!bcCalc || g <= 0) return;
    setBusy(true);
    try {
      await day.addEntry({ meal_type: meal, name: bcName, qty: `${g} g`, kcal: bcCalc.kcal, protein: bcCalc.p, carbs: bcCalc.c, fat: bcCalc.f });
      reset();
    } catch (x) {
      setBusy(false);
      setErr(x instanceof Error ? x.message : "Enregistrement impossible. Réessaie.");
    }
  };

  // Photo : un item par aliment détecté (repli sur le total si la liste est vide)
  const photoItems = photo
    ? (photo.items?.length ? photo.items : [{ name: photo.name, grams: photo.grams, kcal: photo.kcal, protein: photo.protein, carbs: photo.carbs, fat: photo.fat }])
    : [];
  const toggle = (i: number) => setChecked((p) => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; });
  const scaleItem = (it: { grams: number; kcal: number; protein?: number; carbs?: number; fat?: number }, i: number) => {
    const base = it.grams > 0 ? it.grams : 1;
    const g = parseFloat(itemGrams[i] ?? String(Math.round(it.grams))) || 0;
    const f = g / base;
    return { g, kcal: Math.round(it.kcal * f), p: Math.round((it.protein ?? 0) * f), c: Math.round((it.carbs ?? 0) * f), fat: Math.round((it.fat ?? 0) * f) };
  };
  const addPhotoItems = async () => {
    if (!photo || checked.size === 0) return;
    setBusy(true);
    try {
      for (const i of checked) {
        const it = photoItems[i];
        if (!it) continue;
        const v = scaleItem(it, i);
        if (v.g <= 0) continue;
        await day.addEntry({ meal_type: meal, name: it.name, qty: `${v.g} g`, kcal: v.kcal, protein: v.p, carbs: v.c, fat: v.fat });
      }
      reset();
    } catch (x) {
      setBusy(false);
      setErr(x instanceof Error ? x.message : "Enregistrement impossible. Réessaie.");
    }
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
              onUnsupported={() => { setScanning(false); setErr("Accès caméra impossible. Autorise la caméra pour ce site, ou saisis le numéro du code-barres à la main."); }}
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

      {bc && bcCalc && (
        <div className={`${s.scancard} ${s.r}`} ref={resultRef}>
          <div className={s.ttl}><b>{bcName}</b></div>
          {bc.nutriscore && (
            <div className={s.scorebox}>
              <div className={`${s.grade} ${s.letter}`} style={{ background: NUTRI_COLOR[bc.nutriscore], color: NUTRI_TEXT[bc.nutriscore] }}>{bc.nutriscore.toUpperCase()}</div>
              <div className={s.txt}>
                <b>Nutri-Score {bc.nutriscore.toUpperCase()}</b>
                <span>{NUTRI_LABEL[bc.nutriscore]}</span>
                {bc.nova ? <span className={s.nova}>Transformation NOVA {bc.nova}/4</span> : null}
              </div>
            </div>
          )}
          <div className={s.qtyrow}>
            <input type="number" inputMode="numeric" value={grams} onChange={(e) => setGrams(e.target.value)} />
            <span className={s.u}>grammes</span>
          </div>
          <div className={s.nrow}>
            <div className={s.ncell}><b>{bcCalc.kcal}</b><span>kcal</span></div>
            <div className={s.ncell}><b>{bcCalc.p}g</b><span>prot</span></div>
            <div className={s.ncell}><b>{bcCalc.c}g</b><span>gluc</span></div>
            <div className={s.ncell}><b>{bcCalc.f}g</b><span>lip</span></div>
          </div>
          <div className={s.mealpick}>
            {MEAL_DEFS.map((m) => (<button key={m.key} className={meal === m.key ? s.on : ""} onClick={() => setMeal(m.key)}>{m.emoji} {m.name.split("-")[0].split(" ")[0]}</button>))}
          </div>
          <div className={s.scanbtns}>
            <button className={`${s.btn} ${s.ghost}`} onClick={reset}><Icon name="refresh" size={16} />Reprendre</button>
            <button className={`${s.btn} ${s.prim}`} onClick={addBarcode} disabled={busy || g <= 0}><Icon name="check" size={16} />Valider</button>
          </div>
        </div>
      )}

      {photo && (
        <div className={`${s.scancard} ${s.r}`} ref={resultRef}>
          <div className={s.ttl}><b>{photo.name}</b><span className={s.conf}>{Math.round(photo.confidence * 100)}% sûr</span></div>
          {typeof photo.score === "number" && (
            <div className={s.scorebox}>
              <div className={s.grade} style={{ background: photo.score >= 70 ? "var(--lime)" : photo.score >= 40 ? "var(--amber)" : "var(--coral)" }}>
                <span className={s.num}>{photo.score}</span><span className={s.den}>/100</span>
              </div>
              <div className={s.txt}><b>Note santé</b><span>{photo.advice}</span></div>
            </div>
          )}
          <div className={s.mealpick}>
            {MEAL_DEFS.map((m) => (<button key={m.key} className={meal === m.key ? s.on : ""} onClick={() => setMeal(m.key)}>{m.emoji} {m.name.split("-")[0].split(" ")[0]}</button>))}
          </div>
          <div className={s.hintline}>Décoche ce que tu n&apos;as pas mangé · ajuste les grammes :</div>
          <div className={s.itemlist}>
            {photoItems.map((it, i) => {
              const v = scaleItem(it, i);
              return (
                <div key={i} className={`${s.fitem2} ${checked.has(i) ? "" : s.off}`}>
                  <span className={s.cbox2} onClick={() => toggle(i)}><Icon name="check" size={12} /></span>
                  <div className={s.iname} onClick={() => toggle(i)}>{it.name}<small>{v.p}g P · {v.c}g G · {v.fat}g L</small></div>
                  <input className={s.gin} type="number" inputMode="numeric" value={itemGrams[i] ?? String(Math.round(it.grams))} onChange={(e) => setItemGrams((p) => ({ ...p, [i]: e.target.value }))} />
                  <span className={s.gu}>g</span>
                  <div className={s.ikcal}>{v.kcal} kcal</div>
                </div>
              );
            })}
          </div>
          <div className={s.scanbtns}>
            <button className={`${s.btn} ${s.ghost}`} onClick={reset}><Icon name="refresh" size={16} />Reprendre</button>
            <button className={`${s.btn} ${s.prim}`} onClick={addPhotoItems} disabled={busy || checked.size === 0}><Icon name="check" size={16} />Ajouter ({checked.size})</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------- EXERCICES (bibliothèque + filtres + minuteur) ---------------- */
const exoTint = (i: Intensity) => i === "doux" ? "rgba(201,255,60,.12)" : i === "modéré" ? "rgba(255,194,75,.12)" : "rgba(255,122,83,.12)";
const bandOf = (m: number) => (m <= 8 ? "court" : m <= 15 ? "moyen" : "long");

function ExoScreen({ day, target }: { day: Day; target: number }) {
  const [intensity, setIntensity] = useState<"all" | Intensity>("all");
  const [band, setBand] = useState<"all" | "court" | "moyen" | "long">("all");
  const [sel, setSel] = useState<Exercise | null>(null);
  const remaining = target - day.consumed + day.burned;

  const list = exercises.filter((e) => (intensity === "all" || e.intensity === intensity) && (band === "all" || bandOf(e.defaultMin) === band));
  const intF: [string, string][] = [["all", "Toutes"], ["doux", "Doux"], ["modéré", "Modéré"], ["intense", "Intense"]];
  const timeF: [string, string][] = [["all", "Toutes"], ["court", "≤ 8 min"], ["moyen", "10–15 min"], ["long", "20 min +"]];

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

      <div className={`${s.exfilters} ${s.r} ${s.r3}`} style={{ marginTop: 16 }}>
        <div className={s.eflabel}>Intensité</div>
        <div className={s.exfrow}>{intF.map(([v, l]) => <span key={v} className={`${s.ef} ${intensity === v ? s.on : ""}`} onClick={() => setIntensity(v as "all" | Intensity)}>{l}</span>)}</div>
        <div className={s.eflabel}>Durée</div>
        <div className={s.exfrow}>{timeF.map(([v, l]) => <span key={v} className={`${s.ef} ${band === v ? s.on : ""}`} onClick={() => setBand(v as "all" | "court" | "moyen" | "long")}>{l}</span>)}</div>
      </div>
      <div className={s.excount}>{list.length} exercice{list.length > 1 ? "s" : ""}</div>

      {list.map((e) => (
        <div key={e.id} className={`${s.workout} ${s.r}`} style={{ cursor: "pointer" }} onClick={() => setSel(e)}>
          <div className={s.ph} style={{ background: exoTint(e.intensity) }}>{e.emoji}</div>
          <div className={s.info}>
            <b>{e.name}</b>
            <div className={s.row}>
              <span><Icon name="clock" size={13} />{e.defaultMin} min</span>
              <span><Icon name="flameLine" size={13} />{Math.round(e.kcalPerMin * e.defaultMin)} kcal</span>
            </div>
            <span className={`${s.diff} ${s[intensityClass[e.intensity]]}`}>{e.category} · {e.intensity}</span>
          </div>
          <button className={s.play} onClick={(ev) => { ev.stopPropagation(); setSel(e); }} aria-label="Voir l'exercice"><Icon name="play" size={18} /></button>
        </div>
      ))}

      {sel && <ExerciseDetail ex={sel} day={day} onClose={() => setSel(null)} />}
    </>
  );
}

function ExerciseDetail({ ex, day, onClose }: { ex: Exercise; day: Day; onClose: () => void }) {
  const [minutes, setMinutes] = useState(ex.defaultMin);
  const [secs, setSecs] = useState(ex.defaultMin * 60);
  const [running, setRunning] = useState(false);
  const [logged, setLogged] = useState(false);

  useEffect(() => { if (!running) setSecs(minutes * 60); }, [minutes, running]);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs((x) => Math.max(x - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => { if (running && secs === 0) setRunning(false); }, [secs, running]);

  const kcal = Math.round(ex.kcalPerMin * minutes);
  const total = minutes * 60;
  const done = secs === 0;
  const C = 452.4;
  const pct = total ? (total - secs) / total : 0;
  const mm = Math.floor(secs / 60);
  const ss = secs % 60;

  const [logErr, setLogErr] = useState<string | null>(null);
  const log = async () => {
    setLogErr(null);
    try {
      await day.addWorkout(ex.name, kcal);
      setLogged(true); setRunning(false);
    } catch (x) {
      setLogErr(x instanceof Error ? x.message : "Enregistrement impossible. Réessaie.");
    }
  };

  return (
    <Modal tall onClose={onClose}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}><span className={s.x} onClick={onClose}>✕</span></div>
        <div className={s.exhero}>
          <div className={s.orb}>{ex.emoji}</div>
          <h3>{ex.name}</h3>
          <span className={`${s.diff} ${s[intensityClass[ex.intensity]]}`}>{ex.category} · {ex.intensity}</span>
          <p className={s.exd}>{ex.desc}</p>
        </div>
        <div className={s.mtags}>{ex.muscles.map((m) => <span key={m}>{m}</span>)}</div>

        <div className={s.tring}>
          <svg width="172" height="172" viewBox="0 0 172 172">
            <circle cx="86" cy="86" r="72" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="13" />
            <circle cx="86" cy="86" r="72" fill="none" stroke="var(--lime)" strokeWidth="13" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transform: "rotate(-90deg)", transformOrigin: "center", transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <div className={s.mid}><span className={s.tt}>{mm}:{String(ss).padStart(2, "0")}</span><span className={s.tl}>{kcal} kcal</span></div>
        </div>

        <div className={s.durrow}>
          <input type="range" min={1} max={60} value={minutes} onChange={(e) => setMinutes(+e.target.value)} disabled={running} style={{ flex: 1 }} />
          <span className={s.dv}>{minutes} <small>min</small></span>
        </div>

        <div className={s.tctrl}>
          {!running ? (
            <button className={`${s.tbtn} ${s.go}`} onClick={() => { if (done) setSecs(minutes * 60); setRunning(true); setLogged(false); }}><Icon name="play" size={16} />{done ? "Recommencer" : "Démarrer"}</button>
          ) : (
            <button className={s.tbtn} onClick={() => setRunning(false)}><Icon name="clock" size={16} />Pause</button>
          )}
          <button className={s.tbtn} onClick={() => { setRunning(false); setSecs(minutes * 60); }}><Icon name="refresh" size={16} />Réinit.</button>
        </div>

        {logged && <div className={s.exdone}><Icon name="check" size={18} />Séance ajoutée · +{kcal} kcal à ton budget</div>}
        {logErr && <div className={s.scanerr} style={{ margin: "10px 0 0" }}>{logErr}</div>}
        <button className={s.savebtn} onClick={log} disabled={logged}>{logged ? "Ajouté ✓" : `J'ai terminé · +${kcal} kcal`}</button>

        <div className={s.rsec}>Comment faire</div>
        <ol className={s.rsteps}>{ex.steps.map((x, i) => <li key={i}>{x}</li>)}</ol>
        <div className={s.rsec}>Conseil</div>
        <p className={s.steps} style={{ borderLeftColor: "var(--lime)", marginBottom: 4 }}>{ex.tip}</p>
    </Modal>
  );
}

/* ---------------- REPAS IA (génération par Claude, adaptée aux macros restantes) ---------------- */
const MEAL_TABS = [
  { label: "Dîner", key: "diner" }, { label: "Petit-déj", key: "petit-dej" },
  { label: "Déjeuner", key: "dejeuner" }, { label: "Collation", key: "collation" },
] as const;

const FOCUS = [
  { label: "Équilibré", suffix: "" },
  { label: "Prise de muscle", suffix: " (riche en protéines, pour la prise de muscle)" },
  { label: "Perte de poids", suffix: " (léger, rassasiant, faible en calories)" },
  { label: "Pré-entraînement", suffix: " (riche en glucides, facile à digérer, avant le sport)" },
  { label: "Post-entraînement", suffix: " (riche en protéines et glucides, récupération après le sport)" },
] as const;

function RecipeModal({ meal, added, userId, onClose, onAdd, onCart }: { meal: AiMeal; added: boolean; userId?: string; onClose: () => void; onAdd: () => void; onCart: () => void }) {
  const steps = Array.isArray(meal.steps) ? meal.steps : [meal.steps];
  const ings = normIngredients(meal.ingredients);
  const missing = ings.filter((x) => !x.have);
  const [bought, setBought] = useState(false);
  return (
    <Modal tall onClose={onClose}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}><span className={s.x} onClick={onClose}>✕</span></div>
        <img className={s.mphoto} src={aiPhoto(meal.name)} alt={meal.name} />
        <div className={s.rh}>
          <div className={s.em}>{meal.emoji || "🍽️"}</div>
          <div><h3>{meal.name}</h3><span>{meal.time} min · {meal.kcal} kcal · {meal.tag}</span></div>
        </div>
        <div className={s.nrow}>
          <div className={s.ncell}><b>{meal.kcal}</b><span>kcal</span></div>
          <div className={s.ncell}><b>{meal.protein}g</b><span>prot</span></div>
          <div className={s.ncell}><b>{meal.carbs}g</b><span>gluc</span></div>
          <div className={s.ncell}><b>{meal.fat}g</b><span>lip</span></div>
        </div>
        <div className={s.rsec}>Ingrédients <span style={{ fontSize: 11, color: "var(--txt-3)", fontFamily: "var(--body)", fontWeight: 500 }}>· {ings.length - missing.length} en stock / {missing.length} à acheter</span></div>
        <ul className={s.inglist}>
          {ings.map((x, i) => (
            <li key={i} className={x.have ? s.ihave : s.ibuy}>
              <Icon name={x.have ? "check" : "cart"} size={13} />
              <span>{x.name}</span>
              {!x.have && <span className={s.buytag}>à acheter</span>}
            </li>
          ))}
        </ul>
        {missing.length > 0 && userId && (
          <button className={`${s.btn} ${s.ghost}`} style={{ width: "100%", marginBottom: 6 }} disabled={bought} onClick={async () => { await addManyToBuy(userId, missing.map((x) => ({ name: x.name }))); setBought(true); }}>
            <Icon name={bought ? "check" : "cart"} size={16} />{bought ? "Manquant ajouté aux courses ✓" : `Acheter le manquant (${missing.length})`}
          </button>
        )}
        <div className={s.rsec}>Préparation</div>
        <ol className={s.rsteps}>{steps.map((x, i) => <li key={i}>{x}</li>)}</ol>
        <div className={s.scanbtns} style={{ marginTop: 18 }}>
          <button className={`${s.btn} ${s.ghost}`} onClick={onCart}><Icon name="cart" size={16} />Ma liste</button>
          <button className={`${s.btn} ${s.prim}`} onClick={onAdd}><Icon name={added ? "check" : "plus"} size={16} />{added ? "Ajouté" : "Au journal"}</button>
        </div>
    </Modal>
  );
}

function RepasScreen({ day, profile, target, go }: { day: Day; profile: Profile | null; target: number; go: (t: Tab) => void }) {
  const [mode, setMode] = useState<"lib" | "ia" | "explorer">("lib");
  const [mi, setMi] = useState(0);
  const [meals, setMeals] = useState<AiMeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [detail, setDetail] = useState<AiMeal | null>(null);
  const [focusI, setFocusI] = useState(0);
  const [seen, setSeen] = useState<string[]>([]);
  const { user } = useAuth();
  const [pantry, setPantry] = useState<string[]>([]);

  useEffect(() => {
    if (user) loadPantry(user.id).then((items) => setPantry(items.filter((i) => i.status === "have").map((i) => i.name)));
  }, [user]);

  const goals = macroGoals(target, profile);

  const addMeal = async (m: AiMeal) => {
    try {
      await day.addEntry({ meal_type: MEAL_TABS[mi].key, name: m.name, qty: "1 portion", kcal: m.kcal, protein: m.protein, carbs: m.carbs, fat: m.fat });
      setAdded((a) => ({ ...a, [m.name]: true }));
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Enregistrement impossible. Réessaie.");
    }
  };
  const remaining = {
    kcal: Math.max(target - day.consumed + day.burned, 0),
    protein: Math.max(goals.p - day.macros.p, 0),
    carbs: Math.max(goals.c - day.macros.c, 0),
    fat: Math.max(goals.f - day.macros.f, 0),
  };

  const generate = async () => {
    setLoading(true); setErr(null); setAdded({});
    try {
      const r = await suggestMeals({
        mealType: MEAL_TABS[mi].label + FOCUS[focusI].suffix,
        goal: profile?.goal ?? "maintien",
        remaining, count: 3, pantry, exclude: seen,
      });
      setMeals(r);
      setSeen((p) => [...p, ...r.map((m) => m.name)].slice(-40));
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Génération impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`${s.phead} ${s.r} ${s.r1}`}>
        <div><div className={s.hi}>Adapté à ton profil et à tes besoins</div><h2>Recettes</h2></div>
        <button className={s.headact} onClick={() => go("courses")} aria-label="Liste de courses"><Icon name="cart" /></button>
      </div>

      <div className={`${s.subtoggle} ${s.r} ${s.r2}`}>
        <button className={mode === "lib" ? s.on : ""} onClick={() => setMode("lib")}><Icon name="meals" size={16} />Recettes</button>
        <button className={mode === "ia" ? s.on : ""} onClick={() => setMode("ia")}><Icon name="spark" size={16} />IA</button>
        <button className={mode === "explorer" ? s.on : ""} onClick={() => setMode("explorer")}><Icon name="search" size={16} />Explorer</button>
      </div>

      {mode === "lib" ? <Library day={day} pantry={pantry} userId={user?.id} go={go} /> : mode === "explorer" ? <Explorer go={go} /> : <>

      <div className={`${s.mealtabs} ${s.r} ${s.r2}`}>
        {MEAL_TABS.map((t, i) => <div key={t.key} className={`${s.mtab} ${mi === i ? s.on : ""}`} onClick={() => { setMi(i); setMeals([]); setSeen([]); setErr(null); }}>{t.label}</div>)}
      </div>
      <div className={`${s.exfrow} ${s.r} ${s.r2}`} style={{ marginBottom: 12 }}>
        {FOCUS.map((f, i) => <span key={f.label} className={`${s.ef} ${focusI === i ? s.on : ""}`} onClick={() => { setFocusI(i); setMeals([]); setSeen([]); }}>{f.label}</span>)}
      </div>

      <div className={`${s.genbar} ${s.r} ${s.r3}`}>
        <div className={s.gl}>{pantry.length ? `${pantry.length} ingrédient${pantry.length > 1 ? "s" : ""} dans ton garde-manger seront privilégiés` : "Repas calés sur ce qu'il te reste aujourd'hui"}</div>
        <div className={s.gmac}>
          <span className={s.gpill}><b>{fr(remaining.kcal)}</b> kcal</span>
          <span className={s.gpill}><b>{remaining.protein}</b>g prot</span>
          <span className={s.gpill}><b>{remaining.carbs}</b>g gluc</span>
          <span className={s.gpill}><b>{remaining.fat}</b>g lip</span>
        </div>
        <button className={s.genbtn} onClick={generate} disabled={loading}>
          <Icon name="spark" size={18} />{loading ? "Génération…" : meals.length ? "Proposer d'autres recettes" : `Générer des idées de ${MEAL_TABS[mi].label.toLowerCase()}`}
        </button>
      </div>

      {loading && <div className={s.genloading}><div className={s.gsp} />L&apos;IA compose tes repas…</div>}
      {err && <div className={`${s.scanerr} ${s.r}`}>{err}</div>}

      {meals.map((m, i) => (
        <div key={i} className={`${s.recipe} ${s.r}`} style={{ cursor: "pointer" }} onClick={() => setDetail(m)}>
          <div className={s.img}>
            <img className={s.cimg} src={aiPhoto(m.name)} alt={m.name} loading="lazy" />
            <span className={s.badge}><Icon name="spark" size={11} />Généré par IA</span>
          </div>
          <div className={s.body}>
            <h4>{m.name}</h4>
            <div className={s.meta}>
              <span><Icon name="clock" size={13} />{m.time} min</span>
              <span><Icon name="flameLine" size={13} />{m.kcal} kcal</span>
              <span>{m.tag}</span>
            </div>
            <div className={s.minimacros}>
              <div className={s.mm}><b>{m.protein}g</b><span>Prot</span></div>
              <div className={s.mm}><b>{m.carbs}g</b><span>Gluc</span></div>
              <div className={s.mm}><b>{m.fat}g</b><span>Lip</span></div>
            </div>
            <div className={s.seemore}><Icon name="arrowRight" size={14} />Voir la recette détaillée</div>
            <div className={s.acts} onClick={(e) => e.stopPropagation()}>
              <button className={s.add} onClick={() => addMeal(m)}>
                <Icon name={added[m.name] ? "check" : "plus"} size={15} />{added[m.name] ? "Ajouté" : "Au journal"}
              </button>
              <button className={s.cartbtn} onClick={() => go("courses")} aria-label="Ajouter aux courses"><Icon name="cart" size={16} /></button>
            </div>
          </div>
        </div>
      ))}

      {detail && (
        <RecipeModal
          meal={detail}
          added={!!added[detail.name]}
          userId={user?.id}
          onClose={() => setDetail(null)}
          onAdd={async () => { await addMeal(detail); }}
          onCart={() => { setDetail(null); go("courses"); }}
        />
      )}
      </>}
    </>
  );
}

/* ---------------- EXPLORER RECETTES (TheMealDB, traduit FR auto) ---------------- */
const mealTitleCache = new Map<string, string>();

async function translateTitles(m: MealLite[]): Promise<MealLite[]> {
  const need = m.filter((x) => !mealTitleCache.has(x.title));
  if (need.length) {
    try {
      const t = await translateTexts(need.map((x) => x.title));
      need.forEach((x, i) => mealTitleCache.set(x.title, t[i] ?? x.title));
    } catch { /* garde l'anglais si la traduction échoue */ }
  }
  return m.map((x) => ({ ...x, title: mealTitleCache.get(x.title) ?? x.title }));
}

function Explorer({ go }: { go: (t: Tab) => void }) {
  const { user } = useAuth();
  const [cats, setCats] = useState<string[]>([]);
  const [cat, setCat] = useState("Chicken");
  const [meals, setMeals] = useState<MealLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<MealFull | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => { mealCategories().then((c) => { if (c.length) setCats(c); }); }, []);
  useEffect(() => {
    setLoading(true);
    mealsByCategory(cat).then(async (m) => { setMeals(m); setLoading(false); setMeals(await translateTitles(m)); });
  }, [cat]);

  const open = async (id: string) => {
    setLoadingDetail(true); setDetail(null);
    const m = await mealLookup(id);
    if (m) {
      try {
        const texts = [m.title, ...m.ingredients.map((i) => `${i.measure} ${i.name}`.trim()), ...m.steps];
        const t = await translateTexts(texts);
        let k = 0;
        const title = t[k++];
        const ingredients = m.ingredients.map(() => ({ measure: "", name: t[k++] }));
        const steps = m.steps.map(() => t[k++]);
        setDetail({ ...m, title, ingredients, steps });
      } catch { setDetail(m); }
    }
    setLoadingDetail(false);
  };
  const list = cats.length ? cats : ["Chicken", "Beef", "Seafood", "Vegetarian", "Pasta", "Dessert", "Breakfast"];

  return (
    <>
      <div className={`${s.exfrow} ${s.r} ${s.r3}`}>
        {list.map((c) => <span key={c} className={`${s.ef} ${cat === c ? s.on : ""}`} onClick={() => setCat(c)}>{c}</span>)}
      </div>
      {loading ? (
        <div className={s.explload}><div className={s.gsp} />Chargement des recettes…</div>
      ) : (
        <div className={`${s.rgrid} ${s.r} ${s.r4}`}>
          {meals.map((m) => (
            <div key={m.id} className={s.rcard} onClick={() => open(m.id)}>
              <img src={m.thumb} alt={m.title} loading="lazy" />
              <div className={s.rt}>{m.title}</div>
            </div>
          ))}
        </div>
      )}
      {(detail || loadingDetail) && <MealDetail meal={detail} loading={loadingDetail} userId={user?.id} onClose={() => { setDetail(null); setLoadingDetail(false); }} go={go} />}
    </>
  );
}

function MealDetail({ meal, loading, userId, onClose, go }: { meal: MealFull | null; loading: boolean; userId?: string; onClose: () => void; go: (t: Tab) => void }) {
  const [added, setAdded] = useState(false);
  return (
    <Modal tall onClose={onClose}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}><span className={s.x} onClick={onClose}>✕</span></div>
        {loading || !meal ? (
          <div className={s.explload}><div className={s.gsp} />Chargement de la recette…</div>
        ) : (
          <>
            <img className={s.mphoto} src={meal.thumb} alt={meal.title} />
            <h3 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 20, marginBottom: 9 }}>{meal.title}</h3>
            <div className={s.mmeta}><span>{meal.category}</span>{meal.area ? <span>{meal.area}</span> : null}</div>
            <div className={s.rsec}>Ingrédients</div>
            <ul className={s.ringlist}>{meal.ingredients.map((x, i) => <li key={i}>{x.measure ? `${x.measure} · ` : ""}{x.name}</li>)}</ul>
            <button className={s.savebtn} style={{ marginTop: 14 }} disabled={added || !userId} onClick={async () => { if (!userId) return; await addManyToBuy(userId, meal.ingredients.map((x) => ({ name: x.name }))); setAdded(true); }}>
              <Icon name={added ? "check" : "cart"} size={16} /> {added ? "Ajouté aux courses ✓" : "Ajouter les ingrédients aux courses"}
            </button>
            <button className={s.switchmode} onClick={() => { onClose(); go("courses"); }}>Voir ma liste de courses</button>
            <div className={s.rsec}>Préparation</div>
            <ol className={s.rsteps}>{meal.steps.map((x, i) => <li key={i}>{x}</li>)}</ol>
          </>
        )}
    </Modal>
  );
}

/* ---------------- Scanner code-barres (caméra, ZXing — iOS + Android) ---------------- */
function BarcodeScanner({ onDetected, onClose, onUnsupported }: { onDetected: (v: string) => void; onClose: () => void; onUnsupported: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let controls: { stop: () => void } | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        if (cancelled || !videoRef.current) return;
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result) => {
            const text = result?.getText();
            if (text) { controls?.stop(); onDetected(text); }
          }
        );
        if (cancelled) controls.stop();
      } catch {
        onUnsupported();
      }
    })();
    return () => { cancelled = true; try { controls?.stop(); } catch { /* déjà arrêté */ } };
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

/* ---------------- BIBLIOTHÈQUE DE RECETTES (FR, avec photos) ---------------- */
function Library({ day, pantry, userId, go }: { day: Day; pantry: string[]; userId?: string; go: (t: Tab) => void }) {
  const { profile } = useAuth();
  const [meal, setMeal] = useState<"all" | MealKey>("all");
  const [sel, setSel] = useState<LibRecipe | null>(null);
  // Rotation : l'ordre est mélangé à chaque visite (seed aléatoire) et au clic sur « Autres ».
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  // Recettes FR traduites (TheMealDB, avec photos + vidéos), chargées à la volée.
  const [extra, setExtra] = useState<LibRecipe[]>([]);
  // Partage entre amis
  const [friends, setFriends] = useState<{ id: string; name: string }[]>([]);
  const [received, setReceived] = useState<SharedRecipe[]>([]);
  const [inbox, setInbox] = useState(false);
  useEffect(() => { import("@/lib/recipes-fr.json").then((m) => setExtra((m.default as unknown as LibRecipe[]) ?? [])).catch(() => {}); }, []);
  useEffect(() => {
    if (!userId) return;
    loadConnections().then((cs) => setFriends(cs.filter((c) => c.status === "accepted").map((c) => {
      const me = c.requester_id === userId;
      return { id: me ? c.addressee_id : c.requester_id, name: (me ? c.addressee_username : c.requester_username) ?? "ami" };
    })));
    loadReceivedRecipes().then((rs) => setReceived(rs.filter((x) => x.to_user === userId)));
  }, [userId]);
  const filters: [string, string][] = [["all", "Tous"], ["petit-dej", "Petit-déj"], ["dejeuner", "Déjeuner"], ["diner", "Dîner"], ["collation", "Collation"]];
  const all = useMemo(() => [...libRecipes, ...extra], [extra]);
  const list = useMemo(() => shuffleSeeded(all.filter((r) => meal === "all" || r.meal === meal), seed), [all, meal, seed]);
  const unseen = received.filter((x) => !x.seen).length;
  return (
    <>
      <div className={`${s.exfrow} ${s.r} ${s.r3}`}>
        {filters.map(([v, l]) => <span key={v} className={`${s.ef} ${meal === v ? s.on : ""}`} onClick={() => setMeal(v as "all" | MealKey)}>{l}</span>)}
      </div>
      <div className={`${s.libbar} ${s.r} ${s.r3}`}>
        <button onClick={() => setInbox(true)}><Icon name="users" size={14} />Reçues{received.length ? ` (${received.length})` : ""}{unseen ? <span className={s.dotbadge} /> : null}</button>
        <button onClick={() => setSeed(Math.floor(Math.random() * 1e9))}><Icon name="refresh" size={14} />Autres recettes</button>
      </div>
      <div className={`${s.rgrid} ${s.r} ${s.r4}`}>
        {list.map((rc) => (
          <div key={rc.id} className={s.rcard} onClick={() => setSel(rc)}>
            <img src={rc.photo} alt={rc.name} loading="lazy" />
            <div className={s.rt}>{rc.name}<div style={{ fontSize: 11, color: "var(--txt-2)", fontWeight: 500, marginTop: 3 }}>{rc.kcal} kcal · {rc.protein}g P</div></div>
          </div>
        ))}
      </div>

      {inbox && (
        <Modal onClose={() => setInbox(false)}>
            <h3>Recettes reçues <span className={s.x} onClick={() => setInbox(false)}>✕</span></h3>
            {received.length === 0 ? (
              <div className={s.pempty}>Aucune recette reçue pour l’instant. Tes amis peuvent t’en envoyer depuis une fiche recette.</div>
            ) : received.map((sr) => (
              <div key={sr.id} className={s.connrow} style={{ cursor: "pointer" }} onClick={() => { setInbox(false); setSel(sr.recipe); if (!sr.seen) { markRecipeSeen(sr.id); setReceived((rs) => rs.map((x) => x.id === sr.id ? { ...x, seen: true } : x)); } }}>
                <img src={sr.recipe.photo} alt="" style={{ width: 46, height: 46, borderRadius: 10, objectFit: "cover", flex: "0 0 auto" }} />
                <div className={s.ce}><b>{sr.recipe.name}</b><span>de @{sr.from_username ?? "ami"}{!sr.seen ? " · nouveau" : ""}</span></div>
                <span className={s.ch}>›</span>
              </div>
            ))}
        </Modal>
      )}

      {sel && <LibRecipeModal recipe={sel} pantry={pantry} userId={userId} myUsername={profile?.username ?? null} friends={friends} day={day} go={go} onClose={() => setSel(null)} />}
    </>
  );
}

function LibRecipeModal({ recipe, pantry, userId, myUsername, friends, day, go, onClose }: { recipe: LibRecipe; pantry: string[]; userId?: string; myUsername?: string | null; friends?: { id: string; name: string }[]; day: Day; go: (t: Tab) => void; onClose: () => void }) {
  const [added, setAdded] = useState(false);
  const [bought, setBought] = useState(false);
  const [picker, setPicker] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const pals = friends ?? [];
  const share = async (friendId: string, friendName: string) => {
    if (!userId || sending) return;
    setSending(true);
    const err = await shareRecipe(userId, myUsername ?? null, friendId, recipe);
    setSending(false);
    if (err) { setSentTo(`⚠️ ${err}`); return; }
    setSentTo(`Envoyée à ${friendName} ✓`);
    setTimeout(() => setPicker(false), 1100);
  };
  const has = (ing: string) => pantry.some((p) => ing.toLowerCase().includes(p.toLowerCase()));
  const missing = recipe.ingredients.filter((i) => !has(i));
  return (
    <Modal tall onClose={onClose}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}><span className={s.x} onClick={onClose}>✕</span></div>
        {recipe.video && ytId(recipe.video)
          ? <div className={s.vidwrap}><iframe className={s.vid} src={`https://www.youtube-nocookie.com/embed/${ytId(recipe.video)}`} title={recipe.name} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="encrypted-media; fullscreen" allowFullScreen /></div>
          : <img className={s.mphoto} src={recipe.photo} alt={recipe.name} />}
        <h3 style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 20, marginBottom: 9 }}>{recipe.emoji} {recipe.name}</h3>
        <div className={s.mmeta}><span>{recipe.time} min</span><span>{recipe.kcal} kcal</span><span>{recipe.tag}</span></div>
        <div className={s.nrow}>
          <div className={s.ncell}><b>{recipe.kcal}</b><span>kcal</span></div>
          <div className={s.ncell}><b>{recipe.protein}g</b><span>prot</span></div>
          <div className={s.ncell}><b>{recipe.carbs}g</b><span>gluc</span></div>
          <div className={s.ncell}><b>{recipe.fat}g</b><span>lip</span></div>
        </div>
        <div className={s.rsec}>Ingrédients <span style={{ fontSize: 11, color: "var(--txt-3)", fontFamily: "var(--body)", fontWeight: 500 }}>· {recipe.ingredients.length - missing.length} en stock / {missing.length} à acheter</span></div>
        <ul className={s.inglist}>
          {recipe.ingredients.map((x, i) => { const h = has(x); return (
            <li key={i} className={h ? s.ihave : s.ibuy}><Icon name={h ? "check" : "cart"} size={13} /><span>{x}</span>{!h && <span className={s.buytag}>à acheter</span>}</li>
          ); })}
        </ul>
        {missing.length > 0 && userId && (
          <button className={`${s.btn} ${s.ghost}`} style={{ width: "100%", marginBottom: 6 }} disabled={bought} onClick={async () => { await addManyToBuy(userId, missing.map((x) => ({ name: x }))); setBought(true); }}>
            <Icon name={bought ? "check" : "cart"} size={16} />{bought ? "Manquant ajouté ✓" : `Acheter le manquant (${missing.length})`}
          </button>
        )}
        <div className={s.rsec}>Préparation</div>
        <ol className={s.rsteps}>{recipe.steps.map((x, i) => <li key={i}>{x}</li>)}</ol>

        {userId && (
          <button className={`${s.btn} ${s.ghost}`} style={{ width: "100%", marginTop: 10 }} onClick={() => { setSentTo(null); setPicker(true); }}>
            <Icon name="users" size={16} />Partager à un ami
          </button>
        )}

        <div className={s.scanbtns} style={{ marginTop: 10 }}>
          <button className={`${s.btn} ${s.ghost}`} onClick={() => { onClose(); go("courses"); }}><Icon name="cart" size={16} />Ma liste</button>
          <button className={`${s.btn} ${s.prim}`} disabled={added} onClick={async () => { try { await day.addEntry({ meal_type: recipe.meal, name: recipe.name, qty: "1 portion", kcal: recipe.kcal, protein: recipe.protein, carbs: recipe.carbs, fat: recipe.fat }); setAdded(true); } catch { /* réseau : le bouton reste actif pour réessayer */ } }}><Icon name={added ? "check" : "plus"} size={16} />{added ? "Ajouté" : "Au journal"}</button>
        </div>

        {picker && (
          <Modal onClose={() => setPicker(false)}>
              <h3>Partager « {recipe.name} » <span className={s.x} onClick={() => setPicker(false)}>✕</span></h3>
              {sentTo && <div className={s.pempty} style={{ color: sentTo.startsWith("⚠️") ? "var(--coral)" : "var(--lime)" }}>{sentTo}</div>}
              {pals.length === 0 ? (
                <div className={s.pempty}>Aucun ami connecté. Ajoute des amis dans Profil → Partage, puis reviens ici.</div>
              ) : pals.map((f) => (
                <div key={f.id} className={s.connrow} style={{ cursor: sending ? "wait" : "pointer", opacity: sending ? 0.6 : 1 }} onClick={() => share(f.id, f.name)}>
                  <div className={s.av2}>{(f.name[0] ?? "?").toUpperCase()}</div>
                  <div className={s.ce}><b>@{f.name}</b><span>Envoyer cette recette</span></div>
                  <span className={s.ch}><Icon name="send" size={15} /></span>
                </div>
              ))}
          </Modal>
        )}
    </Modal>
  );
}

/* ---------------- COACH IA ---------------- */
function CoachScreen({ profile, day, target }: { profile: Profile | null; day: Day; target: number }) {
  const { user } = useAuth();
  const first = profile?.display_name ? profile.display_name.split(" ")[0] : "";
  const [messages, setMessages] = useState<{ from: "ai" | "me"; text: string }[]>([
    { from: "ai", text: `Salut ${first} 👋 Je suis ton coach BODYUP. Pose-moi tes questions sur ta nutrition, tes objectifs ou tes entraînements — je connais tes stats du jour et je m'adapte à toi.` },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement | null>(null);
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setDraft("");
    const next = [...messages, { from: "me" as const, text: q }];
    setMessages(next);
    setBusy(true);
    try {
      const history: CoachMsg[] = next.slice(1).map((m) => ({ role: m.from === "me" ? "user" : "assistant", text: m.text }));
      const reply = await askCoach(history, {
        name: profile?.display_name, goal: profile?.goal, weight_kg: profile?.weight_kg, target_kg: profile?.target_kg,
        calorie_target: target, tdee: profile?.tdee,
        today: { consumed: day.consumed, remaining: target - day.consumed, protein: day.macros.p, carbs: day.macros.c, fat: day.macros.f, glasses: day.glasses, steps: day.steps, burned: day.burned },
      });
      setMessages((m) => [...m, { from: "ai", text: reply || "Désolé, je n'ai pas de réponse là tout de suite." }]);
    } catch (e) {
      setMessages((m) => [...m, { from: "ai", text: `⚠️ ${e instanceof Error ? e.message : "Coach indisponible"}.\nVérifie que la fonction « coach » est bien déployée dans Supabase.` }]);
    } finally {
      setBusy(false);
    }
  };

  // Bilan hebdomadaire : injecte les 7 derniers jours dans la question au coach.
  const weeklyReview = async () => {
    if (!user || busy) return;
    setBusy(true);
    let lines = "";
    try {
      const days = (await loadHistory(user.id)).slice(0, 7).reverse();
      lines = days
        .map((d) => `${d.date} : ${d.kcal} kcal (P${d.protein}/G${d.carbs}/L${d.fat}), brûlé ${d.burned} kcal, eau ${(d.glasses * 0.25).toFixed(1)} L, ${d.steps || 0} pas${d.weight != null ? `, poids ${d.weight} kg` : ""}`)
        .join("\n");
    } catch { /* le coach fera sans le détail */ } finally { setBusy(false); }
    await send(`Fais-moi le bilan de ma semaine : ce qui va, ce qui doit s'améliorer, et 3 conseils concrets pour la semaine prochaine.\n\nMes 7 derniers jours :\n${lines || "(données indisponibles)"}`);
  };

  return (
    <>
      <div className={`${s.coachhead} ${s.r} ${s.r1}`}>
        <div className={s.orb}><Icon name="spark" size={24} /></div>
        <div><b>Coach BODYUP</b><span className={s.on}><i />En ligne · 24h/24</span></div>
        <button className={s.headact} onClick={weeklyReview} disabled={busy} aria-label="Bilan de la semaine" title="Bilan de la semaine"><Icon name="stats" /></button>
      </div>
      <div className={s.chat} ref={scroller}>
        {messages.map((m, i) => (
          <div key={i} className={`${s.bub} ${m.from === "ai" ? s.ai : s.me}`} style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
        ))}
        {busy && <div className={`${s.bub} ${s.ai}`}><span className={s.typing}><i /><i /><i /></span></div>}
        {messages.length <= 1 && (
          <div className={s.chips}>
            <span className={s.chip} style={{ borderColor: "rgba(201,255,60,.4)", color: "var(--lime)" }} onClick={weeklyReview}>📊 Bilan de ma semaine</span>
            {coachChips.map((c) => <span key={c} className={s.chip} onClick={() => send(c)}>{c}</span>)}
          </div>
        )}
      </div>
      <div className={`${s.composer} ${s.r} ${s.r6}`}>
        <input placeholder="Pose ta question au coach…" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(draft); }} disabled={busy} />
        <button className={s.snd} onClick={() => send(draft)} disabled={busy} aria-label="Envoyer"><Icon name="send" size={18} /></button>
      </div>
    </>
  );
}

/* ---------------- STATS (données réelles) ---------------- */
/** Aperçu agrégé d'un proche, renvoyé par la fonction SQL connected_overview. */
interface CmpOverview {
  points?: number;
  categories?: string[];
  weight_start?: number | string | null;
  weight_current?: number | string | null;
  target_kg?: number | string | null;
  steps?: number;
  sleep_min?: number;
  glasses?: number;
  goals_met?: number;
}

function StatsScreen({ profile, day, go }: { profile: Profile | null; day: Day; go: (t: Tab) => void }) {
  const { user, refreshProfile } = useAuth();
  const [weights, setWeights] = useState<{ date: string; weight_kg: number }[]>([]);
  const [editW, setEditW] = useState(false);
  const [wval, setWval] = useState("");
  const [editA, setEditA] = useState(false);
  const [stepsVal, setStepsVal] = useState("");
  const [sleepVal, setSleepVal] = useState("");
  const [busy, setBusy] = useState(false);
  const [conns, setConns] = useState<Connection[]>([]);
  const [picker, setPicker] = useState(false);
  const [compare, setCompare] = useState<{ name: string; cats: ShareCat[] } | null>(null);
  const [ov, setOv] = useState<CmpOverview | null>(null);
  const [myPoints, setMyPoints] = useState(0);

  useEffect(() => { loadConnections().then((cs) => setConns(cs.filter((c) => c.status === "accepted"))); }, []);
  useEffect(() => { if (user) loadStats(user.id).then((st) => { const p = computePoints(st); setMyPoints(p); persistGamification(user.id, p, levelFor(p)); }); }, [user]);
  const selectCompare = async (c: Connection) => {
    setPicker(false);
    const oid = c.requester_id === user?.id ? c.addressee_id : c.requester_id;
    const name = (c.requester_id === user?.id ? c.addressee_username : c.requester_username) ?? "?";
    const tc = (c.requester_id === user?.id ? c.addressee_categories : c.requester_categories) as ShareCat[];
    setCompare({ name, cats: tc }); setOv(null);
    const { data } = await supabase.rpc("connected_overview", { other: oid, d: todayISO() });
    if (data) setOv(data as CmpOverview);
    else {
      // repli si update_v2.sql n'est pas encore exécuté : points seuls
      const { data: pts } = await supabase.rpc("connected_points", { other: oid });
      setOv({ points: (pts as number) ?? 0 });
    }
  };

  const fmtSleep = (m: number) => (m > 0 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : "—");

  const loadW = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("weight_logs").select("date,weight_kg").eq("user_id", user.id).order("date", { ascending: true }).limit(90);
    setWeights((data as { date: string; weight_kg: number }[]) ?? []);
  }, [user]);
  useEffect(() => { loadW(); }, [loadW]);

  const ws = weights.map((w) => Number(w.weight_kg));
  const currentW = ws.length ? ws[ws.length - 1] : profile?.weight_kg ?? null;
  const startW = ws.length ? ws[0] : null;
  const lost = startW != null && currentW != null ? +(startW - currentW).toFixed(1) : null;
  const target = profile?.calorie_target ?? 2000;
  const remaining = target - day.consumed + day.burned;
  const deficit = profile?.tdee != null ? profile.tdee - day.consumed + day.burned : null;

  const min = ws.length ? Math.min(...ws) : 0;
  const max = ws.length ? Math.max(...ws) : 1;
  const range = max - min || 1;
  const pts = ws.map((w, i) => { const x = ws.length > 1 ? (i / (ws.length - 1)) * 100 : 50; const y = 92 - ((w - min) / range) * 84; return `${x.toFixed(1)},${y.toFixed(1)}`; }).join(" ");

  const myEvol = ws.length >= 2 ? ((ws[0] - ws[ws.length - 1]) / ws[0]) * 100 : null;
  const theirEvol = ov?.weight_start != null && ov?.weight_current != null && Number(ov.weight_start) !== 0
    ? ((Number(ov.weight_start) - Number(ov.weight_current)) / Number(ov.weight_start)) * 100 : null;
  const fmtEvol = (v: number | null) => (v == null ? "—" : `${v >= 0 ? "−" : "+"}${Math.abs(v).toFixed(1)}%`);
  const lead = (a: number | null, b: number | null): 0 | 1 | 2 => (a == null || b == null ? 0 : a > b ? 1 : b > a ? 2 : 0);

  // % d'avancement vers l'objectif poids : 0 % au départ, 100 % à la cible.
  const progressPct = (start: number | null, cur: number | null, tgt: number | null): number | null => {
    if (start == null || cur == null || tgt == null || start === tgt) return null;
    return Math.max(0, Math.min(100, Math.round(((start - cur) / (start - tgt)) * 100)));
  };
  const myProgress = progressPct(startW, currentW, profile?.target_kg ?? null);
  const theirProgress = ov ? progressPct(
    ov.weight_start != null ? Number(ov.weight_start) : null,
    ov.weight_current != null ? Number(ov.weight_current) : null,
    ov.target_kg != null ? Number(ov.target_kg) : null
  ) : null;

  // objectifs du jour atteints (mêmes règles des deux côtés : pas ≥ 8000, eau ≥ 2 L, calories dans l'objectif)
  const myGoalsMet = (day.steps >= 8000 ? 1 : 0) + (day.glasses >= 8 ? 1 : 0) + (day.consumed > 0 && day.consumed <= target ? 1 : 0);
  const fmtSleepCmp = (m: number | null | undefined) => (m && m > 0 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, "0")}` : "—");

  const saveWeight = async () => {
    const v = parseFloat(wval);
    if (!v || !user) return;
    setBusy(true);
    await supabase.from("weight_logs").insert({ user_id: user.id, weight_kg: v });
    await supabase.from("profiles").update({ weight_kg: v, updated_at: new Date().toISOString() }).eq("id", user.id);
    setBusy(false); setEditW(false); setWval("");
    await loadW(); await refreshProfile();
  };

  return (
    <>
      <div className={`${s.phead} ${s.r} ${s.r1}`}>
        <div><div className={s.hi}>Ta progression</div><h2>Statistiques</h2></div>
        <div style={{ display: "flex", gap: 9 }}>
          <button className={s.headact} onClick={() => setPicker(true)} aria-label="Comparer avec un proche"><Icon name="users" /></button>
          <button className={s.headact} onClick={() => go("progress")} aria-label="Photos de progression"><Icon name="camera" /></button>
        </div>
      </div>

      <div className={`${s.kpibig} ${s.r} ${s.r2}`}>
        <div className={s.wsum}>
          <div>
            <div className={s.l}>Poids actuel{lost != null && lost > 0 ? <span className={`${s.wdelta} ${s.up}`} style={{ marginLeft: 8 }}>−{lost} kg</span> : null}</div>
            <div className={s.wbig}>{currentW != null ? currentW : "—"} <small>kg · cible {profile?.target_kg ?? "—"} kg</small></div>
          </div>
          <button className={s.wlog} onClick={() => { setWval(currentW != null ? String(currentW) : ""); setEditW(true); }}>+ Poids</button>
        </div>
        {ws.length >= 2 ? (
          <div className={s.wtrend}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline points={pts} fill="none" stroke="var(--lime)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        ) : (
          <div className={s.wempty}>Enregistre ton poids régulièrement (bouton « + Poids ») pour voir ta tendance ici.</div>
        )}
      </div>

      {compare && ov && (
        <div className={`${s.kpibig} ${s.r} ${s.r2}`} style={{ background: "linear-gradient(165deg,rgba(183,155,255,.12),rgba(255,255,255,.02))", borderColor: "rgba(183,155,255,.25)" }}>
          <div className={s.wsum}>
            <div className={s.l}>Défi avec <b style={{ color: "var(--violet)" }}>{compare.name}</b></div>
            <button className={s.wlog} style={{ background: "var(--card)", color: "var(--txt-2)" }} onClick={() => { setCompare(null); setOv(null); }}>Fermer</button>
          </div>
          <div className={s.cmpgrid}>
            <div className={s.cmphead}><span /><span>Moi</span><span>{compare.name}</span></div>
            <CmpRow label="Points" mine={fr(myPoints)} theirs={fr(ov.points ?? 0)} lead={lead(myPoints, ov.points ?? 0)} />
            {compare.cats.includes("poids") && (
              <>
                <CmpRow label="Avancement objectif" mine={myProgress != null ? `${myProgress} %` : "—"} theirs={theirProgress != null ? `${theirProgress} %` : "—"} lead={lead(myProgress, theirProgress)} />
                <CmpRow label="Évolution poids" mine={fmtEvol(myEvol)} theirs={fmtEvol(theirEvol)} lead={lead(myEvol, theirEvol)} />
                <CmpRow label="Poids actuel" mine={currentW != null ? `${currentW} kg` : "—"} theirs={ov.weight_current != null ? `${Number(ov.weight_current)} kg` : "—"} lead={0} />
              </>
            )}
            {compare.cats.includes("pas") && (
              <>
                <CmpRow label="Pas aujourd'hui" mine={fr(day.steps)} theirs={fr(ov.steps ?? 0)} lead={lead(day.steps, ov.steps ?? 0)} />
                <CmpRow label="Sommeil" mine={fmtSleep(day.sleepMin)} theirs={fmtSleepCmp(ov.sleep_min)} lead={lead(day.sleepMin, ov.sleep_min ?? 0)} />
                <CmpRow label="Eau aujourd'hui" mine={`${(day.glasses * 0.25).toFixed(1)} L`} theirs={`${(((ov.glasses ?? 0)) * 0.25).toFixed(1)} L`} lead={lead(day.glasses, ov.glasses ?? 0)} />
                <CmpRow label="Objectifs du jour" mine={`${myGoalsMet}/3`} theirs={`${ov.goals_met ?? 0}/3`} lead={lead(myGoalsMet, ov.goals_met ?? 0)} />
              </>
            )}
            {!compare.cats.includes("poids") && !compare.cats.includes("pas") && <div className={s.pempty}>Cette personne ne partage pas de KPI comparables.</div>}
          </div>
          {compare.cats.includes("pas") && <div className={s.empty2} style={{ marginTop: 8 }}>Objectifs du jour : ≥ 8 000 pas · ≥ 2 L d&apos;eau · calories dans l&apos;objectif.</div>}
        </div>
      )}

      <div className={`${s.kgrid} ${s.r} ${s.r3}`}>
        <Metric icon="clock" tint="rgba(91,209,255,.12)" color="var(--sky)" v={fr(Math.max(remaining, 0))} unit=" kcal" k="Restantes aujourd'hui" />
        <Metric icon="flameLine" tint="rgba(255,122,83,.12)" color="var(--coral)" v={fr(day.burned)} unit=" kcal" k={day.stepsKcal > 0 ? `Brûlées (dont ${fr(day.stepsKcal)} par les pas)` : "Brûlées aujourd'hui"} />
        <Metric icon="check" tint="rgba(201,255,60,.12)" color="var(--lime)" v={profile?.calorie_target ? fr(profile.calorie_target) : "—"} unit=" kcal" k="Objectif quotidien" />
        <Metric icon="trend" tint="rgba(183,155,255,.12)" color="var(--violet)" v={deficit != null ? `${deficit >= 0 ? "−" : "+"}${fr(Math.abs(deficit))}` : "—"} unit=" kcal" k="Déficit du jour" />
        <Metric icon="steps" tint="rgba(91,209,255,.12)" color="var(--sky)" v={fr(day.steps)} unit=" pas" k="Pas aujourd'hui" />
        <Metric icon="moon" tint="rgba(183,155,255,.12)" color="var(--violet)" v={fmtSleep(day.sleepMin)} unit="" k="Sommeil" />
        <Metric icon="trend" tint="rgba(255,194,75,.12)" color="var(--amber)" v={profile?.tdee ? fr(profile.tdee) : "—"} unit=" kcal" k="Dépense (TDEE)" />
        <Metric icon="bolt" tint="rgba(91,209,255,.12)" color="var(--sky)" v={(day.glasses * 0.25).toFixed(1)} unit=" L" k="Eau aujourd'hui" />
      </div>

      <div className={`${s.healthcard} ${s.r} ${s.r4}`} onClick={() => { setStepsVal(day.steps ? String(day.steps) : ""); setSleepVal(day.sleepMin ? (day.sleepMin / 60).toFixed(1) : ""); setEditA(true); }}>
        <div className={s.ic}><Icon name="steps" /></div>
        <div><b>Saisir pas &amp; sommeil</b><span>Les pas comptent dans tes calories brûlées</span></div>
        <span className={s.ch}>›</span>
      </div>

      <div className={`${s.healthcard} ${s.r} ${s.r5}`} onClick={() => go("histo")} style={{ background: "linear-gradient(120deg,rgba(183,155,255,.1),rgba(255,255,255,.02))", borderColor: "rgba(183,155,255,.22)" }}>
        <div className={s.ic} style={{ background: "rgba(183,155,255,.14)" }}><Icon name="calendar" /></div>
        <div><b>Historique &amp; export</b><span>Tous tes jours enregistrés · export CSV complet</span></div>
        <span className={s.ch}>›</span>
      </div>

      <div className={`${s.healthcard} ${s.r} ${s.r5}`} onClick={() => go("profil")} style={{ background: "linear-gradient(120deg,rgba(201,255,60,.1),rgba(255,255,255,.02))", borderColor: "rgba(201,255,60,.22)" }}>
        <div className={s.ic} style={{ background: "rgba(201,255,60,.14)" }}><Icon name="diamond" /></div>
        <div><b>{fr(myPoints)} points · récompenses</b><span>Voir tes badges et ton niveau</span></div>
        <span className={s.ch}>›</span>
      </div>

      {editW && (
        <Modal center onClose={() => setEditW(false)}>
            <h3>Mettre à jour mon poids <span className={s.x} onClick={() => setEditW(false)}>✕</span></h3>
            <label>Poids (kg)</label>
            <input className={s.inp} type="number" inputMode="decimal" value={wval} onChange={(e) => setWval(e.target.value)} placeholder="78.5" autoFocus />
            <button className={s.savebtn} onClick={saveWeight} disabled={busy || !wval}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
        </Modal>
      )}

      {editA && (
        <Modal center onClose={() => setEditA(false)}>
            <h3>Activité du jour <span className={s.x} onClick={() => setEditA(false)}>✕</span></h3>
            <label>Nombre de pas</label>
            <input className={s.inp} type="number" inputMode="numeric" value={stepsVal} onChange={(e) => setStepsVal(e.target.value)} placeholder="8000" />
            <label>Sommeil (heures)</label>
            <input className={s.inp} type="number" inputMode="decimal" value={sleepVal} onChange={(e) => setSleepVal(e.target.value)} placeholder="7.5" />
            <button className={s.savebtn} onClick={async () => {
              setBusy(true);
              await day.setDailyMetric({ steps: parseInt(stepsVal) || 0, sleep_min: Math.round((parseFloat(sleepVal) || 0) * 60) });
              setBusy(false); setEditA(false);
            }} disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
        </Modal>
      )}

      {picker && (
        <Modal onClose={() => setPicker(false)}>
            <h3>Comparer avec… <span className={s.x} onClick={() => setPicker(false)}>✕</span></h3>
            {conns.length === 0 ? (
              <div className={s.pempty}>Aucun proche connecté. Ajoute-en un dans Profil → Partage.</div>
            ) : (
              conns.map((c) => {
                const name = (c.requester_id === user?.id ? c.addressee_username : c.requester_username) ?? "?";
                return (
                  <div key={c.id} className={s.connrow} style={{ cursor: "pointer" }} onClick={() => selectCompare(c)}>
                    <div className={s.av2}>{(name[0] ?? "?").toUpperCase()}</div>
                    <div className={s.ce}><b>{name}</b><span>Voir le défi</span></div>
                    <span className={s.ch}>›</span>
                  </div>
                );
              })
            )}
        </Modal>
      )}
    </>
  );
}

function CmpRow({ label, mine, theirs, lead }: { label: string; mine: string; theirs: string; lead: 0 | 1 | 2 }) {
  return (
    <div className={s.cmprow}>
      <span className={s.cl}>{label}</span>
      <span className={`${s.cv} ${lead === 1 ? s.win : ""}`}>{mine}</span>
      <span className={`${s.cv} ${lead === 2 ? s.win : ""}`}>{theirs}</span>
    </div>
  );
}

/* ---------------- HISTORIQUE & EXPORT (toutes les données, jour par jour) ---------------- */
const fmtDay = (iso: string) => {
  const d = new Date(iso + "T12:00:00");
  const txt = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
};

const lastNDays = (n: number): string[] => {
  const out: string[] = [];
  const d = new Date(todayISO() + "T12:00:00");
  const p = (x: number) => String(x).padStart(2, "0");
  for (let i = 0; i < n; i++) {
    out.unshift(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`);
    d.setDate(d.getDate() - 1);
  }
  return out;
};

/** Barres calories/jour avec ligne d'objectif. */
function KcalChart({ days, period, target }: { days: DayHistory[]; period: number; target: number }) {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const dates = lastNDays(period);
  const vals = dates.map((dt) => byDate.get(dt)?.kcal ?? 0);
  const max = Math.max(...vals, target) * 1.1 || 1;
  const W = 100, H = 42;
  const bw = W / dates.length;
  const yT = H - (target / max) * H;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={s.chart}>
      {vals.map((v, i) => {
        const h = (v / max) * H;
        const over = target > 0 && v > target;
        return <rect key={i} x={i * bw + bw * 0.15} y={H - h} width={bw * 0.7} height={Math.max(h, v > 0 ? 0.8 : 0)} rx={0.6} fill={over ? "var(--coral)" : "var(--lime)"} opacity={v > 0 ? 0.9 : 0} />;
      })}
      {target > 0 && <line x1="0" x2={W} y1={yT} y2={yT} stroke="var(--txt-3)" strokeWidth="0.4" strokeDasharray="1.5 1.5" />}
    </svg>
  );
}

/** Courbe de poids sur la période. */
function WeightChart({ days, period }: { days: DayHistory[]; period: number }) {
  const dates = new Set(lastNDays(period));
  const pts = days.filter((d) => d.weight != null && dates.has(d.date)).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (pts.length < 2) return <div className={s.empty2}>Enregistre ton poids régulièrement pour voir la courbe ici.</div>;
  const ws = pts.map((p) => p.weight as number);
  const min = Math.min(...ws), max = Math.max(...ws), range = max - min || 1;
  const W = 100, H = 42;
  const line = pts.map((p, i) => `${(i / (pts.length - 1)) * W},${H - 4 - ((p.weight! - min) / range) * (H - 8)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={s.chart}>
      <polyline points={line} fill="none" stroke="var(--sky)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function HistoryScreen({ profile, back }: { profile: Profile | null; back: () => void }) {
  const { user } = useAuth();
  const [days, setDays] = useState<DayHistory[] | null>(null);
  const [err, setErr] = useState(false);
  const [open, setOpen] = useState<string | null>(todayISO());
  const [period, setPeriod] = useState<7 | 30 | 90>(7);

  useEffect(() => {
    if (!user) return;
    loadHistory(user.id).then(setDays).catch(() => setErr(true));
  }, [user]);

  const exportCsv = () => {
    if (!days || days.length === 0) return;
    downloadCsv(`bodyup-export-${todayISO()}.csv`, buildHistoryCsv(days));
  };

  const target = profile?.calorie_target ?? 0;
  const inPeriod = (days ?? []).filter((d) => new Set(lastNDays(period)).has(d.date));
  const withFood = inPeriod.filter((d) => d.entries.length > 0);
  const avg = (f: (d: DayHistory) => number) => (withFood.length ? Math.round(withFood.reduce((n, d) => n + f(d), 0) / withFood.length) : 0);

  return (
    <>
      <div className={`${s.subhead} ${s.r} ${s.r1}`}>
        <button className={s.backbtn} onClick={back} aria-label="Retour"><Icon name="arrowLeft" size={18} /></button>
        <div><div className={s.hi}>Jour par jour, depuis le début</div><h2>Historique</h2></div>
      </div>

      <div className={`${s.pseg} ${s.r} ${s.r1}`}>
        {([7, 30, 90] as const).map((p) => (
          <button key={p} className={period === p ? s.on : ""} onClick={() => setPeriod(p)}>{p} jours</button>
        ))}
      </div>

      {days && days.length > 0 && (
        <>
          <div className={`${s.chartcard} ${s.r} ${s.r2}`}>
            <div className={s.chartlab}>Calories / jour <small>— pointillés : objectif {target ? fr(target) : "—"} kcal</small></div>
            <KcalChart days={days} period={period} target={target} />
            <div className={s.avgrow}>
              <span>Moy. <b>{fr(avg((d) => d.kcal))}</b> kcal</span>
              <span>P <b>{avg((d) => d.protein)}g</b></span>
              <span>G <b>{avg((d) => d.carbs)}g</b></span>
              <span>L <b>{avg((d) => d.fat)}g</b></span>
            </div>
          </div>
          <div className={`${s.chartcard} ${s.r} ${s.r2}`}>
            <div className={s.chartlab}>Poids (kg)</div>
            <WeightChart days={days} period={period} />
          </div>
        </>
      )}

      <button className={`${s.savebtn} ${s.r} ${s.r2}`} style={{ marginTop: 12 }} onClick={exportCsv} disabled={!days || days.length === 0}>
        Exporter toutes mes données (CSV)
      </button>
      <div className={s.empty2} style={{ marginBottom: 10 }}>
        {days ? `${days.length} jour${days.length > 1 ? "s" : ""} enregistré${days.length > 1 ? "s" : ""} · repas, macros, séances, eau, pas, sommeil, poids` : ""}
      </div>

      {err && <div className={s.scanerr}>Impossible de charger l&apos;historique. Vérifie ta connexion puis réessaie.</div>}
      {!days && !err && <div className={s.searching}><span className={s.sp} /> Chargement de l&apos;historique…</div>}
      {days && days.length === 0 && <div className={s.pempty}>Aucune donnée pour l&apos;instant. Tes journées apparaîtront ici dès ton premier repas enregistré.</div>}

      {days?.map((d) => {
        const isOpen = open === d.date;
        return (
          <div key={d.date} className={`${s.meal} ${s.r}`} style={{ cursor: "pointer" }} onClick={() => setOpen(isOpen ? null : d.date)}>
            <div className={s.mh}>
              <div className={s.lft}>
                <div className={s.em} style={{ background: "rgba(183,155,255,.13)" }}>📅</div>
                <div>
                  <b>{fmtDay(d.date)}</b>
                  <span>
                    {fr(d.kcal)} kcal · {d.entries.length} aliment{d.entries.length > 1 ? "s" : ""}
                    {d.burned > 0 ? ` · −${fr(d.burned)} brûlées` : ""}
                    {d.weight != null ? ` · ${d.weight} kg` : ""}
                  </span>
                </div>
              </div>
              <div className={s.kc} style={{ color: "var(--violet)" }}>{isOpen ? "−" : "+"}</div>
            </div>
            {isOpen && (
              <>
                <div className={s.fitem}>
                  <div className={s.nm}>Macros<small>protéines / glucides / lipides</small></div>
                  <div className={s.c}>{d.protein}g · {d.carbs}g · {d.fat}g</div>
                </div>
                <div className={s.fitem}>
                  <div className={s.nm}>Activité &amp; hydratation<small>eau · pas · sommeil</small></div>
                  <div className={s.c}>{(d.glasses * 0.25).toFixed(1)} L · {d.steps ? fr(d.steps) : "—"} pas · {d.sleepMin ? `${Math.floor(d.sleepMin / 60)}h${String(d.sleepMin % 60).padStart(2, "0")}` : "—"}</div>
                </div>
                {d.entries.map((e, i) => (
                  <div key={i} className={s.fitem}>
                    <div className={s.nm}>{e.name}<small>{MEAL_DEFS.find((m) => m.key === e.meal_type)?.name ?? e.meal_type}{e.qty ? ` · ${e.qty}` : ""}</small></div>
                    <div className={s.c}>{fr(e.kcal)} kcal</div>
                  </div>
                ))}
                {d.workouts.map((w, i) => (
                  <div key={`w${i}`} className={s.fitem}>
                    <div className={s.nm}>{w}<small>séance</small></div>
                    <div className={s.c} style={{ color: "var(--lime)" }}>brûlé</div>
                  </div>
                ))}
              </>
            )}
          </div>
        );
      })}
    </>
  );
}

/* ---------------- MESSAGES ENTRE PROCHES (chat) ---------------- */
function MessagesScreen({ initial, onOpened, back }: { initial: { id: string; name: string } | null; onOpened: () => void; back: () => void }) {
  const { user, profile } = useAuth();
  const me = user?.id ?? "";
  const [friends, setFriends] = useState<{ id: string; name: string }[]>([]);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const [active, setActive] = useState<{ id: string; name: string } | null>(initial);
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!me) return;
    loadConnections().then((cs) => {
      setFriends(cs.filter((c) => c.status === "accepted").map((c) => ({
        id: c.requester_id === me ? c.addressee_id : c.requester_id,
        name: (c.requester_id === me ? c.addressee_username : c.requester_username) ?? "?",
      })));
    });
    loadUnreadCounts(me).then(setUnread);
  }, [me]);

  // Charge le fil + marque lu ; temps réel + petit polling de secours.
  const refreshThread = useCallback(async () => {
    if (!me || !active) return;
    setMsgs(await loadThread(me, active.id));
    await markThreadRead(me, active.id);
    setUnread((u) => ({ ...u, [active.id]: 0 }));
    onOpened();
  }, [me, active, onOpened]);

  useEffect(() => { setMsgs([]); setErr(null); refreshThread(); }, [refreshThread]);
  useEffect(() => {
    if (!me || !active) return;
    const ch = subscribeToMessages(me, (m) => { if (m.sender_id === active.id) refreshThread(); });
    const poll = window.setInterval(refreshThread, 8000);
    return () => { supabase.removeChannel(ch); clearInterval(poll); };
  }, [me, active, refreshThread]);
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight }); }, [msgs.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !me || !active || sending) return;
    setSending(true); setErr(null);
    try {
      const m = await sendMessage(me, active.id, body, profile?.username ?? profile?.display_name);
      setMsgs((p) => [...p, m]);
      setDraft("");
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Envoi impossible.");
    } finally { setSending(false); }
  };

  const hhmm = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const dayOf = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  if (!active) {
    return (
      <>
        <div className={`${s.subhead} ${s.r} ${s.r1}`}>
          <button className={s.backbtn} onClick={back} aria-label="Retour"><Icon name="arrowLeft" size={18} /></button>
          <div><div className={s.hi}>Discute avec tes proches connectés</div><h2>Messages</h2></div>
        </div>
        {friends.length === 0 ? (
          <div className={`${s.pempty} ${s.r} ${s.r2}`}>Aucun proche connecté. Ajoute quelqu&apos;un dans Profil → Partage &amp; proches, puis reviens ici pour discuter.</div>
        ) : (
          friends.map((f) => (
            <div key={f.id} className={`${s.connrow} ${s.r} ${s.r2}`} style={{ cursor: "pointer" }} onClick={() => setActive(f)}>
              <div className={s.av2}>{(f.name[0] ?? "?").toUpperCase()}</div>
              <div className={s.ce}><b>@{f.name}</b><span>{unread[f.id] ? `${unread[f.id]} nouveau${unread[f.id] > 1 ? "x" : ""} message${unread[f.id] > 1 ? "s" : ""}` : "Ouvrir la conversation"}</span></div>
              {unread[f.id] ? <span className={s.unreadDot}>{unread[f.id]}</span> : <span className={s.ch}>›</span>}
            </div>
          ))
        )}
      </>
    );
  }

  return (
    <>
      <div className={`${s.subhead} ${s.r} ${s.r1}`}>
        <button className={s.backbtn} onClick={() => setActive(null)} aria-label="Retour"><Icon name="arrowLeft" size={18} /></button>
        <div><div className={s.hi}>Conversation privée</div><h2>@{active.name}</h2></div>
      </div>
      <div className={s.chat} ref={scroller}>
        {msgs.length === 0 && <div className={s.empty2}>Dis bonjour à @{active.name} 👋</div>}
        {msgs.map((m, i) => {
          const newDay = i === 0 || dayOf(m.created_at) !== dayOf(msgs[i - 1].created_at);
          return (
            <div key={m.id}>
              {newDay && <div className={s.daysep}>{dayOf(m.created_at)}</div>}
              <div className={`${s.bub} ${m.sender_id === me ? s.me : s.ai}`} style={{ whiteSpace: "pre-wrap" }}>
                {m.body}
                <span className={s.msgtime}>{hhmm(m.created_at)}</span>
              </div>
            </div>
          );
        })}
        {err && <div className={s.scanerr}>{err}</div>}
      </div>
      <div className={`${s.composer} ${s.r}`}>
        <input placeholder={`Message à @${active.name}…`} value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }} disabled={sending} />
        <button className={s.snd} onClick={send} disabled={sending || !draft.trim()} aria-label="Envoyer"><Icon name="send" size={18} /></button>
      </div>
    </>
  );
}

/* ---------------- PROFIL (live + déconnexion) ---------------- */
function ProfilScreen({ profile, email, go, unread }: { profile: Profile | null; email: string; go: (t: Tab) => void; unread?: number }) {
  const { signOut, user, refreshProfile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [perm, setPerm] = useState<NotificationPermission>("default");
  const [rem, setRem] = useState(false);
  const [prefs, setPrefs] = useState(notifPrefs());
  useEffect(() => {
    if (!user) return;
    loadStats(user.id).then((st) => { setStats(st); const p = computePoints(st); persistGamification(user.id, p, levelFor(p)); });
  }, [user]);
  useEffect(() => { setPerm(notifPermission()); setRem(remindersEnabled()); setPrefs(notifPrefs()); }, []);
  const enableNotifs = async () => {
    const p = await requestNotif(); setPerm(p);
    if (p === "granted") {
      setRemindersEnabled(true); setRem(true);
      if (user) await enablePush(user.id); // messages reçus même app fermée
      showNotif("Notifications activées ✅", "Tu recevras tes rappels et les messages de tes proches.");
    }
  };
  const toggleRem = () => { const v = !rem; setRem(v); setRemindersEnabled(v); };
  const togglePref = (cat: NotifCat) => {
    const v = !prefs[cat];
    setPrefs((p) => ({ ...p, [cat]: v }));
    setNotifPref(cat, v);
  };

  // répartition macros personnalisée
  const [editM, setEditM] = useState(false);
  const [mpv, setMpv] = useState("30"); const [mcv, setMcv] = useState("40"); const [mfv, setMfv] = useState("30");
  const [mBusy, setMBusy] = useState(false);
  const mSum = (parseInt(mpv) || 0) + (parseInt(mcv) || 0) + (parseInt(mfv) || 0);
  const openMacros = () => {
    setMpv(String(profile?.macro_p ?? 30)); setMcv(String(profile?.macro_c ?? 40)); setMfv(String(profile?.macro_f ?? 30));
    setEditM(true);
  };
  const saveMacros = async () => {
    if (!user || mSum !== 100) return;
    setMBusy(true);
    await supabase.from("profiles").update({ macro_p: parseInt(mpv), macro_c: parseInt(mcv), macro_f: parseInt(mfv), updated_at: new Date().toISOString() }).eq("id", user.id);
    await refreshProfile();
    setMBusy(false); setEditM(false);
  };

  const name = profile?.display_name ?? "Utilisateur";
  const goalLabel = profile?.goal === "perte" ? "perte de poids" : profile?.goal === "masse" ? "prise de masse" : "maintien";
  const deficit = profile?.tdee && profile?.calorie_target ? profile.tdee - profile.calorie_target : null;
  const points = stats ? computePoints(stats) : (profile?.points ?? 0);
  const level = levelFor(points);
  const emoji = emojiForLevel(level);
  const earnedCount = stats ? BADGES.filter((b) => b.earned(stats)).length : 0;

  return (
    <>
      <div className={`${s.profhero} ${s.r} ${s.r1}`}>
        <div className={s.av} style={{ fontSize: 40 }}>{emoji}</div>
        <h2>{name}</h2>
        <div className={s.sub}>{email}</div>
        <div className={s.sub}>Objectif : {goalLabel}{profile?.weight_kg ? ` · ${profile.weight_kg} → ${profile.target_kg} kg` : ""}</div>
      </div>

      <div className={`${s.gamehdr} ${s.r} ${s.r2}`}>
        <div className={s.gleft}>
          <div className={s.pts}>{fr(points)} <small>points</small></div>
          <div className={s.lv}>{earnedCount}/{BADGES.length} badges débloqués</div>
          <div className={s.lvbar}><i style={{ width: `${Math.round(((points % 150) / 150) * 100)}%` }} /></div>
        </div>
        <div className={s.lvbadge}><span className={s.em}>{emoji}</span><b>Niveau {level}</b></div>
      </div>

      <div className={s.sectionH}><h3>Récompenses</h3><a>{earnedCount}/{BADGES.length}</a></div>
      <div className={`${s.badgewrap} ${s.r} ${s.r3}`}>
        {BADGES.map((b) => {
          const ok = stats ? b.earned(stats) : false;
          return <div key={b.id} className={`${s.bdg} ${ok ? "" : s.lock}`}>{ok ? b.emoji : "🔒"}<span>{b.label}</span>{ok && <span className={s.bp}>+{b.points}</span>}</div>;
        })}
      </div>

      <div className={`${s.prem} ${s.r} ${s.r3}`}>
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
        <ProfRow icon="dashboard" label="Répartition macros (P/G/L)" val={`${profile?.macro_p ?? 30}/${profile?.macro_c ?? 40}/${profile?.macro_f ?? 30} %`} chevron onClick={openMacros} />
      </div>
      <div className={s.sectionH} style={{ marginTop: 22 }}><h3>Social</h3></div>
      <div className={`${s.plist} ${s.r} ${s.r4}`}>
        <ProfRow icon="fit" label="Partage & proches" chevron onClick={() => go("partage")} />
        <ProfRow icon="send" label={unread ? `Messages · ${unread} non lu${unread > 1 ? "s" : ""}` : "Messages"} chevron onClick={() => go("msg")} />
      </div>

      <div className={s.sectionH} style={{ marginTop: 22 }}><h3>Notifications</h3></div>
      <div className={`${s.plist} ${s.r} ${s.r4}`}>
        {!notifSupported() ? (
          <div className={s.prow}><div className={s.pic}><Icon name="bell" size={17} /></div>Non supporté sur cet appareil</div>
        ) : perm !== "granted" ? (
          <div className={s.prow} onClick={enableNotifs} style={{ cursor: "pointer" }}>
            <div className={s.pic}><Icon name="bell" size={17} /></div>{perm === "denied" ? "Notifications bloquées (à réactiver dans les réglages)" : "Activer les notifications"}
            {perm !== "denied" && <span className={s.ch}>›</span>}
          </div>
        ) : (
          <>
            <div className={s.prow}>
              <div className={s.pic}><Icon name="bell" size={17} /></div>Toutes les notifications
              <span className={s.val} onClick={toggleRem} style={{ cursor: "pointer", color: rem ? "var(--lime)" : "var(--txt-3)" }}>{rem ? "Activées" : "Désactivées"}</span>
            </div>
            {rem && NOTIF_CATS.map((n) => (
              <div key={n.cat} className={s.prow}>
                <div className={s.pic}><Icon name={n.cat === "messages" ? "send" : n.cat === "vide" ? "warning" : n.cat === "bilan" ? "stats" : n.cat === "repas" ? "meals" : "bolt"} size={17} /></div>
                <div style={{ flex: 1 }}>{n.label}<div style={{ fontSize: 11, color: "var(--txt-3)" }}>{n.desc}</div></div>
                <span className={s.val} onClick={() => togglePref(n.cat)} style={{ cursor: "pointer", color: prefs[n.cat] ? "var(--lime)" : "var(--txt-3)" }}>{prefs[n.cat] ? "Oui" : "Non"}</span>
              </div>
            ))}
            {!pushSupported() && (
              <div className={s.prow}>
                <div className={s.pic}><Icon name="info" size={17} /></div>
                <div style={{ flex: 1, fontSize: 12.5, color: "var(--txt-2)" }}>Pour recevoir les messages quand l&apos;app est fermée, installe BODYUP sur l&apos;écran d&apos;accueil (iOS 16.4+).</div>
              </div>
            )}
            <div className={s.prow} onClick={() => showNotif("Test 🔔", "Voici à quoi ressemblera un rappel BODYUP.")} style={{ cursor: "pointer" }}>
              <div className={s.pic}><Icon name="spark" size={17} /></div>Envoyer une notification test
              <span className={s.ch}>›</span>
            </div>
          </>
        )}
      </div>

      {editM && (
        <Modal center onClose={() => setEditM(false)}>
            <h3>Répartition des macros <span className={s.x} onClick={() => setEditM(false)}>✕</span></h3>
            <div className={s.staplechips} style={{ marginBottom: 14 }}>
              {MACRO_PRESETS.map((p) => (
                <span key={p.label} onClick={() => { setMpv(String(p.p)); setMcv(String(p.c)); setMfv(String(p.f)); }}>{p.label} · {p.p}/{p.c}/{p.f}</span>
              ))}
            </div>
            <label>% des calories — protéines / glucides / lipides</label>
            <div className={s.row3}>
              <input className={s.inp} type="number" inputMode="numeric" value={mpv} onChange={(e) => setMpv(e.target.value)} placeholder="P %" />
              <input className={s.inp} type="number" inputMode="numeric" value={mcv} onChange={(e) => setMcv(e.target.value)} placeholder="G %" />
              <input className={s.inp} type="number" inputMode="numeric" value={mfv} onChange={(e) => setMfv(e.target.value)} placeholder="L %" />
            </div>
            {mSum !== 100 && <div className={s.empty2} style={{ color: "var(--coral)" }}>Le total doit faire 100 % (actuellement {mSum} %).</div>}
            <button className={s.savebtn} onClick={saveMacros} disabled={mBusy || mSum !== 100}>{mBusy ? "Enregistrement…" : "Enregistrer"}</button>
        </Modal>
      )}

      <div className={s.sectionH}><h3>Connexions santé <span className={s.demoflag}>BIENTÔT</span></h3></div>
      <div className={`${s.sync} ${s.r} ${s.r4}`}>
        <div className={s.synccard}><Icon name="heart" size={24} style={{ color: "var(--coral)" }} /><b>Apple Health</b><span style={{ color: "var(--txt-3)" }}>À venir</span></div>
        <div className={s.synccard}><Icon name="fit" size={24} style={{ color: "var(--sky)" }} /><b>Google Fit</b><span style={{ color: "var(--txt-3)" }}>À venir</span></div>
      </div>
      <button className={s.logout} onClick={signOut}>Se déconnecter</button>
    </>
  );
}

function ProfRow({ icon, label, val, chevron, onClick }: { icon: IconName; label: string; val?: string; chevron?: boolean; onClick?: () => void }) {
  return (
    <div className={s.prow} onClick={onClick} style={onClick ? { cursor: "pointer" } : undefined}>
      <div className={s.pic}><Icon name={icon} size={17} /></div>{label}
      {val && <span className={s.val}>{val}</span>}
      {chevron && <span className={s.ch}>›</span>}
    </div>
  );
}

/* ---------------- GARDE-MANGER & LISTE DE COURSES ---------------- */
const QUICK_ADD = ["Sel", "Poivre", "Huile d'olive", "Œufs", "Lait", "Beurre", "Riz", "Pâtes", "Farine", "Oignon", "Ail en poudre", "Tomate"];
const catOf = (name: string) => STAPLES.find((c) => c.items.includes(name))?.category ?? "Autre";

function CoursesScreen({ back }: { back: () => void }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"buy" | "have">("buy");
  const [items, setItems] = useState<PantryItem[]>([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<{ name: string; category: string }[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(async () => { if (user) setItems(await loadPantry(user.id)); }, [user]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (q.trim().length < 1) { setResults([]); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => setResults(await searchCatalog(q)), 250);
    return () => clearTimeout(timer.current);
  }, [q]);

  const add = async (name: string, category: string) => {
    if (!user) return;
    if (items.some((i) => i.name.toLowerCase() === name.toLowerCase() && i.status === tab)) { setQ(""); setResults([]); return; }
    const it = await addPantryItem(user.id, name, category, tab);
    if (it) setItems((p) => [...p, it]);
    setQ(""); setResults([]);
  };
  const toggle = async (it: PantryItem) => {
    const ns: "have" | "buy" = it.status === "buy" ? "have" : "buy";
    setItems((p) => p.map((x) => (x.id === it.id ? { ...x, status: ns } : x)));
    await setPantryStatus(it.id, ns);
  };
  const del = async (it: PantryItem) => { setItems((p) => p.filter((x) => x.id !== it.id)); await removePantryItem(it.id); };

  const current = items.filter((i) => i.status === tab);
  const buyCount = items.filter((i) => i.status === "buy").length;
  const haveCount = items.filter((i) => i.status === "have").length;
  const groups: Record<string, PantryItem[]> = {};
  current.forEach((i) => { (groups[i.category] ||= []).push(i); });

  return (
    <>
      <div className={`${s.subhead} ${s.r} ${s.r1}`}>
        <button className={s.backbtn} onClick={back} aria-label="Retour"><Icon name="arrowLeft" size={18} /></button>
        <div><div className={s.hi}>Ce que tu as · ce qu&apos;il te faut</div><h2>Courses</h2></div>
      </div>

      <div className={`${s.pseg} ${s.r} ${s.r1}`}>
        <button className={tab === "buy" ? s.on : ""} onClick={() => setTab("buy")}><Icon name="cart" size={16} />À acheter <span className={s.cnt2}>{buyCount}</span></button>
        <button className={tab === "have" ? s.on : ""} onClick={() => setTab("have")}><Icon name="check" size={16} />J&apos;ai <span className={s.cnt2}>{haveCount}</span></button>
      </div>

      <div className={`${s.paddrow} ${s.r} ${s.r2}`}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === "buy" ? "Ajouter à la liste de courses…" : "Ajouter à mon garde-manger…"} />
      </div>
      {results.length > 0 && (
        <div className={s.results}>
          {results.map((r) => (
            <div key={r.name} className={s.ritem} onClick={() => add(r.name, r.category)}>
              <div className={s.rn}><b>{r.name}</b><span>{r.category}</span></div>
              <Icon name="plus" size={16} />
            </div>
          ))}
        </div>
      )}
      {q.trim().length < 1 && (
        <div className={`${s.staplechips} ${s.r} ${s.r2}`}>
          {QUICK_ADD.map((n) => <span key={n} onClick={() => add(n, catOf(n))}>+ {n}</span>)}
        </div>
      )}

      {current.length === 0 ? (
        <div className={s.pempty}>{tab === "buy" ? "Ta liste de courses est vide. Ajoute des produits ci-dessus, ou les ingrédients d'une recette." : "Ton garde-manger est vide. Ajoute ce que tu as déjà (épices, basiques…)."}</div>
      ) : (
        Object.entries(groups).map(([cat, arr]) => (
          <div key={cat} className={`${s.r} ${s.r3}`}>
            <div className={s.psect}>{cat}<span className={s.pc}>{arr.length}</span></div>
            <div>
              {arr.map((it) => (
                <div key={it.id} className={`${s.pitem} ${it.status === "have" ? s.got : ""}`}>
                  <span className={s.pck} onClick={() => toggle(it)} aria-label={it.status === "buy" ? "Marquer acheté" : "À racheter"}><Icon name="check" size={12} /></span>
                  <span className={s.pn}>{it.name}</span>
                  <button className={s.px} onClick={() => del(it)} aria-label="Supprimer">✕</button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}

/* ---------------- PHOTOS DE PROGRESSION (réelles, stockage privé) ---------------- */
function ProgressScreen({ back }: { back: () => void }) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<ProgressPhoto[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try { setPhotos(await loadProgressPhotos(user.id)); } catch { setPhotos([]); }
  }, [user]);
  useEffect(() => { load(); }, [load]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setBusy(true); setErr(null);
    try {
      await uploadProgressPhoto(user.id, file);
      await load();
    } catch (x) {
      setErr(x instanceof Error ? x.message : "Envoi impossible. Réessaie.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const del = async (p: ProgressPhoto) => {
    setPhotos((ps) => (ps ?? []).filter((x) => x.id !== p.id));
    await deleteProgressPhoto(p.id, p.path);
  };

  const fmt = (iso: string) => new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  const first = photos?.[0];
  const last = photos && photos.length > 1 ? photos[photos.length - 1] : null;

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
      <div className={`${s.subhead} ${s.r} ${s.r1}`}>
        <button className={s.backbtn} onClick={back} aria-label="Retour"><Icon name="arrowLeft" size={18} /></button>
        <div><div className={s.hi}>Tes photos, stockées en privé</div><h2>Progression</h2></div>
        <button className={s.headact} onClick={() => fileRef.current?.click()} disabled={busy} aria-label="Ajouter une photo"><Icon name="camera" /></button>
      </div>

      {err && <div className={`${s.scanerr} ${s.r}`}>{err}</div>}
      {busy && <div className={s.searching}><span className={s.sp} /> Envoi de la photo…</div>}
      {!photos && <div className={s.searching}><span className={s.sp} /> Chargement…</div>}

      {photos && photos.length === 0 && (
        <div className={`${s.pempty} ${s.r} ${s.r2}`}>
          Aucune photo pour l&apos;instant. Prends une première photo aujourd&apos;hui — dans quelques semaines,
          l&apos;avant/après parlera de lui-même. Les photos sont privées (visibles par toi seulement).
        </div>
      )}

      {first && last && (
        <div className={`${s.compare} ${s.r} ${s.r2}`}>
          <div className={`${s.cphoto} ${s.before}`} style={{ backgroundImage: `url(${first.url})`, backgroundSize: "cover", backgroundPosition: "center" }}>
            <span className={s.ctag}>AVANT</span><div className={s.cw}><span>{fmt(first.date)}</span></div>
          </div>
          <div className={`${s.cphoto} ${s.after}`} style={{ backgroundImage: `url(${last.url})`, backgroundSize: "cover", backgroundPosition: "center" }}>
            <span className={s.ctag}>APRÈS</span><div className={s.cw}><span>{fmt(last.date)}</span></div>
          </div>
        </div>
      )}

      {photos && photos.length > 0 && (
        <>
          <div className={`${s.sectionH} ${s.r} ${s.r3}`}><h3>Toutes les photos</h3><a>{photos.length}</a></div>
          <div className={`${s.photogrid} ${s.r} ${s.r3}`}>
            {[...photos].reverse().map((p) => (
              <div key={p.id} className={s.pcell}>
                <img src={p.url} alt={fmt(p.date)} loading="lazy" />
                <span className={s.pdate}>{fmt(p.date)}</span>
                <button className={s.pdel} onClick={() => del(p)} aria-label="Supprimer">✕</button>
              </div>
            ))}
          </div>
        </>
      )}

      <button className={`${s.addphoto} ${s.r} ${s.r5}`} onClick={() => fileRef.current?.click()} disabled={busy}>
        <Icon name="plus" size={16} /> {busy ? "Envoi…" : "Ajouter une photo"}
      </button>
    </>
  );
}

/* ---------------- PARTAGE ENTRE UTILISATEURS (par nom d'utilisateur) ---------------- */
function PartageScreen({ back, onChat }: { back: () => void; onChat?: (f: { id: string; name: string }) => void }) {
  const { user, profile, refreshProfile } = useAuth();
  const myId = user?.id ?? "";
  const myUsername = profile?.username ?? null;
  const [conns, setConns] = useState<Connection[]>([]);
  const [uname, setUname] = useState("");
  const [cats, setCats] = useState<ShareCat[]>([...ALL_CATS]);
  const [msg, setMsg] = useState<string | null>(null);
  const [view, setView] = useState<Connection | null>(null);
  const [editU, setEditU] = useState(false);
  const [uval, setUval] = useState("");

  const load = useCallback(async () => { setConns(await loadConnections()); }, []);
  useEffect(() => { load(); }, [load]);

  const toggleCat = (c: ShareCat) => setCats((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  const saveUsername = async () => {
    if (!uval.trim() || !myId) return;
    const err = await setUsername(myId, uval.trim());
    if (err) { setMsg(err); return; }
    setEditU(false); setUval(""); await refreshProfile();
  };

  const invite = async () => {
    if (!uname.trim() || !myId) return;
    if (!myUsername) { setMsg("Choisis d'abord ton nom d'utilisateur (bouton ci-dessus)."); return; }
    if (uname.trim().toLowerCase() === myUsername.toLowerCase()) { setMsg("C'est ton propre nom 🙂"); return; }
    const otherId = await resolveUsername(uname);
    if (!otherId) { setMsg("Utilisateur introuvable. Vérifie le nom exact."); return; }
    const err = await sendInvite(myId, myUsername, otherId, uname.trim(), cats);
    setMsg(err ? "Erreur : " + err : "Invitation envoyée ✓");
    if (!err) setUname("");
    await load();
  };

  const received = conns.filter((c) => c.status === "pending" && c.addressee_id === myId);
  const sent = conns.filter((c) => c.status === "pending" && c.requester_id === myId);
  const accepted = conns.filter((c) => c.status === "accepted");
  const otherName = (c: Connection) => (c.requester_id === myId ? c.addressee_username : c.requester_username) ?? "?";
  const otherId = (c: Connection) => (c.requester_id === myId ? c.addressee_id : c.requester_id);
  const theirCats = (c: Connection) => (c.requester_id === myId ? c.addressee_categories : c.requester_categories) as ShareCat[];

  const accept = async (c: Connection) => { await acceptInvite(c.id, [...ALL_CATS]); await load(); };
  const remove = async (c: Connection) => { await removeConnection(c.id); await load(); };

  const Av = ({ e }: { e: string }) => <div className={s.av2}>{(e[0] ?? "?").toUpperCase()}</div>;

  return (
    <>
      <div className={`${s.subhead} ${s.r} ${s.r1}`}>
        <button className={s.backbtn} onClick={back} aria-label="Retour"><Icon name="arrowLeft" size={18} /></button>
        <div><div className={s.hi}>Partage mutuel, par nom d&apos;utilisateur</div><h2>Partage</h2></div>
      </div>

      <div className={`${s.connrow} ${s.r} ${s.r2}`}>
        <Av e={myUsername ?? "?"} />
        <div className={s.ce}><b>{myUsername ?? "Non défini"}</b><span>Ton nom d&apos;utilisateur</span></div>
        <div className={s.ca}><button className={`${s.cbtn2} ${s.viewb}`} onClick={() => { setUval(myUsername ?? ""); setMsg(null); setEditU(true); }}>{myUsername ? "Modifier" : "Définir"}</button></div>
      </div>

      <div className={`${s.invcard} ${s.r} ${s.r2}`}>
        <div className={s.il}>Inviter un proche</div>
        <input value={uname} onChange={(e) => setUname(e.target.value)} placeholder="nom d'utilisateur" autoCapitalize="none" />
        <div className={s.catrow}>
          {ALL_CATS.map((c) => (
            <span key={c} className={`${s.catchip} ${cats.includes(c) ? s.on : ""}`} onClick={() => toggleCat(c)}>
              {cats.includes(c) && <Icon name="check" size={13} />}{SHARE_LABELS[c]}
            </span>
          ))}
        </div>
        <button className={s.savebtn} onClick={invite} disabled={!uname.trim()}>Envoyer l&apos;invitation</button>
        {msg && <div className={s.invmsg}>{msg}</div>}
      </div>

      {received.length > 0 && (
        <div className={`${s.r} ${s.r3}`}>
          <div className={s.psect}>Demandes reçues</div>
          {received.map((c) => (
            <div key={c.id} className={s.connrow}>
              <Av e={c.requester_username ?? "?"} />
              <div className={s.ce}><b>{c.requester_username}</b><span>veut partager avec toi</span></div>
              <div className={s.ca}>
                <button className={`${s.cbtn2} ${s.acc}`} onClick={() => accept(c)}>Accepter</button>
                <button className={`${s.cbtn2} ${s.dec}`} onClick={() => remove(c)}>Refuser</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {accepted.length > 0 && (
        <div className={`${s.r} ${s.r3}`}>
          <div className={s.psect}>Mes partages</div>
          {accepted.map((c) => (
            <div key={c.id} className={s.connrow}>
              <Av e={otherName(c)} />
              <div className={s.ce}><b>{otherName(c)}</b><span>{theirCats(c).map((x) => SHARE_LABELS[x].split(" ")[0]).join(" · ") || "rien partagé"}</span></div>
              <div className={s.ca}>
                {onChat && <button className={`${s.cbtn2} ${s.viewb}`} onClick={() => onChat({ id: otherId(c), name: otherName(c) })}>💬</button>}
                <button className={`${s.cbtn2} ${s.viewb}`} onClick={() => setView(c)}>Voir</button>
                <button className={`${s.cbtn2} ${s.dec}`} onClick={() => remove(c)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sent.length > 0 && (
        <div className={`${s.r} ${s.r4}`}>
          <div className={s.psect}>Invitations envoyées</div>
          {sent.map((c) => (
            <div key={c.id} className={s.connrow}>
              <Av e={c.addressee_username ?? "?"} />
              <div className={s.ce}><b>{c.addressee_username}</b><span>en attente de validation</span></div>
              <div className={s.ca}><button className={`${s.cbtn2} ${s.dec}`} onClick={() => remove(c)}>Annuler</button></div>
            </div>
          ))}
        </div>
      )}

      {received.length === 0 && accepted.length === 0 && sent.length === 0 && (
        <div className={s.pempty}>Aucun partage pour l&apos;instant. Invite un proche par son nom d&apos;utilisateur — il devra accepter pour que vous voyiez vos données mutuellement.</div>
      )}

      {editU && (
        <Modal center onClose={() => setEditU(false)}>
            <h3>Ton nom d&apos;utilisateur <span className={s.x} onClick={() => setEditU(false)}>✕</span></h3>
            <label>Choisis un identifiant unique (ce que tes proches saisiront)</label>
            <input className={s.inp} value={uval} onChange={(e) => setUval(e.target.value)} placeholder="ex : seb_afonso" autoCapitalize="none" autoFocus />
            <button className={s.savebtn} onClick={saveUsername} disabled={!uval.trim()}>Enregistrer</button>
            {msg && <div className={s.invmsg} style={{ color: "var(--coral)" }}>{msg}</div>}
        </Modal>
      )}

      {view && <SharedDataModal otherId={otherId(view)} otherName={otherName(view)} cats={theirCats(view)} onClose={() => setView(null)} />}
    </>
  );
}

function SharedDataModal({ otherId, otherName, cats, onClose }: { otherId: string; otherName: string; cats: ShareCat[]; onClose: () => void }) {
  const [data, setData] = useState<SharedData | null>(null);
  useEffect(() => { loadSharedData(otherId).then(setData); }, [otherId]);
  const lastW = data && data.weights.length ? data.weights[data.weights.length - 1].weight_kg : null;
  const firstW = data && data.weights.length ? data.weights[0].weight_kg : null;
  const lost = lastW != null && firstW != null ? +(firstW - lastW).toFixed(1) : null;
  const sleep = data ? (data.sleepMin > 0 ? `${Math.floor(data.sleepMin / 60)}h${String(data.sleepMin % 60).padStart(2, "0")}` : "—") : "—";

  return (
    <Modal tall onClose={onClose}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}><span className={s.x} onClick={onClose}>✕</span></div>
        <div className={s.sdhead}>
          <div className={s.av2}>{(otherName[0] ?? "?").toUpperCase()}</div>
          <div><b>{otherName}</b><div className={s.sl}>Données partagées avec toi</div></div>
        </div>
        {!data ? (
          <div className={s.explload}><div className={s.gsp} />Chargement…</div>
        ) : (
          <>
            {cats.includes("poids") && (
              <>
                <div className={s.sdsec}>Poids & évolution</div>
                {lastW != null ? (
                  <div className={s.sdrow}><span className={s.sl}>Poids actuel{lost != null && lost > 0 ? ` · −${lost} kg` : ""}</span><b>{lastW} kg</b></div>
                ) : <div className={s.pempty}>Pas encore de pesée.</div>}
              </>
            )}
            {cats.includes("pas") && (
              <>
                <div className={s.sdsec}>Activité du jour</div>
                <div className={s.sdrow}><span className={s.sl}>Pas aujourd&apos;hui</span><b>{fr(data.steps)}</b></div>
                <div className={s.sdrow}><span className={s.sl}>Sommeil</span><b>{sleep}</b></div>
              </>
            )}
            {cats.includes("courses") && (
              <>
                <div className={s.sdsec}>Liste de courses</div>
                {data.buy.length ? data.buy.map((b, i) => <div key={i} className={s.sdrow}><span>{b.name}</span><span className={s.sl}>{b.category}</span></div>) : <div className={s.pempty}>Rien à acheter pour l&apos;instant.</div>}
              </>
            )}
            {cats.length === 0 && <div className={s.pempty}>Cette personne ne partage aucune donnée pour l&apos;instant.</div>}
          </>
        )}
    </Modal>
  );
}

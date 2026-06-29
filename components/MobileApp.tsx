"use client";

import { useState } from "react";
import Link from "next/link";
import s from "@/styles/mobile.module.css";
import { Icon, type IconName } from "./Icon";
import { CalorieRing } from "./CalorieRing";
import { fr } from "@/lib/nutrition";
import {
  journalMeals, workouts, recipes, coachThread, coachChips, badges,
} from "@/lib/data";

type Tab = "home" | "journal" | "repas" | "scan" | "exo" | "coach" | "stats" | "profil";

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: "home", label: "Accueil", icon: "home" },
  { id: "journal", label: "Journal", icon: "journal" },
  { id: "repas", label: "Repas IA", icon: "meals" },
  { id: "scan", label: "Scan", icon: "camera" },
  { id: "exo", label: "Exercices", icon: "exo" },
  { id: "coach", label: "Coach IA", icon: "spark" },
  { id: "stats", label: "Stats", icon: "stats" },
];

export default function MobileApp() {
  const [tab, setTab] = useState<Tab>("home");

  return (
    <div className={s.stage}>
      <aside className={s.pitch}>
        <div className={s.brandmark}>
          <span className={s.logoDot}><Icon name="check" size={24} style={{ color: "#0a1400" }} /></span>
          <b>BODYUP</b>
        </div>
        <h1>Ton coach santé <em>IA</em>, dans une seule main.</h1>
        <p>Nutrition, activité, hydratation et accompagnement personnalisé. Enregistre un repas en moins de 3 gestes — l&apos;IA fait le reste.</p>
        <div className={s.pillrow}>
          <span className={s.pill}><span className={s.d} />Scan photo IA</span>
          <span className={s.pill}><span className={s.d} style={{ background: "var(--coral)" }} />Coach 24/7</span>
          <span className={s.pill}><span className={s.d} style={{ background: "var(--sky)" }} />Apple Health · Google Fit</span>
          <span className={s.pill}><span className={s.d} style={{ background: "var(--violet)" }} />Repas générés par IA</span>
        </div>
        <div className={s.demolinks}>
          <Link href="/onboarding"><Icon name="arrowRight" size={16} /> Revoir l&apos;onboarding</Link>
          <Link href="/tablet" className={s.alt}><Icon name="tablet" size={16} /> Version tablette</Link>
        </div>
      </aside>

      <div className={s.phone}>
        <div className={s.screen}>
          <StatusBar />
          <div className={s.view}>
            <div className={s.page} key={tab}>
              {tab === "home" && <HomeScreen onAvatar={() => setTab("profil")} />}
              {tab === "journal" && <JournalScreen />}
              {tab === "repas" && <RepasScreen />}
              {tab === "scan" && <ScanScreen />}
              {tab === "exo" && <ExoScreen />}
              {tab === "coach" && <CoachScreen />}
              {tab === "stats" && <StatsScreen />}
              {tab === "profil" && <ProfilScreen />}
            </div>
          </div>

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

      <div className={s.hint}>Touchez les onglets pour naviguer · Mobile-first responsive</div>
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
function HomeScreen({ onAvatar }: { onAvatar: () => void }) {
  return (
    <>
      <div className={`${s.phead} ${s.r} ${s.r1}`}>
        <div>
          <div className={s.hi}>Lundi 29 juin · Bonjour</div>
          <h2>Sébastien</h2>
          <span className={s.flame}><Icon name="flame" size={14} /> 14 jours de suite</span>
        </div>
        <button className={s.ava} onClick={onAvatar} style={{ cursor: "pointer", border: "1px solid var(--card-bd)" }}>SA</button>
      </div>

      <div className={`${s.hero} ${s.r} ${s.r2}`}>
        <div className={s.ringwrap}>
          <CalorieRing value={600} fraction={600 / 2000} />
          <div className={s.statlist}>
            <div className={s.statline}><span className={s.dot} style={{ background: "var(--lime)" }} /><div className={s.t}><span>Objectif</span><b>2 000</b></div></div>
            <div className={s.statline}><span className={s.dot} style={{ background: "var(--coral)" }} /><div className={s.t}><span>Consommé</span><b>1 700</b></div></div>
            <div className={s.statline}><span className={s.dot} style={{ background: "var(--sky)" }} /><div className={s.t}><span>Brûlé</span><b>+300</b></div></div>
          </div>
        </div>
      </div>

      <div className={`${s.macros} ${s.r} ${s.r3}`}>
        <MacroBar label="Protéines" val={98} max={120} pct={82} color="var(--lime)" />
        <MacroBar label="Glucides" val={160} max={220} pct={73} color="var(--amber)" />
        <MacroBar label="Lipides" val={52} max={65} pct={80} color="var(--coral)" />
      </div>

      <div className={`${s.mgrid} ${s.r} ${s.r4}`}>
        <Metric icon="steps" tint="rgba(91,209,255,.12)" color="var(--sky)" trend={{ txt: "↑ 12%", up: true }} v="8 240" unit=" pas" k="Objectif 10 000" />
        <Metric icon="trend" tint="rgba(201,255,60,.12)" color="var(--lime)" trend={{ txt: "−0.4 kg", up: false }} v="78.6" unit=" kg" k="Cible 74 kg" />
        <Metric icon="flameLine" tint="rgba(255,122,83,.12)" color="var(--coral)" v="300" unit=" kcal" k="Brûlées aujourd'hui" />
        <Metric icon="clock" tint="rgba(183,155,255,.12)" color="var(--violet)" v="87" unit="/100" k="Score santé" />
      </div>

      <div className={`${s.water} ${s.r} ${s.r5}`}>
        <div className={s.lab}><b>1.4 L</b>/ 2.2 L</div>
        <div className={s.glasses}>
          {[1, 1, 1, 1, 0, 0].map((g, i) => <div key={i} className={`${s.gl} ${g ? s.f : ""}`} />)}
        </div>
        <button className={s.addw}>+</button>
      </div>

      <div className={`${s.sectionH} ${s.r} ${s.r6}`}><h3>Analyse IA</h3><a>Tout voir</a></div>
      <div className={`${s.insight} ${s.r} ${s.r6}`}>
        <div className={s.orb}><Icon name="spark" size={20} /></div>
        <div>
          <p>Tu manques de <b>protéines depuis 4 jours</b>. Un dîner riche en protéines ce soir t&apos;aiderait à atteindre ton objectif musculaire.</p>
          <span className={s.tag}>Détecté par l&apos;analyse des habitudes</span>
        </div>
      </div>
    </>
  );
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
function JournalScreen() {
  const delay = [s.r1, s.r2, s.r3, s.r4];
  return (
    <>
      <div className={`${s.phead} ${s.r} ${s.r1}`}>
        <div><div className={s.hi}>Aujourd&apos;hui</div><h2>Journal</h2></div>
        <div className={s.ava} style={{ fontSize: 13, lineHeight: 1.1, textAlign: "center" }}>1700<br /><span style={{ fontSize: 9, color: "var(--txt-2)" }}>kcal</span></div>
      </div>
      {journalMeals.map((m, i) => (
        <div key={m.key} className={`${s.meal} ${s.r} ${delay[i]} ${m.empty ? s.dashed : ""}`}>
          <div className={s.mh}>
            <div className={s.lft}>
              <div className={s.em} style={{ background: m.tint }}>{m.emoji}</div>
              <div><b>{m.name}</b><span>{m.empty ? "Non enregistré" : `${m.kcal} kcal · ${m.items.length} aliments`}</span></div>
            </div>
            <div className={s.kc} style={{ color: m.color }}>{m.kcal ?? "—"}</div>
          </div>
          {m.empty ? (
            <button className={s.addmeal}><Icon name="plus" size={16} /> Ajouter un repas</button>
          ) : (
            m.items.map((it) => (
              <div key={it.name} className={s.fitem}>
                <div className={s.nm}>{it.name}<small>{it.qty}</small></div>
                <div className={s.c}>{it.kcal} kcal</div>
              </div>
            ))
          )}
        </div>
      ))}
    </>
  );
}

/* ---------------- SCAN IA ---------------- */
function ScanScreen() {
  const [mode, setMode] = useState(0);
  const modes: { icon: IconName; label: string }[] = [
    { icon: "camera", label: "Photo" }, { icon: "barcode", label: "Code-barres" }, { icon: "mic", label: "Vocal" },
  ];
  return (
    <>
      <div className={`${s.phead} ${s.r} ${s.r1}`}><div><div className={s.hi}>Reconnaissance instantanée</div><h2>Scan IA</h2></div></div>
      <div className={`${s.scanmodes} ${s.r} ${s.r2}`}>
        {modes.map((m, i) => (
          <div key={m.label} className={`${s.smode} ${mode === i ? s.on : ""}`} onClick={() => setMode(i)}>
            <Icon name={m.icon} size={20} /><span>{m.label}</span>
          </div>
        ))}
      </div>
      <div className={`${s.cam} ${s.r} ${s.r3}`}>
        <div className={s.frame}><span /><span /><span /><span /><div className={s.plate}>🍝</div></div>
        <div className={s.scanline} />
        <div className={s.detected}><span className={s.pp} /><b>Pâtes bolognaise</b> détecté</div>
      </div>
      <div className={`${s.scancard} ${s.r} ${s.r4}`}>
        <div className={s.ttl}><b>Pâtes bolognaise</b><span className={s.conf}>97% sûr</span></div>
        <div className={s.nrow}>
          {[["620", "kcal"], ["28g", "prot"], ["74g", "gluc"], ["22g", "lip"]].map(([v, l]) => (
            <div key={l} className={s.ncell}><b>{v}</b><span>{l}</span></div>
          ))}
        </div>
        <div className={s.scanbtns}>
          <button className={`${s.btn} ${s.ghost}`}><Icon name="refresh" size={16} />Reprendre</button>
          <button className={`${s.btn} ${s.prim}`}><Icon name="check" size={16} />Valider</button>
        </div>
      </div>
    </>
  );
}

/* ---------------- EXERCICES ---------------- */
function ExoScreen() {
  const delay = [s.r3, s.r4, s.r5];
  return (
    <>
      <div className={`${s.phead} ${s.r} ${s.r1}`}><div><div className={s.hi}>À la maison · Sans matériel</div><h2>Exercices</h2></div></div>
      <div className={`${s.budget} ${s.r} ${s.r2}`}>
        <div className={s.l}>Budget calorique en direct</div>
        <div className={s.calc}>
          <span>2000</span><span className={s.op}>−</span><span>1700</span><span className={s.op}>+</span>
          <span style={{ color: "var(--lime)" }}>300</span><span className={s.op}>=</span><span className={s.res}>600 kcal</span>
        </div>
      </div>
      <div className={`${s.sectionH} ${s.r} ${s.r3}`} style={{ marginTop: 18 }}><h3>Séances rapides</h3><a>Filtrer</a></div>
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
          <button className={s.play}><Icon name="play" size={18} /></button>
        </div>
      ))}
    </>
  );
}

/* ---------------- REPAS IA ---------------- */
function RepasScreen() {
  const [meal, setMeal] = useState(0);
  const tabs = ["Dîner", "Petit-déj", "Déjeuner", "Collation"];
  const delay = [s.r3, s.r4];
  return (
    <>
      <div className={`${s.phead} ${s.r} ${s.r1}`}><div><div className={s.hi}>Adapté à tes 600 kcal restantes</div><h2>Repas IA</h2></div></div>
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
              <button className={s.add}><Icon name="plus" size={15} />Au journal</button>
              <button className={s.cartbtn}><Icon name="cart" size={16} /></button>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

/* ---------------- COACH IA ---------------- */
function CoachScreen() {
  const [draft, setDraft] = useState("");
  const delay = [s.r2, s.r3, s.r4];
  return (
    <>
      <div className={`${s.coachhead} ${s.r} ${s.r1}`}>
        <div className={s.orb}><Icon name="spark" size={24} /></div>
        <div><b>Coach BODYUP</b><span className={s.on}><i />En ligne · 24h/24</span></div>
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

/* ---------------- STATS ---------------- */
function StatsScreen() {
  const week = [55, 70, 48, 85, 30, 92, 78];
  const labels = ["L", "M", "M", "J", "V", "S", "D"];
  return (
    <>
      <div className={`${s.phead} ${s.r} ${s.r1}`}><div><div className={s.hi}>7 derniers jours</div><h2>Statistiques</h2></div></div>
      <div className={`${s.kpibig} ${s.r} ${s.r2}`}>
        <div className={s.l}>Poids perdu depuis le début</div>
        <div className={s.v}>−3.4 <small>kg en 6 sem.</small></div>
        <div className={s.weekbars}>
          {week.map((h, i) => (
            <div key={i} className={`${s.wb} ${i === 4 ? s.miss : ""}`}><div className={s.col} style={{ height: `${h}%` }} /><div className={s.dl}>{labels[i]}</div></div>
          ))}
        </div>
      </div>
      <div className={`${s.kgrid} ${s.r} ${s.r3}`}>
        <Metric icon="check" tint="rgba(201,255,60,.12)" color="var(--lime)" v="86" unit="%" k="Objectifs respectés" />
        <Metric icon="flameLine" tint="rgba(255,122,83,.12)" color="var(--coral)" v="−9 800" unit=" kcal" k="Déficit cumulé" />
        <Metric icon="arrowUp" tint="rgba(91,209,255,.12)" color="var(--sky)" v="14" unit=" jours" k="Série en cours" />
        <Metric icon="moon" tint="rgba(183,155,255,.12)" color="var(--violet)" v="7h12" unit="" k="Sommeil moyen" />
      </div>
      <div className={`${s.sectionH} ${s.r} ${s.r4}`}><h3>Récompenses</h3><a>Niveau 7</a></div>
      <div className={`${s.badgewrap} ${s.r} ${s.r4}`}>
        {badges.map((b) => <div key={b.label} className={`${s.bdg} ${b.locked ? s.lock : ""}`}>{b.emoji}<span>{b.label}</span></div>)}
      </div>
    </>
  );
}

/* ---------------- PROFIL ---------------- */
function ProfilScreen() {
  return (
    <>
      <div className={`${s.profhero} ${s.r} ${s.r1}`}>
        <div className={s.av}>SA</div>
        <h2>Sébastien Afonso</h2>
        <div className={s.sub}>Objectif : perte de poids · 78.6 → 74 kg</div>
      </div>
      <div className={`${s.prem} ${s.r} ${s.r2}`}>
        <div className={s.ico}><Icon name="diamond" size={22} /></div>
        <div><b>BODYUP Premium</b><span>IA illimitée · plans sportifs · rapports PDF</span></div>
        <button className={s.go}>Essayer</button>
      </div>
      <div className={s.sectionH} style={{ marginTop: 6 }}><h3>Objectif intelligent</h3></div>
      <div className={`${s.plist} ${s.r} ${s.r3}`}>
        <ProfRow icon="clock" label="BMR" val="1 690 kcal" />
        <ProfRow icon="trend" label="TDEE" val="2 480 kcal" />
        <ProfRow icon="target" label="Déficit quotidien" val="−480 kcal" />
        <ProfRow icon="calendar" label="Date estimée" val="12 sept. 2026" />
      </div>
      <div className={s.sectionH}><h3>Connexions santé</h3></div>
      <div className={`${s.sync} ${s.r} ${s.r4}`}>
        <div className={s.synccard}><Icon name="heart" size={24} style={{ color: "var(--coral)" }} /><b>Apple Health</b><span><Icon name="check" size={11} />Connecté</span></div>
        <div className={s.synccard}><Icon name="fit" size={24} style={{ color: "var(--sky)" }} /><b>Google Fit</b><span><Icon name="check" size={11} />Connecté</span></div>
      </div>
      <div className={`${s.plist} ${s.r} ${s.r5}`} style={{ marginTop: 14 }}>
        <ProfRow icon="bell" label="Notifications" chevron />
        <ProfRow icon="info" label="Régime & allergies" chevron />
        <ProfRow icon="shield" label="Confidentialité" chevron />
      </div>
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

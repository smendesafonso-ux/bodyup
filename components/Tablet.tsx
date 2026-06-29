"use client";

import { useState } from "react";
import Link from "next/link";
import s from "@/styles/tablet.module.css";
import { Icon, type IconName } from "./Icon";
import { CalorieRing } from "./CalorieRing";
import { weekPlan, insights, mealSuggestions } from "@/lib/data";

const NAV: { icon: IconName; title: string }[] = [
  { icon: "dashboard", title: "Tableau de bord" },
  { icon: "journal", title: "Journal" },
  { icon: "meals", title: "Repas IA" },
  { icon: "exo", title: "Exercices" },
  { icon: "spark", title: "Coach IA" },
  { icon: "stats", title: "Statistiques" },
];
const INSIGHT_ICON: Record<string, IconName> = { spark: "spark", trend: "trend", bolt: "bolt" };

export default function Tablet() {
  const [nav, setNav] = useState(0);
  const [range, setRange] = useState(1);

  return (
    <div className={s.tablet}><div className={s.deck}>
      <aside className={s.rail}>
        <Link className={s.lg} href="/" title="Ouvrir l'app mobile"><Icon name="check" size={24} /></Link>
        {NAV.map((n, i) => (
          <div key={n.title} className={`${s.nv} ${nav === i ? s.on : ""}`} title={n.title} onClick={() => setNav(i)}><Icon name={n.icon} /></div>
        ))}
        <div className={s.sp} />
        <div className={s.nv} title="Réglages"><Icon name="settings" /></div>
        <div className={s.me}>SA</div>
      </aside>

      <div className={s.main}>
        <div className={s.topbar}>
          <div><div className={s.hi}>Lundi 29 juin 2026</div><h1>Bonjour Sébastien 👋</h1></div>
          <div className={s.toptools}>
            <div className={s.seg}>
              {["Jour", "Semaine", "Mois"].map((r, i) => (
                <button key={r} className={range === i ? s.on : ""} onClick={() => setRange(i)}>{r}</button>
              ))}
            </div>
            <div className={s.streak}><Icon name="flame" size={16} />14 j</div>
            <div className={s.iconbtn}><span className={s.dot} /><Icon name="bell" size={20} /></div>
          </div>
        </div>

        <div className={s.cols}>
          {/* LEFT */}
          <div className={s.col}>
            <div className={`${s.card} ${s.hero}`}>
              <div className={s.ch}><h3>Bilan énergétique du jour</h3><a>Détails</a></div>
              <div className={s.heroflex}>
                <CalorieRing value={600} fraction={600 / 2000} size={184} stroke={15} big={46} />
                <div className={s.hstats}>
                  <Hstat color="var(--lime)" label="Objectif" val="2 000" />
                  <Hstat color="var(--coral)" label="Consommé" val="1 700" />
                  <Hstat color="var(--sky)" label="Brûlé (activité)" val="+300" />
                </div>
              </div>
            </div>

            <div className={s.card}>
              <div className={s.ch}><h3>Macronutriments</h3><a>Ajuster</a></div>
              <div className={s.macrorow}>
                <Macro label="Protéines" val={98} max={120} pct={82} color="var(--lime)" />
                <Macro label="Glucides" val={160} max={220} pct={73} color="var(--amber)" />
                <Macro label="Lipides" val={52} max={65} pct={80} color="var(--coral)" />
              </div>
            </div>

            <div className={s.metrics}>
              <Metric icon="steps" tint="rgba(91,209,255,.12)" color="var(--sky)" tr={{ t: "↑ 12%", up: true }} v="8 240" u=" pas" k="Objectif 10 000" />
              <Metric icon="trend" tint="rgba(201,255,60,.12)" color="var(--lime)" tr={{ t: "−0.4 kg", up: false }} v="78.6" u=" kg" k="Cible 74 kg" />
              <Metric icon="flameLine" tint="rgba(255,122,83,.12)" color="var(--coral)" v="300" u=" kcal" k="Brûlées · HIIT 15 min" />
              <Metric icon="clock" tint="rgba(183,155,255,.12)" color="var(--violet)" v="87" u="/100" k="Score santé" />
            </div>

            <div className={`${s.card} ${s.trendcard}`}>
              <div className={s.ch}><h3>Tendance du poids · 6 semaines</h3><a>−3.4 kg</a></div>
              <div className={s.chart}>
                <svg viewBox="0 0 560 150" preserveAspectRatio="none">
                  <line className={s.gl} x1="0" y1="20" x2="560" y2="20" /><line className={s.gl} x1="0" y1="60" x2="560" y2="60" /><line className={s.gl} x1="0" y1="100" x2="560" y2="100" />
                  <defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--lime)" stopOpacity=".28" /><stop offset="1" stopColor="var(--lime)" stopOpacity="0" /></linearGradient></defs>
                  <path d="M0,140 L0,30 C80,38 120,55 200,62 C280,70 320,82 400,92 C460,100 520,108 560,116 L560,140 Z" fill="url(#fade)" />
                  <path d="M0,30 C80,38 120,55 200,62 C280,70 320,82 400,92 C460,100 520,108 560,116" fill="none" stroke="var(--lime)" strokeWidth={3} strokeLinecap="round" />
                  <circle cx="560" cy="116" r="5" fill="var(--lime)" stroke="#0a1400" strokeWidth={3} />
                </svg>
              </div>
              <div className={s.axis}><span>Sem. 1</span><span>S2</span><span>S3</span><span>S4</span><span>S5</span><span>Auj.</span></div>
            </div>
          </div>

          {/* RIGHT */}
          <div className={s.col}>
            <div className={s.card}>
              <div className={s.ch}><h3>Planification de la semaine</h3><a>+ Planifier</a></div>
              <div className={s.week}>
                {weekPlan.map((d) => (
                  <div key={d.date} className={`${s.day} ${d.today ? s.today : ""}`}>
                    <div className={s.dh}><span className={s.dn}>{d.day}</span><span className={s.dd}>{d.date}</span></div>
                    <div className={s.slots}>
                      {d.slots.map((sl, i) =>
                        sl.kcal == null ? <div key={i} className={`${s.slot} ${s.empty}`}>+</div> : (
                          <div key={i} className={s.slot}><span className={s.em}>{sl.emoji}</span><span className={s.nm}>{sl.name}</span><span className={s.kc}>{sl.kcal} kcal</span></div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={s.card}>
              <div className={s.ch}><h3>Analyse IA des habitudes</h3><a>Tout voir</a></div>
              {insights.map((ins, i) => (
                <div key={i} className={`${s.insight} ${s[ins.variant]}`}>
                  <div className={s.orb}><Icon name={INSIGHT_ICON[ins.icon]} size={20} /></div>
                  <p dangerouslySetInnerHTML={{ __html: ins.html }} />
                </div>
              ))}
            </div>

            <div className={s.card}>
              <div className={s.ch}><h3>Repas IA · adaptés à 600 kcal</h3><a>Voir +</a></div>
              <div className={s.mealscroll}>
                {mealSuggestions.map((m) => (
                  <div key={m.title} className={s.msug}>
                    <div className={s.im} style={{ background: m.bg }}>{m.emoji}</div>
                    <div className={s.bd}><b>{m.title}</b><div className={s.mt}><span>{m.time}</span><span className={s.kc}>{m.kcal} kcal</span></div></div>
                  </div>
                ))}
              </div>
            </div>

            <div className={s.card}>
              <div className={s.ch}><h3>Hydratation</h3><a>+ Verre</a></div>
              <div className={s.water}>
                <div className={s.lab}><b>1.4 L</b>/ 2.2 L</div>
                <div className={s.glasses}>{[1, 1, 1, 1, 0, 0].map((g, i) => <div key={i} className={`${s.gl} ${g ? s.f : ""}`} />)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div></div>
  );
}

function Hstat({ color, label, val }: { color: string; label: string; val: string }) {
  return <div className={s.hstat}><span className={s.dot} style={{ background: color }} /><div className={s.t}><span>{label}</span><b>{val}</b></div></div>;
}
function Macro({ label, val, max, pct, color }: { label: string; val: number; max: number; pct: number; color: string }) {
  return <div className={s.macro}><div className={s.top}><span>{label}</span><span><b>{val}</b>/{max}g</span></div><div className={s.bar}><i style={{ width: `${pct}%`, background: color }} /></div></div>;
}
function Metric({ icon, tint, color, tr, v, u, k }: { icon: IconName; tint: string; color: string; tr?: { t: string; up: boolean }; v: string; u: string; k: string }) {
  return (
    <div className={s.metric}>
      {tr && <span className={`${s.tr} ${tr.up ? s.up : s.down}`}>{tr.t}</span>}
      <div className={s.ico} style={{ background: tint, color }}><Icon name={icon} size={19} /></div>
      <div className={s.v}>{v}<small>{u}</small></div><div className={s.k}>{k}</div>
    </div>
  );
}

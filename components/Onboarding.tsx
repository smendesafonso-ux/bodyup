"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import s from "@/styles/onboarding.module.css";
import { Icon } from "./Icon";
import { CalorieRing } from "./CalorieRing";
import { buildPlan, formatDate, fr, type Goal, type Sex } from "@/lib/nutrition";

const TOTAL = 7; // étapes hors écran d'accueil (index 1..7), 0 = welcome

const ACT = [
  { v: 1.2, em: "🪑", t: "Sédentaire", d: "Peu ou pas d'exercice" },
  { v: 1.375, em: "🚶", t: "Léger", d: "1 à 3 séances / semaine" },
  { v: 1.55, em: "🏃", t: "Modéré", d: "3 à 5 séances / semaine" },
  { v: 1.725, em: "🔥", t: "Intense", d: "6 à 7 séances / semaine" },
];
const GOALS: { v: Goal; em: string; t: string; d: string }[] = [
  { v: "perte", em: "📉", t: "Perdre du poids", d: "Déficit calorique progressif" },
  { v: "maintien", em: "⚖️", t: "Maintenir mon poids", d: "Équilibre énergétique" },
  { v: "masse", em: "📈", t: "Prendre de la masse", d: "Surplus calorique maîtrisé" },
];
const DIETS = ["Omnivore", "Végétarien", "Vegan", "Keto", "Méditerranéen"];
const ALLERGIES = ["Gluten", "Lactose", "Arachides", "Fruits de mer", "Œufs", "Soja"];
const PACES = [{ v: 0.25, t: "0.25 kg", d: "/ semaine · doux" }, { v: 0.5, t: "0.5 kg", d: "/ semaine · sain" }, { v: 0.75, t: "0.75 kg", d: "/ semaine · soutenu" }];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const [sexe, setSexe] = useState<Sex | null>(null);
  const [age, setAge] = useState(34);
  const [height, setHeight] = useState(178);
  const [weight, setWeight] = useState(79);
  const [target, setTarget] = useState(74);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [activity, setActivity] = useState<number | null>(null);
  const [diet, setDiet] = useState("Omnivore");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [pace, setPace] = useState(0.5);

  const plan = useMemo(() => {
    if (!sexe || !goal || !activity) return null;
    return buildPlan({ sexe, age, height, weight, target, goal, activity, pace });
  }, [sexe, age, height, weight, target, goal, activity, pace]);

  const canNext =
    (step === 1 && !!sexe) ||
    (step === 4 && !!goal) ||
    (step === 5 && !!activity) ||
    ![1, 4, 5].includes(step);

  const finish = () => {
    setDone(true);
    try { localStorage.setItem("bodyup_onboarded", "1"); } catch {}
    setTimeout(() => router.push("/"), 650);
  };

  const next = () => {
    if (step < TOTAL) setStep(step + 1);
    else finish();
  };

  const ctaLabel = done ? "Bienvenue 🎉" : step === 0 ? "Commencer" : step === TOTAL - 1 ? "Voir mon plan" : step === TOTAL ? "Entrer dans BODYUP" : "Continuer";

  const cls = (n: number) => `${s.step} ${n === step ? s.active : ""} ${n < step ? s.left : ""}`;

  return (
    <div className={s.phone}><div className={s.screen}>
      <div className={s.top}>
        <div className={s.toprow}>
          <button className={s.back} disabled={step === 0} onClick={() => step > 0 && setStep(step - 1)}><Icon name="arrowLeft" size={18} /></button>
          <div className={s.pbar}><i style={{ width: `${(step / TOTAL) * 100 || 4}%` }} /></div>
          <span className={s.stepno}>{Math.min(step + 1, TOTAL + 1)}/{TOTAL + 1}</span>
        </div>
      </div>

      <div className={s.flow}>
        {/* 0 welcome */}
        <section className={`${cls(0)} ${s.welcome}`}>
          <div className={s.wlogo}><Icon name="check" size={46} style={{ color: "#0a1400" }} /></div>
          <h1>Bienvenue sur<br />BODYUP</h1>
          <p className={s.sub}>Réponds à 6 questions rapides. Notre IA calcule ton plan calorique personnalisé en moins d&apos;une minute.</p>
        </section>

        {/* 1 sexe */}
        <section className={cls(1)}>
          <div className={s.kicker}>Étape 1</div><h1>Tu es…</h1>
          <p className={s.sub}>Cette donnée affine le calcul de ton métabolisme.</p>
          <div className={s.grid2}>
            {(["homme", "femme"] as Sex[]).map((v) => (
              <div key={v} className={`${s.gcard} ${sexe === v ? s.sel : ""}`} onClick={() => setSexe(v)}>
                <span className={s.em}>{v === "homme" ? "👨" : "👩"}</span><b>{v === "homme" ? "Homme" : "Femme"}</b>
              </div>
            ))}
          </div>
        </section>

        {/* 2 age + taille */}
        <section className={cls(2)}>
          <div className={s.kicker}>Étape 2</div><h1>Ton profil</h1>
          <p className={s.sub}>Glisse pour ajuster ton âge et ta taille.</p>
          <Slider label="Âge" unit="ans" min={14} max={90} value={age} onChange={setAge} />
          <Slider label="Taille" unit="cm" min={130} max={220} value={height} onChange={setHeight} />
        </section>

        {/* 3 poids */}
        <section className={cls(3)}>
          <div className={s.kicker}>Étape 3</div><h1>Ton poids</h1>
          <p className={s.sub}>Actuel et objectif — l&apos;IA en déduit l&apos;écart à combler.</p>
          <Slider label="Poids actuel" unit="kg" min={40} max={160} value={weight} onChange={setWeight} />
          <Slider label="Poids cible" unit="kg" min={40} max={160} value={target} onChange={setTarget} accent />
        </section>

        {/* 4 objectif */}
        <section className={cls(4)}>
          <div className={s.kicker}>Étape 4</div><h1>Ton objectif</h1>
          <p className={s.sub}>On adapte ton budget calorique en conséquence.</p>
          <div className={s.choices}>
            {GOALS.map((g) => (
              <div key={g.v} className={`${s.choice} ${goal === g.v ? s.sel : ""}`} onClick={() => setGoal(g.v)}>
                <div className={s.ic}>{g.em}</div><div><b>{g.t}</b><span>{g.d}</span></div>
                <div className={s.tick}><Icon name="check" size={13} /></div>
              </div>
            ))}
          </div>
        </section>

        {/* 5 activité */}
        <section className={cls(5)}>
          <div className={s.kicker}>Étape 5</div><h1>Ton activité</h1>
          <p className={s.sub}>À quelle fréquence bouges-tu dans une semaine type ?</p>
          <div className={s.choices}>
            {ACT.map((a) => (
              <div key={a.v} className={`${s.choice} ${activity === a.v ? s.sel : ""}`} onClick={() => setActivity(a.v)}>
                <div className={s.ic}>{a.em}</div><div><b>{a.t}</b><span>{a.d}</span></div>
                <div className={s.tick}><Icon name="check" size={13} /></div>
              </div>
            ))}
          </div>
        </section>

        {/* 6 préférences */}
        <section className={cls(6)}>
          <div className={s.kicker}>Étape 6</div><h1>Préférences</h1>
          <p className={s.sub}>Régime, allergies et rythme souhaité. Tout est optionnel.</p>
          <div className={s.field}>
            <div className={s.fieldhead}><label>Régime alimentaire</label></div>
            <div className={s.tags}>
              {DIETS.map((d) => <span key={d} className={`${s.tag} ${diet === d ? s.sel : ""}`} onClick={() => setDiet(d)}>{d}</span>)}
            </div>
          </div>
          <div className={s.field}>
            <div className={s.fieldhead}><label>Allergies & exclusions</label></div>
            <div className={s.tags}>
              {ALLERGIES.map((a) => (
                <span key={a} className={`${s.tag} ${allergies.includes(a) ? s.sel : ""}`}
                  onClick={() => setAllergies((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a])}>{a}</span>
              ))}
            </div>
          </div>
          <div className={s.field}>
            <div className={s.fieldhead}><label>Rythme visé</label></div>
            <div className={s.daterow}>
              {PACES.map((p) => (
                <div key={p.v} className={`${s.datecard} ${pace === p.v ? s.sel : ""}`} onClick={() => setPace(p.v)}>
                  <b>{p.t}</b><span>{p.d}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7 result */}
        <section className={`${cls(7)} ${s.result}`}>
          <div className={s.kicker}>Ton plan personnalisé</div>
          <h1>C&apos;est prêt, Sébastien.</h1>
          {plan && (
            <>
              <div className={s.resring}>
                <CalorieRing value={plan.calorieTarget} fraction={plan.calorieTarget / plan.tdee} size={170} stroke={14} big={42} label="kcal / jour" trigger={step === 7} />
              </div>
              <div className={s.reslist}>
                <ResRow tint="rgba(91,209,255,.12)" color="var(--sky)" icon="clock" label="Métabolisme basal (BMR)" val={`${fr(plan.bmr)}`} />
                <ResRow tint="rgba(255,194,75,.12)" color="var(--amber)" icon="trend" label="Dépense quotidienne (TDEE)" val={`${fr(plan.tdee)}`} />
                <ResRow tint="rgba(255,122,83,.12)" color="var(--coral)" icon="plus" label={plan.deltaLabel} val={plan.dailyDelta ? `−${plan.dailyDelta} kcal` : "0 kcal"} />
                <ResRow tint="rgba(201,255,60,.12)" color="var(--lime)" icon="calendar" label="Date estimée d'atteinte" val={plan.estimatedDate ? formatDate(plan.estimatedDate) : "En continu"} />
              </div>
              <div className={`${s.warn} ${plan.realistic ? s.ok : ""}`}>
                <Icon name={plan.realistic ? "check" : "warning"} size={20} />
                <span>{plan.message}</span>
              </div>
            </>
          )}
        </section>
      </div>

      <div className={s.foot}>
        <button className={s.cta} disabled={!canNext || done} onClick={next}>
          {ctaLabel} {!done && <Icon name="arrowRight" size={19} style={{ color: "#0a1400" }} />}
        </button>
        {step === 0 && <button className={s.skip} onClick={() => router.push("/")}>Passer pour l&apos;instant</button>}
      </div>
    </div></div>
  );
}

function Slider({ label, unit, min, max, value, onChange, accent }: { label: string; unit: string; min: number; max: number; value: number; onChange: (n: number) => void; accent?: boolean }) {
  return (
    <div className={s.field}>
      <div className={s.fieldhead}>
        <label>{label}</label>
        <span className={s.out} style={accent ? { color: "var(--lime)" } : undefined}>{value} <small>{unit}</small></span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} />
      <div className={s.gap}><span>{min}</span><span>{max}</span></div>
    </div>
  );
}

function ResRow({ tint, color, icon, label, val }: { tint: string; color: string; icon: Parameters<typeof Icon>[0]["name"]; label: string; val: string }) {
  return (
    <div className={s.resrow}>
      <div className={s.ic} style={{ background: tint, color }}><Icon name={icon} size={17} /></div>
      <span className={s.nm}>{label}</span><span className={s.vv}>{val}</span>
    </div>
  );
}

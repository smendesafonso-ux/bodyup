"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import f from "@/styles/frigo.module.css";
import { Icon } from "./Icon";
import {
  THEMES, FICHES, themeById, type ThemeId, type Question, type Fiche, type FicheSection,
} from "@/lib/frigo-data";
import {
  loadProgress, saveProgress, resetProgress, pickQuiz, updateMastery, globalMastery,
  levelFor, refreshBadges, BADGE_DEFS, type Progress,
} from "@/lib/frigo-engine";

type View =
  | { name: "home" }
  | { name: "quiz"; questions: Question[]; forceTheme?: ThemeId }
  | { name: "result"; score: number; total: number; weakTheme: ThemeId; xpGained: number; perTheme: Record<string, { c: number; n: number }> }
  | { name: "fiches" }
  | { name: "fiche"; theme: ThemeId; fromResult?: boolean };

const QUIZ_LEN = 10;

/** Rend un texte avec **gras** en JSX. */
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>
      )}
    </>
  );
}

export default function Frigo() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [view, setView] = useState<View>({ name: "home" });
  const [confetti, setConfetti] = useState(false);
  const [badgeToast, setBadgeToast] = useState<{ emoji: string; name: string } | null>(null);

  // Chargement client (localStorage) après montage → pas de mismatch d'hydratation.
  useEffect(() => { setProgress(loadProgress()); }, []);

  const persist = (p: Progress) => { saveProgress(p); setProgress({ ...p }); };

  const fireConfetti = () => { setConfetti(true); setTimeout(() => setConfetti(false), 2600); };
  const showBadge = (emoji: string, name: string) => {
    setBadgeToast({ emoji, name });
    setTimeout(() => setBadgeToast(null), 3400);
  };

  const startQuiz = (forceTheme?: ThemeId) => {
    if (!progress) return;
    const questions = pickQuiz(progress, QUIZ_LEN, forceTheme);
    if (questions.length === 0) return;
    setView({ name: "quiz", questions, forceTheme });
    window.scrollTo({ top: 0 });
  };

  const finishQuiz = (
    results: { q: Question; correct: boolean }[],
    bestStreakThisRun: number,
  ) => {
    if (!progress) return;
    const p = { ...progress, themes: { ...progress.themes } };
    const perTheme: Record<string, { c: number; n: number }> = {};
    let score = 0;
    let xpGained = 0;

    for (const { q, correct } of results) {
      const st = { ...p.themes[q.theme] };
      st.seen += 1;
      if (correct) { st.correct += 1; score += 1; xpGained += 8 + q.d * 4; }
      else { xpGained += 2; }
      st.mastery = updateMastery(st.mastery, correct, q.d);
      p.themes[q.theme] = st;
      const bucket = perTheme[q.theme] ?? { c: 0, n: 0 };
      bucket.n += 1; if (correct) bucket.c += 1;
      perTheme[q.theme] = bucket;
    }
    // bonus score / série
    if (score === results.length) xpGained += 30;
    xpGained += bestStreakThisRun >= 5 ? 15 : 0;

    p.answered += results.length;
    p.xp += xpGained;
    p.bestStreak = Math.max(p.bestStreak, bestStreakThisRun);

    // thème le plus faible du quiz (le plus d'erreurs, puis maîtrise la plus basse)
    const themesInQuiz = Object.keys(perTheme) as ThemeId[];
    const weakTheme = themesInQuiz.sort((a, b) => {
      const ra = perTheme[a].c / perTheme[a].n;
      const rb = perTheme[b].c / perTheme[b].n;
      if (ra !== rb) return ra - rb;
      return p.themes[a].mastery - p.themes[b].mastery;
    })[0] ?? themesInQuiz[0];

    p.history = [{ ts: Date.now(), score, total: results.length, weakTheme }, ...p.history].slice(0, 30);

    const fresh = refreshBadges(p);
    persist(p);

    if (score >= results.length * 0.8) fireConfetti();
    if (fresh.length) {
      const b = BADGE_DEFS.find((x) => x.id === fresh[0])!;
      setTimeout(() => showBadge(b.emoji, b.name), 500);
    }

    setView({ name: "result", score, total: results.length, weakTheme, xpGained, perTheme });
    window.scrollTo({ top: 0 });
  };

  const doReset = () => {
    if (!confirm("Réinitialiser toute ta progression (XP, maîtrise, badges) ?")) return;
    setProgress(resetProgress());
    setView({ name: "home" });
  };

  return (
    <div className={f.wrap}>
      <div className={f.topbar}>
        <Link href="/" className={f.back}><Icon name="arrowLeft" size={15} /> BODYUP</Link>
        <div className={f.topttl}>
          Révision Attestation
          <small>Catégorie I · fluides frigorigènes</small>
        </div>
      </div>

      {!progress ? (
        <div className={f.card}>Chargement…</div>
      ) : view.name === "home" ? (
        <Home progress={progress} onQuiz={() => startQuiz()} onFiches={() => setView({ name: "fiches" })}
          onTheme={(t) => setView({ name: "fiche", theme: t })} onReset={doReset} />
      ) : view.name === "quiz" ? (
        <Quiz key={view.questions.map((q) => q.id).join()} questions={view.questions}
          onFinish={finishQuiz} onQuit={() => setView({ name: "home" })} />
      ) : view.name === "result" ? (
        <Result view={view} onFiche={() => setView({ name: "fiche", theme: view.weakTheme, fromResult: true })}
          onRetry={() => startQuiz()} onHome={() => setView({ name: "home" })} />
      ) : view.name === "fiches" ? (
        <FicheList onOpen={(t) => setView({ name: "fiche", theme: t })} onHome={() => setView({ name: "home" })} progress={progress} />
      ) : (
        <FicheView theme={view.theme} onQuiz={() => startQuiz(view.theme)}
          onBack={() => setView(view.fromResult ? { name: "home" } : { name: "fiches" })} />
      )}

      {confetti && <Confetti />}
      {badgeToast && (
        <div className={f.badgetoast}>
          <span className={f.em}>{badgeToast.emoji}</span>
          <div><b>Badge débloqué !</b><span>{badgeToast.name}</span></div>
        </div>
      )}
    </div>
  );
}

/* ============================== ACCUEIL ============================== */
function Home({ progress, onQuiz, onFiches, onTheme, onReset }: {
  progress: Progress; onQuiz: () => void; onFiches: () => void; onTheme: (t: ThemeId) => void; onReset: () => void;
}) {
  const lvl = levelFor(progress.xp);
  const gm = globalMastery(progress);
  const done = progress.history.length;

  return (
    <>
      <div className={f.card + " " + f.hero}>
        <div className={f.lvlemoji}>{lvl.emoji}</div>
        <div className={f.herotxt}>
          <div className={f.lab}>Niveau {lvl.idx + 1}</div>
          <h1>{lvl.name}</h1>
          <div className={f.xpbar}><i style={{ width: `${lvl.progress * 100}%` }} /></div>
          <div className={f.xpmeta}>
            <span>{progress.xp} XP</span>
            <span>{lvl.next ? `${lvl.toNext} XP → ${lvl.next.name}` : "Niveau max 🎉"}</span>
          </div>
        </div>
      </div>

      <div className={f.statrow}>
        <div className={f.stat}><b style={{ color: gm >= 70 ? "var(--lime)" : gm >= 45 ? "var(--amber)" : "var(--coral)" }}>{gm}%</b><span>Maîtrise globale</span></div>
        <div className={f.stat}><b>{done}</b><span>Quiz terminés</span></div>
        <div className={f.stat}><b style={{ color: "var(--coral)" }}>{progress.bestStreak}🔥</b><span>Meilleure série</span></div>
      </div>

      <div className={f.btnrow}>
        <button className={f.cta + " " + f.ctaPrimary} onClick={onQuiz}>
          <Icon name="spark" size={18} /> Quiz adaptatif ({QUIZ_LEN} questions)
        </button>
        <button className={f.cta + " " + f.ctaGhost} onClick={onFiches}>
          <Icon name="journal" size={18} /> Fiches de révision
        </button>
      </div>
      <p style={{ fontSize: 11.5, color: "var(--txt-3)", textAlign: "center", margin: "2px 4px 0" }}>
        Le quiz cible automatiquement tes points faibles. 🎯
      </p>

      <div className={f["section-h"]}>📊 Ta maîtrise par thème</div>
      <div className={f.themegrid}>
        {THEMES.map((t) => {
          const m = progress.themes[t.id].mastery;
          const col = m >= 70 ? "var(--lime)" : m >= 45 ? "var(--amber)" : "var(--coral)";
          return (
            <button key={t.id} className={f.themerow} onClick={() => onTheme(t.id)}>
              <span className={f.themeemoji}>{t.emoji}</span>
              <div className={f.themeinfo}>
                <b>{t.title}</b>
                <span>{t.short}</span>
                <div className={f.mbar}><i style={{ width: `${m}%`, background: col }} /></div>
              </div>
              <span className={f.mpct} style={{ color: col }}>{m}%</span>
              <span className={f.chev}>›</span>
            </button>
          );
        })}
      </div>

      <div className={f["section-h"]}>🏆 Badges</div>
      <div className={f.card}>
        <div className={f.badges}>
          {BADGE_DEFS.map((b) => {
            const got = progress.badges.includes(b.id);
            return (
              <span key={b.id} className={f.badge + (got ? "" : " " + f.locked)} title={b.name}>
                {b.emoji} {b.name}
              </span>
            );
          })}
        </div>
      </div>

      <div className={f.disclaimer}>
        ⚠️ Aide à la révision personnelle. Le contenu et les seuils réglementaires sont indicatifs :
        recoupe-les avec le référentiel officiel en vigueur (règlement (UE) 517/2014 et arrêtés relatifs
        à la manipulation des fluides frigorigènes) avant l'examen.
      </div>

      <button onClick={onReset} style={{ background: "none", border: "none", color: "var(--txt-3)", fontSize: 12, cursor: "pointer", display: "block", margin: "8px auto 0", textDecoration: "underline" }}>
        Réinitialiser ma progression
      </button>
    </>
  );
}

/* ============================== QUIZ ============================== */
function Quiz({ questions, onFinish, onQuit }: {
  questions: Question[];
  onFinish: (results: { q: Question; correct: boolean }[], bestStreak: number) => void;
  onQuit: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const results = useRef<{ q: Question; correct: boolean }[]>([]);
  const [streak, setStreak] = useState(0);
  const bestStreak = useRef(0);

  const q = questions[idx];
  const theme = themeById(q.theme);
  const answered = picked !== null;

  const answer = (i: number) => {
    if (answered) return;
    const correct = i === q.correct;
    setPicked(i);
    results.current.push({ q, correct });
    if (correct) { const ns = streak + 1; setStreak(ns); bestStreak.current = Math.max(bestStreak.current, ns); }
    else setStreak(0);
  };

  const next = () => {
    if (idx + 1 >= questions.length) {
      onFinish(results.current, bestStreak.current);
    } else {
      setIdx(idx + 1);
      setPicked(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <div className={f.quizhead}>
        <button className={f.back} onClick={onQuit} aria-label="Quitter">✕</button>
        <div className={f.progline}><i style={{ width: `${((idx + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div>
        <span className={f.qcount}>{idx + 1}/{questions.length}</span>
        {streak >= 2 && <span className={f.streakpill}>🔥 {streak}</span>}
      </div>

      <div className={f.card}>
        <span className={f.themetag}>{theme.emoji} {theme.title}</span>
        <div className={f.question} key={q.id}><RichText text={q.q} /></div>

        <div className={f.options}>
          {q.options.map((opt, i) => {
            let cls = f.opt;
            if (answered) {
              if (i === q.correct) cls += " " + f.correct;
              else if (i === picked) cls += " " + f.wrong;
              else cls += " " + f.dim;
            }
            return (
              <button key={i} className={cls} disabled={answered} onClick={() => answer(i)}>
                <span className={f.optletter}>{String.fromCharCode(65 + i)}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={f.feedback + " " + (picked === q.correct ? f.ok : f.no)}>
            <b>{picked === q.correct ? "✅ Correct !" : "❌ Pas tout à fait"}</b>
            <span className={f.whytxt}><RichText text={q.why} /></span>
          </div>
        )}

        {answered && (
          <button className={f.cta + " " + f.ctaPrimary + " " + f.nextbtn} onClick={next}>
            {idx + 1 >= questions.length ? "Voir mon résultat" : "Question suivante"} <Icon name="arrowRight" size={17} />
          </button>
        )}
      </div>
    </>
  );
}

/* ============================== RÉSULTAT ============================== */
function Result({ view, onFiche, onRetry, onHome }: {
  view: Extract<View, { name: "result" }>; onFiche: () => void; onRetry: () => void; onHome: () => void;
}) {
  const { score, total, weakTheme, xpGained, perTheme } = view;
  const pct = Math.round((score / total) * 100);
  const theme = themeById(weakTheme);
  const msg = pct === 100 ? "Sans-faute, impressionnant ! 🏆"
    : pct >= 80 ? "Excellent travail ! 💪"
    : pct >= 60 ? "Bien joué, continue comme ça 👍"
    : pct >= 40 ? "En progrès — la révision ciblée va t'aider 📈"
    : "Pas de panique : on va bosser tes points faibles 💡";

  return (
    <>
      <div className={f.card + " " + f.resulthero}>
        <div className={f.scoreBig}>{score}<small>/{total}</small></div>
        <div className={f.resultmsg}>{msg}</div>
        <div className={f.resultsub}>{pct}% de bonnes réponses</div>
        <div className={f.xpgain}>+{xpGained} XP ⚡</div>
      </div>

      <div className={f.card + " " + f.recofiche}>
        <div className={f.recohead}>
          <span style={{ fontSize: 22 }}>{theme.emoji}</span>
          <div><b>Fiche recommandée</b><span>Ton point le plus faible sur ce quiz</span></div>
        </div>
        <p style={{ fontSize: 13.5, color: "var(--txt-2)", margin: "4px 0 12px", lineHeight: 1.5 }}>
          Tu as le plus buté sur <b style={{ color: "var(--txt)" }}>{theme.title}</b>.
          Voici une fiche de révision pour consolider ça avant de réessayer.
        </p>
        <button className={f.cta + " " + f.ctaPrimary} onClick={onFiche}>
          <Icon name="journal" size={17} /> Réviser : {theme.title}
        </button>
      </div>

      <div className={f.card}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Détail par thème</div>
        <div className={f.themegrid}>
          {(Object.keys(perTheme) as ThemeId[]).map((t) => {
            const { c, n } = perTheme[t];
            const p = Math.round((c / n) * 100);
            const col = p >= 70 ? "var(--lime)" : p >= 40 ? "var(--amber)" : "var(--coral)";
            const th = themeById(t);
            return (
              <div key={t} className={f.themerow} style={{ cursor: "default" }}>
                <span className={f.themeemoji}>{th.emoji}</span>
                <div className={f.themeinfo}>
                  <b>{th.title}</b>
                  <div className={f.mbar}><i style={{ width: `${p}%`, background: col }} /></div>
                </div>
                <span className={f.mpct} style={{ color: col }}>{c}/{n}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={f.btnrow}>
        <button className={f.cta + " " + f.ctaPrimary} onClick={onRetry}><Icon name="refresh" size={17} /> Nouveau quiz adaptatif</button>
        <button className={f.cta + " " + f.ctaGhost} onClick={onHome}><Icon name="home" size={17} /> Accueil</button>
      </div>
    </>
  );
}

/* ============================== LISTE DES FICHES ============================== */
function FicheList({ onOpen, onHome, progress }: { onOpen: (t: ThemeId) => void; onHome: () => void; progress: Progress }) {
  return (
    <>
      <div className={f.quizhead}>
        <button className={f.back} onClick={onHome}><Icon name="arrowLeft" size={15} /> Accueil</button>
        <div className={f.topttl} style={{ fontSize: 16 }}>Fiches de révision</div>
      </div>
      <div className={f.fichelist}>
        {THEMES.map((t) => {
          const m = progress.themes[t.id].mastery;
          const col = m >= 70 ? "var(--lime)" : m >= 45 ? "var(--amber)" : "var(--coral)";
          return (
            <button key={t.id} className={f.themerow} onClick={() => onOpen(t.id)}>
              <span className={f.themeemoji}>{t.emoji}</span>
              <div className={f.themeinfo}>
                <b>{t.title}</b>
                <span>{FICHES[t.id].sections.length} sections · maîtrise {m}%</span>
                <div className={f.mbar}><i style={{ width: `${m}%`, background: col }} /></div>
              </div>
              <span className={f.chev}>›</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ============================== LECTURE D'UNE FICHE ============================== */
function FicheView({ theme, onQuiz, onBack }: { theme: ThemeId; onQuiz: () => void; onBack: () => void }) {
  const th = themeById(theme);
  const fiche: Fiche = FICHES[theme];
  useEffect(() => { window.scrollTo({ top: 0 }); }, [theme]);

  return (
    <>
      <div className={f.quizhead}>
        <button className={f.back} onClick={onBack}><Icon name="arrowLeft" size={15} /> Retour</button>
        <div className={f.topttl} style={{ fontSize: 15 }}>{th.emoji} {th.title}</div>
      </div>

      <div className={f.ficheintro}><RichText text={fiche.intro} /></div>

      {fiche.sections.map((sec: FicheSection, i) => (
        <div key={i} className={f.fsec}>
          <h3>{sec.h}</h3>
          <div className={f.fpoints}>
            {sec.points.map((pt, j) => (
              <div key={j} className={f.fpoint}><span><RichText text={pt} /></span></div>
            ))}
          </div>
          {sec.memo && <div className={f.fmemo}><span><RichText text={sec.memo} /></span></div>}
        </div>
      ))}

      <div className={f.btnrow} style={{ marginTop: 18 }}>
        <button className={f.cta + " " + f.ctaPrimary} onClick={onQuiz}>
          <Icon name="spark" size={17} /> Me tester sur ce thème
        </button>
        <button className={f.cta + " " + f.ctaGhost} onClick={onBack}>Retour</button>
      </div>
    </>
  );
}

/* ============================== CONFETTI ============================== */
function Confetti() {
  const colors = ["#C9FF3C", "#FF7A53", "#5BD1FF", "#B79BFF", "#FFC24B"];
  const pieces = useMemo(
    () => Array.from({ length: 70 }).map((_, i) => ({
      left: (i * 37 % 100),
      color: colors[i % colors.length],
      delay: (i % 10) * 0.12,
      dur: 1.8 + (i % 5) * 0.4,
    })),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );
  return (
    <div className={f.confetti} aria-hidden>
      {pieces.map((p, i) => (
        <i key={i} style={{ left: `${p.left}%`, background: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }} />
      ))}
    </div>
  );
}

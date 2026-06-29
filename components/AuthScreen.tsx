"use client";

import { useState } from "react";
import s from "@/styles/auth.module.css";
import { Icon } from "./Icon";
import { supabase } from "@/lib/supabase";

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setInfo(null); setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password: pwd,
          options: { data: { display_name: name || email.split("@")[0] } },
        });
        if (error) throw error;
        // Si "Confirm email" est activé, pas de session immédiate.
        if (!data.session) {
          setInfo("Compte créé. Vérifie ta boîte mail pour confirmer, puis connecte-toi.");
          setMode("login");
        }
        // sinon onAuthStateChange bascule automatiquement vers l'app
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
        if (error) throw error;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Une erreur est survenue.";
      setErr(translate(msg));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={s.phone}><div className={s.screen}>
      <div className={s.logo}><Icon name="check" size={32} /></div>
      <div className={s.brand}>BODYUP</div>
      <h1 className={s.title}>{mode === "login" ? "Bon retour 👋" : "Crée ton compte"}</h1>
      <p className={s.sub}>
        {mode === "login"
          ? "Connecte-toi pour retrouver ton profil et tes données, synchronisés sur tous tes appareils."
          : "Ton coach santé IA personnalisé. Tes données te suivent partout."}
      </p>

      <form onSubmit={submit}>
        {mode === "signup" && (
          <div className={s.field}>
            <label>Prénom</label>
            <input className={s.input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sébastien" autoComplete="given-name" />
          </div>
        )}
        <div className={s.field}>
          <label>Email</label>
          <input className={s.input} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@email.com" autoComplete="email" />
        </div>
        <div className={s.field}>
          <label>Mot de passe</label>
          <input className={s.input} type="password" required minLength={6} value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="6 caractères minimum" autoComplete={mode === "login" ? "current-password" : "new-password"} />
        </div>

        {err && <div className={s.err}>{err}</div>}
        {info && <div className={s.ok}>{info}</div>}

        <button className={s.cta} disabled={busy} type="submit">
          {busy ? <span className={s.spin} /> : (<>{mode === "login" ? "Se connecter" : "Créer mon compte"} <Icon name="arrowRight" size={18} /></>)}
        </button>
      </form>

      <div className={s.toggle}>
        {mode === "login" ? "Pas encore de compte ?" : "Déjà inscrit ?"}
        <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(null); setInfo(null); }}>
          {mode === "login" ? "Inscris-toi" : "Connecte-toi"}
        </button>
      </div>

      <p className={s.legal}>BODYUP ne remplace pas un avis médical. En continuant tu acceptes l&apos;usage de tes données pour personnaliser ton coaching.</p>
    </div></div>
  );
}

function translate(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "Email ou mot de passe incorrect.";
  if (/email not confirmed/i.test(msg)) return "Email non confirmé. Vérifie ta boîte mail.";
  if (/user already registered/i.test(msg)) return "Un compte existe déjà avec cet email. Connecte-toi.";
  if (/password should be at least/i.test(msg)) return "Le mot de passe doit faire au moins 6 caractères.";
  if (/rate limit/i.test(msg)) return "Trop de tentatives, réessaie dans quelques minutes.";
  return msg;
}

"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, type Profile } from "./supabase";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    try {
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      setProfile(data as Profile | null);
    } catch (e) {
      console.error("loadProfile failed", e);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  useEffect(() => {
    let active = true;

    // Filet de sécurité : ne jamais rester bloqué sur l'écran de chargement,
    // même si getSession() traîne ou rejette (réseau, token expiré…).
    const failsafe = setTimeout(() => { if (active) setLoading(false); }, 8000);

    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (!active) return;
        setSession(data.session);
        if (data.session?.user) await loadProfile(data.session.user.id);
      })
      .catch((e) => console.error("getSession failed", e))
      .finally(() => { if (active) { clearTimeout(failsafe); setLoading(false); } });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      // IMPORTANT : ce callback tient un verrou interne Supabase. Ne PAS y
      // faire d'await d'appels Supabase (deadlock). On diffère avec setTimeout.
      setSession(s);
      if (s?.user) setTimeout(() => { if (active) loadProfile(s.user.id); }, 0);
      else setProfile(null);
    });
    return () => { active = false; clearTimeout(failsafe); sub.subscription.unsubscribe(); };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <Ctx.Provider value={{ user: session?.user ?? null, session, profile, loading, refreshProfile, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}

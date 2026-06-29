"use client";

import a from "@/styles/auth.module.css";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import AuthScreen from "./AuthScreen";
import Onboarding, { type OnboardingResult } from "./Onboarding";
import MobileApp from "./MobileApp";

export default function AppGate() {
  const { user, profile, loading, refreshProfile } = useAuth();

  if (loading) {
    return (
      <div className={a.phone}><div className={a.screen}>
        <div className={a.loader}><span className={a.spin} /><span>Chargement de ton espace…</span></div>
      </div></div>
    );
  }

  if (!user) return <AuthScreen />;

  if (!profile?.onboarded) {
    const save = async (r: OnboardingResult) => {
      await supabase.from("profiles").upsert({
        id: user.id,
        display_name: profile?.display_name ?? user.email?.split("@")[0] ?? "Utilisateur",
        sexe: r.sexe, age: r.age, height_cm: r.height, weight_kg: r.weight, target_kg: r.target,
        goal: r.goal, activity: r.activity, pace: r.pace,
        bmr: r.plan.bmr, tdee: r.plan.tdee, calorie_target: r.plan.calorieTarget,
        onboarded: true, updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      await supabase.from("weight_logs").insert({ user_id: user.id, weight_kg: r.weight });
      await refreshProfile();
    };
    return <Onboarding onComplete={save} />;
  }

  return <MobileApp />;
}

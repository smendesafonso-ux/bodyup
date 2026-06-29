// BODYUP — moteur de calcul nutritionnel (Mifflin-St Jeor)

export type Sex = "homme" | "femme";
export type Goal = "perte" | "maintien" | "masse";

export interface OnboardingData {
  sexe: Sex;
  age: number;
  height: number; // cm
  weight: number; // kg
  target: number; // kg
  goal: Goal;
  activity: number; // facteur TDEE (1.2 … 1.9)
  pace: number; // kg / semaine
}

export interface NutritionPlan {
  bmr: number;
  tdee: number;
  calorieTarget: number;
  dailyDelta: number; // déficit (>0) ou surplus
  deltaLabel: string;
  estimatedDate: Date | null;
  weeks: number;
  realistic: boolean;
  message: string;
}

const KCAL_PER_KG = 7700;
const MIN_INTAKE: Record<Sex, number> = { homme: 1500, femme: 1200 };
const START_DATE = () => new Date(2026, 5, 29); // 29 juin 2026

/** Métabolisme basal — formule de Mifflin-St Jeor. */
export function basalMetabolicRate(d: Pick<OnboardingData, "sexe" | "weight" | "height" | "age">): number {
  const base = 10 * d.weight + 6.25 * d.height - 5 * d.age;
  return Math.round(base + (d.sexe === "homme" ? 5 : -161));
}

/** Construit le plan calorique complet à partir de l'onboarding. */
export function buildPlan(d: OnboardingData): NutritionPlan {
  const bmr = basalMetabolicRate(d);
  const tdee = Math.round(bmr * d.activity);
  const diffKg = d.weight - d.target;

  if (d.goal === "maintien" || Math.abs(diffKg) < 0.5) {
    return {
      bmr,
      tdee,
      calorieTarget: tdee,
      dailyDelta: 0,
      deltaLabel: "Équilibre",
      estimatedDate: null,
      weeks: 0,
      realistic: true,
      message: "Plan de maintien équilibré. On stabilise ton poids.",
    };
  }

  const dir = diffKg > 0 ? 1 : -1; // 1 = perte, -1 = prise
  const dailyDelta = Math.round((d.pace * KCAL_PER_KG) / 7);
  const calorieTarget = tdee - dir * dailyDelta;
  const weeks = Math.abs(diffKg) / d.pace;

  const date = START_DATE();
  date.setDate(date.getDate() + Math.round(weeks * 7));

  const realistic = calorieTarget >= MIN_INTAKE[d.sexe];
  const message = realistic
    ? `${dir > 0 ? "Perte" : "Prise"} de ${d.pace} kg/sem. — un rythme sain et tenable.`
    : "Ce rythme descend sous un apport minimal sain. Choisis un rythme plus doux ou un délai plus long.";

  return {
    bmr,
    tdee,
    calorieTarget,
    dailyDelta,
    deltaLabel: dir > 0 ? "Déficit quotidien" : "Surplus quotidien",
    estimatedDate: date,
    weeks,
    realistic,
    message,
  };
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export const fr = (n: number) => n.toLocaleString("fr-FR");

import { describe, it, expect } from "vitest";
import { basalMetabolicRate, buildPlan, formatDate, type OnboardingData } from "./nutrition";

const base: OnboardingData = {
  sexe: "homme", age: 34, height: 178, weight: 79, target: 74,
  goal: "perte", activity: 1.55, pace: 0.5,
};

describe("basalMetabolicRate (Mifflin-St Jeor)", () => {
  it("calcule le BMR homme (+5)", () => {
    // 10*79 + 6.25*178 - 5*34 + 5 = 1737.5 -> 1738
    expect(basalMetabolicRate({ sexe: "homme", weight: 79, height: 178, age: 34 })).toBe(1738);
  });

  it("calcule le BMR femme (-161)", () => {
    // 10*55 + 6.25*160 - 5*30 - 161 = 1239
    expect(basalMetabolicRate({ sexe: "femme", weight: 55, height: 160, age: 30 })).toBe(1239);
  });

  it("le sexe change le résultat de 166 kcal à profil identique", () => {
    const h = basalMetabolicRate({ sexe: "homme", weight: 70, height: 175, age: 40 });
    const f = basalMetabolicRate({ sexe: "femme", weight: 70, height: 175, age: 40 });
    expect(h - f).toBe(166);
  });
});

describe("buildPlan — perte de poids", () => {
  const plan = buildPlan(base);

  it("dérive TDEE = round(BMR * activité)", () => {
    expect(plan.tdee).toBe(2694); // round(1738 * 1.55)
  });

  it("applique un déficit de 550 kcal/jour pour 0.5 kg/sem", () => {
    expect(plan.dailyDelta).toBe(550); // round(0.5 * 7700 / 7)
    expect(plan.calorieTarget).toBe(plan.tdee - 550);
    expect(plan.deltaLabel).toBe("Déficit quotidien");
  });

  it("estime la date à 10 semaines (5 kg à 0.5 kg/sem)", () => {
    expect(plan.weeks).toBe(10);
    // 29 juin 2026 + 70 jours = 7 septembre 2026
    expect(plan.estimatedDate && formatDate(plan.estimatedDate)).toBe("7 sept. 2026");
  });

  it("considère ce rythme comme réaliste", () => {
    expect(plan.realistic).toBe(true);
  });
});

describe("buildPlan — garde-fou objectif irréaliste", () => {
  it("signale un apport sous le minimum sain", () => {
    const plan = buildPlan({
      sexe: "femme", age: 30, height: 160, weight: 55, target: 48,
      goal: "perte", activity: 1.2, pace: 0.75,
    });
    // tdee = round(1239*1.2)=1487 ; delta = round(0.75*7700/7)=825 ; cible = 662 < 1200
    expect(plan.calorieTarget).toBeLessThan(1200);
    expect(plan.realistic).toBe(false);
    expect(plan.message).toMatch(/minimal sain/i);
  });
});

describe("buildPlan — maintien", () => {
  const plan = buildPlan({ ...base, goal: "maintien" });

  it("vise le TDEE sans déficit ni date", () => {
    expect(plan.calorieTarget).toBe(plan.tdee);
    expect(plan.dailyDelta).toBe(0);
    expect(plan.estimatedDate).toBeNull();
    expect(plan.deltaLabel).toBe("Équilibre");
    expect(plan.realistic).toBe(true);
  });

  it("bascule en maintien si l'écart de poids est < 0.5 kg même en mode perte", () => {
    const p = buildPlan({ ...base, weight: 74.2, target: 74 });
    expect(p.dailyDelta).toBe(0);
    expect(p.estimatedDate).toBeNull();
  });
});

describe("buildPlan — prise de masse", () => {
  const plan = buildPlan({
    sexe: "homme", age: 28, height: 180, weight: 70, target: 75,
    goal: "masse", activity: 1.725, pace: 0.25,
  });

  it("applique un surplus calorique au-dessus du TDEE", () => {
    expect(plan.deltaLabel).toBe("Surplus quotidien");
    expect(plan.calorieTarget).toBe(plan.tdee + plan.dailyDelta);
    expect(plan.calorieTarget).toBeGreaterThan(plan.tdee);
    expect(plan.realistic).toBe(true);
  });
});

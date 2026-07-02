import { describe, it, expect } from "vitest";
import { searchLocalFoods, normText, LOCAL_FOODS, QUICK_DRINKS } from "./foods-local";

describe("normText", () => {
  it("retire les accents et la casse", () => {
    expect(normText("Pêche")).toBe("peche");
    expect(normText("CRÈME fraîche")).toBe("creme fraiche");
    expect(normText("Bœuf")).toBe("boeuf");
    expect(normText("Jus d’orange")).toBe("jus d'orange");
  });
});

describe("searchLocalFoods", () => {
  it("trouve un aliment sans taper les accents", () => {
    expect(searchLocalFoods("peche")[0]?.name).toBe("Pêche");
    expect(searchLocalFoods("creme")[0]?.name).toContain("Crème");
    expect(searchLocalFoods("boeuf").length).toBeGreaterThan(0);
  });

  it("classe le nom exact / préfixe en premier", () => {
    expect(searchLocalFoods("banane")[0]?.name).toBe("Banane");
    expect(searchLocalFoods("pomme")[0]?.name).toBe("Pomme");
    expect(searchLocalFoods("riz")[0]?.name.startsWith("Riz")).toBe(true);
  });

  it("trouve les boissons (en ml)", () => {
    const coca = searchLocalFoods("coca");
    expect(coca[0]?.name).toBe("Coca-Cola");
    expect(coca[0]?.unit).toBe("ml");
    expect(searchLocalFoods("biere")[0]?.name).toBe("Bière");
    expect(searchLocalFoods("jus orange")[0]?.name).toBe("Jus d'orange");
    expect(searchLocalFoods("the")[0]?.unit).toBe("ml");
  });

  it("supporte les requêtes multi-mots", () => {
    expect(searchLocalFoods("lait amande")[0]?.name).toBe("Lait d'amande");
    expect(searchLocalFoods("pomme terre")[0]?.name).toContain("Pomme de terre");
  });

  it("ne renvoie rien sous 2 caractères", () => {
    expect(searchLocalFoods("a")).toEqual([]);
    expect(searchLocalFoods(" ")).toEqual([]);
  });
});

describe("base embarquée", () => {
  it("ne contient pas de doublon (nom normalisé)", () => {
    const names = LOCAL_FOODS.map((f) => normText(f.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it("valeurs plausibles (0 ≤ kcal ≤ 900, macros ≥ 0)", () => {
    for (const f of LOCAL_FOODS) {
      expect(f.kcal, f.name).toBeGreaterThanOrEqual(0);
      expect(f.kcal, f.name).toBeLessThanOrEqual(900);
      expect(f.p, f.name).toBeGreaterThanOrEqual(0);
      expect(f.c, f.name).toBeGreaterThanOrEqual(0);
      expect(f.f, f.name).toBeGreaterThanOrEqual(0);
    }
  });

  it("chaque boisson rapide existe dans la base", () => {
    for (const d of QUICK_DRINKS) {
      expect(LOCAL_FOODS.some((f) => f.name === d.name), d.name).toBe(true);
    }
  });
});

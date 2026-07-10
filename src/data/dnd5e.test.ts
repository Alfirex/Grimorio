import { describe, expect, it } from "vitest";
import {
  BACKGROUND_DETAILS,
  CONDITIONS,
  conditionEmoji,
  inferAttackRange,
  levelForXp,
  RACE_DETAILS,
  SKILLS,
  XP_THRESHOLDS,
  xpForNextLevel,
} from "@/data/dnd5e";

describe("experiencia y niveles", () => {
  it("los umbrales crecen y cubren 20 niveles", () => {
    expect(XP_THRESHOLDS).toHaveLength(20);
    for (let i = 1; i < XP_THRESHOLDS.length; i++) {
      expect(XP_THRESHOLDS[i]).toBeGreaterThan(XP_THRESHOLDS[i - 1]);
    }
  });

  it("levelForXp aplica los cortes del reglamento", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(299)).toBe(1);
    expect(levelForXp(300)).toBe(2);
    expect(levelForXp(900)).toBe(3);
    expect(levelForXp(6500)).toBe(5);
    expect(levelForXp(355000)).toBe(20);
    expect(levelForXp(999999)).toBe(20);
  });

  it("xpForNextLevel devuelve el siguiente umbral o null a nivel 20", () => {
    expect(xpForNextLevel(1)).toBe(300);
    expect(xpForNextLevel(19)).toBe(355000);
    expect(xpForNextLevel(20)).toBeNull();
  });
});

describe("inferAttackRange", () => {
  it("reconoce armas a distancia por su nombre", () => {
    expect(inferAttackRange("Arco largo")).toBe(150);
    expect(inferAttackRange("Arco corto")).toBe(80);
    expect(inferAttackRange("Ballesta ligera")).toBe(80);
    expect(inferAttackRange("Honda")).toBe(30);
    expect(inferAttackRange("Jabalina")).toBe(30);
  });

  it("las armas cuerpo a cuerpo no tienen alcance", () => {
    expect(inferAttackRange("Espada larga")).toBeUndefined();
    expect(inferAttackRange("Mordisco")).toBeUndefined();
    expect(inferAttackRange("Garrote")).toBeUndefined();
  });
});

describe("condiciones", () => {
  it("tienen emoji propio y nombres únicos", () => {
    const names = new Set(CONDITIONS.map((c) => c.label));
    expect(names.size).toBe(CONDITIONS.length);
    for (const condition of CONDITIONS) {
      expect(conditionEmoji(condition.label)).toBe(condition.emoji);
    }
    expect(conditionEmoji("Inventada")).toBe("❔");
  });
});

describe("razas y trasfondos", () => {
  const skillIds = new Set(SKILLS.map((skill) => skill.id));

  it("las habilidades otorgadas existen", () => {
    for (const race of RACE_DETAILS) {
      for (const id of race.skills ?? []) {
        expect(skillIds.has(id), `${race.name}: ${id}`).toBe(true);
      }
    }
    for (const bg of BACKGROUND_DETAILS) {
      expect(bg.skills, bg.name).toHaveLength(2);
      for (const id of bg.skills) {
        expect(skillIds.has(id), `${bg.name}: ${id}`).toBe(true);
      }
    }
  });

  it("los bonificadores raciales son razonables", () => {
    for (const race of RACE_DETAILS) {
      const total = Object.values(race.bonuses).reduce((sum, n) => sum + n, 0);
      expect(total, race.name).toBeGreaterThan(0);
      expect(total, race.name).toBeLessThanOrEqual(6); // humano: +1 a todo
      expect(race.speed, race.name).toBeGreaterThanOrEqual(25);
      expect(race.traits.length, race.name).toBeGreaterThan(0);
    }
  });
});

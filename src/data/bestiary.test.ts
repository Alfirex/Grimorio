import { describe, expect, it } from "vitest";
import { BESTIARY } from "@/data/bestiary";

describe("BESTIARY", () => {
  it("no tiene criaturas duplicadas", () => {
    const names = new Set(BESTIARY.map((m) => m.name));
    expect(names.size).toBe(BESTIARY.length);
  });

  it("cada criatura está completa", () => {
    for (const monster of BESTIARY) {
      expect(monster.hp, monster.name).toBeGreaterThan(0);
      expect(monster.ac, monster.name).toBeGreaterThan(0);
      expect(monster.speed, monster.name).toBeGreaterThan(0);
      expect(monster.xp, monster.name).toBeGreaterThan(0);
      expect(monster.cr, monster.name).not.toBe("");
      expect(monster.attacks.length, monster.name).toBeGreaterThan(0);
      expect(monster.image, monster.name).toMatch(/^https:\/\/www\.dnd5eapi\.co\//);
    }
  });

  it("está ordenado por dificultad (PX ascendente)", () => {
    for (let i = 1; i < BESTIARY.length; i++) {
      expect(BESTIARY[i].xp).toBeGreaterThanOrEqual(BESTIARY[i - 1].xp);
    }
  });

  it("los ataques tienen id único dentro de cada criatura y daño con dados", () => {
    for (const monster of BESTIARY) {
      const ids = new Set(monster.attacks.map((a) => a.id));
      expect(ids.size, monster.name).toBe(monster.attacks.length);
      for (const attack of monster.attacks) {
        expect(attack.damage, `${monster.name}/${attack.name}`).toMatch(/\d*d\d+/);
        if (attack.range !== undefined) {
          expect(attack.range, `${monster.name}/${attack.name}`).toBeGreaterThanOrEqual(5);
        }
      }
    }
  });
});

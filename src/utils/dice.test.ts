import { describe, expect, it } from "vitest";
import { parseDiceExpression, rollDice } from "@/utils/dice";

describe("parseDiceExpression", () => {
  it("analiza expresiones completas", () => {
    expect(parseDiceExpression("2d6+3")).toEqual({ count: 2, sides: 6, modifier: 3 });
    expect(parseDiceExpression("4d8-1")).toEqual({ count: 4, sides: 8, modifier: -1 });
  });

  it("asume una tirada cuando no hay cantidad", () => {
    expect(parseDiceExpression("d20")).toEqual({ count: 1, sides: 20, modifier: 0 });
  });

  it("tolera espacios y mayúsculas", () => {
    expect(parseDiceExpression(" 1D12 + 4 ")).toEqual({ count: 1, sides: 12, modifier: 4 });
  });

  it("rechaza expresiones inválidas", () => {
    expect(parseDiceExpression("")).toBeNull();
    expect(parseDiceExpression("abc")).toBeNull();
    expect(parseDiceExpression("2d")).toBeNull();
    expect(parseDiceExpression("0d6")).toBeNull(); // al menos un dado
    expect(parseDiceExpression("2d1")).toBeNull(); // dados de 1 cara no existen
    expect(parseDiceExpression("2d6+3+4")).toBeNull();
  });
});

describe("rollDice", () => {
  it("devuelve null con expresiones inválidas", () => {
    expect(rollDice("patata")).toBeNull();
  });

  it("respeta el rango de los dados y suma el modificador", () => {
    for (let i = 0; i < 200; i++) {
      const result = rollDice("2d6+3");
      expect(result).not.toBeNull();
      expect(result!.rolls).toHaveLength(2);
      for (const roll of result!.rolls) {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
      }
      expect(result!.total).toBe(result!.rolls[0] + result!.rolls[1] + 3);
      expect(result!.total).toBeGreaterThanOrEqual(5);
      expect(result!.total).toBeLessThanOrEqual(15);
    }
  });

  it("admite modificadores negativos", () => {
    const result = rollDice("1d4-2");
    expect(result).not.toBeNull();
    expect(result!.modifier).toBe(-2);
    expect(result!.total).toBe(result!.rolls[0] - 2);
  });
});

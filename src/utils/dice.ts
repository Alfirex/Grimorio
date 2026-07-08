import type { DiceRollResult } from "@/types";

const DICE_REGEX = /^\s*(\d{0,3})d(\d{1,4})\s*([+-]\s*\d{1,4})?\s*$/i;

/**
 * Analiza expresiones tipo "2d6+3", "d20", "4d8-1".
 * Devuelve null si la expresión no es válida.
 */
export function parseDiceExpression(
  expression: string
): { count: number; sides: number; modifier: number } | null {
  const match = expression.match(DICE_REGEX);
  if (!match) return null;
  const count = match[1] ? parseInt(match[1], 10) : 1;
  const sides = parseInt(match[2], 10);
  const modifier = match[3] ? parseInt(match[3].replace(/\s/g, ""), 10) : 0;
  if (count < 1 || count > 100 || sides < 2 || sides > 1000) return null;
  return { count, sides, modifier };
}

export function rollDice(expression: string): DiceRollResult | null {
  const parsed = parseDiceExpression(expression);
  if (!parsed) return null;
  const rolls = Array.from(
    { length: parsed.count },
    () => Math.floor(Math.random() * parsed.sides) + 1
  );
  const total = rolls.reduce((sum, r) => sum + r, 0) + parsed.modifier;
  return {
    id: crypto.randomUUID(),
    expression: expression.trim().toLowerCase(),
    rolls,
    modifier: parsed.modifier,
    total,
    timestamp: Date.now(),
  };
}

import { describe, expect, it } from "vitest";
import {
  abilityModifier,
  createBlankCharacter,
  formatModifier,
  hitDieForClass,
  initiativeTotal,
  passivePerception,
  proficiencyBonus,
  savingThrowBonus,
  skillBonus,
  spellAttackBonus,
  spellSaveDC,
} from "@/utils/character";
import type { Character } from "@/types";

const base = (): Character => ({ id: "test", ...createBlankCharacter("uid", "Tester") });

describe("modificadores", () => {
  it("abilityModifier sigue la tabla estándar", () => {
    expect(abilityModifier(10)).toBe(0);
    expect(abilityModifier(8)).toBe(-1);
    expect(abilityModifier(20)).toBe(5);
    expect(abilityModifier(3)).toBe(-4);
    expect(abilityModifier(15)).toBe(2);
  });

  it("proficiencyBonus escala con el nivel", () => {
    expect(proficiencyBonus(1)).toBe(2);
    expect(proficiencyBonus(4)).toBe(2);
    expect(proficiencyBonus(5)).toBe(3);
    expect(proficiencyBonus(20)).toBe(6);
  });

  it("formatModifier siempre lleva signo", () => {
    expect(formatModifier(3)).toBe("+3");
    expect(formatModifier(0)).toBe("+0");
    expect(formatModifier(-2)).toBe("-2");
  });
});

describe("bonos derivados", () => {
  it("savingThrowBonus suma competencia solo si la hay", () => {
    const character = { ...base(), abilities: { ...base().abilities, wis: 14 }, level: 5 };
    expect(savingThrowBonus(character, "wis")).toBe(2);
    character.savingThrowProfs = ["wis"];
    expect(savingThrowBonus(character, "wis")).toBe(5); // +2 SAB +3 comp.
  });

  it("skillBonus aplica competencia y pericia", () => {
    const character = {
      ...base(),
      abilities: { ...base().abilities, dex: 16 },
      level: 5,
    };
    expect(skillBonus(character, "stealth")).toBe(3);
    character.skillProfs = ["stealth"];
    expect(skillBonus(character, "stealth")).toBe(6);
    character.skillExpertise = ["stealth"];
    expect(skillBonus(character, "stealth")).toBe(9);
  });

  it("percepción pasiva = 10 + bono de Percepción", () => {
    const character = base();
    expect(passivePerception(character)).toBe(10 + skillBonus(character, "perception"));
  });

  it("iniciativa = mod. DES + bono extra", () => {
    const character = { ...base(), abilities: { ...base().abilities, dex: 14 }, initiativeBonus: 1 };
    expect(initiativeTotal(character)).toBe(3);
  });
});

describe("conjuros", () => {
  it("sin característica de conjuro no hay CD ni ataque", () => {
    const character = base();
    expect(spellSaveDC(character)).toBeNull();
    expect(spellAttackBonus(character)).toBeNull();
  });

  it("CD = 8 + competencia + modificador; ataque sin el 8", () => {
    const character = {
      ...base(),
      level: 5,
      spellcastingAbility: "int" as const,
      abilities: { ...base().abilities, int: 18 },
    };
    expect(spellSaveDC(character)).toBe(15);
    expect(spellAttackBonus(character)).toBe(7);
  });
});

describe("clases y personaje en blanco", () => {
  it("hitDieForClass conoce las clases y tiene respaldo", () => {
    expect(hitDieForClass("Bárbaro")).toBe(12);
    expect(hitDieForClass("Mago")).toBe(6);
    expect(hitDieForClass("Clase inventada")).toBe(8);
  });

  it("createBlankCharacter produce una ficha jugable", () => {
    const character = base();
    expect(character.level).toBe(1);
    expect(character.currentHp).toBe(character.maxHp);
    expect(character.spellSlots).toHaveLength(9);
    expect(character.abilities.str).toBe(10);
    expect(character.deity).toBe("");
    expect(character.deathSaves).toEqual({ successes: 0, failures: 0 });
  });
});

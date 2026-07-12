import type { AbilityKey, Character } from "@/types";
import { CLASSES, SKILLS } from "@/data/dnd5e";

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function proficiencyBonus(level: number): number {
  return 2 + Math.floor((Math.max(1, level) - 1) / 4);
}

export function savingThrowBonus(character: Character, ability: AbilityKey): number {
  const base = abilityModifier(character.abilities[ability]);
  return character.savingThrowProfs.includes(ability)
    ? base + proficiencyBonus(character.level)
    : base;
}

export function skillBonus(character: Character, skillId: string): number {
  const skill = SKILLS.find((s) => s.id === skillId);
  if (!skill) return 0;
  const base = abilityModifier(character.abilities[skill.ability]);
  const prof = proficiencyBonus(character.level);
  if (character.skillExpertise.includes(skillId)) return base + prof * 2;
  if (character.skillProfs.includes(skillId)) return base + prof;
  return base;
}

export function passivePerception(character: Character): number {
  return 10 + skillBonus(character, "perception");
}

export function initiativeTotal(character: Character): number {
  return abilityModifier(character.abilities.dex) + character.initiativeBonus;
}

export function spellSaveDC(character: Character): number | null {
  if (!character.spellcastingAbility) return null;
  return (
    8 +
    proficiencyBonus(character.level) +
    abilityModifier(character.abilities[character.spellcastingAbility])
  );
}

export function spellAttackBonus(character: Character): number | null {
  if (!character.spellcastingAbility) return null;
  return (
    proficiencyBonus(character.level) +
    abilityModifier(character.abilities[character.spellcastingAbility])
  );
}

export function hitDieForClass(className: string): number {
  return CLASSES.find((c) => c.name === className)?.hitDie ?? 8;
}

/**
 * Convierte el texto libre de equipo ("10 antorchas, cuerda, raciones x5")
 * en objetos con cantidad, separando por comas, puntos y comas o saltos de línea.
 */
export function parseEquipmentText(text: string): Array<{ name: string; quantity: number }> {
  return text
    .split(/[\n,;]/)
    .map((chunk) => chunk.trim().replace(/[.·]$/, ""))
    .filter(Boolean)
    .map((chunk) => {
      const trailing = chunk.match(/^(.+?)\s*[x×]\s*(\d+)$/i);
      if (trailing) return { name: trailing[1].trim(), quantity: parseInt(trailing[2], 10) };
      const leading = chunk.match(/^(\d+)\s+(.+)$/);
      if (leading) return { name: leading[2].trim(), quantity: parseInt(leading[1], 10) };
      return { name: chunk, quantity: 1 };
    });
}

const num = (value: unknown, min: number, max: number, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.round(value)))
    : fallback;

const str = (value: unknown, max: number, fallback = ""): string =>
  typeof value === "string" ? value.slice(0, max) : fallback;

const strArray = (value: unknown, maxItems: number, maxLen: number): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").slice(0, maxItems).map((item) => item.slice(0, maxLen))
    : [];

/**
 * Sanea un personaje importado desde JSON: solo acepta los campos de una
 * ficha, con sus tipos correctos, longitudes acotadas y números en rango.
 * Cualquier cosa rara se descarta y se usa el valor de la ficha en blanco.
 */
export function sanitizeImportedCharacter(
  raw: unknown,
  blank: Omit<Character, "id">
): Omit<Character, "id"> {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const abilities = (data.abilities ?? {}) as Record<string, unknown>;
  const money = (data.money ?? {}) as Record<string, unknown>;
  const saves = (data.deathSaves ?? {}) as Record<string, unknown>;

  const abilityKeys: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];
  const spellcasting = abilityKeys.includes(data.spellcastingAbility as AbilityKey)
    ? (data.spellcastingAbility as AbilityKey)
    : "";

  return {
    ...blank,
    name: str(data.name, 80),
    // Firestore no admite undefined: el avatar solo se incluye si es válido
    ...(typeof data.avatar === "string" && data.avatar.startsWith("data:image/")
      ? { avatar: data.avatar.slice(0, 300_000) }
      : {}),
    race: str(data.race, 40, blank.race),
    characterClass: str(data.characterClass, 40, blank.characterClass),
    subclass: str(data.subclass, 60),
    level: num(data.level, 1, 20, 1),
    background: str(data.background, 40, blank.background),
    alignment: str(data.alignment, 30, blank.alignment),
    deity: str(data.deity, 60),
    xp: num(data.xp, 0, 999_999, 0),
    abilities: {
      str: num(abilities.str, 1, 30, 10),
      dex: num(abilities.dex, 1, 30, 10),
      con: num(abilities.con, 1, 30, 10),
      int: num(abilities.int, 1, 30, 10),
      wis: num(abilities.wis, 1, 30, 10),
      cha: num(abilities.cha, 1, 30, 10),
    },
    savingThrowProfs: strArray(data.savingThrowProfs, 6, 10).filter((key) =>
      abilityKeys.includes(key as AbilityKey)
    ) as AbilityKey[],
    skillProfs: strArray(data.skillProfs, 30, 30),
    skillExpertise: strArray(data.skillExpertise, 30, 30),
    armorClass: num(data.armorClass, 0, 40, 10),
    initiativeBonus: num(data.initiativeBonus, -10, 20, 0),
    speed: num(data.speed, 0, 200, 30),
    maxHp: num(data.maxHp, 1, 999, 10),
    currentHp: num(data.currentHp, 0, 999, 10),
    tempHp: num(data.tempHp, 0, 999, 0),
    hitDiceTotal: num(data.hitDiceTotal, 1, 20, 1),
    hitDiceUsed: num(data.hitDiceUsed, 0, 20, 0),
    deathSaves: {
      successes: num(saves.successes, 0, 3, 0),
      failures: num(saves.failures, 0, 3, 0),
    },
    inspiration: data.inspiration === true,
    attacks: (Array.isArray(data.attacks) ? data.attacks : [])
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .slice(0, 20)
      .map((item) => ({
        id: crypto.randomUUID(),
        name: str(item.name, 60),
        bonus: str(item.bonus, 10),
        damage: str(item.damage, 20),
        type: str(item.type, 120),
        ...(typeof item.range === "number" && Number.isFinite(item.range)
          ? { range: num(item.range, 5, 5280, 5) }
          : {}),
      })),
    spellcastingAbility: spellcasting,
    spellSlots: Array.from({ length: 9 }, (_, i) => {
      const slot = (Array.isArray(data.spellSlots) ? data.spellSlots[i] : null) as
        | Record<string, unknown>
        | null;
      const total = num(slot?.total, 0, 9, 0);
      return { total, used: num(slot?.used, 0, total, 0) };
    }),
    spells: (Array.isArray(data.spells) ? data.spells : [])
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .slice(0, 80)
      .map((item) => ({
        id: crypto.randomUUID(),
        name: str(item.name, 60),
        level: num(item.level, 0, 9, 0),
        prepared: item.prepared === true,
        description: str(item.description, 300),
      })),
    money: {
      cp: num(money.cp, 0, 999_999, 0),
      sp: num(money.sp, 0, 999_999, 0),
      ep: num(money.ep, 0, 999_999, 0),
      gp: num(money.gp, 0, 999_999, 0),
      pp: num(money.pp, 0, 999_999, 0),
    },
    equipment: str(data.equipment, 5000),
    inventory: (Array.isArray(data.inventory) ? data.inventory : [])
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .slice(0, 100)
      .map((item) => ({
        id: crypto.randomUUID(),
        name: str(item.name, 80),
        quantity: num(item.quantity, 1, 999, 1),
        weight: typeof item.weight === "number" && Number.isFinite(item.weight)
          ? Math.min(10_000, Math.max(0, item.weight))
          : 0,
        notes: str(item.notes, 200),
        equipped: item.equipped === true,
      })),
    personality: str(data.personality, 2000),
    ideals: str(data.ideals, 2000),
    bonds: str(data.bonds, 2000),
    flaws: str(data.flaws, 2000),
    appearance: str(data.appearance, 2000),
    backstory: str(data.backstory, 20_000),
    featuresAndTraits: str(data.featuresAndTraits, 20_000),
    otherProficiencies: str(data.otherProficiencies, 5000),
  };
}

export function createBlankCharacter(ownerUid: string, ownerName: string): Omit<Character, "id"> {
  const now = Date.now();
  return {
    ownerUid,
    ownerName,
    campaignId: null,
    createdAt: now,
    updatedAt: now,
    name: "",
    race: "Humano",
    characterClass: "Guerrero",
    subclass: "",
    level: 1,
    background: "Soldado",
    alignment: "Neutral",
    deity: "",
    xp: 0,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    savingThrowProfs: [],
    skillProfs: [],
    skillExpertise: [],
    armorClass: 10,
    initiativeBonus: 0,
    speed: 30,
    maxHp: 10,
    currentHp: 10,
    tempHp: 0,
    hitDiceTotal: 1,
    hitDiceUsed: 0,
    deathSaves: { successes: 0, failures: 0 },
    inspiration: false,
    attacks: [],
    spellcastingAbility: "",
    spellSlots: Array.from({ length: 9 }, () => ({ total: 0, used: 0 })),
    spells: [],
    money: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    equipment: "",
    inventory: [],
    personality: "",
    ideals: "",
    bonds: "",
    flaws: "",
    appearance: "",
    backstory: "",
    featuresAndTraits: "",
    otherProficiencies: "",
  };
}

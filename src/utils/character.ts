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

import type { AbilityKey } from "@/types";

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: "Fuerza",
  dex: "Destreza",
  con: "Constitución",
  int: "Inteligencia",
  wis: "Sabiduría",
  cha: "Carisma",
};

export const ABILITY_KEYS: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

export interface SkillDef {
  id: string;
  label: string;
  ability: AbilityKey;
}

export const SKILLS: SkillDef[] = [
  { id: "acrobatics", label: "Acrobacias", ability: "dex" },
  { id: "animal-handling", label: "Trato con Animales", ability: "wis" },
  { id: "arcana", label: "Arcanos", ability: "int" },
  { id: "athletics", label: "Atletismo", ability: "str" },
  { id: "deception", label: "Engaño", ability: "cha" },
  { id: "history", label: "Historia", ability: "int" },
  { id: "insight", label: "Perspicacia", ability: "wis" },
  { id: "intimidation", label: "Intimidación", ability: "cha" },
  { id: "investigation", label: "Investigación", ability: "int" },
  { id: "medicine", label: "Medicina", ability: "wis" },
  { id: "nature", label: "Naturaleza", ability: "int" },
  { id: "perception", label: "Percepción", ability: "wis" },
  { id: "performance", label: "Interpretación", ability: "cha" },
  { id: "persuasion", label: "Persuasión", ability: "cha" },
  { id: "religion", label: "Religión", ability: "int" },
  { id: "sleight-of-hand", label: "Juego de Manos", ability: "dex" },
  { id: "stealth", label: "Sigilo", ability: "dex" },
  { id: "survival", label: "Supervivencia", ability: "wis" },
];

export interface ClassDef {
  name: string;
  hitDie: number;
  spellcaster: boolean;
}

export const CLASSES: ClassDef[] = [
  { name: "Bárbaro", hitDie: 12, spellcaster: false },
  { name: "Bardo", hitDie: 8, spellcaster: true },
  { name: "Brujo", hitDie: 8, spellcaster: true },
  { name: "Clérigo", hitDie: 8, spellcaster: true },
  { name: "Druida", hitDie: 8, spellcaster: true },
  { name: "Explorador", hitDie: 10, spellcaster: true },
  { name: "Guerrero", hitDie: 10, spellcaster: false },
  { name: "Hechicero", hitDie: 6, spellcaster: true },
  { name: "Mago", hitDie: 6, spellcaster: true },
  { name: "Monje", hitDie: 8, spellcaster: false },
  { name: "Paladín", hitDie: 10, spellcaster: true },
  { name: "Pícaro", hitDie: 8, spellcaster: false },
];

export const RACES: string[] = [
  "Humano",
  "Elfo",
  "Semielfo",
  "Enano",
  "Mediano",
  "Gnomo",
  "Semiorco",
  "Dracónido",
  "Tiefling",
  "Aasimar",
  "Goliat",
  "Tabaxi",
  "Otro",
];

export const ALIGNMENTS: string[] = [
  "Legal Bueno",
  "Neutral Bueno",
  "Caótico Bueno",
  "Legal Neutral",
  "Neutral",
  "Caótico Neutral",
  "Legal Malvado",
  "Neutral Malvado",
  "Caótico Malvado",
];

export const BACKGROUNDS: string[] = [
  "Acólito",
  "Artesano Gremial",
  "Charlatán",
  "Criminal",
  "Artista",
  "Héroe del Pueblo",
  "Noble",
  "Ermitaño",
  "Forastero",
  "Marinero",
  "Soldado",
  "Huérfano",
  "Sabio",
  "Otro",
];

export const SPELL_LEVEL_LABELS = [
  "Trucos",
  "Nivel 1",
  "Nivel 2",
  "Nivel 3",
  "Nivel 4",
  "Nivel 5",
  "Nivel 6",
  "Nivel 7",
  "Nivel 8",
  "Nivel 9",
];

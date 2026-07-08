export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export interface Abilities {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Attack {
  id: string;
  name: string;
  bonus: string;
  damage: string;
  type: string;
}

export interface Spell {
  id: string;
  name: string;
  level: number; // 0 = truco
  prepared: boolean;
  description: string;
}

export interface SpellSlot {
  total: number;
  used: number;
}

export interface DeathSaves {
  successes: number;
  failures: number;
}

export interface Money {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface Character {
  id: string;
  ownerUid: string;
  ownerName: string;
  campaignId: string | null;
  createdAt: number;
  updatedAt: number;

  // Identidad
  name: string;
  race: string;
  characterClass: string;
  subclass: string;
  level: number;
  background: string;
  alignment: string;
  xp: number;

  // Características
  abilities: Abilities;
  savingThrowProfs: AbilityKey[];
  skillProfs: string[];
  skillExpertise: string[];

  // Combate
  armorClass: number;
  initiativeBonus: number;
  speed: number;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  hitDiceTotal: number;
  hitDiceUsed: number;
  deathSaves: DeathSaves;
  inspiration: boolean;
  attacks: Attack[];

  // Conjuros
  spellcastingAbility: AbilityKey | "";
  spellSlots: SpellSlot[]; // índices 0-8 → niveles 1-9
  spells: Spell[];

  // Equipo
  money: Money;
  equipment: string;

  // Personalidad e historia
  personality: string;
  ideals: string;
  bonds: string;
  flaws: string;
  appearance: string;
  backstory: string;
  featuresAndTraits: string;
  otherProficiencies: string;
}

export type NoteVisibility = "dm" | "shared";

export interface CharacterNote {
  id: string;
  authorUid: string;
  authorName: string;
  text: string;
  visibility: NoteVisibility;
  createdAt: number;
}

/** Parámetros para regenerar el mapa del tablero de forma determinista. */
export interface BoardConfig {
  seed: number;
  width: number;
  height: number;
  roomAttempts: number;
  minRoomSize: number;
  maxRoomSize: number;
}

export interface BoardToken {
  id: string;
  characterId: string | null; // null = PNJ/enemigo del máster
  name: string;
  color: string;
  x: number;
  y: number;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  dmUid: string;
  dmName: string;
  inviteCode: string;
  memberUids: string[];
  createdAt: number;
  board?: BoardConfig | null;
  tokens?: Record<string, BoardToken>;
}

export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  isPlayer: boolean;
}

export interface DiceRollResult {
  id: string;
  expression: string;
  rolls: number[];
  modifier: number;
  total: number;
  timestamp: number;
}

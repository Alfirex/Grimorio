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
  /** Alcance en pies; ausente = cuerpo a cuerpo (5 pies). */
  range?: number;
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

/** Objeto del inventario estructurado. */
export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  /** Peso por unidad, en libras. */
  weight: number;
  notes: string;
  /** Marcado si lo lleva puesto o en la mano (armadura, armas…). */
  equipped: boolean;
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
  avatar?: string; // retrato como data-URL comprimido (128px)
  race: string;
  characterClass: string;
  subclass: string;
  level: number;
  background: string;
  alignment: string;
  /** Deidad o fe que sigue el personaje ("" = ninguna). */
  deity?: string;
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
  /** Inventario estructurado; el texto libre de `equipment` es el formato antiguo. */
  inventory?: InventoryItem[];

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
  /** Ambientación visual: mazmorra, cueva, castillo, bosque… */
  theme?: string;
  /** Forma de las salas: rect (clásicas), round, poly, cave o mixed. */
  roomShapes?: "rect" | "round" | "poly" | "cave" | "mixed";
  /** Trazado de los pasillos: straight, winding o wide. */
  corridorStyle?: "straight" | "winding" | "wide";
  /** Conexiones extra entre salas: none, some o many. */
  loops?: "none" | "some" | "many";
  /** Agua en el mapa: none, river, lake o both. */
  water?: "none" | "river" | "lake" | "both";
  /** Columnas de piedra en las salas grandes. */
  pillars?: boolean;
}

export interface BoardToken {
  id: string;
  characterId: string | null; // null = PNJ/enemigo del máster
  name: string;
  color: string;
  x: number;
  y: number;
  // PG, CA y velocidad propios solo para enemigos; las fichas de jugador los leen de su personaje
  hp?: number;
  maxHp?: number;
  ac?: number;
  speed?: number; // en pies (una casilla = 5 pies)
  attacks?: Attack[]; // ataques del bestiario (enemigos)
  abilities?: string[]; // hechizos, trucos y rasgos (referencia del máster)
  loot?: string; // expresión de dados de monedas de oro que suelta al morir
  xp?: number; // PX que otorga al morir (se reparten al saquear)
  image?: string; // retrato de la criatura (bestiario)
  conditions?: string[]; // estados activos: Envenenado, Derribado…
}

export interface BoardLogEntry {
  id: string;
  text: string;
  timestamp: number;
}

/** Entrada del diario de campaña (crónica de sesiones, escrita por el máster). */
export interface JournalEntry {
  id: string;
  text: string;
  timestamp: number;
}

/** Enemigo guardado en un preset de encuentro (sin posición ni id). */
export interface PresetEnemy {
  name: string;
  hp: number;
  maxHp: number;
  ac: number;
  speed: number;
  attacks?: Attack[];
  abilities?: string[];
  loot?: string;
  xp?: number;
  image?: string;
}

/** Grupo de enemigos reutilizable que el máster despliega en una sala. */
export interface EncounterPreset {
  id: string;
  name: string;
  enemies: PresetEnemy[];
}

/** Documento que el máster enseña a los jugadores: retratos, cartas, mapas… */
export interface Handout {
  id: string;
  title: string;
  /** Imagen comprimida como data-URL JPEG. */
  image: string;
  /** Solo los handouts revelados son visibles (y legibles) para los jugadores. */
  revealed: boolean;
  createdAt: number;
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
  boardLog?: BoardLogEntry[];
  /** Índices de salas ya descubiertas por los jugadores (niebla de guerra). */
  revealedRooms?: number[];
  /** Encuentro en curso: orden de iniciativa visible para todos. */
  encounter?: Encounter | null;
  /** Puertas abiertas del tablero, como claves "x,y" (las demás están cerradas). */
  openDoors?: string[];
  /** Diario de campaña: crónica de sesiones visible para todos. */
  journal?: JournalEntry[];
  /** Presets de encuentro del máster: grupos de enemigos listos para desplegar. */
  presets?: EncounterPreset[];
}

export interface Combatant {
  /** Id de la ficha del tablero (o del personaje, que coincide con su ficha). */
  id: string;
  name: string;
  initiative: number;
  isPlayer: boolean;
}

/** Encuentro compartido: lo gestiona el máster, lo ven todos los jugadores. */
export interface Encounter {
  combatants: Combatant[];
  turnIndex: number;
  round: number;
}

export interface DiceRollResult {
  id: string;
  expression: string;
  rolls: number[];
  modifier: number;
  total: number;
  timestamp: number;
}

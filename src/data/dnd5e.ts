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

export interface ConditionDef {
  label: string;
  emoji: string;
}

/** Estados de combate que se pueden marcar sobre una ficha del tablero. */
export const CONDITIONS: ConditionDef[] = [
  { label: "Agarrado", emoji: "✊" },
  { label: "Asustado", emoji: "😱" },
  { label: "Aturdido", emoji: "💫" },
  { label: "Cegado", emoji: "🙈" },
  { label: "Concentración", emoji: "🎯" },
  { label: "Derribado", emoji: "🔻" },
  { label: "Envenenado", emoji: "🤢" },
  { label: "Hechizado", emoji: "💘" },
  { label: "Inconsciente", emoji: "😵" },
  { label: "Invisible", emoji: "👻" },
  { label: "Paralizado", emoji: "🧊" },
];

export function conditionEmoji(label: string): string {
  return CONDITIONS.find((c) => c.label === label)?.emoji ?? "❔";
}

/**
 * Alcance en pies deducido del nombre del arma o conjuro, para ataques
 * guardados sin alcance explícito. undefined = cuerpo a cuerpo.
 */
export function inferAttackRange(name: string): number | undefined {
  const n = name.toLowerCase();
  if (/arco largo/.test(n)) return 150;
  if (/arco|ballesta/.test(n)) return 80;
  if (/rayo|descarga|saeta|proyectil|bola de fuego|relámpago/.test(n)) return 120;
  if (/honda|jabalina|dardo|arrojadiz|lanza ligera/.test(n)) return 30;
  return undefined;
}

export interface DeityDef {
  name: string;
  /** Epíteto: de qué es dios/diosa. */
  title: string;
  /** Dominios sugeridos para clérigos. */
  domains: string;
}

/** Panteón de los Reinos Olvidados (Manual del Jugador). */
export const DEITIES: DeityDef[] = [
  { name: "Auril", title: "diosa del invierno", domains: "Naturaleza, Tempestad" },
  { name: "Azuth", title: "dios de los magos", domains: "Conocimiento" },
  { name: "Bane", title: "dios de la tiranía", domains: "Guerra" },
  { name: "Beshaba", title: "diosa de la mala suerte", domains: "Engaño" },
  { name: "Bhaal", title: "dios del asesinato", domains: "Muerte" },
  { name: "Chauntea", title: "diosa de la agricultura", domains: "Vida" },
  { name: "Cyric", title: "dios de las mentiras", domains: "Engaño" },
  { name: "Eldath", title: "diosa de la paz", domains: "Vida, Naturaleza" },
  { name: "Gond", title: "dios de la artesanía", domains: "Conocimiento" },
  { name: "Helm", title: "dios de la protección", domains: "Vida, Luz" },
  { name: "Ilmater", title: "dios de la resistencia", domains: "Vida" },
  { name: "Kelemvor", title: "dios de los muertos", domains: "Muerte" },
  { name: "Lathander", title: "dios del amanecer y la renovación", domains: "Vida, Luz" },
  { name: "Leira", title: "diosa de la ilusión", domains: "Engaño" },
  { name: "Lliira", title: "diosa de la alegría", domains: "Vida" },
  { name: "Loviatar", title: "diosa del dolor", domains: "Muerte" },
  { name: "Malar", title: "dios de la caza", domains: "Naturaleza" },
  { name: "Mask", title: "dios de los ladrones", domains: "Engaño" },
  { name: "Mielikki", title: "diosa de los bosques", domains: "Naturaleza" },
  { name: "Milil", title: "dios de la poesía y la canción", domains: "Luz" },
  { name: "Myrkul", title: "dios de la muerte", domains: "Muerte" },
  { name: "Mystra", title: "diosa de la magia", domains: "Conocimiento" },
  { name: "Oghma", title: "dios del conocimiento", domains: "Conocimiento" },
  { name: "Selûne", title: "diosa de la luna", domains: "Conocimiento, Vida" },
  { name: "Shar", title: "diosa de la oscuridad y la pérdida", domains: "Muerte, Engaño" },
  { name: "Silvanus", title: "dios de la naturaleza salvaje", domains: "Naturaleza" },
  { name: "Sune", title: "diosa del amor y la belleza", domains: "Vida, Luz" },
  { name: "Talona", title: "diosa de la enfermedad y el veneno", domains: "Muerte" },
  { name: "Talos", title: "dios de las tormentas", domains: "Tempestad" },
  { name: "Tempus", title: "dios de la guerra", domains: "Guerra" },
  { name: "Torm", title: "dios del coraje y el sacrificio", domains: "Guerra" },
  { name: "Tymora", title: "diosa de la buena fortuna", domains: "Engaño" },
  { name: "Tyr", title: "dios de la justicia", domains: "Guerra" },
  { name: "Umberlee", title: "diosa del mar", domains: "Tempestad" },
  { name: "Waukeen", title: "diosa del comercio", domains: "Conocimiento, Engaño" },
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

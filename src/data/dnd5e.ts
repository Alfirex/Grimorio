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

export const ABILITY_ABBR: Record<AbilityKey, string> = {
  str: "FUE",
  dex: "DES",
  con: "CON",
  int: "INT",
  wis: "SAB",
  cha: "CAR",
};

export interface RaceDef {
  name: string;
  /** Bonificadores de característica (+2 DES…). */
  bonuses: Partial<Record<AbilityKey, number>>;
  speed: number;
  /** Competencias de habilidad que otorga (ids de SKILLS). */
  skills?: string[];
  /** Rasgos raciales, en una línea cada uno. */
  traits: string[];
  languages: string;
}

/** Razas del Manual del Jugador con su mecánica aplicable. */
export const RACE_DETAILS: RaceDef[] = [
  {
    name: "Humano",
    bonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
    speed: 30,
    traits: ["Versátil: +1 a todas las características"],
    languages: "común y otro a tu elección",
  },
  {
    name: "Elfo",
    bonuses: { dex: 2 },
    speed: 30,
    skills: ["perception"],
    traits: [
      "Visión en la oscuridad 60 pies",
      "Sentidos agudos: competencia en Percepción",
      "Linaje feérico: ventaja contra ser hechizado; la magia no puede dormirte",
      "Trance: descansas 4 horas meditando",
      "Subrazas: alto elfo +1 INT (un truco de mago), elfo de los bosques +1 SAB (35 pies)",
    ],
    languages: "común y élfico",
  },
  {
    name: "Semielfo",
    bonuses: { cha: 2 },
    speed: 30,
    traits: [
      "+1 a otras dos características a tu elección",
      "Visión en la oscuridad 60 pies",
      "Linaje feérico: ventaja contra ser hechizado; la magia no puede dormirte",
      "Versatilidad: competencia en dos habilidades a tu elección",
    ],
    languages: "común, élfico y otro a tu elección",
  },
  {
    name: "Enano",
    bonuses: { con: 2 },
    speed: 25,
    traits: [
      "Visión en la oscuridad 60 pies",
      "Resistencia enana: ventaja y resistencia contra veneno",
      "Competencia con hachas y martillos de guerra",
      "Afinidad con la piedra: doble competencia en Historia sobre labra de piedra",
      "Subrazas: colinas +1 SAB (+1 PG por nivel), montañas +2 FUE (armaduras ligeras y medias)",
    ],
    languages: "común y enano",
  },
  {
    name: "Mediano",
    bonuses: { dex: 2 },
    speed: 25,
    traits: [
      "Suertudo: repite los 1 en ataques, pruebas y salvaciones",
      "Valiente: ventaja contra ser asustado",
      "Agilidad: atraviesas el espacio de criaturas mayores que tú",
      "Subrazas: piesligeros +1 CAR (esconderse tras criaturas), fornidos +1 CON (resistencia a veneno)",
    ],
    languages: "común y mediano",
  },
  {
    name: "Gnomo",
    bonuses: { int: 2 },
    speed: 25,
    traits: [
      "Visión en la oscuridad 60 pies",
      "Astucia gnoma: ventaja en salvaciones de INT, SAB y CAR contra magia",
      "Subrazas: bosque +1 DES (Ilusión menor), rocas +1 CON (cachivaches)",
    ],
    languages: "común y gnomo",
  },
  {
    name: "Semiorco",
    bonuses: { str: 2, con: 1 },
    speed: 30,
    skills: ["intimidation"],
    traits: [
      "Visión en la oscuridad 60 pies",
      "Amenazador: competencia en Intimidación",
      "Aguante implacable: al caer a 0 PG te quedas a 1, una vez por descanso largo",
      "Ataques salvajes: un dado de daño extra en tus críticos cuerpo a cuerpo",
    ],
    languages: "común y orco",
  },
  {
    name: "Dracónido",
    bonuses: { str: 2, cha: 1 },
    speed: 30,
    traits: [
      "Linaje dracónico: elige tu dragón (determina daño del aliento y resistencia)",
      "Arma de aliento: 2d6 en área (DES o CON CD 8+CON+comp., mitad si supera)",
      "Resistencia al tipo de daño de tu linaje",
    ],
    languages: "común y dracónico",
  },
  {
    name: "Tiefling",
    bonuses: { cha: 2, int: 1 },
    speed: 30,
    traits: [
      "Visión en la oscuridad 60 pies",
      "Resistencia infernal: resistencia al fuego",
      "Legado infernal: Taumaturgia; a nv 3 Reprensión infernal, a nv 5 Oscuridad (1/día)",
    ],
    languages: "común e infernal",
  },
  {
    name: "Aasimar",
    bonuses: { cha: 2, wis: 1 },
    speed: 30,
    traits: [
      "Visión en la oscuridad 60 pies",
      "Resistencia celestial: resistencia a daño necrótico y radiante",
      "Manos sanadoras: cura tu nivel en PG por contacto, 1/descanso largo",
      "Portador de luz: conoces el truco Luz",
    ],
    languages: "común y celestial",
  },
  {
    name: "Goliat",
    bonuses: { str: 2, con: 1 },
    speed: 30,
    skills: ["athletics"],
    traits: [
      "Atleta nato: competencia en Atletismo",
      "Resistencia de piedra: reacción para reducir el daño 1d12 + CON, 1/descanso",
      "Nacido en la montaña: aclimatado a gran altitud y frío",
      "Corpulento: cuentas como una talla más para carga",
    ],
    languages: "común y gigante",
  },
  {
    name: "Tabaxi",
    bonuses: { dex: 2, cha: 1 },
    speed: 30,
    skills: ["perception", "stealth"],
    traits: [
      "Visión en la oscuridad 60 pies",
      "Agilidad felina: duplica tu velocidad un turno (se recarga si no te mueves uno)",
      "Garras: 1d4 + FUE cortante; velocidad de trepar 20 pies",
      "Talento felino: competencia en Percepción y Sigilo",
    ],
    languages: "común y otro a tu elección",
  },
];

export const RACES: string[] = [...RACE_DETAILS.map((race) => race.name), "Otro"];

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

export interface BackgroundDef {
  name: string;
  /** Competencias de habilidad (ids de SKILLS). */
  skills: string[];
  /** Herramientas, idiomas y equipo destacables. */
  extras: string;
  /** Rasgo del trasfondo: nombre — resumen. */
  feature: string;
}

/** Trasfondos del Manual del Jugador con su mecánica aplicable. */
export const BACKGROUND_DETAILS: BackgroundDef[] = [
  {
    name: "Acólito",
    skills: ["insight", "religion"],
    extras: "dos idiomas a tu elección",
    feature: "Refugio de los fieles: los templos de tu fe te dan cobijo y ayuda",
  },
  {
    name: "Artesano Gremial",
    skills: ["insight", "persuasion"],
    extras: "herramientas de artesano y un idioma",
    feature: "Pertenencia al gremio: apoyo e influencia de tu gremio",
  },
  {
    name: "Charlatán",
    skills: ["deception", "sleight-of-hand"],
    extras: "kit de disfraz y kit de falsificación",
    feature: "Identidad falsa: una segunda identidad documentada",
  },
  {
    name: "Criminal",
    skills: ["deception", "stealth"],
    extras: "kit de ladrón y un juego de azar",
    feature: "Contacto criminal: enlace fiable con el hampa",
  },
  {
    name: "Artista",
    skills: ["acrobatics", "performance"],
    extras: "kit de disfraz y un instrumento musical",
    feature: "A petición del público: actúas a cambio de techo y comida",
  },
  {
    name: "Héroe del Pueblo",
    skills: ["animal-handling", "survival"],
    extras: "herramientas de artesano y vehículos terrestres",
    feature: "Hospitalidad rústica: la gente humilde te esconde y te ayuda",
  },
  {
    name: "Noble",
    skills: ["history", "persuasion"],
    extras: "un juego de azar y un idioma",
    feature: "Posición privilegiada: la alta sociedad te recibe",
  },
  {
    name: "Ermitaño",
    skills: ["medicine", "religion"],
    extras: "kit de herboristería y un idioma",
    feature: "Descubrimiento: conoces un secreto único y poderoso",
  },
  {
    name: "Forastero",
    skills: ["athletics", "survival"],
    extras: "un instrumento musical y un idioma",
    feature: "Errante: memoria excelente para mapas; encuentras comida para el grupo",
  },
  {
    name: "Marinero",
    skills: ["athletics", "perception"],
    extras: "herramientas de navegante y vehículos acuáticos",
    feature: "Pasaje de barco: viajas gratis por mar a cambio de trabajo",
  },
  {
    name: "Soldado",
    skills: ["athletics", "intimidation"],
    extras: "un juego de azar y vehículos terrestres",
    feature: "Rango militar: los soldados de tu antigua organización te reconocen",
  },
  {
    name: "Huérfano",
    skills: ["sleight-of-hand", "stealth"],
    extras: "kit de disfraz y kit de ladrón",
    feature: "Secretos de la ciudad: conoces los pasadizos urbanos; viajas al doble de rápido entre lugares de la ciudad",
  },
  {
    name: "Sabio",
    skills: ["arcana", "history"],
    extras: "dos idiomas a tu elección",
    feature: "Investigador: sabes dónde o a quién consultar lo que no conoces",
  },
];

export const BACKGROUNDS: string[] = [
  ...BACKGROUND_DETAILS.map((bg) => bg.name),
  "Otro",
];

/** PX acumulados necesarios para cada nivel (índice 0 = nivel 1). */
export const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000,
];

/** Nivel que corresponde a una cantidad de PX. */
export function levelForXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

/** PX necesarios para el siguiente nivel (null si ya es nivel 20). */
export function xpForNextLevel(level: number): number | null {
  return level >= 20 ? null : XP_THRESHOLDS[level];
}

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

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

/** Razas del SRD 5.1 con su mecánica aplicable. */
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
      "Subraza del SRD: alto elfo +1 INT (un truco de mago y un idioma extra)",
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
      "Subraza del SRD: enano de las colinas +1 SAB (+1 PG por nivel)",
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
      "Subraza del SRD: piesligeros +1 CAR (puedes esconderte tras criaturas mayores)",
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
      "Subraza del SRD: gnomo de las rocas +1 CON (saber artificiero y cachivaches)",
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

/** Trasfondos genéricos con mecánica aplicable (redacción propia). */
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
    feature: "Hermandad del oficio: los talleres y gremios de tu ramo te abren las puertas",
  },
  {
    name: "Charlatán",
    skills: ["deception", "sleight-of-hand"],
    extras: "kit de disfraz y kit de falsificación",
    feature: "Segunda piel: vives bajo un nombre que no es el tuyo, con papeles que lo demuestran",
  },
  {
    name: "Criminal",
    skills: ["deception", "stealth"],
    extras: "kit de ladrón y un juego de azar",
    feature: "Susurros del hampa: siempre hay alguien del mal vivir que te debe un favor",
  },
  {
    name: "Artista",
    skills: ["acrobatics", "performance"],
    extras: "kit de disfraz y un instrumento musical",
    feature: "Función asegurada: allí donde actúas te ganas cama, cena y aplausos",
  },
  {
    name: "Héroe del Pueblo",
    skills: ["animal-handling", "survival"],
    extras: "herramientas de artesano y vehículos terrestres",
    feature: "De los nuestros: la gente sencilla te esconde, te alimenta y no te delata",
  },
  {
    name: "Noble",
    skills: ["history", "persuasion"],
    extras: "un juego de azar y un idioma",
    feature: "Sangre reconocida: los salones y las audiencias se abren a tu apellido",
  },
  {
    name: "Ermitaño",
    skills: ["medicine", "religion"],
    extras: "kit de herboristería y un idioma",
    feature: "Revelación: tu retiro te dejó un secreto único que aún guarda su poder",
  },
  {
    name: "Forastero",
    skills: ["athletics", "survival"],
    extras: "un instrumento musical y un idioma",
    feature: "Memoria del territorio: recuerdas rutas y terrenos, y encuentras sustento para el grupo",
  },
  {
    name: "Marinero",
    skills: ["athletics", "perception"],
    extras: "herramientas de navegante y vehículos acuáticos",
    feature: "Brazos a bordo: pasaje gratis por mar a cambio de echar una mano",
  },
  {
    name: "Soldado",
    skills: ["athletics", "intimidation"],
    extras: "un juego de azar y vehículos terrestres",
    feature: "Voz de mando: los veteranos reconocen tu graduación y te escuchan",
  },
  {
    name: "Huérfano",
    skills: ["sleight-of-hand", "stealth"],
    extras: "kit de disfraz y kit de ladrón",
    feature: "Callejones sin nombre: cruzas la ciudad el doble de rápido por atajos que solo tú ves",
  },
  {
    name: "Sabio",
    skills: ["arcana", "history"],
    extras: "dos idiomas a tu elección",
    feature: "Saber dónde buscar: si no conoces la respuesta, sabes quién la conoce o dónde está escrita",
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

export interface GearDef {
  name: string;
  /** Peso en libras por unidad. */
  weight: number;
}

/** Equipo de aventurero habitual (SRD), para autocompletar el inventario. */
export const GEAR: GearDef[] = [
  { name: "Mochila", weight: 5 },
  { name: "Saco de dormir", weight: 7 },
  { name: "Raciones (1 día)", weight: 2 },
  { name: "Odre de agua", weight: 5 },
  { name: "Cuerda de cáñamo (50 pies)", weight: 10 },
  { name: "Antorcha", weight: 1 },
  { name: "Yesquero", weight: 1 },
  { name: "Lámpara", weight: 1 },
  { name: "Aceite (frasco)", weight: 1 },
  { name: "Ganzúas", weight: 1 },
  { name: "Kit de ladrón", weight: 1 },
  { name: "Kit de curación", weight: 3 },
  { name: "Poción de curación", weight: 0.5 },
  { name: "Palanca", weight: 5 },
  { name: "Martillo", weight: 3 },
  { name: "Pitón", weight: 0.25 },
  { name: "Espejo de acero", weight: 0.5 },
  { name: "Caltrops (bolsa)", weight: 2 },
  { name: "Daga", weight: 1 },
  { name: "Espada corta", weight: 2 },
  { name: "Espada larga", weight: 3 },
  { name: "Gran hacha", weight: 7 },
  { name: "Maza", weight: 4 },
  { name: "Bastón", weight: 4 },
  { name: "Arco corto", weight: 2 },
  { name: "Arco largo", weight: 2 },
  { name: "Ballesta ligera", weight: 5 },
  { name: "Carcaj con 20 flechas", weight: 1 },
  { name: "Escudo", weight: 6 },
  { name: "Armadura de cuero", weight: 10 },
  { name: "Armadura de cuero tachonado", weight: 13 },
  { name: "Camisote de malla", weight: 20 },
  { name: "Cota de malla", weight: 55 },
  { name: "Símbolo sagrado", weight: 1 },
  { name: "Bolsa de componentes", weight: 2 },
  { name: "Foco arcano", weight: 1 },
  { name: "Libro de conjuros", weight: 3 },
  { name: "Tienda de campaña (2 personas)", weight: 20 },
];

/** Peso conocido de un objeto del equipo estándar. */
export function gearWeight(name: string): number | undefined {
  const normalized = name.trim().toLowerCase();
  return GEAR.find((item) => item.name.toLowerCase() === normalized)?.weight;
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

/** Panteón propio de Grimorio: deidades originales con dominios jugables. */
export const DEITIES: DeityDef[] = [
  { name: "Aurion", title: "señor del alba eterna", domains: "Vida, Luz" },
  { name: "Nocturna", title: "guardiana de los secretos", domains: "Engaño" },
  { name: "Ferrum", title: "el forjador del mundo", domains: "Conocimiento, Guerra" },
  { name: "Silvara", title: "madre del bosque antiguo", domains: "Naturaleza, Vida" },
  { name: "Vendaval", title: "rey de las tormentas", domains: "Tempestad" },
  { name: "La Segadora Gris", title: "que guía a los muertos", domains: "Muerte" },
  { name: "Lúmina", title: "la llama de los juramentos", domains: "Luz, Guerra" },
  { name: "Fortuna", title: "la moneda en el aire", domains: "Engaño, Vida" },
  { name: "El Peregrino", title: "andar de los mil caminos", domains: "Conocimiento, Naturaleza" },
  { name: "Marea", title: "señora de los mares sin fondo", domains: "Tempestad" },
  { name: "Espiga", title: "madre del grano y la mesa", domains: "Vida, Naturaleza" },
  { name: "El Centinela", title: "el ojo que no duerme", domains: "Conocimiento, Guerra" },
  { name: "Cruor", title: "dios de la batalla sin fin", domains: "Guerra" },
  { name: "La Tejedora", title: "hilandera de la magia", domains: "Conocimiento" },
  { name: "Ceniza", title: "señor del fuego y la fragua", domains: "Guerra, Tempestad" },
  { name: "Alba y Ocaso", title: "las hermanas gemelas del tiempo", domains: "Vida, Muerte" },
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

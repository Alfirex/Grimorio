import type { Attack } from "@/types";

/**
 * Bestiario básico inspirado en el SRD de D&D 5e.
 * `loot` es una expresión de dados de monedas de oro que suelta al morir.
 */
export interface MonsterDef {
  name: string;
  hp: number;
  ac: number;
  speed: number; // pies
  attacks: Attack[];
  abilities: string[]; // hechizos, trucos y rasgos, como referencia para el máster
  loot: string;
  image: string; // ilustración del SRD (dnd5eapi.co)
  emoji: string; // respaldo si la imagen no carga
}

const img = (slug: string) =>
  `https://www.dnd5eapi.co/api/images/monsters/${slug}.png`;

const atk = (id: string, name: string, bonus: string, damage: string, type: string): Attack => ({
  id,
  name,
  bonus,
  damage,
  type,
});

export const BESTIARY: MonsterDef[] = [
  {
    name: "Kobold",
    hp: 5,
    ac: 12,
    speed: 30,
    attacks: [
      atk("k1", "Daga", "+4", "1d4+2", "Perforante"),
      atk("k2", "Honda", "+4", "1d4+2", "Contundente"),
    ],
    abilities: ["Tácticas de manada: ventaja si un aliado está a 5 pies del objetivo", "Sensibilidad a la luz solar"],
    loot: "1d4",
    image: img("kobold"),
    emoji: "🦎",
  },
  {
    name: "Goblin",
    hp: 7,
    ac: 15,
    speed: 30,
    attacks: [
      atk("g1", "Cimitarra", "+4", "1d6+2", "Cortante"),
      atk("g2", "Arco corto", "+4", "1d6+2", "Perforante"),
    ],
    abilities: ["Escapada ágil: puede Retirarse o Esconderse como acción adicional"],
    loot: "1d6",
    image: img("goblin"),
    emoji: "👺",
  },
  {
    name: "Bandido",
    hp: 11,
    ac: 12,
    speed: 30,
    attacks: [
      atk("b1", "Cimitarra", "+3", "1d6+1", "Cortante"),
      atk("b2", "Ballesta ligera", "+3", "1d8+1", "Perforante"),
    ],
    abilities: [],
    loot: "2d6",
    image: img("bandit"),
    emoji: "🗡️",
  },
  {
    name: "Cultista",
    hp: 9,
    ac: 12,
    speed: 30,
    attacks: [atk("c1", "Cimitarra", "+3", "1d6+1", "Cortante")],
    abilities: ["Devoción oscura: ventaja contra ser hechizado o asustado"],
    loot: "1d6",
    image: img("cultist"),
    emoji: "🕯️",
  },
  {
    name: "Esqueleto",
    hp: 13,
    ac: 13,
    speed: 30,
    attacks: [
      atk("e1", "Espada corta", "+4", "1d6+2", "Perforante"),
      atk("e2", "Arco corto", "+4", "1d6+2", "Perforante"),
    ],
    abilities: ["Vulnerable a daño contundente", "Inmune a veneno"],
    loot: "1d4",
    image: img("skeleton"),
    emoji: "💀",
  },
  {
    name: "Zombi",
    hp: 22,
    ac: 8,
    speed: 20,
    attacks: [atk("z1", "Golpe", "+3", "1d6+1", "Contundente")],
    abilities: ["Fortaleza no muerta: al llegar a 0 PG, con CON CD 5+daño se queda a 1 PG (salvo radiante o crítico)"],
    loot: "1d4",
    image: img("zombie"),
    emoji: "🧟",
  },
  {
    name: "Lobo",
    hp: 11,
    ac: 13,
    speed: 40,
    attacks: [atk("l1", "Mordisco", "+4", "2d4+2", "Perforante")],
    abilities: ["Si impacta, el objetivo hace salvación de FUE CD 11 o cae derribado", "Tácticas de manada"],
    loot: "0",
    image: img("wolf"),
    emoji: "🐺",
  },
  {
    name: "Aprendiz de mago",
    hp: 9,
    ac: 12,
    speed: 30,
    attacks: [
      atk("m1", "Rayo de escarcha (truco)", "+5", "1d8", "Frío"),
      atk("m2", "Proyectil mágico (3 dardos)", "+99", "3d4+3", "Fuerza"),
      atk("m3", "Daga", "+2", "1d4", "Perforante"),
    ],
    abilities: [
      "Truco: Rayo de escarcha — reduce 10 pies la velocidad del objetivo",
      "Nv1: Proyectil mágico — impacta siempre (el +99 lo refleja)",
      "Nv1: Escudo — reacción, +5 a la CA hasta su turno",
      "Nv1: Armadura de mago — CA 15 si la lanza antes del combate",
    ],
    loot: "2d6",
    image: img("mage"),
    emoji: "🧙",
  },
  {
    name: "Chamán goblin",
    hp: 14,
    ac: 13,
    speed: 30,
    attacks: [
      atk("s1", "Descarga sobrenatural (truco)", "+4", "1d10", "Fuerza"),
      atk("s2", "Bastón", "+2", "1d6", "Contundente"),
    ],
    abilities: [
      "Truco: Descarga sobrenatural",
      "Nv1: Maleficio — +1d6 necrótico a sus ataques contra el objetivo marcado",
      "Nv1: Curar heridas — 1d8+3 PG a un aliado (2 usos)",
    ],
    loot: "2d6",
    image: img("goblin"),
    emoji: "🔮",
  },
  {
    name: "Osgo",
    hp: 27,
    ac: 16,
    speed: 30,
    attacks: [
      atk("o1", "Maza estrella", "+4", "2d8+2", "Perforante"),
      atk("o2", "Jabalina", "+4", "2d6+2", "Perforante"),
    ],
    abilities: ["Ataque sorpresa: +2d6 de daño si el objetivo está sorprendido", "Sigiloso"],
    loot: "2d6",
    image: img("bugbear"),
    emoji: "👹",
  },
  {
    name: "Araña gigante",
    hp: 26,
    ac: 14,
    speed: 30,
    attacks: [atk("a1", "Mordisco venenoso", "+5", "1d8+3", "Perforante + veneno (2d8, CON CD 11 mitad)")],
    abilities: ["Telaraña (recarga 5-6): apresa al objetivo, FUE CD 12 para liberarse", "Trepar por muros y techos"],
    loot: "0",
    image: img("giant-spider"),
    emoji: "🕷️",
  },
  {
    name: "Espectro",
    hp: 22,
    ac: 12,
    speed: 50,
    attacks: [atk("sp1", "Drenar vida", "+4", "3d6", "Necrótico (CON CD 10 o el máximo de PG baja lo mismo)")],
    abilities: ["Incorpóreo: atraviesa criaturas y objetos", "Sensible a la luz solar", "Resistente a daño no mágico"],
    loot: "0",
    image: img("specter"),
    emoji: "👻",
  },
  {
    name: "Ogro",
    hp: 59,
    ac: 11,
    speed: 40,
    attacks: [
      atk("og1", "Garrote", "+6", "2d8+4", "Contundente"),
      atk("og2", "Jabalina", "+6", "2d6+4", "Perforante"),
    ],
    abilities: [],
    loot: "3d6",
    image: img("ogre"),
    emoji: "🧌",
  },
  {
    name: "Jefe hobgoblin",
    hp: 39,
    ac: 17,
    speed: 30,
    attacks: [
      atk("h1", "Espada larga", "+5", "1d10+3", "Cortante"),
      atk("h2", "Jabalina", "+5", "1d6+3", "Perforante"),
    ],
    abilities: ["Ventaja marcial: +2d6 de daño una vez por turno si un aliado está a 5 pies del objetivo", "Liderazgo"],
    loot: "4d6",
    image: img("hobgoblin"),
    emoji: "⚔️",
  },
];

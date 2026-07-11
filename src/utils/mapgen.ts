export type Cell = "wall" | "floor" | "door" | "corridor";

/** Estilo de las salas: clásicas, redondeadas, poligonales o una mezcla. */
export type RoomShapeMode = "rect" | "round" | "poly" | "mixed";

export interface Room {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DungeonMap {
  width: number;
  height: number;
  grid: Cell[][];
  rooms: Room[];
  seed: number;
}

export interface DungeonOptions {
  width: number;
  height: number;
  roomAttempts: number;
  minRoomSize: number;
  maxRoomSize: number;
  seed?: number;
  /**
   * Forma de las salas. "rect" (por defecto) mantiene la generación clásica
   * y reproduce exactamente los mapas antiguos con la misma semilla.
   */
  roomShapes?: RoomShapeMode;
}

/** PRNG determinista (mulberry32) para poder regenerar el mismo mapa con una semilla. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function roomsOverlap(a: Room, b: Room, padding = 1): boolean {
  return (
    a.x - padding < b.x + b.w + padding &&
    a.x + a.w + padding > b.x - padding &&
    a.y - padding < b.y + b.h + padding &&
    a.y + a.h + padding > b.y - padding
  );
}

function carveRoom(grid: Cell[][], room: Room): void {
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      grid[y][x] = "floor";
    }
  }
}

/** Sala elíptica inscrita en su caja: círculos y óvalos. */
function carveEllipse(grid: Cell[][], room: Room): void {
  const cx = room.x + (room.w - 1) / 2;
  const cy = room.y + (room.h - 1) / 2;
  const rx = (room.w - 1) / 2 + 0.45;
  const ry = (room.h - 1) / 2 + 0.45;
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      if (nx * nx + ny * ny <= 1) grid[y][x] = "floor";
    }
  }
}

/** ¿Está el punto dentro del polígono? (ray casting). */
function pointInPolygon(px: number, py: number, vertices: Array<[number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [xi, yi] = vertices[i];
    const [xj, yj] = vertices[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Sala poligonal regular (pentágonos, hexágonos, octógonos) con giro aleatorio. */
function carvePolygon(grid: Cell[][], room: Room, sides: number, rotation: number): void {
  const cx = room.x + (room.w - 1) / 2;
  const cy = room.y + (room.h - 1) / 2;
  const rx = (room.w - 1) / 2 + 0.6;
  const ry = (room.h - 1) / 2 + 0.6;
  const vertices: Array<[number, number]> = Array.from({ length: sides }, (_, i) => {
    const angle = rotation + (i * 2 * Math.PI) / sides;
    return [cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)];
  });
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      if (pointInPolygon(x, y, vertices)) grid[y][x] = "floor";
    }
  }
  // El centro siempre queda tallado: es el ancla de los pasillos
  grid[Math.round(cy)][Math.round(cx)] = "floor";
}

/**
 * Talla la sala según el modo elegido. Solo consume aleatoriedad cuando el
 * modo no es "rect", para no alterar los mapas antiguos con la misma semilla.
 */
function carveShapedRoom(
  grid: Cell[][],
  room: Room,
  mode: RoomShapeMode,
  rand: () => number
): void {
  if (mode === "rect") {
    carveRoom(grid, room);
    return;
  }
  const roll = rand();
  const sidesRoll = rand();
  const rotationRoll = rand();

  let shape: "rect" | "ellipse" | "polygon";
  if (mode === "round") shape = "ellipse";
  else if (mode === "poly") shape = "polygon";
  else shape = roll < 0.34 ? "rect" : roll < 0.67 ? "ellipse" : "polygon";

  // Las formas necesitan sitio para leerse: las salas pequeñas se redondean
  if (shape === "polygon" && Math.min(room.w, room.h) < 6) shape = "ellipse";
  if (shape === "ellipse" && Math.min(room.w, room.h) < 4) shape = "rect";

  if (shape === "rect") {
    carveRoom(grid, room);
  } else if (shape === "ellipse") {
    carveEllipse(grid, room);
  } else {
    const sides = [5, 5, 6, 8][Math.floor(sidesRoll * 4)];
    carvePolygon(grid, room, sides, rotationRoll * Math.PI * 2);
  }
}

function carveCorridor(grid: Cell[][], from: Room, to: Room, rand: () => number): void {
  const x1 = Math.floor(from.x + from.w / 2);
  const y1 = Math.floor(from.y + from.h / 2);
  const x2 = Math.floor(to.x + to.w / 2);
  const y2 = Math.floor(to.y + to.h / 2);

  const carve = (x: number, y: number) => {
    if (grid[y]?.[x] === "wall") grid[y][x] = "corridor";
  };

  // Pasillo en L: primero horizontal o vertical al azar
  if (rand() < 0.5) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) carve(x, y1);
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) carve(x2, y);
  } else {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) carve(x1, y);
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) carve(x, y2);
  }
}

/** Marca como puerta las celdas de pasillo adyacentes a una sala. */
function placeDoors(grid: Cell[][], width: number, height: number): void {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (grid[y][x] !== "corridor") continue;
      const neighbors = [grid[y - 1][x], grid[y + 1][x], grid[y][x - 1], grid[y][x + 1]];
      if (neighbors.includes("floor")) grid[y][x] = "door";
    }
  }
}

export function generateDungeon(options: DungeonOptions): DungeonMap {
  const { width, height, roomAttempts, minRoomSize, maxRoomSize } = options;
  const shapeMode = options.roomShapes ?? "rect";
  const seed = options.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rand = mulberry32(seed);

  const grid: Cell[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, (): Cell => "wall")
  );

  const rooms: Room[] = [];
  for (let i = 0; i < roomAttempts; i++) {
    const w = minRoomSize + Math.floor(rand() * (maxRoomSize - minRoomSize + 1));
    const h = minRoomSize + Math.floor(rand() * (maxRoomSize - minRoomSize + 1));
    const x = 1 + Math.floor(rand() * (width - w - 2));
    const y = 1 + Math.floor(rand() * (height - h - 2));
    const candidate: Room = { x, y, w, h };
    if (!rooms.some((r) => roomsOverlap(r, candidate))) {
      rooms.push(candidate);
      carveShapedRoom(grid, candidate, shapeMode, rand);
    }
  }

  // Conecta cada sala con la siguiente para garantizar que todo es alcanzable
  for (let i = 1; i < rooms.length; i++) {
    carveCorridor(grid, rooms[i - 1], rooms[i], rand);
  }
  // Alguna conexión extra para crear bucles
  if (rooms.length > 3) {
    carveCorridor(grid, rooms[0], rooms[Math.floor(rand() * rooms.length)], rand);
  }

  placeDoors(grid, width, height);

  return { width, height, grid, rooms, seed };
}

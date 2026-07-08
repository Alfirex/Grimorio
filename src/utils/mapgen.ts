export type Cell = "wall" | "floor" | "door" | "corridor";

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
      carveRoom(grid, candidate);
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

export type Cell = "wall" | "floor" | "door" | "corridor";

/** Estilo de las salas: clásicas, redondeadas, poligonales, cavernas o mezcla. */
export type RoomShapeMode = "rect" | "round" | "poly" | "cave" | "mixed";

/** Trazado de los pasillos: en L, serpenteantes o de dos casillas de ancho. */
export type CorridorStyle = "straight" | "winding" | "wide";

/** Cuántas conexiones extra entre salas: árbol, alguna o laberinto con bucles. */
export type LoopMode = "none" | "some" | "many";

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
  /** Trazado de pasillos; "straight" (por defecto) es el clásico en L. */
  corridorStyle?: CorridorStyle;
  /** Conexiones extra entre salas; "some" (por defecto) es el clásico. */
  loops?: LoopMode;
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

/** Sala en cruz: dos bandas superpuestas, como una capilla o cámara ritual. */
function carveCross(grid: Cell[][], room: Room): void {
  const armW = Math.max(2, Math.round(room.w / 3));
  const armH = Math.max(2, Math.round(room.h / 3));
  const x0 = room.x + Math.floor((room.w - armW) / 2);
  const y0 = room.y + Math.floor((room.h - armH) / 2);
  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      const inVertical = x >= x0 && x < x0 + armW;
      const inHorizontal = y >= y0 && y < y0 + armH;
      if (inVertical || inHorizontal) grid[y][x] = "floor";
    }
  }
}

/** Caverna orgánica: paseo aleatorio desde el centro que va abriendo hueco. */
function carveBlob(grid: Cell[][], room: Room, rand: () => number): void {
  const cx = Math.round(room.x + (room.w - 1) / 2);
  const cy = Math.round(room.y + (room.h - 1) / 2);
  let x = cx;
  let y = cy;
  const steps = Math.max(20, Math.floor(room.w * room.h * 0.9));
  for (let i = 0; i < steps; i++) {
    // Abre un pincel de 2×2 para que la cueva no quede filiforme
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
      const px = x + dx;
      const py = y + dy;
      if (px >= room.x && px < room.x + room.w && py >= room.y && py < room.y + room.h) {
        grid[py][px] = "floor";
      }
    }
    const dir = Math.floor(rand() * 4);
    if (dir === 0) x++;
    else if (dir === 1) x--;
    else if (dir === 2) y++;
    else y--;
    // El paseo no sale de la caja; si toca el borde, vuelve hacia el centro
    x = Math.min(room.x + room.w - 2, Math.max(room.x, x));
    y = Math.min(room.y + room.h - 2, Math.max(room.y, y));
  }
  grid[cy][cx] = "floor";
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

  type Shape = "rect" | "ellipse" | "polygon" | "diamond" | "cross" | "blob";
  let shape: Shape;
  if (mode === "round") shape = "ellipse";
  else if (mode === "poly") shape = "polygon";
  else if (mode === "cave") shape = "blob";
  else {
    // Mezcla: en un mismo mapa conviven cuadradas, circulares, rombos, cruces…
    shape =
      roll < 0.24
        ? "rect"
        : roll < 0.46
          ? "ellipse"
          : roll < 0.64
            ? "polygon"
            : roll < 0.78
              ? "diamond"
              : roll < 0.9
                ? "cross"
                : "blob";
  }

  // Las formas necesitan sitio para leerse: las salas pequeñas se simplifican
  const minSide = Math.min(room.w, room.h);
  if ((shape === "polygon" || shape === "cross" || shape === "blob") && minSide < 6) {
    shape = "ellipse";
  }
  if ((shape === "ellipse" || shape === "diamond") && minSide < 4) shape = "rect";

  switch (shape) {
    case "rect":
      carveRoom(grid, room);
      break;
    case "ellipse":
      carveEllipse(grid, room);
      break;
    case "diamond":
      // Rombo: cuadrado girado 45° con una ligera variación de giro
      carvePolygon(grid, room, 4, Math.PI / 2 + (rotationRoll - 0.5) * 0.3);
      break;
    case "cross":
      carveCross(grid, room);
      break;
    case "blob":
      carveBlob(grid, room, rand);
      break;
    default: {
      const sides = [5, 5, 6, 8][Math.floor(sidesRoll * 4)];
      carvePolygon(grid, room, sides, rotationRoll * Math.PI * 2);
    }
  }
}

function carveCorridor(
  grid: Cell[][],
  from: Room,
  to: Room,
  rand: () => number,
  style: CorridorStyle = "straight"
): void {
  const x1 = Math.floor(from.x + from.w / 2);
  const y1 = Math.floor(from.y + from.h / 2);
  const x2 = Math.floor(to.x + to.w / 2);
  const y2 = Math.floor(to.y + to.h / 2);
  const height = grid.length;
  const width = grid[0].length;

  const carve = (x: number, y: number) => {
    if (grid[y]?.[x] === "wall") grid[y][x] = "corridor";
  };
  // Los pasillos anchos abren una casilla paralela extra
  const carveWide = (x: number, y: number, horizontal: boolean) => {
    carve(x, y);
    if (style === "wide") {
      if (horizontal && y + 1 < height - 1) carve(x, y + 1);
      if (!horizontal && x + 1 < width - 1) carve(x + 1, y);
    }
  };

  if (style === "winding") {
    // Paseo sesgado hacia el destino con desvíos ocasionales
    let x = x1;
    let y = y1;
    carve(x, y);
    let guard = (Math.abs(x2 - x1) + Math.abs(y2 - y1)) * 8 + 40;
    while ((x !== x2 || y !== y2) && guard-- > 0) {
      if (rand() < 0.22) {
        // Desvío lateral, sin salirse del borde amurallado
        if (rand() < 0.5) x = Math.min(width - 2, Math.max(1, x + (rand() < 0.5 ? 1 : -1)));
        else y = Math.min(height - 2, Math.max(1, y + (rand() < 0.5 ? 1 : -1)));
      } else if (x !== x2 && (y === y2 || rand() < 0.5)) {
        x += x2 > x ? 1 : -1;
      } else if (y !== y2) {
        y += y2 > y ? 1 : -1;
      }
      carve(x, y);
    }
    // Si el desvío agotó la guarda, remata en L hasta el destino
    for (let px = Math.min(x, x2); px <= Math.max(x, x2); px++) carve(px, y);
    for (let py = Math.min(y, y2); py <= Math.max(y, y2); py++) carve(x2, py);
    return;
  }

  // Pasillo en L: primero horizontal o vertical al azar
  if (rand() < 0.5) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) carveWide(x, y1, true);
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) carveWide(x2, y, false);
  } else {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) carveWide(x1, y, false);
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) carveWide(x, y2, true);
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

  const corridorStyle = options.corridorStyle ?? "straight";
  const loops = options.loops ?? "some";

  // Conecta cada sala con la siguiente para garantizar que todo es alcanzable
  for (let i = 1; i < rooms.length; i++) {
    carveCorridor(grid, rooms[i - 1], rooms[i], rand, corridorStyle);
  }
  // Conexiones extra para crear bucles: ninguna, la clásica o laberínticas
  if (loops === "some" && rooms.length > 3) {
    carveCorridor(grid, rooms[0], rooms[Math.floor(rand() * rooms.length)], rand, corridorStyle);
  } else if (loops === "many" && rooms.length > 2) {
    const extra = Math.max(1, Math.floor(rooms.length / 3));
    for (let i = 0; i < extra; i++) {
      const a = rooms[Math.floor(rand() * rooms.length)];
      const b = rooms[Math.floor(rand() * rooms.length)];
      if (a !== b) carveCorridor(grid, a, b, rand, corridorStyle);
    }
  }

  placeDoors(grid, width, height);

  return { width, height, grid, rooms, seed };
}

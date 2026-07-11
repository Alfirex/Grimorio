import { describe, expect, it } from "vitest";
import { generateDungeon, type DungeonMap } from "@/utils/mapgen";

const OPTIONS = {
  width: 60,
  height: 40,
  roomAttempts: 18,
  minRoomSize: 4,
  maxRoomSize: 10,
  seed: 1420,
};

/** Todas las celdas transitables deben formar un único componente conexo. */
function walkableIsConnected(map: DungeonMap): boolean {
  const walkable = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < map.width &&
    y < map.height &&
    map.grid[y][x] !== "wall" &&
    map.grid[y][x] !== "water";

  let start: [number, number] | null = null;
  let total = 0;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (walkable(x, y)) {
        total++;
        if (!start) start = [x, y];
      }
    }
  }
  if (!start) return false;

  const visited = new Set<string>([start.join(",")]);
  const queue = [start];
  while (queue.length > 0) {
    const [x, y] = queue.pop()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = x + dx;
      const ny = y + dy;
      const key = `${nx},${ny}`;
      if (walkable(nx, ny) && !visited.has(key)) {
        visited.add(key);
        queue.push([nx, ny]);
      }
    }
  }
  return visited.size === total;
}

describe("generateDungeon", () => {
  it("es determinista: misma semilla, mismo mapa", () => {
    const a = generateDungeon(OPTIONS);
    const b = generateDungeon(OPTIONS);
    expect(a.grid).toEqual(b.grid);
    expect(a.rooms).toEqual(b.rooms);
    expect(a.seed).toBe(1420);
  });

  it("cambia con otra semilla", () => {
    const a = generateDungeon(OPTIONS);
    const b = generateDungeon({ ...OPTIONS, seed: 7 });
    expect(a.grid).not.toEqual(b.grid);
  });

  it("respeta dimensiones y mantiene el borde amurallado", () => {
    const map = generateDungeon(OPTIONS);
    expect(map.grid).toHaveLength(OPTIONS.height);
    for (const row of map.grid) expect(row).toHaveLength(OPTIONS.width);
    for (let x = 0; x < map.width; x++) {
      expect(map.grid[0][x]).toBe("wall");
      expect(map.grid[map.height - 1][x]).toBe("wall");
    }
    for (let y = 0; y < map.height; y++) {
      expect(map.grid[y][0]).toBe("wall");
      expect(map.grid[y][map.width - 1]).toBe("wall");
    }
  });

  it("las salas quedan dentro del mapa, sin solaparse y talladas como suelo", () => {
    const map = generateDungeon(OPTIONS);
    expect(map.rooms.length).toBeGreaterThan(1);
    for (const room of map.rooms) {
      expect(room.x).toBeGreaterThan(0);
      expect(room.y).toBeGreaterThan(0);
      expect(room.x + room.w).toBeLessThan(map.width);
      expect(room.y + room.h).toBeLessThan(map.height);
      for (let y = room.y; y < room.y + room.h; y++) {
        for (let x = room.x; x < room.x + room.w; x++) {
          expect(map.grid[y][x]).toBe("floor");
        }
      }
    }
  });

  it("todo lo transitable está conectado (varias semillas)", () => {
    for (const seed of [1, 42, 1420, 99999, 2 ** 30]) {
      expect(walkableIsConnected(generateDungeon({ ...OPTIONS, seed }))).toBe(true);
    }
  });

  it("las formas de sala son deterministas y todo queda conectado", () => {
    for (const roomShapes of ["mixed", "round", "poly"] as const) {
      const a = generateDungeon({ ...OPTIONS, roomShapes });
      const b = generateDungeon({ ...OPTIONS, roomShapes });
      expect(a.grid, roomShapes).toEqual(b.grid);
      expect(walkableIsConnected(a), roomShapes).toBe(true);
      // El centro de cada sala está tallado: es el ancla de los pasillos
      for (const room of a.rooms) {
        const cx = Math.round(room.x + (room.w - 1) / 2);
        const cy = Math.round(room.y + (room.h - 1) / 2);
        expect(a.grid[cy][cx], `${roomShapes} centro`).not.toBe("wall");
      }
    }
  });

  it("los valores por defecto reproducen exactamente la generación clásica", () => {
    const classic = generateDungeon(OPTIONS);
    const explicit = generateDungeon({
      ...OPTIONS,
      roomShapes: "rect",
      corridorStyle: "straight",
      loops: "some",
    });
    expect(explicit.grid).toEqual(classic.grid);
    expect(explicit.rooms).toEqual(classic.rooms);
  });

  it("pasillos y bucles alternativos mantienen la conectividad", () => {
    for (const corridorStyle of ["winding", "wide"] as const) {
      for (const loops of ["none", "some", "many"] as const) {
        for (const seed of [7, 1420]) {
          const map = generateDungeon({
            ...OPTIONS,
            seed,
            roomShapes: "mixed",
            corridorStyle,
            loops,
          });
          expect(
            walkableIsConnected(map),
            `${corridorStyle}/${loops}/semilla ${seed}`
          ).toBe(true);
        }
      }
    }
  });

  it("las cavernas orgánicas quedan conectadas y son deterministas", () => {
    const a = generateDungeon({ ...OPTIONS, roomShapes: "cave", corridorStyle: "winding" });
    const b = generateDungeon({ ...OPTIONS, roomShapes: "cave", corridorStyle: "winding" });
    expect(a.grid).toEqual(b.grid);
    expect(walkableIsConnected(a)).toBe(true);
  });

  it("admite una sala única", () => {
    for (const roomShapes of ["rect", "round", "poly"] as const) {
      const map = generateDungeon({ ...OPTIONS, roomAttempts: 1, roomShapes });
      expect(map.rooms, roomShapes).toHaveLength(1);
      expect(walkableIsConnected(map), roomShapes).toBe(true);
    }
  });

  it("ríos y lagos generan agua sin romper la conectividad", () => {
    for (const water of ["river", "lake", "both"] as const) {
      for (const seed of [7, 1420, 99]) {
        const map = generateDungeon({ ...OPTIONS, seed, roomShapes: "mixed", water });
        const hasWater = map.grid.some((row) => row.includes("water"));
        expect(hasWater, `${water}/semilla ${seed}`).toBe(true);
        expect(walkableIsConnected(map), `${water}/semilla ${seed}`).toBe(true);
      }
    }
  });

  it("las columnas aparecen dentro de salas grandes y no cortan el paso", () => {
    const withPillars = generateDungeon({
      ...OPTIONS,
      minRoomSize: 8,
      maxRoomSize: 14,
      pillars: true,
    });
    const without = generateDungeon({ ...OPTIONS, minRoomSize: 8, maxRoomSize: 14 });
    let pillarCells = 0;
    for (const room of withPillars.rooms) {
      for (let y = room.y; y < room.y + room.h; y++) {
        for (let x = room.x; x < room.x + room.w; x++) {
          if (withPillars.grid[y][x] === "wall" && without.grid[y][x] === "floor") {
            pillarCells++;
          }
        }
      }
    }
    expect(pillarCells).toBeGreaterThan(0);
    expect(walkableIsConnected(withPillars)).toBe(true);
  });

  it("las puertas separan pasillos de salas", () => {
    const map = generateDungeon(OPTIONS);
    for (let y = 1; y < map.height - 1; y++) {
      for (let x = 1; x < map.width - 1; x++) {
        if (map.grid[y][x] !== "door") continue;
        const neighbors = [
          map.grid[y - 1][x],
          map.grid[y + 1][x],
          map.grid[y][x - 1],
          map.grid[y][x + 1],
        ];
        expect(neighbors).toContain("floor");
      }
    }
  });
});

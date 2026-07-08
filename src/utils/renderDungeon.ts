import type { DungeonMap } from "@/utils/mapgen";

interface ThemePalette {
  background: string;
  wall: string;
  wallEdge: string;
  floor: string;
  floorAlt: string;
  corridor: string;
  door: string;
  grid: string;
  roomNumber: string;
}

export interface DungeonTheme {
  label: string;
  colors: ThemePalette;
}

/** Ambientaciones del tablero: misma mazmorra, distinta atmósfera. */
export const THEMES: Record<string, DungeonTheme> = {
  mazmorra: {
    label: "Mazmorra",
    colors: {
      background: "#16120d",
      wall: "#241c12",
      wallEdge: "#3d2f1d",
      floor: "#d8c9a3",
      floorAlt: "#cfc096",
      corridor: "#bfae86",
      door: "#c9a227",
      grid: "rgba(60, 45, 25, 0.25)",
      roomNumber: "#5a4a2f",
    },
  },
  cueva: {
    label: "Cueva",
    colors: {
      background: "#0d0d10",
      wall: "#1c1a20",
      wallEdge: "#3a3542",
      floor: "#8a8177",
      floorAlt: "#7d746a",
      corridor: "#6e665e",
      door: "#a67c3d",
      grid: "rgba(30, 28, 35, 0.3)",
      roomNumber: "#3c362e",
    },
  },
  castillo: {
    label: "Castillo",
    colors: {
      background: "#101318",
      wall: "#1f242e",
      wallEdge: "#39414f",
      floor: "#9aa3ad",
      floorAlt: "#8d96a1",
      corridor: "#7f8894",
      door: "#b08d3e",
      grid: "rgba(40, 48, 60, 0.3)",
      roomNumber: "#454e5a",
    },
  },
  bosque: {
    label: "Bosque",
    colors: {
      background: "#0c120a",
      wall: "#16240f",
      wallEdge: "#2c4520",
      floor: "#7da75c",
      floorAlt: "#719a52",
      corridor: "#97a86a",
      door: "#b0873a",
      grid: "rgba(40, 60, 30, 0.3)",
      roomNumber: "#3f5a2c",
    },
  },
  desierto: {
    label: "Desierto",
    colors: {
      background: "#191204",
      wall: "#3a2c14",
      wallEdge: "#5c4722",
      floor: "#e3c68f",
      floorAlt: "#d9ba7f",
      corridor: "#cbab72",
      door: "#a1622c",
      grid: "rgba(120, 90, 40, 0.25)",
      roomNumber: "#7a5c2e",
    },
  },
  cripta: {
    label: "Cripta helada",
    colors: {
      background: "#0a1016",
      wall: "#14202c",
      wallEdge: "#2b4356",
      floor: "#bcd3e0",
      floorAlt: "#abc4d4",
      corridor: "#93aebf",
      door: "#4f86a8",
      grid: "rgba(60, 90, 110, 0.3)",
      roomNumber: "#47677a",
    },
  },
};

export const DEFAULT_THEME = "mazmorra";

function strokeLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/** Pinta una mazmorra completa en el canvas con la ambientación indicada. */
export function renderDungeon(
  canvas: HTMLCanvasElement,
  map: DungeonMap,
  cellSize: number,
  theme: string = DEFAULT_THEME
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const colors = (THEMES[theme] ?? THEMES[DEFAULT_THEME]).colors;

  canvas.width = map.width * cellSize;
  canvas.height = map.height * cellSize;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const cell = map.grid[y][x];
      const px = x * cellSize;
      const py = y * cellSize;

      if (cell === "wall") {
        ctx.fillStyle = colors.wall;
        ctx.fillRect(px, py, cellSize, cellSize);
        continue;
      }

      // Suelo con damero sutil para facilitar contar casillas
      if (cell === "floor") {
        ctx.fillStyle = (x + y) % 2 === 0 ? colors.floor : colors.floorAlt;
      } else if (cell === "corridor") {
        ctx.fillStyle = colors.corridor;
      } else {
        ctx.fillStyle = colors.door;
      }
      ctx.fillRect(px, py, cellSize, cellSize);

      ctx.strokeStyle = colors.grid;
      ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
    }
  }

  // Borde de los muros que dan a zonas transitables
  ctx.strokeStyle = colors.wallEdge;
  ctx.lineWidth = 2;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.grid[y][x] === "wall") continue;
      const px = x * cellSize;
      const py = y * cellSize;
      if (map.grid[y - 1]?.[x] === "wall") strokeLine(ctx, px, py, px + cellSize, py);
      if (map.grid[y + 1]?.[x] === "wall")
        strokeLine(ctx, px, py + cellSize, px + cellSize, py + cellSize);
      if (map.grid[y]?.[x - 1] === "wall") strokeLine(ctx, px, py, px, py + cellSize);
      if (map.grid[y]?.[x + 1] === "wall")
        strokeLine(ctx, px + cellSize, py, px + cellSize, py + cellSize);
    }
  }

  // Numera las salas
  ctx.fillStyle = colors.roomNumber;
  ctx.font = `700 ${cellSize * 0.9}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  map.rooms.forEach((room, index) => {
    ctx.fillText(
      String(index + 1),
      (room.x + room.w / 2) * cellSize,
      (room.y + room.h / 2) * cellSize
    );
  });
}

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

/** Aleatorio determinista por celda: la textura no cambia entre renders. */
function cellRand(x: number, y: number, salt: number): number {
  let h = (x * 374761393 + y * 668265263 + salt * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Textura de los muros según la ambientación. */
function paintWallTexture(
  ctx: CanvasRenderingContext2D,
  theme: string,
  x: number,
  y: number,
  px: number,
  py: number,
  s: number
) {
  switch (theme) {
    case "castillo":
    case "mazmorra": {
      // Sillería: juntas de mortero con ladrillos alternados
      ctx.strokeStyle = theme === "castillo" ? "rgba(0, 0, 0, 0.4)" : "rgba(0, 0, 0, 0.28)";
      ctx.lineWidth = 1;
      strokeLine(ctx, px, py + s / 2, px + s, py + s / 2);
      const offsetTop = (x + y) % 2 === 0 ? 0.33 : 0.66;
      strokeLine(ctx, px + s * offsetTop, py, px + s * offsetTop, py + s / 2);
      strokeLine(ctx, px + s * (1 - offsetTop), py + s / 2, px + s * (1 - offsetTop), py + s);
      break;
    }
    case "cueva": {
      // Roca moteada
      for (let i = 0; i < 4; i++) {
        const rx = px + cellRand(x, y, i) * s;
        const ry = py + cellRand(y, x, i + 7) * s;
        const radius = 1 + cellRand(x, y, i + 13) * 2.2;
        dot(ctx, rx, ry, radius, i % 2 ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.35)");
      }
      break;
    }
    case "bosque": {
      // Copas de árboles con brillo
      const cx = px + s * (0.35 + 0.3 * cellRand(x, y, 3));
      const cy = py + s * (0.35 + 0.3 * cellRand(x, y, 5));
      const radius = s * (0.3 + 0.18 * cellRand(x, y, 9));
      dot(ctx, cx, cy, radius, cellRand(x, y, 11) > 0.5 ? "#20361a" : "#294722");
      dot(ctx, cx - radius * 0.3, cy - radius * 0.3, radius * 0.45, "rgba(255, 255, 255, 0.06)");
      break;
    }
    case "desierto": {
      // Roquedales
      for (let i = 0; i < 2; i++) {
        const rx = px + s * (0.2 + 0.6 * cellRand(x, y, i + 2));
        const ry = py + s * (0.2 + 0.6 * cellRand(y, x, i + 4));
        dot(ctx, rx, ry, 1.5 + cellRand(x, y, i + 6) * 2.5, "rgba(0, 0, 0, 0.3)");
      }
      break;
    }
    case "cripta": {
      // Nieve acumulada arriba y algún destello de hielo
      ctx.fillStyle = "rgba(235, 248, 255, 0.15)";
      ctx.fillRect(px, py, s, s * 0.3);
      if (cellRand(x, y, 21) > 0.75) {
        dot(ctx, px + cellRand(x, y, 23) * s, py + s * (0.4 + 0.5 * cellRand(x, y, 25)), 1.2, "rgba(210, 240, 255, 0.6)");
      }
      break;
    }
  }
}

/** Textura del suelo y los pasillos según la ambientación. */
function paintFloorTexture(
  ctx: CanvasRenderingContext2D,
  theme: string,
  cell: "floor" | "corridor",
  x: number,
  y: number,
  px: number,
  py: number,
  s: number
) {
  switch (theme) {
    case "mazmorra": {
      if (cellRand(x, y, 31) > 0.85) {
        // Grieta en la losa
        ctx.strokeStyle = "rgba(60, 45, 25, 0.5)";
        ctx.lineWidth = 1;
        strokeLine(
          ctx,
          px + s * cellRand(x, y, 33),
          py + s * 0.2,
          px + s * cellRand(x, y, 35),
          py + s * 0.8
        );
      }
      break;
    }
    case "cueva": {
      // Guijarros dispersos
      if (cellRand(x, y, 41) > 0.55) {
        dot(
          ctx,
          px + cellRand(x, y, 43) * s,
          py + cellRand(x, y, 45) * s,
          1 + cellRand(x, y, 47) * 1.5,
          "rgba(0, 0, 0, 0.25)"
        );
      }
      break;
    }
    case "castillo": {
      if (cellRand(x, y, 51) > 0.82) {
        // Junta agrietada en la losa
        ctx.strokeStyle = "rgba(30, 38, 48, 0.5)";
        ctx.lineWidth = 1;
        strokeLine(ctx, px + s * 0.2, py + s * cellRand(x, y, 53), px + s * 0.8, py + s * cellRand(x, y, 55));
      }
      break;
    }
    case "bosque": {
      if (cell === "corridor") {
        // Sendero de tierra con gravilla
        dot(ctx, px + cellRand(x, y, 61) * s, py + cellRand(x, y, 63) * s, 1.2, "rgba(90, 70, 40, 0.4)");
      } else {
        // Briznas de hierba
        ctx.strokeStyle = "rgba(35, 75, 25, 0.55)";
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          const bx = px + cellRand(x, y, 65 + i) * s;
          const by = py + s * (0.3 + 0.6 * cellRand(x, y, 71 + i));
          strokeLine(ctx, bx, by, bx + 1.5, by - s * 0.15);
        }
      }
      break;
    }
    case "desierto": {
      // Dunas: ondas de arena que cruzan la casilla
      ctx.strokeStyle = "rgba(150, 110, 55, 0.4)";
      ctx.lineWidth = 1;
      const wave = py + s * (0.35 + 0.4 * cellRand(x, y, 81));
      ctx.beginPath();
      ctx.moveTo(px, wave);
      ctx.quadraticCurveTo(px + s / 2, wave - s * 0.3, px + s, wave);
      ctx.stroke();
      if (cellRand(x, y, 83) > 0.6) {
        const wave2 = py + s * (0.6 + 0.3 * cellRand(x, y, 85));
        ctx.strokeStyle = "rgba(150, 110, 55, 0.22)";
        ctx.beginPath();
        ctx.moveTo(px, wave2);
        ctx.quadraticCurveTo(px + s / 2, wave2 - s * 0.22, px + s, wave2);
        ctx.stroke();
      }
      break;
    }
    case "cripta": {
      if (cellRand(x, y, 91) > 0.6) {
        // Grietas del hielo
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1;
        const x1 = px + s * cellRand(x, y, 93);
        const y1 = py + s * 0.15;
        const x2 = px + s * cellRand(x, y, 95);
        strokeLine(ctx, x1, y1, (x1 + x2) / 2, py + s * 0.5);
        strokeLine(ctx, (x1 + x2) / 2, py + s * 0.5, x2, py + s * 0.85);
      }
      break;
    }
  }
}

/** Puertas con tablones, común a todas las ambientaciones. */
function paintDoor(ctx: CanvasRenderingContext2D, px: number, py: number, s: number) {
  ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
  ctx.lineWidth = 1;
  strokeLine(ctx, px + s * 0.15, py + s * 0.33, px + s * 0.85, py + s * 0.33);
  strokeLine(ctx, px + s * 0.15, py + s * 0.66, px + s * 0.85, py + s * 0.66);
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
  const themeId = THEMES[theme] ? theme : DEFAULT_THEME;
  const colors = THEMES[themeId].colors;

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
        paintWallTexture(ctx, themeId, x, y, px, py, cellSize);
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

      if (cell === "door") {
        paintDoor(ctx, px, py, cellSize);
      } else {
        paintFloorTexture(ctx, themeId, cell, x, y, px, py, cellSize);
      }
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

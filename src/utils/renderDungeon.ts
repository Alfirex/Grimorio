import type { DungeonMap } from "@/utils/mapgen";

const COLORS = {
  background: "#16120d",
  wall: "#241c12",
  wallEdge: "#3d2f1d",
  floor: "#d8c9a3",
  floorAlt: "#cfc096",
  corridor: "#bfae86",
  door: "#c9a227",
  grid: "rgba(60, 45, 25, 0.25)",
  roomNumber: "#5a4a2f",
};

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

/** Pinta una mazmorra completa en el canvas con el tamaño de celda indicado. */
export function renderDungeon(canvas: HTMLCanvasElement, map: DungeonMap, cellSize: number): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = map.width * cellSize;
  canvas.height = map.height * cellSize;

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const cell = map.grid[y][x];
      const px = x * cellSize;
      const py = y * cellSize;

      if (cell === "wall") {
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(px, py, cellSize, cellSize);
        continue;
      }

      // Suelo con damero sutil para facilitar contar casillas
      if (cell === "floor") {
        ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
      } else if (cell === "corridor") {
        ctx.fillStyle = COLORS.corridor;
      } else {
        ctx.fillStyle = COLORS.door;
      }
      ctx.fillRect(px, py, cellSize, cellSize);

      ctx.strokeStyle = COLORS.grid;
      ctx.strokeRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1);
    }
  }

  // Borde de los muros que dan a zonas transitables
  ctx.strokeStyle = COLORS.wallEdge;
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
  ctx.fillStyle = COLORS.roomNumber;
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

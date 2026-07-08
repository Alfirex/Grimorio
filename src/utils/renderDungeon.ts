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
      wall: "#101c0b",
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
      wall: "#2e2210",
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

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function triangle(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

// ---------- Elementos ilustrados ----------

/** Pino: tronco + tres pisos de copa con luz lateral. */
function drawPine(ctx: CanvasRenderingContext2D, cx: number, baseY: number, s: number, r: number) {
  const h = s * (0.85 + 0.2 * r);
  const w = s * (0.55 + 0.15 * r);
  ctx.fillStyle = "#4a3320";
  ctx.fillRect(cx - s * 0.045, baseY - s * 0.16, s * 0.09, s * 0.16);
  const layers: Array<[number, number, string]> = [
    [0.0, 1.0, "#16290f"],
    [0.32, 0.78, "#1e3815"],
    [0.58, 0.55, "#2a4d1d"],
  ];
  for (const [lift, scale, color] of layers) {
    const y0 = baseY - s * 0.12 - h * lift;
    triangle(ctx, cx - (w * scale) / 2, y0, cx + (w * scale) / 2, y0, cx, y0 - h * 0.45 * scale - h * 0.1, color);
  }
  // Luz en el lado izquierdo de la copa
  triangle(ctx, cx - w * 0.28, baseY - s * 0.12 - h * 0.32, cx, baseY - s * 0.12 - h * 0.32, cx - w * 0.05, baseY - h * 0.75, "rgba(190, 230, 140, 0.12)");
}

/** Roble: tronco + copa de tres masas con brillo. */
function drawOak(ctx: CanvasRenderingContext2D, cx: number, baseY: number, s: number, r: number) {
  const rad = s * (0.26 + 0.08 * r);
  ctx.fillStyle = "#503722";
  ctx.fillRect(cx - s * 0.05, baseY - s * 0.28, s * 0.1, s * 0.28);
  circle(ctx, cx - rad * 0.55, baseY - s * 0.3 - rad * 0.5, rad * 0.8, "#1c3413");
  circle(ctx, cx + rad * 0.55, baseY - s * 0.3 - rad * 0.55, rad * 0.85, "#224018");
  circle(ctx, cx, baseY - s * 0.3 - rad * 0.95, rad, "#2a4d1d");
  circle(ctx, cx - rad * 0.35, baseY - s * 0.3 - rad * 1.15, rad * 0.45, "rgba(190, 230, 140, 0.18)");
}

/** Peñasco con volumen: sombra en la base, cuerpo y brillo. */
function drawBoulder(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  dark: string,
  mid: string,
  light: string
) {
  ellipse(ctx, cx, cy + size * 0.35, size * 0.95, size * 0.3, "rgba(0, 0, 0, 0.35)");
  ellipse(ctx, cx, cy, size, size * 0.75, mid);
  ellipse(ctx, cx + size * 0.25, cy + size * 0.15, size * 0.55, size * 0.4, dark);
  ellipse(ctx, cx - size * 0.3, cy - size * 0.3, size * 0.35, size * 0.22, light);
}

/** Cactus saguaro con dos brazos. */
function drawCactus(ctx: CanvasRenderingContext2D, cx: number, baseY: number, s: number) {
  const w = s * 0.14;
  const h = s * 0.62;
  ctx.fillStyle = "#3f6b2e";
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, baseY - h, w, h, w / 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(cx - w * 2.1, baseY - h * 0.72, w * 0.8, h * 0.34, w / 2);
  ctx.roundRect(cx - w * 2.1, baseY - h * 0.72, w * 2.1, w * 0.8, w / 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(cx + w * 1.3, baseY - h * 0.88, w * 0.8, h * 0.42, w / 2);
  ctx.roundRect(cx - w * 0.4 + w, baseY - h * 0.58, w * 1.2, w * 0.8, w / 2);
  ctx.fill();
  ctx.fillStyle = "rgba(210, 240, 160, 0.25)";
  ctx.fillRect(cx - w / 2 + 1, baseY - h + 2, 1.5, h - 4);
}

/** Muro de ladrillos sombreados uno a uno sobre fondo de mortero. */
function drawBricks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  px: number,
  py: number,
  s: number,
  mortar: string,
  shades: string[],
  highlight: string
) {
  ctx.fillStyle = mortar;
  ctx.fillRect(px, py, s, s);
  const rows = 2;
  const bh = s / rows;
  const gap = Math.max(1, s * 0.045);
  for (let row = 0; row < rows; row++) {
    const offset = (row + y) % 2 === 0 ? 0 : -s / 2;
    for (let col = -1; col < 2; col++) {
      const bx = px + offset + col * (s / 2);
      const bw = s / 2;
      const left = Math.max(px, bx + gap / 2);
      const right = Math.min(px + s, bx + bw - gap / 2);
      if (right <= left) continue;
      const shade = shades[Math.floor(cellRand(x * 3 + col, y * 2 + row, 17) * shades.length)];
      ctx.fillStyle = shade;
      ctx.fillRect(left, py + row * bh + gap / 2, right - left, bh - gap);
      ctx.fillStyle = highlight;
      ctx.fillRect(left, py + row * bh + gap / 2, right - left, 1);
    }
  }
}

/** Cristal de hielo facetado. */
function drawCrystal(ctx: CanvasRenderingContext2D, cx: number, baseY: number, s: number, r: number) {
  const h = s * (0.4 + 0.3 * r);
  const w = s * 0.16;
  triangle(ctx, cx - w, baseY, cx + w, baseY, cx, baseY - h, "#7fb6d9");
  triangle(ctx, cx - w, baseY, cx, baseY, cx - w * 0.2, baseY - h * 0.9, "#b8e0f5");
  triangle(ctx, cx + w * 0.3, baseY, cx + w, baseY, cx + w * 0.15, baseY - h * 0.6, "#4f86a8");
}

// ---------- Texturas por ambientación ----------

function paintWallTexture(
  ctx: CanvasRenderingContext2D,
  theme: string,
  x: number,
  y: number,
  px: number,
  py: number,
  s: number
) {
  const r = cellRand(x, y, 1);
  switch (theme) {
    case "mazmorra":
      drawBricks(ctx, x, y, px, py, s, "#171009", ["#2a2015", "#251c12", "#2f2418", "#221a10"], "rgba(255, 235, 200, 0.05)");
      break;
    case "castillo":
      drawBricks(ctx, x, y, px, py, s, "#0d1117", ["#232a36", "#1f2530", "#28303d", "#1c222c"], "rgba(220, 235, 255, 0.06)");
      break;
    case "cueva": {
      // Peñascos apilados que forman la pared rocosa
      drawBoulder(
        ctx,
        px + s * (0.35 + 0.3 * r),
        py + s * (0.35 + 0.25 * cellRand(x, y, 5)),
        s * (0.3 + 0.12 * cellRand(x, y, 7)),
        "#141218",
        "#2a2731",
        "rgba(200, 195, 215, 0.14)"
      );
      if (cellRand(x, y, 9) > 0.45) {
        drawBoulder(
          ctx,
          px + s * (0.25 + 0.5 * cellRand(x, y, 11)),
          py + s * 0.75,
          s * 0.2,
          "#141218",
          "#332f3b",
          "rgba(200, 195, 215, 0.12)"
        );
      }
      break;
    }
    case "bosque": {
      // Sotobosque oscuro y un árbol por celda (pino o roble)
      ellipse(ctx, px + s / 2, py + s * 0.85, s * 0.5, s * 0.18, "rgba(0, 0, 0, 0.35)");
      const cx = px + s * (0.4 + 0.2 * cellRand(x, y, 3));
      if (r > 0.45) drawPine(ctx, cx, py + s * 0.95, s, cellRand(x, y, 13));
      else drawOak(ctx, cx, py + s * 0.95, s, cellRand(x, y, 13));
      break;
    }
    case "desierto": {
      // Mesetas rocosas con estratos, y algún cactus
      if (r > 0.8) {
        drawCactus(ctx, px + s * 0.5, py + s * 0.9, s);
      } else {
        drawBoulder(
          ctx,
          px + s * (0.35 + 0.3 * cellRand(x, y, 5)),
          py + s * (0.4 + 0.2 * cellRand(x, y, 7)),
          s * (0.3 + 0.14 * cellRand(x, y, 9)),
          "#241a0b",
          "#45331a",
          "rgba(255, 220, 150, 0.16)"
        );
      }
      break;
    }
    case "cripta": {
      drawBricks(ctx, x, y, px, py, s, "#0b141d", ["#1a2836", "#16232f", "#1e2e3e", "#142029"], "rgba(220, 245, 255, 0.08)");
      // Nieve ondulada acumulada en lo alto del muro
      ctx.fillStyle = "rgba(235, 248, 255, 0.28)";
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + s, py);
      ctx.quadraticCurveTo(px + s * 0.7, py + s * (0.2 + 0.15 * r), px + s * 0.5, py + s * 0.18);
      ctx.quadraticCurveTo(px + s * 0.25, py + s * (0.1 + 0.2 * cellRand(x, y, 15)), px, py + s * 0.22);
      ctx.closePath();
      ctx.fill();
      if (cellRand(x, y, 21) > 0.7) {
        drawCrystal(ctx, px + s * (0.3 + 0.4 * cellRand(x, y, 23)), py + s * 0.95, s, cellRand(x, y, 25));
      }
      break;
    }
  }
}

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
  const r = cellRand(x, y, 31);
  switch (theme) {
    case "mazmorra": {
      if (r > 0.85) {
        ctx.strokeStyle = "rgba(60, 45, 25, 0.5)";
        ctx.lineWidth = 1;
        strokeLine(ctx, px + s * cellRand(x, y, 33), py + s * 0.2, px + s * cellRand(x, y, 35), py + s * 0.8);
      }
      if (r < 0.12) circle(ctx, px + s * cellRand(x, y, 37), py + s * cellRand(x, y, 39), s * 0.08, "rgba(70, 90, 40, 0.35)");
      break;
    }
    case "cueva": {
      // Guijarros con volumen
      if (r > 0.5) {
        const gx = px + s * (0.2 + 0.6 * cellRand(x, y, 43));
        const gy = py + s * (0.2 + 0.6 * cellRand(x, y, 45));
        const gr = s * (0.06 + 0.05 * cellRand(x, y, 47));
        circle(ctx, gx, gy, gr, "rgba(0, 0, 0, 0.3)");
        circle(ctx, gx - gr * 0.3, gy - gr * 0.3, gr * 0.5, "rgba(255, 255, 255, 0.12)");
      }
      break;
    }
    case "castillo": {
      if (r > 0.82) {
        ctx.strokeStyle = "rgba(30, 38, 48, 0.5)";
        ctx.lineWidth = 1;
        strokeLine(ctx, px + s * 0.2, py + s * cellRand(x, y, 53), px + s * 0.8, py + s * cellRand(x, y, 55));
      }
      break;
    }
    case "bosque": {
      if (cell === "corridor") {
        circle(ctx, px + s * cellRand(x, y, 61), py + s * cellRand(x, y, 63), s * 0.05, "rgba(90, 70, 40, 0.45)");
        break;
      }
      // Matas de hierba en abanico
      ctx.strokeStyle = "rgba(35, 75, 25, 0.6)";
      ctx.lineWidth = 1;
      const tx = px + s * (0.25 + 0.5 * cellRand(x, y, 65));
      const ty = py + s * (0.35 + 0.5 * cellRand(x, y, 67));
      for (let i = -1; i <= 1; i++) {
        strokeLine(ctx, tx, ty, tx + i * s * 0.08, ty - s * 0.16);
      }
      if (r > 0.88) circle(ctx, px + s * cellRand(x, y, 69), py + s * cellRand(x, y, 71), s * 0.05, "rgba(230, 220, 120, 0.7)");
      if (r < 0.08) circle(ctx, px + s * cellRand(x, y, 73), py + s * cellRand(x, y, 75), s * 0.14, "#42702f");
      break;
    }
    case "desierto": {
      // Duna con cara de sombra: media luna rellena
      const wave = py + s * (0.35 + 0.4 * r);
      ctx.fillStyle = "rgba(150, 110, 55, 0.28)";
      ctx.beginPath();
      ctx.moveTo(px, wave);
      ctx.quadraticCurveTo(px + s / 2, wave - s * 0.32, px + s, wave);
      ctx.quadraticCurveTo(px + s / 2, wave - s * 0.1, px, wave);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 235, 180, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, wave);
      ctx.quadraticCurveTo(px + s / 2, wave - s * 0.32, px + s, wave);
      ctx.stroke();
      break;
    }
    case "cripta": {
      if (r > 0.6) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 1;
        const x1 = px + s * cellRand(x, y, 93);
        const x2 = px + s * cellRand(x, y, 95);
        strokeLine(ctx, x1, py + s * 0.15, (x1 + x2) / 2, py + s * 0.5);
        strokeLine(ctx, (x1 + x2) / 2, py + s * 0.5, x2, py + s * 0.85);
      }
      if (r < 0.15) {
        ellipse(ctx, px + s / 2, py + s / 2, s * 0.3, s * 0.18, "rgba(230, 248, 255, 0.3)");
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

import type { DungeonMap } from "@/utils/mapgen";

/**
 * Renderizador "battle map": terreno orgánico con caminos de bordes
 * irregulares, escenografía en los muros (árboles, rocas, murallas),
 * moteado del suelo y atrezzo por sala (hogueras, barriles, tocones…).
 * Todo determinista: misma semilla → mismo dibujo en todas las pantallas.
 */

interface ThemeKit {
  label: string;
  /** Terreno exterior (hierba/arena) o recinto cerrado (roca/piedra). */
  base: string;
  baseLight: string;
  baseDark: string;
  pathEdge: string;
  path: string;
  pathAlt: string;
  grid: string;
  door: string;
  roomNumber: string;
}

export const THEMES: Record<string, ThemeKit> = {
  mazmorra: {
    label: "Mazmorra",
    base: "#171009",
    baseLight: "#211812",
    baseDark: "#100a05",
    pathEdge: "#8a7a58",
    path: "#d8c9a3",
    pathAlt: "#cabb95",
    grid: "rgba(60, 45, 25, 0.22)",
    door: "#8a6420",
    roomNumber: "rgba(90, 74, 47, 0.75)",
  },
  cueva: {
    label: "Cueva",
    base: "#0c0b0e",
    baseLight: "#161419",
    baseDark: "#070608",
    pathEdge: "#4e463e",
    path: "#8a8177",
    pathAlt: "#7d746a",
    grid: "rgba(30, 28, 35, 0.25)",
    door: "#8a6420",
    roomNumber: "rgba(50, 45, 38, 0.8)",
  },
  castillo: {
    label: "Castillo",
    base: "#0d1117",
    baseLight: "#151b24",
    baseDark: "#080b10",
    pathEdge: "#5a6470",
    path: "#9aa3ad",
    pathAlt: "#8d96a1",
    grid: "rgba(40, 48, 60, 0.25)",
    door: "#8a6420",
    roomNumber: "rgba(60, 68, 80, 0.8)",
  },
  bosque: {
    label: "Bosque",
    base: "#5c8a44",
    baseLight: "#6a9a4f",
    baseDark: "#4e7a3a",
    pathEdge: "#a08a5c",
    path: "#d3bc8a",
    pathAlt: "#c9b17d",
    grid: "rgba(70, 60, 35, 0.16)",
    door: "#7a5a30",
    roomNumber: "rgba(80, 62, 35, 0.55)",
  },
  desierto: {
    label: "Desierto",
    base: "#caa768",
    baseLight: "#d8b878",
    baseDark: "#b8945a",
    pathEdge: "#a67f45",
    path: "#e8d0a0",
    pathAlt: "#dfc490",
    grid: "rgba(120, 90, 40, 0.18)",
    door: "#7a5a30",
    roomNumber: "rgba(122, 92, 46, 0.6)",
  },
  cripta: {
    label: "Cripta helada",
    base: "#0b131c",
    baseLight: "#13202c",
    baseDark: "#060c12",
    pathEdge: "#5f7d92",
    path: "#bcd3e0",
    pathAlt: "#abc4d4",
    grid: "rgba(60, 90, 110, 0.25)",
    door: "#4f86a8",
    roomNumber: "rgba(71, 103, 122, 0.8)",
  },
};

export const DEFAULT_THEME = "mazmorra";

/** Los temas de exterior pintan hierba/arena en todo el lienzo. */
const OUTDOOR = new Set(["bosque", "desierto"]);

// ---------- Aleatoriedad determinista ----------

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

function cellRand(x: number, y: number, salt: number): number {
  let h = (x * 374761393 + y * 668265263 + salt * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// ---------- Primitivas ----------

type Ctx = CanvasRenderingContext2D;

function circle(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function triangle(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x3, y3);
  ctx.closePath();
  ctx.fill();
}

function line(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, width: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// ---------- Escenografía ----------

function drawTreeCanopy(ctx: Ctx, cx: number, cy: number, r: number, seed: number) {
  const dark = seed > 0.5 ? "#1e3816" : "#25441b";
  const mid = seed > 0.5 ? "#2c5220" : "#356028";
  ellipse(ctx, cx + r * 0.25, cy + r * 0.3, r * 1.05, r * 0.85, "rgba(0, 0, 0, 0.3)");
  circle(ctx, cx - r * 0.4, cy + r * 0.2, r * 0.6, dark);
  circle(ctx, cx + r * 0.45, cy + r * 0.1, r * 0.65, dark);
  circle(ctx, cx, cy - r * 0.15, r * 0.75, mid);
  circle(ctx, cx - r * 0.15, cy - r * 0.35, r * 0.4, "#457a33");
  circle(ctx, cx - r * 0.3, cy - r * 0.45, r * 0.18, "rgba(190, 230, 140, 0.35)");
}

function drawRock(ctx: Ctx, cx: number, cy: number, r: number, seed: number, gray = true) {
  const dark = gray ? "#3d434c" : "#3a2c18";
  const mid = gray ? "#5c6470" : "#5a4526";
  const light = gray ? "#828c9a" : "#7d6338";
  ellipse(ctx, cx + r * 0.15, cy + r * 0.45, r * 1.1, r * 0.45, "rgba(0, 0, 0, 0.35)");
  ctx.fillStyle = mid;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy + r * 0.5);
  ctx.lineTo(cx - r * 0.8, cy - r * (0.3 + seed * 0.3));
  ctx.lineTo(cx - r * 0.15, cy - r * (0.7 + seed * 0.25));
  ctx.lineTo(cx + r * 0.65, cy - r * 0.45);
  ctx.lineTo(cx + r, cy + r * 0.5);
  ctx.closePath();
  ctx.fill();
  triangle(ctx, cx - r * 0.15, cy - r * (0.7 + seed * 0.25), cx + r * 0.65, cy - r * 0.45, cx + r, cy + r * 0.5, dark);
  triangle(ctx, cx - r * 0.8, cy - r * (0.3 + seed * 0.3), cx - r * 0.15, cy - r * (0.7 + seed * 0.25), cx - r * 0.35, cy - r * 0.1, light);
}

function drawCactus(ctx: Ctx, cx: number, baseY: number, s: number) {
  const w = s * 0.16;
  const h = s * 0.7;
  ellipse(ctx, cx, baseY, s * 0.22, s * 0.07, "rgba(0, 0, 0, 0.3)");
  ctx.fillStyle = "#3f6b2e";
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, baseY - h, w, h, w / 2);
  ctx.roundRect(cx - w * 2, baseY - h * 0.7, w * 1.6, w * 0.7, w / 2);
  ctx.roundRect(cx - w * 2, baseY - h * 0.9, w * 0.7, w * 2.2, w / 2);
  ctx.roundRect(cx + w * 0.5, baseY - h * 0.55, w * 1.5, w * 0.7, w / 2);
  ctx.roundRect(cx + w * 1.3, baseY - h * 0.8, w * 0.7, w * 2, w / 2);
  ctx.fill();
  line(ctx, cx - w * 0.2, baseY - h + 3, cx - w * 0.2, baseY - 3, "rgba(210, 240, 160, 0.4)", 1);
}

function drawBrickWall(ctx: Ctx, x: number, y: number, px: number, py: number, s: number, tones: string[], mortar: string, cap: string) {
  ctx.fillStyle = mortar;
  ctx.fillRect(px, py, s, s);
  const bh = s / 2;
  const gap = Math.max(1, s * 0.05);
  for (let row = 0; row < 2; row++) {
    const offset = (row + y) % 2 === 0 ? 0 : -s / 2;
    for (let col = -1; col < 2; col++) {
      const bx = px + offset + col * (s / 2);
      const left = Math.max(px, bx + gap / 2);
      const right = Math.min(px + s, bx + s / 2 - gap / 2);
      if (right <= left) continue;
      ctx.fillStyle = tones[Math.floor(cellRand(x * 3 + col, y * 2 + row, 17) * tones.length)];
      ctx.fillRect(left, py + row * bh + gap / 2, right - left, bh - gap);
      ctx.fillStyle = cap;
      ctx.fillRect(left, py + row * bh + gap / 2, right - left, 1);
    }
  }
}

function drawStalagmite(ctx: Ctx, cx: number, baseY: number, s: number, seed: number) {
  const h = s * (0.45 + 0.3 * seed);
  triangle(ctx, cx - s * 0.16, baseY, cx + s * 0.16, baseY, cx, baseY - h, "#4e4856");
  triangle(ctx, cx - s * 0.16, baseY, cx - s * 0.02, baseY, cx - s * 0.05, baseY - h * 0.8, "#6a6375");
}

function drawCrystal(ctx: Ctx, cx: number, baseY: number, s: number, seed: number) {
  const h = s * (0.45 + 0.3 * seed);
  const w = s * 0.15;
  triangle(ctx, cx - w, baseY, cx + w, baseY, cx, baseY - h, "#7fb6d9");
  triangle(ctx, cx - w, baseY, cx - w * 0.1, baseY, cx - w * 0.25, baseY - h * 0.85, "#c8e8fa");
  triangle(ctx, cx + w * 0.75, baseY - h * 0.35, cx + w * 1.35, baseY, cx + w * 0.35, baseY, "#5a93b8");
}

// ---------- Atrezzo de salas ----------

function propCampfire(ctx: Ctx, cx: number, cy: number, s: number) {
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, s * 1.1);
  glow.addColorStop(0, "rgba(255, 150, 40, 0.45)");
  glow.addColorStop(1, "rgba(255, 120, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(cx - s * 1.1, cy - s * 1.1, s * 2.2, s * 2.2);
  line(ctx, cx - s * 0.28, cy + s * 0.14, cx + s * 0.28, cy - s * 0.14, "#4a3320", s * 0.1);
  line(ctx, cx - s * 0.28, cy - s * 0.14, cx + s * 0.28, cy + s * 0.14, "#3d2a1a", s * 0.1);
  circle(ctx, cx, cy, s * 0.17, "#e86a1d");
  circle(ctx, cx, cy - s * 0.04, s * 0.1, "#ffcf5e");
}

function propCrate(ctx: Ctx, cx: number, cy: number, s: number) {
  const half = s * 0.26;
  ellipse(ctx, cx + half * 0.2, cy + half * 0.9, half * 1.15, half * 0.35, "rgba(0, 0, 0, 0.3)");
  ctx.fillStyle = "#8a6534";
  ctx.fillRect(cx - half, cy - half, half * 2, half * 2);
  ctx.strokeStyle = "#5a3f1d";
  ctx.lineWidth = Math.max(1, s * 0.04);
  ctx.strokeRect(cx - half, cy - half, half * 2, half * 2);
  line(ctx, cx - half, cy - half, cx + half, cy + half, "#5a3f1d", Math.max(1, s * 0.035));
  line(ctx, cx + half, cy - half, cx - half, cy + half, "#5a3f1d", Math.max(1, s * 0.035));
  ctx.fillStyle = "rgba(255, 230, 180, 0.18)";
  ctx.fillRect(cx - half, cy - half, half * 2, half * 0.35);
}

function propBarrel(ctx: Ctx, cx: number, cy: number, s: number) {
  const r = s * 0.24;
  ellipse(ctx, cx + r * 0.2, cy + r * 0.75, r * 1.15, r * 0.4, "rgba(0, 0, 0, 0.3)");
  circle(ctx, cx, cy, r, "#7a5a30");
  ctx.strokeStyle = "#4e3a1e";
  ctx.lineWidth = Math.max(1, s * 0.035);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.95, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.stroke();
  circle(ctx, cx - r * 0.3, cy - r * 0.3, r * 0.22, "rgba(255, 230, 180, 0.25)");
}

function propStump(ctx: Ctx, cx: number, cy: number, s: number) {
  const r = s * 0.24;
  ellipse(ctx, cx + r * 0.15, cy + r * 0.5, r * 1.1, r * 0.4, "rgba(0, 0, 0, 0.3)");
  circle(ctx, cx, cy, r, "#6b4a2a");
  circle(ctx, cx, cy, r * 0.7, "#8a6338");
  circle(ctx, cx, cy, r * 0.4, "#a37a45");
  line(ctx, cx, cy, cx + r * 0.9, cy + r * 0.3, "#5a3f22", 1);
}

function propBush(ctx: Ctx, cx: number, cy: number, s: number) {
  ellipse(ctx, cx, cy + s * 0.14, s * 0.32, s * 0.12, "rgba(0, 0, 0, 0.25)");
  circle(ctx, cx - s * 0.12, cy, s * 0.16, "#2c5220");
  circle(ctx, cx + s * 0.12, cy + s * 0.02, s * 0.15, "#356028");
  circle(ctx, cx, cy - s * 0.08, s * 0.16, "#457a33");
  circle(ctx, cx - s * 0.05, cy - s * 0.12, s * 0.06, "rgba(190, 230, 140, 0.4)");
}

function propFlowers(ctx: Ctx, cx: number, cy: number, s: number) {
  circle(ctx, cx, cy, s * 0.05, "#e8d24a");
  circle(ctx, cx + s * 0.14, cy + s * 0.08, s * 0.045, "#d9744a");
  circle(ctx, cx - s * 0.12, cy + s * 0.1, s * 0.04, "#f0f0e0");
}

function propBones(ctx: Ctx, cx: number, cy: number, s: number) {
  line(ctx, cx - s * 0.18, cy - s * 0.06, cx + s * 0.14, cy + s * 0.1, "#d8d2c0", Math.max(1, s * 0.05));
  line(ctx, cx - s * 0.1, cy + s * 0.14, cx + s * 0.18, cy - s * 0.08, "#c8c2b0", Math.max(1, s * 0.05));
  circle(ctx, cx + s * 0.2, cy - s * 0.1, s * 0.06, "#d8d2c0");
}

function propRubble(ctx: Ctx, cx: number, cy: number, s: number) {
  circle(ctx, cx, cy, s * 0.1, "#565e68");
  circle(ctx, cx + s * 0.14, cy + s * 0.06, s * 0.07, "#464e58");
  circle(ctx, cx - s * 0.12, cy + s * 0.08, s * 0.06, "#666e78");
}

function propPuddle(ctx: Ctx, cx: number, cy: number, s: number) {
  ellipse(ctx, cx, cy, s * 0.3, s * 0.18, "rgba(230, 248, 255, 0.35)");
  ellipse(ctx, cx - s * 0.08, cy - s * 0.04, s * 0.1, s * 0.05, "rgba(255, 255, 255, 0.4)");
}

type Prop = (ctx: Ctx, cx: number, cy: number, s: number) => void;

const THEME_PROPS: Record<string, Prop[]> = {
  bosque: [propCampfire, propStump, propBush, propFlowers, propCrate, propBarrel],
  desierto: [propCampfire, propBones, (ctx, cx, cy, s) => drawCactus(ctx, cx, cy + s * 0.3, s * 0.9), propCrate, propRubble],
  mazmorra: [propCrate, propBarrel, propBones, propRubble, propCampfire],
  castillo: [propCrate, propBarrel, propRubble, propCampfire],
  cueva: [(ctx, cx, cy, s) => drawStalagmite(ctx, cx, cy + s * 0.3, s, 0.5), propRubble, propBones, propCampfire],
  cripta: [(ctx, cx, cy, s) => drawCrystal(ctx, cx, cy + s * 0.3, s, 0.5), propPuddle, propBones, propRubble],
};

// ---------- Render principal ----------

export function renderDungeon(
  canvas: HTMLCanvasElement,
  map: DungeonMap,
  cellSize: number,
  theme: string = DEFAULT_THEME
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const themeId = THEMES[theme] ? theme : DEFAULT_THEME;
  const kit = THEMES[themeId];
  const s = cellSize;
  const outdoor = OUTDOOR.has(themeId);
  const rng = mulberry32(map.seed ^ 0x9e3779b9);

  canvas.width = map.width * s;
  canvas.height = map.height * s;

  const walkable = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < map.width && y < map.height && map.grid[y][x] !== "wall";

  // 1) Terreno base con moteado orgánico
  ctx.fillStyle = kit.base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const splotches = Math.floor((map.width * map.height) / 5);
  for (let i = 0; i < splotches; i++) {
    const sx = rng() * canvas.width;
    const sy = rng() * canvas.height;
    const sr = s * (0.8 + rng() * 2.2);
    ctx.globalAlpha = 0.18 + rng() * 0.2;
    circle(ctx, sx, sy, sr, rng() > 0.5 ? kit.baseLight : kit.baseDark);
  }
  ctx.globalAlpha = 1;

  // 2) Área transitable como mancha orgánica: borde irregular + relleno
  const blob = (color: string, grow: number, saltA: number, saltB: number) => {
    ctx.fillStyle = color;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (!walkable(x, y)) continue;
        const jx = (cellRand(x, y, saltA) - 0.5) * s * 0.4;
        const jy = (cellRand(x, y, saltB) - 0.5) * s * 0.4;
        ctx.beginPath();
        ctx.arc(x * s + s / 2 + jx, y * s + s / 2 + jy, s * grow, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  blob(kit.pathEdge, 0.78, 101, 103);
  blob(kit.path, 0.62, 105, 107);
  // Variación de tono dentro del camino
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (!walkable(x, y) || cellRand(x, y, 109) < 0.5) continue;
      ctx.globalAlpha = 0.5;
      circle(ctx, x * s + s / 2, y * s + s / 2, s * 0.45, kit.pathAlt);
      ctx.globalAlpha = 1;
    }
  }

  // 3) Rejilla sutil solo sobre lo transitable
  ctx.strokeStyle = kit.grid;
  ctx.lineWidth = 1;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (walkable(x, y)) ctx.strokeRect(x * s + 0.5, y * s + 0.5, s - 1, s - 1);
    }
  }

  // 4) Puertas con tablones
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.grid[y][x] !== "door") continue;
      const px = x * s;
      const py = y * s;
      ctx.fillStyle = kit.door;
      ctx.fillRect(px + s * 0.12, py + s * 0.18, s * 0.76, s * 0.64);
      line(ctx, px + s * 0.15, py + s * 0.4, px + s * 0.85, py + s * 0.4, "rgba(0,0,0,0.35)", 1);
      line(ctx, px + s * 0.15, py + s * 0.6, px + s * 0.85, py + s * 0.6, "rgba(0,0,0,0.35)", 1);
    }
  }

  // 5) Escenografía en los muros: detallada junto al camino, masa densa al fondo
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (walkable(x, y)) continue;
      let nearPath = false;
      for (let dy = -1; dy <= 1 && !nearPath; dy++) {
        for (let dx = -1; dx <= 1 && !nearPath; dx++) {
          if ((dx || dy) && walkable(x + dx, y + dy)) nearPath = true;
        }
      }
      const px = x * s;
      const py = y * s;
      const cx = px + s / 2 + (cellRand(x, y, 111) - 0.5) * s * 0.5;
      const cy = py + s / 2 + (cellRand(x, y, 113) - 0.5) * s * 0.5;
      const r1 = cellRand(x, y, 115);
      const r2 = cellRand(x, y, 117);

      switch (themeId) {
        case "bosque": {
          if (nearPath || r1 > 0.35) {
            drawTreeCanopy(ctx, cx, cy, s * (0.5 + 0.25 * r2), r1);
          } else {
            circle(ctx, cx, cy, s * 0.55, r2 > 0.5 ? "#1b3213" : "#22401a");
          }
          if (nearPath && r2 > 0.85) drawRock(ctx, cx, cy + s * 0.2, s * 0.4, r1);
          break;
        }
        case "desierto": {
          if (nearPath) {
            if (r1 > 0.82) drawCactus(ctx, cx, cy + s * 0.35, s);
            else drawRock(ctx, cx, cy, s * (0.4 + 0.25 * r2), r1, false);
          } else if (r1 > 0.55) {
            drawRock(ctx, cx, cy, s * (0.5 + 0.3 * r2), r2, false);
          } else {
            ellipse(ctx, cx, cy, s * 0.7, s * 0.35, "rgba(90, 65, 30, 0.25)");
          }
          break;
        }
        case "cueva": {
          if (nearPath) drawRock(ctx, cx, cy, s * (0.45 + 0.25 * r2), r1);
          else circle(ctx, cx, cy, s * 0.5, r2 > 0.5 ? "#141218" : "#1a171f");
          if (nearPath && r2 > 0.8) drawStalagmite(ctx, cx, py + s * 0.9, s, r1);
          break;
        }
        case "cripta": {
          if (nearPath) {
            drawBrickWall(ctx, x, y, px, py, s, ["#1a2836", "#16232f", "#1e2e3e"], "#0b141d", "rgba(220, 245, 255, 0.08)");
            ctx.fillStyle = "rgba(235, 248, 255, 0.3)";
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + s, py);
            ctx.quadraticCurveTo(px + s * 0.6, py + s * (0.15 + 0.15 * r1), px + s * 0.4, py + s * 0.15);
            ctx.quadraticCurveTo(px + s * 0.2, py + s * (0.1 + 0.15 * r2), px, py + s * 0.2);
            ctx.closePath();
            ctx.fill();
            if (r2 > 0.75) drawCrystal(ctx, cx, py + s * 0.95, s, r1);
          } else {
            ctx.fillStyle = r2 > 0.5 ? "#0e1822" : "#0a121a";
            ctx.fillRect(px, py, s, s);
          }
          break;
        }
        case "castillo": {
          if (nearPath) {
            drawBrickWall(ctx, x, y, px, py, s, ["#232a36", "#1f2530", "#28303d"], "#0d1117", "rgba(220, 235, 255, 0.06)");
          } else {
            ctx.fillStyle = r2 > 0.5 ? "#0f141b" : "#0b0f15";
            ctx.fillRect(px, py, s, s);
          }
          break;
        }
        default: {
          // mazmorra
          if (nearPath) {
            drawBrickWall(ctx, x, y, px, py, s, ["#2a2015", "#251c12", "#2f2418"], "#171009", "rgba(255, 235, 200, 0.05)");
          } else {
            ctx.fillStyle = r2 > 0.5 ? "#130d07" : "#0f0a05";
            ctx.fillRect(px, py, s, s);
          }
        }
      }
    }
  }

  // 6) Atrezzo por sala (hogueras, barriles, tocones…), evitando el centro
  const props = THEME_PROPS[themeId] ?? [];
  if (props.length > 0) {
    map.rooms.forEach((room, index) => {
      const roomRng = mulberry32((map.seed ^ (index * 2654435761)) >>> 0);
      const count = room.w * room.h > 30 ? 2 + Math.floor(roomRng() * 2) : 1 + Math.floor(roomRng() * 2);
      for (let i = 0; i < count; i++) {
        const prop = props[Math.floor(roomRng() * props.length)];
        const rx = room.x + 0.6 + roomRng() * (room.w - 1.2);
        const ry = room.y + 0.6 + roomRng() * (room.h - 1.2);
        // No tapar el número de la sala
        if (Math.abs(rx - (room.x + room.w / 2)) < 1 && Math.abs(ry - (room.y + room.h / 2)) < 1) continue;
        prop(ctx, rx * s, ry * s, s);
      }
    });
  }

  // 7) Números de sala, discretos
  ctx.fillStyle = kit.roomNumber;
  ctx.font = `700 ${s * 0.8}px serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  map.rooms.forEach((room, index) => {
    ctx.fillText(String(index + 1), (room.x + room.w / 2) * s, (room.y + room.h / 2) * s);
  });

  // 8) Viñeta: bordes del mapa ligeramente oscurecidos
  const vignette = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    Math.min(canvas.width, canvas.height) * 0.35,
    canvas.width / 2,
    canvas.height / 2,
    Math.max(canvas.width, canvas.height) * 0.75
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, outdoor ? "rgba(10, 20, 5, 0.35)" : "rgba(0, 0, 0, 0.45)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

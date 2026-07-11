"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/context/AuthContext";
import { setCampaignBoard, subscribeMyCampaigns } from "@/lib/db";
import {
  generateDungeon,
  type CorridorStyle,
  type DungeonMap,
  type LoopMode,
  type RoomShapeMode,
  type WaterMode,
} from "@/utils/mapgen";
import { DEFAULT_THEME, renderDungeon, THEMES } from "@/utils/renderDungeon";
import type { BoardConfig, Campaign } from "@/types";
import styles from "./page.module.scss";

const CELL_SIZE = 14;

const DEFAULT_OPTIONS = {
  width: 60,
  height: 40,
  roomAttempts: 18,
  minRoomSize: 4,
  maxRoomSize: 10,
};

// Semilla fija para que el primer render coincida entre servidor y cliente
const INITIAL_SEED = 1420;

export default function MapGeneratorPage() {
  return (
    <RequireAuth>
      <MapGenerator />
    </RequireAuth>
  );
}

function MapGenerator() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(DEFAULT_OPTIONS.width);
  const [height, setHeight] = useState(DEFAULT_OPTIONS.height);
  const [roomAttempts, setRoomAttempts] = useState(DEFAULT_OPTIONS.roomAttempts);
  const [minRoomSize, setMinRoomSize] = useState(DEFAULT_OPTIONS.minRoomSize);
  const [maxRoomSize, setMaxRoomSize] = useState(DEFAULT_OPTIONS.maxRoomSize);
  const [seedInput, setSeedInput] = useState(String(INITIAL_SEED));
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [roomShapes, setRoomShapes] = useState<RoomShapeMode>("mixed");
  const [corridorStyle, setCorridorStyle] = useState<CorridorStyle>("straight");
  const [loops, setLoops] = useState<LoopMode>("some");
  const [water, setWater] = useState<WaterMode>("none");
  const [pillars, setPillars] = useState(false);
  const [bossRoom, setBossRoom] = useState(false);
  const [title, setTitle] = useState("");
  // Parámetros exactos del mapa mostrado, para poder usarlo como tablero
  const [boardConfig, setBoardConfig] = useState<BoardConfig>({
    ...DEFAULT_OPTIONS,
    seed: INITIAL_SEED,
    roomShapes: "mixed",
  });
  const [map, setMap] = useState<DungeonMap>(() =>
    generateDungeon({ ...DEFAULT_OPTIONS, seed: INITIAL_SEED, roomShapes: "mixed" })
  );

  const generate = useCallback(
    (seed?: number) => {
      const options = {
        width,
        height,
        roomAttempts,
        minRoomSize: Math.min(minRoomSize, maxRoomSize),
        maxRoomSize: Math.max(minRoomSize, maxRoomSize),
        roomShapes,
        corridorStyle,
        loops,
        water,
        pillars,
        bossRoom,
      };
      const dungeon = generateDungeon({ ...options, seed });
      setMap(dungeon);
      setSeedInput(String(dungeon.seed));
      setBoardConfig({ ...options, seed: dungeon.seed, title: title.trim() });
    },
    [width, height, roomAttempts, minRoomSize, maxRoomSize, roomShapes, corridorStyle, loops, water, pillars, bossRoom, title]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) renderDungeon(canvas, map, CELL_SIZE, theme, title);
  }, [map, theme, title]);

  /** Presets de tamaño: de escaramuza a megadungeon en un clic. */
  const applyPreset = (w: number, h: number, attempts: number, min: number, max: number) => {
    setWidth(w);
    setHeight(h);
    setRoomAttempts(attempts);
    setMinRoomSize(min);
    setMaxRoomSize(max);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `mazmorra-${map.seed}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleRegenerateWithSeed = () => {
    const seed = parseInt(seedInput, 10);
    generate(Number.isNaN(seed) ? undefined : seed);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Generador de mazmorras</h1>

      <div className={styles.layout}>
        <aside className={`panel ${styles.controls}`}>
          <h2 className="section-title">Parámetros</h2>

          <div className={styles.presetRow}>
            <span className="field-label">Tamaño rápido</span>
            <div className={styles.presetButtons}>
              <button type="button" className="btn btn--sm" onClick={() => applyPreset(36, 26, 6, 4, 9)}>
                Escaramuza
              </button>
              <button type="button" className="btn btn--sm" onClick={() => applyPreset(60, 40, 18, 4, 10)}>
                Mazmorra
              </button>
              <button type="button" className="btn btn--sm" onClick={() => applyPreset(90, 60, 30, 5, 12)}>
                Gran mazmorra
              </button>
              <button type="button" className="btn btn--sm" onClick={() => applyPreset(120, 80, 45, 5, 13)}>
                Megadungeon
              </button>
            </div>
          </div>

          <Control label={`Ancho: ${width}`}>
            <input type="range" min={30} max={120} value={width} onChange={(e) => setWidth(+e.target.value)} />
          </Control>
          <Control label={`Alto: ${height}`}>
            <input type="range" min={20} max={90} value={height} onChange={(e) => setHeight(+e.target.value)} />
          </Control>
          <Control label={`Densidad de salas: ${roomAttempts}${roomAttempts === 1 ? " (sala única)" : ""}`}>
            <input type="range" min={1} max={50} value={roomAttempts} onChange={(e) => setRoomAttempts(+e.target.value)} />
          </Control>
          <Control label={`Sala mínima: ${minRoomSize}`}>
            <input type="range" min={3} max={12} value={minRoomSize} onChange={(e) => setMinRoomSize(+e.target.value)} />
          </Control>
          <Control label={`Sala máxima: ${maxRoomSize}`}>
            <input type="range" min={4} max={20} value={maxRoomSize} onChange={(e) => setMaxRoomSize(+e.target.value)} />
          </Control>

          <label>
            <span className="field-label">Forma de las salas</span>
            <select
              className="input"
              value={roomShapes}
              onChange={(e) => setRoomShapes(e.target.value as RoomShapeMode)}
            >
              <option value="mixed">Variadas (cuadradas, circulares, cruces…)</option>
              <option value="rect">Rectangulares</option>
              <option value="round">Redondeadas</option>
              <option value="poly">Poligonales (pentágonos…)</option>
              <option value="cave">Cavernas orgánicas</option>
            </select>
          </label>

          <label>
            <span className="field-label">Pasillos</span>
            <select
              className="input"
              value={corridorStyle}
              onChange={(e) => setCorridorStyle(e.target.value as CorridorStyle)}
            >
              <option value="straight">Rectos (en L)</option>
              <option value="winding">Serpenteantes</option>
              <option value="wide">Anchos (2 casillas)</option>
            </select>
          </label>

          <label>
            <span className="field-label">Conexiones</span>
            <select
              className="input"
              value={loops}
              onChange={(e) => setLoops(e.target.value as LoopMode)}
            >
              <option value="none">Lineales (sin bucles)</option>
              <option value="some">Normales</option>
              <option value="many">Laberínticas (muchos bucles)</option>
            </select>
          </label>

          <label>
            <span className="field-label">Agua</span>
            <select
              className="input"
              value={water}
              onChange={(e) => setWater(e.target.value as WaterMode)}
            >
              <option value="none">Sin agua</option>
              <option value="river">Río (con puentes)</option>
              <option value="lake">Lago</option>
              <option value="both">Río y lago</option>
            </select>
          </label>

          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={pillars}
              onChange={(e) => setPillars(e.target.checked)}
            />
            <span className="field-label">Columnas en salas grandes</span>
          </label>

          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={bossRoom}
              onChange={(e) => setBossRoom(e.target.checked)}
            />
            <span className="field-label">Guarida del jefe (sala final 💀)</span>
          </label>

          <label>
            <span className="field-label">Título del mapa</span>
            <input
              className="input"
              placeholder="Cripta del Rey Exánime…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label>
            <span className="field-label">Ambientación</span>
            <select className="input" value={theme} onChange={(e) => setTheme(e.target.value)}>
              {Object.entries(THEMES).map(([id, def]) => (
                <option key={id} value={id}>
                  {def.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="field-label">Semilla</span>
            <input
              className="input"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              placeholder="Aleatoria"
            />
          </label>

          <div className={styles.buttons}>
            <button type="button" className="btn btn--gold" onClick={() => generate()}>
              🎲 Generar
            </button>
            <button type="button" className="btn" onClick={handleRegenerateWithSeed}>
              Usar semilla
            </button>
            <button type="button" className="btn" onClick={handleDownload}>
              ⬇ PNG
            </button>
          </div>

          <p className={styles.mapInfo}>
            {map.rooms.length} salas · semilla {map.seed}
          </p>

          {user && <SendToCampaign uid={user.uid} boardConfig={{ ...boardConfig, theme }} />}
        </aside>

        <div className={`panel ${styles.canvasWrap}`}>
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>
      </div>
    </div>
  );
}

/** Permite al máster colocar el mapa actual como tablero de una de sus campañas. */
function SendToCampaign({ uid, boardConfig }: { uid: string; boardConfig: BoardConfig }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    return subscribeMyCampaigns(uid, (all) => {
      setCampaigns(all.filter((c) => c.dmUid === uid));
    });
  }, [uid]);

  if (campaigns.length === 0) return null;

  const handleSend = async () => {
    if (!target) return;
    setBusy(true);
    setSentTo(null);
    try {
      await setCampaignBoard(target, boardConfig);
      setSentTo(target);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.sendBox}>
      <span className="field-label">Usar como tablero en…</span>
      <select className="input" value={target} onChange={(e) => setTarget(e.target.value)}>
        <option value="">— Elige campaña —</option>
        {campaigns.map((campaign) => (
          <option key={campaign.id} value={campaign.id}>
            {campaign.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn--gold btn--sm"
        onClick={handleSend}
        disabled={!target || busy}
      >
        {busy ? "Enviando…" : "Colocar tablero"}
      </button>
      {sentTo && (
        <p className={styles.sentOk}>
          Tablero colocado ✓{" "}
          <Link href={`/campaigns/${sentTo}`} className={styles.sentLink}>
            Ir a la campaña
          </Link>
        </p>
      )}
      <p className={styles.sendWarning}>
        Colocar un mapa nuevo reinicia las fichas del tablero.
      </p>
    </div>
  );
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className={styles.control}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

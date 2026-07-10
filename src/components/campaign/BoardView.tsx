"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { generateDungeon, type DungeonMap } from "@/utils/mapgen";
import { renderDungeon } from "@/utils/renderDungeon";
import { rollDice } from "@/utils/dice";
import {
  appendBoardLog,
  clearBoardLog,
  moveBoardToken,
  removeBoardLogEntry,
  removeBoardToken,
  revealBoardRoom,
  setBoardTokenConditions,
  setBoardTokenHp,
  updateCharacter,
  upsertBoardToken,
} from "@/lib/db";
import { BESTIARY, type MonsterDef } from "@/data/bestiary";
import { CONDITIONS, conditionEmoji, inferAttackRange } from "@/data/dnd5e";
import { spellRangeFor } from "@/data/srd";
import { formatModifier, savingThrowBonus } from "@/utils/character";
import { sortedCombatants } from "./InitiativeTracker";
import type { AbilityKey, Attack, BoardToken, Campaign, Character } from "@/types";
import styles from "./BoardView.module.scss";

const CELL = 32;
const FEET_PER_CELL = 5;
// Límite de recursos: mantiene el documento de campaña pequeño y la cuota gratuita a salvo
const MAX_TOKENS = 40;

const PLAYER_COLORS = [
  "#3b82c4",
  "#4a7c3f",
  "#8b5cb4",
  "#c46a3b",
  "#2ca8a0",
  "#c9a227",
  "#7a4a8b",
  "#4a6b8b",
];
const ENEMY_COLOR = "#b43a3a";

interface BoardViewProps {
  campaign: Campaign;
  characters: Character[];
  isDM: boolean;
}

interface CombatState {
  attackerId: string;
  targetId: string;
}

export function BoardView({ campaign, characters, isDM }: BoardViewProps) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const aoeRef = useRef<HTMLCanvasElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [combat, setCombat] = useState<CombatState | null>(null);
  const [notice, setNotice] = useState("");
  const [freeMove, setFreeMove] = useState(false);
  const [creature, setCreature] = useState("0"); // índice del bestiario o "custom"
  const [hpDelta, setHpDelta] = useState("5");
  const [hoverCell, setHoverCell] = useState<string | null>(null); // "x,y" bajo el cursor
  const [aoeShape, setAoeShape] = useState<"none" | "sphere" | "cube" | "cone" | "line">("none");
  const [aoeSize, setAoeSize] = useState("20"); // pies
  const [enemyName, setEnemyName] = useState("");
  const [enemyHp, setEnemyHp] = useState("7");
  const [enemyAc, setEnemyAc] = useState("13");
  const [enemySpeed, setEnemySpeed] = useState("30");
  const [enemyXp, setEnemyXp] = useState("25");
  const [enemyRoom, setEnemyRoom] = useState("0");

  const board = campaign.board ?? null;
  const tokens = useMemo(() => campaign.tokens ?? {}, [campaign.tokens]);
  const tokenList = Object.values(tokens);
  const log = campaign.boardLog ?? [];
  const revealed = useMemo(
    () => new Set(campaign.revealedRooms ?? []),
    [campaign.revealedRooms]
  );

  // Regenerar la mazmorra es determinista y barato: misma semilla → mismo mapa
  const map = useMemo<DungeonMap | null>(() => (board ? generateDungeon(board) : null), [board]);

  const roomIndexAt = (x: number, y: number): number => {
    if (!map) return -1;
    return map.rooms.findIndex(
      (r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h
    );
  };

  const characterOf = (token: BoardToken): Character | undefined =>
    token.characterId ? characters.find((c) => c.id === token.characterId) : undefined;

  /** PG, CA y velocidad efectivos: los jugadores los leen en vivo de su ficha. */
  const statsOf = (token: BoardToken) => {
    const character = characterOf(token);
    return {
      hp: character ? character.currentHp : (token.hp ?? 0),
      maxHp: character ? character.maxHp : (token.maxHp ?? 0),
      ac: character ? character.armorClass : (token.ac ?? 10),
      speed: character ? character.speed : (token.speed ?? 30),
    };
  };

  const canMove = (token: BoardToken): boolean => {
    if (isDM) return true;
    const character = characterOf(token);
    return character?.ownerUid === user?.uid;
  };

  /** Niebla de guerra: los enemigos de salas no descubiertas son invisibles para jugadores. */
  const hiddenFromPlayers = (token: BoardToken): boolean => {
    if (token.characterId) return false;
    const room = roomIndexAt(token.x, token.y);
    return room >= 0 && !revealed.has(room);
  };

  const visibleTokens = tokenList.filter((t) => isDM || !hiddenFromPlayers(t));

  /** Un ataque solo tiene sentido entre bandos: jugador ↔ enemigo. */
  const areHostile = (a: BoardToken, b: BoardToken): boolean =>
    (a.characterId === null) !== (b.characterId === null);

  const selectedToken = selectedId ? (tokens[selectedId] ?? null) : null;

  // Ficha a la que le toca actuar en el encuentro compartido
  const encounter = campaign.encounter ?? null;
  const activeTokenId = encounter
    ? (sortedCombatants(encounter)[encounter.turnIndex]?.id ?? null)
    : null;

  /** Casillas alcanzables por la ficha seleccionada (BFS limitado por su velocidad). */
  const reachable = useMemo<Set<string> | null>(() => {
    if (!map || !selectedToken || (isDM && freeMove)) return null;
    const character = selectedToken.characterId
      ? characters.find((c) => c.id === selectedToken.characterId)
      : undefined;
    const speed = character ? character.speed : (selectedToken.speed ?? 30);
    const maxSteps = Math.max(1, Math.floor(speed / FEET_PER_CELL));

    const visited = new Set<string>([`${selectedToken.x},${selectedToken.y}`]);
    let frontier = [{ x: selectedToken.x, y: selectedToken.y }];
    for (let step = 0; step < maxSteps; step++) {
      const next: Array<{ x: number; y: number }> = [];
      for (const cell of frontier) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = cell.x + dx;
            const ny = cell.y + dy;
            const key = `${nx},${ny}`;
            if (
              nx >= 0 &&
              ny >= 0 &&
              nx < map.width &&
              ny < map.height &&
              map.grid[ny][nx] !== "wall" &&
              !visited.has(key)
            ) {
              visited.add(key);
              next.push({ x: nx, y: ny });
            }
          }
        }
      }
      frontier = next;
    }
    return visited;
  }, [map, selectedToken, characters, isDM, freeMove]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && map) renderDungeon(canvas, map, CELL, board?.theme);
  }, [map, board?.theme]);

  // Capa de alcance: verde = puede llegar, rojo = terreno que no puede recorrer
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !map) return;
    overlay.width = map.width * CELL;
    overlay.height = map.height * CELL;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (!reachable) return;

    const touchesReachable = (x: number, y: number): boolean => {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if ((dx || dy) && reachable.has(`${x + dx},${y + dy}`)) return true;
        }
      }
      return false;
    };

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.grid[y][x] === "wall") continue;
        if (reachable.has(`${x},${y}`)) {
          // Hasta aquí puede llegar
          ctx.fillStyle = "rgba(74, 199, 120, 0.28)";
        } else if (touchesReachable(x, y)) {
          // Frontera en rojo: el primer paso que ya no puede dar
          ctx.fillStyle = "rgba(200, 40, 40, 0.5)";
        } else {
          // Resto del mapa fuera de alcance, atenuado
          ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        }
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
    }
  }, [map, reachable]);

  const appendLog = (text: string) => appendBoardLog(campaign.id, log, text);

  const handleBoardClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!map) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL);
    const y = Math.floor((e.clientY - rect.top) / CELL);
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return;

    // Con una plantilla activa, el clic anuncia el área en vez de mover
    if (aoeShape !== "none") {
      if (!aoeCells) return;
      const names = aoeAffected.map((token) => token.name);
      const sizeFeet = Math.max(FEET_PER_CELL, parseInt(aoeSize, 10) || FEET_PER_CELL);
      await appendLog(
        `🔥 ${selectedToken?.name ?? "El máster"} marca ${AOE_LABELS[aoeShape]} de ${sizeFeet} pies: ${
          names.length > 0 ? `afecta a ${names.join(", ")}` : "no alcanza a nadie"
        }.`
      );
      return;
    }

    setNotice("");
    const clicked = visibleTokens.find((t) => t.x === x && t.y === y);

    if (clicked) {
      // Ficha propia seleccionada + clic en una del bando contrario → atacar
      if (
        selectedToken &&
        selectedToken.id !== clicked.id &&
        canMove(selectedToken) &&
        areHostile(selectedToken, clicked)
      ) {
        setCombat({ attackerId: selectedToken.id, targetId: clicked.id });
        return;
      }
      if (canMove(clicked)) {
        setCombat(null);
        setSelectedId((prev) => (prev === clicked.id ? null : clicked.id));
      }
      return;
    }

    if (selectedId && selectedToken && map.grid[y][x] !== "wall") {
      if (reachable && !reachable.has(`${x},${y}`)) {
        setNotice(
          `Fuera de alcance: «${selectedToken.name}» solo puede recorrer ${statsOf(selectedToken).speed} pies (${Math.floor(statsOf(selectedToken).speed / FEET_PER_CELL)} casillas).`
        );
        return;
      }
      await moveBoardToken(campaign.id, selectedId, x, y);
      // Un personaje que entra en una sala nueva la descubre para todos
      if (selectedToken.characterId) {
        const room = roomIndexAt(x, y);
        if (room >= 0 && !revealed.has(room)) {
          await revealBoardRoom(campaign.id, room);
          await appendLog(`🕯 ${selectedToken.name} descubre la sala ${room + 1}.`);
        }
      }
      setSelectedId(null);
      setCombat(null);
    }
  };

  /** Celdas de suelo libres, opcionalmente dentro de una sala concreta. */
  const findFreeCells = (
    count: number,
    taken: BoardToken[],
    roomIndex?: number
  ): Array<{ x: number; y: number }> => {
    if (!map) return [];
    const occupied = new Set(taken.map((t) => `${t.x},${t.y}`));
    const cells: Array<{ x: number; y: number }> = [];
    const room = roomIndex !== undefined ? map.rooms[roomIndex] : undefined;
    const [x0, y0, x1, y1] = room
      ? [room.x, room.y, room.x + room.w, room.y + room.h]
      : [0, 0, map.width, map.height];
    outer: for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        if (map.grid[y][x] === "floor" && !occupied.has(`${x},${y}`)) {
          cells.push({ x, y });
          occupied.add(`${x},${y}`);
          if (cells.length >= count) break outer;
        }
      }
    }
    return cells;
  };

  const guardTokenLimit = (adding: number): boolean => {
    if (tokenList.length + adding > MAX_TOKENS) {
      setNotice(`Límite del tablero alcanzado (${MAX_TOKENS} fichas). Quita alguna antes de añadir más.`);
      return false;
    }
    return true;
  };

  const handleAddPlayers = async () => {
    const missing = characters.filter(
      (c) => !tokenList.some((t) => t.characterId === c.id)
    );
    if (!guardTokenLimit(missing.length)) return;
    const cells = findFreeCells(missing.length, tokenList);
    const newRooms = new Set<number>();
    missing.forEach((character, i) => {
      if (!cells[i]) return;
      upsertBoardToken(campaign.id, {
        id: character.id,
        characterId: character.id,
        name: character.name || "PJ",
        color: PLAYER_COLORS[(tokenList.length + i) % PLAYER_COLORS.length],
        x: cells[i].x,
        y: cells[i].y,
      });
      const room = roomIndexAt(cells[i].x, cells[i].y);
      if (room >= 0 && !revealed.has(room)) newRooms.add(room);
    });
    for (const room of newRooms) await revealBoardRoom(campaign.id, room);
  };

  /** "Goblin", "Goblin 2", "Goblin 3"… para distinguir criaturas repetidas. */
  const numberedName = (base: string): string => {
    const count = tokenList.filter(
      (t) => t.name === base || t.name.startsWith(`${base} `)
    ).length;
    return count === 0 ? base : `${base} ${count + 1}`;
  };

  const handleAddEnemy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardTokenLimit(1)) return;
    const roomIndex = parseInt(enemyRoom, 10);
    const [cell] = findFreeCells(1, tokenList, Number.isNaN(roomIndex) ? undefined : roomIndex);
    if (!cell) {
      setNotice("No queda sitio libre en esa sala.");
      return;
    }

    const base = {
      id: crypto.randomUUID(),
      characterId: null,
      color: ENEMY_COLOR,
      x: cell.x,
      y: cell.y,
    };

    if (creature === "custom") {
      if (!enemyName.trim()) return;
      const hp = Math.max(1, parseInt(enemyHp, 10) || 1);
      upsertBoardToken(campaign.id, {
        ...base,
        name: numberedName(enemyName.trim()),
        hp,
        maxHp: hp,
        ac: Math.max(1, parseInt(enemyAc, 10) || 10),
        speed: Math.max(FEET_PER_CELL, parseInt(enemySpeed, 10) || 30),
        loot: "1d6",
        xp: Math.max(0, parseInt(enemyXp, 10) || 0),
      });
      setEnemyName("");
      return;
    }

    const monster = BESTIARY[parseInt(creature, 10)];
    if (!monster) return;
    upsertBoardToken(campaign.id, {
      ...base,
      name: numberedName(monster.name),
      hp: monster.hp,
      maxHp: monster.hp,
      ac: monster.ac,
      speed: monster.speed,
      attacks: monster.attacks,
      abilities: monster.abilities,
      loot: monster.loot,
      xp: monster.xp,
      image: monster.image,
    });
  };

  const myCharacter = characters.find((c) => c.ownerUid === user?.uid);

  /** Salas descubiertas donde todos los enemigos han caído: listas para saquear. */
  const lootableRooms = useMemo(() => {
    if (!map) return [];
    const byRoom = new Map<number, BoardToken[]>();
    for (const token of Object.values(tokens)) {
      if (token.characterId) continue;
      const room = map.rooms.findIndex(
        (r) => token.x >= r.x && token.x < r.x + r.w && token.y >= r.y && token.y < r.y + r.h
      );
      if (room < 0) continue;
      const list = byRoom.get(room) ?? [];
      list.push(token);
      byRoom.set(room, list);
    }
    return [...byRoom.entries()]
      .filter(
        ([room, list]) =>
          list.every((t) => (t.hp ?? 0) <= 0) && (isDM || revealed.has(room))
      )
      .map(([room, bodies]) => ({ room, bodies }));
  }, [tokens, map, revealed, isDM]);

  const handleLoot = async (room: number, bodies: BoardToken[]) => {
    let gold = 0;
    let totalXp = 0;
    for (const body of bodies) {
      const expr = body.loot ?? "0";
      const rolled = rollDice(expr);
      gold += rolled ? rolled.total : Math.max(0, parseInt(expr, 10) || 0);
      totalXp += body.xp ?? 0;
    }
    for (const body of bodies) {
      await removeBoardToken(campaign.id, body.id);
    }
    if (myCharacter && gold > 0) {
      await updateCharacter(myCharacter.id, {
        money: { ...myCharacter.money, gp: myCharacter.money.gp + gold },
      });
    }
    // Los PX se reparten entre todos los personajes de la campaña
    const xpEach = characters.length > 0 ? Math.ceil(totalXp / characters.length) : 0;
    if (xpEach > 0) {
      for (const character of characters) {
        await updateCharacter(character.id, { xp: character.xp + xpEach });
      }
    }
    await appendLog(
      `💰 ${myCharacter?.name || "El máster"} saquea la sala ${room + 1}: ${gold} mo · ${bodies.length} cuerpo${bodies.length !== 1 ? "s" : ""} retirado${bodies.length !== 1 ? "s" : ""}.${xpEach > 0 ? ` ⭐ ${totalXp} PX: +${xpEach} para cada héroe.` : ""}`
    );
    setSelectedId(null);
    setCombat(null);
  };

  const handleRemoveSelected = () => {
    if (!selectedId) return;
    removeBoardToken(campaign.id, selectedId);
    setSelectedId(null);
    setCombat(null);
  };

  /** Daño o cura manual del máster sobre la ficha seleccionada. */
  const applyHpDelta = async (sign: 1 | -1) => {
    if (!selectedToken) return;
    const amount = Math.max(0, parseInt(hpDelta, 10) || 0);
    if (!amount) return;
    const stats = statsOf(selectedToken);
    const cap = stats.maxHp > 0 ? stats.maxHp : Number.MAX_SAFE_INTEGER;
    const next =
      sign > 0 ? Math.min(cap, stats.hp + amount) : Math.max(0, stats.hp - amount);
    const character = characterOf(selectedToken);
    if (character) {
      await updateCharacter(character.id, {
        currentHp: next,
        // Recuperar PG estando a 0 despierta y limpia las salvaciones de muerte
        ...(sign > 0 && stats.hp === 0 && next > 0
          ? { deathSaves: { successes: 0, failures: 0 } }
          : {}),
      });
    } else {
      await setBoardTokenHp(campaign.id, selectedToken.id, next);
    }
    const fallNote =
      sign < 0 && next === 0 && stats.hp > 0
        ? character
          ? ` 😵 ¡${selectedToken.name} cae inconsciente!`
          : ` ☠ ${selectedToken.name} cae.`
        : "";
    await appendLog(
      sign > 0
        ? `✚ ${selectedToken.name} recupera ${amount} PG (${next}${stats.maxHp > 0 ? `/${stats.maxHp}` : ""}).`
        : `💥 ${selectedToken.name} recibe ${amount} de daño (queda a ${next} PG).${fallNote}`
    );
  };

  const toggleCondition = (token: BoardToken, label: string) => {
    const current = token.conditions ?? [];
    const next = current.includes(label)
      ? current.filter((c) => c !== label)
      : [...current, label];
    setBoardTokenConditions(campaign.id, token.id, next);
  };

  const attacker = combat ? (tokens[combat.attackerId] ?? null) : null;
  const target = combat ? (tokens[combat.targetId] ?? null) : null;

  /**
   * Casillas cubiertas por la plantilla de área actual. Esferas y cubos se
   * centran en el cursor; conos y líneas parten de la ficha seleccionada
   * apuntando hacia el cursor.
   */
  const computeAoeCells = (): Set<string> | null => {
    if (aoeShape === "none" || !map || !hoverCell) return null;
    const sizeFeet = Math.max(FEET_PER_CELL, parseInt(aoeSize, 10) || FEET_PER_CELL);
    const sizeCells = sizeFeet / FEET_PER_CELL;
    const [hx, hy] = hoverCell.split(",").map(Number);
    const cells = new Set<string>();
    const add = (x: number, y: number) => {
      if (x >= 0 && y >= 0 && x < map.width && y < map.height) cells.add(`${x},${y}`);
    };

    if (aoeShape === "sphere") {
      const r = Math.ceil(sizeCells);
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.hypot(dx, dy) <= sizeCells + 0.01) add(hx + dx, hy + dy);
        }
      }
    } else if (aoeShape === "cube") {
      const side = Math.max(1, Math.round(sizeCells));
      const start = -Math.floor((side - 1) / 2);
      for (let dy = start; dy < start + side; dy++) {
        for (let dx = start; dx < start + side; dx++) add(hx + dx, hy + dy);
      }
    } else {
      // Cono y línea nacen del lanzador
      if (!selectedToken) return null;
      const ox = selectedToken.x;
      const oy = selectedToken.y;
      const dirX = hx - ox;
      const dirY = hy - oy;
      const dirLen = Math.hypot(dirX, dirY);
      if (dirLen === 0) return null;
      if (aoeShape === "line") {
        for (let step = 1; step <= sizeCells; step++) {
          add(Math.round(ox + (dirX / dirLen) * step), Math.round(oy + (dirY / dirLen) * step));
        }
      } else {
        // Cono 5e: la anchura iguala a la longitud (semiángulo ≈ 26,6°)
        const halfAngle = Math.atan(0.5);
        const r = Math.ceil(sizeCells);
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (!dx && !dy) continue;
            const dist = Math.hypot(dx, dy);
            if (dist > sizeCells + 0.01) continue;
            const dot = (dx * dirX + dy * dirY) / (dist * dirLen);
            if (Math.acos(Math.min(1, Math.max(-1, dot))) <= halfAngle) add(ox + dx, oy + dy);
          }
        }
      }
    }
    return cells;
  };

  const aoeCells = computeAoeCells();
  const aoeAffected = aoeCells
    ? visibleTokens.filter((token) => aoeCells.has(`${token.x},${token.y}`))
    : [];

  const AOE_LABELS: Record<string, string> = {
    sphere: "esfera",
    cube: "cubo",
    cone: "cono",
    line: "línea",
  };

  // Capa de plantillas de área: se repinta al mover el cursor o cambiar la forma
  useEffect(() => {
    const canvas = aoeRef.current;
    if (!canvas || !map) return;
    canvas.width = map.width * CELL;
    canvas.height = map.height * CELL;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!aoeCells) return;
    ctx.fillStyle = "rgba(230, 120, 30, 0.35)";
    ctx.strokeStyle = "rgba(255, 160, 60, 0.7)";
    ctx.lineWidth = 1;
    for (const key of aoeCells) {
      const [x, y] = key.split(",").map(Number);
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      ctx.strokeRect(x * CELL + 0.5, y * CELL + 0.5, CELL - 1, CELL - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, hoverCell, aoeShape, aoeSize, selectedId]);

  /** Distancia en casillas desde la ficha seleccionada hasta el cursor. */
  const hoverDistance = (() => {
    if (!selectedToken || !hoverCell) return null;
    const [hx, hy] = hoverCell.split(",").map(Number);
    const cells = Math.max(Math.abs(selectedToken.x - hx), Math.abs(selectedToken.y - hy));
    return cells > 0 ? cells : null;
  })();

  const handleBoardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!map || (!selectedToken && aoeShape === "none")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL);
    const y = Math.floor((e.clientY - rect.top) / CELL);
    const key = x >= 0 && y >= 0 && x < map.width && y < map.height ? `${x},${y}` : null;
    setHoverCell((prev) => (prev === key ? prev : key));
  };

  return (
    <section className="panel">
      <div className={styles.header}>
        <h2 className="section-title">Tablero</h2>
        {isDM && board && map && (
          <div className={styles.controls}>
            <button
              type="button"
              className="btn btn--sm"
              onClick={handleAddPlayers}
              disabled={characters.length === 0}
            >
              + Fichas de jugadores
            </button>
            <form onSubmit={handleAddEnemy} className={styles.enemyForm}>
              <select
                className={`input ${styles.creatureSelect}`}
                title="Criatura del bestiario"
                value={creature}
                onChange={(e) => setCreature(e.target.value)}
              >
                {BESTIARY.map((monster, i) => (
                  <option key={monster.name} value={i}>
                    {monster.name} · VD {monster.cr} · {monster.hp} PG · CA {monster.ac}
                  </option>
                ))}
                <option value="custom">Personalizado…</option>
              </select>
              {creature === "custom" && (
                <>
                  <input
                    className="input"
                    placeholder="Nombre"
                    value={enemyName}
                    onChange={(e) => setEnemyName(e.target.value)}
                  />
                  <input
                    className={`input ${styles.statInput}`}
                    type="number"
                    min={1}
                    title="Puntos de golpe"
                    placeholder="PG"
                    value={enemyHp}
                    onChange={(e) => setEnemyHp(e.target.value)}
                  />
                  <input
                    className={`input ${styles.statInput}`}
                    type="number"
                    min={1}
                    title="Clase de armadura"
                    placeholder="CA"
                    value={enemyAc}
                    onChange={(e) => setEnemyAc(e.target.value)}
                  />
                  <input
                    className={`input ${styles.statInput}`}
                    type="number"
                    min={5}
                    step={5}
                    title="Velocidad en pies"
                    placeholder="Vel."
                    value={enemySpeed}
                    onChange={(e) => setEnemySpeed(e.target.value)}
                  />
                  <input
                    className={`input ${styles.statInput}`}
                    type="number"
                    min={0}
                    title="PX que reparte al morir"
                    placeholder="PX"
                    value={enemyXp}
                    onChange={(e) => setEnemyXp(e.target.value)}
                  />
                </>
              )}
              <select
                className={`input ${styles.roomSelect}`}
                title="Sala donde aparece"
                value={enemyRoom}
                onChange={(e) => setEnemyRoom(e.target.value)}
              >
                {map.rooms.map((_, i) => (
                  <option key={i} value={i}>
                    Sala {i + 1}
                    {revealed.has(i) ? "" : " 🕶"}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="btn btn--sm"
                disabled={creature === "custom" && !enemyName.trim()}
              >
                + Enemigo
              </button>
            </form>
            <label className={styles.freeMove} title="Sin límite de velocidad, para preparar la escena">
              <input
                type="checkbox"
                checked={freeMove}
                onChange={(e) => setFreeMove(e.target.checked)}
              />
              Mov. libre
            </label>
            {selectedToken && (
              <button type="button" className="btn btn--danger btn--sm" onClick={handleRemoveSelected}>
                Quitar «{selectedToken.name}»
              </button>
            )}
          </div>
        )}
      </div>

      {isDM && board && map && creature !== "custom" && BESTIARY[parseInt(creature, 10)] && (
        <MonsterCard
          key={creature}
          monster={BESTIARY[parseInt(creature, 10)]}
        />
      )}

      {!board || !map ? (
        <p className={styles.empty}>
          {isDM ? (
            <>
              Aún no hay mapa. Crea uno en el{" "}
              <Link href="/map-generator" className={styles.link}>
                generador de mazmorras
              </Link>{" "}
              y envíalo a esta campaña como tablero.
            </>
          ) : (
            "El máster todavía no ha colocado ningún mapa."
          )}
        </p>
      ) : (
        <>
          <p className={styles.hint}>
            {selectedToken
              ? `«${selectedToken.name}» seleccionada — verde: puede llegar · rojo: fuera de su velocidad (${statsOf(selectedToken).speed} pies). Clic en ficha rival para atacar.`
              : "Haz clic en una ficha para seleccionarla; luego en una casilla para moverla o en una ficha rival para atacar."}
            {hoverDistance !== null && (
              <strong className={styles.distance}>
                {" "}
                📏 {hoverDistance} casilla{hoverDistance !== 1 && "s"} ({hoverDistance * FEET_PER_CELL} pies)
              </strong>
            )}
          </p>
          {notice && <p className={styles.notice}>{notice}</p>}

          <div className={styles.aoeBar}>
            <span className={styles.aoeLabel}>Plantilla:</span>
            {(
              [
                ["none", "Ninguna"],
                ["sphere", "◯ Esfera"],
                ["cube", "▢ Cubo"],
                ["cone", "◣ Cono"],
                ["line", "─ Línea"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`${styles.conditionChip} ${aoeShape === value ? styles.conditionOn : ""}`}
                onClick={() => setAoeShape(value)}
              >
                {label}
              </button>
            ))}
            {aoeShape !== "none" && (
              <>
                <input
                  className={`input ${styles.statInput}`}
                  type="number"
                  min={5}
                  step={5}
                  title={aoeShape === "sphere" ? "Radio en pies" : aoeShape === "cube" ? "Lado en pies" : "Longitud en pies"}
                  value={aoeSize}
                  onChange={(e) => setAoeSize(e.target.value)}
                />
                <span className={styles.aoeLabel}>pies</span>
                <span className={styles.aoeInfo}>
                  {(aoeShape === "cone" || aoeShape === "line") && !selectedToken
                    ? "Selecciona la ficha del lanzador para apuntar."
                    : aoeCells
                      ? aoeAffected.length > 0
                        ? `Afecta a: ${aoeAffected.map((t) => t.name).join(", ")} · clic para anunciarlo`
                        : "Nadie en el área · clic para anunciarlo"
                      : "Mueve el cursor sobre el mapa."}
                </span>
              </>
            )}
          </div>

          {selectedToken && (isDM || canMove(selectedToken)) && (
            <div className={styles.tokenTools}>
              <div className={styles.conditionRow}>
                {CONDITIONS.map((cond) => {
                  const active = (selectedToken.conditions ?? []).includes(cond.label);
                  return (
                    <button
                      key={cond.label}
                      type="button"
                      className={`${styles.conditionChip} ${active ? styles.conditionOn : ""}`}
                      onClick={() => toggleCondition(selectedToken, cond.label)}
                    >
                      {cond.emoji} {cond.label}
                    </button>
                  );
                })}
              </div>
              {isDM && (
                <div className={styles.hpAdjust}>
                  <input
                    className={`input ${styles.statInput}`}
                    type="number"
                    min={1}
                    title="Cantidad de PG"
                    value={hpDelta}
                    onChange={(e) => setHpDelta(e.target.value)}
                  />
                  <button type="button" className="btn btn--sm" onClick={() => applyHpDelta(-1)}>
                    💥 Daño
                  </button>
                  <button type="button" className="btn btn--sm" onClick={() => applyHpDelta(1)}>
                    ✚ Curar
                  </button>
                </div>
              )}
            </div>
          )}

          {lootableRooms.length > 0 && (
            <div className={styles.lootRow}>
              {lootableRooms.map(({ room, bodies }) => (
                <button
                  key={room}
                  type="button"
                  className="btn btn--gold btn--sm"
                  onClick={() => handleLoot(room, bodies)}
                >
                  💰 Recoger botín — Sala {room + 1} ({bodies.length} caído
                  {bodies.length !== 1 && "s"})
                </button>
              ))}
            </div>
          )}

          {attacker && target && (
            <AttackPanel
              attacker={attacker}
              target={target}
              attackerCharacter={characterOf(attacker)}
              targetCharacter={characterOf(target)}
              targetStats={statsOf(target)}
              onLog={appendLog}
              onResolve={async (text, damage) => {
                let finalText = text;
                if (damage > 0) {
                  const targetCharacter = characterOf(target);
                  if (targetCharacter) {
                    const newHp = Math.max(0, targetCharacter.currentHp - damage);
                    await updateCharacter(targetCharacter.id, { currentHp: newHp });
                    if (newHp === 0 && targetCharacter.currentHp > 0) {
                      finalText += ` 😵 ¡${target.name} cae inconsciente! Le tocan salvaciones de muerte.`;
                    }
                  } else {
                    const newHp = Math.max(0, (target.hp ?? 0) - damage);
                    await setBoardTokenHp(campaign.id, target.id, newHp);
                    if (newHp === 0 && (target.hp ?? 0) > 0) {
                      finalText += ` ☠ ${target.name} cae.`;
                    }
                  }
                }
                await appendLog(finalText);
                setCombat(null);
                setSelectedId(null);
              }}
              onCancel={() => setCombat(null)}
            />
          )}

          <div className={styles.scroll}>
            <div
              className={styles.boardInner}
              style={{ width: map.width * CELL, height: map.height * CELL }}
              onClick={handleBoardClick}
              onMouseMove={handleBoardMouseMove}
              onMouseLeave={() => setHoverCell(null)}
            >
              <canvas ref={canvasRef} className={styles.canvas} />
              <canvas ref={overlayRef} className={styles.canvas} />
              <canvas ref={aoeRef} className={styles.canvas} />
              {visibleTokens.map((token) => {
                const stats = statsOf(token);
                const down = stats.maxHp > 0 && stats.hp <= 0;
                // Los enemigos a 0 PG mueren; los personajes caen inconscientes
                const dead = down && !token.characterId;
                const unconscious = down && Boolean(token.characterId);
                const hidden = isDM && hiddenFromPlayers(token);
                // Retrato: avatar del personaje (jugadores) o ilustración del bestiario
                const portrait = characterOf(token)?.avatar || token.image;
                const conditions = token.conditions ?? [];
                return (
                  <div
                    key={token.id}
                    className={[
                      styles.token,
                      selectedId === token.id ? styles.tokenSelected : "",
                      activeTokenId === token.id && !down ? styles.tokenActive : "",
                      canMove(token) ? styles.tokenMovable : "",
                      down ? styles.tokenDead : "",
                      hidden ? styles.tokenHidden : "",
                    ].join(" ")}
                    style={{
                      left: token.x * CELL,
                      top: token.y * CELL,
                      background: portrait
                        ? `${token.color} url(${portrait}) center / cover`
                        : token.color,
                    }}
                    title={`${token.name}${stats.maxHp > 0 ? ` · ${stats.hp}/${stats.maxHp} PG · CA ${stats.ac} · ${stats.speed} pies` : ""}${unconscious ? " · 😵 inconsciente: salvaciones de muerte en su ficha" : ""}${conditions.length > 0 ? ` · ${conditions.join(", ")}` : ""}${hidden ? " · 🕶 oculto para los jugadores" : ""}`}
                  >
                    {dead ? "✕" : unconscious ? "😵" : portrait ? "" : initials(token.name)}
                    {stats.maxHp > 0 && !down && (
                      <span
                        className={styles.hpBar}
                        style={{ width: `${Math.max(0, Math.min(100, (stats.hp / stats.maxHp) * 100))}%` }}
                      />
                    )}
                    {conditions.length > 0 && !dead && (
                      <span className={styles.tokenConditions}>
                        {conditions.slice(0, 3).map(conditionEmoji).join("")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {log.length > 0 && (
            <div className={styles.log}>
              <div className={styles.logHeader}>
                <h3 className={styles.logTitle}>Registro de combate</h3>
                {isDM && (
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => clearBoardLog(campaign.id)}
                  >
                    🗑 Vaciar registro
                  </button>
                )}
              </div>
              <ul className={styles.logList}>
                {log.map((entry) => (
                  <li key={entry.id} className={styles.logEntry}>
                    <span className={styles.logTime}>
                      {new Date(entry.timestamp).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className={styles.logText}>{entry.text}</span>
                    {isDM && (
                      <button
                        type="button"
                        className={styles.logDelete}
                        title="Eliminar esta entrada"
                        onClick={() => removeBoardLogEntry(campaign.id, log, entry.id)}
                      >
                        ✕
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ---------- Panel de ataque ----------

const SAVE_LABELS: Record<AbilityKey, string> = {
  str: "FUE",
  dex: "DES",
  con: "CON",
  int: "INT",
  wis: "SAB",
  cha: "CAR",
};

const SAVE_KEYS: Record<string, AbilityKey> = {
  FUE: "str",
  DES: "dex",
  CON: "con",
  INT: "int",
  SAB: "wis",
  CAR: "cha",
};

type RollMode = "normal" | "adv" | "dis";

interface AttackPanelProps {
  attacker: BoardToken;
  target: BoardToken;
  attackerCharacter: Character | undefined;
  targetCharacter: Character | undefined;
  targetStats: { hp: number; maxHp: number; ac: number };
  onResolve: (logText: string, damage: number) => Promise<void>;
  /** Anota en el registro sin cerrar el panel (tiradas de habilidades). */
  onLog: (text: string) => Promise<void>;
  onCancel: () => void;
}

function AttackPanel({
  attacker,
  target,
  attackerCharacter,
  targetCharacter,
  targetStats,
  onResolve,
  onLog,
  onCancel,
}: AttackPanelProps) {
  const [customBonus, setCustomBonus] = useState("4");
  const [customDamage, setCustomDamage] = useState("1d6+2");
  const [customRange, setCustomRange] = useState(String(FEET_PER_CELL));
  const [mode, setMode] = useState<RollMode>("normal");
  const [saveAbility, setSaveAbility] = useState<AbilityKey>("dex");
  const [saveDc, setSaveDc] = useState("12");
  const [saveDamage, setSaveDamage] = useState("");
  const [halfOnSave, setHalfOnSave] = useState(true);
  const [busy, setBusy] = useState(false);

  const distance = Math.max(Math.abs(attacker.x - target.x), Math.abs(attacker.y - target.y));
  const distanceFeet = distance * FEET_PER_CELL;
  // Alcance declarado > alcance real del conjuro homónimo > deducción por
  // nombre de arma (arcos, ballestas…) > cuerpo a cuerpo
  const rangeOf = (attack: Attack): number =>
    attack.range ??
    spellRangeFor(attack.name) ??
    inferAttackRange(attack.name) ??
    FEET_PER_CELL;
  const inRange = (attack: Attack): boolean => distanceFeet <= rangeOf(attack);
  // Los personajes atacan con su hoja; los monstruos del bestiario, con los suyos
  const attacks = (attackerCharacter?.attacks ?? attacker.attacks ?? []).filter((a) =>
    a.name.trim()
  );
  const abilities = attackerCharacter ? [] : (attacker.abilities ?? []);

  /** Tira los dados que mencione la habilidad y lo anota, sin cerrar el panel. */
  const rollAbility = async (ability: string, expr: string) => {
    setBusy(true);
    try {
      const rolled = rollDice(expr);
      if (!rolled) return;
      const name = ability.split(/[:—]/)[0].trim();
      await onLog(
        `✧ ${attacker.name} usa ${name}: 🎲 ${expr} = ${rolled.total} [${rolled.rolls.join(", ")}]`
      );
    } finally {
      setBusy(false);
    }
  };

  const executeAttack = async (name: string, bonusText: string, damageExpr: string) => {
    setBusy(true);
    try {
      const bonus = parseInt(bonusText.replace(/\s/g, ""), 10) || 0;
      // Convención del bestiario: bono ≥ 90 = impacta siempre (p. ej. Proyectil mágico)
      const autoHit = bonus >= 90;
      const roll1 = 1 + Math.floor(Math.random() * 20);
      const roll2 = 1 + Math.floor(Math.random() * 20);
      const d20 =
        mode === "adv" ? Math.max(roll1, roll2) : mode === "dis" ? Math.min(roll1, roll2) : roll1;
      const total = d20 + bonus;
      const crit = !autoHit && d20 === 20;
      const fumble = !autoHit && d20 === 1;
      const hit = autoHit || crit || (!fumble && total >= targetStats.ac);

      let damage = 0;
      let damageDetail = "";
      if (hit) {
        const rolled = rollDice(damageExpr);
        const base = rolled ? rolled.total : Math.max(0, parseInt(damageExpr, 10) || 0);
        damage = Math.max(1, crit ? base * 2 : base);
        damageDetail = ` → ${damage} de daño (${damageExpr}${crit ? " ×2 ¡CRÍTICO!" : ""})`;
      }

      const modeDetail =
        mode === "adv"
          ? ` con ventaja [${roll1}, ${roll2}]`
          : mode === "dis"
            ? ` con desventaja [${roll1}, ${roll2}]`
            : "";
      const text = autoHit
        ? `⚔ ${attacker.name} lanza ${name} contra ${target.name}: impacto automático${damageDetail}`
        : `⚔ ${attacker.name} ataca a ${target.name} con ${name}${modeDetail}: 🎲${d20}${
            bonus ? `${bonus >= 0 ? "+" : ""}${bonus}` : ""
          } = ${total} vs CA ${targetStats.ac} · ${
            hit ? "IMPACTO" : fumble ? "PIFIA" : "fallo"
          }${damageDetail}`;

      await onResolve(text, damage);
    } finally {
      setBusy(false);
    }
  };

  /**
   * El atacante fuerza una salvación al objetivo (Bola de fuego, veneno…).
   * Los personajes tiran con su bono real; los monstruos, un d20.
   */
  const executeSave = async () => {
    setBusy(true);
    try {
      const dc = Math.max(1, parseInt(saveDc, 10) || 10);
      const bonus = targetCharacter ? savingThrowBonus(targetCharacter, saveAbility) : 0;
      const d20 = 1 + Math.floor(Math.random() * 20);
      const total = d20 + bonus;
      const success = total >= dc;

      let damage = 0;
      let detail = "";
      const expr = saveDamage.trim();
      if (expr) {
        const rolled = rollDice(expr);
        const base = rolled ? rolled.total : Math.max(0, parseInt(expr, 10) || 0);
        damage = success ? (halfOnSave ? Math.floor(base / 2) : 0) : base;
        detail =
          damage > 0
            ? ` → ${damage} de daño (${expr}${success && halfOnSave ? ", mitad" : ""})`
            : ` → sin daño`;
      }

      const text = `🛡 ${attacker.name} fuerza una salvación de ${SAVE_LABELS[saveAbility]} CD ${dc} a ${target.name}: 🎲${d20}${
        bonus ? formatModifier(bonus) : ""
      } = ${total} · ${success ? "SUPERA" : "falla"}${detail}`;
      await onResolve(text, damage);
    } finally {
      setBusy(false);
    }
  };

  // CD mencionadas en ataques y habilidades ("CON CD 11 mitad"), para rellenar de un clic
  const saveHints: Array<{ ability: AbilityKey; dc: number; damage?: string }> = [];
  {
    const seen = new Set<string>();
    const sources = [
      ...attacks.map((attack) => `${attack.type} ${attack.damage}`),
      ...abilities,
    ];
    for (const text of sources) {
      const match = text.match(/\b(FUE|DES|CON|INT|SAB|CAR)\s*CD\s*(\d+)/i);
      if (!match) continue;
      const ability = SAVE_KEYS[match[1].toUpperCase()];
      const dc = parseInt(match[2], 10);
      const key = `${ability}-${dc}`;
      if (!ability || seen.has(key)) continue;
      seen.add(key);
      const dice = text.match(/\d{0,3}d\d{1,4}(?:\s*[+-]\s*\d{1,4})?/i)?.[0];
      saveHints.push({ ability, dc, damage: dice });
    }
  }

  return (
    <div className={styles.attackPanel}>
      <div className={styles.attackHeader}>
        <span className={styles.attackTitle}>
          {attacker.image && (
            <Image
              src={attacker.image}
              alt={attacker.name}
              width={40}
              height={40}
              className={styles.attackPortrait}
            />
          )}
          ⚔ <strong>{attacker.name}</strong> ataca a <strong>{target.name}</strong>
          <em className={styles.attackMeta}>
            {" "}
            · CA {targetStats.ac} · {targetStats.hp}/{targetStats.maxHp} PG · a {distance} casilla
            {distance !== 1 && "s"} ({distanceFeet} pies)
          </em>
        </span>
        <button type="button" className="btn btn--sm" onClick={onCancel}>
          Cancelar
        </button>
      </div>

      <div className={styles.modeRow}>
        {(
          [
            ["dis", "Desventaja"],
            ["normal", "Normal"],
            ["adv", "Ventaja"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`${styles.conditionChip} ${mode === value ? styles.conditionOn : ""}`}
            onClick={() => setMode(value)}
          >
            {value === "adv" ? "▲ " : value === "dis" ? "▼ " : ""}
            {label}
          </button>
        ))}
      </div>

      {abilities.length > 0 && (
        <ul className={styles.abilityList}>
          {abilities.map((ability) => {
            // Si la habilidad menciona dados (p. ej. "Curar heridas — 1d8+3"), se puede tirar
            const dice = ability.match(/\d{0,3}d\d{1,4}(?:\s*[+-]\s*\d{1,4})?/i)?.[0];
            return (
              <li key={ability} className={styles.abilityRow}>
                <span>✧ {ability}</span>
                {dice && (
                  <button
                    type="button"
                    className="btn btn--sm"
                    disabled={busy}
                    title="Tirar los dados de la habilidad y anotarlo en el registro"
                    onClick={() => rollAbility(ability, dice)}
                  >
                    🎲 {dice}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {attacks.length > 0 ? (
        <ul className={styles.attackList}>
          {attacks.map((attack) => {
            const reachesTarget = inRange(attack);
            return (
              <li key={attack.id} className={styles.attackRow}>
                <span className={styles.attackName}>{attack.name}</span>
                <span className={styles.attackMeta}>
                  {attack.bonus || "+0"} · {attack.damage || "1"} {attack.type} ·{" "}
                  {rangeOf(attack) > FEET_PER_CELL
                    ? `alcance ${rangeOf(attack)} pies`
                    : "cuerpo a cuerpo"}
                </span>
                <button
                  type="button"
                  className="btn btn--gold btn--sm"
                  disabled={busy || !reachesTarget}
                  title={
                    reachesTarget
                      ? undefined
                      : `Fuera de alcance: el objetivo está a ${distanceFeet} pies y este ataque llega a ${rangeOf(attack)}.`
                  }
                  onClick={() =>
                    executeAttack(attack.name, attack.bonus, attack.damage || "1")
                  }
                >
                  {reachesTarget ? "🎲 Tirar" : "✕ Sin alcance"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <form
          className={styles.customAttack}
          onSubmit={(e) => {
            e.preventDefault();
            executeAttack(attacker.name, customBonus, customDamage);
          }}
        >
          <label>
            <span className="field-label">Bono de ataque</span>
            <input
              className={`input ${styles.statInput}`}
              value={customBonus}
              onChange={(e) => setCustomBonus(e.target.value)}
            />
          </label>
          <label>
            <span className="field-label">Daño</span>
            <input
              className={`input ${styles.statInput}`}
              value={customDamage}
              onChange={(e) => setCustomDamage(e.target.value)}
              placeholder="1d6+2"
            />
          </label>
          <label>
            <span className="field-label">Alcance (pies)</span>
            <input
              className={`input ${styles.statInput}`}
              type="number"
              min={FEET_PER_CELL}
              step={FEET_PER_CELL}
              value={customRange}
              onChange={(e) => setCustomRange(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="btn btn--gold btn--sm"
            disabled={
              busy || distanceFeet > (parseInt(customRange, 10) || FEET_PER_CELL)
            }
            title={
              distanceFeet > (parseInt(customRange, 10) || FEET_PER_CELL)
                ? `Fuera de alcance: el objetivo está a ${distanceFeet} pies.`
                : undefined
            }
          >
            {distanceFeet > (parseInt(customRange, 10) || FEET_PER_CELL)
              ? "✕ Sin alcance"
              : "🎲 Tirar"}
          </button>
        </form>
      )}

      <div className={styles.savePanel}>
        <span className={styles.saveTitle}>
          🛡 Forzar salvación a {target.name}
          {targetCharacter && (
            <em className={styles.attackMeta}>
              {" "}
              (tira con su bono: {SAVE_LABELS[saveAbility]}{" "}
              {formatModifier(savingThrowBonus(targetCharacter, saveAbility))})
            </em>
          )}
        </span>
        {saveHints.length > 0 && (
          <div className={styles.saveHints}>
            {saveHints.map((hint) => (
              <button
                key={`${hint.ability}-${hint.dc}`}
                type="button"
                className={styles.conditionChip}
                title="Rellenar con la CD de este ataque"
                onClick={() => {
                  setSaveAbility(hint.ability);
                  setSaveDc(String(hint.dc));
                  if (hint.damage) setSaveDamage(hint.damage);
                }}
              >
                {SAVE_LABELS[hint.ability]} CD {hint.dc}
                {hint.damage ? ` · ${hint.damage}` : ""}
              </button>
            ))}
          </div>
        )}
        <div className={styles.saveForm}>
          <select
            className={`input ${styles.saveSelect}`}
            title="Característica de la salvación"
            value={saveAbility}
            onChange={(e) => setSaveAbility(e.target.value as AbilityKey)}
          >
            {(Object.keys(SAVE_LABELS) as AbilityKey[]).map((key) => (
              <option key={key} value={key}>
                {SAVE_LABELS[key]}
              </option>
            ))}
          </select>
          <label className={styles.saveField}>
            <span className="field-label">CD</span>
            <input
              className={`input ${styles.statInput}`}
              type="number"
              min={1}
              value={saveDc}
              onChange={(e) => setSaveDc(e.target.value)}
            />
          </label>
          <label className={styles.saveField}>
            <span className="field-label">Daño</span>
            <input
              className={`input ${styles.statInput}`}
              placeholder="8d6"
              value={saveDamage}
              onChange={(e) => setSaveDamage(e.target.value)}
            />
          </label>
          <label className={styles.saveHalf} title="Si supera la salvación recibe la mitad del daño; si no, nada">
            <input
              type="checkbox"
              checked={halfOnSave}
              onChange={(e) => setHalfOnSave(e.target.checked)}
            />
            mitad si supera
          </label>
          <button type="button" className="btn btn--sm" disabled={busy} onClick={executeSave}>
            🎲 Salvación
          </button>
        </div>
      </div>
    </div>
  );
}

/** Tarjeta de vista previa de la criatura seleccionada en el bestiario. */
function MonsterCard({ monster }: { monster: MonsterDef }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className={styles.monsterCard}>
      {!imgError ? (
        <Image
          src={monster.image}
          alt={monster.name}
          width={110}
          height={110}
          className={styles.monsterImg}
          onError={() => setImgError(true)}
        />
      ) : (
        <span className={styles.monsterEmoji}>{monster.emoji}</span>
      )}
      <div className={styles.monsterInfo}>
        <h3 className={styles.monsterName}>{monster.name}</h3>
        <p className={styles.monsterStats}>
          ⚔ VD {monster.cr} ({monster.xp} PX) · ❤ {monster.hp} PG · 🛡 CA {monster.ac} · 👣 {monster.speed} pies · 💰 {monster.loot === "0" ? "sin botín" : `${monster.loot} mo`}
        </p>
        <ul className={styles.monsterList}>
          {monster.attacks.map((attack) => (
            <li key={attack.id}>
              ⚔ {attack.name} {attack.bonus} ({attack.damage} {attack.type}
              {attack.range ? ` · ${attack.range} pies` : ""})
            </li>
          ))}
          {monster.abilities.map((ability) => (
            <li key={ability}>✧ {ability}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

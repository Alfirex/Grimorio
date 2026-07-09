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
import { sortedCombatants } from "./InitiativeTracker";
import type { Attack, BoardToken, Campaign, Character } from "@/types";
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [combat, setCombat] = useState<CombatState | null>(null);
  const [notice, setNotice] = useState("");
  const [freeMove, setFreeMove] = useState(false);
  const [creature, setCreature] = useState("0"); // índice del bestiario o "custom"
  const [hpDelta, setHpDelta] = useState("5");
  const [enemyName, setEnemyName] = useState("");
  const [enemyHp, setEnemyHp] = useState("7");
  const [enemyAc, setEnemyAc] = useState("13");
  const [enemySpeed, setEnemySpeed] = useState("30");
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
    for (const body of bodies) {
      const expr = body.loot ?? "0";
      const rolled = rollDice(expr);
      gold += rolled ? rolled.total : Math.max(0, parseInt(expr, 10) || 0);
    }
    for (const body of bodies) {
      await removeBoardToken(campaign.id, body.id);
    }
    if (myCharacter && gold > 0) {
      await updateCharacter(myCharacter.id, {
        money: { ...myCharacter.money, gp: myCharacter.money.gp + gold },
      });
    }
    await appendLog(
      `💰 ${myCharacter?.name || "El máster"} saquea la sala ${room + 1}: ${gold} mo · ${bodies.length} cuerpo${bodies.length !== 1 ? "s" : ""} retirado${bodies.length !== 1 ? "s" : ""}.`
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
    if (character) await updateCharacter(character.id, { currentHp: next });
    else await setBoardTokenHp(campaign.id, selectedToken.id, next);
    await appendLog(
      sign > 0
        ? `✚ ${selectedToken.name} recupera ${amount} PG (${next}${stats.maxHp > 0 ? `/${stats.maxHp}` : ""}).`
        : `💥 ${selectedToken.name} recibe ${amount} de daño (queda a ${next} PG).`
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
                    {monster.name} · {monster.hp} PG · CA {monster.ac}
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
          </p>
          {notice && <p className={styles.notice}>{notice}</p>}

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
              targetStats={statsOf(target)}
              onLog={appendLog}
              onResolve={async (text, damage) => {
                if (damage > 0) {
                  const targetCharacter = characterOf(target);
                  if (targetCharacter) {
                    await updateCharacter(targetCharacter.id, {
                      currentHp: Math.max(0, targetCharacter.currentHp - damage),
                    });
                  } else {
                    await setBoardTokenHp(
                      campaign.id,
                      target.id,
                      Math.max(0, (target.hp ?? 0) - damage)
                    );
                  }
                }
                await appendLog(text);
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
            >
              <canvas ref={canvasRef} className={styles.canvas} />
              <canvas ref={overlayRef} className={styles.canvas} />
              {visibleTokens.map((token) => {
                const stats = statsOf(token);
                const dead = stats.maxHp > 0 && stats.hp <= 0;
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
                      activeTokenId === token.id && !dead ? styles.tokenActive : "",
                      canMove(token) ? styles.tokenMovable : "",
                      dead ? styles.tokenDead : "",
                      hidden ? styles.tokenHidden : "",
                    ].join(" ")}
                    style={{
                      left: token.x * CELL,
                      top: token.y * CELL,
                      background: portrait
                        ? `${token.color} url(${portrait}) center / cover`
                        : token.color,
                    }}
                    title={`${token.name}${stats.maxHp > 0 ? ` · ${stats.hp}/${stats.maxHp} PG · CA ${stats.ac} · ${stats.speed} pies` : ""}${conditions.length > 0 ? ` · ${conditions.join(", ")}` : ""}${hidden ? " · 🕶 oculto para los jugadores" : ""}`}
                  >
                    {dead ? "✕" : portrait ? "" : initials(token.name)}
                    {stats.maxHp > 0 && !dead && (
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

interface AttackPanelProps {
  attacker: BoardToken;
  target: BoardToken;
  attackerCharacter: Character | undefined;
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
  targetStats,
  onResolve,
  onLog,
  onCancel,
}: AttackPanelProps) {
  const [customBonus, setCustomBonus] = useState("4");
  const [customDamage, setCustomDamage] = useState("1d6+2");
  const [customRange, setCustomRange] = useState(String(FEET_PER_CELL));
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
      const d20 = 1 + Math.floor(Math.random() * 20);
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

      const text = autoHit
        ? `⚔ ${attacker.name} lanza ${name} contra ${target.name}: impacto automático${damageDetail}`
        : `⚔ ${attacker.name} ataca a ${target.name} con ${name}: 🎲${d20}${
            bonus ? `${bonus >= 0 ? "+" : ""}${bonus}` : ""
          } = ${total} vs CA ${targetStats.ac} · ${
            hit ? "IMPACTO" : fumble ? "PIFIA" : "fallo"
          }${damageDetail}`;

      await onResolve(text, damage);
    } finally {
      setBusy(false);
    }
  };

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
          ❤ {monster.hp} PG · 🛡 CA {monster.ac} · 👣 {monster.speed} pies · 💰 {monster.loot === "0" ? "sin botín" : `${monster.loot} mo`}
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

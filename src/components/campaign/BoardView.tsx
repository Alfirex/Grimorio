"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { generateDungeon, type DungeonMap } from "@/utils/mapgen";
import { renderDungeon } from "@/utils/renderDungeon";
import { moveBoardToken, removeBoardToken, upsertBoardToken } from "@/lib/db";
import type { BoardToken, Campaign, Character } from "@/types";
import styles from "./BoardView.module.scss";

const CELL = 32;

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

export function BoardView({ campaign, characters, isDM }: BoardViewProps) {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [enemyName, setEnemyName] = useState("");

  const board = campaign.board ?? null;
  const tokens = useMemo(() => campaign.tokens ?? {}, [campaign.tokens]);
  const tokenList = Object.values(tokens);

  // Regenerar la mazmorra es determinista y barato: misma semilla → mismo mapa
  const map = useMemo<DungeonMap | null>(() => (board ? generateDungeon(board) : null), [board]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && map) renderDungeon(canvas, map, CELL);
  }, [map]);

  const selectedToken = selectedId ? (tokens[selectedId] ?? null) : null;

  const canMove = (token: BoardToken): boolean => {
    if (isDM) return true;
    if (!token.characterId) return false;
    const character = characters.find((c) => c.id === token.characterId);
    return character?.ownerUid === user?.uid;
  };

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!map) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL);
    const y = Math.floor((e.clientY - rect.top) / CELL);
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return;

    const clicked = tokenList.find((t) => t.x === x && t.y === y);
    if (clicked && canMove(clicked)) {
      setSelectedId((prev) => (prev === clicked.id ? null : clicked.id));
      return;
    }
    if (selectedId && !clicked && map.grid[y][x] !== "wall") {
      moveBoardToken(campaign.id, selectedId, x, y);
      setSelectedId(null);
    }
  };

  /** Encuentra celdas de suelo libres para colocar fichas nuevas. */
  const findFreeCells = (count: number, taken: BoardToken[]): Array<{ x: number; y: number }> => {
    if (!map) return [];
    const occupied = new Set(taken.map((t) => `${t.x},${t.y}`));
    const cells: Array<{ x: number; y: number }> = [];
    outer: for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (map.grid[y][x] === "floor" && !occupied.has(`${x},${y}`)) {
          cells.push({ x, y });
          occupied.add(`${x},${y}`);
          if (cells.length >= count) break outer;
        }
      }
    }
    return cells;
  };

  const handleAddPlayers = () => {
    const missing = characters.filter(
      (c) => !tokenList.some((t) => t.characterId === c.id)
    );
    const cells = findFreeCells(missing.length, tokenList);
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
    });
  };

  const handleAddEnemy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enemyName.trim()) return;
    const [cell] = findFreeCells(1, tokenList);
    if (!cell) return;
    upsertBoardToken(campaign.id, {
      id: crypto.randomUUID(),
      characterId: null,
      name: enemyName.trim(),
      color: ENEMY_COLOR,
      x: cell.x,
      y: cell.y,
    });
    setEnemyName("");
  };

  const handleRemoveSelected = () => {
    if (!selectedId) return;
    removeBoardToken(campaign.id, selectedId);
    setSelectedId(null);
  };

  return (
    <section className="panel">
      <div className={styles.header}>
        <h2 className="section-title">Tablero</h2>
        {isDM && board && (
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
              <input
                className="input"
                placeholder="Goblin, Dragón…"
                value={enemyName}
                onChange={(e) => setEnemyName(e.target.value)}
              />
              <button type="submit" className="btn btn--sm" disabled={!enemyName.trim()}>
                + Enemigo
              </button>
            </form>
            {selectedToken && (
              <button type="button" className="btn btn--danger btn--sm" onClick={handleRemoveSelected}>
                Quitar «{selectedToken.name}»
              </button>
            )}
          </div>
        )}
      </div>

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
              ? `«${selectedToken.name}» seleccionada — haz clic en una casilla para moverla.`
              : isDM
                ? "Haz clic en una ficha para seleccionarla y luego en una casilla para moverla."
                : "Haz clic en tu ficha y luego en una casilla para moverla."}
          </p>
          <div className={styles.scroll}>
            <div
              className={styles.boardInner}
              style={{ width: map.width * CELL, height: map.height * CELL }}
              onClick={handleBoardClick}
            >
              <canvas ref={canvasRef} className={styles.canvas} />
              {tokenList.map((token) => (
                <div
                  key={token.id}
                  className={[
                    styles.token,
                    selectedId === token.id ? styles.tokenSelected : "",
                    canMove(token) ? styles.tokenMovable : "",
                  ].join(" ")}
                  style={{ left: token.x * CELL, top: token.y * CELL, background: token.color }}
                  title={token.name}
                >
                  {initials(token.name)}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
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

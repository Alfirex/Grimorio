"use client";

import { useState } from "react";
import type { BoardToken, Character, Combatant } from "@/types";
import styles from "./InitiativeTracker.module.scss";

interface InitiativeTrackerProps {
  characters: Character[];
  /** Fichas enemigas del tablero, para importarlas al encuentro. */
  enemyTokens?: BoardToken[];
}

/**
 * Rastreador de iniciativa para el máster. Es una herramienta de sesión:
 * el estado vive en memoria y se reinicia al recargar la página.
 */
export function InitiativeTracker({ characters, enemyTokens = [] }: InitiativeTrackerProps) {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [name, setName] = useState("");
  const [initiative, setInitiative] = useState("");
  const [hp, setHp] = useState("");

  const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);

  const addCombatant = (combatant: Combatant) => {
    setCombatants((prev) => [...prev, combatant]);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCombatant({
      id: crypto.randomUUID(),
      name: name.trim(),
      initiative: parseInt(initiative, 10) || 0,
      hp: parseInt(hp, 10) || 0,
      maxHp: parseInt(hp, 10) || 0,
      isPlayer: false,
    });
    setName("");
    setInitiative("");
    setHp("");
  };

  const importPlayers = () => {
    const existing = new Set(combatants.map((c) => c.id));
    characters
      .filter((character) => !existing.has(character.id))
      .forEach((character) =>
        addCombatant({
          id: character.id,
          name: character.name || "Sin nombre",
          initiative: 0,
          hp: character.currentHp,
          maxHp: character.maxHp,
          isPlayer: true,
        })
      );
  };

  const importEnemies = () => {
    const existing = new Set(combatants.map((c) => c.id));
    enemyTokens
      .filter((token) => !existing.has(token.id) && (token.hp ?? 0) > 0)
      .forEach((token) =>
        addCombatant({
          id: token.id,
          name: token.name,
          // El máster tira la iniciativa de sus monstruos: d20 al importar
          initiative: 1 + Math.floor(Math.random() * 20),
          hp: token.hp ?? 0,
          maxHp: token.maxHp ?? token.hp ?? 0,
          isPlayer: false,
        })
      );
  };

  const updateCombatant = (id: string, patch: Partial<Combatant>) => {
    setCombatants((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeCombatant = (id: string) => {
    setCombatants((prev) => prev.filter((c) => c.id !== id));
    setTurnIndex(0);
  };

  const nextTurn = () => {
    if (sorted.length === 0) return;
    const next = (turnIndex + 1) % sorted.length;
    if (next === 0) setRound((r) => r + 1);
    setTurnIndex(next);
  };

  const reset = () => {
    setCombatants([]);
    setTurnIndex(0);
    setRound(1);
  };

  return (
    <div className="panel">
      <div className={styles.topRow}>
        <span className={styles.round}>Ronda {round}</span>
        <div className={styles.topActions}>
          <button
            type="button"
            className="btn btn--sm"
            onClick={importPlayers}
            disabled={characters.length === 0}
          >
            + Jugadores
          </button>
          <button
            type="button"
            className="btn btn--sm"
            onClick={importEnemies}
            disabled={enemyTokens.filter((t) => (t.hp ?? 0) > 0).length === 0}
            title="Importa los enemigos vivos del tablero y tira su iniciativa (d20)"
          >
            + Enemigos
          </button>
          <button
            type="button"
            className="btn btn--gold btn--sm"
            onClick={nextTurn}
            disabled={sorted.length === 0}
          >
            Siguiente turno ➤
          </button>
          <button type="button" className="btn btn--danger btn--sm" onClick={reset}>
            Reiniciar
          </button>
        </div>
      </div>

      <form onSubmit={handleAdd} className={styles.addRow}>
        <input
          className="input"
          placeholder="Goblin, Dragón…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={`input ${styles.numInput}`}
          type="number"
          placeholder="Inic."
          value={initiative}
          onChange={(e) => setInitiative(e.target.value)}
        />
        <input
          className={`input ${styles.numInput}`}
          type="number"
          placeholder="PG"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
        />
        <button type="submit" className="btn btn--sm" disabled={!name.trim()}>
          +
        </button>
      </form>

      {sorted.length === 0 ? (
        <p className={styles.empty}>Añade combatientes para empezar el encuentro.</p>
      ) : (
        <ul className={styles.list}>
          {sorted.map((combatant, index) => (
            <li
              key={combatant.id}
              className={`${styles.row} ${index === turnIndex ? styles.active : ""}`}
            >
              <span className={styles.turnMarker}>{index === turnIndex ? "➤" : ""}</span>
              <input
                className={`input ${styles.numInput}`}
                type="number"
                title="Iniciativa"
                value={combatant.initiative}
                onChange={(e) =>
                  updateCombatant(combatant.id, {
                    initiative: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
              <span className={styles.name}>
                {combatant.name}
                {combatant.isPlayer && <span className="badge"> PJ</span>}
              </span>
              <div className={styles.hpGroup}>
                <input
                  className={`input ${styles.numInput}`}
                  type="number"
                  title="Puntos de golpe"
                  value={combatant.hp}
                  onChange={(e) =>
                    updateCombatant(combatant.id, { hp: parseInt(e.target.value, 10) || 0 })
                  }
                />
                <span className={styles.maxHp}>/ {combatant.maxHp}</span>
              </div>
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => removeCombatant(combatant.id)}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

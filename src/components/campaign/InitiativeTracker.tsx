"use client";

import { useMemo, useState } from "react";
import { appendBoardLog, setCampaignEncounter } from "@/lib/db";
import { generateDungeon } from "@/utils/mapgen";
import { initiativeTotal } from "@/utils/character";
import type { BoardToken, Campaign, Character, Combatant, Encounter } from "@/types";
import styles from "./InitiativeTracker.module.scss";

interface InitiativeTrackerProps {
  campaign: Campaign;
  characters: Character[];
  isDM: boolean;
}

const d20 = () => 1 + Math.floor(Math.random() * 20);

/** Ordena por iniciativa descendente; el índice de turno apunta a este orden. */
export function sortedCombatants(encounter: Encounter): Combatant[] {
  return [...encounter.combatants].sort((a, b) => b.initiative - a.initiative);
}

/**
 * Rastreador de iniciativa compartido: vive en la campaña, lo gestiona el
 * máster y todos los jugadores ven el orden de turnos en tiempo real.
 */
export function InitiativeTracker({ campaign, characters, isDM }: InitiativeTrackerProps) {
  const [name, setName] = useState("");
  const [initiative, setInitiative] = useState("");

  const encounter = campaign.encounter ?? null;
  const tokens = Object.values(campaign.tokens ?? {});
  const sorted = encounter ? sortedCombatants(encounter) : [];

  // Mismo criterio que la niebla de guerra del tablero: los enemigos de salas
  // sin descubrir no entran en la iniciativa (delatarían la emboscada)
  const map = useMemo(
    () => (campaign.board ? generateDungeon(campaign.board) : null),
    [campaign.board]
  );
  const hiddenFromPlayers = (token: BoardToken): boolean => {
    if (!map) return false;
    const room = map.rooms.findIndex(
      (r) => token.x >= r.x && token.x < r.x + r.w && token.y >= r.y && token.y < r.y + r.h
    );
    return room >= 0 && !(campaign.revealedRooms ?? []).includes(room);
  };

  const save = (next: Encounter | null) => setCampaignEncounter(campaign.id, next);
  const log = (text: string) => appendBoardLog(campaign.id, campaign.boardLog ?? [], text);

  /** PG en vivo del combatiente: personaje (jugadores) o ficha (enemigos). */
  const hpOf = (combatant: Combatant): string => {
    const character = characters.find((c) => c.id === combatant.id);
    if (character) return `${character.currentHp}/${character.maxHp}`;
    const token = tokens.find((t) => t.id === combatant.id);
    return token?.maxHp ? `${token.hp ?? 0}/${token.maxHp}` : "—";
  };

  /** Caído: enemigo muerto o personaje inconsciente (se muestra tachado). */
  const isDown = (combatant: Combatant): boolean => {
    const character = characters.find((c) => c.id === combatant.id);
    if (character) return character.currentHp <= 0;
    const token = tokens.find((t) => t.id === combatant.id);
    return Boolean(token?.maxHp) && (token?.hp ?? 0) <= 0;
  };

  const handleStart = async () => {
    // Jugadores con su bono real; los enemigos vivos del tablero con d20
    const players: Combatant[] = characters.map((character) => ({
      id: character.id,
      name: character.name || "PJ",
      initiative: d20() + initiativeTotal(character),
      isPlayer: true,
    }));
    const enemies: Combatant[] = tokens
      .filter(
        (token) =>
          token.characterId === null && (token.hp ?? 0) > 0 && !hiddenFromPlayers(token)
      )
      .map((token) => ({
        id: token.id,
        name: token.name,
        initiative: d20(),
        isPlayer: false,
      }));
    const combatants = [...players, ...enemies];
    if (combatants.length === 0) return;
    await save({ combatants, turnIndex: 0, round: 1 });
    const order = [...combatants]
      .sort((a, b) => b.initiative - a.initiative)
      .map((c) => `${c.name} (${c.initiative})`)
      .join(" → ");
    await log(`⚔ ¡Empieza el combate! Orden: ${order}`);
  };

  const handleEnd = async () => {
    await save(null);
    await log("🕊 El combate termina.");
  };

  const handleNextTurn = () => {
    if (!encounter || sorted.length === 0) return;
    const next = (encounter.turnIndex + 1) % sorted.length;
    save({
      ...encounter,
      turnIndex: next,
      round: next === 0 ? encounter.round + 1 : encounter.round,
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!encounter || !name.trim()) return;
    save({
      ...encounter,
      combatants: [
        ...encounter.combatants,
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          initiative: parseInt(initiative, 10) || d20(),
          isPlayer: false,
        },
      ],
    });
    setName("");
    setInitiative("");
  };

  const handleRemove = (id: string) => {
    if (!encounter) return;
    const combatants = encounter.combatants.filter((c) => c.id !== id);
    save({
      ...encounter,
      combatants,
      turnIndex: Math.min(encounter.turnIndex, Math.max(0, combatants.length - 1)),
    });
  };

  const handleInitiativeChange = (id: string, value: number) => {
    if (!encounter) return;
    save({
      ...encounter,
      combatants: encounter.combatants.map((c) =>
        c.id === id ? { ...c, initiative: value } : c
      ),
    });
  };

  if (!encounter) {
    return (
      <div className="panel">
        {isDM ? (
          <>
            <p className={styles.empty}>
              No hay ningún combate en curso. Al iniciarlo se tira la iniciativa de todos:
              los personajes con su bono y los enemigos vivos del tablero con un d20.
            </p>
            <button
              type="button"
              className="btn btn--gold btn--sm"
              onClick={handleStart}
              disabled={characters.length === 0 && tokens.length === 0}
            >
              ⚔ Iniciar combate
            </button>
          </>
        ) : (
          <p className={styles.empty}>No hay ningún combate en curso.</p>
        )}
      </div>
    );
  }

  return (
    <div className="panel">
      <div className={styles.topRow}>
        <span className={styles.round}>Ronda {encounter.round}</span>
        {isDM && (
          <div className={styles.topActions}>
            <button
              type="button"
              className="btn btn--gold btn--sm"
              onClick={handleNextTurn}
              disabled={sorted.length === 0}
            >
              Siguiente turno ➤
            </button>
            <button type="button" className="btn btn--danger btn--sm" onClick={handleEnd}>
              Terminar combate
            </button>
          </div>
        )}
      </div>

      {isDM && (
        <form onSubmit={handleAdd} className={styles.addRow}>
          <input
            className="input"
            placeholder="Refuerzo sorpresa…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={`input ${styles.numInput}`}
            type="number"
            placeholder="Inic."
            title="Iniciativa (vacío = d20)"
            value={initiative}
            onChange={(e) => setInitiative(e.target.value)}
          />
          <button type="submit" className="btn btn--sm" disabled={!name.trim()}>
            +
          </button>
        </form>
      )}

      <ul className={styles.list}>
        {sorted.map((combatant, index) => (
          <li
            key={combatant.id}
            className={`${styles.row} ${index === encounter.turnIndex ? styles.active : ""} ${
              isDown(combatant) ? styles.down : ""
            }`}
          >
            <span className={styles.turnMarker}>
              {index === encounter.turnIndex ? "➤" : ""}
            </span>
            {isDM ? (
              <input
                className={`input ${styles.numInput}`}
                type="number"
                title="Iniciativa"
                value={combatant.initiative}
                onChange={(e) =>
                  handleInitiativeChange(combatant.id, parseInt(e.target.value, 10) || 0)
                }
              />
            ) : (
              <span className={styles.initiative}>{combatant.initiative}</span>
            )}
            <span className={styles.name}>
              {combatant.name}
              {combatant.isPlayer && <span className="badge"> PJ</span>}
            </span>
            <span className={styles.maxHp}>❤ {hpOf(combatant)}</span>
            {isDM && (
              <button
                type="button"
                className="btn btn--danger btn--sm"
                onClick={() => handleRemove(combatant.id)}
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

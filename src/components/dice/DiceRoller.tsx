"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { appendBoardLogById } from "@/lib/db";
import { rollDice } from "@/utils/dice";
import type { DiceRollResult } from "@/types";
import styles from "./DiceRoller.module.scss";

const QUICK_DICE = ["d4", "d6", "d8", "d10", "d12", "d20", "d100"];
const MAX_HISTORY = 20;

export function DiceRoller() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState("1d20");
  const [error, setError] = useState("");
  const [share, setShare] = useState(false);
  const [history, setHistory] = useState<DiceRollResult[]>([]);

  // Dentro de una campaña, las tiradas pueden anunciarse a toda la mesa
  const campaignId = pathname?.match(/^\/campaigns\/([^/]+)/)?.[1] ?? null;

  const roll = (expr: string) => {
    const result = rollDice(expr);
    if (!result) {
      setError("Expresión no válida. Ejemplos: 1d20, 2d6+3, 4d8-1");
      return;
    }
    setError("");
    setHistory((prev) => [result, ...prev].slice(0, MAX_HISTORY));
    if (share && campaignId) {
      const who = user?.displayName?.split(" ")[0] ?? "Alguien";
      const mod =
        result.modifier !== 0
          ? ` ${result.modifier > 0 ? "+" : "−"} ${Math.abs(result.modifier)}`
          : "";
      appendBoardLogById(
        campaignId,
        `🎲 ${who} tira ${result.expression}: [${result.rolls.join(", ")}]${mod} = ${result.total}`
      ).catch(() => setError("No se pudo anunciar la tirada."));
    }
  };

  return (
    <div className={`${styles.container} no-print`}>
      {open && (
        <div className={styles.panel}>
          <h3 className={styles.title}>Tirador de dados</h3>

          <div className={styles.quickRow}>
            {QUICK_DICE.map((die) => (
              <button
                key={die}
                type="button"
                className={styles.quickDie}
                onClick={() => roll(`1${die}`)}
              >
                {die}
              </button>
            ))}
          </div>

          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              roll(expression);
            }}
          >
            <input
              className="input"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="2d6+3"
              aria-label="Expresión de dados"
            />
            <button type="submit" className="btn btn--gold btn--sm">
              Tirar
            </button>
          </form>

          {error && <p className="error-text">{error}</p>}

          {campaignId && (
            <label className={styles.shareRow}>
              <input
                type="checkbox"
                checked={share}
                onChange={(e) => setShare(e.target.checked)}
              />
              Anunciar en el registro de la campaña
            </label>
          )}

          <ul className={styles.history}>
            {history.map((entry) => (
              <li key={entry.id} className={styles.historyItem}>
                <span className={styles.historyExpr}>{entry.expression}</span>
                <span className={styles.historyRolls}>
                  [{entry.rolls.join(", ")}]
                  {entry.modifier !== 0 &&
                    ` ${entry.modifier > 0 ? "+" : "−"} ${Math.abs(entry.modifier)}`}
                </span>
                <span className={styles.historyTotal}>{entry.total}</span>
              </li>
            ))}
            {history.length === 0 && <li className={styles.empty}>Sin tiradas todavía</li>}
          </ul>
        </div>
      )}

      <button
        type="button"
        className={styles.fab}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar tirador de dados" : "Abrir tirador de dados"}
      >
        🎲
      </button>
    </div>
  );
}

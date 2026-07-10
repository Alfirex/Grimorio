"use client";

import { useState } from "react";
import { addJournalEntry, removeJournalEntry } from "@/lib/db";
import type { Campaign } from "@/types";
import styles from "./CampaignJournal.module.scss";

/**
 * Diario de campaña: crónica de sesiones que escribe el máster y leen todos.
 * Útil para el "¿dónde lo dejamos?" al empezar cada sesión.
 */
export function CampaignJournal({ campaign, isDM }: { campaign: Campaign; isDM: boolean }) {
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const journal = campaign.journal ?? [];

  if (!isDM && journal.length === 0) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await addJournalEntry(campaign.id, journal, draft.trim());
      setDraft("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <h2 className={styles.heading}>Diario de campaña</h2>
      <div className="panel">
        {isDM && (
          <form onSubmit={handleAdd} className={styles.form}>
            <textarea
              className="input"
              rows={3}
              placeholder="Crónica de la sesión: qué pasó, pistas encontradas, deudas pendientes…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn--gold btn--sm"
              disabled={busy || !draft.trim()}
            >
              ✒ Anotar
            </button>
          </form>
        )}

        {journal.length === 0 ? (
          <p className={styles.empty}>El diario está en blanco. La historia aún no ha empezado…</p>
        ) : (
          <ul className={styles.list}>
            {journal.map((entry) => (
              <li key={entry.id} className={styles.entry}>
                <div className={styles.entryHeader}>
                  <span className={styles.date}>
                    {new Date(entry.timestamp).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  {isDM && (
                    <button
                      type="button"
                      className={styles.delete}
                      title="Eliminar entrada"
                      onClick={() => removeJournalEntry(campaign.id, journal, entry.id)}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <p className={styles.text}>{entry.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

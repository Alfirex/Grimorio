"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { addCharacterNote, deleteCharacterNote, subscribeCharacterNotes } from "@/lib/db";
import type { CharacterNote, NoteVisibility } from "@/types";
import styles from "./NotesPanel.module.scss";

interface NotesPanelProps {
  characterId: string;
  isOwner: boolean;
  isDM: boolean;
}

export function NotesPanel({ characterId, isOwner, isDM }: NotesPanelProps) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<CharacterNote[]>([]);
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<NoteVisibility>("dm");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isDM && !isOwner) return;
    // El jugador solo puede pedir las notas compartidas (las reglas bloquean el resto)
    return subscribeCharacterNotes(characterId, !isDM, setNotes);
  }, [characterId, isDM, isOwner]);

  if (!isDM && !isOwner) return null;

  const visibleNotes = notes;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    setBusy(true);
    try {
      await addCharacterNote(
        characterId,
        user.uid,
        user.displayName ?? "Máster",
        text.trim(),
        visibility
      );
      setText("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel no-print">
      <h2 className="section-title">Notas del máster</h2>

      {isDM && (
        <form onSubmit={handleAdd} className={styles.form}>
          <textarea
            className="input"
            rows={3}
            maxLength={3000}
            placeholder="Escribe una nota sobre este personaje…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className={styles.formActions}>
            <label className={styles.visibility}>
              <input
                type="checkbox"
                checked={visibility === "shared"}
                onChange={(e) => setVisibility(e.target.checked ? "shared" : "dm")}
              />
              Visible para el jugador
            </label>
            <button type="submit" className="btn btn--gold btn--sm" disabled={busy || !text.trim()}>
              Añadir nota
            </button>
          </div>
        </form>
      )}

      {visibleNotes.length === 0 ? (
        <p className={styles.empty}>
          {isDM ? "Todavía no has dejado notas en esta ficha." : "El máster no ha dejado notas visibles."}
        </p>
      ) : (
        <ul className={styles.list}>
          {visibleNotes.map((note) => (
            <li key={note.id} className={styles.note}>
              <div className={styles.noteHeader}>
                <span className={styles.noteAuthor}>{note.authorName}</span>
                <span className={note.visibility === "shared" ? "badge" : "badge badge--red"}>
                  {note.visibility === "shared" ? "Visible" : "Privada"}
                </span>
                <time className={styles.noteDate}>
                  {new Date(note.createdAt).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
                {isDM && user?.uid === note.authorUid && (
                  <button
                    type="button"
                    className="btn btn--danger btn--sm"
                    onClick={() => deleteCharacterNote(characterId, note.id)}
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className={styles.noteText}>{note.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

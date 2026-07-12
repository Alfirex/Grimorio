"use client";

import { useEffect, useState } from "react";
import {
  addHandout,
  deleteHandout,
  setHandoutRevealed,
  subscribeHandouts,
} from "@/lib/db";
import { fileToHandout } from "@/utils/image";
import type { Handout } from "@/types";
import styles from "./HandoutsPanel.module.scss";

/**
 * Handouts del máster: retratos de PNJ, cartas, mapas de región… Se suben
 * ocultos y se revelan cuando toca; los jugadores solo ven los revelados.
 */
export function HandoutsPanel({ campaignId, isDM }: { campaignId: string; isDM: boolean }) {
  const [handouts, setHandouts] = useState<Handout[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  useEffect(
    () => subscribeHandouts(campaignId, isDM, setHandouts),
    [campaignId, isDM]
  );

  // Derivado: si el máster oculta lo que un jugador está mirando, se cierra solo
  const viewing = viewingId ? (handouts.find((h) => h.id === viewingId) ?? null) : null;

  if (!isDM && handouts.length === 0) return null;

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    if (handouts.length >= 30) {
      setError("Límite de 30 láminas por campaña: borra alguna antes de subir más.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const image = await fileToHandout(file);
      await addHandout(campaignId, title.trim() || file.name.replace(/\.\w+$/, ""), image);
      setTitle("");
    } catch {
      setError("No se pudo procesar esa imagen (¿demasiado grande?).");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <h2 className={styles.heading}>Documentos y láminas</h2>
      <div className="panel">
        {isDM && (
          <div className={styles.uploadRow}>
            <input
              className="input"
              placeholder="Título: Retrato del barón, Mapa de la región…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <label className="btn btn--sm">
              {busy ? "Procesando…" : "📎 Subir imagen"}
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  handleUpload(file);
                }}
              />
            </label>
          </div>
        )}
        {error && <p className="error-text">{error}</p>}
        {isDM && handouts.length > 0 && (
          <p className={styles.hint}>
            Se suben ocultos: usa 👁 para revelarlos a los jugadores.
          </p>
        )}

        {handouts.length === 0 ? (
          <p className={styles.empty}>
            {isDM
              ? "Sube retratos, cartas o mapas para enseñárselos a los jugadores cuando toque."
              : "El máster todavía no ha revelado ningún documento."}
          </p>
        ) : (
          <div className={styles.gallery}>
            {handouts.map((handout) => (
              <figure key={handout.id} className={styles.card}>
                {/* eslint-disable-next-line @next/next/no-img-element -- data-URL local */}
                <img
                  src={handout.image}
                  alt={handout.title}
                  className={`${styles.thumb} ${!handout.revealed ? styles.thumbHidden : ""}`}
                  onClick={() => setViewingId(handout.id)}
                />
                <figcaption className={styles.caption}>
                  <span className={styles.title}>
                    {!handout.revealed && "🕶 "}
                    {handout.title}
                  </span>
                  {isDM && (
                    <span className={styles.actions}>
                      <button
                        type="button"
                        className="btn btn--sm"
                        title={handout.revealed ? "Ocultar a los jugadores" : "Revelar a los jugadores"}
                        onClick={() =>
                          setHandoutRevealed(campaignId, handout.id, !handout.revealed)
                        }
                      >
                        {handout.revealed ? "🕶 Ocultar" : "👁 Revelar"}
                      </button>
                      <button
                        type="button"
                        className="btn btn--danger btn--sm"
                        onClick={() => deleteHandout(campaignId, handout.id)}
                      >
                        ✕
                      </button>
                    </span>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>

      {viewing && (
        <div className={styles.lightbox} onClick={() => setViewingId(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element -- data-URL local */}
          <img src={viewing.image} alt={viewing.title} className={styles.lightboxImg} />
          <p className={styles.lightboxTitle}>{viewing.title} · clic para cerrar</p>
        </div>
      )}
    </section>
  );
}

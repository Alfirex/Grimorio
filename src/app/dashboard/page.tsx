"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  createCampaign,
  createCharacter,
  joinCampaignByCode,
  subscribeMyCampaigns,
  subscribeMyCharacters,
} from "@/lib/db";
import { levelForXp } from "@/data/dnd5e";
import { createBlankCharacter, sanitizeImportedCharacter } from "@/utils/character";
import type { Campaign, Character } from "@/types";
import styles from "./page.module.scss";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsubChars = subscribeMyCharacters(user.uid, setCharacters);
    const unsubCamps = subscribeMyCampaigns(user.uid, setCampaigns);
    return () => {
      unsubChars();
      unsubCamps();
    };
  }, [user]);

  const handleNewCharacter = async () => {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const id = await createCharacter(
        createBlankCharacter(user.uid, user.displayName ?? "Aventurero")
      );
      router.push(`/characters/${id}`);
    } catch {
      setError("No se pudo crear el personaje.");
      setBusy(false);
    }
  };

  /** Importa un personaje exportado como JSON, saneando campos protegidos. */
  const handleImportCharacter = async (file: File | undefined) => {
    if (!user || !file) return;
    setBusy(true);
    setError("");
    try {
      if (file.size > 1_000_000) throw new Error("demasiado grande");
      const parsed = JSON.parse(await file.text());
      const blank = createBlankCharacter(user.uid, user.displayName ?? "Aventurero");
      // Valida tipo a tipo: campos desconocidos fuera, números en rango,
      // textos acotados y nunca datos de cuenta o campaña
      const id = await createCharacter(sanitizeImportedCharacter(parsed, blank));
      router.push(`/characters/${id}`);
    } catch {
      setError("Ese archivo no parece un personaje exportado válido.");
      setBusy(false);
    }
  };

  return (
    <div className={styles.grid}>
      <section>
        <div className={styles.sectionHeader}>
          <h2 className={styles.heading}>Mis personajes</h2>
          <div className={styles.headerActions}>
            <label className="btn btn--sm" title="Importa un personaje exportado como JSON">
              ⬆ Importar
              <input
                type="file"
                accept="application/json,.json"
                hidden
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  handleImportCharacter(file);
                }}
              />
            </label>
            <button
              type="button"
              className="btn btn--gold btn--sm"
              onClick={handleNewCharacter}
              disabled={busy}
            >
              + Nuevo personaje
            </button>
          </div>
        </div>

        {characters.length === 0 ? (
          <p className={styles.empty}>
            Aún no tienes personajes. ¡Crea tu primer héroe y que comience la aventura!
          </p>
        ) : (
          <div className={styles.cards}>
            {characters.map((character) => (
              <Link
                key={character.id}
                href={`/characters/${character.id}`}
                className={`panel panel--interactive ${styles.charCard}`}
              >
                <div className={styles.charName}>
                  {character.name || "Sin nombre"}
                  {character.level < 20 && levelForXp(character.xp) > character.level && (
                    <span className="badge" title="PX suficientes para subir de nivel">
                      ⬆ Nivel {character.level + 1}
                    </span>
                  )}
                </div>
                <div className={styles.charMeta}>
                  {character.race} · {character.characterClass} nivel {character.level}
                </div>
                <div className={styles.charHp}>
                  ❤ {character.currentHp}/{character.maxHp} PG · CA {character.armorClass}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className={styles.heading}>Mis campañas</h2>
        <CampaignForms onError={setError} />

        {campaigns.length === 0 ? (
          <p className={styles.empty}>
            No estás en ninguna campaña. Crea una como máster o únete con un código.
          </p>
        ) : (
          <div className={styles.cards}>
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className={`panel panel--interactive ${styles.campCard}`}
              >
                <div className={styles.campHeader}>
                  <span className={styles.charName}>{campaign.name}</span>
                  {campaign.dmUid === user?.uid && <span className="badge">Máster</span>}
                </div>
                <div className={styles.charMeta}>
                  DM: {campaign.dmName} · {campaign.memberUids.length} miembro
                  {campaign.memberUids.length !== 1 && "s"}
                </div>
              </Link>
            ))}
          </div>
        )}
        {error && <p className="error-text">{error}</p>}
      </section>
    </div>
  );
}

function CampaignForms({ onError }: { onError: (message: string) => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const [campaignName, setCampaignName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !campaignName.trim()) return;
    setBusy(true);
    onError("");
    try {
      const id = await createCampaign(
        campaignName.trim(),
        "",
        user.uid,
        user.displayName ?? "Máster"
      );
      router.push(`/campaigns/${id}`);
    } catch {
      onError("No se pudo crear la campaña.");
      setBusy(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !joinCode.trim()) return;
    setBusy(true);
    onError("");
    try {
      const campaign = await joinCampaignByCode(joinCode, user.uid);
      router.push(`/campaigns/${campaign.id}`);
    } catch (err) {
      onError(err instanceof Error ? err.message : "No se pudo unir a la campaña.");
      setBusy(false);
    }
  };

  return (
    <div className={styles.forms}>
      <form onSubmit={handleCreate} className={styles.formRow}>
        <input
          className="input"
          placeholder="Nombre de la nueva campaña"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
        />
        <button type="submit" className="btn btn--sm" disabled={busy || !campaignName.trim()}>
          Crear
        </button>
      </form>
      <form onSubmit={handleJoin} className={styles.formRow}>
        <input
          className="input"
          placeholder="Código de invitación (p. ej. K7KQ2N)"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          maxLength={6}
        />
        <button type="submit" className="btn btn--sm" disabled={busy || !joinCode.trim()}>
          Unirse
        </button>
      </form>
    </div>
  );
}

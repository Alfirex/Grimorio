"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { deleteCampaign, subscribeCampaign, subscribeCampaignCharacters } from "@/lib/db";
import { BoardView } from "@/components/campaign/BoardView";
import { InitiativeTracker } from "@/components/campaign/InitiativeTracker";
import { passivePerception } from "@/utils/character";
import type { Campaign, Character } from "@/types";
import styles from "./page.module.scss";

export default function CampaignPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireAuth>
      <CampaignView campaignId={params.id} />
    </RequireAuth>
  );
}

function CampaignView({ campaignId }: { campaignId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null | undefined>(undefined);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubCampaign = subscribeCampaign(campaignId, setCampaign);
    const unsubChars = subscribeCampaignCharacters(campaignId, setCharacters);
    return () => {
      unsubCampaign();
      unsubChars();
    };
  }, [campaignId]);

  if (campaign === undefined) return <p className={styles.info}>Consultando los archivos…</p>;
  if (campaign === null) return <p className={styles.info}>Esta campaña ya no existe.</p>;
  if (!user) return null;

  const isDM = campaign.dmUid === user.uid;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(campaign.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar la campaña "${campaign.name}"? Los personajes no se borran.`))
      return;
    await deleteCampaign(campaignId);
    router.replace("/dashboard");
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{campaign.name}</h1>
          <p className={styles.meta}>
            Máster: {campaign.dmName} · {campaign.memberUids.length} miembro
            {campaign.memberUids.length !== 1 && "s"} · {characters.length} personaje
            {characters.length !== 1 && "s"}
          </p>
        </div>
        {isDM && (
          <div className={styles.headerActions}>
            <button type="button" className="btn" onClick={handleCopyCode}>
              {copied ? "¡Copiado!" : `Código: ${campaign.inviteCode} 📋`}
            </button>
            <button type="button" className="btn btn--danger btn--sm" onClick={handleDelete}>
              Eliminar campaña
            </button>
          </div>
        )}
      </header>

      {isDM && (
        <p className={styles.dmHint}>
          Comparte el código <strong>{campaign.inviteCode}</strong> con tus jugadores. Al unirse,
          podrán asignar su personaje a esta campaña desde su ficha.
        </p>
      )}

      <BoardView campaign={campaign} characters={characters} isDM={isDM} />

      <div className={styles.columns}>
        <section>
          <h2 className={styles.sectionHeading}>Personajes de la partida</h2>
          {characters.length === 0 ? (
            <p className={styles.empty}>
              Todavía no hay personajes asignados a esta campaña.
            </p>
          ) : (
            <div className={styles.cards}>
              {characters.map((character) => (
                <Link
                  key={character.id}
                  href={`/characters/${character.id}`}
                  className={`panel panel--interactive ${styles.charCard}`}
                >
                  <div className={styles.charTop}>
                    <span className={styles.charName}>{character.name || "Sin nombre"}</span>
                    {character.ownerUid === user.uid && <span className="badge">Tuyo</span>}
                  </div>
                  <div className={styles.charMeta}>
                    {character.race} · {character.characterClass} nivel {character.level} ·
                    jugado por {character.ownerName}
                  </div>
                  <div className={styles.charStats}>
                    ❤ {character.currentHp}/{character.maxHp} · CA {character.armorClass} ·
                    Percepción pasiva {passivePerception(character)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {isDM && (
          <section>
            <h2 className={styles.sectionHeading}>Iniciativa</h2>
            <InitiativeTracker
              characters={characters}
              enemyTokens={Object.values(campaign.tokens ?? {}).filter(
                (token) => token.characterId === null
              )}
            />
          </section>
        )}
      </div>
    </div>
  );
}

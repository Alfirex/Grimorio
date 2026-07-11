"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  deleteCampaign,
  subscribeCampaign,
  subscribeCampaignCharacters,
  updateCharacter,
} from "@/lib/db";
import { BoardView } from "@/components/campaign/BoardView";
import { CampaignJournal } from "@/components/campaign/CampaignJournal";
import { HandoutsPanel } from "@/components/campaign/HandoutsPanel";
import { InitiativeTracker, sortedCombatants } from "@/components/campaign/InitiativeTracker";
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

  // Combatiente activo del encuentro; avisa cuando le toca a un personaje tuyo
  const activeCombatant = campaign?.encounter
    ? sortedCombatants(campaign.encounter)[campaign.encounter.turnIndex]
    : null;
  const myTurnCharacter = activeCombatant
    ? characters.find(
        (c) => c.id === activeCombatant.id && c.ownerUid === user?.uid
      )
    : null;
  const myTurn = Boolean(myTurnCharacter);

  // Con la pestaña en segundo plano, el título avisa de que te toca actuar
  useEffect(() => {
    document.title = myTurn
      ? "⚔ ¡Tu turno! — Grimorio"
      : "Grimorio — Gestor de partidas de D&D";
    return () => {
      document.title = "Grimorio — Gestor de partidas de D&D";
    };
  }, [myTurn]);

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

      <details className={styles.help}>
        <summary>❓ Cómo se juega</summary>
        <ul>
          <li>
            <strong>Mover:</strong> clic en tu ficha y luego en una casilla (o flechas del
            teclado). Verde = a tu alcance; las puertas 🚪 se abren con tu ficha al lado.
          </li>
          <li>
            <strong>Atacar:</strong> con tu ficha seleccionada, clic en un enemigo. Elige
            ataque (respetando su alcance), ventaja/desventaja, o fuerza una salvación.
          </li>
          <li>
            <strong>Conjuros de área:</strong> activa una plantilla (esfera, cono…), apunta
            con el cursor y resuélvela: salvación y daño a todos los afectados.
          </li>
          <li>
            <strong>Estados y PG:</strong> selecciona una ficha para marcar condiciones;
            el máster puede curar o dañar a mano. A 0 PG, los héroes caen inconscientes:
            salvaciones de muerte en su ficha.
          </li>
          <li>
            <strong>Botín y PX:</strong> con la sala limpia, «Recoger botín» reparte el oro
            al saqueador y los PX entre todo el grupo. La ficha avisa al subir de nivel.
          </li>
          <li>
            <strong>Turnos:</strong> el máster inicia el combate en «Iniciativa»; la ficha
            activa brilla en dorado y la página avisa cuando te toca.
          </li>
        </ul>
      </details>

      {myTurnCharacter && (
        <p className={styles.yourTurn}>
          ⚔ ¡Es tu turno, <strong>{myTurnCharacter.name || "héroe"}</strong>! (ronda{" "}
          {campaign.encounter?.round})
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
                  {isDM && character.ownerUid !== user.uid && (
                    <button
                      type="button"
                      className={`btn btn--danger btn--sm ${styles.kickBtn}`}
                      title="Sacar el personaje de la campaña (no lo borra)"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (
                          window.confirm(
                            `¿Sacar a ${character.name || "este personaje"} de la campaña? La ficha no se borra.`
                          )
                        ) {
                          updateCharacter(character.id, { campaignId: null });
                        }
                      }}
                    >
                      Sacar de la campaña
                    </button>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className={styles.sectionHeading}>Iniciativa</h2>
          <InitiativeTracker campaign={campaign} characters={characters} isDM={isDM} />
        </section>
      </div>

      <HandoutsPanel campaignId={campaign.id} isDM={isDM} />

      <CampaignJournal campaign={campaign} isDM={isDM} />
    </div>
  );
}

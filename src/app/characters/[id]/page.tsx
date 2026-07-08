"use client";

import { useParams } from "next/navigation";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { CharacterSheet } from "@/components/character/CharacterSheet";

export default function CharacterPage() {
  const params = useParams<{ id: string }>();

  return (
    <RequireAuth>
      <CharacterSheet characterId={params.id} />
    </RequireAuth>
  );
}

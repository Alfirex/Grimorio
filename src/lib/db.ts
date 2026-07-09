import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type {
  BoardConfig,
  BoardLogEntry,
  BoardToken,
  Campaign,
  Character,
  CharacterNote,
  Encounter,
  NoteVisibility,
} from "@/types";

type Unsubscribe = () => void;

// ---------- Personajes ----------

export async function createCharacter(data: Omit<Character, "id">): Promise<string> {
  const ref = await addDoc(collection(getDb(), "characters"), data);
  return ref.id;
}

export async function updateCharacter(
  id: string,
  data: Partial<Omit<Character, "id">>
): Promise<void> {
  await updateDoc(doc(getDb(), "characters", id), { ...data, updatedAt: Date.now() });
}

export async function deleteCharacter(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), "characters", id));
}

export function subscribeMyCharacters(
  uid: string,
  callback: (characters: Character[]) => void
): Unsubscribe {
  const q = query(collection(getDb(), "characters"), where("ownerUid", "==", uid));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Character));
  });
}

export function subscribeCharacter(
  id: string,
  callback: (character: Character | null) => void
): Unsubscribe {
  return onSnapshot(doc(getDb(), "characters", id), (snapshot) => {
    callback(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Character) : null);
  });
}

export function subscribeCampaignCharacters(
  campaignId: string,
  callback: (characters: Character[]) => void
): Unsubscribe {
  const q = query(collection(getDb(), "characters"), where("campaignId", "==", campaignId));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Character));
  });
}

// ---------- Notas del máster ----------

export async function addCharacterNote(
  characterId: string,
  authorUid: string,
  authorName: string,
  text: string,
  visibility: NoteVisibility
): Promise<void> {
  await addDoc(collection(getDb(), "characters", characterId, "notes"), {
    authorUid,
    authorName,
    text,
    visibility,
    createdAt: Date.now(),
  });
}

export async function deleteCharacterNote(characterId: string, noteId: string): Promise<void> {
  await deleteDoc(doc(getDb(), "characters", characterId, "notes", noteId));
}

/**
 * Suscripción a las notas de una ficha. Con `onlyShared` la consulta pide solo
 * las notas visibles, que es lo único que las reglas de Firestore permiten
 * leer al dueño del personaje; el máster recibe todas.
 */
export function subscribeCharacterNotes(
  characterId: string,
  onlyShared: boolean,
  callback: (notes: CharacterNote[]) => void
): Unsubscribe {
  const notesRef = collection(getDb(), "characters", characterId, "notes");
  const q = onlyShared ? query(notesRef, where("visibility", "==", "shared")) : query(notesRef);
  return onSnapshot(q, (snapshot) => {
    const notes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as CharacterNote);
    callback(notes.sort((a, b) => b.createdAt - a.createdAt));
  });
}

// ---------- Campañas ----------

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function createCampaign(
  name: string,
  description: string,
  dmUid: string,
  dmName: string
): Promise<string> {
  const campaign: Omit<Campaign, "id"> = {
    name,
    description,
    dmUid,
    dmName,
    inviteCode: generateInviteCode(),
    memberUids: [dmUid],
    createdAt: Date.now(),
  };
  const ref = await addDoc(collection(getDb(), "campaigns"), campaign);
  return ref.id;
}

export async function joinCampaignByCode(code: string, uid: string): Promise<Campaign> {
  const q = query(
    collection(getDb(), "campaigns"),
    where("inviteCode", "==", code.trim().toUpperCase()),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    throw new Error("No existe ninguna campaña con ese código de invitación.");
  }
  const campaignDoc = snapshot.docs[0];
  await updateDoc(campaignDoc.ref, { memberUids: arrayUnion(uid) });
  return { id: campaignDoc.id, ...campaignDoc.data() } as Campaign;
}

export function subscribeMyCampaigns(
  uid: string,
  callback: (campaigns: Campaign[]) => void
): Unsubscribe {
  const q = query(collection(getDb(), "campaigns"), where("memberUids", "array-contains", uid));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Campaign));
  });
}

export function subscribeCampaign(
  id: string,
  callback: (campaign: Campaign | null) => void
): Unsubscribe {
  return onSnapshot(doc(getDb(), "campaigns", id), (snapshot) => {
    callback(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Campaign) : null);
  });
}

export async function deleteCampaign(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), "campaigns", id));
}

export async function assignCharacterToCampaign(
  characterId: string,
  campaignId: string | null
): Promise<void> {
  await updateCharacter(characterId, { campaignId });
}

// ---------- Tablero ----------

/** Coloca un mapa nuevo como tablero de la campaña (reinicia fichas y niebla). */
export async function setCampaignBoard(campaignId: string, board: BoardConfig): Promise<void> {
  await updateDoc(doc(getDb(), "campaigns", campaignId), {
    board,
    tokens: {},
    revealedRooms: [],
    boardLog: [],
  });
}

/** Marca una sala como descubierta por los jugadores. */
export async function revealBoardRoom(campaignId: string, roomIndex: number): Promise<void> {
  await updateDoc(doc(getDb(), "campaigns", campaignId), {
    revealedRooms: arrayUnion(roomIndex),
  });
}

export async function upsertBoardToken(campaignId: string, token: BoardToken): Promise<void> {
  await updateDoc(doc(getDb(), "campaigns", campaignId), { [`tokens.${token.id}`]: token });
}

/** Mueve solo las coordenadas para no pisar otros cambios concurrentes. */
export async function moveBoardToken(
  campaignId: string,
  tokenId: string,
  x: number,
  y: number
): Promise<void> {
  await updateDoc(doc(getDb(), "campaigns", campaignId), {
    [`tokens.${tokenId}.x`]: x,
    [`tokens.${tokenId}.y`]: y,
  });
}

export async function removeBoardToken(campaignId: string, tokenId: string): Promise<void> {
  await updateDoc(doc(getDb(), "campaigns", campaignId), {
    [`tokens.${tokenId}`]: deleteField(),
  });
}

/** Ajusta los PG de una ficha enemiga (las de jugador usan su personaje). */
export async function setBoardTokenHp(
  campaignId: string,
  tokenId: string,
  hp: number
): Promise<void> {
  await updateDoc(doc(getDb(), "campaigns", campaignId), {
    [`tokens.${tokenId}.hp`]: hp,
  });
}

const MAX_BOARD_LOG = 50;

/** Añade una entrada al registro de combate, manteniéndolo acotado. */
export async function appendBoardLog(
  campaignId: string,
  currentLog: BoardLogEntry[],
  text: string
): Promise<void> {
  const entry: BoardLogEntry = { id: crypto.randomUUID(), text, timestamp: Date.now() };
  await updateDoc(doc(getDb(), "campaigns", campaignId), {
    boardLog: [entry, ...currentLog].slice(0, MAX_BOARD_LOG),
  });
}

/** Marca los estados de una ficha (Envenenado, Derribado…). */
export async function setBoardTokenConditions(
  campaignId: string,
  tokenId: string,
  conditions: string[]
): Promise<void> {
  await updateDoc(doc(getDb(), "campaigns", campaignId), {
    [`tokens.${tokenId}.conditions`]: conditions,
  });
}

/** Publica (o termina, con null) el encuentro compartido de la campaña. */
export async function setCampaignEncounter(
  campaignId: string,
  encounter: Encounter | null
): Promise<void> {
  await updateDoc(doc(getDb(), "campaigns", campaignId), { encounter });
}

/** Elimina una entrada concreta del registro de combate. */
export async function removeBoardLogEntry(
  campaignId: string,
  currentLog: BoardLogEntry[],
  entryId: string
): Promise<void> {
  await updateDoc(doc(getDb(), "campaigns", campaignId), {
    boardLog: currentLog.filter((entry) => entry.id !== entryId),
  });
}

/** Vacía el registro de combate por completo. */
export async function clearBoardLog(campaignId: string): Promise<void> {
  await updateDoc(doc(getDb(), "campaigns", campaignId), { boardLog: [] });
}

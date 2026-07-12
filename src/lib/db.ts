import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
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
  EncounterPreset,
  Handout,
  JournalEntry,
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

/** Elige un código que no esté ya ocupado por otra campaña. */
async function reserveInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode();
    const existing = await getDoc(doc(getDb(), "invites", code));
    if (!existing.exists()) return code;
  }
  throw new Error("No se pudo generar un código de invitación libre.");
}

export async function createCampaign(
  name: string,
  description: string,
  dmUid: string,
  dmName: string
): Promise<string> {
  const inviteCode = await reserveInviteCode();
  const campaign: Omit<Campaign, "id"> = {
    name,
    description,
    dmUid,
    dmName,
    inviteCode,
    memberUids: [dmUid],
    createdAt: Date.now(),
  };
  const ref = await addDoc(collection(getDb(), "campaigns"), campaign);
  // El código se resuelve en /invites: así las campañas solo las leen sus miembros
  await setDoc(doc(getDb(), "invites", inviteCode), { campaignId: ref.id });
  return ref.id;
}

/**
 * Garantiza que el código de la campaña existe en /invites. Migración para
 * campañas creadas antes de endurecer las reglas de lectura; la llama el
 * máster al abrir su campaña.
 */
export async function ensureCampaignInvite(campaign: Campaign): Promise<void> {
  try {
    await setDoc(
      doc(getDb(), "invites", campaign.inviteCode),
      { campaignId: campaign.id },
      { merge: true }
    );
  } catch {
    // Sin permisos (no es el DM) o sin red: el código ya existente sigue valiendo
  }
}

export async function joinCampaignByCode(code: string, uid: string): Promise<Campaign> {
  const normalized = code.trim().toUpperCase();
  const invite = await getDoc(doc(getDb(), "invites", normalized));
  if (!invite.exists()) {
    throw new Error(
      "No existe ninguna campaña con ese código. Si la campaña es antigua, pide al máster que la abra una vez para reactivar su código."
    );
  }
  const campaignId = (invite.data() as { campaignId: string }).campaignId;
  const campaignRef = doc(getDb(), "campaigns", campaignId);
  // Unirse solo añade tu uid; las reglas permiten esta escritura sin ser miembro
  await updateDoc(campaignRef, { memberUids: arrayUnion(uid) });
  const snapshot = await getDoc(campaignRef);
  if (!snapshot.exists()) {
    throw new Error("Esa campaña ya no existe.");
  }
  return { id: snapshot.id, ...snapshot.data() } as Campaign;
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

export async function deleteCampaign(id: string, inviteCode?: string): Promise<void> {
  // El código de invitación se retira antes que la campaña (las reglas del
  // invite comprueban que quien borra es el DM de la campaña referida)
  if (inviteCode) {
    try {
      await deleteDoc(doc(getDb(), "invites", inviteCode));
    } catch {
      // El invite puede no existir en campañas antiguas
    }
  }
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
  const entry: BoardLogEntry = {
    id: crypto.randomUUID(),
    text: text.slice(0, 500),
    timestamp: Date.now(),
  };
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

/**
 * Añade una entrada al registro leyendo antes el estado actual. Para
 * componentes sin suscripción a la campaña (p. ej. el tirador de dados).
 */
export async function appendBoardLogById(campaignId: string, text: string): Promise<void> {
  const ref = doc(getDb(), "campaigns", campaignId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) return;
  const current = (snapshot.data().boardLog ?? []) as BoardLogEntry[];
  const entry: BoardLogEntry = {
    id: crypto.randomUUID(),
    text: text.slice(0, 500),
    timestamp: Date.now(),
  };
  await updateDoc(ref, { boardLog: [entry, ...current].slice(0, MAX_BOARD_LOG) });
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

/** Guarda los presets de encuentro del máster. */
export async function setCampaignPresets(
  campaignId: string,
  presets: EncounterPreset[]
): Promise<void> {
  await updateDoc(doc(getDb(), "campaigns", campaignId), { presets });
}

/** Cambia la ambientación visual del tablero sin tocar fichas ni mapa. */
export async function setBoardTheme(campaignId: string, theme: string): Promise<void> {
  await updateDoc(doc(getDb(), "campaigns", campaignId), { "board.theme": theme });
}

/** Actualiza el conjunto de puertas abiertas del tablero. */
export async function setCampaignDoors(
  campaignId: string,
  openDoors: string[]
): Promise<void> {
  await updateDoc(doc(getDb(), "campaigns", campaignId), { openDoors });
}

// ---------- Handouts (subcolección de la campaña) ----------

/**
 * Handouts de la campaña. El máster los ve todos; los jugadores solo los
 * revelados (la consulta filtra por `revealed` para cumplir las reglas).
 */
export function subscribeHandouts(
  campaignId: string,
  isDM: boolean,
  callback: (handouts: Handout[]) => void
): Unsubscribe {
  const ref = collection(getDb(), "campaigns", campaignId, "handouts");
  const q = isDM ? query(ref) : query(ref, where("revealed", "==", true));
  return onSnapshot(q, (snapshot) => {
    const handouts = snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Handout)
      .sort((a, b) => b.createdAt - a.createdAt);
    callback(handouts);
  });
}

export async function addHandout(
  campaignId: string,
  title: string,
  image: string
): Promise<void> {
  await addDoc(collection(getDb(), "campaigns", campaignId, "handouts"), {
    title: title.slice(0, 100),
    image,
    revealed: false,
    createdAt: Date.now(),
  });
}

export async function setHandoutRevealed(
  campaignId: string,
  handoutId: string,
  revealed: boolean
): Promise<void> {
  await updateDoc(doc(getDb(), "campaigns", campaignId, "handouts", handoutId), {
    revealed,
  });
}

export async function deleteHandout(campaignId: string, handoutId: string): Promise<void> {
  await deleteDoc(doc(getDb(), "campaigns", campaignId, "handouts", handoutId));
}

/** Añade una entrada al diario de campaña (solo el máster). */
export async function addJournalEntry(
  campaignId: string,
  current: JournalEntry[],
  text: string
): Promise<void> {
  const entry: JournalEntry = {
    id: crypto.randomUUID(),
    text: text.slice(0, 5000),
    timestamp: Date.now(),
  };
  await updateDoc(doc(getDb(), "campaigns", campaignId), {
    journal: [entry, ...current],
  });
}

/** Elimina una entrada del diario de campaña. */
export async function removeJournalEntry(
  campaignId: string,
  current: JournalEntry[],
  entryId: string
): Promise<void> {
  await updateDoc(doc(getDb(), "campaigns", campaignId), {
    journal: current.filter((entry) => entry.id !== entryId),
  });
}

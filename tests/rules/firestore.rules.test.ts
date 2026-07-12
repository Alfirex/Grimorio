import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

/**
 * Tests de las reglas de seguridad contra el emulador de Firestore.
 * Ejecutar con `npm run test:rules` (levanta el emulador y los envuelve).
 */

let env: RulesTestEnvironment;

const DM_UID = "dm-uid";
const PLAYER_UID = "player-uid";
const STRANGER_UID = "stranger-uid";

const CAMPAIGN_ID = "campaign-1";
const OTHER_CAMPAIGN_ID = "campaign-2";
const CHARACTER_ID = "character-1";
const INVITE_CODE = "ABC123";

const dmDb = () => env.authenticatedContext(DM_UID).firestore();
const playerDb = () => env.authenticatedContext(PLAYER_UID).firestore();
const strangerDb = () => env.authenticatedContext(STRANGER_UID).firestore();

/** Estado base: una campaña del DM con un jugador, su personaje y su invite. */
async function seed() {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "campaigns", CAMPAIGN_ID), {
      name: "La cripta",
      description: "",
      dmUid: DM_UID,
      dmName: "Máster",
      inviteCode: INVITE_CODE,
      memberUids: [DM_UID, PLAYER_UID],
      createdAt: 1,
      boardLog: [],
      journal: [],
    });
    await setDoc(doc(db, "invites", INVITE_CODE), { campaignId: CAMPAIGN_ID });
    await setDoc(doc(db, "characters", CHARACTER_ID), {
      ownerUid: PLAYER_UID,
      ownerName: "Jugadora",
      campaignId: CAMPAIGN_ID,
      name: "Elora",
      xp: 100,
      updatedAt: 1,
    });
    await setDoc(doc(db, "characters", CHARACTER_ID, "notes", "note-private"), {
      authorUid: DM_UID,
      authorName: "Máster",
      text: "secreto",
      visibility: "dm",
      createdAt: 1,
    });
    await setDoc(doc(db, "characters", CHARACTER_ID, "notes", "note-shared"), {
      authorUid: DM_UID,
      authorName: "Máster",
      text: "visible",
      visibility: "shared",
      createdAt: 1,
    });
    await setDoc(doc(db, "campaigns", CAMPAIGN_ID, "handouts", "handout-hidden"), {
      title: "Aún no",
      image: "data:image/jpeg;base64,xxx",
      revealed: false,
      createdAt: 1,
    });
    await setDoc(doc(db, "campaigns", CAMPAIGN_ID, "handouts", "handout-shown"), {
      title: "El mapa",
      image: "data:image/jpeg;base64,yyy",
      revealed: true,
      createdAt: 2,
    });
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-grimorio",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
  await seed();
});

afterAll(async () => {
  await env.cleanup();
});

describe("campañas", () => {
  it("las leen sus miembros y su máster, nunca extraños", async () => {
    await assertSucceeds(getDoc(doc(dmDb(), "campaigns", CAMPAIGN_ID)));
    await assertSucceeds(getDoc(doc(playerDb(), "campaigns", CAMPAIGN_ID)));
    await assertFails(getDoc(doc(strangerDb(), "campaigns", CAMPAIGN_ID)));
  });

  it("crear exige declararse DM y miembro de la propia campaña", async () => {
    await assertSucceeds(
      setDoc(doc(strangerDb(), "campaigns", "nueva"), {
        name: "Mía",
        dmUid: STRANGER_UID,
        memberUids: [STRANGER_UID],
      })
    );
    await assertFails(
      setDoc(doc(strangerDb(), "campaigns", "suplantada"), {
        name: "Trampa",
        dmUid: DM_UID,
        memberUids: [STRANGER_UID],
      })
    );
  });

  it("un miembro toca el tablero pero no el diario ni el encuentro", async () => {
    await assertSucceeds(
      updateDoc(doc(playerDb(), "campaigns", CAMPAIGN_ID), {
        boardLog: [{ id: "1", text: "hola", timestamp: 1 }],
      })
    );
    await assertSucceeds(
      updateDoc(doc(playerDb(), "campaigns", CAMPAIGN_ID), { openDoors: ["3,4"] })
    );
    await assertFails(
      updateDoc(doc(playerDb(), "campaigns", CAMPAIGN_ID), {
        journal: [{ id: "1", text: "no puedo", timestamp: 1 }],
      })
    );
    await assertFails(
      updateDoc(doc(playerDb(), "campaigns", CAMPAIGN_ID), {
        encounter: { combatants: [], turnIndex: 0, round: 1 },
      })
    );
  });

  it("un miembro no puede inflar el registro más allá del tope", async () => {
    const huge = Array.from({ length: 61 }, (_, i) => ({
      id: String(i),
      text: "spam",
      timestamp: i,
    }));
    await assertFails(
      updateDoc(doc(playerDb(), "campaigns", CAMPAIGN_ID), { boardLog: huge })
    );
  });

  it("cualquiera puede añadirse a sí mismo, pero no expulsar a otros", async () => {
    await assertSucceeds(
      updateDoc(doc(strangerDb(), "campaigns", CAMPAIGN_ID), {
        memberUids: [DM_UID, PLAYER_UID, STRANGER_UID],
      })
    );
    await assertFails(
      updateDoc(doc(strangerDb(), "campaigns", CAMPAIGN_ID), {
        memberUids: [STRANGER_UID],
      })
    );
  });

  it("solo el máster borra la campaña", async () => {
    await assertFails(deleteDoc(doc(playerDb(), "campaigns", CAMPAIGN_ID)));
    await assertSucceeds(deleteDoc(doc(dmDb(), "campaigns", CAMPAIGN_ID)));
  });
});

describe("invitaciones", () => {
  it("cualquier usuario resuelve un código, pero no puede listarlos", async () => {
    await assertSucceeds(getDoc(doc(strangerDb(), "invites", INVITE_CODE)));
    await assertFails(getDocs(collection(strangerDb(), "invites")));
  });

  it("nadie puede secuestrar el código de otra campaña", async () => {
    // El atacante crea su propia campaña legítimamente…
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "campaigns", OTHER_CAMPAIGN_ID), {
        name: "Del atacante",
        dmUid: STRANGER_UID,
        memberUids: [STRANGER_UID],
        inviteCode: "ZZZ999",
        createdAt: 1,
      });
    });
    // …pero no puede repuntar el código del DM hacia la suya
    await assertFails(
      setDoc(doc(strangerDb(), "invites", INVITE_CODE), {
        campaignId: OTHER_CAMPAIGN_ID,
      })
    );
    // Ni publicar códigos para campañas que no dirige
    await assertFails(
      setDoc(doc(strangerDb(), "invites", "NUEVO1"), { campaignId: CAMPAIGN_ID })
    );
    // El máster legítimo sí puede republicar el suyo
    await assertSucceeds(
      setDoc(doc(dmDb(), "invites", INVITE_CODE), { campaignId: CAMPAIGN_ID })
    );
  });
});

describe("personajes", () => {
  it("los lee el dueño y su mesa, no extraños", async () => {
    await assertSucceeds(getDoc(doc(playerDb(), "characters", CHARACTER_ID)));
    await assertSucceeds(getDoc(doc(dmDb(), "characters", CHARACTER_ID)));
    await assertFails(getDoc(doc(strangerDb(), "characters", CHARACTER_ID)));
  });

  it("no se puede crear un personaje a nombre de otro", async () => {
    await assertFails(
      setDoc(doc(strangerDb(), "characters", "falso"), {
        ownerUid: PLAYER_UID,
        name: "Suplantado",
      })
    );
  });

  it("el máster puede editar; un compañero solo sumar PX con tope", async () => {
    await assertSucceeds(
      updateDoc(doc(dmDb(), "characters", CHARACTER_ID), { currentHp: 5, updatedAt: 2 })
    );
    // El DM también es miembro; simulamos a un compañero de mesa
    await env.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), "campaigns", CAMPAIGN_ID), {
        memberUids: [DM_UID, PLAYER_UID, STRANGER_UID],
      });
    });
    await assertSucceeds(
      updateDoc(doc(strangerDb(), "characters", CHARACTER_ID), { xp: 400, updatedAt: 2 })
    );
    await assertFails(
      updateDoc(doc(strangerDb(), "characters", CHARACTER_ID), { xp: 50, updatedAt: 2 })
    );
    await assertFails(
      updateDoc(doc(strangerDb(), "characters", CHARACTER_ID), {
        xp: 999_999,
        updatedAt: 2,
      })
    );
    await assertFails(
      updateDoc(doc(strangerDb(), "characters", CHARACTER_ID), {
        name: "Vandalizado",
        updatedAt: 2,
      })
    );
  });

  it("solo el dueño borra su personaje", async () => {
    await assertFails(deleteDoc(doc(dmDb(), "characters", CHARACTER_ID)));
    await assertSucceeds(deleteDoc(doc(playerDb(), "characters", CHARACTER_ID)));
  });
});

describe("notas del máster", () => {
  it("el dueño solo lee las compartidas; el máster todas", async () => {
    await assertSucceeds(
      getDoc(doc(playerDb(), "characters", CHARACTER_ID, "notes", "note-shared"))
    );
    await assertFails(
      getDoc(doc(playerDb(), "characters", CHARACTER_ID, "notes", "note-private"))
    );
    await assertSucceeds(
      getDoc(doc(dmDb(), "characters", CHARACTER_ID, "notes", "note-private"))
    );
    await assertFails(
      getDoc(doc(strangerDb(), "characters", CHARACTER_ID, "notes", "note-shared"))
    );
  });

  it("solo el máster escribe notas", async () => {
    await assertSucceeds(
      setDoc(doc(dmDb(), "characters", CHARACTER_ID, "notes", "nueva"), {
        authorUid: DM_UID,
        authorName: "Máster",
        text: "apunte",
        visibility: "dm",
        createdAt: 2,
      })
    );
    await assertFails(
      setDoc(doc(playerDb(), "characters", CHARACTER_ID, "notes", "intrusa"), {
        authorUid: PLAYER_UID,
        authorName: "Jugadora",
        text: "me pongo ventaja",
        visibility: "shared",
        createdAt: 2,
      })
    );
  });
});

describe("láminas (handouts)", () => {
  it("un jugador solo lee las reveladas (consultando con el filtro)", async () => {
    await assertSucceeds(
      getDoc(doc(playerDb(), "campaigns", CAMPAIGN_ID, "handouts", "handout-shown"))
    );
    await assertFails(
      getDoc(doc(playerDb(), "campaigns", CAMPAIGN_ID, "handouts", "handout-hidden"))
    );
    await assertSucceeds(
      getDocs(
        query(
          collection(playerDb(), "campaigns", CAMPAIGN_ID, "handouts"),
          where("revealed", "==", true)
        )
      )
    );
    // Sin el filtro, la consulta podría devolver ocultas: denegada
    await assertFails(
      getDocs(collection(playerDb(), "campaigns", CAMPAIGN_ID, "handouts"))
    );
  });

  it("solo el máster gestiona las láminas", async () => {
    await assertSucceeds(
      updateDoc(doc(dmDb(), "campaigns", CAMPAIGN_ID, "handouts", "handout-hidden"), {
        revealed: true,
      })
    );
    await assertFails(
      updateDoc(doc(playerDb(), "campaigns", CAMPAIGN_ID, "handouts", "handout-hidden"), {
        revealed: true,
      })
    );
    await assertFails(
      deleteDoc(doc(strangerDb(), "campaigns", CAMPAIGN_ID, "handouts", "handout-shown"))
    );
  });
});

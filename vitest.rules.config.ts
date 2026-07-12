import { defineConfig } from "vitest/config";

// Tests de las reglas de Firestore: se ejecutan contra el emulador con
// `npm run test:rules` (firebase emulators:exec los envuelve).
export default defineConfig({
  test: {
    include: ["tests/rules/**/*.test.ts"],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    // Un único worker: todos los tests comparten el emulador
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});

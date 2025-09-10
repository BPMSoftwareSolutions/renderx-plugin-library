import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["__tests__/**/*.{spec,test}.{ts,tsx}", "__tests__/*.{spec,test}.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["../../tests/setup.sdk-bridge.ts"],
  },
});


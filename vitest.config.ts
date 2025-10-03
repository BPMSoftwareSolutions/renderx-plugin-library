import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["__tests__/**/*.{spec,test}.{ts,tsx}", "__tests__/*.{spec,test}.{ts,tsx}"],
    environment: "jsdom",
    testTimeout: 10000, // 10 second timeout per test
    hookTimeout: 10000, // 10 second timeout for hooks
  },
});


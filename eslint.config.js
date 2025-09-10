import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["dist/**", "build/**", "node_modules/**"],
  },
  // Source files (strict plugin guardrails)
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // Forbid repo-relative imports or json-components direct access
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "**/json-components/**",
            "../../json-components/**",
            "../../../json-components/**",
            "/json-components/**",
            "../json-components/**",
          ],
          paths: [
            {
              name: "json-components",
              message:
                "Do not import repo internals. Use Host SDK inventory instead.",
            },
          ],
        },
      ],

      // Block direct DOM access in plugin code (stage-crew & symphonies are exceptions)
      "no-restricted-globals": [
        "error",
        "document",
        "window",
        "navigator",
        "localStorage",
      ],

      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Tests (use TS parser; relax plugin boundary & globals in tests)
  {
    files: ["__tests__/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-restricted-globals": "off",
      // Ensure // eslint-disable-next-line no-var in TS global decls is considered used
      "no-var": "error",
    },
  },
  // Relax global restrictions for symphony files which may need to detect global/window
  {
    files: ["src/**/*.symphony.ts", "src/**/*.symphony.tsx"],
    rules: {
      "no-restricted-globals": "off",
    },
  },
];


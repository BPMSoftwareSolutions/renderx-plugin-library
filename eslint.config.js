import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import noHostInternals from "../../eslint-rules/no-host-internals-in-plugins.js";
import noCrossPluginImports from "../../eslint-rules/no-cross-plugin-imports.js";

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
      "no-host-internals-in-plugins": noHostInternals,
      "cross-plugin-imports": noCrossPluginImports,
    },
    rules: {
      // Core plugin boundary guards
      "no-host-internals-in-plugins/no-host-internals-in-plugins": "error",
      "cross-plugin-imports/no-cross-plugin-imports": "error",

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
      "no-host-internals-in-plugins/no-host-internals-in-plugins": "off",
      "cross-plugin-imports/no-cross-plugin-imports": "off",
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


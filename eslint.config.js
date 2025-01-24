import js from "@eslint/js";
import importPlugin, { rules as importEslint } from "eslint-plugin-import";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import unusedPlugin from "eslint-plugin-unused-imports";
import globals from "globals";
import tsEslint from "typescript-eslint";

/** @type {import('eslint').Linter.ConfigOverride[]} */
export default [
  { ignores: ["dist", "node_modules"] },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
    },
    plugins: {
      react,
      import: importPlugin,
      "unused-imports": unusedPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...importEslint.rules,
      "unused-imports/no-unused-imports": "error",
      "import/named": "off",
      "import/namespace": "error",
      "import/default": "error",
      "import/export": "error",
      "import/no-unresolved": "error",
      "react/jsx-no-target-blank": "off",
    },
  },
  ...tsEslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ...reactHooks.configs.recommended,
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "react/no-unknown-property": ["error", { ignore: ["css"] }],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: true,
        },
      ],
    },
  },
];

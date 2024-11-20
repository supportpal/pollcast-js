import eslint from "@eslint/js";
import globals from "globals";
import tseslint from 'typescript-eslint';
import jest from "eslint-plugin-jest";
import stylisticJs from '@stylistic/eslint-plugin-js'
import stylisticTs from '@stylistic/eslint-plugin-ts'
import {includeIgnoreFile} from "@eslint/compat";
import path from "node:path";
import {fileURLToPath} from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["src/**/*.js", "src/**/*.ts",],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 12,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...jest.environments.globals.globals,
      }
    },
    plugins: {
      jest: jest,
      '@typescript-eslint': tseslint.plugin,
      '@stylistic/js': stylisticJs,
      '@stylistic/ts': stylisticTs
    },
    rules: {
      indent: 'off',
      "@typescript-eslint/no-explicit-any": "off",
      '@typescript-eslint/no-this-alias': 'warn',
      '@typescript-eslint/no-unsafe-function-type': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@stylistic/ts/indent': ['error', 2]
    },
  },
  {
    // enable jest rules on test files
    files: ['**/*.test.ts'],
    extends: [jest.configs['flat/recommended']],
    rules: {
      'jest/no-done-callback': 'warn',
    }
  },
  {
    files: ['*.config.js', '*.config.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      }
    }
  }
);

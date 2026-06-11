import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-deploy/**",
    ".next-release/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Project specific ignores:
    "node_modules/**",
    "cpanel-deploy/**",
    "test-v4-extract/**",
    "test-v3-extract/**",
    "scripts/**",
    "*.js",
    "src/components/minigame/TetrisGame.tsx",
    "src/components/admin/RichTextEditor.tsx",
    "src/components/ui/SafeEmail.tsx"
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/purity": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/static-components": "off",
      "react/no-unescaped-entities": "off",
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-require-imports": "off"
    }
  }
]);

export default eslintConfig;

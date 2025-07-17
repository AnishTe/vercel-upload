import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Extending base configurations
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Custom rules configuration
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "react/no-unescaped-entities": "off",

      // Allow unused variables starting with "_" (e.g., `_unusedVar`)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Disable missing dependency warnings for useEffect (if intended)
      // Enable "warn" instead of "off" for better development practices
      "react-hooks/exhaustive-deps": "warn",

      // Disable or warn about explicit `any` usage
      "@typescript-eslint/no-explicit-any": "off", // You can change this to "warn" for better debugging
      "@typescript-eslint/no-unused-vars": "off", // You can change this to "warn" for better debugging
    },
  },
];

export default eslintConfig;

import js from "@eslint/js";
import next from "eslint-config-next";

export default [
  js.configs.recommended,

  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {},
    rules: {
      // your custom rules (optional)
    },
  },

  // ✅ Next.js core web vitals (FLAT CONFIG SAFE)
  next.configs["core-web-vitals"],
];

import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": resolve(__dirname, "./src") },
  },
  // Las pruebas son de lógica pura: no hace falta procesar el CSS de Tailwind.
  css: { postcss: { plugins: [] } },
});

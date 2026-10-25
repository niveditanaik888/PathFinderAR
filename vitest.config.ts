import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "frontend", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["backend/**/*.test.ts", "backend/**/*.spec.ts", "shared/**/*.test.ts", "shared/**/*.spec.ts", "frontend/**/*.test.ts", "frontend/**/*.test.tsx"],
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "outputs/ghl-letter-studio",
    emptyOutDir: true,
    sourcemap: true,
  },
});

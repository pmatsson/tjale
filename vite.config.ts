import { defineConfig } from "vite";

export default defineConfig({
  base: "/tjale/",
  build: {
    chunkSizeWarningLimit: 1500,
  },
});

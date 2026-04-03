import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "node24",

    license: true,
    minify: true,
    sourcemap: true,
    ssr: true,

    lib: {
      formats: ["es"],
      entry: {
        restore: "src/restore.ts",
        save: "src/save.ts"
      }
    }
  },

  ssr: {
    noExternal: true
  }
});

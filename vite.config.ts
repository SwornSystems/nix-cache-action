import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "**/.direnv/**"],
    coverage: {
      provider: "v8"
    }
  },

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

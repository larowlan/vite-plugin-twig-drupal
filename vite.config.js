import { defineConfig } from "vite"
import twig from "./src/index.js"
import { join, resolve } from "node:path"

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: {
        test: resolve(__dirname, "tests/fixtures/mockup.twig"),
        error: resolve(__dirname, "tests/fixtures/error.twig"),
      },
      name: "vite-plugin-twig-drupal",
      fileName: (_, entry) => `${entry}.js`,
    },
  },
  plugins: [
    twig({
      namespaces: {
        tests: join(__dirname, "/tests/fixtures"),
      },
    }),
  ],
  resolve: {
    preserveSymlinks: true,
  },
})

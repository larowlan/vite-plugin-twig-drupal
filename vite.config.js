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
        menu: resolve(__dirname, "tests/fixtures/menu.twig"),
        errorInclude: resolve(__dirname, "tests/fixtures/error-include.twig"),
        drupalFunctions: resolve(
          __dirname,
          "tests/fixtures/drupal-functions.twig"
        ),
      },
      name: "vite-plugin-twig-drupal",
      fileName: (_, entry) => `${entry}.js`,
    },
  },
  plugins: [
    twig({
      globalContext: {
        active_theme: "poodles",
      },
      functions: {
        testFunction: (instance) =>
          instance.extendFunction("testFunction", () => "IT WORKS!"),
      },
      namespaces: {
        tests: join(__dirname, "/tests/fixtures"),
        jabba: join(__dirname, "/tests/fixtures/jabba"),
      },
    }),
  ],
  resolve: {
    preserveSymlinks: true,
  },
})

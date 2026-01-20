import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  minify: false,
  treeshake: true,
  sourcemap: true,
  external: ['vite', 'react', 'react-dom', 'esbuild']
});

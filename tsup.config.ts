import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  outDir: "dist",
  dts: true,
  target: "es2021",
  platform: "node",
  splitting: true,
  sourcemap: true,
  cjsInterop: true,
  clean: true,
});

import glob from "fast-glob";
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: { alias: { src: resolve("src/") } },
  build: {
    lib: {
      entry: glob.sync("src/main.ts", { ignore: ["**/*.spec.ts"] }), // Exclude .spec.ts files
      name: "@lamlv/interact",
      formats: ["es", "cjs"], // Generate both ES and CommonJS formats
      fileName: (format) => `interact.${format}.js`,
    },
    rollupOptions: {
      external: ["@solana/spl-token", "@solana/web3.js", "ethers", "bignumber.js"], // Exclude vite.config.ts from the build
    },
  },
  plugins: [
    dts({
      entryRoot: "src", // Specify the root directory for TypeScript files
      outDir: "dist", // Output directory for the declaration file
      copyDtsFiles: true,
    }),
  ],
});

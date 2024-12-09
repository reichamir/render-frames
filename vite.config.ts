import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { pluginCORPHeaders } from "./vitePluginCorpHeader";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), pluginCORPHeaders()],
  assetsInclude: ["**/*.wasm"], // Include .wasm files as assets
});

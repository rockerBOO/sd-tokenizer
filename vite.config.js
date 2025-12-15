import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), wasm(), topLevelAwait()],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./assets/js", import.meta.url)),
		},
	},

  worker: {
		format: "es",
  }
});

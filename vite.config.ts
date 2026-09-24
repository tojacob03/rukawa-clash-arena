import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { feedsPlugin } from "./vite-plugins/feeds";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    feedsPlugin(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      // Two entry points: the portfolio and Waza Arc (/arc/), a separate
      // app with its own bundle, styles and head. See docs/waza-arc/.
      input: {
        main: path.resolve(__dirname, "index.html"),
        arc: path.resolve(__dirname, "arc/index.html"),
      },
    },
  },
}));

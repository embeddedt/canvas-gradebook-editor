import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import run from "vite-plugin-run";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    command === "serve" && run([
      {
        name: "cors-proxy",
        run: ["node", "server.js"],
      },
    ]),
    react()
  ].filter(Boolean),
}));

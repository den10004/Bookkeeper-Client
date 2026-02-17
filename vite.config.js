import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // Все запросы на /auth → проксируем на бэкенд (порт 3000)
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false, // если используешь https в dev — редко нужно
      },

      //   "/api": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
});

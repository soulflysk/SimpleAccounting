import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// dev: เรียก /api/... แล้ว proxy ไป .NET API (แก้พอร์ตให้ตรงกับ backend ได้)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});

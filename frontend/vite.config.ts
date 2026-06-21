import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "favicon.png", "logo.png", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "电子设计协会访客管理系统",
        short_name: "EDA Visitor",
        description: "电子设计协会访客登记与管理系统",
        theme_color: "#409EFF",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],

  server: {
    host: "0.0.0.0",
    port: 5173,
    watch: {
      ignored: ["**/src-tauri/**", "**/target/**"],
    },
  },
});

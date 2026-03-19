import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            // Cache map tiles (offline map support)
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/,
            handler: "CacheFirst",
            options: {
              cacheName: "map-tiles",
              expiration: {
                maxEntries: 5000,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Cache API data with network-first
            urlPattern: /\/api\/(groups|meeting-points|qr)/,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-data",
              expiration: { maxAgeSeconds: 24 * 60 * 60 },
              networkTimeoutSeconds: 3,
            },
          },
        ],
      },
      manifest: {
        name: "Stay Connected - Kumbh Mela",
        short_name: "StayConnected",
        description: "Never lose your group at Kumbh Mela. Real-time location sharing for pilgrim safety.",
        theme_color: "#FF6B00",
        background_color: "#FFFFFF",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (id.includes("leaflet") || id.includes("react-leaflet")) {
            return "vendor-map";
          }

          if (id.includes("html5-qrcode") || id.includes("qrcode")) {
            return "vendor-qr";
          }

          if (
            id.includes("react") ||
            id.includes("react-dom") ||
            id.includes("react-router-dom")
          ) {
            return "vendor-react";
          }

          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "vendor-i18n";
          }
        },
      },
    },
  },
});

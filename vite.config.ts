
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  optimizeDeps: {
    exclude: [
      '@hookform/resolvers/zod',
      'react-hook-form',
      'zod',
      'drizzle-orm/pg-core',
      'drizzle-zod',
      '@radix-ui/react-accordion',
      '@radix-ui/react-separator',
      '@radix-ui/react-checkbox'
    ]
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    hmr: {
      port: 5000,
      protocol: 'ws',
      host: '0.0.0.0',
      clientPort: 443
    },
    proxy: {
      '/api': 'http://0.0.0.0:5000',
    },
  },
});

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    //runtimeErrorOverlay(),  Removed as per edited code.  themePlugin() also removed.
    // ...(process.env.NODE_ENV !== "production" &&
    // process.env.REPL_ID !== undefined
    //   ? [
    //       await import("@replit/vite-plugin-cartographer").then((m) =>
    //         m.cartographer(),
    //       ),
    //     ]
    //   : []),  Removed as per edited code.
  ],
  optimizeDeps: {
    exclude: [
      'react-beautiful-dnd',
      '@radix-ui/react-slider',
      'drizzle-zod'
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      "@shared": path.resolve(__dirname, "shared"), //Retained from original
      "@assets": path.resolve(__dirname, "attached_assets"), //Retained from original
    },
  },
  root: path.resolve(__dirname, "client"), //Retained from original
  build: {
    outDir: path.resolve(__dirname, "dist/public"), //Retained from original
    emptyOutDir: true, //Retained from original
  },
  server: {
    host: '0.0.0.0', //Retained from original
    hmr: {
      clientPort: 443, //Retained from original
      protocol: 'wss' //Retained from original
    },
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:5000',
        changeOrigin: true,
      },
    },
  },
})
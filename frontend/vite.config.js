import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true, // Optional: Treat SVG as icons
      },
    }),
  ],
  server: {
    port: 5173
  }
});

import { defineConfig } from 'vite';

export default defineConfig({
  base: '/controller/',
  server: {
    host: true,
    port: 3003,
    // Enable HTTPS for gyroscope API (required on mobile)
    // For local dev, you can use mkcert to generate certificates
    // https: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

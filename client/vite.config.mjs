import { defineConfig } from 'vite';
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:4002',
      '/socket.io': { target: 'http://localhost:4002', ws: true }
    }
  }
});

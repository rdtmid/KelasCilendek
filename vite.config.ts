import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, '.', '');
  
  return {
    plugins: [react()],
    define: {
      // By default, Vite doesn't define process.env in the browser.
      // We need to define it to avoid "ReferenceError: process is not defined" crash.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env': {} 
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      host: true
    }
  };
});
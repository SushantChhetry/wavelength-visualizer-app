import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    host: true, // Listen on all addresses (0.0.0.0) for Docker
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    watch: {
      usePolling: true, // Enable polling for Docker volume mounts
    },
    hmr: {
      clientPort: 3000, // Important for Docker networking
    },
  },
  preview: {
    host: true, // Listen on all addresses (0.0.0.0)
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  optimizeDeps: {
    include: ['three', 'react', 'react-dom'],
    esbuildOptions: {
      target: 'es2020'
    }
  },
})

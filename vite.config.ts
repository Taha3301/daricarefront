import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/daricarefront/',
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'https://daricareback.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/uploads': {
        target: 'https://daricareback.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'https://daricareback.onrender.com',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
})
